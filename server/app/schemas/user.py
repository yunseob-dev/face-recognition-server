from datetime import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

class UserCreate(BaseModel):
    name: str = Field(..., description="Display name for the user")
    identity_id: str = Field(..., description="Unique identifier (e.g. employee ID)")
    input_data: List[List[float]] = Field(
        ...,
        description="Preprocessed face image data (e.g. [[0.1, ...]])",
        examples=[[[0.1, 0.2, 0.3]]]
    )

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, description="New display name")
    is_active: Optional[bool] = Field(None, description="Active/inactive flag")

class UserResponse(BaseModel):
    id: int
    name: str
    identity_id: str
    is_active: bool
    created_at: datetime

    class Config:
        """Enables ORM mode for SQLAlchemy model conversion."""
        from_attributes = True