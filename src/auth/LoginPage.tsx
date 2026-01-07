import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "./components/LoginForm";

const LoginPage = () => {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-6 sm:py-8 lg:py-12">
      {/* --- Container --- */}
      <div className="relative z-10 mx-4 sm:mx-6 lg:mx-8 w-full max-w-6xl rounded-2xl bg-white/80 backdrop-blur-xl shadow-[0_8px_60px_-10px_rgba(56,189,248,0.15)] shadow-blue-500">
        <div className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-2xl">
          {/* --- Left Illustration Panel --- */}
          <div className="relative flex items-center justify-center bg-gradient-to-br from-[#49b8ff] via-[#45a0ff] to-[#3e8aff] p-6 sm:p-8 lg:p-10 order-2 lg:order-1">
            {/* soft glow background */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 sm:-top-20 -left-5 sm:-left-10 h-60 sm:h-72 lg:h-80 w-60 sm:w-72 lg:w-80 rounded-full bg-white/20 blur-2xl sm:blur-3xl" />
              <div className="absolute bottom-5 sm:bottom-10 right-0 h-52 sm:h-64 lg:h-72 w-52 sm:w-64 lg:w-72 rounded-full bg-cyan-100/20 blur-xl sm:blur-2xl" />
            </div>

            <div className="relative flex flex-col items-center justify-center text-center">
              <img
                src="/loginbg.png"
                alt="login image"
                loading="lazy"
                decoding="async"
                sizes="(min-width:1024px) 32rem, (min-width:640px) 28rem, 24rem"
                className="w-full max-w-sm sm:max-w-md lg:max-w-lg scale-[1.16] drop-shadow-[0_10px_25px_rgba(0,0,0,0.15)] transition-transform select-none"
              />
              <p className="mt-4 sm:mt-6 max-w-md text-xs sm:text-sm text-white/90 leading-relaxed tracking-wide px-4">
                Securely monitor, manage, and access your account anytime — the
                smarter way to stay connected.
              </p>
            </div>
          </div>

          {/* --- Right Form Panel --- */}
          <div className="relative bg-white order-1 lg:order-2">
            {/* neon welcome pill */}
            <div className="absolute left-4 sm:left-12 lg:left-24 top-4 sm:top-6 lg:top-8 flex items-center">
              <span className="h-6 sm:h-7 w-4 sm:w-5 rounded-r-md bg-gradient-to-b from-sky-400 to-blue-600" />
              <span className="ml-1 rounded-md bg-gradient-to-r from-sky-500 to-blue-500 px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold text-white shadow-sm">
                Welcome back
              </span>
            </div>

            <div className="flex min-h-full flex-col items-center justify-center px-6 py-8 sm:py-10 lg:py-12 md:px-8 lg:px-12 pt-20 sm:pt-24 lg:pt-12">
              <div className="w-full max-w-sm">
                <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-slate-600">
                  {mode === "login" ? "Login to Account" : "Forgot Password"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-2">
                  {mode === "login"
                    ? "Enter your credentials to continue"
                    : "Enter your email to reset your password"}
                </p>

                <div className="mt-6 sm:mt-8">
                  <LoginForm mode={mode} onModeChange={setMode} />
                </div>

                <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center sm:items-center sm:justify-between gap-3 sm:gap-0 text-xs sm:text-sm">
                  <Link
                    to="/user/register"
                    className="text-blue-600 font-medium hover:underline hover:text-blue-500"
                  >
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Background at the bottom */}
      <div className="absolute bottom-0 left-0 w-full z-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path
            fill="#a2d9ff"
            fillOpacity="0.68"
            d="M0,320L48,293.3C96,267,192,213,288,170.7C384,128,480,96,576,117.3C672,139,768,213,864,240C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
        </svg>
      </div>
    </div>
  );
};

export default LoginPage;
