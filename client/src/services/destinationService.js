import axiosClient from "../api/axiosClient.js";

export const fetchDestinations = async (params = {}) => {
  const { data } = await axiosClient.get("/destinations", { params });
  return data;
};

export const fetchDestinationBySlug = async (slug) => {
  const { data } = await axiosClient.get(`/destinations/${slug}`);
  return data;
};
