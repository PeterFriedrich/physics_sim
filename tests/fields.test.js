import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as F from '../site/js/physics/fields.js';
import { e, mp, me } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300), `${a} ≠ ${b}`);

test('test_fields_radius_is_mv_over_qb', () => {
  // Proton at 2.0 × 10⁶ m/s in 0.50 T.
  close(F.radius(mp, 2e6, e, 0.5), (mp * 2e6) / (e * 0.5));
  close(F.magneticForce(e, 2e6, 0.5), e * 2e6 * 0.5);
});

test('test_fields_path_stays_on_circle_of_that_radius', () => {
  const s = { q: e, m: mp, Bz: 0.5, vx: 2e6, vy: 0 };
  const r = F.radius(mp, 2e6, e, 0.5);
  const T = F.period(mp, e, 0.5);
  // B out of page, +charge moving +x → force −y → centre at (0, −r).
  for (const t of [0.1, 0.33, 0.5, 0.9].map((f) => f * T)) {
    const st = F.stateAt(s, t);
    close(Math.hypot(st.x, st.y + r), r, 1e-9);
    close(Math.hypot(st.vx, st.vy), 2e6, 1e-9);
  }
  const full = F.stateAt(s, T);
  assert.ok(Math.abs(full.x) < r * 1e-9 && Math.abs(full.y) < r * 1e-9, 'returns to start after one period');
});

test('test_fields_positive_charge_clockwise_when_b_out_of_page', () => {
  const f = F.forceVector({ q: e, Bz: 1 }, 1, 0);
  assert.ok(f.Fy < 0 && f.Fx === 0);
  assert.ok(F.omega(e, mp, 1) < 0);
  // An electron curves the other way in the same field.
  assert.ok(F.omega(-e, me, 1) > 0);
  assert.ok(F.forceVector({ q: -e, Bz: 1 }, 1, 0).Fy > 0);
});

test('test_fields_force_is_perpendicular_to_velocity', () => {
  const s = { q: -e, m: me, Bz: -0.002, vx: 3e6, vy: 1e6 };
  const st = F.stateAt(s, 1e-9);
  const f = F.forceVector(s, st.vx, st.vy);
  const cos = (f.Fx * st.vx + f.Fy * st.vy) / (Math.hypot(f.Fx, f.Fy) * Math.hypot(st.vx, st.vy));
  assert.ok(Math.abs(cos) < 1e-12, `cos=${cos}`);
});
