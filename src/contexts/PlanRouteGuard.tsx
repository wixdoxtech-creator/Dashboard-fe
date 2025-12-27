import React from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type PlanId = 1 | 2 | 3;

type Props = {
  minId: PlanId;
  redirectTo?: string;
  loadingFallback?: React.ReactNode;
};

const LoadingScreen = () => {
  return (
    <div className="flex h-[calc(30vh-80px)] w-full flex-col items-center justify-center gap-4 text-center">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-5 border-t-transparent border-blue-400"></div>
        <div className="absolute h-4 w-4 rounded-full bg-blue-300 animate-ping"></div>
      </div>
      <p className="text-lg font-medium text-muted-foreground">
        Checking your subscription plan...
      </p>
    </div>
  );
};

export function PlanRouteGuard({
  minId,
  redirectTo = "/pricing",
  loadingFallback = <LoadingScreen />,
}: Props) {
  const { loading, licenseLoading, planId } = useAuth();
  const location = useLocation();

  const isLoading =
    loading || licenseLoading || planId === undefined || planId === null;

  if (isLoading) return <>{loadingFallback}</>;

  const current = (planId ?? 0) as 0 | 1 | 2 | 3;
  const shouldRedirect = current < minId;

  if (shouldRedirect) {
    if (location.pathname === redirectTo) return <Outlet />;
    return (
      <Navigate
        to="/pricing"
        replace
        state={{
          from: location.pathname,
          needPlanId: minId,
          currentPlanId: (planId ?? 0) as 0 | 1 | 2 | 3,
          showPlanToast: true,
        }}
      />
    );
  }

  return <Outlet />;
}

export default PlanRouteGuard;
