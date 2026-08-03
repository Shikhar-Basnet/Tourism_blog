import axiosClient from "../api/axiosClient.js";

export const fetchCategories = async () => {
  const { data } = await axiosClient.get("/categories");
  return data.data;
};
export const createCategory = async (payload) => {
  const { data } = await axiosClient.post("/categories", payload);
  return data.data;
};
export const updateCategory = async (id, payload) => {
  const { data } = await axiosClient.put(`/categories/id/${id}`, payload);
  return data.data;
};
export const deleteCategory = async (id) => {
  await axiosClient.delete(`/categories/id/${id}`);
};