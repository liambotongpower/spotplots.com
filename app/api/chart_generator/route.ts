import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { routes } = await request.json();

    if (!routes || !Array.isArray(routes) || routes.length === 0) {
      return NextResponse.json(
        { error: 'No routes data provided' },
        { status: 400 }
      );
    }

    // Sort routes by departures (descending) and take top 20 for readability
    const sortedRoutes = routes
      .sort((a, b) => b.departures - a.departures)
      .slice(0, 20);

    // Create SVG chart
    const width = 1200;
    const height = Math.max(600, sortedRoutes.length * 30 + 100);
    const maxDepartures = Math.max(...sortedRoutes.map(route => route.departures));
    
    // Generate SVG chart
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <style>
            .title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #374151; }
            .axis-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #374151; }
            .tick-label { font-family: Arial, sans-serif; font-size: 12px; fill: #6B7280; }
            .bar { fill: #3B82F6; stroke: #1E40AF; stroke-width: 1; }
            .grid-line { stroke: #E5E7EB; stroke-width: 1; }
          </style>
        </defs>
        
        <!-- Title -->
        <text x="${width/2}" y="30" text-anchor="middle" class="title">Transport Routes - Daily Departures</text>
        
        <!-- Y-axis label -->
        <text x="20" y="${height/2}" text-anchor="middle" transform="rotate(-90, 20, ${height/2})" class="axis-label">Route</text>
        
        <!-- X-axis label -->
        <text x="${width/2}" y="${height-10}" text-anchor="middle" class="axis-label">Daily Departures</text>
        
        <!-- Grid lines and bars -->
        ${sortedRoutes.map((route, index) => {
          const barHeight = 25;
          const barY = 80 + index * 30;
          const barWidth = (route.departures / maxDepartures) * (width - 200);
          const labelY = barY + barHeight/2 + 4;
          
          return `
            <!-- Grid line -->
            <line x1="100" y1="${barY + barHeight/2}" x2="${width-100}" y2="${barY + barHeight/2}" class="grid-line" />
            
            <!-- Bar -->
            <rect x="100" y="${barY}" width="${barWidth}" height="${barHeight}" class="bar" />
            
            <!-- Route label -->
            <text x="90" y="${labelY}" text-anchor="end" class="tick-label">${route.route}</text>
            
            <!-- Departures value -->
            <text x="${100 + barWidth + 5}" y="${labelY}" class="tick-label">${route.departures}</text>
          `;
        }).join('')}
        
        <!-- X-axis ticks -->
        ${Array.from({length: 6}, (_, i) => {
          const x = 100 + (i * (width - 200) / 5);
          const value = Math.round((i * maxDepartures) / 5);
          return `
            <line x1="${x}" y1="${80 + sortedRoutes.length * 30}" x2="${x}" y2="${80 + sortedRoutes.length * 30 + 5}" class="grid-line" />
            <text x="${x}" y="${80 + sortedRoutes.length * 30 + 20}" text-anchor="middle" class="tick-label">${value}</text>
          `;
        }).join('')}
      </svg>
    `;

    // Return the SVG
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': 'attachment; filename="transport-routes-chart.svg"',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Error generating chart:', error);
    return NextResponse.json(
      { error: 'Failed to generate chart' },
      { status: 500 }
    );
  }
}
