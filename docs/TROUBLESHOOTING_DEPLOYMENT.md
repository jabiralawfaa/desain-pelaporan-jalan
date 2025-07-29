# Troubleshooting Deployment Issues

## Error: "Cannot read properties of undefined (reading 'lat')"

### Deskripsi Masalah
Error ini terjadi saat deploy ke Vercel karena ada data yang tidak konsisten atau null/undefined yang tidak ditangani dengan baik dalam sistem geocoding.

### Root Cause
1. **Data localStorage yang corrupt** - Data lama yang tersimpan di localStorage mungkin tidak memiliki struktur yang konsisten
2. **Missing validation** - Tidak ada validasi yang cukup untuk memastikan data memiliki properti yang diperlukan
3. **Race conditions** - Data mungkin belum ter-load saat komponen mencoba mengaksesnya
4. **API response inconsistency** - Response dari geocoding API mungkin tidak selalu memiliki format yang sama

### Solusi yang Telah Diimplementasikan

#### 1. Enhanced Data Validation di Map.tsx
```typescript
// Sebelum
const points = reportAreas
  .filter(area => area.status === 'Active')
  .flatMap(area => area.reports)
  .map(r => ({ lat: r.coords.lat, lng: r.coords.lng, intensity: 1 }));

// Sesudah
const points = reportAreas
  .filter(area => area.status === 'Active')
  .flatMap(area => area.reports || [])
  .filter(r => r && r.coords && typeof r.coords.lat === 'number' && typeof r.coords.lng === 'number')
  .map(r => ({ lat: r.coords.lat, lng: r.coords.lng, intensity: 1 }));
```

#### 2. Safe Position Calculation
```typescript
// Sebelum
position={area.reports.length > 0 ? [area.reports[0].coords.lat, area.reports[0].coords.lng] : [area.streetCoords.lat, area.streetCoords.lng]}

// Sesudah
let position: [number, number];
if (area.reports && area.reports.length > 0 && area.reports[0] && area.reports[0].coords && 
    typeof area.reports[0].coords.lat === 'number' && typeof area.reports[0].coords.lng === 'number') {
  position = [area.reports[0].coords.lat, area.reports[0].coords.lng];
} else if (area.streetCoords && typeof area.streetCoords.lat === 'number' && typeof area.streetCoords.lng === 'number') {
  position = [area.streetCoords.lat, area.streetCoords.lng];
} else {
  return null; // Skip invalid markers
}
```

#### 3. Data Sanitization di AppContext.tsx
```typescript
// Load report areas with validation
const storedReportAreas = localStorage.getItem('reportAreas');
if (storedReportAreas) {
  try {
    const parsedAreas = JSON.parse(storedReportAreas);
    const validatedAreas = parsedAreas
      .filter((area: any) => area && area.id && area.streetName)
      .map((area: any) => ({
        ...area,
        streetCoords: area.streetCoords && 
                     typeof area.streetCoords.lat === 'number' && 
                     typeof area.streetCoords.lng === 'number' 
                     ? area.streetCoords 
                     : { lat: -8.253, lng: 114.367 }, // Default fallback
        reports: Array.isArray(area.reports) 
                 ? area.reports.filter((report: any) => 
                     report && report.id && report.coords && 
                     typeof report.coords.lat === 'number' && 
                     typeof report.coords.lng === 'number'
                   )
                 : [],
        // ... other validations
      }));
    setReportAreas(validatedAreas);
  } catch (error) {
    console.error("Failed to parse stored report areas:", error);
    setReportAreas([]);
  }
}
```

#### 4. Input Validation di Geocoding Service
```typescript
async getStreetName(lat: number, lng: number): Promise<GeocodingResult> {
  // Validate input coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number' || 
      isNaN(lat) || isNaN(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error(`Invalid coordinates: lat=${lat}, lng=${lng}`);
  }
  // ... rest of the function
}
```

#### 5. Safe Data Access di GeocodingDebugPanel.tsx
```typescript
// Safely get all reports with validation
const allReports = reportAreas
  .filter(area => area && Array.isArray(area.reports))
  .flatMap(area => area.reports)
  .filter(report => report && report.coords && 
          typeof report.coords.lat === 'number' && 
          typeof report.coords.lng === 'number');
```

### Langkah-langkah Debugging

#### 1. Clear Browser Data
```javascript
// Jalankan di browser console untuk clear data lama
localStorage.removeItem('reportAreas');
localStorage.removeItem('geocoding_cache');
localStorage.clear();
```

