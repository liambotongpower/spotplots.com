import connect from './db';
import { Stop, IStop } from './schema';
import { getNearbyStops, NearbyStop } from './get_nearby_stops';
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

// Schema for trips (corresponds to the trips collection)
interface ITrip extends mongoose.Document {
  route_id: string;
  service_id: string;
  trip_id: string;
  trip_headsign?: string;
  trip_short_name?: string;
  direction_id?: number;
  block_id?: string;
  shape_id?: string;
}

// Schema for routes (corresponds to the routes collection)
interface IRoute extends mongoose.Document {
  route_id: string;
  agency_id?: string;
  route_short_name?: string;
  route_long_name?: string;
  route_desc?: string;
  route_type?: number;
  route_url?: string;
  route_color?: string;
  route_text_color?: string;
}

// Define schemas that match the collection structures
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

const TripSchema = new mongoose.Schema<ITrip>({
  route_id: { type: String, required: true, index: true },
  service_id: { type: String, required: true },
  trip_id: { type: String, required: true, unique: true },
  trip_headsign: { type: String },
  trip_short_name: { type: String },
  direction_id: { type: Number },
  block_id: { type: String },
  shape_id: { type: String }
});

const RouteSchema = new mongoose.Schema<IRoute>({
  route_id: { type: String, required: true, unique: true },
  agency_id: { type: String },
  route_short_name: { type: String },
  route_long_name: { type: String },
  route_desc: { type: String },
  route_type: { type: Number },
  route_url: { type: String },
  route_color: { type: String },
  route_text_color: { type: String }
});

// Create models - check if they exist first to prevent overwriting
export const StopTime = mongoose.models.StopTime || 
  mongoose.model<IStopTime>('StopTime', StopTimeSchema, 'stop_times');

export const Trip = mongoose.models.Trip || 
  mongoose.model<ITrip>('Trip', TripSchema, 'trips');

export const Route = mongoose.models.Route || 
  mongoose.model<IRoute>('Route', RouteSchema, 'routes');

export interface RouteDeparture {
  route: string;
  departures: number;
}

export interface RoutesResponse {
  routes: RouteDeparture[];
  totalRoutes: number;
  totalDepartures: number;
  csv: string;
}

export interface GetNearbyStopTimesOptions {
  lat: number;
  lng: number;
  maxDistance?: number; // in meters, defaults to 1000
  limit?: number; // max number of results, defaults to 50
}

export interface GetNearbyStopTimesFromStopsOptions {
  stops: Array<{
    stop_id: string;
    stop_code: number;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
    distance: number;
  }>;
}

/**
 * Find routes and their departure counts from the nearest stops
 * @param options - Configuration options for the search
 * @returns Object containing routes with departure counts and CSV output
 */
