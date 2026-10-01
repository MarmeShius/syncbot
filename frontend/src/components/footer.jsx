import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white transition-colors dark:border-slate-800 dark:bg-black">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-4 md:gap-10">
        {/* Brand */}
        <div className="md:col-span-2">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-xl font-bold">
              S
            </div>

            <h2 className="text-2xl font-bold">
              Sync<span className="text-emerald-500">Bot</span>
            </h2>
          </div>

          <p className="max-w-md text-sm leading-7 text-slate-400 sm:text-base">
            SyncBot is an AI-powered customer support and ticket management
            platform designed to help businesses manage customer issues,
            real-time conversations, SLAs, and knowledge base inquiries efficiently.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
            Quick Links
          </h3>

          <div className="flex flex-col gap-2.5 text-sm text-slate-400">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <Link to="/about" className="transition hover:text-white">
              About Us
            </Link>
            <Link to="/kb" className="transition hover:text-white">
              Knowledge Base
            </Link>
            <Link to="/login" className="transition hover:text-white">
              Login
            </Link>
            <Link to="/register" className="transition hover:text-white">
              Register
            </Link>
          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
            Core Features
          </h3>

          <ul className="space-y-2.5 text-sm text-slate-400">
            <li>AI Ticket Triaging & Title Suggestion</li>
            <li>Real-Time Socket.IO Synchronization</li>
            <li>SLA Tracking & Breach Monitoring</li>
            <li>Automatic Least-Loaded Assignment</li>
            <li>Knowledge Base RAG Grounding</li>
            <li>Customer Satisfaction (CSAT)</li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-slate-900 dark:border-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:justify-between sm:gap-3 sm:px-6 sm:text-sm">
          <p>© 2026 SyncBot. All rights reserved.</p>
          <p className="text-emerald-500 font-medium">Smart &amp; Real-time AI Support Operations</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;