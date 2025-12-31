// import { useEffect, useMemo, useState } from "react";
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { customToast, toast } from "@/lib/toastConfig";
// import { api } from "@/api/api";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const loadScript = (src: string) =>
//   new Promise<boolean>((resolve) => {
//     const s = document.createElement("script");
//     s.src = src;
//     s.onload = () => resolve(true);
//     s.onerror = () => resolve(false);
//     document.body.appendChild(s);
//   });

// declare global {
//   interface Window {
//     Razorpay?: any;
//   }
// }

// type PlanId = 1 | 2 | 3;
// type PlanName = "Basic" | "Standard" | "Premium";

// export type Plan = {
//   id: PlanId;
//   name: PlanName;
//   price: number;
// };

// type Props = {
//   open: boolean;
//   onOpenChange: (next: boolean) => void;

//   email: string;
//   licenseId: string;
//   imei?: string | null;
//   expiryText?: string;

//   currentPlan: Plan;
//   targetPlan: Plan;

//   onPay?: (payload: {
//     email: string;
//     licenseId: string;
//     imei?: string | null;
//     currentPlan: Plan;
//     targetPlan: Plan;
//     coupon?: string;
//     subtotal: number;
//     gst: number;
//     total: number;
//   }) => Promise<void> | void;
// };

// const money = (n: number) =>
//   new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 0,
//   }).format(n);

// export default function PaymentDialog({
//   open,
//   onOpenChange,
//   email,
//   licenseId,
//   imei,
//   expiryText,
//   currentPlan,
//   targetPlan,
// }: Props) {
//   const baseDiffAmount = Math.max(0, targetPlan.price - currentPlan.price);

//   const [coupon, setCoupon] = useState("");
//   const [working, setWorking] = useState(false);

//   useEffect(() => {
//     if (open) {
//       setWorking(false);
//       setCoupon("");
//     }
//   }, [open]);

//   // Demo coupons (UI-only). Replace with server validation.
//   const discount = useMemo(() => {
//     // const c = coupon.trim().toUpperCase();
//     // if (c === "FLAT1000") return 1000;
//     // if (c === "FLAT500") return 500;
//     return 0;
//   }, [coupon]);

//   const subtotal = Math.max(0, baseDiffAmount - discount);
//   const gstRate = 0.18;
//   const gst = Math.round(subtotal * gstRate);
//   const totalPayable = subtotal + gst;

//   //----------Razerpay Payment Gateway--------------
//   const payWithRazorpayUpgrade = async () => {
//     const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
//     if (!ok) {
//       customToast.error("Failed to load Razorpay.");
//       return;
//     }

//     // 1) Create order
//     const orderRes = await fetch(
//       `${API_BASE_URL}/api/payment/razorpay/create-order`,
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           amount: totalPayable,
//           currency: "INR",
//           receipt: `upgrade_${licenseId}_${Date.now()}`,
//         }),
//       }
//     );

//     const orderData = await orderRes.json();
//     if (!orderRes.ok || !orderData?.id) {
//       customToast.error("Unable to create Razorpay order.");
//       return;
//     }

//     const brandLogo = "https://dash.ionmonitor.com/logo.png";
//     // 2) Open Razorpay
//     const rzp = new (window as any).Razorpay({
//       key: import.meta.env.VITE_RAZORPAY_KEY_ID,
//       amount: orderData.amount,
//       currency: orderData.currency,
//       name: "ION Monitor",
//       description: `Upgrade to ${targetPlan.name} (License ${licenseId})`,
//       image: brandLogo,
//       order_id: orderData.id,
//       prefill: { email },
//       notes: {
//         licenseId,
//         fromPlan: currentPlan.name,
//         toPlan: targetPlan.name,
//       },
//       theme: { color: "#0d9488" },

//       modal: { ondismiss: () => setWorking(false) },

//       handler: async (resp: {
//         razorpay_payment_id: string;
//         razorpay_order_id: string;
//         razorpay_signature: string;
//       }) => {
//         // 3) Verify (same API you already have)
//         const verifyToast = customToast.loading("Verifying payment…");
//         const verifyRes = await fetch(
//           `${API_BASE_URL}/api/payment/razorpay/verify`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify(resp),
//           }
//         );
//         const verifyJson = await verifyRes.json();
//         toast.dismiss(verifyToast);

