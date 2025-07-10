"use client";

import { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-heatmap';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { ReportDetail } from '@/components/ReportDetail';
import type { Report } from '@/lib/types';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><p>Loading Map...</p></div>
});


export function AdminDashboard() {
  const { reports } = useAppContext();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const handleMarkerClick = (reportId: string) => {
    setSelectedReportId(reportId);
  };
  
  const handleSheetClose = () => {
    setSelectedReportId(null);
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <Card className="lg:col-span-3 h-full shadow-md">
        <CardContent className="p-0 h-full rounded-lg overflow-hidden">
          <Map onMarkerClick={handleMarkerClick} isAdmin={true} />
        </CardContent>
      </Card>
      <ReportDetail reportId={selectedReportId} onOpenChange={handleSheetClose} />
    </div>
  );
}
