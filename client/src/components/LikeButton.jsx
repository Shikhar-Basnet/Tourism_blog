import { Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import AuthModal from "./AuthModal.jsx";

// toggleFn: (id) => Promise<{ liked, likesCount }>
// queryKeyToInvalidate: the react-query key for the page this button lives on
export default function LikeButton({ targetId, liked, likesCount, toggleFn, queryKeyToInvalidate }) {
  const { isAuthenticated, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const canLike = isAuthenticated && hasRole("user");
  const isStaffViewing = isAuthenticated && !hasRole("user");

  const mutation = useMutation({
    mutationFn: () => toggleFn(targetId),
    onSuccess: (nextState) => {
      queryClient.setQueriesData({ queryKey: queryKeyToInvalidate }, (currentData) => {
        if (!currentData) return currentData;

        return {
          ...currentData,
          isLikedByCurrentUser: nextState.liked,
          data: currentData.data ? { ...currentData.data, likesCount: nextState.likesCount } : currentData.data,
        };
      });
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    if (!canLike) return;
    mutation.mutate();
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={mutation.isPending || isStaffViewing}
        title={isStaffViewing ? "Administrators are not allowed to like content" : undefined}
        className={`flex items-center gap-2 rounded border px-4 py-2 text-sm transition-colors ${
          liked
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-gray-300 text-gray-900 hover:bg-gray-50"
        } ${isStaffViewing ? "cursor-not-allowed opacity-50" : ""}`}
      >
        <Heart size={16} fill={liked ? "currentColor" : "none"} />
        {likesCount} Like{likesCount === 1 ? "" : "s"}
      </button>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={location.pathname + location.search}
      />
    </>
  );
}