import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(e.currentTarget);
    try {
      const user = await login({ identifier: data.get("username"), password: data.get("password") });
      navigate(user.role === "customer" ? "/customer" : user.role === "agent" ? "/agent" : "/admin");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#86c6af] px-4 py-8 transition-colors dark:bg-slate-950">
      <div className="page-container grid w-full max-w-xl overflow-hidden rounded-2xl border border-green-300 bg-white shadow-2xl transition-colors lg:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
        {/* Left Side */}
        <div className="hidden bg-emerald-800 p-7 text-white lg:flex lg:flex-col lg:justify-between dark:bg-emerald-950">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-bold text-emerald-800 dark:bg-emerald-100">
                S
              </div>
              <h1 className="text-2xl font-bold">SyncBot</h1>
            </div>

            <div className="mt-12">
              <h2 className="text-3xl font-bold leading-tight">
                Welcome back to smarter customer support.
              </h2>
              <p className="mt-4 text-sm leading-6 text-emerald-100 dark:text-emerald-200">
                Sign in to manage your support requests, real-time conversations, SLAs, and knowledge base inquiries.
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-emerald-900/40 p-4 border border-emerald-700/50">
            <p className="text-xs leading-5 text-emerald-100">
              🤖 SyncBot AI helps triaging issues, auto-generating ticket titles, and grounding answers with Knowledge Base RAG.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <div className="min-w-0 p-6 sm:p-8">
          <div className="mx-auto max-w-md">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                WELCOME BACK
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                Sign in to SyncBot
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Enter your credentials to continue to your workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300" role="alert">
                  {error}
                </p>
              )}

              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username or email"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
              </div>

              {/* Remember */}
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 accent-emerald-600 dark:border-slate-700"
                />
                <label htmlFor="remember" className="text-xs text-slate-600 dark:text-slate-400">
                  Remember me
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Register link */}
            <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
