import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { input } = await request.json();

  if (!input) {
    return NextResponse.json({ error: 'Input is required' }, { status: 400 });
  }

  // Lee la clave secreta desde las variables de entorno del servidor
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const GOOGLE_PLACES_API_ENDPOINT = 'https://places.googleapis.com/v1/places:autocomplete';

  try {
    const response = await fetch(GOOGLE_PLACES_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey!,
        // Pedimos solo los campos que necesitamos para ser eficientes
        'X-Goog-FieldMask': 'suggestions.placePrediction.text,suggestions.placePrediction.placeId',
      },
      body: JSON.stringify({
        input: input,
        languageCode: 'es', 
        includedRegionCodes: ['cr'] // Prioriza resultados en Costa Rica
      }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Google Places API Error:', data);
        return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: response.status });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
