import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

interface Message {
  id: string;
  text: string;
  isMe: boolean;
  time: string;
  sender?: string;
  initials?: string;
  avatarBg?: string;
}

interface ConversationBoxProps {
  selectedUser: string | null;
}

const ConversationBox = ({ selectedUser}: ConversationBoxProps) => {
  const messages: Message[] = [
    {
      id: '1',
      text: 'Hey, how\'s the project going?',
      isMe: true,
      time: 'Today, 10:30 AM'
    },
    {
      id: '2',
      text: 'It\'s going well! Just finished the frontend part',
      isMe: false,
      time: 'Today, 10:32 AM',
      sender: 'Alex Wright',
      initials: 'AW',
      avatarBg: 'bg-sky-400'
    },
    {
      id: '3',
      text: 'That\'s great! When do you think it\'ll be ready for testing?',
      isMe: true,
      time: 'Today, 10:33 AM'
    },
    {
      id: '4',
      text: 'Probably by next Tuesday. Still need to fix some bugs',
      isMe: false,
      time: 'Today, 10:35 AM',
      sender: 'Alex Wright',
      initials: 'AW',
      avatarBg: 'bg-sky-400'
    },
    {
      id: '5',
      text: 'Can\'t wait to see it in action!',
      isMe: true,
      time: 'Today, 10:36 AM'
    },
    {
      id: '6',
      text: 'Thanks! I\'ll send you a demo link when it\'s ready',
      isMe: false,
      time: 'Today, 10:38 AM',
      sender: 'Alex Wright',
      initials: 'AW',
      avatarBg: 'bg-sky-400'
    },
    {
      id: '7',
      text: 'Perfect! Let me know if you need any help',
      isMe: true,
      time: 'Today, 10:40 AM'
    },
    {
      id: '8',
      text: 'Will do! Thanks for offering',
      isMe: false,
      time: 'Today, 10:42 AM',
      sender: 'Alex Wright',
      initials: 'AW',
      avatarBg: 'bg-sky-400'
    },
    {
      id: '9',
      text: 'Hey, did you see the new design mockups?',
      isMe: false,
      time: 'Yesterday, 3:15 PM',
      sender: 'Klaus Radcliffe',
      initials: 'KR',
      avatarBg: 'bg-sky-400'
    },
    {
      id: '10',
      text: 'Yes, they look amazing! The color scheme is perfect',
      isMe: true,
      time: 'Yesterday, 3:20 PM'
    },
    {
      id: '11',
      text: 'I know right? The client loved them too',
      isMe: false,
      time: 'Yesterday, 3:22 PM',
      sender: 'Klaus Radcliffe',
      initials: 'KR',
      avatarBg: 'bg-sky-400'
    },
    {
      id: '12',
      text: 'Are we still on for the team meeting tomorrow?',
      isMe: true,
      time: 'Yesterday, 3:25 PM'
    },
    {
      id: '13',
      text: 'Yes, 10 AM sharp! Don\'t forget to bring your presentation',
      isMe: false,
      time: 'Yesterday, 3:30 PM',
      sender: 'Klaus Radcliffe',
      initials: 'KR',
      avatarBg: 'bg-sky-400'
    },
    {
      id: '14',
      text: 'I\'ll be there with bells on!',
      isMe: true,
      time: 'Yesterday, 3:32 PM'
    },
    {
      id: '15',
      text: 'Can you send me the latest version of the report?',
      isMe: false,
      time: 'Yesterday, 11:45 AM',
      sender: 'Frank Burckley',
      initials: 'FB',
      avatarBg: 'bg-orange-300'
    },
    {
      id: '16',
      text: 'Sure, I\'ll email it to you right away',
      isMe: true,
      time: 'Yesterday, 11:50 AM'
    },
    {
      id: '17',
      text: 'Thanks! I need it for the meeting this afternoon',
      isMe: false,
      time: 'Yesterday, 11:52 AM',
      sender: 'Frank Burckley',
      initials: 'FB',
      avatarBg: 'bg-orange-300'
    },
    {
      id: '18',
      text: 'No problem, it\'s already in your inbox',
      isMe: true,
      time: 'Yesterday, 11:55 AM'
    },
    {
      id: '19',
      text: 'Perfect, thanks again!',
      isMe: false,
      time: 'Yesterday, 12:00 PM',
      sender: 'Frank Burckley',
      initials: 'FB',
      avatarBg: 'bg-orange-300'
    }
  ];

  const filteredMessages = selectedUser
  ? messages.filter((msg) => !msg.isMe && msg.sender === selectedUser || msg.isMe)
  : [];

  if (!selectedUser) {
    return (
      <div className="flex flex-col h-[calc(100vh-180px)]  rounded-lg items-center justify-center">
        <p className="text-gray-500">Select a contact to view Messages</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-gray-100 rounded-lg">
      
      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {filteredMessages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-end space-x-2 max-w-[70%] ${message.isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  {!message.isMe && (
                    <Avatar className={`h-9 w-9 ${message.avatarBg} items-center justify-center text-white hidden sm:flex`}>
                      <div className="text-sm font-medium items-center">{message.initials}</div>
                    </Avatar>
                  )}
                  <div 
                    className={`px-4 py-2 rounded-2xl ${message.isMe 
                      ? 'bg-blue-100 text-gray-800' 
                      : 'bg-white text-gray-800'}`}
                  >
                    <p>{message.text}</p>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {message.time}
                    </p>
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

export default ConversationBox;