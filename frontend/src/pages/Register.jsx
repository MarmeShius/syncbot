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
      await register({ name: data.get("fullName"), username: data.get("username"), email: data.get("email"), password: data.get("password") });
      navigate("/customer");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-indigo-50 py-10 sm:py-16">

      <div className="page-container max-w-4xl border-2 border-slate-200 bg-white p-7 shadow-2xl sm:p-12 lg:p-16">

        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-purple-600 text-2xl font-bold text-white shadow-lg">
            S
          </div>

          <p className="mt-6 font-semibold text-purple-600">
            JOIN SYNCBOT
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight text-gray-900 sm:text-5xl">
            Create your account
          </h1>

          <p className="mt-3 text-gray-500">
            Start managing your customer support requests with SyncBot.
          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid gap-x-8 gap-y-7 sm:grid-cols-2"
        >

          {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

          {/* Full Name */}
          <div className="sm:col-span-2">

            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Full Name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            />

          </div>

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
              placeholder="Choose a username"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            />

          </div>

          {/* Email */}
          <div>

            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            />

          </div>

          {/* Password */}
          <div>

            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-gray-700"
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
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            />

          </div>

          {/* Confirm Password */}
          <div>

            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold text-gray-700"
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
              className="w-full rounded-xl border border-gray-300 px-4 py-3.5 outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-100"
            />

          </div>

          {/* Information */}
          <div className="sm:col-span-2 border-2 border-purple-200 bg-purple-50 p-5">

            <p className="text-sm leading-6 text-purple-800">
              🔐 Your account will be registered as a Customer. Support Agent
              and Administrator accounts are managed separately.
            </p>

          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 sm:col-span-2">

            <input
              id="terms"
              type="checkbox"
              required
              className="mt-1 h-4 w-4 rounded border-gray-300 accent-purple-600"
            />

            <label
              htmlFor="terms"
              className="text-sm leading-6 text-gray-600"
            >
              I agree to the SyncBot terms and conditions and understand that
              my account will be created as a customer account.
            </label>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 w-full rounded-lg bg-purple-600 py-3 font-semibold text-white shadow-lg transition hover:bg-purple-700 hover:shadow-xl"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

        </form>

        {/* Login */}
        <p className="mt-8 text-center text-sm text-gray-600">

          Already have an account?{" "}

          <Link
            to="/login"
            className="font-semibold text-purple-600 hover:text-purple-700"
          >
            Sign in
          </Link>

        </p>

      </div>

    </div>
  );
}

export default Register;