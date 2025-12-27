import { useState, useEffect, useMemo } from "react";
import {
  RefreshCcw,
  Trash2,
  Clock,
  MoreVertical,
  Timer,
} from "lucide-react";
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
import { useDeleteDataMutation, useGetCallHistoryQuery } from "@/api/features";

type DeleteMode = "single" | "multi" | "all";

interface CallHistory {
  id: string;
  starred: boolean;
  direction: string;
  name: string;
  number: string;
  duration: string;
  cellid: string;
  LAC: string;
  timestamp: string;
}

export default function CallHistory() {
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [selectedEntries, setSelectedEntries] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  const { user, isAuthenticated, hasLicense, loading: authLoading } = useAuth();

  // Selection + dialog
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [confirmIds, setConfirmIds] = useState<string[]>([]);

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  const [deleteDataMutation] = useDeleteDataMutation();
  

  const entriesPerPage = parseInt(selectedEntries, 10);
 
  const { data: callHistoryData, refetch, isFetching: callHistoryFetching } = useGetCallHistoryQuery(
    { email, deviceImei, page: currentPage, limit: entriesPerPage },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

// Accept { callHistory: [...] } OR just [...]
type Wire = { data?: any[]; pagination?: any } | undefined;

const toRows = (wire: Wire): CallHistory[] =>
  (wire?.data ?? []).map((c: any) => ({
    ...c,
    id: String(c.id),
    starred: false,
  }));


// Keep your function name/signature; now it uses RTKQ cache/refetch
const LoadData = async (force = false) => {
  if (!user) return;
  try {
    setLoading(true);

    // use cache first; fetch from server only when needed/forced
    let src: Wire = callHistoryData;
    if (force || !src) {
      const res = await refetch();
      if ("data" in res && res.data) src = res.data as Wire;
    }

    setCallHistory(toRows(src));
    setPaginationInfo(src?.pagination ?? null);
    setSelectedIds(new Set());
  } catch (error) {
    console.log("Failed in fetching Call History", error);
    customToast.error("Failed to load Call History.");
  } finally {
    setLoading(false);
  }
};

// initial load (same deps; add `skip` so it won’t run if args invalid)
useEffect(() => {
  if (authLoading) return;
  if (!isAuthenticated || !user || skip) return;
  LoadData(); // uses cache if present
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [authLoading, isAuthenticated, user?.email, user?.deviceImei, skip]);

// optional: mirror RTKQ updates into your local list (keeps UI live)
useEffect(() => {
  if (!callHistoryData) return;
  setCallHistory(toRows(callHistoryData));
  setPaginationInfo(callHistoryData.pagination ?? null);
  setLoading(false);
}, [callHistoryData]);



  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const total = paginationInfo?.total ?? 0;
  const totalPages = paginationInfo?.totalPages ?? 1;
  const currentNumbers = callHistory; 
  

  // Select-all (current page)
  const allCurrentPageSelected = useMemo(() => {
    if (currentNumbers.length === 0) return false;
    return currentNumbers.every((r) => selectedIds.has(r.id));
  }, [currentNumbers, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean | "indeterminate") => {
    const next = new Set(selectedIds);
    if (checked) currentNumbers.forEach((r) => next.add(r.id));
    else currentNumbers.forEach((r) => next.delete(r.id));
    setSelectedIds(next);
  };

  // Delete Handler single
  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDataMutation({ 
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "call_history",
        ids: [ Number(id)],
      }).unwrap();

      setCallHistory((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      customToast.success("Call log deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      customToast.error("Failed to delete this call log.");
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const ids = Array.from(selectedIds).map(Number);
      await deleteDataMutation({ 
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "call_history",
        ids,
      }).unwrap();
      
      setCallHistory((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      customToast.success(`${ids.length} call log(s) deleted successfully!`);
    } catch (err) {
      console.error("Delete selected failed", err);
      customToast.error("Failed to delete selected call logs.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "call_history",
        clearAll: true,
    }).unwrap(); 

      setCallHistory([]);
      setSelectedIds(new Set());
      setCurrentPage(1);
      customToast.success("All call logs deleted successfully!");
    } catch (err) {
      console.error("Delete all failed", err);
      customToast.error("Failed to delete all call logs.");
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
    await LoadData(true);
  };
  

  // Get call direction color
  const getCallDirectionColor = (direction: string) => {
    switch (direction) {
      case "incoming":
        return "text-green-600";
      case "outgoing":
        return "text-blue-600";
      case "missed":
        return "text-red-600";
      default:
        return "text-red-600";
    }
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
      {loading || callHistoryFetching ? (
        <div>
          <InteractiveLoader />
        </div>
      ) : currentNumbers.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No Call History.
        </div>
      ) : (
        <>
          {currentNumbers.map((call) => (
            <div
              key={call.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-start mb-5 grid-cols-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(call.id)}
                    onCheckedChange={() => toggleSelect(call.id)}
                    className="mt-1"
                    disabled={deleting}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{call.name}</h3>
                      <span
                        className={`text-xs font-medium ${getCallDirectionColor(
                          call.direction
                        )}`}
                      >
                        {call.direction}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{call.number}</p>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                <Button
                  className="bg-red-600 hover:bg-red-700 text-xs"
                  size="sm"
                  onClick={() => openConfirm("single", [call.id])} // confirm first
                  disabled={deleting}
                >
                  Delete
                </Button>
              </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  <span>{call.duration}</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(call.timestamp)}</span>
                </div>
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
        <h2 className="text-2xl sm:text-3xl font-semibold">Call History</h2>
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

          {/* NEW: Delete Selected */}
          <Button
            size="sm"
            onClick={() => openConfirm("multi")}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-xs sm:text-sm"
            disabled={selectedIds.size === 0 || deleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Delete Selected</span>
          </Button>

          {/* NEW: Delete All */}
          <Button
            size="sm"
            onClick={() => openConfirm("all")}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            disabled={callHistory.length === 0 || deleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Delete All</span>
          </Button>

          <Select
            value={selectedEntries}
            onValueChange={(value) => {
              setSelectedEntries(value);
              setCurrentPage(1);
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

      {/* Mobile View */}
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
                    disabled={
                      deleting ||
                      loading ||
                      callHistoryFetching ||
                      currentNumbers.length === 0
                    }
                  />
                </TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || callHistoryFetching ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div>
                      <InteractiveLoader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentNumbers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No Call History.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {currentNumbers.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(call.id)}
                          onCheckedChange={() => toggleSelect(call.id)}
                          disabled={deleting}
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium ${getCallDirectionColor(
                            call.direction
                          )}`}
                        >
                          {call.direction}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {call.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {call.number}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {call.duration}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatTimestamp(call.timestamp)}
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
                                  () => openConfirm("single", [call.id]),
                                  0
                                )
                              } // freeze fix
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
        Showing {callHistory.length ? (currentPage - 1) * entriesPerPage + 1 : 0} to{" "}
{(currentPage - 1) * entriesPerPage + callHistory.length} of {total} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1 || loading || callHistoryFetching}
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
            disabled={currentPage === totalPages || loading || callHistoryFetching}
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
                ? "Delete all call logs?"
                : confirmMode === "multi"
                ? "Delete selected call logs?"
                : "Delete this call log?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {confirmMode === "all" && (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">
                    all call logs
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
                  call logs. This action cannot be undone.
                </span>
              )}
              {confirmMode === "single" && (
                <span>
                  This will permanently delete the selected call log. This
                  action cannot be undone.
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
