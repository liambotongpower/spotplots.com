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
    console.log('🔍 [getNearbyStops] Starting search...');
    console.log(`📍 [getNearbyStops] Location: ${lat}, ${lng}`);
    console.log(`📏 [getNearbyStops] Max distance: ${maxDistance}m`);
    console.log(`🔢 [getNearbyStops] Limit: ${limit}`);

    // Connect to MongoDB
    console.log('🔌 [getNearbyStops] Connecting to MongoDB...');
    await connect();
    console.log('✅ [getNearbyStops] MongoDB connected successfully');

    // First, let's check if there are any stops in the database at all
    console.log('🔍 [getNearbyStops] Checking total stops in database...');
    const totalStops = await Stop.countDocuments();
    console.log(`📊 [getNearbyStops] Total stops in database: ${totalStops}`);

    // Let's print out ALL stops in the collection to see what's there
    console.log('🔍 [getNearbyStops] Fetching ALL stops from collection...');
    const allStops = await Stop.find({}).limit(10); // Get first 10 stops
    console.log(`📋 [getNearbyStops] Found ${allStops.length} stops in collection:`);
    allStops.forEach((stop, index) => {
      console.log(`  ${index + 1}. ${stop.stop_name} (${stop.stop_id})`);
      console.log(`     Code: ${stop.stop_code}`);
      console.log(`     Location: ${stop.stop_lat}, ${stop.stop_lon}`);
      console.log(`     Has location field: ${!!stop.location}`);
      if (stop.location) {
        console.log(`     Location coordinates: ${JSON.stringify(stop.location.coordinates)}`);
      }
      console.log(`     Full document: ${JSON.stringify(stop.toObject())}`);
      console.log('     ────────────────────────────────────────────────');
    });

    if (totalStops === 0) {
      console.log('❌ [getNearbyStops] No stops found in database!');
      return [];
    }

    // Check if the location field has the right index
    console.log('🔍 [getNearbyStops] Checking indexes...');
    const indexes = await Stop.collection.getIndexes();
    console.log('📋 [getNearbyStops] Available indexes:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`  - ${indexName}: ${JSON.stringify(indexes[indexName])}`);
    });

    // Use MongoDB's $geoNear aggregation pipeline for efficient geospatial queries
    console.log('🔍 [getNearbyStops] Running geospatial query...');
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

    console.log(`✅ [getNearbyStops] Query completed, found ${results.length} results`);

    const mappedResults = results.map(stop => ({
      stop_id: stop.stop_id,
      stop_code: stop.stop_code,
      stop_name: stop.stop_name,
      stop_lat: stop.stop_lat,
      stop_lon: stop.stop_lon,
      distance: stop.distance
    }));

    console.log('📋 [getNearbyStops] Mapped results:');
    mappedResults.forEach((stop, index) => {
      console.log(`  ${index + 1}. ${stop.stop_name} - ${stop.distance}m away`);
    });

    return mappedResults;

  } catch (error) {
    console.error('❌ [getNearbyStops] Error finding nearby stops:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
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
    console.log('🔍 [getNearbyStopsManual] Starting manual search...');
    console.log(`📍 [getNearbyStopsManual] Location: ${lat}, ${lng}`);
    console.log(`📏 [getNearbyStopsManual] Max distance: ${maxDistance}m`);
    console.log(`🔢 [getNearbyStopsManual] Limit: ${limit}`);

    await connect();
    console.log('✅ [getNearbyStopsManual] MongoDB connected successfully');

    // Let's first check what's in the database
    console.log('🔍 [getNearbyStopsManual] Checking total stops...');
    const totalStops = await Stop.countDocuments();
    console.log(`📊 [getNearbyStopsManual] Total stops in database: ${totalStops}`);

    // Print out some sample stops
    console.log('🔍 [getNearbyStopsManual] Fetching sample stops...');
    const sampleStops = await Stop.find({}).limit(5);
    console.log(`📋 [getNearbyStopsManual] Sample stops:`);
    sampleStops.forEach((stop, index) => {
      console.log(`  ${index + 1}. ${stop.stop_name} (${stop.stop_id})`);
      console.log(`     Code: ${stop.stop_code}, Location: ${stop.stop_lat}, ${stop.stop_lon}`);
    });

    // First, get all stops within a rough bounding box to reduce the dataset
    // This is an approximation - 1 degree of latitude ≈ 111km
    const latRange = maxDistance / 111000; // Convert meters to degrees
    const lngRange = maxDistance / (111000 * Math.cos(lat * Math.PI / 180)); // Adjust for longitude

    console.log(`🔍 [getNearbyStopsManual] Bounding box: lat ±${latRange}, lng ±${lngRange}`);
    console.log(`📦 [getNearbyStopsManual] Search area: lat ${lat - latRange} to ${lat + latRange}, lng ${lng - lngRange} to ${lng + lngRange}`);

    // Let's first check how many stops are in the entire database
    console.log('🔍 [getNearbyStopsManual] Checking total stops in database...');
    const totalStopsInDB = await Stop.countDocuments();
    console.log(`📊 [getNearbyStopsManual] Total stops in database: ${totalStopsInDB}`);

    // Check how many stops are in the bounding box without limit
    console.log('🔍 [getNearbyStopsManual] Checking stops in bounding box (no limit)...');
    const stopsInBoundingBox = await Stop.countDocuments({
      stop_lat: {
        $gte: lat - latRange,
        $lte: lat + latRange
      },
      stop_lon: {
        $gte: lng - lngRange,
        $lte: lng + lngRange
      }
    });
    console.log(`📊 [getNearbyStopsManual] Stops in bounding box (no limit): ${stopsInBoundingBox}`);

    // Now get the actual stops with a much higher limit
    const actualLimit = Math.max(limit * 10, 1000); // Get at least 1000 stops or 10x the requested limit
    console.log(`🔍 [getNearbyStopsManual] Fetching up to ${actualLimit} stops from bounding box...`);
    
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

    console.log(`📊 [getNearbyStopsManual] Actually fetched ${stops.length} stops from database`);
    console.log(`📊 [getNearbyStopsManual] Requested limit: ${limit}, Actual limit used: ${actualLimit}`);

    // Calculate exact distances using Haversine formula
    const nearbyStops: NearbyStop[] = [];
    let processedCount = 0;
    let withinDistanceCount = 0;
    
    console.log('🔍 [getNearbyStopsManual] Calculating distances...');
    console.log(`🔍 [getNearbyStopsManual] Processing ${stops.length} stops...`);
    
    for (const stop of stops) {
      processedCount++;
      const distance = calculateDistance(lat, lng, stop.stop_lat, stop.stop_lon);
      
      // Only log first 10 and last 10 to avoid spam
      if (processedCount <= 10 || processedCount > stops.length - 10) {
        console.log(`  📍 ${processedCount}/${stops.length} ${stop.stop_name}: ${distance.toFixed(2)}m (${distance <= maxDistance ? '✅' : '❌'})`);
      } else if (processedCount === 11) {
        console.log(`  📍 ... (processing ${stops.length - 20} more stops, showing first 10 and last 10) ...`);
      }
      
      if (distance <= maxDistance) {
        withinDistanceCount++;
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

    console.log(`📊 [getNearbyStopsManual] Processed ${processedCount} stops`);
    console.log(`📊 [getNearbyStopsManual] Found ${withinDistanceCount} stops within ${maxDistance}m`);
    console.log(`📊 [getNearbyStopsManual] Final nearby stops count: ${nearbyStops.length}`);

    // Sort by distance and limit results
    const sortedStops = nearbyStops
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    console.log('📋 [getNearbyStopsManual] Final results:');
    sortedStops.forEach((stop, index) => {
      console.log(`  ${index + 1}. ${stop.stop_name} - ${stop.distance}m away`);
    });

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
