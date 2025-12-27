import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useMemo } from "react";
import { SocialData } from "@/api/socialMedia-API";

interface ChatListProps {
  data: SocialData[];
  onSelectChat: (name: string) => void;
  selectedName?: string | null;
}

const getInitials = (name?: string) =>
  (name ?? "??").trim().slice(0, 3).toUpperCase();

const parseTime = (iso?: string) => {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString("en-IN", { timeStyle: "short" });
};

const ChatList = ({ data, onSelectChat, selectedName }: ChatListProps) => {
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
      <div className="p-2 border-b">
        <h3 className="font-medium">Chats</h3>
      </div>

      <div className="flex-1 overflow-hidden border-b">
        <ScrollArea className="h-full">
          <div className="space-y-1 p-1">
            {chats.map((chat, idx) => {
              const safeName = (chat.name ?? "Unknown").trim() || "Unknown";
              const key = chat.id ?? `${safeName}-${idx}`;
              const isActive = selectedName === safeName;

              return (
                <div
                  key={key}
                  role="button"
                  aria-selected={isActive}
                  onClick={() => onSelectChat(safeName)}
                  className={[
                    "group relative cursor-pointer rounded-xl transition will-change-transform",
                    "px-4 py-3 flex items-center gap-4",
                    // Base (non-selected)
                    !isActive && "hover:bg-green-100",
                    // Selected: glass card + inner border for depth
                    isActive &&
                      "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl ring-1 ring-white/20 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)]",
                  ].join(" ")}
                >
                  {/* Green glow halo (selected only) */}
                  {isActive && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-[1.5px] rounded-lg opacity-70 blur-[2px] transition-opacity
               bg-gradient-to-r from-emerald-200/70 via-green-300/60 to-emerald-200/70"
                    />
                  )}

                  {/* Animated left accent (selected only) */}
                  {isActive && (
                    <div
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r
                                 bg-gradient-to-b from-green-400 via-olive-400 to-emerald-500
                                 animate-pulse"
                    />
                  )}

                  {/* Avatar */}
                  <div className="relative">
                    <Avatar
                      className={[
                        "relative h-10 w-10 text-white flex items-center justify-center",
                        isActive ? "bg-green-600" : "bg-green-500",
                        isActive && "ring-2 ring-white/50",
                      ].join(" ")}
                    >
                      <div className="text-sm font-semibold">
                        {getInitials(safeName)}
                      </div>
                    </Avatar>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p
                        className={[
                          "truncate",
                          isActive
                            ? "text-slate-900 dark:text-slate-50 font-semibold"
                            : "text-gray-900 font-medium",
                        ].join(" ")}
                      >
                        {safeName}
                      </p>

                      <p
                        className={[
                          "text-xs whitespace-nowrap tabular-nums",
                          isActive
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-gray-500",
                        ].join(" ")}
                      >
                        {formatTime(chat.timestamp)}
                      </p>
                    </div>

                    {chat.text && (
                      <p
                        className={[
                          "truncate text-sm",
                          isActive
                            ? "text-slate-800/90 dark:text-slate-200/90"
                            : "text-gray-600",
                        ].join(" ")}
                      >
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
