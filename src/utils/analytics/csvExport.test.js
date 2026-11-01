import { describe, expect, it } from 'vitest';
import { buildAnalyticsCsv } from './csvExport';

describe('buildAnalyticsCsv', () => {
  it('exports only academic metrics with an explicit data source', () => {
    const csv = buildAnalyticsCsv([
      {
        sessionId: 'session-1',
        elapsedMinutes: 1.5,
        avgEAR: 0.27,
        minEAR: 0.19,
        perclos: 0.12,
        blinkRate: 16,
        microsleeps: 1,
        alerts: 1,
        fatiguePct: 48,
        facePresenceRatio: 0.96,
      },
    ], 'real');

    expect(csv).toContain('dataSource,sessionId,elapsedMinutes');
    expect(csv).toContain('real,session-1,1.5');
    expect(csv).not.toMatch(/email|displayName|userId|driverId/i);
  });

  it('neutralizes spreadsheet formulas and escapes commas', () => {
    const csv = buildAnalyticsCsv([
      {
        sessionId: '=HYPERLINK("https://example.invalid","x")',
        elapsedMinutes: 0,
      },
    ], 'synthetic-demo');

    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain('"');
  });
});
