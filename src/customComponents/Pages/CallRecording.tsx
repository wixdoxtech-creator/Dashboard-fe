import { useState, useEffect, useMemo } from "react";
import {
  MoreVertical,
  RefreshCcw,
  Trash2,
  Download,
  Play,
  Database,
  Timer,
  Phone,
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
import {
  JoinedRecording,
  useGetCallRecordingsJoinedQuery,
  useDeleteDataMutation,
} from "@/api/features";
import { customToast } from "@/lib/toastConfig";

import AudioPlayer, { AudioTrack } from "../Audio/AudioPlayer";
import InteractiveLoader from "@/components/ui/InteractiveLoader";

// === NEW: base + URL builder ===
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  ""
);

/** Build an absolute, playable URL for the <audio> element.
 * Falls back to viewUrl when audioUrl is empty. */
function buildPlayableUrl(rec: JoinedRecording) {
  const raw = (
    rec.audioUrl ||
    (rec as unknown as { viewUrl?: string })?.viewUrl ||
    ""
  ).trim();
  if (!raw) return "";
  try {
    return new URL(raw).href; // already absolute
  } catch {
    return `${API_BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
  }
}

type DeleteMode = "single" | "multi" | "all";

export default function CallRecording() {
  const [records, setRecords] = useState<JoinedRecording[]>([]);
  const [selectedEntries, setSelectedEntries] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [audioOpen, setAudioOpen] = useState(false);
  const [activeAudio, setActiveAudio] = useState<AudioTrack | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [confirmIds, setConfirmIds] = useState<number[]>([]);

  const { user, isAuthenticated, loading: authLoading, hasLicense } = useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  const [deleteDataMutation] = useDeleteDataMutation();

  const entriesPerPage = Number(selectedEntries) || 10;

  const {
    data: callRecordingData,
    refetch,
    isFetching,
  } = useGetCallRecordingsJoinedQuery(
    { email, deviceImei, page: currentPage, limit: entriesPerPage },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const paginationInfo = callRecordingData?.pagination ?? null;
  const totalPages = paginationInfo?.totalPages ?? 1;

  // Load data
  //  whenever RTKQ returns data, mirror it to your local state
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || skip) return;
    if (!callRecordingData) return;

    setLoading(true);
    try {
      setRecords(callRecordingData.data ?? []);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, skip, callRecordingData]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentNumbers = records;
  const startIndex = records.length
    ? (currentPage - 1) * entriesPerPage + 1
    : 0;
  const endIndex = (currentPage - 1) * entriesPerPage + records.length;

  // Select helpers
  const allCurrentPageSelected = useMemo(() => {
    if (currentNumbers.length === 0) return false;
    return currentNumbers.every((r) => selectedIds.has(r.id));
  }, [currentNumbers, selectedIds]);

  const toggleSelect = (id: number) => {
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

  // API delete handlers
  const handleDelete = async (id: number) => {
    if (!user) return;
    try {
      setDeleting(true);
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "call_recordings",
        ids: [id],
      }).unwrap();

      setRecords((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      customToast.success("Recording deleted.");
    } catch (err) {
      console.error("Delete failed", err);
      customToast.error("Failed to delete this recording.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    try {
      setDeleting(true);
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "call_recordings",
        ids: ids.map(Number),
      }).unwrap();
      setRecords((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      customToast.success(`${ids.length} recording(s) deleted.`);
    } catch (err) {
      console.error("Delete selected failed", err);
      customToast.error("Failed to delete selected recordings.");
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
        entity: "call_recordings",
        clearAll: true,
      }).unwrap();
      setRecords([]);
      setSelectedIds(new Set());
      setCurrentPage(1);

      await refetch();
      customToast.success("All recordings deleted.");
    } catch (err) {
      console.error("Delete all failed", err);
      customToast.error("Failed to delete all recordings.");
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
    setCurrentPage(1);
    setLoading(true);
    try {
      await refetch(); // ask RTKQ to refresh
      // the effect above will setRecords when data arrives
    } finally {
      setLoading(false);
    }
  };
  const handlePreviousPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  const handleEntriesChange = (value: string) => {
    setSelectedEntries(value);
    setCurrentPage(1);
    setSelectedIds(new Set());
  };
  

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const openAudio = (rec: JoinedRecording) => {
    const playableUrl = buildPlayableUrl(rec);

    if (!playableUrl) {
      customToast.error("No audio URL available for this recording.");
      return;
    }

    setActiveAudio({
      id: rec.id,
      title: rec.name || rec.number || "Recording",
      attachment: playableUrl, // IMPORTANT: used by AudioPlayer
      timestamp: rec.timestamp,
      number: rec.number,
      duration: rec.duration,
      size: rec.size,
    });
    setAudioOpen(true);
  };

  // ----- mobile card -----
  const renderMobileView = () => (
    <div className="space-y-4">
      {loading || isFetching ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : currentNumbers.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No recordings.
        </div>
      ) : (
        currentNumbers.map((rec) => {
          const playUrl = buildPlayableUrl(rec);
          const canPlay = !!playUrl;
          return (
            <div
              key={rec.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedIds.has(rec.id)}
                      onCheckedChange={() => toggleSelect(rec.id)}
                      disabled={deleting || loading}
                      className="mt-1"
                    />
                    <h3 className="font-medium">{rec.name || "Unknown"}</h3>
                  </div>
                  <h3 className="text-sm text-gray-500 ml-6">{rec.number}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          setTimeout(() => openConfirm("single", [rec.id]), 0)
                        }
                        disabled={deleting}
                      >
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          if (playUrl) window.open(playUrl, "_blank");
                        }}
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Timer className="h-3 w-3 ml-2" />
                  <span>{rec.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>Size: {rec.size}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      openAudio(rec);
                    }}
                    className="h-10 text-lg px-4 rounded-lg bg-blue-400 hover:bg-blue-500 text-white shadow-md active:scale-95"
                    disabled={deleting || loading || !canPlay}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{formatTimestamp(rec.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <>
      <Card className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 mb-10 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-semibold">Call Recording</h2>
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
              disabled={records.length === 0 || deleting}
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
                        deleting || loading || currentNumbers.length === 0
                      }
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Play</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
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
                ) : currentNumbers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-sm text-muted-foreground"
                    >
                      No recordings.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentNumbers.map((rec) => {
                    const playUrl = buildPlayableUrl(rec);
                    const canPlay = !!playUrl;

                    return (
                      <TableRow key={rec.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(rec.id)}
                            onCheckedChange={() => toggleSelect(rec.id)}
                            disabled={deleting || loading}
                          />
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {rec.name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {rec.number}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {rec.duration}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {rec.size}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 hover:bg-blue-300 rounded-sm text-gray-600"
                            onClick={() => openAudio(rec)}
                            title={canPlay ? "Play" : "Unavailable"}
                            disabled={deleting || loading || !canPlay}
                          >
                            <Play className="h-6 w-6" />
                          </Button>
                        </TableCell>
                        <TableCell className="text-gray-500">
                          {formatTimestamp(rec.timestamp)}
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
                                    () => openConfirm("single", [rec.id]),
                                    0
                                  )
                                }
                                disabled={deleting}
                              >
                                Delete
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="flex items-center gap-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (playUrl) window.open(playUrl, "_blank");
                                }}
                              >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-2">
          <div className="text-xs sm:text-sm text-muted-foreground">
          Showing {startIndex} to {endIndex} of {paginationInfo?.total ?? 0} entries
            {records.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPage}
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
              onClick={handleNextPage}
              disabled={!paginationInfo?.hasNext || loading || isFetching}
              className="text-xs sm:text-sm"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Audio modal */}
      <AudioPlayer
        key={activeAudio?.attachment || "empty"}
        isOpen={audioOpen}
        onClose={() => setAudioOpen(false)}
        audio={activeAudio}
      />

      {/* Confirm dialog */}
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
                ? "Delete all Call Recordings?"
                : confirmMode === "multi"
                ? "Delete selected Call Recordings?"
                : "Delete this Call Recording?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {confirmMode === "all" && (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">all</span> call
                  recordings for this device. This action cannot be undone.
                </span>
              )}
              {confirmMode === "multi" && (
                <span>
                  You are about to delete{" "}
                  <span className="font-semibold text-red-600">
                    {selectedIds.size}
                  </span>{" "}
                  recording(s). This action cannot be undone.
                </span>
              )}
              {confirmMode === "single" && (
                <span>
                  This will permanently delete the selected recording. This
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
    </>
  );
}
