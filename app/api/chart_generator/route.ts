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

    // Sort routes by departures (descending)
    const sortedRoutes = routes.sort((a, b) => b.departures - a.departures);

    // If we have 20 or fewer routes, create a single chart
    if (sortedRoutes.length <= 20) {
      return generateSingleChart(sortedRoutes);
    }

    // For more than 20 routes, create multiple stacked charts
    return generateMultipleCharts(sortedRoutes);

  } catch (error) {
    console.error('❌ Error generating chart:', error);
    return NextResponse.json(
      { error: 'Failed to generate chart' },
      { status: 500 }
    );
  }
}

function generateSingleChart(routes: any[]) {
  const width = 1200;
  const barsAreaBottom = 80 + routes.length * 30; // bars start at 80px; each row is 30px
  const tickLabelOffset = 20; // space for tick labels below the axis
  const xLabelOffset = 40; // space between ticks and the x-axis label
  const height = Math.max(600, barsAreaBottom + tickLabelOffset + xLabelOffset + 10);
  const maxDepartures = Math.max(...routes.map(route => route.departures));

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
      
      <!-- Grid lines and bars -->
      ${routes.map((route, index) => {
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
          <line x1="${x}" y1="${barsAreaBottom}" x2="${x}" y2="${barsAreaBottom + 5}" class="grid-line" />
          <text x="${x}" y="${barsAreaBottom + tickLabelOffset}" text-anchor="middle" class="tick-label">${value}</text>
        `;
      }).join('')}

      <!-- X-axis label -->
      <text x="${width/2}" y="${barsAreaBottom + tickLabelOffset + xLabelOffset}" text-anchor="middle" class="axis-label">Daily Departures</text>
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
}

function generateMultipleCharts(routes: any[]) {
  const routesPerChart = 20;
  const totalCharts = Math.ceil(routes.length / routesPerChart);

  const chartWidth = 1200;
  const chartSpacing = 120; // increased spacing between charts

  const maxDepartures = Math.max(...routes.map(route => route.departures));

  // First, compute dynamic heights for each chart
  const chartHeights: number[] = [];
  for (let i = 0; i < totalCharts; i++) {
    const startIndex = i * routesPerChart;
    const endIndex = Math.min(startIndex + routesPerChart, routes.length);
    const count = endIndex - startIndex;
    const barsAreaBottom = 80 + count * 30;
    const tickLabelOffset = 20;
    const xLabelOffset = 40;
    const heightForChart = Math.max(600, barsAreaBottom + tickLabelOffset + xLabelOffset + 10);
    chartHeights.push(heightForChart);
  }

  const totalHeight = chartHeights.reduce((sum, h) => sum + h, 0) + chartSpacing * (totalCharts - 1);

  let combinedSvg = `
    <svg width="${chartWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #374151; }
          .axis-label { font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; fill: #374151; }
          .tick-label { font-family: Arial, sans-serif; font-size: 12px; fill: #6B7280; }
          .bar { fill: #3B82F6; stroke: #1E40AF; stroke-width: 1; }
          .grid-line { stroke: #E5E7EB; stroke-width: 1; }
          .chart-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: #374151; }
        </style>
      </defs>
  `;

  // Render charts with dynamic offsets
  let yOffset = 0;
  for (let chartIndex = 0; chartIndex < totalCharts; chartIndex++) {
    const startIndex = chartIndex * routesPerChart;
    const endIndex = Math.min(startIndex + routesPerChart, routes.length);
    const chartRoutes = routes.slice(startIndex, endIndex);
    const chartHeight = chartHeights[chartIndex];

    const barsAreaBottom = yOffset + 80 + chartRoutes.length * 30;
    const tickLabelOffset = 20;
    const xLabelOffset = 40;

    const chartNumber = chartIndex + 1;

    // Chart title
    combinedSvg += `
      <text x="${chartWidth/2}" y="${yOffset + 30}" text-anchor="middle" class="chart-title">
        Transport Routes - Daily Departures (Chart ${chartNumber} of ${totalCharts})
      </text>
    `;

    // Y-axis label for this chart
    combinedSvg += `
      <text x="20" y="${yOffset + chartHeight/2}" text-anchor="middle" transform="rotate(-90, 20, ${yOffset + chartHeight/2})" class="axis-label">Route</text>
    `;

    // Grid lines and bars for this chart
    combinedSvg += chartRoutes.map((route, index) => {
      const barHeight = 25;
      const barY = yOffset + 80 + index * 30;
      const barWidth = (route.departures / maxDepartures) * (chartWidth - 200);
      const labelY = barY + barHeight/2 + 4;
      
      return `
        <!-- Grid line -->
        <line x1="100" y1="${barY + barHeight/2}" x2="${chartWidth-100}" y2="${barY + barHeight/2}" class="grid-line" />
        
        <!-- Bar -->
        <rect x="100" y="${barY}" width="${barWidth}" height="${barHeight}" class="bar" />
        
        <!-- Route label -->
        <text x="90" y="${labelY}" text-anchor="end" class="tick-label">${route.route}</text>
        
        <!-- Departures value -->
        <text x="${100 + barWidth + 5}" y="${labelY}" class="tick-label">${route.departures}</text>
      `;
    }).join('');

    // X-axis ticks for this chart
    combinedSvg += Array.from({length: 6}, (_, i) => {
      const x = 100 + (i * (chartWidth - 200) / 5);
      const value = Math.round((i * maxDepartures) / 5);
      return `
        <line x1="${x}" y1="${barsAreaBottom}" x2="${x}" y2="${barsAreaBottom + 5}" class="grid-line" />
        <text x="${x}" y="${barsAreaBottom + tickLabelOffset}" text-anchor="middle" class="tick-label">${value}</text>
      `;
    }).join('');

    // X-axis label for this chart
    combinedSvg += `
      <text x="${chartWidth/2}" y="${barsAreaBottom + tickLabelOffset + xLabelOffset}" text-anchor="middle" class="axis-label">Daily Departures</text>
    `;

    // advance Y offset for next chart
    yOffset += chartHeight + (chartIndex < totalCharts - 1 ? chartSpacing : 0);
  }

  combinedSvg += '</svg>';

  // Return the combined SVG
  return new NextResponse(combinedSvg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': 'attachment; filename="transport-routes-charts.svg"',
      'Cache-Control': 'no-cache'
    }
  });
}
