const DEFAULT_TOTALS = Object.freeze({
  totalBlinks: 0,
  microsleepCount: 0,
  totalAlerts: 0,
});

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function round(value, digits = 4) {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(digits));
}

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function sampleVariance(values, average = mean(values)) {
  if (values.length < 2) return 0;
  const squaredDifferences = values.reduce(
    (sum, value) => sum + (value - average) ** 2,
    0
  );
  return squaredDifferences / (values.length - 1);
}

function summarize(values) {
  if (values.length === 0) {
    return { mean: 0, median: 0, min: 0, max: 0, variance: 0, stdDev: 0 };
  }

  const average = mean(values);
  const variance = sampleVariance(values, average);
  return {
    mean: round(average),
    median: round(median(values)),
    min: round(Math.min(...values)),
    max: round(Math.max(...values)),
    variance: round(variance, 6),
    stdDev: round(Math.sqrt(variance), 6),
  };
}

function normalizeTotals(totals = {}) {
  return {
    totalBlinks: finiteNumber(totals.totalBlinks),
    microsleepCount: finiteNumber(totals.microsleepCount),
    totalAlerts: finiteNumber(totals.totalAlerts),
  };
}

function positiveDelta(end, start) {
  return Math.max(0, finiteNumber(end) - finiteNumber(start));
}

function qualityFor(facePresenceRatio, faceDetectedSamples) {
  if (faceDetectedSamples === 0 || facePresenceRatio < 0.6) return 'insufficient';
  if (facePresenceRatio < 0.8) return 'limited';
  return 'good';
}

function dominantState(stateCounts) {
  let selected = 'SIN_DATOS';
  let greatestCount = 0;
  for (const [state, count] of stateCounts.entries()) {
    if (count > greatestCount) {
      selected = state;
      greatestCount = count;
    }
  }
  return selected;
}

/**
 * Builds a bounded, ML-ready feature window from frame-level detector output.
 * The accumulator only retains numeric samples for the current window and is
 * discarded after finalize(), so memory usage is bounded by the bucket size.
 */
export function createWindowAggregator({
  startedAt = Date.now(),
  sessionStartedAt = startedAt,
  windowIndex = 0,
  startingTotals = DEFAULT_TOTALS,
} = {}) {
  const initialTotals = normalizeTotals(startingTotals);
  let latestTotals = { ...initialTotals };
  let sampleCount = 0;
  let faceDetectedSamples = 0;
  let closedEyeSamples = 0;

  const earValues = [];
  const fatigueValues = [];
  const attentionValues = [];
  const blinkRateValues = [];
  const baselineValues = [];
  const thresholdValues = [];
  const stateCounts = new Map();

  function add(metrics = {}) {
    sampleCount += 1;

    if (metrics.state) {
      stateCounts.set(metrics.state, (stateCounts.get(metrics.state) || 0) + 1);
    }

    if (Number.isFinite(metrics.totalBlinks)) {
      latestTotals.totalBlinks = metrics.totalBlinks;
    }
    if (Number.isFinite(metrics.microsleepCount)) {
      latestTotals.microsleepCount = metrics.microsleepCount;
    }

    if (!metrics.faceDetected) return;

    faceDetectedSamples += 1;
    if (metrics.isEyesClosed) closedEyeSamples += 1;

    if (Number.isFinite(metrics.avgEAR)) earValues.push(metrics.avgEAR);
    if (Number.isFinite(metrics.fatigueProbability)) {
      fatigueValues.push(metrics.fatigueProbability);
    }
    if (Number.isFinite(metrics.attentionScore)) attentionValues.push(metrics.attentionScore);
    if (Number.isFinite(metrics.blinkRate)) blinkRateValues.push(metrics.blinkRate);
    if (Number.isFinite(metrics.baselineEAR)) baselineValues.push(metrics.baselineEAR);
    if (Number.isFinite(metrics.earThreshold)) thresholdValues.push(metrics.earThreshold);
  }

  function finalize({ endedAt = Date.now(), endingTotals } = {}) {
    const safeEndedAt = Math.max(finiteNumber(endedAt, startedAt), startedAt);
    const finalTotals = normalizeTotals(endingTotals || latestTotals);
    const ear = summarize(earValues);
    const fatigue = summarize(fatigueValues);
    const attentionMean = round(mean(attentionValues));
    const blinkRateMean = round(mean(blinkRateValues));
    const facePresenceRatio = sampleCount > 0 ? faceDetectedSamples / sampleCount : 0;
    const closedEyeRatio = faceDetectedSamples > 0
      ? closedEyeSamples / faceDetectedSamples
      : 0;
    const state = dominantState(stateCounts);

    return {
      schemaVersion: 2,
      windowIndex,
      timestamp: Math.floor(safeEndedAt / 1000),
      startedAt,
      endedAt: safeEndedAt,
      elapsedSeconds: Math.max(0, Math.round((safeEndedAt - sessionStartedAt) / 1000)),
      durationSeconds: Math.max(0, Math.round((safeEndedAt - startedAt) / 1000)),

      sampleCount,
      faceDetectedSamples,
      facePresenceRatio: round(facePresenceRatio),
      dataQuality: qualityFor(facePresenceRatio, faceDetectedSamples),

      avgEAR: ear.mean,
      medianEAR: ear.median,
      minEAR: ear.min,
      maxEAR: ear.max,
      earVariance: ear.variance,
      earStdDev: ear.stdDev,
      baselineEAR: round(mean(baselineValues)),
      earThreshold: round(mean(thresholdValues)),

      fatigueMean: fatigue.mean,
      fatigueMedian: fatigue.median,
      fatigueVariance: fatigue.variance,
      fatigueStdDev: fatigue.stdDev,
      maxFatigue: fatigue.max,
      attentionMean,
      blinkRateMean,

      closedEyeRatio: round(closedEyeRatio),
      perclosPct: round(closedEyeRatio * 100, 2),
      blinkCount: positiveDelta(finalTotals.totalBlinks, initialTotals.totalBlinks),
      microsleepsDelta: positiveDelta(
        finalTotals.microsleepCount,
        initialTotals.microsleepCount
      ),
      alertsDelta: positiveDelta(finalTotals.totalAlerts, initialTotals.totalAlerts),
      dominantState: state,

      // Backward-compatible aliases used by the existing charts and history.
      fatiguePct: fatigue.mean,
      blinkRate: blinkRateMean,
      attentionScore: attentionMean,
      state,
    };
  }

  return { add, finalize };
}
