/**
 * Landmarks indices for MediaPipe FaceMesh / FaceLandmarker
 * Canonical 6-point formulation (Soukupová & Čech):
 * P1: Outer corner, P2: Upper outer, P3: Upper inner,
 * P4: Inner corner, P5: Lower inner, P6: Lower outer
 */
export const RIGHT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144];
export const LEFT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380];

/**
 * Facial contour landmarks for visualization (eyes + face oval)
 */
export const RIGHT_EYE_CONTOUR = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
export const LEFT_EYE_CONTOUR = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];

/**
 * Detection States
 */
export const DETECTION_STATES = {
  IDLE: 'INACTIVO',
  CALIBRATING: 'CALIBRANDO',
  NORMAL: 'NORMAL',
  ATTENTION: 'ATENCIÓN',
  ALERT: 'ALERTA',
  DANGER: 'PELIGRO',
};

export const STATE_COLORS = {
  [DETECTION_STATES.IDLE]: '#94a3b8',
  [DETECTION_STATES.CALIBRATING]: '#0288d1',
  [DETECTION_STATES.NORMAL]: '#2e7d32',
  [DETECTION_STATES.ATTENTION]: '#ed6c02',
  [DETECTION_STATES.ALERT]: '#e65100',
  [DETECTION_STATES.DANGER]: '#d32f2f',
};

/**
 * Algorithm Thresholds and Timing (in milliseconds)
 */
export const CONFIG = {
  // Video constraints
  CAMERA_WIDTH: 640,
  CAMERA_HEIGHT: 480,

  // Calibration
  CALIBRATION_DURATION_MS: 3000,
  DEFAULT_BASELINE_EAR: 0.30,

  // EAR parameters
  EAR_CLOSED_FACTOR: 0.72, // Threshold is 72% of user's open-eye baseline
  DEFAULT_EAR_THRESHOLD: 0.21,

  // Microsleep detection
  MICROSLEEP_THRESHOLD_MS: 1500, // > 1.5 seconds eyes closed

  // Blink detection
  BLINK_MIN_DURATION_MS: 80,
  BLINK_MAX_DURATION_MS: 400,

  // Normal blink rate is 12-20 blinks/min
  LOW_BLINK_RATE_THRESHOLD: 10,
  HIGH_BLINK_RATE_THRESHOLD: 26,

  // UI Throttle & Firestore persistence
  UI_UPDATE_INTERVAL_MS: 250, // 4Hz UI refresh
  CHART_HISTORY_MAX_POINTS: 50,
  FIRESTORE_BUCKET_INTERVAL_MS: 30000, // 30 seconds

  // Multi-signal weights for fatigue probability (%)
  WEIGHT_EAR: 0.45,
  WEIGHT_BLINK_RATE: 0.25,
  WEIGHT_MICROSLEEP: 0.30,
};
