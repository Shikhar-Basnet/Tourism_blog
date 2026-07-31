import axiosClient from "../api/axiosClient.js";

export const fetchCurrentUser = async () => {
  const { data } = await axiosClient.get("/auth/me");
  return data.data;
};

export const adminLogin = async (email, password) => {
  const { data } = await axiosClient.post("/auth/admin/login", { email, password });
  return data.data;
};

export const logoutUser = async () => {
  await axiosClient.post("/auth/logout");
};

// OAuth is a full browser redirect, not an XHR call — the backend sets cookies
// then redirects back to CLIENT_URL, so we just navigate the window.
export const googleLoginUrl = "/api/v1/auth/google";
export const facebookLoginUrl = "/api/v1/auth/facebook";
