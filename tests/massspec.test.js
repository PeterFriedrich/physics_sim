import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../site/js/physics/massspec.js';
import { e, u } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300), `${a} ≠ ${b}`);

test('test_massspec_selector_speed_balances_forces', () => {
  // E = 400 V / 0.020 m = 2.0 × 10⁴ N/C, B₁ = 0.10 T → v = 2.0 × 10⁵ m/s.
  const E = 400 / 0.02;
  const v = M.selectorSpeed(E, 0.1);
  close(v, 2e5);
  const f = M.selectorForces({ q: e, v, E, B1: 0.1 });
  close(f.Fe, f.Fm);
  assert.ok(M.selectorAccel({ q: e, m: 12 * u, v, E, B1: 0.1 }) === 0);
});

test('test_massspec_off_speed_ions_deflect_opposite_ways', () => {
  const s = { q: e, m: 12 * u, E: 2e4, B1: 0.1 };
  assert.ok(M.selectorAccel({ ...s, v: 3e5 }) > 0, 'too fast: magnetic force wins (up)');
  assert.ok(M.selectorAccel({ ...s, v: 1e5 }) < 0, 'too slow: electric force wins (down)');
  // A negative ion flips both forces, so the same speed still passes.
  assert.ok(M.selectorAccel({ ...s, q: -e, v: 2e5 }) === 0);
});

test('test_massspec_landing_separates_isotopes', () => {
  // ¹²C⁺ and ¹⁴C⁺ at 2.0 × 10⁵ m/s in B₂ = 0.50 T: r = mv/(qB).
  const r12 = (12 * u * 2e5) / (e * 0.5);
  close(M.landingDistance(12 * u, 2e5, e, 0.5), 2 * r12);
  close(M.landingDistance(14 * u, 2e5, e, 0.5) / M.landingDistance(12 * u, 2e5, e, 0.5), 14 / 12);
  close(M.massFromRadius(e, 0.5, r12, 2e5), 12 * u);
});

test('test_massspec_only_selected_speed_gets_through', () => {
  // E = 1000 V / 0.010 m = 1.0 × 10⁵ N/C, B₁ = 0.50 T → v = 2.0 × 10⁵ m/s.
  const s = { q: e, m: 12 * u, E: 1e5, B1: 0.5, L: 0.1, d: 0.01, slitHalf: 5e-4 };
  assert.equal(M.selectorExit({ ...s, v: 2e5 }).outcome, 'pass');
  assert.equal(M.selectorExit({ ...s, v: 3e5 }).outcome, 'plate');
  assert.equal(M.selectorExit({ ...s, v: 1.2e5 }).outcome, 'plate');
  assert.equal(M.selectorExit({ ...s, v: 2.1e5 }).outcome, 'blocked');
  const hit = M.selectorExit({ ...s, v: 3e5 });
  assert.ok(hit.y > 0 && hit.x < 0.1, 'too fast: pushed up into the top plate before the end');
});
