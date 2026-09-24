// Newton's law of universal gravitation and circular orbits (Physics 20
// Units B and C). r is centre to centre, in metres.
// Physics 20 only, so Earth's mass is the Physics 20 sheet's 5.98 × 10²⁴ kg.
import { G, earthMassP20, earthRadius } from './constants.js';

export function gravForce(m1, m2, r) {
  return (G * m1 * m2) / (r * r);
}

// Gravitational field strength g = GM / r² (N/kg, the same as m/s²).
export function gravField(M, r) {
  return (G * M) / (r * r);
}

export function earthFieldAtAltitude(h) {
  return gravField(earthMassP20, earthRadius + h);
}

// Circular orbit of radius r around mass M: gravity provides F_c.
// T²/r³ = 4π²/(GM) is the same for every satellite of M (Kepler's third law).
export function circularOrbit(M, r) {
  const v = Math.sqrt((G * M) / r);
  const T = (2 * Math.PI * r) / v;
  return { v, T, ac: (v * v) / r, keplerK: (T * T) / (r * r * r) };
}

export function orbitRadiusForPeriod(M, T) {
  return Math.cbrt((G * M * T * T) / (4 * Math.PI * Math.PI));
}
