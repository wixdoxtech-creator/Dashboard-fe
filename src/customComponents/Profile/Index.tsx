import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/api";
import ProfileHeader from "./ProfileHeader";
import SubscriptionCard from "./SubscriptionCard";
// import AccountInfoCard from "./AccountInfoCard";
// import ChangePasswordCard from "./ChangePasswordCard";
// import SecuritySettingsCard from "./SecuritySettingsCard";
import PaymentCard from "./PaymentCard";
import LicensesCard from "./LicensesCard";

const Index = () => {
  const {
    user: authUser,
    activeDevicePlanId, // 0 when no active plan for selected device
    licenseExpired, // true when selected device license is expired
    licenseLoading, // fetching per-device license in context
  } = useAuth();

  const email = (authUser?.email ?? "").trim().toLowerCase();
  const deviceImei = String(authUser?.deviceImei ?? "").trim();

  const [userDetails, setUserDetails] = useState<any>(null);
  const [licenseDetails, setLicenseDetails] = useState<any>(null);

  // page-level loading flags for each fetch
  const [userDetailsLoading, setUserDetailsLoading] = useState<boolean>(false);
  const [licenseDetailsLoading, setLicenseDetailsLoading] =
    useState<boolean>(false);

  // Combined loading (for the whole page skeleton)
  const pageLoading =
    userDetailsLoading || licenseDetailsLoading || licenseLoading;

  // license status for header badges
  const licenseStatus: "active" | "expired" | "pending" =
    activeDevicePlanId === 0
      ? "pending"
      : licenseExpired
      ? "expired"
      : "active";

  // Fetch user details (by email) — independent of device licensing
  useEffect(() => {
    if (!email) {
      setUserDetails(null);
      return;
    }

    const run = async () => {
      try {
        setUserDetailsLoading(true);
        const { data } = await api.get(
          `/user/get-by-email/${encodeURIComponent(email)}`
        );
        setUserDetails(data);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
        setUserDetails(null);
      } finally {
        setUserDetailsLoading(false);
      }
    };

    run();
  }, [email]);

  // Fetch the license bound to the SELECTED DEVICE
  useEffect(() => {
    // if either is missing, clear and bail
    if (!email || !deviceImei) {
      setLicenseDetails(null);
      return;
    }

    const run = async () => {
      try {
        setLicenseDetailsLoading(true);
        const { data } = await api.get(
          `/user/license/email/${encodeURIComponent(
            email
          )}/device/${encodeURIComponent(deviceImei)}`
        );
        setLicenseDetails(data); // shape: single license object from backend route
      } catch (err) {
        // 404 or any error -> treat as no license for this device
        setLicenseDetails(null);
        // console.warn("No per-device license found:", err);
      } finally {
        setLicenseDetailsLoading(false);
      }
    };

    run();
  }, [email, deviceImei]);

  // Show a simple loading placeholder until both user & license calls settle
  if (pageLoading || !userDetails) {
    return (
      <div className="p-6 text-2xl text-gray-400 text-center">
        Loading Info…
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header shows status for the SELECTED DEVICE */}
        <ProfileHeader
          userDetails={userDetails}
          licenseStatus={licenseStatus}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* These cards should handle null licenseDetails gracefully */}
          <SubscriptionCard licenseDetails={licenseDetails} />
          <PaymentCard licenseDetails={licenseDetails} />
        </div>

        {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <AccountInfoCard
            userDetails={userDetails}
            licenseDetails={licenseDetails}
          />
          <ChangePasswordCard />
          <SecuritySettingsCard />
        </div> */}

        <div className="lg:col-span-2">
          <LicensesCard email={email} />
        </div>
      </div>
    </div>
  );
};

export default Index;