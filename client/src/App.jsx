import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

// As pages grow (Destinations list, Blog, etc.) add routes here.
// Once this file gets long, split into src/routes/AppRoutes.jsx.
export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* Any logged-in user (Google/Facebook OAuth) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Staff only — RBAC in action */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["editor", "admin", "superadmin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<div className="p-10 text-center">404 - Page not found</div>} />
      </Routes>
    </>
  );
}