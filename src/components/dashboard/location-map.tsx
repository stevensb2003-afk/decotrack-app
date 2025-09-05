

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';

interface LocationMapProps {
  location: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

export default function LocationMap({ location, onLocationChange }: LocationMapProps) {

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLocationChange({
        ...location,
        address: e.target.value
    });
  };

  return (
    <div className="space-y-4">
      <PlacesAutocomplete
        onSelect={(details) => {
          if (details) {
            onLocationChange({
                address: details.address,
                latitude: details.position.lat,
                longitude: details.position.lng
            });
          }
        }}
        currentAddress={location.address}
        onAddressChange={handleAddressChange}
      />
      <div>
        <p className="text-sm font-medium mt-2">Coordinates:</p>
        <p className="text-sm text-muted-foreground">
            Lat: {location.latitude?.toFixed(6) || 'N/A'}, Lng: {location.longitude?.toFixed(6) || 'N/A'}
        </p>
      </div>
    </div>
  );
}

interface PlacesAutocompleteProps {
    onSelect: (details: {position: google.maps.LatLngLiteral, address: string} | null) => void;
    currentAddress?: string;
    onAddressChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}


function PlacesAutocomplete({ onSelect, currentAddress, onAddressChange }: PlacesAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isGoogleReady, setIsGoogleReady] = useState(false);

    useEffect(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
            setIsGoogleReady(true);
        }
    }, []);


    useEffect(() => {
        if (!isGoogleReady || !inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ['geometry.location', 'formatted_address']
        });

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
                const position = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };
                onSelect({ position, address: place.formatted_address || '' });
            } else {
                onSelect(null);
            }
        });

        return () => {
            // Clean up the listener to prevent memory leaks
             if (window.google && window.google.maps) {
                google.maps.event.clearInstanceListeners(autocomplete);
            }
        };

    }, [isGoogleReady, onSelect]);

    return (
        <div>
            <Label htmlFor="location-search">Address</Label>
            <Input
                ref={inputRef}
                id="location-search"
                placeholder="Search for an address..."
                value={currentAddress || ''}
                onChange={onAddressChange}
                disabled={!isGoogleReady}
            />
            {!isGoogleReady && <p className="text-xs text-muted-foreground mt-1">Loading Google Maps...</p>}
        </div>
    )
}