//         if (verifyJson?.status !== "success") {
//           customToast.error("Payment verification failed.");
//           return;
//         }

//         // 4) Upgrade license (single new API)
//         try {
//           const upgradePayload = {
//             licenseId,
//             email,
//             fromPlanId: currentPlan.id,
//             toPlanId: targetPlan.id,
//             amountPaid: totalPayable,
//             subtotal,
//             gst,
//             coupon: coupon?.trim() || null,
//             payment: {
//               gateway: "razorpay",
//               orderId: resp.razorpay_order_id,
//               paymentId: resp.razorpay_payment_id,
//               signature: resp.razorpay_signature,
//             },
//           };

//           const { data } = await api.post("/user/license/upgrade",upgradePayload );
//           console.debug("License upgraded:", data.licenseId || data.license);

//           customToast.info("Payment Successful. License Upgraded!");
//           setTimeout(() => {
//             onOpenChange?.(false);
//             window.location.reload();
//           }, 1000);
//         } catch (err: any) {
//           console.error("License upgrade error:", err?.response?.data || err);
//           customToast.error(
//             err?.response?.data?.error ||
//               "Payment verified but license upgrade failed. Please contact support."
//           );
//         }
//       },
//     });
//     onOpenChange?.(false);
//     setTimeout(() => {
//       setWorking(true);
//       rzp.open();
//     }, 100);
//   };

//   return (
//     <AlertDialog open={open} onOpenChange={onOpenChange}>
//       <AlertDialogContent
//         data-variant="compact"
//         className="border-none bg-transparent shadow-none"
//       >
//         <div className="mx-auto lg:w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
//           <div className="bg-white flex flex-col max-h-[90vh]">
//             {/* Banner */}
//             <div className="relative px-6 py-6 flex items-center gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
//               <img src="/price_tag.png" className="w-16 h-16" alt="upgrade" />
//               <div className="flex-1 min-w-0">
//                 <AlertDialogTitle className="text-white text-xl sm:text-2xl font-semibold truncate">
//                   Payment
//                 </AlertDialogTitle>
//                 <p className="text-white/90 text-sm sm:text-base">
//                   You’re upgrading from{" "}
//                   <span className="font-semibold">{currentPlan.name}</span> to{" "}
//                   <span className="font-semibold">{targetPlan.name}</span>. Pay
//                   only the difference.
//                 </p>
//               </div>
//             </div>

//             {/* Body */}
//             <div className="px-6 pt-5 pb-6 flex-1 overflow-y-auto">
//               <div className="grid gap-6 grid-cols-1 md:grid-cols-[3fr_2fr]">
//                 {/* Left */}
//                 <div className="grid gap-3">
//                   {/* Email */}
//                   <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
//                     <Label className="text-xs font-medium text-gray-500">
//                       Email
//                     </Label>
//                     <span className="text-md font-medium text-gray-600 mt-0.5">
//                       {email}
//                     </span>
//                   </div>

//                   {/* License ID */}
//                   <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
//                     <Label className="text-xs font-medium text-gray-500">
//                       License ID
//                     </Label>
//                     <span className="text-md font-mono font-semibold text-gray-600 mt-0.5">
//                       {licenseId}
//                     </span>
//                   </div>

//                   {/* IMEI (optional) */}
//                   {!!imei && (
//                     <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
//                       <Label className="text-xs font-medium text-gray-500">
//                         Device IMEI
//                       </Label>
//                       <span className="text-md font-mono text-gray-800 mt-0.5">
//                         {imei}
//                       </span>
//                     </div>
//                   )}

//                   {/* Plans */}
//                   <div className="grid grid-cols-2 gap-3">
//                     <div className="flex flex-col border border-emerald-100 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
//                       <Label className="text-xs font-medium text-emerald-600">
//                         Current Plan
//                       </Label>
//                       <span className="text-md font-semibold text-emerald-800 mt-0.5">
//                         {currentPlan.name}
//                       </span>
//                     </div>
//                     <div className="flex flex-col border border-cyan-100 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
//                       <Label className="text-xs font-medium text-cyan-600">
//                         Upgrade Plan
//                       </Label>
//                       <span className="text-md font-semibold text-cyan-800 mt-0.5">
//                         {targetPlan.name}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Expiry */}
//                   {!!expiryText && (
//                     <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
//                       <Label className="text-xs font-medium text-gray-500">
//                         Plan Expiry
//                       </Label>
//                       <span className="text-md font-medium text-gray-600 mt-0.5">
//                         {expiryText}
//                       </span>
//                     </div>
//                   )}

