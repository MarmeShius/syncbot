import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { useSocket } from "../context/useSocket";
import ThemeToggle from "./ThemeToggle";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-emerald-100 bg-[#fbfcfa]/95 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-900/95">
      <div className="page-container flex min-h-20 items-center justify-between gap-4 px-4 sm:gap-6 md:justify-center md:gap-16 lg:gap-24">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-xl font-bold text-white shadow-md shadow-emerald-900/15">
            S
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                Sync<span className="text-emerald-700 dark:text-emerald-400">Bot</span>
              </h1>
              {user && (
                <span
                  title={connected ? "Real-time sync active" : "Connecting..."}
                  className="flex h-2 w-2 relative"
                >
                  {connected && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  )}
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      connected ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                  />
                </span>
              )}
            </div>

            <p className="hidden text-xs text-gray-500 sm:block dark:text-gray-400">
              Smart Customer Support
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            to="/"
            className={`font-medium transition ${
              isActive("/")
                ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            }`}
          >
            Home
          </Link>

          <Link
            to="/about"
            className={`font-medium transition ${
              isActive("/about")
                ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
            }`}
          >
            About Us
          </Link>


          {!user && (
            <>
              <Link
                to="/login"
                className={`font-medium transition ${
                  isActive("/login")
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
                }`}
              >
                Login
              </Link>

              <Link
                to="/register"
                className={`font-medium transition ${
                  isActive("/register")
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
                }`}
              >
                Register
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                to={`/${user.role}`}
                className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-800 hover:shadow-lg dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                {user.role === "agent"
                  ? "Agent Workspace"
                  : user.role === "admin"
                  ? "Admin Workspace"
                  : "My Tickets"}
              </Link>
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="font-medium text-slate-600 transition hover:text-emerald-700 dark:text-slate-300 dark:hover:text-emerald-400"
              >
                Log out
              </button>
            </>
          )}

          {/* Theme Toggle Button */}
          <ThemeToggle />
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg border border-slate-200 p-2 text-slate-700 dark:border-slate-800 dark:text-slate-200"
          >
            {mobileOpen ? "×" : "☰"}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="page-container flex flex-col gap-4 py-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" onClick={() => setMobileOpen(false)} to="/">
              Home
            </Link>
            <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" onClick={() => setMobileOpen(false)} to="/about">
              About Us
            </Link>
            {user ? (
              <>
                <Link
                  className="hover:text-emerald-700 dark:hover:text-emerald-400"
                  onClick={() => setMobileOpen(false)}
                  to={`/${user.role}`}
                >
                  {user.role === "agent"
                    ? "Agent Workspace"
                    : user.role === "admin"
                    ? "Admin Workspace"
                    : "My Tickets"}
                </Link>
                <button
                  type="button"
                  className="text-left hover:text-emerald-700 dark:hover:text-emerald-400"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                    navigate("/");
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" onClick={() => setMobileOpen(false)} to="/login">
                  Login
                </Link>
                <Link className="hover:text-emerald-700 dark:hover:text-emerald-400" onClick={() => setMobileOpen(false)} to="/register">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
