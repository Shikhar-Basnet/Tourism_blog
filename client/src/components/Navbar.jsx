import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal.jsx";
import {
  Menu,
  X,
  ChevronRight,
  Home as HomeIcon,
  MapPin,
  BookOpen,
  LayoutDashboard,
  LogIn,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";

const STAFF_ROLES = ["editor", "admin", "superadmin"];
const DURATION = 200;

export default function Navbar() {
  const { isAuthenticated, user, loading, hasRole, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // --- Drawer (mobile menu) state, mirrors the reference's open/visible split
  // so the slide-in transform can animate in on mount instead of popping in ---
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimer = useRef(null);
  const rafRef = useRef(null);
  const drawerRef = useRef(null);
  const hamburgerRef = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  // --- Account dropdown (desktop) + sign-out confirm modal ---
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef(null);

  // --- Auth modal (sign in) ---
  const [authOpen, setAuthOpen] = useState(false);

  const primaryLinks = [
    { href: "/", label: "Home", icon: HomeIcon },
    { href: "/destinations", label: "Destinations", icon: MapPin },
    { href: "/blogs", label: "Blogs", icon: BookOpen },
  ];

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const openDrawer = () => {
    clearTimeout(closeTimer.current);
    cancelAnimationFrame(rafRef.current);
    setOpen(true);
    rafRef.current = requestAnimationFrame(() =>
      requestAnimationFrame(() => setVisible(true))
    );
  };

  const closeDrawer = () => {
    cancelAnimationFrame(rafRef.current);
    setVisible(false);
    closeTimer.current = setTimeout(() => setOpen(false), DURATION);
  };

  const toggleDrawer = () => (open ? closeDrawer() : openDrawer());

  // Close the drawer on every route change
  useEffect(() => {
    if (open) closeDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(
    () => () => {
      clearTimeout(closeTimer.current);
      cancelAnimationFrame(rafRef.current);
    },
    []
  );

  // Tap/click outside the drawer (or its hamburger) closes it
  useEffect(() => {
    if (!open) return;

    const onTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
      if (touchStartY.current === null) return;
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
      touchStartY.current = touchStartX.current = null;
      if (dy > 8 || dx > 8) return; // was a scroll/swipe, not a tap
      if (!drawerRef.current?.contains(e.target) && !hamburgerRef.current?.contains(e.target))
        closeDrawer();
    };
    const onMouseDown = (e) => {
      if (!drawerRef.current?.contains(e.target) && !hamburgerRef.current?.contains(e.target))
        closeDrawer();
    };

    // Small delay avoids the same click that opened the drawer immediately closing it
    const t = setTimeout(() => {
      document.addEventListener("mousedown", onMouseDown);
      document.addEventListener("touchstart", onTouchStart, { passive: true });
      document.addEventListener("touchend", onTouchEnd, { passive: true });
    }, 10);

    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [open]);

  // Account dropdown: close on outside click (same pattern as before)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmSignOut = useCallback(async () => {
    setSigningOut(true);
    try {
      await logout();
      window.location.href = "/";
    } catch {
      setSigningOut(false);
      setConfirmOpen(false);
    }
  }, [logout]);

  const t = `${DURATION}ms ease-in-out`;

  return (
    <>
      <style>{`
        html {
          scroll-padding-top: 68px;
          /* Always reserve room for the vertical scrollbar, even on pages
             short enough not to need one. Without this, navigating between a
             tall page (scrollbar visible) and a short page (scrollbar gone)
             changes the viewport width by ~15px and the whole layout —
             including this sticky navbar — visibly shifts sideways. */
          scrollbar-gutter: stable;
        }
      `}</style>

      {/* Backdrop for the mobile drawer */}
      {open && (
        <div
          aria-hidden="true"
          onMouseDown={closeDrawer}
          onTouchStart={closeDrawer}
          style={{ opacity: visible ? 1 : 0, transition: `opacity ${t}` }}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:hidden"
        />
      )}

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link to="/" className="shrink-0 text-lg font-medium text-gray-900 hover:opacity-75">
            Nepal<span className="text-blue-600">Tourism</span>
          </Link>

          {/* Desktop primary links, centered */}
          <div className="hidden md:absolute md:left-1/2 md:flex md:-translate-x-1/2 md:items-center md:gap-1">
            {primaryLinks.map(({ href, label }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  to={href}
                  className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex-1 md:hidden" />

          {/* Desktop right side: auth. md:ml-auto pushes this to the far right —
              the centered primary links are position:absolute and out of flow,
              and the flex-1 spacer above is mobile-only, so without ml-auto
              here this block would sit right next to the logo on desktop. */}
          {!loading && (
            <div className="hidden items-center gap-3 text-sm md:ml-auto md:flex">
              {isAuthenticated ? (
                <>
                  {hasRole(...STAFF_ROLES) && (
                    <Link
                      to="/admin"
                      className="rounded border border-gray-300 px-4 py-1.5 text-gray-900 transition-shadow hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]"
                    >
                      Admin Panel
                    </Link>
                  )}

                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen((o) => !o)}
                      className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-gray-50"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="h-7 w-7 rounded-full"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-md font-medium text-white">
                          {user?.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="text-gray-900">{user?.name}</span>
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 z-10 mt-2 w-44 rounded border border-gray-200 bg-white py-2 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)]">
                        <div className="truncate px-4 py-2 text-xs text-gray-600">{user?.email}</div>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            setConfirmOpen(true);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="rounded border border-gray-300 px-4 py-1.5 transition-shadow hover:shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]"
                >
                  Sign in
                </button>
              )}
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            ref={hamburgerRef}
            onClick={toggleDrawer}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="relative flex h-9 w-9 items-center justify-center rounded bg-gray-100 active:bg-gray-200 md:hidden"
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                opacity: visible ? 0 : 1,
                transform: visible ? "rotate(90deg) scale(0.6)" : "rotate(0deg) scale(1)",
                transition: `opacity ${t}, transform ${t}`,
              }}
              className="flex items-center justify-center"
            >
              <Menu size={18} />
            </span>
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                opacity: visible ? 1 : 0,
                transform: visible ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.6)",
                transition: `opacity ${t}, transform ${t}`,
              }}
              className="flex items-center justify-center"
            >
              <X size={18} />
            </span>
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div
            ref={drawerRef}
            style={{
              transform: visible ? "translateX(0)" : "translateX(100%)",
              transition: `transform ${t}`,
              boxShadow: "-4px 0 24px rgba(0,0,0,0.18)",
            }}
            className="fixed right-0 top-0 z-50 flex h-full w-[272px] flex-col bg-white md:hidden"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 px-4">
              <span className="pl-1 text-sm font-semibold text-gray-900">Menu</span>
              <button
                onClick={closeDrawer}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 active:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="px-3 pb-1 pt-3">
                <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                  Navigate
                </p>
                {primaryLinks.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <Link
                      key={href}
                      to={href}
                      className={`mb-0.5 flex min-h-[44px] items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-900 hover:bg-gray-100 active:bg-blue-50"
                      }`}
                    >
                      <Icon size={17} className={active ? "text-blue-600" : "text-gray-500"} />
                      <span className="flex-1">{label}</span>
                      {active && <ChevronRight size={14} className="text-blue-600" />}
                    </Link>
                  );
                })}

                {isAuthenticated && hasRole(...STAFF_ROLES) && (
                  <Link
                    to="/admin"
                    className={`mb-0.5 flex min-h-[44px] items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive("/admin")
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-900 hover:bg-gray-100 active:bg-blue-50"
                    }`}
                  >
                    <LayoutDashboard
                      size={17}
                      className={isActive("/admin") ? "text-blue-600" : "text-gray-500"}
                    />
                    <span className="flex-1">Admin Panel</span>
                    {isActive("/admin") && <ChevronRight size={14} className="text-blue-600" />}
                  </Link>
                )}
              </div>
            </div>

            {/* Auth footer */}
            <div className="shrink-0 border-t border-gray-200 px-4 py-3">
              {!loading &&
                (isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="h-9 w-9 rounded-full"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-600 text-xs font-medium text-white">
                        {user?.name?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="truncate text-xs text-gray-600">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => setConfirmOpen(true)}
                      className="shrink-0 rounded px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      closeDrawer();
                      setAuthOpen(true);
                    }}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded border border-gray-300 text-sm font-medium text-gray-900 hover:bg-gray-50"
                  >
                    <LogIn size={16} /> Sign in
                  </button>
                ))}
            </div>
          </div>
        )}
      </header>

      {/* Sign-out confirmation modal (unchanged behavior) */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-[0_1px_3px_0_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)]">
            <h2 className="mb-2 text-lg font-medium text-gray-900">Sign out?</h2>
            <p className="mb-6 text-sm text-gray-600">
              You'll need to sign in again to access your account.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={signingOut}
                className="rounded px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSignOut}
                disabled={signingOut}
                className="min-w-[110px] rounded bg-red-600 px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign-in modal */}
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}