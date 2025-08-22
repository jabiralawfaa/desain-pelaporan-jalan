"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, XCircle, Info, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState, useRef, SetStateAction, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

// =================================================================
// LOGIKA PERHITUNGAN AHP (TIDAK ADA PERUBAHAN)
// =================================================================

const convertToSaaty = (num: number) => {
  switch (num) {
    case 1: {
      return 0;
    }
    case 2: {
      return 0;
    }
    case 3: {
      return 0.58;
    }
    case 4: {
      return 0.9;
    }
    case 5: {
      return 1.12;
    }
    case 6: {
      return 1.24;
    }
    case 7: {
      return 1.32;
    }
    case 8: {
      return 1.41;
    }
    case 9: {
      return 1.45;
    }
    case 10: {
      return 1.49;
    }
    default: {
      return 0;
    }
  }
};

const validateMatriks = (matriksCriteria: number[][]) => {
  const length = matriksCriteria.length;
  if (length == 0) {
    return false;
  }
  for (let i = 0; i < length; i++) {
    if (matriksCriteria[i].length != length) {
      return false;
    }
  }
  return true;
};

const calculateAHP = (matriksCriteria: number[][]) => {
  const lengthMatriks = matriksCriteria.length;
  const validate = validateMatriks(matriksCriteria);
  if (!validate) {
    return "Matriks harus dalam format NxN!";
  }

  // 1. Hitung Eigenvector
  // 1.1 Normalisasi Matriks
  const columnSum = matriksCriteria.reduce((res, row) => {
    for (let i = 0; i < lengthMatriks; i++) {
      res[i] += row[i];
    }
    return res;
  }, new Array(lengthMatriks).fill(0));

  const normalizedMatriks: number[][] = Array.from(
    { length: lengthMatriks },
    () => {
      return new Array(lengthMatriks).fill(0);
    }
  );
  for (let i = 0; i < lengthMatriks; i++) {
    for (let j = 0; j < lengthMatriks; j++) {
      normalizedMatriks[j][i] = matriksCriteria[j][i] / columnSum[i];
    }
  }

  // 1.2 Hitung Rata-Rata Baris (Eigenvector)
  const averageRow: number[] = new Array(lengthMatriks).fill(0);
  for (let i = 0; i < lengthMatriks; i++) {
    for (let j = 0; j < lengthMatriks; j++) {
      averageRow[i] += normalizedMatriks[i][j];
    }
    // PERHATIKAN: pembagiannya harusnya dengan lengthMatriks, bukan 3
    averageRow[i] /= lengthMatriks;
  }

  // 2. Uji Konsistensi
  // 2.1 Hitung λ max
  const lambda = Array(lengthMatriks).fill(0);
  for (let i = 0; i < lengthMatriks; i++) {
    for (let j = 0; j < lengthMatriks; j++) {
      lambda[i] += matriksCriteria[i][j] * averageRow[j];
    }
    lambda[i] /= averageRow[i];
  }

  const lambdaTotal = lambda.reduce((res, row) => {
    return res + row;
  });

  const lambdaMax = lambdaTotal / lengthMatriks;

  // 2.2 Hitung CI (Consistency Index)
  const CI = (lambdaMax - lengthMatriks) / (lengthMatriks - 1);

  // 2.3 Hitung CR (Consistency Ratio)
  const saatyRI = convertToSaaty(lengthMatriks);
  const CR = CI / saatyRI;

  if (CR > 0.1) {
    return "Hasil bobot tidak konsisten!";
  }

  const result: Record<string, number[]> = {
    averageRow,
  };

  console.log(result);

  return { averageRow, CI, CR, lambdaMax }; // Mengembalikan objek hasil
};
// =================================================================

