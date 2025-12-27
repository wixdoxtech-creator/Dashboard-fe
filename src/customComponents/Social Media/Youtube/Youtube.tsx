import { useEffect, useMemo, useState } from "react";
import { MoreVertical, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useAuth } from "@/contexts/AuthContext";
import InteractiveLoader from "@/components/ui/InteractiveLoader";
import { customToast } from "@/lib/toastConfig";
import { useDeleteDataMutation, useGetYoutubeQuery } from "@/api/features";

type DeleteMode = "single" | "multi" | "all";

interface YoutubeRow {
  id: string;
  Youtube: string;
  timestamp: string;
}

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  nextPage?: number;
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function Youtube() {
  const [youtubeData, setYoutubeData] = useState<YoutubeRow[]>([]);
  const [selectedEntries, setSelectedEntries] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = parseInt(selectedEntries, 10);

  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    null
  );

  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const { user, isAuthenticated, loading: authLoading, hasLicense } = useAuth();

  // Selection + dialog
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [confirmIds, setConfirmIds] = useState<string[]>([]);

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  // ✅ RTKQ fetch (server-side pagination)
  const { data: ytData, refetch, isFetching } = useGetYoutubeQuery(
    { email, deviceImei, page: currentPage, limit: entriesPerPage },
    {
      skip,
      refetchOnMountOrArgChange: true, // ✅ important for page/limit changes
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [deleteDataMutation] = useDeleteDataMutation();

  // ✅ Load current page rows from API
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) return;
    if (!ytData) return;

    try {
      setLoading(true);

      const raw = (ytData as any)?.data ?? []; // expects { data, pagination }
      const rows: YoutubeRow[] = raw.map((item: any) => ({
        id: String(item.id),
        Youtube: item.text ?? item.Youtube ?? item.url ?? "",
        timestamp: item.timestamp ?? item.createdAt ?? "",
      }));

      setYoutubeData(rows);
      setPaginationInfo((ytData as any)?.pagination ?? null);

      // ✅ clear selection on new page data
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Failed in Fetching Youtube", err);
      customToast.error("Failed to load Youtube.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.email, user?.deviceImei, ytData]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ current page list (NO slicing)
  const currentYoutube = youtubeData;

  // ✅ select-all (current page)
  const allCurrentPageSelected = useMemo(() => {
    if (currentYoutube.length === 0) return false;
    return currentYoutube.every((r) => selectedIds.has(r.id));
  }, [currentYoutube, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean | "indeterminate") => {
    const next = new Set(selectedIds);
    if (checked) currentYoutube.forEach((r) => next.add(r.id));
    else currentYoutube.forEach((r) => next.delete(r.id));
    setSelectedIds(next);
  };

  // Single delete
  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      setDeleting(true);

      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "youtube",
        ids: [Number(id)],
      }).unwrap();

      customToast.success("Youtube deleted successfully!");
      await refetch();
    } catch (err) {
      console.error("Delete failed", err);
      customToast.error("Failed to delete this Youtube.");
    } finally {
      setDeleting(false);
    }
  };

  // Multi delete
  const handleDeleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds).map(Number);

      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "youtube",
        ids,
      }).unwrap();

      customToast.success(`${ids.length} Youtube(es) deleted successfully!`);
      await refetch();
    } catch (err) {
      console.error("Delete selected failed", err);
      customToast.error("Failed to delete selected Youtube.");
    } finally {
      setDeleting(false);
    }
  };

  // Delete all
  const handleDeleteAll = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "youtube",
        clearAll: true,
      }).unwrap();

      customToast.success("All Youtube deleted successfully!");
      setCurrentPage(1);
      await refetch();
    } catch (err) {
      console.error("Delete all failed", err);
      customToast.error("Failed to delete all Youtube.");
    } finally {
      setDeleting(false);
    }
  };

  // Confirm dialog helpers
  const openConfirm = (mode: DeleteMode, ids: string[] = []) => {
    setConfirmMode(mode);
    setConfirmIds(ids);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (confirmMode === "single" && confirmIds[0]) {
      await handleDelete(confirmIds[0]);
    } else if (confirmMode === "multi") {
      await handleDeleteSelected();
    } else if (confirmMode === "all") {
      await handleDeleteAll();
    }
  };

  const handleRefresh = async () => {
    setSelectedIds(new Set());
    setCurrentPage(1);
    setLoading(true);
    try {
      await refetch();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Pagination numbers (same as SMS)
  const totalPages = paginationInfo?.totalPages ?? 1;
  const total = paginationInfo?.total ?? 0;

  const startIndex =
    currentYoutube.length ? (currentPage - 1) * entriesPerPage + 1 : 0;

  const endIndex = (currentPage - 1) * entriesPerPage + currentYoutube.length;

  // Mobile cards
  const renderMobileView = () => (
    <div className="space-y-4">
      {loading || isFetching ? (
        <div>
          <InteractiveLoader />
        </div>
      ) : currentYoutube.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No Youtubes.
        </div>
      ) : (
        <>
          {currentYoutube.map((ip) => (
            <div
              key={ip.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(ip.id)}
                    onCheckedChange={() => toggleSelect(ip.id)}
                    className="mt-1"
                    disabled={deleting}
                  />
                  <div>
                    <h3 className="font-medium">{ip.Youtube}</h3>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {ip.timestamp ? new Date(ip.timestamp).toLocaleString() : "-"}
                </span>

                <Button
                  className="bg-red-600 hover:bg-red-700 text-xs"
                  size="sm"
                  onClick={() => openConfirm("single", [ip.id])}
                  disabled={deleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <Card className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 mb-10 bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold">Youtube</h2>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2 text-xs sm:text-sm"
            disabled={loading || deleting}
          >
            <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            size="sm"
            onClick={() => openConfirm("multi")}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-xs sm:text-sm"
            disabled={selectedIds.size === 0 || deleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Delete Selected</span>
          </Button>

          <Button
            size="sm"
            onClick={() => openConfirm("all")}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            disabled={total === 0 || deleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Delete All</span>
          </Button>

          <Select
            value={selectedEntries}
            onValueChange={(v) => {
              setSelectedEntries(v);
              setCurrentPage(1);
              setSelectedIds(new Set());
            }}
          >
            <SelectTrigger className="w-[120px] sm:w-[180px] text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Show 10 entries</SelectItem>
              <SelectItem value="25">Show 25 entries</SelectItem>
              <SelectItem value="50">Show 50 entries</SelectItem>
              <SelectItem value="100">Show 100 entries</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isMobileView ? (
        renderMobileView()
      ) : (
        <div className="border rounded-lg bg-white overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={(c) => toggleSelectAllOnPage(Boolean(c))}
                    disabled={deleting || loading || currentYoutube.length === 0}
                  />
                </TableHead>
                <TableHead>Youtube History</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading || isFetching ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    <InteractiveLoader />
                  </TableCell>
                </TableRow>
              ) : currentYoutube.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No Youtubes.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {currentYoutube.map((yt) => (
                    <TableRow key={yt.id} className="hover:bg-gray-100">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(yt.id)}
                          onCheckedChange={() => toggleSelect(yt.id)}
                          disabled={deleting}
                        />
                      </TableCell>

                      <TableCell className="text-gray-700">
                        {yt.Youtube}
                      </TableCell>

                      <TableCell className="text-gray-600">
                         {formatTimestamp(yt.timestamp)}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() =>
                                setTimeout(
                                  () => openConfirm("single", [yt.id]),
                                  0
                                )
                              }
                              disabled={deleting}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ✅ Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing {startIndex} to {endIndex} of {total} entries
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1 || loading || isFetching}
            className="text-xs sm:text-sm"
          >
            Previous
          </Button>

          <div className="text-xs sm:text-sm text-muted-foreground px-2">
            Page {currentPage} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || loading || isFetching}
            className="text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setDeleting(false);
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
                ? "Delete all Youtube?"
                : confirmMode === "multi"
                ? "Delete selected Youtube?"
                : "Delete this Youtube?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {confirmMode === "all" && (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">all Youtube</span>{" "}
                  for this device. This action cannot be undone.
                </span>
              )}
              {confirmMode === "multi" && (
                <span>
                  You are about to delete{" "}
                  <span className="font-semibold text-red-600">
                    {selectedIds.size}
                  </span>{" "}
                  Youtube(es). This action cannot be undone.
                </span>
              )}
              {confirmMode === "single" && (
                <span>
                  This will permanently delete the selected Youtube. This action
                  cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
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
              disabled={deleting}
              className="
                rounded-xl
                bg-gradient-to-r from-rose-600 to-red-600
                text-white shadow-lg
                hover:from-rose-700 hover:to-red-700
                focus-visible:ring-2 focus-visible:ring-red-400
                focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900
              "
            >
              {deleting ? (
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
    </Card>
  );
}
