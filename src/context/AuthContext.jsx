import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../services/firebase/config';
import {
  registerWithEmail,
  loginWithEmail,
  loginAsGuest,
  logoutUser,
  resendVerificationEmail,
  resetPassword,
  getUserProfile,
  ensureUserInFirestore,
} from '../services/firebase/authService';
import { AuthContext } from './authContextValue';

function createGuestProfile() {
  return {
    uid: 'guest_' + Math.random().toString(36).substring(2, 8),
    displayName: 'Conductor Invitado',
    isAnonymous: true,
    email: null,
    role: 'guest',
  };
}

function getInitialAuthState() {
  if (isFirebaseConfigured && auth) {
    return { user: null, profile: null, loading: true };
  }

  try {
    const saved = JSON.parse(localStorage.getItem('somnoguard_user_profile') || 'null');
    const initialUser = saved || createGuestProfile();
    return { user: initialUser, profile: initialUser, loading: false };
  } catch {
    const guest = createGuestProfile();
    return { user: guest, profile: guest, loading: false };
  }
}

export function AuthProvider({ children }) {
  const [initialAuthState] = useState(getInitialAuthState);
  const [user, setUser] = useState(initialAuthState.user);
  const [profile, setProfile] = useState(initialAuthState.profile);
  const [loading, setLoading] = useState(initialAuthState.loading);

  const setActiveUser = (nextUser) => {
    setUser(nextUser);
    setProfile(nextUser ? {
      uid: nextUser.uid,
      displayName: nextUser.displayName || (nextUser.isAnonymous ? 'Conductor Invitado' : 'Conductor'),
      email: nextUser.email || null,
      isAnonymous: Boolean(nextUser.isAnonymous),
      role: nextUser.role || (nextUser.isAnonymous ? 'guest' : 'driver'),
    } : null);
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (!currentUser.isAnonymous) {
          await ensureUserInFirestore(currentUser);
        }
        // Load additional firestore profile
        const userProf = await getUserProfile(currentUser.uid);
        setProfile(userProf || {
          uid: currentUser.uid,
          displayName: currentUser.displayName || (currentUser.isAnonymous ? 'Conductor Invitado' : 'Conductor'),
          email: currentUser.email,
          role: 'driver',
        });
      } else {
        // Automatically sign in anonymously so the app is always ready to monitor
        try {
          const cred = await loginAsGuest();
          setUser(cred.user);
          setProfile({
            uid: cred.user.uid,
            displayName: 'Conductor Invitado',
            isAnonymous: true,
            role: 'guest',
          });
        } catch (e) {
          console.warn('Anonymous sign in error:', e);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const register = async (email, password, displayName) => {
    setLoading(true);
    try {
      const res = await registerWithEmail(email, password, displayName);
      setActiveUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginWithEmail(email, password);
      setActiveUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const loginGuest = async () => {
    setLoading(true);
    try {
      const res = await loginAsGuest();
      setActiveUser(res.user);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      if (!isFirebaseConfigured || !auth) {
        const res = await loginAsGuest();
        setActiveUser(res.user);
      } else {
        // Firebase's auth-state listener will establish the anonymous session.
        setActiveUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (user && !user.isAnonymous) {
      return resendVerificationEmail(user);
    }
    return false;
  };

  const value = {
    user,
    profile,
    loading,
    isAuthenticated: Boolean(user && !user.isAnonymous),
    isAnonymous: Boolean(!user || user.isAnonymous),
    emailVerified: Boolean(user && user.emailVerified),
    register,
    login,
    loginGuest,
    logout,
    resendVerification,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { useAuth } from './authContextValue';
