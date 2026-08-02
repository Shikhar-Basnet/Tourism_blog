import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Destinations from "./pages/Destinations.jsx";
import Blogs from "./pages/Blogs.jsx";
import BlogDetail from "./pages/BlogDetail.jsx";
import DestinationDetail from "./pages/DestinationDetail.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

// As pages grow (Destinations list, etc.) add routes here.
// Once this file gets long, split into src/routes/AppRoutes.jsx.
export default function App() {
  // Guards against the browser's back-forward cache (bfcache): after a full
  // page reload (e.g. our logout flow), pressing Back can restore the PREVIOUS
  // page from an in-memory snapshot without re-running any JS — meaning a
  // signed-out user could visually see a stale, already-invalid /admin view
  // for a moment. event.persisted === true means "this is a bfcache restore,
  // not a real navigation" — force a real reload so auth state is re-verified.
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/login" element={<Login />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:slug" element={<BlogDetail />} />
        <Route path="/destinations/:slug" element={<DestinationDetail />} />

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