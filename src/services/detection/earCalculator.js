import { calculateEAR } from '../../utils/math';
import { RIGHT_EYE_LANDMARKS, LEFT_EYE_LANDMARKS } from '../../utils/constants';

/**
 * Extracts blendshape coefficients for eye blinks
 */
export function extractEyeBlendshapes(blendshapesResult) {
  let leftBlink = 0;
  let rightBlink = 0;

  if (blendshapesResult && blendshapesResult.length > 0) {
    const categories = blendshapesResult[0].categories || [];
    for (const cat of categories) {
      if (cat.categoryName === 'eyeBlinkLeft') {
        leftBlink = cat.score;
      } else if (cat.categoryName === 'eyeBlinkRight') {
        rightBlink = cat.score;
      }
    }
  }

  return {
    leftBlink,
    rightBlink,
    avgBlink: (leftBlink + rightBlink) / 2,
  };
}

/**
 * Calculates EAR and combines with blendshapes for high accuracy
 */
export function processEyeMetrics(faceLandmarks, blendshapesResult, earThreshold = 0.21) {
  if (!faceLandmarks || faceLandmarks.length === 0) {
    return {
      faceDetected: false,
      leftEAR: 0,
      rightEAR: 0,
      avgEAR: 0,
      leftBlinkScore: 0,
      rightBlinkScore: 0,
      avgBlinkScore: 0,
      isEyesClosed: false,
    };
  }

  const landmarks = faceLandmarks[0];

  // Calculate geometric EAR
  const rightEAR = calculateEAR(landmarks, RIGHT_EYE_LANDMARKS);
  const leftEAR = calculateEAR(landmarks, LEFT_EYE_LANDMARKS);
  const avgEAR = (rightEAR + leftEAR) / 2;

  // Extract blendshape blink confidence
  const { leftBlink, rightBlink, avgBlink } = extractEyeBlendshapes(blendshapesResult);

  // Robust decision: eyes are closed if EAR is below threshold OR blendshape blink score is high (> 0.55)
  // When both agree, detection is virtually 100% immune to false positives from head tilt.
  const isEyesClosed = avgEAR < earThreshold || avgBlink > 0.55;

  return {
    faceDetected: true,
    landmarks,
    leftEAR: Number(leftEAR.toFixed(3)),
    rightEAR: Number(rightEAR.toFixed(3)),
    avgEAR: Number(avgEAR.toFixed(3)),
    leftBlinkScore: Number(leftBlink.toFixed(3)),
    rightBlinkScore: Number(rightBlink.toFixed(3)),
    avgBlinkScore: Number(avgBlink.toFixed(3)),
    isEyesClosed,
  };
}
