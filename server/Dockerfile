# Dockerfile
# 1. Base Image: Python 3.10 Slim
FROM python:3.10-slim

# 2. UV(패키지 매니저) 가져오기 (멀티 스테이지 빌드 활용)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 3. 시스템 패키지 설치 (OpenCV 구동 등)
# uv는 시스템 파이썬 환경을 건드리지 않는 것이 기본이지만, 
# Docker 컨테이너에서는 시스템 환경에 직접 설치하는 것이 일반적입니다.
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 4. 작업 디렉토리 설정
WORKDIR /app

# 5. 의존성 설치
# requirements.txt 복사 및 uv를 이용한 설치
# --system 옵션: 가상환경을 만들지 않고 시스템 파이썬에 직접 설치 (Docker 권장)
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

# 6. 소스 코드 복사
COPY . .

# 7. 포트 노출
EXPOSE 8000

# 8. 실행 명령어
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]