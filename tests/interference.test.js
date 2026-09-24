import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as I from '../site/js/physics/interference.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300), `${a} ≠ ${b}`);

test('test_interference_double_slit_small_angle', () => {
  // 600 nm, d = 0.250 mm, l = 2.00 m: first bright fringe x = λl/d = 4.80 mm.
  const f = I.brightFringe(600e-9, 0.25e-3, 1, 2);
  close(f.xSmall, 4.8e-3);
  close(f.x, f.xSmall, 1e-4); // tiny angle: exact and small-angle agree
  close(I.wavelengthFromFringe(f.xSmall, 0.25e-3, 1, 2), 600e-9);
  close(I.wavelengthFromAngle(0.25e-3, f.thetaDeg, 1), 600e-9);
});

test('test_interference_grating_needs_exact_form', () => {
  // 600 lines/mm, 500 nm: sin θ₁ = 0.300 → θ₁ = 17.5°, and only orders up to 3 exist.
  const d = I.spacingFromLines(600);
  const f = I.brightFringe(500e-9, d, 1, 1);
  close(Math.sin((f.thetaDeg * Math.PI) / 180), 0.3);
  assert.equal(I.maxOrder(500e-9, d), 3);
  assert.equal(I.brightFringe(500e-9, d, 4, 1), null);
  // At this angle xd/(nl) overestimates λ: the small-angle form breaks down.
  assert.ok(I.wavelengthFromFringe(f.x, d, 1, 1) > 500e-9 * 1.04);
  close(I.wavelengthFromAngle(d, f.thetaDeg, 1), 500e-9);
});

test('test_interference_intensity_peaks_at_bright_fringes', () => {
  const d = 0.25e-3;
  const lam = 600e-9;
  const th = Math.asin(lam / d);
  close(I.intensity(th, lam, d, 2), 1, 1e-6);
  assert.ok(I.intensity(Math.asin(lam / (2 * d)), lam, d, 2) < 1e-12, 'dark fringe halfway between');
});
