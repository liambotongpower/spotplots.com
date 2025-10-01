import connect from './db';
import { Stop, IStop } from './schema';
import mongoose from 'mongoose';

// Schema for stop times (corresponds to the stop_times collection)
interface IStopTime extends mongoose.Document {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
  stop_headsign?: string;
  pickup_type?: number;
  drop_off_type?: number;
  timepoint?: number;
}

// Define a stop time schema that matches the collection structure
const StopTimeSchema = new mongoose.Schema<IStopTime>({
  trip_id: { type: String, required: true },
  arrival_time: { type: String, required: true },
  departure_time: { type: String, required: true },
  stop_id: { type: String, required: true, index: true },
  stop_sequence: { type: Number, required: true },
  stop_headsign: { type: String },
  pickup_type: { type: Number },
  drop_off_type: { type: Number },
  timepoint: { type: Number }
});

// Create model - check if it exists first to prevent overwriting
export const StopTime = mongoose.models.StopTime || 
  mongoose.model<IStopTime>('StopTime', StopTimeSchema, 'stop_times');

export interface StopWithDepartures {
  stop_id: string;
  stop_code: number;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  distance: number;
  departures_count: number;
}

export interface DeparturesResponse {
  stops: StopWithDepartures[];
  totalStops: number;
  totalDepartures: number;
}

export interface GetNearbyStopTimesOptions {
  lat: number;
  lng: number;
  maxDistance?: number; // in meters, defaults to 1000
  limit?: number; // max number of results, defaults to 50
}

/**
 * Find transport stops and their departure counts within a specified distance
 * @param options - Configuration options for the search
 * @returns Object containing stops with departure counts and totals
 */
