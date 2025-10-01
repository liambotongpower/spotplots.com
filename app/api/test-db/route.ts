import { NextResponse } from 'next/server';
import connect from '@/app/lib/db';

export async function GET() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI from env:', process.env.MONGODB_URI);
    
    const db = await connect();
    
    // Get list of collections as a simple test
    const collections = await db.connection.db?.listCollections().toArray();
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connected successfully!',
      database: db.connection.db?.databaseName,
      collections: collections?.map(c => c.name) || [],
      connectionState: db.connection.readyState, // 1 = connected
    });
  } catch (error) {
    console.error('MongoDB connection test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

