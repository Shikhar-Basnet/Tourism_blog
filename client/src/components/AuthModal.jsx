import { useEffect, useState } from "react";
import { X, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { googleLoginUrl, facebookLoginUrl, adminLogin } from "../services/authService.js";
import { useAuth } from "../hooks/useAuth.js";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#ffffff"
        d="M18 9a9 9 0 1 0-10.4 8.89v-6.29H5.31V9h2.29V7.02c0-2.27 1.35-3.53 3.42-3.53.99 0 2.03.18 2.03.18v2.23h-1.14c-1.13 0-1.48.7-1.48 1.42V9h2.52l-.4 2.6h-2.12v6.29A9 9 0 0 0 18 9z"
      />
    </svg>
  );
}

export default function AuthModal({ isOpen, onClose, redirectTo }) {
  const [staffMode, setStaffMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Tracks which OAuth provider was clicked ("google" | "facebook" | null) so
  // only that button shows a spinner, while the other is simply disabled.
  const [pendingProvider, setPendingProvider] = useState(null);
  const actionPending = pendingProvider !== null;

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

  useEffect(() => {
    if (!isOpen) {
      setStaffMode(false);
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setError("");
      setPendingProvider(null);
    }
  }, [isOpen]);

  const handleOAuthClick = (provider) => (event) => {
    if (actionPending) {
      event.preventDefault();
      return;
    }
    setPendingProvider(provider);
  };

  const handleStaffToggle = () => {
    if (actionPending) return;
    setStaffMode(true);
  };

  const handleStaffLogin = async (event) => {
    event.preventDefault();
    if (submitting) return;

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
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/50 px-4 py-6 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div className="rounded-xl relative w-full max-w-[400px] overflow-hidden  bg-white ring-1 ring-black/5 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        {/* Header */}
        <div className="relative border-b border-gray-100 px-7 pb-6 pt-7">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-5 top-5 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close login"
          >
            <X size={18} />
          </button>

          <div className={`mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded ${staffMode ? "bg-blue-50" : "bg-emerald-50"}`}>
            <ShieldCheck size={22} className={staffMode ? "text-[#1877F2]" : "text-emerald-600"} strokeWidth={1.75} />
          </div>
          <h2 className="text-center text-xl font-semibold tracking-tight text-gray-900">
            {staffMode ? "Staff sign in" : "Welcome back"}
          </h2>
          <p className="mt-1 text-center text-sm text-gray-500">
            {staffMode ? "Sign in as admin" : "Sign in to explore Nepal"}
          </p>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {!staffMode ? (
            <div className="space-y-3">

              <a href={`${googleLoginUrl}?redirect=${encodeURIComponent(resolvedRedirectTo)}`}
                onClick={handleOAuthClick("google")}
                aria-disabled={actionPending}
                className={`group flex w-full items-center justify-center gap-3 rounded border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all ${actionPending
                    ? "pointer-events-none opacity-60"
                    : "hover:border-gray-300 hover:bg-gray-50 hover:shadow active:scale-[0.99]"
                  }`}
              >
                {pendingProvider === "google" ? (
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </a>


              < a href={`${facebookLoginUrl}?redirect=${encodeURIComponent(resolvedRedirectTo)}`}
                onClick={handleOAuthClick("facebook")}
                aria-disabled={actionPending}
                className={`flex w-full items-center justify-center gap-3 rounded bg-[#1877F2] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all ${actionPending
                    ? "pointer-events-none opacity-60"
                    : "hover:bg-[#166FE5] hover:shadow active:scale-[0.99]"
                  }`}
              >
                {pendingProvider === "facebook" ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <FacebookIcon />
                )}
                Continue with Facebook
              </a>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                    or
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStaffToggle}
                disabled={actionPending}
                className="flex w-full items-center justify-center gap-2 rounded border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sign in as staff
              </button>
            </div>
          ) : (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="staff-email" className="block text-xs font-medium text-gray-600">
                  Email
                </label>
                <input
                  id="staff-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  disabled={submitting}
                  className="w-full rounded border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#1877F2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1877F2]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="staff-password" className="block text-xs font-medium text-gray-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="staff-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="*********"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={submitting}
                    className="w-full rounded border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-[#1877F2] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1877F2]/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={submitting}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded bg-[#1877F2] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#166FE5] active:scale-[0.99] active:bg-[#125FCB] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                {submitting ? "Signing in..." : "Sign in"}
              </button>

              <button
                type="button"
                onClick={() => setStaffMode(false)}
                disabled={submitting}
                className="w-full text-center text-xs font-medium text-gray-500 transition-colors hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                ← Back to visitor login
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/60 px-7 py-3.5">
          <p className="text-center text-[11px] leading-relaxed text-gray-400">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}