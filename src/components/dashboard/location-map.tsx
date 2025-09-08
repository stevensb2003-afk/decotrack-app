

"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface PlacesAutocompleteProps {
    onSelect: (details: { address: string, latitude: number, longitude: number } | null) => void;
    initialAddress?: string;
}

export function PlacesAutocomplete({ onSelect, initialAddress }: PlacesAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const places = useMapsLibrary('places');
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (initialAddress && inputRef.current) {
            inputRef.current.value = initialAddress;
        }
    }, [initialAddress]);

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
                const newPosition = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                };
                onSelect({
                    address: place.formatted_address,
                    latitude: newPosition.lat,
                    longitude: newPosition.lng
                });
            } else {
                onSelect(null);
            }
        });

        return () => {
          if (window.google) {
            google.maps.event.clearInstanceListeners(autocomplete);
          }
        };

    }, [autocomplete, onSelect]);

    return (
        <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input 
              ref={inputRef} 
              id="location-search" 
              placeholder="e.g., 123 Main St, Anytown"
              defaultValue={initialAddress || ''}
            />
        </div>
    )
}
