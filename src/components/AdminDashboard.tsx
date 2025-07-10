"use client";

import { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
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
    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-0">
        <Map onMarkerClick={handleMarkerClick} isAdmin={true} />
      </div>
      <ReportDetail reportId={selectedReportId} onOpenChange={handleSheetClose} />
    </div>
  );
}
