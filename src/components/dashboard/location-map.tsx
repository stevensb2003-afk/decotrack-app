
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

// The new, correct implementation of the Places Autocomplete component
function PlaceAutocomplete({ onPlaceSelect }: { onPlaceSelect: (place: google.maps.places.Place | null) => void }) {
    const places = useMapsLibrary('places');
    const inputRef = useRef<HTMLInputElement>(null);
    const placeAutocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement>(null);

    useEffect(() => {
        if (!places || !inputRef.current || !placeAutocompleteRef.current) {
            return;
        }

        const placeAutocomplete = new places.PlaceAutocompleteElement({
            inputElement: inputRef.current,
        });

        const listener = placeAutocomplete.addListener('gmp-placeselect', async ({ place }) => {
            await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
            onPlaceSelect(place);
        });

        return () => {
            listener.remove();
        }

    }, [places, onPlaceSelect]);

    return (
        <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" />
            <div ref={placeAutocompleteRef}></div>
        </div>
    );
}


export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  const [address, setAddress] = useState(initialLocation.address || '');
  const [coordinates, setCoordinates] = useState({
    lat: initialLocation.latitude,
    lng: initialLocation.longitude,
  });
  

  const handlePlaceSelect = (place: google.maps.places.Place | null) => {
    if (place && place.location && place.formattedAddress) {
      const lat = place.location.lat();
      const lng = place.location.lng();
      setAddress(place.formattedAddress);
      setCoordinates({ lat, lng });

      onLocationChange({
        latitude: lat,
        longitude: lng,
        address: place.formattedAddress,
      });
    }
  }

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
      <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} />

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
