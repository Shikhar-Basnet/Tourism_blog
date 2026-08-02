import axiosClient from "../api/axiosClient.js";

export const fetchDestinations = async (params = {}) => {
  const { data } = await axiosClient.get("/destinations", { params });
  return data;
};

export const fetchDestinationBySlug = async (slug) => {
  const { data } = await axiosClient.get(`/destinations/${slug}`);
  return data; // { success, data: destination, isLikedByCurrentUser }
};

export const fetchDestinationFilters = async () => {
  const { data } = await axiosClient.get("/destinations/meta/filters");
  return data.data; // { provinces, categories }
};

export const toggleDestinationLike = async (id) => {
  const { data } = await axiosClient.post(`/destinations/id/${id}/like`);
  return data.data; // { liked, likesCount }
};