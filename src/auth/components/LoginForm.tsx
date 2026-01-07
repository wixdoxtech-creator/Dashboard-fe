import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon, Mail, Lock } from "lucide-react";
import { customToast } from "../../lib/toastConfig";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import axios from "axios";
import { Checkbox } from "@/components/ui/checkbox";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface LoginFormProps {
  mode: "login" | "forgot";
  onModeChange: (mode: "login" | "forgot") => void;
}

const LoginForm = ({ mode, onModeChange }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showResetOtpModal, setShowResetOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Forgot-password (reset) flow state
  const [resetStep, setResetStep] = useState<"otp" | "newpass" | "done">("otp");
  const [resetOtp, setResetOtp] = useState("");
  const [newResetPassword, setNewResetPassword] = useState("");
  const [sendingForgot, setSendingForgot] = useState(false);
  const [verifyingReset, setVerifyingReset] = useState(false);
  const [resetResendIn, setResetResendIn] = useState(0);

  const handleForgotClick = async () => {
    // basic email validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      customToast.error("Please enter a valid email first.");
      return;
    }

    setSendingForgot(true);
    try {
      await axios.post(
        `${API_BASE_URL}/user/auth/forgot/otp`,
        {
          email: email.trim().toLowerCase(),
        },
        { headers: { "Content-Type": "application/json" } }
      );

      customToast.success("If an account exists, a code was sent.");
      // open modal, reset step/state, start resend cooldown
      setShowResetOtpModal(true);
      setResetStep("otp");
      setResetOtp("");
      setNewResetPassword("");
      setResetResendIn(60);
      } catch (err: any) {
        const msg = err?.response?.data?.message || "Could not send OTP.";
        customToast.error(msg);
      } finally {
        setSendingForgot(false);
      }
  };

  const handleResendResetOtp = async () => {
    if (resetResendIn > 0) return;
    try {
      await axios.post(
        `${API_BASE_URL}/user/auth/forgot/otp`,
        {
          email: email.trim().toLowerCase(),
        },
        { headers: { "Content-Type": "application/json" } }
      );
      customToast.success("New code sent.");
      setResetResendIn(60);
    } catch (err: any) {
      customToast.error(
        err?.response?.data?.message || "Could not resend code."
      );
    }
  };

  // const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const handleSaveNewPassword = async () => {
    // if (!strongPwd.test(newResetPassword)) {
    //   customToast.error("Password too weak. Use 8+ chars with Aa1#.");
    //   return;
    // }

    setVerifyingReset(true);
    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/user/auth/verify/reset/password`,
        {
          email: email.trim().toLowerCase(),
          inputOtp: resetOtp, // IMPORTANT: your backend expects `inputOtp`
          newPassword: newResetPassword,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      customToast.success(data?.message || "Password updated. Please log in.");
      setResetStep("done");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Could not update password.";
      customToast.error(msg);
      if (/invalid|expired/i.test(msg)) {
        // bounce back to OTP entry if code is wrong/expired
        setResetStep("otp");
      }
    } finally {
      setVerifyingReset(false);
    }
  };

  useEffect(() => {
    if (!showResetOtpModal || resetResendIn <= 0) return;
    const id = setInterval(
      () => setResetResendIn((s) => (s > 0 ? s - 1 : 0)),
      1000
    );
    return () => clearInterval(id);
  }, [showResetOtpModal, resetResendIn]);

  const handleResetOtpContinue = () => {
    if (!/^\d{6}$/.test(resetOtp)) {
      customToast.error("Enter the 6-digit code.");
      return;
    }
    setResetStep("newpass");
  };

  const validate = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login(email, password);

      // If login successful and verified
      customToast.success("Login successful. Welcome back!");
    } catch (error: any) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message || "Login failed";

      if (status === 403 && error.response?.data?.isVerified === false) {
        customToast.warning(message);
        setShowOtpModal(true);
      } else {
        customToast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      customToast.error("Please enter the full 6-digit OTP.");
      return;
    }

    setVerifyingOtp(true);

    try {
      // Verify OTP
      await axios.post(`${API_BASE_URL}/user/verify-otp`, {
        email,
        otp,
      });

      customToast.success("Email verified successfully!");

      // Close modal
      setShowOtpModal(false);

      // Auto-login after verification
      try {
        await login(email, password);
        customToast.success("Logged in successfully after verification!");
      } catch (loginErr) {
        customToast.error("Login failed after verification. Please try again.");
      }
    } catch (err: any) {
      customToast.error(
        err.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <>
      <form
        onSubmit={mode === "login" ? handleSubmit : (e) => e.preventDefault()}
        className="space-y-4 sm:space-y-5"
      >
        {/* Email */}
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
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || sendingForgot}
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

        {/* Password - only in login mode */}
        {mode === "login" && (
          <div className="space-y-2">
            <Label
              className="m-0 sm:m-2 text-sm sm:text-md text-gray-500"
              htmlFor="password"
            >
              Password
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              <p className="text-destructive text-xs mt-1 px-1">
                {errors.password}
              </p>
            )}
          </div>
        )}

        {/* Remember Me / Forgot Password Toggle */}
        {mode === "login" && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                className="h-4 w-4 rounded border-gray-300 text-legal focus:ring-legal"
              />
              <Label
                htmlFor="remember"
                className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
              >
                Remember me
              </Label>
            </div>
            <button
              type="button"
              onClick={() => onModeChange("forgot")}
              className="text-xs sm:text-sm text-slate-500 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
        )}

        {/* Forgot password actions in forgot mode */}
        {mode === "forgot" && (
          <div className="space-y-2">
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              We&apos;ll send a 6-digit code to this email to reset your
              password.
            </p>
            <button
              type="button"
              onClick={handleForgotClick}
              disabled={sendingForgot || !email}
              className={`bg-blue-500 hover:bg-blue-600 text-white w-full py-2.5 sm:py-2 rounded-md font-semibold text-sm sm:text-base transition-colors ${
                sendingForgot ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {sendingForgot ? "Sending..." : "Send reset code"}
            </button>
            <button
              type="button"
              onClick={() => onModeChange("login")}
              className="w-full text-xs sm:text-sm text-slate-500 hover:underline mt-1"
            >
              Back to login
            </button>
          </div>
        )}

        {/* Submit Button - login mode only */}
        {mode === "login" && (
          <button
            type="submit"
            className={`bg-blue-500 hover:bg-blue-600 text-white w-full py-2.5 sm:py-2 rounded-md font-semibold text-sm sm:text-base transition-colors ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Signing in</span>
                <span className="animate-pulse">...</span>
              </>
            ) : (
              "Sign In"
            )}
          </button>
        )}
      </form>

      {/* OTP Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify your Email</DialogTitle>
            <DialogDescription>
              Please enter the 6-digit OTP sent to your email.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[...Array(6)].map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>

            <button
              onClick={handleVerifyOtp}
              disabled={verifyingOtp}
              className="w-full bg-blue-600 text-white rounded-md px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {verifyingOtp ? "Verifying..." : "Verify OTP"}
            </button>

            {/* <button
              disabled={resendCountdown > 0 || resendingOtp}
              onClick={handleResendOtp}
              className="text-sm text-blue-500 disabled:text-gray-400"
            >
              {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
            </button> */}
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot OTP Modal */}
      <Dialog
        open={showResetOtpModal}
        onOpenChange={(v) => {
          setShowResetOtpModal(v);
          if (!v) {
            // reset state when closing
            setResetStep("otp");
            setResetOtp("");
            setNewResetPassword("");
            setResetResendIn(0);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resetStep === "otp" && "Verify Forgot Password OTP"}
              {resetStep === "newpass" && "Set New Password"}
              {resetStep === "done" && "All set!"}
            </DialogTitle>
            <DialogDescription>
              {resetStep === "otp" && (
                <>
                  Enter the 6-digit code sent to <b>{email || "your email"}</b>.
                </>
              )}
              {resetStep === "newpass" &&
                "Choose a strong password you haven't used before."}
              {resetStep === "done" &&
                "Your password was updated. Log in with your new password."}
            </DialogDescription>
          </DialogHeader>

          {resetStep === "otp" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <InputOTP maxLength={6} value={resetOtp} onChange={setResetOtp}>
                <InputOTPGroup>
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>

              <button
                onClick={handleResetOtpContinue}
                className="w-full bg-blue-600 text-white rounded-md px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
                disabled={resetOtp.length !== 6}
              >
                Continue
              </button>

              <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                <span>Didn’t receive it?</span>
                <button
                  type="button"
                  onClick={handleResendResetOtp}
                  disabled={resetResendIn > 0 || sendingForgot}
                  className="text-blue-600 disabled:text-gray-400"
                >
                  Resend {resetResendIn > 0 ? `in ${resetResendIn}s` : ""}
                </button>
              </div>
            </div>
          )}

          {resetStep === "newpass" && (
            <div className="space-y-3 py-2">
              <Label htmlFor="newpass">New Password</Label>
              <Input
                id="newpass"
                type="password"
                value={newResetPassword}
                onChange={(e) => setNewResetPassword(e.target.value)}
                placeholder="Min 8 chars, use Aa1#"
              />
              <button
                onClick={handleSaveNewPassword}
                disabled={verifyingReset}
                className="w-full bg-blue-600 text-white rounded-md px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {verifyingReset ? "Saving..." : "Save New Password"}
              </button>
            </div>
          )}

          {resetStep === "done" && (
            <div className="space-y-3 py-2">
              <p className="text-green-600">Password updated successfully.</p>
              <button
                type="button"
                onClick={() => setShowResetOtpModal(false)}
                className="w-full border rounded-md px-4 py-2"
              >
                Close
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LoginForm;
