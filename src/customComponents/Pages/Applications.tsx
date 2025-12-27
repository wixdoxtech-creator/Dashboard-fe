import { useState, useEffect } from "react";
import { RefreshCcw, Clock, Package } from "lucide-react";
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
import InteractiveLoader from "@/components/ui/InteractiveLoader";
import { useGetApplicationsQuery } from "@/api/features";


export interface Application {
  id: number;
  label: string;
  version: string;
  action: string;
  timestamp: string;
  starred?: boolean; // Add optional starred property
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedEntries, setSelectedEntries] = useState("10");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState<Boolean>(true);

  const { user, isAuthenticated, loading: authLoading, hasLicense } = useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !hasLicense || !email || !deviceImei;

  //  RTKQ Application Data
  const { data: applicationData, refetch  } = useGetApplicationsQuery(
      { email, deviceImei },
      {
        skip,
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
      }
    );



    useEffect(() => {
      // wait until auth is resolved
      if (authLoading) return;
    
      // don't do anything if not logged in / args not ready
      if (!isAuthenticated || !user || skip) return;
    
      // wait for RTKQ to have data in cache
      if (!applicationData) return;
    
      let alive = true;
      (async () => {
        try {
          setLoading(true);
    
          // take apps from RTKQ result
          const apps = (applicationData ?? []).map((app) => ({
            ...app,
          }));
    
          if (!alive) return;
          setApplications(apps);
        } catch (error) {
          console.log("Failed in fetching Applications (RTKQ mirror)", error);
        } finally {
          if (alive) setLoading(false);
        }
      })();
    
      return () => {
        alive = false;
      };
    }, [authLoading, isAuthenticated, user, skip, applicationData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const entriesPerPage = parseInt(selectedEntries);
  const totalPages = Math.ceil(applications.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentApplications = applications.slice(startIndex, endIndex);


  const handleRefresh = async () => {
    if (!user) return;
    refetch();
  };



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

  // Mobile view of applications as cards
  const renderMobileView = () => (
    <div className="space-y-4">
      {loading ? (
        <div>
          <InteractiveLoader />
        </div>
      ) : currentApplications.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No Application.
        </div>
      ) : (
        <>
          {currentApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">{app.label}</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    Version: {app.version}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimestamp(app.timestamp)}</span>
                </div>
                <div className="flex justify-end mt-2">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {app.action}
                  </span>
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
        <h2 className="text-2xl sm:text-3xl font-semibold">Applications</h2>
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
                  <Checkbox />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Timestamp</TableHead>
                {/* <TableHead className="w-[100px]">Actions</TableHead> */}
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
              ) : currentApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No Application.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {currentApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm"></Button>
                      </TableCell>
                      <TableCell>{app.label}</TableCell>
                      <TableCell>{app.version}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {app.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {formatTimestamp(app.timestamp)}
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
          Showing {startIndex + 1} to {Math.min(endIndex, applications.length)}{" "}
          of {applications.length} entries
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
    </Card>
  );
}
