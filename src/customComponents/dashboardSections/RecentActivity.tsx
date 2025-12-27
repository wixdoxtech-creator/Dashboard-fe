 import { Users } from 'lucide-react';

export function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Users size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">New user registered</p>
              <p className="text-sm text-gray-500">2 minutes ago</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}