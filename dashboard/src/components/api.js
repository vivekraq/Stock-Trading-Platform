import axios from "axios";

export const FRONTEND_URL =
  process.env.REACT_APP_FRONTEND_URL || "http://localhost:3000";

// Configure axios to send cookies with requests for authentication
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3002",
  withCredentials: true, // This is crucial for sending cookies with requests
});

// Add request interceptor to handle authentication
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // User is not authenticated, redirect to login
      console.log("Authentication required, redirecting to login...");
      window.location.href = `${FRONTEND_URL}/login`;
    }
    return Promise.reject(error);
  }
);

export default api;
