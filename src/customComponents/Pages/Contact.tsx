import { useEffect, useState, useMemo } from "react";
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
// at top of Contacts.tsx
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
import { useDeleteDataMutation, useGetContactsQuery } from "@/api/features";

interface ContactNumber {
  id: string; // backend returns numeric IDs but we typed as string; we'll cast when sending
  starred: boolean;
  name: string;
  number: string;
  timestamp: string;
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function Contacts() {
  const [numbers, setNumbers] = useState<ContactNumber[]>([]);
  const [selectedEntries, setSelectedEntries] = useState("10");

  const limit = parseInt(selectedEntries, 10);

  const [page, setPage] = useState(1);
  const [_hasNext, setHasNext] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);

  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<boolean>(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState<DeleteMode>("single");
  const [confirmIds, setConfirmIds] = useState<string[]>([]);

  const { user, isAuthenticated, hasLicense, loading: authLoading } = useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  const [deleteDataMutation] = useDeleteDataMutation();

  // use RTKQ data + refetch; remove FetchContacts import
  const {
    data: contactData,
    refetch,
    isFetching: contactsFetching,
  } = useGetContactsQuery(
    { email, deviceImei, page, limit },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // helper to map RTKQ contacts into your local shape
  const toFormatted = (payload: any): ContactNumber[] =>
    (payload?.contacts ?? []).map((contact: any) => ({
      id: String(contact.id),
      starred: false,
      name: contact.name,
      number: contact.number,
      timestamp: contact.timestamp,
    }));

  // keep your original function name/signature but use RTKQ
  const loadData = async (force = false) => {
    if (!user) return;
    try {
      setLoading(true);

      // Prefer cached data; hit server only when needed/forced
      let src = contactData;
      if (force || !src) {
        const refreshed = await refetch(); // refetch from server
        if ("data" in refreshed && refreshed.data) {
          src = refreshed.data;
        }
      }

      const formattedData = toFormatted(src ?? []);
      setNumbers(formattedData);
      setSelectedIds(new Set()); // clear selection after reload
      setPage(1);
    } catch (error) {
      console.error("Failed in fetching Contact numbers", error);
    } finally {
      setLoading(false);
    }
  };

  // initial load — same places you called it before
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user || skip) return;
    // This will use cached RTKQ data if already fetched
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.email, user?.deviceImei, skip]);

  // optional: when RTKQ cache updates in the background, mirror it to UI
  useEffect(() => {
    if (!contactData) return;
    setNumbers(toFormatted(contactData));
    setPaginationInfo(contactData.pagination);
  }, [contactData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // const total = paginationInfo?.total ?? 0;
  const totalPages = paginationInfo?.totalPages ?? 1;

  const currentNumbers = numbers;

  //  derived state for header checkbox
  const allCurrentPageSelected = useMemo(() => {
    if (currentNumbers.length === 0) return false;
    return currentNumbers.every((n) => selectedIds.has(n.id));
  }, [currentNumbers, selectedIds]);

  // toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // header select-all (current page only, typical UX)
  const toggleSelectAllOnPage = (checked: boolean | "indeterminate") => {
    const next = new Set(selectedIds);
    if (checked) {
      currentNumbers.forEach((n) => next.add(n.id));
    } else {
      currentNumbers.forEach((n) => next.delete(n.id));
    }
    setSelectedIds(next);
  };

  // Delete single
  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "contacts",
        ids: [Number(id)],
      }).unwrap();

      // optimistic local update (keeps your current UX)
      setNumbers((prev) => prev.filter((n) => n.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      // optional: ensure fresh server state (the invalidation will also refetch)
      // await refetch();

      customToast.success("Contact deleted successfully!");
    } catch (err) {
      console.error("Delete failed", err);
      customToast.error("Failed to delete this contact.");
    }
  };

  // Delete selected (multi)
  const handleDeleteSelected = async () => {
    if (!user || selectedIds.size === 0) return;
    setDeleting(true);

    try {
      const ids = Array.from(selectedIds).map(Number);

      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "contacts",
        ids,
      }).unwrap();

      // optimistic local update
      setNumbers((prev) => prev.filter((n) => !selectedIds.has(n.id)));
      setSelectedIds(new Set());

      // optional: await refetch();

      customToast.success(`${ids.length} contacts deleted successfully!`);
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
        entity: "contacts",
        clearAll: true,
      }).unwrap();

      // optimistic local update
      setNumbers([]);
      setSelectedIds(new Set());
      setPage(1);

      // optional: await refetch();

      customToast.success("All contacts deleted successfully!");
    } catch (err) {
      console.error("Delete all failed", err);
      customToast.error("Failed to delete all contacts. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  type DeleteMode = "single" | "multi" | "all";

  // Open the dialog with context
  const openConfirm = (mode: DeleteMode, ids: string[] = []) => {
    setConfirmMode(mode);
    setConfirmIds(ids);
    setConfirmOpen(true);
  };

  // Called when user confirms in the dialog
  const onConfirmDelete = async () => {
    setConfirmOpen(false);
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
    setLoading(true);
    try {
      await loadData(true);
    } finally {
      setLoading(false);
    }
  };
  

  const handlePreviousPage = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleEntriesChange = (value: string) => {
    setSelectedEntries(value);
    setPage(1);
    setNumbers([]); // reset loaded items
    setHasNext(true);
  };

  const renderMobileView = () => (
    <div className="space-y-4">
      {loading || contactsFetching ? (
        <div>
          <InteractiveLoader />
        </div>
      ) : currentNumbers.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No Contacts.
        </div>
      ) : (
        <>
          {currentNumbers.map((number) => (
            <div
              key={number.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-3">
                  {/* mobile checkbox */}
                  <Checkbox
                    checked={selectedIds.has(number.id)}
                    onCheckedChange={() => toggleSelect(number.id)}
                    className="mt-1"
                    disabled={deleting}
                  />
                  <div>
                    <h3 className="font-medium">{number.name}</h3>
                    <p className="text-sm text-gray-500">{number.number}</p>
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
                        onSelect={() =>
                          setTimeout(
                            () => openConfirm("single", [number.id]),
                            0
                          )
                        }
                        disabled={deleting}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
        <h2 className="text-2xl sm:text-3xl font-semibold">Contacts</h2>
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

          {/*  Delete Selected button */}
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
            disabled={numbers.length === 0 || deleting}
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
        <div className="border rounded-lg bg-white overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-200">
              <TableRow>
                <TableHead className="w-[100px]">
                  {/* NEW: header checkbox for current page */}
                  <Checkbox
                    checked={allCurrentPageSelected}
                    onCheckedChange={(c) => toggleSelectAllOnPage(Boolean(c))}
                    disabled={
                      deleting ||
                      loading ||
                      contactsFetching ||
                      currentNumbers.length === 0
                    }
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading || contactsFetching ? (
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
                      No Contacts.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {currentNumbers.map((number) => (
                    <TableRow key={number.id} className="hover:bg-gray-100">
                      <TableCell>
                        {/* NEW: row checkbox */}
                        <Checkbox
                          checked={selectedIds.has(number.id)}
                          onCheckedChange={() => toggleSelect(number.id)}
                          disabled={deleting}
                        />
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {number.name}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {number.number}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatTimestamp(number.timestamp)}
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
                                  () => openConfirm("single", [number.id]),
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
          Showing {numbers.length ? (page - 1) * limit + 1 : 0} to{" "}
          {(page - 1) * limit + numbers.length} of {paginationInfo?.total ?? 0}{" "}
          entries
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={page === 1 || loading || contactsFetching}
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
            onClick={handleNextPage}
            disabled={page === totalPages || loading || contactsFetching}
            className="text-xs sm:text-sm"
          >
            Next
          </Button>
        </div>
      </div>
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open); // ← reflect what Radix wants
          if (!open) setDeleting(false); // optional: reset state when closing
        }}
      >
        <AlertDialogContent
          className="sm:max-w-[480px] rounded-2xl
      border border-gray-200 dark:border-neutral-800
      bg-white/90 dark:bg-neutral-900/80
      backdrop-blur-md shadow-2xl"
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
              onClick={onConfirmDelete}
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
