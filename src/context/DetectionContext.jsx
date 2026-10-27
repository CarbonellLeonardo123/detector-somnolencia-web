import React, { useRef, useCallback } from 'react';
import { useWebcam } from '../hooks/useWebcam';
import { useFaceDetector } from '../hooks/useFaceDetector';
import { useAlertSystem } from '../hooks/useAlertSystem';
import { useSessionRecorder } from '../hooks/useSessionRecorder';
import { useDetectionLoop } from '../hooks/useDetectionLoop';
import { useAuth } from './authContextValue';
import { DetectionContext } from './detectionContextValue';

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
  const {
    isAlarmPlaying,
    isVisualAlertActive,
    startAlarm,
    acknowledgeAlarm,
    clearAlarm,
    initAudio,
  } = useAlertSystem();

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
    clearAlarm();
  }, [clearAlarm]);

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
    const cameraStarted = await startCamera();
    if (!cameraStarted) return false;
    await startSession();
    return true;
  }, [initAudio, startCamera, startSession]);

  // Stop combined monitoring
  const stopMonitoring = useCallback(async () => {
    clearAlarm();
    stopCamera();
    await stopSession();
  }, [clearAlarm, stopCamera, stopSession]);

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
    acknowledgeAlarm,

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
