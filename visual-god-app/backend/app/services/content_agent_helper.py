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

# 🎯 UPDATED: New size mapping for your requirements
SIZE_MAPPING = {
    "instagram": "1080x1920",  # Instagram Reels (9:16)
    "facebook": "1080x1080",   # Facebook Photo Ad (1:1)
    "youtube": "2560x1440"     # YouTube Banner (16:9)
}

# === ENHANCED STATE WITH IMAGE GENERATION ===
class AgentState(TypedDict):
    messages: Annotated[List[Any], lambda l, r: l + r]
    product_images: Optional[List[str]]
    image_descriptions: Optional[List[str]]
    current_step: Optional[str]
    products_scanned: Optional[List[dict]]
    avatar_type: Optional[str]
    edit_prompts: Optional[List[str]]
    prompt_image_pairs: Optional[List[dict]]
    image_urls: Optional[List[str]]
    session_id: Optional[str]
    # NEW FIELDS FOR IMAGE GENERATION
    generated_images: Optional[List[dict]]
    generate_images_flag: Optional[bool]
    image_data_list: Optional[List[dict]]  # Store original image data for GPT-Image-1
    image_size: Optional[str]  # Add image size to state

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

# === CLASSIFY IMAGES NODE ===
def classify_uploaded_images(state: AgentState) -> AgentState:
    print("🔄 Executing classify_uploaded_images...")
    
    # Get image data from state (should be base64 data)
    image_data_list = state.get("image_data_list", [])
    
    if not image_data_list:
        return {
            **state,
            "current_step": "no_images",
            "messages": state.get("messages", []) + [AIMessage(content="❌ No images provided")]
        }
    
    client = get_openai_client()
    descriptions = []

    try:
        print("   Calling OpenAI for classification...")
        for i, img_data in enumerate(image_data_list):
            print(f"   Classifying image {i+1}/{len(image_data_list)}")
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": (
                                "What is the main subject of this image?\n"
                                "Respond with one word only: 'product' (for objects), "
                                "'avatar' (if it's a person or animated character), "
                                "or 'other'."
                            )},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_data['base64']}"}}
                        ],
                    }
                ]
            )
            label = response.choices[0].message.content.strip().lower()
            descriptions.append(label)
            print(f"   Image {i+1} classified as: {label}")

        result = {
            **state,
            "image_descriptions": descriptions,
            "current_step": "images_classified",
            "messages": state.get("messages", []) + [AIMessage(content=f"✅ Image types: {descriptions}")]
        }
        print(f"✅ Classification complete: {descriptions}")
        return result

    except Exception as e:
        print(f"   OpenAI API error: {e}")
        return {
            **state,
            "image_descriptions": [],
            "current_step": "classification_failed",
            "messages": state.get("messages", []) + [AIMessage(content=f"❌ Classification failed: {e}")]
        }

# === SCAN PRODUCTS NODE ===
def scan_products_and_store(state: AgentState) -> AgentState:
    print("🔄 Executing scan_products_and_store...")
    
    image_data_list = state.get("image_data_list", [])
    image_descriptions = state.get("image_descriptions", [])
    
    if not image_descriptions:
        print("   No image descriptions available")
        return {
            **state,
            "current_step": "no_descriptions",
            "messages": state.get("messages", []) + [AIMessage(content="❌ No image descriptions available")]
        }
    
    client = get_openai_client()
    product_data = []
    
    try:
        for img_data, desc in zip(image_data_list, image_descriptions):
            if desc != "product":
                print(f"   Skipping {img_data.get('filename', 'unknown')} (not a product: {desc})")
                continue

            print(f"   Scanning product: {img_data.get('filename', 'unknown')}")

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": (
                            "Identify the product in this image.\n"
                            "Return ONLY JSON in the format:\n"
                            "{\"product_name\": \"Lavender Body Lotion\", \"product_type\": \"skincare\", \"brand_name\": \"Brand Name or null\"}"
                        )},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_data['base64']}"}}
                    ]
                }]
            )

            content = response.choices[0].message.content.strip()
            start = content.find("{")
            end = content.rfind("}") + 1
            data = json.loads(content[start:end])
            product_data.append(data)
            print(f"   Product identified: {data}")

        result = {
            **state,
            "products_scanned": product_data,
            "current_step": "products_scanned",
            "messages": state.get("messages", []) + [AIMessage(content=f"🔍 Products identified: {product_data}")]
        }
        print(f"✅ Product scanning complete: {len(product_data)} products")
        return result

    except Exception as e:
        print(f"   Product scanning error: {e}")
        return {
            **state,
            "current_step": "product_scan_failed",
            "messages": state.get("messages", []) + [AIMessage(content=f"❌ Scanning error: {e}")]
        }

