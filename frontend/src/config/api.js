import axios from "axios";

// Helper to get token safely
const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

// Base URL from env or default
export const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

// Create Axios Instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Add Token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Authorization header
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Errors
api.interceptors.response.use(
  (response) => response.data, // Return data directly
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error || // Sometimes backend sends { error: "msg" }
      error.message ||
      "Something went wrong";

    // Optional: Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      // Avoid redirect loops on login page
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        // localStorage.removeItem("token");
        // window.location.href = "/login";
      }
    }

    return Promise.reject({ message, status: error.response?.status });
  }
);

// Unified Request Helper
export const apiRequest = async (
  url,
  method = "GET",
  data = null,
  config = {},
  params = {}
) => {
  try {
    const response = await api({
      url,
      method,
      data,
      params,
      ...config,
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export default api;
