/**
 * 2D Euclidean distance between two points {x, y}
 */
export function euclideanDistance(p1, p2) {
  if (!p1 || !p2) return 0;
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Calculates the Eye Aspect Ratio (EAR) given 6 landmarks:
 * p1: lateral corner, p2: top outer, p3: top inner,
 * p4: medial corner, p5: bottom inner, p6: bottom outer
 *
 * EAR = (||p2 - p6|| + ||p3 - p5||) / (2 * ||p1 - p4||)
 */
export function calculateEAR(landmarks, indices) {
  if (!landmarks || landmarks.length < 468) return 0;

  const [i1, i2, i3, i4, i5, i6] = indices;
  const p1 = landmarks[i1];
  const p2 = landmarks[i2];
  const p3 = landmarks[i3];
  const p4 = landmarks[i4];
  const p5 = landmarks[i5];
  const p6 = landmarks[i6];

  if (!p1 || !p2 || !p3 || !p4 || !p5 || !p6) return 0;

  const vertical1 = euclideanDistance(p2, p6);
  const vertical2 = euclideanDistance(p3, p5);
  const horizontal = euclideanDistance(p1, p4);

  if (horizontal <= 0.0001) return 0;

  return (vertical1 + vertical2) / (2.0 * horizontal);
}

/**
 * Clamps a number between min and max
 */
export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation between min and max
 */
export function lerp(start, end, factor) {
  return start + (end - start) * factor;
}
