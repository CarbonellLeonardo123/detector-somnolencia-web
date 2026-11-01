import { describe, expect, it } from 'vitest';
import { mapFrameResultToUiState } from './useDetectionLoop';

describe('mapFrameResultToUiState', () => {
  it('preserves a calibration progress of zero', () => {
    const uiState = mapFrameResultToUiState({
      state: 'CALIBRANDO',
      faceDetected: true,
      avgEAR: 0.3,
      earThreshold: 0.21,
      fatigueProbability: 0,
      attentionScore: 100,
      blinkRate: 0,
      totalBlinks: 0,
      microsleepCount: 0,
      calibrationProgress: 0,
    });

    expect(uiState.calibrationProgress).toBe(0);
  });

  it('defaults missing calibration progress to zero', () => {
    const uiState = mapFrameResultToUiState({});

    expect(uiState.calibrationProgress).toBe(0);
  });
});
