// import { Card } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { useEffect, useMemo, useState } from "react";
// import UpgradePlanDialog, { Plan } from "./UpgradePlanDialog";
 
// import { useAuth } from "@/contexts/AuthContext";
// import { api } from "@/api/api";
// import PaymentDialog from "./PaymentForm";

// export type PlanId = 1 | 2 | 3;
// export type PlanName = "Basic" | "Standard" | "Premium";

// export interface LicenseRecord {
//   email: string;
//   licenseId: string;
//   imei: string | null;
//   planId: PlanId;
//   planName: PlanName;
//   price: number;
//   paymentId: string;
//   paymentMethod: "razorpay" | string;
//   planStartAt: string;
//   planExpireAt: string;
// }
// export interface LicenseApiResponse {
//   count: number;
//   licenses: LicenseRecord[];
// }

// interface LicenseDetails {
//   licenseId?: string;
//   planId?: number;
//   imei?: string;
//   planName?: string;
//   planStartAt?: string;
//   planExpireAt?: string;
//   price?: number;
//   paymentId?: string;
//   paymentMethod?: string;
// }

// type PlanApiItem = {
//   id: number;
//   name: string;
//   description?: string;
//   monthly: number;
//   quarterly: number;
//   half_yearly: number;
//   yearly: number;
// };


// const SubscriptionCard = ({ licenseDetails }: { licenseDetails: LicenseDetails }) => {
//   const {
//     licenseId,
//     planName,
//     planStartAt,
//     planExpireAt,
//     paymentMethod,
//     price,
//   } = licenseDetails || {};

//   const formatDate = (dateString?: string) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString("en-IN", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   const getDurationInDays = (start?: string, end?: string): number => {
//     if (!start || !end) return 0;
//     const s = new Date(start), e = new Date(end);
//     if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
//     const diff = e.getTime() - s.getTime();
//     return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
//   };

//   const getDaysLeft = (end?: string): number => {
//     if (!end) return 0;
//     const now = new Date(), e = new Date(end);
//     if (isNaN(e.getTime())) return 0;
//     const diff = e.getTime() - now.getTime();
//     return Math.ceil(diff / (1000 * 60 * 60 * 24));
//   };

//   const totalDays = getDurationInDays(planStartAt, planExpireAt);
//   const rawDaysLeft = getDaysLeft(planExpireAt);
//   const daysLeft = Math.max(0, rawDaysLeft);
//   const usedDays = totalDays ? Math.min(totalDays, Math.max(0, totalDays - daysLeft)) : 0;
//   const progressPct = totalDays ? Math.round((usedDays / totalDays) * 100) : 0;

//   const isExpired = planExpireAt ? new Date(planExpireAt).getTime() <= Date.now() : false;
//   const isExpiringSoon = !isExpired && daysLeft <= 7 && totalDays > 0;

//   const tone = isExpired ? "rose" : isExpiringSoon ? "amber" : "emerald";

//   const statusBadge = isExpired ? (
//     <Badge className="bg-rose-100 text-rose-700 border-rose-200">Expired</Badge>
//   ) : isExpiringSoon ? (
//     <Badge className="bg-amber-100 text-amber-800 border-amber-200">Expiring soon</Badge>
//   ) : (
//     <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
//   );

//   const planChip = planName ? (
//     <Badge variant="outline" className="bg-white/20 text-white border-white/40 text-sm">{planName}</Badge>
//   ) : (
//     <Badge variant="outline" className="bg-white/20 text-white border-white/40 text-sm">No Plan</Badge>
//   );

//   const [upgradeOpen, setUpgradeOpen] = useState(false);
//   const [paymentOpen, setPaymentOpen] = useState(false);       // payment dialog state
//   const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null); // chosen target

//   const [allPlans, setAllPlans] = useState<Plan[]>([]);
//   const [loadingPlans, setLoadingPlans] = useState(false);

//   const { user, currentLicense } = useAuth();
//   const email = user?.email;

//   const DEFAULT_FEATURES: Record<PlanName, string[]> = {
//     Basic: ["Core logs", "Limited history"],
//     Standard: ["Everything in Basic", "Extended history", "Extended Contacts", "Extended Photos", "Extended Docs"],
//     Premium: ["Everything in Standard", "Advanced monitoring", "Live Streaming", "Priority support"],
//   };

 

//   useEffect(() => {
//     if (!upgradeOpen) return;
  
