// Block on an incline released from rest (Physics 20 Unit B).
// Axes: parallel to the slope (down-slope positive) and perpendicular to it.

const rad = (deg) => (deg * Math.PI) / 180;

export function inclineForces({ m, angleDeg, muS, muK, g }) {
  const Fg = m * g;
  const FgPar = Fg * Math.sin(rad(angleDeg));
  const FgPerp = Fg * Math.cos(rad(angleDeg));
  const Fn = FgPerp;
  const FsMax = muS * Fn;
  // Released from rest, the block moves only if gravity beats the static limit.
  const slides = FgPar > FsMax;
  // μk > μs is unphysical; clamp so a mis-set slider cannot make a sliding
  // block accelerate uphill.
  const Ff = slides ? Math.min(muK, muS) * Fn : FgPar;
  const Fnet = FgPar - Ff;
  return { Fg, FgPar, FgPerp, Fn, FsMax, Ff, Fnet, a: Fnet / m, slides };
}

// Smallest angle at which a block at rest starts to slide: tan θ = μs.
export function criticalAngleDeg(muS) {
  return (Math.atan(muS) * 180) / Math.PI;
}

// Distance travelled down the slope and speed, starting from rest with constant a.
export function slideFromRest(a, t) {
  return { d: 0.5 * a * t * t, v: a * t };
}

// Time to slide distance d from rest; Infinity if the block does not move.
export function timeToSlide(a, d) {
  return a > 0 ? Math.sqrt((2 * d) / a) : Infinity;
}
