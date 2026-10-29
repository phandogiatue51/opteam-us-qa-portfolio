import axios from "axios";

const TOKEN_KEY = "opteamus_token";

/** Centralized Axios instance — all API calls go through here */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      // Only redirect if not already on login/register
      if (!window.location.pathname.match(/^\/(login|register)$/)) {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
