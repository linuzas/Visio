from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import sys
import logging
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import your enhanced content agent
try:
    from services.content_agent_helper import agent
    logger.info("Enhanced content agent imported successfully")
except ImportError as e:
    logger.error(f"Failed to import content agent: {e}")
    raise

app = FastAPI(
    title="Visual God API",
    description="AI-powered content generation with image creation",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🎯 UPDATED: New size configurations
SIZE_CONFIGS = {
    "instagram": {
        "size": "1080x1920",
        "label": "Instagram Reels",
        "description": "Vertical format (9:16) for Instagram Reels",
        "aspect_ratio": "9:16"
    },
    "facebook": {
        "size": "1080x1080", 
        "label": "Facebook Photo Ad",
        "description": "Square format (1:1) for Facebook feed and mobile",
        "aspect_ratio": "1:1"
    },
    "youtube": {
        "size": "2560x1440",
        "label": "YouTube Banner", 
        "description": "Widescreen format (16:9) optimized for all devices",
        "aspect_ratio": "16:9",
        "safe_area": "Keep essential elements within 1546x423px"
    }
}

# Request models
class ImageData(BaseModel):
    base64: str
    filename: str

class ProcessRequest(BaseModel):
    images: List[ImageData]
    userId: Optional[str] = None
    generate_images: bool = True
    image_size: str = "instagram"  # New field for size selection

class GenerateRequest(BaseModel):
    prompts: List[str]
    images: List[ImageData]
    max_images: int = 3
    image_size: str = "instagram"  # New field for size selection

# Response models
class ProductInfo(BaseModel):
    product_name: str
    product_type: str
    brand_name: Optional[str]

class GeneratedImage(BaseModel):
    prompt: str
    image_base64: str
    image_url: Optional[str] = None
    index: int
    input_image: Optional[str] = None
    size: Optional[str] = None  # Track the size used

class ProcessResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    descriptions: Optional[List[str]] = None
    products: Optional[List[ProductInfo]] = None
    prompts: Optional[List[str]] = None
    has_avatar: Optional[bool] = None
    avatar_type: Optional[str] = None
    generated_images: Optional[List[GeneratedImage]] = None
    message: Optional[str] = None
    session_id: Optional[str] = None

@app.get("/")
def read_root():
    return {
        "message": "Visual God Backend API",
        "version": "2.0.0",
        "status": "running",
        "features": [
            "Image classification",
            "Product scanning", 
            "AI prompt generation",
            "Multi-platform image generation",
            "Instagram Reels, Facebook Ads, YouTube Banners"
        ],
        "supported_sizes": SIZE_CONFIGS
    }

@app.post("/api/process", response_model=ProcessResponse)
async def process_images(request: ProcessRequest):
    """
    Process uploaded images and optionally generate new images with specified size
    """
    try:
        logger.info(f"Processing {len(request.images)} images (generate_images={request.generate_images}, size={request.image_size})")
        
        # Validate size parameter
        if request.image_size not in SIZE_CONFIGS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image_size. Must be one of: {list(SIZE_CONFIGS.keys())}"
            )
        
        # Convert Pydantic models to dict format your agent expects
        images_data = [
            {"base64": img.base64, "filename": img.filename} 
            for img in request.images
        ]
        
        # Wrapper function with timeout handling
        async def safe_process():
            try:
                return agent.process(
                    images_data, 
                    generate_images=request.generate_images,
                    image_size=request.image_size  # Pass size to agent
                )
            except Exception as e:
                logger.error(f"Agent processing error: {e}")
                return {
                    "success": False,
                    "error": f"Processing failed: {str(e)}",
                    "descriptions": [],
                    "products": [],
                    "prompts": [],
                    "generated_images": []
                }
        
        # Set timeout UNDER Railway's limit (3 minutes vs 4 minute Railway limit)
        try:
            result = await asyncio.wait_for(safe_process(), timeout=180.0)  # 3 minutes max
            logger.info("Processing completed successfully")
            
            # Add size info to generated images
            if result.get("generated_images"):
                size_config = SIZE_CONFIGS[request.image_size]
                for img in result["generated_images"]:
                    img["size"] = size_config["size"]
            
            # Add processing metadata
            result["processing_timestamp"] = "2025-01-01T00:00:00Z"
            result["api_version"] = "2.0.0"
            result["image_format"] = SIZE_CONFIGS[request.image_size]["label"]
            
            return result
            
        except asyncio.TimeoutError:
            logger.error("Processing timed out after 3 minutes")
            return {
                "success": False,
                "error": "Request timed out. Try with fewer images or disable image generation.",
                "descriptions": [],
                "products": [],
                "prompts": [],
                "generated_images": [],
                "message": "⏰ Timeout - please try again with fewer images"
            }
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return {
            "success": False,
            "error": f"Processing failed: {str(e)}",
            "descriptions": [],
            "products": [],
            "prompts": [],
            "generated_images": []
        }

