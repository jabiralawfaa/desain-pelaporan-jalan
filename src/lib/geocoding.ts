/**
 * Enhanced Geocoding System for Road Damage Reporting
 * Supports multiple providers with fallback, caching, and retry mechanisms
 */
import { GeocodingMetadata, GeocodingResult as GeocodingResultType, CachedGeocodingResult, GeocodingConfig } from './types';


export interface GeocodingResult extends GeocodingResultType {
  width?: string;
  lanes?: string;
  maxspeed?: string;
  bridge?: string;
  tunnel?: string;
}


const DEFAULT_CONFIG: GeocodingConfig = {
  cacheEnabled: true,
  cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  timeout: 15000, // milliseconds
  gridSize: 0.001, // ~100m grid
  enableNominatim: true,
  enableOverpass: true,
  preferredSource: 'overpass',
};

// Road type priorities for scoring
const ROAD_PRIORITIES: Record<string, number> = {
  motorway: 1.0,
  trunk: 0.9,
  primary: 0.8,
  secondary: 0.7,
  tertiary: 0.6,
  unclassified: 0.5,
  residential: 0.4,
  service: 0.3,
  track: 0.2,
  path: 0.1,
};

// Indonesian road type translations
const ROAD_TYPE_TRANSLATIONS: Record<string, string> = {
  motorway: 'Jalan Tol',
  trunk: 'Jalan Arteri',
  primary: 'Jalan Primer',
  secondary: 'Jalan Sekunder',
  tertiary: 'Jalan Tersier',
  unclassified: 'Jalan Umum',
  residential: 'Jalan Perumahan',
  service: 'Jalan Layanan',
  track: 'Jalan Setapak',
  path: 'Jalur Pejalan Kaki',
};

class GeocodingService {
  private config: GeocodingConfig;
  private cache: Map<string, CachedGeocodingResult> = new Map();

  constructor(config: Partial<GeocodingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadCache();
  }

