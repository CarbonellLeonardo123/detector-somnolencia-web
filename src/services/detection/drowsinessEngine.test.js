import { describe, expect, it } from 'vitest';
import { DrowsinessEngine } from './drowsinessEngine';
import { DETECTION_STATES } from '../../utils/constants';

describe('DrowsinessEngine critical state', () => {
  it('uses the declared DANGER state and activates the alert for a microsleep', () => {
    const engine = new DrowsinessEngine();

    engine.processFrame({ faceDetected: true, avgEAR: 0.3, isEyesClosed: false }, 1_000);
    engine.processFrame({ faceDetected: true, avgEAR: 0.3, isEyesClosed: false }, 4_001);
    engine.processFrame({ faceDetected: true, avgEAR: 0.1, isEyesClosed: true }, 4_100);
    const result = engine.processFrame(
      { faceDetected: true, avgEAR: 0.1, isEyesClosed: true },
      5_601
    );

    expect(DETECTION_STATES.DANGER).toBe('PELIGRO');
    expect(result.state).toBe(DETECTION_STATES.DANGER);
    expect(result.isAlertActive).toBe(true);
    expect(result.microsleepCount).toBe(1);
  });

  it('keeps an active critical alert when the face is temporarily lost', () => {
    const engine = new DrowsinessEngine();
    engine.state = DETECTION_STATES.DANGER;

    const result = engine.processFrame({ faceDetected: false }, 10_000);

    expect(result.state).toBe(DETECTION_STATES.DANGER);
    expect(result.isAlertActive).toBe(true);
  });
});
