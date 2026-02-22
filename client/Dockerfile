# Frontend Dockerfile
# 1. Build Stage
FROM node:20-slim AS builder
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 2. Production Stage (Nginx)
FROM nginx:alpine

# Nginx 설정 파일 복사 (HTTP only; HTTPS는 nginx-ssl.conf.example 참고)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# SSL 디렉터리 생성 (HTTPS 사용 시 호스트에서 마운트: -v ./client/ssl:/etc/nginx/ssl)
RUN mkdir -p /etc/nginx/ssl

# 빌드 결과물 복사 (Vite 기본 빌드 경로는 dist)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
