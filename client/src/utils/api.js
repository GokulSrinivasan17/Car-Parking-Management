import axios from 'axios';

// Create React App uses REACT_APP_ prefix for environment variables.
// In production, set REACT_APP_API_URL to your backend URL (e.g., https://your-api.onrender.com/api).
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000, // 15 second timeout
});

// ─── Request interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const { token } = JSON.parse(userInfo);
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch (e) {
            // If localStorage is corrupted, ignore silently
            localStorage.removeItem('userInfo');
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ─── Response interceptor: handle global auth errors ─────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid — clear stale session
            localStorage.removeItem('userInfo');
            // Redirect to login only if not already on the login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
