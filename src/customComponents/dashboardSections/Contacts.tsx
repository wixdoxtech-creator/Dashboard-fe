import { useGetContactsQuery } from "@/api/features";
import { useAuth } from "@/contexts/AuthContext";
import { Star, ChevronRight, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Contact {
  name: string;
  number: string;
}

export function Contacts() {
  const [numbers, setNumbers] = useState<Contact[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);

  const { user } = useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !email || !deviceImei;

  // ✅ fetch only 1st page, 10 items (you only show 6 in card)
  const { data: contactData } = useGetContactsQuery(
    { email, deviceImei, page: 1, limit: 10 },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  // ✅ helper: supports both old (array) and new ({contacts}) shape
  const toContacts = (wire: any): Contact[] => {
    const list = Array.isArray(wire) ? wire : wire?.contacts ?? [];
    return list.map((c: any) => ({
      name: c?.name ?? "Unknown",
      number: c?.number ?? "",
    }));
  };

  useEffect(() => {
    if (skip) return;
    if (!contactData) return;

    setLoading(true);
    try {
      setNumbers(toContacts(contactData));
    } finally {
      setLoading(false);
    }
  }, [skip, contactData]);

  return (
    <div className="bg-slate-100 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between p-6 border-b border-gray-300">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Users className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
        </div>

        <Link
          to="/contacts"
          className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors duration-200 cursor-pointer"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-gray-300">
        {numbers.slice(0, 6).map((contact, index) => (
          <div
            key={`${contact.number}-${index}`}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
          >
            <div className="p-2.5 rounded-full bg-blue-50 text-blue-500 group-hover:bg-blue-100 transition-colors duration-200">
              <Star className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                {contact.name}
              </p>
              <p className="text-sm text-gray-500">{contact.number}</p>
            </div>
          </div>
        ))}

        {numbers.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            No Contacts.
          </div>
        )}
      </div>
    </div>
  );
}
