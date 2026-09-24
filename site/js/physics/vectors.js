// 2-D vector helpers shared by the Physics 30 sims. Directions are degrees
// from +x, counter-clockwise positive, in [0, 360).

export function magnitude(x, y) {
  return Math.hypot(x, y);
}

export function directionDeg(x, y) {
  const d = (Math.atan2(y, x) * 180) / Math.PI;
  return d < 0 ? d + 360 : d;
}
