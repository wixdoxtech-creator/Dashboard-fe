import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, setApiEnabled } from "@/api/api";
import { getLicenseByEmailAndImei } from "@/api/license";  

interface UserInfo {
  email: string;
  deviceImei: string;  
  isVerified: boolean;
  planId?: 1 | 2 | 3;  
  planName?: "Basic" | "Standard" | "Premium";
  deviceImeis?: string[];
}

type PlanId = 0 | 1 | 2 | 3;

export interface LicenseRecord {
  email: string;
  licenseId: string;
  imei: string | null;
  planId: 1 | 2 | 3;
  planName: "Basic" | "Standard" | "Premium" | null;
  price: number;
  paymentId: string | null;
  paymentMethod: string | null;
  planStartAt: string | null;   
  planExpireAt: string | null;  
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  login: (email: string, password: string) => Promise<UserInfo>;
  logout: () => Promise<void>;
  loading: boolean;

  // Device selection
  setActiveDeviceImei: (imei: string) => void;
  setActiveDevice: (payload: { imei: string; planId?: PlanId }) => void;

  // Per-device (derived strictly from the selected IMEI’s license)
  activeDevicePlanId: PlanId;
  licenseExpired: boolean;
  devicePlans: Record<string, PlanId>; // IMEI -> planId convenience map

  // The currently fetched license (for the selected device), if any
  currentLicense: LicenseRecord | null;

  // UI flags
  licenseLoading: boolean;
  hasLicense: boolean;
  authReady: boolean;     
  planResolved: boolean;  

  // optional account-level mirrors (not used for gating)
  planId?: PlanId;
  planName?: "Basic" | "Standard" | "Premium";
}

const LOGIN_PATH = "/user/login";
const AuthContext = createContext<AuthContextType | null>(null);

// Per-email storage key for last active IMEI
const activeImeiKey = (email: string) => `activeDeviceImei:${email.toLowerCase()}`;

