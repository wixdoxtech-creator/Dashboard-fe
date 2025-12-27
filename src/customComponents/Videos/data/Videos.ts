const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const sharedThumbnail =
  "https://static.vecteezy.com/system/resources/previews/005/569/475/non_2x/video-play-film-player-movie-solid-icon-illustration-logo-template-suitable-for-many-purposes-free-vector.jpg";

export type Video = {
  id: string;
  name: string;
  timestamp: Date;
  thumbnailUrl?: string;
  // no videoUrl here (avoid relying on expiring links)
};

type FileRow = {
  id: number | string;
  name?: string;
  entity?: string;
  timestamp?: string;
  // backend may send these, but we won't rely on them:
  viewUrl?: string | null;
  streamUrl?: string | null;
  s3_key?: string | null;
  storage?: string | null;
};

const isVideoEntity = (e?: string) => {
  if (!e) return false;
  const v = e.toLowerCase();
  return (
    v === "videos" ||
    v === "video" ||
    v === "whatsapp_video" ||
    v === "whatsapp_videos" ||
    v === "whatsapp_status"
  );
};

const isProbablyVideoName = (name?: string) =>
  !!name?.toLowerCase().match(/\.(mp4|m4v|mov|webm|mkv|avi|3gp|3gpp)$/);

/* ---------- helpers ---------- */

const abs = (p: string) => {
  const base = API_BASE_URL.replace(/\/+$/, "");
  const path = p.startsWith("/") ? p : `/${p}`;
  return `${base}${path}`;
};

/**
 * Get a fresh short app URL for a file id (works even if earlier links expired).
 * Returns an absolute URL like: https://enc.ionmonitor.com/file/short/stream/:id?st=...
 */
export const getShortStreamUrlById = async (
  email: string,
  deviceImei: string,
  id: string | number,
  ttlSeconds = 300
): Promise<string | null> => {
  const url =
    abs(`/file/sign-stream`) +
    `?id=${encodeURIComponent(String(id))}` +
    `&email=${encodeURIComponent(email)}` +
    `&deviceImei=${encodeURIComponent(deviceImei)}` +
    `&expiresIn=${encodeURIComponent(String(ttlSeconds))}`;

  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) {
    console.error("sign-stream failed:", await r.text());
    return null;
  }
  const j = await r.json();
  if (!j?.url) return null;
  // backend should already return a /file/short/stream path; normalize to absolute:
  return /^https?:\/\//i.test(j.url) ? j.url : abs(j.url);
};

/** Open a video by id in a new tab/window (uses a fresh short link). */
export const openVideoById = async (
  email: string,
  deviceImei: string,
  id: string | number,
  target: "_blank" | "_self" = "_blank",
  ttlSeconds = 300
) => {
  const u = await getShortStreamUrlById(email, deviceImei, id, ttlSeconds);
  if (u) window.open(u, target);
};

/** Resolve a playable URL (for <video src>) by id. */
export const resolvePlayableUrlById = async (
  email: string,
  deviceImei: string,
  id: string | number,
  ttlSeconds = 300
): Promise<string | null> => {
  // If your backend always proxies bytes at /file/short/stream (no redirect),
  // you can just return the short URL.
  return getShortStreamUrlById(email, deviceImei, id, ttlSeconds);
};

/* ---------- API: metadata only ---------- */

export interface VideoApiOptions {
  includeEntities?: string[];
  limit?: number;
}

/** Fetch ONLY video metadata. Do not rely on expiring viewUrl/streamUrl. */
export const VideoApi = async (
  email: string,
  deviceImei: string,
  opts: VideoApiOptions = {}
): Promise<Video[]> => {
  try {
    // no need to presign; we only need ids/names/timestamps
    const r = await fetch(abs(`/file/file-data`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, deviceImei }),
      credentials: "include",
    });

    if (!r.ok) {
      console.error("file-data failed:", await r.text());
      return [];
    }

    const payload = await r.json();
    const rows: FileRow[] = Array.isArray(payload?.files) ? payload.files : [];

    const includeSet =
      opts.includeEntities && opts.includeEntities.length
        ? new Set(opts.includeEntities.map((e) => e.toLowerCase()))
        : null;

    const items = rows
      .filter((row) => {
        const entityHit = isVideoEntity(row.entity) || isProbablyVideoName(row.name);
        if (!entityHit) return false;
        if (includeSet && row.entity) {
          return includeSet.has(row.entity.toLowerCase());
        }
        return true;
      })
      .map<Video>((row) => ({
        id: String(row.id),
        name: row.name || `video-${row.id}`,
        timestamp: row.timestamp ? new Date(row.timestamp) : new Date(0),
        thumbnailUrl: sharedThumbnail,
      }))
      .sort((a, b) => (b.timestamp?.getTime() ?? 0) - (a.timestamp?.getTime() ?? 0));

    return typeof opts.limit === "number" ? items.slice(0, opts.limit) : items;
  } catch (error) {
    console.error("❌ Error fetching video data:", error);
    return [];
  }
};

// data/Videos
export async function deleteVideoById(
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

export async function bulkDeleteVideos(
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

