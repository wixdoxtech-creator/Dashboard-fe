import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchPhotos, Photo } from "../Photos/data/Photos";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type LatestPhotosProps = {
  email: string;
  deviceImei: string;
  limit?: number; // how many to show
};

// If you already have this defined elsewhere, reuse it
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL;

/**
 * Fetch a single image securely and return a temporary Object URL.
 * Adjust headers/credentials as per your auth setup.
 */
async function fetchSecureBlobUrl(
  id: string | number,
  email: string,
  deviceImei: string,
  signal?: AbortSignal
): Promise<string> {
  const VIEW_ENDPOINT = `${API_BASE_URL}/file/stream/id/${id}?email=${encodeURIComponent(
    email
  )}&deviceImei=${encodeURIComponent(deviceImei)}`;

  const res = await fetch(VIEW_ENDPOINT, {
    method: "GET",
    // If your endpoint needs cookies:
    // credentials: "include",
    // If your endpoint expects a bearer token:
    // headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to load image ${id}: ${res.status}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function LatestPhotos({ email, deviceImei, limit = 7 }: LatestPhotosProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [blobUrls, setBlobUrls] = useState<Record<string | number, string>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Step 1: Fetch metadata (no public URLs)
  useEffect(() => {
    if (!user?.email || !user?.deviceImei) return;
    
    let cancelled = false;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const rows = await fetchPhotos(email, deviceImei);
        if (!cancelled) {
          setPhotos(Array.isArray(rows) ? rows : []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load photos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, deviceImei]);

  // Only take the first N for the dashboard strip
  const top = useMemo(() => photos.slice(0, Math.max(1, limit)), [photos, limit]);

  // Step 2: For the top N items, fetch secure blobs and create Object URLs
  useEffect(() => {
    // Cleanup: revoke any old object URLs before loading new ones
    Object.values(blobUrls).forEach((url) => URL.revokeObjectURL(url));
    setBlobUrls({});

    if (!top.length) return;

    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      try {
        // Optional: limit concurrency (simple batching), here we just run all
        const tasks = top.map(async (p) => {
          const id = p.id;
          try {
            const objUrl = await fetchSecureBlobUrl(id, email, deviceImei, controller.signal);
            if (!cancelled) {
              // Use functional set to merge
              setBlobUrls((prev) => ({ ...prev, [id]: objUrl }));
            } else {
              URL.revokeObjectURL(objUrl);
            }
          } catch (e) {
            // ignore per-image failures but you can log
            // console.warn("Image failed", id, e);
          }
        });

        await Promise.allSettled(tasks);
      } finally {
        // Nothing extra
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      // Final cleanup
      setBlobUrls((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return {};
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, deviceImei, top.map((p) => p.id).join("|")]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth } = el;
    const scrollAmount = clientWidth * 0.8;
    el.scrollTo({
      left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  const isReady = top.length > 0 && top.some((p) => blobUrls[p.id]);

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-medium text-gray-900">Latest Photos</h2>
        <Button
          onClick={() => navigate("/photos")}
          className="bg-blue-400 hover:bg-blue-500 text-white flex items-center gap-1 text-sm"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="relative p-4">
        {/* Scroll Buttons */}
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 hover:bg-gray-100 disabled:opacity-40"
          disabled={!isReady}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-md p-1 hover:bg-gray-100 disabled:opacity-40"
          disabled={!isReady}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scroll-smooth
                     [&::-webkit-scrollbar]:h-1.5
                     [&::-webkit-scrollbar-thumb]:rounded-sm
                     [&::-webkit-scrollbar-thumb]:bg-gray-100"
        >
          {/* Loading skeletons */}
          {loading &&
            Array.from({ length: limit }).map((_, i) => (
              <div
                key={`sk-${i}`}
                className="flex-none w-[300px] h-[180px] rounded-lg overflow-hidden bg-gray-100 animate-pulse"
              />
            ))}

          {/* Error state */}
          {!loading && err && (
            <div className="text-sm text-red-600 p-2">{err}</div>
          )}

          {/* Empty state */}
          {!loading && !err && top.length === 0 && (
            <div className="text-sm text-gray-500 p-2">No photos yet.</div>
          )}

          {/* Photos via secure Blob URLs */}
          {!loading &&
            !err &&
            top.map((p) => {
              const src = blobUrls[p.id];
              return (
                <div
                  key={p.id}
                  className="flex-none w-[300px] h-[180px] rounded-lg overflow-hidden shadow-sm"
                  title={p.name}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={p.name ?? "Latest photo"}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 animate-pulse" />
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
