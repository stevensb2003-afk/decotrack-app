"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { Label } from '../ui/label';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface LocationMapProps {
  initialLocation: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

function PlacesAutocomplete({ 
  onSelect, 
  initialAddress 
}: { 
  onSelect: (details: {latitude: number, longitude: number, address: string} | null) => void, 
  initialAddress?: string 
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(initialAddress || '');
    const places = useMapsLibrary('places');

    useEffect(() => {
      setInputValue(initialAddress || '');
    }, [initialAddress]);

    useEffect(() => {
      if (!places || !inputRef.current) {
        return;
      }

      const autocomplete = new places.Autocomplete(inputRef.current, {
          fields: ['geometry.location', 'formatted_address']
      });

      const listener = autocomplete.addListener('place_changed', () => {
          const place: google.maps.places.PlaceResult = autocomplete.getPlace();
          
          if (place.geometry?.location) {
              const position = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
              };
              const address = place.formatted_address || '';
              setInputValue(address);
              onSelect({ latitude: position.lat, longitude: position.lng, address: address });
          } else {
              onSelect(null);
          }
      });

      return () => {
          if (window.google && google.maps && google.maps.event) {
              google.maps.event.clearInstanceListeners(autocomplete);
          }
      }
    }, [places, onSelect]);
    
    return (
        <div>
            <Label htmlFor="location-search" >Search for a location</Label>
            <Input 
                ref={inputRef} 
                id="location-search" 
                placeholder="e.g., 123 Main St, Anytown" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
            />
        </div>
    )
}

export default function LocationMap({ initialLocation, onLocationChange }: LocationMapProps) {
  const handleSelect = (details: {latitude: number, longitude: number, address: string} | null) => {
    if (details) {
        onLocationChange({
            address: details.address,
            latitude: details.latitude,
            longitude: details.longitude
        });
    }
  }

  return (
    <div className="space-y-4">
      <PlacesAutocomplete 
        initialAddress={initialLocation.address}
        onSelect={handleSelect} 
      />
      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm font-medium">Coordinates:</p>
        <p className="text-sm text-muted-foreground">
            Lat: {initialLocation.latitude?.toFixed(6) || 'N/A'}, Lng: {initialLocation.longitude?.toFixed(6) || 'N/A'}
        </p>
      </div>
    </div>
  );
}
