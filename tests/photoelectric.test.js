import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../site/js/physics/photoelectric.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_photoelectric_photon_energy_uses_data_sheet_constants', () => {
  // E = hc/λ with h = 4.14 × 10⁻¹⁵ eV·s, c = 3.00 × 10⁸ m/s: 400 nm → 3.105 eV.
  close(P.photonEnergyEv(400), 3.105);
  close(P.frequency(500), 6e14);
});

test('test_photoelectric_einstein_equation', () => {
  close(P.maxKineticEv(250, 2.3), P.photonEnergyEv(250) - 2.3);
  close(P.stoppingVoltage(250, 2.3), P.maxKineticEv(250, 2.3));
});

test('test_photoelectric_no_emission_below_threshold_at_any_intensity', () => {
  const W = 4.3;
  const l0 = P.thresholdWavelengthNm(W);
  close(P.photonEnergyEv(l0), W);
  close(P.thresholdFrequency(W) * 4.14e-15, W);
  const below = { lambdaNm: l0 + 5, workFunctionEv: W, voltage: 0 };
  assert.equal(P.photocurrent({ ...below, intensity: 1 }), 0);
  assert.equal(P.photocurrent({ ...below, intensity: 100 }), 0);
});

test('test_photoelectric_current_zero_at_stopping_voltage_and_saturates', () => {
  const s = { lambdaNm: 300, workFunctionEv: 2.3, intensity: 5 };
  const vs = P.stoppingVoltage(300, 2.3);
  close(P.photocurrent({ ...s, voltage: -vs }), 0, 1e-12);
  assert.equal(P.photocurrent({ ...s, voltage: 3 }), 5);
  assert.equal(P.photocurrent({ ...s, voltage: 0 }), 5);
  const half = P.photocurrent({ ...s, voltage: -vs / 2 });
  assert.ok(half > 0 && half < 5);
});
