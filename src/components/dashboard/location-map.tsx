
"use client";

import { useRef, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Location } from '@/services/locationService';

interface LocationMapProps {
  onLocationChange: (location: Partial<Location>) => void;
}

export default function LocationMap({ onLocationChange }: LocationMapProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handlePlaceSelect = useCallback((place: google.maps.places.PlaceResult) => {
        if (place.geometry?.location) {
            const newLocation: Partial<Location> = {
                address: place.formatted_address,
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
            };
            onLocationChange(newLocation);
             if (inputRef.current) {
                inputRef.current.value = place.formatted_address || '';
            }
        }
    }, [onLocationChange]);

    useEffect(() => {
        if (!inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
            fields: ['formatted_address', 'geometry.location']
        });

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            handlePlaceSelect(place);
        });

        return () => {
            if (window.google) {
                google.maps.event.removeListener(listener);
            }
        };

    }, [handlePlaceSelect]);

    return (
        <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" />
        </div>
    );
}
