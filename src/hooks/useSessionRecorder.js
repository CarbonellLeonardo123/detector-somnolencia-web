import { useRef, useState, useCallback, useEffect } from 'react';
import { createSession, updateSession } from '../services/firebase/sessionService';
import { recordAlert } from '../services/firebase/alertService';
import { CONFIG } from '../utils/constants';
import { createWindowAggregator } from '../utils/analytics/windowAggregator';

export function useSessionRecorder(userId) {
  const [sessionId, setSessionId] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const sessionStartTimeRef = useRef(null);
  const sessionIdRef = useRef(null);
  const sessionOwnerIdRef = useRef(null);
  const userIdRef = useRef(userId);
  const lastBucketSaveTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const sessionCreationPromiseRef = useRef(null);
  const stopPromiseRef = useRef(null);
  const timelineRef = useRef([]);
  const windowAggregatorRef = useRef(null);
  const windowIndexRef = useRef(0);

  // Constant-memory running aggregations. Keeping every video frame in an
  // array makes long sessions consume unbounded memory.
  const earStatsRef = useRef({ count: 0, sum: 0, min: Infinity });
  const fatigueStatsRef = useRef({ count: 0, sum: 0, max: 0 });
  const latestMetricsRef = useRef({ totalBlinks: 0, blinkRate: 0 });
  const alertsCountRef = useRef(0);
  const microsleepsCountRef = useRef(0);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Start new recording session
  const startSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;

    const newSessionId = `sess_${Date.now()}`;
    const now = Date.now();
    sessionIdRef.current = newSessionId;
    sessionOwnerIdRef.current = userIdRef.current;
    sessionStartTimeRef.current = now;
    lastBucketSaveTimeRef.current = now;
    timelineRef.current = [];
    windowIndexRef.current = 0;
    windowAggregatorRef.current = createWindowAggregator({
      startedAt: now,
      sessionStartedAt: now,
      windowIndex: 0,
    });
    earStatsRef.current = { count: 0, sum: 0, min: Infinity };
    fatigueStatsRef.current = { count: 0, sum: 0, max: 0 };
    latestMetricsRef.current = { totalBlinks: 0, blinkRate: 0 };
    alertsCountRef.current = 0;
    microsleepsCountRef.current = 0;

    setSessionId(newSessionId);
    setSessionDuration(0);
    setIsRecording(true);

    // Duration timer interval (1 second)
    timerIntervalRef.current = setInterval(() => {
      if (sessionStartTimeRef.current) {
        setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
      }
    }, 1000);

    sessionCreationPromiseRef.current = createSession(sessionOwnerIdRef.current, {
      sessionId: newSessionId,
      startedAt: new Date(now).toISOString(),
      schemaVersion: 2,
      dataSource: 'real',
    });
    try {
      await sessionCreationPromiseRef.current;
    } finally {
      sessionCreationPromiseRef.current = null;
    }

    return newSessionId;
  }, []);

  // Feed frame data into the recorder
  const recordFrameData = useCallback((metrics) => {
    const activeSessionId = sessionIdRef.current;
    if (!sessionStartTimeRef.current || !activeSessionId) return;

    windowAggregatorRef.current?.add(metrics);

    if (metrics.faceDetected) {
      const earStats = earStatsRef.current;
      earStats.count += 1;
      earStats.sum += metrics.avgEAR;
      earStats.min = Math.min(earStats.min, metrics.avgEAR);

      const fatigueStats = fatigueStatsRef.current;
      fatigueStats.count += 1;
      fatigueStats.sum += metrics.fatigueProbability;
      fatigueStats.max = Math.max(fatigueStats.max, metrics.fatigueProbability);
    }

    latestMetricsRef.current = {
      totalBlinks: metrics.totalBlinks || 0,
      blinkRate: metrics.blinkRate || 0,
    };

    if (metrics.microsleepTriggeredThisFrame) {
      microsleepsCountRef.current++;
      alertsCountRef.current++;
      recordAlert(sessionOwnerIdRef.current, activeSessionId, {
        type: 'MICROSLEEP',
        earValue: metrics.avgEAR,
        fatiguePercentage: metrics.fatigueProbability,
        durationMs: CONFIG.MICROSLEEP_THRESHOLD_MS,
      });
    }

    // Check if 30 seconds have passed to append a timeline bucket
    const now = Date.now();
    if (now - lastBucketSaveTimeRef.current >= CONFIG.FIRESTORE_BUCKET_INTERVAL_MS) {
      const bucket = windowAggregatorRef.current.finalize({
        endedAt: now,
        endingTotals: {
          totalBlinks: metrics.totalBlinks || 0,
          microsleepCount: microsleepsCountRef.current,
          totalAlerts: alertsCountRef.current,
        },
      });

      timelineRef.current.push(bucket);
      lastBucketSaveTimeRef.current = now;
      windowIndexRef.current += 1;
      windowAggregatorRef.current = createWindowAggregator({
        startedAt: now,
        sessionStartedAt: sessionStartTimeRef.current,
        windowIndex: windowIndexRef.current,
        startingTotals: {
          totalBlinks: metrics.totalBlinks || 0,
          microsleepCount: microsleepsCountRef.current,
          totalAlerts: alertsCountRef.current,
        },
      });

      // Checkpoint write to Firestore / LocalStorage
      updateSession(sessionOwnerIdRef.current, activeSessionId, {
        timeline: timelineRef.current,
        'metrics.totalAlerts': alertsCountRef.current,
        'metrics.microsleepCount': microsleepsCountRef.current,
        'metrics.totalBlinks': metrics.totalBlinks,
      });
    }
  }, []);

  // Stop recording session and finalize
  const stopSession = useCallback(async () => {
    if (stopPromiseRef.current) return stopPromiseRef.current;

    const activeSessionId = sessionIdRef.current;
    if (!activeSessionId) return;

    const activeUserId = sessionOwnerIdRef.current;

    stopPromiseRef.current = (async () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (sessionCreationPromiseRef.current) {
        await sessionCreationPromiseRef.current;
      }

      const duration = sessionStartTimeRef.current
        ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        : 0;

      const stoppedAt = Date.now();
      const partialWindow = windowAggregatorRef.current?.finalize({
        endedAt: stoppedAt,
        endingTotals: {
          totalBlinks: latestMetricsRef.current.totalBlinks,
          microsleepCount: microsleepsCountRef.current,
          totalAlerts: alertsCountRef.current,
        },
      });
      if (partialWindow?.sampleCount > 0) {
        timelineRef.current.push(partialWindow);
      }

      const earStats = earStatsRef.current;
      const fatigueStats = fatigueStatsRef.current;

      const avgEAR = earStats.count
        ? Number((earStats.sum / earStats.count).toFixed(3))
        : 0;
      const minEAR = earStats.count ? Number(earStats.min.toFixed(3)) : 0;
      const avgFatigue = fatigueStats.count
        ? Math.round(fatigueStats.sum / fatigueStats.count)
        : 0;
      const maxFatigue = fatigueStats.max;

      let riskLevel = 'low';
      if (microsleepsCountRef.current >= 2 || maxFatigue >= 85) {
        riskLevel = 'critical';
      } else if (microsleepsCountRef.current === 1 || maxFatigue >= 65) {
        riskLevel = 'high';
      } else if (maxFatigue >= 40) {
        riskLevel = 'moderate';
      }

      await updateSession(activeUserId, activeSessionId, {
        status: 'completed',
        endedAt: new Date().toISOString(),
        durationSeconds: duration,
        timeline: timelineRef.current,
        metrics: {
          totalAlerts: alertsCountRef.current,
          microsleepCount: microsleepsCountRef.current,
          avgEAR,
          minEAR,
          avgFatiguePercentage: avgFatigue,
          maxFatiguePercentage: maxFatigue,
          totalBlinks: latestMetricsRef.current.totalBlinks,
          avgBlinkRate: latestMetricsRef.current.blinkRate,
          riskLevel,
        },
      });

      sessionIdRef.current = null;
      sessionOwnerIdRef.current = null;
      sessionStartTimeRef.current = null;
      windowAggregatorRef.current = null;
      windowIndexRef.current = 0;
      setSessionId(null);
      setSessionDuration(duration);
      setIsRecording(false);
    })().finally(() => {
      stopPromiseRef.current = null;
    });

    return stopPromiseRef.current;
  }, []);

  useEffect(() => {
    return () => {
      void stopSession();
    };
  }, [stopSession]);

  return {
    sessionId,
    sessionDuration,
    isRecording,
    startSession,
    stopSession,
    recordFrameData,
  };
}
