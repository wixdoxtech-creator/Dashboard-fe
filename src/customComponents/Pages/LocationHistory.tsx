import { useState, useEffect, useMemo } from "react";
import { MoreVertical, RefreshCcw, Trash2, Clock, Map } from "lucide-react";
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
import { useGetLocationsQuery, useDeleteDataMutation } from "@/api/features";

type DeleteMode = "single" | "multi" | "all";

interface LocationData {
  id: string;
  starred: boolean;
  address: string;
  coordinates: string;
  mapView: string;
  locationTime: string;
  provider: string;
  latitude: number;
  longitude: number;
}

export default function LocationHistory() {
  const [location, setLocation] = useState<LocationData[]>([]);
  const [selectedEntries, setSelectedEntries] = useState("10");

  const limit = parseInt(selectedEntries, 10);

  const [page, setPage] = useState(1);
  const [_hasNext, setHasNext] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [isTabletView, setIsTabletView] = useState(
    window.innerWidth >= 768 && window.innerWidth < 1024
  );

  const { user, isAuthenticated, loading: authLoading, hasLicense } = useAuth();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [confirmIds, setConfirmIds] = useState<string[]>([]);

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  //  RTKQ locations
  const {
    data: locData,
    refetch,
    isFetching,
    isLoading,
  } = useGetLocationsQuery(
    { email, deviceImei, page, limit },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // RTKQ delete mutation
  const [deleteDataMutation] = useDeleteDataMutation();

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const total = paginationInfo?.total ?? 0;
  const totalPages = paginationInfo?.totalPages ?? 1;

  const startIndex = total ? (page - 1) * limit + 1 : 0;
  const endIndex = total ? Math.min(page * limit, total) : 0;

  const canPrev = page > 1;
  const canNext = Boolean(paginationInfo?.hasNext);

  useEffect(() => {
    setLoading(isLoading || isFetching);
  }, [isLoading, isFetching]);
  

  // Mirror RTKQ -> local state (keeps your UI unchanged)
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || skip) return;
    if (!locData) return;

    const formatted: LocationData[] = (locData.locationData ?? []).map(
      (loc) => {
        const lat =
          typeof loc.latitude === "string"
            ? parseFloat(loc.latitude)
            : (loc.latitude as number);
        const lng =
          typeof loc.longitude === "string"
            ? parseFloat(loc.longitude)
            : (loc.longitude as number);

        return {
          id: String(loc.id),
          starred: false,
          address: loc.address ?? "",
          coordinates: `${(lat ?? 0).toFixed(4)}°, ${(lng ?? 0).toFixed(4)}°`,
          mapView: "View Map",
          locationTime: formatTimestamp(loc.timestamp),
          provider: loc.provider || "Unknown",
          latitude: lat ?? 0,
          longitude: lng ?? 0,
        };
      }
    );

    // ✅ append on page > 1, replace on page == 1
    setLocation(formatted);

    setSelectedIds(new Set());
    setHasNext(Boolean(locData.pagination?.hasNext));
    setPaginationInfo(locData.pagination);
  }, [authLoading, isAuthenticated, skip, locData, page]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      setIsTabletView(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const currentLocation = location;

  // Select-all (current page)
  const allCurrentPageSelected = useMemo(() => {
    if (currentLocation.length === 0) return false;
    return currentLocation.every((r) => selectedIds.has(r.id));
  }, [currentLocation, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (checked: boolean | "indeterminate") => {
    const next = new Set(selectedIds);
    if (checked) currentLocation.forEach((r) => next.add(r.id));
    else currentLocation.forEach((r) => next.delete(r.id));
    setSelectedIds(next);
  };

  // 🗑️ Delete handlers via RTKQ
  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      setDeleting(true);
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "locations",
        ids: [Number(id)],
      }).unwrap();

      setLocation((prev) => prev.filter((r) => r.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      await refetch(); // optional re-sync
      customToast.success("Location deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      customToast.error("Failed to delete this location.");
    } finally {
      setDeleting(false);
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
        entity: "locations",
        ids,
      }).unwrap();

      setLocation((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());

      await refetch(); // optional re-sync
      customToast.success(`${ids.length} location(s) deleted successfully!`);
    } catch (err) {
      console.error("Delete selected failed", err);
      customToast.error("Failed to delete selected locations.");
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
        entity: "locations",
        clearAll: true,
      }).unwrap();

      setLocation([]);
      setSelectedIds(new Set());
      setPage(1);

      await refetch(); // optional re-sync
      customToast.success("All locations deleted successfully!");
    } catch (err) {
      console.error("Delete all failed", err);
      customToast.error("Failed to delete all locations.");
    } finally {
      setDeleting(false);
    }
  };

  // Manual refresh button callback
  const handleRefresh = async () => {
    setSelectedIds(new Set());
    setPage(1);
    setLocation([]);
    setHasNext(true);
    setLoading(true);
    try {
      await refetch();
    } finally {
      setLoading(false);
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

  const handleEntriesChange = (value: string) => {
    setSelectedEntries(value);
    setPage(1);
    setLocation([]); // reset loaded items
    setHasNext(true);
  };

  const openMap = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, "_blank");
  };

  const renderMobileView = () => (
    <div className="space-y-4">
      {loading ? (
        <div>
          <InteractiveLoader />
        </div>
      ) : currentLocation.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No Location History.
        </div>
      ) : (
        <>
          {currentLocation.map((map) => (
            <div
              key={map.id}
              className="bg-white p-4 rounded-lg shadow-sm border overflow-hidden"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <Checkbox
                    checked={selectedIds.has(map.id)}
                    onCheckedChange={() => toggleSelect(map.id)}
                    className="mt-1"
                    disabled={deleting}
                  />
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium break-words whitespace-normal">
                      {map.address}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 break-all">
                    {map.coordinates}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          setTimeout(
                            () => openConfirm("single", [String(map.id)]),
                            0
                          )
                        }
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{map.locationTime}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Map className="h-3 w-3" />
                  <span>{map.provider}</span>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-xs"
                  size="sm"
                  onClick={() => openMap(map.latitude, map.longitude)}
                >
                  {map.mapView}
                </Button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  const renderTabletView = () => (
    <div className="border rounded-lg bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox />
            </TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Coordinates</TableHead>
            <TableHead>Time</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentLocation.map((map) => (
            <TableRow key={map.id} className="hover:bg-gray-100">
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(map.id)}
                  onCheckedChange={() => toggleSelect(map.id)}
                  disabled={deleting}
                />
              </TableCell>

              <TableCell className="max-w-[200px] truncate">
                {map.address}
              </TableCell>
              <TableCell className="max-w-[150px] truncate">
                {map.coordinates}
              </TableCell>
              <TableCell>{map.locationTime}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                    size="sm"
                    onClick={() => openMap(map.latitude, map.longitude)}
                  >
                    {map.mapView}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() =>
                          setTimeout(
                            () => openConfirm("single", [String(map.id)]),
                            0
                          )
                        }
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card className="w-full max-w-[1200px] mx-auto p-4 sm:p-6 mb-10 bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl sm:text-3xl font-semibold">Location History</h2>
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

          {/*  Delete Selected */}
          <Button
            size="sm"
            onClick={() => openConfirm("multi")}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-xs sm:text-sm"
            disabled={selectedIds.size === 0 || deleting}
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Delete Selected</span>
          </Button>

          {/* Delete All */}
          <Button
            size="sm"
            onClick={() => openConfirm("all")}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
            disabled={location.length === 0 || deleting}
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
      ) : isTabletView ? (
        renderTabletView()
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
                      deleting || loading || currentLocation.length === 0
                    }
                  />
                </TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Longitude & Latitude</TableHead>
                <TableHead>Map View</TableHead>
                <TableHead>Location Time</TableHead>
                <TableHead>Provider</TableHead>
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
              ) : currentLocation.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No Location History.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {currentLocation.map((map) => (
                    <TableRow key={map.id} className="hover:bg-gray-100">
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(map.id)}
                          onCheckedChange={() => toggleSelect(map.id)}
                          disabled={deleting}
                        />
                      </TableCell>
                      <TableCell className="max-w-[250px] truncate whitespace-normal break-words line-clamp-5 text-gray-600 ">
                        {map.address}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-gray-800">
                        {map.coordinates}
                      </TableCell>
                      <TableCell>
                        <Button
                          className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
                          size="sm"
                          onClick={() => openMap(map.latitude, map.longitude)}
                        >
                          {map.mapView}
                        </Button>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {map.locationTime}
                      </TableCell>
                      <TableCell>{map.provider}</TableCell>
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
          {total > 0 ? (
            <>
              Showing {startIndex} to {endIndex} of {total} entries
            </>
          ) : (
            <>Showing 0 entries</>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={!canPrev || loading || deleting}
            className="text-xs sm:text-sm"
          >
            Previous
          </Button>

          <div className="text-xs sm:text-sm text-muted-foreground px-2">
            Page {page} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canNext || loading || deleting}
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
          <div className="mx-auto -mt-18 flex h-24 w-24 items-center justify-center">
            <img src="/warning.png" className="w-20 h-20" />
          </div>

          <AlertDialogHeader className="text-center space-y-1">
            <AlertDialogTitle className="text-2xl text-center font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-rose-500">
              {confirmMode === "all"
                ? "Delete all Location History?"
                : confirmMode === "multi"
                ? "Delete selected Location History?"
                : "Delete this Location History?"}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm text-center leading-6 text-gray-600 dark:text-gray-300">
              {confirmMode === "all" && (
                <span>
                  This will delete{" "}
                  <span className="font-semibold text-red-600">
                    all Location History
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
                  Location History. This action cannot be undone.
                </span>
              )}
              {confirmMode === "single" && (
                <span>
                  This will permanently delete the selected Location History.
                  This action cannot be undone.
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
