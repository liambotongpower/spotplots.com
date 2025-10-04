const fs = require('fs');
const path = require('path');

// Configuration
const CSV_FILE_PATH = path.join(__dirname, 'F1011.20251003T191045.csv');
const OUTPUT_FILE = path.join(__dirname, 'route_percentiles.csv');
const DETAILED_OUTPUT_FILE = path.join(__dirname, 'detailed_route_results.csv');
const API_BASE_URL = 'http://localhost:3000/api';
const RATE_LIMIT_DELAY = 200; // 5 requests per second
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Validate Google Maps API key
if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ Error: GOOGLE_MAPS_API_KEY environment variable is required');
  console.log('Please set it with: export GOOGLE_MAPS_API_KEY="your_api_key_here"');
  process.exit(1);
}

// Rate limiting function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Google Maps Geocoding API call
async function geocodeLocation(townName) {
  try {
    const encodedTownName = encodeURIComponent(`${townName}, Ireland`);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedTownName}&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        success: true,
        formatted_address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        place_id: result.place_id
      };
    } else {
      console.warn(`⚠️  Geocoding failed for "${townName}": ${data.status}`);
      return { success: false, error: data.status };
    }
  } catch (error) {
    console.error(`❌ Geocoding error for "${townName}":`, error.message);
    return { success: false, error: error.message };
  }
}

