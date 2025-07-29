/**
 * Data Migration and Cleanup Utilities
 * Handles migration from old data structure to new validated structure
 */

import { ReportArea, Report, GeocodingMetadata } from './types';

export interface MigrationResult {
  success: boolean;
  migratedAreas: number;
  migratedReports: number;
  errors: string[];
  warnings: string[];
}

/**
 * Migrate and validate existing localStorage data
 */
export function migrateLocalStorageData(): MigrationResult {
  const result: MigrationResult = {
    success: false,
    migratedAreas: 0,
    migratedReports: 0,
    errors: [],
    warnings: []
  };

  try {
    // Get existing data
    const storedAreas = localStorage.getItem('reportAreas');
    if (!storedAreas) {
      result.success = true;
      result.warnings.push('No existing data found to migrate');
      return result;
    }

    let parsedAreas: any[];
    try {
      parsedAreas = JSON.parse(storedAreas);
    } catch (error) {
      result.errors.push('Failed to parse existing data - data may be corrupted');
      // Clear corrupted data
      localStorage.removeItem('reportAreas');
      return result;
    }

    if (!Array.isArray(parsedAreas)) {
      result.errors.push('Data is not in expected array format');
      localStorage.removeItem('reportAreas');
      return result;
    }

    // Migrate each area
    const migratedAreas: ReportArea[] = [];
    
    for (let i = 0; i < parsedAreas.length; i++) {
      const area = parsedAreas[i];
      
      try {
        const migratedArea = migrateReportArea(area, i);
        if (migratedArea) {
          migratedAreas.push(migratedArea);
          result.migratedAreas++;
          
          // Count migrated reports
          if (migratedArea.reports) {
            result.migratedReports += migratedArea.reports.length;
          }
        }
      } catch (error) {
        result.warnings.push(`Failed to migrate area ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Save migrated data
    localStorage.setItem('reportAreas', JSON.stringify(migratedAreas));
    
    // Clear old cache that might be incompatible
    localStorage.removeItem('geocoding_cache');
    
    result.success = true;
    console.log('Data migration completed:', result);
    
    return result;

  } catch (error) {
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Migrate a single report area
 */
function migrateReportArea(area: any, index: number): ReportArea | null {
  if (!area || typeof area !== 'object') {
    throw new Error(`Area ${index} is not a valid object`);
  }

  // Validate required fields
  if (!area.id || typeof area.id !== 'string') {
    throw new Error(`Area ${index} missing valid ID`);
  }

  if (!area.streetName || typeof area.streetName !== 'string') {
    throw new Error(`Area ${index} missing valid street name`);
  }

  // Validate and fix streetCoords
  let streetCoords = { lat: -8.253, lng: 114.367 }; // Default Banyuwangi coords
  
  if (area.streetCoords && 
      typeof area.streetCoords.lat === 'number' && 
      typeof area.streetCoords.lng === 'number' &&
      !isNaN(area.streetCoords.lat) && 
      !isNaN(area.streetCoords.lng) &&
      area.streetCoords.lat >= -90 && area.streetCoords.lat <= 90 &&
      area.streetCoords.lng >= -180 && area.streetCoords.lng <= 180) {
    streetCoords = area.streetCoords;
  }

  // Migrate reports
  const reports: Report[] = [];
  if (Array.isArray(area.reports)) {
    for (let j = 0; j < area.reports.length; j++) {
      try {
        const migratedReport = migrateReport(area.reports[j], j);
        if (migratedReport) {
          reports.push(migratedReport);
        }
      } catch (error) {
        console.warn(`Failed to migrate report ${j} in area ${index}:`, error);
      }
    }
  }

  // Build migrated area
  const migratedArea: ReportArea = {
    id: area.id,
    streetName: area.streetName,
    streetCoords,
    reports,
    status: area.status === 'Repaired' ? 'Repaired' : 'Active',
    address: area.address || area.streetName,
    feedback: Array.isArray(area.feedback) ? area.feedback : [],
    progress: typeof area.progress === 'number' && !isNaN(area.progress) ? 
             Math.max(0, Math.min(100, area.progress)) : 0,
    trafficVolume: ['Low', 'Medium', 'High'].includes(area.trafficVolume) ? 
                   area.trafficVolume : 'Low',
    roadWidth: typeof area.roadWidth === 'number' && !isNaN(area.roadWidth) ? 
               Math.max(1, area.roadWidth) : 5,
    
    // Migrate or create geocoding metadata
    geocodingMetadata: migrateGeocodingMetadata(area.geocodingMetadata),
    
    // Migrate quality score
    qualityScore: typeof area.qualityScore === 'number' && !isNaN(area.qualityScore) ? 
                  Math.max(0, Math.min(1, area.qualityScore)) : 0.5,
    
    // Migrate alternative names
    alternativeNames: Array.isArray(area.alternativeNames) ?
                      area.alternativeNames.filter((alt: any) =>
                        alt && typeof alt.name === 'string' && typeof alt.confidence === 'number'
                      ) : undefined
  };

  return migratedArea;
}

/**
 * Migrate a single report
 */
function migrateReport(report: any, index: number): Report | null {
  if (!report || typeof report !== 'object') {
    throw new Error(`Report ${index} is not a valid object`);
  }

  // Validate required fields
  if (!report.id || typeof report.id !== 'string') {
    throw new Error(`Report ${index} missing valid ID`);
  }

  if (!report.coords || 
      typeof report.coords.lat !== 'number' || 
      typeof report.coords.lng !== 'number' ||
      isNaN(report.coords.lat) || 
      isNaN(report.coords.lng) ||
      report.coords.lat < -90 || report.coords.lat > 90 ||
      report.coords.lng < -180 || report.coords.lng > 180) {
    throw new Error(`Report ${index} has invalid coordinates`);
  }

  const migratedReport: Report = {
    id: report.id,
    image: report.image || '',
    description: report.description || '',
    coords: {
      lat: report.coords.lat,
      lng: report.coords.lng
    },
    damageLevel: ['Low', 'Medium', 'High'].includes(report.damageLevel) ? 
                 report.damageLevel : 'Medium',
    reportedAt: report.reportedAt || new Date().toISOString(),
    address: report.address || 'Unknown Address',
    reporterRole: ['admin', 'user', 'surveyor'].includes(report.reporterRole) ? 
                  report.reporterRole : 'user',
    geocodingMetadata: migrateGeocodingMetadata(report.geocodingMetadata)
  };

  return migratedReport;
}

/**
 * Migrate geocoding metadata
 */
function migrateGeocodingMetadata(metadata: any): GeocodingMetadata | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const validSources = ['overpass', 'nominatim', 'fallback', 'error_fallback', 'batch_error_fallback'];
  
  return {
    confidence: typeof metadata.confidence === 'number' && !isNaN(metadata.confidence) ? 
                Math.max(0, Math.min(1, metadata.confidence)) : 0.1,
    source: validSources.includes(metadata.source) ? metadata.source : 'fallback',
    roadType: typeof metadata.roadType === 'string' ? metadata.roadType : undefined,
    timestamp: typeof metadata.timestamp === 'number' ? metadata.timestamp : Date.now(),
    error: typeof metadata.error === 'string' ? metadata.error : undefined,
    cacheHit: typeof metadata.cacheHit === 'boolean' ? metadata.cacheHit : undefined
  };
}

/**
 * Clear all application data (use with caution)
 */
export function clearAllData(): void {
  const keys = [
    'reportAreas',
    'geocoding_cache',
    'users',
    'user'
  ];

  keys.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('All application data cleared');
}

/**
 * Validate current data integrity
 */
export function validateDataIntegrity(): {
  isValid: boolean;
  issues: string[];
  stats: {
    totalAreas: number;
    totalReports: number;
    validAreas: number;
    validReports: number;
  };
} {
  const result = {
    isValid: true,
    issues: [] as string[],
    stats: {
      totalAreas: 0,
      totalReports: 0,
      validAreas: 0,
      validReports: 0
    }
  };

  try {
    const storedAreas = localStorage.getItem('reportAreas');
    if (!storedAreas) {
      return result;
    }

    const areas = JSON.parse(storedAreas);
    if (!Array.isArray(areas)) {
      result.isValid = false;
      result.issues.push('Data is not in array format');
      return result;
    }

    result.stats.totalAreas = areas.length;

    areas.forEach((area, areaIndex) => {
      // Validate area
      if (!area || typeof area !== 'object') {
        result.issues.push(`Area ${areaIndex} is not a valid object`);
        result.isValid = false;
        return;
      }

      if (!area.streetCoords || 
          typeof area.streetCoords.lat !== 'number' || 
          typeof area.streetCoords.lng !== 'number') {
        result.issues.push(`Area ${areaIndex} has invalid streetCoords`);
        result.isValid = false;
        return;
      }

      result.stats.validAreas++;

      // Validate reports
      if (Array.isArray(area.reports)) {
        result.stats.totalReports += area.reports.length;
        
        area.reports.forEach((report: any, reportIndex: number) => {
          if (!report || !report.coords || 
              typeof report.coords.lat !== 'number' || 
              typeof report.coords.lng !== 'number') {
            result.issues.push(`Report ${reportIndex} in area ${areaIndex} has invalid coords`);
            result.isValid = false;
          } else {
            result.stats.validReports++;
          }
        });
      }
    });

  } catch (error) {
    result.isValid = false;
    result.issues.push(`Failed to validate data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Create sample data for testing
 */
export function createSampleData(): ReportArea[] {
  const sampleAreas: ReportArea[] = [
    {
      id: 'area-sample-1',
      streetName: 'Jl. Raya Banyuwangi',
      streetCoords: { lat: -8.253, lng: 114.367 },
      reports: [
        {
          id: 'report-sample-1',
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          description: 'Jalan berlubang besar',
          coords: { lat: -8.253, lng: 114.367 },
          damageLevel: 'High',
          reportedAt: new Date().toISOString(),
          address: 'Jl. Raya Banyuwangi',
          reporterRole: 'user',
          geocodingMetadata: {
            confidence: 0.9,
            source: 'overpass',
            roadType: 'primary',
            timestamp: Date.now()
          }
        }
      ],
      status: 'Active',
      address: 'Jl. Raya Banyuwangi',
      feedback: [],
      progress: 0,
      trafficVolume: 'High',
      roadWidth: 8,
      geocodingMetadata: {
        confidence: 0.9,
        source: 'overpass',
        roadType: 'primary',
        timestamp: Date.now()
      },
      qualityScore: 0.85
    }
  ];

  return sampleAreas;
}

/**
 * Auto-run migration on app startup
 */
export function initializeDataMigration(): void {
  if (typeof window === 'undefined') return; // Skip on server-side

  try {
    // Check if migration is needed
    const validation = validateDataIntegrity();
    
    if (!validation.isValid) {
      console.log('Data integrity issues detected, running migration...');
      const migrationResult = migrateLocalStorageData();
      
      if (migrationResult.success) {
        console.log('Data migration completed successfully:', migrationResult);
      } else {
        console.error('Data migration failed:', migrationResult.errors);
        
        // If migration fails, clear data and use sample data
        clearAllData();
        const sampleData = createSampleData();
        localStorage.setItem('reportAreas', JSON.stringify(sampleData));
        console.log('Initialized with sample data');
      }
    } else {
      console.log('Data integrity check passed');
    }
  } catch (error) {
    console.error('Failed to initialize data migration:', error);
  }
}