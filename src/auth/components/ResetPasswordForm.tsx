import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, Mail, Lock } from "lucide-react";
import { customToast } from "@/lib/toastConfig";
import axios from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Step = "email" | "otp" | "password" | "done";

interface ResetPasswordFormProps {
  onStepChange?: (step: Step) => void;
}

const ResetPasswordForm = ({ onStepChange }: ResetPasswordFormProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";
  
  const [step, setStep] = useState<Step>(emailFromUrl ? "otp" : "email");
  const [email, setEmail] = useState(emailFromUrl);

  // Notify parent of step changes
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [errors, setErrors] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize step and email from URL params
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      setStep("otp");
      setResendCountdown(60); // Start countdown if coming from login
    }
  }, [searchParams]);

  // Auto-focus first OTP input when OTP step is shown
  useEffect(() => {
    if (step === "otp" && otpInputRefs.current[0]) {
      otpInputRefs.current[0]?.focus();
    }
  }, [step]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const validateEmail = () => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Email is invalid" }));
      return false;
    }
    setErrors((prev) => ({ ...prev, email: "" }));
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateEmail()) return;

    setSendingOtp(true);
    try {
      await axios.post(
        `${API_BASE_URL}/user/auth/forgot/otp`,
        {
          email: email.trim().toLowerCase(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      customToast.success("Verification code sent to your email");
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      setResendCountdown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Could not send verification code";
      customToast.error(msg);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    try {
      await axios.post(
        `${API_BASE_URL}/user/auth/forgot/otp`,
        {
          email: email.trim().toLowerCase(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      customToast.success("New verification code sent");
      setResendCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      if (otpInputRefs.current[0]) {
        otpInputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      customToast.error(
        err?.response?.data?.message || "Could not resend code"
      );
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Clear error when user types
    if (errors.otp) {
      setErrors((prev) => ({ ...prev, otp: "" }));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setOtp(digits);
    // Focus the last input
    if (otpInputRefs.current[5]) {
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "Please enter the complete 6-digit code" }));
      return;
    }

    setVerifyingOtp(true);
    try {
      // Verify OTP by attempting to proceed to password step
      // The actual verification happens when we submit the password
      setStep("password");
      setErrors((prev) => ({ ...prev, otp: "" }));
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        otp: err?.response?.data?.message || "Invalid verification code",
      }));
    } finally {
      setVerifyingOtp(false);
    }
  };

  const validatePassword = () => {
    let isValid = true;
    const newErrors = { password: "", confirmPassword: "" };

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleResetPassword = async () => {
    if (!validatePassword()) return;

    setIsLoading(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/user/auth/verify/reset/password`,
        {
          email: email.trim().toLowerCase(),
          inputOtp: otp.join(""),
          newPassword: password,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      customToast.success(data?.message || "Password reset successfully");
      setStep("done");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/user/login");
      }, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Could not reset password";
      customToast.error(msg);
      
      // If OTP is invalid/expired, go back to OTP step
      if (/invalid|expired|wrong/i.test(msg)) {
        setStep("otp");
        setOtp(["", "", "", "", "", ""]);
        setErrors((prev) => ({ ...prev, otp: msg }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Email Step */}
      {step === "email" && (
        <>
          <div className="space-y-2">
            <Label
              className="m-0 sm:m-2 text-sm sm:text-md text-gray-500"
              htmlFor="email"
            >
              Email
            </Label>
            <div
              className={`
                group relative flex items-center h-11 sm:h-12 rounded px-3 sm:px-4
                bg-slate-50/50 backdrop-blur
                shadow-inner ring-1 ring-slate-200
                transition-all
                focus-within:ring-2 focus-within:ring-sky-300
                focus-within:shadow-[0_8px_24px_-10px_rgba(2,132,199,0.35)]
                ${errors.email ? "ring-rose-300 focus-within:ring-rose-400" : ""}
              `}
            >
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                disabled={sendingOtp}
                className={`
                  flex-1 bg-transparent border-0 shadow-none
                  focus-visible:ring-0 focus-visible:outline-none
                  placeholder:text-slate-400/80 text-sm sm:text-[15px]
                  ${errors.email ? "text-rose-600" : "text-slate-800"}
                `}
              />
            </div>
            {errors.email && (
              <p className="text-destructive text-xs mt-1 px-1">{errors.email}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp}
            className={`
              bg-blue-500 hover:bg-blue-600 text-white w-full py-2.5 sm:py-2 rounded-md 
              font-semibold text-sm sm:text-base transition-colors
              ${sendingOtp ? "opacity-70 cursor-not-allowed" : ""}
            `}
          >
            {sendingOtp ? "Sending..." : "Send Verification Code"}
          </button>

          <div className="text-center">
            <Link
              to="/user/login"
              className="text-xs sm:text-sm text-slate-500 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        </>
      )}

      {/* OTP Step */}
      {step === "otp" && (
        <>
          <div className="space-y-2">
            <Label className="m-0 sm:m-2 text-sm sm:text-md text-gray-500">
              Enter Verification Code
            </Label>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              We sent a 6-digit code to <span className="font-semibold">{email}</span>
            </p>

            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    otpInputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={index === 0 ? handleOtpPaste : undefined}
                  className={`
                    w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-semibold
                    rounded-lg border-2 transition-all
                    focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400
                    ${errors.otp ? "border-rose-400" : "border-slate-300"}
                    ${digit ? "border-sky-500 bg-sky-50" : "bg-white"}
                  `}
                />
              ))}
            </div>
            {errors.otp && (
              <p className="text-destructive text-xs mt-2 text-center">{errors.otp}</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={verifyingOtp || otp.join("").length !== 6}
            className={`
              bg-blue-500 hover:bg-blue-600 text-white w-full py-2.5 sm:py-2 rounded-md 
              font-semibold text-sm sm:text-base transition-colors
              ${verifyingOtp || otp.join("").length !== 6 ? "opacity-70 cursor-not-allowed" : ""}
            `}
          >
            {verifyingOtp ? "Verifying..." : "Verify Code"}
          </button>

          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-500">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCountdown > 0}
              className={`
                text-blue-600 hover:underline font-medium
                ${resendCountdown > 0 ? "text-slate-400 cursor-not-allowed" : ""}
              `}
            >
              {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend Code"}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp(["", "", "", "", "", ""]);
                setErrors((prev) => ({ ...prev, otp: "" }));
              }}
              className="text-xs sm:text-sm text-slate-500 hover:underline"
            >
              Change Email
            </button>
          </div>
        </>
      )}

      {/* Password Step */}
      {step === "password" && (
        <>
          <div className="space-y-2">
            <Label
              className="m-0 sm:m-2 text-sm sm:text-md text-gray-500"
              htmlFor="password"
            >
              New Password
            </Label>
            <div
              className={`
                group relative flex items-center h-11 sm:h-12 rounded px-3 sm:px-4
                bg-slate-50/50 backdrop-blur
                shadow-inner ring-1 ring-slate-200
                transition-all
                focus-within:ring-2 focus-within:ring-sky-300
                focus-within:shadow-[0_8px_24px_-10px_rgba(2,132,199,0.35)]
                ${errors.password ? "ring-rose-300 focus-within:ring-rose-400" : ""}
              `}
            >
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) {
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }
                }}
                disabled={isLoading}
                className={`
                  flex-1 bg-transparent border-0 shadow-none
                  focus-visible:ring-0 focus-visible:outline-none
                  placeholder:text-slate-400/80 text-sm sm:text-[15px]
                  ${errors.password ? "text-rose-600" : "text-slate-800"}
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-slate-400 hover:text-sky-600 transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <EyeOffIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1 px-1">{errors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              className="m-0 sm:m-2 text-sm sm:text-md text-gray-500"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </Label>
            <div
              className={`
                group relative flex items-center h-11 sm:h-12 rounded px-3 sm:px-4
                bg-slate-50/50 backdrop-blur
                shadow-inner ring-1 ring-slate-200
                transition-all
                focus-within:ring-2 focus-within:ring-sky-300
                focus-within:shadow-[0_8px_24px_-10px_rgba(2,132,199,0.35)]
                ${errors.confirmPassword ? "ring-rose-300 focus-within:ring-rose-400" : ""}
              `}
            >
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) {
                    setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }
                }}
                disabled={isLoading}
                className={`
                  flex-1 bg-transparent border-0 shadow-none
                  focus-visible:ring-0 focus-visible:outline-none
                  placeholder:text-slate-400/80 text-sm sm:text-[15px]
                  ${errors.confirmPassword ? "text-rose-600" : "text-slate-800"}
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-2 text-slate-400 hover:text-sky-600 transition"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <EyeOffIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-destructive text-xs mt-1 px-1">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={isLoading}
            className={`
              bg-blue-500 hover:bg-blue-600 text-white w-full py-2.5 sm:py-2 rounded-md 
              font-semibold text-sm sm:text-base transition-colors
              ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
            `}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Resetting Password</span>
                <span className="animate-pulse">...</span>
              </>
            ) : (
              "Reset Password"
            )}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep("otp");
                setPassword("");
                setConfirmPassword("");
                setErrors((prev) => ({ ...prev, password: "", confirmPassword: "" }));
              }}
              className="text-xs sm:text-sm text-slate-500 hover:underline"
            >
              Back to Verification
            </button>
          </div>
        </>
      )}

      {/* Done Step */}
      {step === "done" && (
        <div className="text-center space-y-4">
          <div className="text-green-600 text-sm sm:text-base font-medium">
            Password reset successfully!
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Redirecting to login page...
          </p>
        </div>
      )}
    </div>
  );
};

export default ResetPasswordForm;

