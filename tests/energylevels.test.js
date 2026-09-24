import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as L from '../site/js/physics/energylevels.js';

test('test_energylevels_balmer_red_line', () => {
  // n = 3 → 2: ΔE = 1.89 eV, λ = hc/ΔE = 657 nm (visible red), Balmer series.
  const t = L.transition(3, 2);
  assert.ok(Math.abs(t.dE - 1.89) < 1e-12);
  assert.equal((t.lambda * 1e9).toPrecision(3), '657');
  assert.equal(t.series, 'Balmer');
});

test('test_energylevels_lyman_is_ultraviolet', () => {
  // n = 2 → 1: ΔE = 10.2 eV, λ ≈ 122 nm.
  const t = L.transition(2, 1);
  assert.ok(Math.abs(t.dE - 10.2) < 1e-12);
  assert.equal((t.lambda * 1e9).toPrecision(3), '122');
  assert.equal(t.series, 'Lyman');
  assert.ok(Math.abs(t.f * 4.14e-15 - t.dE) < 1e-12);
});

test('test_energylevels_ionization_from_ground', () => {
  assert.equal(L.ionizationEnergy(1), 13.6);
  assert.equal(L.ionizationEnergy(2), 3.4);
});
