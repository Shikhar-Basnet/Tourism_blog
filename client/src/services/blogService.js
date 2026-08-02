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