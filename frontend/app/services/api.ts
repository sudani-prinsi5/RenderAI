import axios from "axios";

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
export const API_BASE = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor to handle FormData seamlessly by deleting explicit Content-Type so Axios sets multipart/form-data with boundary
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

export default api;