import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
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
import { customToast } from "@/lib/toastConfig";
import { Checkbox } from "@/components/ui/checkbox";
import { Country, State } from "country-state-city";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    phone: "",
    country: "IN",
    state: "",
    pin_code: "",
    address: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [registeredEmail, _setRegisteredEmail] = useState("");
  const [resendCountdown, setResendCountdown] = useState(120);
  const [resendingOtp, setResendingOtp] = useState(false);

  const [allCountries, _setAllCountries] = useState(Country.getAllCountries());
  const [allStates, setAllStates] = useState<
    ReturnType<typeof State.getStatesOfCountry>
  >([]);

  useEffect(() => {
    const states = formData.country
      ? State.getStatesOfCountry(formData.country)
      : [];
    setAllStates(states);
    setFormData((fd) => ({ ...fd, state: "" }));
  }, [formData.country]);

  useEffect(() => {
    let timer: any;
    if (showOtpModal && resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown, showOtpModal]);

  const validate = () => {
    const newErrors: any = {};
    let isValid = true;

    for (const key in formData) {
      if (!formData[key as keyof typeof formData]) {
        newErrors[key] = `${key.replace("_", " ")} is required`;
        isValid = false;
      }
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const countryCode = useMemo(() => {
    const code = Country.getCountryByCode(formData.country)?.phonecode;
    return code ? `+${code}` : "";
  }, [formData.country]);

  const countryName = useMemo(() => {
    return Country.getCountryByCode(formData.country)?.name ?? "";
  }, [formData.country]);

  const stateName = useMemo(() => {
    if (!formData.state || !formData.country) return "";
    return (
      State.getStateByCodeAndCountry(formData.state, formData.country)?.name ??
      ""
    );
  }, [formData.state, formData.country]);

  const buildFullPhone = (cc: string, local: string) => {
    const digits = (local || "").replace(/\D/g, "");
    const prefix = cc.startsWith("+") ? cc : `+${cc}`;
    return `${prefix}${digits}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);

    try {
      const fullPhone = buildFullPhone(countryCode, formData.phone);
      const payload = {
        ...formData,
        country: countryName,
        state: stateName,
        phone: fullPhone,
      };

      const response = await axios.post(`${API_BASE_URL}`, {
        entity: "userRegister",
        data: payload,
      });

      // Navigate directly to login page after successful registration
      if (response.status === 200 || response.status === 201) {
        customToast.success("Registration successful! Please login to continue.");
        navigate("/user/login");
      }
    } catch (error: any) {
      customToast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      customToast.info("Please enter the full 6-digit OTP.");
      return;
    }
    setVerifyingOtp(true);
    try {
      await axios.post(`${API_BASE_URL}/user/verify-otp`, {
        email: registeredEmail,
        otp,
      });
      customToast.success("Email verified successfully!");
      setShowOtpModal(false);
      navigate("/user/login");
    } catch (err: any) {
      customToast.error(
        err.response?.data?.message || "OTP verification failed"
      );
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      await axios.post(`${API_BASE_URL}`, {
        entity: "userRegister",
        data: { ...formData, password: formData.password },
      });
      setResendCountdown(120);
      customToast.success("OTP resent to your email.");
    } catch (err) {
      customToast.error("Failed to resend OTP");
    } finally {
      setResendingOtp(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name and Surname */}
        {/* Name and Surname */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* NAME */}
          <div className="relative">
            <Input
              id="name"
              placeholder="NAME"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isLoading}
              className={`
        peer h-12 w-full rounded border
        bg-slate-50/80 backdrop-blur-sm
        border-slate-200 text-[15px] pl-4 pr-4
        focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100
        shadow-inner transition-all placeholder-transparent
        ${errors.name ? "border-rose-400 focus-visible:ring-rose-100" : ""}
      `}
            />
            <Label
              htmlFor="name"
              className={`
        pointer-events-none absolute left-5 top-2.5 text-slate-500 text-sm transition-all
        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400
        peer-focus:top-1 peer-focus:text-xs peer-focus:text-sky-600
      `}
            ></Label>
            {errors.name && (
              <p className="text-destructive text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* SURNAME */}
          <div className="relative">
            <Input
              id="surname"
              placeholder="SURNAME"
              value={formData.surname}
              onChange={(e) =>
                setFormData({ ...formData, surname: e.target.value })
              }
              disabled={isLoading}
              className={`
        peer h-12 w-full rounded border
        bg-slate-50/80 backdrop-blur-sm
        border-slate-200 text-[15px] pl-4 pr-4
        focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100
        shadow-inner transition-all placeholder-transparent
        ${errors.surname ? "border-rose-400 focus-visible:ring-rose-100" : ""}
      `}
            />
            <Label
              htmlFor="surname"
              className={`
        pointer-events-none absolute left-5 top-2.5 text-slate-500 text-sm transition-all
        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400
        peer-focus:top-1 peer-focus:text-xs peer-focus:text-sky-600
      `}
            ></Label>
            {errors.surname && (
              <p className="text-destructive text-xs mt-1">{errors.surname}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="relative">
          <Input
            id="email"
            placeholder="EMAIL"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            disabled={isLoading}
            className={`
      peer h-12 w-full rounded border
      bg-slate-50/80 backdrop-blur-sm
      border-slate-200 text-[15px] pl-4 pr-4
      focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100
      shadow-inner transition-all placeholder-transparent
      ${errors.email ? "border-rose-400 focus-visible:ring-rose-100" : ""}
    `}
          />

          {errors.email && (
            <p className="text-destructive text-xs mt-1">{errors.email}</p>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">
          {/* PHONE */}
          <div className="lg:col-span-6">
            <div className="flex">
              {/* Country Code Selector */}
              <Select
                value={formData.country}
                onValueChange={(iso) => {
                  const selected = Country.getCountryByCode(iso);
                  setFormData((prev) => ({
                    ...prev,
                    country: iso,
                    country_code: selected ? `+${selected.phonecode}` : prev,
                  }));
                }}
                disabled={isLoading}
              >
                <SelectTrigger className="w-[100px] !h-12 lg:!h-11 rounded-md lg:mt-0.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                   {allCountries.map((country) => (
                    <SelectItem key={country.isoCode} value={country.isoCode}>
                      +{country.phonecode} ({country.isoCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Phone Input */}
              <div className="relative flex-1 ml-2">
                <Input
                  id="phone"
                  placeholder="PHONE"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  disabled={isLoading}
                  className={`
            peer h-12 w-full   border
            bg-slate-50/80 backdrop-blur-sm
            border-slate-200 text-[15px] pl-4 pr-4
            focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100
            shadow-inner transition-all placeholder-transparent
            ${errors.phone ? "border-rose-400 focus-visible:ring-rose-100" : ""}
          `}
                />
  
              </div>
            </div>
            {errors.phone && (
              <p className="text-destructive text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          {/* PIN CODE */}
          <div className="lg:col-span-4 relative">
            <Input
              id="pin_code"
              placeholder="PIN CODE"
              value={formData.pin_code}
              onChange={(e) =>
                setFormData({ ...formData, pin_code: e.target.value })
              }
              disabled={isLoading}
              className={`
        peer h-12 w-full rounded border
        bg-slate-50/80 backdrop-blur-sm
        border-slate-200 text-[15px] pl-4 pr-4
        focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100
        shadow-inner transition-all placeholder-transparent
        ${errors.pin_code ? "border-rose-400 focus-visible:ring-rose-100" : ""}
      `}
            />
            <Label
              htmlFor="pin_code"
              className={`
        pointer-events-none absolute left-5 top-2.5 text-slate-500 text-sm transition-all
        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400
        peer-focus:top-1 peer-focus:text-xs peer-focus:text-sky-600
      `}
            > </Label>
            {errors.pin_code && (
              <p className="text-destructive text-xs mt-1">{errors.pin_code}</p>
            )}
          </div>
        </div>

        {/* Country and State */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* COUNTRY */}
          <div className="relative">
            <Label className="absolute left-0 top-2 text-xs text-slate-500">
              COUNTRY
            </Label>
            <Select
              value={formData.country}
              onValueChange={(value) =>
                setFormData({ ...formData, country: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger className="mt-6 h-12 rounded  border-slate-200 bg-slate-50/80 backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {allCountries.map((country) => (
                  <SelectItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* STATE */}
          <div className="relative">
            <Label className="absolute left-0 top-2 text-xs text-slate-500">
              STATE
            </Label>
            <Select
              value={formData.state}
              onValueChange={(value) =>
                setFormData({ ...formData, state: value })
              }
              disabled={allStates.length === 0}
            >
              <SelectTrigger className="mt-6 h-12 rounded  border-slate-200 bg-slate-50/80 backdrop-blur-sm">
                <SelectValue
                  placeholder={
                    allStates.length === 0
                      ? "No states available"
                      : "Select state"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {allStates.map((state) => (
                  <SelectItem key={state.isoCode} value={state.isoCode}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Address */}
        <div className="relative">
          <Textarea
            id="address"
            placeholder="ADDRESS"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            disabled={isLoading}
            className={`
      peer min-h-[px] rounded border
      bg-slate-50/80 backdrop-blur-sm
      border-slate-200 text-[15px] p-4
      focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100
      shadow-inner transition-all placeholder-transparent
      ${errors.address ? "border-rose-400 focus-visible:ring-rose-100" : ""}
    `}
          />
          <Label
            htmlFor="address"
            className={`
      pointer-events-none absolute left-5 top-3 text-slate-500 text-sm transition-all
      peer-placeholder-shown:top-4 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400
      peer-focus:top-1 peer-focus:text-xs peer-focus:text-sky-600
    `}
          ></Label>
          {errors.address && (
            <p className="text-destructive text-xs mt-1">{errors.address}</p>
          )}
        </div>

        {/* Password */}
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="PASSWORD"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            className={`
      peer h-12 w-full rounded border
      bg-slate-50/80 backdrop-blur-sm
      border-slate-200 text-[15px] pl-4 pr-10
      focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100
      shadow-inner transition-all placeholder-transparent
      ${errors.password ? "border-rose-400 focus-visible:ring-rose-100" : ""}
    `}
            disabled={isLoading}
          />
          <Label
            htmlFor="password"
            className={`
      pointer-events-none absolute left-5 top-2.5 text-slate-500 text-sm transition-all
      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400
      peer-focus:top-1 peer-focus:text-xs peer-focus:text-sky-600
    `}
          ></Label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-sky-600 transition"
          >
            {showPassword ? (
              <EyeIcon className="h-5 w-5" />
            ) : (
              <EyeOffIcon className="h-5 w-5" />
            )}
          </button>
          {errors.password && (
            <p className="text-destructive text-xs mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="CONFIRM PASSWORD"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            className={`
      peer h-12 w-full rounded  border
      bg-slate-50/80 backdrop-blur-sm
      border-slate-200 text-[15px] pl-4 pr-10
      focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-100
      shadow-inner transition-all placeholder-transparent
      ${
        errors.confirmPassword
          ? "border-rose-400 focus-visible:ring-rose-100"
          : ""
      }
    `}
            disabled={isLoading}
          />
          <Label
            htmlFor="confirmPassword"
            className={`
      pointer-events-none absolute left-5 top-2.5 text-slate-500 text-sm transition-all
      peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-[15px] peer-placeholder-shown:text-slate-400
      peer-focus:top-1 peer-focus:text-xs peer-focus:text-sky-600
    `}
          ></Label>
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-2.5 text-slate-400 hover:text-sky-600 transition"
          >
            {showConfirmPassword ? (
              <EyeIcon className="h-5 w-5" />
            ) : (
              <EyeOffIcon className="h-5 w-5" />
            )}
          </button>
          {errors.confirmPassword && (
            <p className="text-destructive text-xs mt-1">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Terms and Conditions */}
        <div className="flex items-start space-x-2 space-y-0 mt-6">
          <Checkbox
            className="mt-1 cursor-pointer rounded"
            id="terms"
            checked={formData.terms}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, terms: checked as boolean })
            }
            disabled={isLoading}
          />
          <div className="leading-tight">
            <Label
              htmlFor="terms"
              className="text-sm font-normal cursor-pointer"
            >
              I agree to the{" "}
              <Link to="https://ionmonitor.com/terms_and_conditions" className="text-blue-500 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="https://ionmonitor.com/privacy_policy" className="text-blue-500 hover:underline">
                Privacy Policy
              </Link>
              .
            </Label>
            {errors.terms && (
              <p className="text-destructive text-xs mt-1">{errors.terms}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`bg-blue-500 hover:bg-blue-600 text-white w-full py-2 rounded-md font-semibold ${
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
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

            <button
              disabled={resendCountdown > 0 || resendingOtp}
              onClick={handleResendOtp}
              className="text-sm text-blue-500 disabled:text-gray-400"
            >
              {resendCountdown > 0
                ? `Resend OTP in ${resendCountdown}s`
                : "Resend OTP"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RegisterForm;
