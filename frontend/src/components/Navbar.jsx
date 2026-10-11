import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
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
  const workspaceLabel = user?.role === "agent"
    ? "Agent Workspace"
    : user?.role === "admin"
      ? "Admin Workspace"
      : "My Tickets";

  const navLinkClass = (active) => `rounded-full px-2.5 py-2 text-sm font-semibold transition duration-200 ${
    active
      ? "bg-white/15 text-emerald-200"
      : "text-slate-100 hover:bg-white/10 hover:text-white"
  }`;

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/");
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 bg-[#123b3b]/90 px-3 py-3 backdrop-blur-xl sm:px-5">
      <div className={`mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-2 gap-y-3 border border-emerald-100/25 bg-gradient-to-r from-[#176b61] via-[#245a70] to-[#475477] px-3 py-2.5 text-white shadow-[0_14px_40px_-18px_rgba(15,60,65,.72)] sm:px-4 ${mobileOpen ? "rounded-3xl" : "rounded-full"}`}>
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-1.5" aria-label="SyncBot home">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-xl font-black text-white shadow-lg shadow-emerald-950/30 transition-transform hover:rotate-3 hover:scale-105">S</span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-tight sm:text-xl">Sync<span className="text-emerald-400">Bot</span></span>
              {user && (
                <span className="relative flex h-2 w-2" title={connected ? "Real-time sync active" : "Connecting..."}>
                  {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
                  <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-amber-400"}`} />
                </span>
              )}
            </span>
            <span className="hidden text-[10px] font-medium leading-none text-slate-400 sm:block">Smart Customer Support</span>
          </span>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-0 md:flex">
          <Link to="/" aria-current={isActive("/") ? "page" : undefined} className={navLinkClass(isActive("/"))}>Home</Link>
          <Link to="/about" aria-current={isActive("/about") ? "page" : undefined} className={navLinkClass(isActive("/about"))}>About</Link>
          {!user ? (
            <>
              <Link to="/login" aria-current={isActive("/login") ? "page" : undefined} className={navLinkClass(isActive("/login"))}>Login</Link>
              <Link to="/register" aria-current={isActive("/register") ? "page" : undefined} className={navLinkClass(isActive("/register"))}>Register</Link>
            </>
          ) : (
            <>
              <Link to={`/${user.role}`} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-500">{workspaceLabel}</Link>
              <button type="button" onClick={handleLogout} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Log out</button>
            </>
          )}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          <ThemeToggle className="h-9 w-9 rounded-full border-white/15 bg-white/10 text-white hover:bg-white/20 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20" />
          <Link to="/" aria-label="SyncBot support" title="SyncBot support" className="planet-mark flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-emerald-50 shadow-md transition hover:scale-105 hover:shadow-lg">
            <SupportLogo />
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-slate-200 transition hover:bg-white/10 md:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="flex w-full basis-full flex-col gap-1 border-t border-white/10 pt-3 md:hidden">
            <Link to="/" aria-current={isActive("/") ? "page" : undefined} onClick={() => setMobileOpen(false)} className={navLinkClass(isActive("/"))}>Home</Link>
            <Link to="/about" aria-current={isActive("/about") ? "page" : undefined} onClick={() => setMobileOpen(false)} className={navLinkClass(isActive("/about"))}>About</Link>
            {user ? (
              <>
                <Link to={`/${user.role}`} onClick={() => setMobileOpen(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">{workspaceLabel}</Link>
                <button type="button" onClick={handleLogout} className="rounded-full px-4 py-2 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Log out</button>
              </>
            ) : (
              <>
                <Link to="/login" aria-current={isActive("/login") ? "page" : undefined} onClick={() => setMobileOpen(false)} className={navLinkClass(isActive("/login"))}>Login</Link>
                <Link to="/register" aria-current={isActive("/register") ? "page" : undefined} onClick={() => setMobileOpen(false)} className={navLinkClass(isActive("/register"))}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function SupportLogo() {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <rect width="96" height="96" fill="#E8F7F1" />
      <path d="M4 27C4 15.4 13.4 6 25 6s21 9.4 21 21-9.4 21-21 21h-4L9 57l3-12C7.1 41.2 4 34.6 4 27Z" fill="#65C9A4" />
      <circle cx="18" cy="27" r="2.4" fill="#18352C" /><circle cx="25" cy="27" r="2.4" fill="#18352C" /><circle cx="32" cy="27" r="2.4" fill="#18352C" />
      <path d="M48 15c4-7 12-11 23-11 12 0 22 8 24 19l-5 13c-3 13-12 22-24 24l-24-5-8-17 6-18 8-5Z" fill="#C98C94" />
      <path d="M40 44c0-15 8-25 20-25h11c14 0 23 11 23 26v12c0 14-9 23-22 23H61C48 80 40 70 40 57V44Z" fill="#F4C7B6" />
      <path d="M40 43c0-19 10-31 25-31 12 0 21 7 26 18-9 1-16-3-23-9-4 10-14 16-28 19Z" fill="#C98C94" />
      <path d="M38 45c0-14 9-24 23-24m30 3c5 5 8 12 8 21v5" stroke="#090B10" strokeWidth="5" strokeLinecap="round" />
      <path d="M37 43v14m62-13v14" stroke="#090B10" strokeWidth="6" strokeLinecap="round" />
      <path d="M96 58c-1 9-7 13-17 13" stroke="#090B10" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 48h.1m22 0h.1" stroke="#16191F" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M64 59c3 3 7 3 10 0" stroke="#9A5E5D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M51 79h42l-4 17H48l3-17Z" fill="#E9EAF2" />
      <path d="M44 78h54l-4 18H47l-3-18Z" stroke="#7186D5" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="70" cy="87" r="4" fill="#090B10" />
    </svg>
  );
}

export default Navbar;
