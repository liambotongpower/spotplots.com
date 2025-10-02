import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { stops, userLocation, address } = await request.json();

    if (!stops || !Array.isArray(stops) || stops.length === 0) {
      return NextResponse.json({ error: 'No stops data provided' }, { status: 400 });
    }

    if (!userLocation || !userLocation.lat || !userLocation.lng) {
      return NextResponse.json({ error: 'User location is required' }, { status: 400 });
    }

    console.log('🗺️ Using OpenStreetMap with Leaflet for map generation');
    console.log('📍 Total stops to display:', stops.length);
    
    // Debug the first few stops to see what data we have
    console.log('🔍 First 3 stops data:');
    stops.slice(0, 3).forEach((stop, index) => {
      console.log(`Stop ${index + 1}:`, {
        stop_id: stop.stop_id,
        stop_code: stop.stop_code,
        stop_name: stop.stop_name,
        distance: stop.distance
      });
    });
    
    // Check for any stops with "825" in their code
    const stopsWith825 = stops.filter(stop => 
      stop.stop_code === '825' || 
      stop.stop_id === '825' || 
      (typeof stop.stop_code === 'string' && stop.stop_code.includes('825')) || 
      (typeof stop.stop_id === 'string' && stop.stop_id.includes('825'))
    );
    console.log('🔍 Server-side stops containing "825":', stopsWith825);
    console.log('🔍 Total stops being sent to map:', stops.length);

    // Calculate map bounds to fit all stops
    const lats = stops.map(stop => stop.stop_lat);
    const lngs = stops.map(stop => stop.stop_lon);
    const userLat = userLocation.lat;
    const userLng = userLocation.lng;

    const minLat = Math.min(...lats, userLat);
    const maxLat = Math.max(...lats, userLat);
    const minLng = Math.min(...lngs, userLng);
    const maxLng = Math.max(...lngs, userLng);

    // Add padding to bounds
    const latPadding = (maxLat - minLat) * 0.1;
    const lngPadding = (maxLng - minLng) * 0.1;

    const bounds = {
      minLat: minLat - latPadding,
      maxLat: maxLat + latPadding,
      minLng: minLng - lngPadding,
      maxLng: maxLng + lngPadding
    };

    // Calculate center point
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;
    const centerLng = (bounds.minLng + bounds.maxLng) / 2;

    // Calculate zoom level based on bounds
    const latDiff = bounds.maxLat - bounds.minLat;
    const lngDiff = bounds.maxLng - bounds.minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    let zoom = 15; // Default zoom
    if (maxDiff > 0.1) zoom = 10;
    else if (maxDiff > 0.05) zoom = 12;
    else if (maxDiff > 0.02) zoom = 14;
    else if (maxDiff > 0.01) zoom = 16;
    else if (maxDiff > 0.005) zoom = 17;

    // Create HTML with Leaflet map
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; height: 100vh; overflow: hidden; }
        #map { width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Initialize map
        const map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Add user location marker
        L.marker([${userLat}, ${userLng}], {
            icon: L.divIcon({
                className: 'user-marker',
                html: '<div style="background-color: #ef4444; color: white; border-radius: 50%; width: 10px; height: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid white; font-size: 6px;">📍</div>',
                iconSize: [10, 10],
                iconAnchor: [5, 5]
            })
        }).addTo(map);
        
        // Add stop markers with stop_code labels
        const stops = ${JSON.stringify(stops)}; // Show ALL stops
        
        console.log('🔍 Debugging stop data in HTML:');
        stops.forEach((stop, index) => {
            console.log(\`Stop \${index + 1}:\`, {
                stop_id: stop.stop_id,
                stop_code: stop.stop_code,
                stop_name: stop.stop_name,
                coordinates: [stop.stop_lat, stop.stop_lon]
            });
        });
        
        // Check for any stops with "825" in their code
        const stopsWith825 = stops.filter(stop => 
            stop.stop_code === '825' || 
            stop.stop_id === '825' || 
            (typeof stop.stop_code === 'string' && stop.stop_code.includes('825')) || 
            (typeof stop.stop_id === 'string' && stop.stop_id.includes('825'))
        );
        console.log('🔍 Stops containing "825":', stopsWith825);
        
        stops.forEach((stop, index) => {
            // ONLY use stop_code from the data - no fallbacks or artificial codes
            let displayText = '';
            
            if (stop.stop_code !== null && stop.stop_code !== undefined) {
                // Use the actual stop_code from the data (including 0)
                displayText = stop.stop_code.toString();
            } else {
                // If no stop_code at all, show a simple dot marker without text
                displayText = '•';
            }
            
            // Truncate to 3 characters for display
            const finalText = displayText.length > 3 ? displayText.substring(0, 3) : displayText;
            
            L.marker([stop.stop_lat, stop.stop_lon], {
                icon: L.divIcon({
                    className: 'stop-marker',
                    html: \`<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 10px; height: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 1px solid white; font-size: 6px;">\${finalText}</div>\`,
                    iconSize: [10, 10],
                    iconAnchor: [5, 5]
                })
            }).addTo(map);
        });
        
        // Fit map to show all markers
        const group = new L.featureGroup();
        stops.forEach(stop => {
            group.addLayer(L.marker([stop.stop_lat, stop.stop_lon]));
        });
        group.addLayer(L.marker([${userLat}, ${userLng}]));
        map.fitBounds(group.getBounds().pad(0.1));
    </script>
</body>
</html>`;

    // Use Puppeteer to take a screenshot of the map
    console.log('📸 Taking screenshot of the map...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set high-resolution viewport for the screenshot
    await page.setViewport({ 
      width: 1920, 
      height: 1080,
      deviceScaleFactor: 2 // 2x pixel density for crisp quality
    });
    
    // Set the HTML content
    await page.setContent(htmlContent);
    
    // Wait for the map to load
    await page.waitForSelector('#map');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Give more time for tiles to load
    
    // Take high-quality screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    
    await browser.close();
    
    // Convert to base64
    const base64Image = screenshot.toString('base64');

    return NextResponse.json({
      success: true,
      imageUrl: `data:image/png;base64,${base64Image}`,
      bounds,
      center: { lat: centerLat, lng: centerLng },
      zoom,
      stopsCount: stops.length,
      displayedStops: stops.length,
      provider: 'openstreetmap-leaflet-screenshot'
    });

  } catch (error) {
    console.error('Error generating map:', error);
    return NextResponse.json(
      { error: 'Failed to generate map', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}