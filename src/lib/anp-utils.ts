import { ANPCriteria, ANPPairwiseComparison, ANPMatrix, ANPWeights, ANPResult } from './types';

// Random Index values for consistency calculation (same as AHP)
const RANDOM_INDEX = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];

/**
 * Create a pairwise comparison matrix from comparisons
 */
export function createComparisonMatrix(criteria: ANPCriteria[], comparisons: ANPPairwiseComparison[], matrixType: 'criteria' | 'interdependency' = 'criteria'): number[][] {
  const n = criteria.length;
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(1));
  
  // Create mapping from criteria ID to index
  const criteriaIndexMap = new Map<string, number>();
  criteria.forEach((criterion, index) => {
    criteriaIndexMap.set(criterion.id, index);
  });
  
  // Fill the matrix with comparison values for the specified type
  const relevantComparisons = comparisons.filter(c => c.comparisonType === matrixType);
  relevantComparisons.forEach(comparison => {
    const i = criteriaIndexMap.get(comparison.criteria1Id);
    const j = criteriaIndexMap.get(comparison.criteria2Id);
    
    if (i !== undefined && j !== undefined) {
      matrix[i][j] = comparison.value;
      matrix[j][i] = 1 / comparison.value; // Reciprocal value
    }
  });
  
  return matrix;
}

/**
 * Calculate eigenvalues and eigenvectors using power method
 */
export function calculateEigenVector(matrix: number[][]): { weights: number[], lambda: number } {
  const n = matrix.length;
  let weights = Array(n).fill(1 / n); // Initial guess
  let prevWeights = [...weights];
  
  // Power method iterations
  for (let iter = 0; iter < 100; iter++) {
    const newWeights = Array(n).fill(0);
    
    // Matrix multiplication
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newWeights[i] += matrix[i][j] * weights[j];
      }
    }
    
    // Normalize
    const sum = newWeights.reduce((acc, val) => acc + val, 0);
    weights = newWeights.map(val => val / sum);
    
    // Check convergence
    const diff = weights.reduce((acc, val, i) => acc + Math.abs(val - prevWeights[i]), 0);
    if (diff < 1e-10) break;
    
    prevWeights = [...weights];
  }
  
  // Calculate principal eigenvalue (lambda max)
  let lambda = 0;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      sum += matrix[i][j] * weights[j];
    }
    lambda += sum / weights[i];
  }
  lambda /= n;
  
  return { weights, lambda };
}

/**
 * Calculate consistency ratio
 */
export function calculateConsistencyRatio(lambda: number, n: number): number {
  if (n <= 2) return 0;
  
  const CI = (lambda - n) / (n - 1);
  const RI = RANDOM_INDEX[n] || 1.49;
  
  return CI / RI;
}

/**
 * Create ANP supermatrix
 */
export function createSupermatrix(criteria: ANPCriteria[], criteriaWeights: number[], interdependencyMatrix?: number[][]): number[][] {
  const n = criteria.length;
  const supermatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  
  // If no interdependencies, create identity-based supermatrix
  if (!interdependencyMatrix) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        supermatrix[i][j] = criteriaWeights[j];
      }
    }
  } else {
    // Use interdependency matrix to create supermatrix
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        supermatrix[i][j] = interdependencyMatrix[i][j] * criteriaWeights[j];
      }
    }
  }
  
  return supermatrix;
}

/**
 * Calculate limit matrix by raising supermatrix to a high power
 */
export function calculateLimitMatrix(supermatrix: number[][]): number[][] {
  const n = supermatrix.length;
  let currentMatrix = supermatrix.map(row => [...row]);
  
  // Raise to power (typically 2k+1 where k is large enough for convergence)
  for (let power = 0; power < 20; power++) {
    const newMatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    // Matrix multiplication
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          newMatrix[i][j] += currentMatrix[i][k] * currentMatrix[k][j];
        }
      }
    }
    
    currentMatrix = newMatrix;
  }
  
  return currentMatrix;
}

/**
 * Process ANP analysis
 */
