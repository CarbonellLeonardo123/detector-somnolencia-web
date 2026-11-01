import { describe, expect, it } from 'vitest';
import { calculateAnalyticsStatistics, describeValues } from './statistics';

describe('analytics statistics', () => {
  it('calculates descriptive sample statistics', () => {
    expect(describeValues([1, 2, 3, 4])).toEqual({
      count: 4,
      mean: 2.5,
      median: 2.5,
      variance: 1.666667,
      stdDev: 1.290994,
      min: 1,
      max: 4,
    });
  });

  it('ignores non-finite values and never returns NaN', () => {
    const result = describeValues([10, Number.NaN, Number.POSITIVE_INFINITY]);
    expect(result).toMatchObject({ count: 1, mean: 10, variance: 0, stdDev: 0 });
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
  });

  it('reports empirical fatigue, alert and microsleep probabilities', () => {
    const result = calculateAnalyticsStatistics([
      { fatiguePct: 20, avgEAR: 0.3, alerts: 0, microsleeps: 0 },
      { fatiguePct: 70, avgEAR: 0.2, alerts: 1, microsleeps: 0 },
      { fatiguePct: 80, avgEAR: 0.18, alerts: 0, microsleeps: 1 },
    ]);

    expect(result.sampleSize).toBe(3);
    expect(result.probabilities.highFatigue).toBeCloseTo(2 / 3);
    expect(result.probabilities.alert).toBeCloseTo(1 / 3);
    expect(result.probabilities.microsleep).toBeCloseTo(1 / 3);
  });
});
