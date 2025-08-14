import { LabelResult } from "@/lib/types/LabelResult";
 
export default function calculateTOPSIS(labelData: LabelResult[]) {
    const resultWeight = [0.5, 0.3, 0.2]; // bobot tiap kriteria
    const finalResult: number[] = [];

    // 1. bentuk matriks (alternatif x kriteria)
    const tableReport: number[][] = [];
    if (labelData == null) {
      return;
    }
    labelData.forEach((item: LabelResult, index) => {
      tableReport.push([item.class_name, item.confidence, item.polygon]);
      tableReport.push([4, 1, 409600]);
      tableReport.push([1, 0.01, 1]);
      // 2. Normalisasi Matriks
      // - perhitungan 1
      const resultCalculate1: number[] = [];
      for (let i = 0; i < tableReport[0].length; i++) {
        let sum = 0;
        for (let j = 0; j < tableReport.length; j++) {
          sum += tableReport[j][i] * tableReport[j][i];
        }
        sum = Math.sqrt(sum);
        resultCalculate1[i] = sum;
      }
      // - perhitungan 2
      const resultCalculate2 = Array.from(
        { length: tableReport.length },
        () => {
          return new Array(tableReport[0].length).fill(0);
        }
      );
      for (let i = 0; i < tableReport[0].length; i++) {
        for (let j = 0; j < tableReport.length; j++) {
          resultCalculate2[j][i] = tableReport[j][i] / resultCalculate1[i];
        }
      }
      // 3. Bobotkan Matriks
      const resultWeightMatriks = Array.from(
        { length: tableReport.length },
        () => {
          return new Array(tableReport[0].length).fill(0);
        }
      );
      for (let i = 0; i < tableReport[0].length; i++) {
        for (let j = 0; j < tableReport.length; j++) {
          resultWeightMatriks[j][i] = resultCalculate2[j][i] * resultWeight[i];
        }
      }
      // 4. Solusi Ideal Positif (A+) & Negatif (A-)
      const maksimumValue: number[] = [];
      const minimumValue: number[] = [];
      for (let i = 0; i < tableReport[0].length; i++) {
        // .map(row => row[i]) mengambil nilai dari tiap kolom di baris i
        const values = resultWeightMatriks.map((row) => row[i]);

        // ...values itu adalah spread operator, mengubah array menjadi parameter yang dapat diakses oleh Math.max maupun Math.min
        maksimumValue[i] = Math.max(...values);
        minimumValue[i] = Math.min(...values);
      }

      // 5. Hitung Jarak A+ dan A-
      const range: number[][] = Array.from({ length: 2 }, () => {
        return new Array(tableReport.length).fill(0);
      });
      // - Menghitung A+
      for (let i = 0; i < tableReport.length; i++) {
        let count = 0;
        for (let j = 0; j < tableReport[0].length; j++) {
          count +=
            (resultWeightMatriks[i][j] - maksimumValue[j]) *
            (resultWeightMatriks[i][j] - maksimumValue[j]);
        }
        count = Math.sqrt(count);
        range[0][i] = count;
      }
      // - Menghitung A-
      for (let i = 0; i < tableReport.length; i++) {
        let count = 0;
        for (let j = 0; j < tableReport[0].length; j++) {
          count +=
            (resultWeightMatriks[i][j] - minimumValue[j]) *
            (resultWeightMatriks[i][j] - minimumValue[j]);
        }
        count = Math.sqrt(count);
        range[1][i] = count;
      }
      // 6. Nilai Prefensi
      const finalResult1: number[] = [];
      for (let i = 0; i < tableReport.length; i++) {
        finalResult1[i] = range[1][i] / (range[1][i] + range[0][i]);
      }
      finalResult[index] = finalResult1[0];
      tableReport.length = 0;
    });
    
    return finalResult;
  };