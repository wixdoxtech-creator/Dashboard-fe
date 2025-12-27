import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { MessageCircle, Users, ChevronLeft } from 'lucide-react';
import ChatList from "./ChatList";
import ContactsList from "./ContactList";
import ConversationBox from "./ConversationBox";
import ContactProfile from "./ContactProfile";


interface Contact {
    id: string;
    name: string;
    initials: string;
    avatarBg: string;
}

const Skype = () => {
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [activeTab, setActiveTab] = useState("chats");
    const [isMobileView, setIsMobileView] = useState(false);
    const [showDetail, setShowDetail] = useState(false);

    // Check if we're in mobile view on mount and window resize
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobileView(window.innerWidth < 768);
        };

        // Check on mount
        checkIfMobile();

        // Add event listener
        window.addEventListener('resize', checkIfMobile);

        // Clean up
        return () => window.removeEventListener('resize', checkIfMobile);
    }, []);

    // Update showDetail when selections change
    useEffect(() => {
        if (isMobileView) {
            if (selectedUser || selectedContact) {
                setShowDetail(true);
            }
        }
    }, [selectedUser, selectedContact, isMobileView]);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        // Reset selections when changing tabs
        if (value === "chats") {
            setSelectedContact(null);
        } else if (value === "contacts") {
            setSelectedUser(null);
        }

        // Hide detail view when switching tabs in mobile
        if (isMobileView) {
            setShowDetail(false);
        }
    };

    const handleBackClick = () => {
        setShowDetail(false);
        // Clear the selected item based on active tab
        if (activeTab === "chats") {
            setSelectedUser(null);
        } else if (activeTab === "contacts") {
            setSelectedContact(null);
        }
    };

    // Handler that updates selected items and shows detail on mobile
    const handleSelectChat = (userName: string) => {
        setSelectedUser(userName);
        if (isMobileView) {
            setShowDetail(true);
        }
    };

    const handleSelectContact = (contact: Contact) => {
        setSelectedContact(contact);
        if (isMobileView) {
            setShowDetail(true);
        }
    };


    return (
        <div className="flex flex-col">
            <div className="p-3 px-4 md:px-8 text-white">
                <div className="flex items-center space-x-2">
                    <img src="/skype.png" alt="skype" className="w-11 h-11" />
                    <h1 className="text-4xl md:text-5xl font-bold text-sky-600  ">
                    Skype
                </h1>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Lists container - hidden on mobile when detail is shown */}
                <div className={`${isMobileView && showDetail ? 'hidden' : 'block'} p-3 w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex-shrink-0`}>
                    <Tabs defaultValue="chats" className="w-full" value={activeTab} onValueChange={handleTabChange}>
                        <TabsList className="grid grid-cols-2 w-full h-[60px] bg-blue-200">
                            <TabsTrigger value="chats" className="flex items-center justify-center py-4 cursor-pointer">
                                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                            </TabsTrigger>
                            <TabsTrigger value="contacts" className="flex items-center justify-center py-4 cursor-pointer">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="chats" className="m-0">
                            <ChatList onSelectChat={handleSelectChat} />
                        </TabsContent>
                        <TabsContent value="contacts" className="m-0">
                            <ContactsList onSelectContact={handleSelectContact} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Detail container - full width on mobile when detail is shown */}
                <div className={`${isMobileView && !showDetail ? 'hidden' : 'flex'} flex-1 flex-col`}>
                    {/* Back button for mobile view */}
                    {isMobileView && showDetail && (
                        <div className="p-2  flex items-center bg-yellow-200">
                            <button
                                className="flex items-center  text-blue-700 font-medium rounded-lg p-2"
                                onClick={handleBackClick}
                            >
                                <ChevronLeft className="h-5 w-5 mr-2" />
                                Back
                            </button>
                        </div>
                    )}

                    <div className="flex-1 p-2 md:p-4">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-full">
                            {activeTab === "chats" && <ConversationBox selectedUser={selectedUser} />}
                            {activeTab === "contacts" && <ContactProfile selectedContact={selectedContact} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Skype;