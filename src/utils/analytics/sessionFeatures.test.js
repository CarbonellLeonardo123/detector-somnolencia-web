import { describe, expect, it } from 'vitest';
import { normalizeSessions } from './sessionFeatures';

describe('session feature normalization', () => {
  it('normalizes legacy and schema v2 timelines and assigns future targets', () => {
    const observations = normalizeSessions([
      {
        sessionId: 'private-session-id',
        userId: 'private-user-id',
        timeline: [
          { timestamp: 100, avgEAR: 0.31, fatiguePct: 10, blinkRate: 12 },
          {
            schemaVersion: 2,
            timestamp: 130,
            elapsedSeconds: 30,
            avgEAR: 0.25,
            minEAR: 0.18,
            closedEyeRatio: 0.15,
            fatigueMean: 40,
            blinkRateMean: 18,
            microsleepsDelta: 1,
            alertsDelta: 1,
            facePresenceRatio: 0.9,
          },
        ],
      },
    ]);

    expect(observations).toHaveLength(2);
    expect(observations[0]).toMatchObject({
      sessionId: 'session-1',
      driverId: 'driver-1',
      elapsedMinutes: 0,
      fatiguePct: 10,
      targetFatigue: 40,
    });
    expect(observations[1]).toMatchObject({
      perclos: 0.15,
      microsleeps: 1,
      alerts: 1,
      facePresenceRatio: 0.9,
      targetFatigue: null,
    });
    expect(JSON.stringify(observations)).not.toContain('private-user-id');
    expect(JSON.stringify(observations)).not.toContain('private-session-id');
  });

  it('sanitizes invalid numeric input', () => {
    const [observation] = normalizeSessions([{ timeline: [{ fatiguePct: 'bad', avgEAR: Infinity }] }]);
    expect(Object.entries(observation)
      .filter(([, value]) => typeof value === 'number')
      .every(([, value]) => Number.isFinite(value))).toBe(true);
  });
});
