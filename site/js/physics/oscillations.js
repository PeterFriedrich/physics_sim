// Mass–spring simple harmonic motion (Physics 20 Unit D), released from rest
// at x = +A on a frictionless horizontal surface.

export function springPeriod(m, k) {
  return 2 * Math.PI * Math.sqrt(m / k);
}

export function pendulumPeriod(L, g) {
  return 2 * Math.PI * Math.sqrt(L / g);
}

export function springState({ m, k, A }, t) {
  const w = Math.sqrt(k / m);
  const x = A * Math.cos(w * t);
  const v = -A * w * Math.sin(w * t);
  return {
    x,
    v,
    a: -(k / m) * x,
    F: -k * x, // Hooke's law restoring force
    Ep: 0.5 * k * x * x,
    Ek: 0.5 * m * v * v,
    Et: 0.5 * k * A * A,
  };
}

export function maxSpeed({ m, k, A }) {
  return A * Math.sqrt(k / m);
}
