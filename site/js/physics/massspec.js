// Mass spectrometer (Physics 30 Unit B): a velocity selector (crossed E and
// B₁) followed by a region of B₂ alone where ions travel a half circle.
// Axes: +x along the beam, +y up. Top plate positive, so E points down; B₁
// points into the page, so for a positive ion F_e is down and F_m is up.
import { radius } from './fields.js';

// The one speed at which F_e = F_m: qE = qvB₁.
export function selectorSpeed(E, B1) {
  return E / B1;
}

// Vertical acceleration inside the selector (up positive). Zero only at v = E/B₁.
// The sign flip for negative ions is automatic: both forces reverse together.
export function selectorAccel({ q, m, v, E, B1 }) {
  return (q * (v * B1 - E)) / m;
}

export function selectorForces({ q, v, E, B1 }) {
  return { Fe: Math.abs(q) * E, Fm: Math.abs(q) * v * B1 };
}

// Distance from the entrance slit to where the ion lands: a half circle, 2r.
export function landingDistance(m, v, q, B2) {
  return 2 * radius(m, v, q, B2);
}

// Solving r = mv/(qB) for m: how a mass spectrometer measures mass.
export function massFromRadius(q, B, r, v) {
  return (Math.abs(q) * B * r) / v;
}

// Path through a selector of length L and plate gap d, entering on the axis.
// The deflection is small whenever the ion gets through, so the magnetic force
// is taken as vertical (constant acceleration). Returns where the ion ends up:
// through the exit slit (half-width slitHalf), into a plate, or into the slit wall.
export function selectorExit({ q, m, v, E, B1, L, d, slitHalf }) {
  const a = selectorAccel({ q, m, v, E, B1 });
  const tExit = L / v;
  const yExit = 0.5 * a * tExit * tExit;
  if (Math.abs(yExit) > d / 2) {
    const tHit = Math.sqrt(d / Math.abs(a));
    return { outcome: 'plate', a, t: tHit, x: v * tHit, y: (Math.sign(a) * d) / 2 };
  }
  return { outcome: Math.abs(yExit) <= slitHalf ? 'pass' : 'blocked', a, t: tExit, x: L, y: yExit };
}
