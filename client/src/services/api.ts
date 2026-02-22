import axios from 'axios';

/** Axios instance for API; baseURL points to FastAPI backend (proxied in dev). */
const api = axios.create({
    baseURL: '/api/v1',
});

/** Injects JWT from localStorage into every request so protected routes receive the Bearer token. */
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