//     const fetchPlans = async () => {
//       try {
//         setLoadingPlans(true);
//         const { data } = await api.get<PlanApiItem[]>("/api/plan", { withCredentials: true });
//         const normalized: Plan[] = data
//           .map((p) => {
//             const safeName = (["Basic", "Standard", "Premium"].includes(p.name) ? p.name : "Basic") as PlanName;
//             return {
//               id: p.id as PlanId,
//               name: safeName,
//               price: Number(p.monthly) || 0,                // pick monthly as default display price
//               features: DEFAULT_FEATURES[safeName],        // fallback features
//             };
//           })
//           .sort((a, b) => a.id - b.id);
  
//         setAllPlans(normalized);
//       } catch (err) {
//         console.error("Error fetching global plans:", err);
//         setAllPlans([]);
//       } finally {
//         setLoadingPlans(false);
//       }
//     };
  
//     fetchPlans();
//   }, [upgradeOpen]);
  
//   // Build current plan object (for PaymentDialog)
//   const currentPlanForPayment: Plan | null = useMemo(() => {
//     if (!currentLicense) return null;
//     return {
//       id: currentLicense.planId as PlanId,
//       name: (currentLicense.planName ?? "Basic") as PlanName,
//       price: Number(currentLicense.price) || 0,
//     };
//   }, [currentLicense]);

//   const expiryText = useMemo(() => {
//     if (!currentLicense?.planExpireAt) return undefined;
//     try {
//       return new Date(currentLicense.planExpireAt).toLocaleDateString("en-IN", {
//         day: "2-digit",
//         month: "long",
//         year: "numeric",
//       });
//     } catch {
//       return undefined;
//     }
//   }, [currentLicense?.planExpireAt]);

//   const isPlansLoading =
//   upgradeOpen && (loadingPlans || allPlans.length === 0);


//   return (
//     <Card className="overflow-hidden shadow-sm">
//       {/* Header */}
//       <div
//         className={`
//           relative px-5 py-5 bg-gradient-to-r
//           ${tone === "rose" ? "from-rose-600 via-red-500 to-orange-500"
//             : tone === "amber" ? "from-amber-500 via-orange-500 to-yellow-500"
//             : "from-emerald-600 via-teal-600 to-cyan-600"}
//           text-white
//         `}
//       >
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <div className="absolute inset-0 blur-md opacity-50 bg-white/30 rounded-xl" />
//             <div className="relative rounded-xl bg-white/15 p-2.5 backdrop-blur">
//               <img src="/credit.png" className="w-20 h-20" alt="credit" />
//             </div>
//           </div>

//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-2 flex-wrap">
//               <h3 className="text-3xl font-semibold">Subscription</h3>
//               {planChip}
//               {statusBadge}
//             </div>
//             <p className="text-white/85 text-sm mt-1">
//               {isExpired ? "Your plan has expired. Renew to continue." : "Manage your current subscription details."}
//             </p>
//           </div>

//           <div className="hidden sm:block">
//             {isExpired ? (
//               <img src="/alert.png" className="w-15 h-15" />
//             ) : (
//               <img src="/approve.png" className="w-15 h-15 opacity-60" />
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Body */}
//       <div className="p-6 space-y-6">
//         {/* Progress */}
//         <div>
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-md text-muted-foreground">Usage</span>
//           </div>
//           <div className="h-5 w-full rounded-full bg-gray-100 overflow-hidden ring-1 ring-black/5">
//             <div
//               className={`h-full rounded-full transition-all ${
//                 tone === "rose" ? "bg-rose-500" : tone === "amber" ? "bg-amber-500" : "bg-emerald-500"
//               }`}
//               style={{ width: `${progressPct}%` }}
//             />
//           </div>

//           <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm sm:text-base">
//             <div className="flex items-center gap-1.5 min-w-0">
//               <span className="text-muted-foreground font-mono">Start:</span>
//               <span className="font-mono text-gray-500 truncate">{formatDate(planStartAt)}</span>
//             </div>
//             <div className="flex items-center gap-1.5">
//               {totalDays > 0 ? (
//                 <>
//                   <span className="text-muted-foreground font-mono">Days left:</span>
//                   <span className={isExpired ? "text-rose-600 font-semibold" : "text-gray-600 font-semibold"}>
//                     {isExpired ? 0 : daysLeft}
//                   </span>
//                 </>
//               ) : (
//                 <span className="text-muted-foreground">Trial</span>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Details */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <div className="rounded-lg border p-3">
//             <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Plan</p>
//             <p className="mt-1 text-xl text-gray-600">{planName || "No Plan"}</p>
//           </div>

//           <div className="rounded-lg border p-3">
//             <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">License ID</p>
//             <p className="mt-1 font-mono">{licenseId || "N/A"}</p>
//           </div>

