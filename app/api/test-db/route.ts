import { NextRequest, NextResponse } from 'next/server';
import connect from '../../lib/db';
import { Stop } from '../../lib/schema';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [test-db] Starting database test...');
    
    // Connect to MongoDB
    console.log('🔌 [test-db] Connecting to MongoDB...');
    await connect();
    console.log('✅ [test-db] MongoDB connected successfully');

    // Check total count
    console.log('🔍 [test-db] Checking total stops...');
    const totalStops = await Stop.countDocuments();
    console.log(`📊 [test-db] Total stops in database: ${totalStops}`);

    if (totalStops === 0) {
      return NextResponse.json({
        success: true,
        message: 'Database connected but no stops found',
        totalStops: 0,
        sampleStops: []
      });
    }

    // Get sample stops
    console.log('🔍 [test-db] Fetching sample stops...');
    const sampleStops = await Stop.find({}).limit(5);
    console.log(`📋 [test-db] Sample stops: ${sampleStops.length}`);
    
    // Print out the actual stop data
    console.log('📋 [test-db] Sample stop details:');
    sampleStops.forEach((stop, index) => {
      console.log(`  ${index + 1}. ${stop.stop_name} (${stop.stop_id})`);
      console.log(`     Code: ${stop.stop_code}`);
      console.log(`     Location: ${stop.stop_lat}, ${stop.stop_lon}`);
      console.log(`     Full document: ${JSON.stringify(stop.toObject())}`);
      console.log('     ────────────────────────────────────────────────');
    });

    // Check indexes
    console.log('🔍 [test-db] Checking indexes...');
    const indexes = await Stop.collection.getIndexes();
    console.log(`📋 [test-db] Available indexes: ${Object.keys(indexes).length}`);
    Object.keys(indexes).forEach(indexName => {
      console.log(`  - ${indexName}: ${JSON.stringify(indexes[indexName])}`);
    });

    // Check if any stops have location field
    console.log('🔍 [test-db] Checking location fields...');
    const stopsWithLocation = await Stop.countDocuments({ location: { $exists: true } });
    console.log(`📍 [test-db] Stops with location field: ${stopsWithLocation}`);

    return NextResponse.json({
      success: true,
      message: 'Database test completed',
      totalStops,
      sampleStops: sampleStops.map(stop => ({
        stop_id: stop.stop_id,
        stop_name: stop.stop_name,
        stop_lat: stop.stop_lat,
        stop_lon: stop.stop_lon,
        hasLocation: !!stop.location,
        location: stop.location
      })),
      indexes: Object.keys(indexes),
      stopsWithLocation
    });

  } catch (error) {
    console.error('❌ [test-db] Database test failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}