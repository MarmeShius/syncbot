import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-gray-950 text-white">

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4">

        {/* Brand */}
        <div className="md:col-span-2">

          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-xl font-bold">
              S
            </div>

            <h2 className="text-2xl font-bold">
              Sync<span className="text-purple-400">Bot</span>
            </h2>
          </div>

          <p className="max-w-md leading-7 text-gray-400">
            SyncBot is an AI-powered customer support and ticket management
            platform designed to help businesses manage customer issues,
            conversations, and support requests efficiently.
          </p>

        </div>

        {/* Quick Links */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Quick Links
          </h3>

          <div className="flex flex-col gap-3 text-gray-400">

            <Link
              to="/"
              className="transition hover:text-white"
            >
              Home
            </Link>

            <Link
              to="/about"
              className="transition hover:text-white"
            >
              About Us
            </Link>

            <Link
              to="/login"
              className="transition hover:text-white"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="transition hover:text-white"
            >
              Register
            </Link>

          </div>
        </div>

        {/* Features */}
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Features
          </h3>

          <ul className="space-y-3 text-gray-400">
            <li>AI Ticket Analysis</li>
            <li>Ticket Management</li>
            <li>Customer Support</li>
            <li>Role-Based Access</li>
          </ul>
        </div>

      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-6 py-5 text-sm text-gray-500 sm:flex-row">

          <p>
            © 2026 SyncBot. All rights reserved.
          </p>

          <p>
            AI-Powered Customer Support
          </p>

        </div>

      </div>

    </footer>
  );
}

export default Footer;