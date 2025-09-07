
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

export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {

  return (
    <div className="space-y-4">
      <PlacesAutocomplete
        onLocationSelect={onLocationChange}
        initialAddress={initialLocation.address}
      />
      <div>
        <p className="text-sm font-medium mt-2">Coordinates:</p>
        <p className="text-sm text-muted-foreground">
            Lat: {initialLocation.latitude?.toFixed(6) || 'N/A'}, Lng: {initialLocation.longitude?.toFixed(6) || 'N/A'}
        </p>
      </div>
    </div>
  );
}

interface PlacesAutocompleteProps {
    onLocationSelect: (details: Partial<Location>) => void;
    initialAddress?: string;
}

function PlacesAutocomplete({ onLocationSelect, initialAddress }: PlacesAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(initialAddress || '');
    const places = useMapsLibrary('places');

    useEffect(() => {
        if (initialAddress !== inputValue) {
            setInputValue(initialAddress || '');
        }
    }, [initialAddress]);

    useEffect(() => {
        if (!places || !inputRef.current) return;

        const autocomplete = new places.Autocomplete(inputRef.current, {
            fields: ['geometry.location', 'formatted_address']
        });

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
                const newLocation: Partial<Location> = {
                    address: place.formatted_address || '',
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng(),
                };
                setInputValue(newLocation.address!);
                onLocationSelect(newLocation);
            }
        });

        return () => {
            if (window.google?.maps?.event) {
                google.maps.event.clearInstanceListeners(autocomplete);
            }
        };

    }, [places, onLocationSelect]);
    
    return (
        <div>
            <Label htmlFor="location-search">Address</Label>
            <Input
                ref={inputRef}
                id="location-search"
                placeholder="Search for an address..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!places}
            />
            {!places && <p className="text-xs text-muted-foreground mt-1">Loading Google Maps service...</p>}
        </div>
    )
}
