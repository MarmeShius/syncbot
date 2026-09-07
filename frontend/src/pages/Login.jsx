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
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-indigo-50 py-10 sm:py-16">

      <div className="page-container grid overflow-hidden border-2 border-slate-200 bg-white shadow-2xl lg:grid-cols-2">

        {/* Left Side */}
        <div className="hidden bg-purple-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-bold text-purple-600">
                S
              </div>

              <h1 className="text-2xl font-bold">
                SyncBot
              </h1>

            </div>

            <div className="mt-20">

              <h2 className="text-4xl font-bold leading-tight">
                Welcome back to smarter customer support.
              </h2>

              <p className="mt-6 leading-7 text-purple-100">
                Sign in to manage your support requests, conversations, and
                tickets with SyncBot.
              </p>

            </div>

          </div>

          <div className="rounded-2xl bg-purple-700 p-6">

            <p className="text-sm leading-6 text-purple-100">
              🤖 SyncBot AI can help support agents analyze tickets and
              provide intelligent recommendations.
            </p>

          </div>

        </div>

        {/* Login Form */}
        <div className="min-w-0 p-6 sm:p-12">

          <div className="mx-auto max-w-md">

            <div className="mb-8">

              <p className="font-semibold text-purple-600">
                WELCOME BACK
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Sign in to SyncBot
              </h2>

              <p className="mt-2 text-gray-500">
                Enter your credentials to continue.
              </p>

            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

              {/* Username */}
              <div>

                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />

              </div>

              {/* Password */}
              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    className="text-sm font-medium text-purple-600 hover:text-purple-700"
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
                  className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
                />

              </div>

              {/* Remember */}
              <div className="flex items-center gap-2">

                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 accent-purple-600"
                />

                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600"
                >
                  Remember me
                </label>

              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-purple-600 py-3.5 font-semibold text-white shadow-lg transition hover:bg-purple-700 hover:shadow-xl"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>

            </form>

            {/* Register */}
            <p className="mt-8 text-center text-sm text-gray-600">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-semibold text-purple-600 hover:text-purple-700"
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