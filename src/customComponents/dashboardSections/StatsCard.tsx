interface StatsCardProps {
  title: string;
  value: string;
  change: string;
}

export function StatsCard({ title, value, change }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className="mt-2 flex items-baseline">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        <span className="ml-2 text-sm font-medium text-green-600">{change}</span>
      </div>
    </div>
  );
}