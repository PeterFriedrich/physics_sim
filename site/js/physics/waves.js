// Superposition of two pulses on a string (Physics 20 Unit D). The pulses pass
// through each other unchanged; the string's displacement is their sum.

// cos² bump: smooth, and exactly zero outside its width, so "the pulses no
// longer overlap" is a crisp state rather than an exponential tail.
export function pulseShape(x, center, amplitude, width) {
  const d = x - center;
  if (Math.abs(d) >= width / 2) return 0;
  const c = Math.cos((Math.PI * d) / width);
  return amplitude * c * c;
}

// Pulse A starts at xA moving right, pulse B starts at xB moving left, both at speed v.
export function pulseCenters({ xA, xB, v }, t) {
  return { a: xA + v * t, b: xB - v * t };
}

export function displacement(x, t, s) {
  const { a, b } = pulseCenters(s, t);
  const ya = pulseShape(x, a, s.ampA, s.widthA);
  const yb = pulseShape(x, b, s.ampB, s.widthB);
  return { ya, yb, y: ya + yb };
}

// When the two peaks coincide.
export function meetingTime({ xA, xB, v }) {
  return (xB - xA) / (2 * v);
}

// Standing sound waves in an air column (Physics 20 Unit D).
//   'closed': closed at one end (x = 0), open at x = L. Resonance when
//             L = (2n − 1)λ/4 — odd quarter-wavelengths.
//   'open':   open at both ends. Resonance when L = nλ/2.
// n counts resonances from the lowest (n = 1).
export function airColumn({ type, L, n, v }) {
  const lambda = type === 'closed' ? (4 * L) / (2 * n - 1) : (2 * L) / n;
  return { lambda, f: v / lambda };
}

// Resonant length number n for wavelength λ; for a closed tube the lengths are
// λ/4, 3λ/4, 5λ/4 … — successive resonances λ/2 apart.
export function resonantLength(type, lambda, n) {
  return type === 'closed' ? ((2 * n - 1) * lambda) / 4 : (n * lambda) / 2;
}

// Air displacement amplitude along the column, −1…1: a node at a closed end,
// an antinode at an open end (end correction ignored).
export function columnEnvelope(type, lambda, x) {
  return type === 'closed' ? Math.sin((2 * Math.PI * x) / lambda) : Math.cos((2 * Math.PI * x) / lambda);
}

// Displacement nodes and antinodes along the column, x from the left end
// (the closed end, for a closed tube). Consecutive nodes are λ/2 apart.
export function nodesAndAntinodes(type, lambda, L) {
  const eps = 1e-9 * L;
  const from = (x0) => {
    const xs = [];
    for (let x = x0; x <= L + eps; x += lambda / 2) xs.push(Math.min(x, L));
    return xs;
  };
  return type === 'closed' ? { nodes: from(0), antinodes: from(lambda / 4) } : { nodes: from(lambda / 4), antinodes: from(0) };
}

// Doppler effect for a moving source and a stationary listener:
// f = f_s · v / (v ∓ v_s), minus in front of the source, plus behind it.
export function dopplerSource({ fs, v, vs }) {
  return {
    fAhead: (fs * v) / (v - vs),
    fBehind: (fs * v) / (v + vs),
    lambdaAhead: (v - vs) / fs,
    lambdaBehind: (v + vs) / fs,
    lambda0: v / fs,
  };
}

// Wavefronts from a source moving along +x at v_s = mach·v, in units where the
// emitted period is 1 and λ₀ = 1. Front k was emitted at time k from
// x = mach·k and has radius t − k. Used only to draw the picture.
export function wavefronts(mach, t) {
  const out = [];
  for (let k = 0; k <= t; k++) out.push({ x: mach * k, r: t - k });
  return out;
}
