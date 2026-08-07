import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Home from "./pages/Home.jsx";
import Destinations from "./pages/Destinations.jsx";
import Blogs from "./pages/Blogs.jsx";
import BlogDetail from "./pages/BlogDetail.jsx";
import DestinationDetail from "./pages/DestinationDetail.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import ManageDestinations from "./pages/admin/ManageDestinations.jsx";
import ManageBlogs from "./pages/admin/ManageBlogs.jsx";
import ManageCategories from "./pages/admin/ManageCategories.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";

const STAFF_ROLES = ["editor", "admin", "superadmin"];

export default function App() {

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
    <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/destinations" element={<Destinations />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/blogs/:slug" element={<BlogDetail />} />
        <Route path="/destinations/:slug" element={<DestinationDetail />} />

        {/* Staff-only admin area — one guard on the layout route protects
            every nested page, so individual admin pages don't need their
            own ProtectedRoute wrapper. */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={STAFF_ROLES}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="destinations" element={<ManageDestinations />} />
          <Route path="blogs" element={<ManageBlogs />} />
          <Route path="categories" element={<ManageCategories />} />
          {/* Users list is superadmin/admin-only at the API level (getUsers),
              role changes are superadmin-only (updateUserRole) — ManageUsers
              itself adapts what it renders based on currentUser.role, and the
              link is already hidden from non-superadmins in AdminLayout. */}
          <Route
            path="users"
            element={
              <ProtectedRoute roles={["admin", "superadmin"]}>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<div className="p-10 text-center">404 - Page not found</div>} />
      </Routes>
    </>
  );
}