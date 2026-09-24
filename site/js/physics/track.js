// A ball on a roller-coaster track (Physics 20 Unit C: work and energy).
// Released from rest at height h0; heights are measured from the lowest point
// of the track, so E_p = 0 there. Friction is a constant force F_f opposing the
// motion, so the work it does is F_f × distance travelled along the track.
//
// Energy is closed form: E_k = mgh0 − mgh − F_f·d, for any height h and
// distance d. The track is geometry (x → height). Only the ball's position
// along it is stepped in time, because a curved track has no closed-form x(t);
// the readouts come from energyAt(), never from the step.

// Key points (x, height) in metres; the track eases between them with zero
// slope at each one, so every key point is a crest or a dip.
export const TRACK = [
  [0, 20],
  [12, 0],
  [24, 14],
  [34, 3],
  [46, 24],
];

function segment(x) {
  for (let i = 0; i < TRACK.length - 2; i++) if (x <= TRACK[i + 1][0]) return i;
  return TRACK.length - 2;
}

export function trackHeight(x) {
  const i = segment(x);
  const [x0, y0] = TRACK[i];
  const [x1, y1] = TRACK[i + 1];
  const u = (x - x0) / (x1 - x0);
  return y1 + ((y0 - y1) * (1 + Math.cos(Math.PI * u))) / 2;
}

export function trackSlope(x) {
  const i = segment(x);
  const [x0, y0] = TRACK[i];
  const [x1, y1] = TRACK[i + 1];
  const u = (x - x0) / (x1 - x0);
  return (-(y0 - y1) * Math.PI * Math.sin(Math.PI * u)) / (2 * (x1 - x0));
}

// Where on the first drop the track is at height h (0 < h < first crest).
export function startX(h) {
  const [[x0, y0], [x1, y1]] = TRACK;
  const u = Math.acos((2 * (h - y1)) / (y0 - y1) - 1) / Math.PI;
  return x0 + u * (x1 - x0);
}

// Length along the track between two x positions (Simpson's rule on the
// geometry; no motion involved).
export function pathLength(xa, xb) {
  const n = 400;
  const hx = (xb - xa) / n;
  const f = (x) => Math.sqrt(1 + trackSlope(x) ** 2);
  let s = f(xa) + f(xb);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(xa + i * hx);
  return Math.abs((s * hx) / 3);
}

export function energyAt({ m, h0, Ff, g }, h, d) {
  const Et = m * g * h0;
  const Ep = m * g * h;
  const Wf = Ff * d;
  const Ek = Math.max(0, Et - Ep - Wf);
  return { Et, Ep, Ek, Wf, v: Math.sqrt((2 * Ek) / m) };
}

// Advance the ball by dt: state = { x, dir (±1), d (distance so far), stopped }.
// A step that would need negative E_k is refused and the ball turns round
// instead, or stops if friction can hold it where it is.
export function advance(p, state, dt) {
  if (state.stopped) return state;
  let { x, dir, d } = state;
  // Unclamped E_k after moving ds from x along the current direction:
  // negative means the ball can't get that far.
  const ekAfter = (ds) => {
    const slope = trackSlope(x);
    return p.m * p.g * (p.h0 - trackHeight(x + (dir * ds) / Math.sqrt(1 + slope * slope))) - p.Ff * (d + ds);
  };
  const move = (ds) => {
    const slope = trackSlope(x);
    x += (dir * ds) / Math.sqrt(1 + slope * slope);
    d += ds;
  };
  const sub = 20;
  for (let i = 0; i < sub; i++) {
    const { v } = energyAt(p, trackHeight(x), d);
    const ds = Math.max(v, 0.05) * (dt / sub);
    if (ekAfter(ds) >= 0) {
      move(ds);
      continue;
    }
    // Turning point inside this step: bisect for where E_k reaches zero, so
    // the ball turns (or stops) with no kinetic energy left over.
    let lo = 0;
    let hi = ds;
    for (let k = 0; k < 40; k++) {
      const mid = (lo + hi) / 2;
      if (ekAfter(mid) >= 0) lo = mid;
      else hi = mid;
    }
    move(lo);
    // Gravity's pull along the slope against friction's grip.
    const slope = trackSlope(x);
    const sinPhi = Math.abs(slope) / Math.sqrt(1 + slope * slope);
    if (p.m * p.g * sinPhi <= p.Ff || Math.abs(slope) < 1e-6) return { x, dir, d, stopped: true };
    dir = slope > 0 ? -1 : 1;
  }
  return { x, dir, d, stopped: false };
}
