import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { fetchDashboardStats } from "../../services/adminService.js";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-3xl font-normal text-gray-900">{value}</p>
    </div>
  );
}

export default function AdminOverview() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useQuery({ queryKey: ["admin", "stats"], queryFn: fetchDashboardStats });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-normal text-gray-900">Admin Dashboard</h1>
      <p className="mb-8 text-gray-600">Signed in as {user?.name} ({user?.role})</p>

      {isLoading && <p className="text-gray-600">Loading stats...</p>}
      {isError && <p className="text-red-600">Couldn't load stats: {error?.message || "unknown error"}</p>}

      {data && (
        <>
          <div className="mb-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total Destinations" value={data.totalDestinations} />
            <StatCard label="Total Blogs" value={data.totalBlogs} />
            <StatCard label="Total Likes" value={data.totalLikes} />
            <StatCard label="Total Comments" value={data.totalComments} />
            <StatCard label="Featured Destinations" value={data.featuredDestinations} />
            <StatCard label="Total Users" value={data.totalUsers} />
            <StatCard label="Staff Accounts" value={data.usersByRole.editor + data.usersByRole.admin + data.usersByRole.superadmin} />
            <StatCard label="Visitor Accounts" value={data.usersByRole.user} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
              <h2 className="mb-4 text-base font-medium text-gray-900">Recently added destinations</h2>
              {data.recentDestinations.length === 0 ? <p className="text-sm text-gray-600">None yet.</p> : (
                <ul className="divide-y divide-gray-100">
                  {data.recentDestinations.map((d) => (
                    <li key={d._id} className="flex justify-between py-2 text-sm">
                      <span className="text-gray-900">{d.title}</span>
                      <span className="text-gray-600">{d.province}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
              <h2 className="mb-4 text-base font-medium text-gray-900">Recent comments</h2>
              {data.recentComments.length === 0 ? <p className="text-sm text-gray-600">None yet.</p> : (
                <ul className="space-y-3">
                  {data.recentComments.map((c) => (
                    <li key={c._id} className="text-sm">
                      <p className="text-gray-900">
                        <span className="font-medium">{c.author?.name || "Unknown"}</span>{" "}
                        <span className="text-gray-600">on {c.targetType.toLowerCase()} "{c.targetId?.title || "deleted"}:"</span>
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-gray-600 italic">{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}