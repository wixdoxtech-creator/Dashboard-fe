import { LucideIcon } from 'lucide-react';

interface InfoCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

export function InfoCard({ icon: Icon, label, value }: InfoCardProps) {
  return (
    <div className="py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-blue-500" />
        <span className="text-gray-800">{label}</span>
      </div>
      <span className="font-normal text-gray-500">{value}</span>
    </div>
  );
}