@app.post("/api/generate-only")
async def generate_images_only(request: GenerateRequest):
    """
    Generate images from provided prompts and input images using GPT-Image-1
    """
    try:
        logger.info(f"Generating images for {len(request.prompts)} prompts with {len(request.images)} input images (size={request.image_size})")
        
        # Validate size parameter
        if request.image_size not in SIZE_CONFIGS:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid image_size. Must be one of: {list(SIZE_CONFIGS.keys())}"
            )
        
        # Convert input images to the format expected by the agent
        images_data = [
            {"base64": img.base64, "filename": img.filename} 
            for img in request.images
        ]
        
        if not images_data:
            raise HTTPException(
                status_code=400,
                detail="Input images are required for GPT-Image-1"
            )
        
        # Wrapper with timeout
        async def generate_with_timeout():
            try:
                generated_images = agent.generate_images(
                    request.prompts, 
                    images_data, 
                    max_images=request.max_images,
                    image_size=request.image_size
                )
                return generated_images
            except asyncio.TimeoutError:
                logger.error("Image generation timed out")
                return []
            except Exception as e:
                logger.error(f"Image generation error: {str(e)}")
                raise
        
        try:
            generated_images = await asyncio.wait_for(generate_with_timeout(), timeout=120.0)  # 2 minutes for generation only
            
            # Add size info to generated images
            size_config = SIZE_CONFIGS[request.image_size]
            for img in generated_images:
                img["size"] = size_config["size"]
            
        except asyncio.TimeoutError:
            return {
                "success": False,
                "error": "Image generation timed out. Please try with fewer prompts.",
                "generated_images": [],
                "total_generated": 0,
                "message": "Generation timed out - try fewer images"
            }
        
        return {
            "success": True,
            "generated_images": generated_images,
            "total_generated": len(generated_images),
            "message": f"Generated {len(generated_images)} images using GPT-Image-1 in {SIZE_CONFIGS[request.image_size]['size']} format",
            "image_format": SIZE_CONFIGS[request.image_size]["label"]
        }
        
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": f"Image generation failed: {str(e)}"
            }
        )

@app.get("/api/sizes")
def get_supported_sizes():
    """
    Get all supported image sizes and their configurations
    """
    return {
        "supported_sizes": SIZE_CONFIGS,
        "default_size": "instagram"
    }

@app.get("/api/pricing")
def get_pricing_info():
    """
    Get current pricing information for the service
    """
    return {
        "image_generation": {
            "model": "GPT-Image-1",
            "cost_per_image": "$0.08 USD",
            "supported_sizes": list(SIZE_CONFIGS.keys()),
            "type": "Image editing/enhancement",
            "requires_input_image": True
        },
        "processing": {
            "image_classification": "Included",
            "product_scanning": "Included", 
            "prompt_generation": "Included"
        },
        "limits": {
            "max_images_per_request": 1,
            "max_file_size": "10MB",
            "supported_formats": ["JPEG", "PNG", "WEBP"]
        }
    }

@app.get("/health")
def health_check():
    """
    Comprehensive health check
    """
    health_status = {
        "status": "healthy",
        "service": "visual-god-backend",
        "version": "2.0.0",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "port": os.getenv("PORT", "8000"),
        "features": {
            "image_processing": True,
            "multi_platform_generation": True,
            "gpt_image_1_generation": bool(os.getenv("OPENAI_API_KEY")),
            "product_scanning": True,
            "avatar_classification": True
        },
        "supported_formats": list(SIZE_CONFIGS.keys())
    }
    
    # Check OpenAI connectivity
    if os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI
            client = OpenAI()
            # Simple test call
            test_response = client.models.list()
            health_status["openai_connection"] = "connected"
        except Exception as e:
            health_status["openai_connection"] = f"error: {str(e)}"
            health_status["status"] = "degraded"
    else:
        health_status["openai_connection"] = "not_configured"
        health_status["status"] = "degraded"
    
    return health_status

# Railway deployment
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)