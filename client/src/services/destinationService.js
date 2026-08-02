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

// NOTE: do NOT set a manual "Content-Type" header here. Axios needs to
// generate its own multipart boundary for FormData — overriding the header
// strips that boundary and the backend (multer) silently receives an empty
// body, which looks like every field failing "required" validation.
export const updateDestination = async (id, fields, imageFiles = [], removeImages = []) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  });
  if (removeImages.length) form.append("removeImages", JSON.stringify(removeImages));
  imageFiles.forEach((file) => form.append("images", file));

  const { data } = await axiosClient.put(`/destinations/id/${id}`, form);
  return data.data;
};

export const createDestination = async (fields, imageFiles = []) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  });
  imageFiles.forEach((file) => form.append("images", file));

  const { data } = await axiosClient.post("/destinations", form);
  return data.data;
};

export const deleteDestination = async (id) => {
  await axiosClient.delete(`/destinations/id/${id}`);
};