import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";

interface Contact {
  id: string;
  name: string;
  initials: string;
  avatarBg: string; // e.g., "bg-sky-400"
}

interface ContactsListProps {
  contacts: Contact[];                         // ← passed from parent
  onSelectContact: (contact: Contact) => void;
}

const getInitials = (name?: string) =>
  (name ?? "??").trim().slice(0, 2).toUpperCase();

const ContactsList = ({ contacts, onSelectContact }: ContactsListProps) => {
  const list = Array.isArray(contacts) ? contacts : [];

  return (
    <div className="flex flex-col h-[calc(100vh-240px)]">
      {/* Header */}
      <div className="p-2 border-b">
        <h3 className="font-medium">Contacts</h3>
      </div>

      {/* List */}
      <div className="flex-1 overflow-hidden border-b">
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {list.map((contact, idx) => {
              const name = contact.name?.trim() || "Unknown";
              const initials = contact.initials?.trim() || getInitials(name);
              const key = contact.id || `${name}-${idx}`;
              const avatarBg = contact.avatarBg || "bg-gray-300";

              return (
                <div
                  key={key}
                  className="flex items-center space-x-4 px-4 py-3 hover:bg-blue-100 cursor-pointer rounded-lg"
                  onClick={() => onSelectContact(contact)}
                >
                  <Avatar className={`h-10 w-10 ${avatarBg} text-white items-center justify-center`}>
                    <div className="text-sm font-medium">{initials}</div>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {name}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {list.length === 0 && (
              <div className="px-4 py-6 text-center text-gray-500">No contacts</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ContactsList;