#### 2. Check Data Integrity
```javascript
// Periksa struktur data di localStorage
const data = localStorage.getItem('reportAreas');
if (data) {
  const parsed = JSON.parse(data);
  console.log('Report Areas:', parsed);
  
  // Check for missing coordinates
  parsed.forEach((area, index) => {
    if (!area.streetCoords || typeof area.streetCoords.lat !== 'number') {
      console.error(`Area ${index} has invalid streetCoords:`, area);
    }
    
    area.reports?.forEach((report, reportIndex) => {
      if (!report.coords || typeof report.coords.lat !== 'number') {
        console.error(`Report ${reportIndex} in area ${index} has invalid coords:`, report);
      }
    });
  });
}
```

#### 3. Monitor Network Requests
```javascript
// Check geocoding API responses
fetch('/api/geocode?lat=-8.253&lng=114.367')
  .then(res => res.json())
  .then(data => {
    console.log('Geocoding response:', data);
    if (!data.streetCoords || typeof data.streetCoords.lat !== 'number') {
      console.error('Invalid geocoding response structure');
    }
  });
```

### Prevention Measures

#### 1. TypeScript Strict Mode
Pastikan `tsconfig.json` menggunakan strict mode:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### 2. Runtime Validation
Gunakan library seperti Zod untuk runtime validation:
```typescript
import { z } from 'zod';

const CoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180)
});

const ReportSchema = z.object({
  id: z.string(),
  coords: CoordinatesSchema,
  // ... other fields
});
```

#### 3. Error Boundaries
Implementasikan Error Boundary untuk menangkap error di production:
```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong with the map.</h1>;
    }
    return this.props.children;
  }
}
```

#### 4. Defensive Programming
Selalu gunakan optional chaining dan nullish coalescing:
```typescript
// Good
const lat = report?.coords?.lat ?? 0;
const reports = area?.reports ?? [];

// Bad
const lat = report.coords.lat;
const reports = area.reports;
```

### Testing di Production

#### 1. Vercel Environment
```bash
# Test build locally
npm run build
npm start

# Check for build errors
npm run lint
npm run type-check
```

#### 2. Monitor Vercel Logs
```bash
# Install Vercel CLI
npm i -g vercel

# View logs
vercel logs [deployment-url]
```

#### 3. Sentry Integration (Recommended)
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
});

// Capture geocoding errors
try {
  const result = await geocodingService.getStreetName(lat, lng);
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'geocoding' },
    extra: { lat, lng }
  });
}
```

### Quick Fixes untuk Production

#### 1. Emergency Fallback
Jika masalah masih terjadi, tambahkan fallback di Map.tsx:
```typescript
const safeReportAreas = reportAreas?.filter(area => {
  try {
    return area && 
           area.streetCoords && 
           typeof area.streetCoords.lat === 'number' && 
           typeof area.streetCoords.lng === 'number';
  } catch (error) {
    console.warn('Invalid area data:', area);
    return false;
  }
}) ?? [];
```

#### 2. Default Coordinates
Gunakan koordinat default untuk area Banyuwangi:
```typescript
const DEFAULT_COORDS = { lat: -8.253, lng: 114.367 };

const getValidCoords = (coords: any) => {
  if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
    return coords;
  }
  return DEFAULT_COORDS;
};
```

#### 3. Graceful Degradation
Jika map gagal load, tampilkan fallback UI:
```typescript
const MapWithFallback = () => {
  const [mapError, setMapError] = useState(false);

  if (mapError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p>Map temporarily unavailable</p>
          <Button onClick={() => setMapError(false)}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary onError={() => setMapError(true)}>
      <Map {...props} />
    </ErrorBoundary>
  );
};
```

### Monitoring dan Alerting

#### 1. Custom Error Tracking
```typescript
const trackError = (error: Error, context: any) => {
  console.error('Geocoding Error:', error);
  
  // Send to monitoring service
  if (typeof window !== 'undefined') {
    fetch('/api/error-tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      })
    }).catch(console.error);
  }
};
```

#### 2. Health Check Endpoint
```typescript
// pages/api/health.ts
export default function handler(req, res) {
  try {
    // Test geocoding service
    const testResult = await geocodingService.getStreetName(-8.253, 114.367);
    
    res.status(200).json({
      status: 'healthy',
      geocoding: 'operational',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

### Kesimpulan

Perbaikan yang telah diimplementasikan mengatasi masalah "Cannot read properties of undefined (reading 'lat')" dengan:

1. **Validasi data yang ketat** di semua level
2. **Safe access patterns** dengan optional chaining
3. **Data sanitization** saat load dari localStorage
4. **Fallback mechanisms** untuk data yang invalid
5. **Error boundaries** untuk graceful degradation

Sistem sekarang lebih robust dan siap untuk production deployment di Vercel.