export async function getNearbyStopTimes(options: GetNearbyStopTimesOptions): Promise<RoutesResponse> {
  const { lat, lng, maxDistance = 1000, limit = 50 } = options;

  try {
    console.log('🔍 [getNearbyStopTimes] Starting route-focused search...');
    console.log(`📍 [getNearbyStopTimes] Location: ${lat}, ${lng}`);
    console.log(`📏 [getNearbyStopTimes] Max distance: ${maxDistance}m`);
    console.log(`🔢 [getNearbyStopTimes] Limit: ${limit}`);

    // Connect to MongoDB
    await connect();
    console.log('✅ [getNearbyStopTimes] MongoDB connected successfully');

    // Step 1: Get nearby stops using the existing getNearbyStops function
    console.log('🔍 [getNearbyStopTimes] Step 1: Finding nearby stops...');
    const nearbyStops = await getNearbyStops({ lat, lng, maxDistance, limit });
    console.log(`✅ [getNearbyStopTimes] Found ${nearbyStops.length} nearby stops`);

    if (nearbyStops.length === 0) {
      return {
        routes: [],
        totalRoutes: 0,
        totalDepartures: 0,
        csv: 'route,departures\n'
      };
    }

    // Step 2: For each stop (in distance order), find routes and count departures
    console.log('🔍 [getNearbyStopTimes] Step 2: Processing stops in distance order...');
    
    const routeDepartures = new Map<string, number>(); // route_id -> daily departures
    const processedRoutes = new Set<string>(); // Track which routes we've already counted

    for (const stop of nearbyStops) {
      console.log(`🔍 [getNearbyStopTimes] Processing stop: ${stop.stop_name} (${stop.stop_id})`);
      
      // Find trips that serve this specific stop
      const stopTrips = await StopTime.aggregate([
        {
          $match: { 
            stop_id: stop.stop_id 
          }
        },
        {
          $group: {
            _id: "$trip_id"
          }
        }
      ]);

      const stopTripIds = stopTrips.map(trip => trip._id);
      console.log(`🔍 [getNearbyStopTimes] Stop ${stop.stop_id} has ${stopTripIds.length} trips`);

      if (stopTripIds.length === 0) {
        continue;
      }

      // Get route information for these trips
      const stopRoutes = await Trip.aggregate([
        {
          $match: { 
            trip_id: { $in: stopTripIds } 
          }
        },
        {
          $lookup: {
            from: 'routes',
            localField: 'route_id',
            foreignField: 'route_id',
            as: 'route_info'
          }
        },
        {
          $unwind: {
            path: '$route_info',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: "$route_id",
            route_info: { $first: "$route_info" },
            trip_count: { $sum: 1 }
          }
        }
      ]);

      // Process routes for this stop
      for (const route of stopRoutes) {
        const routeId = route._id;
        const routeShortName = route.route_info?.route_short_name || routeId;
        
        // Only count this route if we haven't seen it before (nearest stop wins)
        if (!processedRoutes.has(routeId)) {
          const dailyDepartures = Math.round(route.trip_count / 7); // Average per day
          routeDepartures.set(routeShortName, dailyDepartures);
          processedRoutes.add(routeId);
          
          console.log(`🔍 [getNearbyStopTimes] Route ${routeShortName} (${routeId}): ${dailyDepartures} daily departures from stop ${stop.stop_id}`);
        } else {
          console.log(`🔍 [getNearbyStopTimes] Route ${routeShortName} (${routeId}) already counted from a nearer stop, skipping`);
        }
      }
    }

    // Step 3: Convert to final format
    console.log('🔍 [getNearbyStopTimes] Step 3: Formatting results...');
    
    const routes: RouteDeparture[] = Array.from(routeDepartures.entries()).map(([route, departures]) => ({
      route,
      departures
    }));

    // Sort by departure count (descending)
    routes.sort((a, b) => b.departures - a.departures);

    // Generate CSV
    const csvHeader = 'route,departures\n';
    const csvRows = routes.map(r => `${r.route},${r.departures}`).join('\n');
    const csv = csvHeader + csvRows;

    const totalDepartures = routes.reduce((sum, route) => sum + route.departures, 0);

    console.log(`✅ [getNearbyStopTimes] Summary:`);
    console.log(`   - Total routes: ${routes.length}`);
    console.log(`   - Total daily departures: ${totalDepartures}`);
    console.log(`   - Top 5 routes by departures:`);
    routes.slice(0, 5).forEach((route, i) => {
      console.log(`     ${i+1}. ${route.route}: ${route.departures} departures`);
    });

    return {
      routes,
      totalRoutes: routes.length,
      totalDepartures,
      csv
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
export async function getNearbyStopTimesManual(options: GetNearbyStopTimesOptions): Promise<RoutesResponse> {
  const { lat, lng, maxDistance = 1000, limit = 50 } = options;

  try {
    console.log('🔍 [getNearbyStopTimesManual] Starting manual route-focused search...');
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

    if (sortedStops.length === 0) {
      return {
        routes: [],
        totalRoutes: 0,
        totalDepartures: 0,
        csv: 'route,departures\n'
      };
    }

    // Process stops in distance order to avoid route duplication
    const routeDepartures = new Map<string, number>(); // route_id -> daily departures
    const processedRoutes = new Set<string>(); // Track which routes we've already counted

    for (const stop of sortedStops) {
      console.log(`🔍 [getNearbyStopTimesManual] Processing stop: ${stop.stop_name} (${stop.stop_id})`);
      
      // Find trips that serve this specific stop
      const stopTrips = await StopTime.aggregate([
        {
          $match: { 
            stop_id: stop.stop_id 
          }
        },
        {
          $group: {
            _id: "$trip_id"
          }
        }
      ]);

      const stopTripIds = stopTrips.map(trip => trip._id);

      if (stopTripIds.length === 0) {
        continue;
      }

      // Get route information for these trips
      const stopRoutes = await Trip.aggregate([
        {
          $match: { 
            trip_id: { $in: stopTripIds } 
          }
        },
        {
          $lookup: {
            from: 'routes',
            localField: 'route_id',
            foreignField: 'route_id',
            as: 'route_info'
          }
        },
        {
          $unwind: {
            path: '$route_info',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $group: {
            _id: "$route_id",
            route_info: { $first: "$route_info" },
            trip_count: { $sum: 1 }
          }
        }
      ]);

      // Process routes for this stop
      for (const route of stopRoutes) {
        const routeId = route._id;
        const routeShortName = route.route_info?.route_short_name || routeId;
        
        // Only count this route if we haven't seen it before (nearest stop wins)
        if (!processedRoutes.has(routeId)) {
          const dailyDepartures = Math.round(route.trip_count / 7); // Average per day
          routeDepartures.set(routeShortName, dailyDepartures);
          processedRoutes.add(routeId);
          
          console.log(`🔍 [getNearbyStopTimesManual] Route ${routeShortName} (${routeId}): ${dailyDepartures} daily departures from stop ${stop.stop_id}`);
        } else {
          console.log(`🔍 [getNearbyStopTimesManual] Route ${routeShortName} (${routeId}) already counted from a nearer stop, skipping`);
        }
      }
    }

    // Convert to final format
    const routes: RouteDeparture[] = Array.from(routeDepartures.entries()).map(([route, departures]) => ({
      route,
      departures
    }));

    // Sort by departure count (descending)
    routes.sort((a, b) => b.departures - a.departures);

    // Generate CSV
    const csvHeader = 'route,departures\n';
    const csvRows = routes.map(r => `${r.route},${r.departures}`).join('\n');
    const csv = csvHeader + csvRows;

    const totalDepartures = routes.reduce((sum, route) => sum + route.departures, 0);

    console.log(`✅ [getNearbyStopTimesManual] Summary:`);
    console.log(`   - Total routes: ${routes.length}`);
    console.log(`   - Total daily departures: ${totalDepartures}`);
    console.log(`   - Top 5 routes by departures:`);
    routes.slice(0, 5).forEach((route, i) => {
      console.log(`     ${i+1}. ${route.route}: ${route.departures} departures`);
    });

    return {
      routes,
      totalRoutes: routes.length,
      totalDepartures,
      csv
    };

  } catch (error) {
    console.error('❌ [getNearbyStopTimesManual] Error finding nearby stop times (manual):', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error('Failed to find nearby stop times');
  }
}

/**
 * OPTIMIZED: Find routes and their departure counts from pre-found stops
 * This eliminates the wasteful re-finding of stops that were already discovered
 * @param options - Configuration options with pre-found stops
 * @returns Object containing routes with departure counts and CSV output
 */
export async function getNearbyStopTimesFromStops(options: GetNearbyStopTimesFromStopsOptions): Promise<RoutesResponse> {
  const { stops } = options;

  try {
    console.log('🔍 Fetching nearby routes...');

    // Connect to MongoDB
    await connect();

    if (stops.length === 0) {
      return {
        routes: [],
        totalRoutes: 0,
        totalDepartures: 0,
        csv: 'route,departures\n'
      };
    }

    // Process stops in distance order (they should already be sorted, but ensure it)
    const sortedStops = [...stops].sort((a, b) => a.distance - b.distance);

    const routeDepartures = new Map<string, number>(); // route_id -> daily departures
    const processedRoutes = new Set<string>(); // Track which routes we've already counted

    // OPTIMIZED: Batch all stop IDs and do one big query instead of 174 separate queries
    const stopIds = sortedStops.map(stop => stop.stop_id);
    
    // Get all trips for all stops in one query
    const allStopTrips = await StopTime.aggregate([
      {
        $match: { 
          stop_id: { $in: stopIds }
        }
      },
      {
        $group: {
          _id: "$stop_id",
          trip_ids: { $addToSet: "$trip_id" }
        }
      }
    ]);

    // Create a map of stop_id -> trip_ids for quick lookup
    const stopTripsMap = new Map();
    allStopTrips.forEach(stop => {
      stopTripsMap.set(stop._id, stop.trip_ids);
    });

    // Get all unique trip IDs across all stops
    const allTripIds = [...new Set(allStopTrips.flatMap(stop => stop.trip_ids))];

    // Get all route information for all trips in one query
    const allRoutes = await Trip.aggregate([
      {
        $match: { 
          trip_id: { $in: allTripIds } 
        }
      },
      {
        $lookup: {
          from: 'routes',
          localField: 'route_id',
          foreignField: 'route_id',
          as: 'route_info'
        }
      },
      {
        $unwind: {
          path: '$route_info',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $group: {
          _id: "$route_id",
          route_info: { $first: "$route_info" },
          trip_ids: { $addToSet: "$trip_id" }
        }
      }
    ]);

    // Create a map of trip_id -> route_id for quick lookup
    const tripRouteMap = new Map();
    allRoutes.forEach(route => {
      route.trip_ids.forEach(tripId => {
        tripRouteMap.set(tripId, route._id);
      });
    });

    // Process stops in distance order to avoid route duplication (nearest stop wins)
    for (const stop of sortedStops) {
      const stopTripIds = stopTripsMap.get(stop.stop_id) || [];

      if (stopTripIds.length === 0) {
        continue;
      }

      // Count routes for this stop
      const routeCounts = new Map();
      stopTripIds.forEach(tripId => {
        const routeId = tripRouteMap.get(tripId);
        if (routeId) {
          routeCounts.set(routeId, (routeCounts.get(routeId) || 0) + 1);
        }
      });

      // Process routes for this stop
      for (const [routeId, tripCount] of routeCounts) {
        const route = allRoutes.find(r => r._id === routeId);
        const routeShortName = route?.route_info?.route_short_name || routeId;
        
        // Only count this route if we haven't seen it before (nearest stop wins)
        if (!processedRoutes.has(routeId)) {
          const dailyDepartures = Math.round(tripCount / 7); // Average per day
          routeDepartures.set(routeShortName, dailyDepartures);
          processedRoutes.add(routeId);
          
          console.log(`✅ [getNearbyStopTimesFromStops] Route ${routeShortName} (${routeId}): ${dailyDepartures} daily departures from nearest stop ${stop.stop_id}`);
        } else {
          console.log(`⏭️ [getNearbyStopTimesFromStops] Route ${routeShortName} (${routeId}) already counted from a nearer stop, skipping`);
        }
      }
    }

    // Convert to final format
    console.log('🔍 [getNearbyStopTimesFromStops] Formatting results...');
    
    const routes: RouteDeparture[] = Array.from(routeDepartures.entries()).map(([route, departures]) => ({
      route,
      departures
    }));

    // Sort by departure count (descending)
    routes.sort((a, b) => b.departures - a.departures);

    // Generate CSV
    const csvHeader = 'route,departures\n';
    const csvRows = routes.map(r => `${r.route},${r.departures}`).join('\n');
    const csv = csvHeader + csvRows;

    const totalDepartures = routes.reduce((sum, route) => sum + route.departures, 0);

    console.log(`✅ [getNearbyStopTimesFromStops] OPTIMIZED Summary:`);
    console.log(`   - Processed ${sortedStops.length} pre-found stops`);
    console.log(`   - Total routes: ${routes.length}`);
    console.log(`   - Total daily departures: ${totalDepartures}`);
    console.log(`   - Top 5 routes by departures:`);
    routes.slice(0, 5).forEach((route, i) => {
      console.log(`     ${i+1}. ${route.route}: ${route.departures} departures`);
    });

    return {
      routes,
      totalRoutes: routes.length,
      totalDepartures,
      csv
    };

  } catch (error) {
    console.error('❌ [getNearbyStopTimesFromStops] Error finding nearby stop times from stops:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error('Failed to find nearby stop times from stops');
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
