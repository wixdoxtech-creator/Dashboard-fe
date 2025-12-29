// import { useMemo, useState } from "react";
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogCancel,
//   AlertDialogAction,
// } from "@/components/ui/alert-dialog";
// import { Button } from "@/components/ui/button";
// import { Skeleton } from "@/components/ui/skeleton";

// type PlanId = 1 | 2 | 3;
// type PlanName = "Basic" | "Standard" | "Premium";

// type CurrentLicense = {
//   licenseId: string;
//   planId: PlanId;
//   planName: PlanName;
//   price: number;
// };

// export type Plan = {
//   id: PlanId;
//   name: PlanName;
//   price: number;
//   features?: string[];
// };

// type Props = {
//   open: boolean;
//   isLoading?: boolean;
//   onOpenChange: (next: boolean) => void;
//   currentLicense: CurrentLicense;
//   plans: Plan[];
//   onSelect?: (plan: Plan) => void;
//   onConfirm?: (plan: Plan | null) => void;
// };

// const PLAN_ORDER: Record<PlanName, number> = {
//   Basic: 1,
//   Standard: 2,
//   Premium: 3,
// };

// const money = (n: number) =>
//   new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 0,
//   }).format(n);

// function getUpgradeTargets(current: Plan, all: Plan[]) {
//   return all
//     .filter((p) => PLAN_ORDER[p.name] > PLAN_ORDER[current.name])
//     .sort((a, b) => PLAN_ORDER[a.name] - PLAN_ORDER[b.name]);
// }

// export default function UpgradePlanDialog({
//   open,
//   onOpenChange,
//   currentLicense,
//   plans,
//   isLoading = false,
//   onSelect,
//   onConfirm,
// }: Props) {
//   const current: Plan = {
//     id: currentLicense.planId,
//     name: currentLicense.planName,
//     price: currentLicense.price,
//   };

//   const upgradeTargets = useMemo(
//     () => getUpgradeTargets(current, plans),
//     [current, plans]
//   );
//   const isMaxPlan = upgradeTargets.length === 0;

//   // track user’s chosen target
//   const [selected, setSelected] = useState<Plan | null>(null);

//   // reset selection whenever dialog opens
//   useMemo(() => {
//     if (open) setSelected(null);
//   }, [open]);

//   return (
//     <AlertDialog
//       open={open}
//       onOpenChange={(v) => {
//         if (!v) setSelected(null);
//         onOpenChange(v);
//       }}
//     >
//       <AlertDialogContent
//         data-variant="wide"
//         className="border-none bg-transparent shadow-none"
//       >
//         <div className="mx-auto lg:w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
//           <div className="max-h-[85vh] flex flex-col">
//             {/* Banner */}
//             <div className="relative px-6 py-6 flex items-center gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
//               <img src="/upgrade.png" className="w-16 h-16" alt="upgrade" />
//               <div className="flex-1 min-w-0">
//                 <AlertDialogTitle className="text-white text-xl sm:text-2xl font-semibold truncate">
//                   Upgrade Your Plan
//                 </AlertDialogTitle>
//                 <p className="text-white/90 text-sm sm:text-base">
//                   You're on{" "}
//                   <span className="font-semibold">{current.name}</span>. Pay
//                   only the difference to move up.
//                 </p>
//               </div>
//             </div>

//             {/* Body */}
//             <div
//               className="px-6 pt-4 pb-4 flex-1 overflow-y-auto"
//               aria-busy={isLoading}
//             >
//               <AlertDialogHeader className="sr-only">
//                 <AlertDialogTitle>Upgrade plan</AlertDialogTitle>
//                 <AlertDialogDescription>
//                   Pick a higher plan to unlock more features.
//                 </AlertDialogDescription>
//               </AlertDialogHeader>

//               {isLoading ? (
//                 // ---------- SKELETONS WHILE LOADING ----------
//                 <div className="space-y-4 animate-in fade-in-0 duration-300 overflow-x-hidden">
//                   {/* Current plan skeleton */}
//                   <div className="mb-4 rounded-md border bg-muted/30 p-3">
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="flex-1 min-w-0 space-y-2">
//                         <Skeleton className="h-6 w-2/3 sm:w-56 max-w-full" />
//                         <Skeleton className="h-4 w-1/2 sm:w-40 max-w-full" />
//                       </div>
//                       <Skeleton className="h-4 w-24 sm:w-52 shrink-0" />
//                     </div>
//                   </div>

