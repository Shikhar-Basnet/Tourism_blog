import { useAuth } from "../hooks/useAuth.js";

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto mt-16 max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
      {user?.avatar && <img src={user.avatar} alt={user.name} className="mx-auto mb-4 h-16 w-16 rounded" />}
      <h1 className="text-xl font-medium text-gray-900">{user?.name}</h1>
      <p className="text-sm text-gray-600">{user?.email}</p>
      <p className="mt-2 inline-block rounded bg-gray-100 px-3 py-1 text-xs text-gray-600">
        Role: {user?.role}
      </p>
      <button
        onClick={logout}
        className="mt-6 block w-full rounded border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Sign out
      </button>
    </div>
  );
}