import axiosClient from "../api/axiosClient.js";

export const fetchUsers = async (params = {}) => {
  const { data } = await axiosClient.get("/admin/users", { params });
  return data;
};
export const updateUserRole = async (id, role) => {
  const { data } = await axiosClient.patch(`/admin/users/${id}/role`, { role });
  return data.data;
};
export const toggleUserActive = async (id) => {
  const { data } = await axiosClient.patch(`/admin/users/${id}/status`);
  return data.data;
};