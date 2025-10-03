import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Only log in development to avoid exposing connection string in production
if (process.env.NODE_ENV === 'development') {
  console.log('🔗 MongoDB URI configured');
}

if (!MONGODB_URI) {
  throw new Error('Missing MongoDB connection string. Please define MONGODB_URI in your .env file');
}

// Define the cached connection type with enhanced monitoring
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastHealthCheck: number;
  connectionCount: number;
  errorCount: number;
}

// Extend the global object to include mongoose cache
declare global {
  var mongoose: MongooseCache | undefined;
}

// Initialize the cache if it doesn't exist
if (!global.mongoose) {
  global.mongoose = { 
    conn: null, 
    promise: null, 
    lastHealthCheck: 0,
    connectionCount: 0,
    errorCount: 0
  };
}

const cached = global.mongoose;

// Connection health check function
async function isConnectionHealthy(conn: typeof mongoose): Promise<boolean> {
  try {
    // Check if connection is ready and perform a simple ping
    if (conn.connection.readyState !== 1) {
      return false;
    }
    
    // Perform a lightweight ping to verify connection
    await conn.connection.db?.admin().ping();
    return true;
  } catch (error) {
    console.warn('Connection health check failed:', error);
    return false;
  }
}

// Get optimized connection options based on environment
function getConnectionOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Core connection settings
    bufferCommands: false,
    
    // Optimized pool settings for high-frequency location searches
    maxPoolSize: isProduction ? 20 : 10,        // More connections in production
    minPoolSize: isProduction ? 5 : 3,          // Keep more connections ready
    maxIdleTimeMS: isProduction ? 60000 : 30000, // Keep connections longer in production
    
    // Timeout optimizations for faster response
    serverSelectionTimeoutMS: 2000,             // Faster server selection
    socketTimeoutMS: isProduction ? 30000 : 45000, // Shorter timeout in production
    connectTimeoutMS: 5000,                     // Faster initial connection
    
    // Retry and reliability settings
    retryWrites: true,
    retryReads: true,
    
    // Performance optimizations
    compressors: ['zlib'] as ('zlib' | 'none' | 'snappy' | 'zstd')[], // Enable compression
    zlibCompressionLevel: 6 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, // Balanced compression
    
    // Monitoring and debugging
    monitorCommands: process.env.NODE_ENV === 'development',
    
    // Heartbeat settings for connection health
    heartbeatFrequencyMS: 10000,                // Check connection health every 10s
  };
}

async function connect() {
  // Check if we have a cached connection and verify it's healthy
  if (cached.conn) {
    const now = Date.now();
    const timeSinceLastCheck = now - cached.lastHealthCheck;
    
    // Only check health every 30 seconds to avoid overhead
    if (timeSinceLastCheck > 30000) {
      const isHealthy = await isConnectionHealthy(cached.conn);
      cached.lastHealthCheck = now;
      
      if (isHealthy) {
        return cached.conn;
      } else {
        console.warn('⚠️ Connection unhealthy, reconnecting...');
        cached.conn = null;
        cached.promise = null;
      }
    } else {
      return cached.conn;
    }
  }

  // Create new connection if needed
  if (!cached.promise) {
    const opts = getConnectionOptions();
    cached.connectionCount++;
    
    console.log('🔗 Connecting to MongoDB...');
    
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ MongoDB connected');
      
      // Set up connection event listeners for monitoring
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });
      
      mongoose.connection.on('error', (error) => {
        cached.errorCount++;
        console.error('❌ MongoDB error:', error.message);
      });
      
      return mongoose;
    }).catch((error) => {
      cached.errorCount++;
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
    cached.lastHealthCheck = Date.now();
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    cached.errorCount++;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }
}

// Connection metrics and monitoring functions
export function getConnectionMetrics() {
  return {
    connectionCount: cached.connectionCount,
    errorCount: cached.errorCount,
    lastHealthCheck: cached.lastHealthCheck,
    isConnected: cached.conn?.connection.readyState === 1,
    readyState: cached.conn?.connection.readyState || 0,
    host: cached.conn?.connection.host || 'unknown',
    port: cached.conn?.connection.port || 'unknown',
    name: cached.conn?.connection.name || 'unknown',
  };
}

// Force connection health check (useful for monitoring endpoints)
export async function checkConnectionHealth(): Promise<{
  healthy: boolean;
  metrics: ReturnType<typeof getConnectionMetrics>;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    if (!cached.conn) {
      return {
        healthy: false,
        metrics: getConnectionMetrics(),
      };
    }
    
    const isHealthy = await isConnectionHealthy(cached.conn);
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: isHealthy,
      metrics: getConnectionMetrics(),
      responseTime,
    };
  } catch (error) {
    return {
      healthy: false,
      metrics: getConnectionMetrics(),
      responseTime: Date.now() - startTime,
    };
  }
}

// Graceful shutdown function
export async function disconnect(): Promise<void> {
  try {
    if (cached.conn) {
      await cached.conn.connection.close();
      cached.conn = null;
      cached.promise = null;
    }
  } catch (error) {
    console.error('❌ MongoDB disconnect error:', error);
    throw error;
  }
}

// Connection pool status for debugging
export function getPoolStatus() {
  if (!cached.conn) {
    return { status: 'not_connected' };
  }
  
  const connection = cached.conn.connection;
  return {
    status: connection.readyState === 1 ? 'connected' : 'disconnected',
    readyState: connection.readyState,
    host: connection.host,
    port: connection.port,
    name: connection.name,
    // Note: poolSize might not be available in all MongoDB driver versions
    poolSize: 'unknown', // Pool size not directly accessible in current driver version
  };
}

export default connect;

