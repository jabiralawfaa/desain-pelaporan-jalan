"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Calculator, CheckCircle, AlertCircle, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import { ANPCriteria, ANPPairwiseComparison, ANPResult, ANP_SCALE_VALUES } from '@/lib/types';
import { processANP, generateRequiredComparisons, validateComparisons } from '@/lib/anp-utils';
import { ANPTopsisIntegration } from '@/components/ANPTopsisIntegration';

export default function KriteriaANPPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, reportAreas } = useAppContext();
  
  // Step management
  const [currentStep, setCurrentStep] = useState<'criteria' | 'comparison' | 'result'>('criteria');
  
  // Criteria state
  const [criteria, setCriteria] = useState<ANPCriteria[]>([
    { id: '1', name: '', description: '' },
    { id: '2', name: '', description: '' },
    { id: '3', name: '', description: '' }
  ]);
  
  // ANP specific settings
  const [includeInterdependencies, setIncludeInterdependencies] = useState(false);
  
  // Comparison state
  const [comparisons, setComparisons] = useState<ANPPairwiseComparison[]>([]);
  const [requiredComparisons, setRequiredComparisons] = useState<Array<{ 
    criteria1: ANPCriteria, 
    criteria2: ANPCriteria, 
    comparisonType: 'criteria' | 'interdependency' 
  }>>([]);
  
  // Result state
  const [anpResult, setAnpResult] = useState<ANPResult | null>(null);

  // Generate required comparisons when criteria change
  useEffect(() => {
    const validCriteria = criteria.filter(c => c.name.trim() !== '');
    if (validCriteria.length >= 2) {
      setRequiredComparisons(generateRequiredComparisons(validCriteria, includeInterdependencies));
    }
  }, [criteria, includeInterdependencies]);

  const handleCriteriaChange = (index: number, field: 'name' | 'description', value: string) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setCriteria(newCriteria);
  };

  const addCriteria = () => {
    if (criteria.length < 5) { // Maximum 5 criteria for practical ANP
      setCriteria([...criteria, { 
        id: (criteria.length + 1).toString(), 
        name: '', 
        description: '' 
      }]);
    }
  };

  const removeCriteria = (index: number) => {
    if (criteria.length > 2) { // Minimum 2 criteria
      const newCriteria = criteria.filter((_, i) => i !== index);
      setCriteria(newCriteria);
    }
  };

  const proceedToComparison = () => {
    const validCriteria = criteria.filter(c => c.name.trim() !== '');
    
    if (validCriteria.length < 2) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Minimal 2 kriteria harus diisi.'
      });
      return;
    }

    if (validCriteria.length > 5) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Maksimal 5 kriteria yang dapat diproses.'
      });
      return;
    }

    // Update criteria to only include valid ones
    setCriteria(validCriteria);
    
    // Initialize comparisons
    const required = generateRequiredComparisons(validCriteria, includeInterdependencies);
    const initialComparisons: ANPPairwiseComparison[] = required.map(({ criteria1, criteria2, comparisonType }) => ({
      criteria1Id: criteria1.id,
      criteria2Id: criteria2.id,
      value: 1, // Default to equal importance
      comparisonType
    }));
    
    setComparisons(initialComparisons);
    setCurrentStep('comparison');
  };

  const handleComparisonChange = (criteria1Id: string, criteria2Id: string, comparisonType: 'criteria' | 'interdependency', value: number) => {
    const newComparisons = [...comparisons];
    const index = newComparisons.findIndex(c => 
      ((c.criteria1Id === criteria1Id && c.criteria2Id === criteria2Id) ||
       (c.criteria1Id === criteria2Id && c.criteria2Id === criteria1Id)) &&
      c.comparisonType === comparisonType
    );
    
    if (index !== -1) {
      newComparisons[index] = { criteria1Id, criteria2Id, value, comparisonType };
    } else {
      newComparisons.push({ criteria1Id, criteria2Id, value, comparisonType });
    }
    
    setComparisons(newComparisons);
  };

  const calculateANP = () => {
    const validation = validateComparisons(criteria, comparisons, includeInterdependencies);
    
    if (!validation.isValid) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Semua perbandingan harus diisi.'
      });
      return;
    }

    try {
      const result = processANP(criteria, comparisons, user?.username || 'unknown', includeInterdependencies);
      setAnpResult(result);
      setCurrentStep('result');
      
      toast({
        title: 'Berhasil',
        description: `ANP berhasil dihitung. Rasio konsistensi: ${(result.consistencyRatio * 100).toFixed(2)}%`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Terjadi kesalahan dalam perhitungan ANP.'
      });
    }
  };

  const resetProcess = () => {
    setCriteria([
      { id: '1', name: '', description: '' },
      { id: '2', name: '', description: '' },
      { id: '3', name: '', description: '' }
    ]);
    setComparisons([]);
    setAnpResult(null);
    setCurrentStep('criteria');
    setIncludeInterdependencies(false);
  };

  const getCriteriaComparisons = () => {
    return requiredComparisons.filter(c => c.comparisonType === 'criteria');
  };

  const getInterdependencyComparisons = () => {
    return requiredComparisons.filter(c => c.comparisonType === 'interdependency');
  };

  return (
    <div className="min-h-screen bg-muted/40 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6" />
              Analisis Kriteria ANP
            </h1>
            <p className="text-muted-foreground">
              Tentukan kriteria dan bobot menggunakan Analytic Network Process untuk rekomendasi perbaikan jalan
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          <div className={`flex items-center space-x-2 ${currentStep === 'criteria' ? 'text-primary' : currentStep === 'comparison' || currentStep === 'result' ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'criteria' ? 'bg-primary text-primary-foreground' : currentStep === 'comparison' || currentStep === 'result' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
              {currentStep === 'comparison' || currentStep === 'result' ? <CheckCircle className="h-4 w-4" /> : '1'}
            </div>
            <span className="font-medium">Kriteria</span>
          </div>
          <div className="w-12 h-px bg-border"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'comparison' ? 'text-primary' : currentStep === 'result' ? 'text-green-600' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'comparison' ? 'bg-primary text-primary-foreground' : currentStep === 'result' ? 'bg-green-600 text-white' : 'bg-muted'}`}>
              {currentStep === 'result' ? <CheckCircle className="h-4 w-4" /> : '2'}
            </div>
            <span className="font-medium">Perbandingan</span>
          </div>
          <div className="w-12 h-px bg-border"></div>
          <div className={`flex items-center space-x-2 ${currentStep === 'result' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'result' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              3
            </div>
            <span className="font-medium">Hasil</span>
          </div>
        </div>

        {/* Step 1: Criteria Input */}
        {currentStep === 'criteria' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Langkah 1: Tentukan Kriteria</CardTitle>
                <CardDescription>
                  Masukkan 2-5 kriteria yang akan digunakan untuk menentukan prioritas perbaikan jalan.
                  ANP memungkinkan analisis interdependensi antar kriteria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {criteria.map((criterion, index) => (
                  <div key={criterion.id} className="flex gap-4 items-start p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label htmlFor={`criteria-${index}-name`}>Kriteria {index + 1}</Label>
                        <Input
                          id={`criteria-${index}-name`}
                          placeholder="Nama kriteria (contoh: Volume Lalu Lintas)"
                          value={criterion.name}
                          onChange={(e) => handleCriteriaChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`criteria-${index}-desc`}>Deskripsi (Opsional)</Label>
                        <Textarea
                          id={`criteria-${index}-desc`}
                          placeholder="Deskripsi kriteria..."
                          value={criterion.description}
                          onChange={(e) => handleCriteriaChange(index, 'description', e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                    {criteria.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCriteria(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {criteria.length < 5 && (
                  <Button variant="outline" onClick={addCriteria} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Kriteria
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* ANP Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan ANP</CardTitle>
                <CardDescription>
                  ANP memungkinkan analisis interdependensi antar kriteria untuk hasil yang lebih akurat.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="interdependencies"
                    checked={includeInterdependencies}
                    onCheckedChange={setIncludeInterdependencies}
                  />
                  <Label htmlFor="interdependencies">
                    Sertakan analisis interdependensi antar kriteria
                  </Label>
                </div>
                {includeInterdependencies && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Dengan mengaktifkan ini, Anda akan diminta untuk mengevaluasi bagaimana setiap kriteria 
                    mempengaruhi kriteria lainnya, menghasilkan analisis yang lebih komprehensif.
                  </p>
                )}
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button onClick={proceedToComparison}>
                Lanjut ke Perbandingan
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Pairwise Comparison */}
        {currentStep === 'comparison' && (
          <div className="space-y-6">
            {/* Criteria Comparisons */}
            <Card>
              <CardHeader>
                <CardTitle>Langkah 2A: Perbandingan Kriteria</CardTitle>
                <CardDescription>
                  Bandingkan kepentingan relatif setiap pasang kriteria.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {getCriteriaComparisons().map(({ criteria1, criteria2 }, index) => {
                  const comparison = comparisons.find(c => 
                    ((c.criteria1Id === criteria1.id && c.criteria2Id === criteria2.id) ||
                     (c.criteria1Id === criteria2.id && c.criteria2Id === criteria1.id)) &&
                    c.comparisonType === 'criteria'
                  );
                  
                  return (
                    <div key={`criteria-${criteria1.id}-${criteria2.id}`} className="p-4 border rounded-lg">
                      <div className="mb-4">
                        <h4 className="font-medium">Pertanyaan {index + 1}</h4>
                        <p className="text-sm text-muted-foreground">
                          Apakah <span className="font-medium text-foreground">{criteria1.name}</span> lebih penting dari <span className="font-medium text-foreground">{criteria2.name}</span>?
                        </p>
                      </div>
                      
                      <div>
                        <Label>Tingkat Kepentingan</Label>
                        <Select
                          value={comparison?.value.toString() || '1'}
                          onValueChange={(value) => handleComparisonChange(criteria1.id, criteria2.id, 'criteria', parseFloat(value))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ANP_SCALE_VALUES.map((scale) => (
                              <SelectItem key={scale.value} value={scale.value.toString()}>
                                {scale.label} - {scale.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Interdependency Comparisons */}
            {includeInterdependencies && getInterdependencyComparisons().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Langkah 2B: Analisis Interdependensi</CardTitle>
                  <CardDescription>
                    Evaluasi bagaimana setiap kriteria mempengaruhi kriteria lainnya.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {getInterdependencyComparisons().map(({ criteria1, criteria2 }, index) => {
                    const comparison = comparisons.find(c => 
                      ((c.criteria1Id === criteria1.id && c.criteria2Id === criteria2.id) ||
                       (c.criteria1Id === criteria2.id && c.criteria2Id === criteria1.id)) &&
                      c.comparisonType === 'interdependency'
                    );
                    
                    return (
                      <div key={`interdep-${criteria1.id}-${criteria2.id}`} className="p-4 border rounded-lg bg-blue-50/50">
                        <div className="mb-4">
                          <h4 className="font-medium">Interdependensi {index + 1}</h4>
                          <p className="text-sm text-muted-foreground">
                            Seberapa besar <span className="font-medium text-foreground">{criteria1.name}</span> mempengaruhi <span className="font-medium text-foreground">{criteria2.name}</span>?
                          </p>
                        </div>
                        
                        <div>
                          <Label>Tingkat Pengaruh</Label>
                          <Select
                            value={comparison?.value.toString() || '1'}
                            onValueChange={(value) => handleComparisonChange(criteria1.id, criteria2.id, 'interdependency', parseFloat(value))}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ANP_SCALE_VALUES.map((scale) => (
                                <SelectItem key={scale.value} value={scale.value.toString()}>
                                  {scale.label} - {scale.description}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('criteria')}>
                Kembali
              </Button>
              <Button onClick={calculateANP}>
                <Calculator className="h-4 w-4 mr-2" />
                Hitung Bobot ANP
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 'result' && anpResult && (
          <div className="space-y-6">
            {/* Consistency Check */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {anpResult.isConsistent ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  Uji Konsistensi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Rasio Konsistensi (CR)</p>
                    <p className="text-2xl font-bold">
                      {(anpResult.consistencyRatio * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`text-lg font-medium ${anpResult.isConsistent ? 'text-green-600' : 'text-yellow-600'}`}>
                      {anpResult.isConsistent ? 'Konsisten' : 'Kurang Konsisten'}
                    </p>
                  </div>
                </div>
                {!anpResult.isConsistent && (
                  <p className="text-sm text-yellow-600 mt-2">
                    Rasio konsistensi > 10%. Pertimbangkan untuk meninjau kembali perbandingan Anda.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Weights Results */}
            <Card>
              <CardHeader>
                <CardTitle>Hasil Bobot Kriteria ANP</CardTitle>
                <CardDescription>
                  Bobot yang dihitung menggunakan metode ANP {anpResult.hasInterdependencies ? 'dengan analisis interdependensi' : 'tanpa interdependensi'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {anpResult.weights.map((weight) => {
                    const criterion = anpResult.criteria.find(c => c.id === weight.criteriaId);
                    const finalWeight = weight.limitWeight !== undefined ? weight.limitWeight : weight.weight;
                    return (
                      <div key={weight.criteriaId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{criterion?.name}</h4>
                          <p className="text-sm text-muted-foreground">Peringkat #{weight.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{(finalWeight * 100).toFixed(1)}%</p>
                          <p className="text-sm text-muted-foreground">
                            {anpResult.hasInterdependencies ? 'Bobot Limit' : 'Bobot'}: {finalWeight.toFixed(4)}
                          </p>
                          {anpResult.hasInterdependencies && weight.limitWeight !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Bobot Awal: {(weight.weight * 100).toFixed(1)}%
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* TOPSIS Integration */}
            <ANPTopsisIntegration anpResult={anpResult} reportAreas={reportAreas} />

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('comparison')}>
                Kembali ke Perbandingan
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={resetProcess}>
                  Mulai Ulang
                </Button>
                <Button onClick={() => router.push('/dashboard')}>
                  Selesai
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}