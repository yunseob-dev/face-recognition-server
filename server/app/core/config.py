from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    MODEL_PATH: str

    DATABASE_URL: str

    FACE_MATCH_THRESHOLD: float = 0.70
    FACE_IMAGE_DIR: str = "face_images"
    DETECTION_MODEL_PATH: str = "app/resources/face_detection_yunet_2023mar.onnx"
    DETECTION_SCORE_THRESHOLD: float = 0.9
    DETECTION_NMS_THRESHOLD: float = 0.3

    LOG_LEVEL: str = "INFO"
    LOG_FILE_PATH: str = "logs/server.log"

    # JWT Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # SuperUser
    SUPERUSER_ID: str
    SUPERUSER_PASSWORD: str
    SUPERUSER_EMAIL: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )
    

settings = Settings()