import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { googleLoginUrl, facebookLoginUrl, adminLogin } from "../services/authService.js";
import { useAuth } from "../hooks/useAuth.js";

export default function AuthModal({ isOpen, onClose, redirectTo }) {
  const [staffMode, setStaffMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedRedirectTo = redirectTo || `${location.pathname}${location.search}` || "/";

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleStaffLogin = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const loggedInUser = await adminLogin(email, password);
      setUser(loggedInUser);
      onClose?.();

      const isStaff = ["editor", "admin", "superadmin"].includes(loggedInUser.role);
      navigate(isStaff ? "/admin" : resolvedRedirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 px-4 py-6">
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-600 hover:bg-gray-50"
          aria-label="Close login"
        >
          <X size={18} />
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-normal text-gray-900">Sign in</h2>
          <p className="mt-1 text-sm text-gray-600">to continue on this page</p>
        </div>

        {!staffMode ? (
          <div className="space-y-3">
            <a
              href={`${googleLoginUrl}?redirect=${encodeURIComponent(resolvedRedirectTo)}`}
              className="flex items-center justify-center gap-3 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-900 transition-shadow hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]"
            >
              Continue with Google
            </a>
            <a
              href={`${facebookLoginUrl}?redirect=${encodeURIComponent(resolvedRedirectTo)}`}
              className="flex items-center justify-center gap-3 rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-900 transition-shadow hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]"
            >
              Continue with Facebook
            </a>
            <button
              type="button"
              onClick={() => setStaffMode(true)}
              className="mt-2 w-full text-center text-xs text-gray-600 hover:text-blue-600"
            >
              Staff login
            </button>
          </div>
        ) : (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setStaffMode(false)}
              className="w-full text-center text-xs text-gray-600 hover:text-blue-600"
            >
              Back to visitor login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}