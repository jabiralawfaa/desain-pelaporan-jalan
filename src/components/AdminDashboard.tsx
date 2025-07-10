"use client";

import { useState, useEffect } from 'react';
import { Map, APIProvider, useMap, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { ReportDetail } from '@/components/ReportDetail';
import type { Report } from '@/lib/types';
import { AlertTriangle, Wrench, ShieldCheck } from 'lucide-react';


const Heatmap = () => {
  const map = useMap();
  const { reports } = useAppContext();

  useEffect(() => {
    if (!map || !window.google.maps.visualization) return;

    const heatmapData = reports.map(r => new google.maps.LatLng(r.coords.lat, r.coords.lng));

    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: map,
    });
    
    heatmap.set('radius', 20);
    heatmap.set('gradient', [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
    ]);

    return () => {
      heatmap.setMap(null);
    };
  }, [map, reports]);

  return null;
};

const MarkerColor = ({ status }: { status: Report['repairStatus'] }) => {
    switch (status) {
        case 'Reported': return <Pin background={'#ef4444'} borderColor={'#ef4444'} glyph={<AlertTriangle className="h-6 w-6 text-white" />} />;
        case 'In Progress': return <Pin background={'#3b82f6'} borderColor={'#3b82f6'} glyph={<Wrench className="h-6 w-6 text-white" />} />;
        case 'Repaired': return <Pin background={'#22c55e'} borderColor={'#22c55e'} glyph={<ShieldCheck className="h-6 w-6 text-white" />} />;
        default: return <Pin />;
    }
};

export function AdminDashboard() {
  const { reports } = useAppContext();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleMarkerClick = (reportId: string) => {
    setSelectedReportId(reportId);
  };
  
  const handleSheetClose = () => {
    setSelectedReportId(null);
  }

  const defaultCenter = { lat: -8.253, lng: 114.367 };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <Card className="lg:col-span-3 h-full shadow-md">
        <CardContent className="p-0 h-full rounded-lg overflow-hidden">
          <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
            <Map
              defaultCenter={defaultCenter}
              defaultZoom={13}
              mapId="b96a4a6b1e5be90f"
              gestureHandling={'greedy'}
              disableDefaultUI={true}
            >
              <Heatmap />
              {reports.map((report) => (
                <AdvancedMarker
                  key={report.id}
                  position={report.coords}
                  onClick={() => handleMarkerClick(report.id)}
                >
                  <MarkerColor status={report.repairStatus} />
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>
        </CardContent>
      </Card>
      <ReportDetail reportId={selectedReportId} onOpenChange={handleSheetClose} />
    </div>
  );
}
