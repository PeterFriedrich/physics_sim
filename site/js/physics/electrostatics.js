// Point charges and uniform fields (Physics 30 Unit B). SI units: C, m, N, N/C.
// +x right, +y up. Directions are degrees from +x, counter-clockwise positive.
import { k } from './constants.js';

export { magnitude, directionDeg } from './vectors.js';

// Magnitude of the Coulomb force between two point charges.
export function coulombForce(q1, q2, r) {
  return (k * Math.abs(q1 * q2)) / (r * r);
}

// Field at (x, y) from charges [{ q, x, y }]; the vector sum of kq/r² terms.
// A point exactly on a charge is skipped for that charge (the field is undefined there).
export function fieldAt(charges, x, y) {
  let Ex = 0;
  let Ey = 0;
  for (const c of charges) {
    const dx = x - c.x;
    const dy = y - c.y;
    const r2 = dx * dx + dy * dy;
    if (r2 === 0 || c.q === 0) continue;
    const r = Math.sqrt(r2);
    const E = (k * c.q) / r2;
    Ex += (E * dx) / r;
    Ey += (E * dy) / r;
  }
  return { Ex, Ey };
}

// Net force on charges[i] from all the others: F = qE (others' field only).
export function netForceOn(charges, i) {
  const c = charges[i];
  const others = charges.filter((_, j) => j !== i);
  const { Ex, Ey } = fieldAt(others, c.x, c.y);
  return { Fx: c.q * Ex, Fy: c.q * Ey };
}

// --- parallel plates -------------------------------------------------------

// Uniform field between plates: E = ΔV / d.
export function plateField(dV, d) {
  return dV / d;
}

// A charge entering midway between horizontal plates, moving +x at v0.
// Ey is the signed field (+ points up). Gravity neglected.
// Returns the motion inside the plates, or where it strikes a plate. dEk is the
// work done by the field, qE·Δy (= qΔV across the part of the gap crossed).
export function platesTrajectory({ q, m, v0, Ey, d, L }) {
  const ay = (q * Ey) / m;
  const tExit = L / v0;
  const yExit = 0.5 * ay * tExit * tExit;
  const half = d / 2;
  const hits = Math.abs(yExit) > half;
  const t = hits ? Math.sqrt((2 * half) / Math.abs(ay)) : tExit;
  const y = hits ? Math.sign(ay) * half : yExit;
  return { ay, hits, t, x: v0 * t, y, vx: v0, vy: ay * t, dEk: q * Ey * y };
}

export function platesPosition({ ay, vx }, t) {
  return { x: vx * t, y: 0.5 * ay * t * t };
}
