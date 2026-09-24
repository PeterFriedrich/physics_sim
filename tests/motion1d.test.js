import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as M from '../site/js/physics/motion1d.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_motion1d_matches_kinematics_equations', () => {
  // v0 = 4.0 m/s, a = −2.0 m/s², t = 3.0 s: Δx = v0t + ½at² = 3.0 m, v = −2.0 m/s.
  const s = M.uniformMotion({ x0: 1, v0: 4, a: -2 }, 3);
  close(s.x, 4);
  close(s.v, -2);
  close(s.a, -2);
});

test('test_motion1d_area_under_vt_equals_displacement', () => {
  for (const p of [{ v0: 4, a: -2 }, { v0: -3, a: 1.5 }, { v0: 2, a: 0 }]) {
    for (const t of [0.5, 2, 3.7]) close(M.areaUnderVt(p, t), M.uniformMotion({ x0: 0, ...p }, t).x);
  }
});

test('test_motion1d_distance_exceeds_displacement_after_turnaround', () => {
  const p = { v0: 4, a: -2 };
  close(M.turnaroundTime(p), 2);
  // Out 4.0 m by t = 2 s, back 1.0 m by t = 3 s: distance 5.0 m, displacement 3.0 m.
  close(M.distanceTravelled(p, 3), 5);
  close(M.distanceTravelled(p, 1), 3);
  // The starting position must not leak into a distance.
  close(M.distanceTravelled({ x0: -8, ...p }, 3), 5);
  assert.equal(M.turnaroundTime({ v0: 4, a: 2 }), null);
  assert.equal(M.turnaroundTime({ v0: 4, a: 0 }), null);
});
