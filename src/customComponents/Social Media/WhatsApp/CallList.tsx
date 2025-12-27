import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';

interface CallData {
  id: string;
  name: string;
  initials: string;
  number: string;
  avatarBg: string;
  date: string;
  time: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration?: string;
}

interface CallListProps {
  onSelectCall: (call: CallData) => void;
}

const CallList = ({ onSelectCall }: CallListProps) => {
  const calls: CallData[] = [
    {
      id: '1',
      name: 'Alex Wright',
      initials: 'AW',
      number: '+1234567890',
      avatarBg: 'bg-sky-400',
      date: 'Today',
      time: '2:16 PM',
      type: 'incoming',
      duration: '5:23'
    },
    {
      id: '2',
      name: 'Klaus Radcliffe',
      initials: 'KR',
      number: '+1234567890',
      avatarBg: 'bg-sky-400',
      date: 'Today',
      time: '1:19 PM',
      type: 'outgoing',
      duration: '3:45'
    },
    {
      id: '3',
      name: 'Frank Burckley',
      initials: 'FB',
      number: '+1234567890',
      avatarBg: 'bg-orange-300',
      date: 'Today',
      time: '11:04 AM',
      type: 'missed'
    },
    {
      id: '4',
      name: 'Tommy Blackwood',
      initials: 'TB',
      number: '+1234567890',
      avatarBg: 'bg-sky-400',
      date: 'Yesterday',
      time: '8:16 PM',
      type: 'incoming',
      duration: '12:30'
    },
    {
      id: '5',
      name: 'Chris Monet',
      initials: 'CM',
      number: '+1234567890',
      avatarBg: 'bg-purple-400',
      date: 'Yesterday',
      time: '5:14 PM',
      type: 'outgoing',
      duration: '2:15'
    },
    {
      id: '6',
      name: 'Momo Miazuki',
      initials: 'MM',
      number: '+1234567890',
      avatarBg: 'bg-orange-200',
      date: 'Yesterday',
      time: '3:08 PM',
      type: 'missed'
    },
    {
      id: '7',
      name: 'Sarah Johnson',
      initials: 'SJ',
      number: '+1234567890',
      avatarBg: 'bg-green-400',
      date: 'Yesterday',
      time: '11:58 AM',
      type: 'incoming',
      duration: '7:20'
    },
    {
      id: '8',
      name: 'Michael Brown',
      initials: 'MB',
      number: '+1234567890',
      avatarBg: 'bg-blue-500',
      date: 'Yesterday',
      time: '10:45 AM',
      type: 'outgoing',
      duration: '4:10'
    },
    {
      id: '9',
      name: 'Emily Davis',
      initials: 'ED',
      number: '+1234567890',
      avatarBg: 'bg-pink-400',
      date: 'Yesterday',
      time: '9:30 AM',
      type: 'missed'
    },
    {
      id: '10',
      name: 'David Wilson',
      initials: 'DW',
      number: '+1234567890',
      avatarBg: 'bg-indigo-400',
      date: 'Yesterday',
      time: '8:15 AM',
      type: 'incoming',
      duration: '1:45'
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-240px)]">
      {/* Call List Header */}
      <div className="p-2 border-b">
        <h3 className="font-medium">Recent Calls</h3>
      </div>
      
      {/* Call List Container */}
      <div className="flex-1 overflow-hidden border-b">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {calls.map((call) => (
              <div
                key={call.id}
                className="flex items-center space-x-4 px-4 py-3 hover:bg-green-100 cursor-pointer rounded-lg"
                onClick={() => onSelectCall(call)}
              >
                <Avatar
                  className={`h-10 w-10 ${call.avatarBg} text-white items-center justify-center`}
                >
                  <div className="text-sm font-medium">{call.initials}</div>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {call.name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {call.type === 'incoming' && (
                        <PhoneIncoming className="h-4 w-4 text-green-600" />
                      )}
                      {call.type === 'outgoing' && (
                        <PhoneOutgoing className="h-4 w-4 text-blue-600" />
                      )}
                      {call.type === 'missed' && (
                        <PhoneMissed className="h-4 w-4 text-red-600" />
                      )}
                      <p className="text-xs text-gray-500">
                        {call.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500 truncate">
                      {call.number}
                    </p>
                    {call.duration && (
                      <p className="text-xs text-gray-500">
                        {call.duration}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    {call.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CallList;
