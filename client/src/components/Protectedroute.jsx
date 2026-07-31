import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

// Usage:
//   <Route element={<ProtectedRoute />}><Route path="/profile" element={<Profile />} /></Route>
//   <Route element={<ProtectedRoute roles={['admin','superadmin']} />}><Route path="/admin" .../></Route>
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, hasRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-10 text-center text-google-grey-600">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <div className="p-10 text-center text-google-red">You don't have access to this page.</div>;
  }

  return children ?? null;
}