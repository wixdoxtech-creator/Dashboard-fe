import axios, { AxiosError } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json", "x-client-type": "browser" },
});

const LOGIN_PATH = "/user/login";
let redirecting = false;


api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const status = error?.response?.status;
    const url = error?.config?.url;

    // ignore network-only errors and auth endpoints to avoid loops
    if (!error.response || (url && (url.includes("/user/login") || url.includes("/user/logout")))) {
      return Promise.reject(error);
    }

    if (status === 401 || status === 403 || status === 419) {
      try {
        // best effort: tell server; avoid throwing if it fails
        await api.post("/user/logout", undefined, { validateStatus: () => true }).catch(() => {});
      } finally {
        // clear client state
        localStorage.removeItem("user");
        // inform React side to clear its state
        window.dispatchEvent(new Event("auth:expired"));
        // redirect once
        if (!redirecting && window.location.pathname !== LOGIN_PATH) {
          redirecting = true;
          window.location.assign(LOGIN_PATH);
        }
      }
    }
    return Promise.reject(error);
  }
);



// --- GLOBAL API DISABLE (license expired) -------------------------------

// optional: allow some endpoints even when disabled (login/logout/license check)
const ALLOWLIST_SUBSTRINGS = [
  "/user/login",
  "/user/logout",
  "/user/license/email/", // keep this so you can re-check/refresh license
];

let apiEnabled = true;

/** Flip the global switch from anywhere (e.g., AuthContext after license fetch) */
export function setApiEnabled(enabled: boolean) {
  apiEnabled = enabled;
  // persist a hint so hard refresh keeps behavior until context re-evaluates
  if (!enabled) localStorage.setItem("api:disabled", "1");
  else localStorage.removeItem("api:disabled");
}

/** Optional helper to detect blocked errors */
export function isApiBlockedError(err: unknown): boolean {
  return Boolean((err as any)?.__blocked__);
}

api.interceptors.request.use((config) => {
  const disabled =
    !apiEnabled || localStorage.getItem("api:disabled") === "1";

  // always allow allowlisted endpoints (login/logout/license check)
  const url = config?.url || "";
  const allowlisted = ALLOWLIST_SUBSTRINGS.some((p) => url.includes(p));

  if (disabled && !allowlisted) {
    // Reject with a lightweight, detectable error object
    return Promise.reject({
      __blocked__: true,
      message: "API disabled due to expired license",
      config,
    });
  }

  return config;
});

