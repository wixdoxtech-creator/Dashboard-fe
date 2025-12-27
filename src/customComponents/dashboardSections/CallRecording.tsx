import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Headphones,
  Clock,
} from 'lucide-react';

interface Recording {
  contact: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
  duration: string;
}

export function CallRecordings() {
  const recordings: Recording[] = [
    { contact: 'Vipul', timestamp: '2025-03-26 22:33:51', type: 'outgoing', duration: '15:52:00' },
    { contact: 'John', timestamp: '2025-03-26 22:32:58', type: 'incoming', duration: '12:30:10' },
    { contact: 'Bran', timestamp: '2025-03-26 21:41:29', type: 'outgoing', duration: '09:45:33' },
    { contact: 'Hema', timestamp: '2025-03-26 21:25:49', type: 'outgoing', duration: '08:12:49' },
    { contact: 'Bran', timestamp: '2025-03-26 20:52:51', type: 'incoming', duration: '07:55:11' },
  ];

  return (
    <div className="bg-slate-100 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between p-6 border-b border-gray-300 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Headphones className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Call Recordings</h2>
        </div>
        <button className="text-purple-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium transition-colors duration-200 cursor-pointer">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="divide-y divide-gray-300">
        {recordings.map((recording, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
          >
            {/* Icon */}
            <div
              className={`p-2.5 rounded-full ${
                recording.type === 'incoming'
                  ? 'bg-green-50 text-green-500 group-hover:bg-green-100'
                  : 'bg-orange-50 text-orange-500 group-hover:bg-orange-100'
              } transition-colors duration-200`}
            >
              {recording.type === 'incoming' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>

            {/* Content: Name on Left, Time & Timestamp on Right */}
            <div className="flex justify-between items-center w-full">
              {/* Contact Name */}
              <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {recording.contact}
              </p>

              {/* Duration & Timestamp aligned right */}
              <div className="flex flex-col items-end text-sm text-gray-500 gap-1">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{recording.duration}</span>
                </div>
                <p className="text-xs text-gray-400">{recording.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
