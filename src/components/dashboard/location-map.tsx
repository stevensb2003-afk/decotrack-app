
"use client";

import { useRef, useEffect, useCallback, useState } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Location } from '@/services/locationService';
import { useMapsLibrary } from '@vis.gl/react-google-maps';


interface LocationMapProps {
  onLocationChange: (location: Partial<Location>) => void;
  initialLocation?: Partial<Location>;
}

export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const places = useMapsLibrary('places');
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (initialLocation?.address && inputRef.current) {
            inputRef.current.value = initialLocation.address;
        }
    }, [initialLocation]);

    useEffect(() => {
        if (!places || !inputRef.current) {
            return;
        }

        const newAutocomplete = new places.Autocomplete(inputRef.current, {
            fields: ['formatted_address', 'geometry.location']
        });
        setAutocomplete(newAutocomplete);
    
    }, [places]);

    useEffect(() => {
        if (!autocomplete) return;

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location) {
                const newLocation: Partial<Location> = {
                    address: place.formatted_address,
                    latitude: place.geometry.location.lat(),
                    longitude: place.geometry.location.lng(),
                };
                onLocationChange(newLocation);
                if (inputRef.current && place.formatted_address) {
                    inputRef.current.value = place.formatted_address;
                }
            }
        });

        return () => {
            if (window.google) {
                google.maps.event.removeListener(listener);
            }
        };
    }, [autocomplete, onLocationChange]);

    return (
        <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input 
                ref={inputRef} 
                id="location-search" 
                placeholder="e.g., 123 Main St, Anytown"
                defaultValue={initialLocation?.address || ''} 
            />
        </div>
    );
}
