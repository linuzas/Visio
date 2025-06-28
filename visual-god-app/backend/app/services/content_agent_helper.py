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

# 🎯 UPDATED: New size mapping for your requirements
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

# === UTILS ===
def get_llm():
    return ChatOpenAI(temperature=0.7, model="gpt-4o")

def get_openai_client():
    """Create OpenAI client with extended timeout for Railway deployment"""
    return OpenAI(
        api_key=os.environ.get('OPENAI_API_KEY'),
        timeout=180.0,        # Simple 3-minute timeout
        max_retries=1         # Reduce retries to save time
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
        return image_base64  # Return original if resize fails

# === VALIDATE PRODUCT IMAGES NODE ===
def validate_product_images(state: AgentState) -> AgentState:
    print("🔄 Executing validate_product_images…")
    image_data_list = state.get("image_data_list", [])
    if not image_data_list:
        return {
            **state,
            "current_step": "no_images",
            "messages": state.get("messages", []) + [
                AIMessage(content="❌ No images provided")
            ]
        }

    client = get_openai_client()
    valid_products: List[dict] = []
    rejected_images: List[str] = []

    try:
        print("   Validating images are products only…")
        for i, img_data in enumerate(image_data_list):
            print(f"   Validating image {i+1}/{len(image_data_list)}…")
            response = client.chat.completions.create(
                model="gpt-4o",
                temperature=0,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": (
                            "Is this a clear photo of a physical product (food, cosmetics, electronics, clothing, etc.)? "
                            "Do NOT accept people, avatars, or scenes. Only accept clear product photos. "
                            "Respond with ONLY YES or NO."
                        )},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_data['base64']}"}}
                    ]
                }]
            )
            raw = response.choices[0].message.content.strip().upper()
            is_product = raw.startswith("YES")

            if is_product:
                valid_products.append(img_data)
                print(f"   ✅ Image {i+1} validated as product")
            else:
                rejected_images.append(img_data.get('filename', f"image_{i+1}"))
                print(f"   ❌ Image {i+1} rejected (not a product)")

        if not valid_products:
            print("   ❌ No valid products found across all images")
            return {
                **state,
                "current_step": "no_valid_products",
                "messages": state.get("messages", []) + [
                    AIMessage(content="❌ No valid product images found. Please upload only product photos (no people or avatars).")
                ]
            }

        print(f"✅ Validation complete: {len(valid_products)} valid, {len(rejected_images)} rejected")
        return {
            **state,
            "image_data_list": valid_products,
            "current_step": "products_validated",
            "messages": state.get("messages", []) + [
                AIMessage(content=(
                    f"✅ Validated {len(valid_products)} product image"
                    f"{'s' if len(valid_products)>1 else ''}; "
                    f"rejected {len(rejected_images)} non-product image"
                    f"{'s' if len(rejected_images)>1 else ''}."
                ))
            ]
        }

    except Exception as e:
        print(f"   OpenAI API error: {e}")
        return {
            **state,
            "current_step": "validation_failed",
            "messages": state.get("messages", []) + [
                AIMessage(content=f"❌ Validation failed: {e}")
            ]
        }

# === SCAN PRODUCTS NODE ===
def scan_products_and_store(state: AgentState) -> AgentState:
    print("🔄 Executing scan_products_and_store…")
    image_data_list = state.get("image_data_list", [])
    if not image_data_list:
        print("   No image data available")
        return {
            **state,
            "current_step": "no_images_for_scanning",
            "messages": state.get("messages", []) + [
                AIMessage(content="❌ No images available for scanning")
            ]
        }

    client = get_openai_client()
    product_data: List[dict] = []

    try:
        for i, img_data in enumerate(image_data_list):
            print(f"   Scanning product: {img_data.get('filename', f'image_{i+1}')}")
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": (
                            "Identify the product in this image. Be specific about the product name. "
                            "Return ONLY JSON in the format:\n"
                            "{\"product_name\": \"Specific Product Name\", \"product_type\": \"category\", \"brand_name\": \"Brand Name or null\"}"
                        )},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_data['base64']}"}}
                    ]
                }]
            )

            content = response.choices[0].message.content.strip()
            start = content.find("{")
            end = content.rfind("}") + 1
            data = json.loads(content[start:end])
            data["original_image"] = img_data
            product_data.append(data)
            print(f"   Product identified: {data}")

        result = {
            **state,
            "products_scanned": product_data,
            "current_step": "products_scanned",
            "messages": state.get("messages", []) + [
                AIMessage(content=f"🔍 Identified {len(product_data)} product(s)")
            ]
        }
        print(f"✅ Product scanning complete: {len(product_data)} products")
        return result

    except Exception as e:
        print(f"   Product scanning error: {e}")
        return {
            **state,
            "current_step": "product_scan_failed",
            "messages": state.get("messages", []) + [
                AIMessage(content=f"❌ Scanning error: {e}")
            ]
        }

# === GENERATE SPECIFIC PROMPTS FOR EACH PRODUCT ===
def generate_specific_prompts(state: AgentState) -> AgentState:
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

            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                temp_file.write(image_bytes)
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
    if current_step == "products_validated":
        return "scan_products_and_store"
    elif current_step == "no_valid_products":
        return "invalid_upload"
    else:
        return "end_processing"

# === GRAPH BUILDER ===
def build_product_only_agent():
    print("🏗️ Building product-only agent with 3 specific prompts per product…")
    graph = StateGraph(AgentState)
    graph.add_node("validate_product_images", validate_product_images)
    graph.add_node("scan_products_and_store", scan_products_and_store)
    graph.add_node("generate_specific_prompts", generate_specific_prompts)
    graph.add_node("generate_images_with_gpt_image_1", generate_images_with_gpt_image_1)
    graph.add_node("invalid_upload", invalid_upload)
    graph.add_node("end_processing", end_processing)

    graph.set_entry_point("validate_product_images")
    graph.add_conditional_edges(
        "validate_product_images",
        decide_next_step,
        {
            "scan_products_and_store": "scan_products_and_store",
            "invalid_upload": "invalid_upload",
            "end_processing": "end_processing"
        }
    )

    graph.add_edge("scan_products_and_store", "generate_specific_prompts")
    graph.add_edge("generate_specific_prompts", "generate_images_with_gpt_image_1")
    graph.add_edge("generate_images_with_gpt_image_1", "end_processing")
    graph.add_edge("invalid_upload", "end_processing")
    graph.add_edge("end_processing", END)

    print("✅ Product-only agent built successfully with 3 specific prompts per product")
    return graph.compile()

# === MAIN AGENT CLASS ===
class ContentAgent:
    def __init__(self):
        self.agent = build_product_only_agent()
        if not os.environ.get('OPENAI_API_KEY'):
            raise ValueError("OPENAI_API_KEY environment variable is required")

    def process(self, image_data_list: List[Dict], generate_images: bool = True, image_size: str = "instagram") -> Dict:
        """Main processing pipeline for product-only images with 3 specific prompts per product"""
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

            result = {
                "success": final_state.get("current_step") == "processing_complete",
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
        """Generate images using provided prompts and images (3 per product)"""
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
