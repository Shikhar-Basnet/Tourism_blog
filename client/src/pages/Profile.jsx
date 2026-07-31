import { useAuth } from "../hooks/useAuth.js";

export default function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-2xl shadow-google p-8 text-center">
      {user?.avatar && (
        <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full mx-auto mb-4" />
      )}
      <h1 className="text-xl font-medium text-google-grey-900">{user?.name}</h1>
      <p className="text-google-grey-600 text-sm">{user?.email}</p>
      <p className="text-xs text-google-grey-600 mt-2 inline-block bg-google-grey-100 rounded-full px-3 py-1">
        Role: {user?.role}
      </p>
      <button
        onClick={logout}
        className="block w-full mt-6 border border-google-grey-300 rounded-full py-2 text-sm font-medium hover:bg-google-grey-50"
      >
        Sign out
      </button>
    </div>
  );
}