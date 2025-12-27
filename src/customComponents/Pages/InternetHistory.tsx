import { useEffect, useMemo, useState } from "react";
import { MoreVertical, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

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
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InteractiveLoader from "@/components/ui/InteractiveLoader";
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
import { useDeleteDataMutation, useGetInternetHistoryQuery } from "@/api/features";

interface InternetHistory {
  id: number;
  userId: string;
  token: string;
  entity: string;
  title: string;
  url: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export default function InternetHistory() {
  const [urlHistory, setUrlHistory] = useState<InternetHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEntries, setSelectedEntries] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [confirmIds, setConfirmIds] = useState<number[]>([]);

  const { user, isAuthenticated, loading: authLoading, hasLicense } = useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  //  RTKQ 
  const { data: internetHistoryData, refetch  } = useGetInternetHistoryQuery(
      { email, deviceImei },
      {
        skip,
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
      }
    );

  // RTKQ delete mutation
  const [deleteDataMutation] = useDeleteDataMutation();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || skip) return;
    if (!internetHistoryData) return;
  
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const rows = internetHistoryData ?? []; 
        if (!alive) return;
        setUrlHistory(rows);
      } catch (e) {
        console.error("Error while loading Internet History (RTKQ mirror)", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
  
    return () => {
      alive = false;
    };
  }, [authLoading, isAuthenticated, user, skip, internetHistoryData]);

  // Handle window resize
  useEffect(() => {
    const setFromWindow = () => setIsMobileView(window.innerWidth < 768);
    setFromWindow(); // initial
    window.addEventListener("resize", setFromWindow);
    return () => window.removeEventListener("resize", setFromWindow);
  }, []);

  const entriesPerPage = parseInt(selectedEntries);
  const totalPages = Math.ceil(urlHistory.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentUrl = urlHistory.slice(startIndex, endIndex);

  const allCurrentPageSelected = useMemo(() => {
    if (currentUrl.length === 0) return false;
    return currentUrl.every((n) => selectedIds.has(n.id));
  }, [currentUrl, selectedIds]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean | "indeterminate") => {
    const next = new Set(selectedIds);
    if (checked) {
      currentUrl.forEach((n) => next.add(n.id));
    } else {
      currentUrl.forEach((n) => next.delete(n.id));
    }
    setSelectedIds(next);
  };

  // Delete single
  const handleDelete = async (id: number) => {
    if (!user) return;
    try {
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "internet_history",
        ids: [id], 
      }).unwrap();

      setUrlHistory((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      customToast.success("Internet History deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      customToast.error("Failed to delete this Internet History.");
    }
  };

  // Delete selected (multi)
  const handleDeleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setDeleting(true);

    try {
      const ids = Array.from(selectedIds);
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "internet_history",
        ids,
      }).unwrap();
      setUrlHistory((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());

      customToast.success(
        `${ids.length} Internet History deleted successfully!`
      );
    } catch (err) {
      console.error("Delete selected failed", err);
      customToast.error("Failed to delete selected contacts.");
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
        entity: "internet_history",
        clearAll: true,
      }).unwrap();

      setUrlHistory([]);
      setSelectedIds(new Set());
      setCurrentPage(1);

      customToast.success("All Internet History deleted successfully!");
    } catch (err) {
      console.error("Delete all failed", err);
      customToast.error(
        "Failed to delete all Internet History. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  type DeleteMode = "single" | "multi" | "all";

  // Open the dialog with context
  const openConfirm = (mode: DeleteMode, ids: number[] = []) => {
    setConfirmMode(mode);
    setConfirmIds(ids);
    setConfirmOpen(true);
  };

  // Called when user confirms in the dialog
  const onConfirmDelete = async () => {
    setConfirmOpen(false);
    if (confirmMode === "single" && confirmIds[0] !== undefined) {
      await handleDelete(confirmIds[0]);
    } else if (confirmMode === "multi") {
      await handleDeleteSelected();
    } else if (confirmMode === "all") {
      await handleDeleteAll();
    }
  };

  const handleRefresh = () => refetch();

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleEntriesChange = (value: string) => {
    setSelectedEntries(value);
    setCurrentPage(1); // Reset to first page when changing entries per page
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Mobile view of contacts as cards
  const renderMobileView = () => (
    <div className="space-y-4">
      {loading ? (
        <div>
          <InteractiveLoader />
        </div>
      ) : currentUrl.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No Internet History.
        </div>
      ) : (
        <>
          {currentUrl.map((url) => (
            <div
              key={url.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium">{url.title}</h3>
                  <p className="text-sm text-gray-500">{url.url}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  {formatTimestamp(url.timestamp)}
                </span>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-xs"
                  size="sm"
                  onClick={() => handleDelete(url.id)}
                >
                  Block
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
        <h2 className="text-2xl sm:text-3xl font-semibold">Internet History</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2 text-xs sm:text-sm"
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
            disabled={urlHistory.length === 0 || deleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Delete All</span>
          </Button>

          <Select value={selectedEntries} onValueChange={handleEntriesChange}>
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

      {/* Mobile View */}
      {isMobileView ? (
        renderMobileView()
      ) : (
        /* Desktop View */
        <div className="border rounded-lg bg-white overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={(c) => toggleSelectAllOnPage(Boolean(c))}
                    disabled={deleting || loading || currentUrl.length === 0}
                  />
                </TableHead>

                <TableHead className="w-[180px]">Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div>
                      <InteractiveLoader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentUrl.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No Internet History.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {currentUrl.map((url) => (
                    <TableRow key={url.id} className="hover:bg-gray-100">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(url.id)}
                          onCheckedChange={() => toggleSelect(url.id)}
                          disabled={deleting}
                        />
                      </TableCell>
 
                      <TableCell className="font-semibold text-gray-600">
                        {url.title}
                      </TableCell>
                      <TableCell className="w-[600px] whitespace-normal break-words line-clamp-3 text-gray-500">
                        {url.url}
                      </TableCell>
  
                      <TableCell className="text-gray-600">
                        {formatTimestamp(url.timestamp)}
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
                                  () => openConfirm("single", [url.id]),
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

      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="text-xs sm:text-sm text-muted-foreground">
          Showing {startIndex + 1} to {Math.min(endIndex, urlHistory.length)} of{" "}
          {urlHistory.length} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="text-xs sm:text-sm"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      </div>

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
          {/* Top warning icon */}
          <div className="mx-auto -mt-18 flex h-24 w-24 items-center justify-center">
            <img src="/warning.png" className="w-20 h-20" />
            </div>

          <AlertDialogHeader className="text-center space-y-1">
            <AlertDialogTitle className="text-2xl font-semibold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
              {confirmMode === "all"
                ? "Delete all contacts?"
                : confirmMode === "multi"
                ? "Delete selected contacts?"
                : "Delete this contact?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {confirmMode === "all" && (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">
                    all contacts
                  </span>{" "}
                  for this device. This action cannot be undone.
                </span>
              )}
              {confirmMode === "multi" && (
                <span>
                  You are about to delete{" "}
                  <span className="font-semibold text-red-600">
                    {selectedIds.size}
                  </span>{" "}
                  contacts. This action cannot be undone.
                </span>
              )}
              {confirmMode === "single" && (
                <span>
                  This will permanently delete the selected contact. This action
                  cannot be undone.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel
              disabled={deleting}
              className="rounded-xl border border-gray-300 dark:border-neutral-700
                bg-white hover:bg-gray-50 dark:bg-neutral-800 dark:hover:bg-neutral-700
                text-gray-700 dark:text-gray-100">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={onConfirmDelete}
              disabled={deleting}
              className="rounded-xl bg-gradient-to-r from-rose-600 to-red-600
                text-white shadow-lg hover:from-rose-700 hover:to-red-700
                 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-900"
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