  /**
   * Main geocoding function with fallback providers
   */
  async getStreetName(lat: number, lng: number): Promise<GeocodingResult> {
    // Validate input coordinates
    if (typeof lat !== 'number' || typeof lng !== 'number' ||
        isNaN(lat) || isNaN(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
    }

    const cacheKey = this.getCacheKey(lat, lng);
    
    // Check cache first
    if (this.config.cacheEnabled) {
      try {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          console.log('Geocoding cache hit:', cached.streetName);
          return cached as GeocodingResult;
        }
      } catch (error) {
        console.warn('Cache retrieval failed:', error);
      }
    }

    let lastError: Error | null = null;

    // Try Overpass API first
    try {
      const result = await this.retryWithBackoff(() =>
        this.getFromOverpass(lat, lng)
      );
      if (result && result.confidence > 0.5) {
        this.saveToCache(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.warn('Overpass API failed:', error);
      lastError = error as Error;
    }

    // Try Nominatim API as fallback
    try {
      const result = await this.retryWithBackoff(() =>
        this.getFromNominatim(lat, lng)
      );
      if (result && result.confidence > 0.3) {
        this.saveToCache(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.warn('Nominatim API failed:', error);
      lastError = error as Error;
    }

    // Final fallback to smart address generation
    console.warn('All geocoding APIs failed, using fallback');
    const fallbackResult = this.generateSmartFallback(lat, lng, lastError);
    this.saveToCache(cacheKey, fallbackResult);
    return fallbackResult;
  }

  /**
   * Enhanced Overpass API query with better road detection
   */
  private async getFromOverpass(lat: number, lng: number): Promise<GeocodingResult> {
    const radius = this.calculateDynamicRadius(lat, lng);
    
    const query = `
      [out:json][timeout:${this.config.timeout / 1000}];
      (
        way(around:${radius},${lat},${lng})[highway~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential)"];
        way(around:${radius * 0.5},${lat},${lng})[highway~"^(motorway|trunk|primary)"];
      );
      out body geom;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    return this.processOverpassResult(data, lat, lng);
  }

  /**
   * Process Overpass API result with improved road selection
   */
  private processOverpassResult(data: any, lat: number, lng: number): GeocodingResult {
    if (!data || !data.elements || !Array.isArray(data.elements) || data.elements.length === 0) {
      throw new Error('No roads found in Overpass result');
    }

    let bestRoad = null;
    let bestScore = 0;

    for (const element of data.elements) {
      if (!element || element.type !== 'way' || !element.tags?.highway) continue;

      try {
        const roadScore = this.calculateRoadScore(element, lat, lng);
        if (roadScore > bestScore) {
          bestScore = roadScore;
          bestRoad = element;
        }
      } catch (error) {
        console.warn('Error calculating road score:', error);
        continue;
      }
    }

    if (!bestRoad) {
      throw new Error('No suitable road found');
    }

    const streetName = this.extractStreetName(bestRoad);
    const streetCoords = this.calculateRoadCoords(bestRoad, lat, lng);
    const roadType = bestRoad.tags?.highway;
    const width = bestRoad.tags?.width;
    const lanes = bestRoad.tags?.lanes;
    const maxspeed = bestRoad.tags?.maxspeed;
    const bridge = bestRoad.tags?.bridge;
    const tunnel = bestRoad.tags?.tunnel;

    // Validate result before returning
    if (!streetName || !streetCoords ||
        typeof streetCoords.lat !== 'number' ||
        typeof streetCoords.lng !== 'number' ||
        isNaN(streetCoords.lat) || isNaN(streetCoords.lng)) {
      throw new Error('Invalid geocoding result generated');
    }

    return {
      streetName,
      streetCoords,
      confidence: Math.min(bestScore, 0.95),
      source: 'overpass',
      roadType,
      width,
      lanes,
      maxspeed,
      bridge,
      tunnel,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculate road score based on distance, type, and name availability
   */
  private calculateRoadScore(road: any, lat: number, lng: number): number {
    if (!road || !road.tags) {
      return 0;
    }

    const roadType = road.tags.highway;
    const hasName = !!road.tags.name;
    
    // Calculate distance to road
    try {
      const roadCoords = this.calculateRoadCoords(road, lat, lng);
      if (!roadCoords || typeof roadCoords.lat !== 'number' || typeof roadCoords.lng !== 'number') {
        return 0;
      }

      const distance = this.calculateDistance(
        { lat, lng },
        roadCoords
      );

      // Base score from road type priority
      let score = ROAD_PRIORITIES[roadType] || 0.1;
      
      // Bonus for having a name
      if (hasName) score *= 1.5;
      
      // Distance penalty (closer is better)
      const distancePenalty = Math.max(0, 1 - (distance / 1000)); // 1km max distance
      score *= distancePenalty;

      return Math.max(0, score);
    } catch (error) {
      console.warn('Error calculating road score:', error);
      return 0;
    }
  }

  /**
   * Extract street name with better fallback logic
   */
  private extractStreetName(road: any): string {
    const tags = road.tags;
    
    // Priority order for name extraction
    if (tags.name) return tags.name;
    if (tags['name:id']) return tags['name:id']; // Indonesian name
    if (tags['name:en']) return tags['name:en']; // English name
    if (tags.ref) return `Jalan ${tags.ref}`;
    
    // Generate name from road type
    const roadType = ROAD_TYPE_TRANSLATIONS[tags.highway] || 'Jalan';
    return `${roadType} Tanpa Nama`;
  }

  /**
   * Calculate road coordinates with better interpolation
   */
  private calculateRoadCoords(road: any, lat: number, lng: number): { lat: number; lng: number } {
    if (!road) {
      return { lat, lng };
    }

    if (road.geometry && Array.isArray(road.geometry) && road.geometry.length > 0) {
      // Find closest point on road geometry
      let closestPoint = null;
      let minDistance = Infinity;

      for (const point of road.geometry) {
        if (!point || typeof point.lat !== 'number' || typeof point.lon !== 'number') {
          continue;
        }

        try {
          const distance = this.calculateDistance(
            { lat, lng },
            { lat: point.lat, lng: point.lon }
          );
          if (distance < minDistance) {
            minDistance = distance;
            closestPoint = point;
          }
        } catch (error) {
          console.warn('Error calculating distance to geometry point:', error);
          continue;
        }
      }

      if (closestPoint) {
        return { lat: closestPoint.lat, lng: closestPoint.lon };
      }
    }

    // Fallback to center or original coordinates
    if (road.center && typeof road.center.lat === 'number' && typeof road.center.lon === 'number') {
      return { lat: road.center.lat, lng: road.center.lon };
    }

    return { lat, lng };
  }

  /**
   * Nominatim API fallback
   */
  private async getFromNominatim(lat: number, lng: number): Promise<GeocodingResult> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'JalanBlambangankuApp/1.0' },
      signal: AbortSignal.timeout(this.config.timeout),
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    return this.processNominatimResult(data, lat, lng);
  }

  /**
   * Process Nominatim result
   */
  private processNominatimResult(data: any, lat: number, lng: number): GeocodingResult {
    if (!data || !data.address) {
      throw new Error('Invalid Nominatim response');
    }

    const address = data.address;
    let streetName = 'Jalan Tidak Diketahui';
    let confidence = 0.3;

    // Extract street name from various address components
    if (address.road) {
      streetName = address.road;
      confidence = 0.7;
    } else if (address.pedestrian) {
      streetName = address.pedestrian;
      confidence = 0.6;
    } else if (address.path) {
      streetName = address.path;
      confidence = 0.5;
    } else if (address.neighbourhood) {
      streetName = `Area ${address.neighbourhood}`;
      confidence = 0.4;
    }

    return {
      streetName,
      streetCoords: { lat: parseFloat(data.lat), lng: parseFloat(data.lon) },
      confidence,
      source: 'nominatim',
      timestamp: Date.now(),
    };
  }

  /**
   * Smart fallback address generation
   */
  private generateSmartFallback(lat: number, lng: number, error?: Error | null): GeocodingResult {
    // Generate more realistic fallback based on coordinates
    const region = this.determineRegion(lat, lng);
    const streetTypes = ['Jalan Utama', 'Jalan Raya', 'Jalan Desa', 'Jalan Lingkungan'];
    const streetType = streetTypes[Math.floor(Math.abs(lat * lng * 1000) % streetTypes.length)];
    
    const streetName = `${streetType} ${region}`;

    return {
      streetName,
      streetCoords: { lat, lng },
      confidence: 0.1,
      source: 'fallback',
      timestamp: Date.now(),
    };
  }

  /**
   * Determine region based on coordinates (Indonesia-specific)
   */
  private determineRegion(lat: number, lng: number): string {
    // Simple region detection for Indonesia
    if (lat >= -8.5 && lat <= -7.5 && lng >= 113.5 && lng <= 115.5) {
      return 'Banyuwangi';
    } else if (lat >= -7.5 && lat <= -6.5 && lng >= 106.5 && lng <= 107.5) {
      return 'Jakarta';
    } else if (lat >= -8.0 && lat <= -7.0 && lng >= 110.0 && lng <= 111.0) {
      return 'Yogyakarta';
    } else if (lat >= -7.5 && lat <= -6.5 && lng >= 107.5 && lng <= 108.5) {
      return 'Bandung';
    }
    
    return 'Area Lokal';
  }

  /**
   * Calculate dynamic radius based on location density
   */
  private calculateDynamicRadius(lat: number, lng: number): number {
    // Urban areas (higher density) = smaller radius
    // Rural areas (lower density) = larger radius
    const baseRadius = 200;
    const maxRadius = 1000;
    
    // Simple heuristic: areas with more decimal precision likely urban
    const precision = (lat.toString().split('.')[1]?.length || 0) + 
                     (lng.toString().split('.')[1]?.length || 0);
    
    const urbanFactor = Math.min(precision / 10, 1);
    return Math.round(baseRadius + (maxRadius - baseRadius) * (1 - urbanFactor));
  }

  /**
   * Retry mechanism with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }

      const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
      console.log(`Geocoding attempt ${attempt} failed, retrying in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryWithBackoff(operation, attempt + 1);
    }
  }

  /**
   * Cache management
   */
  private getCacheKey(lat: number, lng: number): string {
    const gridLat = Math.floor(lat / this.config.gridSize) * this.config.gridSize;
    const gridLng = Math.floor(lng / this.config.gridSize) * this.config.gridSize;
    return `${gridLat.toFixed(6)},${gridLng.toFixed(6)}`;
  }

  private getFromCache(key: string): CachedGeocodingResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached;
  }

  private saveToCache(key: string, result: GeocodingResult): void {
    if (!this.config.cacheEnabled) return;

    const cached: CachedGeocodingResult = {
      ...result,
      expiresAt: Date.now() + this.config.cacheTTL,
    };

    this.cache.set(key, cached);
    this.persistCache();
  }

  private loadCache(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const storedCache = localStorage.getItem('geocoding_cache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        this.cache = new Map(parsedCache);
      }
    } catch (error) {
      console.error("Failed to load geocoding cache:", error);
      this.cache = new Map();
    }
  }

  private persistCache(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const serializedCache = JSON.stringify(Array.from(this.cache.entries()));
      localStorage.setItem('geocoding_cache', serializedCache);
    } catch (error) {
      console.error("Failed to persist geocoding cache:", error);
    }
  }
  

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.lat * (Math.PI / 180)) *
              Math.cos(point2.lat * (Math.PI / 180)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache.clear();
    if(typeof localStorage !== 'undefined') {
        localStorage.removeItem('geocoding_cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // TODO: Implement hit rate tracking
    };
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();

// Export for custom configurations
export { GeocodingService };

    