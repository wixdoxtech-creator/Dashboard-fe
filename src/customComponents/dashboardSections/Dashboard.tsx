import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Package,
  Calendar,
  Smartphone,
  Cuboid as Android,
  Cpu,
  Signal,
  Accessibility,
  MapPin,
  SmartphoneIcon,
  Globe,
  Clock10,
  LocateFixed,
  SmartphoneCharging,
  Mountain,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeatureGrid } from "./FeatureGrid";
import { CallHistory } from "./CallHistory";
import { Contacts } from "./Contacts";
import { LatestPhotos } from "./LatestPhotos";
import { LocationMap } from "./LocationMap";
import { DisclaimerSection } from "./DisclaimerSection";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "@/contexts/AuthContext";
import { SMS } from "./SMS";
import { fetchLocations, LocationData } from "@/api/location";
import { api } from "@/api/api";
import LicenseAlertDialog from "@/components/ui/LicenseAlertDialog";
import { Link, useNavigate } from "react-router-dom";
import { Device, useGetDashboardDataQuery } from "@/api/deviceApi";

type UserLicense = {
  email: string;
  licenseId: string;
  imei: string | null;
  planId: number;
  planName: string;
  price: number;
  paymentId: string;
  paymentMethod: string;
  planStartAt: string;
  planExpireAt: string;
};

interface InfoCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
}
function InfoCard({ icon: Icon, label, value, className = "" }: InfoCardProps) {
  return (
    <div className="flex items-center gap-1 py-1.5 sm:py-2">
      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
      <span className="text-xs sm:text-sm text-gray-600">{label}:</span>
      <span className={`ml-auto text-xs sm:text-sm ${className}`}>{value}</span>
    </div>
  );
}

interface DashboardProps {
  isSidebarOpen: boolean;
}

