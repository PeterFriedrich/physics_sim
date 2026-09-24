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
