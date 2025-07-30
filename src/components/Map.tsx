
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-heatmap';
import { useAppContext } from '@/contexts/AppContext';
import type { Report, ReportArea } from '@/lib/types';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Send, Star, MessageSquare, AlertTriangle, ShieldCheck, Percent, Save } from 'lucide-react';
import { Badge } from './ui/badge';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


const getAreaIcon = (area: ReportArea, isSelected: boolean) => {
  const iconSize: [number, number] = isSelected ? [48, 48] : [40, 40];
  let color = '#ef4444'; // Red for 'butuh perbaikan'
  let iconHtml = `<div class="w-full h-full flex flex-col items-center justify-center text-white font-bold text-xs"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg><span class="mt-0.5">${area.reports.length}</span></div>`;

  if (area.progress > 0 && area.progress < 100) {
    color = '#f59e0b'; // Yellow for 'in progress'
    iconHtml = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-base">${area.progress}<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-percent"><path d="M19 5L5 19"></path><path d="M6.5 6.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"></path><path d="M17.5 17.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"></path></svg></div>`;
  } else if (area.progress === 100) {
    color = '#22c55e'; // Green for 'repaired'
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>`;
  }

  return L.divIcon({
    html: `<div style="background-color: ${color}; border-radius: 50%; width: ${iconSize[0]}px; height: ${iconSize[1]}px; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2); border: 3px solid white; transform: translate(-50%, -50%); top: 50%; left: 50%;">${iconHtml}</div>`,
    className: 'map-marker-icon',
    iconSize: iconSize,
    iconAnchor: [iconSize[0]/2, iconSize[1]/2],
  });
};


const ReportCard = ({ report }: { report: Report }) => (
    <Card className={`overflow-hidden ${report.reporterRole === 'surveyor' ? 'bg-blue-50 border-blue-200' : ''}`}>
        <CardContent className="p-3">
            <div className="flex gap-3">
                <div className="w-24 h-24 rounded-md overflow-hidden flex-shrink-0">
                    <Image src={report.image} alt="damage report" width={96} height={96} className="object-cover w-full h-full" />
                </div>
                <div className="text-xs space-y-1">
                    <p><strong>Alamat:</strong> {report.address}</p>
                    <p><strong>Deskripsi:</strong> {report.description || '-'}</p>
                    <div className="flex items-center gap-1"><strong>Dilaporkan oleh:</strong> <Badge variant={report.reporterRole === 'surveyor' ? 'default' : 'secondary'} className={report.reporterRole === 'surveyor' ? 'bg-blue-600' : ''}>{report.reporterRole}</Badge></div>
                    <p className="text-gray-400">{new Date(report.reportedAt).toLocaleString()}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);


