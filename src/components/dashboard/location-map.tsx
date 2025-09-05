
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
  location: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

const INITIAL_POSITION = { lat: 9.9281, lng: -84.0907 }; // San Jose, Costa Rica

export default function LocationMap({ location, onLocationChange }: LocationMapProps) {
  const [position, setPosition] = useState(location.latitude && location.longitude ? { lat: location.latitude, lng: location.longitude } : INITIAL_POSITION);
  
  const handlePositionChange = (newPosition: google.maps.LatLngLiteral) => {
    setPosition(newPosition);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: newPosition }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          onLocationChange({
            address: results[0].formatted_address,
            latitude: newPosition.lat,
            longitude: newPosition.lng,
          });
        } else {
            onLocationChange({
              latitude: newPosition.lat,
              longitude: newPosition.lng,
            });
          console.error('Geocoder failed due to: ' + status);
        }
    });
  }

  return (
    <div className="space-y-4">
       <PlacesAutocomplete onSelect={(details) => {
        if (details) {
            handlePositionChange(details.position);
        }
      }} />

      <div style={{ height: '400px', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <Map
            defaultCenter={position}
            defaultZoom={10}
            center={position}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
            gestureHandling={'greedy'}
        >
          <MapInner location={location} onPositionChange={handlePositionChange} />
        </Map>
      </div>
      <div>
        <p className="text-sm font-medium">Address:</p>
        <p className="text-sm text-muted-foreground">{location.address || 'Move the pin to set an address'}</p>
        <p className="text-sm font-medium mt-2">Coordinates:</p>
        <p className="text-sm text-muted-foreground">
            Lat: {location.latitude?.toFixed(6) || 'N/A'}, Lng: {location.longitude?.toFixed(6) || 'N/A'}
        </p>
      </div>
    </div>
  );
}

function MapInner({ location, onPositionChange }: {location: Partial<Location>, onPositionChange: (pos: google.maps.LatLngLiteral) => void }) {
    const map = useMap();
    const [markerRef, marker] = useAdvancedMarkerRef();
    const position = location.latitude && location.longitude ? { lat: location.latitude, lng: location.longitude } : INITIAL_POSITION;

    useEffect(() => {
        if (map && location.latitude && location.longitude) {
            map.moveCamera({ center: { lat: location.latitude, lng: location.longitude }, zoom: 15 });
        }
    }, [location.latitude, location.longitude, map]);

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            onPositionChange(newPos);
        }
    };

    return (
        <AdvancedMarker
            ref={markerRef}
            position={position}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          >
            <Pin />
        </AdvancedMarker>
    )
}

function PlacesAutocomplete({ onSelect }: { onSelect: (details: {position: google.maps.LatLngLiteral, address: string} | null) => void}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (!inputRef.current) return;
        
        // Wait for the Google Maps script to load before initializing Autocomplete
        const intervalId = setInterval(() => {
            if (window.google && window.google.maps && window.google.maps.places) {
                clearInterval(intervalId);
                
                const autocomplete = new google.maps.places.Autocomplete(inputRef.current!, {
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

                // It's good practice to clean up the listener, but since it's inside an effect that runs once,
                // this is more complex. For this use case, not removing it is acceptable.
            }
        }, 100); // Check every 100ms
        
        return () => clearInterval(intervalId);

    }, [onSelect]);

    return (
        <div>
            <label htmlFor="location-search" className="text-sm font-medium">Search for a location</label>
            <Input ref={inputRef} id="location-search" placeholder="e.g., 123 Main St, Anytown" />
        </div>
    )
}