//           <div className="rounded-lg border p-3">
//             <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Start Date</p>
//             <p className="mt-1">{formatDate(planStartAt)}</p>
//           </div>

//           <div className="rounded-lg border p-3">
//             <p className={`mt-1 ${isExpired ? "text-rose-600 font-semibold" : ""}`}>
//               <span className="text-sm uppercase tracking-wider text-muted-foreground mr-2">Expiry Date</span>
//               {formatDate(planExpireAt)}
//             </p>
//           </div>

//           {paymentMethod && (
//             <div className="rounded-lg border p-3">
//               <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Payment Method</p>
//               <p className="mt-1 capitalize">{paymentMethod}</p>
//             </div>
//           )}

//           {price != null && (
//             <div className="rounded-lg border p-3">
//               <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">Price</p>
//               <p className="mt-1 text-2xl text-gray-400 font-mono">₹{Number(price).toLocaleString()}</p>
//             </div>
//           )}
//         </div>

//         {/* Actions */}
//         <div className="flex flex-wrap gap-2">
//           <Button
//             className={`
//               group relative overflow-hidden text-white shadow-md
//               ${isExpired
//                 ? "bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-500 hover:via-red-600 hover:to-orange-500"
//                 : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500"}
//             `}
//             onClick={() => setUpgradeOpen(true)}
//             disabled={loadingPlans}
//           >
//             <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-0" />
//             {loadingPlans ? "Loading..." : isExpired ? "Renew plan" : "Upgrade / Manage plan"}
//           </Button>
//         </div>
//       </div>

//       {/* Step 1: Upgrade selection */}
//       {upgradeOpen && currentLicense && (
//         <UpgradePlanDialog
//           open={upgradeOpen}
//           onOpenChange={setUpgradeOpen}
//           currentLicense={{
//             licenseId: currentLicense.licenseId,
//             planId: currentLicense.planId,
//             planName: (currentLicense.planName ?? "Basic") as PlanName,
//             price: Number(currentLicense.price) || 0,
//           }}
//           plans={allPlans}
//           isLoading={isPlansLoading}
 
//           //  The important part: Confirm moves to payment
//           onConfirm={(plan) => {
//             if (!plan) return;
//             setSelectedPlan(plan);
//             setPaymentOpen(true);
//           }}
//         />
//       )}

//       {/* Step 2: Payment */}
//       {paymentOpen && currentPlanForPayment && selectedPlan && currentLicense && (
//         <PaymentDialog
//           open={paymentOpen}
//           onOpenChange={(v) => setPaymentOpen(v)}
//           email={email ?? "user@example.com"}
//           licenseId={currentLicense.licenseId}
//           imei={currentLicense.imei ?? undefined}
//           expiryText={expiryText}
//           currentPlan={currentPlanForPayment}
//           targetPlan={selectedPlan}
//           onPay={async (payload) => {
//             console.log("Pay → payload", payload);
//           }}
//         />
//       )}
//     </Card>
//   );
// };

// export default SubscriptionCard;

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import UpgradePlanDialog, { Plan } from "./UpgradePlanDialog";

import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/api";
import PaymentDialog from "./PaymentForm";

export type PlanId = 1 | 2 | 3;
export type PlanName = "Basic" | "Standard" | "Premium";

export interface LicenseRecord {
  email: string;
  licenseId: string;
  imei: string | null;
  planId: PlanId;
  planName: PlanName;
  price: number;
  paymentId: string;
  paymentMethod: "razorpay" | string;
  planStartAt: string;
  planExpireAt: string;
}
export interface LicenseApiResponse {
  count: number;
  licenses: LicenseRecord[];
}

interface LicenseDetails {
  licenseId?: string;
  planId?: number;
  imei?: string;
  planName?: string;
  planStartAt?: string;
  planExpireAt?: string;
  price?: number;
  paymentId?: string;
  paymentMethod?: string;
}

type PlanApiItem = {
  id: number;
  name: string;
  description?: string;
  monthly: number;
  quarterly: number;
  half_yearly: number;
  yearly: number;
};

