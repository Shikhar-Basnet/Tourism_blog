import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { fetchComments, createComment, updateComment, deleteComment } from "../services/commentService.js";
import AuthModal from "./AuthModal.jsx";
import { CommentSkeleton } from "./LoadingState.jsx";

export default function CommentSection({ targetType, targetId }) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [content, setContent] = useState("");
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const location = useLocation();

  const queryKey = ["comments", targetType, targetId];

  const { data: comments, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchComments(targetType, targetId),
  });

  useEffect(() => {
    setVisibleCount(5);
    setEditingCommentId(null);
    setEditingContent("");
  }, [targetType, targetId]);

  const addMutation = useMutation({
    mutationFn: () => createComment(targetType, targetId, content),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, value }) => updateComment(id, value),
    onSuccess: () => {
      setEditingCommentId(null);
      setEditingContent("");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const canComment = isAuthenticated && hasRole("user");
  const isStaffViewing = isAuthenticated && !hasRole("user");
  const sortedComments = [...(comments ?? [])].sort((a, b) => {
    const aIsOwn = a.author?._id === user?.id;
    const bIsOwn = b.author?._id === user?.id;

    if (aIsOwn && !bIsOwn) return -1;
    if (!aIsOwn && bIsOwn) return 1;

    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  const totalComments = sortedComments.length;
  const visibleComments = sortedComments.slice(0, visibleCount);
  const hasMoreComments = totalComments > visibleCount;
  const userCommentCount = comments?.filter((comment) => comment.author?._id === user?.id).length ?? 0;
  const reachedCommentLimit = canComment && userCommentCount >= 5;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() || reachedCommentLimit) return;
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    addMutation.mutate();
  };

  const handleLoadMore = () => {
    if (!hasMoreComments || isLoadingMore) return;

    setIsLoadingMore(true);
    window.setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 5, totalComments));
      setIsLoadingMore(false);
    }, 250);
  };

  const handleSaveEdit = (commentId) => {
    const trimmed = editingContent.trim();
    if (!trimmed) return;

    updateMutation.mutate({ id: commentId, value: trimmed });
  };

  const requestDeleteComment = (commentId) => {
    setPendingDeleteCommentId(commentId);
  };

  const confirmDeleteComment = () => {
    if (!pendingDeleteCommentId) return;

    deleteMutation.mutate(pendingDeleteCommentId);
    setPendingDeleteCommentId(null);
  };

  return (
    <section className="mt-8">
      <h2 className="mb-2 text-lg font-medium text-gray-900">
        Comments {comments ? `(${totalComments})` : ""}
      </h2>

      {canComment ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            disabled={reachedCommentLimit}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={addMutation.isPending || !content.trim() || reachedCommentLimit}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-sm text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {addMutation.isPending ? "Posting..." : "Post comment"}
            </button>
            {reachedCommentLimit ? (
              <span className="text-sm text-red-600">
                You’ve reached the maximum of 5 comments for this post.
              </span>
            ) : (
              <span className="text-sm text-gray-600">
                Up to 5 comments per visitor on each post.
              </span>
            )}
          </div>
        </form>
      ) : isStaffViewing ? (
        <p className="mb-6 text-sm text-red-600">
          Administrators are not allowed to leave comments. Please sign in with a visitor account to comment.
        </p>
      ) : (
        <p className="mb-6 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="text-blue-600 hover:underline"
          >
            Sign in
          </button>{" "}
          with Google or Facebook to leave a comment.
        </p>
      )}

      {isLoading && (
        <div className="mb-4 space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CommentSkeleton key={index} />
          ))}
        </div>
      )}

      {!isLoading && (
        <ul className="space-y-2">
        {visibleComments.map((comment) => {
          const canEdit = user && user.id === comment.author?._id;
          const canDelete = canEdit;
          const isEditing = editingCommentId === comment._id;

          return (
            <li key={comment._id} className="flex gap-3 border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              {comment.author?.avatar ? (
                <img
                  src={comment.author.avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 flex-shrink-0 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 font-bold">
                  {comment.author?.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{comment.author?.name}</span>
                  <span className="text-xs text-gray-600">
                    {new Date(comment.createdAt).toLocaleDateString()}
                    {comment.isEdited && " (edited)"}
                  </span>
                </div>
                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment._id)}
                        disabled={updateMutation.isPending || !editingContent.trim()}
                        className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingContent("");
                        }}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm text-gray-900">{comment.content}</p>
                )}
              </div>
              {canDelete && !isEditing && (
                <div className="flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCommentId(comment._id);
                      setEditingContent(comment.content);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit your comment
                  </button>
                  <button
                    onClick={() => requestDeleteComment(comment._id)}
                    disabled={deleteMutation.isPending}
                    className="text-gray-600 hover:text-red-600"
                    title="Delete comment"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </li>
          );
        })}
        </ul>
      )}

      {hasMoreComments && (
        <div className="mt-4">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-60"
          >
            {isLoadingMore ? "Loading more comments..." : `Load more comments (${totalComments - visibleCount} remaining)`}
          </button>
        </div>
      )}

      {comments?.length === 0 && (
        <p className="text-sm text-gray-600">No comments yet, be the first one.</p>
      )}

      {pendingDeleteCommentId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900">Delete comment?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This action cannot be undone. The comment will be removed permanently.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteCommentId(null)}
                disabled={deleteMutation.isPending}
                className="rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteComment}
                disabled={deleteMutation.isPending}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={location.pathname + location.search}
      />
    </section>
  );
}