import { useState, useEffect, useMemo } from "react";
import { RefreshCcw, Trash2, Clock, MoreVertical } from "lucide-react";
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
import { useDeleteDataMutation, useGetOutlookQuery } from "@/api/features";

type DeleteMode = "single" | "multi" | "all";

type PaginationInfo = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  nextPage?: number | null;
};

interface OutlookRow {
  id: number;
  timestamp: string;
  text: string;
  direction: string;
  // optional extras (if backend sends them)
  userId?: number | null;
  token?: string;
  entity?: string;
  name?: string;
  number?: string;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function Outlook() {
  const [rows, setRows] = useState<OutlookRow[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [selectedEntries, setSelectedEntries] = useState("20"); // match API default
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const { user, isAuthenticated, hasLicense, loading: authLoading } = useAuth();

  // Selection + dialog
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [confirmIds, setConfirmIds] = useState<number[]>([]);

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  const limit = Number(selectedEntries);

  // ✅ IMPORTANT: send page + limit
  const { data: outlookData, refetch, isFetching } = useGetOutlookQuery(
    { email, deviceImei, page: currentPage, limit },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [deleteDataMutation] = useDeleteDataMutation();

  // Normalize API shape:
  // supports: { data: [], pagination: {} } OR { outlook: [] } OR [] (fallback)
  const normalize = (payload: any): { list: OutlookRow[]; pg: PaginationInfo | null } => {
    const listRaw =
      payload?.data ??
      payload?.outlook ??
      (Array.isArray(payload) ? payload : []);

    const pg: PaginationInfo | null = payload?.pagination ?? null;

    const list: OutlookRow[] = (listRaw ?? []).map((x: any) => ({
      id: Number(x.id),
      timestamp: x.timestamp ?? x.createdAt ?? new Date().toISOString(),
      text: String(x.text ?? ""),
      direction: String(x.direction ?? "incoming"),
      userId: x.userId ?? null,
      token: x.token,
      entity: x.entity,
      name: x.name,
      number: x.number,
    }));

    return { list, pg };
  };

  // Load data from RTKQ response
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || skip) return;

    setLoading(true);
    try {
      if (!outlookData) return;

      const { list, pg } = normalize(outlookData);
      setRows(list);
      setPagination(pg);
      setSelectedIds(new Set()); // clear selection on page change
    } catch (e) {
      console.error("Failed in fetching Outlook data", e);
      customToast.error("Failed to load Outlook data.");
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, user?.email, user?.deviceImei, skip, outlookData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Select-all (current page)
  const allCurrentPageSelected = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every((r) => selectedIds.has(r.id));
  }, [rows, selectedIds]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean | "indeterminate") => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) rows.forEach((r) => next.add(r.id));
      else rows.forEach((r) => next.delete(r.id));
      return next;
    });
  };

  // Direction color
  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "incoming":
        return "text-green-600";
      case "outgoing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  // ✅ Delete single
  const handleDelete = async (id: number) => {
    if (!user) return;
    try {
      setDeleting(true);

      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "outlook", // ✅ fixed
        ids: [id],
      }).unwrap();

      setRows((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await refetch();
      customToast.success("Outlook item deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      customToast.error("Failed to delete this Outlook item.");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ Delete selected
  const handleDeleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    try {
      setDeleting(true);

      const ids = Array.from(selectedIds); // ✅ number[]
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "outlook", // ✅ fixed
        ids,
      }).unwrap();

      setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());

      await refetch();
      customToast.success(`${ids.length} Outlook item(s) deleted successfully!`);
    } catch (err) {
      console.error("Delete selected failed", err);
      customToast.error("Failed to delete selected Outlook items.");
    } finally {
      setDeleting(false);
    }
  };

  // ✅ Delete all
  const handleDeleteAll = async () => {
    if (!user) return;
    try {
      setDeleting(true);

      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "outlook", // ✅ fixed
        clearAll: true,
      }).unwrap();

      setRows([]);
      setSelectedIds(new Set());
      setCurrentPage(1);

      await refetch();
      customToast.success("All Outlook data deleted successfully!");
    } catch (err) {
      console.error("Delete all failed", err);
      customToast.error("Failed to delete all Outlook data.");
    } finally {
      setDeleting(false);
    }
  };

  // Confirm dialog helpers
  const openConfirm = (mode: DeleteMode, ids: number[] = []) => {
    setConfirmMode(mode);
    setConfirmIds(ids);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (confirmMode === "single" && confirmIds[0] != null) {
      await handleDelete(confirmIds[0]);
    } else if (confirmMode === "multi") {
      await handleDeleteSelected();
    } else if (confirmMode === "all") {
      await handleDeleteAll();
    }
  };

  const handleRefresh = async () => {
    setSelectedIds(new Set());
    setLoading(true);
    try {
      await refetch();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Pagination values from server
  const page = pagination?.page ?? currentPage;
  const totalPages = pagination?.totalPages ?? 1;
  const hasNext = pagination?.hasNext ?? false;
  const total = pagination?.total ?? rows.length;

  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = total === 0 ? 0 : (page - 1) * limit + rows.length;

  // Mobile cards
  const renderMobileView = () => (
    <div className="space-y-4">
      {loading || isFetching? (
        <div>
          <InteractiveLoader />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No Outlook History.
        </div>
      ) : (
        <>
          {rows.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                    className="mt-1"
                    disabled={deleting}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${getDirectionColor(item.direction)}`}>
                        {item.direction}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 break-words mt-1">{item.text}</p>
                  </div>
                </div>

                <Button
                  className="bg-red-600 hover:bg-red-700 text-xs"
                  size="sm"
                  onClick={() => openConfirm("single", [item.id])}
                  disabled={deleting}
                >
                  Delete
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(item.timestamp)}</span>
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
        <h2 className="text-2xl sm:text-3xl font-semibold">Outlook History</h2>

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
            onValueChange={(value) => {
              setSelectedEntries(value);
              setCurrentPage(1);
              setSelectedIds(new Set());
            }}
          >
            <SelectTrigger className="w-[140px] sm:w-[190px] text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Show 10 entries</SelectItem>
              <SelectItem value="20">Show 20 entries</SelectItem>
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
                    disabled={deleting || loading || rows.length === 0}
                  />
                </TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Text</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading || isFetching ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <InteractiveLoader />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No Outlook History.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {rows.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          disabled={deleting}
                        />
                      </TableCell>

                      <TableCell>
                        <span className={`text-xs font-medium ${getDirectionColor(item.direction)}`}>
                          {item.direction}
                        </span>
                      </TableCell>

                      <TableCell className="text-gray-800 whitespace-normal break-words">
                        {item.text}
                      </TableCell>

                      <TableCell className="text-gray-600">
                        {formatTimestamp(item.timestamp)}
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
                              onSelect={() => setTimeout(() => openConfirm("single", [item.id]), 0)}
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

      {/* ✅ Pagination (server-based) */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing {showingFrom} to {showingTo} of {total} entries
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

          <div className="text-xs sm:text-sm text-muted-foreground">
            Page {currentPage} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => (hasNext ? p + 1 : p))}
            disabled={!hasNext || loading || isFetching}
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
                ? "Delete all Outlook data?"
                : confirmMode === "multi"
                ? "Delete selected Outlook items?"
                : "Delete this Outlook item?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {confirmMode === "all" && (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">all Outlook data</span>{" "}
                  for this device. This action cannot be undone.
                </span>
              )}
              {confirmMode === "multi" && (
                <span>
                  You are about to delete{" "}
                  <span className="font-semibold text-red-600">{selectedIds.size}</span>{" "}
                  item(s). This action cannot be undone.
                </span>
              )}
              {confirmMode === "single" && (
                <span>This will permanently delete the selected item. This action cannot be undone.</span>
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
                void onConfirmDelete();
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
