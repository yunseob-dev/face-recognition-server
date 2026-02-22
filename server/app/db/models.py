from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB 
from sqlalchemy.sql import func

from app.db.base import Base

class User(Base):
    """User record with face embedding (stored as JSON text)."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    identity_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    face_embedding: Mapped[str] = mapped_column(Text, nullable=False)
    face_image_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    face_preprocessed_path: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class PredictionLog(Base):
    """Log entry for raw ONNX inference requests and results."""
    __tablename__ = "prediction_logs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    request_id: Mapped[str] = mapped_column(String(50), index=True)
    input_source: Mapped[str] = mapped_column(String(255), nullable=True)
    result_json: Mapped[str] = mapped_column(Text, nullable=False)
    execution_time: Mapped[float] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    def __repr__(self):
        return f"<PredictionLog(id={self.id}, request_id={self.request_id})>"
    
class Admin(Base):
    """Admin account for JWT-protected routes."""
    __tablename__ = "admins"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)