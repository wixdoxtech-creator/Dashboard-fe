
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock } from 'lucide-react';

interface PricingCardProps {
  originalAmount: number,
  finalAmount: number,
  durationLabel?: string
}

const PricingCard = ({ originalAmount, finalAmount, durationLabel }: PricingCardProps) => {
  return (
    <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 py-4 mt-24 px-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center space-x-2 text-green-800">
          <Shield className="w-5 h-5" />
          <span>100% Secure Payment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-600">
          We accept worldwide payments via all major cards, internet banking, UPI and wallets.
        </p>

        {/* Payment Icons Grid */}
        <div className="grid grid-cols-4 gap-2">
          <img src="/visa.svg" alt="VISA" className="bg-white rounded w-full h-10 object-contain" />
          <img src="/Mastercard.svg" alt="MC" className="bg-white p-1 w-full h-10 object-contain" />
          <img src="/amex.png" alt="AMEX" className=" bg-white rounded w-full h-10 object-contain" />
          <img src="/Paytm.svg" alt="JCB" className="bg-white rounded w-full h-10 object-contain" />
          <img src="/PhonePe.webp" alt="NETS" className="bg-white p-1 rounded w-full h-10 object-contain" />
          <img src="/PayPal.svg.png" alt="UPI" className="bg-white p-1 rounded w-full h-10 object-contain" />
          <img src="/googlepay.webp" alt="GPAY" className="bg-white p-2 rounded w-full h-10 object-contain" />
          <img src="/upi.png" alt="BHIM" className="bg-white p-2 rounded w-full h-10 object-contain" />
        </div>

        <div className="text-center py-4">
          {durationLabel && (
            <div className="text-base font-medium text-gray-700 mb-1">For {durationLabel}</div>
          )}
          {originalAmount !== finalAmount ? (
            <>
              <div className="text-lg text-gray-400 line-through">₹{originalAmount.toLocaleString()}</div>
              <div className="text-3xl font-semibold text-green-600">₹{finalAmount.toLocaleString()}</div>
            </>
          ) : (
            <div className="text-3xl font-semibold text-green-600">₹{originalAmount.toLocaleString()}</div>
          )}
          <div className="text-sm text-slate-600">Total Amount</div>
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>Your payment will be processed by our partner, Razorpay Software (P) Limited and Others.</p>
         
        </div>

        <div className="flex items-center space-x-2 text-green-700">
          <Lock className="w-4 h-4" />
          <span className="text-xs font-medium">SSL Secured Payment</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingCard;