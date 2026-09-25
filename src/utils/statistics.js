/**
 * Exponential Moving Average for smooth signal tracking
 */
export function exponentialMovingAverage(currentValue, previousAverage, alpha = 0.2) {
  if (previousAverage === null || previousAverage === undefined) return currentValue;
  return alpha * currentValue + (1 - alpha) * previousAverage;
}

/**
 * Calculates blink rate (blinks per minute) from a list of blink timestamps
 * using a sliding window (default 60 seconds).
 */
export function calculateBlinkRate(blinkTimestamps, windowMs = 60000, now = Date.now()) {
  if (!blinkTimestamps || blinkTimestamps.length === 0) return 0;

  // Filter timestamps within the window
  const windowStart = now - windowMs;
  const recentBlinks = blinkTimestamps.filter((t) => t >= windowStart);

  if (recentBlinks.length === 0) return 0;

  // Normalize to 1 minute (60s)
  const rate = Math.round((recentBlinks.length / (windowMs / 60000)) * 10) / 10;
  return rate;
}

/**
 * Calculates mean of an array of numbers
 */
export function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return sum / arr.length;
}

/**
 * Calculates attention level (0 - 100%) based on fatigue and status
 */
export function calculateAttentionScore(fatigueProbability) {
  const score = 100 - fatigueProbability;
  return Math.max(0, Math.min(100, Math.round(score)));
}
