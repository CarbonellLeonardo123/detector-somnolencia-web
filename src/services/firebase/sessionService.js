import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

const LOCAL_STORAGE_SESSIONS_KEY = 'somnoguard_sessions_history';

/**
 * Creates or initializes a new session
 */
export async function createSession(userId, sessionData) {
  const sessionId = sessionData.sessionId || `session_${Date.now()}`;
  const preparedData = {
    ...sessionData,
    sessionId,
    userId: userId || 'anonymous',
    status: 'active',
    createdAt: new Date().toISOString(),
    startedAt: new Date().toISOString(),
    timeline: [],
    metrics: {
      totalAlerts: 0,
      microsleepCount: 0,
      avgEAR: 0,
      minEAR: 0,
      avgFatiguePercentage: 0,
      maxFatiguePercentage: 0,
      totalBlinks: 0,
      avgBlinkRate: 0,
      riskLevel: 'low',
      ...sessionData.metrics,
    },
  };

  if (isFirebaseConfigured && db && userId) {
    try {
      const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
      await setDoc(sessionRef, {
        ...preparedData,
        startedAt: serverTimestamp(),
      });
      return sessionId;
    } catch (err) {
      console.warn('Error saving session to Firestore, saving locally:', err);
    }
  }

  // Local fallback
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY) || '[]');
    existing.unshift(preparedData);
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(existing.slice(0, 50)));
  } catch (e) {
    console.error('Failed to save session locally:', e);
  }

  return sessionId;
}

/**
 * Updates an ongoing or completed session
 */
export async function updateSession(userId, sessionId, updateData) {
  if (isFirebaseConfigured && db && userId) {
    try {
      const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.warn('Error updating session in Firestore, updating locally:', err);
    }
  }

  // Local fallback
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY) || '[]');
    const index = existing.findIndex((s) => s.sessionId === sessionId);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updateData, updatedAt: new Date().toISOString() };
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(existing));
    }
  } catch (e) {
    console.error('Failed to update session locally:', e);
  }

  return true;
}

/**
 * Retrieves past sessions for a user
 */
export async function getUserSessions(userId, maxSessions = 30) {
  if (isFirebaseConfigured && db && userId) {
    try {
      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const q = query(sessionsRef, orderBy('startedAt', 'desc'), limit(maxSessions));
      const snapshot = await getDocs(q);
      const sessions = [];
      snapshot.forEach((docSnap) => {
        sessions.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (sessions.length > 0) return sessions;
    } catch (err) {
      console.warn('Error fetching Firestore sessions, reading local:', err);
    }
  }

  // Local fallback
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY) || '[]');
    return existing;
  } catch {
    return [];
  }
}
