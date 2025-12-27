import { useState, useEffect, useMemo } from "react";
import { RefreshCcw, Trash2, MoreVertical, Timer } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { SMSData, useDeleteDataMutation, useGetSmsQuery } from "@/api/features";
import { useAuth } from "@/contexts/AuthContext";
import InteractiveLoader from "@/components/ui/InteractiveLoader";
import { customToast } from "@/lib/toastConfig";

interface ExtendedSMS extends SMSData {
  starred: boolean;
  direction: string;
  name: string;
  number: string;
  timestamp: string;
}

type DeleteMode = "single" | "multi" | "all";

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function SMS() {
  const [messages, setMessages] = useState<ExtendedSMS[]>([]);
  const [selectedEntries, setSelectedEntries] = useState("10");
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [expandedMessages, setExpandedMessages] = useState<
    Record<string, boolean>
  >({});

  // selection & confirm dialog
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [confirmIds, setConfirmIds] = useState<string[]>([]);

  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !email || !deviceImei;

  const entriesPerPage = parseInt(selectedEntries, 10);

  const { data: smsData, refetch, isFetching } = useGetSmsQuery(
    { email, deviceImei, page: currentPage, limit: entriesPerPage },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // RTK Mutation for deletes
  const [deleteDataMutation] = useDeleteDataMutation();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || skip) return;
    if (!smsData) return;

    setLoading(true);
    try {
      const raw = smsData?.data ?? [];
      const mapped: ExtendedSMS[] = raw.map((msg: any) => ({
        ...msg,
        starred: false,
      }));
      setMessages(mapped);
      setPaginationInfo(smsData?.pagination ?? null);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, skip, smsData]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = paginationInfo?.totalPages ?? 1;
  const startIndex = messages.length ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const endIndex = (currentPage - 1) * entriesPerPage + messages.length;
  const currentMessages = messages;  

  const allCurrentPageSelected = useMemo(() => {
    if (currentMessages.length === 0) return false;
    return currentMessages.every((m) => selectedIds.has(String(m.id)));
  }, [currentMessages, selectedIds]);

  const toggleSelect = (id: number) => {
    const sid = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(sid) ? next.delete(sid) : next.add(sid);
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean | "indeterminate") => {
    const next = new Set(selectedIds);
    if (checked) {
      currentMessages.forEach((m) => next.add(String(m.id)));
    } else {
      currentMessages.forEach((m) => next.delete(String(m.id)));
    }
    setSelectedIds(next);
  };

  // Deletes via RTKQ mutation
  const handleDelete = async (id: number) => {
    if (!user) return;
    try {
      setDeleting(true);
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "sms",
        ids: [id],
      }).unwrap();

      setMessages((prev) => prev.filter((m) => m.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(id));
        return next;
      });

      // optional: re-sync from server cache
      await refetch();

      customToast.success("Message deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      customToast.error("Failed to delete this message.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    try {
      setDeleting(true);
      const ids = Array.from(selectedIds).map(Number);

      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "sms",
        ids,
      }).unwrap();

      setMessages((prev) => prev.filter((m) => !selectedIds.has(String(m.id))));
      setSelectedIds(new Set());

      await refetch();

      customToast.success(`${ids.length} message(s) deleted successfully!`);
    } catch (err) {
      console.error("Delete selected failed", err);
      customToast.error("Failed to delete selected messages.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    try {
      setDeleting(true);
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "sms",
        clearAll: true,
      }).unwrap();

      setMessages([]);
      setSelectedIds(new Set());
      setCurrentPage(1);

      await refetch();

      customToast.success("All messages deleted successfully!");
    } catch (err) {
      console.error("Delete all failed", err);
      customToast.error("Failed to delete all messages. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // confirm dialog helpers
  const openConfirm = (mode: DeleteMode, ids: string[] = []) => {
    setConfirmMode(mode);
    setConfirmIds(ids);
    setConfirmOpen(true);
  };

  const onConfirmDelete = async () => {
    if (confirmMode === "single" && confirmIds[0]) {
      await handleDelete(Number(confirmIds[0]));
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

  const getCallTypeColor = (direction: string) => {
    switch (direction) {
      case "incoming":
        return "text-green-600";
      case "outgoing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const toggleMessageExpansion = (id: number) => {
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMobileView = () => (
    <div className="space-y-4">
      {loading || isFetching ? (
        <div>
          <InteractiveLoader />
        </div>
      ) : (
        <>
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className="relative bg-white p-4 rounded-lg shadow-sm border"
            >
              <Button
                className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-xs"
                size="sm"
                onClick={() => openConfirm("single", [String(msg.id)])}
                disabled={deleting}
              >
                Delete
              </Button>

              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(String(msg.id))}
                    onCheckedChange={() => toggleSelect(msg.id)}
                    className="mt-1"
                    disabled={deleting}
                  />

                  <div className="grid-cols-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{msg.name}</h3>
                      <span
                        className={`text-xs font-medium ${getCallTypeColor(
                          msg.direction
                        )}`}
                      >
                        {msg.direction}
                      </span>
                    </div>
                  
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  <span>{formatTimestamp(msg.timestamp)}</span>
                </div>
              </div>

              <div className="mt-3 p-2 bg-gray-50 rounded-md">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        expandedMessages[msg.id] ? "" : "line-clamp-2"
                      }`}
                    >
                      {msg.text}
                    </p>
                    {msg.text?.length > 100 && (
                      <button
                        onClick={() => toggleMessageExpansion(msg.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                      >
                        {expandedMessages[msg.id] ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
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
        <h2 className="text-2xl sm:text-3xl font-semibold">Messages</h2>
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
            disabled={messages.length === 0 || deleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Delete All</span>
          </Button>

          <Select
            value={selectedEntries}
            onValueChange={(v) => {
              setSelectedEntries(v);
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
                      deleting || loading || currentMessages.length === 0
                    }
                  />
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading || isFetching ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div>
                      <InteractiveLoader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {currentMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(String(msg.id))}
                          onCheckedChange={() => toggleSelect(msg.id)}
                          disabled={deleting}
                        />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium ${getCallTypeColor(
                            msg.direction
                          )}`}
                        >
                          {msg.direction}
                        </span>
                      </TableCell>
                      <TableCell>{msg.name}</TableCell>
                      <TableCell>{msg.number}</TableCell>
                      <TableCell className="text-gray-600">
                        {formatTimestamp(msg.timestamp)}
                      </TableCell>
                      <TableCell className="w-[600px] whitespace-normal break-words line-clamp-5 text-gray-500">
                        {msg.text}
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
                              // Important: use onSelect + defer to avoid Radix menu/dialog clash
                              onSelect={() =>
                                setTimeout(
                                  () => openConfirm("single", [String(msg.id)]),
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
        <div className="text-xs sm:text-sm text-muted-foreground">
        Showing {startIndex} to {endIndex} of {paginationInfo?.total ?? 0} entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1 || loading}
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
            disabled={currentPage === totalPages || loading}
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
            <AlertDialogTitle className="text-2xl font-semibold tracking-tight text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
              {confirmMode === "all"
                ? "Delete all messages?"
                : confirmMode === "multi"
                ? "Delete selected messages?"
                : "Delete this message?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {confirmMode === "all" && (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">
                    all messages
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
                  messages. This action cannot be undone.
                </span>
              )}
              {confirmMode === "single" && (
                <span>
                  This will permanently delete the selected message. This action
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
