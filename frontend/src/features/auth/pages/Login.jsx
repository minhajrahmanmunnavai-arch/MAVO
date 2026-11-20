
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../Hooks/useAuth.js";
import Loading from "../components/Loading/Loading.jsx";
import ShowToast from "../components/Showtoast/Showtoast.jsx";

const Login = () => {

  const { loading, handleLogin } = useAuth();
  const Navigate = useNavigate();
  const location = useLocation();

  // Password Visibility
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Toast State
  const [toast, setToast] = useState(null);

  // Form Submit Handler
  const submitHandler = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    // Email Validation
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(cleanEmail)) {
      setToast({
        message: "Please enter a valid email address.",
        type: "error",
      });
      return;
    }

    // Password Validation
    if (!password.trim()) {
      setToast({
        message: "Please enter your password.",
        type: "warning",
      });
      return;
    }

    // Login Request
    try {
      await handleLogin({
        email: cleanEmail,
        password,
      });

      setToast({
        message: "Login successful! Welcome back.",
        type: "success",
      });

      setTimeout(() => {
        const from = location.state?.from;
        const destination = from
          ? `${from.pathname || "/"}${from.search || ""}${from.hash || ""}`
          : "/";
        Navigate(destination, { replace: true });
      }, 1500);

    } catch (error) {
      console.error("Login Error:", error);

      setToast({
        message: error.message || "Login failed. Please check your credentials.",
        type: "error",
      });
    }
  };

  // Loading
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">

      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-2xl">

        {/* Header */}
        <div className="mb-6 text-center">

          <Link to="/" className="inline-block">
            <h1 className="mb-1 text-2xl font-serif font-bold tracking-wide text-gray-900">
              Lumina<span className="text-amber-500">.</span>
            </h1>
          </Link>

          <h2 className="mb-2 text-2xl font-serif font-bold tracking-wide text-gray-900">
            Welcome Back
          </h2>

          <p className="text-sm font-normal text-gray-500">
            Sign in with your email address and password
          </p>

        </div>

        {/* Login Form */}
        <form
          onSubmit={submitHandler}
          className="space-y-4"
        >

          {/* Email */}
          <div>

            <label
              htmlFor="signInEmail"
              className="mb-1.5 block text-sm font-semibold text-gray-800"
            >
              Email Address
            </label>

            <input
              id="signInEmail"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.vance@example.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
            />

          </div>

          {/* Password */}
          <div>

            <label
              htmlFor="signInPassword"
              className="mb-1.5 block text-sm font-semibold text-gray-800"
            >
              Password
            </label>

            <div className="relative">

              <input
                id="signInPassword"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>

            </div>

          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between pt-1">

            <div className="flex items-center space-x-2">

              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-black focus:ring-black"
              />

              <label
                htmlFor="rememberMe"
                className="cursor-pointer select-none text-xs text-gray-600"
              >
                Remember me
              </label>

            </div>

            <Link
              to="/forgot-password"
              className="cursor-pointer text-xs font-semibold text-gray-900 hover:underline"
            >
              Forgot password?
            </Link>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full cursor-pointer rounded-lg bg-[#121316] px-4 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Sign In
          </button>

        </form>

        {/* Create Account */}
        <div className="mt-6 border-t border-gray-100 pt-4 text-center">

          <p className="text-xs text-gray-500">
            Don't have an account yet?{" "}

            <Link
              to="/register"
              className="cursor-pointer font-bold text-gray-900 hover:underline"
            >
              Create Account
            </Link>

          </p>

        </div>

        {/* Back to Home */}
        <div className="mt-5 text-center">

          <Link
            to="/"
            className="text-xs text-gray-500 transition-colors hover:text-gray-900"
          >
            ← Back to Home
          </Link>

        </div>

      </div>

      {/* Toast Notification */}
      {toast && (
        <ShowToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={3000}
        />
      )}

    </div>
  );
};

export default Login;
