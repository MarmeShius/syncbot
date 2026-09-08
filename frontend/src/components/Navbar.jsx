import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-emerald-100 bg-[#fbfcfa]/95 backdrop-blur">
      <div className="page-container flex min-h-20 items-center justify-between gap-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-xl font-bold text-white shadow-md shadow-emerald-900/15">
            S
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950">
              Sync<span className="text-emerald-700">Bot</span>
            </h1>

            <p className="hidden text-xs text-gray-500 sm:block">
              Smart Customer Support
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-7 md:flex">

          <Link
            to="/"
            className={`font-medium transition ${
              isActive("/")
                ? "text-emerald-700"
                  : "text-slate-600 hover:text-emerald-700"
            }`}
          >
            Home
          </Link>

          <Link
            to="/about"
            className={`font-medium transition ${
              isActive("/about")
                ? "text-emerald-700"
                  : "text-slate-600 hover:text-emerald-700"
            }`}
          >
            About Us
          </Link>

          {!user && <>
            <Link
              to="/login"
              className={`font-medium transition ${
                isActive("/login")
                  ? "text-emerald-700"
                    : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              Login
            </Link>

            <Link
              to="/register"
              className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-800 hover:shadow-lg"
            >
              Register
            </Link>
          </>}

          {user && <>
            <Link
              to={`/${user.role}`}
              className="rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-800 hover:shadow-lg"
            >
              {user.role === "agent" ? "Agent Workspace" : user.role === "admin" ? "Admin Workspace" : "My Tickets"}
            </Link>
            <button
              type="button"
              onClick={() => { logout(); navigate("/"); }}
              className="font-medium text-slate-600 transition hover:text-emerald-700"
            >
              Log out
            </button>
          </>}

        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg border border-slate-200 p-2 text-slate-700 md:hidden"
        >
          {mobileOpen ? "×" : "☰"}
        </button>

      </div>
      {mobileOpen && <div className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
        <div className="page-container flex flex-col gap-4 py-1 text-sm font-semibold text-slate-700">
          <Link className="hover:text-emerald-700" onClick={() => setMobileOpen(false)} to="/">Home</Link>
          <Link className="hover:text-emerald-700" onClick={() => setMobileOpen(false)} to="/about">About Us</Link>
          {user ? <Link className="hover:text-emerald-700" onClick={() => setMobileOpen(false)} to={`/${user.role}`}>{user.role === "agent" ? "Agent Workspace" : user.role === "admin" ? "Admin Workspace" : "My Tickets"}</Link> : <Link className="hover:text-emerald-700" onClick={() => setMobileOpen(false)} to="/login">Login</Link>}
        </div>
      </div>}
    </nav>
  );
}

export default Navbar;