export function processANP(
  criteria: ANPCriteria[], 
  comparisons: ANPPairwiseComparison[], 
  userId: string,
  includeInterdependencies: boolean = false
): ANPResult {
  // Calculate criteria weights
  const criteriaMatrix = createComparisonMatrix(criteria, comparisons, 'criteria');
  const { weights: criteriaWeights, lambda: criteriaLambda } = calculateEigenVector(criteriaMatrix);
  const criteriaConsistencyRatio = calculateConsistencyRatio(criteriaLambda, criteria.length);
  
  let finalWeights = criteriaWeights;
  let supermatrix: number[][] | undefined;
  let limitMatrix: number[][] | undefined;
  
  // If interdependencies are included, calculate ANP weights
  if (includeInterdependencies) {
    const interdependencyMatrix = createComparisonMatrix(criteria, comparisons, 'interdependency');
    supermatrix = createSupermatrix(criteria, criteriaWeights, interdependencyMatrix);
    limitMatrix = calculateLimitMatrix(supermatrix);
    
    // Extract final weights from limit matrix (first column)
    finalWeights = limitMatrix.map(row => row[0]);
    
    // Normalize final weights
    const sum = finalWeights.reduce((acc, val) => acc + val, 0);
    if (sum > 0) {
      finalWeights = finalWeights.map(val => val / sum);
    }
  }
  
  // Create weights with ranking
  const anpWeights: ANPWeights[] = criteria.map((criterion, index) => ({
    criteriaId: criterion.id,
    weight: criteriaWeights[index],
    limitWeight: includeInterdependencies ? finalWeights[index] : undefined,
    rank: 0 // Will be set after sorting
  }));
  
  // Sort by final weights (limit weights if available, otherwise criteria weights)
  anpWeights.sort((a, b) => {
    const weightA = a.limitWeight !== undefined ? a.limitWeight : a.weight;
    const weightB = b.limitWeight !== undefined ? b.limitWeight : b.weight;
    return weightB - weightA;
  });
  
  anpWeights.forEach((weight, index) => {
    weight.rank = index + 1;
  });
  
  return {
    criteria,
    weights: anpWeights,
    consistencyRatio: criteriaConsistencyRatio,
    isConsistent: criteriaConsistencyRatio < 0.1,
    hasInterdependencies: includeInterdependencies,
    supermatrix,
    limitMatrix,
    createdAt: new Date().toISOString(),
    createdBy: userId
  };
}

/**
 * Generate all required pairwise comparisons for given criteria
 */
export function generateRequiredComparisons(criteria: ANPCriteria[], includeInterdependencies: boolean = false): Array<{ 
  criteria1: ANPCriteria, 
  criteria2: ANPCriteria, 
  comparisonType: 'criteria' | 'interdependency' 
}> {
  const comparisons: Array<{ 
    criteria1: ANPCriteria, 
    criteria2: ANPCriteria, 
    comparisonType: 'criteria' | 'interdependency' 
  }> = [];
  
  // Generate criteria comparisons
  for (let i = 0; i < criteria.length; i++) {
    for (let j = i + 1; j < criteria.length; j++) {
      comparisons.push({
        criteria1: criteria[i],
        criteria2: criteria[j],
        comparisonType: 'criteria'
      });
    }
  }
  
  // Generate interdependency comparisons if requested
  if (includeInterdependencies) {
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        comparisons.push({
          criteria1: criteria[i],
          criteria2: criteria[j],
          comparisonType: 'interdependency'
        });
      }
    }
  }
  
  return comparisons;
}

/**
 * Validate that all required comparisons are provided
 */
export function validateComparisons(
  criteria: ANPCriteria[], 
  comparisons: ANPPairwiseComparison[], 
  includeInterdependencies: boolean = false
): { 
  isValid: boolean, 
  missing: Array<{ criteria1Id: string, criteria2Id: string, comparisonType: 'criteria' | 'interdependency' }> 
} {
  const required = generateRequiredComparisons(criteria, includeInterdependencies);
  const provided = new Set(comparisons.map(c => `${c.criteria1Id}-${c.criteria2Id}-${c.comparisonType}`));
  
  const missing: Array<{ criteria1Id: string, criteria2Id: string, comparisonType: 'criteria' | 'interdependency' }> = [];
  
  required.forEach(({ criteria1, criteria2, comparisonType }) => {
    const key1 = `${criteria1.id}-${criteria2.id}-${comparisonType}`;
    const key2 = `${criteria2.id}-${criteria1.id}-${comparisonType}`;
    
    if (!provided.has(key1) && !provided.has(key2)) {
      missing.push({ criteria1Id: criteria1.id, criteria2Id: criteria2.id, comparisonType });
    }
  });
  
  return {
    isValid: missing.length === 0,
    missing
  };
}