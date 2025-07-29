import { NextResponse } from 'next/server';
import { geocodingService } from '@/lib/geocoding';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ 
      error: 'Latitude and longitude are required' 
    }, { status: 400 });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  // Validate coordinates
  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ 
      error: 'Invalid latitude or longitude values' 
    }, { status: 400 });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ 
      error: 'Coordinates out of valid range' 
    }, { status: 400 });
  }

  try {
    console.log(`Geocoding request for coordinates: ${latitude}, ${longitude}`);
    
    const result = await geocodingService.getStreetName(latitude, longitude);
    
    console.log(`Geocoding result:`, {
      streetName: result.streetName,
      source: result.source,
      confidence: result.confidence,
      roadType: result.roadType
    });

    // Return result in the format expected by the existing code
    return NextResponse.json({
      streetName: result.streetName,
      streetCoords: result.streetCoords,
      // Additional metadata for debugging and future use
      metadata: {
        confidence: result.confidence,
        source: result.source,
        roadType: result.roadType,
        timestamp: result.timestamp
      }
    });

  } catch (error) {
    console.error('Geocoding API error:', error);
    
    // Return a more informative error response
    return NextResponse.json({ 
      error: 'Failed to fetch street name',
      details: error instanceof Error ? error.message : 'Unknown error',
      fallback: {
        streetName: 'Lokasi Tidak Diketahui',
        streetCoords: { lat: latitude, lng: longitude }
      }
    }, { status: 500 });
  }
}

// Add POST method support for batch geocoding (future enhancement)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { coordinates } = body;

    if (!Array.isArray(coordinates)) {
      return NextResponse.json({ 
        error: 'Coordinates array is required' 
      }, { status: 400 });
    }

    if (coordinates.length > 10) {
      return NextResponse.json({ 
        error: 'Maximum 10 coordinates allowed per batch request' 
      }, { status: 400 });
    }

    const results = await Promise.allSettled(
      coordinates.map(async (coord: { lat: number; lng: number }) => {
        if (typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
          throw new Error('Invalid coordinate format');
        }
        return geocodingService.getStreetName(coord.lat, coord.lng);
      })
    );

    const processedResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return {
          success: true,
          data: {
            streetName: result.value.streetName,
            streetCoords: result.value.streetCoords,
            metadata: {
              confidence: result.value.confidence,
              source: result.value.source,
              roadType: result.value.roadType,
              timestamp: result.value.timestamp
            }
          }
        };
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Unknown error',
          fallback: {
            streetName: 'Lokasi Tidak Diketahui',
            streetCoords: coordinates[index]
          }
        };
      }
    });

    return NextResponse.json({
      results: processedResults,
      summary: {
        total: coordinates.length,
        successful: processedResults.filter(r => r.success).length,
        failed: processedResults.filter(r => !r.success).length
      }
    });

  } catch (error) {
    console.error('Batch geocoding error:', error);
    return NextResponse.json({ 
      error: 'Failed to process batch geocoding request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
