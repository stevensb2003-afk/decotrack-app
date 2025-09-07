"use client";

import { useState, useEffect, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { Label } from '../ui/label';

interface LocationMapProps {
  initialLocation: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  const handlePlaceSelect = (details: {position: google.maps.LatLngLiteral, address: string} | null) => {
      if (details) {
          onLocationChange({
              address: details.address,
              latitude: details.position.lat,
              longitude: details.position.lng
          });
      }
  }

  return (
    <div className="space-y-4">
      <PlacesAutocomplete onSelect={handlePlaceSelect} />
      
      <div className="p-4 border rounded-md bg-muted/50">
        <p className="text-sm font-medium">Selected Address:</p>
        <p className="text-sm text-muted-foreground min-h-[1.25rem]">
            {initialLocation.address || 'Search for a location above.'}
        </p>
        <p className="text-sm font-medium mt-2">Coordinates:</p>
        <p className="text-sm text-muted-foreground">
            Lat: {initialLocation.latitude?.toFixed(6) || 'N/A'}, Lng: {initialLocation.longitude?.toFixed(6) || 'N/A'}
        </p>
      </div>
    </div>
  );
}

function PlacesAutocomplete({ onSelect }: { onSelect: (details: {position: google.maps.LatLngLiteral, address: string} | null) => void}) {
    const places = useMapsLibrary('places');
    const inputRef = useRef<HTMLInputElement>(null);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (!places || !inputRef.current) return;

        const ac = new places.Autocomplete(inputRef.current, {
            fields: ['geometry.location', 'formatted_address']
        });
        
        setAutocomplete(ac);

    }, [places]);

    useEffect(() => {
        if (!autocomplete) return;

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location && place.formatted_address) {
                const position = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };
                onSelect({ position, address: place.formatted_address });
            } else {
                onSelect(null);
            }
        });
        
        return () => {
            if (window.google?.maps?.event) {
                window.google.maps.event.clearInstanceListeners(autocomplete);
            }
        }
    }, [autocomplete, onSelect]);


    return (
        <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" />
        </div>
    )
}
