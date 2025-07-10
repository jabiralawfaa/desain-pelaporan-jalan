"use client";

import { useState } from 'react';
import { Map, AdvancedMarker, APIProvider, Pin } from '@vis.gl/react-google-maps';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReportDetail } from '@/components/ReportDetail';
import { AlertTriangle, Wrench, ShieldCheck } from 'lucide-react';
import type { Report } from '@/lib/types';

const MarkerColor = ({ status }: { status: Report['repairStatus'] }) => {
    switch (status) {
        case 'Reported': return <Pin background={'#ef4444'} borderColor={'#ef4444'} glyph={<AlertTriangle className="h-6 w-6 text-white" />} />;
        case 'In Progress': return <Pin background={'#3b82f6'} borderColor={'#3b82f6'} glyph={<Wrench className="h-6 w-6 text-white" />} />;
        case 'Repaired': return <Pin background={'#22c55e'} borderColor={'#22c55e'} glyph={<ShieldCheck className="h-6 w-6 text-white" />} />;
        default: return <Pin />;
    }
};

export function UserDashboard() {
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
