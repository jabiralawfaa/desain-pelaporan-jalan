"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReportArea, SawResult, TrafficVolume } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

interface RecommendationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  areas: ReportArea[];
}

const trafficVolumeToValue = (volume: TrafficVolume): number => {
  switch (volume) {
    case "High": return 3;
    case "Medium": return 2;
    case "Low": return 1;
    default: return 0;
  }
};

const calculateSAW = (areas: ReportArea[]): SawResult[] => {
  if (areas.length === 0) return [];

  // Bobot untuk setiap kriteria (total harus 1)
  const weights = {
    trafficVolume: 0.4, // C1
    reportCount: 0.4,   // C2
    roadWidth: 0.2,     // C3
  };

  // 1. Dapatkan nilai maksimum untuk setiap kriteria (untuk normalisasi)
  const maxValues = {
    trafficVolume: Math.max(...areas.map(a => trafficVolumeToValue(a.trafficVolume))),
    reportCount: Math.max(...areas.map(a => a.reports.length)),
    roadWidth: Math.max(...areas.map(a => a.roadWidth)),
  };

  // 2. Lakukan perhitungan SAW untuk setiap area
  const scoredAreas = areas.map(area => {
    // Normalisasi (semua kriteria adalah 'benefit', jadi rumusnya sama)
    const n_traffic = maxValues.trafficVolume > 0 ? trafficVolumeToValue(area.trafficVolume) / maxValues.trafficVolume : 0;
    const n_reports = maxValues.reportCount > 0 ? area.reports.length / maxValues.reportCount : 0;
    const n_width = maxValues.roadWidth > 0 ? area.roadWidth / maxValues.roadWidth : 0;
    
    // Hitung skor akhir
    const score = 
        (n_traffic * weights.trafficVolume) + 
        (n_reports * weights.reportCount) + 
        (n_width * weights.roadWidth);
        
    return { ...area, score };
  });

  // 3. Urutkan berdasarkan skor dari tertinggi ke terendah dan tambahkan ranking
  const rankedAreas = scoredAreas
    .sort((a, b) => b.score - a.score)
    .map((area, index) => ({
      ...area,
      ranking: index + 1,
    }));
    
  return rankedAreas;
};


export function RecommendationDialog({ isOpen, onOpenChange, areas }: RecommendationDialogProps) {
  const recommendations = calculateSAW(areas);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Rekomendasi Prioritas Perbaikan</DialogTitle>
          <DialogDescription>
            Berdasarkan metode Simple Additive Weighting (SAW), berikut adalah urutan prioritas area yang perlu diperbaiki.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Peringkat</TableHead>
                <TableHead>Alamat Area</TableHead>
                <TableHead className="text-center">Volume Lalin</TableHead>
                <TableHead className="text-center">Jml. Laporan</TableHead>
                <TableHead className="text-center">Lebar Jalan</TableHead>
                <TableHead className="text-right">Skor Akhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map(area => (
                <TableRow key={area.id}>
                  <TableCell className="font-bold text-center">{area.ranking}</TableCell>
                  <TableCell>{area.address}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={area.trafficVolume === 'High' ? 'destructive' : area.trafficVolume === 'Medium' ? 'secondary' : 'default'} className={area.trafficVolume === 'Low' ? 'bg-green-100 text-green-800' : ''}>
                        {area.trafficVolume}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{area.reports.length}</TableCell>
                  <TableCell className="text-center">{area.roadWidth}m</TableCell>
                  <TableCell className="text-right font-medium">{area.score.toFixed(4)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
