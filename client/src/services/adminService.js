import axiosClient from "../api/axiosClient.js";

export const fetchDashboardStats = async () => {
  const { data } = await axiosClient.get("/admin/stats");
  return data.data;
};