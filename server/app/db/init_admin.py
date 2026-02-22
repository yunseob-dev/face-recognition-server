from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Admin
from app.core.security import get_password_hash
from app.core.config import settings
from loguru import logger


async def create_initial_admin(db: AsyncSession):
    """Creates the initial superuser from env vars if no admin exists; otherwise no-op."""
    admin_username = settings.SUPERUSER_ID
    admin_password = settings.SUPERUSER_PASSWORD
    admin_email = settings.SUPERUSER_EMAIL

    result = await db.execute(select(Admin).filter(Admin.username == admin_username))
    existing_admin = result.scalar_one_or_none()
    
    if not existing_admin:
        admin = Admin(
            username=admin_username,
            hashed_password=get_password_hash(admin_password),
            email=admin_email,
            is_active=True
        )
        db.add(admin)
        await db.commit()
        logger.info("Initial admin created")
    else:
        logger.info("Admin already exists; skipping")
