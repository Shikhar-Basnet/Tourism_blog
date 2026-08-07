import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { PageLoader } from "./LoadingState.jsx";

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <PageLoader title="Checking session" subtitle="Confirming you're signed in before continuing." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/" replace />;
  }

  return children ?? null;
}