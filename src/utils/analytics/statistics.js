const ROUNDING_FACTOR = 1_000_000;

export function finiteNumbers(values = []) {
  return values
    .map((value) => (typeof value === 'number' ? value : Number(value)))
    .filter(Number.isFinite);
}

export function roundMetric(value) {
  return Number.isFinite(value)
    ? Math.round(value * ROUNDING_FACTOR) / ROUNDING_FACTOR
    : 0;
}

export function describeValues(values = []) {
  const finite = finiteNumbers(values).sort((a, b) => a - b);
  if (finite.length === 0) {
    return { count: 0, mean: 0, median: 0, variance: 0, stdDev: 0, min: 0, max: 0 };
  }

  const sum = finite.reduce((total, value) => total + value, 0);
  const mean = sum / finite.length;
  const middle = Math.floor(finite.length / 2);
  const median = finite.length % 2 === 0
    ? (finite[middle - 1] + finite[middle]) / 2
    : finite[middle];
  const squaredError = finite.reduce((total, value) => total + ((value - mean) ** 2), 0);
  const variance = finite.length > 1 ? squaredError / (finite.length - 1) : 0;

  return {
    count: finite.length,
    mean: roundMetric(mean),
    median: roundMetric(median),
    variance: roundMetric(variance),
    stdDev: roundMetric(Math.sqrt(variance)),
    min: roundMetric(finite[0]),
    max: roundMetric(finite[finite.length - 1]),
  };
}

function empiricalProbability(observations, predicate) {
  if (observations.length === 0) return 0;
  return roundMetric(observations.filter(predicate).length / observations.length);
}

export function calculateAnalyticsStatistics(observations = []) {
  const valid = observations.filter((observation) => observation && typeof observation === 'object');
  if (valid.length === 0) {
    return {
      status: 'insufficient-data',
      sampleSize: 0,
      fatigue: describeValues([]),
      ear: describeValues([]),
      perclos: describeValues([]),
      blinkRate: describeValues([]),
      probabilities: { highFatigue: 0, alert: 0, microsleep: 0 },
    };
  }

  return {
    status: 'ok',
    sampleSize: valid.length,
    fatigue: describeValues(valid.map((item) => item.fatiguePct)),
    ear: describeValues(valid.map((item) => item.avgEAR)),
    perclos: describeValues(valid.map((item) => item.perclos)),
    blinkRate: describeValues(valid.map((item) => item.blinkRate)),
    probabilities: {
      highFatigue: empiricalProbability(valid, (item) => Number(item.fatiguePct) >= 60),
      alert: empiricalProbability(valid, (item) => Number(item.alerts) > 0 || ['ALERT', 'DANGER', 'PELIGRO'].includes(item.state)),
      microsleep: empiricalProbability(valid, (item) => Number(item.microsleeps) > 0),
    },
  };
}
