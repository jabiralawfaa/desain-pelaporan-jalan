"use client";

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AreaDetail } from './AreaDetail';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Lightbulb, Settings, BarChart3 } from 'lucide-react';
import { RecommendationDialog } from './RecommendationDialog';
import { GeocodingDebugPanel } from './GeocodingDebugPanel';
import { useAppContext } from '@/contexts/AppContext';

const Map = dynamic(() => import('./Map'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted flex items-center justify-center"><p>Loading Map...</p></div>
});


export function AdminDashboard() {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isRecDialogOpen, setIsRecDialogOpen] = useState(false);
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(false);
  const { reportAreas, setAreaDetailOpen } = useAppContext();
  
  const activeReportAreas = reportAreas.filter(area => area.status === 'Active');

  const handleMarkerClick = (areaId: string) => {
    setSelectedAreaId(areaId);
    setAreaDetailOpen(true);
  };
  
  const handleSheetClose = (isOpen: boolean) => {
    if(!isOpen) {
      setSelectedAreaId(null);
      setAreaDetailOpen(false);
    }
  }
  
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 z-0">
        <Map onMarkerClick={handleMarkerClick} isAdmin={true} selectedAreaId={selectedAreaId} />
      </div>

      <div className="absolute top-4 right-4 z-10 hidden sm:block">
        <div className="flex gap-2">
          <Sheet open={isDebugPanelOpen} onOpenChange={setIsDebugPanelOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <BarChart3 className="mr-2 h-4 w-4" />
                Debug Geocoding
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[600px] sm:w-[800px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Geocoding System Debug</SheetTitle>
                <SheetDescription>
                  Monitor and debug the street name geocoding system
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <GeocodingDebugPanel />
              </div>
            </SheetContent>
          </Sheet>
          
          <Button onClick={() => setIsRecDialogOpen(true)} disabled={activeReportAreas.length === 0}>
            <Lightbulb className="mr-2 h-4 w-4" />
            Dapatkan Rekomendasi Perbaikan
          </Button>
        </div>
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
