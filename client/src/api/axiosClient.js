import axios from "axios";

// Centralized axios instance. Auth interceptors (refresh token, etc.)
// get added here in Phase 2 without touching call sites.
const axiosClient = axios.create({
  baseURL: "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default axiosClient;
