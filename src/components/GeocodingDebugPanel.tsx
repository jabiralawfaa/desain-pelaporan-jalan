"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAppContext } from '@/contexts/AppContext';
import { geocodingService } from '@/lib/geocoding';
import { GeocodingSource, GeocodingMetadata } from '@/lib/types';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  BarChart3,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';

interface GeocodingStats {
  totalReports: number;
  sourceDistribution: Record<GeocodingSource, number>;
  averageConfidence: number;
  qualityDistribution: {
    high: number; // confidence > 0.7
    medium: number; // confidence 0.3-0.7
    low: number; // confidence < 0.3
  };
  recentErrors: Array<{
    timestamp: number;
    error: string;
    coordinates: { lat: number; lng: number };
  }>;
}

const getSourceColor = (source: GeocodingSource): string => {
  const colors = {
    'overpass': 'bg-green-500',
    'nominatim': 'bg-blue-500',
    'fallback': 'bg-yellow-500',
    'error_fallback': 'bg-red-500',
    'batch_error_fallback': 'bg-red-600'
  };
  return colors[source] || 'bg-gray-500';
};

const getSourceIcon = (source: GeocodingSource) => {
  switch (source) {
    case 'overpass':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'nominatim':
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    case 'fallback':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'error_fallback':
    case 'batch_error_fallback':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4 text-gray-600" />;
  }
};

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.7) return 'text-green-600';
  if (confidence >= 0.3) return 'text-yellow-600';
  return 'text-red-600';
};

export function GeocodingDebugPanel() {
  const { reportAreas } = useAppContext();
  const [stats, setStats] = useState<GeocodingStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testCoords, setTestCoords] = useState({ lat: -8.253, lng: 114.367 });
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingGeocode, setIsTestingGeocode] = useState(false);

  useEffect(() => {
    calculateStats();
  }, [reportAreas]);

  const calculateStats = () => {
    // Safely get all reports with validation
    const allReports = reportAreas
      .filter(area => area && Array.isArray(area.reports))
      .flatMap(area => area.reports)
      .filter(report => report && report.coords &&
              typeof report.coords.lat === 'number' &&
              typeof report.coords.lng === 'number');

    const sourceDistribution: Record<GeocodingSource, number> = {
      'overpass': 0,
      'nominatim': 0,
      'fallback': 0,
      'error_fallback': 0,
      'batch_error_fallback': 0
    };

    let totalConfidence = 0;
    let confidenceCount = 0;
    const qualityDistribution = { high: 0, medium: 0, low: 0 };
    const recentErrors: Array<{
      timestamp: number;
      error: string;
      coordinates: { lat: number; lng: number };
    }> = [];

    allReports.forEach(report => {
      if (report && report.geocodingMetadata) {
        const metadata = report.geocodingMetadata;
        
        // Safely increment source distribution
        if (metadata.source && sourceDistribution.hasOwnProperty(metadata.source)) {
          sourceDistribution[metadata.source]++;
        }
        
        if (typeof metadata.confidence === 'number' && !isNaN(metadata.confidence)) {
          totalConfidence += metadata.confidence;
          confidenceCount++;

          if (metadata.confidence >= 0.7) qualityDistribution.high++;
          else if (metadata.confidence >= 0.3) qualityDistribution.medium++;
          else qualityDistribution.low++;
        }

        if (metadata.error && metadata.timestamp && report.coords) {
          recentErrors.push({
            timestamp: metadata.timestamp,
            error: metadata.error,
            coordinates: {
              lat: report.coords.lat,
              lng: report.coords.lng
            }
          });
        }
      }
    });

    // Sort errors by timestamp (most recent first) and limit to 10
    recentErrors.sort((a, b) => b.timestamp - a.timestamp);
    recentErrors.splice(10);

    setStats({
      totalReports: allReports.length,
      sourceDistribution,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      qualityDistribution,
      recentErrors
    });
  };

  const handleRefreshStats = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      calculateStats();
      setIsRefreshing(false);
    }, 500);
  };

  const handleClearCache = () => {
    geocodingService.clearCache();
    alert('Geocoding cache cleared successfully!');
  };

  const handleTestGeocode = async () => {
    if (!testCoords.lat || !testCoords.lng) return;

    setIsTestingGeocode(true);
    try {
      const result = await geocodingService.getStreetName(testCoords.lat, testCoords.lng);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : 'Unknown error',
        streetName: 'Test Failed',
        streetCoords: testCoords,
        confidence: 0,
        source: 'error_fallback',
        timestamp: Date.now()
      });
    } finally {
      setIsTestingGeocode(false);
    }
  };

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Geocoding Debug Panel
          </CardTitle>
          <CardDescription>Loading statistics...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Geocoding Debug Panel
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshStats}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cache
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Monitor geocoding performance and debug issues
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReports}</div>
                <p className="text-xs text-muted-foreground">
                  Across {reportAreas?.length || 0} areas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getConfidenceColor(stats.averageConfidence || 0)}`}>
                  {((stats.averageConfidence || 0) * 100).toFixed(1)}%
                </div>
                <Progress value={(stats.averageConfidence || 0) * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {geocodingService?.getCacheStats()?.size || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cached entries
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Source Distribution</CardTitle>
              <CardDescription>
                Distribution of geocoding sources used for reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.sourceDistribution).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(source as GeocodingSource)}
                      <span className="capitalize">{source.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{count}</Badge>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getSourceColor(source as GeocodingSource)}`}
                          style={{
                            width: `${stats.totalReports > 0 ? (count / stats.totalReports) * 100 : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Distribution</CardTitle>
              <CardDescription>
                Distribution of geocoding confidence levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>High Confidence (≥70%)</span>
                  </div>
                  <Badge variant="secondary">{stats.qualityDistribution.high}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span>Medium Confidence (30-70%)</span>
                  </div>
                  <Badge variant="secondary">{stats.qualityDistribution.medium}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span>Low Confidence (&lt;30%)</span>
                  </div>
                  <Badge variant="secondary">{stats.qualityDistribution.low}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
              <CardDescription>
                Latest geocoding errors and issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentErrors.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No recent errors found. Geocoding system is working well!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {stats.recentErrors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">{error.error}</div>
                          <div className="text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {error.coordinates?.lat?.toFixed(6) || 'N/A'}, {error.coordinates?.lng?.toFixed(6) || 'N/A'}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Geocoding</CardTitle>
              <CardDescription>
                Test the geocoding system with custom coordinates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={testCoords.lat}
                    onChange={(e) => setTestCoords(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={testCoords.lng}
                    onChange={(e) => setTestCoords(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleTestGeocode} 
                disabled={isTestingGeocode}
                className="w-full"
              >
                {isTestingGeocode ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Test Geocoding
                  </>
                )}
              </Button>

              {testResult && (
                <Alert className={testResult.error ? 'border-red-200' : 'border-green-200'}>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(testResult.source)}
                      <span className="font-medium">
                        {testResult.error ? 'Test Failed' : 'Test Successful'}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><strong>Street Name:</strong> {testResult.streetName}</div>
                      <div><strong>Source:</strong> {testResult.source}</div>
                      <div><strong>Confidence:</strong> 
                        <span className={getConfidenceColor(testResult.confidence)}>
                          {' '}{(testResult.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      {testResult.roadType && (
                        <div><strong>Road Type:</strong> {testResult.roadType}</div>
                      )}
                      {testResult.error && (
                        <div className="text-red-600"><strong>Error:</strong> {testResult.error}</div>
                      )}
                    </div>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}