//                   {/* Target cards skeleton grid */}
//                   <div className="grid gap-3 sm:grid-cols-2">
//                     {[0, 1].map((i) => (
//                       <div
//                         key={i}
//                         className="rounded-sm border p-4 bg-white/80 overflow-hidden"
//                       >
//                         <div className="flex items-start justify-between gap-3">
//                           <Skeleton className="h-6 w-1/3 sm:w-28 max-w-full" />
//                           <div className="text-right space-y-2 shrink-0">
//                             <Skeleton className="h-3 w-16 sm:w-20" />
//                             <Skeleton className="h-4 w-20 sm:w-24" />
//                           </div>
//                         </div>

//                         <div className="mt-3 space-y-2">
//                           <Skeleton className="h-4 w-full" />
//                           <Skeleton className="h-4 w-5/6" />
//                           <Skeleton className="h-4 w-2/3" />
//                           <Skeleton className="h-4 w-1/2" />
//                         </div>

//                         <Skeleton className="mt-4 h-11 w-full rounded-lg" />
//                         <Skeleton className="mt-2 h-3 w-2/3 mx-auto" />
//                       </div>
//                     ))}
//                   </div>

//                   <div className="mt-4 rounded border bg-muted/40 px-3 py-2 text-md text-gray-600 text-center">
//                     Confirmation & payment come next.
//                   </div>
//                 </div>
//               ) : (
//                 // ---------- READY STATE ----------
//                 <>
//                   {/* Current */}
//                   <div className="mb-4 rounded-md border bg-muted/30 p-3 flex items-center justify-between">
//                     <div className="text-sm">
//                       <div className="font-semibold text-xl text-gray-500">
//                         Current : {current.name}
//                       </div>
//                       <div className="text-muted-foreground">
//                         Price paid : {money(current.price)}
//                       </div>
//                     </div>
//                     <div className="text-xs text-muted-foreground">
//                       Validity will remain the same after upgrade
//                     </div>
//                   </div>

//                   {/* Targets / Premium message */}
//                   {isMaxPlan ? (
//                     <div className="rounded-xl border bg-gradient-to-r from-emerald-50 via-cyan-50 to-teal-50 p-5 text-sm text-center text-gray-700">
//                       You’re already enjoying the{" "}
//                       <span className="text-emerald-600 font-semibold">
//                         Premium Plan
//                       </span>
//                       . Thanks for being one of our top users!
//                     </div>
//                   ) : (
//                     <div className="grid gap-3 sm:grid-cols-2">
//                       {upgradeTargets.map((target) => {
//                         const diff = Math.max(0, target.price - current.price);
//                         const active = selected?.id === target.id;
//                         return (
//                           <div
//                             key={target.id}
//                             className={`rounded-sm border p-4 transition bg-white/80 hover:bg-white cursor-pointer ${
//                               active ? "ring-2 ring-emerald-500" : ""
//                             }`}
//                             onClick={() => {
//                               setSelected(target);
//                               onSelect?.(target);
//                             }}
//                           >
//                             <div className="flex items-center justify-between">
//                               <div className="font-semibold text-2xl font-mono uppercase text-gray-600">
//                                 {target.name}
//                               </div>
//                               <div className="text-right">
//                                 <div className="text-xs text-muted-foreground line-through">
//                                   {money(target.price)}
//                                 </div>
//                                 <div className="text-base font-semibold">
//                                   {diff > 0 ? money(diff) : "No extra cost"}
//                                 </div>
//                               </div>
//                             </div>

//                             {!!target.features?.length && (
//                               <ul className="mt-3 space-y-1">
//                                 {target.features.slice(0, 4).map((f) => (
//                                   <li key={f} className="text-sm text-gray-700">
//                                     {f}
//                                   </li>
//                                 ))}
//                               </ul>
//                             )}

