
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../Hooks/useAuth.js";
import Loading from "../components/Loading/Loading.jsx";
import ShowToast from "../components/Showtoast/Showtoast.jsx";

const Register = () => {

  const { loading, handleRegister } = useAuth();
  const Navigate = useNavigate();

  // Password Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  // Handle Form Submission
  const submitHandler = async (e) => {
    e.preventDefault();

    // Email Regex
    const emailRegex =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Email Validation
    if (!emailRegex.test(email.trim())) {
      setToast({
        message: "Please enter a valid email address.",
        type: "error",
      });
      return;
    }

    // Password Validation
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setToast({
        message: "Password must be at least 8 characters and no more than 72 UTF-8 bytes.",
        type: "error",
      });
      return;
    }

    // Confirm Password
    if (password !== confirmPassword) {
      setToast({
        message: "Passwords do not match.",
        type: "error",
      });
      return;
    }

    // Terms Validation
    if (!agreeTerms) {
      setToast({
        message: "Please agree to the Terms & Conditions.",
        type: "warning",
      });
      return;
    }

    // Register Request
    try {
      await handleRegister({
        username: username.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });

      setToast({
        message: "Your account has been created successfully!",
        type: "success",
      });

      setTimeout(() => {
        Navigate("/");
      }, 1800);

    } catch (error) {
      console.error("Registration Error:", error);

      setToast({
        message: error.message || "Registration failed. Please try again.",
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
            Create Account
          </h2>

          <p className="text-sm text-gray-500">
            Create your account to get started
          </p>

        </div>

        {/* Register Form */}
        <form
          onSubmit={submitHandler}
          className="space-y-4"
        >

          {/* Full Name */}
          <div>

            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-semibold text-gray-800"
            >
              Full Name
            </label>

            <input
              id="fullName"
              type="text"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your full name"
              autoComplete="name"
              required
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
            />

          </div>

          {/* Email */}
          <div>

            <label
              htmlFor="registerEmail"
              className="mb-1.5 block text-sm font-semibold text-gray-800"
            >
              Email Address
            </label>

            <input
              id="registerEmail"
              type="text"
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
              htmlFor="registerPassword"
              className="mb-1.5 block text-sm font-semibold text-gray-800"
            >
              Password
            </label>

            <div className="relative">

              <input
                id="registerPassword"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>

            </div>

            <p className="mt-1.5 text-xs text-gray-500">
              Use at least 8 characters. Passwords must be no more than 72 UTF-8 bytes.
            </p>

          </div>

          {/* Confirm Password */}
          <div>

            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-semibold text-gray-800"
            >
              Confirm Password
            </label>

            <div className="relative">

              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 pr-10 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((prev) => !prev)
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>

            </div>

          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start gap-2 pt-1">

            <input
              type="checkbox"
              id="agreeTerms"
              name="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-black focus:ring-black"
            />

            <label
              htmlFor="agreeTerms"
              className="cursor-pointer text-xs leading-5 text-gray-600"
            >
              I agree to the{" "}

              <Link
                to="/terms"
                className="font-semibold text-gray-900 hover:underline"
              >
                Terms & Conditions
              </Link>{" "}

              and{" "}

              <Link
                to="/privacy"
                className="font-semibold text-gray-900 hover:underline"
              >
                Privacy Policy
              </Link>.

            </label>

          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full cursor-pointer rounded-lg bg-[#121316] px-4 py-3 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create Account
          </button>

        </form>

        {/* Sign In Link */}
        <div className="mt-6 border-t border-gray-100 pt-4 text-center">

          <p className="text-xs text-gray-500">
            Already have an account?{" "}

            <Link
              to="/login"
              className="font-bold text-gray-900 hover:underline"
            >
              Sign In
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

export default Register;