const SubscriptionCard = ({
  licenseDetails,
}: {
  licenseDetails: LicenseDetails;
}) => {
  const { licenseId, planName, planStartAt, planExpireAt, paymentMethod, price } =
    licenseDetails || {};

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDurationInDays = (start?: string, end?: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start),
      e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    const diff = e.getTime() - s.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getDaysLeft = (end?: string): number => {
    if (!end) return 0;
    const now = new Date(),
      e = new Date(end);
    if (isNaN(e.getTime())) return 0;
    const diff = e.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const totalDays = getDurationInDays(planStartAt, planExpireAt);
  const rawDaysLeft = getDaysLeft(planExpireAt);
  const daysLeft = Math.max(0, rawDaysLeft);
  const usedDays = totalDays
    ? Math.min(totalDays, Math.max(0, totalDays - daysLeft))
    : 0;
  const progressPct = totalDays ? Math.round((usedDays / totalDays) * 100) : 0;

  const isExpired = planExpireAt
    ? new Date(planExpireAt).getTime() <= Date.now()
    : false;
  const isExpiringSoon = !isExpired && daysLeft <= 7 && totalDays > 0;

  const tone = isExpired ? "rose" : isExpiringSoon ? "amber" : "emerald";

  const statusBadge = isExpired ? (
    <Badge className="bg-rose-100 text-rose-700 border-rose-200">Expired</Badge>
  ) : isExpiringSoon ? (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200">
      Expiring soon
    </Badge>
  ) : (
    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
      Active
    </Badge>
  );

  const planChip = planName ? (
    <Badge
      variant="outline"
      className="bg-white/20 text-white border-white/40 text-sm"
    >
      {planName}
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-white/20 text-white border-white/40 text-sm"
    >
      No Plan
    </Badge>
  );

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // ✅ NEW: mode state (upgrade / renew)
  const [mode, setMode] = useState<"upgrade" | "renew">("upgrade");

  const { user, currentLicense } = useAuth();
  const email = user?.email;

  const DEFAULT_FEATURES: Record<PlanName, string[]> = {
    Basic: ["Core logs", "Limited history"],
    Standard: [
      "Everything in Basic",
      "Extended history",
      "Extended Contacts",
      "Extended Photos",
      "Extended Docs",
    ],
    Premium: [
      "Everything in Standard",
      "Advanced monitoring",
      "Live Streaming",
      "Priority support",
    ],
  };

  // ✅ Fetch all plans only when Upgrade dialog is open AND mode is upgrade
  useEffect(() => {
    if (!upgradeOpen) return;
    if (mode !== "upgrade") return;

    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const { data } = await api.get<PlanApiItem[]>("/api/plan", {
          withCredentials: true,
        });

        const normalized: Plan[] = data
          .map((p) => {
            const safeName = (["Basic", "Standard", "Premium"].includes(p.name)
              ? p.name
              : "Basic") as PlanName;

            return {
              id: p.id as PlanId,
              name: safeName,
              price: Number(p.monthly) || 0,
              features: DEFAULT_FEATURES[safeName],
            };
          })
          .sort((a, b) => a.id - b.id);

        setAllPlans(normalized);
      } catch (err) {
        console.error("Error fetching global plans:", err);
        setAllPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [upgradeOpen, mode]);

  // Build current plan object (for PaymentDialog)
  const currentPlanForPayment: Plan | null = useMemo(() => {
    if (!currentLicense) return null;
    return {
      id: currentLicense.planId as PlanId,
      name: (currentLicense.planName ?? "Basic") as PlanName,
      price: Number(currentLicense.price) || 0,
    };
  }, [currentLicense]);

  const expiryText = useMemo(() => {
    if (!currentLicense?.planExpireAt) return undefined;
    try {
      return new Date(currentLicense.planExpireAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return undefined;
    }
  }, [currentLicense?.planExpireAt]);

  // ✅ NEW: visible plans for dialog (renew shows only current plan)
  const visiblePlans: Plan[] = useMemo(() => {
    if (!currentLicense) return [];

    if (mode === "renew") {
      const safeName = (currentLicense.planName ?? "Basic") as PlanName;
      return [
        {
          id: currentLicense.planId as PlanId,
          name: safeName,
          price: Number(currentLicense.price) || 0,
          features: DEFAULT_FEATURES[safeName],
        },
      ];
    }

    return allPlans;
  }, [mode, allPlans, currentLicense]);

  // ✅ Loading only matters for upgrade
  const isPlansLoading =
    upgradeOpen && mode === "upgrade" && (loadingPlans || allPlans.length === 0);

  return (
    <Card className="overflow-hidden shadow-sm">
      {/* Header */}
      <div
        className={`
          relative px-5 py-5 bg-gradient-to-r
          ${
            tone === "rose"
              ? "from-rose-600 via-red-500 to-orange-500"
              : tone === "amber"
              ? "from-amber-500 via-orange-500 to-yellow-500"
              : "from-emerald-600 via-teal-600 to-cyan-600"
          }
          text-white
        `}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 blur-md opacity-50 bg-white/30 rounded-xl" />
            <div className="relative rounded-xl bg-white/15 p-2.5 backdrop-blur">
              <img src="/credit.png" className="w-20 h-20" alt="credit" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-3xl font-semibold">Subscription</h3>
              {planChip}
              {statusBadge}
            </div>
            <p className="text-white/85 text-sm mt-1">
              {isExpired
                ? "Your plan has expired. Renew to continue."
                : "Manage your current subscription details."}
            </p>
          </div>

          <div className="hidden sm:block">
            {isExpired ? (
              <img src="/alert.png" className="w-15 h-15" alt="alert" />
            ) : (
              <img src="/approve.png" className="w-15 h-15 opacity-60" alt="ok" />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-md text-muted-foreground">Usage</span>
          </div>
          <div className="h-5 w-full rounded-full bg-gray-100 overflow-hidden ring-1 ring-black/5">
            <div
              className={`h-full rounded-full transition-all ${
                tone === "rose"
                  ? "bg-rose-500"
                  : tone === "amber"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm sm:text-base">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-muted-foreground font-mono">Start:</span>
              <span className="font-mono text-gray-500 truncate">
                {formatDate(planStartAt)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {totalDays > 0 ? (
                <>
                  <span className="text-muted-foreground font-mono">
                    Days left:
                  </span>
                  <span
                    className={
                      isExpired
                        ? "text-rose-600 font-semibold"
                        : "text-gray-600 font-semibold"
                    }
                  >
                    {isExpired ? 0 : daysLeft}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">Trial</span>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              Plan
            </p>
            <p className="mt-1 text-xl text-gray-600">{planName || "No Plan"}</p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              License ID
            </p>
            <p className="mt-1 font-mono">{licenseId || "N/A"}</p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
              Start Date
            </p>
            <p className="mt-1">{formatDate(planStartAt)}</p>
          </div>

          <div className="rounded-lg border p-3">
            <p className={`mt-1 ${isExpired ? "text-rose-600 font-semibold" : ""}`}>
              <span className="text-sm uppercase tracking-wider text-muted-foreground mr-2">
                Expiry Date
              </span>
              {formatDate(planExpireAt)}
            </p>
          </div>

          {paymentMethod && (
            <div className="rounded-lg border p-3">
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                Payment Method
              </p>
              <p className="mt-1 capitalize">{paymentMethod}</p>
            </div>
          )}

          {price != null && (
            <div className="rounded-lg border p-3">
              <p className="text-sm uppercase tracking-wider text-muted-foreground mb-2">
                Price
              </p>
              <p className="mt-1 text-2xl text-gray-400 font-mono">
                ₹{Number(price).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Upgrade / Manage */}
          <Button
            className={`
              group relative overflow-hidden text-white shadow-md
              ${
                isExpired
                  ? "bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-500 hover:via-red-600 hover:to-orange-500"
                  : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500"
              }
            `}
            onClick={() => {
              setMode("upgrade");
              setUpgradeOpen(true);
            }}
            disabled={loadingPlans}
          >
            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-0" />
            {loadingPlans ? "Loading..." : isExpired ? "Renew plan" : "Upgrade / Manage plan"}
          </Button>

          {/* ✅ Renew button (shows only current plan) */}
          {!isExpired && (
            <Button
              variant="outline"
              className="border-gray-200 bg-white bg-gradient-to-r hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500 hover:text-white"
              onClick={() => {
                setMode("renew");
                setUpgradeOpen(true);
              }}
            >
              Renew
            </Button>
          )}
        </div>
      </div>

      {/* Step 1: Upgrade / Renew selection */}
      {upgradeOpen && currentLicense && (
        <UpgradePlanDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          currentLicense={{
            licenseId: currentLicense.licenseId,
            planId: currentLicense.planId,
            planName: (currentLicense.planName ?? "Basic") as PlanName,
            price: Number(currentLicense.price) || 0,
          }}
          plans={visiblePlans}
          isLoading={isPlansLoading}
          onConfirm={(plan) => {
            if (!plan) return;
            setSelectedPlan(plan);
            setPaymentOpen(true);
          }}
        />
      )}

      {/* Step 2: Payment */}
      {paymentOpen && currentPlanForPayment && selectedPlan && currentLicense && (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={(v) => setPaymentOpen(v)}
          email={email ?? "user@example.com"}
          licenseId={currentLicense.licenseId}
          imei={currentLicense.imei ?? undefined}
          expiryText={expiryText}
          currentPlan={currentPlanForPayment}
          targetPlan={selectedPlan}
          onPay={async (payload) => {
            console.log("Pay → payload", payload);
          }}
        />
      )}
    </Card>
  );
};

export default SubscriptionCard;

