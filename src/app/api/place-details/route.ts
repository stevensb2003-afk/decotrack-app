
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { placeId } = await request.json();

  if (!placeId) {
    return NextResponse.json({ error: 'Place ID is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const GOOGLE_DETAILS_API_ENDPOINT = `https://places.googleapis.com/v1/places/${placeId}`;
  
  const fields = "location,formattedAddress";

  try {
    const response = await fetch(`${GOOGLE_DETAILS_API_ENDPOINT}?fields=${fields}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey!,
      },
    });

    const data = await response.json();

    if (!response.ok) {
        console.error('Google Place Details API Error:', data);
        return NextResponse.json({ error: 'Failed to fetch place details' }, { status: response.status });
    }

    const result = {
        latitude: data.location.latitude,
        longitude: data.location.longitude,
        address: data.formattedAddress,
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Internal Server Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
