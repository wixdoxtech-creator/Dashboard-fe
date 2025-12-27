import { api } from "./api";
import type { LicenseRecord } from "@/contexts/AuthContext";

export type License = {
  email: string;
  licenseId: string;
  imei: string;
  planId: 1 | 2 | 3;       
  planName: "Basic" | "Standard" | "Premium";
  price: number;
  paymentId: string;
  paymentMethod: string;
  planStartAt: string;     
  planExpireAt: string;    
};

export async function getLicenseByEmail(email: string): Promise<License | null> {
  if (!email) return null;
  const { data } = await api.get(`/user/license/email/${encodeURIComponent(email)}`, {
    withCredentials: true,
  });
  return (data ?? null) as License | null;
}

export function isLicenseExpired(lic?: License | null): boolean {
  if (!lic?.planExpireAt) return true;
  return new Date(lic.planExpireAt).getTime() <= Date.now();
}


export async function getLicenseByEmailAndImei(email: string, imei: string): Promise<LicenseRecord> {
  const { data } = await api.get(
    `/user/license/email/${encodeURIComponent(email)}/device/${encodeURIComponent(imei)}`
  );
  return data as LicenseRecord;
}