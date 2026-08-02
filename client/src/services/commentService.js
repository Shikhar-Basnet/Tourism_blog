import axiosClient from "../api/axiosClient.js";

export const fetchComments = async (targetType, targetId) => {
  const { data } = await axiosClient.get("/comments", { params: { targetType, targetId } });
  return data.data;
};

export const createComment = async (targetType, targetId, content) => {
  const { data } = await axiosClient.post("/comments", { targetType, targetId, content });
  return data.data;
};

export const updateComment = async (id, content) => {
  const { data } = await axiosClient.put(`/comments/${id}`, { content });
  return data.data;
}

export const deleteComment = async (id) => {
  await axiosClient.delete(`/comments/${id}`);
};