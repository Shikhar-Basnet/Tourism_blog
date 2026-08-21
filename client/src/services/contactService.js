import axiosClient from "../api/axiosClient.js";

export const submitContactForm = async (payload) => {
  const { data } = await axiosClient.post("/contact", payload);
  return data;
};

// --- Admin ---
export const fetchContacts = async (params = {}) => {
  const { data } = await axiosClient.get("/contact", { params });
  return data;
};
export const updateContactStatus = async (id, payload) => {
  const { data } = await axiosClient.patch(`/contact/${id}`, payload);
  return data.data;
};
export const deleteContactEnquiry = async (id) => {
  await axiosClient.delete(`/contact/${id}`);
};