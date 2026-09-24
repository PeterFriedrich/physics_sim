// Projectile motion (Physics 20 Unit A). Closed-form, not integrated: the
// readouts must equal the kinematics equations students use, with no step drift.
// Coordinates: +x right, +y up, origin at ground level below the launch point.

const rad = (deg) => (deg * Math.PI) / 180;

export function launch({ v0, angleDeg, h0 = 0, g }) {
  return {
    vx: v0 * Math.cos(rad(angleDeg)),
    vy: v0 * Math.sin(rad(angleDeg)),
    h0,
    g,
  };
}

export function position(p, t) {
  return { x: p.vx * t, y: p.h0 + p.vy * t - 0.5 * p.g * t * t };
}

export function velocity(p, t) {
  return { vx: p.vx, vy: p.vy - p.g * t };
}

// Positive root of h0 + vy·t − ½gt² = 0.
export function timeOfFlight(p) {
  return (p.vy + Math.sqrt(p.vy * p.vy + 2 * p.g * p.h0)) / p.g;
}

export function range(p) {
  return p.vx * timeOfFlight(p);
}

export function timeToPeak(p) {
  return Math.max(0, p.vy / p.g);
}

export function maxHeight(p) {
  return p.vy > 0 ? p.h0 + (p.vy * p.vy) / (2 * p.g) : p.h0;
}
