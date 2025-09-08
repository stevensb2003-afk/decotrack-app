
"use client";

import { useState, useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Location } from '@/services/locationService';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface LocationMapProps {
  initialLocation: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  const map = useMap();
  const places = useMapsLibrary('places');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const ac = new places.Autocomplete(inputRef.current, {
        fields: ["geometry.location", "formatted_address"],
    });
    
    ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        if (place.geometry?.location && place.formatted_address) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            
            onLocationChange({
                address: place.formatted_address,
                latitude: lat,
                longitude: lng
            });

            if (map) {
                map.moveCamera({ center: {lat, lng}, zoom: 15 });
            }
        }
    });

    setAutocomplete(ac);

  }, [places, map, onLocationChange]);

  return (
     <div className="space-y-4">
       <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" defaultValue={initialLocation?.address}/>
       </div>

      <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
          <div>
            <p className="text-sm font-medium">Selected Address:</p>
            <p className="text-sm text-muted-foreground">{initialLocation.address || 'Search and select a location above'}</p>
          </div>
           <div>
            <p className="text-sm font-medium mt-2">Coordinates:</p>
            <p className="text-sm text-muted-foreground">
                Lat: {initialLocation.latitude?.toFixed(6) || 'N/A'}, Lng: {initialLocation.longitude?.toFixed(6) || 'N/A'}
            </p>
          </div>
      </div>
    </div>
  );
}