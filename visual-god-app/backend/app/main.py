from fastapi import FastAPI, HTTPException
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

# Import your content agent
try:
    from services.content_agent_helper import agent
    logger.info("Content agent imported successfully")
except ImportError as e:
    logger.error(f"Failed to import content agent: {e}")
    raise

app = FastAPI(
    title="Visual God API",
    description="AI-powered content generation from images",
    version="1.0.0"
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

@app.get("/")
def read_root():
    return {
        "message": "Visual God Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/api/process")
async def process_images(request: ProcessRequest):
    try:
        logger.info(f"Processing {len(request.images)} images")
        
        # Convert Pydantic models to dict format your agent expects
        images_data = [
            {"base64": img.base64, "filename": img.filename} 
            for img in request.images
        ]
        
        # Process images using your agent
        result = agent.process(images_data)
        
        logger.info(f"Processing completed: {result.get('success', False)}")
        return result
        
    except Exception as e:
        logger.error(f"Processing error: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "success": False,
                "error": f"Processing failed: {str(e)}"
            }
        )

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "visual-god-backend",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "port": os.getenv("PORT", "8000")
    }

# This is the key fix for Railway
if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)