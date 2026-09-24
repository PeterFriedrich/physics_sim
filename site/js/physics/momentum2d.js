// Glancing collision of two discs (Physics 30 Unit A). Disc 2 starts at rest at
// the origin; disc 1 approaches along +x with its centre offset by b (the aim
// offset). Both have radius R. At contact the impulse acts along the line of
// centres, which is what makes the outgoing directions depend on the aim.
// e: coefficient of restitution along the line of centres (1 elastic).
// stick: the discs lock together — what Physics 30 calls perfectly inelastic.
// (e = 0 alone is NOT that: the discs would still slide apart sideways.)

export function contactGeometry(b, R) {
  if (Math.abs(b) >= 2 * R) return null; // a miss
  const x1 = -Math.sqrt(4 * R * R - b * b); // disc 1 centre at contact
  return { x1, y1: b, nx: -x1 / (2 * R), ny: -b / (2 * R) }; // n: unit, disc 1 → disc 2
}

export function collide2D({ m1, v1, m2, b, R, e, stick = false }) {
  const g = contactGeometry(b, R);
  if (!g) return { hit: false, v1f: { x: v1, y: 0 }, v2f: { x: 0, y: 0 } };
  if (stick) {
    const v = { x: (m1 * v1) / (m1 + m2), y: 0 };
    return { hit: true, stuck: true, n: { x: g.nx, y: g.ny }, v1f: v, v2f: { ...v } };
  }
  const vn = v1 * g.nx; // closing speed along the normal (disc 2 at rest)
  const J = ((1 + e) * vn) / (1 / m1 + 1 / m2);
  return {
    hit: true,
    n: { x: g.nx, y: g.ny },
    v1f: { x: v1 - (J / m1) * g.nx, y: -(J / m1) * g.ny },
    v2f: { x: (J / m2) * g.nx, y: (J / m2) * g.ny },
    J,
  };
}

// When disc 1, starting with its centre at x = x0 (< contact point), touches disc 2.
export function contactTime({ x0, v1, b, R }) {
  const g = contactGeometry(b, R);
  if (!g || v1 <= 0) return Infinity;
  return (g.x1 - x0) / v1;
}