const isExpiredIso = (iso?: string | null) => {
  if (!iso) return false;
  return new Date(iso).getTime() <= Date.now();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Derived (strictly from selected device’s license)
  const [activeDevicePlanId, setActiveDevicePlanId] = useState<PlanId>(0);
  const [licenseExpired, setLicenseExpired] = useState<boolean>(false);
  const [devicePlans, setDevicePlans] = useState<Record<string, PlanId>>({});

  // Currently fetched license for the selected device
  const [currentLicense, setCurrentLicense] = useState<LicenseRecord | null>(null);

  // UI flags
  const [licenseLoading, setLicenseLoading] = useState(true);
  const [hasLicense, setHasLicense] = useState(false);

  // Optional mirrors (not used for gating)
  const [planId, setPlanId] = useState<PlanId | undefined>(undefined);
  const [planName, setPlanName] = useState<"Basic" | "Standard" | "Premium" | undefined>(undefined);


  // When BOTH auth and license fetches are complete
  const authReady = !loading && !licenseLoading;

  // Whether the selected device's plan is known (useful for guards) 
  const planResolved = !licenseLoading && !!user?.deviceImei;


  // Hydrate once from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed: UserInfo = JSON.parse(stored);

        const savedActive = parsed.email ? localStorage.getItem(activeImeiKey(parsed.email)) : null;
        const nextActive =
          (savedActive && savedActive.trim()) ||
          parsed.deviceImei ||
          parsed.deviceImeis?.[0] ||
          "";

        const hydrated: UserInfo = { ...parsed, deviceImei: nextActive };
        setUser(hydrated);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  // Global auth-expired listener
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setIsAuthenticated(false);

      setCurrentLicense(null);
      setActiveDevicePlanId(0);
      setLicenseExpired(false);
      setDevicePlans({});
      setHasLicense(false);
      setPlanId(0);
      setPlanName("Basic");
      setApiEnabled(true);
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  // Set active IMEI + persist (raw, no normalization)
  const setActiveDeviceImei = (imei: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const trimmed = String(imei || "").trim();
      const next: UserInfo = { ...prev, deviceImei: trimmed };
      localStorage.setItem("user", JSON.stringify(next));
      localStorage.setItem(activeImeiKey(prev.email), trimmed);
      return next;
    });
  };

  // Public API (Navbar can call with IMEI, optionally passing planId as a quick hint)
  const setActiveDevice = ({ imei, planId }: { imei: string; planId?: PlanId }) => {
    const trimmed = String(imei || "").trim();
    if (!trimmed) return;

    setActiveDeviceImei(trimmed);

    // optimistic set from the hint (if provided); the fetch below will confirm/overwrite
    if (typeof planId === "number") {
      setActiveDevicePlanId(planId);
      setDevicePlans((prev) => ({ ...prev, [trimmed]: planId }));
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.post(`/user/login`, { email, password });
    const { email: userEmail, deviceImei, deviceImeis, isVerified, planId, planName } = response.data.user;

    const savedActive = localStorage.getItem(activeImeiKey(userEmail));
    const nextActive =
      (savedActive && savedActive.trim()) ||
      (deviceImei ? String(deviceImei).trim() : "") ||
      (Array.isArray(deviceImeis) && deviceImeis.length ? String(deviceImeis[0]).trim() : "") ||
      "";

    const userInfo: UserInfo = {
      email: userEmail,
      deviceImei: nextActive,
      isVerified,
      deviceImeis: Array.isArray(deviceImeis) ? deviceImeis : deviceImei ? [deviceImei] : [],
      planId,
      planName,
    };

    setUser(userInfo);
    setIsAuthenticated(true);
    localStorage.setItem("user", JSON.stringify(userInfo));
    localStorage.setItem(activeImeiKey(userEmail), nextActive);

    return userInfo; // device-level license fetch happens in the effect below
  };

  const logout = async () => {
    await api.post(`/user/logout`).catch(() => {});
    if (user?.email) localStorage.removeItem(activeImeiKey(user.email));

    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("user");

    setCurrentLicense(null);
    setActiveDevicePlanId(0);
    setLicenseExpired(false);
    setDevicePlans({});
    setHasLicense(false);
    setPlanId(0);
    setPlanName("Basic");
    setApiEnabled(true);

    if (window.location.pathname !== LOGIN_PATH) {
      window.location.assign(LOGIN_PATH);
    }
  };

  //Fetch the SINGLE license for the selected device IMEI (strict match) whenever email/IMEI changes
  useEffect(() => {
    let cancelled = false;

    async function run() {
      const email = user?.email;
      const imei = user?.deviceImei?.trim() ?? "";

      // reset if we don't have both
      if (!email || !imei) {
        setLicenseLoading(false);
        setCurrentLicense(null);
        setActiveDevicePlanId(0);
        setLicenseExpired(false);
        setHasLicense(false);
        setApiEnabled(true);
        return;
      }

      try {
        setLicenseLoading(true);

        // Fetch exact license for email + IMEI
        const lic: LicenseRecord = await getLicenseByEmailAndImei(email, imei);
        if (cancelled) return;

        setCurrentLicense(lic);

        const expired = isExpiredIso(lic.planExpireAt);
        const plan: PlanId = (expired ? 0 : (lic.planId as PlanId)) as PlanId;

        setActiveDevicePlanId(plan);
        setLicenseExpired(expired);
        setHasLicense(true);

        // maintain a tiny cache (IMEI -> planId) for UI convenience
        setDevicePlans((prev) => ({ ...prev, [imei]: plan }));

        // Optional account-level mirrors (just display)
        setPlanId((lic.planId as PlanId) ?? 0);
        setPlanName((lic.planName ?? "Basic") as "Basic" | "Standard" | "Premium");

        // Policy: keep API enabled (you may hard-block on expired if desired)
        setApiEnabled(true);
      } catch (e: any) {
        if (cancelled) return;

        // 404 or any error -> treat as no active license for this device
        setCurrentLicense(null);
        setActiveDevicePlanId(0);
        setLicenseExpired(false);
        setHasLicense(false);
        setDevicePlans((prev) => ({ ...prev, [imei]: 0 }));
        setPlanId(0);
        setPlanName("Basic");
        setApiEnabled(true);
      } finally {
        if (!cancelled) setLicenseLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [user?.email, user?.deviceImei]);

  const value = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
      loading,

      // Device selection
      setActiveDeviceImei,
      setActiveDevice,

      // Selected device license state
      activeDevicePlanId,
      licenseExpired,
      devicePlans,
      currentLicense,

      // UI flags
      licenseLoading,
      hasLicense,
      authReady,    
      planResolved,

      // Mirrors (not used for gating)
      planId,
      planName,
    }),
    [
      isAuthenticated,
      user,
      loading,
      activeDevicePlanId,
      licenseExpired,
      devicePlans,
      currentLicense,
      licenseLoading,
      authReady,    
      planResolved,
      hasLicense,
      planId,
      planName,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
