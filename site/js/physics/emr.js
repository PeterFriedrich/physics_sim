// The electromagnetic spectrum (Physics 30 Unit C). λ in metres.
import { h, hEv, c } from './constants.js';

// Approximate band boundaries; textbooks differ, and the page says so.
const BANDS = [
  [1e-11, 'gamma rays'],
  [1e-8, 'X-rays'],
  [380e-9, 'ultraviolet'],
  [750e-9, 'visible light'],
  [1e-3, 'infrared'],
  [1, 'microwaves'],
  [Infinity, 'radio waves'],
];

export function emBand(lambda) {
  for (const [upper, name] of BANDS) if (lambda < upper) return name;
  return 'radio waves';
}

export function photon(lambda) {
  return { f: c / lambda, EJ: (h * c) / lambda, EeV: (hEv * c) / lambda };
}
