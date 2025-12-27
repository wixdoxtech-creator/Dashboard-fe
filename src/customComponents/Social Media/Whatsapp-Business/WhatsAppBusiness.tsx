import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import ChatList from "./ChatList";
import ChatConversation from "./ChatConversation";
import {
  MessageCircle,
  Users,
  ChevronLeft,
  MoreVertical,
  Trash2,
} from "lucide-react";
import ContactsList from "./ContactsList";
import ContactProfile from "./ContactProfile";
import { useAuth } from "@/contexts/AuthContext";
import { SocialData, useDeleteDataMutation, useGetSocialDataQuery } from "@/api/features";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChatListSkeleton from "../../../components/ui/ChatListSkeleton";

interface Contact {
  id: string;
  name: string;
  initials: string;
  number: string;
  avatarBg: string;
}


const getInitials = (name?: string) =>
  (name ?? "??").trim().slice(0, 2).toUpperCase();

const WhatsAppBusiness = () => {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState("chats");
  const [isMobileView, setIsMobileView] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [whatsappMessages, setWhatsappMessages] = useState<SocialData[]>([]);

  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [confirmDeleteSelectedOpen, setConfirmDeleteSelectedOpen] = useState(false);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [deleting, setDeleting] = useState<null | "selected" | "all">(null);
  

  const [deleteDataMutation] = useDeleteDataMutation();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !email || !deviceImei;

  const {
    data: whatsappBusinessData,
    isLoading: queryLoading,
    isFetching,
  } = useGetSocialDataQuery(
    { email, deviceImei, entity: "whatsapp_business" },
    {
      skip,
      refetchOnMountOrArgChange: true,  
      refetchOnFocus: true,
    }
  );

  const loading = authLoading || queryLoading || (isFetching && whatsappMessages.length === 0);


  // Derive a simple contacts list from messages (group by name)
  const contacts = useMemo<Contact[]>(() => {
    const map = new Map<string, Contact>();
    for (const msg of whatsappMessages) {
      const name = (msg.name ?? "").trim();
      if (!name) continue;
      if (!map.has(name)) {
        map.set(name, {
          id: (msg as any).userId ?? name,
          name,
          initials: getInitials(name),
          number: msg.number ?? "",
          avatarBg: "bg-green-400",
        });
      }
    }
    return Array.from(map.values());
  }, [whatsappMessages]);

  // IDs of all messages belonging to the selected user (must be numbers for API)
  const idsForSelected = useMemo<number[]>(() => {
    if (!selectedUser) return [];
    return whatsappMessages
      .filter((m) => (m.name ?? "").trim() === selectedUser)
      .map((m) => Number((m as any).id))
      .filter((n) => Number.isFinite(n));
  }, [selectedUser, whatsappMessages]);


useEffect(() => {
  if (skip) return;                         // don’t update while skipped
  const result = whatsappBusinessData?.data ?? [];
  setWhatsappMessages(result);
}, [skip, whatsappBusinessData]); 

  // Detect mobile
  useEffect(() => {
    const checkIfMobile = () => setIsMobileView(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Auto open detail on mobile when selection changes
  useEffect(() => {
    if (isMobileView && (selectedUser || selectedContact)) setShowDetail(true);
  }, [selectedUser, selectedContact, isMobileView]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "chats") setSelectedContact(null);
    else if (value === "contacts") setSelectedUser(null);
    if (isMobileView) setShowDetail(false);
  };

  const handleBackClick = () => {
    setShowDetail(false);
    if (activeTab === "chats") setSelectedUser(null);
    else if (activeTab === "contacts") setSelectedContact(null);
  };

  // Select handlers
  const handleSelectChat = (userName: string) => {
    setSelectedUser(userName);
    if (isMobileView) setShowDetail(true);
  };
  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (isMobileView) setShowDetail(true);
  };

  // --- Delete handlers ---
  const handleDeleteSelected = async () => {
    if (!user || !selectedUser) return;
    if (idsForSelected.length === 0) {
      alert("No messages found for this contact.");
      return;
    }
    setDeleting("selected");
    try {
      // optimistic UI
      setWhatsappMessages((prev) =>
        prev.filter((m) => !idsForSelected.includes(Number((m as any).id)))
      );
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "whatsapp_business",
        ids: idsForSelected,
      }).unwrap();

      setSelectedUser(null);
      setSelectedContact(null);
      setShowDetail(false);
    } catch (e) {
      console.error("Delete selected chat failed:", e);
      alert("Delete failed. Please refresh and try again.");
      // Optional rollback via re-fetch:
      // const fresh = await fetchSocialData(user.email, ENTITY, user.deviceImei);
      // setWhatsappMessages(fresh);
    } finally {
      setDeleting(null);
      // dialog already closed via confirm helper
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    setDeleting("all");
    try {
      // optimistic UI
      setWhatsappMessages([]);
           setWhatsappMessages([]);
      await deleteDataMutation({
        email: user.email,
        deviceImei: user.deviceImei,
        entity: "whatsapp_business",
        clearAll: true,
      }).unwrap();

      setSelectedUser(null);
      setSelectedContact(null);
      setShowDetail(false);
    } catch (e) {
      console.error("Delete all chats failed:", e);
      alert("Delete-all failed. Please refresh and try again.");
      // Optional rollback via re-fetch:
      // const fresh = await fetchSocialData(user.email, ENTITY, user.deviceImei);
      // setWhatsappMessages(fresh);
    } finally {
      setDeleting(null);
      // dialog already closed via confirm helper
    }
  };

  // Open confirm dialogs (for dropdown)
  const openConfirm = (kind: "selected" | "all") => {
    if (kind === "selected") setConfirmDeleteSelectedOpen(true);
    else setConfirmDeleteAllOpen(true);
  };

  // Close dialog first, then delete (prevents Radix focus-trap freeze)
  const confirmAndDeleteSelected = () => {
    setConfirmDeleteSelectedOpen(false);
    requestAnimationFrame(() => {
      void handleDeleteSelected();
    });
  };
  const confirmAndDeleteAll = () => {
    setConfirmDeleteAllOpen(false);
    requestAnimationFrame(() => {
      void handleDeleteAll();
    });
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 md:px-8 py-2 flex items-center justify-between gap-2">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-green-600 min-w-0 truncate">
          WhatsApp Business
        </h1>

        {/* Right-side actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop/Tablet: inline buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="destructive"
              className="gap-2 h-9"
              disabled={
                !selectedUser ||
                deleting === "selected" ||
                authLoading ||
                !isAuthenticated
              }
              onClick={() => setConfirmDeleteSelectedOpen(true)}
              title={
                selectedUser
                  ? `Delete chat with ${selectedUser}`
                  : "Select a chat first"
              }
              aria-label="Delete selected chat"
            >
              <Trash2 className="h-4 w-4" />
              <span className="whitespace-nowrap">Delete selected</span>
            </Button>

            <Button
              variant="outline"
              className="gap-2 h-9 text-red-600 border-red-600 hover:bg-red-50"
              disabled={
                whatsappMessages.length === 0 ||
                deleting === "all" ||
                authLoading ||
                !isAuthenticated
              }
              onClick={() => setConfirmDeleteAllOpen(true)}
              title="Delete all WhatsApp Business chats"
              aria-label="Delete all chats"
            >
              <Trash2 className="h-4 w-4" />
              <span className="whitespace-nowrap">Delete all (Clear all)</span>
            </Button>
          </div>

          {/* Mobile: kebab dropdown (right-aligned) */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 h-9">
                  <MoreVertical className="h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  // Defer opening dialog so menu can close first (prevents clash)
                  onSelect={() => setTimeout(() => openConfirm("selected"), 0)}
                  disabled={
                    !selectedUser ||
                    deleting === "selected" ||
                    authLoading ||
                    !isAuthenticated
                  }
                  className="gap-2 text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setTimeout(() => openConfirm("all"), 0)}
                  disabled={
                    whatsappMessages.length === 0 ||
                    deleting === "all" ||
                    authLoading ||
                    !isAuthenticated
                  }
                  className="gap-2 text-red-600 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete all (Clear all)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Lists container - hidden on mobile when detail is shown */}
        <div
          className={`${
            isMobileView && showDetail ? "hidden" : "block"
          } p-3 w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex-shrink-0`}
        >
          <Tabs
            defaultValue="chats"
            className="w-full"
            value={activeTab}
            onValueChange={handleTabChange}
          >
            <TabsList className="grid grid-cols-2 w-full h-[60px] bg-green-100">
              <TabsTrigger
                value="chats"
                className="flex items-center justify-center py-4 cursor-pointer"
              >
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="flex items-center justify-center py-4 cursor-pointer"
              >
                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chats" className="m-0">
              {loading ? (
                <ChatListSkeleton rows={8} />
              ) : (
                <ChatList
                  data={whatsappMessages}
                  onSelectChat={handleSelectChat}
                  selectedName={selectedUser}
                />
              )}
            </TabsContent>

            <TabsContent value="contacts" className="m-0">
              <ContactsList
                contacts={contacts}
                onSelectContact={handleSelectContact}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail container - full width on mobile when detail is shown */}
        <div
          className={`${
            isMobileView && !showDetail ? "hidden" : "flex"
          } flex-1 flex-col`}
        >
          {/* Back button for mobile view */}
          {isMobileView && showDetail && (
            <div className="p-2 bg-green-100 flex items-center">
              <button
                className="flex items-center text-green-700 font-medium"
                onClick={handleBackClick}
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Back
              </button>
            </div>
          )}

          <div className="flex-1 p-2 md:p-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-full">
              {activeTab === "chats" && (
                <ChatConversation
                  messages={whatsappMessages}
                  selectedUser={selectedUser}
                />
              )}
              {activeTab === "contacts" && (
                <ContactProfile selectedContact={selectedContact} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm delete selected */}
      <AlertDialog
        open={confirmDeleteSelectedOpen}
        onOpenChange={setConfirmDeleteSelectedOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser ? (
                <>
                  This will permanently delete all chats with{" "}
                  <b>{selectedUser}</b>.
                </>
              ) : (
                <>No user selected.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting === "selected"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmAndDeleteSelected} // close first, then delete
              disabled={!selectedUser || deleting === "selected"}
            >
              {deleting === "selected" ? "Deleting…" : "Delete"}
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
              Delete all WhatsApp Business chats?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <b>all</b> chats for this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting === "all"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmAndDeleteAll} // close first, then delete
              disabled={deleting === "all"}
            >
              {deleting === "all" ? "Deleting…" : "Delete all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WhatsAppBusiness;
