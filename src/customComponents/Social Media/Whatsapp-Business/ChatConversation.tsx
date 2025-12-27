import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SocialData } from "@/api/socialMedia-API";

interface ChatConversationProps {
  selectedUser: string | null;
  messages: SocialData[];
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", { timeStyle: "short" });
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
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            {filteredMessages.map((msg) => {
              const dir = (msg.direction || "").toLowerCase();
              const isOutgoing = dir === "outgoing";

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}
                >
                  {/* The row container needs min-w-0 so children can shrink */}
                  <div
                    className={[
                      "flex items-end gap-2 min-w-0",
                      // responsive max width for a bubble (narrower on large screens)
                      "max-w-[88%] xs:max-w-[84%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%]",
                      isOutgoing ? "flex-row-reverse" : "flex-row",
                    ].join(" ")}
                  >
                    {/* Bubble */}
                    <div
                      className={[
                        // sizing & wrapping
                        "min-w-0 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-sm",
                        "text-sm sm:text-[15px] leading-relaxed",
                        "whitespace-pre-wrap break-words break-all",
                        "[overflow-wrap:anywhere] hyphens-auto",
                        "select-text", // allow copy
                        // theme
                        isOutgoing
                          ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none ring-1 ring-black/5",
                        // smooth color/size transitions for nicer feel
                        "transition-all duration-200",
                      ].join(" ")}
                    >
                      <p className="min-w-0">{msg.text}</p>

                      <p
                        className={[
                          "mt-1 text-[10px] sm:text-[11px] text-right",
                          isOutgoing ? "text-white/80" : "text-gray-500",
                        ].join(" ")}
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
