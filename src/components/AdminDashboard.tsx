"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AreaDetail } from './AreaDetail';

const Map = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><p>Loading Map...</p></div>
});


export function AdminDashboard() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const handleMarkerClick = (areaId: string) => {
    setSelectedAreaId(areaId);
  };
  
  const handleSheetClose = () => {
    setSelectedAreaId(null);
  }
  
  return (
    <div className="relative h-full w-full">
      <Map onMarkerClick={handleMarkerClick} isAdmin={true} selectedAreaId={selectedAreaId} />
      <AreaDetail areaId={selectedAreaId} onOpenChange={handleSheetClose} />
    </div>
  );
}
