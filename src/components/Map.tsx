
"use client";

import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-heatmap';
import { useAppContext } from '@/contexts/AppContext';
import type { ReportArea, Report } from '@/lib/types';
import { useEffect } from 'react';

const getAreaIcon = (area: ReportArea) => {
  const iconSize: [number, number] = [40, 40];
  let iconHtml = '';
  let color = '';

  if (area.status === 'Repaired') {
    color = '#22c55e'; // Green
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`;
  } else {
    color = '#ef4444'; // Red
    iconHtml = `<div class="relative w-full h-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                    <span class="absolute text-white text-xs font-bold" style="font-size: 10px; top: 55%; left: 50%; transform: translate(-50%, -50%);">${area.reports.length}</span>
                </div>`;
  }
  
  return L.divIcon({
    html: `<div style="background-color: ${color}; border-radius: 50%; width: ${iconSize[0]}px; height: ${iconSize[1]}px; display: flex; justify-content: center; align-items: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid white;">${iconHtml}</div>`,
    className: '',
    iconSize: iconSize,
    iconAnchor: [iconSize[0]/2, iconSize[1]],
    popupAnchor: [0, -iconSize[1]],
  });
};

const getReportIcon = () => {
  const iconSize: [number, number] = [12, 12];
  return L.divIcon({
    html: `<div style="background-color: #f59e0b; border-radius: 50%; width: ${iconSize[0]}px; height: ${iconSize[1]}px; border: 1px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
    className: '',
    iconSize: iconSize,
    iconAnchor: [iconSize[0] / 2, iconSize[1] / 2],
  });
};


const HeatmapLayer = () => {
    const map = useMap();
    const { reportAreas } = useAppContext();

    useEffect(() => {
        if (!map || typeof L === 'undefined' || !L.heatLayer) return;

        const points = reportAreas
            .filter(area => area.status === 'Active')
            .flatMap(area => area.reports)
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

  const selectedArea = selectedAreaId ? getAreaById(selectedAreaId) : null;

  return (
    <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {isAdmin && <HeatmapLayer />}
      {reportAreas.map((area) => (
        <Marker
          key={area.id}
          position={[area.centerCoords.lat, area.centerCoords.lng]}
          icon={getAreaIcon(area)}
          eventHandlers={{
            click: () => onMarkerClick(area.id),
          }}
          zIndexOffset={selectedAreaId === area.id ? 1000 : 0}
        >
        </Marker>
      ))}

      {selectedArea && selectedArea.status === 'Active' && (
        <>
          <Circle 
            center={selectedArea.centerCoords} 
            radius={500} // 500m radius
            pathOptions={{ color: 'rgba(239, 68, 68, 0.7)', fillColor: 'rgba(239, 68, 68, 0.2)', weight: 2 }} 
          />
          {selectedArea.reports.map((report: Report) => (
            <Marker
              key={report.id}
              position={[report.coords.lat, report.coords.lng]}
              icon={getReportIcon()}
            />
          ))}
        </>
      )}

    </MapContainer>
  )
}