// Get nearby routes count from your API
async function getNearbyRoutesCount(lat, lng) {
  try {
    const url = `${API_BASE_URL}/get_nearby_routes?lat=${lat}&lng=${lng}&maxDistance=1000&useManual=true`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`⚠️  HTTP ${response.status} for lat:${lat}, lng:${lng}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
    const data = await response.json();
    
    if (data.success && data.results && data.results.totalRoutes !== undefined) {
      return {
        success: true,
        totalRoutes: data.results.totalRoutes,
        totalDepartures: data.results.totalDepartures,
        routes: data.results.routes
      };
    } else {
      console.warn(`⚠️  API call failed for lat:${lat}, lng:${lng}:`, data.error || 'Unknown error');
      return { success: false, error: data.error || data.message || 'Unknown error' };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`❌ Connection refused - is the dev server running? (lat:${lat}, lng:${lng})`);
      return { success: false, error: 'Connection refused - dev server not running' };
    }
    console.error(`❌ API error for lat:${lat}, lng:${lng}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Parse CSV and extract unique electoral division names
function parseCSV() {
  try {
    const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf8');
    const lines = csvContent.split('\n');
    
    // Skip header row
    const dataLines = lines.slice(1).filter(line => line.trim());
    
    const electoralDivisions = new Set();
    
    dataLines.forEach(line => {
      // Match electoral division format: "Division Name, County"
      const match = line.match(/"([^"]+), ([^"]+)","Number"/);
      if (match) {
        const divisionName = match[1];
        const county = match[2];
        // Use division name for geocoding, but store county for reference
        electoralDivisions.add(divisionName);
      }
    });
    
    console.log(`📊 Found ${electoralDivisions.size} unique electoral divisions in CSV`);
    return Array.from(electoralDivisions);
  } catch (error) {
    console.error('❌ Error reading CSV file:', error.message);
    process.exit(1);
  }
}

// Calculate percentiles
function calculatePercentiles(routeCounts) {
  const sortedCounts = [...routeCounts].sort((a, b) => a - b);
  const n = sortedCounts.length;
  
  const percentiles = {};
  
  for (let p = 1; p <= 99; p++) {
    const index = Math.ceil((p / 100) * n) - 1;
    percentiles[p] = sortedCounts[Math.max(0, index)];
  }
  
  return percentiles;
}

// Main processing function
async function processElectoralDivisions() {
  console.log('🚀 Starting electoral division route processing with Google Maps geocoding...\n');
  
  const electoralDivisions = parseCSV();
  
  // Remove test limit for full processing
  // if (electoralDivisions.length > 5) {
  //   console.log(`🧪 Testing mode: Processing only first 5 electoral divisions instead of all ${electoralDivisions.length}`);
  //   electoralDivisions.splice(5);
  // }
  const results = [];
  const detailedResults = [];
  
  console.log(`📍 Processing ${electoralDivisions.length} electoral divisions...\n`);
  
  for (let i = 0; i < electoralDivisions.length; i++) {
    const division = electoralDivisions[i];
    console.log(`[${i + 1}/${electoralDivisions.length}] Processing: ${division}`);
    
    // Geocode the electoral division
    const geocodeResult = await geocodeLocation(division);
    
    if (!geocodeResult.success) {
      console.log(`   ❌ Geocoding failed: ${geocodeResult.error}\n`);
      detailedResults.push({
        division_name: division,
        status: 'geocoding_failed',
        error: geocodeResult.error,
        route_count: null,
        total_departures: null
      });
      continue;
    }
    
    console.log(`   📍 Geocoded to: ${geocodeResult.formatted_address}`);
    console.log(`   📐 Coordinates: ${geocodeResult.lat}, ${geocodeResult.lng}`);
    
    // Rate limiting
    await delay(RATE_LIMIT_DELAY);
    
    // Get nearby routes count
    const routesResult = await getNearbyRoutesCount(geocodeResult.lat, geocodeResult.lng);
    
    if (!routesResult.success) {
      console.log(`   ❌ API call failed: ${routesResult.error}\n`);
      detailedResults.push({
        division_name: division,
        formatted_address: geocodeResult.formatted_address,
        lat: geocodeResult.lat,
        lng: geocodeResult.lng,
        status: 'api_failed',
        error: routesResult.error,
        route_count: null,
        total_departures: null
      });
      continue;
    }
    
    console.log(`   🚌 Found ${routesResult.totalRoutes} unique routes with ${routesResult.totalDepartures} daily departures\n`);
    
    results.push(routesResult.totalRoutes);
    detailedResults.push({
      division_name: division,
      formatted_address: geocodeResult.formatted_address,
      lat: geocodeResult.lat,
      lng: geocodeResult.lng,
      status: 'success',
      error: null,
      route_count: routesResult.totalRoutes,
      total_departures: routesResult.totalDepartures
    });
  }
  
  console.log('📊 Calculating percentiles...');
  const percentiles = calculatePercentiles(results);
  
  // Create percentile mapping
  const sortedResults = [...results].sort((a, b) => a - b);
  const percentileMapping = {};
  
  sortedResults.forEach((count, index) => {
    const percentile = Math.round(((index + 1) / sortedResults.length) * 100);
    if (!percentileMapping[count]) {
      percentileMapping[count] = percentile;
    }
  });
  
  // Write detailed results CSV
  const detailedCSV = [
    'division_name,formatted_address,lat,lng,status,error,route_count,total_departures',
    ...detailedResults.map(r => [
      r.division_name,
      r.formatted_address || '',
      r.lat || '',
      r.lng || '',
      r.status,
      r.error || '',
      r.route_count || '',
      r.total_departures || ''
    ].join(','))
  ].join('\n');
  
  fs.writeFileSync(DETAILED_OUTPUT_FILE, detailedCSV);
  console.log(`📄 Detailed results saved to: ${DETAILED_OUTPUT_FILE}`);
  
  // Write main percentiles CSV
  const percentilesCSV = [
    'percentile,route_count',
    ...Object.entries(percentiles).map(([p, count]) => `${p},${count}`)
  ].join('\n');
  
  fs.writeFileSync(OUTPUT_FILE, percentilesCSV);
  console.log(`📄 Route percentiles saved to: ${OUTPUT_FILE}`);
  
  // Summary statistics
  console.log('\n📈 Summary Statistics:');
  console.log(`   Total electoral divisions processed: ${detailedResults.length}`);
  console.log(`   Successful: ${detailedResults.filter(r => r.status === 'success').length}`);
  console.log(`   Failed geocoding: ${detailedResults.filter(r => r.status === 'geocoding_failed').length}`);
  console.log(`   Failed API calls: ${detailedResults.filter(r => r.status === 'api_failed').length}`);
  console.log(`   Min routes: ${Math.min(...results)}`);
  console.log(`   Max routes: ${Math.max(...results)}`);
  console.log(`   Average routes: ${(results.reduce((a, b) => a + b, 0) / results.length).toFixed(2)}`);
  
  console.log('\n🎯 Sample Percentiles:');
  [1, 10, 25, 50, 75, 90, 99].forEach(p => {
    console.log(`   ${p}th percentile: ${percentiles[p]} routes`);
  });
  
  console.log('\n✅ Route processing complete!');
}

// Run the script
processElectoralDivisions().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
