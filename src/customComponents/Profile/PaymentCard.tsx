import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  Smartphone,
  Copy,
  Check,
  CalendarDays,
} from "lucide-react";

interface LicenseDetails {
  imei?: string;
  price?: number;
  paymentId?: string;
  paymentMethod?: string; // "razorpay" | "cashfree" | "paypal" | ...
}

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function PaymentCard({
  licenseDetails,
}: {
  licenseDetails: LicenseDetails;
}) {
  const { imei, price, paymentId, paymentMethod } = licenseDetails || {};
  const [copied, setCopied] = useState<"id" | "imei" | null>(null);

  const methodInfo = useMemo(() => {
    const m = (paymentMethod ?? "").toLowerCase();
    if (m.includes("razorpay")) return { name: "Razorpay", logo: "/Razorpay.svg" };
    if (m.includes("cashfree"))
      return { name: "Cashfree", logo: "/cashfree1.png" };
    if (m.includes("paypal"))
      return { name: "PayPal", logo: "/PayPal.svg.png" };
    return { name: paymentMethod || "Unknown", logo: "/payment.png" };
  }, [paymentMethod]);

  const copy = async (text?: string, key?: "id" | "imei") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key ?? null);
      setTimeout(() => setCopied(null), 1200);
    } catch {
      /* no-op */
    }
  };

  return (
    <Card className="overflow-hidden shadow-sm">
      <div className="px-5 py-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-900 text-white relative">
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 blur-md opacity-50 bg-white/30 rounded-xl" />
            <div className="relative rounded-xl bg-white/15 p-2.5 backdrop-blur">
              <img src="/payment.png" className="w-18 h-18" alt="Payment" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-3xl font-semibold">Payment Information</h3>
            <p className="text-white/85 text-sm mt-0.5">
              Your latest billing details and identifiers.
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6">
        {/* Amount */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/90 via-teal-500/90 to-cyan-500/90 text-white shadow">
          
          <div className="relative flex items-center justify-between p-5">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-8 w-8" />
              <span className="text-xl opacity-90">Amount</span>
            </div>
            <div className="text-3xl font-mono tracking-tight">
              {typeof price === "number" ? INR.format(price) : "N/A"}
            </div>
          </div>
          <div className="relative border-t border-white/20 px-5 py-3 text-xs/relaxed text-white/90 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Billed once at checkout
          </div>
        </div>

        {/* Method + IDs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Method (with logo) */}
          <div className="rounded-xl border bg-white/70 backdrop-blur p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Method
            </p>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 ring-1 ring-slate-200">
                <img
                  src={methodInfo.logo}
                  alt={methodInfo.name}
                  className="h-7 w-auto object-contain"
                />
              </div>
              <span className="text-sm font-medium text-slate-700">
                {methodInfo.name}
              </span>
            </div>
          </div>

          {/* Payment ID */}
          <div className="rounded-xl border bg-white/70 backdrop-blur p-4 ">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Payment ID
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm truncate text-slate-700 rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                {paymentId || "N/A"}
              </span>
              {paymentId && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 "
                  onClick={() => copy(paymentId, "id")}
                >
                  {copied === "id" ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Device IMEI */}
          <div className="rounded-xl border bg-white/70 backdrop-blur p-4  md:col-span-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">
              Device IMEI
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm truncate text-slate-700 rounded-md bg-slate-50 px-2 py-1 ring-1 ring-slate-200 flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                {imei || "N/A"}
              </span>
              {imei && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => copy(imei, "imei")}
                >
                  {copied === "imei" ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1.5" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="flex items-start gap-3 rounded-xl border bg-white p-4">
          <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <p className="text-xs text-muted-foreground">
            Save your Payment ID for support or invoice requests.
          </p>
        </div>
      </div>
    </Card>
  );
}
