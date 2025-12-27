import { useState, useEffect } from "react";
import {
  MoreVertical,
  RefreshCcw,
  Trash2,
  Phone,
  Download,
  Play,
  Timer,
  Database,
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import InteractiveLoader from "@/components/ui/InteractiveLoader";
import {
  useDeleteDataMutation,
  useGetVoipRecordingsJoinedQuery,
  JoinedVoipRecording,
} from "@/api/features";
import AudioPlayer, { AudioTrack } from "../../Audio/AudioPlayer";

// === API base URL + URL builder ===
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  ""
);

/** Build an absolute, playable URL for the <audio> element.
 * Falls back to viewUrl when audioUrl is empty. */
function buildPlayableUrl(rec: JoinedVoipRecording) {
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

// Use the enriched API type for joined WhatsApp/VoIP recordings
type WhatsappRecording = JoinedVoipRecording;

export default function WhatsAppCallRecording() {
  const [records, setRecords] = useState<WhatsappRecording[]>([]);
  const [selectedEntries, setSelectedEntries] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState<boolean>(true);

  // below your other useState hooks
  const [audioOpen, setAudioOpen] = useState(false);
  const [activeAudio, setActiveAudio] = useState<AudioTrack | null>(null);

  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  // delete confirmations
  const [confirmDeleteSingleOpen, setConfirmDeleteSingleOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState<number | null>(null);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState<null | "single" | "all">(null);

  const { user, isAuthenticated, loading: authLoading, hasLicense } = useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  const openAudio = (rec: JoinedVoipRecording) => {
    const playableUrl = buildPlayableUrl(rec);
    if (!playableUrl) {
      alert("No audio URL available for this recording.");
      return;
    }

    setActiveAudio({
      id: rec.id,
      title: rec.name || rec.number || "Recording",
      attachment: playableUrl, // AudioPlayer reads this
      timestamp: rec.timestamp,
      number: rec.number || "",
      duration: rec.duration,
      size: rec.size,
    });
    setAudioOpen(true);
  };

  const entriesPerPage = Number(selectedEntries) || 10;

  //  RTKQ locations
  const { data: whatsappRecordingData, refetch, isFetching } = useGetVoipRecordingsJoinedQuery(
    { email, deviceImei, page: currentPage, limit: entriesPerPage },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const [deleteDataMutation] = useDeleteDataMutation();

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || skip) return;
    if (!whatsappRecordingData) return;

    setLoading(true);
    try {
      const recs = whatsappRecordingData.data ?? [];
      setRecords(recs); // ✅ already current page rows (no slicing)
      setPaginationInfo(whatsappRecordingData.pagination ?? null);
    } finally {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, skip, whatsappRecordingData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalPages = paginationInfo?.totalPages ?? 1;
  const startIndex = paginationInfo?.total
    ? (currentPage - 1) * entriesPerPage + 1
    : 0;
  const endIndex = paginationInfo?.total
    ? (currentPage - 1) * entriesPerPage + records.length
    : 0;

  const currentNumbers = records;

  // --- delete logic (uses API) ---
  const openConfirmSingle = (id: number) => {
    setToDeleteId(id);
    setConfirmDeleteSingleOpen(true);
  };
  const confirmAndDeleteSingle = () => {
    setConfirmDeleteSingleOpen(false); // close first to avoid focus trap freeze
    requestAnimationFrame(() => void handleDeleteSingle());
  };
  const confirmAndDeleteAll = () => {
    setConfirmDeleteAllOpen(false);
    requestAnimationFrame(() => void handleDeleteAll());
  };

  const handleDeleteSingle = async () => {
    if (!user || toDeleteId == null) return;
    setDeleting("single");
    try {
      // optimistic UI + safe pagination adjust
      setRecords((prev) => {
        const next = prev.filter((r) => r.id !== toDeleteId);
        const nextPages = Math.max(1, Math.ceil(next.length / entriesPerPage));
        setCurrentPage((p) => Math.min(p, nextPages));
        return next;
      });

      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "voip_recordings",
        ids: [toDeleteId], // <-- must be an array
      }).unwrap();

      // optional: ensure server truth
      await refetch();
    } catch (e) {
      console.error("Delete recording failed:", e);
      alert("Delete failed. Please refresh and try again.");
    } finally {
      setDeleting(null);
      setToDeleteId(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    setDeleting("all");
    try {
      // optimistic UI
      setRecords([]);
      setCurrentPage(1);

      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "voip_recordings",
        clearAll: true,
      }).unwrap();

      await refetch();
    } catch (e) {
      console.error("Delete-all failed:", e);
      alert("Delete-all failed. Please refresh and try again.");
    } finally {
      setDeleting(null);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refetch();
    } finally {
      setLoading(false);
    }
  };
  

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleEntriesChange = (value: string) => {
    setSelectedEntries(value);
    setCurrentPage(1);
  };
  

  const getCallTypeColor = (direction?: string) => {
    switch (direction) {
      case "incoming":
        return "text-green-600";
      case "outgoing":
        return "text-blue-600";
      case "missed":
        return "text-red-600";
      default:
        return "text-gray-600";
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
      {loading || isFetching ? (
        <div>
          <InteractiveLoader />
        </div>
      ) : (
        <>
          {currentNumbers.map((rec) => (
            <div
              key={rec.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{rec.name}</h3>
                    <span
                      className={`text-xs font-medium ml-4 ${getCallTypeColor(
                        rec.direction
                      )}`}
                    >
                      {rec.direction}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-1 ml-2">
                    <span className="text-xs font-medium text-gray-500">
                      {rec.feature}
                    </span>
                  </div>
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
                        // Defer so menu closes before opening confirm (prevents Radix clash)
                        onSelect={() =>
                          setTimeout(() => openConfirmSingle(rec.id), 0)
                        }
                        disabled={deleting === "single" || deleting === "all"}
                      >
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.preventDefault();
                          const url = buildPlayableUrl(rec);
                          if (url) window.open(url, "_blank");
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
                <div className="flex items-center gap-1 ml-2">
                  <Timer className="h-3 w-3" />
                  <span>{rec.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  <span>Size: {rec.size}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 w-20 h-10 px-4 rounded-lg bg-blue-400 hover:bg-blue-500"
                      onClick={() => openAudio(rec)}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  <span>{formatTimestamp(rec.timestamp)}</span>
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
        <h2 className="text-2xl sm:text-3xl font-semibold">
          WhatsApp Call Recording
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center gap-2 text-xs sm:text-sm"
            disabled={loading || deleting === "single" || deleting === "all"}
          >
            <RefreshCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setConfirmDeleteAllOpen(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            disabled={records.length === 0 || deleting === "all" || loading}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Delete All</span>
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
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox />
                </TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Audio</TableHead>
                <TableHead>Timestamp</TableHead>

                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || isFetching ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    <div>
                      <InteractiveLoader />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {currentNumbers.map((rec) => (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <span
                          className={`text-xs font-medium ${getCallTypeColor(
                            rec.direction
                          )}`}
                        >
                          {rec.direction}
                        </span>
                      </TableCell>
                      <TableCell>{rec.name}</TableCell>
                      <TableCell>{rec.feature}</TableCell>
                      <TableCell>{rec.duration}</TableCell>
                      <TableCell>{rec.size}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="lg"
                            className="p-1 hover:bg-blue-300 rounded-sm"
                            onClick={() => openAudio(rec)}
                          >
                            <Play className="h-8 w-8" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{formatTimestamp(rec.timestamp)}</TableCell>

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
                                setTimeout(() => openConfirmSingle(rec.id), 0)
                              }
                              disabled={
                                deleting === "single" || deleting === "all"
                              }
                            >
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={(e) => {
                                e.preventDefault();
                                const url = buildPlayableUrl(rec);
                                if (url) window.open(url, "_blank");
                              }}
                            >
                              <Download className="h-4 w-4" />
                              <span>Download</span>
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
          Showing {startIndex} to {endIndex} of {paginationInfo?.total ?? 0}{" "}
          entries
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
          <div className="text-xs sm:text-sm text-muted-foreground px-2">
            Page {currentPage} / {totalPages}
          </div>

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

      {/* Confirm delete single */}
      <AlertDialog
        open={confirmDeleteSingleOpen}
        onOpenChange={setConfirmDeleteSingleOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recording?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected WhatsApp call recording.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting === "single"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmAndDeleteSingle}
              disabled={deleting === "single"}
            >
              {deleting === "single" ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete all */}
      <AlertDialog
        open={confirmDeleteAllOpen}
        onOpenChange={setConfirmDeleteAllOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete all WhatsApp call recordings?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <b>all</b> call recordings for this
              device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting === "all"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmAndDeleteAll}
              disabled={deleting === "all"}
            >
              {deleting === "all" ? "Deleting…" : "Delete all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audio modal */}
      <AudioPlayer
        key={activeAudio?.attachment || "empty"}
        isOpen={audioOpen}
        onClose={() => setAudioOpen(false)}
        audio={activeAudio}
      />
    </Card>
  );
}
