
"use client";

import { useState, useEffect } from 'react';
import { Location } from '@/services/locationService';
import { Label } from '../ui/label';
import GooglePlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-google-places-autocomplete';

interface LocationMapProps {
  initialLocation: Partial<Location>;
  onLocationChange: (location: Partial<Location>) => void;
}


export default function LocationMap({ onLocationChange, initialLocation }: LocationMapProps) {
  const [address, setAddress] = useState<any>(null);

  // Update internal state if initialLocation prop changes from outside
  useEffect(() => {
    if (initialLocation.address) {
        setAddress({ label: initialLocation.address, value: { description: initialLocation.address } });
    } else {
        setAddress(null);
    }
  }, [initialLocation]);

  const handleSelect = async (selected: any) => {
    setAddress(selected);
    if (selected && selected.label) {
        try {
            const results = await geocodeByAddress(selected.label);
            const { lat, lng } = await getLatLng(results[0]);
            onLocationChange({
                address: selected.label,
                latitude: lat,
                longitude: lng
            });
        } catch (error) {
            console.error('Error fetching coordinates: ', error);
        }
    }
  }

  return (
    <div className="space-y-4">
       <div>
            <Label htmlFor="location-search">Search for a location</Label>
             <GooglePlacesAutocomplete
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
                selectProps={{
                    value: address,
                    onChange: handleSelect,
                    placeholder: 'e.g., 123 Main St, Anytown',
                    styles: {
                        input: (provided) => ({
                            ...provided,
                            color: 'hsl(var(--foreground))',
                            backgroundColor: 'hsl(var(--background))',
                        }),
                        option: (provided) => ({
                            ...provided,
                            backgroundColor: 'hsl(var(--background))',
                             color: 'hsl(var(--foreground))',
                        }),
                        singleValue: (provided) => ({
                            ...provided,
                             color: 'hsl(var(--foreground))',
                        }),
                        control: (provided) => ({
                            ...provided,
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--input))',
                        }),
                        menu: (provided) => ({
                            ...provided,
                             backgroundColor: 'hsl(var(--background))',
                        }),
                    }
                }}
            />
       </div>

      <div className="p-4 border rounded-lg space-y-2 bg-muted/50">
          <div>
            <p className="text-sm font-medium">Selected Address:</p>
            <p className="text-sm text-muted-foreground">{initialLocation.address || 'Search and select a location above'}</p>
          </div>
           <div>
            <p className="text-sm font-medium mt-2">Coordinates:</p>
            <p className="text-sm text-muted-foreground">
                Lat: {initialLocation.latitude?.toFixed(6) || 'N/A'}, Lng: {initialLocation.longitude?.toFixed(6) || 'N/A'}
            </p>
          </div>
      </div>
    </div>
  );
}
