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
    <div className="flex min-h-screen items-center justify-center bg-green-200 px-4 py-4">

      <div className="page-container grid w-full max-w-3xl overflow-hidden border-2 border-slate-200 bg-white shadow-2xl lg:grid-cols-2">

        {/* Left Side */}
        <div className="hidden bg-green-800 p-7 text-white lg:flex lg:flex-col lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl font-bold text-green-800">
                S
              </div>

              <h1 className="text-2xl font-bold">
                SyncBot
              </h1>

            </div>

            <div className="mt-12">

              <h2 className="text-3xl font-bold leading-tight">
                Welcome back to smarter customer support.
              </h2>

              <p className="mt-4 text-sm leading-6 text-green-100">
                Sign in to manage your support requests, conversations, and
                tickets with SyncBot.
              </p>

            </div>

          </div>

          <div className="rounded-xl bg-green-900/30 p-4">

            <p className="text-sm leading-6 text-green-100">
              🤖 SyncBot AI can help support agents analyze tickets and
              provide intelligent recommendations.
            </p>

          </div>

        </div>

        {/* Login Form */}
        <div className="min-w-0 p-5 sm:p-7">

          <div className="mx-auto max-w-md">

            <div className="mb-5">

              <p className="text-sm font-semibold text-green-800">
                WELCOME BACK
              </p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                Sign in to SyncBot
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter your credentials to continue.
              </p>

            </div>

            <form onSubmit={handleSubmit} className="space-y-3">

              {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

              {/* Username */}
              <div>

                <label
                  htmlFor="username"
                  className="mb-1 block text-xs font-semibold text-gray-700"
                >
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />

              </div>

              {/* Password */}
              <div>

                <div className="mb-1 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-gray-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-xs font-medium text-green-600 hover:text-green-700"
                  >
                    Forgot password?
                  </button>

                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                />

              </div>

              {/* Remember */}
              <div className="flex items-center gap-2">

                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 accent-green-600"
                />

                <label
                  htmlFor="remember"
                  className="text-xs text-gray-600"
                >
                  Remember me
                </label>

              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-green-700 hover:shadow-xl"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>

            </form>

            {/* Register */}
            <p className="mt-4 text-center text-xs text-gray-600">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-green-600 hover:text-green-700"
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