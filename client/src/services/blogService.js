import axiosClient from "../api/axiosClient.js";

export const fetchBlogs = async (params = {}) => {
  const { data } = await axiosClient.get("/blogs", { params });
  return data;
};

export const fetchBlogBySlug = async (slug) => {
  const { data } = await axiosClient.get(`/blogs/${slug}`);
  return data; // { success, data: blog, relatedPosts, isLikedByCurrentUser }
};

export const toggleBlogLike = async (id) => {
  const { data } = await axiosClient.post(`/blogs/id/${id}/like`);
  return data.data; // { liked, likesCount }
};
export const fetchBlogsAdmin = async (params = {}) => {
  const { data } = await axiosClient.get("/blogs", { params }); // staff can pass ?status=
  return data;
};
export const createBlog = async (fields, imageFile) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
  });
  if (imageFile) form.append("featuredImage", imageFile);

  const { data } = await axiosClient.post("/blogs", form);
  return data.data;
};

export const updateBlog = async (id, fields, imageFile, removeFeaturedImage = false) => {
  const form = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
  });
  if (removeFeaturedImage) form.append("removeFeaturedImage", "true");
  if (imageFile) form.append("featuredImage", imageFile);

  const { data } = await axiosClient.put(`/blogs/id/${id}`, form);
  return data.data;
};

export const deleteBlog = async (id) => {
  await axiosClient.delete(`/blogs/id/${id}`);
};