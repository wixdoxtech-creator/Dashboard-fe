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

export default function RecentCalls({ selectedCall }: { selectedCall: CallData | null }) {
  return (
    <div className="flex flex-col h-[calc(100vh-180px)] justify-center  rounded-lg p-4">
      {selectedCall ? (
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto border border-gray-200 w-full">
          <div className="flex items-center space-x-4 mb-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${selectedCall.avatarBg}`}>
              {selectedCall.initials}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{selectedCall.name}</h2>
              <p className="text-gray-500">{selectedCall.number}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Date</span>
              <span className="font-medium">{selectedCall.date}</span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Time</span>
              <span className="font-medium">{selectedCall.time}</span>
            </div>
            
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">Type</span>
              <span className={`font-medium ${
                selectedCall.type === 'incoming' ? 'text-green-600' : 
                selectedCall.type === 'outgoing' ? 'text-blue-600' : 
                'text-red-600'
              }`}>
                {selectedCall.type.charAt(0).toUpperCase() + selectedCall.type.slice(1)}
              </span>
            </div>
            
            {selectedCall.duration && (
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-gray-500">Duration</span>
                <span className="font-medium">{selectedCall.duration}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select a contact to view Calls History</p>
        </div>
      )}
    </div>
  );
}