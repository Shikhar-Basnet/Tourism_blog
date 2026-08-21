import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import Home from "./pages/Home.jsx";
import Destinations from "./pages/Destinations.jsx";
import Blogs from "./pages/Blogs.jsx";
import BlogDetail from "./pages/BlogDetail.jsx";
import DestinationDetail from "./pages/DestinationDetail.jsx";
import Contact from "./pages/Contact.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import ManageDestinations from "./pages/admin/ManageDestinations.jsx";
import ManageBlogs from "./pages/admin/ManageBlogs.jsx";
import ManageCategories from "./pages/admin/ManageCategories.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageEnquiries from "./pages/admin/ManageEnquiries.jsx";
import { useRecaptcha } from "./hooks/useRecaptcha.js";

const STAFF_ROLES = ["editor", "admin", "superadmin"];

export default function App() {
  useRecaptcha();
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/:slug" element={<BlogDetail />} />
          <Route path="/destinations/:slug" element={<DestinationDetail />} />
          <Route path="/contact" element={<Contact />} />

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
            <Route path="enquiries" element={<ManageEnquiries />} />
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
      </main>

      <Footer />
    </div>
  );
}