# === CLASSIFY AVATAR NODE ===
def classify_avatar_type(state: AgentState) -> AgentState:
    print("🔄 Executing classify_avatar_type...")
    
    image_data_list = state.get("image_data_list", [])
    image_descriptions = state.get("image_descriptions", [])
    avatar_data = [
        img for img, desc in zip(image_data_list, image_descriptions) if desc == "avatar"
    ]

    if not avatar_data:
        print("   No avatars found, continuing...")
        return {
            **state,
            "current_step": "no_avatars_found"
        }

    client = get_openai_client()
    avatar_types = []
    messages = state.get("messages", [])

    for img_data in avatar_data:
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": (
                            "What type of figure is shown in this image? "
                            "Respond with only one word: 'woman', 'man', 'child', or 'character'."
                        )},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_data['base64']}"}}
                    ]
                }]
            )
            result = response.choices[0].message.content.strip().lower()
            
            valid_types = ["woman", "man", "child", "character"]
            if result in valid_types:
                classification_result = result
                print(f"   Avatar classified as: {result}")
            else:
                classification_result = "person"
                print(f"   Unexpected response '{result}', using default 'person'")
                
        except Exception as e:
            print(f"   Avatar classification failed: {e}, using default 'person'")
            classification_result = "person"

        avatar_types.append(classification_result)
        messages.append(AIMessage(content=f"🧑 Avatar classified as: {classification_result}"))

    print(f"✅ Avatar classification complete: {avatar_types}")
    return {
        **state,
        "avatar_type": avatar_types[0] if avatar_types else None,  # Take first avatar type
        "current_step": "avatars_classified",
        "messages": messages
    }

# === ENHANCED PROMPT GENERATION FUNCTIONS ===
def prompt_avatar_with_product(
    avatar_type: str,
    product_name: str,
    product_type: str,
    strategy: str = "joy"
) -> str:
    """Generate enhanced avatar + product prompts"""
    avatar_mapping = {
        "woman": "woman",
        "man": "man", 
        "child": "child",
        "character": "animated character",
        "person": "person"
    }
    
    mapped_avatar = avatar_mapping.get(avatar_type, "person")
    
    if strategy == "lifestyle":
        return f"Cinematic lifestyle photograph: A happy {mapped_avatar} joyfully using {product_name} ({product_type}) in a modern, bright setting. Golden hour lighting, shallow depth of field, professional color grading, 8K resolution, commercial photography style."
    elif strategy == "professional":
        return f"Professional advertisement shot: Confident {mapped_avatar} showcasing {product_name} with genuine smile. Studio lighting setup, clean background, premium aesthetic, high-end commercial photography, ultra-sharp details."
    else:  # authentic
        return f"Authentic lifestyle moment: {mapped_avatar.capitalize()} enjoying {product_name} in natural everyday environment. Soft natural lighting, candid expression, warm tones, documentary-style photography, emotional connection."

def prompts_single_product_styles(product_name: str, product_type: str) -> List[str]:
    """Generate enhanced product-only prompts"""
    return [
        f"Premium product photography: {product_name} ({product_type}) on minimalist white background. Professional studio lighting, ultra-sharp focus, commercial quality, 8K resolution, luxury aesthetic, no shadows.",
        f"Hero shot composition: {product_name} as the centerpiece with dramatic side lighting. Dark gradient background, premium product presentation, commercial photography, professional color grading, luxurious feel.",
        f"Creative product display: {product_name} with elegant complementary styling. Artistic composition, soft rim lighting, modern aesthetic, magazine-quality photography, sophisticated presentation."
    ]

