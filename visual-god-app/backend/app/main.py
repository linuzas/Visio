from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import sys
import logging

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

# Request models
class ImageData(BaseModel):
    base64: str
    filename: str

class ProcessRequest(BaseModel):
    images: List[ImageData]
    userId: Optional[str] = None
    generate_images: bool = True  # New option to control image generation

class GenerateRequest(BaseModel):
    prompts: List[str]
    images: List[ImageData]  # Input images required for GPT-Image-1
    max_images: int = 3

# Response models for better documentation
class ProductInfo(BaseModel):
    product_name: str
    product_type: str
    brand_name: Optional[str]

class GeneratedImage(BaseModel):
    prompt: str
    image_base64: str
    image_url: Optional[str] = None  # GPT-Image-1 doesn't provide URLs
    index: int
    input_image: Optional[str] = None  # Track which input image was used

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
            "DALL-E 3 image generation"
        ]
    }

@app.post("/api/process", response_model=ProcessResponse)
async def process_images(request: ProcessRequest):
    """
    Process uploaded images and optionally generate new images
    """
    try:
        logger.info(f"Processing {len(request.images)} images (generate_images={request.generate_images})")
        
        # Convert Pydantic models to dict format your agent expects
        images_data = [
            {"base64": img.base64, "filename": img.filename} 
            for img in request.images
        ]
        
        # Process images using your enhanced agent
        result = agent.process(images_data, generate_images=request.generate_images)
        
        logger.info(f"Processing completed: {result.get('success', False)}")
        
        # Add processing metadata
        result["processing_timestamp"] = "2025-01-01T00:00:00Z"  # You can use actual datetime
        result["api_version"] = "2.0.0"
        
        return result
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "success": False,
                "error": f"Processing failed: {str(e)}",
                "api_version": "2.0.0"
            }
        )

@app.post("/api/generate-only")
async def generate_images_only(request: GenerateRequest):
    """
    Generate images from provided prompts and input images using GPT-Image-1
    """
    try:
        logger.info(f"Generating images for {len(request.prompts)} prompts with {len(request.images)} input images")
        
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
        
        # Use the agent's generation capability directly
        generated_images = agent.generate_images(request.prompts, images_data, max_images=request.max_images)
        
        return {
            "success": True,
            "generated_images": generated_images,
            "total_generated": len(generated_images),
            "message": f"Generated {len(generated_images)} images using GPT-Image-1"
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

@app.get("/api/pricing")
def get_pricing_info():
    """
    Get current pricing information for the service
    """
    return {
        "image_generation": {
            "model": "GPT-Image-1",
            "cost_per_image": "$0.08 USD",
            "size": "1024x1024",
            "type": "Image editing/enhancement",
            "requires_input_image": True
        },
        "processing": {
            "image_classification": "Included",
            "product_scanning": "Included", 
            "prompt_generation": "Included"
        },
        "limits": {
            "max_images_per_request": 3,
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
            "gpt_image_1_generation": bool(os.getenv("OPENAI_API_KEY")),
            "product_scanning": True,
            "avatar_classification": True
        }
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

# This is the key fix for Railway
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)