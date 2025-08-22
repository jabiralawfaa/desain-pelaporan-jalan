"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/contexts/AppContext";
import { ReportArea, SawResult } from "@/lib/types";
import { useEffect, useState } from "react";

// Mapping for criteria values to scores (normalized)
const damageLevelScores: Record<string, number> = {
  High: 1,
  Medium: 0.6,
  Low: 0.3,
};
const roadTypeScores: Record<string, number> = {
  motorway: 10,
  trunk: 9,
  primary: 8,
  secondary: 7,
  tertiary: 6,
  unclassified: 5,
  residential: 4,
  service: 3,
  track: 2,
  path: 1,
};

const calculateAverage = (arr: number[]) =>
  arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export function RecommendationDialog({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) {
  const { reportAreas } = useAppContext();
  const [rankedAreas, setRankedAreas] = useState<SawResult[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>();
  const [criterias, setCriterias] = useState<string[] | null>(null);

  useEffect(() => {
    if (isOpen) {
      const activeAreas = reportAreas.filter(
        (area) => area.status === "Active"
      );

      if (activeAreas.length === 0) {
        setRankedAreas([]);
        return;
      }

      // 1. Normalization
      const maxReportCount = Math.max(
        ...activeAreas.map((a) => a.reports.length),
        1
      );

      const normalizedData = activeAreas.map((area) => {
        const avgDamage = calculateAverage(
          area.reports.map((r) => r.scoreDamage || 0)
        );
        const roadType =
          area.geocodingMetadata && area.geocodingMetadata.roadType
            ? roadTypeScores[area.geocodingMetadata.roadType] || 0
            : 0;

        return {
          ...area,
          norm_reportCount: area.reports.length / maxReportCount,
          norm_damageLevel: avgDamage,
          norm_roadType: roadType,
        };
      });

      // 2. Weighted Sum (SAW)
      if (weights) {
        const scoredData = normalizedData.map((area) => ({
          ...area,
          score:
            area.norm_reportCount * weights["jumlah laporan"] +
            area.norm_damageLevel * weights["skor kerusakan"] +
            area.norm_roadType * weights["jenis jalan"],
        }));
        // 3. Ranking
        const sortedData = scoredData
          .sort((a, b) => b.score - a.score)
          .map((area, index) => ({
            ...area,
            ranking: index + 1,
          }));

        setRankedAreas(sortedData);
      } else {
        alert("Gagal memprioritaskan!");
      }
    }
  }, [isOpen, reportAreas]);

  useEffect(() => {
    const criterias = localStorage.getItem("ahpCriterias");
    const weights = localStorage.getItem("ahpResults");

    if (criterias && weights) {
      try {
        const parsedCriterias = JSON.parse(criterias);
        const parsedWeights = JSON.parse(weights);
        setCriterias(parsedCriterias);
        if (typeof parsedWeights !== "string") {
          setWeights(parsedWeights);
        }
      } catch (error) {
        alert("Error: " + error);
        localStorage.removeItem("ahpCriterias");
        localStorage.removeItem("ahpResults");
      }
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Rekomendasi Prioritas Perbaikan Jalan</DialogTitle>
          <DialogDescription>
            Peringkat area kerusakan jalan berdasarkan tingkat urgensi
            menggunakan metode SAW.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Peringkat</TableHead>
                <TableHead>Nama Jalan</TableHead>
                {criterias !== null ? (
                  criterias.map((area) => <TableHead>{area}</TableHead>)
                ) : (
                  <div>Belum ada kriteria</div>
                )}
                <TableHead>Skor Area</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankedAreas.length > 0 ? (
                rankedAreas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="text-center font-bold text-lg">
                      {area.ranking}
                    </TableCell>
                    <TableCell>{area.streetName}</TableCell>
                    <TableCell>{area.geocodingMetadata?.roadType}</TableCell>
                    <TableCell>
                      {calculateAverage(
                        area.reports.map((r) => r.scoreDamage || 0)
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      {area.reports.length}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(area.score * 100).toFixed(2)}
                    </TableCell>
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
