// components/common/ConfirmDialog.tsx
import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

type Variant = "danger" | "warning" | "info" | "success";

const variantStyles: Record<
  Variant,
  {
    ring: string;
    titleGradient: string;
    iconBg: string;
    iconFg: string;
    actionBg: string;
    actionHover: string;
    focusRing: string;
  }
> = {
  danger: {
    ring: "ring-red-500/30",
    titleGradient: "from-red-600 to-rose-500",
    iconBg: "bg-red-100 dark:bg-red-900/40",
    iconFg: "text-red-600",
    actionBg: "from-rose-600 to-red-600",
    actionHover: "hover:from-rose-700 hover:to-red-700",
    focusRing: "focus-visible:ring-red-400",
  },
  warning: {
    ring: "ring-amber-500/30",
    titleGradient: "from-amber-600 to-orange-500",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconFg: "text-amber-600",
    actionBg: "from-amber-600 to-orange-600",
    actionHover: "hover:from-amber-700 hover:to-orange-700",
    focusRing: "focus-visible:ring-amber-400",
  },
  info: {
    ring: "ring-blue-500/30",
    titleGradient: "from-blue-600 to-cyan-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconFg: "text-blue-600",
    actionBg: "from-blue-600 to-cyan-600",
    actionHover: "hover:from-blue-700 hover:to-cyan-700",
    focusRing: "focus-visible:ring-blue-400",
  },
  success: {
    ring: "ring-emerald-500/30",
    titleGradient: "from-emerald-600 to-green-500",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconFg: "text-emerald-600",
    actionBg: "from-emerald-600 to-green-600",
    actionHover: "hover:from-emerald-700 hover:to-green-700",
    focusRing: "focus-visible:ring-emerald-400",
  },
};

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  onConfirm: () => void | Promise<void>;
  confirming?: boolean;
  disabled?: boolean;

  /** UI customizations */
  variant?: Variant;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode; // default AlertTriangle
  className?: string;

  /** Prevent closing by outside click/ESC while confirming */
  lockWhileConfirming?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirming = false,
  disabled = false,
  variant = "danger",
  confirmText = "Confirm",
  cancelText = "Cancel",
  icon,
  className,
  lockWhileConfirming = true,
}: ConfirmDialogProps) {
  const v = variantStyles[variant];

  // block outside close while confirming
  const handleOpenChange = (next: boolean) => {
    if (lockWhileConfirming && confirming) return;
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className={cn(
          "sm:max-w-[520px] rounded-2xl border border-gray-200 dark:border-neutral-800",
          "bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md shadow-2xl",
          "relative ring-1",
          v.ring,
          className
        )}
      >
        {/* subtle top gradient bar */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-1.5 rounded-t-2xl",
            "bg-gradient-to-r",
            v.titleGradient
          )}
        />

        <div
          className={cn(
            "mx-auto -mt-10 mb-3 flex h-24 w-24 items-center justify-center",
            "rounded-full",
            v.iconBg,
            v.iconFg,
            "shadow-sm"
          )}
        >
          {icon ?? <AlertTriangle className="h-12 w-12" aria-hidden="true" />}
        </div>

        <AlertDialogHeader className="text-center space-y-2">
          <AlertDialogTitle
            className={cn(
              "text-2xl font-semibold tracking-tight text-transparent bg-clip-text",
              "bg-gradient-to-r",
              v.titleGradient
            )}
          >
            {title}
          </AlertDialogTitle>

          {description ? (
            <AlertDialogDescription className="mx-auto max-w-[90%] text-sm leading-6 text-gray-600 dark:text-gray-300">
              {description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter className="sm:justify-center gap-2 mt-2">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            disabled={confirming || disabled}
            className={cn(
              "rounded-xl border border-gray-300 dark:border-neutral-700",
              "bg-white hover:bg-gray-50 dark:bg-neutral-800 dark:hover:bg-neutral-700",
              "text-gray-700 dark:text-gray-100"
            )}
          >
            {cancelText}
          </AlertDialogCancel>

          <AlertDialogAction
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            disabled={confirming || disabled}
            className={cn(
              "rounded-xl text-white shadow-lg",
              "bg-gradient-to-r",
              v.actionBg,
              v.actionHover,
              v.focusRing,
              "focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
            )}
          >
            {confirming ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                {icon ?? <AlertTriangle className="h-4 w-4" />}
                {confirmText}
              </span>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
