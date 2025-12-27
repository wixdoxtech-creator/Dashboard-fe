import { useEffect, useState, useCallback } from "react";
import { PdfCard } from "./PdfCard";
import { PdfData, fetchPDFs } from "../Data/PdfData";
import { useAuth } from "@/contexts/AuthContext";
import { deletePDFById, bulkDeletePDF } from "../Data/PdfData";
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

export default function DocumentPage() {
  const [items, setItems] = useState<PdfData[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [confirmDeleting, setConfirmDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        const data = await fetchPDFs(user.email, user.deviceImei);
        setItems(data);
      } catch (e) {
        customToast.error?.("Failed to load documents.");
      } finally {
        setLoading(false);
      }
    };
    loadPdf();
  }, [authLoading, isAuthenticated, user?.email, user?.deviceImei]);

  const handleViewPdf = useCallback((pdf: PdfData) => {
    window.open(pdf.file_path, "_blank");
  }, []);

  // Actual single delete 
  const doDeleteOne = useCallback(
    async (id: string) => {
      if (!user) return;
      setDeletingIds((prev) => new Set(prev).add(id));
      try {
        const ok = await deletePDFById(user.email, user.deviceImei, id);
        if (ok) {
          setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
          customToast.success("Document deleted successfully!");
        } else {
          customToast.error?.("Failed to delete. Please try again.");
        }
      } catch {
        customToast.error?.("Failed to delete. Please try again.");
      } finally {
        setDeletingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [user]
  );

  // Actual bulk delete 
  const doDeleteAll = useCallback(async () => {
    if (!user || !items.length) return;
    setBulkDeleting(true);
    try {
      const ids = items.map((p) => String(p.id));
      const { success, deleted, errors } = await bulkDeletePDF(
        user.email,
        user.deviceImei,
        ids
      );
      if (!success && errors?.length) {
        console.error("Bulk delete errors:", errors);
      }
      const deletedSet = new Set((deleted ?? []).map(String));
      setItems((prev) => prev.filter((p) => !deletedSet.has(String(p.id))));
      customToast.success("All documents deleted successfully!");
    } catch {
      customToast.error?.("Failed to delete all documents.");
    } finally {
      setBulkDeleting(false);
    }
  }, [user, items]);

  // Open confirm dialog
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

  // Confirm click
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

  if (loading) {
    return (
      <div className="p-6 text-2xl text-gray-400 text-center">
        Loading PDFs…
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6 mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-4xl font-semibold text-gray-600 text-center sm:text-left">
          Documents
        </h1>

        <button
          type="button"
          onClick={requestDeleteAll}
          disabled={!items.length || bulkDeleting}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 disabled:opacity-50 hover:bg-red-700 transition w-full sm:w-auto"
          title="Delete all documents"
        >
          <Trash2 className="h-4 w-4" />
          {bulkDeleting ? "Deleting..." : `Delete All (${items.length})`}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((file) => (
          <PdfCard
            key={String(file.id)}
            pdf={file as PdfData}
            onView={handleViewPdf}
            // open confirm dialog instead of deleting directly
            onDelete={(id) => requestDeleteOne(id)}
            deleting={deletingIds.has(String(file.id))}
          />
        ))}
      </div>

      {/* Confirm Dialog (same styling as other pages) */}
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
                ? "Delete all documents?"
                : "Delete this document?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {confirmMode === "all" ? (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">
                    all documents
                  </span>{" "}
                  for this device. This action cannot be undone.
                </span>
              ) : (
                <span>
                  This will permanently delete the selected document. This action
                  cannot be undone.
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
