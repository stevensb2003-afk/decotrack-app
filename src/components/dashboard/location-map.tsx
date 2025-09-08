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


// The new, correct implementation of the Places Autocomplete component
function PlaceAutocomplete({ onPlaceSelect }: { onPlaceSelect: (place: google.maps.places.Place | null) => void }) {
    const places = useMapsLibrary('places');
    const inputRef = useRef<HTMLInputElement>(null);
    // The ref for the PlaceAutocompleteElement is not strictly needed for it to function,
    // but it's good practice if you needed to interact with it directly.
    const placeAutocompleteRef = useRef<any>(null);

    useEffect(() => {
        if (!places || !inputRef.current) {
            return;
        }

        // The PlaceAutocompleteElement is a web component, so we create it and
        // can interact with it via its DOM properties and events.
        const placeAutocomplete = new places.PlaceAutocompleteElement();
        
        // We assign the input element to the web component.
        placeAutocomplete.inputElement = inputRef.current;
        placeAutocompleteRef.current = placeAutocomplete;
        
        const listener = placeAutocomplete.addEventListener('gmp-placeselect', async ({ place }) => {
            await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location'] });
            onPlaceSelect(place);
        });

        // Append the element to the DOM. It is not visible.
        document.body.appendChild(placeAutocomplete);

        return () => {
            // It's important to remove the listener and the element on cleanup.
            // listener.remove(); // The new web component doesn't have a remove() on the listener handle.
            if (placeAutocompleteRef.current) {
                document.body.removeChild(placeAutocompleteRef.current);
            }
        }

    }, [places, onPlaceSelect]);

    return (
        <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" />
        </div>
    );
}


export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  const [address, setAddress] = useState(initialLocation.address || '');
  const [coordinates, setCoordinates] = useState({
    lat: initialLocation.latitude,
    lng: initialLocation.longitude,
  });
  

  const handlePlaceSelect = useCallback((place: google.maps.places.Place | null) => {
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
