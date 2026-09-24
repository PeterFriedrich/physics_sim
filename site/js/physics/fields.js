// A charged particle in a uniform magnetic field perpendicular to the page
// (Physics 30 Unit B). Bz > 0 points OUT of the page, +x right, +y up.
// F = q v × B, so for B out of the page a positive charge circles clockwise.

export function magneticForce(q, v, B) {
  return Math.abs(q) * v * Math.abs(B);
}

export function radius(m, v, q, B) {
  return (m * v) / (Math.abs(q) * Math.abs(B));
}

export function period(m, q, B) {
  return (2 * Math.PI * m) / (Math.abs(q) * Math.abs(B));
}

// Signed angular velocity (counter-clockwise positive).
export function omega(q, m, Bz) {
  return (-q * Bz) / m;
}

export function stateAt({ q, m, Bz, vx, vy, x0 = 0, y0 = 0 }, t) {
  const w = omega(q, m, Bz);
  if (w === 0) return { x: x0 + vx * t, y: y0 + vy * t, vx, vy };
  const c = Math.cos(w * t);
  const s = Math.sin(w * t);
  return {
    x: x0 + (vx * s + vy * (c - 1)) / w,
    y: y0 + (vx * (1 - c) + vy * s) / w,
    vx: vx * c - vy * s,
    vy: vx * s + vy * c,
  };
}

// Force vector q v × B for B along z.
export function forceVector({ q, Bz }, vx, vy) {
  return { Fx: q * vy * Bz, Fy: -q * vx * Bz };
}
