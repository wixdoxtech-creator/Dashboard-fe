import { useEffect, useMemo, useState } from "react";
import { DeviceCard } from "./DeviceCard";
import { Device, useGetDashboardDataQuery } from "@/api/deviceApi";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export interface DeviceInfo {
  id: string;
  model: string;
  manufacturer: string;
  androidVersion: string;
  imei: string;
  simOperator: string;
  appVersion: string;
  battery_optimization_enabled: boolean;
  encryption_key: string;
  internet_mode: string;
  gps_mode: string;
  phone_number: string;
  rooted: boolean;
  createdAt: string;
}

type DeleteVariant = "all" | "dataOnly";

function DeviceInfo() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Delete flow state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteVariant, setDeleteVariant] = useState<DeleteVariant>("dataOnly");
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null);

  const { user, isAuthenticated, hasLicense, loading: authLoading } = useAuth();
  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  const { data: dashData } = useGetDashboardDataQuery(
    { email, deviceImei },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const hasDevices = useMemo(() => (devices?.length ?? 0) > 0, [devices]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || skip) return;
    if (!dashData) return;

    async function LoadData() {
      try {
        setLoading(true);
        await new Promise((r) => setTimeout(r, 100));
        setDevices(dashData?.devices ?? []);
      } catch (e) {
        console.error("Failed to load Device Information", e);
      } finally {
        setLoading(false);
      }
    }
    LoadData();
  }, [authLoading, isAuthenticated, skip, dashData]);

  // Open confirm dialog helpers
  function openConfirm(variant: DeleteVariant) {
    setDeleteMsg(null);
    setDeleteVariant(variant);
    setConfirmOpen(true);
  }

  // Build payload for the /file/reset-all API
  function buildPayload(variant: DeleteVariant) {
    const base = {
      confirm: "DELETE",
      email,
      deviceImei,
    };
    if (variant === "all") {
      return {
        ...base,
        deleteTokenMapping: true,
        deleteDevice: true,
        licenseImieRemove: true,
      };
    }
    // dataOnly
    return {
      ...base,
      deleteTokenMapping: false,
      deleteDevice: false,
      licenseImieRemove: false,
    };
  }

  async function onConfirmDelete() {
    setDeleting(true);
    setDeleteMsg(null);
    try {
      const res = await fetch("https://enc.ionmonitor.com/file/reset-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", 
        body: JSON.stringify(buildPayload(deleteVariant)),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || json?.ok === false) {
        const err = json?.error || `Request failed (${res.status})`;
        throw new Error(err);
      }

      // Success handling:
      if (deleteVariant === "all") {
        // device + mapping deleted; reflect immediately
        setDevices([]);
      } else {
        // data only deleted; keep device cards but you may want to soft refresh counts later
        // for now just show a success message
      }
      setDeleteMsg(
        deleteVariant === "all"
          ? "All device data were deleted."
          : "All device data were deleted (device info retained)."
      );
      setConfirmOpen(false);
    } catch (e: any) {
      console.error(e);
      setDeleteMsg(e?.message || "Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-500">Device Management</h1>

          <div className="flex items-center gap-2">
            {/* Delete Data Only */}
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-2 border-amber-300 text-amber-700 hover:text-amber-800 hover:bg-amber-50"
              onClick={() => openConfirm("dataOnly")}
              disabled={!hasDevices || loading}
              title="Delete all collected data, keep device & token mapping"
            >
              <Trash2 className="h-4 w-4" />
              Delete Data Only
            </Button>

            {/* Delete All (device + token mapping + data) */}
            <Button
              size="sm"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
              onClick={() => openConfirm("all")}
              disabled={!hasDevices || loading}
              title="Delete everything including device and token mapping"
            >
              <Trash2 className="h-4 w-4" />
              Delete Everything
            </Button>
          </div>
        </div>

        {deleteMsg ? (
          <div
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800"
            role="status"
          >
            {deleteMsg}
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 flex justify-center items-center min-h-[200px]">
              <DotLottieReact
                src="https://lottie.host/d275aa2f-4956-464f-a053-7dd42ad90a6d/WXGBCxJobP.lottie"
                loop
                autoplay
                style={{ width: "200px", height: "200px" }}
              />
            </div>
          ) : devices.length === 0 ? (
            <div className="col-span-3 grid place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-lg font-medium text-slate-800">No devices found</p>
              <p className="mt-1 max-w-md text-sm text-slate-600">
                Add a device to see detailed information here.
              </p>
            </div>
          ) : (
            <>
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={{
                    id: device.id.toString(),
                    model: device.model,
                    manufacturer: device.manufacturer,
                    androidVersion: device.android_version,
                    imei: device.imei,
                    simOperator: device.operator_name,
                    appVersion: device.app_version,
                    battery_optimization_enabled: device.battery_optimization_enabled,
                    encryption_key: device.encryption_key,
                    internet_mode: device.internet_mode,
                    gps_mode: device.gps_mode,
                    phone_number: device.phone_number,
                    rooted: device.rooted,
                    createdAt: device.createdAt,
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setDeleting(false);
        }}
      >
        <AlertDialogContent
          className="sm:max-w-[480px] rounded-2xl border border-gray-200 dark:border-neutral-800
                     bg-white/90 dark:bg-neutral-900/80 backdrop-blur-md shadow-2xl"
        >
          <div className="mx-auto -mt-18 flex h-24 w-24 items-center justify-center">
            <img src="/warning.png" className="w-20 h-20" />
          </div>

          <AlertDialogHeader className="text-center space-y-1">
            <AlertDialogTitle className="text-2xl text-center font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
              {deleteVariant === "all"
                ? "Delete everything ?"
                : "Delete all data ?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {deleteVariant === "all" ? (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">all collected data</span>, the{" "}
                   This action cannot be undone.
                </span>
              ) : (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">all collected data</span> for this device. The device info will be retained. This action cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded border border-gray-300 dark:border-neutral-700
                         bg-white hover:bg-gray-50 dark:bg-neutral-800 dark:hover:bg-neutral-700
                         text-gray-700 dark:text-gray-100"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={deleting}
              className="rounded bg-gradient-to-r from-rose-600 to-red-600
                         text-white shadow-lg hover:from-rose-700 hover:to-red-700
                         focus-visible:ring-2 focus-visible:ring-red-400
                         focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
            >
              {deleting ? (
                "Deleting..."
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Confirm
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default DeviceInfo;
