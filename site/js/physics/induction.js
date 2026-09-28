// Electromagnetic induction, qualitative (Physics 30 Unit B). emf = BLv is not
// on the data sheet, so nothing here returns an emf in volts: only Lenz's-law
// directions and a relative needle size.
//
// Picture: the coil's axis runs left to right; the bar magnet sits on the
// axis to the LEFT with `facing` ('N' or 'S') toward the coil. `velocity` > 0
// moves the magnet toward the coil (flux rising), < 0 away, 0 at rest.
// "Seen from the magnet" means looking along the axis from the left.

export function lenz(facing, velocity) {
  if (velocity === 0) {
    return { flux: 'unchanged', nearPole: null, seenFromMagnet: null, frontCurrent: 0, onMagnet: 'none' };
  }
  const approaching = velocity > 0;
  const other = facing === 'N' ? 'S' : 'N';
  // The coil opposes the change: like pole to repel an approaching magnet,
  // unlike pole to hold back a retreating one.
  const nearPole = approaching ? facing : other;
  // A near-end N means the coil's own field points back out at the magnet:
  // counterclockwise seen from there (right-hand grip rule), which puts the
  // current going UP the front of the coil in the side view.
  const ccw = nearPole === 'N';
  return {
    flux: approaching ? 'increasing' : 'decreasing',
    nearPole,
    seenFromMagnet: ccw ? 'counterclockwise' : 'clockwise',
    frontCurrent: ccw ? 1 : -1,
    onMagnet: approaching ? 'repels' : 'attracts',
  };
}

// Flux through a loop from a point dipole on its axis, s loop radii away,
// relative to s = 0.
export function relativeFlux(s) {
  return Math.pow(1 + s * s, -1.5);
}

// |dΦ/dt| in the same relative units: the needle's size, never a readout.
export function relativeFluxRate(s, dsdt) {
  return Math.abs(3 * s * Math.pow(1 + s * s, -2.5) * dsdt);
}
