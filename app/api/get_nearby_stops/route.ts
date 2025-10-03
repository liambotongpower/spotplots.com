import { NextRequest, NextResponse } from 'next/server';
import { getNearbyStops, getNearbyStopsManual } from '../../lib/get_nearby_stops';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get query parameters
  const lat = parseFloat(searchParams.get('lat') || '');
  const lng = parseFloat(searchParams.get('lng') || '');
  const maxDistance = parseInt(searchParams.get('maxDistance') || '1000');
  const limit = parseInt(searchParams.get('limit') || '50');
  const useManual = searchParams.get('useManual') === 'true';

  // Validate required parameters
  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required and must be valid numbers' },
      { status: 400 }
    );
  }

  // Validate coordinate ranges
  if (lat < -90 || lat > 90) {
    return NextResponse.json(
      { error: 'Latitude must be between -90 and 90' },
      { status: 400 }
    );
  }

  if (lng < -180 || lng > 180) {
    return NextResponse.json(
      { error: 'Longitude must be between -180 and 180' },
      { status: 400 }
    );
  }

  // Validate optional parameters
  if (maxDistance < 0 || maxDistance > 10000) {
    return NextResponse.json(
      { error: 'Max distance must be between 0 and 10000 meters' },
      { status: 400 }
    );
  }

  if (limit < 1) {
    return NextResponse.json(
      { error: 'Limit must be at least 1' },
      { status: 400 }
    );
  }

  try {
    console.log(`🔍 Searching for nearby stops: ${lat}, ${lng} (${maxDistance}m)`);

    // Call the appropriate function based on the useManual parameter
    const stops = useManual 
      ? await getNearbyStopsManual({ lat, lng, maxDistance, limit })
      : await getNearbyStops({ lat, lng, maxDistance, limit });

    console.log(`✅ Found ${stops.length} nearby stops`);

    return NextResponse.json({
      success: true,
      query: {
        lat,
        lng,
        maxDistance,
        limit,
        method: useManual ? 'manual' : 'geospatial'
      },
      results: {
        count: stops.length,
        stops
      }
    });

  } catch (error) {
    console.error('❌ Error fetching nearby stops:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch nearby stops',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
