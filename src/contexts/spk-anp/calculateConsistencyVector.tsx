export default function calculateConsistencyVector(weightedVector: number[], array: number[]) {
    let lambdaMax: number = 0;
    for (let i = 0; i < array.length; i++) {
        lambdaMax += (weightedVector[i]/array[i])
    }
    lambdaMax /= array.length;

    let CI = (lambdaMax - array.length)/(array.length - 1);
    let RI = CI/0.58;
    return RI;
}