//                   {/* Coupon */}
//                   <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
//                     <Label
//                       htmlFor="coupon"
//                       className="text-xs font-medium text-gray-500 mb-1.5"
//                     >
//                       Coupon (optional)
//                     </Label>

//                     <div className="flex gap-2">
//                       <Input
//                         id="coupon"
//                         value={coupon}
//                         onChange={(e) => setCoupon(e.target.value)}
//                         placeholder="FLAT500"
//                         className="h-9 text-sm"
//                       />
//                       <Button
//                         type="button"
//                         variant="secondary"
//                         size="sm"
//                         className="h-9 font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-100"
//                         onClick={() => setCoupon((c) => c.trim().toUpperCase())}
//                       >
//                         Apply
//                       </Button>
//                     </div>

//                     {coupon && (
//                       <p className="mt-2 text-xs text-gray-600">
//                         Applied coupon:{" "}
//                         <span className="font-semibold text-amber-700">
//                           {coupon.toUpperCase()}
//                         </span>
//                       </p>
//                     )}
//                   </div>

//                   {/* Pay */}
//                   <div className="pt-2">
//                     <div className="grid grid-cols-10 gap-2">
//                       {/* Cancel button   */}
//                       <Button
//                         type="button"
//                         variant="outline"
//                         onClick={() => onOpenChange?.(false)} // close dialog if parent passed handler
//                         className="col-span-3 h-11 rounded-sm font-medium border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-all"
//                       >
//                         Cancel
//                       </Button>

//                       {/* Pay button */}
//                       <Button
//                         className="cursor-pointer col-span-7 h-11 rounded text-white font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500"
//                         disabled={working}
//                         onClick={() => {
//                           setWorking(true);
//                           let counter = 2;
//                           const timer = setInterval(() => {
//                             counter--;
//                             if (counter <= 0) {
//                               clearInterval(timer);
//                               payWithRazorpayUpgrade();  
//                             } else {
//                               setWorking(true); // keeps the state true during countdown
//                             }
//                           }, 500);
//                         }}
//                       >
//                         {working ? "Processing…" : `Pay ${money(totalPayable)}`}
//                       </Button>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Right: Order summary */}
//                 <div className="relative rounded-xl overflow-visible border-none min-h-[596px] lg:min-h-[500px]">
//                   <div className="absolute inset-0 bg-[url('/WEB75.jpg')] bg-center md:bg-[length:334%_auto] bg-[length:310%_auto] bg-no-repeat" />

//                   <div className="relative z-10 p-10 lg:p-6 lg:pt-62 pt-68 lg:pb-28 pb-28 text-sm">
//                     <div className="mt-2 grid grid-cols-2 gap-3">
//                       <div className="text-muted-foreground">Current</div>
//                       <div className="text-right text-gray-800">
//                         {currentPlan.name} ({money(currentPlan.price)})
//                       </div>

//                       <div className="text-muted-foreground">Target</div>
//                       <div className="text-right text-gray-800">
//                         {targetPlan.name} ({money(targetPlan.price)})
//                       </div>

//                       <div className="text-muted-foreground">Difference</div>
//                       <div className="text-right text-gray-800">
//                         {money(baseDiffAmount)}
//                       </div>

//                       <div className="text-muted-foreground">Coupon</div>
//                       <div className="text-right">
//                         {discount > 0 ? `- ${money(discount)}` : "—"}
//                       </div>

//                       <div className="text-muted-foreground">GST (18%)</div>
//                       <div className="text-right text-gray-800">
//                         {money(gst)}
//                       </div>
//                     </div>

