// The photoelectric effect (Physics 30 Unit C). Energies in eV, wavelengths in nm.
import { hEv, c } from './constants.js';

export function photonEnergyEv(lambdaNm) {
  return (hEv * c) / (lambdaNm * 1e-9);
}

export function frequency(lambdaNm) {
  return c / (lambdaNm * 1e-9);
}

export function maxKineticEv(lambdaNm, workFunctionEv) {
  return Math.max(0, photonEnergyEv(lambdaNm) - workFunctionEv);
}

// Numerically equal to Ek,max in eV: e·Vstop = Ek,max.
export function stoppingVoltage(lambdaNm, workFunctionEv) {
  return maxKineticEv(lambdaNm, workFunctionEv);
}

export function thresholdFrequency(workFunctionEv) {
  return workFunctionEv / hEv;
}

export function thresholdWavelengthNm(workFunctionEv) {
  return ((hEv * c) / workFunctionEv) * 1e9;
}

// Teaching model of the photocurrent, not a device simulation: current is
// proportional to intensity; with a retarding voltage V < 0 only electrons
// with Ek > e|V| arrive, taking emitted kinetic energies as uniform on
// [0, Ek,max]. Reproduces the textbook I–V shape: saturation for V ≥ 0, zero
// at V = −Vstop, and a threshold independent of intensity.
export function photocurrent({ lambdaNm, workFunctionEv, intensity, voltage }) {
  const ek = maxKineticEv(lambdaNm, workFunctionEv);
  if (ek <= 0 || intensity <= 0) return 0;
  if (voltage >= 0) return intensity;
  return intensity * Math.max(0, 1 + voltage / ek);
}
