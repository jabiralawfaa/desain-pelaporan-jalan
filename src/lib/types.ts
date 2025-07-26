export type DamageLevel = "Low" | "Medium" | "High";
export const damageLevels: DamageLevel[] = ["Low", "Medium", "High"];

export type AreaStatus = "Active" | "Repaired";

export type UserRole = "admin" | "user" | "surveyor";

export type TrafficVolume = "Low" | "Medium" | "High";

export type GeocodingSource = "overpass" | "nominatim" | "fallback" | "error_fallback" | "batch_error_fallback";

export interface Feedback {
  userId: string;
  username: string;
  rating: number; // 1-5
  comment: string;
  submittedAt: string; // ISO string
}

export interface GeocodingMetadata {
  confidence: number; // 0-1 score indicating reliability
  source: GeocodingSource; // Which geocoding service was used
  roadType?: string; // Type of road (motorway, primary, etc.)
  timestamp: number; // When the geocoding was performed
  error?: string; // Error message if geocoding failed
  cacheHit?: boolean; // Whether result came from cache
}

export interface Report {
  id: string;
  image: string; // base64 data URL
  description: string;
  coords: {
    lat: number;
    lng: number;
  };
  damageLevel: DamageLevel;
  reportedAt: string; // ISO string
  address: string;
  reporterRole: UserRole;
<<<<<<< HEAD
  // Enhanced geocoding metadata
  geocodingMetadata?: GeocodingMetadata;
=======
  roadName?: string;
  roadType?: string;
  roadLength?: number;
>>>>>>> dino/main
}

export interface ReportArea {
  id: string;
  streetName: string; // Nama jalan dari geocoding service
  streetCoords: {
    lat: number;
    lng: number;
  };
  reports: Report[];
  status: AreaStatus;
  address: string;
  feedback: Feedback[];
  progress: number; // 0-100
  // SPK Criteria
  trafficVolume: TrafficVolume;
  roadWidth: number; // in meters
  // Enhanced geocoding metadata for the area
  geocodingMetadata?: GeocodingMetadata;
  // Alternative street names from different sources
  alternativeNames?: Array<{
    name: string;
    source: GeocodingSource;
    confidence: number;
  }>;
  // Area quality metrics
  qualityScore?: number; // Overall quality score based on geocoding confidence and report density
}

export interface User {
  username: string;
  email: string;
  password?: string; // Password is not always sent to the client
  role: UserRole;
}

export interface SawResult extends ReportArea {
  score: number;
  ranking: number;
}

// Enhanced geocoding result interface
export interface GeocodingResult {
  streetName: string;
  streetCoords: { lat: number; lng: number };
  confidence: number;
  source: GeocodingSource;
  roadType?: string;
  timestamp: number;
  alternativeResults?: Array<{
    streetName: string;
    streetCoords: { lat: number; lng: number };
    confidence: number;
    source: GeocodingSource;
  }>;
}

// Batch geocoding result
export interface BatchGeocodingResult {
  results: Array<{
    success: boolean;
    data?: GeocodingResult;
    error?: string;
    fallback?: {
      streetName: string;
      streetCoords: { lat: number; lng: number };
    };
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

// Geocoding cache entry
export interface CachedGeocodingResult extends GeocodingResult {
  expiresAt: number;
}

// Geocoding service configuration
export interface GeocodingConfig {
  cacheEnabled: boolean;
  cacheTTL: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
  timeout: number; // milliseconds
  gridSize: number; // for coordinate-based caching
  enableNominatim: boolean;
  enableOverpass: boolean;
  preferredSource: GeocodingSource;
}

// Road type definitions for Indonesia
export type IndonesianRoadType = 
  | "jalan_tol" // Toll road
  | "jalan_arteri" // Arterial road
  | "jalan_primer" // Primary road
  | "jalan_sekunder" // Secondary road
  | "jalan_tersier" // Tertiary road
  | "jalan_umum" // General road
  | "jalan_perumahan" // Residential road
  | "jalan_layanan" // Service road
  | "jalan_setapak" // Track
  | "jalur_pejalan_kaki"; // Pedestrian path

// Road priority mapping for scoring
export interface RoadPriority {
  type: string;
  priority: number; // 0-1, higher is better
  displayName: string;
  indonesianName: string;
}

// Geographic bounds for Indonesia regions
export interface RegionBounds {
  name: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  priority: number; // For overlapping regions
}

// Enhanced report statistics
export interface ReportStatistics {
  totalReports: number;
  activeAreas: number;
  repairedAreas: number;
  averageConfidence: number;
  sourceDistribution: Record<GeocodingSource, number>;
  roadTypeDistribution: Record<string, number>;
  regionDistribution: Record<string, number>;
  qualityMetrics: {
    highConfidence: number; // Reports with confidence > 0.7
    mediumConfidence: number; // Reports with confidence 0.3-0.7
    lowConfidence: number; // Reports with confidence < 0.3
  };
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: number;
    version: string;
    requestId?: string;
  };
}

export interface GeocodingApiResponse extends ApiResponse<GeocodingResult> {
  fallback?: {
    streetName: string;
    streetCoords: { lat: number; lng: number };
  };
}

// Error types for better error handling
export type GeocodingError = 
  | "INVALID_COORDINATES"
  | "API_TIMEOUT"
  | "API_ERROR"
  | "NETWORK_ERROR"
  | "NO_RESULTS_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "SERVICE_UNAVAILABLE";

export interface GeocodingErrorDetails {
  type: GeocodingError;
  message: string;
  retryable: boolean;
  retryAfter?: number; // seconds
}

// Performance monitoring types
export interface GeocodingPerformanceMetrics {
  averageResponseTime: number; // milliseconds
  successRate: number; // 0-1
  cacheHitRate: number; // 0-1
  apiUsage: Record<GeocodingSource, {
    requests: number;
    successes: number;
    failures: number;
    averageResponseTime: number;
  }>;
  errorDistribution: Record<GeocodingError, number>;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score?: number; // Overall quality score
}

export interface CoordinateValidationResult extends ValidationResult {
  isWithinBounds: boolean;
  region?: string;
  suggestedCorrection?: {
    lat: number;
    lng: number;
    reason: string;
  };
}
