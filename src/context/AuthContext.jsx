import React, { createContext, useContext } from 'react';
import { useAnonymousAuth } from '../hooks/useAnonymousAuth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const authState = useAnonymousAuth();

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
