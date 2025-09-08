
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { Label } from '../ui/label';

interface LocationMapProps {
  initialLocation: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  const [address, setAddress] = useState(initialLocation.address || '');
  const [coordinates, setCoordinates] = useState({
    lat: initialLocation.latitude,
    lng: initialLocation.longitude,
  });

  const handleLocationSelect = useCallback((lat: number, lng: number, formattedAddress: string) => {
    setCoordinates({ lat, lng });
    setAddress(formattedAddress);
    onLocationChange({
      latitude: lat,
      longitude: lng,
      address: formattedAddress,
    });
  }, [onLocationChange]);

  // Update internal state if initialLocation prop changes from outside
  useEffect(() => {
    setAddress(initialLocation.address || '');
    setCoordinates({
      lat: initialLocation.latitude,
      lng: initialLocation.longitude,
    });
  }, [initialLocation]);

  return (
    <div className="space-y-4">
      <PlacesAutocomplete onSelect={handleLocationSelect} />

      <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
          <div>
            <p className="text-sm font-medium">Selected Address:</p>
            <p className="text-sm text-muted-foreground">{address || 'Search and select a location above'}</p>
          </div>
           <div>
            <p className="text-sm font-medium mt-2">Coordinates:</p>
            <p className="text-sm text-muted-foreground">
                Lat: {coordinates.lat?.toFixed(6) || 'N/A'}, Lng: {coordinates.lng?.toFixed(6) || 'N/A'}
            </p>
          </div>
      </div>
    </div>
  );
}

function PlacesAutocomplete({ onSelect }: { onSelect: (lat: number, lng: number, address: string) => void }) {
    const places = useMapsLibrary('places');
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (!places || !inputRef.current) return;

        // Use the legacy Autocomplete for now as PlaceAutocompleteElement is in beta and might require more setup
        const autocomplete = new places.Autocomplete(inputRef.current, {
            fields: ['geometry.location', 'formatted_address']
        });
        autocompleteRef.current = autocomplete;

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place.geometry?.location && place.formatted_address) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                onSelect(lat, lng, place.formatted_address);
            }
        });

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        }

    }, [places, onSelect]);

    return (
        <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" />
        </div>
    )
}
