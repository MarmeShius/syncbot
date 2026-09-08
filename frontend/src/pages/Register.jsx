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
    <div className="flex min-h-screen items-center justify-center bg-green-200 px-4 py-4">

      <div className="page-container w-full max-w-xl border-2 border-slate-200 bg-white p-5 shadow-2xl sm:p-7">

        {/* Header */}
        <div className="mx-auto mb-5 max-w-2xl text-center">

          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-green-800 text-xl font-bold text-white shadow-lg">
            S
          </div>

          <p className=" text-sm font-semibold text-green-800">
            JOIN SYNCBOT
          </p>

          <h1 className="mt-1 text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
            Create your account
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Start managing your customer support requests with SyncBot.
          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid gap-x-5 gap-y-3 sm:grid-cols-2"
        >

          {error && <p className="sm:col-span-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</p>}

          {/* Full Name */}
          <div className="sm:col-span-2">

            <label
              htmlFor="fullName"
              className="mb-1 block text-xs font-semibold text-gray-700"
            >
              Full Name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-green-800 focus:ring-4 focus:ring-green-100"
            />

          </div>

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
              placeholder="Choose a username"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-green-800 focus:ring-4 focus:ring-green-100"
            />

          </div>

          {/* Email */}
          <div>

            <label
              htmlFor="email"
              className="mb-1 block text-xs font-semibold text-gray-700"
            >
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />

          </div>

          {/* Password */}
          <div>

            <label
              htmlFor="password"
              className="mb-1 block text-xs font-semibold text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />

          </div>

          {/* Confirm Password */}
          <div>

            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-xs font-semibold text-gray-700"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
            />

          </div>

          {/* Information */}
          <div className="sm:col-span-2 border-2 border-green-200 bg-green-50 p-3">

            <p className="text-xs leading-4 text-purple-800">
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
              className="mt-1 h-4 w-4 rounded border-gray-300 accent-green-600"
            />

            <label
              htmlFor="terms"
              className="text-xs leading-4 text-gray-600"
            >
              I agree to the SyncBot terms and conditions and understand that
              my account will be created as a customer account.
            </label>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="sm:col-span-2 w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-green-700 hover:shadow-xl"
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

        </form>

        {/* Login */}
        <p className="mt-4 text-center text-xs text-gray-600">

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