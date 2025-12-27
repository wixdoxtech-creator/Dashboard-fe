import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

interface ChatMessage {
  id: string;
  name: string;
  initials: string;
  time: string;
  displayTime: string;
  avatarBg: string;
}

interface ChatListProps {
  onSelectChat: (name: string) => void;
}

const ChatList = ({ onSelectChat}: ChatListProps ) => {
  const chats: ChatMessage[] = [
    {
      id: '1',
      name: 'Alex Wright',
      initials: 'AW',
      time: 'Yesterday, 2:16 PM',
      displayTime: '2:16 PM',
      avatarBg: 'bg-sky-400',
    },
    {
      id: '2',
      name: 'Klaus Radcliffe',
      initials: 'KR',
      time: 'Yesterday, 1:19 PM',
      displayTime: '1:19 PM',
      avatarBg: 'bg-sky-400',
    },
    {
      id: '3',
      name: 'Frank Burckley',
      initials: 'FB',
      time: 'Yesterday, 2:04 PM',
      displayTime: '2:04 PM',
      avatarBg: 'bg-orange-300',
    },
    {
      id: '4',
      name: 'Tommy Blackwood',
      initials: 'TB',
      time: 'Yesterday, 12:16 PM',
      displayTime: '12:16 PM',
      avatarBg: 'bg-sky-400',
    },
    {
      id: '5',
      name: 'Chris Monet',
      initials: 'CM',
      time: 'Yesterday, 12:14 PM',
      displayTime: '12:14 PM',
      avatarBg: 'bg-purple-400',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-240px)]">
      {/* Chat List Header */}
      <div className="p-2 border-b">
        <h3 className="font-medium">Chats</h3>
      </div>
      
      {/* Chat List Container */}
      <div className="flex-1 overflow-hidden border-b">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center space-x-4 px-4 py-3 hover:bg-blue-100 cursor-pointer rounded-lg"
                onClick={() => onSelectChat(chat.name)}
              >
                <Avatar
                  className={`h-10 w-10 ${chat.avatarBg} text-white items-center justify-center`}
                >
                  <div className="text-sm font-medium">{chat.initials}</div>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {chat.name}
                    </p>
   
                    <p className="text-xs text-gray-500">{chat.time}</p>
                  </div>
  
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ChatList;
