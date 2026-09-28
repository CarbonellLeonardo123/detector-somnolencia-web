import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../services/firebase/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Offline fallback: check localStorage
      const saved = JSON.parse(localStorage.getItem('somnoguard_user_profile') || 'null');
      if (saved) {
        setUser(saved);
        setProfile(saved);
      } else {
        // Auto initialize as guest
        const guest = {
          uid: 'guest_' + Math.random().toString(36).substring(2, 8),
          displayName: 'Conductor Invitado',
          isAnonymous: true,
          email: null,
          role: 'guest',
        };
        setUser(guest);
        setProfile(guest);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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
      return res;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginWithEmail(email, password);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const loginGuest = async () => {
    setLoading(true);
    try {
      const res = await loginAsGuest();
      const guest = res.user;
      setUser(guest);
      setProfile({
        uid: guest.uid,
        displayName: guest.displayName || 'Conductor Invitado',
        isAnonymous: true,
        role: 'guest',
      });
      return res;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      // Re-sign in as guest automatically
      await loginAsGuest();
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
