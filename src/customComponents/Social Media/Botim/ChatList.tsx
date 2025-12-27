import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useMemo } from "react";
import { SocialData } from "@/api/socialMedia-API";

interface ChatListProps {
  data: SocialData[]; // ← messages passed from parent
  onSelectChat: (name: string) => void;
}

const getInitials = (name?: string) =>
  (name ?? "??").trim().slice(0, 2).toUpperCase();

const parseTime = (iso?: string) => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const ChatList = ({ data, onSelectChat }: ChatListProps) => {
  // Keep the latest message per unique name, sorted by most recent
  const chats = useMemo(() => {
    const latestByName = new Map<string, SocialData>();

    for (const msg of data ?? []) {
      const name = (msg.name ?? "").trim();
      if (!name) continue;
      const prev = latestByName.get(name);
      if (!prev || parseTime(msg.timestamp) > parseTime(prev.timestamp)) {
        latestByName.set(name, msg);
      }
    }

    return Array.from(latestByName.values()).sort(
      (a, b) => parseTime(b.timestamp) - parseTime(a.timestamp)
    );
  }, [data]);

  return (
    <div className="flex flex-col h-[calc(100vh-240px)]">
      {/* Header */}
      <div className="p-2 border-b">
        <h3 className="font-medium">Chats</h3>
      </div>

      {/* List */}
      <div className="flex-1 overflow-hidden border-b">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {chats.map((chat, idx) => {
              const safeName = (chat.name ?? "Unknown").trim() || "Unknown";
              const key = chat.id ?? `${safeName}-${idx}`;

              return (
                <div
                  key={key}
                  className="flex items-center space-x-4 px-4 py-3 hover:bg-blue-100 cursor-pointer rounded-lg"
                  onClick={() => onSelectChat(safeName)}
                >
                  <Avatar className="h-10 w-10 text-white bg-blue-400 items-center justify-center">
                    <div className="text-sm font-medium">
                      {getInitials(safeName)}
                    </div>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {safeName}
                      </p>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(chat.timestamp)}
                      </p>
                    </div>

                    {/* last message preview */}
                    {chat.text && (
                      <p className="text-sm text-gray-600 truncate">
                        {chat.text}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}

            {chats.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500">
                No chats
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChatList;
