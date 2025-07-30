
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/contexts/AppContext';
import { ReportArea, SawResult } from '@/lib/types';
import { useEffect, useState } from 'react';

// SAW (Simple Additive Weighting) criteria weights
const weights = {
  reportCount: 0.4,
  damageLevel: 0.3,
  trafficVolume: 0.3,
};

// Mapping for criteria values to scores (normalized)
const damageLevelScores: Record<string, number> = { High: 1, Medium: 0.6, Low: 0.3 };
const trafficVolumeScores: Record<string, number> = { High: 1, Medium: 0.6, Low: 0.3 };

const calculateAverage = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export function RecommendationDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (isOpen: boolean) => void }) {
  const { reportAreas } = useAppContext();
  const [rankedAreas, setRankedAreas] = useState<SawResult[]>([]);

  useEffect(() => {
    if (isOpen) {
      const activeAreas = reportAreas.filter(area => area.status === 'Active');

      if (activeAreas.length === 0) {
        setRankedAreas([]);
        return;
      }
      
      // 1. Normalization
      const maxReportCount = Math.max(...activeAreas.map(a => a.reports.length), 1);

      const normalizedData = activeAreas.map(area => {
        const avgDamage = calculateAverage(area.reports.map(r => damageLevelScores[r.damageLevel] || 0));
        const trafficScore = trafficVolumeScores[area.trafficVolume] || 0;
        
        return {
          ...area,
          norm_reportCount: area.reports.length / maxReportCount,
          norm_damageLevel: avgDamage,
          norm_trafficVolume: trafficScore,
        };
      });

      // 2. Weighted Sum (SAW)
      const scoredData = normalizedData.map(area => ({
        ...area,
        score:
          (area.norm_reportCount * weights.reportCount) +
          (area.norm_damageLevel * weights.damageLevel) +
          (area.norm_trafficVolume * weights.trafficVolume),
      }));

      // 3. Ranking
      const sortedData = scoredData
        .sort((a, b) => b.score - a.score)
        .map((area, index) => ({
          ...area,
          ranking: index + 1,
        }));
      
      setRankedAreas(sortedData);
    }
  }, [isOpen, reportAreas]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Rekomendasi Prioritas Perbaikan Jalan</DialogTitle>
          <DialogDescription>
            Peringkat area kerusakan jalan berdasarkan tingkat urgensi menggunakan metode SAW.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Peringkat</TableHead>
                <TableHead>Nama Jalan</TableHead>
                <TableHead>Jumlah Laporan</TableHead>
                <TableHead>Lalin</TableHead>
                <TableHead>Skor Akhir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedAreas.length > 0 ? (
                rankedAreas.map(area => (
                  <TableRow key={area.id}>
                    <TableCell className="text-center font-bold text-lg">{area.ranking}</TableCell>
                    <TableCell>{area.streetName}</TableCell>
                    <TableCell className="text-center">{area.reports.length}</TableCell>
                    <TableCell>
                        <Badge variant={
                            area.trafficVolume === 'High' ? 'destructive' :
                            area.trafficVolume === 'Medium' ? 'secondary' : 'default'
                        }>
                            {area.trafficVolume}
                        </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{(area.score * 100).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Tidak ada area kerusakan aktif untuk diberi peringkat.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
