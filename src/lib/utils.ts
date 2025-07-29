import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Enhanced street name retrieval using the new geocoding system
 * @param lat Latitude
 * @param lng Longitude
 * @returns Promise<{ streetName: string, streetCoords: { lat: number, lng: number }, metadata?: any }>
 */
export async function getStreetNameFromOverpass(
  lat: number, 
  lng: number
): Promise<{ 
  streetName: string; 
  streetCoords: { lat: number; lng: number }; 
  metadata?: any 
}> {
  try {
    const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    
    if (!response.ok) {
      // Try to get error details from response
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.fallback) {
        console.warn('Geocoding API failed, using fallback:', errorData.fallback);
        return {
          streetName: errorData.fallback.streetName,
          streetCoords: errorData.fallback.streetCoords,
          metadata: { source: 'fallback', error: errorData.details }
        };
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorData.details || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    // Log geocoding result for debugging
    if (data.metadata) {
      console.log('Geocoding success:', {
        streetName: data.streetName,
        source: data.metadata.source,
        confidence: data.metadata.confidence,
        roadType: data.metadata.roadType
      });
    }
    
    return {
      streetName: data.streetName,
      streetCoords: data.streetCoords,
      metadata: data.metadata
    };
    
  } catch (error) {
    console.error("Failed to fetch street name from geocode API:", error);
    
    // Enhanced fallback with better error handling
    return { 
      streetName: 'Lokasi Tidak Diketahui', 
      streetCoords: { lat, lng },
      metadata: { 
        source: 'error_fallback', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Batch geocoding for multiple coordinates
 * @param coordinates Array of {lat, lng} objects
 * @returns Promise with array of geocoding results
 */
export async function batchGeocode(
  coordinates: { lat: number; lng: number }[]
): Promise<Array<{
  success: boolean;
  streetName?: string;
  streetCoords?: { lat: number; lng: number };
  metadata?: any;
  error?: string;
}>> {
  try {
    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates })
    });

    if (!response.ok) {
      throw new Error(`Batch geocoding failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.results.map((result: any) => ({
      success: result.success,
      streetName: result.success ? result.data.streetName : result.fallback?.streetName,
      streetCoords: result.success ? result.data.streetCoords : result.fallback?.streetCoords,
      metadata: result.success ? result.data.metadata : { source: 'fallback', error: result.error },
      error: result.success ? undefined : result.error
    }));

  } catch (error) {
    console.error("Batch geocoding failed:", error);
    
    // Return fallback results for all coordinates
    return coordinates.map((coord, index) => ({
      success: false,
      streetName: `Lokasi ${index + 1} Tidak Diketahui`,
      streetCoords: coord,
      metadata: { 
        source: 'batch_error_fallback', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}

/**
 * Validate coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns boolean indicating if coordinates are valid
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' && 
    typeof lng === 'number' &&
    !isNaN(lat) && 
    !isNaN(lng) &&
    lat >= -90 && 
    lat <= 90 && 
    lng >= -180 && 
    lng <= 180
  );
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (coord2.lat - coord1.lat) * (Math.PI / 180);
  const dLng = (coord2.lng - coord1.lng) * (Math.PI / 180);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(coord1.lat * (Math.PI / 180)) *
            Math.cos(coord2.lat * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Format coordinates for display
 * @param lat Latitude
 * @param lng Longitude
 * @param precision Number of decimal places
 * @returns Formatted coordinate string
 */
export function formatCoordinates(lat: number, lng: number, precision: number = 6): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

/**
 * Check if coordinates are within Indonesia bounds (rough approximation)
 * @param lat Latitude
 * @param lng Longitude
 * @returns boolean indicating if coordinates are within Indonesia
 */
export function isWithinIndonesia(lat: number, lng: number): boolean {
  return (
    lat >= -11.0 && lat <= 6.0 &&  // Latitude bounds
    lng >= 95.0 && lng <= 141.0     // Longitude bounds
  );
}

/**
 * Get region name based on coordinates (Indonesia-specific)
 * @param lat Latitude
 * @param lng Longitude
 * @returns Region name
 */
export function getIndonesianRegion(lat: number, lng: number): string {
  // Major cities and regions in Indonesia
  const regions = [
    { name: 'Jakarta', bounds: { minLat: -6.4, maxLat: -6.0, minLng: 106.6, maxLng: 107.0 } },
    { name: 'Surabaya', bounds: { minLat: -7.5, maxLat: -7.0, minLng: 112.5, maxLng: 113.0 } },
    { name: 'Bandung', bounds: { minLat: -7.0, maxLat: -6.7, minLng: 107.4, maxLng: 107.8 } },
    { name: 'Medan', bounds: { minLat: 3.4, maxLat: 3.8, minLng: 98.5, maxLng: 98.9 } },
    { name: 'Semarang', bounds: { minLat: -7.2, maxLat: -6.9, minLng: 110.3, maxLng: 110.6 } },
    { name: 'Makassar', bounds: { minLat: -5.3, maxLat: -5.0, minLng: 119.3, maxLng: 119.6 } },
    { name: 'Palembang', bounds: { minLat: -3.1, maxLat: -2.8, minLng: 104.6, maxLng: 104.9 } },
    { name: 'Yogyakarta', bounds: { minLat: -8.0, maxLat: -7.6, minLng: 110.2, maxLng: 110.6 } },
    { name: 'Banyuwangi', bounds: { minLat: -8.5, maxLat: -7.8, minLng: 113.8, maxLng: 114.6 } },
  ];

  for (const region of regions) {
    const { bounds } = region;
    if (
      lat >= bounds.minLat && lat <= bounds.maxLat &&
      lng >= bounds.minLng && lng <= bounds.maxLng
    ) {
      return region.name;
    }
  }

  // Determine province/island based on broader bounds
  if (lat >= -6.5 && lat <= -5.8 && lng >= 106.0 && lng <= 107.2) return 'DKI Jakarta';
  if (lat >= -8.5 && lat <= -6.0 && lng >= 105.0 && lng <= 115.0) return 'Jawa';
  if (lat >= -4.0 && lat <= 6.0 && lng >= 95.0 && lng <= 106.0) return 'Sumatera';
  if (lat >= -4.5 && lat <= 1.0 && lng >= 108.0 && lng <= 119.0) return 'Kalimantan';
  if (lat >= -11.0 && lat <= -8.0 && lng >= 115.0 && lng <= 125.0) return 'Nusa Tenggara';
  if (lat >= -6.0 && lat <= 2.0 && lng >= 119.0 && lng <= 141.0) return 'Indonesia Timur';

  return 'Indonesia';
}

/**
 * Debounce function for API calls
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
