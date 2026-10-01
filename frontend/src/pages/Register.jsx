import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const data = new FormData(e.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        name: data.get("fullName"),
        username: data.get("username"),
        email: data.get("email"),
        password: data.get("password"),
      });
      navigate("/customer");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#86c6af] px-4 py-8 transition-colors dark:bg-slate-950">
      <div className="page-container w-full max-w-xl rounded-2xl border border-green-300 bg-white p-6 shadow-2xl transition-colors sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="mx-auto mb-6 max-w-md text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-xl font-bold text-white shadow-md">
            S
          </div>

          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            JOIN SYNCBOT
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            Create your account
          </h1>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Start managing your customer support requests with real-time AI assistance.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-x-5 gap-y-3.5 sm:grid-cols-2">
          {error && (
            <p className="sm:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300" role="alert">
              {error}
            </p>
          )}

          {/* Full Name */}
          <div className="sm:col-span-2">
            <label
              htmlFor="fullName"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

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
              placeholder="Choose a username"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              required
              minLength="6"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              minLength="6"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none transition focus:border-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {/* Information */}
          <div className="sm:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <p className="text-[11px] leading-4 text-emerald-800 dark:text-emerald-300">
              🔐 Your account will be registered as a Customer. Support Agent and Administrator accounts are managed separately.
            </p>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2.5 sm:col-span-2">
            <input
              id="terms"
              type="checkbox"
              required
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 accent-emerald-600 dark:border-slate-700"
            />
            <label htmlFor="terms" className="text-[11px] leading-4 text-slate-600 dark:text-slate-400">
              I agree to the SyncBot terms and conditions and understand that my account will be created as a customer account.
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login */}
        <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
