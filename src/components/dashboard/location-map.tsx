"use client";

import { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Location } from '@/services/locationService';
import { Label } from '../ui/label';

// Componente de autocompletado refactorizado
function PlacesAutocomplete({ 
  onSelect, 
  initialAddress 
}: { 
  onSelect: (details: {placeId: string, address: string}) => void, 
  initialAddress?: string 
}) {
    const [input, setInput] = useState(initialAddress || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);

    useEffect(() => {
      // Este efecto se activa cuando el usuario escribe en el campo
      const handler = setTimeout(async () => {
        if (input.length > 2) {
          const response = await fetch('/api/places-autocomplete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ input }),
          });
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        } else {
          setSuggestions([]);
        }
      }, 300); // Espera 300ms antes de hacer la búsqueda

      return () => clearTimeout(handler);
    }, [input]);

    const handleSelectSuggestion = (suggestion: any) => {
        const address = suggestion.placePrediction.text.text;
        const placeId = suggestion.placePrediction.placeId;
        setInput(address);
        setSuggestions([]); // Oculta la lista de sugerencias
        onSelect({ placeId, address });
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
                <ul className="absolute z-10 w-full bg-background border rounded-md mt-1 shadow-lg">
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


// Componente principal
export default function LocationMap({ initialLocation, onLocationChange }: { initialLocation: Partial<Location>, onLocationChange: (location: Partial<Location>) => void }) {

    const handleSelect = (details: {placeId: string, address: string} | null) => {
        if (details) {
            // NOTA: La nueva API solo nos da la dirección y un Place ID.
            // Para obtener latitud y longitud, se necesitaría una segunda llamada
            // a la API "Place Details (New)" usando el placeId.
            // Por ahora, actualizamos la dirección.
            onLocationChange({
                address: details.address,
                // latitude y longitude se obtendrían en un paso posterior
            });
        }
    }

    return (
        <div className="space-y-4">
            <PlacesAutocomplete 
                initialAddress={initialLocation.address}
                onSelect={handleSelect} 
            />
            <div className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Address:</p>
                <p className="text-sm text-muted-foreground min-h-[1.25rem]">{initialLocation.address || 'Busca una dirección para verla aquí'}</p>
                {/* La visualización de coordenadas necesitaría ajustarse */}
            </div>
        </div>
    );
}
