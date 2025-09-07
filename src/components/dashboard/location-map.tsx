
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useAdvancedMarkerRef
} from '@vis.gl/react-google-maps';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { useToast } from '@/hooks/use-toast';

interface LocationMapProps {
  initialLocation: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

const INITIAL_POSITION = { lat: 9.9281, lng: -84.0907 }; // San Jose, Costa Rica

export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  const [position, setPosition] = useState(initialLocation.latitude && initialLocation.longitude ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : INITIAL_POSITION);
  const [markerRef, marker] = useAdvancedMarkerRef();
  const map = useMap();
  const { toast } = useToast();

  useEffect(() => {
    if (initialLocation.latitude && initialLocation.longitude) {
      const newPos = { lat: initialLocation.latitude, lng: initialLocation.longitude };
      if (map) {
          map.moveCamera({ center: newPos, zoom: 15 });
      }
      if(position.lat !== newPos.lat || position.lng !== newPos.lng){
        setPosition(newPos);
      }
    }
  }, [initialLocation, map, position]);

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
  
  const handlePlaceSelect = (details: {position: google.maps.LatLngLiteral, address: string} | null) => {
      if (details) {
          if (map) {
              map.moveCamera({ center: details.position, zoom: 15 });
          }
          setPosition(details.position);
          onLocationChange({
              address: details.address,
              latitude: details.position.lat,
              longitude: details.position.lng
          });
      }
  }

  return (
    <div className="space-y-4">
      <PlacesAutocomplete onSelect={handlePlaceSelect} />

      <div style={{ height: '400px', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <Map
            defaultCenter={INITIAL_POSITION}
            defaultZoom={10}
            center={position}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
            gestureHandling={'greedy'}
            className="w-full h-full"
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
      <div>
        <p className="text-sm font-medium">Address:</p>
        <p className="text-sm text-muted-foreground">{initialLocation.address || 'Move the pin to set an address'}</p>
        <p className="text-sm font-medium mt-2">Coordinates:</p>
        <p className="text-sm text-muted-foreground">
            Lat: {initialLocation.latitude?.toFixed(6) || 'N/A'}, Lng: {initialLocation.longitude?.toFixed(6) || 'N/A'}
        </p>
      </div>
    </div>
  );
}

function PlacesAutocomplete({ onSelect }: { onSelect: (details: {position: google.maps.LatLngLiteral, address: string} | null) => void}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!inputRef.current || !window.google?.maps?.places) return;
        
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
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
            if (window.google?.maps?.event) {
                window.google.maps.event.clearInstanceListeners(autocomplete);
            }
        }

    }, [onSelect]);

    return (
        <div>
            <label htmlFor="location-search" className="text-sm font-medium">Search for a location</label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" />
        </div>
    )
}
