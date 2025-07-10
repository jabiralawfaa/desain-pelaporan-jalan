"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AreaDetail } from './AreaDetail';

const Map = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><p>Loading Map...</p></div>
});

export function UserDashboard() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const handleMarkerClick = (areaId: string) => {
    setSelectedAreaId(areaId);
  };

  const handleSheetClose = () => {
    setSelectedAreaId(null);
  }

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-0">
        <Map onMarkerClick={handleMarkerClick} isAdmin={false} selectedAreaId={selectedAreaId} />
      </div>
      <AreaDetail areaId={selectedAreaId} onOpenChange={handleSheetClose} />
    </div>
  );
}
