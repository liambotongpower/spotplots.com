import { NextRequest, NextResponse } from 'next/server';
import { getNearbyStopTimes, getNearbyStopTimesManual } from '../../lib/get_nearby_stop_times';

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
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚌 API: Searching for nearby stop times...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📍 API: Location: ${lat}, ${lng}`);
    console.log(`📏 API: Max distance: ${maxDistance}m`);
    console.log(`🔢 API: Limit: ${limit} results`);
    console.log(`⚙️ API: Method: ${useManual ? 'Manual calculation' : 'MongoDB geospatial'}`);

    console.log('🔍 API: Database connection information:');
    try {
      const mongoose = (await import('mongoose')).default;
      console.log(`🔍 API: Mongoose readyState: ${mongoose.connection.readyState}`);
      console.log(`🔍 API: Connected to: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
    } catch (err) {
      console.error('❌ API: Error checking mongoose connection:', err);
    }
    
    // Call the appropriate function based on the useManual parameter
    console.log(`🔍 API: Calling ${useManual ? 'getNearbyStopTimesManual' : 'getNearbyStopTimes'} function...`);
    const result = useManual 
      ? await getNearbyStopTimesManual({ lat, lng, maxDistance, limit })
      : await getNearbyStopTimes({ lat, lng, maxDistance, limit });

    console.log(`✅ API: Found ${result.stops.length} nearby stops with ${result.totalDepartures} total departures`);
    
    // Debug stop IDs and departures
    console.log('🔍 API: First 5 stops with departure counts:');
    result.stops.slice(0, 5).forEach((stop, idx) => {
      console.log(`   ${idx+1}. ${stop.stop_name} (ID: ${stop.stop_id}): ${stop.departures_count} departures`);
    });

    // Log the results to console for debugging
    if (result.stops.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🚌 NEARBY TRANSPORT STOPS WITH DEPARTURES');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      result.stops.forEach((stop, index) => {
        console.log(`${index + 1}. ${stop.stop_name}`);
        console.log(`   ID: ${stop.stop_id} | Code: ${stop.stop_code}`);
        console.log(`   Location: ${stop.stop_lat}, ${stop.stop_lon}`);
        console.log(`   Distance: ${stop.distance}m`);
        console.log(`   Departures: ${stop.departures_count}`);
        console.log('');
      });
      console.log(`Total departures within ${maxDistance}m: ${result.totalDepartures}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ No stops found within the specified range');
    }

    // Extract total scheduled departures for debugging if available
    const totalScheduledDepartures = result.stops.reduce(
      (sum, stop) => sum + (stop.total_departures || 0),
      0
    );
    
    console.log(`⚠️ API: Note that departure counts represent daily averages (total divided by 7)`);
    console.log(`ℹ️ API: Total scheduled departures across all timetables: ${totalScheduledDepartures}`);
    console.log(`ℹ️ API: Average daily departures: ${result.totalDepartures}`);

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
        totalStops: result.totalStops,
        totalDepartures: result.totalDepartures,
        totalScheduledDepartures: totalScheduledDepartures,
        note: "Departure counts represent daily averages (total scheduled departures divided by 7)",
        stops: result.stops.map(stop => ({
          ...stop,
          total_departures: undefined  // Remove the debugging field from the response
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching nearby stop times:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch nearby stop times',
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
