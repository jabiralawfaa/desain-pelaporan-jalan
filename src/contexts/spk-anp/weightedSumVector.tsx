export default function weightedSumVector(
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