export async function getNearbyStopTimes(options: GetNearbyStopTimesOptions): Promise<DeparturesResponse> {
  const { lat, lng, maxDistance = 1000, limit = 50 } = options;

  try {
    console.log('🔍 [getNearbyStopTimes] Starting search...');
    console.log(`📍 [getNearbyStopTimes] Location: ${lat}, ${lng}`);
    console.log(`📏 [getNearbyStopTimes] Max distance: ${maxDistance}m`);
    console.log(`🔢 [getNearbyStopTimes] Limit: ${limit}`);

    // Connect to MongoDB
    await connect();
    console.log('✅ [getNearbyStopTimes] MongoDB connected successfully');

    // First get the nearby stops using the geospatial query
    const nearbyStops = await Stop.aggregate([
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
    ]);

    console.log(`✅ [getNearbyStopTimes] Found ${nearbyStops.length} nearby stops`);

    // Get all the stop_ids to use in the lookup
    const stopIds = nearbyStops.map(stop => stop.stop_id);
    
    console.log(`🔍 [getNearbyStopTimes] Looking for stop times for ${stopIds.length} stop IDs`);
    console.log(`🔍 [getNearbyStopTimes] First 5 stop IDs: ${stopIds.slice(0, 5).join(', ')}`);
    
    // Check if StopTime collection exists and has data
    try {
      const stopTimesCollectionExists = await StopTime.collection.countDocuments() > 0;
      console.log(`🔍 [getNearbyStopTimes] StopTime collection exists and has data: ${stopTimesCollectionExists}`);
      
      const sampleStopTime = await StopTime.findOne();
      console.log(`🔍 [getNearbyStopTimes] Sample stop time: ${sampleStopTime ? JSON.stringify(sampleStopTime.toObject()) : 'No stop times found'}`);
      
      // Count total documents in StopTime collection
      const totalStopTimes = await StopTime.countDocuments();
      console.log(`🔍 [getNearbyStopTimes] Total records in stop_times collection: ${totalStopTimes}`);
      
      // Check for any stop times matching our stop IDs directly with find()
      const sampleMatchingStopTime = await StopTime.findOne({ stop_id: { $in: stopIds.slice(0, 10) } });
      console.log(`🔍 [getNearbyStopTimes] Sample matching stop time: ${sampleMatchingStopTime ? JSON.stringify(sampleMatchingStopTime.toObject()) : 'No matching stop times found'}`);
      
      // If no matches found, check the format of stop IDs in the stop_times collection
      if (!sampleMatchingStopTime && stopIds.length > 0) {
        // Get a few sample stop_ids from the stop_times collection
        const sampleStopTimeIds = await StopTime.distinct('stop_id').limit(5);
        console.log(`🔍 [getNearbyStopTimes] Sample stop_ids from stop_times collection: ${JSON.stringify(sampleStopTimeIds)}`);
        console.log(`🔍 [getNearbyStopTimes] Our stop_ids: ${JSON.stringify(stopIds.slice(0, 5))}`);
      }
    } catch (err) {
      console.error('❌ [getNearbyStopTimes] Error checking stop_times collection:', err);
    }
    
    // Count departures for each stop
    console.log('🔍 [getNearbyStopTimes] Running aggregation to count departures by stop_id...');
    const departuresByStop = await StopTime.aggregate([
      {
        $match: { 
          stop_id: { $in: stopIds } 
        }
      },
      {
        $group: {
          _id: "$stop_id",
          departures_count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`✅ [getNearbyStopTimes] Counted departures for ${departuresByStop.length} stops`);
    console.log(`🔍 [getNearbyStopTimes] Raw aggregation results: ${JSON.stringify(departuresByStop)}`);
    
    // If we're not finding any departures, try checking if the stop_id format might be different
    if (departuresByStop.length === 0 && stopIds.length > 0) {
      console.log('🔍 [getNearbyStopTimes] No departures found with exact stop_id match, checking if format differs...');
      
      // Check different stop_id formats
      const sampleStopId = stopIds[0];
      console.log(`🔍 [getNearbyStopTimes] Sample stop_id: ${sampleStopId}`);
      
      // Try to extract numeric part of stop ID and search with it
      const numericPart = sampleStopId.replace(/\D/g, '');
      if (numericPart) {
        console.log(`🔍 [getNearbyStopTimes] Trying with numeric part: ${numericPart}`);
        const numericMatches = await StopTime.find({ stop_id: { $regex: numericPart } }).limit(5);
        console.log(`🔍 [getNearbyStopTimes] Matches with numeric part: ${numericMatches.length}`);
        if (numericMatches.length > 0) {
          console.log(`🔍 [getNearbyStopTimes] Example matches: ${JSON.stringify(numericMatches.map(m => m.stop_id))}`);
        }
      }
      
      // Try a regular expression search to see if the format is different
      const possibleMatches = await StopTime.find({ stop_id: { $regex: new RegExp(sampleStopId.replace(/[^\w\d]/g, '.*'), 'i') } }).limit(5);
      console.log(`🔍 [getNearbyStopTimes] Possible matches with regex: ${possibleMatches.length}`);
      if (possibleMatches.length > 0) {
        console.log(`🔍 [getNearbyStopTimes] Example matches: ${JSON.stringify(possibleMatches.map(m => m.stop_id))}`);
      }
    }

    // Create a map of stop_id to departure count for easier lookup
    const departuresMap = new Map();
    departuresByStop.forEach(item => {
      departuresMap.set(item._id, item.departures_count);
    });

    // Combine the stop information with departure counts
    const stopsWithDepartures: StopWithDepartures[] = nearbyStops.map(stop => ({
      ...stop,
      departures_count: departuresMap.get(stop.stop_id) || 0
    }));

    // Sort by departure count descending
    stopsWithDepartures.sort((a, b) => b.departures_count - a.departures_count);

    // Calculate the total number of departures across all stops
    const totalDepartures = stopsWithDepartures.reduce(
      (sum, stop) => sum + stop.departures_count, 
      0
    );

    console.log(`✅ [getNearbyStopTimes] Total departures across all stops: ${totalDepartures}`);
    console.log(`✅ [getNearbyStopTimes] Total stops with departure data: ${stopsWithDepartures.length}`);

    // Return the combined results
    return {
      stops: stopsWithDepartures,
      totalStops: stopsWithDepartures.length,
      totalDepartures
    };

  } catch (error) {
    console.error('❌ [getNearbyStopTimes] Error finding nearby stop times:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error('Failed to find nearby stop times');
  }
}

/**
 * Alternative method using manual distance calculation
 * Use this when the geospatial index isn't available
 */
export async function getNearbyStopTimesManual(options: GetNearbyStopTimesOptions): Promise<DeparturesResponse> {
  const { lat, lng, maxDistance = 1000, limit = 50 } = options;

  try {
    console.log('🔍 [getNearbyStopTimesManual] Starting manual search...');
    console.log(`📍 [getNearbyStopTimesManual] Location: ${lat}, ${lng}`);
    console.log(`📏 [getNearbyStopTimesManual] Max distance: ${maxDistance}m`);
    
    await connect();
    console.log('✅ [getNearbyStopTimesManual] MongoDB connected successfully');
    
    // First, get all stops within a rough bounding box
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
    }).limit(limit * 10); // Get more than needed for filtering

    console.log(`📊 [getNearbyStopTimesManual] Found ${stops.length} stops in bounding box`);

    // Calculate distances and filter by max distance
    const nearbyStops: Array<any> = [];
    
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

    console.log(`✅ [getNearbyStopTimesManual] Found ${sortedStops.length} nearby stops after filtering`);

    // Get stop IDs for departure lookup
    const stopIds = sortedStops.map(stop => stop.stop_id);
    
    console.log(`🔍 [getNearbyStopTimesManual] Looking for stop times for ${stopIds.length} stop IDs`);
    console.log(`🔍 [getNearbyStopTimesManual] First 5 stop IDs: ${stopIds.slice(0, 5).join(', ')}`);
    
    // Check if the StopTime collection exists and has documents
    try {
      const stopTimesCollectionExists = await StopTime.collection.countDocuments() > 0;
      console.log(`🔍 [getNearbyStopTimesManual] StopTime collection exists and has data: ${stopTimesCollectionExists}`);
      
      // Check if collection exists in MongoDB
      const collections = await mongoose.connection.db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log(`🔍 [getNearbyStopTimesManual] All collections in database: ${collectionNames.join(', ')}`);
      
      if (collectionNames.includes('stop_times')) {
        // Check for a sample document directly from the collection
        const sampleDoc = await mongoose.connection.db.collection('stop_times').findOne();
        console.log(`🔍 [getNearbyStopTimesManual] Raw sample from stop_times collection: ${JSON.stringify(sampleDoc)}`);
        
        if (sampleDoc) {
          console.log(`🔍 [getNearbyStopTimesManual] Sample stop_id format: ${sampleDoc.stop_id} (${typeof sampleDoc.stop_id})`);
          console.log(`🔍 [getNearbyStopTimesManual] Our stop_id format: ${stopIds[0]} (${typeof stopIds[0]})`);
          
          // Get several sample stop_ids to compare formats
          const sampleStopIds = await mongoose.connection.db.collection('stop_times')
            .distinct('stop_id', {}, { limit: 5 });
          console.log(`🔍 [getNearbyStopTimesManual] Sample stop_ids from database: ${JSON.stringify(sampleStopIds)}`);
          console.log(`🔍 [getNearbyStopTimesManual] Our stop_ids for comparison: ${JSON.stringify(stopIds.slice(0, 5))}`);
        }
      }
    } catch (err) {
      console.error('❌ [getNearbyStopTimesManual] Error examining database collections:', err);
    }
    
    // Count departures for each stop
    console.log('🔍 [getNearbyStopTimesManual] Running aggregation to count departures...');
    const departuresByStop = await StopTime.aggregate([
      {
        $match: { 
          stop_id: { $in: stopIds } 
        }
      },
      {
        $group: {
          _id: "$stop_id",
          departures_count: { $sum: 1 }
        }
      }
    ]);
    
    console.log(`🔍 [getNearbyStopTimesManual] Aggregation results: ${JSON.stringify(departuresByStop)}`);
    
    // Try a different approach if no results
    if (departuresByStop.length === 0) {
      console.log('🔍 [getNearbyStopTimesManual] No matches found with $in operator, trying direct queries...');
      
      // Try to find any stop times for the first stop ID directly
      if (stopIds.length > 0) {
        const firstStopId = stopIds[0];
        const directMatch = await StopTime.find({ stop_id: firstStopId }).limit(1);
        console.log(`🔍 [getNearbyStopTimesManual] Direct query for stop_id "${firstStopId}" found: ${directMatch.length > 0}`);
        
        // Try with just the numeric part
        const numericPart = firstStopId.replace(/\D/g, '');
        if (numericPart) {
          console.log(`🔍 [getNearbyStopTimesManual] Trying with numeric part: ${numericPart}`);
          const numericMatches = await StopTime.find({ stop_id: { $regex: numericPart } }).limit(5);
          console.log(`🔍 [getNearbyStopTimesManual] Matches with numeric part: ${numericMatches.length}`);
          if (numericMatches.length > 0) {
            console.log(`🔍 [getNearbyStopTimesManual] Example matches: ${JSON.stringify(numericMatches.map(m => m.stop_id))}`);
            
            // If we found matches with the numeric part, we might need to map our stop IDs
            console.log('🔍 [getNearbyStopTimesManual] Trying to aggregate with numeric part pattern...');
            
            // Create a map of numeric parts to original stop IDs
            const numericToOriginal = new Map();
            stopIds.forEach(id => {
              const numeric = id.replace(/\D/g, '');
              if (numeric) {
                numericToOriginal.set(numeric, id);
              }
            });
            
            // Try a more flexible match using numeric parts
            const numericAggregation = await StopTime.aggregate([
              {
                $match: {
                  stop_id: { 
                    $in: Array.from(numericToOriginal.keys()).map(n => new RegExp(n)) 
                  }
                }
              },
              {
                $group: {
                  _id: "$stop_id",
                  departures_count: { $sum: 1 }
                }
              }
            ]);
            
            console.log(`🔍 [getNearbyStopTimesManual] Numeric aggregation results: ${JSON.stringify(numericAggregation)}`);
          }
        }
      }
    }
    
    // Create a map for easier lookup
    const departuresMap = new Map();
    departuresByStop.forEach(item => {
      departuresMap.set(item._id, item.departures_count);
    });

    // Combine stop information with departure counts
    const stopsWithDepartures: StopWithDepartures[] = sortedStops.map(stop => ({
      ...stop,
      departures_count: departuresMap.get(stop.stop_id) || 0
    }));

    // Sort by departure count descending
    stopsWithDepartures.sort((a, b) => b.departures_count - a.departures_count);

    // Calculate the total departures
    const totalDepartures = stopsWithDepartures.reduce(
      (sum, stop) => sum + stop.departures_count, 
      0
    );

    console.log(`✅ [getNearbyStopTimesManual] Total departures: ${totalDepartures}`);

    return {
      stops: stopsWithDepartures,
      totalStops: stopsWithDepartures.length,
      totalDepartures
    };

  } catch (error) {
    console.error('❌ [getNearbyStopTimesManual] Error finding nearby stop times (manual):', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error('Failed to find nearby stop times');
  }
}

/**
 * Calculate distance between two points using Haversine formula
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
