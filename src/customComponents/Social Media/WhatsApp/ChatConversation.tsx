import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SocialData } from "@/api/socialMedia-API";

interface ChatConversationProps {
  selectedUser: string | null;
  messages: SocialData[];
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const ChatConversation = ({ selectedUser, messages }: ChatConversationProps) => {
  const filteredMessages = useMemo(
    () =>
      selectedUser
        ? messages.filter((m) => (m.name ?? "").trim() === selectedUser)
        : [],
    [messages, selectedUser]
  );

  if (!selectedUser) {
    return (
      <div className="flex flex-col h-[calc(100vh-180px)] rounded-lg items-center justify-center">
        <p className="text-gray-500">Select a contact to view Messages</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] rounded-lg bg-[url(/wallpaper.jpg)] bg-cover bg-black/20 bg-blend-overlay">

      {/* 🔹 Header */}
      <div className="sticky top-0 z-10 px-4 py-3 bg-white/90 backdrop-blur border-b flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-semibold">
          {selectedUser.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 leading-tight">
            {selectedUser}
          </p>
          {/* <p className="text-xs text-gray-500">Chat conversation</p> */}
        </div>
      </div>

      {/* 🔹 Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {filteredMessages.map((msg) => {
              const dir = (msg.direction || "").toLowerCase();
              const isOutgoing = dir === "outgoing";

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[70%] ${
                      isOutgoing ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={[
                        "px-4 py-2 rounded-2xl shadow-sm whitespace-pre-wrap break-words",
                        isOutgoing
                          ? "bg-gradient-to-r from-green-500 to-green-500 text-white rounded-br-none"
                          : "bg-white/90 text-gray-800 backdrop-blur rounded-bl-none ring-1 ring-black/5",
                      ].join(" ")}
                    >
                      <p>{msg.text}</p>
                      <p
                        className={`mt-1 text-[10px] text-right ${
                          isOutgoing ? "text-white/80" : "text-gray-500"
                        }`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChatConversation;