//                     <div className="absolute inset-x-0 bottom-0 z-10 lg:px-6 px-10 pb-2 lg:pb-5">
//                       <div className="pt-2 text-lg text-gray-600 flex items-center justify-between">
//                         <span className="font-mono">Total Amount</span>
//                         <span className="font-mono text-2xl">
//                           {money(totalPayable)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// }

// ✅ PaymentDialog.tsx (COMPLETE UPDATED)
// - Supports mode: "upgrade" or "renew"
// - For renew: charges full targetPlan.price (already chosen from /api/plan prices)
// - For upgrade: charges difference
// - Sends cycle to backend in renew payload
// NOTE: Change renew endpoint if your backend uses different route.


import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { customToast, toast } from "@/lib/toastConfig";
import { api } from "@/api/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const loadScript = (src: string) =>
  new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

// Cashfree helpers
let cfLoaded = false;
const loadCashfreeSDK = async () => {
  if (cfLoaded) return true;
  const ok = await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
  cfLoaded = ok;
  return ok;
};

const getCashfree = (mode: "sandbox" | "production") => {
  const factory = (window as any).Cashfree;
  if (!factory) throw new Error("Cashfree SDK not loaded");
  return factory({ mode });
};

declare global {
  interface Window {
    Razorpay?: any;
    paypal?: any; // if you later add paypal sdk
    Cashfree?: any;
  }
}

type PlanId = 1 | 2 | 3;
type PlanName = "Basic" | "Standard" | "Premium";
type BillingCycle = "monthly" | "quarterly" | "half_yearly" | "yearly";

type Gateway = "razorpay" | "paypal" | "cashfree";

export type Plan = {
  id: PlanId;
  name: PlanName;
  price: number;
  prices?: {
    monthly: number;
    quarterly: number;
    half_yearly: number;
    yearly: number;
  };
};

type Props = {
  open: boolean;
  onOpenChange: (next: boolean) => void;

  email: string;
  licenseId: string;
  imei?: string | null;
  expiryText?: string;

  currentPlan: Plan;
  targetPlan: Plan;

  mode?: "upgrade" | "renew";
  cycle?: BillingCycle;

    // if you already computed prorated upgrade payable in UpgradePlanDialog,
    // pass it here to charge correct amount.
  //  If not passed, it will use (target - current) which is wrong for yearly upgrades.
   
  payableOverride?: number; // e.g. prorated payable (WITHOUT GST)
};

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n)));

function roundINR(n: number) {
  return Math.max(0, Math.round(Number(n) || 0));
}

