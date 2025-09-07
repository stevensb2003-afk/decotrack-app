"use client";

import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface LocationMapProps {
  initialLocation: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    let parsedValue: string | number = value;
    if (id === 'latitude' || id === 'longitude') {
      parsedValue = parseFloat(value) || 0;
    }
    onLocationChange({ [id]: parsedValue });
  }

  return (
    <div className="space-y-4">
       <div>
            <Label htmlFor="address">Address</Label>
            <Textarea 
                id="address" 
                value={initialLocation.address || ''} 
                onChange={handleChange}
                placeholder="e.g., 123 Main St, San Jose, Costa Rica"
            />
        </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input 
                id="latitude"
                type="number"
                value={initialLocation.latitude || ''}
                onChange={handleChange}
                placeholder="e.g., 9.9347"
            />
        </div>
        <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input 
                id="longitude"
                type="number"
                value={initialLocation.longitude || ''}
                onChange={handleChange}
                placeholder="e.g., -84.0875"
            />
        </div>
      </div>
    </div>
  );
}
