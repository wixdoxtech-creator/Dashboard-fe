import { baseApi } from "./baseApi";

export interface Device {
  id: number;
  manufacturer: string;
  model: string;
  imei: string;
  android_version: string;
  encryption_key: string;
  encryption_iv: string;
  app_version: string;
  gps_mode: string;
  internet_mode: string;
  sim_number: string | null;
  phone_number: string;
  accessibility: boolean;
  fcm_token: string;
  gms_version: string;
  permissions: string;
  accessibility_enabled: boolean;
  battery_optimization_enabled: boolean;
  rooted: boolean;
  magisk_module_installed: boolean;
  operator_name: string;
  createdAt: string;
  updatedAt: string;
  streamKey?: string;
}

export interface DashboardDataResponse {
  message: string;
  devices: Device[];
  textData: any[];
}

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getDashboardData: build.query< DashboardDataResponse,
      { email: string; deviceImei: string }
    >({
      query: ({ email, deviceImei }) => ({
        url: "/user/dashboard-data",
        method: "POST",
        data: { email, deviceImei },
      }),
      providesTags: (result) =>
        result
          ? [
              // tag devices individually in case you mutate by id later
              ...result.devices.map((d) => ({ type: "Devices" as const, id: String(d.id) })),
              { type: "Dashboard", id: "SUMMARY" },
              { type: "Devices", id: "LIST" },
            ]
          : [{ type: "Dashboard", id: "SUMMARY" }],
      keepUnusedDataFor: 300,
    }),
  }),
  overrideExisting: false,
});

export const { useGetDashboardDataQuery, useLazyGetDashboardDataQuery } = dashboardApi;
