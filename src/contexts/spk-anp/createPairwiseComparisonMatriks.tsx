// fungsi untuk membuat matriks perbandingan berpasangan
export default function createPairwiseComparisonMatrix(totalCriteria: number, arrayValue: number[]) {
  let result = Array.from({ length: totalCriteria }, () => {
    return new Array(totalCriteria).fill(0);
  });
  let increment1 = 0;
  let increment2 = 0;
  for (let i = 0; i < totalCriteria; i++) {
    for (let j = 0; j < totalCriteria; j++) {
      if (i == j) {
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

