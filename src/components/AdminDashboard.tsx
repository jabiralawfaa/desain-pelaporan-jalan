"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AreaDetail } from './AreaDetail';
import { Button } from './ui/button';
import { Lightbulb } from 'lucide-react';
import { RecommendationDialog } from './RecommendationDialog';
import { useAppContext } from '@/contexts/AppContext';

const Map = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><p>Loading Map...</p></div>
});


export function AdminDashboard() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isRecDialogOpen, setIsRecDialogOpen] = useState(false);
  const { reportAreas } = useAppContext();
  
  const activeReportAreas = reportAreas.filter(area => area.status === 'Active');

  const handleMarkerClick = (areaId: string) => {
    setSelectedAreaId(areaId);
  };
  
  const handleSheetClose = () => {
    setSelectedAreaId(null);
  }
  
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-0">
        <Map onMarkerClick={handleMarkerClick} isAdmin={true} selectedAreaId={selectedAreaId} />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <Button onClick={() => setIsRecDialogOpen(true)} disabled={activeReportAreas.length === 0}>
            <Lightbulb className="mr-2 h-4 w-4" />
            Dapatkan Rekomendasi Perbaikan
        </Button>
      </div>

      <AreaDetail areaId={selectedAreaId} onOpenChange={handleSheetClose} />

      <RecommendationDialog 
        isOpen={isRecDialogOpen} 
        onOpenChange={setIsRecDialogOpen}
        areas={activeReportAreas}
      />
    </div>
  );
}
