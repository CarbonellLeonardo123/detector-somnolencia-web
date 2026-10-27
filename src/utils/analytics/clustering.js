import { describeValues, roundMetric } from './statistics';

const DEFAULT_FEATURES = ['fatiguePct', 'avgEAR', 'perclos', 'blinkRate', 'microsleeps'];

function squaredDistance(left, right) {
  return left.reduce((sum, value, index) => sum + ((value - right[index]) ** 2), 0);
}

function nearestCenter(row, centers) {
  let selected = 0;
  let distance = squaredDistance(row, centers[0]);
  for (let index = 1; index < centers.length; index += 1) {
    const candidate = squaredDistance(row, centers[index]);
    if (candidate < distance) {
      selected = index;
      distance = candidate;
    }
  }
  return selected;
}

function deterministicCenters(rows, count) {
  const ordered = [...rows].sort((left, right) => left[0] - right[0]);
  if (count === 1) return [[...ordered[Math.floor(ordered.length / 2)]]];
  return Array.from({ length: count }, (_, index) => {
    const position = Math.round((index * (ordered.length - 1)) / (count - 1));
    return [...ordered[position]];
  });
}

export function kMeansSegments(observations = [], requestedClusters = 3, options = {}) {
  const features = options.features || DEFAULT_FEATURES;
  const rows = observations
    .map((item, originalIndex) => ({
      originalIndex,
      values: features.map((feature) => Number(item?.[feature])),
    }))
    .filter((row) => row.values.every(Number.isFinite));
  const clusterCount = Math.max(2, Math.min(6, Math.floor(Number(requestedClusters) || 3)));
  if (rows.length < clusterCount) {
    return { status: 'insufficient-data', sampleSize: rows.length, requiredSamples: clusterCount };
  }

  const columns = features.map((_, index) => describeValues(rows.map((row) => row.values[index])));
  const standardized = rows.map((row) => row.values.map((value, index) => {
    const scale = columns[index].stdDev || 1;
    return (value - columns[index].mean) / scale;
  }));
  let centers = deterministicCenters(standardized, clusterCount);
  let assignments = standardized.map((row) => nearestCenter(row, centers));
  const maxIterations = Math.max(1, Math.min(200, Number(options.maxIterations) || 100));

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const nextCenters = centers.map((center, cluster) => {
      const members = standardized.filter((_, index) => assignments[index] === cluster);
      if (members.length === 0) return center;
      return center.map((_, featureIndex) => (
        members.reduce((sum, row) => sum + row[featureIndex], 0) / members.length
      ));
    });
    const nextAssignments = standardized.map((row) => nearestCenter(row, nextCenters));
    centers = nextCenters;
    if (nextAssignments.every((cluster, index) => cluster === assignments[index])) break;
    assignments = nextAssignments;
  }

  const originalCenters = centers.map((center) => Object.fromEntries(
    features.map((feature, index) => [
      feature,
      roundMetric(columns[index].mean + (center[index] * (columns[index].stdDev || 1))),
    ])
  ));
  const profiles = centers.map((_, cluster) => {
    const memberIndexes = assignments
      .map((assignment, index) => (assignment === cluster ? index : -1))
      .filter((index) => index >= 0);
    const fatigue = describeValues(memberIndexes.map((index) => rows[index].values[0]));
    return {
      cluster,
      size: memberIndexes.length,
      meanFatigue: fatigue.mean,
      interpretation: fatigue.mean >= 70 ? 'fatiga elevada' : fatigue.mean >= 40 ? 'fatiga intermedia' : 'fatiga baja',
    };
  });

  return {
    status: 'ok',
    sampleSize: rows.length,
    clusterCount,
    features,
    assignments,
    sourceIndexes: rows.map((row) => row.originalIndex),
    centers: originalCenters,
    profiles,
    methodology: 'K-Means determinista sobre variables estandarizadas',
  };
}
