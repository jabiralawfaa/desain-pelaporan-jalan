
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-heatmap';
import { useAppContext } from '@/contexts/AppContext';
import type { ReportArea } from '@/lib/types';
import { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';
import { Send, Upload, MessageSquare } from 'lucide-react';

const getAreaIcon = (area: ReportArea, isSelected: boolean) => {
  const iconSize: [number, number] = isSelected ? [48, 48] : [40, 40];
  const color = '#22c55e'; // Green color from design
  
  const iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;

  return L.divIcon({
    html: `<div style="background-color: ${color}; border-radius: 50%; width: ${iconSize[0]}px; height: ${iconSize[1]}px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 3px solid white; transform: translate(-50%, -50%); top: 50%; left: 50%;">${iconHtml}</div>`,
    className: 'map-marker-icon',
    iconSize: iconSize,
    iconAnchor: [iconSize[0]/2, iconSize[1]/2],
  });
};

const InformationWindow = ({ area }: { area: ReportArea }) => (
    <div className="w-96">
        <Card className="border-none shadow-none">
            <CardContent className="p-2 space-y-4">
                <div>
                    <h3 className="font-semibold text-base">Information Window</h3>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                        <p><strong>Installation No:</strong> 456</p>
                        <p><strong>Reports:</strong> {area.reports.length}</p>
                        <p><strong>Status:</strong> {area.status}</p>
                        <p><strong>Address:</strong> {area.address}</p>
                    </div>
                </div>

                <div className="border-t pt-4">
                     <h3 className="font-semibold text-base flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Comments
                     </h3>
                    <div className="mt-2 space-y-3 max-h-32 overflow-y-auto text-sm">
                        {area.feedback.length > 0 ? area.feedback.map(fb => (
                             <div key={fb.userId + fb.submittedAt} className="pb-2 border-b">
                                <p className="italic">&quot;{fb.comment}&quot;</p>
                                <p className="text-xs text-muted-foreground text-right">- {fb.username}</p>
                            </div>
                        )) : <p className="text-muted-foreground">No comments yet.</p>}
                    </div>
                </div>

                <div className="mt-4 space-y-2">
                    <Textarea placeholder="Write a comment..." className="text-sm" />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">
                            <Upload className="mr-2 h-4 w-4" /> Attach
                        </Button>
                         <Button size="sm">
                            <Send className="mr-2 h-4 w-4" /> Post
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
);


const HeatmapLayer = () => {
    const map = useMap();
    const { reportAreas } = useAppContext();

    useEffect(() => {
        if (!map || typeof L === 'undefined' || !(L as any).heatLayer) return;

        const points = reportAreas
            .filter(area => area.status === 'Active')
            .flatMap(area => area.reports || [])
            .filter(r => r && r.coords && typeof r.coords.lat === 'number' && typeof r.coords.lng === 'number')
            .map(r => ({ lat: r.coords.lat, lng: r.coords.lng, intensity: 1 }));
        
        const heatLayer = (L as any).heatLayer(points, {
            radius: 25,
            blur: 15,
            maxZoom: 18,
            gradient: {0.4: 'blue', 0.65: 'lime', 1: 'red'}
        }).addTo(map);

        return () => {
            map.removeLayer(heatLayer);
        };
    }, [map, reportAreas]);

    return null;
};

type MapProps = {
  onMarkerClick: (areaId: string) => void;
  isAdmin: boolean;
  selectedAreaId: string | null;
}

export default function Map({ onMarkerClick, isAdmin, selectedAreaId }: MapProps) {
  const { reportAreas, getAreaById } = useAppContext();
  const defaultCenter: L.LatLngExpression = [-8.253, 114.367];

  return (
    <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
      />
      
      {reportAreas
        .filter(area => area && area.streetCoords && typeof area.streetCoords.lat === 'number' && typeof area.streetCoords.lng === 'number')
        .map((area) => {
          let position: [number, number] = [area.streetCoords.lat, area.streetCoords.lng];

          return (
            <Marker
              key={area.id}
              position={position}
              icon={getAreaIcon(area, selectedAreaId === area.id)}
              eventHandlers={{
                click: () => onMarkerClick(area.id),
              }}
              zIndexOffset={selectedAreaId === area.id ? 1000 : 0}
            >
                <Popup className="custom-popup" minWidth={300}>
                    <InformationWindow area={area} />
                </Popup>
            </Marker>
          );
        })
      }
    </MapContainer>
  )
}
