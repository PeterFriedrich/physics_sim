// Charges accelerated through a potential difference (Physics 30 Unit B).
// Uniform field between parallel plates only: ΔV = ΔE/q and |E| = ΔV/Δd.
// The particle starts from rest; non-relativistic; gravity neglected.

// Kinetic energy gained crossing ΔV: ΔE = |q|ΔV (J).
export function energyGained(q, dV) {
  return Math.abs(q) * Math.abs(dV);
}

// From rest: |q|ΔV = ½mv².
export function speedFromRest(q, m, dV) {
  return Math.sqrt((2 * energyGained(q, dV)) / m);
}

// Potential at distance y from the negative plate (V = 0 there), gap d.
export function potentialAt(y, d, dV) {
  return (dV * y) / d;
}

// Speed after covering distance s of the gap, from rest (energy method).
export function speedAfter(q, m, dV, d, s) {
  return speedFromRest(q, m, (dV * s) / d);
}

// Time to cross the gap from rest under constant acceleration a = |q|E/m.
export function crossingTime(q, m, dV, d) {
  const a = (Math.abs(q) * Math.abs(dV)) / (d * m);
  return Math.sqrt((2 * d) / a);
}

// Distance covered after time t from rest (for drawing the motion).
export function distanceAt(q, m, dV, d, t) {
  const a = (Math.abs(q) * Math.abs(dV)) / (d * m);
  return Math.min(d, 0.5 * a * t * t);
}
