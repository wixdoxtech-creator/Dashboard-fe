import { useMemo, useState } from "react";
import { Mail, Phone, Copy, Check, Home, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface UserDetailsProps {
  userDetails?: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: string;
    address?: string;
    state?: string;
    country?: string;
    pin_code?: string;
  } | null;
  onEdit?: () => void;
}

const PrettyField = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-[11px] font-semibold tracking-wide uppercase text-slate-500">
      {icon}
      <span>{label}</span>
    </div>
    <div className="relative rounded-xl p-3 border border-white/20 bg-white/50 backdrop-blur-sm shadow-sm">
      <span className="pointer-events-none absolute -top-6 -left-6 h-20 w-20 rounded-full bg-white/50 blur-3xl opacity-20" />
      {children}
    </div>
  </div>
);

const Line = () => (
  <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
);

const Placeholder = ({ text = "—" }) => (
  <span className="text-slate-400">{text}</span>
);

const Copyable = ({
  value,
  className = "",
}: {
  value?: string;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);
  if (!value?.trim()) return <Placeholder />;
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <span className="truncate font-medium text-slate-800">{value}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg hover:bg-slate-100"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          } catch {}
        }}
        aria-label={copied ? "Copied" : "Copy"}
        title={copied ? "Copied" : "Copy"}
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4 text-slate-600" />
        )}
      </Button>
    </div>
  );
};

export default function UserDetails({ userDetails }: UserDetailsProps) {
  // Loading state
  if (!userDetails) {
    return (
      <div className="relative">
        <div className="absolute -inset-6 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
        <Card className="bg-white/70 backdrop-blur-md border border-slate-200/70 shadow-xl rounded-2xl w-full max-w-3xl mx-auto py-6">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-16 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { name, surname, email, phone, address, state, country, pin_code } =
    userDetails;

  const fullAddress = useMemo(() => {
    const parts = [
      address?.trim(),
      state?.trim(),
      country?.trim(),
      pin_code?.trim() ? `- ${pin_code}` : undefined,
    ].filter(Boolean);
    return parts.join(", ");
  }, [address, state, country, pin_code]);

  return (
    <div className="relative">
      <div className="rounded-lg p-[1px] bg-gray-100 ">
        <Card className="bg-white/80 backdrop-blur-md border border-white/60 rounded-lg  overflow-hidden">
          {/* Header */}
          <CardHeader className="pb-0 pt-6 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-14 lg:h-14  mx-auto sm:mx-0">
                  <img src={"person.png"} alt={name} />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                    {name?.trim() || "User"} {surname?.trim() || ""}
                  </CardTitle>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-md text-slate-500">Profile</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <Line />

          {/* Content */}
          <CardContent className="px-6 py-2 pb-8 space-y-8">
            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PrettyField 
              icon={<User className="h-4 w-4 text-slate-500" />}
              label="First Name">
                <p className="text-slate-800 font-medium">
                  {name?.trim() || <Placeholder />}
                </p>
              </PrettyField>

              <PrettyField 
              icon={<User className="h-4 w-4 text-slate-500"/>}
              label="Last Name">
                <p className="text-slate-800 font-medium">
                  {surname?.trim() || <Placeholder />}
                </p>
              </PrettyField>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <PrettyField
                label="Email"
                icon={<Mail className="h-4 w-4 text-slate-500" />}
              >
                <Copyable value={email} className="font-mono" />
              </PrettyField>
              <PrettyField
                label="Phone"
                icon={<Phone className="h-4 w-4 text-slate-500" />}
              >
                <Copyable value={phone} className="font-mono" />
              </PrettyField>
            </div>

            {/* Address */}
            <PrettyField
              label="Address"
              icon={<Home className="h-4 w-4 text-slate-500" />}
            >
              <p className="text-slate-700  leading-relaxed">
                {fullAddress || <Placeholder text="Address not provided" />}
              </p>
            </PrettyField>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
