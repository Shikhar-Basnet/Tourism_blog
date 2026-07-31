import { useAuth } from "../hooks/useAuth.js";

// This is a placeholder confirming RBAC works end-to-end.
// Real CRUD panels (Destinations, Blogs, Users, Media, etc.) are built in Phase 8.
export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <h1 className="text-2xl font-normal text-google-grey-900 mb-2">Admin Dashboard</h1>
      <p className="text-google-grey-600 mb-6">
        Signed in as {user?.name} ({user?.role})
      </p>
      <div className="bg-white rounded-2xl shadow-google p-6 text-google-grey-600">
        Content management modules (Destinations, Blogs, Categories, Reviews, Users, Media) plug
        in here in Phase 8.
      </div>
    </div>
  );
}