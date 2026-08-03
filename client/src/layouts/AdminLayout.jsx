import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, MapPin, BookOpen, FolderTree, Users } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";

const links = [
  { to: "/admin", end: true, label: "Overview", icon: LayoutDashboard },
  { to: "/admin/destinations", label: "Destinations", icon: MapPin },
  { to: "/admin/blogs", label: "Blogs", icon: BookOpen },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/users", label: "Users", icon: Users, roles: ["admin", "superadmin"] },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
      <aside className="w-56 shrink-0">
        <div className="sticky top-20 rounded-2xl bg-white p-3 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Admin</p>
          <nav className="space-y-1">
            {links
              .filter((l) => !l.roles || l.roles.includes(user?.role))
              .map(({ to, end, label, icon: Icon }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                    }`}>
                  <Icon size={16} /> {label}
                </NavLink>
              ))}
          </nav>
        </div>
      </aside>
      <main className="min-w-0 flex-1"><Outlet /></main>
    </div>
  );
}