const InformationWindow = ({ area, isAdmin }: { area: ReportArea, isAdmin: boolean }) => {
    const { addFeedback, updateAreaProgress, user } = useAppContext();
    const { toast } = useToast();
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(0);
    const [progress, setProgress] = useState(area.progress);

    const handleFeedbackSubmit = async () => {
        if (!user) return;
        
        const isRepaired = area.status === 'Repaired';
        if (!comment || (isRepaired && rating === 0)) {
            toast({ variant: 'destructive', title: 'Error', description: isRepaired ? 'Please provide a comment and rating.' : 'Please provide a comment.' });
            return;
        }

        await addFeedback(area.id, {
            userId: user.username,
            username: user.username,
            comment,
            rating: isRepaired ? rating : 0,
            submittedAt: new Date().toISOString()
        });
        setComment('');
        setRating(0);
        toast({ title: 'Success', description: 'Your feedback has been submitted.' });
    };
    
    const handleProgressSave = () => {
        const newProgress = Number(progress);
        if (newProgress >= 0 && newProgress <= 100) {
            updateAreaProgress(area.id, newProgress);
            toast({ title: 'Progress Updated', description: `Progress for ${area.streetName} set to ${newProgress}%` });
        } else {
            toast({ variant: 'destructive', title: 'Invalid Progress', description: 'Progress must be between 0 and 100.' });
        }
    };
    
    // Sort reports: surveyors' reports first
    const sortedReports = [...area.reports].sort((a, b) => {
        if (a.reporterRole === 'surveyor' && b.reporterRole !== 'surveyor') return -1;
        if (a.reporterRole !== 'surveyor' && b.reporterRole === 'surveyor') return 1;
        return 0;
    });

    return (
        <div className="w-96">
            <Card className="border-none shadow-none">
                <CardContent className="p-2 space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg">{area.streetName}</h3>
                        <p className="text-sm text-muted-foreground">{area.address}</p>
                        <div className="mt-2 flex items-center gap-2">
                             <Badge variant={area.status === 'Active' ? 'destructive' : 'default'}>{area.status}</Badge>
                            <span>Progress: {area.progress}%</span>
                        </div>
                    </div>
                    
                    {isAdmin && area.status === 'Active' && (
                        <div className="border-t pt-4 space-y-2">
                           <h4 className="font-semibold text-sm">Update Progress Perbaikan</h4>
                           <div className="flex items-center gap-2">
                               <Input 
                                 type="number" 
                                 min="0"
                                 max="100"
                                 value={progress}
                                 onChange={(e) => setProgress(Number(e.target.value))}
                                 className="w-24 h-8"
                               />
                               <span className="text-lg font-bold">%</span>
                               <Button size="sm" onClick={handleProgressSave}>
                                   <Save className="mr-2 h-4 w-4"/>
                                   Simpan
                               </Button>
                           </div>
                        </div>
                    )}

                    <Tabs defaultValue="reports" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="reports">Laporan ({area.reports.length})</TabsTrigger>
                            <TabsTrigger value="feedback">Umpan Balik ({area.feedback.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="reports">
                            <div className="mt-2 space-y-3 max-h-48 overflow-y-auto">
                               {sortedReports.length > 0 ? sortedReports.map(report => (
                                   <ReportCard key={report.id} report={report} />
                               )) : <p className="text-muted-foreground text-sm">No reports for this area.</p>}
                            </div>
                        </TabsContent>
                        <TabsContent value="feedback">
                            <div className="mt-2 space-y-3 max-h-32 overflow-y-auto text-sm">
                               {area.feedback.length > 0 ? area.feedback.map(fb => (
                                    <div key={fb.userId + fb.submittedAt} className="pb-2 border-b">
                                       {fb.rating > 0 && (
                                           <div className="flex items-center">
                                               {[...Array(5)].map((_, i) => (
                                                   <Star key={i} className={`h-4 w-4 ${i < fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                               ))}
                                           </div>
                                       )}
                                       <p className="italic">&quot;{fb.comment}&quot;</p>
                                       <p className="text-xs text-muted-foreground text-right">- {fb.username}</p>
                                   </div>
                               )) : <p className="text-muted-foreground">Belum ada umpan balik.</p>}
                           </div>

                           <div className="mt-4 space-y-2">
                                <h4 className="font-semibold text-sm">Beri Umpan Balik</h4>
                                {area.status === 'Repaired' && (
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-6 w-6 cursor-pointer ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} onClick={() => setRating(i + 1)} />
                                        ))}
                                    </div>
                                )}
                               <Textarea placeholder="Tulis komentar Anda..." className="text-sm" value={comment} onChange={(e) => setComment(e.target.value)} />
                               <div className="flex justify-end gap-2">
                                    <Button size="sm" onClick={handleFeedbackSubmit}>
                                       <Send className="mr-2 h-4 w-4" /> Kirim
                                   </Button>
                               </div>
                           </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

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
  const { reportAreas } = useAppContext();
  const defaultCenter: L.LatLngExpression = [-8.253, 114.367];

  return (
    <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '0.5rem', zIndex: 10 }}>
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
                    <InformationWindow area={area} isAdmin={isAdmin} />
                </Popup>
            </Marker>
          );
        })
      }
    </MapContainer>
  )
}

    