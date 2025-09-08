
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
import { Label } from '../ui/label';

interface LocationMapProps {
  location: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

const INITIAL_POSITION = { lat: 9.9281, lng: -84.0907 }; // San Jose, Costa Rica

export default function LocationMap({ location, onLocationChange }: LocationMapProps) {
  const [position, setPosition] = useState(location.latitude && location.longitude ? { lat: location.latitude, lng: location.longitude } : INITIAL_POSITION);
  const [markerRef, marker] = useAdvancedMarkerRef();
  const map = useMap();
  const { toast } = useToast();

  useEffect(() => {
    if (location.latitude && location.longitude) {
      const newPos = { lat: location.latitude, lng: location.longitude };
      setPosition(newPos);
      map?.moveCamera({ center: newPos, zoom: 15 });
    }
  }, [location, map]);

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

  return (
    <div className="space-y-4">
      <PlacesAutocomplete onSelect={(details) => {
        if (details) {
            setPosition(details.position);
            map?.moveCamera({ center: details.position, zoom: 15 });
            onLocationChange({
                address: details.address,
                latitude: details.position.lat,
                longitude: details.position.lng
            });
        }
      }} />

      <div style={{ height: '300px', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <Map
            defaultCenter={position}
            defaultZoom={10}
            center={position}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
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
      <div>
        <p className="text-sm font-medium">Selected Address:</p>
        <p className="text-sm text-muted-foreground">{location.address || 'Move the pin or search to set an address'}</p>
        <p className="text-sm font-medium mt-2">Coordinates:</p>
        <p className="text-sm text-muted-foreground">
            Lat: {location.latitude?.toFixed(6) || 'N/A'}, Lng: {location.longitude?.toFixed(6) || 'N/A'}
        </p>
      </div>
    </div>
  );
}

function PlacesAutocomplete({ onSelect }: { onSelect: (details: {position: google.maps.LatLngLiteral, address: string} | null) => void}) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!window.google || !inputRef.current) return;

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
            if (window.google) {
                 google.maps.event.removeListener(listener);
            }
        }

    }, [onSelect]);

    return (
        <div>
            <Label htmlFor="location-search">Search for a location</Label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" />
        </div>
    )
}
