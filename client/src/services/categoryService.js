import axiosClient from "../api/axiosClient.js";

export const fetchCategories = async () => {
  const { data } = await axiosClient.get("/categories");
  return data.data;
};