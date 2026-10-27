const DRIVER_PROFILES = [
  { userId: 'demo-stable', baseFatigue: 12, trend: 3, ear: 0.32, blink: 13 },
  { userId: 'demo-progressive', baseFatigue: 24, trend: 7, ear: 0.29, blink: 16 },
  { userId: 'demo-intermittent', baseFatigue: 35, trend: 5, ear: 0.26, blink: 20 },
  { userId: 'demo-critical', baseFatigue: 55, trend: 7, ear: 0.22, blink: 25 },
];

export function createDemoAnalyticsDataset() {
  return DRIVER_PROFILES.map((profile, driverIndex) => ({
    sessionId: `demo-session-${driverIndex + 1}`,
    userId: profile.userId,
    schemaVersion: 2,
    dataSource: 'synthetic-demo',
    timeline: Array.from({ length: 10 }, (_, windowIndex) => {
      const fatigue = Math.min(98, profile.baseFatigue + (profile.trend * windowIndex));
      const perclos = Math.min(0.65, 0.02 + (fatigue / 180) + (driverIndex * 0.015));
      return {
        schemaVersion: 2,
        elapsedSeconds: windowIndex * 30,
        timestamp: 1_700_000_000 + (driverIndex * 1_000) + (windowIndex * 30),
        avgEAR: Math.max(0.12, profile.ear - (windowIndex * 0.006)),
        minEAR: Math.max(0.08, profile.ear - 0.08 - (windowIndex * 0.006)),
        closedEyeRatio: perclos,
        fatigueMean: fatigue,
        maxFatigue: Math.min(100, fatigue + 8),
        attentionMean: 100 - fatigue,
        blinkRateMean: profile.blink + Math.floor(windowIndex / 3),
        microsleepsDelta: fatigue >= 75 && windowIndex % 3 === 0 ? 1 : 0,
        alertsDelta: fatigue >= 65 && windowIndex % 2 === 0 ? 1 : 0,
        facePresenceRatio: 0.94 - (driverIndex * 0.01),
        state: fatigue >= 80 ? 'DANGER' : fatigue >= 60 ? 'ALERT' : fatigue >= 35 ? 'ATTENTION' : 'NORMAL',
        dataQuality: 'synthetic-demo',
      };
    }),
  }));
}

export const DEMO_ANALYTICS_SESSIONS = createDemoAnalyticsDataset();
