import { NextResponse } from 'next/server';
import connect from '../../lib/db';
import mongoose from 'mongoose';
import { StopTime } from '../../lib/get_nearby_stop_times';

/**
 * API endpoint to check and diagnose issues with the departures collection
 */
export async function GET() {
  try {
    console.log('🔍 [check_stop_times_collection] Starting diagnostic check...');
    
    // Connect to MongoDB
    await connect();
    console.log('✅ [check_stop_times_collection] MongoDB connected');
    
    const diagnostics: any = {
      connection: {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      },
      collections: [],
      stop_times: {
        exists: false,
        count: 0,
        sampleItems: [],
        stopIdTypes: {}
      }
    };
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    diagnostics.collections = collections.map(c => c.name);
    console.log(`✅ [check_stop_times_collection] Found ${diagnostics.collections.length} collections`);
    console.log(`Collections: ${diagnostics.collections.join(', ')}`);
    
    // Check if stop_times collection exists
    if (diagnostics.collections.includes('stop_times')) {
      diagnostics.stop_times.exists = true;
      
      // Count documents in the collection
      const stopTimesCount = await mongoose.connection.db
        .collection('stop_times')
        .countDocuments();
      
      diagnostics.stop_times.count = stopTimesCount;
      console.log(`✅ [check_stop_times_collection] Found ${stopTimesCount} documents in stop_times collection`);
      
      // Get sample items
      if (stopTimesCount > 0) {
        const samples = await mongoose.connection.db
          .collection('stop_times')
          .find()
          .limit(5)
          .toArray();
          
        diagnostics.stop_times.sampleItems = samples;
        
        // Check data types of stop_id field
        samples.forEach(sample => {
          const stopIdType = typeof sample.stop_id;
          if (!diagnostics.stop_times.stopIdTypes[stopIdType]) {
            diagnostics.stop_times.stopIdTypes[stopIdType] = 0;
          }
          diagnostics.stop_times.stopIdTypes[stopIdType]++;
        });
        
        console.log(`✅ [check_stop_times_collection] Sample stop_id types: ${JSON.stringify(diagnostics.stop_times.stopIdTypes)}`);
      }
    } else {
      console.log('❌ [check_stop_times_collection] stop_times collection does not exist');
    }
    
    // Try creating a test document to check schema and permissions
    if (diagnostics.stop_times.exists) {
      try {
        const testStopTime = new StopTime({
          stop_id: 'TEST_STOP_ID',
          trip_id: 'TEST_TRIP',
          arrival_time: '12:00:00',
          departure_time: '12:00:00',
          stop_sequence: 1,
          pickup_type: 0,
          drop_off_type: 0,
          timepoint: 1
        });
        
        await testStopTime.save();
        console.log('✅ [check_stop_times_collection] Successfully created test document');
        
        // Clean up the test document
        await StopTime.deleteOne({ stop_id: 'TEST_STOP_ID' });
        console.log('✅ [check_stop_times_collection] Test document cleaned up');
        
        diagnostics.stop_times.canWrite = true;
      } catch (err) {
        console.error('❌ [check_stop_times_collection] Error creating test document:', err);
        diagnostics.stop_times.canWrite = false;
        diagnostics.stop_times.writeError = err instanceof Error ? err.message : 'Unknown error';
      }
    }
    
    // Check for any mismatch between stops and stop_times
    try {
      // Get a list of stops
      const stopsCollection = mongoose.connection.db.collection('stops');
      const stopsExist = await stopsCollection.countDocuments() > 0;
      
      if (stopsExist && diagnostics.stop_times.exists) {
        // Get sample stop IDs
        const sampleStops = await stopsCollection.find().limit(5).toArray();
        const sampleStopIds = sampleStops.map(stop => stop.stop_id);
        
        diagnostics.stopCompare = {
          sampleStopIds,
          stopsFormat: sampleStopIds.map(id => typeof id)
        };
        
        // Check if any stop_times match these stop IDs
        const matchingStopTimes = await mongoose.connection.db
          .collection('stop_times')
          .find({ stop_id: { $in: sampleStopIds } })
          .limit(5)
          .toArray();
          
        diagnostics.stopCompare.matchingStopTimes = matchingStopTimes.length;
        console.log(`✅ [check_stop_times_collection] Found ${matchingStopTimes.length} stop times matching sample stop IDs`);
        
        if (matchingStopTimes.length === 0 && sampleStopIds.length > 0) {
          // Try a different approach - check if stop IDs might be stored differently
          console.log('🔍 [check_stop_times_collection] Checking for stop ID format differences...');
          
          // Get a sample of stop_times stop IDs
          const stopTimesSamples = await mongoose.connection.db
            .collection('stop_times')
            .find()
            .limit(5)
            .toArray();
            
          if (stopTimesSamples.length > 0) {
            const stopTimesStopIds = stopTimesSamples.map(d => d.stop_id);
            diagnostics.stopCompare.stopTimesStopIds = stopTimesStopIds;
            diagnostics.stopCompare.stopTimesFormat = stopTimesStopIds.map(id => typeof id);
            
            // Try to find if there's a pattern in the ID transformation
            const patterns = [];
            for (let i = 0; i < Math.min(sampleStopIds.length, 5); i++) {
              // Check if stop ID contains numeric part of stop_times ID or vice versa
              const stopId = sampleStopIds[i];
              const numericPart = stopId.replace(/\D/g, '');
              
              const matchingStopTime = await mongoose.connection.db
                .collection('stop_times')
                .findOne({ stop_id: { $regex: numericPart } });
              
              if (matchingStopTime) {
                patterns.push({
                  stopId,
                  numericPart,
                  matchingStopTimeId: matchingStopTime.stop_id,
                  pattern: `${stopId} → ${matchingStopTime.stop_id}`
                });
              }
            }
            
            diagnostics.stopCompare.possibleMappingPatterns = patterns;
            
            console.log(`🔍 [check_stop_times_collection] Sample stop IDs: ${JSON.stringify(sampleStopIds)}`);
            console.log(`🔍 [check_stop_times_collection] Sample stop_times stop IDs: ${JSON.stringify(stopTimesStopIds)}`);
            console.log(`🔍 [check_stop_times_collection] Possible mapping patterns: ${JSON.stringify(patterns)}`);
          }
        }
      }
    } catch (err) {
      console.error('❌ [check_stop_times_collection] Error comparing stops and stop_times:', err);
    }
    
    return NextResponse.json({
      success: true,
      diagnostics
    });
  } catch (error) {
    console.error('❌ [check_departures_collection] Error running diagnostics:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check departures collection',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
