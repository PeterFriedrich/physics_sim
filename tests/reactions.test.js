import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../site/js/physics/reactions.js';
import { u, c } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300), `${a} ≠ ${b}`);

test('test_reactions_charge_and_nucleons_balance', () => {
  for (const d of R.DECAYS) {
    const b = R.balance(d);
    assert.deepEqual(b.left, b.right, `${d.parent} ${d.mode}`);
  }
});

test('test_reactions_uranium_alpha_energy', () => {
  // Δm = 238.050788 − 234.043601 − 4.002603 = 0.004584 u.
  // With the sheet's u and c: E = 0.004584 × 1.66e-27 × (3.00e8)² = 6.85 × 10⁻¹³ J = 4.28 MeV.
  const d = R.DECAYS.find((x) => x.parent === 'U-238');
  close(R.massDefectU(d), 0.004584, 1e-6);
  const E = R.energyReleased(d);
  close(E.J, 0.004584 * u * c * c, 1e-6);
  assert.equal(E.MeV.toPrecision(3), '4.28');
});

test('test_reactions_beta_bookkeeping_with_atomic_masses', () => {
  // β⁻: electrons cancel. C-14 → N-14: 0.000168 u → 0.157 MeV with sheet constants.
  const c14 = R.DECAYS.find((x) => x.parent === 'C-14');
  close(R.massDefectU(c14), 0.000168, 1e-6);
  assert.equal(R.energyReleased(c14).MeV.toPrecision(3), '0.157');
  // β⁺: subtract two electron masses. Na-22 → Ne-22.
  const na = R.DECAYS.find((x) => x.parent === 'Na-22');
  close(R.massDefectU(na), 21.994437 - 21.991385 - 2 * R.electronMassU, 1e-9);
  assert.ok(R.energyReleased(na).MeV > 1.8 && R.energyReleased(na).MeV < 1.84);
});

test('test_reactions_every_decay_releases_energy', () => {
  for (const d of R.DECAYS) assert.ok(R.energyReleased(d).MeV > 0, d.parent);
  const tc = R.DECAYS.find((x) => x.mode === 'gamma');
  assert.equal(R.energyReleased(tc).MeV, 0.1405);
});
