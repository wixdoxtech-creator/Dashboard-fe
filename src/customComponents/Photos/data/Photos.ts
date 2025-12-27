const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface Photo {
  id: string;
  name?: string;
  imageUrl?: string | null;
  timestamp?: Date | null;
}

type FileRow = {
  id: number | string;
  name?: string;
  entity?: string;
  timestamp?: string;
  s3_key?: string | null;
  storage?: string | null;
  viewUrl?: string | null;     
  streamUrl?: string | null;   
};

const isImageEntity = (e?: string) => {
  if (!e) return false;
  const v = e.toLowerCase();
  return v === "images" || v === "image" || v === "photos" || v === "whatsapp_images";
};
const isProbablyImageName = (name?: string) =>
  !!name?.toLowerCase().match(/\.(png|jpg|webp|gif|bmp|svg|heic|heif)$/);

 

// paths that should live under the /file mount
const PATHS_NEEDING_FILE_PREFIX = /^(short\/stream|sign-view|stream\/id)\b/;

/** Ensure router mount (/file) exists for relative backend paths like /short/stream... */
const addMountPrefix = (p: string) => {
  if (!p.startsWith("/")) return p;
  const pathNoSlash = p.slice(1);
  return PATHS_NEEDING_FILE_PREFIX.test(pathNoSlash) ? `/file${p}` : p;
};

/** If absolute URL points to /short/stream or /sign-view without /file, inject it */
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

/** Make any backend path absolute against API_BASE_URL and fix missing /file in both cases */
const makeAbsolute = (maybeUrl: string): string => {
  if (!maybeUrl) return "";
  if (/^https?:\/\//i.test(maybeUrl)) {
    // absolute → patch if it’s hitting short/stream|sign-view|stream/id without /file
    return ensureMountOnAbsolute(maybeUrl);
  }
  // relative → add /file when needed, then join to API base
  const withMount = addMountPrefix(maybeUrl);
  const left = API_BASE_URL.replace(/\/+$/, "");
  const right = withMount.startsWith("/") ? withMount : `/${withMount}`;
  return `${left}${right}`;
};

/**
 * Fetch photo metadata only (safe for grid rendering).
 * Returns Photo[]; by default we DO NOT include imageUrl to avoid eager downloads.
 * If you want preview-ready URLs, set useViewUrl=true.
 */
export const fetchPhotos = async (
  email: string,
  deviceImei: string,
  useViewUrl = false // set true if you want <img src> ready URLs for lightweight previews
): Promise<Photo[]> => {
  try {
    // ask backend to eagerly presign where possible so viewUrl may be present
    const res = await fetch(`${API_BASE_URL.replace(/\/+$/, "")}/file/file-data?presign=1&ttl=3`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, deviceImei }),
      
    });

    if (!res.ok) {
      console.error("file-data failed:", await res.text());
      return [];
    }

    const payload = await res.json();
    const rows: FileRow[] = Array.isArray(payload?.files) ? payload.files : [];

    return rows
      .filter((item) => isImageEntity(item.entity) || isProbablyImageName(item.name))
      .map((item) => {
        const view = item.viewUrl && item.viewUrl.length > 0 ? makeAbsolute(item.viewUrl) : null;
        return {
          id: String(item.id),
          name: item.name || `image-${item.id}`,
          imageUrl: useViewUrl ? view : null, // keep null by default to avoid auto-downloads
          timestamp: item.timestamp ? new Date(item.timestamp) : null,
        };
      });
  } catch (err) {
    console.error("Failed to fetch photos:", err);
    return [];
  }
};

/**
 * Fetch full image blob on-demand (best path with the new backend).
 * It gets a short, expiring URL first (/file/sign-stream) and then fetches the image.
 * Returns an object URL for <img src>, remember to URL.revokeObjectURL when done.
 */
export const fetchPhotoBlobById = async (
  email: string,
  deviceImei: string,
  id: string | number,
  ttlSeconds = 15
): Promise<{ blob: Blob; objectUrl: string } | null> => {
  try {
    // 1) Ask backend for a short app URL for this file id
    const signStreamUrl =
      `${API_BASE_URL.replace(/\/+$/, "")}/file/sign-stream` +
      `?id=${encodeURIComponent(String(id))}` +
      `&email=${encodeURIComponent(email)}` +
      `&deviceImei=${encodeURIComponent(deviceImei)}` +
      `&expiresIn=${encodeURIComponent(String(ttlSeconds))}`;

    const signRes = await fetch(signStreamUrl, { credentials: "include" });
    if (!signRes.ok) {
      // fallback to legacy decrypt/stream
      const legacy = 
        `${API_BASE_URL.replace(/\/+$/, "")}/file/stream/id/${encodeURIComponent(String(id))}` +
        `?email=${encodeURIComponent(email)}&deviceImei=${encodeURIComponent(deviceImei)}`;
      const legacyRes = await fetch(legacy, { credentials: "include" });
      if (!legacyRes.ok) {
        console.error("Failed to sign or legacy-stream image:", await legacyRes.text());
        return null;
      }
      const blob = await legacyRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      return { blob, objectUrl };
    }

    const { url: shortUrl } = await signRes.json(); // { success, url, ttl }
    const finalUrl = makeAbsolute(shortUrl || "");

    // 2) Fetch the actual binary using the short link
    const imgRes = await fetch(finalUrl, { credentials: "include" });
    if (!imgRes.ok) {
      console.error("Failed to fetch image via short URL:", await imgRes.text());
      return null;
    }

    const blob = await imgRes.blob();
    const objectUrl = URL.createObjectURL(blob);
    return { blob, objectUrl };
  } catch (err) {
    console.error("fetchPhotoBlobById error:", err);
    return null;
  }
};


// data/Photos

export async function deletePhotoById(
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

export async function bulkDeletePhotos(
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
