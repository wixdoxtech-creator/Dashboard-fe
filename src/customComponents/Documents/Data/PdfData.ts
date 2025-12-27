const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface PdfData {
  id: string;
  name: string;
  file_path: string;   // ok to keep for legacy; clicking should prefer openPdfById(id)
  timestamp: Date;
  entity?: string;
  size?: string;
}

type FileRow = {
  id: number | string;
  name?: string;
  entity?: string;
  size?: string;
  timestamp?: string;
  s3_key?: string | null;
  storage?: string | null;
  viewUrl?: string | null;    // short/presigned if present
  streamUrl?: string | null;  // /sign-view helper
};

const isPdfEntity = (e?: string) => {
  if (!e) return false;
  const v = e.toLowerCase();
  return (
    v === "pdfs" ||
    v === "pdf" ||
    v === "documents" ||
    v === "document" ||
    v === "whatsapp_documents" ||
    v === "downloads"
  );
};

const isProbablyPdfName = (name?: string) => !!name?.toLowerCase().match(/\.pdf$/);

/* ---------- URL helpers (robust) ---------- */

// paths that live under the /file mount
const PATHS_NEEDING_FILE_PREFIX = /^(short\/stream|sign-view|stream\/id)\b/;

const addMountPrefix = (p: string) => {
  if (!p.startsWith("/")) return p;
  const pathNoSlash = p.slice(1);
  return PATHS_NEEDING_FILE_PREFIX.test(pathNoSlash) ? `/file${p}` : p;
};

const ensureMountOnAbsolute = (absoluteUrl: string): string => {
  try {
    const u = new URL(absoluteUrl);
    const pathNoSlash = u.pathname.replace(/^\//, "");
    if (PATHS_NEEDING_FILE_PREFIX.test(pathNoSlash) && !/^\/file\//.test(u.pathname)) {
      u.pathname = `/file${u.pathname}`;
      return u.toString();
    }
    return absoluteUrl;
  } catch {
    return absoluteUrl;
  }
};

/** Make absolute and enforce /file mount when needed */
const makeAbsolute = (maybeUrl: string): string => {
  if (!maybeUrl) return "";
  if (/^https?:\/\//i.test(maybeUrl)) return ensureMountOnAbsolute(maybeUrl);
  const withMount = addMountPrefix(maybeUrl);
  const left = API_BASE_URL.replace(/\/+$/, "");
  const right = withMount.startsWith("/") ? withMount : `/${withMount}`;
  return `${left}${right}`;
};

/* ---------- Fresh short-link by id (recommended for clicks) ---------- */

/** Mint a fresh short URL for this file id (works even if older links expired). */
export const getShortStreamUrlById = async (
  email: string,
  deviceImei: string,
  id: string | number,
  ttlSeconds = 300
): Promise<string | null> => {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const signUrl =
    `${base}/file/sign-stream` +
    `?id=${encodeURIComponent(String(id))}` +
    `&email=${encodeURIComponent(email)}` +
    `&deviceImei=${encodeURIComponent(deviceImei)}` +
    `&expiresIn=${encodeURIComponent(String(ttlSeconds))}`;

  const r = await fetch(signUrl, { credentials: "include" });
  if (!r.ok) {
    console.error("sign-stream failed:", await r.text());
    return null;
  }
  const j = await r.json().catch(() => ({}));
  if (!j?.url) return null;
  return /^https?:\/\//i.test(j.url) ? ensureMountOnAbsolute(j.url) : makeAbsolute(j.url);
};

/** Open a PDF by id (always fresh short link). */
export const openPdfById = async (
  email: string,
  deviceImei: string,
  id: string | number,
  target: "_blank" | "_self" = "_blank",
  ttlSeconds = 300
) => {
  const u = await getShortStreamUrlById(email, deviceImei, id, ttlSeconds);
  if (u) window.open(u, target);
};

/** Resolve a final URL by id (for embedding in a viewer <iframe src=...>). */
export const resolvePdfUrlById = async (
  email: string,
  deviceImei: string,
  id: string | number,
  ttlSeconds = 300
): Promise<string | null> => {
  return getShortStreamUrlById(email, deviceImei, id, ttlSeconds);
};

/* ---------- Back-compat opener (works with viewUrl/streamUrl) ---------- */
/** Prefer openPdfById instead; this stays for legacy buttons that still pass file_path. */
export const openPdfUrl = async (file_path: string, target: "_blank" | "_self" = "_blank") => {
  if (!file_path) return;
  const isSignView = /\/sign-view(\?|$)/.test(file_path);
  if (isSignView) {
    const abs = makeAbsolute(file_path);
    const res = await fetch(abs, { method: "GET", credentials: "include" });
    if (!res.ok) {
      console.error("sign-view failed:", await res.text());
      return;
    }
    const data = await res.json();
    const url: string | undefined = data?.url;
    if (url) window.open(ensureMountOnAbsolute(url), target);
    else console.error("sign-view response missing 'url'");
    return;
  }
  window.open(makeAbsolute(file_path), target);
};

/* ---------- Fetch metadata-only list (stable) ---------- */

export const fetchPDFs = async (
  email: string,
  deviceImei: string
): Promise<PdfData[]> => {
  try {
    // We can skip presign here; we won’t rely on expiring links for clicks.
    const res = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/file/file-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, deviceImei }),
      credentials: "include",
    });

    if (!res.ok) {
      console.error("file-data failed:", await res.text());
      return [];
    }

    const payload = await res.json();
    const rows: FileRow[] = Array.isArray(payload?.files) ? payload.files : [];

    const pdfs: PdfData[] = rows
      .filter((item) => isPdfEntity(item.entity) || isProbablyPdfName(item.name))
      .map((item) => {
        // file_path kept for legacy UI; it won’t be used for opening.
        // If present, normalize; else provide a legacy fallback.
        const raw =
          item.viewUrl?.length ? item.viewUrl :
          item.streamUrl?.length ? item.streamUrl :
          `/file/stream/id/${item.id}?email=${encodeURIComponent(email)}&deviceImei=${encodeURIComponent(deviceImei)}`;

        return {
          id: String(item.id),
          name: item.name || `file-${item.id}.pdf`,
          file_path: makeAbsolute(raw),
          timestamp: item.timestamp ? new Date(item.timestamp) : new Date(0),
          entity: item.entity || "pdfs",
          size: item.size,
        };
      });

    return pdfs;
  } catch (err) {
    console.error("❌ Failed to fetch PDFs:", err);
    return [];
  }
};

// data/PDFs
export async function deletePDFById(
  email: string,
  deviceImei: string,
  id: string | number
): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/file/delete/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, deviceImei }),
  });
  const js = await res.json().catch(() => ({}));
  return res.ok && js?.success === true;
}

export async function bulkDeletePDF(
  email: string,
  deviceImei: string,
  ids: Array<string | number>
): Promise<{ success: boolean; deleted: (string | number)[]; errors: any[] }> {
  const res = await fetch(`${API_BASE_URL}/file/bulk-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, deviceImei, ids }),
  });
  const js = await res.json().catch(() => ({}));
  return {
    success: !!js?.success,
    deleted: js?.deleted ?? [],
    errors: js?.errors ?? [],
  };
}
