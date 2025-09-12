"use client";

import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

function PlacesAutocomplete({ 
  onSelect,
  initialAddress,
}: { 
  onSelect: (placeId: string) => void;
  initialAddress?: string;
}) {
    const [input, setInput] = useState(initialAddress || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        setInput(initialAddress || '');
    }, [initialAddress]);

    useEffect(() => {
      const handler = setTimeout(async () => {
        if (input.length > 2) {
          try {
            const response = await fetch('/api/places-autocomplete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ input }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to fetch suggestions");
            }
            const data = await response.json();
            setSuggestions(data.suggestions || []);
          } catch (error) {
            console.error("Error fetching places autocomplete:", error);
            toast({
                title: 'Autocomplete Error',
                description: (error as Error).message || 'Could not fetch address suggestions.',
                variant: 'destructive'
            });
            setSuggestions([]);
          }
        } else {
          setSuggestions([]);
        }
      }, 300);

      return () => clearTimeout(handler);
    }, [input, toast]);

    const handleSelectSuggestion = (suggestion: any) => {
        const address = suggestion.placePrediction.text.text;
        const placeId = suggestion.placePrediction.placeId;
        setInput(address);
        setSuggestions([]);
        onSelect(placeId);
    };

    return (
        <div className="relative">
            <Label htmlFor="location-search">Search for a location</Label>
            <Input 
                id="location-search" 
                placeholder="e.g., 123 Main St, Anytown" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoComplete="off"
            />
            {suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-background border rounded-md mt-1 shadow-lg">
                    {suggestions.map((s) => (
                        <li 
                            key={s.placePrediction.placeId} 
                            onClick={() => handleSelectSuggestion(s)}
                            className="p-2 hover:bg-muted cursor-pointer"
                        >
                            {s.placePrediction.text.text}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export default function LocationMap({ initialLocation, onLocationChange }: { initialLocation: Partial<Location>, onLocationChange: (location: Partial<Location>) => void }) {
  const { toast } = useToast();

  const handlePlaceSelect = async (placeId: string) => {
      try {
          const response = await fetch('/api/place-details', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ placeId }),
          });
          if (!response.ok) throw new Error("Failed to fetch place details");

          const details = await response.json();

          onLocationChange({
              address: details.address,
              latitude: details.latitude,
              longitude: details.longitude,
          });

      } catch (error) {
          console.error("Error fetching place details:", error);
          toast({ title: "Error", description: "Could not retrieve details for the selected location.", variant: "destructive" });
      }
  };

  return (
    <div className="space-y-4">
        <PlacesAutocomplete 
            initialAddress={initialLocation.address}
            onSelect={handlePlaceSelect} 
        />
        <div>
            <p className="text-sm text-muted-foreground">
                Lat: {initialLocation.latitude?.toFixed(6) || 'N/A'}, Lng: {initialLocation.longitude?.toFixed(6) || 'N/A'}
            </p>
        </div>
    </div>
  );
}
