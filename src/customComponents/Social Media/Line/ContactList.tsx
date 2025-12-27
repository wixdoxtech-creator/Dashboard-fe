import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

interface Contact {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
}

interface ContactsListProps {
  onSelectContact: (contact: Contact) => void;
}

const ContactsList = ({ onSelectContact }: ContactsListProps) => {
  const contacts: Contact[] = [
    {
      id: '1',
      name: 'Alex Wright',
      initials: 'AW',
      avatarBg: 'bg-sky-400',
    },
    {
      id: '2',
      name: 'Klaus Radcliffe',
      initials: 'KR',
      avatarBg: 'bg-sky-400',
    },
    {
      id: '3',
      name: 'Frank Burckley',
      initials: 'FB',
      avatarBg: 'bg-orange-300',
    },
    {
      id: '4',
      name: 'Tommy Blackwood',
      initials: 'TB',
      avatarBg: 'bg-sky-400',
    },
    {
      id: '5',
      name: 'Chris Monet',
      initials: 'CM',
      avatarBg: 'bg-purple-400',
    },
    {
      id: '6',
      name: 'Momo Miazuki',
      initials: 'MM',
      avatarBg: 'bg-orange-200',
    },
 
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-240px)]">
      {/* Chat List Header */}
      <div className="p-2 border-b">
        <h3 className="font-medium">Contacts</h3>
      </div>
      
      {/* Chat List Container */}
      <div className="flex-1 overflow-hidden border-b">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center space-x-4 px-4 py-3 hover:bg-green-100 cursor-pointer rounded-lg"
                onClick={() => onSelectContact(contact)}
              >
                <Avatar
                  className={`h-10 w-10 ${contact.avatarBg} text-white items-center justify-center`}
                >
                  <div className="text-sm font-medium">{contact.initials}</div>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {contact.name}
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

export default ContactsList;
