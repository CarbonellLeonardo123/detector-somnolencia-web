import { useRef, useState, useEffect, useCallback } from 'react';
import { detectFaceInVideo } from '../services/detection/faceLandmarker';
import { processEyeMetrics } from '../services/detection/earCalculator';
import { DrowsinessEngine } from '../services/detection/drowsinessEngine';
import { CONFIG, DETECTION_STATES } from '../utils/constants';

export function useDetectionLoop({
  videoRef,
  canvasRef,
  detectorRef,
  isStreaming,
  isModelReady,
  onFrameProcessed,
  onAlertTriggered,
  onAlertCleared,
}) {
  const engineRef = useRef(new DrowsinessEngine());
  const isLoopActiveRef = useRef(false);
  const isProcessingFrameRef = useRef(false);
  const animationFrameIdRef = useRef(null);
  const lastUiUpdateRef = useRef(0);

  // Throttled UI state (updated at 4Hz max)
  const [uiState, setUiState] = useState({
    state: DETECTION_STATES.IDLE,
    faceDetected: false,
    avgEAR: 0,
    earThreshold: CONFIG.DEFAULT_EAR_THRESHOLD,
    fatigueProbability: 0,
    attentionScore: 100,
    blinkRate: 0,
    totalBlinks: 0,
    microsleepCount: 0,
    calibrationProgress: 0,
  });

  // Real-time timeline for live charts (rolling last 40 points)
  const [chartData, setChartData] = useState([]);

  // Start detection
  const startDetection = useCallback(() => {
    engineRef.current.reset();
    isLoopActiveRef.current = true;
    setChartData([]);
  }, []);

  // Stop detection
  const stopDetection = useCallback(() => {
    isLoopActiveRef.current = false;
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    setUiState((prev) => ({
      ...prev,
      state: DETECTION_STATES.IDLE,
      faceDetected: false,
    }));
  }, []);

  useEffect(() => {
    if (!isStreaming || !isModelReady) {
      stopDetection();
      return;
    }

    startDetection();

    const loop = async () => {
      if (!isLoopActiveRef.current) return;

      const video = videoRef.current;
      const detector = detectorRef.current;

      if (video && detector && video.readyState >= 2 && !isProcessingFrameRef.current) {
        isProcessingFrameRef.current = true;

        try {
          const timestamp = performance.now();
          const detectionResult = detectFaceInVideo(detector, video, timestamp);

          let eyeMetrics = { faceDetected: false };
          if (detectionResult && detectionResult.faceLandmarks?.length > 0) {
            eyeMetrics = processEyeMetrics(
              detectionResult.faceLandmarks,
              detectionResult.faceBlendshapes,
              engineRef.current.earThreshold
            );
          }

          // Update mathematical engine
          const frameResult = engineRef.current.processFrame(eyeMetrics, Date.now());

          // Draw landmarks on canvas if present
          if (canvasRef?.current && video) {
            drawLandmarks(canvasRef.current, video, detectionResult);
          }

          // Handle sound/visual alerts
          if (frameResult.isAlertActive) {
            onAlertTriggered?.(frameResult);
          } else {
            onAlertCleared?.();
          }

          // Notify session recorder
          onFrameProcessed?.(frameResult);

          // Throttle React UI State updates (4 Hz = 250ms)
          const now = Date.now();
          if (now - lastUiUpdateRef.current >= CONFIG.UI_UPDATE_INTERVAL_MS) {
            lastUiUpdateRef.current = now;

            setUiState({
              state: frameResult.state,
              faceDetected: frameResult.faceDetected,
              avgEAR: frameResult.avgEAR,
              earThreshold: frameResult.earThreshold,
              fatigueProbability: frameResult.fatigueProbability,
              attentionScore: frameResult.attentionScore,
              blinkRate: frameResult.blinkRate,
              totalBlinks: frameResult.totalBlinks,
              microsleepCount: frameResult.microsleepCount,
              calibrationProgress: frameResult.calibrationProgress || 100,
            });

            // Append to chart history (keep up to 40 items)
            if (frameResult.faceDetected) {
              const timeStr = new Date(now).toLocaleTimeString('es-ES', {
                minute: '2-digit',
                second: '2-digit',
              });

              setChartData((prev) => {
                const updated = [
                  ...prev,
                  {
                    time: timeStr,
                    ear: frameResult.avgEAR,
                    threshold: frameResult.earThreshold,
                    fatigue: frameResult.fatigueProbability,
                    attention: frameResult.attentionScore,
                  },
                ];
                return updated.slice(-CONFIG.CHART_HISTORY_MAX_POINTS);
              });
            }
          }
        } catch (err) {
          console.warn('Frame processing exception:', err);
        } finally {
          isProcessingFrameRef.current = false;
        }
      }

      if (isLoopActiveRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      stopDetection();
    };
  }, [
    isStreaming,
    isModelReady,
    videoRef,
    canvasRef,
    detectorRef,
    startDetection,
    stopDetection,
    onFrameProcessed,
    onAlertTriggered,
    onAlertCleared,
  ]);

  return {
    uiState,
    chartData,
    startDetection,
    stopDetection,
  };
}

/**
 * Draws eye contour landmarks on overlay canvas
 */
function drawLandmarks(canvas, video, detectionResult) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = video.videoWidth || CONFIG.CAMERA_WIDTH;
  canvas.height = video.videoHeight || CONFIG.CAMERA_HEIGHT;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!detectionResult || !detectionResult.faceLandmarks || detectionResult.faceLandmarks.length === 0) {
    return;
  }

  const landmarks = detectionResult.faceLandmarks[0];

  // Draw eye landmarks
  const eyeIndices = [
    33, 160, 158, 133, 153, 144, // Right
    362, 385, 387, 263, 373, 380, // Left
  ];

  ctx.fillStyle = '#00e5ff';
  ctx.strokeStyle = '#00bcd4';
  ctx.lineWidth = 1.5;

  for (const idx of eyeIndices) {
    const pt = landmarks[idx];
    if (pt) {
      const x = pt.x * canvas.width;
      const y = pt.y * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}
