from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from app.core.config import settings
from app.core.logger import setup_logging
from pathlib import Path
from app.services.ai_service import ai_service

from app.db.session import engine
from app.db.base import Base
from app.db.models import User, PredictionLog, Admin
from app.db.init_admin import create_initial_admin

from app.api.api import api_router
from app.api.endpoints import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()

    logger.info("Server startup in progress")
    logger.info(f"Model path: {settings.MODEL_PATH}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables verified")

    (Path.cwd() / settings.FACE_IMAGE_DIR).mkdir(parents=True, exist_ok=True)

    from app.db.session import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        await create_initial_admin(db)

    try:
        ai_service.load_model()
    except Exception as e:
        logger.critical(f"Critical: model load failed. {e}")

    yield

    logger.info("Server shutdown in progress")

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://localhost",
    "https://127.0.0.1",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(api_router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])



@app.get("/")
def read_root():
    return {"status": "ok"}

@app.get("/health")
def health_check():
    session = ai_service.session
    is_loaded = session is not None

    response = {
        "status": "healthy" if is_loaded else "degraded",
        "model_loaded": is_loaded,
        "device": str(session.get_providers()) if session else "None"
    }

    if not is_loaded:
        logger.warning("Health check: model not loaded")
    
    return response