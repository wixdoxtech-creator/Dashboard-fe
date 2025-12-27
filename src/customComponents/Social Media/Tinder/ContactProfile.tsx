import { Avatar } from "@/components/ui/avatar";

interface Contact {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
}

interface ContactProfileProps {
  selectedContact: Contact | null;
}

const ContactProfile = ({ selectedContact }: ContactProfileProps) => {
  if (!selectedContact) {
    return (
      <div className="flex flex-col h-[calc(100vh-180px)]  rounded-lg items-center justify-center">
        <p className="text-gray-500">Select a contact to view details</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-gray-100 rounded-lg">
      {/* Contact Profile Header */}
      <div className="p-6 flex flex-col h-full items-center justify-center bg-white border-b border-gray-200">
        <Avatar
          className={`h-32 w-32 ${selectedContact.avatarBg} text-white items-center justify-center mb-4`}
        >
          <div className="text-4xl font-medium">{selectedContact.initials}</div>
        </Avatar>
        <h2 className="text-4xl font-bold text-gray-700">{selectedContact.name}</h2>
      </div>
    </div>
  );
};

export default ContactProfile;