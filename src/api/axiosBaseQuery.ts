import type { BaseQueryFn } from "@reduxjs/toolkit/query";
import type { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";

/**
 * Wraps your pre-configured Axios instance for RTK Query.
 * Reuses all interceptors (auth/redirect, license disable, cookies, headers).
 */
export const axiosBaseQuery =
  (client: AxiosInstance): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig["method"];
      params?: AxiosRequestConfig["params"];
      data?: AxiosRequestConfig["data"];
      headers?: AxiosRequestConfig["headers"];
      // allow any axios config you might need:
      config?: Omit<AxiosRequestConfig, "url" | "method" | "data" | "params" | "headers">;
    },
    unknown,
    unknown
  > =>
  async ({ url, method = "GET", params, data, headers, config }) => {
    try {
      const res = await client.request({
        url,
        method,
        params,
        data,
        headers,
        ...config,
      });
      return { data: res.data };
    } catch (err) {
      const e = err as AxiosError<any>;
      // If your interceptor flags blocked errors:
      if ((e as any)?.__blocked__) {
        return {
          error: {
            status: -1,
            data: { message: "API disabled due to expired license", blocked: true },
          },
        };
      }
      return {
        error: {
          status: e.response?.status ?? -1,
          data: e.response?.data ?? e.message,
        },
      };
    }
  };
