import { useEffect, useState, useRef } from "react";
import { Check, X, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { customToast } from "@/lib/toastConfig";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface PlanFeature {
  name: string;
  included: boolean;
  isNew?: boolean;
}
interface PricingPlan {
  id: number;
  name: string;
  description: string;
  version: string;
  popular?: boolean;
  monthly: number;
  quarterly: number;
  half_yearly: number;
  yearly: number;
  features: PlanFeature[];
}
type BillingPeriod = "monthly" | "quarterly" | "half_yearly" | "yearly";

const androidPlans: PricingPlan[] = [
  {
    id: 1,
    name: "Basic",
    description: "Without Call Recording",
    version: "Compatible upto Android 15",
    monthly: 0,
    quarterly: 0,
    half_yearly: 0,
    yearly: 0,
    features: [
      { name: "Call Logs", included: true },
      { name: "Contacts", included: true },
      { name: "SMS", included: true },
      { name: "Live Locations", included: true },
      { name: "Photos & Screenshots", included: true },
      { name: "Instant Photo Capture", included: false },
      { name: "Surrounding Recordings", included: false },
      { name: "Live Ambient Audio", included: false },
      { name: "Schedule Surround", included: false },
      { name: "Keylogger", included: true },
      { name: "WhatsApp Call Recordings", included: false },
      { name: "FB Messenger Call Recordings", included: false },
      { name: "Skype Call Recordings", included: false },
      { name: "Truecaller Call Recordings", included: false },
      { name: "WhatsApp Statuses", included: false },
      { name: "WhatsApp Chats/Calls", included: true },
      { name: "WhatsApp Business", included: false },
      { name: "WhatsApp Audio/Videos", included: false },
      { name: "WhatsApp Voice Notes", included: false },

      { name: "Calendar Access", included: false },
      { name: "Internet History", included: false },
      { name: "WhatsApp Messages", included: false },
    ],
  },
  {
    id: 2,
    name: "Premium",
    description: "With Call Recording",
    version: "Compatible upto Android 15",
    popular: true,
    monthly: 0,
    quarterly: 0,
    half_yearly: 0,
    yearly: 0,
    features: [
      { name: "Call Recordings", included: true },
      { name: "Call Logs", included: true },
      { name: "Contacts", included: true },
      { name: "SMS", included: true },
      { name: "Live Locations", included: true },
      { name: "Photos & Screenshots", included: true },
      { name: "Instant Photo Capture", included: true },
      { name: "Surrounding Recordings", included: true },
      { name: "Live Ambient Audio", included: true },
      { name: "Schedule Surround", included: true },
      { name: "Keylogger", included: true },
      { name: "WhatsApp Call Recordings", included: true },
      { name: "BOTIM Call Recordings", included: true, isNew: true },
      { name: "FB Messenger Call Recordings", included: true },
      { name: "Skype Call Recordings", included: true },
      { name: "Truecaller Call Recordings", included: true },
      { name: "WhatsApp Statuses", included: true },
      { name: "WhatsApp Chats/Calls", included: true },
      { name: "BOTIM Chats/Calls", included: true, isNew: true },
      { name: "WhatsApp Business", included: true },
      { name: "WhatsApp Audio/Videos", included: true },
      { name: "WhatsApp Voice Notes", included: true },
    ],
  },
  {
    id: 3,
    name: "Standard",
    description: "Without Call Recording",
    version: "Compatible upto Android 15",
    monthly: 0,
    quarterly: 0,
    half_yearly: 0,
    yearly: 0,
    features: [
      { name: "Call Logs", included: true },
      { name: "Contacts", included: true },
      { name: "SMS", included: true },
      { name: "Live Locations", included: true },
      { name: "Photos & Screenshots", included: true },
      { name: "Instant Photo Capture", included: false },
      { name: "Surrounding Recordings", included: false },
      { name: "Live Ambient Audio", included: false },
      { name: "Schedule Surround", included: false },
      { name: "Keylogger", included: true },
      { name: "WhatsApp Call Recordings", included: false },
      { name: "FB Messenger Call Recordings", included: false },
      { name: "Skype Call Recordings", included: false },
      { name: "Truecaller Call Recordings", included: false },
      { name: "WhatsApp Statuses", included: false },
      { name: "WhatsApp Chats/Calls", included: true },
      { name: "WhatsApp Business", included: false },
      { name: "WhatsApp Audio/Videos", included: false },
      { name: "WhatsApp Voice Notes", included: false },

      { name: "Call Recordings", included: false },
      { name: "Social Media Logs", included: false },
      { name: "Technical Support", included: true },
    ],
  },
];

const iosPlans: PricingPlan[] = [
  {
    id: 1,
    name: "iOS Monitar",
    description: "PRECEDING DATA MONITORING",
    version: "Compatible upto IOS 19",
    monthly: 0,
    quarterly: 0,
    half_yearly: 0,
    yearly: 0,
    features: [
      { name: "Contacts", included: true },
      { name: "SMS", included: true },
      { name: "Installed Apps", included: true },
      { name: "Photos & Screenshots", included: true },
      { name: "Calendar", included: true },
      { name: "Notes", included: true },
      { name: "WhatsApp Chats", included: true },
      { name: "WhatsApp Images", included: true },
      { name: "WhatsApp Business Chats", included: true },
      { name: "WhatsApp Business Images", included: true },
      { name: "Location History", included: true },
      { name: "Internet History", included: true },
      { name: "Technical Support", included: true },
      { name: "2-Factor/OTP Authentication", included: true },
      { name: "30 Days History Retention", included: true },
      { name: "Unlimited Device Change", included: true },
      { name: "Free Remote Installation", included: true },
    ],
  },
];

interface ApiPlan {
  id: number;
  name: string;
  price: number;
  monthly: number;
  quarterly: number;
  half_yearly: number;
  yearly: number;
}

export function PricingPage() {
  const location = useLocation();
  const [selectedPlatform, setSelectedPlatform] = useState<"android" | "ios">(
    "android"
  );
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [apiPlanData, setApiPlanData] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const toastShownRef = useRef(false);

  useEffect(() => {
    type PricingState = {
      from?: string;
      needPlanId?: 1 | 2 | 3;
      currentPlanId?: 0 | 1 | 2 | 3;
      showPlanToast?: boolean;
    } | null;

    const planLabel = (id?: number) =>
      id === 3
        ? "Premium"
        : id === 2
        ? "Standard"
        : id === 1
        ? "Basic"
        : "No Plan";

    const s = (location.state as PricingState) || null;
    if (!toastShownRef.current && s?.showPlanToast && s.needPlanId) {
      setTimeout(() => {
        customToast.error(
          `This feature isn’t available in your current plan (${planLabel(
            s.currentPlanId
          )}). Upgrade to ${planLabel(s.needPlanId)} to access it.`
        );
      }, 100);
      toastShownRef.current = true;
      if (window.history?.replaceState) {
        const { pathname, search } = window.location;
        window.history.replaceState({}, "", pathname + search);
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/plan`);
        const data = await res.json();
        setApiPlanData(data);
      } catch (err) {
        console.error("Failed to fetch plans", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-950 relative overflow-hidden">
        {/* Animated ring loader */}
        <div className="relative">
          <div className="h-15 w-15 rounded-full border-4 border-sky-500/20 border-t-sky-400 animate-spin" />
          <div className="absolute inset-0 rounded-full blur-md border-t-4 border-sky-400/50 animate-spin-slow" />
        </div>

        <p className="mt-6 text-lg sm:text-2xl font-medium text-white/80 tracking-wide">
          Loading Plans...
        </p>
      </div>
    );
  }

  // Merge API pricing into static Android plans
  const mergedAndroidPlans = androidPlans.map((sp) => {
    const match = apiPlanData.find(
      (p) => p.name.toLowerCase() === sp.name.toLowerCase()
    );
    return match
      ? {
          ...sp,
          id: match.id,
          name: match.name,
          monthly: match.monthly,
          quarterly: match.quarterly,
          half_yearly: match.half_yearly,
          yearly: match.yearly,
        }
      : sp;
  });

  const currentPlans =
    selectedPlatform === "android" ? mergedAndroidPlans : iosPlans;

  const priceFor = (plan: PricingPlan, period: BillingPeriod) => {
    const value = plan[period] || 0;
    return value < 0 ? 0 : value;
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    const payload = {
      id: plan.id,
      name: plan.name,
      monthly: plan.monthly,
      quarterly: plan.quarterly,
      half_yearly: plan.half_yearly,
      yearly: plan.yearly,
    };
    navigate("/buy-plan", { state: { selectedPlan: payload } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Aurora background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-violet-600/15 via-sky-400/15 to-emerald-400/35 blur-3xl" />
        <div className="absolute top-40 -right-24 h-[22rem] w-[22rem] rounded-full bg-gradient-to-tr from-amber-500/15 via-pink-500/15 to-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-gradient-to-tr from-blue-500/10 to-cyan-400/10 blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Pick Your Plan
          </h1>
          <p className="mt-3 text-sm sm:text-base text-white/70">
            Transparent pricing. Secure payments. Switch plans anytime.
          </p>
        </div>

        {/* Platform + Billing toggles */}
        <div className="mx-auto mb-10 flex flex-col items-center gap-4 sm:gap-5 sm:justify-center">
          {/* --- PLATFORM TOGGLE --- */}
          <div className="bg-gray-900 p-2 rounded-full inline-flex gap-1 sm:gap-3 shadow-sm">
            <button
              onClick={() => setSelectedPlatform("android")}
              className={`px-6 sm:px-12 md:px-20 py-2 md:py-3.5 cursor-pointer rounded-full text-sm lg:text-lg font-medium transform transition-all duration-300 ease-in-out ${
                selectedPlatform === "android"
                  ? "bg-indigo-400 text-white scale-104 shadow-md"
                  : "text-gray-200 hover:text-gray-900 hover:bg-gray-300/50"
              }`}
            >
              Android
            </button>
            <button
              onClick={() => setSelectedPlatform("ios")}
              className={`px-6 sm:px-12 md:px-30 py-2 md:py-3.5 cursor-pointer rounded-full text-sm sm:text-lg md:text-lg font-medium transform transition-all duration-300 ease-in-out ${
                selectedPlatform === "ios"
                  ? "bg-indigo-400 text-white scale-104 shadow-md"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-300/50"
              }`}
            >
              iOS
            </button>
          </div>

          {/* --- BILLING TOGGLE --- */}
          <div className="bg-gray-900 p-1 sm:p-1.5 rounded-full inline-flex gap-1 sm:gap-2 shadow-sm">
            {(["monthly", "quarterly", "half_yearly", "yearly"] as const).map(
              (p) => {
                const label =
                  p === "half_yearly"
                    ? "6 Months"
                    : p.charAt(0).toUpperCase() + p.slice(1);
                const active = billingPeriod === p;
                return (
                  <button
                    key={p}
                    onClick={() => setBillingPeriod(p)}
                    className={`px-4 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-full transition ${
                      active
                        ? // active look matches your platform’s “selected” feel
                          "bg-indigo-400 text-white shadow-md scale-105"
                        : // inactive look matches your platform’s “idle” feel
                          "text-gray-700 hover:text-gray-900 hover:bg-gray-300/50"
                    }`}
                  >
                    {label}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Cards */}
        <div
          className={`mx-auto grid gap-6 sm:gap-8 ${
            selectedPlatform === "ios"
              ? "max-w-3xl grid-cols-1"
              : "md:grid-cols-3"
          }`}
        >
          {currentPlans.map((plan) => {
            const isPremium = plan.name.toLowerCase() === "premium";
            const price = priceFor(plan, billingPeriod);

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border border-white/10 bg-white/5 p-1 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.15),0_30px_60px_-15px_rgba(0,0,0,0.5)] ${
                  isPremium ? "shadow-[0_0_0_1px_rgba(255,255,255,0.15)]" : ""
                }`}
              >
                {/* Glow ring for popular */}
                {plan.popular && (
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-sky-400/40 via-indigo-400/40 to-blue-500/40 blur-[10px]" />
                )}

                <div className="relative rounded-2xl bg-slate-950/50 p-6 sm:p-7">
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-blue-600 px-3 py-1 text-[11px] font-semibold text-white shadow-md shadow-blue-800/30">
                      Most Popular
                    </span>
                  )}

                  {/* head */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-semibold text-white">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-white/70">
                        {plan.description}
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs text-white/50">
                        {plan.version}
                      </p>
                    </div>
                    <img
                      src={
                        selectedPlatform === "android"
                          ? "/android.png"
                          : "/ios.png"
                      }
                      alt={selectedPlatform === "android" ? "Android" : "iOS"}
                      className="h-25 w-25 opacity-90"
                    />
                  </div>

                  {/* price */}
                  <div className="mt-5">
                    <div
                      className={`rounded-xl px-4 py-3 text-center text-4xl font-semibold tracking-tight ${
                        isPremium
                          ? "bg-gradient-to-r from-sky-400/15 via-indigo-400/15 to-blue-500/15 text-sky-300"
                          : "bg-white/5 text-white"
                      }`}
                    >
                      ₹ {price}
                      <span className="ml-1 align-middle text-xs font-medium text-white/60">
                        {billingPeriod === "monthly"
                          ? "/mo"
                          : billingPeriod === "quarterly"
                          ? "/qtr"
                          : billingPeriod === "half_yearly"
                          ? "/6mo"
                          : "/yr"}
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => {
                      if (selectedPlatform === "ios") {
                        alert("iOS monitoring plans are coming soon!");
                        return;
                      }
                      handleSelectPlan(plan);
                    }}
                    className={`mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isPremium
                        ? "bg-white text-slate-900 hover:bg-slate-100"
                        : "bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-400 hover:to-violet-400"
                    }`}
                  >
                    {selectedPlatform === "ios" ? "Coming Soon" : "Buy Now"}
                  </button>

                  <p className="mt-3 text-center text-[11px] text-white/60">
                    Required: Physical access to the target android phone
                  </p>

                  {/* features */}
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <ul className="grid grid-cols-1 gap-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {f.included ? (
                            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                          ) : (
                            <X className="h-4 w-4 shrink-0 text-white/30" />
                          )}
                          <span
                            className={`text-xs ${
                              f.included
                                ? "text-white/90"
                                : "text-white/40 line-through"
                            }`}
                          >
                            {f.name}
                          </span>
                          {f.isNew && (
                            <span className="ml-2 rounded bg-red-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                              NEW
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>

                    <button className="mt-4 flex w-full items-center justify-center gap-1 text-xs text-white/70 hover:text-white">
                      More Features <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Security strip */}
        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:items-center">
            <img
              src="/lock.png"
              alt="Security Lock"
              className="h-16 w-16 object-contain opacity-90"
            />
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-white">
                Secure Internet Payment Processing
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Your order will be processed through Paypal, Razorpay, PayUMoney
                and PayTM. Your transaction is protected by 256-bit SSL
                encryption. We safeguard your personal information end-to-end.
              </p>
            </div>
          </div>
        </div>

        {/* tiny footer hint */}
        <p className="mt-6 text-center text-[11px] text-white/40">
          Prices shown are inclusive of applicable taxes where required.
        </p>
      </div>
    </div>
  );
}
