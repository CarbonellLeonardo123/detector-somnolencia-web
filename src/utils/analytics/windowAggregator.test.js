import { describe, expect, it } from 'vitest';
import { createWindowAggregator } from './windowAggregator';

describe('createWindowAggregator', () => {
  it('summarizes every valid frame in a feature window', () => {
    const aggregator = createWindowAggregator({
      startedAt: 1_000,
      sessionStartedAt: 0,
      windowIndex: 2,
      startingTotals: { totalBlinks: 5, microsleepCount: 1, totalAlerts: 1 },
    });

    aggregator.add({
      faceDetected: true,
      avgEAR: 0.3,
      baselineEAR: 0.32,
      earThreshold: 0.22,
      fatigueProbability: 20,
      attentionScore: 80,
      blinkRate: 12,
      totalBlinks: 5,
      microsleepCount: 1,
      isEyesClosed: false,
      state: 'NORMAL',
    });
    aggregator.add({
      faceDetected: true,
      avgEAR: 0.2,
      baselineEAR: 0.32,
      earThreshold: 0.22,
      fatigueProbability: 60,
      attentionScore: 40,
      blinkRate: 18,
      totalBlinks: 7,
      microsleepCount: 2,
      microsleepTriggeredThisFrame: true,
      isEyesClosed: true,
      state: 'ALERTA',
    });

    const window = aggregator.finalize({
      endedAt: 31_000,
      endingTotals: { totalBlinks: 7, microsleepCount: 2, totalAlerts: 2 },
    });

    expect(window).toMatchObject({
      schemaVersion: 2,
      windowIndex: 2,
      startedAt: 1_000,
      endedAt: 31_000,
      elapsedSeconds: 31,
      durationSeconds: 30,
      sampleCount: 2,
      faceDetectedSamples: 2,
      facePresenceRatio: 1,
      dataQuality: 'good',
      avgEAR: 0.25,
      medianEAR: 0.25,
      minEAR: 0.2,
      maxEAR: 0.3,
      earVariance: 0.005,
      fatigueMean: 40,
      fatigueMedian: 40,
      fatigueVariance: 800,
      maxFatigue: 60,
      attentionMean: 60,
      blinkRateMean: 15,
      closedEyeRatio: 0.5,
      perclosPct: 50,
      blinkCount: 2,
      microsleepsDelta: 1,
      alertsDelta: 1,
    });
    expect(window.earStdDev).toBeCloseTo(Math.sqrt(0.005), 6);
    expect(window.fatigueStdDev).toBeCloseTo(Math.sqrt(800), 6);
    expect(['NORMAL', 'ALERTA']).toContain(window.dominantState);
    expect(Object.values(window).every((value) => typeof value !== 'number' || Number.isFinite(value))).toBe(true);
  });

  it('tracks face presence separately and marks a partial low-quality window', () => {
    const aggregator = createWindowAggregator({ startedAt: 0, sessionStartedAt: 0 });

    aggregator.add({ faceDetected: false, state: 'CALIBRANDO' });
    aggregator.add({ faceDetected: false, state: 'CALIBRANDO' });
    aggregator.add({
      faceDetected: true,
      avgEAR: 0.28,
      fatigueProbability: 10,
      attentionScore: 90,
      blinkRate: 12,
      totalBlinks: 0,
      microsleepCount: 0,
      isEyesClosed: false,
      state: 'NORMAL',
    });

    const window = aggregator.finalize({ endedAt: 30_000 });

    expect(window.sampleCount).toBe(3);
    expect(window.faceDetectedSamples).toBe(1);
    expect(window.facePresenceRatio).toBeCloseTo(1 / 3, 4);
    expect(window.dataQuality).toBe('insufficient');
    expect(window.avgEAR).toBe(0.28);
    expect(window.earVariance).toBe(0);
    expect(window.earStdDev).toBe(0);
  });

  it('returns a finite, explicit empty window without inventing measurements', () => {
    const aggregator = createWindowAggregator({
      startedAt: 5_000,
      sessionStartedAt: 5_000,
      startingTotals: { totalBlinks: 4, microsleepCount: 2, totalAlerts: 3 },
    });

    const window = aggregator.finalize({
      endedAt: 35_000,
      endingTotals: { totalBlinks: 4, microsleepCount: 2, totalAlerts: 3 },
    });

    expect(window).toMatchObject({
      sampleCount: 0,
      faceDetectedSamples: 0,
      facePresenceRatio: 0,
      dataQuality: 'insufficient',
      avgEAR: 0,
      fatigueMean: 0,
      closedEyeRatio: 0,
      perclosPct: 0,
      blinkCount: 0,
      microsleepsDelta: 0,
      alertsDelta: 0,
      dominantState: 'SIN_DATOS',
    });
    expect(Object.values(window).every((value) => typeof value !== 'number' || Number.isFinite(value))).toBe(true);
  });

  it('never produces negative counter deltas when a detector counter resets', () => {
    const aggregator = createWindowAggregator({
      startingTotals: { totalBlinks: 8, microsleepCount: 3, totalAlerts: 2 },
    });
    aggregator.add({
      faceDetected: true,
      avgEAR: 0.3,
      fatigueProbability: 5,
      totalBlinks: 0,
      microsleepCount: 0,
      state: 'NORMAL',
    });

    const window = aggregator.finalize({
      endingTotals: { totalBlinks: 0, microsleepCount: 0, totalAlerts: 0 },
    });

    expect(window.blinkCount).toBe(0);
    expect(window.microsleepsDelta).toBe(0);
    expect(window.alertsDelta).toBe(0);
  });
});
