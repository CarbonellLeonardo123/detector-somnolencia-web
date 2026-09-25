import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase/config';

const LOCAL_STORAGE_USER_KEY = 'somnoguard_local_uid';

/**
 * Hook for anonymous authentication with automatic local fallback
 */
export function useAnonymousAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Offline / LocalStorage simulated UID
      let localUid = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      if (!localUid) {
        localUid = 'local_user_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, localUid);
      }
      setUser({ uid: localUid, isAnonymous: true });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setUser(cred.user);
        } catch (err) {
          console.warn('Anonymous sign-in failed, falling back to local UID:', err);
          let localUid = localStorage.getItem(LOCAL_STORAGE_USER_KEY) || 'local_user_default';
          setUser({ uid: localUid, isAnonymous: true });
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAnonymous: true };
}
