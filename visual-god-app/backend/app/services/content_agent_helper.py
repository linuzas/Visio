# File: visual-god-app/backend/app/services/content_agent_helper.py

import os
import base64
import json
import tempfile
from typing import List, Dict, Any, Optional
from openai import OpenAI
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from langchain_openai import ChatOpenAI
import uuid
import httpx
from PIL import Image
import io

# 🎯 SIZE MAPPING for your requirements
SIZE_MAPPING = {
    "instagram": "1080x1920",  # Instagram Reels (9:16)
    "facebook": "1080x1080",   # Facebook Photo Ad (1:1)
    "youtube": "2560x1440"     # YouTube Banner (16:9)
}

# === ENHANCED STATE FOR PRODUCT-ONLY PROCESSING ===
class AgentState(TypedDict):
    messages: Annotated[List[Any], lambda l, r: l + r]
    current_step: Optional[str]
    products_scanned: Optional[List[dict]]
    edit_prompts: Optional[List[str]]
    prompt_image_pairs: Optional[List[dict]]
    session_id: Optional[str]
    generated_images: Optional[List[dict]]
    generate_images_flag: Optional[bool]
    image_data_list: Optional[List[dict]]
    image_size: Optional[str]
    validation_results: Optional[List[dict]]  # NEW: Store validation results

# === UTILS ===
def get_llm():
    return ChatOpenAI(temperature=0.7, model="gpt-4o")

def get_openai_client():
    """Create OpenAI client with extended timeout for Railway deployment"""
    return OpenAI(
        api_key=os.environ.get('OPENAI_API_KEY'),
        timeout=180.0,
        max_retries=1
    )

def resize_image_to_target(image_base64: str, target_size: str) -> str:
    """Resize image to target dimensions while maintaining quality"""
    try:
        width, height = map(int, target_size.split('x'))
        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        original_ratio = image.width / image.height
        target_ratio = width / height

        if original_ratio > target_ratio:
            new_height = height
            new_width = int(height * original_ratio)
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            left = (new_width - width) // 2
            image = image.crop((left, 0, left + width, height))
        else:
            new_width = width
            new_height = int(width / original_ratio)
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            top = (new_height - height) // 2
            image = image.crop((0, top, width, top + height))

        image = image.resize((width, height), Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=95, optimize=True)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    except Exception as e:
        print(f"❌ Error resizing image: {e}")
        return image_base64

