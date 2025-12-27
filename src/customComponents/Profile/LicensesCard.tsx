import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";

import { api } from "@/api/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Smartphone,
  BadgeCheck,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";

type PlanId = 1 | 2 | 3;

type LicenseRow = {
  email: string;
  licenseId: string;
  imei: string | null;
  planId: PlanId;
  planName: "Basic" | "Standard" | "Premium";
  price: number;
  paymentId: string | null;
  paymentMethod: string | null;
  planStartAt: string | null;
  planExpireAt: string | null;
};

type ApiResponse = { count?: number; licenses: LicenseRow[] } | LicenseRow[];

const fmtDate = (iso?: string | null) => {
  if (!iso) return "N/A";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const isExpired = (iso?: string | null) =>
  !!iso && new Date(iso).getTime() <= Date.now();

const isExpiringSoon = (end?: string | null) => {
  if (!end) return false;
  const diff = new Date(end).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 && days <= 7;
};

const daysDiff = (a?: string | null, b?: string | null) => {
  if (!a || !b) return 0;
  const A = new Date(a).getTime();
  const B = new Date(b).getTime();
  if (isNaN(A) || isNaN(B)) return 0;
  return Math.max(0, Math.ceil((B - A) / (1000 * 60 * 60 * 24)));
};

const daysLeftFromNow = (end?: string | null) => {
  if (!end) return 0;
  const E = new Date(end).getTime();
  if (isNaN(E)) return 0;
  return Math.max(0, Math.ceil((E - Date.now()) / (1000 * 60 * 60 * 24)));
};

const pctUsed = (start?: string | null, end?: string | null) => {
  if (!start || !end) return 0;
  const total = daysDiff(start, end);
  const left = daysLeftFromNow(end);
  if (total <= 0) return 0;
  const used = Math.min(total, Math.max(0, total - left));
  return Math.round((used / total) * 100);
};


export default function LicensesCard({ email }: { email: string }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<LicenseRow[]>([]);
  const currentImei = user?.deviceImei?.trim() || "";

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!email) {
        setRows([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(
          `/user/license/email/${encodeURIComponent(email)}`
        );
        const list: LicenseRow[] = Array.isArray(data)
          ? data
          : (data as ApiResponse as any).licenses || [];
        // bound first; then nearest expiry
        const sorted = [...list].sort((a, b) => {
          const ab = a.imei ? 0 : 1;
          const bb = b.imei ? 0 : 1;
          if (ab !== bb) return ab - bb;
          const ax = a.planExpireAt
            ? new Date(a.planExpireAt).getTime()
            : Infinity;
          const bx = b.planExpireAt
            ? new Date(b.planExpireAt).getTime()
            : Infinity;
          return ax - bx;
        });
        if (mounted) setRows(sorted);
      } catch {
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [email]);

  const count = rows.length;

  const headerNote = useMemo(() => {
    if (!currentImei) return "No active device selected.";
    const attached = rows.find((r) => r.imei === currentImei);
    return attached
      ? `Active device: ${currentImei}`
      : `Selected device (${currentImei}) is not attached to any license.`;
  }, [rows, currentImei]);

  return (
    <Card className="overflow-hidden shadow-sm">
      {/* Top bar (simple) */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div>
          <h3 className="text-3xl font-semibold text-gray-400">Licenses</h3>
          <p className="text-sm text-muted-foreground font-mono">
            {headerNote}
          </p>
        </div>
        <p className="text-xl font-mono text-gray-500">Total:{count}</p>
      </div>

      {/* Body */}
      <div className="p-5">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200 mb-3" />
                <div className="grid grid-cols-1 gap-2">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                </div>
                <div className="mt-3 h-9 w-full animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : count === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No licenses found for this account.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
  {rows.map((lic) => {
    const expired = isExpired(lic.planExpireAt);
    const expSoon = isExpiringSoon(lic.planExpireAt);
    const isCurrent = lic.imei && lic.imei === currentImei;

    const usedPct = pctUsed(lic.planStartAt, lic.planExpireAt);
    const leftDays = daysLeftFromNow(lic.planExpireAt);

    // Header gradient tone
    const headerTone = isCurrent
      ? "from-sky-600 via-cyan-500 to-teal-500"
      : expired
      ? "from-rose-600 via-red-500 to-orange-500"
      : lic.imei
      ? "from-emerald-600 via-teal-600 to-cyan-600"
      : "from-slate-400 via-slate-300 to-slate-200";

    return (
      <div
        key={lic.licenseId}
        className={`
          group relative rounded-2xl border overflow-hidden
          backdrop-blur bg-white/60 dark:bg-white/5
          transition-all duration-300
          ${isCurrent ? "ring-2 ring-cyan-400/70 shadow-lg shadow-cyan-500/20" : "hover:shadow-md"}
        `}
      >
        {/* Glow frame for current */}
        {isCurrent && (
          <div className="pointer-events-none absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyan-400/40 via-teal-400/30 to-sky-400/40 blur-[10px]" />
        )}

        {/* Corner ribbon */}
        {expired && (
          <div className="absolute right-0 top-0">
            <div className="translate-x-2 -translate-y-2 rotate-45 select-none">
              <span className="inline-block bg-rose-600 text-white text-[10px] font-semibold px-8 py-1 shadow">
                EXPIRED
              </span>
            </div>
          </div>
        )}
        {expSoon && !expired && (
          <div className="absolute right-0 top-0">
            <div className="translate-x-2 -translate-y-2 rotate-45 select-none">
              <span className="inline-block bg-amber-500 text-white text-[10px] font-semibold px-8 py-1 shadow">
                EXPIRING SOON
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div
          className={`
            relative px-4 py-3 text-white
            bg-gradient-to-r ${headerTone}
          `}
        >

          <div className="flex items-center justify-between relative">
            {/* Left */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Pulse ring for current */}
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-white/30" />
                )}
                <div
                  className={`
                    relative flex items-center justify-center rounded-full h-12 w-12 shadow-inner
                    ${expired ? "bg-white/25" : "bg-white/20"}
                  `}
                >
                  {expired ? (
                    <AlertCircle className="h-6 w-6 text-white" />
                  ) : isCurrent ? (
                    <BadgeCheck className="h-6 w-6 text-white" />
                  ) : lic.imei ? (
                    <Smartphone className="h-6 w-6 text-white" />
                  ) : (
                    <LinkIcon className="h-6 w-6 text-white/80" />
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold leading-tight tracking-wide">
                  {lic.planName} • <span className="font-mono">{lic.licenseId}</span>
                </h4>
                <p className="text-xs/5 opacity-85">
                  {expired
                    ? "License expired"
                    : isCurrent
                    ? "Active device"
                    : lic.imei
                    ? "Bound to another device"
                    : "Unused license"}
                </p>
              </div>
            </div>

            {/* Right chips */}
            <div className="flex flex-col items-end gap-1">
          
              {!expired && lic.planExpireAt && (
                <span className="inline-flex items-center rounded-sm px-2 py-1.5 text-[12px] font-semibold bg-black/15">
                  {leftDays} day{leftDays === 1 ? "" : "s"} left
                </span>
              )}
            </div>
          </div>

          {/* Usage mini progress */}
          {lic.planStartAt && lic.planExpireAt && (
            <div className="mt-3 h-2 w-full rounded-full bg-white/25 overflow-hidden ring-1 ring-white/20">
              <div
                className="h-full bg-white/90 rounded-full transition-all"
                style={{ width: `${usedPct}%` }}
                aria-label={`Used ${usedPct}%`}
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div
          className={`
            relative p-4 space-y-3
            ${expired ? "bg-white/60 dark:bg-white/5" : "bg-white/75 dark:bg-white/10"}
          `}
        >
          {/* Soft top divider shine */}
          <div className="absolute -top-3 left-0 right-0 h-3 bg-gradient-to-b from-black/10 to-transparent opacity-10" />

          <div className="grid gap-3">
            {/* IMEI */}
            <div className="rounded-xl border bg-white/60 dark:bg-white/[0.02] px-3 py-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                IMEI
              </p>
              <p className="text-sm flex items-center gap-2 font-mono text-gray-700 dark:text-gray-300">
                <Smartphone className="h-4 w-4" />
                {lic.imei || "Not Used"}
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border bg-white/60 dark:bg-white/[0.02] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Start Date
                </p>
                <p className="text-sm">{fmtDate(lic.planStartAt)}</p>
              </div>
              <div className="rounded-xl border bg-white/60 dark:bg-white/[0.02] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Expiry Date
                </p>
                <p
                  className={`text-sm ${
                    expired
                      ? "text-rose-600 font-medium"
                      : expSoon
                      ? "text-amber-600 font-medium"
                      : ""
                  }`}
                >
                  {fmtDate(lic.planExpireAt)}
                </p>
              </div>
            </div>

            {/* Price */}
            {lic.price != null && (
              <div className="rounded-xl border bg-white/60 dark:bg-white/[0.02] px-3 py-2">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                  Price
                </p>
                <p className="text-lg text-gray-700 dark:text-gray-300 font-mono">
                  ₹{Number(lic.price).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  })}
</div>

        )}
      </div>
    </Card>
  );
}
