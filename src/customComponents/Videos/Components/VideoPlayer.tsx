import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import type { Video } from "../data/Videos";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type VideoPlayerProps = {
  isOpen: boolean;
  onClose: () => void;
  video: Video | null;
};

const normalizeShortUrl = (u: string) => {
  if (!u) return u;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const abs = /^https?:\/\//i.test(u) ? u : `${base}${u.startsWith("/") ? "" : "/"}${u}`;
  try {
    const url = new URL(abs);
    const needsPrefix = /^(short\/stream|sign-view|stream\/id)\b/.test(url.pathname.replace(/^\//, ""));
    if (needsPrefix && !url.pathname.startsWith("/file/")) url.pathname = `/file${url.pathname}`;
    return url.toString();
  } catch {
    return abs;
  }
};

export default function VideoPlayer({ isOpen, onClose, video }: VideoPlayerProps) {
  const { user } = useAuth();
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const vref = useRef<HTMLVideoElement | null>(null);

  const resolveById = async (id: string | number, ttl = 300) => {
    const base = API_BASE_URL.replace(/\/+$/, "");
    const signUrl =
      `${base}/file/sign-stream` +
      `?id=${encodeURIComponent(String(id))}` +
      `&email=${encodeURIComponent(user?.email ?? "")}` +
      `&deviceImei=${encodeURIComponent(user?.deviceImei ?? "")}` +
      `&expiresIn=${encodeURIComponent(String(ttl))}`;
    const r = await fetch(signUrl, { credentials: "include" });
    if (!r.ok) throw new Error(`sign-stream ${r.status}: ${await r.text().catch(() => "")}`);
    const j = (await r.json().catch(() => ({}))) as { url?: string };
    if (!j?.url) throw new Error("sign-stream OK but no url in response");
    return normalizeShortUrl(j.url);
  };

  useEffect(() => {
    let active = true;
    setResolvedUrl(null);
    setError(null);

    (async () => {
      if (!isOpen || !video) return;
      if (!user?.email || !user?.deviceImei) {
        setError("Missing user credentials to resolve the video.");
        return;
      }
      try {
        const u = await resolveById(video.id, 300);
        if (active) setResolvedUrl(u);
      } catch (e: any) {
        if (active) setError(e?.message ?? "Failed to resolve video URL");
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen, video, user?.email, user?.deviceImei]);

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[96vw] sm:max-w-5xl p-0 overflow-hidden">
        <div className="grid grid-rows-[auto_1fr_auto] max-h-[90vh] bg-background rounded-xl shadow-xl">
         
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="truncate text-gray-500">{video.name}</DialogTitle>
              <DialogClose asChild />
            </div>
          </DialogHeader>

         
          <div className="bg-black flex items-center justify-center min-h-[60vh] max-h-[80vh]">
            {error ? (
              <div className="flex items-center justify-center h-full w-full">
                <span className="text-sm text-red-500">{error}</span>
              </div>
            ) : resolvedUrl ? (
              <video
                ref={vref}
                src={resolvedUrl}
                controls
                playsInline
                className="max-h-full max-w-full h-auto w-auto object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full w-full">
                <span className="text-sm text-muted-foreground">Loading video…</span>
              </div>
            )}
          </div>
 
          <div className="px-4 pt-2 pb-2">
            <p className="text-muted-foreground text-xs">
              {format(video.timestamp, "MMMM d, yyyy")}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
