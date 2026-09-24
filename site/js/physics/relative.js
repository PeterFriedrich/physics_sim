// Boat crossing a river (Physics 20 Unit A: vectors and relative velocity).
// Axes: +x downstream (along the current), +y straight across the river.
// The heading is the direction the boat points relative to the water, in
// degrees from straight across: positive aims upstream, negative downstream.

const rad = (deg) => (deg * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

export function riverCrossing({ vb, vc, headingDeg, width }) {
  const vx = vc - vb * Math.sin(rad(headingDeg));
  const vy = vb * Math.cos(rad(headingDeg));
  // Heading ±90° leaves cos-residue ~1e-17, not zero: treat it as never crossing.
  const time = vy > 1e-9 * vb ? width / vy : Infinity;
  return {
    vx,
    vy,
    speed: Math.hypot(vx, vy),
    // Direction of the ground velocity, degrees from straight across;
    // positive = pushed downstream.
    driftAngleDeg: deg(Math.atan2(vx, vy)),
    time,
    drift: Number.isFinite(time) ? vx * time : Infinity,
  };
}

// Heading that lands straight across (sin θ = v_c / v_b), or null when the
// current is as fast as the boat and no heading can.
export function headingStraightAcross(vb, vc) {
  return vc < vb ? deg(Math.asin(vc / vb)) : null;
}
