import { CONFIG, DETECTION_STATES } from '../../utils/constants';
import { calculateBlinkRate, exponentialMovingAverage, calculateAttentionScore } from '../../utils/statistics';
import { clamp } from '../../utils/math';

export class DrowsinessEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.state = DETECTION_STATES.CALIBRATING;
    this.calibrationStartTime = null;
    this.calibrationSamples = [];
    this.baselineEAR = CONFIG.DEFAULT_BASELINE_EAR;
    this.earThreshold = CONFIG.DEFAULT_EAR_THRESHOLD;

    // Blink tracking
    this.isCurrentlyClosed = false;
    this.eyeClosedStartTime = null;
    this.blinkTimestamps = [];
    this.totalBlinks = 0;

    // Microsleep tracking
    this.microsleepTimestamps = [];
    this.totalMicrosleeps = 0;
    this.isMicrosleepActive = false;

    // Smooth fatigue probability
    this.fatigueProbability = 0;
    this.attentionScore = 100;

    // Frame counter
    this.processedFrames = 0;
  }

  /**
   * Main update function called for every frame
   */
  processFrame(eyeMetrics, currentTime = Date.now()) {
    this.processedFrames++;

    if (!eyeMetrics.faceDetected) {
      return {
        state: this.state,
        faceDetected: false,
        fatigueProbability: this.fatigueProbability,
        attentionScore: this.attentionScore,
        blinkRate: calculateBlinkRate(this.blinkTimestamps, 60000, currentTime),
        totalBlinks: this.totalBlinks,
        microsleepCount: this.totalMicrosleeps,
        isAlertActive: this.state === DETECTION_STATES.PELIGRO,
        avgEAR: eyeMetrics.avgEAR,
        earThreshold: this.earThreshold,
      };
    }

    const { avgEAR, isEyesClosed } = eyeMetrics;

    // 1. Calibration Phase (first 3 seconds)
    if (this.state === DETECTION_STATES.CALIBRATING) {
      if (!this.calibrationStartTime) {
        this.calibrationStartTime = currentTime;
      }

      this.calibrationSamples.push(avgEAR);

      if (currentTime - this.calibrationStartTime >= CONFIG.CALIBRATION_DURATION_MS) {
        // Complete calibration: discard bottom 15% (blinks) and calculate mean
        const sorted = [...this.calibrationSamples].sort((a, b) => a - b);
        const validSamples = sorted.slice(Math.floor(sorted.length * 0.15));
        const avg = validSamples.reduce((a, b) => a + b, 0) / (validSamples.length || 1);

        this.baselineEAR = Math.max(0.22, Math.min(0.40, avg));
        this.earThreshold = Number((this.baselineEAR * CONFIG.EAR_CLOSED_FACTOR).toFixed(3));
        this.state = DETECTION_STATES.NORMAL;
      }

      return {
        state: DETECTION_STATES.CALIBRATING,
        faceDetected: true,
        fatigueProbability: 0,
        attentionScore: 100,
        blinkRate: 0,
        totalBlinks: 0,
        microsleepCount: 0,
        isAlertActive: false,
        avgEAR,
        earThreshold: this.earThreshold,
        calibrationProgress: Math.min(
          100,
          Math.round(((currentTime - this.calibrationStartTime) / CONFIG.CALIBRATION_DURATION_MS) * 100)
        ),
      };
    }

    // 2. Blink & Closure Tracking
    let microsleepTriggeredThisFrame = false;

    if (isEyesClosed) {
      if (!this.isCurrentlyClosed) {
        // Eyes just closed
        this.isCurrentlyClosed = true;
        this.eyeClosedStartTime = currentTime;
      } else {
        // Eyes remain closed: check for microsleep
        const closedDuration = currentTime - this.eyeClosedStartTime;
        if (closedDuration >= CONFIG.MICROSLEEP_THRESHOLD_MS && !this.isMicrosleepActive) {
          this.isMicrosleepActive = true;
          this.totalMicrosleeps++;
          this.microsleepTimestamps.push(currentTime);
          microsleepTriggeredThisFrame = true;
        }
      }
    } else {
      if (this.isCurrentlyClosed) {
        // Eyes just opened
        const duration = currentTime - this.eyeClosedStartTime;
        if (duration >= CONFIG.BLINK_MIN_DURATION_MS && duration <= CONFIG.BLINK_MAX_DURATION_MS) {
          // Normal blink completed
          this.totalBlinks++;
          this.blinkTimestamps.push(currentTime);
        }
        this.isCurrentlyClosed = false;
        this.eyeClosedStartTime = null;
        this.isMicrosleepActive = false;
      }
    }

    // Clean old timestamps (> 5 minutes old)
    const fiveMinutesAgo = currentTime - 300000;
    this.blinkTimestamps = this.blinkTimestamps.filter((t) => t >= fiveMinutesAgo);
    this.microsleepTimestamps = this.microsleepTimestamps.filter((t) => t >= fiveMinutesAgo);

    // 3. Multi-Signal Fatigue Calculation
    const blinkRate = calculateBlinkRate(this.blinkTimestamps, 60000, currentTime);

    // Signal A: Instantaneous EAR Fatigue Score
    let earScore = 0;
    if (avgEAR < this.earThreshold) {
      const closedSeverity = (this.earThreshold - avgEAR) / this.earThreshold;
      earScore = clamp(50 + closedSeverity * 50, 0, 100);
    } else {
      const margin = (avgEAR - this.earThreshold) / (this.baselineEAR - this.earThreshold || 0.1);
      earScore = clamp((1 - margin) * 35, 0, 40);
    }

    // Signal B: Blink Rate Fatigue Score
    let blinkScore = 0;
    if (blinkRate > 0) {
      if (blinkRate < CONFIG.LOW_BLINK_RATE_THRESHOLD) {
        // Reduced blink rate is typical of highway hypnosis or deep fatigue
        blinkScore = clamp((CONFIG.LOW_BLINK_RATE_THRESHOLD - blinkRate) * 7, 0, 60);
      } else if (blinkRate > CONFIG.HIGH_BLINK_RATE_THRESHOLD) {
        // Rapid erratic blinking indicates struggling to keep eyes open
        blinkScore = clamp((blinkRate - CONFIG.HIGH_BLINK_RATE_THRESHOLD) * 5, 0, 60);
      }
    }

    // Signal C: Microsleep Score
    const recentMicrosleeps = this.microsleepTimestamps.filter((t) => t >= currentTime - 120000).length;
    let microsleepScore = 0;
    if (this.isMicrosleepActive) {
      microsleepScore = 100;
    } else if (recentMicrosleeps >= 2) {
      microsleepScore = 90;
    } else if (recentMicrosleeps === 1) {
      microsleepScore = 55;
    }

    // Weighted fusion
    const rawFatigue =
      CONFIG.WEIGHT_EAR * earScore +
      CONFIG.WEIGHT_BLINK_RATE * blinkScore +
      CONFIG.WEIGHT_MICROSLEEP * microsleepScore;

    // Smooth fatigue probability using exponential moving average
    this.fatigueProbability = Math.round(
      exponentialMovingAverage(rawFatigue, this.fatigueProbability, 0.15)
    );
    this.fatigueProbability = clamp(this.fatigueProbability, 0, 100);

    // Attention level is inverse
    this.attentionScore = calculateAttentionScore(this.fatigueProbability);

    // 4. State Machine Transition
    if (this.isMicrosleepActive || this.fatigueProbability >= 80) {
      this.state = DETECTION_STATES.PELIGRO;
    } else if (this.fatigueProbability >= 60) {
      this.state = DETECTION_STATES.ALERT;
    } else if (this.fatigueProbability >= 35) {
      this.state = DETECTION_STATES.ATTENTION;
    } else {
      this.state = DETECTION_STATES.NORMAL;
    }

    return {
      state: this.state,
      faceDetected: true,
      avgEAR,
      earThreshold: this.earThreshold,
      baselineEAR: this.baselineEAR,
      fatigueProbability: this.fatigueProbability,
      attentionScore: this.attentionScore,
      blinkRate,
      totalBlinks: this.totalBlinks,
      microsleepCount: this.totalMicrosleeps,
      isEyesClosed,
      isMicrosleepActive: this.isMicrosleepActive,
      microsleepTriggeredThisFrame,
      isAlertActive: this.state === DETECTION_STATES.PELIGRO,
    };
  }
}
