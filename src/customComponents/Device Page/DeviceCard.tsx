import { Smartphone, Cuboid as Android, Cpu, Signal, Box, BatteryCharging, Globe, MapPin, Phone, ShieldCheck, Calendar, TabletSmartphone } from 'lucide-react';
import { InfoCard } from './InfoCard';
import { DeviceInfo } from './Device';

interface DeviceCardProps {
  device: DeviceInfo;
  onRefresh?: (deviceId: string) => void;
}

export function DeviceCard({ device }: DeviceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md  border border-gray-200 hover:shadow-lg transition-all duration-300">
      <div className="bg-gradient-to-r from-emerald-400 via-teal-600 to-cyan-600 p-6 flex items-center justify-between rounded-t-lg">
        <h2 className="text-2xl font-semibold text-white tracking-wide flex items-center gap-2 ">
        <img src="/smartphone1.png" className="w-16 h-15" alt="smartphone" />
          Device Info
        </h2>
      </div>

      <div className="space-y-2 divide-y divide-blue-200 p-6 ">
        <div className='space-y-2'>
          <InfoCard icon={TabletSmartphone} label='Brand' value={device.manufacturer} />
          <InfoCard icon={Smartphone} label="Model" value={device.model} />
          <InfoCard icon={Android} label="Android" value={device.androidVersion} />
          <InfoCard icon={Cpu} label="IMEI" value={device.imei} />
          <InfoCard icon={Signal} label="SIM Operator" value={device.simOperator} />
          <InfoCard icon={Box} label="App Version" value={device.appVersion} />
          <InfoCard icon={BatteryCharging} label="Battery Optimization" value={device.battery_optimization_enabled ? "Enabled" : "Disabled"} />
          <InfoCard icon={Globe} label="Internet Mode" value={device.internet_mode} />
          <InfoCard icon={MapPin} label="GPS Mode" value={device.gps_mode} />
          <InfoCard icon={Phone} label="Phone Number" value={device.phone_number} />
          <InfoCard icon={ShieldCheck} label="Rooted" value={device.rooted ? "Yes" : "No"} />
          <InfoCard icon={Calendar} label="Created At" value={new Date(device.createdAt).toLocaleString()} />
        </div>
      </div>
    </div>
  );
}