import { kMeansSegments } from '../../utils/analytics/clustering';
import { DEMO_NEURAL_ARTIFACT, runNeuralNetworkInference } from '../../utils/analytics/neuralNetwork';
import { multipleLinearRegression, simpleLinearRegression } from '../../utils/analytics/regression';
import { latestObservation, normalizeSessions } from '../../utils/analytics/sessionFeatures';
import { calculateAnalyticsStatistics } from '../../utils/analytics/statistics';

function sanitizeObservationForApi(observation) {
  return {
    sessionId: observation.sessionId,
    elapsedMinutes: observation.elapsedMinutes,
    avgEAR: observation.avgEAR,
    minEAR: observation.minEAR,
    perclos: observation.perclos,
    blinkRate: observation.blinkRate,
    microsleeps: observation.microsleeps,
    alerts: observation.alerts,
    fatiguePct: observation.fatiguePct,
    facePresenceRatio: observation.facePresenceRatio,
  };
}

export function analyzeLocally(sessions = [], options = {}) {
  const observations = normalizeSessions(sessions);
  const dataMode = options.dataMode || 'real';
  const latest = latestObservation(observations);
  return {
    metadata: {
      engine: 'JavaScript fallback local',
      libraries: ['JavaScript ES Modules'],
      dataMode,
      sampleSize: observations.length,
      fallbackReason: options.fallbackReason || null,
      generatedAt: new Date().toISOString(),
    },
    statistics: calculateAnalyticsStatistics(observations),
    simpleRegression: simpleLinearRegression(observations, options.forecastMinutes ?? 5),
    multipleRegression: multipleLinearRegression(observations),
    segmentation: kMeansSegments(observations, options.clusterCount ?? 3),
    neuralNetwork: latest
      ? runNeuralNetworkInference(latest, options.modelArtifact || DEMO_NEURAL_ARTIFACT)
      : { status: 'insufficient-data' },
    observations,
    warnings: [
      'El fallback local reproduce la demostración; el motor Python es la evidencia principal de NumPy/Pandas.',
      ...(dataMode === 'synthetic-demo' ? ['Los datos mostrados son sintéticos y no representan conductores reales.'] : []),
    ],
  };
}

export async function requestAnalytics(sessions = [], options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const observations = normalizeSessions(sessions).map(sanitizeObservationForApi);
  const fallback = (reason) => analyzeLocally(sessions, {
    ...options,
    fallbackReason: reason,
  });
  if (typeof fetchImpl !== 'function') return fallback('fetch-unavailable');

  try {
    const response = await fetchImpl('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataMode: options.dataMode || 'real',
        forecastMinutes: options.forecastMinutes ?? 5,
        clusterCount: options.clusterCount ?? 3,
        observations,
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status || 'error'}`);
    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || !payload.metadata) {
      throw new Error('invalid-api-response');
    }
    return payload;
  } catch (error) {
    return fallback(error?.message || 'api-unavailable');
  }
}
