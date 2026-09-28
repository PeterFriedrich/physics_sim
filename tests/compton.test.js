import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../site/js/physics/compton.js';
import { h, c, me, eV } from '../site/js/physics/constants.js';

test('test_compton_wavelength_from_sheet_constants', () => {
  // h/(mₑc) = 6.63e-34 / (9.11e-31 × 3.00e8) = 2.43 × 10⁻¹² m.
  assert.equal(P.comptonWavelength.toPrecision(3), '2.43e-12');
  assert.equal(P.comptonShift(0), 0);
  assert.equal(P.comptonShift(90).toPrecision(3), '2.43e-12');
  assert.equal(P.comptonShift(180).toPrecision(3), '4.85e-12');
});

test('test_compton_worked_example_5pm_at_90_degrees', () => {
  // λ = 5.00 pm, θ = 90°: λ′ = 7.43 pm; p = h/λ = 1.33 × 10⁻²² kg·m/s;
  // p′ = 8.93 × 10⁻²³; E = pc = 3.98 × 10⁻¹⁴ J; Eₖ = E − E′ = 1.30 × 10⁻¹⁴ J.
  const s = P.scatter(5e-12, 90);
  assert.equal(s.lambdaOut.toPrecision(3), '7.43e-12');
  assert.equal(s.pIn.toPrecision(3), '1.33e-22');
  assert.equal(s.pOut.toPrecision(3), '8.93e-23');
  assert.equal(s.EIn.toPrecision(3), '3.98e-14');
  assert.equal(s.Ek.toPrecision(3), '1.30e-14');
  // At 90° the electron takes p along x and −p′ along y: φ = tan⁻¹(p′/p).
  assert.equal(s.phiDeg.toFixed(1), (Math.atan(s.pOut / s.pIn) * 180 / Math.PI).toFixed(1));
  assert.equal(s.phiDeg.toFixed(1), '34.0'); // tan φ = λ/λ′ = 5.00/7.43
});

test('test_compton_momentum_conserved_in_both_components', () => {
  for (const [lam, th] of [[5e-12, 90], [71e-12, 30], [1e-12, 150]]) {
    const s = P.scatter(lam, th);
    assert.ok(Math.abs(s.pOutVec.x + s.pe.x - s.pIn) < 1e-12 * s.pIn);
    assert.ok(Math.abs(s.pOutVec.y + s.pe.y) < 1e-12 * s.pIn);
  }
});

test('test_compton_electron_energy_and_momentum_are_relativistically_consistent', () => {
  // The Compton formula is exact relativity, so Eₖ = √((pc)² + (mc²)²) − mc²
  // for the recoil momentum, not ½mv²: why the page shows no electron speed.
  const s = P.scatter(1e-12, 120);
  const mc2 = me * c * c;
  const ek = Math.sqrt((s.peMag * c) ** 2 + mc2 ** 2) - mc2;
  assert.ok(Math.abs(ek - s.Ek) < 1e-6 * s.Ek);
  assert.ok(Math.abs(s.EInEv - s.EIn / eV) < 0.01 * s.EInEv);
  assert.equal(P.photonMomentum(1e-12), h / 1e-12);
});

test('test_compton_no_scattering_no_recoil', () => {
  const s = P.scatter(5e-12, 0);
  assert.equal(s.dLambda, 0);
  assert.equal(s.Ek, 0);
  assert.equal(s.phiDeg, 0);
});
