
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
  initialLocation: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}

function PlacesAutocomplete({ 
  onSelect, 
  initialAddress 
}: { 
  onSelect: (details: {latitude: number, longitude: number, address: string} | null) => void, 
  initialAddress?: string 
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(initialAddress || '');

    useEffect(() => {
        setInputValue(initialAddress || '');
    }, [initialAddress]);

    useEffect(() => {
        if (!inputRef.current || typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
          return;
        }

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
                const address = place.formatted_address || '';
                setInputValue(address);
                onSelect({ latitude: position.lat, longitude: position.lng, address: address });
            } else {
                onSelect(null);
            }
        });

        return () => {
            if (window.google && window.google.maps) {
                google.maps.event.clearInstanceListeners(autocomplete);
            }
        }
    }, [onSelect]);
    
    return (
        <div>
            <Label htmlFor="location-search" >Search for a location</Label>
            <Input 
                ref={inputRef} 
                id="location-search" 
                placeholder="e.g., 123 Main St, Anytown" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
            />
        </div>
    )
}

const INITIAL_POSITION = { lat: 9.9281, lng: -84.0907 }; // San Jose, Costa Rica

export default function LocationMap({ initialLocation, onLocationChange }: LocationMapProps) {
  const [position, setPosition] = useState(initialLocation.latitude && initialLocation.longitude ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : INITIAL_POSITION);
  const [markerRef, marker] = useAdvancedMarkerRef();
  const map = useMap();
  const { toast } = useToast();

  useEffect(() => {
    if (initialLocation.latitude && initialLocation.longitude) {
      const newPos = { lat: initialLocation.latitude, lng: initialLocation.longitude };
      setPosition(newPos);
      map?.moveCamera({ center: newPos, zoom: 15 });
    }
  }, [initialLocation, map]);

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      const newPosition = { lat: newLat, lng: newLng };
      setPosition(newPosition);

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

  const handleSelect = (details: {latitude: number, longitude: number, address: string} | null) => {
    if (details) {
        const newPos = { lat: details.latitude, lng: details.longitude };
        setPosition(newPos);
        map?.moveCamera({center: newPos, zoom: 15});
        onLocationChange({
            address: details.address,
            latitude: details.latitude,
            longitude: details.longitude
        });
    }
  }

  return (
    <div className="space-y-4">
      <PlacesAutocomplete 
        initialAddress={initialLocation.address}
        onSelect={handleSelect} 
      />
      
      <div style={{ height: '400px', borderRadius: '0.5rem', overflow: 'hidden' }}>
        <Map
            defaultCenter={position}
            defaultZoom={10}
            center={position}
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID'}
            gestureHandling={'greedy'}
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

      <div className="p-4 border rounded-lg bg-muted/50">
        <p className="text-sm font-medium">Address:</p>
        <p className="text-sm text-muted-foreground min-h-[1.25rem]">{initialLocation.address || 'Search for a location to populate address'}</p>
        <p className="text-sm font-medium mt-2">Coordinates:</p>
        <p className="text-sm text-muted-foreground">
            Lat: {initialLocation.latitude?.toFixed(6) || 'N/A'}, Lng: {initialLocation.longitude?.toFixed(6) || 'N/A'}
        </p>
      </div>
    </div>
  );
}