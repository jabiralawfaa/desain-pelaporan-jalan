function createPairwiseComparisonMatrix(
  totalCriteria: number,
  arrayValue: number[]
) {
  let result = Array.from({ length: totalCriteria }, () =>
    new Array(totalCriteria).fill(0)
  );

  let increment1 = 0;
  let increment2 = 0;

  for (let i = 0; i < totalCriteria; i++) {
    for (let j = 0; j < totalCriteria; j++) {
      if (i === j) {
        result[i][j] = 1;
      }

      if (i < j) {
        if (arrayValue[increment1] > 0) {
          result[i][j] = arrayValue[increment1];
        } else {
          result[i][j] = 1 / arrayValue[increment1];
        }
        increment1++;
      } else if (i > j) {
        if (arrayValue[increment2] < 0) {
          result[i][j] = arrayValue[increment2];
        } else {
          result[i][j] = 1 / arrayValue[increment2];
        }
        increment2++;
      }
    }
  }

  return result;
}
function normalizationMatriks(
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
function weightedSumVector(
  matriks: number[][],
  array: number[]
) {
  let result: number[] = [];
  for (let i = 0; i < matriks.length; i++) {
    let sum: number = 0;
    for (let j = 0; j < matriks.length; j++) {
      sum += matriks[i][j] * array[j];
    }
    result[i] = sum;
  }
  return result;
}
function calculateConsistencyVector(weightedVector: number[], array: number[]) {
  let lambdaMax: number = 0;
  for (let i = 0; i < array.length; i++) {
    lambdaMax += (weightedVector[i] / array[i])
  }
  lambdaMax /= array.length;

  let CI = (lambdaMax - array.length) / (array.length - 1);
  let RI = CI / 0.58;
  return RI;
}
export default function calculateWeightANP(
  totalCriteria: number,
  arrayValue: number[]
) {
  const pairwiseComparisonMatriks = createPairwiseComparisonMatrix(
    totalCriteria,
    arrayValue
  );

  const normalizedMatriks = normalizationMatriks(
    totalCriteria,
    pairwiseComparisonMatriks
  );

  const weightedVector = weightedSumVector(
    pairwiseComparisonMatriks,
    normalizedMatriks
  );

  const consistencyVector = calculateConsistencyVector(
    weightedVector,
    normalizedMatriks
  );

  if (consistencyVector < 0.1) {
    return normalizedMatriks;
  } else {
    -1
  }
}