//                             <Button
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 setSelected(target);
//                                 onSelect?.(target);
//                               }}
//                               variant={active ? "default" : "secondary"}
//                               className="group relative overflow-hidden mt-4 w-full h-11 rounded-lg font-semibold flex items-center justify-center gap-2 shadow-lg ring-1 ring-white/20 transition-all cursor-pointer text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500"
//                             >
//                               {active ? "Selected" : `Choose ${target.name}`}
//                               <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-0" />
//                             </Button>

//                             <div className="mt-2 text-[11px] text-muted-foreground text-center">
//                               We’ll only charge the price difference. Validity
//                               stays same.
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   )}

//                   <div className="mt-4 rounded border bg-muted/40 px-3 py-2 text-md text-gray-600 text-center">
//                     Confirmation & payment come next.
//                   </div>
//                 </>
//               )}
//             </div>

//             {/* Footer */}
//             <AlertDialogFooter className="bg-muted/30 p-4 sm:px-6 sm:py-5">
//               <div className="w-full grid grid-cols-10 gap-2 items-stretch">
//                 <AlertDialogCancel className="col-span-4 h-[44px] sm:h-[48px] border border-gray-300 bg-white rounded-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors">
//                   Not now
//                 </AlertDialogCancel>
//                 <AlertDialogAction
//                   onClick={() => {
//                     // Emit selected plan (may be null if user didn’t choose yet)
//                     onConfirm?.(selected ?? null);
//                     onOpenChange(false);
//                   }}
//                   disabled={!selected}
//                   className="col-span-6 h-[44px] sm:h-[48px] cursor-pointer relative group overflow-hidden rounded-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500 text-white disabled:opacity-60"
//                 >
//                   <span className="pointer-events-none absolute -inset-1 rounded-2xl opacity-40 blur-lg bg-white/20 group-hover:opacity-60 transition-opacity" />
//                   <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-0" />
//                   Confirm
//                 </AlertDialogAction>
//               </div>
//             </AlertDialogFooter>
//           </div>
//         </div>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// }

// ✅ UpgradePlanDialog.tsx (COMPLETE UPDATED)
// - Upgrade mode: same as before (must select upgrade target)
// - Renew mode: NO plan selection needed
//   - shows duration buttons + optional dropdown
//   - pulls prices from fetched /api/plan (Plan.prices)
//   - returns { plan(with computed price), cycle } on confirm

import { useEffect, useMemo, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type PlanId = 1 | 2 | 3;
type PlanName = "Basic" | "Standard" | "Premium";
export type BillingCycle = "monthly" | "quarterly" | "half_yearly" | "yearly";

type CurrentLicense = {
  licenseId: string;
  planId: PlanId;
  planName: PlanName;
  price: number;
};

export type Plan = {
  id: PlanId;
  name: PlanName;
  price: number;
  prices: {
    monthly: number;
    quarterly: number;
    half_yearly: number;
    yearly: number;
  };
  features?: string[];
};

type Props = {
  open: boolean;
  isLoading?: boolean;
  onOpenChange: (next: boolean) => void;
  currentLicense: CurrentLicense;

  // ✅ Upgrade: all plans
  // ✅ Renew: only current plan
  plans: Plan[];

  onSelect?: (plan: Plan) => void;

  // ✅ Confirm returns plan + cycle (cycle only for renew)
  onConfirm?: (data: { plan: Plan; cycle?: BillingCycle } | null) => void;
};

const PLAN_ORDER: Record<PlanName, number> = {
  Basic: 1,
  Standard: 2,
  Premium: 3,
};

const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

function getUpgradeTargets(current: Plan, all: Plan[]) {
  return all
    .filter((p) => PLAN_ORDER[p.name] > PLAN_ORDER[current.name])
    .sort((a, b) => PLAN_ORDER[a.name] - PLAN_ORDER[b.name]);
}

function isRenewMode(current: Plan, plans: Plan[]) {
  if (plans.length !== 1) return false;
  const only = plans[0];
  return only.id === current.id && only.name === current.name;
}

const CYCLE_LABEL: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "6 Months",
  yearly: "Yearly",
};

