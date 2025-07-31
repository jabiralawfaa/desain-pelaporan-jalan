"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ANPResult, ReportArea } from '@/lib/types';

interface ANPTopsisIntegrationProps {
  anpResult: ANPResult;
  reportAreas: ReportArea[];
}

interface TopsisResult {
  areaId: string;
  score: number;
  rank: number;
}

// Simple TOPSIS implementation for demonstration with ANP weights
function calculateTopsis(areas: ReportArea[], weights: number[]): TopsisResult[] {
  if (areas.length === 0 || weights.length < 3) return [];

  // Normalize decision matrix and apply weights
  const scores = areas.map(area => {
    // Example criteria values (you can customize these based on your actual criteria)
    const trafficVolumeScore = area.trafficVolume === 'High' ? 3 : area.trafficVolume === 'Medium' ? 2 : 1;
    const damageScore = area.reports.reduce((sum, report) => {
      return sum + (report.damageLevel === 'High' ? 3 : report.damageLevel === 'Medium' ? 2 : 1);
    }, 0) / area.reports.length || 1;
    const reportCountScore = Math.min(area.reports.length, 10) / 10 * 3; // Normalize to 0-3 scale

    const criteriaValues = [trafficVolumeScore, damageScore, reportCountScore];
    
    // Apply ANP weights and calculate weighted score
    const weightedScore = criteriaValues.reduce((sum, value, index) => {
      return sum + (value * (weights[index] || 0));
    }, 0);

    return {
      areaId: area.id,
      score: weightedScore,
      rank: 0 // Will be set after sorting
    };
  });

  // Sort by score (descending) and assign ranks
  scores.sort((a, b) => b.score - a.score);
  scores.forEach((result, index) => {
    result.rank = index + 1;
  });

  return scores;
}

export function ANPTopsisIntegration({ anpResult, reportAreas }: ANPTopsisIntegrationProps) {
  const [topsisResults, setTopsisResults] = useState<TopsisResult[]>([]);
  const [isCalculated, setIsCalculated] = useState(false);

  const handleCalculateTopsis = () => {
    // Use limit weights if available (ANP with interdependencies), otherwise use regular weights
    const weights = anpResult.weights
      .sort((a, b) => parseInt(a.criteriaId) - parseInt(b.criteriaId))
      .map(w => w.limitWeight !== undefined ? w.limitWeight : w.weight);
    
    const results = calculateTopsis(reportAreas, weights);
    setTopsisResults(results);
    setIsCalculated(true);
  };

  const getAreaById = (areaId: string) => {
    return reportAreas.find(area => area.id === areaId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Integrasi ANP-TOPSIS</CardTitle>
          <CardDescription>
            Gunakan bobot kriteria ANP untuk menghitung prioritas perbaikan jalan dengan metode TOPSIS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Bobot Kriteria yang Digunakan:</h4>
              <div className="flex flex-wrap gap-2">
                {anpResult.weights.map((weight) => {
                  const criterion = anpResult.criteria.find(c => c.id === weight.criteriaId);
                  const finalWeight = weight.limitWeight !== undefined ? weight.limitWeight : weight.weight;
                  return (
                    <Badge key={weight.criteriaId} variant="secondary">
                      {criterion?.name}: {(finalWeight * 100).toFixed(1)}%
                      {anpResult.hasInterdependencies && ' (ANP)'}
                    </Badge>
                  );
                })}
              </div>
              {anpResult.hasInterdependencies && (
                <p className="text-sm text-muted-foreground mt-2">
                  Menggunakan bobot limit ANP yang mempertimbangkan interdependensi antar kriteria.
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={handleCalculateTopsis} disabled={isCalculated}>
                {isCalculated ? 'Sudah Dihitung' : 'Hitung Prioritas TOPSIS'}
              </Button>
              {isCalculated && (
                <Button variant="outline" onClick={() => setIsCalculated(false)}>
                  Hitung Ulang
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isCalculated && topsisResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Hasil Prioritas Perbaikan Jalan (ANP-TOPSIS)</CardTitle>
            <CardDescription>
              Ranking berdasarkan kombinasi bobot ANP dan perhitungan TOPSIS
              {anpResult.hasInterdependencies && ' dengan mempertimbangkan interdependensi kriteria'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topsisResults.slice(0, 10).map((result) => {
                const area = getAreaById(result.areaId);
                if (!area) return null;

                return (
                  <div key={result.areaId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={result.rank <= 3 ? 'default' : 'secondary'}>
                        #{result.rank}
                      </Badge>
                      <div>
                        <h4 className="font-medium">{area.streetName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {area.reports.length} laporan • {area.trafficVolume} traffic
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{result.score.toFixed(3)}</p>
                      <p className="text-sm text-muted-foreground">Skor ANP-TOPSIS</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {anpResult.hasInterdependencies && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Catatan ANP:</strong> Hasil ini mempertimbangkan interdependensi antar kriteria, 
                  memberikan analisis yang lebih komprehensif dibandingkan metode hierarkis tradisional.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}