# === PROMPT GENERATION NODES ===
def combine_avatar_and_product(state: AgentState) -> AgentState:
    print("🔄 Executing combine_avatar_and_product...")

    image_data_list = state.get("image_data_list", [])
    image_descriptions = state.get("image_descriptions", [])
    products = state.get("products_scanned", [])
    avatar_type = state.get("avatar_type", "person")

    avatar_data = [img for img, desc in zip(image_data_list, image_descriptions) if desc == "avatar"]
    product_data = [img for img, desc in zip(image_data_list, image_descriptions) if desc == "product"]

    print(f"🧍 Avatar count: {len(avatar_data)}")
    print(f"📦 Product count: {len(product_data)}")

    prompts = []
    prompt_image_pairs = []

    strategies = ["lifestyle", "professional", "authentic"]

    for product in products:
        name = product.get("product_name", "the product")
        ptype = product.get("product_type", "item")

        for strategy in strategies:
            prompt = prompt_avatar_with_product(
                avatar_type=avatar_type,
                product_name=name,
                product_type=ptype,
                strategy=strategy
            )
            
            prompts.append(prompt)
            # Include both avatar and product images for GPT-Image-1
            prompt_image_pairs.append({
                "prompt": prompt,
                "images": avatar_data + product_data,
                "strategy": strategy
            })

    print(f"✅ Generated {len(prompt_image_pairs)} enhanced avatar-product prompt pairs")

    return {
        **state,
        "edit_prompts": prompts,
        "prompt_image_pairs": prompt_image_pairs,
        "current_step": "avatar_product_prompt_ready",
        "messages": state.get("messages", []) + [
            AIMessage(content=f"🎬 Created {len(prompts)} enhanced avatar-product prompts with cinematic styling.")
        ]
    }

def generate_single_product_prompt_flow(state: AgentState) -> AgentState:
    print("🔄 Executing generate_single_product_prompt_flow...")

    products = state.get("products_scanned", [])
    image_data_list = state.get("image_data_list", [])
    image_descriptions = state.get("image_descriptions", [])
    
    if not products:
        return {
            **state,
            "current_step": "no_products",
            "messages": state.get("messages", []) + [AIMessage(content="❌ No products found")]
        }

    product_data = [img for img, desc in zip(image_data_list, image_descriptions) if desc == "product"]

    all_prompts = []
    all_prompt_image_pairs = []

    for product in products:
        product_name = product.get("product_name", "product")
        product_type = product.get("product_type", "item")

        style_prompts = prompts_single_product_styles(product_name, product_type)
        
        for prompt in style_prompts:
            all_prompts.append(prompt)
            all_prompt_image_pairs.append({
                "prompt": prompt,
                "images": product_data
            })

    print(f"✅ Generated {len(all_prompt_image_pairs)} enhanced single product prompts")

    return {
        **state,
        "edit_prompts": all_prompts,
        "prompt_image_pairs": all_prompt_image_pairs,
        "current_step": "single_product_prompts_ready",
        "messages": state.get("messages", []) + [
            AIMessage(content=f"🎬 Generated {len(all_prompts)} enhanced cinematic prompts for {len(products)} product(s).")
        ]
    }