export default function PaymentDialog({
  open,
  onOpenChange,
  email,
  licenseId,
  imei,
  expiryText,
  currentPlan,
  targetPlan,
  mode = "upgrade",
  cycle,
  payableOverride,
}: Props) {
  // ✅ Base amount before coupon+GST:
  const baseAmount = useMemo(() => {
    if (mode === "renew") return Math.max(0, targetPlan.price);
    // upgrade:
    // if you pass payableOverride (proration), use it. Otherwise fallback diff.
    if (typeof payableOverride === "number") return Math.max(0, payableOverride);
    return Math.max(0, targetPlan.price - currentPlan.price);
  }, [mode, targetPlan.price, currentPlan.price, payableOverride]);

  const [coupon, setCoupon] = useState("");
  const [gateway, setGateway] = useState<Gateway>("razorpay");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (open) {
      setWorking(false);
      setCoupon("");
      setGateway("razorpay");
    }
  }, [open]);

  // ✅ Replace with server coupon validation if needed
  const discount = useMemo(() => {
    // const c = coupon.trim().toUpperCase();
    // if (c === "FLAT500") return 5000;
    return 0;
  }, [coupon]);

  const subtotal = Math.max(0, baseAmount - discount);
  const gstRate = 0.18;
  const gst = roundINR(subtotal * gstRate);
  const totalPayable = roundINR(subtotal + gst);
  // const totalPayable = 1;

  // 1) Common: verify & then call your license API

  const finalizeLicenseAction = async (paymentInfo: {
    gateway: Gateway;
    orderId?: string | null;
    paymentId?: string | null;
    signature?: string | null;
    meta?: any;
  }) => {
    const commonPayload = {
      licenseId,
      email,
      amountPaid: totalPayable,
      subtotal,
      gst,
      coupon: coupon?.trim() || null,
      payment: {
        gateway: paymentInfo.gateway,
        orderId: paymentInfo.orderId || null,
        paymentId: paymentInfo.paymentId || null,
        signature: paymentInfo.signature || null,
        meta: paymentInfo.meta || null,
      },
    };

    if (mode === "renew") {
      const selectedCycle = cycle ?? "monthly";
      const durationDays = {
        monthly: 30,
        quarterly: 90,
        half_yearly: 180,
        yearly: 365,
      }[selectedCycle];

      const renewPayload = {
        ...commonPayload,
        planId: targetPlan.id,
        cycle: selectedCycle,
        durationDays,
        imei: imei ?? null,
      };

      await api.post("/user/license/renew", renewPayload);
      customToast.info("Payment Successful. License Renewed!");
    } else {
      const upgradePayload = {
        ...commonPayload,
        fromPlanId: currentPlan.id,
        toPlanId: targetPlan.id,
        imei: imei ?? null,
      };

      await api.post("/user/license/upgrade", upgradePayload);
      customToast.info("Payment Successful. License Upgraded!");
    }

    setTimeout(() => {
      onOpenChange(false);
      window.location.reload();
    }, 900);
  };

  // 2) Razorpay flow (Working)

  const payWithRazorpay = async () => {
    const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!ok) {
      customToast.error("Failed to load Razorpay.");
      setWorking(false);
      return;
    }

    // Create order (your backend)
    const orderRes = await fetch(`${API_BASE_URL}/api/payment/razorpay/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: totalPayable,
        currency: "INR",
        receipt: `${mode}_${licenseId}_${Date.now()}`,
      }),
    });

    const orderData = await orderRes.json();
    if (!orderRes.ok || !orderData?.id) {
      customToast.error(orderData?.message || "Unable to create Razorpay order.");
      setWorking(false);
      return;
    }

    const brandLogo = "https://dash.ionmonitor.com/logo.png";

    const rzp = new (window as any).Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "ION Monitor",
      description:
        mode === "renew"
          ? `Renew ${targetPlan.name} (License ${licenseId})`
          : `Upgrade to ${targetPlan.name} (License ${licenseId})`,
      image: brandLogo,
      order_id: orderData.id,
      prefill: { email },
      notes: {
        licenseId,
        action: mode,
        cycle: cycle ?? null,
        fromPlan: currentPlan.name,
        toPlan: targetPlan.name,
      },
      theme: { color: "#0d9488" },
      modal: { ondismiss: () => setWorking(false) },

      handler: async (resp: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        // Verify
        const verifyToast = customToast.loading("Verifying payment…");
        const verifyRes = await fetch(`${API_BASE_URL}/api/payment/razorpay/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(resp),
        });
        const verifyJson = await verifyRes.json();
        toast.dismiss(verifyToast);

        if (verifyJson?.status !== "success") {
          customToast.error("Payment verification failed.");
          setWorking(false);
          return;
        }

        // Finalize license
        try {
          await finalizeLicenseAction({
            gateway: "razorpay",
            orderId: resp.razorpay_order_id,
            paymentId: resp.razorpay_payment_id,
            signature: resp.razorpay_signature,
          });
        } catch (err: any) {
          console.error("License update error:", err?.response?.data || err);
          customToast.error(
            err?.response?.data?.message ||
              "Payment verified but license update failed. Please contact support."
          );
          setWorking(false);
        }
      },
    });

    // Close dialog then open gateway
    onOpenChange(false);
    setTimeout(() => {
      setWorking(true);
      rzp.open();
    }, 150);
  };

  // 3) Cashfree flow 

  const payWithCashfree = async () => {
    // guard amount
    if (!Number.isFinite(totalPayable) || totalPayable < 1) {
      customToast.error("Amount must be at least ₹1.");
      setWorking(false);
      return;
    }

    // 1) Get payment_session_id from your server
    const res = await fetch(
      `${API_BASE_URL}/api/payment/cashfree/create-order`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPayable,
          currency: "INR",
          customer: {
            id: `user_${email.replace(/[^a-zA-Z0-9]/g, "_")}`,
            name: email.split("@")[0] || "User",
            email,
            phone: "9999999999", // You might want to get this from user data
          },
          returnUrl: `${window.location.origin}/payment/return`,
          notifyUrl: `${API_BASE_URL}/api/payment/cashfree/webhook`,
          notes: { licenseId, mode, cycle: cycle ?? null },
        }),
        credentials: "include",
      }
    );

    const data = await res.json();
    if (!res.ok) {
      customToast.error(data?.error || "Failed to create Cashfree order.");
      setWorking(false);
      return;
    }

    const { orderId, payment_session_id } = data || {};
    if (!orderId || !payment_session_id) {
      customToast.error("Cashfree response missing payment_session_id.");
      setWorking(false);
      return;
    }

    await loadCashfreeSDK();
    const cashfree = getCashfree(
      import.meta.env.PROD ? "production" : "sandbox"
    );

    try {
      await cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_modal",
      });
    } catch (error) {
      // User cancelled or payment failed
      customToast.error("Payment was cancelled or failed.");
      setWorking(false);
      return;
    }

    // 4) Verify with your server
    const verifyToast = customToast.loading("Verifying payment...");
    const verifyRes = await fetch(
      `${API_BASE_URL}/api/payment/cashfree/verify`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
        credentials: "include",
      }
    );
    const verify = await verifyRes.json();
    toast.dismiss(verifyToast);

    if (verifyRes.ok && verify?.status === "success") {
      // 5) Finalize license
      try {
        await finalizeLicenseAction({
          gateway: "cashfree",
          orderId,
          paymentId: verify?.paymentId || null,
          signature: null,
          meta: verify,
        });
      } catch (err: any) {
        console.error("License update error:", err?.response?.data || err);
        customToast.error(
          err?.response?.data?.message ||
            "Payment verified but license update failed. Please contact support."
        );
        setWorking(false);
      }
    } else {
      customToast.error(
        `Payment not successful. Status: ${verify?.order_status || "UNKNOWN"}`
      );
      setWorking(false);
    }
  };



  const startPayment = async () => {
    setWorking(true);

    // Basic guard
    if (totalPayable <= 0) {
      customToast.error("Invalid payable amount.");
      setWorking(false);
      return;
    }

    // If you are using "1" for testing, remove it now in production:
    // totalPayable should be real value

    if (gateway === "razorpay") return payWithRazorpay();
    if (gateway === "cashfree") return payWithCashfree();
    // return payWithPaypal();
  };

  const titleText = mode === "renew" ? "Renew Payment" : "Upgrade Payment";
  const subtitle =
    mode === "renew"
      ? `You’re renewing your ${targetPlan.name} plan.`
      : `You’re upgrading from ${currentPlan.name} to ${targetPlan.name}.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-variant="compact" className="border-none bg-transparent shadow-none">
        <div className="mx-auto lg:w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-white flex flex-col max-h-[90vh]">
            {/* Banner */}
            <div className="relative px-6 py-6 flex items-center gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
              <img
                src={mode === "renew" ? "/renew.png" : "/price_tag.png"}
                className="w-16 h-16"
                alt="payment"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/price_tag.png";
                }}
              />
              <div className="flex-1 min-w-0">
                <AlertDialogTitle className="text-white text-xl sm:text-2xl font-semibold truncate">
                  {titleText}
                </AlertDialogTitle>
                <p className="text-white/90 text-sm sm:text-base">{subtitle}</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pt-5 pb-6 flex-1 overflow-y-auto">
              <div className="grid gap-6 grid-cols-1 md:grid-cols-[3fr_2fr]">
                {/* Left */}
                <div className="grid gap-3">
                  <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                    <Label className="text-xs font-medium text-gray-500">Email</Label>
                    <span className="text-md font-medium text-gray-600 mt-0.5">{email}</span>
                  </div>

                  <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                    <Label className="text-xs font-medium text-gray-500">License ID</Label>
                    <span className="text-md font-mono font-semibold text-gray-600 mt-0.5">{licenseId}</span>
                  </div>

                  {!!imei && (
                    <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                      <Label className="text-xs font-medium text-gray-500">Device IMEI</Label>
                      <span className="text-md font-mono text-gray-800 mt-0.5">{imei}</span>
                    </div>
                  )}

                  {!!expiryText && (
                    <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                      <Label className="text-xs font-medium text-gray-500">
                        {mode === "renew" ? "Current Expiry" : "Plan Expiry"}
                      </Label>
                      <span className="text-md font-medium text-gray-600 mt-0.5">{expiryText}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col border border-emerald-100 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                      <Label className="text-xs font-medium text-emerald-600">Current Plan</Label>
                      <span className="text-md font-semibold text-emerald-800 mt-0.5">{currentPlan.name}</span>
                    </div>
                    <div className="flex flex-col border border-cyan-100 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                      <Label className="text-xs font-medium text-cyan-600">
                        {mode === "renew" ? "Renew Plan" : "Target Plan"}
                      </Label>
                      <span className="text-md font-semibold text-cyan-800 mt-0.5">{targetPlan.name}</span>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                    <Label htmlFor="coupon" className="text-xs font-medium text-gray-500 mb-1.5">
                      Coupon (optional)
                    </Label>

                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        value={coupon}
                        onChange={(e) => setCoupon(e.target.value)}
                        placeholder="FLAT500"
                        className="h-9 text-sm"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-9 font-medium text-gray-700 border border-gray-300 bg-white hover:bg-gray-100"
                        onClick={() => setCoupon((c) => c.trim().toUpperCase())}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  {/* ✅ Gateway dropdown (after coupon) */}
                  <div className="flex flex-col border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white">
                    <Label htmlFor="gateway" className="text-xs font-medium text-gray-500 mb-1.5">
                      Payment Gateway
                    </Label>

                    <select
                      id="gateway"
                      value={gateway}
                      onChange={(e) => setGateway(e.target.value as Gateway)}
                      className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700"
                    >
                      <option value="razorpay">Razorpay</option>
                      <option value="cashfree">Cashfree</option>
                      {/* <option value="paypal">PayPal</option> */}
                    </select>

                    <p className="mt-2 text-xs text-gray-600">
                      Selected: <span className="font-semibold">{gateway}</span>
                    </p>
                  </div>

                  {/* Pay */}
                  <div className="pt-2">
                    <div className="grid grid-cols-10 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="col-span-3 h-11 rounded-sm font-medium border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-all"
                      >
                        Cancel
                      </Button>

                      <Button
                        className="cursor-pointer col-span-7 h-11 rounded text-white font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500"
                        disabled={working}
                        onClick={startPayment}
                      >
                        {working ? "Processing…" : `Pay ${money(totalPayable)}`}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Right summary */}
                <div className="relative rounded-xl overflow-visible border-none min-h-[596px] lg:min-h-[500px]">
                  <div className="absolute inset-0 bg-[url('/WEB75.jpg')] bg-center md:bg-[length:334%_auto] bg-[length:310%_auto] bg-no-repeat" />

                  <div className="relative z-10 p-10 lg:p-6 lg:pt-62 pt-68 lg:pb-28 pb-28 text-sm">
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <div className="text-muted-foreground">Mode</div>
                      <div className="text-right text-gray-800">
                        {mode === "renew" ? "Renew" : "Upgrade"}
                      </div>

                      {mode === "renew" && (
                        <>
                          <div className="text-muted-foreground">Duration</div>
                          <div className="text-right text-gray-800">
                            {cycle ?? "monthly"}
                          </div>
                        </>
                      )}

                      <div className="text-muted-foreground">Gateway</div>
                      <div className="text-right text-gray-800">{gateway}</div>

                      <div className="text-muted-foreground">Base</div>
                      <div className="text-right text-gray-800">{money(baseAmount)}</div>

                      <div className="text-muted-foreground">Coupon</div>
                      <div className="text-right">{discount > 0 ? `- ${money(discount)}` : "—"}</div>

                      <div className="text-muted-foreground">GST (18%)</div>
                      <div className="text-right text-gray-800">{money(gst)}</div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 z-10 lg:px-6 px-10 pb-2 lg:pb-5">
                      <div className="pt-2 text-lg text-gray-600 flex items-center justify-between">
                        <span className="font-mono">Total Amount</span>
                        <span className="font-mono text-2xl">{money(totalPayable)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* end summary */}
              </div>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
