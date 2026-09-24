// Double slit and diffraction grating (Physics 30 Unit C). SI units; d is the
// slit separation, l the slit-to-screen distance, n the order of the bright fringe.

// λ = xd/(nl): the small-angle form on the data sheet.
export function wavelengthFromFringe(x, d, n, l) {
  return (x * d) / (n * l);
}

// λ = d sin θ / n: exact.
export function wavelengthFromAngle(d, thetaDeg, n) {
  return (d * Math.sin((thetaDeg * Math.PI) / 180)) / n;
}

// Bright fringe n: exact angle and screen position, plus the small-angle
// position the xd/(nl) form assumes. null when nλ > d (no such order).
export function brightFringe(lambda, d, n, l) {
  const s = (n * lambda) / d;
  if (s > 1) return null;
  const theta = Math.asin(s);
  return { thetaDeg: (theta * 180) / Math.PI, x: l * Math.tan(theta), xSmall: (n * lambda * l) / d };
}

export function maxOrder(lambda, d) {
  return Math.floor(d / lambda + 1e-9);
}

// Grating spacing from lines per millimetre.
export function spacingFromLines(linesPerMm) {
  return 1e-3 / linesPerMm;
}

// Relative intensity for drawing only: N equal slits, no single-slit envelope.
export function intensity(thetaRad, lambda, d, N) {
  const phi = (Math.PI * d * Math.sin(thetaRad)) / lambda;
  const s = Math.sin(phi);
  if (Math.abs(s) < 1e-9) return 1;
  const r = Math.sin(N * phi) / (N * s);
  return r * r;
}
