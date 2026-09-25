import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

const LOCAL_STORAGE_ALERTS_KEY = 'somnoguard_alerts_history';

/**
 * Records an alert event
 */
export async function recordAlert(userId, sessionId, alertData) {
  const alertRecord = {
    ...alertData,
    sessionId,
    userId: userId || 'anonymous',
    timestamp: new Date().toISOString(),
  };

  if (isFirebaseConfigured && db && userId && sessionId) {
    try {
      const alertsRef = collection(db, 'users', userId, 'sessions', sessionId, 'alerts');
      await addDoc(alertsRef, {
        ...alertRecord,
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (err) {
      console.warn('Error recording alert to Firestore:', err);
    }
  }

  // Local fallback
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ALERTS_KEY) || '[]');
    existing.unshift(alertRecord);
    localStorage.setItem(LOCAL_STORAGE_ALERTS_KEY, JSON.stringify(existing.slice(0, 100)));
  } catch (e) {
    console.error('Failed to log alert locally:', e);
  }

  return true;
}
