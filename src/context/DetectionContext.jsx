import React, { createContext, useContext, useRef, useCallback } from 'react';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceDetector } from '../hooks/useFaceDetector';
import { useAlertSystem } from '../hooks/useAlertSystem';
import { useSessionRecorder } from '../hooks/useSessionRecorder';
import { useDetectionLoop } from '../hooks/useDetectionLoop';
import { useAuth } from './AuthContext';

const DetectionContext = createContext(null);

export function DetectionProvider({ children }) {
  const { user } = useAuth();
  const canvasRef = useRef(null);

  // 1. Webcam
  const {
    videoRef,
    isStreaming,
    error: cameraError,
    hasPermission,
    startCamera,
    stopCamera,
  } = useWebcam();

  // 2. MediaPipe Model
  const { detectorRef, isModelReady, isLoadingModel, modelError } = useFaceDetector();

  // 3. Audio & Visual Alerts
  const { isAlarmPlaying, isVisualAlertActive, startAlarm, stopAlarm, initAudio } = useAlertSystem();

  // 4. Session Recorder (Persistence)
  const {
    sessionId,
    sessionDuration,
    isRecording,
    startSession,
    stopSession,
    recordFrameData,
  } = useSessionRecorder(user?.uid);

  // Handlers for detection loop events
  const handleFrameProcessed = useCallback(
    (frameResult) => {
      recordFrameData(frameResult);
    },
    [recordFrameData]
  );

  const handleAlertTriggered = useCallback(() => {
    startAlarm();
  }, [startAlarm]);

  const handleAlertCleared = useCallback(() => {
    stopAlarm();
  }, [stopAlarm]);

  // 5. Main Processing Loop
  const { uiState, chartData } = useDetectionLoop({
    videoRef,
    canvasRef,
    detectorRef,
    isStreaming,
    isModelReady,
    onFrameProcessed: handleFrameProcessed,
    onAlertTriggered: handleAlertTriggered,
    onAlertCleared: handleAlertCleared,
  });

  // Start combined monitoring (camera + session + audio unlock)
  const startMonitoring = useCallback(async () => {
    initAudio();
    await startCamera();
    await startSession();
  }, [initAudio, startCamera, startSession]);

  // Stop combined monitoring
  const stopMonitoring = useCallback(async () => {
    stopAlarm();
    stopCamera();
    await stopSession();
  }, [stopAlarm, stopCamera, stopSession]);

  const value = {
    // Camera
    videoRef,
    canvasRef,
    isStreaming,
    cameraError,
    hasPermission,
    startCamera,
    stopCamera,

    // Model
    isModelReady,
    isLoadingModel,
    modelError,

    // Detection State & Metrics
    uiState,
    chartData,

    // Alerts
    isAlarmPlaying,
    isVisualAlertActive,
    stopAlarm,

    // Session
    sessionId,
    sessionDuration,
    isRecording,
    startMonitoring,
    stopMonitoring,
  };

  return (
    <DetectionContext.Provider value={value}>
      {children}
    </DetectionContext.Provider>
  );
}

export function useDetection() {
  const context = useContext(DetectionContext);
  if (!context) {
    throw new Error('useDetection must be used within a DetectionProvider');
  }
  return context;
}
