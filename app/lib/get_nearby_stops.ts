import connect from './db';
import { Stop, IStop } from './schema';

export interface NearbyStop {
  stop_id: string;
  stop_code: number;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  distance: number; // Distance in meters
}

export interface GetNearbyStopsOptions {
  lat: number;
  lng: number;
  maxDistance?: number; // in meters, defaults to 1000
  limit?: number; // max number of results, defaults to 50
}

/**
 * Find transport stops within a specified distance of given coordinates
 * @param options - Configuration options for the search
 * @returns Array of nearby stops with calculated distances
 */
export async function getNearbyStops(options: GetNearbyStopsOptions): Promise<NearbyStop[]> {
  const { lat, lng, maxDistance = 1000, limit = 50 } = options;

  try {
    console.log('🔍 Fetching nearby stops...');

    // Connect to MongoDB
    await connect();

    // Check if there are any stops in the database
    const totalStops = await Stop.countDocuments();
    if (totalStops === 0) {
      return [];
    }

    // Use manual distance calculation since stops don't have proper 2dsphere location field
    console.log('🔍 Using manual distance calculation for nearby stops...');
    const results = await getNearbyStopsManual({ lat, lng, maxDistance, limit });
    return results;

  } catch (error) {
    console.error('❌ Error finding nearby stops:', error);
    throw new Error('Failed to find nearby stops');
  }
}

/**
 * Alternative method using manual distance calculation (slower but more flexible)
 * Use this if you need custom distance calculations or if the 2dsphere index isn't available
 */
export async function getNearbyStopsManual(options: GetNearbyStopsOptions): Promise<NearbyStop[]> {
  const { lat, lng, maxDistance = 1000, limit = 50 } = options;

  try {
    await connect();

    // First, get all stops within a rough bounding box to reduce the dataset
    // This is an approximation - 1 degree of latitude ≈ 111km
    const latRange = maxDistance / 111000; // Convert meters to degrees
    const lngRange = maxDistance / (111000 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude

    // Now get the actual stops with a much higher limit
    const actualLimit = Math.max(limit * 10, 1000); // Get at least 1000 stops or 10x the requested limit
    
    const stops = await Stop.find({
      stop_lat: {
        $gte: lat - latRange,
        $lte: lat + latRange
      },
      stop_lon: {
        $gte: lng - lngRange,
        $lte: lng + lngRange
      }
    }).limit(actualLimit);

    // Calculate exact distances using Haversine formula
    const nearbyStops: NearbyStop[] = [];
    
    for (const stop of stops) {
      const distance = calculateDistance(lat, lng, stop.stop_lat, stop.stop_lon);
      
      if (distance <= maxDistance) {
        nearbyStops.push({
          stop_id: stop.stop_id,
          stop_code: stop.stop_code,
          stop_name: stop.stop_name,
          stop_lat: stop.stop_lat,
          stop_lon: stop.stop_lon,
          distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
        });
      }
    }

    // Sort by distance and limit results
    const sortedStops = nearbyStops
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    return sortedStops;

  } catch (error) {
    console.error('❌ [getNearbyStopsManual] Error finding nearby stops (manual):', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error('Failed to find nearby stops');
  }
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in meters
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}
