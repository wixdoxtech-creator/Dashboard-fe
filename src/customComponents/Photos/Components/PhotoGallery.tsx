import { useCallback, useEffect, useRef, useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import PhotoCard from "./PhotoCard";
import LightboxModal from "./LightboxModal";
import { Photo, fetchPhotoBlobById } from "../data/Photos";
import { deletePhotoById, bulkDeletePhotos } from "../data/Photos";
import { Trash2 } from "lucide-react";
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

interface PhotoGalleryProps {
  photos: Photo[];
  title?: string;
}

const PhotoGallery = memo(
  ({ photos, title = "Photo Gallery" }: PhotoGalleryProps) => {
    const { user } = useAuth();
    const [items, setItems] = useState<Photo[]>(photos);
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const cacheRef = useRef<Map<string, string>>(new Map());

    // confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
    const [targetId, setTargetId] = useState<string | null>(null);
    const [confirmDeleting, setConfirmDeleting] = useState(false);

    useEffect(() => {
      setItems(photos);
    }, [photos]);

    useEffect(() => {
      return () => {
        for (const url of cacheRef.current.values()) {
          try { URL.revokeObjectURL(url); } catch {}
        }
        cacheRef.current.clear();
      };
    }, []);

    const openLightbox = useCallback(
      async (index: number) => {
        if (!user) return;
        const photo = items[index];
        if (!photo) return;

        const id = String(photo.id);
        const cached = cacheRef.current.get(id);
        if (cached) {
          setOpenIndex(index);
          return;
        }

        setLoadingIds((prev) => new Set(prev).add(id));
        try {
          const result = await fetchPhotoBlobById(
            user.email,
            user.deviceImei,
            id
          );
          if (!result) {
            console.error("Failed to fetch image for id:", id);
            return;
          }
          cacheRef.current.set(id, result.objectUrl);
          setOpenIndex(index);
        } catch (err) {
          console.error("openLightbox error:", err);
        } finally {
          setLoadingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      },
      [items, user]
    );

    const closeLightbox = useCallback(() => setOpenIndex(null), []);

    const handleNavigate = useCallback(
      (nextIndex: number) => {
        if (nextIndex < 0 || nextIndex >= items.length) return;
        openLightbox(nextIndex);
      },
      [items.length, openLightbox]
    );

    // ===== Delete Logic =====
    const doDeleteOne = useCallback(
      async (id: string) => {
        if (!user) return;
        setDeletingIds((prev) => new Set(prev).add(id));
        try {
          const ok = await deletePhotoById(user.email, user.deviceImei, id);
          if (ok) {
            setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
            const url = cacheRef.current.get(id);
            if (url) {
              try { URL.revokeObjectURL(url); } catch {}
              cacheRef.current.delete(id);
            }
            if (openIndex !== null) {
              const currentId = String(items[openIndex]?.id ?? "");
              if (currentId === id) setOpenIndex(null);
            }
            customToast.success("Photo deleted successfully!");
          } else {
            customToast.error?.("Failed to delete. Please try again.");
          }
        } catch (e) {
          customToast.error?.("Failed to delete. Please try again.");
        } finally {
          setDeletingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }
      },
      [user, openIndex, items]
    );

    const doDeleteAll = useCallback(async () => {
      if (!user) return;
      if (!items.length) return;

      setBulkDeleting(true);
      try {
        const ids = items.map((p) => String(p.id));
        const { success, deleted, errors } = await bulkDeletePhotos(
          user.email,
          user.deviceImei,
          ids
        );
        if (!success && errors?.length) {
          console.error("Bulk delete errors:", errors);
        }

        const deletedSet = new Set(deleted.map(String));
        setItems((prev) => prev.filter((p) => !deletedSet.has(String(p.id))));

        for (const d of deletedSet) {
          const url = cacheRef.current.get(d);
          if (url) {
            try { URL.revokeObjectURL(url); } catch {}
            cacheRef.current.delete(d);
          }
        }
        setOpenIndex(null);
        customToast.success("All photos deleted successfully!");
      } catch (e) {
        customToast.error?.("Failed to delete all photos.");
      } finally {
        setBulkDeleting(false);
      }
    }, [user, items]);

    // ===== Open Confirm Dialog =====
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

    // ===== Confirm Dialog "Confirm" click =====
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
      <div className="container mx-auto px-4 py-4">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-4xl font-semibold text-gray-600 text-center sm:text-left">
            {title}
          </h1>

          <button
            type="button"
            onClick={requestDeleteAll}
            disabled={!items.length || bulkDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 disabled:opacity-50 hover:bg-red-700 transition w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            title="Delete all photos"
            aria-label="Delete all photos"
          >
            <Trash2 className="h-4 w-4" />
            {bulkDeleting ? "Deleting..." : `Delete All (${items.length})`}
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((photo, index) => {
            const id = String(photo.id);
            return (
              <PhotoCard
                key={id}
                id={id}
                imageUrl={cacheRef.current.get(id) ?? null}
                timestamp={photo.timestamp ?? null}
                onClick={() => openLightbox(index)}
                // IMPORTANT: open confirm dialog instead of direct delete
                onDelete={(pid) => requestDeleteOne(pid)}
                loading={loadingIds.has(id)}
                deleting={deletingIds.has(id)}
              />
            );
          })}
        </div>

        {/* Lightbox */}
        {openIndex !== null && items[openIndex] && (
          <LightboxModal
            isOpen
            onClose={closeLightbox}
            imageUrl={cacheRef.current.get(String(items[openIndex].id)) ?? null}
            currentIndex={openIndex}
            total={items.length}
            onPrev={() => {
              const prev = openIndex - 1;
              if (prev >= 0) handleNavigate(prev);
            }}
            onNext={() => {
              const next = openIndex + 1;
              if (next < items.length) handleNavigate(next);
            }}
          />
        )}

        {/* Confirm Dialog (same style as Call History, text adjusted) */}
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
                {confirmMode === "all" ? "Delete all photos?" : "Delete this photo?"}
              </AlertDialogTitle>

              <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
                {confirmMode === "all" ? (
                  <span>
                    This will delete{" "}
                    <span className="font-semibold text-red-600">all photos</span>{" "}
                    for this device. This action cannot be undone.
                  </span>
                ) : (
                  <span>
                    This will permanently delete the selected photo. This action cannot be undone.
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

export default PhotoGallery;
