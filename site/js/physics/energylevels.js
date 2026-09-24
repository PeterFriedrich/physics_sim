// Atomic energy levels and line spectra (Physics 30 Unit D).
// E = hf = hc/λ with h in eV·s from the data sheet.
import { hEv, c } from './constants.js';

// Hydrogen levels in eV, n = 1…6: *given* data (no sheet prints them), in the
// form a Diploma question supplies on an energy-level diagram.
export const HYDROGEN_LEVELS = [-13.6, -3.4, -1.51, -0.85, -0.54, -0.38];

const SERIES = ['Lyman', 'Balmer', 'Paschen', 'Brackett', 'Pfund'];

// Transition between levels nUpper > nLower (1-based). Emission and absorption
// involve the same photon; only the direction differs.
export function transition(nUpper, nLower, levels = HYDROGEN_LEVELS) {
  const dE = levels[nUpper - 1] - levels[nLower - 1];
  const lambda = (hEv * c) / dE;
  return { dE, f: dE / hEv, lambda, series: SERIES[nLower - 1] ?? `n = ${nLower}` };
}

// Energy needed to remove the electron from level n.
export function ionizationEnergy(n, levels = HYDROGEN_LEVELS) {
  return -levels[n - 1];
}
