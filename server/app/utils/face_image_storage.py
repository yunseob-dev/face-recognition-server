import os
from pathlib import Path

from app.core.config import settings


def _ensure_dir() -> Path:
    root = Path.cwd()
    face_dir = root / settings.FACE_IMAGE_DIR
    face_dir.mkdir(parents=True, exist_ok=True)
    return face_dir


def save_face_image(image_bytes: bytes, identity_id: str, extension: str = "jpg") -> str:
    """Save face image to FACE_IMAGE_DIR as {identity_id}.{extension}; return relative path for DB."""
    face_dir = _ensure_dir()
    filename = f"{identity_id}.{extension}"
    path = face_dir / filename
    path.write_bytes(image_bytes)
    return f"{settings.FACE_IMAGE_DIR}/{filename}"


def save_face_preprocessed_image(image_bytes: bytes, identity_id: str) -> str:
    """Save preprocessed (resize-only, before tensorization) debug image as {identity_id}_preprocessed.jpg; return relative path."""
    face_dir = _ensure_dir()
    filename = f"{identity_id}_preprocessed.jpg"
    path = face_dir / filename
    path.write_bytes(image_bytes)
    return f"{settings.FACE_IMAGE_DIR}/{filename}"


def get_face_image_path(relative_path: str) -> Path:
    """Resolve relative path (stored in DB) to absolute Path for reading or deleting."""
    return Path.cwd() / relative_path


def delete_face_image_if_exists(relative_path: str | None) -> None:
    """Remove file at relative_path if it exists; no-op if path is None or file missing."""
    if not relative_path:
        return
    p = get_face_image_path(relative_path)
    if p.is_file():
        p.unlink()
