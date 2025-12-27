import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useMemo } from "react";
import { SocialData } from "@/api/socialMedia-API";

interface ConversationBoxProps {
  selectedUser: string | null;
  messages: SocialData[]; // <- passed from parent
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const initials = (name?: string) =>
  (name ?? "??").trim().slice(0, 2).toUpperCase();

const ConversationBox = ({ selectedUser, messages }: ConversationBoxProps) => {
  const filteredMessages = useMemo(
    () => (selectedUser ? messages.filter((m) => m.name === selectedUser) : []),
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
    <div className="flex flex-col h-[calc(100vh-180px)] bg-gray-100 rounded-lg">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {filteredMessages.map((msg, idx) => (
              <div key={msg.id ?? `${msg.name ?? "unknown"}-${idx}`} className="flex justify-start">
                <div className="flex items-end space-x-2 max-w-[70%]">
                  <Avatar className="h-9 w-9 bg-blue-400 text-white items-center justify-center hidden sm:flex">
                    <div className="text-sm font-medium">{initials(msg.name)}</div>
                  </Avatar>
                  <div className="px-4 py-2 rounded-2xl bg-white text-gray-800">
                    <p>{msg.text ?? ""}</p>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {formatTimestamp(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {filteredMessages.length === 0 && (
              <div className="text-center text-gray-500 py-8">No messages</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ConversationBox;
