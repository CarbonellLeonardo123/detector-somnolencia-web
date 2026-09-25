import { useRef, useState, useCallback, useEffect } from 'react';
import { createSession, updateSession } from '../services/firebase/sessionService';
import { recordAlert } from '../services/firebase/alertService';
import { CONFIG } from '../utils/constants';

export function useSessionRecorder(userId) {
  const [sessionId, setSessionId] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const sessionStartTimeRef = useRef(null);
  const lastBucketSaveTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const timelineRef = useRef([]);

  // Running aggregations
  const earSamplesRef = useRef([]);
  const fatigueSamplesRef = useRef([]);
  const alertsCountRef = useRef(0);
  const microsleepsCountRef = useRef(0);

  // Start new recording session
  const startSession = useCallback(async () => {
    const newSessionId = `sess_${Date.now()}`;
    const now = Date.now();
    sessionStartTimeRef.current = now;
    lastBucketSaveTimeRef.current = now;
    timelineRef.current = [];
    earSamplesRef.current = [];
    fatigueSamplesRef.current = [];
    alertsCountRef.current = 0;
    microsleepsCountRef.current = 0;

    setSessionId(newSessionId);
    setSessionDuration(0);
    setIsRecording(true);

    await createSession(userId, {
      sessionId: newSessionId,
      startedAt: new Date(now).toISOString(),
    });

    // Duration timer interval (1 second)
    timerIntervalRef.current = setInterval(() => {
      if (sessionStartTimeRef.current) {
        setSessionDuration(Math.floor((Date.now() - sessionStartTimeRef.current) / 1000));
      }
    }, 1000);
  }, [userId]);

  // Feed frame data into the recorder
  const recordFrameData = useCallback((metrics) => {
    if (!sessionStartTimeRef.current) return;

    if (metrics.faceDetected) {
      earSamplesRef.current.push(metrics.avgEAR);
      fatigueSamplesRef.current.push(metrics.fatigueProbability);
    }

    if (metrics.microsleepTriggeredThisFrame) {
      microsleepsCountRef.current++;
      alertsCountRef.current++;
      recordAlert(userId, sessionId, {
        type: 'MICROSLEEP',
        earValue: metrics.avgEAR,
        fatiguePercentage: metrics.fatigueProbability,
        durationMs: CONFIG.MICROSLEEP_THRESHOLD_MS,
      });
    }

    // Check if 30 seconds have passed to append a timeline bucket
    const now = Date.now();
    if (now - lastBucketSaveTimeRef.current >= CONFIG.FIRESTORE_BUCKET_INTERVAL_MS) {
      const bucket = {
        timestamp: Math.floor(now / 1000),
        avgEAR: metrics.avgEAR,
        fatiguePct: metrics.fatigueProbability,
        blinkRate: metrics.blinkRate,
        attentionScore: metrics.attentionScore,
        state: metrics.state,
      };

      timelineRef.current.push(bucket);
      lastBucketSaveTimeRef.current = now;

      // Checkpoint write to Firestore / LocalStorage
      updateSession(userId, sessionId, {
        timeline: timelineRef.current,
        'metrics.totalAlerts': alertsCountRef.current,
        'metrics.microsleepCount': microsleepsCountRef.current,
        'metrics.totalBlinks': metrics.totalBlinks,
      });
    }
  }, [userId, sessionId]);

  // Stop recording session and finalize
  const stopSession = useCallback(async () => {
    if (!sessionId) return;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const duration = sessionStartTimeRef.current
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0;

    const ears = earSamplesRef.current;
    const fatigues = fatigueSamplesRef.current;

    const avgEAR = ears.length ? Number((ears.reduce((a, b) => a + b, 0) / ears.length).toFixed(3)) : 0;
    const minEAR = ears.length ? Number(Math.min(...ears).toFixed(3)) : 0;
    const avgFatigue = fatigues.length ? Math.round(fatigues.reduce((a, b) => a + b, 0) / fatigues.length) : 0;
    const maxFatigue = fatigues.length ? Math.max(...fatigues) : 0;

    let riskLevel = 'low';
    if (microsleepsCountRef.current >= 2 || maxFatigue >= 85) {
      riskLevel = 'critical';
    } else if (microsleepsCountRef.current === 1 || maxFatigue >= 65) {
      riskLevel = 'high';
    } else if (maxFatigue >= 40) {
      riskLevel = 'moderate';
    }

    await updateSession(userId, sessionId, {
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
        riskLevel,
      },
    });

    setIsRecording(false);
  }, [sessionId, userId]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  return {
    sessionId,
    sessionDuration,
    isRecording,
    startSession,
    stopSession,
    recordFrameData,
  };
}
