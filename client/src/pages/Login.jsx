import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { googleLoginUrl, facebookLoginUrl, adminLogin } from "../services/authService.js";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const [staffMode, setStaffMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await adminLogin(email, password);
      await refreshUser();
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <Helmet>
        <title>Sign in | Nepal Tourism</title>
      </Helmet>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-google p-8">
        <h1 className="text-2xl font-normal text-google-grey-900 text-center mb-1">Sign in</h1>
        <p className="text-sm text-google-grey-600 text-center mb-6">
          to continue to Nepal Tourism
        </p>

        {!staffMode ? (
          <div className="space-y-3">
            <a
              href={googleLoginUrl}
              className="flex items-center justify-center gap-3 border border-google-grey-300 rounded-full py-2.5 px-4 text-sm font-medium text-google-grey-900 hover:shadow-google transition-shadow"
            >
              Continue with Google
            </a>
            <a
              href={facebookLoginUrl}
              className="flex items-center justify-center gap-3 border border-google-grey-300 rounded-full py-2.5 px-4 text-sm font-medium text-google-grey-900 hover:shadow-google transition-shadow"
            >
              Continue with Facebook
            </a>

            <button
              type="button"
              onClick={() => setStaffMode(true)}
              className="w-full text-center text-xs text-google-grey-600 hover:text-google-blue mt-4"
            >
              Staff login
            </button>
          </div>
        ) : (
          <form onSubmit={handleStaffLogin} className="space-y-4">
            {error && <p className="text-google-red text-sm">{error}</p>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-google-grey-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-google-blue"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-google-grey-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-google-blue"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-google-blue text-white rounded-full py-2.5 text-sm font-medium hover:bg-google-blue-dark transition-colors disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setStaffMode(false)}
              className="w-full text-center text-xs text-google-grey-600 hover:text-google-blue"
            >
              Back to visitor login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}