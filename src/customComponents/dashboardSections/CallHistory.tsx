import { useGetCallHistoryQuery } from "@/api/features";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Phone,
  PhoneMissed,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface CallHistory {
  name: string;
  number: string;
  duration: string;
  timestamp: string;
  type: "incoming" | "outgoing" | "missed";
}

export function CallHistory() {
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [_loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();

  const email = (user?.email ?? "").trim().toLowerCase();
  const deviceImei = String(user?.deviceImei ?? "").trim();
  const skip = !email || !deviceImei;

  const { data: callHistoryData } = useGetCallHistoryQuery(
    { email, deviceImei, page: 1, limit: 10 },
    {
      skip,
      refetchOnMountOrArgChange: false,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    }
  );

  const toSimpleRows = (wire: any): CallHistory[] => {
    const list = Array.isArray(wire) ? wire : wire?.data ?? [];
    return list.map((c: any) => ({
      name: c.name,
      number: c.number,
      duration: c.duration,
      timestamp: c.timestamp,
      type: c.direction as "incoming" | "outgoing" | "missed",
    }));
  };

  useEffect(() => {
    if (skip) return;
    if (!callHistoryData) return;

    setLoading(true);
    try {
      setCallHistory(toSimpleRows(callHistoryData));
    } catch (error) {
      console.log("error fetching call history Data", error);
    } finally {
      setLoading(false);
    }
  }, [skip, callHistoryData]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="bg-slate-100 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between p-6 border-b border-gray-300 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Phone className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Call History</h2>
        </div>
        <Link
          to="/call-history"
          className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-medium transition-colors duration-200 cursor-pointer"
        >
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="divide-y divide-gray-300">
        {callHistory.slice(0, 6).map((call, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer group w-full"
          >
            {/* Icon */}
            <div
              className={`p-2.5 rounded-full transition-colors duration-200 ${
                call.type === "incoming"
                  ? "bg-red-50 text-blue-500 group-hover:bg-red-100"
                  : call.type === "outgoing"
                  ? "bg-green-50 text-green-500 group-hover:bg-green-100"
                  : "bg-red-100 text-red-500 group-hover:bg-red-200"
              }`}
            >
              {call.type === "incoming" ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : call.type === "outgoing" ? (
                <ArrowUpRight className="w-5 h-5" />
              ) : (
                <PhoneMissed className="w-5 h-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex justify-between items-start w-full">
              {/* Left Side: Name + Number */}
              <div className="flex flex-col">
                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                  {call.name}
                </p>
                <p className="text-sm text-gray-500 break-all">{call.number}</p>
              </div>

              {/* Right Side: Duration + Timestamp */}
              <div className="flex flex-col items-end text-sm text-gray-500 gap-1">
                <div className="flex items-center gap-1">
                  
                  <span>{call.duration}</span>
                </div>
                <p className="text-xs text-gray-400">
                  {formatTimestamp(call.timestamp)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