export function Dashboard({ isSidebarOpen }: DashboardProps) {
  const [_isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [_isTablet, setIsTablet] = useState(
    typeof window !== "undefined"
      ? window.innerWidth >= 768 && window.innerWidth < 1024
      : false
  );

  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [_refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState<boolean>(true);

  // details cards
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [licenseDetails, setLicenseDetails] = useState<any>(null);
  const [licenseDetailsLoading, setLicenseDetailsLoading] = useState<boolean>(false);

  const [userLicenses, setUserLicenses] = useState<UserLicense[] | null>(null);
  const [userLicensesCount, setUserLicensesCount] = useState<number | null>(null);
  const [userLicensesLoading, setUserLicensesLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  const { user, licenseLoading, activeDevicePlanId, licenseExpired } =
    useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();

  // Device plan status (current/selected device)
  const deviceHasActivePlan = activeDevicePlanId > 0 && !licenseExpired;

  // Loading gates
  const deviceReady = !licenseLoading; // AuthContext ready
  const licensesReady = !userLicensesLoading && userLicensesCount !== null; // Licenses API ready
  const ready = deviceReady && licensesReady;

  // User-level facts
  const hasAnyLicense = (userLicensesCount ?? 0) > 0;

  const hasUnboundActiveLicense = useMemo(() => {
    if (!Array.isArray(userLicenses)) return false;
    const now = Date.now(); // compute inside
    return userLicenses.some(
      (l) => !l.imei && new Date(l.planExpireAt).getTime() > now
    );
  }, [userLicenses]);

  // Final UI gates
  const showLicenseDialog = ready && !hasAnyLicense;
  const showInstallAPK =
    ready && !deviceHasActivePlan && hasUnboundActiveLicense;

  // RTK Query — we only fetch dashboard data when the selected device is licensed
  const dashboardArgs = useMemo(
    () => ({ email, deviceImei }),
    [email, deviceImei]
  );
  const { data: dashData, isFetching: dashFetching } = useGetDashboardDataQuery(
    dashboardArgs,
    {
      skip: !deviceReady || !deviceHasActivePlan || !email || !deviceImei,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Mirror dashboard devices to local state and restore selection
  useEffect(() => {
    if (!dashData) return;

    const list = Array.isArray(dashData.devices) ? dashData.devices : [];
    setDevices(list);

    const storedDeviceId = localStorage.getItem("selectedDevice");
    if (storedDeviceId) {
      const id = parseInt(storedDeviceId, 10);
      setSelectedDeviceId(id);
    } else if (list.length) {
      const firstId = list[0].id;
      setSelectedDeviceId(firstId);
      localStorage.setItem("selectedDevice", String(firstId));
    }
  }, [dashData]);

  // Fetch user details, license details (for selected device), and locations (gated)
  useEffect(() => {
    const run = async () => {
      setLoading(true);

      try {
        if (email) {
          try {
            const { data } = await api.get(
              `/user/get-by-email/${encodeURIComponent(email)}`
            );
            setUserDetails(data);
          } catch (e) {
            console.error("Failed to fetch user details:", e);
            setUserDetails(null);
          }
        }

        // license details for the SELECTED DEVICE
        setLicenseDetailsLoading(true);
        setLicenseDetails(null);
        if (email && deviceImei) {
          try {
            const { data } = await api.get(
              `/user/license/email/${encodeURIComponent(
                email
              )}/device/${encodeURIComponent(deviceImei)}`
            );
            setLicenseDetails(data);
          } catch (e) {
            // not found or error — keep null (UI handles gracefully)
            setLicenseDetails(null);
            // console.warn("License details not found for selected device:", e);
          }
        }
      } finally {
        setLicenseDetailsLoading(false);
      }

      try {
        // location list only when device has active plan
        if (email && deviceImei && deviceReady && deviceHasActivePlan) {
          try {
            const { locationData } = await fetchLocations(
              email,
              "locations",
              deviceImei
            );
            setLocations(locationData);
          } catch (e) {
            console.error("Failed to fetch locations:", e);
            setLocations([]);
          }
        } else {
          setLocations([]);
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [email, deviceImei, deviceReady, deviceHasActivePlan]);

  // Fetch all licenses for the USER (isolated from device flags)
  useEffect(() => {
    let cancelled = false;

    // Initialize loading once per email change
    setUserLicensesLoading(true);
    setUserLicenses(null);
    setUserLicensesCount(null);

    const fetchLicenses = async () => {
      try {
        if (!email) {
          if (cancelled) return;
          setUserLicenses([]);
          setUserLicensesCount(0);
          return;
        }

        const { data } = await api.get(
          `/user/license/email/${encodeURIComponent(email)}`
        );

        if (cancelled) return;

        const count = Number(data?.count ?? 0);
        const licenses: UserLicense[] = Array.isArray(data?.licenses)
          ? data.licenses
          : [];

        setUserLicenses(licenses);
        setUserLicensesCount(count);
      } catch (e) {
        if (cancelled) return;
        console.error("Failed to fetch user licenses:", e);
        // Fail-safe
        setUserLicenses([]);
        setUserLicensesCount(0);
      } finally {
        if (!cancelled) setUserLicensesLoading(false);
      }
    };

    fetchLicenses();

    return () => {
      cancelled = true; // prevent late state sets
    };
  }, [email]);

  // React to "deviceSelected" custom event (from Navbar)
  useEffect(() => {
    const onSel = (event: CustomEvent) => {
      setLoading(true);
      setTimeout(() => {
        setSelectedDeviceId(event.detail);
        setRefreshTrigger((p) => p + 1);
        setLoading(false);
      });
    };
    window.addEventListener("deviceSelected", onSel as EventListener);
    return () =>
      window.removeEventListener("deviceSelected", onSel as EventListener);
  }, []);

  // Keep selected device id in sync if user changes in another tab
  useEffect(() => {
    const onStorage = () => {
      const storedDeviceId = localStorage.getItem("selectedDevice");
      if (storedDeviceId) setSelectedDeviceId(parseInt(storedDeviceId, 10));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Window resize housekeeping
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const formatDate = (dateString?: string) =>
    !dateString
      ? "N/A"
      : new Date(dateString).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

  const showSpinner = licenseLoading || dashFetching || loading || userLicensesLoading;

  // Feature-level gates (per selected device)
  const planLevel = activeDevicePlanId;

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Only show the alert AFTER the device-license gate is ready */}
      {showLicenseDialog && <LicenseAlertDialog open={true} reason="none" />}

      {/* Buy Now Section (static marketing) */}
      {/* <div className="bg-amber-500 text-white p-4 sm:p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-4">
          <Button
            className="bg-white text-[#cd6133] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-opacity-90 cursor-pointer"
            onClick={() => (window.location.href = "/pricing")}
          >
            Buy Now !
          </Button>
        </div>
        <p className="text-xs sm:text-sm opacity-90">
          Track WhatsApp Call Recordings, WhatsApp Business, WhatsApp Chats/Call
          Logs/Voice Notes/Videos, Call Logs & Recordings, Social media
          Chats/Calls, Locations, and App-use remotely to keep safe your loved
          ones, who matters to you the most.
        </p>
      </div> */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {showSpinner ? (
          <div className="col-span-3 flex justify-center items-center min-h-[200px]">
            <DotLottieReact
              src="https://lottie.host/d275aa2f-4956-464f-a053-7dd42ad90a6d/WXGBCxJobP.lottie"
              loop
              autoplay
              style={{ width: "200px", height: "200px" }}
            />
          </div>
        ) : showInstallAPK ? (
          // ---- 2) INSTALL APK CARD
          <div className="col-span-3 flex justify-center">
            <div className="w-full max-w-xl px-4 sm:px-0">
              {/* Centered Image */}
              <div className="flex justify-center">
                <img
                  src="/apk.png"
                  alt="Install app"
                  className="w-full max-w-[360px] sm:max-w-[420px] h-auto object-center"
                />
              </div>

              {/* Heading */}
              <h3 className="text-2xl sm:text-3xl font-semibold text-center mt-4
               bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                You have an unused license
              </h3>

              {/* Description */}
              <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed text-center">
                Install the{" "}
                <span className="font-semibold text-emerald-700">
                  Ion Monitor
                </span>{" "}
                app on the target device and sign in. Your unused license will
                bind automatically, and dashboard data will appear here.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  to="https://in.owss.in/apk/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="group relative overflow-hidden shadow-md h-12 px-7 text-base font-semibold text-white rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500 transition-all duration-300 cursor-pointer">
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-0" />
                    Download & Install App
                  </Button>
                </Link>

                <Link
                  to="https://ionmonitor.com/installationAccordion"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="h-12 px-7 text-base rounded-xl border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 transition-all duration-300"
                  >
                    Setup Guide
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : !deviceHasActivePlan ? (
          // When gate ready and no active device plan — show upsell card
          <>
            <div className="col-span-3">
              <div>
                <div className="rounded-2xl bg-white p-8 text-center">
                  <div className="mx-auto mb-5 flex h-34 w-34 items-center justify-center">
                    <img
                      src="/shopping.png"
                      alt="Purchase a plan"
                      className="h-34 w-34 object-contain"
                    />
                  </div>

                  <h3 className="text-2xl font-semibold bg-gradient-to-r from-rose-500 to-red-500 bg-clip-text text-transparent">
                    No active license for this device
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    Please purchase a plan to unlock this device’s dashboard
                    data and features.
                  </p>

                  <Button
                    onClick={() => navigate("/pricing")}
                    className="relative mt-6 h-12 px-7 text-base font-semibold text-white shadow-xl ring-1 ring-white/20 rounded-xl overflow-hidden group
                     bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:via-teal-600 hover:to-cyan-500 cursor-pointer"
                  >
                    <span className="pointer-events-none absolute -inset-1 rounded-2xl opacity-40 blur-lg bg-white/20 group-hover:opacity-60 transition-opacity" />
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-0" />
                    <span className="relative z-10 inline-flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Buy a plan
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Product Information */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 hover:shadow-md hover:bg-blue-50 transition-shadow duration-300">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-amber-600">
                  Product Information
                </h2>
              </div>
              <div className="space-y-1 sm:space-y-2 divide-y divide-gray-200">
                <InfoCard
                  icon={Clock}
                  label="History Retention"
                  value="7 Days"
                />
                <InfoCard
                  icon={Package}
                  label="Plan Name"
                  value={
                    licenseDetails?.planName ||
                    (activeDevicePlanId === 3
                      ? "Premium"
                      : activeDevicePlanId === 2
                      ? "Standard"
                      : activeDevicePlanId === 1
                      ? "Basic"
                      : "N/A")
                  }
                  className="text-green-600"
                />
                <InfoCard
                  icon={Package}
                  label="Country"
                  value={userDetails?.country || "N/A"}
                />
                <InfoCard
                  icon={Calendar}
                  label="Account Created"
                  value={
                    userDetails?.createdAt
                      ? formatDate(userDetails.createdAt)
                      : "N/A"
                  }
                />
                <InfoCard
                  icon={Calendar}
                  label="License Expiry"
                  value={
                    licenseDetailsLoading
                      ? "Loading..."
                      : licenseDetails?.planExpireAt
                      ? formatDate(licenseDetails.planExpireAt)
                      : "N/A"
                  }
                />
                <InfoCard
                  icon={Smartphone}
                  label="License Id"
                  value={
                    licenseDetails?.licenseId
                      ? `LIC-${licenseDetails.licenseId}`
                      : "N/A"
                  }
                />
                <InfoCard
                  icon={Clock}
                  label="Last Connected"
                  value="a few seconds ago"
                  className="text-orange-600"
                />
              </div>
            </div>

            {/* Device Information */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 hover:shadow-md hover:bg-blue-50 transition-all duration-300">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-amber-600">
                  Device Information
                </h2>
              </div>
              <div className="space-y-1 sm:space-y-2 divide-y divide-gray-200">
                {devices
                  .filter(
                    (device) =>
                      !selectedDeviceId || device.id === selectedDeviceId
                  )
                  .map((device) => (
                    <div
                      key={device.id}
                      className="space-y-1 sm:space-y-2 divide-y divide-gray-200"
                    >
                      <InfoCard
                        icon={SmartphoneIcon}
                        label="Model"
                        value={device.model}
                      />
                      <InfoCard
                        icon={SmartphoneCharging}
                        label="Brand"
                        value={device.manufacturer}
                      />
                      <InfoCard
                        icon={Android}
                        label="Android Version"
                        value={device.android_version}
                      />
                      <InfoCard icon={Cpu} label="IMEI" value={device.imei} />
                      <InfoCard
                        icon={Signal}
                        label="SIM Operator"
                        value={device.operator_name}
                      />
                      {/* <InfoCard icon={Box} label="App Version" value={device.app_version} /> */}
                      <InfoCard
                        icon={Globe}
                        label="Internet Mode"
                        value={device.internet_mode}
                      />
                      <InfoCard
                        icon={MapPin}
                        label="GPS Mode"
                        value={device.gps_mode}
                      />
                      {/* <InfoCard icon={Phone} label="Phone Number" value={device.phone_number} /> */}
                      {/* <InfoCard icon={Calendar} label="Created At" value={ formatDate(device.createdAt) } /> */}
                    </div>
                  ))}
              </div>
            </div>

            {/* Location Activity */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 hover:shadow-md hover:bg-blue-50 transition-all duration-300">
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-bold text-amber-600">
                  Location Activity
                </h2>
              </div>

              {locations.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No location data available.
                </p>
              ) : (
                <div className="space-y-1 sm:space-y-2 divide-y divide-gray-200">
                  {(() => {
                    const latest = locations[0];
                    return (
                      <>
                        <InfoCard
                          icon={LocateFixed}
                          label="Latitude"
                          value={`${latest.latitude}°`}
                          className="font-mono"
                        />
                        <InfoCard
                          icon={LocateFixed}
                          label="Longitude"
                          value={`${latest.longitude}°`}
                          className="font-mono"
                        />
                        <InfoCard
                          icon={Accessibility}
                          label="Accuracy"
                          value={
                            latest.accuracy ? `${latest.accuracy} m` : "N/A"
                          }
                          className="text-green-600 font-mono"
                        />
                        <InfoCard
                          icon={MapPin}
                          label="Provider"
                          value={latest.provider || "Unknown"}
                          className="text-green-600 font-semibold"
                        />
                        <InfoCard
                          icon={Mountain}
                          label="Altitude"
                          value={
                            latest.altitude ? `${latest.altitude} m` : "N/A"
                          }
                          className="truncate font-mono"
                        />
                        <InfoCard
                          icon={Clock10}
                          label="Last Updated"
                          value={new Date(latest.timestamp).toLocaleString()}
                          className="text-blue-600 font-semibold"
                        />
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Latest Photos / FeatureGrid / Map: render according to selected device's plan */}
      {deviceHasActivePlan && planLevel > 1 && user && (
        <LatestPhotos email={user.email} deviceImei={user.deviceImei} />
      )}
      {deviceHasActivePlan && planLevel <= 1 && (
        <div className="rounded-xl text-center border p-4 bg-amber-50 text-amber-800">
          Latest Photos is available on Standard & above. Upgrade your plan to
          unlock Photos Feature.
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 py-6 w-full">
        <div className="w-full lg:w-[60%]">
          <FeatureGrid isSidebarOpen={isSidebarOpen} />
        </div>
        <div className="w-full lg:w-[50%]">
          <LocationMap locations={locations} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <CallHistory />
        <SMS />
        <Contacts />
      </div>

      {/* Buy Now Section */}
      {/* <div className="bg-amber-500 text-white p-4 sm:p-6 rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-3 sm:mb-4">
          <Button
            className="bg-white text-[#cd6133] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-opacity-90 cursor-pointer"
            onClick={() => (window.location.href = "/pricing")}
          >
            Buy Now !
          </Button>
        </div>
        <p className="text-xs sm:text-sm opacity-90">
          Track WhatsApp Call Recordings, WhatsApp Business, WhatsApp Chats/Call
          Logs/Voice Notes/Videos, Call Logs & Recordings, Social media
          Chats/Calls, Locations, and App-use remotely to keep safe your loved
          ones, who matters to you the most.
        </p>
      </div> */}

      <DisclaimerSection />
    </div>
  );
}