# === NEW: VALIDATE AND CATEGORIZE IMAGES ===
def validate_and_categorize_images(state: AgentState) -> AgentState:
    """Validate and categorize uploaded images before processing"""
    print("🔄 Executing validate_and_categorize_images…")
    image_data_list = state.get("image_data_list", [])
    
    if not image_data_list:
        return {
            **state,
            "current_step": "no_images",
            "validation_results": [],
            "messages": state.get("messages", []) + [
                AIMessage(content="❌ No images provided")
            ]
        }

    client = get_openai_client()
    validation_results = []

    try:
        print(f"   Validating and categorizing {len(image_data_list)} images…")
        
        for i, img_data in enumerate(image_data_list):
            print(f"   Processing image {i+1}/{len(image_data_list)}…")
            
            # Enhanced validation prompt
            response = client.chat.completions.create(
                model="gpt-4o",
                temperature=0,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": """
Analyze this image and provide a JSON response with the following structure:
{
    "is_product": true/false,
    "category": "product" or "person" or "scene" or "other",
    "confidence": 0.0-1.0,
    "description": "Brief description of what you see",
    "product_name": "Name if it's a product, null otherwise",
    "product_type": "Category if it's a product, null otherwise",
    "rejection_reason": "Why rejected if not a product, null otherwise"
}

Only accept clear photos of physical products (food, cosmetics, electronics, clothing, etc.). 
Reject people, avatars, scenes, text screenshots, or unclear images.
                        """},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_data['base64']}"}}
                    ]
                }]
            )
            
            try:
                content = response.choices[0].message.content.strip()
                start = content.find("{")
                end = content.rfind("}") + 1
                validation_data = json.loads(content[start:end])
                
                # Add original image data
                validation_data["original_image"] = img_data
                validation_data["index"] = i
                
                validation_results.append(validation_data)
                
                print(f"   ✅ Image {i+1} analyzed: {validation_data['category']} - {validation_data['description'][:50]}...")
                
            except Exception as e:
                print(f"   ❌ Failed to parse validation for image {i+1}: {e}")
                validation_results.append({
                    "is_product": False,
                    "category": "error",
                    "confidence": 0.0,
                    "description": "Failed to analyze image",
                    "product_name": None,
                    "product_type": None,
                    "rejection_reason": "Analysis failed",
                    "original_image": img_data,
                    "index": i
                })

        print(f"✅ Validation complete: {len(validation_results)} images analyzed")
        
        return {
            **state,
            "validation_results": validation_results,
            "current_step": "images_validated",
            "messages": state.get("messages", []) + [
                AIMessage(content=f"🔍 Analyzed {len(validation_results)} images")
            ]
        }

    except Exception as e:
        print(f"   OpenAI API error: {e}")
        return {
            **state,
            "current_step": "validation_failed",
            "validation_results": [],
            "messages": state.get("messages", []) + [
                AIMessage(content=f"❌ Validation failed: {e}")
            ]
        }

# === FILTER VALID PRODUCTS ===
def filter_valid_products(state: AgentState) -> AgentState:
    """Filter and prepare valid products for processing"""
    print("🔄 Executing filter_valid_products…")
    validation_results = state.get("validation_results", [])
    
    if not validation_results:
        return {
            **state,
            "current_step": "no_validation_results",
            "messages": state.get("messages", []) + [
                AIMessage(content="❌ No validation results found")
            ]
        }

    # Filter valid products (confidence > 0.7 and is_product = True)
    valid_products = [
        result for result in validation_results 
        if result.get("is_product", False) and result.get("confidence", 0) > 0.7
    ]
    
    if not valid_products:
        print("   ❌ No valid products found")
        return {
            **state,
            "current_step": "no_valid_products",
            "messages": state.get("messages", []) + [
                AIMessage(content="❌ No valid product images found. Please upload clear photos of physical products only.")
            ]
        }

    # Convert to the format expected by downstream processing
    products_scanned = []
    valid_image_data = []
    
    for result in valid_products:
        product_data = {
            "product_name": result.get("product_name", "Unknown Product"),
            "product_type": result.get("product_type", "Product"),
            "brand_name": None,  # Could be enhanced later
            "original_image": result["original_image"]
        }
        products_scanned.append(product_data)
        valid_image_data.append(result["original_image"])

    print(f"✅ Filtered products: {len(valid_products)} valid products found")
    
    return {
        **state,
        "products_scanned": products_scanned,
        "image_data_list": valid_image_data,
        "current_step": "products_filtered",
        "messages": state.get("messages", []) + [
            AIMessage(content=f"✅ Found {len(valid_products)} valid product image{'s' if len(valid_products) > 1 else ''}")
        ]
    }

# === GENERATE SPECIFIC PROMPTS FOR EACH PRODUCT ===
def generate_specific_prompts(state: AgentState) -> AgentState:
    """Generate 3 specific marketing prompts for each product"""
    print("🔄 Executing generate_specific_prompts…")
    products = state.get("products_scanned", [])
    if not products:
        return {
            **state,
            "current_step": "no_products_for_prompts",
            "messages": state.get("messages", []) + [
                AIMessage(content="❌ No products found for prompt generation")
            ]
        }

    all_prompts: List[str] = []
    all_prompt_image_pairs: List[dict] = []

    prompt_templates = [
        "A surreal, bird's-eye view of a city street pedestrian crossing, filled with tiny, realistic people walking in various directions. In the center of the crosswalk lies a giant {product_name}, replacing the crosswalk stripes or interacting with them as if it's part of the scene. The perspective should make the product look enormous in comparison to the people. The style should be ultra-realistic with slight artistic exaggeration, with good lighting and detailed shadows cast by the product and people, similar to a high-end street photography shot.",
        "A hyper-realistic nighttime city intersection with a massive, curved 3D digital billboard on the side of a modern building. The billboard displays a dynamic 3D advertisement of a floating {product_name}, emerging slightly out of the screen as if it's interacting with the real world. The product is well-lit with cinematic lighting, surrounded by subtle particles and visual effects that emphasize the product's key features. Pedestrians below are watching or walking by, giving a sense of scale and realism. The overall atmosphere is futuristic, premium, and similar to Times Square or Piccadilly Circus LED displays.",
        "Create a clean, high-end editorial product layout featuring {product_name}, inspired by premium sneaker and fashion catalog designs. The composition should include: A large, detailed top-down product view on the right side of the image. A cluster of 3 to 4 angled or stacked product views in the bottom-left area. A minimalist light background (off-white or neutral gray), with soft shadows and clean studio lighting. No text or logos anywhere in the image. The layout should feel like a modern fashion magazine or product showcase, balanced and highly aesthetic, with careful placement and visual harmony. Use photorealistic lighting, professional product rendering style, and subtle depth and shadows."
    ]

    for product in products:
        product_name = product.get("product_name", "the product")
        original_image = product.get("original_image")
        print(f"   Generating 3 prompts for: {product_name}")
        for idx, template in enumerate(prompt_templates):
            prompt = template.format(product_name=product_name)
            all_prompts.append(prompt)
            all_prompt_image_pairs.append({
                "prompt": prompt,
                "images": [original_image] if original_image else [],
                "product_name": product_name,
                "prompt_type": f"style_{idx+1}",
                "prompt_index": idx
            })

    print(f"✅ Generated {len(all_prompt_image_pairs)} prompts for {len(products)} product(s)")
    return {
        **state,
        "edit_prompts": all_prompts,
        "prompt_image_pairs": all_prompt_image_pairs,
        "current_step": "prompts_generated",
        "messages": state.get("messages", []) + [
            AIMessage(content=f"🎬 Generated 3 creative prompts for each product ({len(all_prompt_image_pairs)} total prompts)")
        ]
    }

# === GENERATE IMAGES WITH GPT-IMAGE-1 ===
def generate_images_with_gpt_image_1(state: AgentState) -> AgentState:
    """Generate images using GPT-Image-1 with smaller file sizes"""
    print("🎨 Executing GPT-Image-1 generation for all products...")
    generate_flag = state.get("generate_images_flag", True)
    if not generate_flag:
        print("   Image generation disabled, skipping...")
        return {
            **state,
            "current_step": "image_generation_skipped",
            "messages": state.get("messages", []) + [
                AIMessage(content="⏭️ Image generation skipped (disabled by user)")
            ]
        }

    prompt_image_pairs = state.get("prompt_image_pairs", [])
    image_size = state.get("image_size", "instagram")
    target_size = SIZE_MAPPING.get(image_size, "1080x1920")

    print(f"📦 Found {len(prompt_image_pairs)} prompt-image pairs, target size: {target_size}")
    if not prompt_image_pairs:
        print("⚠️ No prompt_image_pairs found in state!")
        return {
            **state,
            "current_step": "image_generation_skipped",
            "messages": state.get("messages", []) + [
                AIMessage(content="⚠️ No prompt-image pairs found. Skipping generation.")
            ]
        }

    client = get_openai_client()
    generated_images: List[dict] = []
    errors: List[str] = []

    for idx, pair in enumerate(prompt_image_pairs):
        prompt = pair["prompt"]
        image_data_list = pair["images"]
        product_name = pair.get("product_name", f"Product {idx}")
        prompt_type = pair.get("prompt_type", f"style_{idx}")

        if not image_data_list:
            print(f"   No images available for prompt {idx+1}")
            continue

        try:
            print(f"🔁 Generating image {idx+1}/{len(prompt_image_pairs)} for {product_name} ({prompt_type})")
            input_image_data = image_data_list[0]
            image_bytes = base64.b64decode(input_image_data['base64'])

            # Compress image before sending to reduce 413 errors
            image = Image.open(io.BytesIO(image_bytes))
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large (max 4MB for OpenAI)
            max_size = 1024  # Reduce max dimension
            if max(image.width, image.height) > max_size:
                ratio = max_size / max(image.width, image.height)
                new_width = int(image.width * ratio)
                new_height = int(image.height * ratio)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Save compressed image
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG', quality=85, optimize=True)  # Reduced quality
            compressed_bytes = buffer.getvalue()
            
            print(f"   Original size: {len(image_bytes)} bytes, Compressed: {len(compressed_bytes)} bytes")

            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                temp_file.write(compressed_bytes)
                temp_file_path = temp_file.name

            try:
                enhanced_prompt = f"{prompt} High quality, professional photography, ultra-detailed, cinematic."
                with open(temp_file_path, 'rb') as image_file:
                    result = client.images.edit(
                        model="gpt-image-1",
                        image=image_file,
                        prompt=enhanced_prompt,
                        size="1024x1024",
                        n=1
                    )

                generated_base64 = result.data[0].b64_json
                print(f"🔧 Resizing from 1024x1024 to {target_size}")
                resized_base64 = resize_image_to_target(generated_base64, target_size)

                generated_images.append({
                    "prompt": prompt,
                    "image_base64": resized_base64,
                    "image_url": None,
                    "index": idx,
                    "input_image": input_image_data.get('filename', f"image_{idx}"),
                    "size": target_size,
                    "product_name": product_name,
                    "prompt_type": prompt_type
                })
                print(f"✅ Generated and resized image {idx+1} for {product_name} ({prompt_type})")

            finally:
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

        except Exception as e:
            error_msg = f"❌ Failed to generate image {idx+1} for {product_name}: {e}"
            print(error_msg)
            errors.append(error_msg)

    status_message = (
        f"✅ Generated {len(generated_images)} {target_size} images using GPT-Image-1."
        if generated_images else "❌ No images generated."
    )
    return {
        **state,
        "generated_images": generated_images,
        "current_step": "image_batch_generated",
        "messages": state.get("messages", []) + [
            AIMessage(content=status_message)
        ] + [AIMessage(content=msg) for msg in errors]
    }

# === END NODE ===
def end_processing(state: AgentState) -> AgentState:
    print("🏁 Processing complete!")
    if not state.get("session_id"):
        session_id = str(uuid.uuid4())
        state = {**state, "session_id": session_id}
    return {
        **state,
        "current_step": "processing_complete",
        "messages": state.get("messages", []) + [
            AIMessage(content="🎉 Processing completed successfully!")
        ]
    }

# === INVALID UPLOAD NODE ===
def invalid_upload(state: AgentState) -> AgentState:
    print("🔄 Executing invalid_upload…")
    return {
        **state,
        "current_step": "invalid_upload",
        "messages": state.get("messages", []) + [
            AIMessage(content="⚠️ Please upload only product images. No people or avatars allowed.")
        ]
    }

# === ROUTE DECISION ===
def decide_next_step(state: AgentState) -> str:
    print("🔄 Executing decide_next_step…")
    current_step = state.get("current_step")
    if current_step == "images_validated":
        return "filter_valid_products"
    elif current_step == "products_filtered":
        return "generate_specific_prompts"
    elif current_step == "no_valid_products":
        return "invalid_upload"
    else:
        return "end_processing"

# === GRAPH BUILDER ===
def build_product_only_agent():
    print("🏗️ Building enhanced product-only agent with validation…")
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("validate_and_categorize_images", validate_and_categorize_images)
    graph.add_node("filter_valid_products", filter_valid_products)
    graph.add_node("generate_specific_prompts", generate_specific_prompts)
    graph.add_node("generate_images_with_gpt_image_1", generate_images_with_gpt_image_1)
    graph.add_node("invalid_upload", invalid_upload)
    graph.add_node("end_processing", end_processing)

    # Set entry point
    graph.set_entry_point("validate_and_categorize_images")
    
    # Add conditional edges
    graph.add_conditional_edges(
        "validate_and_categorize_images",
        decide_next_step,
        {
            "filter_valid_products": "filter_valid_products",
            "invalid_upload": "invalid_upload",
            "end_processing": "end_processing"
        }
    )

    # Add regular edges
    graph.add_edge("filter_valid_products", "generate_specific_prompts")
    graph.add_edge("generate_specific_prompts", "generate_images_with_gpt_image_1")
    graph.add_edge("generate_images_with_gpt_image_1", "end_processing")
    graph.add_edge("invalid_upload", "end_processing")
    graph.add_edge("end_processing", END)

    print("✅ Enhanced product-only agent built successfully")
    return graph.compile()

# === MAIN AGENT CLASS ===
class ContentAgent:
    def __init__(self):
        self.agent = build_product_only_agent()
        if not os.environ.get('OPENAI_API_KEY'):
            raise ValueError("OPENAI_API_KEY environment variable is required")

    def validate_images(self, image_data_list: List[Dict]) -> Dict:
        """Validate and categorize images without generating"""
        try:
            print(f"🔄 Validating {len(image_data_list)} images…")

            initial_state = {
                "messages": [HumanMessage(content="Validating images...")],
                "image_data_list": image_data_list,
                "generate_images_flag": False,  # Don't generate, just validate
                "current_step": "initialized"
            }

            # Run only validation step
            validation_state = validate_and_categorize_images(initial_state)
            
            validation_results = validation_state.get("validation_results", [])
            
            # Categorize results
            products = [r for r in validation_results if r.get("is_product", False) and r.get("confidence", 0) > 0.7]
            non_products = [r for r in validation_results if not (r.get("is_product", False) and r.get("confidence", 0) > 0.7)]
            
            return {
                "success": True,
                "validation_results": validation_results,
                "valid_products": products,
                "rejected_images": non_products,
                "can_proceed": len(products) > 0,
                "message": f"Found {len(products)} valid product(s) and {len(non_products)} non-product image(s)"
            }

        except Exception as e:
            print(f"❌ Validation failed: {str(e)}")
            return {
                "success": False,
                "error": f"Validation failed: {str(e)}",
                "validation_results": [],
                "valid_products": [],
                "rejected_images": [],
                "can_proceed": False
            }

    def process(self, image_data_list: List[Dict], generate_images: bool = True, image_size: str = "instagram") -> Dict:
        """Main processing pipeline with enhanced validation"""
        try:
            target_size = SIZE_MAPPING.get(image_size, "1080x1920")
            print(f"🔄 Processing {len(image_data_list)} images (products only, target: {target_size})…")

            initial_state = {
                "messages": [HumanMessage(content="Processing product images...")],
                "image_data_list": image_data_list,
                "generate_images_flag": generate_images,
                "image_size": image_size,
                "current_step": "initialized"
            }

            final_state = self.agent.invoke(initial_state)

            # Handle cancellation gracefully
            if final_state.get("current_step") == "cancelled":
                return {
                    "success": False,
                    "cancelled": True,
                    "message": "Processing was cancelled",
                    "descriptions": [],
                    "products": [],
                    "prompts": [],
                    "generated_images": []
                }

            result = {
                "success": final_state.get("current_step") == "processing_complete",
                "validation_results": final_state.get("validation_results", []),
                "descriptions": ["product"] * len(final_state.get("products_scanned", [])),
                "products": final_state.get("products_scanned", []),
                "prompts": final_state.get("edit_prompts", []),
                "has_avatar": False,
                "avatar_type": None,
                "generated_images": final_state.get("generated_images", []),
                "session_id": final_state.get("session_id"),
                "current_step": final_state.get("current_step"),
                "image_format": target_size,
                "messages": [msg.content for msg in final_state.get("messages", []) if hasattr(msg, 'content')]
            }

            num_products = len(result.get("products", []))
            num_images = len(result.get("generated_images", []))
            result["message"] = (
                f"Successfully processed {num_products} product(s)"
                + (f" and generated {num_images} enhanced {target_size} images (3 styles per product)" if num_images > 0 else "")
            )

            if not result["success"]:
                error_messages = [msg for msg in result["messages"] if "❌" in msg or "error" in msg.lower()]
                result["error"] = error_messages[-1] if error_messages else "Processing failed"

            print(f"✅ Product processing complete: {result['message']}")
            return result

        except Exception as e:
            print(f"❌ Product processing failed: {str(e)}")
            return {
                "success": False,
                "error": f"Processing failed: {str(e)}",
                "descriptions": [],
                "products": [],
                "prompts": [],
                "generated_images": [],
                "messages": [f"Error: {str(e)}"]
            }

    def generate_images(self, prompts: List[str], images_data: List[Dict], max_images: int = 3, image_size: str = "instagram") -> List[Dict]:
        """Generate images using provided prompts and images"""
        try:
            target_size = SIZE_MAPPING.get(image_size, "1080x1920")
            print(f"🎨 Generating {target_size} images…")

            prompt_image_pairs: List[dict] = []
            for i, prompt in enumerate(prompts[:max_images]):
                prompt_image_pairs.append({
                    "prompt": prompt,
                    "images": images_data,
                    "product_name": f"Product {i//3 + 1}",
                    "prompt_type": f"style_{(i%3) + 1}"
                })

            state = {
                "prompt_image_pairs": prompt_image_pairs,
                "generate_images_flag": True,
                "image_size": image_size,
                "messages": []
            }

            result_state = generate_images_with_gpt_image_1(state)
            return result_state.get("generated_images", [])

        except Exception as e:
            print(f"❌ Image generation failed: {str(e)}")
            return []

# Singleton instance
agent = ContentAgent()