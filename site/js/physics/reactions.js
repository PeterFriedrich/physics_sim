// Nuclear decay equations and mass defect (Physics 30 Unit D).
// ΔE = Δmc² with the data sheet's u and c. Atomic masses are *given* data
// (textbook atomic masses, including electrons), as a Diploma question supplies them.
import { u, c, me, eV } from './constants.js';

export const NUCLIDES = {
  'U-238': { symbol: 'U', Z: 92, A: 238, mass: 238.050788 },
  'Th-234': { symbol: 'Th', Z: 90, A: 234, mass: 234.043601 },
  'Ra-226': { symbol: 'Ra', Z: 88, A: 226, mass: 226.02541 },
  'Rn-222': { symbol: 'Rn', Z: 86, A: 222, mass: 222.017578 },
  'Po-210': { symbol: 'Po', Z: 84, A: 210, mass: 209.982874 },
  'Pb-206': { symbol: 'Pb', Z: 82, A: 206, mass: 205.974465 },
  'He-4': { symbol: 'He', Z: 2, A: 4, mass: 4.002603 },
  'C-14': { symbol: 'C', Z: 6, A: 14, mass: 14.003242 },
  'N-14': { symbol: 'N', Z: 7, A: 14, mass: 14.003074 },
  'Co-60': { symbol: 'Co', Z: 27, A: 60, mass: 59.933817 },
  'Ni-60': { symbol: 'Ni', Z: 28, A: 60, mass: 59.930786 },
  'Na-22': { symbol: 'Na', Z: 11, A: 22, mass: 21.994437 },
  'Ne-22': { symbol: 'Ne', Z: 10, A: 22, mass: 21.991385 },
  'Tc-99m': { symbol: 'Tc', Z: 43, A: 99, mass: null },
  'Tc-99': { symbol: 'Tc', Z: 43, A: 99, mass: null },
};

// Each preset: parent, mode, daughter; γ gives its photon energy (MeV) instead of masses.
export const DECAYS = [
  { parent: 'U-238', mode: 'alpha', daughter: 'Th-234' },
  { parent: 'Ra-226', mode: 'alpha', daughter: 'Rn-222' },
  { parent: 'Po-210', mode: 'alpha', daughter: 'Pb-206' },
  { parent: 'C-14', mode: 'beta-', daughter: 'N-14' },
  { parent: 'Co-60', mode: 'beta-', daughter: 'Ni-60' },
  { parent: 'Na-22', mode: 'beta+', daughter: 'Ne-22' },
  { parent: 'Tc-99m', mode: 'gamma', daughter: 'Tc-99', gammaMeV: 0.1405 },
];

export const electronMassU = me / u;

// The emitted particles, each with its charge (in e) and nucleon number.
const EMITTED = {
  alpha: [{ label: 'α (⁴₂He)', Z: 2, A: 4 }],
  'beta-': [{ label: 'β⁻ (e⁻)', Z: -1, A: 0 }, { label: 'ν̄ (antineutrino)', Z: 0, A: 0 }],
  'beta+': [{ label: 'β⁺ (e⁺)', Z: 1, A: 0 }, { label: 'ν (neutrino)', Z: 0, A: 0 }],
  gamma: [{ label: 'γ (photon)', Z: 0, A: 0 }],
};

export function emitted(mode) {
  return EMITTED[mode];
}

// Charge and nucleon totals on each side: both must balance.
export function balance(decay) {
  const p = NUCLIDES[decay.parent];
  const d = NUCLIDES[decay.daughter];
  const out = emitted(decay.mode);
  return {
    left: { Z: p.Z, A: p.A },
    right: { Z: d.Z + out.reduce((s, x) => s + x.Z, 0), A: d.A + out.reduce((s, x) => s + x.A, 0) },
  };
}

// Mass defect in u, from atomic masses: electrons cancel for α and β⁻;
// β⁺ loses two electron masses (the positron and the extra atomic electron).
export function massDefectU(decay) {
  if (decay.mode === 'gamma') return (decay.gammaMeV * 1e6 * eV) / (c * c) / u;
  const P = NUCLIDES[decay.parent].mass;
  const D = NUCLIDES[decay.daughter].mass;
  if (decay.mode === 'alpha') return P - D - NUCLIDES['He-4'].mass;
  if (decay.mode === 'beta-') return P - D;
  if (decay.mode === 'beta+') return P - D - 2 * electronMassU;
  throw new Error(`unknown decay mode ${decay.mode}`);
}

// ΔE = Δmc² in J and MeV.
export function energyReleased(decay) {
  if (decay.mode === 'gamma') {
    const J = decay.gammaMeV * 1e6 * eV;
    return { dmU: massDefectU(decay), dmKg: J / (c * c), J, MeV: decay.gammaMeV };
  }
  const dmU = massDefectU(decay);
  const dmKg = dmU * u;
  const J = dmKg * c * c;
  return { dmU, dmKg, J, MeV: J / eV / 1e6 };
}
