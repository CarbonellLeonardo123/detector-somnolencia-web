import { roundMetric } from './statistics';

function metrics(actual, predicted) {
  if (actual.length === 0) return { r2: 0, mae: 0, rmse: 0 };
  const mean = actual.reduce((sum, value) => sum + value, 0) / actual.length;
  const residuals = actual.map((value, index) => value - predicted[index]);
  const absoluteError = residuals.reduce((sum, value) => sum + Math.abs(value), 0);
  const squaredError = residuals.reduce((sum, value) => sum + (value ** 2), 0);
  const totalSquares = actual.reduce((sum, value) => sum + ((value - mean) ** 2), 0);
  const r2 = totalSquares === 0 ? (squaredError < 1e-12 ? 1 : 0) : 1 - (squaredError / totalSquares);
  return {
    r2: roundMetric(r2),
    mae: roundMetric(absoluteError / actual.length),
    rmse: roundMetric(Math.sqrt(squaredError / actual.length)),
  };
}

export function simpleLinearRegression(observations = [], forecastMinutes = 5) {
  const points = observations
    .map((item) => ({ x: Number(item?.elapsedMinutes), y: Number(item?.fatiguePct) }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
  if (points.length < 2) return { status: 'insufficient-data', sampleSize: points.length };

  const meanX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + ((point.x - meanX) ** 2), 0);
  if (denominator <= 1e-12) return { status: 'insufficient-data', sampleSize: points.length };

  const numerator = points.reduce(
    (sum, point) => sum + ((point.x - meanX) * (point.y - meanY)),
    0
  );
  const slope = numerator / denominator;
  const intercept = meanY - (slope * meanX);
  const predicted = points.map((point) => intercept + (slope * point.x));
  const maximumMinute = Math.max(...points.map((point) => point.x));
  const forecastAt = maximumMinute + Math.max(0, Number(forecastMinutes) || 0);
  const rawForecast = intercept + (slope * forecastAt);

  return {
    status: 'ok',
    sampleSize: points.length,
    slope: roundMetric(slope),
    intercept: roundMetric(intercept),
    ...metrics(points.map((point) => point.y), predicted),
    forecast: {
      atMinute: roundMetric(forecastAt),
      value: roundMetric(Math.min(100, Math.max(0, rawForecast))),
      rawValue: roundMetric(rawForecast),
    },
    points: points.map((point, index) => ({
      minute: roundMetric(point.x),
      actual: roundMetric(point.y),
      predicted: roundMetric(predicted[index]),
    })),
  };
}

function transpose(matrix) {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]));
}

function multiply(left, right) {
  return left.map((row) => right[0].map((_, column) => (
    row.reduce((sum, value, index) => sum + (value * right[index][column]), 0)
  )));
}

function inverse(matrix) {
  const size = matrix.length;
  const augmented = matrix.map((row, rowIndex) => [
    ...row,
    ...Array.from({ length: size }, (_, column) => (rowIndex === column ? 1 : 0)),
  ]);

  for (let column = 0; column < size; column += 1) {
    let pivotRow = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivotRow][column])) pivotRow = row;
    }
    if (Math.abs(augmented[pivotRow][column]) < 1e-14) return null;
    [augmented[column], augmented[pivotRow]] = [augmented[pivotRow], augmented[column]];

    const pivot = augmented[column][column];
    augmented[column] = augmented[column].map((value) => value / pivot);
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      augmented[row] = augmented[row].map((value, index) => value - (factor * augmented[column][index]));
    }
  }
  return augmented.map((row) => row.slice(size));
}

const DEFAULT_FEATURES = [
  'elapsedMinutes',
  'avgEAR',
  'minEAR',
  'perclos',
  'blinkRate',
  'microsleeps',
  'facePresenceRatio',
];

export function multipleLinearRegression(observations = [], options = {}) {
  const features = options.features || DEFAULT_FEATURES;
  const targetKey = options.targetKey || 'targetFatigue';
  const ridge = Number.isFinite(options.ridge) ? Math.max(0, options.ridge) : 1e-6;
  const rows = observations.filter((item) => (
    item?.[targetKey] !== null
    && item?.[targetKey] !== undefined
    && Number.isFinite(Number(item[targetKey]))
    && features.every((feature) => Number.isFinite(Number(item?.[feature])))
  ));

  if (rows.length < Math.max(3, features.length + 1)) {
    return { status: 'insufficient-data', sampleSize: rows.length, requiredSamples: Math.max(3, features.length + 1) };
  }

  const design = rows.map((item) => [1, ...features.map((feature) => Number(item[feature]))]);
  const target = rows.map((item) => [Number(item[targetKey])]);
  const designT = transpose(design);
  const gram = multiply(designT, design);
  for (let index = 1; index < gram.length; index += 1) gram[index][index] += ridge;
  const gramInverse = inverse(gram);
  if (!gramInverse) return { status: 'singular-matrix', sampleSize: rows.length };

  const beta = multiply(multiply(gramInverse, designT), target).map(([value]) => value);
  const predicted = design.map((row) => row.reduce((sum, value, index) => sum + (value * beta[index]), 0));
  const coefficients = { intercept: roundMetric(beta[0]) };
  features.forEach((feature, index) => { coefficients[feature] = roundMetric(beta[index + 1]); });

  return {
    status: 'ok',
    sampleSize: rows.length,
    features,
    coefficients,
    ...metrics(target.map(([value]) => value), predicted),
    matrix: {
      rows: design.length,
      columns: design[0].length,
      betaLength: beta.length,
      predictionLength: predicted.length,
      equation: 'ŷ = Xβ; β = (XᵀX + λI)⁻¹Xᵀy',
    },
    predictions: predicted.map(roundMetric),
  };
}
