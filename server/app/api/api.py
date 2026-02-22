from fastapi import APIRouter
from app.api.endpoints import predict, users, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["Default"])
api_router.include_router(predict.router, prefix="/face", tags=["Face Recognition"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])