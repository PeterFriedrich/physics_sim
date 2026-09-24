// Refraction at a flat boundary (Physics 30 Unit C). Angles are measured from
// the normal, in degrees.
import { c } from './constants.js';

const rad = (deg) => (deg * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

// n1 sin θ1 = n2 sin θ2. Returns null when there is no refracted ray (total
// internal reflection).
export function refractionAngle(n1, n2, theta1Deg) {
  const s = (n1 / n2) * Math.sin(rad(theta1Deg));
  return Math.abs(s) > 1 ? null : deg(Math.asin(s));
}

// null when light travels into a denser (or equal) medium: no critical angle.
export function criticalAngle(n1, n2) {
  return n1 > n2 ? deg(Math.asin(n2 / n1)) : null;
}

export const speedInMedium = (n) => c / n;

export function wavelengthInMedium(lambdaVacuum, n) {
  return lambdaVacuum / n;
}
