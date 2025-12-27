import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navbar } from "@/layout/NavBar";
import { Sidebar } from "@/layout/SideBar";

export const DashboardLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
            setIsSidebarOpen(window.innerWidth >= 768);
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen">
            <div className="fixed top-0 left-0 right-0 z-50">
                <Navbar
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                />
            </div>

            <Sidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
            />

            <main className={`pt-[73px] sm:pt-[80px] md:px-4 ${isSidebarOpen && !isMobile ? "ml-64" : "ml-0"}`}>
                <Outlet /> {/* This is where page components will render */}
            </main>
        </div>
    );
};
