"use client";

import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { ReportDetail } from '@/components/ReportDetail';
import type { Report } from '@/lib/types';
import { AlertTriangle, Wrench, ShieldCheck } from 'lucide-react';

const getIcon = (status: Report['repairStatus']) => {
  const iconSize: [number, number] = [32, 32];
  let iconHtml = '';
  let color = '';

  switch (status) {
    case 'Reported':
      color = '#ef4444';
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`;
      break;
    case 'In Progress':
      color = '#3b82f6';
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrench"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`;
      break;
    case 'Repaired':
      color = '#22c55e';
      iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;
      break;
  }
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${iconHtml}</div>`,
    className: '',
    iconSize: iconSize,
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
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

  const defaultCenter: L.LatLngExpression = [-8.253, 114.367];

  // This is a guard against server-side rendering, where window is not defined.
  if (typeof window === 'undefined') {
    return (
        <Card className="lg:col-span-3 h-full shadow-md">
            <CardContent className="p-0 h-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <p>Loading Map...</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-8rem)]">
      <Card className="lg:col-span-3 h-full shadow-md">
        <CardContent className="p-0 h-full rounded-lg overflow-hidden">
          <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {reports.map((report) => (
              <Marker
                key={report.id}
                position={[report.coords.lat, report.coords.lng]}
                icon={getIcon(report.repairStatus)}
                eventHandlers={{
                  click: () => handleMarkerClick(report.id),
                }}
              >
              </Marker>
            ))}
          </MapContainer>
        </CardContent>
      </Card>
      <ReportDetail reportId={selectedReportId} onOpenChange={handleSheetClose} />
    </div>
  );
}
