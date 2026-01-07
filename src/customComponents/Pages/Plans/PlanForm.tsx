import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import PricingCard from "./PricingCard";
import CouponSection from "./CouponSection";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import UserDetails from "./UserDetails";
import { customToast, toast } from "@/lib/toastConfig";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/api/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Gateway = "razorpay" | "cashfree" | "paypal";

// Renew/Upgrade endpoint
const RENEW_ENDPOINT = "/user/license/upgrade";
// Create endpoint
const CREATE_ENDPOINT = "/user/license/create";

export default function PlanForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedPlan = location.state?.selectedPlan;
  const passedLicenseId = location.state?.licenseId; // ✅ optional: pass licenseId from previous screen

  const { user } = useAuth();
  const userEmail = user?.email;

  const [userDetails, setUserDetails] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState(1);

  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    type: "percentage" | "fixed";
  } | null>(null);

  // gateway modal
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway>("razorpay");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Cashfree SDK loaded flag must persist across renders
  const cashfreeLoadedRef = useRef(false);

  useEffect(() => {
    if (!selectedPlan) {
      customToast.error("No plan selected.");
      navigate("/pricing", { replace: true });
    }
  }, [selectedPlan, navigate]);

  if (!selectedPlan) return null;

  const durationOptions = [
    { label: "1 Month", value: 1 },
    { label: "3 Months", value: 3 },
    { label: "6 Months", value: 6 },
    { label: "12 Months", value: 12 },
  ];

  const priceMap: Record<number, number> = useMemo(
    () => ({
      1: Number(selectedPlan.monthly ?? 0),
      3: Number(selectedPlan.quarterly ?? 0),
      6: Number(selectedPlan.half_yearly ?? 0),
      12: Number(selectedPlan.yearly ?? 0),
    }),
    [selectedPlan]
  );

  const currentPrice = priceMap[selectedDuration] ?? 0;

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.type === "percentage"
      ? (currentPrice * appliedCoupon.discount) / 100
      : Math.min(appliedCoupon.discount, currentPrice);
  }, [appliedCoupon, currentPrice]);

  const finalPrice = useMemo(() => {
    const value = currentPrice - discountAmount;
    return Math.max(0, Math.round(value * 100) / 100);
  }, [currentPrice, discountAmount]);

  // ✅ durationDays required by backend
  const durationDays = useMemo(() => selectedDuration * 30, [selectedDuration]);

  useEffect(() => {
    if (!userEmail) return;

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(
          `/user/get-by-email/${encodeURIComponent(userEmail)}`
        );
        setUserDetails(data);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
        customToast.error("Failed to load user details.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userEmail]);

  // ---------- helpers ----------
  const loadScript = (src: string) =>
    new Promise<boolean>((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  // ✅ licenseId resolver (adjust keys if your API uses different shape)
  const getLicenseId = () => {
    return (
      passedLicenseId ||
      userDetails?.licenseId ||
      userDetails?.license?.licenseId ||
      userDetails?.activeLicense?.licenseId ||
      userDetails?.currentLicense?.licenseId ||
      userDetails?.license?.id ||
      null
    );
  };

  /*
   * - if license exists -> renew/upgrade endpoint + include licenseId
   * - else -> create endpoint without licenseId
   */

  const callLicenseApi = async (args: {
    gateway: Gateway;
    orderId?: string | null;
    paymentId?: string | null;
    signature?: string | null;
  }) => {
    const licenseId = getLicenseId();
    const hasLicense = Boolean(licenseId);

    const email = userDetails?.email || userEmail;
    if (!email) {
      customToast.error("Email not found.");
      return;
    }

    const endpoint = hasLicense ? RENEW_ENDPOINT : CREATE_ENDPOINT;

    // If renewing, licenseId must exist (this is mostly safety)
    if (hasLicense && !licenseId) {
      customToast.error(
        "LicenseId not found. Please re-login or contact support."
      );
      return;
    }

    const payload: any = {
      planId: selectedPlan?.id,
      price: Number(finalPrice || 0),
      paymentId: args.paymentId || null,
      paymentMethod: args.gateway,
      userId: userDetails?.id,
      email: String(email),
      selectedMonths: selectedDuration,
      durationDays: Number(durationDays),
      amountPaid: Number(finalPrice || 0),
      subtotal: Number(currentPrice || 0),
      gst: 0,
      coupon: appliedCoupon?.code || null,
      payment: {
        gateway: args.gateway,
        orderId: args.orderId || null,
        paymentId: args.paymentId || null,
        signature: args.signature || null,
      },
    };

    if (hasLicense) {
      payload.licenseId = String(licenseId);
    }

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log("[LICENSE API] POST =>", url, payload);

      const res = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      console.log("[LICENSE API] RESPONSE =>", res.data);

      customToast.info(
        hasLicense ? "License renewed successfully!" : "License created successfully!"
      );

      setTimeout(() => {
        window.location.href = "https://dash.ionmonitor.com/user/login";
      }, 1200);
    } catch (err: any) {
      console.error(
        "[LICENSE API] ERROR =>",
        err?.response?.data || err?.message || err
      );
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "License API failed. Check console for details."
      );
    }
  };

  // --- Cashfree helpers ---
  const loadCashfreeSDK = async () => {
    if (cashfreeLoadedRef.current) return true;
    const ok = await loadScript("https://sdk.cashfree.com/js/v3/cashfree.js");
    cashfreeLoadedRef.current = ok;
    return ok;
  };

  const getCashfree = (mode: "sandbox" | "production") => {
    const factory = (window as any).Cashfree;
    if (!factory) throw new Error("Cashfree SDK not loaded");
    return factory({ mode });
  };

  // ---------- RAZORPAY ----------
  const payWithRazorpay = async () => {
    const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!ok) {
      customToast.error("Failed to load Razorpay.");
      return;
    }

    if (!Number.isFinite(finalPrice) || finalPrice < 1) {
      customToast.error("Amount must be at least ₹1.");
      return;
    }

    const orderResponse = await fetch(
      `${API_BASE_URL}/api/payment/razorpay/create-order`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalPrice,
          currency: "INR",
          receipt: `rcpt_${Date.now()}`,
        }),
      }
    );

    const orderData = await orderResponse.json();
    if (!orderResponse.ok || !orderData?.id) {
      customToast.error(orderData?.message || "Unable to create Razorpay order.");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "ION Monitor",
      description: `${selectedPlan.name} - ${selectedDuration} Months`,
      image: "/logo.png",
      order_id: orderData.id,

      handler: async (response: any) => {
        const verifyToast = customToast.loading("Verifying payment...");
        try {
          const verifyResponse = await fetch(
            `${API_BASE_URL}/api/payment/razorpay/verify`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            }
          );

          const verifyResult = await verifyResponse.json();
          toast.dismiss(verifyToast);

          if (verifyResponse.ok && verifyResult?.status === "success") {
            await callLicenseApi({
              gateway: "razorpay",
              orderId: response?.razorpay_order_id || orderData?.id || null,
              paymentId: response?.razorpay_payment_id || null,
              signature: response?.razorpay_signature || null,
            });
          } else {
            customToast.error("Payment verification failed. Please try again.");
          }
        } catch (err: any) {
          toast.dismiss(verifyToast);
          console.error("Razorpay verify error:", err?.response?.data || err);
          customToast.error("Payment verification failed. Please contact support.");
        }
      },

      prefill: {
        name: `${userDetails?.name ?? ""} ${userDetails?.surname ?? ""}`.trim(),
        email: userDetails?.email,
        contact: userDetails?.phone ? `+91${userDetails.phone}` : undefined,
      },

      notes: {
        plan: selectedPlan.name,
        duration: `${selectedDuration} months`,
        durationDays: `${durationDays} days`,
        email: userDetails?.email,
        userId: userDetails?.id,
      },

      theme: { color: "#0d9488" },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  // ---------- CASHFREE ----------
  const payWithCashfree = async () => {
    if (!Number.isFinite(finalPrice) || finalPrice < 1) {
      customToast.error("Amount must be at least ₹1.");
      return;
    }

    const res = await fetch(`${API_BASE_URL}/api/payment/cashfree/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: finalPrice,
        currency: "INR",
        // NOTE: Cashfree create-order usually expects "customer", not "prefill".
        // Keep your backend aligned. If your backend expects prefill, it's fine.
        customer: {
          id: userDetails?.id ? `user_${userDetails.id}` : `cust_${Date.now()}`,
          name:
            `${userDetails?.name ?? ""} ${userDetails?.surname ?? ""}`.trim() ||
            "Guest",
          email: userDetails?.email || "noemail@example.com",
          phone: `${userDetails?.phone || "9999999999"}`,
        },
        returnUrl: `${window.location.origin}/payment/return`,
        notifyUrl: `${API_BASE_URL}/api/payment/cashfree/webhook`,
      }),
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
      customToast.error(data?.error || "Failed to create Cashfree order.");
      return;
    }

    const { orderId, payment_session_id } = data || {};
    if (!orderId || !payment_session_id) {
      customToast.error("Cashfree response missing payment_session_id.");
      return;
    }

    const sdkOk = await loadCashfreeSDK();
    if (!sdkOk) {
      customToast.error("Failed to load Cashfree SDK.");
      return;
    }

    // if you want production vs sandbox:
    const mode = import.meta.env.VITE_CASHFREE_ENV === "production" ? "production" : "sandbox";
    const cashfree = getCashfree(mode);

    await cashfree.checkout({
      paymentSessionId: payment_session_id,
      redirectTarget: "_modal",
    });

    const verifyToast = customToast.loading("Verifying payment...");
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/api/payment/cashfree/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
        credentials: "include",
      });

      const verify = await verifyRes.json();
      toast.dismiss(verifyToast);

      if (verifyRes.ok && verify?.status === "success") {
        const cfPaymentId =
          verify?.paymentId ||
          verify?.cf_payment_id ||
          verify?.reference_id ||
          orderId;

        await callLicenseApi({
          gateway: "cashfree",
          orderId,
          paymentId: cfPaymentId,
          signature: null,
        });
      } else {
        customToast.error(
          `Payment not successful. Status: ${verify?.order_status || "UNKNOWN"}`
        );
      }
    } catch (err: any) {
      toast.dismiss(verifyToast);
      console.error("Cashfree verify error:", err?.response?.data || err);
      customToast.error("Cashfree verification failed. Please contact support.");
    }
  };
  

  // ---------- PAYPAL (optional) ----------
  const payWithPaypal = async () => {
    const res = await fetch(`${API_BASE_URL}/api/payment/paypal/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: finalPrice,
        currency: "USD",
        description: `${selectedPlan.name} - ${selectedDuration} Months`,
        metadata: {
          planId: selectedPlan.id,
          userId: userDetails?.id,
          email: userDetails?.email,
        },
      }),
    });

    const data = await res.json();
    if (data?.approvalUrl) {
      window.location.href = data.approvalUrl;
    } else {
      customToast.error("PayPal response missing approvalUrl.");
    }
  };

  // OPEN gateway picker modal
  const handleConfirmClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDetails) {
      customToast.error("User details not loaded.");
      return;
    }
    setGatewayOpen(true);
  };

  const handleProceedGateway = async () => {
    try {
      setProcessing(true);

      if (selectedGateway === "razorpay") await payWithRazorpay();
      if (selectedGateway === "cashfree") await payWithCashfree();
      if (selectedGateway === "paypal") await payWithPaypal();

      setGatewayOpen(false);
    } catch (err) {
      console.error(err);
      customToast.error("Something went wrong while starting the payment.");
    } finally {
      setProcessing(false);
    }
  };

  const durationLabel = durationOptions.find(
    (opt) => opt.value === selectedDuration
  )?.label;

  if (loading)
    return (
      <div className="p-6 text-2xl text-gray-400 text-center">Loading Info…</div>
    );

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <Button
            variant="ghost"
            onClick={() => navigate("/pricing")}
            className="mb-8 hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>

          <Card className="p-8 border-none">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-semibold text-gray-500 mb-2">
                Secure Checkout
              </h2>
              <p className="text-muted-foreground">
                Proceed to renew/extend your{" "}
                <span className="font-semibold text-blue-400 underline">
                  {selectedPlan.name}
                </span>{" "}
                plan license.
              </p>
            </div>

            <UserDetails userDetails={userDetails} />

            <div className="pt-6 border-t border-border">
              <Label className="text-xl text-gray-500 w-full block text-center mb-4">
                Select Duration
              </Label>

              <div className="flex justify-center gap-2 mb-4 flex-wrap">
                {durationOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`px-4 py-2 rounded border ${
                      selectedDuration === opt.value
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-700"
                    }`}
                    onClick={() => setSelectedDuration(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-6 p-4 bg-green-200/30 rounded-lg">
                <div>
                  <p className="font-semibold text-xl text-gray-600">
                    {selectedPlan.name} Plan
                  </p>
                  <p className="text-sm text-gray-500">
                    Amount • {durationDays} days
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-green-600">
                    ₹{currentPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              onClick={handleConfirmClick}
              disabled={!userDetails || processing}
              className="w-full h-12 text-xl bg-blue-500 hover:bg-blue-600"
            >
              {processing ? "Processing..." : "Confirm Order"}
            </Button>
          </Card>
        </div>

        <div className="w-full md:w-96 flex-shrink-0">
          <PricingCard
            originalAmount={currentPrice}
            finalAmount={finalPrice}
            durationLabel={durationLabel}
          />

          <div className="mt-10">
            <CouponSection
              planPrice={currentPrice}
              appliedCoupon={appliedCoupon}
              setAppliedCoupon={setAppliedCoupon}
            />
          </div>
        </div>
      </div>

      {/* Payment Gateway Picker Dialog */}
      <Dialog open={gatewayOpen} onOpenChange={setGatewayOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-700 text-center">
              Choose Payment Method
            </DialogTitle>
            <DialogDescription className="text-center">
              Select a gateway to complete your payment.
            </DialogDescription>
          </DialogHeader>

          <RadioGroup
            value={selectedGateway}
            onValueChange={(v: any) => setSelectedGateway(v as Gateway)}
            className="grid gap-3"
          >
            <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="razorpay" id="gw-razorpay" />
                <span className="font-medium text-gray-500">Razorpay</span>
              </div>
              <img src="Razorpay.svg" alt="Razorpay" className="h-8 opacity-90" />
            </label>

            <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="paypal" id="gw-paypal" />
                <span className="font-medium text-gray-500">PayPal</span>
              </div>
              <img
                src="/PayPal.svg.png"
                alt="PayPal"
                className="h-8 opacity-90"
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border p-3 cursor-pointer">
              <div className="flex items-center gap-3">
                <RadioGroupItem value="cashfree" id="gw-cashfree" />
                <span className="font-medium text-gray-500">Cashfree</span>
              </div>
              <img
                src="/cashfree1.png"
                alt="Cashfree"
                className="h-8 opacity-90"
              />
            </label>
          </RadioGroup>

          <DialogFooter className="mt-4">
            <Button
              onClick={handleProceedGateway}
              disabled={processing}
              className="bg-green-500 hover:bg-green-600 w-full text-lg cursor-pointer"
            >
              {processing ? "Starting..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
