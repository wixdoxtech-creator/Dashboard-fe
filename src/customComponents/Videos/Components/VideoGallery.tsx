import { useState, useCallback, memo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import VideoCard from "./VideoCard";
import { Video } from "../data/Videos";
import VideoPlayer from "./VideoPlayer";
import { Trash2 } from "lucide-react";
import { deleteVideoById, bulkDeleteVideos } from "../data/Videos";
import { customToast } from "@/lib/toastConfig";

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

type DeleteMode = "single" | "all";

interface VideoGalleryProps {
  videos: Video[];
  title?: string;
}

const VideoGallery = memo(
  ({ videos, title = "Video Gallery" }: VideoGalleryProps) => {
    const { user } = useAuth();
    const [items, setItems] = useState<Video[]>(videos);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [playerOpen, setPlayerOpen] = useState<boolean>(false);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);

    // confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
    const [targetId, setTargetId] = useState<string | null>(null);
    const [confirmDeleting, setConfirmDeleting] = useState(false);

    useEffect(() => {
      setItems(videos);
    }, [videos]);

    const openVideoPlayer = useCallback((video: Video) => {
      setSelectedVideo(video);
      setPlayerOpen(true);
    }, []);

    const closeVideoPlayer = useCallback(() => setPlayerOpen(false), []);

   
    const doDeleteOne = useCallback(
      async (id: string) => {
        if (!user) return;
        setDeletingIds((prev) => new Set(prev).add(id));
        try {
          const ok = await deleteVideoById(user.email, user.deviceImei, id);
          if (ok) {
            setItems((prev) => prev.filter((v) => String(v.id) !== String(id)));
            if (selectedVideo && String(selectedVideo.id) === String(id)) {
              setPlayerOpen(false);
              setSelectedVideo(null);
            }
            customToast.success("Video deleted successfully!");
          } else {
            customToast.error?.("Failed to delete. Please try again.");
          }
        } catch (e) {
          customToast.error?.("Failed to delete. Please try again.");
        } finally {
          setDeletingIds((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
          });
        }
      },
      [user, selectedVideo]
    );

    const doDeleteAll = useCallback(async () => {
      if (!user || !items.length) return;
      setBulkDeleting(true);
      try {
        const ids = items.map((v) => String(v.id));
        const { success, deleted, errors } = await bulkDeleteVideos(
          user.email,
          user.deviceImei,
          ids
        );
        if (!success && errors?.length) {
          console.error("Bulk delete errors:", errors);
        }
        const deletedSet = new Set(deleted.map(String));
        setItems((prev) => prev.filter((v) => !deletedSet.has(String(v.id))));
        if (selectedVideo && deletedSet.has(String(selectedVideo.id))) {
          setPlayerOpen(false);
          setSelectedVideo(null);
        }
        customToast.success("All videos deleted successfully!");
      } catch (e) {
        customToast.error?.("Failed to delete all videos.");
      } finally {
        setBulkDeleting(false);
      }
    }, [user, items, selectedVideo]);

    // ===== Open confirm dialog =====
    const requestDeleteOne = useCallback((id: string) => {
      setConfirmMode("single");
      setTargetId(id);
      setConfirmOpen(true);
    }, []);

    const requestDeleteAll = useCallback(() => {
      setConfirmMode("all");
      setTargetId(null);
      setConfirmOpen(true);
    }, []);

    // ===== Confirm click handler =====
    const onConfirmDelete = useCallback(async () => {
      try {
        setConfirmDeleting(true);
        if (confirmMode === "single" && targetId) {
          await doDeleteOne(targetId);
        } else if (confirmMode === "all") {
          await doDeleteAll();
        }
      } finally {
        setConfirmDeleting(false);
      }
    }, [confirmMode, targetId, doDeleteOne, doDeleteAll]);

    return (
      <div className="container mx-auto px-4">
        {/* Header: title left, bulk delete right */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-4xl font-semibold text-gray-600 text-center sm:text-left">
            {title}
          </h1>

          <button
            type="button"
            onClick={requestDeleteAll}
            disabled={!items.length || bulkDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 disabled:opacity-50 hover:bg-red-700 transition w-full sm:w-auto"
            title="Delete all videos"
          >
            <Trash2 className="h-4 w-4" />
            {bulkDeleting ? "Deleting..." : `Delete All (${items.length})`}
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((video) => (
            <VideoCard
              key={String(video.id)}
              id={String(video.id)}
              thumbnailUrl={video.thumbnailUrl ?? "/video.png"}
              title={video.name}
              timestamp={video.timestamp}
              onClick={() => openVideoPlayer(video)}
              // IMPORTANT: open confirm dialog first
              onDelete={(id) => requestDeleteOne(id)}
              deleting={deletingIds.has(String(video.id))}
            />
          ))}
        </div>

        <VideoPlayer
          isOpen={playerOpen}
          onClose={closeVideoPlayer}
          video={selectedVideo}
        />

        {/* Confirm Dialog */}
        <AlertDialog
          open={confirmOpen}
          onOpenChange={(open) => {
            setConfirmOpen(open);
            if (!open) setConfirmDeleting(false);
          }}
        >
          <AlertDialogContent
            className="
              sm:max-w-[480px] rounded-2xl
              border border-gray-200 dark:border-neutral-800
              bg-white/90 dark:bg-neutral-900/80
              backdrop-blur-md shadow-2xl
            "
          >
            <div className="mx-auto -mt-18 flex h-24 w-24 items-center justify-center">
            <img src="/warning.png" className="w-20 h-20" />
            </div>

            <AlertDialogHeader className="text-center space-y-1">
              <AlertDialogTitle className="text-2xl text-center font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
                {confirmMode === "all"
                  ? "Delete all videos?"
                  : "Delete this video?"}
              </AlertDialogTitle>

              <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
                {confirmMode === "all" ? (
                  <span>
                    This will delete{" "}
                    <span className="font-semibold text-red-600">all videos</span>{" "}
                    for this device. This action cannot be undone.
                  </span>
                ) : (
                  <span>
                    This will permanently delete the selected video. This action cannot be undone.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="sm:justify-center gap-2">
              <AlertDialogCancel
                onClick={() => setConfirmOpen(false)}
                disabled={confirmDeleting || bulkDeleting}
                className="
                  rounded-xl border border-gray-300 dark:border-neutral-700
                  bg-white hover:bg-gray-50
                  dark:bg-neutral-800 dark:hover:bg-neutral-700
                  text-gray-700 dark:text-gray-100
                "
              >
                Cancel
              </AlertDialogCancel>

              <AlertDialogAction
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setConfirmOpen(false);
                  onConfirmDelete();
                }}
                disabled={confirmDeleting || bulkDeleting}
                className="
                  rounded-xl
                  bg-gradient-to-r from-rose-600 to-red-600
                  text-white shadow-lg
                  hover:from-rose-700 hover:to-red-700
                  focus-visible:ring-2 focus-visible:ring-red-400
                  focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900
                "
              >
                {confirmDeleting ? (
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
);

export default VideoGallery;
