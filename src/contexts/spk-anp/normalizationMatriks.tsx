export default function normalizationMatriks(
  totalCriteria: number,
  matriks: number[][]
) {
  // menjumlahkan nilai tiap kolom
  let sumValueColumn: number[] = Array(totalCriteria).fill(0);
  for (let i = 0; i < matriks.length; i++) {
    let sum = 0;
    for (let j = 0; j < matriks.length; j++) {
      sum += matriks[j][i];
    }
    sumValueColumn[i] = sum;
  }

  // normalisasi (setiap sel dibagi jumlah kolom)
  let normalizationMatriks: number[] = Array(totalCriteria).fill(0);
  for (let i = 0; i < matriks.length; i++) {
    let sum = 0;
    for (let j = 0; j < matriks.length; j++) {
      sum += matriks[i][j] / sumValueColumn[j];
    }
    sum /= totalCriteria;
    normalizationMatriks[i] = sum;
  }

  return normalizationMatriks;
}
