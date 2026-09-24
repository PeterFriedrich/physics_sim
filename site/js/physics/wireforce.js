// Force on a current-carrying wire in a uniform magnetic field (Physics 30
// Unit B): |F_m| = I l⊥ |B|. Geometry: B lies in the page along +x (or −x);
// the wire lies in the page at angle θ to +x, carrying conventional current.
// F = I L × B, so the force points into or out of the page (±z, out positive).

export function perpendicularLength(L, thetaDeg) {
  return Math.abs(L * Math.sin((thetaDeg * Math.PI) / 180));
}

export function wireForce(I, L, B, thetaDeg) {
  return Math.abs(I) * perpendicularLength(L, thetaDeg) * Math.abs(B);
}

// Signed z-component of I L × B with L = L(cos θ, sin θ, 0), B = Bx x̂.
// currentSign / fieldSign are ±1 for the two direction switches.
export function forceZ({ I, L, B, thetaDeg, currentSign = 1, fieldSign = 1 }) {
  const Ly = currentSign * L * Math.sin((thetaDeg * Math.PI) / 180);
  return -Math.abs(I) * Ly * fieldSign * Math.abs(B);
}
