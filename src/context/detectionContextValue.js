import { createContext, useContext } from 'react';

export const DetectionContext = createContext(null);

export function useDetection() {
  const context = useContext(DetectionContext);
  if (!context) {
    throw new Error('useDetection must be used within a DetectionProvider');
  }
  return context;
}
