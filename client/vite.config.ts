import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true, // Docker 컨테이너 외부 접속 허용
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://face-reco-server-dev:8000',
        changeOrigin: true,
      }
    },
    watch: {
      usePolling: true, // Docker 볼륨 마운트 시 파일 변경 감지 최적화
    },
  },
})

