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
    // Connect to MongoDB
    await connect();

    // Use MongoDB's $geoNear aggregation pipeline for efficient geospatial queries
    const results = await Stop.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point' as const,
            coordinates: [lng, lat] // MongoDB expects [longitude, latitude]
          },
          distanceField: 'distance',
          maxDistance: maxDistance, // in meters
          spherical: true, // Use spherical geometry for accurate Earth distances
          query: {}
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          stop_id: 1,
          stop_code: 1,
          stop_name: 1,
          stop_lat: 1,
          stop_lon: 1,
          distance: { $round: ['$distance', 2] } // Round distance to 2 decimal places
        }
      }
    ] as any);

    return results.map(stop => ({
      stop_id: stop.stop_id,
      stop_code: stop.stop_code,
      stop_name: stop.stop_name,
      stop_lat: stop.stop_lat,
      stop_lon: stop.stop_lon,
      distance: stop.distance
    }));

  } catch (error) {
    console.error('Error finding nearby stops:', error);
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

    const stops = await Stop.find({
      stop_lat: {
        $gte: lat - latRange,
        $lte: lat + latRange
      },
      stop_lon: {
        $gte: lng - lngRange,
        $lte: lng + lngRange
      }
    }).limit(limit * 5); // Get more than needed for filtering

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
    return nearbyStops
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

  } catch (error) {
    console.error('Error finding nearby stops (manual):', error);
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
