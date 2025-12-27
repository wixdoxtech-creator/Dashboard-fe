import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Share2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/api/api";

type PlanId = 0 | 1 | 2 | 3;

interface MenuItem {
  icon: any;
  name: string;
  path: string;
  minPlan?: PlanId;
  isDropdown?: boolean;
  submenu?: MenuItem[];
}

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function Sidebar({ isSidebarOpen, toggleSidebar }: SidebarProps) {
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [userDetails, setUserDetails] = useState<any>(null);
  const navigate = useNavigate();

  //  use active device plan + loading flag
  const { user: authUser, activeDevicePlanId, licenseLoading, licenseExpired } = useAuth();
  const userEmail = authUser?.email ?? "";
  // const activeImei = authUser?.deviceImei ?? "";

  useEffect(() => {
    if (!userEmail) return;
    const fetchUserDetails = async () => {
      try {
        const { data } = await api.get(`/user/get-by-email/${encodeURIComponent(userEmail)}`);
        setUserDetails(data);
      } catch (err) {
        console.error("Failed to fetch user details:", err);
      }
    };
    fetchUserDetails();
  }, [userEmail]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleDropdown = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    setOpenDropdowns((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleNavigate = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
    if (isMobile) toggleSidebar();
    window.scrollTo(0, 0);
  };

  //  while licenses load, we avoid gating (show skeleton instead)
  const canShow = (min?: PlanId) => {
    const currentPlan: PlanId = (activeDevicePlanId ?? 0) as PlanId;
    const needed: PlanId = (min ?? 1) as PlanId;
    return currentPlan >= needed;
  };

  // --- Menus with plan gates ---
  const navigationSection: MenuItem[] = [
    { icon: () => <img src="/dashboard.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Dashboard", path: "/", minPlan: 0 },
    { icon: () => <img src="/device.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "My Devices", path: "/device", minPlan: 1 },
  ];

  const generalFeatures: MenuItem[] = [
    { icon: () => <img src="/android.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Applications", path: "/applications", minPlan: 1 },
    { icon: () => <img src="/phone-call.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Call History", path: "/call-history", minPlan: 1 },
    { icon: () => <img src="/voice.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Call Recording", path: "/call-recording", minPlan: 2 },
    { icon: () => <img src="/call.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Contact", path: "/contacts", minPlan: 2 },
    { icon: () => <img src="/internet-history.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4"/>, name: "Internet History", path: "/internet-history", minPlan: 3 },
    { icon: () => <img src="/ip1.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "IP Address", path: "/ip-address", minPlan: 3 },
    { icon: () => <img src="/keyboard2.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4"/>, name: "KeyLogger", path: "/keylogs", minPlan: 1 },
    { icon: () => <img src="/location.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Location History", path: "/location-history", minPlan: 1 },
    { icon: () => <img src="/sms1.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "SMS", path: "/sms", minPlan: 1 },
   
   
  ];

  const socialMediaSection: MenuItem[] = [
    {
      icon: () => <img src="/whatsapp.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />,
      name: "WhatsApp",
      path: "#",
      isDropdown: true,
      minPlan: 2,
      submenu: [
        { icon: () => <img src="/whatsapp.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "WhatsApp", path: "/whatsapp", minPlan: 1 },
        { icon: () => <img src="/whatsapp.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "WhatsApp Recordings", path: "/whatsapp-recording", minPlan: 3 },
        { icon: () => <img src="/whatsapp-business-bg.svg" className="lg:w-7 lg:h-7 w-5 h-6 mr-2 sm:mr-4 rounded-full" />, name: "WhatsApp Business", path: "/whatsapp-business", minPlan: 2 },
      ],
    },
    {
      icon: Share2,
      name: "Social Media",
      path: "#",
      isDropdown: true,
      minPlan: 2,
      submenu: [
        { icon: () => <img src="/instagram.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "Instagram", path: "/instagram", minPlan: 2 },
        { icon: () => <img src="/telegram.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "Telegram", path: "/telegram", minPlan: 2 },
        { icon: () => <img src="/linkedin.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "LinkedIn", path: "/linkedin", minPlan: 3 },
        { icon: () => <img src="/botim.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "BOTIM", path: "/botim", minPlan: 3 },
        { icon: () => <img src="/snapchat.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "Snapchat", path: "/snapchat", minPlan: 3 },
        { icon: () => <img src="/facebook.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "Facebook", path: "/facebook", minPlan: 3 },
        { icon: () => <img src="/youtube.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full" />, name: "You Tube", path: "/youtube", minPlan: 3 },
      ],
    },
    {
      icon: () => (<img src="/email.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4"/>),
      name: "Email",
      path: "#",
      isDropdown: true,
      minPlan: 2,
      submenu: [
          { icon: () => <img src="/gmail.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full"/>, name: "Gmail", path: "/gmail", minPlan: 3 },
          { icon: () => <img src="/outlook.png"  className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4 rounded-full"/>, name: "Outlook", path: "/outlook", minPlan: 2},
      ],
    },
  ];

  const photoAndMoreSection: MenuItem[] = [
    { icon: () => <img src="/picture.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Photos", path: "/photos", minPlan: 2 },
    { icon: () => <img src="/video.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Videos", path: "/videos", minPlan: 2 },
    { icon: () => <img src="/folder.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Documents", path: "/documents", minPlan: 3 },
    { icon: () => <img src="/streaming.png" className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-4" />, name: "Live & Instant", path: "/live-stream", minPlan: 3 },
  ];

  // While loading licenses, show a lightweight skeleton instead of gating to plan 0
  if (licenseLoading) {
    return (
      <>
        {isMobile && isSidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30" onClick={toggleSidebar} />
        )}
        <aside
          className={`fixed left-0 backdrop-blur-md bg-slate-300/60 z-40 h-screen w-62 transform overflow-y-auto border-r border-gray-300
          transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-100
          [&::-webkit-scrollbar-track]:transparent hover:[&::-webkit-scrollbar-thumb]:bg-blue-300`}
        >
          <div className="h-[60px] flex items-center px-4 sm:px-6">
            <img src="/ionlogo.png" alt="Logo" className="h-8 sm:h-10 w-auto" />
          </div>

          <div className="p-5 border-b border-t border-gray-400 text-black bg-slate-90">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-28 mb-1 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
          </div>

          <div className="px-3 py-3 space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </aside>
      </>
    );
  }

  // Filter helpers
  const filterItemsByPlan = (items: MenuItem[]): MenuItem[] =>
    items
      .map((item) => {
        if (item.isDropdown && item.submenu?.length) {
          const visibleSubs = item.submenu.filter((sub) => canShow(sub.minPlan));
          if (visibleSubs.length === 0) return null;
          return { ...item, submenu: visibleSubs };
        }
        return canShow(item.minPlan) ? item : null;
      })
      .filter(Boolean) as MenuItem[];

  const renderSection = (title: string, items: MenuItem[]) => {
    const visible = filterItemsByPlan(items);
    if (visible.length === 0) return null;

    return (
      <div className="mt-2 sm:mt-4 border-t border-white/10">
        <h3 className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-md font-semibold opacity-80 border-b border-gray-400">
          {title}
        </h3>
        <nav className="space-y-0.5 sm:space-y-1">
          {visible.map((item) => (
            <div key={item.name}>
              <a
                href="#"
                className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-md rounded-md hover:bg-blue-300/40 hover:text-black hover:scale-[1.03] transition-all duration-200"
                onClick={(e) =>
                  item.isDropdown ? toggleDropdown(e, item.name) : handleNavigate(e, item.path)
                }
              >
                <item.icon className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
                {item.name}
                {item.isDropdown && (
                  <ChevronDown
                    className={`ml-auto transition-transform ${
                      openDropdowns.has(item.name) ? "rotate-180" : ""
                    }`}
                  />
                )}
              </a>

              {item.isDropdown && openDropdowns.has(item.name) && (
                <div className="ml-4 sm:ml-6 space-y-1">
                  {item.submenu!.map((sub) => (
                    <a
                      key={sub.name}
                      href="#"
                      onClick={(e) => handleNavigate(e, sub.path)}
                      className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-md rounded-md transition-all duration-200 hover:bg-blue-300/40 hover:text-black hover:scale-[1.03] hover:shadow-md"
                    >
                      <sub.icon className="mr-2 h-4 w-4" />
                      {sub.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    );
  };

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={toggleSidebar} />
      )}

      <aside
        className={`fixed left-0 backdrop-blur-md bg-slate-300/60 z-40 h-screen w-62 transform overflow-y-auto border-r border-gray-300
        transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-100
        [&::-webkit-scrollbar-track]:transparent hover:[&::-webkit-scrollbar-thumb]:bg-blue-300`}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center px-4 sm:px-6">
          <img src="/ionlogo.png" alt="Logo" className="h-8 sm:h-10 w-auto" />
        </div>

        {/* User Info */}
        <div className="p-5 border-b border-t border-gray-400 text-black bg-slate-90">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white">
              <img
                src="https://cdn.pixabay.com/photo/2019/08/11/18/59/icon-4399701_960_720.png"
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs opacity-80">Welcome,</p>
              {userDetails ? (
                <>
                  <p className="text-sm font-medium">{userDetails.name}</p>
                  <p className="text-sm font-medium">{userDetails.surname}</p>
                </>
              ) : (
                <p>Loading...</p>
              )}
            </div>
          </div>
          <p className="text-xs opacity-70">
            <span className=" font-bold">
              Last Active
              </span> : {new Date().toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
        })}
          </p>

          {/* Optional: show a tiny hint when this device has no plan */}
          {/* {activeDevicePlanId === 0 && (
            <div className="mt-2 text-xs text-red-600">
              No active plan for selected device {activeImei ? `(${activeImei})` : ""}.
            </div>
          )} */}
          {licenseExpired && activeDevicePlanId > 0 && (
            <div className="mt-2 text-xs text-amber-600">
              The selected device’s license is expired.
            </div>
          )}
        </div>

        {/* Nav Sections (filtered by active device plan) */}
        <div className="px-2 py-2">
          {renderSection("NAVIGATION", navigationSection)}
          {renderSection("GENERAL FEATURES", generalFeatures)}
          {renderSection("SOCIAL MEDIA", socialMediaSection)}
          {renderSection("PHOTOS & MORE", photoAndMoreSection)}
        </div>
      </aside>
    </>
  );
}