export default function KriteriaAnpPage() {
  const [criterias, setCriterias] = useState<string[]>([]);
  const [data, setData] = useState<number[][]>([]);
  const [isCalculated, setIsCalculated] = useState(false);

  // Perbaikan tipe data untuk menampung hasil dari fungsi calculateAHP
  type ResultsType =
    | {
        averageRow: number[];
        CI: number;
        CR: number;
        lambdaMax: number;
      }
    | "Matriks harus dalam format NxN!"
    | "Hasil bobot tidak konsisten!"
    | null;

  const [results, setResults] = useState<ResultsType>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [showGuide, setShowGuide] = useState(false);
  const [customCriteriaName, setCustomCriteriaName] = useState("");
  const [activeTab, setActiveTab] = useState("input");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(isCalculated && results && typeof results !== "string") {
      // membuat json untuk "nama kriteria": "bobot kriteria"
      const dataToSave = results.averageRow.reduce((obj: Record<string, number>, value, index) => {
        obj[criterias[index]] = value;
        return obj;
      }, {});

      localStorage.setItem('ahpResults', JSON.stringify(dataToSave));
      localStorage.setItem('ahpCriterias', JSON.stringify(criterias));
    }
  }, [isCalculated, results, criterias]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        containerRef.current.style.width = "100%";
        containerRef.current.style.height = `${window.innerHeight}px`;
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    resetData(criterias);
  }, [criterias]);

  const resetData = (newCriterias: string | any[]) => {
    const n = newCriterias.length;
    const newMatrix = Array(n)
      .fill(null)
      .map(() => Array(n).fill(1));
    setData(newMatrix);
    setIsCalculated(false);
    setResults(null);
  };

  const updateMatrixValue = (row: number, col: number, value: number) => {
    if (row === col) return;
    const newData = [...data];
    newData[row][col] = value;
    newData[col][row] = 1 / value;
    setData(newData);
    setIsCalculated(false);
  };

  const addCriteria = () => {
    const trimmedName = customCriteriaName.trim();
    if (criterias.length >= 10) {
      showModalMessage("Maksimal 10 kriteria dapat ditambahkan.", "error");
      return;
    }
    if (trimmedName !== "" && !criterias.includes(trimmedName)) {
      setCriterias([...criterias, trimmedName]);
      setCustomCriteriaName("");
    } else {
      showModalMessage("Nama kriteria tidak valid atau sudah ada.", "error");
    }
  };

  const removeCriteria = (name: string) => {
    const newCriterias = criterias.filter((c) => c !== name);
    setCriterias(newCriterias);
  };

  const showModalMessage = (
    message: SetStateAction<string>,
    type: SetStateAction<string>
  ) => {
    setInputMessage(message);
    setAlertType(type);
    setIsModalOpen(true);
  };

  // *** PERBAIKAN: MENYESUAIKAN FUNGSI INI AGAR MENGGUNAKAN LOGIKA ANDA ***
  const handleCalculateAHP = () => {
    const result = calculateAHP(data);

    if (typeof result === "string") {
      showModalMessage(result, "error");
      setIsCalculated(false);
      return;
    }

    setResults(result);
    setIsCalculated(true);
    setActiveTab("results");
  };

  const getSliderValueText = (val: number) => {
    const scale = {
      9: "9 (Sangat Penting)",
      8: "8 (Sangat Penting)",
      7: "7 (Sangat Penting)",
      6: "6 (Sangat Penting)",
      5: "5 (Penting)",
      4: "4 (Penting)",
      3: "3 (Cukup Penting)",
      2: "2 (Cukup Penting)",
      1: "1 (Sama Penting)",
      [1 / 2]: "1/2",
      [1 / 3]: "1/3",
      [1 / 4]: "1/4",
      [1 / 5]: "1/5",
      [1 / 6]: "1/6",
      [1 / 7]: "1/7",
      [1 / 8]: "1/8",
      [1 / 9]: "1/9",
    };
    return scale[val] || val;
  };

  const sliderValues = [
    1 / 9,
    1 / 8,
    1 / 7,
    1 / 6,
    1 / 5,
    1 / 4,
    1 / 3,
    1 / 2,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
  ];

  const isMatrixTabDisabled = criterias.length < 2;

  return (
    <div
      ref={containerRef}
      className="p-4 md:p-8 bg-gray-100 min-h-screen font-sans"
    >
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Pesan</DialogTitle>
            <DialogDescription>{inputMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Analisis AHP Interaktif
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Sistem pendukung keputusan menggunakan Analytical Hierarchy
              Process.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3">
                <TabsTrigger value="input">Input Kriteria</TabsTrigger>
                <TabsTrigger value="matrix" disabled={isMatrixTabDisabled}>
                  Isi Matriks
                </TabsTrigger>
                <TabsTrigger value="results" disabled={!isCalculated}>
                  Hasil
                </TabsTrigger>
              </TabsList>

              <TabsContent value="input" className="p-4 md:p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showGuide}
                    onCheckedChange={setShowGuide}
                    id="guide-mode"
                  />
                  <Label htmlFor="guide-mode">Tampilkan Panduan</Label>
                </div>
                {showGuide && (
                  <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Panduan Cepat</AlertTitle>
                    <AlertDescription className="text-sm">
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          Tambahkan atau hapus kriteria pada formulir di bawah.
                        </li>
                        <li>
                          Klik "Isi Matriks" untuk membandingkan setiap
                          kriteria.
                        </li>
                        <li>
                          Setelah mengisi matriks, klik "Hitung" untuk melihat
                          hasilnya.
                        </li>
                        <li>
                          Nilai prioritas tertinggi menunjukkan kriteria yang
                          paling penting.
                        </li>
                        <li>
                          Rasio konsistensi (`CR`) harus kurang dari 10% ({"<"}{" "}
                          0.1) untuk hasil yang valid.
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="new-criteria">Tambah Kriteria Baru</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="new-criteria"
                      value={customCriteriaName}
                      onChange={(e) => setCustomCriteriaName(e.target.value)}
                      placeholder="Contoh: Biaya, Kualitas, Lokasi"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addCriteria();
                      }}
                    />
                    <Button
                      onClick={addCriteria}
                      disabled={
                        customCriteriaName.trim() === "" ||
                        criterias.length >= 10
                      }
                    >
                      Tambah
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Kriteria Saat Ini ({criterias.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {criterias.map((c, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
                      >
                        <span>{c}</span>
                        <XCircle
                          className="w-4 h-4 ml-2 text-gray-500 cursor-pointer hover:text-red-500"
                          onClick={() => removeCriteria(c)}
                        />
                      </div>
                    ))}
                  </div>
                  <Link href="/dashboard">
                    <Button className="my-3">Kembali</Button>
                  </Link>{" "}
                </div>
              </TabsContent>

              <TabsContent value="matrix" className="p-4 md:p-6 space-y-4">
                <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Bandingkan Kriteria</AlertTitle>
                  <AlertDescription>
                    Geser slider untuk membandingkan kepentingan kriteria. Geser
                    ke kanan untuk membuat kriteria di kiri lebih penting.
                  </AlertDescription>
                </Alert>
                <div className="space-y-6">
                  {criterias.map((c1, i) =>
                    criterias.map((c2, j) => {
                      if (i >= j) return null;
                      const value = data[i]?.[j] || 1;
                      const sliderIndex = sliderValues.indexOf(value);
                      return (
                        <div
                          key={`${i}-${j}`}
                          className="p-4 bg-gray-50 rounded-lg shadow-sm"
                        >
                          <Label className="font-semibold text-lg flex justify-between items-center mb-4">
                            <span>{c1}</span> vs <span>{c2}</span>
                          </Label>
                          <div className="flex flex-col items-center">
                            <Slider
                              defaultValue={[sliderIndex]}
                              min={0}
                              max={sliderValues.length - 1}
                              step={1}
                              onValueChange={(val) =>
                                updateMatrixValue(i, j, sliderValues[val[0]])
                              }
                              className="w-full"
                            />
                            <div className="mt-2 text-sm text-center">
                              <span className="font-medium text-gray-700">
                                Pentingnya {c1} terhadap {c2}:
                              </span>
                              <span className="font-bold ml-2">
                                {getSliderValueText(value)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="mt-6 flex justify-center">
                  <Link href="/dashboard">
                    <Button className="mx-3">Kembali</Button>
                  </Link>
                  <Button
                    onClick={handleCalculateAHP}
                    className="w-full md:w-auto"
                  >
                    Hitung Hasil
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="results" className="p-4 md:p-6 space-y-4">
                {results && typeof results !== "string" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">
                          Vektor Prioritas
                        </CardTitle>
                        <CardDescription>
                          Bobot relatif dari setiap kriteria.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableCaption>
                            Nilai bobot prioritas untuk setiap kriteria.
                          </TableCaption>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Kriteria</TableHead>
                              <TableHead className="text-right">
                                Nilai Prioritas (%)
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {criterias.map((c, i) => (
                              <TableRow
                                key={i}
                                className={i === 0 ? "bg-blue-50" : ""}
                              >
                                <TableCell className="font-medium">
                                  {c}
                                </TableCell>
                                <TableCell className="text-right font-bold">
                                  {(results.averageRow[i] * 100).toFixed(2)}%
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">
                          Analisis Konsistensi
                        </CardTitle>
                        <CardDescription>
                          Pengecekan seberapa konsisten perbandingan Anda.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="font-medium">
                            Rasio Konsistensi (CR):
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              results.CR <= 0.1
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {(results.CR * 100).toFixed(2)}%
                          </span>
                        </div>
                        <Alert
                          className={
                            results.CR <= 0.1
                              ? "bg-green-50 text-green-800 border-green-200"
                              : "bg-red-50 text-red-800 border-red-200"
                          }
                        >
                          {results.CR <= 0.1 ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          <AlertTitle>Status Konsistensi</AlertTitle>
                          <AlertDescription>
                            {results.CR <= 0.1
                              ? "Rasio konsistensi kurang dari 10%. Hasil Anda konsisten dan dapat diterima."
                              : "Rasio konsistensi lebih dari 10%. Pertimbangkan untuk meninjau kembali perbandingan Anda untuk meningkatkan konsistensi."}
                          </AlertDescription>
                        </Alert>
                        <Link href="/dashboard">
                          <Button className="my-3">Kembali</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {results && typeof results === "string" && (
                  <Alert className="bg-red-50 text-red-800 border-red-200">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Pesan Error</AlertTitle>
                    <AlertDescription>{results}</AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            Dibuat dengan 💖 dan Analisis AHP.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
