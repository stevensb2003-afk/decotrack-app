
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useAdvancedMarkerRef,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

interface LocationMapProps {
  onLocationChange: (location: Partial<Location>) => void;
  initialLocation?: Partial<Location>;
}

const INITIAL_POSITION = { lat: 9.9281, lng: -84.0907 }; // San Jose, Costa Rica

export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  const [position, setPosition] = useState(INITIAL_POSITION);
  const [markerRef, marker] = useAdvancedMarkerRef();
  const map = useMap();
  const { toast } = useToast();

  useEffect(() => {
    if (initialLocation?.latitude && initialLocation?.longitude) {
      const newPos = { lat: initialLocation.latitude, lng: initialLocation.longitude };
      setPosition(newPos);
      if(map) {
        map.moveCamera({ center: newPos, zoom: 15 });
      }
    }
  }, [initialLocation, map]);

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      setPosition({ lat: newLat, lng: newLng });

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: e.latLng }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          onLocationChange({
            address: results[0].formatted_address,
            latitude: newLat,
            longitude: newLng,
          });
        } else {
            onLocationChange({
              latitude: newLat,
              longitude: newLng,
            });
          console.error('Geocoder failed due to: ' + status);
          toast({ title: "Reverse Geocoding Failed", description: "Could not fetch address for the selected point.", variant: "destructive"})
        }
      });
    }
  };

  const handlePlaceSelect = useCallback((details: {position: google.maps.LatLngLiteral, address: string} | null) => {
    if (details) {
        setPosition(details.position);
        map?.moveCamera({ center: details.position, zoom: 15 });
        onLocationChange({
            address: details.address,
            latitude: details.position.lat,
            longitude: details.position.lng
        });
    }
  }, [map, onLocationChange]);

  return (
    <div className="space-y-4">
      <PlacesAutocomplete onSelect={handlePlaceSelect} initialAddress={initialLocation?.address} />

      <div style={{ height: '300px', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <Map
            defaultCenter={position}
            defaultZoom={10}
            center={position}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
        >
          <AdvancedMarker
            ref={markerRef}
            position={position}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          >
            <Pin />
          </AdvancedMarker>
        </Map>
      </div>
    </div>
  );
}

function PlacesAutocomplete({ onSelect, initialAddress }: { onSelect: (details: {position: google.maps.LatLngLiteral, address: string} | null) => void, initialAddress?: string}) {
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
                onSelect({ position: newPosition, address: place.formatted_address });
            } else {
                onSelect(null);
            }
        });

        return () => {
          if (window.google) {
            google.maps.event.removeListener(listener);
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
