import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { ChevronRight, } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
  id: number;
  name?: string;
  latitude: number;
  longitude: number;
  timestamp?: string;
}

interface LocationMapProps {
  locations: Location[];
}

export function LocationMap({ locations }: LocationMapProps) {

  const latest = locations?.[locations.length - 1];
  const center: [number, number] = latest
    ? [latest.latitude, latest.longitude]
    : [28.6139, 77.2090]; // Fallback to New Delhi

  return (
    <div className="bg-green-50 rounded-lg shadow-sm relative p-2">
      <div className="flex items-center justify-between p-2  z-[1000]">
        <h2 className="text-lg font-medium text-gray-900">Latest Location</h2>
        <Button className="bg-blue-400 hover:bg-blue-500 text-white flex items-center gap-1 text-sm cursor-pointer">
          View All <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="h-[400px] relative z-[1]">
        <MapContainer
          center={center}
          zoom={12}
          className="h-full w-full"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
            >
              <Popup>
                <div className="p-2">
                  <p className="font-medium">{location.name || 'Unknown Location'}</p>
                  <p className="text-sm text-gray-500">{location.timestamp}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* <div className="divide-y z-[1000]">
        {locations.map((location) => (
          <div key={location.id} className="flex items-center gap-4 p-4">
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-900 truncate max-w-[300px]">
                  {location.name}
                </p>
                <p className="text-xs text-gray-400">{location.timestamp}</p>
              </div>
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
}