import calculateConsistencyVector from "./spk-anp/calculateConsistencyVector";
import createPairwiseComparisonMatriks from "./spk-anp/createPairwiseComparisonMatriks";
import normalizationMatriks from "./spk-anp/normalizationMatriks";
import weightedSumVector from "./spk-anp/weightedSumVector";

export default function calculateWeightANP(
  totalCriteria: number,
  arrayValue: number[]
) {
  const pairwiseComparisonMatriks = createPairwiseComparisonMatriks(
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
    return -1;
  }
}


