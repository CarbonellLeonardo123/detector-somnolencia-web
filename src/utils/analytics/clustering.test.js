import { describe, expect, it } from 'vitest';
import { kMeansSegments } from './clustering';

describe('deterministic K-Means segmentation', () => {
  it('returns reproducible assignments and finite centers', () => {
    const observations = [
      { fatiguePct: 10, avgEAR: 0.33, perclos: 0.01, blinkRate: 12, microsleeps: 0 },
      { fatiguePct: 12, avgEAR: 0.32, perclos: 0.02, blinkRate: 13, microsleeps: 0 },
      { fatiguePct: 65, avgEAR: 0.22, perclos: 0.2, blinkRate: 22, microsleeps: 1 },
      { fatiguePct: 70, avgEAR: 0.2, perclos: 0.25, blinkRate: 25, microsleeps: 1 },
      { fatiguePct: 90, avgEAR: 0.15, perclos: 0.45, blinkRate: 30, microsleeps: 3 },
      { fatiguePct: 92, avgEAR: 0.14, perclos: 0.5, blinkRate: 32, microsleeps: 4 },
    ];

    const first = kMeansSegments(observations, 3);
    const second = kMeansSegments(observations, 3);
    expect(first.status).toBe('ok');
    expect(first.assignments).toEqual(second.assignments);
    expect(first.centers).toEqual(second.centers);
    expect(first.centers.flatMap(Object.values).every(Number.isFinite)).toBe(true);
    expect(first.profiles.reduce((sum, profile) => sum + profile.size, 0)).toBe(6);
  });

  it('declares insufficient data instead of inventing clusters', () => {
    expect(kMeansSegments([{ fatiguePct: 20 }], 3).status).toBe('insufficient-data');
  });
});
