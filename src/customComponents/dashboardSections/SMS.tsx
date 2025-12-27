import { MessageCircle, ChevronRight} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGetSmsQuery } from '@/api/features';
import { Link } from 'react-router-dom';

interface SMS {
  sender: string;
  message: string;
  timestamp: string;
}

// Format timestamp to readable format like "Jul 11, 2025, 10:30 AM"
const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export function SMS() {
  const [messages, setMessages] = useState<SMS[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  
  const { user } = useAuth();

const email = (user?.email ?? "").trim().toLowerCase();
const deviceImei = String(user?.deviceImei ?? "").trim();
const skip = !email || !deviceImei;


  const { data: smsData } = useGetSmsQuery(
    { email, deviceImei, page: 1, limit: 10 },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );
  

  useEffect(() => {
    if (skip) return;
    if(!smsData) return;

    setLoading(true);
    try{
      const normalized = (smsData?.data ?? []).map((s: any) => ({
        sender: s?.name,
        message: s?.text,
        timestamp: String(s?.timestamp ?? s?.date ?? ""),
      }));
      setMessages(normalized.slice(0, 5));

    } catch (err) {
      console.log("Error while fetching sms", err)
    } finally {
      setLoading(false);
    }
  }, [skip, smsData]);

  return (
    <div className="bg-slate-100 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between p-6 border-b border-gray-300 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2">
            <MessageCircle className="w-5 h-5 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">SMS Messages</h2>
        </div>
        <Link to='/sms' className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors duration-200 cursor-pointer">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-gray-300">
        {messages.map((sms, index) => (
          <div
            key={index}
            className="flex flex-col gap-1 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
          >
            <div className="flex justify-between items-center">
              <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                {sms.sender}
              </p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span className="text-xs text-gray-400">
                  {formatTimestamp(sms.timestamp)}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{sms.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
