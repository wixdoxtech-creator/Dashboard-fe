import {
  Menu, X, Settings, ChevronDown, Smartphone, LogOut,
  ShoppingCartIcon, RefreshCcw,
  User2Icon,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Device, useGetDashboardDataQuery } from "@/api/deviceApi";
import { useAuth } from "@/contexts/AuthContext";
import { customToast } from "../lib/toastConfig";

interface NavbarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Navbar({ isSidebarOpen, toggleSidebar }: NavbarProps) {
  const [isDeviceDropdownOpen, setIsDeviceDropdownOpen] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const deviceDropdownRef = useRef<HTMLDivElement>(null);
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  const { user, logout, hasLicense, setActiveDevice } = useAuth();
  const navigate = useNavigate();

  // Helpers
  const getDeviceImei = (d: any) =>
    String(d?.deviceImei ?? d?.imei ?? "").trim();

  // ---------- RTK Query (cache-first) ----------
  const email = (user?.email ?? "").trim().toLowerCase();
  const activeImei = String(user?.deviceImei ?? "").trim();

  // Do NOT gate device fetching on hasLicense; you need the list to switch devices
  const skip = !email; // only skip if no email

  const { data: dashData } = useGetDashboardDataQuery(
    { email, deviceImei: activeImei },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // Populate devices + restore selection + set active IMEI in context (triggers license fetch)
  useEffect(() => {
    if (!dashData) return;

    const list: Device[] = Array.isArray(dashData.devices) ? dashData.devices : [];
    setDevices(list);

    // Try stored selection by device.id
    const stored = localStorage.getItem("selectedDevice");
    if (stored) {
      const storedId = parseInt(stored, 10);
      const found = list.find((d) => d.id === storedId);
      if (found) {
        const imei = getDeviceImei(found);
        setSelectedDevice(storedId);
        if (imei) setActiveDevice({ imei }); // Context will fetch license for this IMEI
        return;
      } else {
        localStorage.removeItem("selectedDevice");
      }
    }

    // Otherwise choose first device that has an IMEI, else just first
    if (!selectedDevice && list.length > 0) {
      const firstWithImei = list.find((d) => getDeviceImei(d));
      const first = firstWithImei ?? list[0];
      const firstId = first.id;
      const imei = getDeviceImei(first);

      setSelectedDevice(firstId);
      localStorage.setItem("selectedDevice", String(firstId));
      if (imei) setActiveDevice({ imei });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashData]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deviceDropdownRef.current && !deviceDropdownRef.current.contains(event.target as Node)) {
        setIsDeviceDropdownOpen(false);
      }
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeviceSelect = (deviceId: number) => {
    setSelectedDevice(deviceId);
    setIsDeviceDropdownOpen(false);
    localStorage.setItem("selectedDevice", deviceId.toString());

    const chosen = devices.find((d) => d.id === deviceId);
    if (chosen) {
      const imei = getDeviceImei(chosen);
      if (!imei) {
        customToast.error("Selected device has no IMEI bound yet.");
      } else {
        // Update global active device IMEI. AuthContext will fetch license & set plan gating.
        setActiveDevice({ imei });
        customToast.info(`Switched to ${chosen.model || `Device ${chosen.id}`}`, { autoClose: 1200 });
      }
    }

    // Keep your custom event if other parts rely on it
    window.dispatchEvent(new CustomEvent("deviceSelected", { detail: deviceId }));
  };

  return (
    <nav
      className={`fixed top-2 left-2 right-2 z-50 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 backdrop-blur-md bg-slate-300/60 dark:bg-gray-900/70 shadow-lg transition-all duration-500 ease-in-out rounded-b-xl rounded-t-xl
         ${isSidebarOpen ? "left-64 right-0" : "left-0 right-0"}`}
    >
      {/* Left: Sidebar Toggle + Title */}
      <div className="flex items-center px-2 sm:px-4">
        <button onClick={toggleSidebar} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
          {isSidebarOpen ? <X size={isMobile ? 20 : 24} /> : <Menu size={isMobile ? 20 : 24} />}
        </button>
        <h1 className="text-lg sm:text-xl font-bold ml-2 sm:ml-4 hidden sm:block">Dashboard</h1>
      </div>

      {/* Right: Navigation Icons */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 px-2 sm:px-4 md:px-6">
        {hasLicense ? (
          <Link to="/pricing">
            <button
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1 cursor-pointer text-xs sm:text-sm"
              title="renew"
            >
              <RefreshCcw size={isMobile ? 12 : 15} />
              <span className="hidden sm:inline">Renew</span>
            </button>
          </Link>
        ) : (
          <Link to="/pricing">
            <button
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1 cursor-pointer text-xs sm:text-sm"
              title="Buy Now"
            >
              <ShoppingCartIcon size={isMobile ? 16 : 20} />
              <span className="hidden sm:inline">buy now</span>
            </button>
          </Link>
        )}

        {/* Device Dropdown */}
        <div className="relative" ref={deviceDropdownRef}>
          <button
            onClick={() => {
              setIsDeviceDropdownOpen(!isDeviceDropdownOpen);
              setIsSettingsDropdownOpen(false);
            }}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1 cursor-pointer text-xs sm:text-sm"
            title="Device Info"
          >
            <Smartphone size={isMobile ? 16 : 20} />
            <ChevronDown size={isMobile ? 12 : 16} />
          </button>

          {isDeviceDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-20">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceSelect(device.id)}
                  className={`w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${
                    selectedDevice === device.id ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {device.model || `Device ${device.id}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsDropdownRef}>
          <button
            onClick={() => {
              setIsSettingsDropdownOpen(!isSettingsDropdownOpen);
              setIsDeviceDropdownOpen(false);
            }}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex items-center gap-1 cursor-pointer text-xs sm:text-sm"
            title="Settings"
          >
            <Settings size={isMobile ? 16 : 20} />
            <ChevronDown size={isMobile ? 12 : 16} />
          </button>

          {isSettingsDropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-md shadow-lg py-1 z-20">
              {[
                { id: 1, name: "Profile", icon: User2Icon, componentId: "profile" },
                { id: 2, name: "Logout", icon: LogOut, componentId: "logout" },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={async () => {
                      setIsSettingsDropdownOpen(false);
                      if (option.componentId === "logout") {
                        await logout();
                        customToast.warning("Logout Successful!");
                        navigate("/user/login");
                      }
                      if (option.componentId === "profile") {
                        navigate("/profile");
                      }
                    }}
                    className="w-full text-left px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Icon size={isMobile ? 14 : 16} />
                    {option.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => navigate("/profile")} className="focus:outline-none" title="Profile">
            <img
              src="https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_960_720.png"
              alt="Profile"
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full cursor-pointer"
            />
          </button>
        </div>
      </div>
    </nav>
  );
}
