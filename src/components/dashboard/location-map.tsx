
"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { Label } from '../ui/label';

interface LocationMapProps {
  location: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

export default function LocationMap({ location, onLocationChange }: LocationMapProps) {

  return (
    <div className="space-y-4">
      <PlacesAutocomplete
        onLocationSelect={onLocationChange}
        initialLocation={location}
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
    onLocationSelect: (details: Partial<Location>) => void;
    initialLocation: Partial<Location>;
}


function PlacesAutocomplete({ onLocationSelect, initialLocation }: PlacesAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(initialLocation.address || '');
    const [isGoogleReady, setIsGoogleReady] = useState(false);

    useEffect(() => {
        setInputValue(initialLocation.address || '');
    }, [initialLocation.address]);

    useEffect(() => {
        const checkGoogle = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setIsGoogleReady(true);
            } else {
                setTimeout(checkGoogle, 100); // Check again shortly
            }
        };
        checkGoogle();
    }, []);


    useEffect(() => {
        if (!isGoogleReady || !inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
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
            if (window.google && autocomplete) {
                // Using a try-catch block as clearInstanceListeners can sometimes throw errors
                // if the component unmounts unexpectedly.
                try {
                    google.maps.event.clearInstanceListeners(autocomplete);
                } catch (e) {
                    console.error("Error clearing autocomplete listeners", e);
                }
            }
        };

    }, [isGoogleReady, onLocationSelect]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        // Also update parent but only with address, coords become stale
        onLocationSelect({
            ...initialLocation,
            address: e.target.value,
        });
    }

    return (
        <div>
            <Label htmlFor="location-search">Address</Label>
            <Input
                ref={inputRef}
                id="location-search"
                placeholder="Search for an address..."
                value={inputValue}
                onChange={handleInputChange}
                disabled={!isGoogleReady}
            />
            {!isGoogleReady && <p className="text-xs text-muted-foreground mt-1">Loading Google Maps...</p>}
        </div>
    )
}
