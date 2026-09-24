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
