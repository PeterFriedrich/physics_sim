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

// Simple pendulum released from rest at θmax, small-angle closed form
// θ = θmax·cos(ωt), ω = √(g/L). Accurate to better than 0.5 % in the period for
// θmax ≤ 15°, which is why the sim caps the amplitude there. Angle positive to
// the right of vertical.
export function pendulumState({ L, m, thetaMaxDeg, g }, t) {
  const th = ((thetaMaxDeg * Math.PI) / 180) * Math.cos(Math.sqrt(g / L) * t);
  return {
    thetaDeg: (th * 180) / Math.PI,
    // Along the arc, toward the lowest point.
    Frestore: -m * g * Math.sin(th),
    x: L * Math.sin(th),
    h: L * (1 - Math.cos(th)),
  };
}
