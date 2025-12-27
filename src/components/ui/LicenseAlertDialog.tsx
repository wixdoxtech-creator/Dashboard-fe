import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle2,
  ShoppingCart,
} from "lucide-react";

type Props = {
  open?: boolean;
  forceOpen?: boolean;
  reason?: string; // "expired" | "none"
  onDismiss?: () => void;
};

export default function LicenseAlertDialog({
  open,
  forceOpen = false,
  reason = "none",
  onDismiss,
}: Props) {
  const [internalOpen, setInternalOpen] = useState<boolean>(!!open);
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof open === "boolean") setInternalOpen(open);
  }, [open]);

  const isExpired = reason === "expired";
  const title = isExpired ? "Your plan has expired" : "No active plan found";
  const desc = isExpired
    ? "Your subscription has ended. Renew now to restore full access."
    : "You don’t have an active plan yet. Purchase a plan to unlock all features.";

  const handleOpenChange = (next: boolean) => {
    if (forceOpen) return; // keep it open if forced
    setInternalOpen(next);
    if (!next) onDismiss?.();
  };

  return (
    <AlertDialog open={internalOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className="
          p-0 overflow-hidden rounded-2xl border-none shadow-2xl
          max-w-md sm:max-w-lg bg-white "
      >
        {/* Gradient banner */}
        <div
          className={`
            relative px-6 py-6 flex items-center gap-4
            ${
              isExpired
                ? "bg-gradient-to-r from-rose-600 via-red-500 to-orange-500"
                : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"
            }
          `}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              background:
                "radial-gradient(24px 24px at 10% 0%, rgba(255,255,255,.35) 0, transparent 60%)",
            }}
          />
          {/* Icon + glow */}
          <div className="relative">
              {isExpired ? (
                <img src="/lock3.png" className="w-25 h-25" />
              ) : (
                <img src="/shopping.png" className="w-25 h-25" />
              )}    
          </div>

          <div className="flex-1 min-w-0">
            <AlertDialogTitle className="text-white text-xl text-left sm:text-2xl font-semibold truncate">
              {title}
            </AlertDialogTitle>
            <p className="text-white/90 text-sm sm:text-base text-left">{desc}</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-3 pb-3">
          <AlertDialogHeader className="sr-only">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{desc}</AlertDialogDescription>
          </AlertDialogHeader>

          {/* Perks */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              With an active plan, you’ll get:
            </p>
            <ul className="space-y-2">
              {[
                "Call logs & recordings, SMS and contacts insights",
                "WhatsApp / Social media monitoring features",
                "Location history & live utilities",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600" />
                  <span className="text-sm text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground text-center">
              You’ll stay signed in. Purchasing or renewing takes less than a
              minute.
            </div>
          </div>
        </div>


        {/* Footer actions (30/70 split) */}
        <AlertDialogFooter className="bg-muted/30 p-4 sm:px-6 sm:py-5">
          <div
            className={`w-full grid ${
              forceOpen ? "grid-cols-1" : "grid-cols-10"
            } gap-2 items-stretch`}
          >
            {!forceOpen && (
              <AlertDialogCancel
                className="
          col-span-3
          h-[48px] sm:h-[56px]
          border border-gray-300 bg-white text-gray-700
          hover:bg-gray-50 hover:border-gray-400
          transition-colors
        "
              >
                Maybe later
              </AlertDialogCancel>
            )}

            <AlertDialogAction
              onClick={() => navigate("/pricing")}
              className={`${forceOpen ? "col-span-1" : "col-span-7"}
              relative group overflow-hidden
              h-[48px] sm:h-[56px] 
              text-white shadow-xl ring-1 ring-white/20 cursor-pointer
              ${
                isExpired
            ? "bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-500 hover:via-red-600 hover:to-orange-500"
            : "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500"
         }
        rounded-xl
        px-6 sm:px-8
        text-base sm:text-lg font-semibold
        transition-all duration-200
      `}
            >
              {/* Glow ring */}
              <span className="pointer-events-none absolute -inset-1 rounded-2xl opacity-40 blur-lg
               bg-white/20 group-hover:opacity-60 transition-opacity"
              />

              {/* Shimmer */}
              <span
                className="pointer-events-none absolute inset-0 -translate-x-full
                bg-gradient-to-r from-transparent via-white/40 to-transparent
                transition-transform duration-700 ease-out
                group-hover:translate-x-0"
              />

              <span className="relative z-10 flex items-center justify-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {isExpired ? "Renew plan" : "Buy a plan"}
              </span>
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
