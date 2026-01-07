import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag } from "lucide-react";
import { useState } from "react";

interface CouponSectionProps {
  planPrice: number;
  appliedCoupon: {
    code: string;
    discount: number;
    type: "percentage" | "fixed";
  } | null;
  setAppliedCoupon: (coupon: CouponSectionProps["appliedCoupon"]) => void;
}

const CouponSection = ({
  planPrice,
  appliedCoupon,
  setAppliedCoupon,
}: CouponSectionProps) => {
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");

  const applyCoupon = () => {
    setCouponError("");
    const validCoupons = {
      SAVE10: { discount: 10, type: "percentage" as const },
      SAVE20: { discount: 20, type: "percentage" as const },
      FLAT5: { discount: 5, type: "fixed" as const },
      FLAT500: { discount: 5998, type: "fixed" as const },
    };

    const coupon = validCoupons[couponCode.toUpperCase() as keyof typeof validCoupons];

    if (coupon) {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        ...coupon,
      });
      setCouponCode("");
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.type === "percentage"
      ? (planPrice * appliedCoupon.discount) / 100
      : Math.min(appliedCoupon.discount, planPrice);
  };

  const finalPrice = planPrice - calculateDiscount();

  return (
    <>
      <div className="space-y-4 p-4 py-8 bg-muted/20 rounded-lg border border-border/50">
        <Label className="flex items-center gap-2 text-xl font-semibold text-gray-600">
          <Tag className="w-5 h-5" />
          Apply Coupon Code
        </Label>

        {!appliedCoupon ? (
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1"
            />
            <Button
              className="bg-green-400 hover:bg-green-500"
              type="button"
              variant="outline"
              onClick={applyCoupon}
              disabled={!couponCode.trim()}
            >
              Apply
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-md">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-success" />
              <span className="font-medium text-success">
                {appliedCoupon.code} applied
              </span>
              <span className="text-sm text-muted-foreground">
                ({appliedCoupon.type === "percentage"
                  ? `${appliedCoupon.discount}% off`
                  : `₹${appliedCoupon.discount} off`})
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeCoupon}
              className="text-white bg-red-500 hover:text-white hover:bg-red-600"
            >
              Remove
            </Button>
          </div>
        )}

        {couponError && (
          <p className="text-sm text-destructive">{couponError}</p>
        )}
      </div>

      {appliedCoupon && (
        <div>
          <div className="flex items-center justify-between border-t border-border pt-4 px-4">
            <p className="text-sm text-muted-foreground">
              Discount ({appliedCoupon.code})
            </p>
            <p className="text-lg text-success text-gray-400">
              - ₹{calculateDiscount().toFixed(2)}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2 px-4">
            <span className="font-semibold text-gray-500">Final Price:</span>
            <span className="font-semibold text-green-700">
              ₹{finalPrice.toFixed(2)}
            </span>
          </div>

        </div>



      )}


    </>
  );
};

export default CouponSection;
