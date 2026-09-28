// Quarks and the first-generation fermions (Physics 30 Unit D). Charges are
// kept in thirds of e as integers so +⅔ − ⅓ − ⅓ sums to exactly 0.
// Scope (SPEC_phase5.md §3): charge conservation only, no baryon or lepton number.
import { mp, c, eV, upQuarkMeV, downQuarkMeV } from './constants.js';

export const QUARKS = {
  u: { symbol: 'u', name: 'up', thirds: 2, anti: false, MeV: upQuarkMeV },
  d: { symbol: 'd', name: 'down', thirds: -1, anti: false, MeV: downQuarkMeV },
  ubar: { symbol: 'ū', name: 'anti-up', thirds: -2, anti: true, MeV: upQuarkMeV },
  dbar: { symbol: 'd̄', name: 'anti-down', thirds: 1, anti: true, MeV: downQuarkMeV },
};

const NAMES = {
  'u u d': 'proton (p)',
  'd d u': 'neutron (n)',
  'ubar ubar dbar': 'antiproton (p̄)',
  'dbar dbar ubar': 'antineutron (n̄)',
  'u u u': 'delta (Δ⁺⁺)',
  'd d d': 'delta (Δ⁻)',
  'dbar u': 'pion (π⁺)',
  'd ubar': 'pion (π⁻)',
  'u ubar': 'neutral pion (π⁰)',
  'd dbar': 'neutral pion (π⁰)',
};

// A key independent of the order the quarks were picked in.
const key = (ids) => [...ids].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join(' ');
const NAMED = Object.fromEntries(Object.entries(NAMES).map(([k, v]) => [key(k.split(' ')), v]));

export function hadron(ids) {
  const qs = ids.map((id) => QUARKS[id]);
  const thirds = qs.reduce((s, q) => s + q.thirds, 0);
  const nAnti = qs.filter((q) => q.anti).length;
  let kind = 'not a hadron';
  if (qs.length === 3 && nAnti === 0) kind = 'baryon';
  else if (qs.length === 3 && nAnti === 3) kind = 'antibaryon';
  else if (qs.length === 2 && nAnti === 1) kind = 'meson';
  return {
    thirds,
    kind,
    name: kind === 'not a hadron' ? null : NAMED[key(ids)] ?? null,
    quarkMeV: qs.reduce((s, q) => s + q.MeV, 0),
  };
}

// Proton rest energy from the sheet's mₚ: mc² in MeV (939 with sheet values).
export const protonMeV = (mp * c * c) / eV / 1e6;

// β decay at the quark level. Each particle is { symbol, thirds }.
const E = (symbol, thirds) => ({ symbol, thirds });
export const BETA = {
  minus: {
    quark: { before: [E('d', -1)], after: [E('u', 2), E('e⁻', -3), E('ν̄ₑ', 0)] },
    nucleon: { before: [E('n (udd)', 0)], after: [E('p (uud)', 3), E('e⁻', -3), E('ν̄ₑ', 0)] },
  },
  plus: {
    quark: { before: [E('u', 2)], after: [E('d', -1), E('e⁺', 3), E('νₑ', 0)] },
    nucleon: { before: [E('p (uud)', 3)], after: [E('n (udd)', 0), E('e⁺', 3), E('νₑ', 0)] },
  },
};

export function chargeThirds(list) {
  return list.reduce((s, p) => s + p.thirds, 0);
}
