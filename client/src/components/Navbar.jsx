import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export default function Navbar() {
  const { isAuthenticated, user, loading } = useAuth();

  return (
    <header className="border-b border-google-grey-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-medium text-google-grey-900">
          Nepal<span className="text-google-blue">Tourism</span>
        </Link>

        {!loading && (
          <nav className="flex items-center gap-4 text-sm">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 text-google-grey-900 hover:text-google-blue"
              >
                {user?.avatar && (
                  <img src={user.avatar} alt="" className="w-7 h-7 rounded-full" />
                )}
                {user?.name}
              </Link>
            ) : (
              <Link
                to="/login"
                className="border border-google-grey-300 rounded-full px-4 py-1.5 hover:shadow-google transition-shadow"
              >
                Sign in
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}