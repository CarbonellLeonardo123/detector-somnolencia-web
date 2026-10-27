function finiteOr(value, fallback = 0) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, finiteOr(value)));
}

function normalizedRatio(value) {
  const numeric = finiteOr(value);
  return clamp(numeric > 1 ? numeric / 100 : numeric, 0, 1);
}

function timelineFromSession(session) {
  if (Array.isArray(session?.timeline) && session.timeline.length > 0) return session.timeline;
  const metrics = session?.metrics;
  if (!metrics) return [];

  return [{
    elapsedSeconds: finiteOr(session.durationSeconds),
    avgEAR: metrics.avgEAR,
    minEAR: metrics.minEAR,
    fatiguePct: metrics.avgFatiguePercentage,
    maxFatigue: metrics.maxFatiguePercentage,
    blinkRate: metrics.avgBlinkRate,
    microsleepsDelta: metrics.microsleepCount,
    alertsDelta: metrics.totalAlerts,
    state: metrics.riskLevel,
    facePresenceRatio: 1,
  }];
}

function elapsedMinutesFor(point, index, firstTimestamp) {
  if (Number.isFinite(Number(point.elapsedMinutes))) return Math.max(0, Number(point.elapsedMinutes));
  if (Number.isFinite(Number(point.elapsedSeconds))) return Math.max(0, Number(point.elapsedSeconds) / 60);
  if (Number.isFinite(Number(point.timestamp)) && Number.isFinite(firstTimestamp)) {
    return Math.max(0, (Number(point.timestamp) - firstTimestamp) / 60);
  }
  return index * 0.5;
}

function normalizePoint(point, context) {
  const fatiguePct = clamp(
    point.fatigueMean ?? point.avgFatigueIndex ?? point.avgFatiguePercentage ?? point.fatiguePct,
    0,
    100
  );
  const avgEAR = clamp(point.avgEAR, 0, 1);
  const minEAR = clamp(point.minEAR ?? avgEAR, 0, 1);

  return {
    schemaVersion: finiteOr(point.schemaVersion, 1),
    sessionId: context.sessionId,
    driverId: context.driverId,
    observationIndex: context.index,
    elapsedMinutes: finiteOr(elapsedMinutesFor(point, context.index, context.firstTimestamp)),
    avgEAR,
    minEAR,
    perclos: normalizedRatio(point.closedEyeRatio ?? point.perclos ?? point.perclosPct),
    blinkRate: clamp(point.blinkRateMean ?? point.avgBlinkRate ?? point.blinkRate, 0, 120),
    microsleeps: Math.max(0, finiteOr(point.microsleepsDelta ?? point.microsleepCount)),
    alerts: Math.max(0, finiteOr(point.alertsDelta ?? point.alertCount ?? point.totalAlerts)),
    fatiguePct,
    maxFatigue: clamp(point.maxFatigue ?? point.maxFatigueIndex ?? fatiguePct, 0, 100),
    attentionScore: clamp(point.attentionMean ?? point.avgAttentionScore ?? point.attentionScore ?? (100 - fatiguePct), 0, 100),
    facePresenceRatio: normalizedRatio(point.facePresenceRatio ?? (avgEAR > 0 ? 1 : 0)),
    state: typeof point.state === 'string' ? point.state.toUpperCase() : 'UNKNOWN',
    dataQuality: typeof point.dataQuality === 'string' ? point.dataQuality : 'legacy-or-unknown',
    targetFatigue: null,
  };
}

export function normalizeSessions(sessions = []) {
  const source = Array.isArray(sessions) ? sessions : [];
  const driverAliases = new Map();
  let nextDriver = 1;
  const normalized = [];

  source.forEach((session, sessionIndex) => {
    const rawDriver = String(session?.userId ?? session?.driverId ?? `anonymous-${sessionIndex}`);
    if (!driverAliases.has(rawDriver)) {
      driverAliases.set(rawDriver, `driver-${nextDriver}`);
      nextDriver += 1;
    }

    const timeline = timelineFromSession(session);
    const firstTimestamp = timeline
      .map((point) => Number(point?.timestamp))
      .find(Number.isFinite);
    const sessionRows = timeline.map((point = {}, index) => normalizePoint(point, {
      sessionId: `session-${sessionIndex + 1}`,
      driverId: driverAliases.get(rawDriver),
      index,
      firstTimestamp,
    }));

    for (let index = 0; index < sessionRows.length - 1; index += 1) {
      sessionRows[index].targetFatigue = sessionRows[index + 1].fatiguePct;
    }
    normalized.push(...sessionRows);
  });

  return normalized;
}

export function latestObservation(observations = []) {
  return observations.length > 0 ? observations[observations.length - 1] : null;
}
