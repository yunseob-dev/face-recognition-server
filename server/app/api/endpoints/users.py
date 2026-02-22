import json
import uuid
import cv2
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from starlette.responses import StreamingResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from app.db.session import get_db
from app.db.models import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.ai_service import ai_service
from app.utils.preprocessing import read_image_file, pre_process
from app.utils.recognition import find_best_match
from app.utils.face_image_storage import save_face_image, save_face_preprocessed_image, delete_face_image_if_exists, get_face_image_path
from app.core.config import settings
from app.api.endpoints.auth import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register_user(
    name: str = Form(..., description="Display name for the user"),
    file: UploadFile = File(..., description="Face image file"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    existing_name_result = await db.execute(select(User).where(User.name == name))
    if existing_name_result.scalars().first():
        raise HTTPException(status_code=400, detail=f"이미 등록된 사용자 이름입니다: {name}")

    identity_id = str(uuid.uuid4())
    result = await db.execute(select(User).where(User.identity_id == identity_id))
    if result.scalars().first():
        identity_id = str(uuid.uuid4())

    face_image_path: str | None = None
    face_preprocessed_path: str | None = None
    try:
        image = await read_image_file(file)
        processed_tensor, resized_bgr = pre_process(image, return_resized=True)
        embedding_list = ai_service.inference(processed_tensor)
        embedding_json = json.dumps(embedding_list)
        _, buf = cv2.imencode(".jpg", image)
        face_image_path = save_face_image(buf.tobytes(), identity_id, "jpg")
        _, prep_buf = cv2.imencode(".jpg", resized_bgr)
        face_preprocessed_path = save_face_preprocessed_image(prep_buf.tobytes(), identity_id)
    except Exception as e:
        delete_face_image_if_exists(face_image_path)
        delete_face_image_if_exists(face_preprocessed_path)
        raise HTTPException(status_code=500, detail=str(e))

    try:
        new_user = User(
            name=name,
            identity_id=identity_id,
            face_embedding=embedding_json,
            face_image_path=face_image_path,
            face_preprocessed_path=face_preprocessed_path,
            is_active=True
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user
    except Exception as e:
        delete_face_image_if_exists(face_image_path)
        delete_face_image_if_exists(face_preprocessed_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/register/bulk")
async def register_bulk_users(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Bulk-registers users from uploaded files; streams progress via SSE. Uses raw Request to bypass Starlette default max_files=1000."""
    form = await request.form(max_files=10000, max_fields=10000)
    files: List[UploadFile] = [v for k, v in form.multi_items() if k == "files"]
    names: List[str] = [v for k, v in form.multi_items() if k == "names"]

    if len(files) != len(names):
        await form.close()
        raise HTTPException(status_code=400, detail="파일 수와 이름 수가 일치하지 않습니다.")

    async def generate():
        total = len(files)
        success_count = 0
        failed_folders = []

        for i, (file, name) in enumerate(zip(files, names)):
            status = "success"
            reason = None

            existing_user_result = await db.execute(select(User).where(User.name == name))
            if existing_user_result.scalars().first():
                status = "failed"
                reason = "Already registered"
                failed_folders.append({"folder": name, "reason": reason})
            else:
                face_image_path: str | None = None
                face_preprocessed_path: str | None = None
                identity_id = str(uuid.uuid4())
                try:
                    image = await read_image_file(file)
                    processed_tensor, resized_bgr = pre_process(image, return_resized=True)
                    embedding_list = ai_service.inference(processed_tensor)
                    embedding_json = json.dumps(embedding_list)
                    _, buf = cv2.imencode(".jpg", image)
                    face_image_path = save_face_image(buf.tobytes(), identity_id, "jpg")
                    _, prep_buf = cv2.imencode(".jpg", resized_bgr)
                    face_preprocessed_path = save_face_preprocessed_image(prep_buf.tobytes(), identity_id)

                    new_user = User(
                        name=name,
                        identity_id=identity_id,
                        face_embedding=embedding_json,
                        face_image_path=face_image_path,
                        face_preprocessed_path=face_preprocessed_path,
                        is_active=True
                    )
                    db.add(new_user)
                    success_count += 1

                except Exception as e:
                    delete_face_image_if_exists(face_image_path)
                    delete_face_image_if_exists(face_preprocessed_path)
                    status = "failed"
                    reason = str(e)
                    failed_folders.append({"folder": name, "reason": reason})

            progress_event = {
                "type": "progress",
                "current": i + 1,
                "total": total,
                "name": name,
                "status": status,
            }
            if reason:
                progress_event["reason"] = reason
            yield f"data: {json.dumps(progress_event)}\n\n"

        if success_count > 0:
            await db.commit()

        await form.close()

        complete_event = {
            "type": "complete",
            "total_folders_scanned": total,
            "success_count": success_count,
            "failed_count": len(failed_folders),
            "failures": failed_folders,
        }
        yield f"data: {json.dumps(complete_event)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )

@router.post("/search")
async def search_user(
    file: UploadFile = File(..., description="Face image file"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    image = await read_image_file(file)
    processed_tensor = pre_process(image)
    current_embedding = ai_service.inference(processed_tensor)
    
    result = await db.execute(select(User).where(User.is_active == True))
    users = list(result.scalars().all())

    if not users:
        raise HTTPException(status_code=404, detail="No active users found")
    
    best_user, max_similarity = find_best_match(current_embedding, users)

    def _user_with_face_url(u: User | None):
        if not u:
            return {"name": None, "identity_id": None, "face_image_url": None}
        face_url = f"/api/v1/users/face-image/{u.identity_id}" if u.face_image_path else None
        return {"name": u.name, "identity_id": u.identity_id, "face_image_url": face_url}

    if best_user and max_similarity >= settings.FACE_MATCH_THRESHOLD:
        return {
            "search_result": True,
            "user": _user_with_face_url(best_user),
            "similarity": round(max_similarity, 4)
        }

    return {
        "search_result": False,
        "user": _user_with_face_url(best_user),
        "message": "No matching user found or similarity is too low",
        "similarity": round(max_similarity, 4) if max_similarity is not None else 0.0
    }


@router.get("/face-image/{identity_id}")
async def get_face_image(
    identity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.identity_id == identity_id))
    user = result.scalar_one_or_none()
    if not user or not user.face_image_path:
        raise HTTPException(status_code=404, detail="Face image not found")
    path = get_face_image_path(user.face_image_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Face image file not found")
    return FileResponse(path, media_type="image/jpeg")


@router.get("/face-preprocessed-image/{identity_id}")
async def get_face_preprocessed_image(
    identity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.identity_id == identity_id))
    user = result.scalar_one_or_none()
    if not user or not user.face_preprocessed_path:
        raise HTTPException(status_code=404, detail="Preprocessed face image not found")
    path = get_face_image_path(user.face_preprocessed_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Preprocessed image file not found")
    return FileResponse(path, media_type="image/jpeg")


@router.get("/", response_model=List[UserResponse])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    users = list(result.scalars().all())
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = user_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/all", status_code=200)
async def delete_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Deletes all users. Irreversible."""
    result = await db.execute(select(User))
    users = list(result.scalars().all())
    for u in users:
        delete_face_image_if_exists(u.face_image_path)
        delete_face_image_if_exists(u.face_preprocessed_path)
    await db.execute(delete(User))
    await db.commit()
    return {
        "message": f"Successfully deleted {len(users)} users"
    }

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    delete_face_image_if_exists(user.face_image_path)
    delete_face_image_if_exists(user.face_preprocessed_path)
    await db.delete(user)
    await db.commit()
    return {"message": "User deleted successfully"}