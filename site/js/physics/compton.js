// Compton scattering (Physics 30 Unit C): a photon scatters off a free
// electron at rest. The photon comes in along +x; θ is the photon's scattering
// angle measured up from +x (+y up), so the electron recoils below the axis.
// Only data-sheet relations: p = h/λ, E = pc, Δλ = (h/mc)(1 − cos θ).
import { h, hEv, c, me } from './constants.js';

// h/(mₑc), the electron's Compton wavelength: 2.43 × 10⁻¹² m with sheet values.
export const comptonWavelength = h / (me * c);

export function comptonShift(thetaDeg) {
  return comptonWavelength * (1 - Math.cos((thetaDeg * Math.PI) / 180));
}

export function photonMomentum(lambda) {
  return h / lambda;
}

export function scatter(lambda, thetaDeg) {
  const t = (thetaDeg * Math.PI) / 180;
  const dLambda = comptonShift(thetaDeg);
  const lambdaOut = lambda + dLambda;
  const pIn = photonMomentum(lambda);
  const pOut = photonMomentum(lambdaOut);
  // Momentum conservation: p⃗_e = p⃗ − p⃗′.
  const pe = { x: pIn - pOut * Math.cos(t), y: -pOut * Math.sin(t) };
  const EIn = pIn * c;
  const EOut = pOut * c;
  return {
    dLambda,
    lambdaOut,
    pIn,
    pOut,
    pOutVec: { x: pOut * Math.cos(t), y: pOut * Math.sin(t) },
    EIn,
    EOut,
    EInEv: (hEv * c) / lambda,
    EOutEv: (hEv * c) / lambdaOut,
    // Energy conservation: the photon's lost energy is the electron's Eₖ.
    Ek: EIn - EOut,
    pe,
    peMag: Math.hypot(pe.x, pe.y),
    // Recoil angle below +x; 0 when there is no scattering.
    phiDeg: pe.x === 0 && pe.y === 0 ? 0 : (Math.atan2(-pe.y, pe.x) * 180) / Math.PI,
  };
}
