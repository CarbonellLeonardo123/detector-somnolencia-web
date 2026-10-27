import { describe, expect, it, vi } from 'vitest';
import { analyzeLocally, requestAnalytics } from './analyticsApi';

const sessions = [{
  timeline: [
    { elapsedSeconds: 0, avgEAR: 0.3, fatiguePct: 20, blinkRate: 12 },
    { elapsedSeconds: 30, avgEAR: 0.25, fatiguePct: 40, blinkRate: 16 },
    { elapsedSeconds: 60, avgEAR: 0.2, fatiguePct: 70, blinkRate: 22, microsleepsDelta: 1 },
  ],
}];

describe('analytics API client', () => {
  it('uses the Python response when the API succeeds', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ metadata: { engine: 'Python', libraries: ['NumPy', 'Pandas'] } }),
    });

    const result = await requestAnalytics(sessions, { fetchImpl });
    expect(result.metadata.engine).toBe('Python');
    expect(fetchImpl).toHaveBeenCalledWith('/api/analytics', expect.objectContaining({ method: 'POST' }));
  });

  it('sends only anonymous metric fields to the Python API', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ metadata: { engine: 'Python' } }),
    });
    const privateSessions = [{
      sessionId: 'real-private-session',
      userId: 'firebase-private-uid',
      email: 'conductor@empresa.com',
      displayName: 'Persona Privada',
      timeline: [
        { elapsedSeconds: 0, avgEAR: 0.3, fatiguePct: 20 },
        { elapsedSeconds: 30, avgEAR: 0.25, fatiguePct: 40 },
      ],
    }];

    await requestAnalytics(privateSessions, { fetchImpl });

    const requestBody = JSON.parse(fetchImpl.mock.calls[0][1].body);
    const serialized = JSON.stringify(requestBody).toLowerCase();
    expect(serialized).not.toContain('firebase-private-uid');
    expect(serialized).not.toContain('conductor@empresa.com');
    expect(serialized).not.toContain('persona privada');
    expect(requestBody.observations.every((row) => !('driverId' in row))).toBe(true);
    expect(requestBody.observations.every((row) => !('userId' in row))).toBe(true);
  });

  it('uses an explicit local fallback when the API fails', async () => {
    const result = await requestAnalytics(sessions, {
      fetchImpl: vi.fn().mockRejectedValue(new Error('offline')),
    });

    expect(result.metadata.engine).toBe('JavaScript fallback local');
    expect(result.metadata.fallbackReason).toBe('offline');
    expect(result.metadata.dataMode).toBe('real');
    expect(result.statistics.sampleSize).toBe(3);
  });

  it('never silently substitutes demo data for empty real sessions', () => {
    const result = analyzeLocally([], { dataMode: 'real' });
    expect(result.metadata.dataMode).toBe('real');
    expect(result.metadata.sampleSize).toBe(0);
    expect(result.statistics.status).toBe('insufficient-data');
  });
});