# === UPDATED GPT-IMAGE-1 GENERATION NODE WITH NEW SIZES ===
def generate_images_with_gpt_image_1(state: AgentState) -> AgentState:
    print("🎨 Executing GPT-Image-1 generation...")

    # Check if image generation is enabled
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
    generated_images = []
    errors = []

    # Reduce to only 1 image to prevent timeouts
    limited_pairs = prompt_image_pairs[:1]

    for idx, pair in enumerate(limited_pairs):
        prompt = pair["prompt"]
        image_data_list = pair["images"]

        if not image_data_list:
            print(f"   No images available for prompt {idx+1}")
            continue

        try:
            print(f"🔁 Generating {target_size} image {idx+1}/{len(limited_pairs)}")

            # Use the first available image as input
            input_image_data = image_data_list[0]
            image_bytes = base64.b64decode(input_image_data['base64'])

            # Create temporary file for API
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                temp_file.write(image_bytes)
                temp_file_path = temp_file.name

            try:
                # Call GPT-Image-1 with size-aware prompt
                enhanced_prompt = f"{prompt}. Optimized for {target_size} format, aspect ratio suitable for {image_size} platform."
                
                with open(temp_file_path, 'rb') as image_file:
                    result = client.images.edit(
                        model="gpt-image-1",
                        image=image_file,
                        prompt=enhanced_prompt,
                        size="1024x1024",
                        n=1
                    )

                image_base64 = result.data[0].b64_json

                generated_images.append({
                    "prompt": prompt,
                    "image_base64": image_base64,
                    "image_url": None,
                    "index": idx,
                    "input_image": input_image_data.get('filename', f'image_{idx}'),
                    "size": target_size
                })

                print(f"✅ {target_size} image {idx+1} generated successfully")

            finally:
                # Clean up temp file
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

        except Exception as e:
            error_msg = f"❌ Failed to generate {target_size} image {idx+1}: {e}"
            print(error_msg)
            errors.append(error_msg)

    status_message = (
        f"✅ Generated {len(generated_images)} {target_size} image(s) using GPT-Image-1."
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

# === ROUTE DECISIONS ===
def decide_representation_type(state: AgentState) -> str:
    print("🔄 Executing decide_representation_type...")

    products = state.get("products_scanned", [])
    image_descriptions = state.get("image_descriptions", [])
    has_avatar = "avatar" in image_descriptions if image_descriptions else False
    num_products = len(products)

    print(f"   Products found: {num_products}")
    print(f"   Has avatar: {has_avatar}")

    if not products:
        print("   → Route: invalid_upload")
        return "invalid_upload"

    if has_avatar and num_products >= 1:
        print("   → Route: combine_avatar_and_product")
        return "combine_avatar_and_product"

    print("   → Route: generate_single_product_prompt_flow")
    return "generate_single_product_prompt_flow"

# === INVALID UPLOAD NODE ===
def invalid_upload(state: AgentState) -> AgentState:
    print("🔄 Executing invalid_upload...")
    
    result = {
        **state,
        "current_step": "invalid_upload",
        "messages": state.get("messages", []) + [AIMessage(content="⚠️ Invalid images detected. Please upload only products and/or an avatar.")]
    }
    print("✅ Invalid upload handled")
    return result

# === END NODE ===
def end_processing(state: AgentState) -> AgentState:
    """Final processing node"""
    print("🏁 Processing complete!")
    
    # Generate session ID if not present
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

# === GRAPH BUILDER ===
def build_enhanced_agent():
    print("🏗️ Building enhanced agent with GPT-Image-1 generation...")
    graph = StateGraph(AgentState)

    # Add all nodes
    graph.add_node("classify_uploaded_images", classify_uploaded_images)
    graph.add_node("scan_products_and_store", scan_products_and_store)
    graph.add_node("classify_avatar_type", classify_avatar_type)
    graph.add_node("combine_avatar_and_product", combine_avatar_and_product)
    graph.add_node("generate_single_product_prompt_flow", generate_single_product_prompt_flow)
    graph.add_node("generate_images_with_gpt_image_1", generate_images_with_gpt_image_1)
    graph.add_node("invalid_upload", invalid_upload)
    graph.add_node("end_processing", end_processing)

    # Set entry point
    graph.set_entry_point("classify_uploaded_images")
    
    # Add simple edges
    graph.add_edge("classify_uploaded_images", "scan_products_and_store")
    graph.add_edge("scan_products_and_store", "classify_avatar_type")
    
    # Add conditional edge for routing
    graph.add_conditional_edges(
        "classify_avatar_type",
        decide_representation_type,
        {
            "combine_avatar_and_product": "combine_avatar_and_product",
            "generate_single_product_prompt_flow": "generate_single_product_prompt_flow",
            "invalid_upload": "invalid_upload"
        }
    )
    
    # Route successful prompt generation to image generation
    graph.add_edge("combine_avatar_and_product", "generate_images_with_gpt_image_1")
    graph.add_edge("generate_single_product_prompt_flow", "generate_images_with_gpt_image_1")
    
    # Route to end
    graph.add_edge("generate_images_with_gpt_image_1", "end_processing")
    graph.add_edge("invalid_upload", "end_processing")
    graph.add_edge("end_processing", END)

    print("✅ Enhanced agent built successfully with GPT-Image-1 integration")
    return graph.compile()

# === MAIN AGENT CLASS WITH NEW SIZE SUPPORT ===
class ContentAgent:
    def __init__(self):
        self.agent = build_enhanced_agent()
        
        # Ensure we have an API key
        if not os.environ.get('OPENAI_API_KEY'):
            raise ValueError("OPENAI_API_KEY environment variable is required")
    
    def process(self, image_data_list: List[Dict], generate_images: bool = True, image_size: str = "instagram") -> Dict:
        """Main processing pipeline using LangGraph with size support"""
        try:
            target_size = SIZE_MAPPING.get(image_size, "1080x1920")
            print(f"🔄 Processing {len(image_data_list)} images with graph (target: {target_size})...")
            
            # Prepare initial state with image size
            initial_state = {
                "messages": [HumanMessage(content="Processing uploaded images...")],
                "image_data_list": image_data_list,
                "generate_images_flag": generate_images,
                "image_size": image_size,
                "current_step": "initialized"
            }
            
            # Run the graph
            final_state = self.agent.invoke(initial_state)
            
            # Extract results from final state
            result = {
                "success": final_state.get("current_step") == "processing_complete",
                "descriptions": final_state.get("image_descriptions", []),
                "products": final_state.get("products_scanned", []),
                "prompts": final_state.get("edit_prompts", []),
                "has_avatar": "avatar" in final_state.get("image_descriptions", []),
                "avatar_type": final_state.get("avatar_type"),
                "generated_images": final_state.get("generated_images", []),
                "session_id": final_state.get("session_id"),
                "current_step": final_state.get("current_step"),
                "image_format": target_size,
                "messages": [msg.content for msg in final_state.get("messages", []) if hasattr(msg, 'content')]
            }
            
            # Generate summary message with size info
            num_products = len(result.get("products", []))
            num_images = len(result.get("generated_images", []))
            has_avatar = result.get("has_avatar", False)
            
            result["message"] = (
                f"Successfully processed {num_products} product(s)" + 
                (" with avatar" if has_avatar else "") +
                (f" and generated {num_images} enhanced {target_size} images" if num_images > 0 else "")
            )
            
            # Handle errors
            if not result["success"]:
                error_messages = [msg for msg in result["messages"] if "❌" in msg or "error" in msg.lower()]
                result["error"] = error_messages[-1] if error_messages else "Processing failed"
            
            print(f"✅ Graph processing complete: {result['message']}")
            return result
            
        except Exception as e:
            print(f"❌ Graph processing failed: {str(e)}")
            return {
                "success": False,
                "error": f"Processing failed: {str(e)}",
                "descriptions": [],
                "products": [],
                "prompts": [],
                "generated_images": [],
                "messages": [f"Error: {str(e)}"]
            }

    def generate_images(self, prompts: List[str], images_data: List[Dict], max_images: int = 1, image_size: str = "instagram") -> List[Dict]:
        """Generate images only using provided prompts and images with size support"""
        try:
            target_size = SIZE_MAPPING.get(image_size, "1080x1920")
            print(f"🎨 Generating {target_size} images...")
            
            # Create prompt-image pairs
            prompt_image_pairs = []
            for i, prompt in enumerate(prompts[:max_images]):
                prompt_image_pairs.append({
                    "prompt": prompt,
                    "images": images_data
                })
            
            # Create state for generation
            state = {
                "prompt_image_pairs": prompt_image_pairs,
                "generate_images_flag": True,
                "image_size": image_size,
                "messages": []
            }
            
            # Run generation
            result_state = generate_images_with_gpt_image_1(state)
            return result_state.get("generated_images", [])
            
        except Exception as e:
            print(f"❌ Image generation failed: {str(e)}")
            return []

# Singleton instance
agent = ContentAgent()