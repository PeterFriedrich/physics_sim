// Uniformly accelerated motion along a line (Physics 20 Unit A), for the motion
// graphs. +x right. Closed form, so the slope of the x–t graph is exactly v and
// the area under the v–t graph is exactly Δx.

export function uniformMotion({ x0, v0, a }, t) {
  return { x: x0 + v0 * t + 0.5 * a * t * t, v: v0 + a * t, a };
}

// Area under the v–t graph from 0 to t: a trapezoid, exact for constant a.
export function areaUnderVt({ v0, a }, t) {
  return 0.5 * (v0 + (v0 + a * t)) * t;
}

// When the velocity passes through zero (the object turns around), or null.
export function turnaroundTime({ v0, a }) {
  if (a === 0) return null;
  const t = -v0 / a;
  return t > 0 ? t : null;
}

// Path length, which exceeds |Δx| once the object has turned around.
export function distanceTravelled(p, t) {
  const tr = turnaroundTime(p);
  const x = (s) => uniformMotion({ ...p, x0: 0 }, s).x;
  if (tr === null || tr >= t) return Math.abs(x(t));
  return Math.abs(x(tr)) + Math.abs(x(t) - x(tr));
}