export default function UpgradePlanDialog({
  open,
  onOpenChange,
  currentLicense,
  plans,
  isLoading = false,
  onSelect,
  onConfirm,
}: Props) {
  const current: Plan = useMemo(
    () => ({
      id: currentLicense.planId,
      name: currentLicense.planName,
      price: currentLicense.price,
      // fallback (not used for current object in renew selection)
      prices: {
        monthly: currentLicense.price,
        quarterly: currentLicense.price,
        half_yearly: currentLicense.price,
        yearly: currentLicense.price,
      },
    }),
    [currentLicense.planId, currentLicense.planName, currentLicense.price]
  );

  const renewMode = useMemo(() => isRenewMode(current, plans), [current, plans]);

  const upgradeTargets = useMemo(() => {
    if (renewMode) return [];
    return getUpgradeTargets(current, plans);
  }, [current, plans, renewMode]);

  const isMaxPlan = !renewMode && upgradeTargets.length === 0;

  const [selected, setSelected] = useState<Plan | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setCycle("monthly");
  }, [open]);

  // Renew mode: no selection needed, compute plan price from cycle
  const renewPlanComputed = useMemo(() => {
    if (!renewMode) return null;
    const p = plans[0];
    if (!p) return null;

    return {
      ...p,
      price: Number(p.prices?.[cycle]) || 0, // ✅ from /api/plan
    };
  }, [renewMode, plans, cycle]);

  const confirmData =
    renewMode && renewPlanComputed
      ? { plan: renewPlanComputed, cycle }
      : selected
      ? { plan: selected }
      : null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setSelected(null);
        onOpenChange(v);
      }}
    >
      <AlertDialogContent
        data-variant="wide"
        className="border-none bg-transparent shadow-none"
      >
        <div className="mx-auto lg:w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="max-h-[85vh] flex flex-col">
            {/* Banner */}
            <div className="relative px-6 py-6 flex items-center gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
              <img
                src={renewMode ? "/renew.png" : "/upgrade.png"}
                className="w-16 h-16"
                alt={renewMode ? "renew" : "upgrade"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/upgrade.png";
                }}
              />
              <div className="flex-1 min-w-0">
                <AlertDialogTitle className="text-white text-xl sm:text-2xl font-semibold truncate">
                  {renewMode ? "Renew Your Plan" : "Upgrade Your Plan"}
                </AlertDialogTitle>
                <p className="text-white/90 text-sm sm:text-base">
                  You’re on <span className="font-semibold">{current.name}</span>.{" "}
                  {renewMode ? "Choose duration and renew." : "Pay only the difference to move up."}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pt-4 pb-4 flex-1 overflow-y-auto" aria-busy={isLoading}>
              <AlertDialogHeader className="sr-only">
                <AlertDialogTitle>
                  {renewMode ? "Renew plan" : "Upgrade plan"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {renewMode
                    ? "Choose duration and confirm renewal."
                    : "Pick a higher plan to unlock more features."}
                </AlertDialogDescription>
              </AlertDialogHeader>

              {isLoading ? (
                <div className="space-y-4 animate-in fade-in-0 duration-300 overflow-x-hidden">
                  <div className="mb-4 rounded-md border bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-6 w-2/3 sm:w-56 max-w-full" />
                        <Skeleton className="h-4 w-1/2 sm:w-40 max-w-full" />
                      </div>
                      <Skeleton className="h-4 w-24 sm:w-52 shrink-0" />
                    </div>
                  </div>
                  <div className="mt-4 rounded border bg-muted/40 px-3 py-2 text-md text-gray-600 text-center">
                    Loading…
                  </div>
                </div>
              ) : (
                <>
                  {/* Current */}
                  <div className="mb-4 rounded-md border bg-muted/30 p-3 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-semibold text-xl text-gray-500">
                        Current : {current.name}
                      </div>
                      <div className="text-muted-foreground">
                        Price paid : {money(current.price)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {renewMode ? "Renewal will extend plan validity" : "Validity will remain the same after upgrade"}
                    </div>
                  </div>

                  {/* ✅ Renew mode */}
                  {renewMode ? (
                    <div className="rounded-sm border p-4 bg-white/90 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-2xl font-mono uppercase text-gray-600">
                          {plans[0]?.name ?? current.name}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">Price</div>
                          <div className="text-base font-semibold">
                            {money(renewPlanComputed?.price ?? 0)}
                          </div>
                        </div>
                      </div>

                      {/* ✅ Duration buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(["monthly", "quarterly", "half_yearly", "yearly"] as BillingCycle[]).map(
                          (c) => {
                            const active = cycle === c;
                            return (
                              <Button
                                key={c}
                                type="button"
                                onClick={() => setCycle(c)}
                                variant={active ? "default" : "outline"}
                                className={
                                  active
                                    ? "h-10 rounded-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white"
                                    : "h-10 rounded-sm border-gray-300 text-gray-700"
                                }
                              >
                                {CYCLE_LABEL[c]}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      {/* Optional dropdown (mobile) */}
                      <div className="sm:hidden">
                        <label className="text-xs text-gray-500">Duration</label>
                        <select
                          value={cycle}
                          onChange={(e) => setCycle(e.target.value as BillingCycle)}
                          className="mt-1 w-full h-10 rounded-sm border border-gray-300 bg-white px-3 text-sm"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="half_yearly">6 Months</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      {!!plans[0]?.features?.length && (
                        <ul className="space-y-1">
                          {plans[0].features!.slice(0, 6).map((f) => (
                            <li key={f} className="text-sm text-gray-700">
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div className="rounded border bg-muted/40 px-3 py-2 text-sm text-gray-600 text-center">
                        No plan selection needed. Just choose duration and confirm.
                      </div>
                    </div>
                  ) : isMaxPlan ? (
                    <div className="rounded-xl border bg-gradient-to-r from-emerald-50 via-cyan-50 to-teal-50 p-5 text-sm text-center text-gray-700">
                      You’re already enjoying the{" "}
                      <span className="text-emerald-600 font-semibold">Premium Plan</span>.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {upgradeTargets.map((target) => {
                        const diff = Math.max(0, target.price - current.price);
                        const active = selected?.id === target.id;

                        return (
                          <div
                            key={target.id}
                            className={`rounded-sm border p-4 transition bg-white/80 hover:bg-white cursor-pointer ${
                              active ? "ring-2 ring-emerald-500" : ""
                            }`}
                            onClick={() => {
                              setSelected(target);
                              onSelect?.(target);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-2xl font-mono uppercase text-gray-600">
                                {target.name}
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground line-through">
                                  {money(target.price)}
                                </div>
                                <div className="text-base font-semibold">
                                  {diff > 0 ? money(diff) : "No extra cost"}
                                </div>
                              </div>
                            </div>

                            {!!target.features?.length && (
                              <ul className="mt-3 space-y-1">
                                {target.features.slice(0, 4).map((f) => (
                                  <li key={f} className="text-sm text-gray-700">
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            )}

                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelected(target);
                                onSelect?.(target);
                              }}
                              variant={active ? "default" : "secondary"}
                              className="mt-4 w-full h-11 rounded-lg font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500"
                            >
                              {active ? "Selected" : `Choose ${target.name}`}
                            </Button>

                            <div className="mt-2 text-[11px] text-muted-foreground text-center">
                              We’ll only charge the price difference. Validity stays same.
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 rounded border bg-muted/40 px-3 py-2 text-md text-gray-600 text-center">
                    Confirmation & payment come next.
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <AlertDialogFooter className="bg-muted/30 p-4 sm:px-6 sm:py-5">
              <div className="w-full grid grid-cols-10 gap-2 items-stretch">
                <AlertDialogCancel className="col-span-4 h-[44px] sm:h-[48px] border border-gray-300 bg-white rounded-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                  Not now
                </AlertDialogCancel>

                <AlertDialogAction
                  onClick={() => {
                    onConfirm?.(confirmData);
                    onOpenChange(false);
                  }}
                  disabled={!renewMode && !selected}
                  className="col-span-6 h-[44px] sm:h-[48px] cursor-pointer relative group overflow-hidden rounded-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500 text-white disabled:opacity-60"
                >
                  {renewMode ? "Confirm Renewal" : "Confirm"}
                </AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
