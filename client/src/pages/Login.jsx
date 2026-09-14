import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://exam-hall-allotment-api.onrender.com/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    // ============================================================
    // FRONTEND VALIDATION
    // ============================================================

    if (!username.trim()) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // ============================================================
      // CALL BACKEND LOGIN API
      // ============================================================

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      // ============================================================
      // LOGIN FAILED
      // ============================================================

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid username or password."
        );
      }

      // ============================================================
      // LOGIN SUCCESS
      // ============================================================

      console.log("Login successful:", data);

      // Save logged-in admin information
      localStorage.setItem(
        "admin",
        JSON.stringify(data.data)
      );

      // Go to dashboard
      navigate("/admin");

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">

      <div className="flex min-h-screen flex-col lg:flex-row">

        {/* =====================================================
            LEFT SIDE
        ====================================================== */}

        <section className="relative flex min-h-[50vh] w-full items-center overflow-hidden bg-blue-700 px-8 py-20 text-white sm:px-12 lg:min-h-screen lg:w-[55%] lg:px-20">

          {/* Decorative circles */}

          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-600 opacity-60" />

          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-800 opacity-60" />

          <div className="absolute bottom-20 right-20 h-32 w-32 rounded-full border border-blue-400 opacity-30" />


          {/* Logo */}

          <div className="absolute left-6 top-6 z-10">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-2xl ring-4 ring-blue-100">

              <span className="text-xl font-extrabold text-blue-700">
                AVS
              </span>

            </div>

          </div>


          {/* Content */}

          <div className="relative z-10 max-w-2xl">

            <div className="mb-6 h-1 w-16 rounded-full bg-blue-300" />

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-blue-200">
              Welcome to
            </p>

            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
              AVS College of
              <br />
              Arts & Science
            </h1>

            <p className="mt-5 text-lg font-medium text-blue-100 sm:text-xl">
              Salem, Tamil Nadu
            </p>

            <div className="my-8 h-px w-full max-w-md bg-blue-400/50" />

            <h2 className="text-2xl font-bold sm:text-3xl">
              Exam Hall Allotment
            </h2>

            <p className="mt-2 text-xl font-medium text-blue-100 sm:text-2xl">
              Management System
            </p>

            <p className="mt-6 max-w-xl text-base leading-8 text-blue-100 sm:text-lg">
              A centralized examination management platform designed
              to simplify student management, examination scheduling,
              hall allocation arrangements.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">

              <div className="rounded-full border border-blue-400/50 bg-blue-600/40 px-4 py-2 text-sm text-blue-100">
                Smart Allotment
              </div>
            

              <div className="rounded-full border border-blue-400/50 bg-blue-600/40 px-4 py-2 text-sm text-blue-100">
                Exam Management
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}

        <section className="flex min-h-[50vh] w-full items-center justify-center bg-white px-6 py-16 sm:px-12 lg:min-h-screen lg:w-[45%] lg:px-16">

          <div className="w-full max-w-xl">

            <div className="mb-10">

              <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
                Administration Portal
              </p>

              <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                Welcome back
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-500">
                Sign in to access the Exam Hall Allotment Management System.
              </p>

            </div>


            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form
              onSubmit={handleLogin}
              className="space-y-7"
            >

              {/* USERNAME */}

              <div>

                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Username
                </label>

                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  disabled={loading}
                  className="h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-5 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>


              {/* PASSWORD */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-14 w-full rounded-xl border border-slate-300 bg-slate-50 px-5 text-base text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>


              {/* ERROR MESSAGE */}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}


              {/* REMEMBER ME */}

              <div className="flex items-center">

                <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-600">

                  <input
                    type="checkbox"
                    className="h-5 w-5 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  Remember me

                </label>

              </div>


              {/* SIGN IN */}

              <button
                type="submit"
                disabled={loading}
                className="relative z-10 h-14 w-full cursor-pointer rounded-xl bg-blue-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>

            </form>


            {/* BOTTOM */}

            <div className="mt-12 border-t border-slate-200 pt-6">

              <p className="text-center text-sm text-slate-400">
                Authorized personnel only
              </p>

              <p className="mt-2 text-center text-xs text-slate-400">
                © 2026 AVS College of Arts & Science
              </p>

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Login;
