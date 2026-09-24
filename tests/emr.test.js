import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../site/js/physics/emr.js';

test('test_emr_bands', () => {
  assert.equal(R.emBand(1e-12), 'gamma rays');
  assert.equal(R.emBand(1e-10), 'X-rays');
  assert.equal(R.emBand(200e-9), 'ultraviolet');
  assert.equal(R.emBand(550e-9), 'visible light');
  assert.equal(R.emBand(10e-6), 'infrared');
  assert.equal(R.emBand(0.12), 'microwaves');
  assert.equal(R.emBand(3), 'radio waves');
});

test('test_emr_photon_energy_and_frequency', () => {
  // 500 nm: f = 6.00 × 10¹⁴ Hz, E = hc/λ = 3.978 × 10⁻¹⁹ J = 2.48 eV.
  const p = R.photon(500e-9);
  assert.ok(Math.abs(p.f - 6e14) < 1);
  assert.equal(p.EJ.toPrecision(4), '3.978e-19');
  assert.equal(p.EeV.toPrecision(3), '2.48');
});
