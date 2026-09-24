import { test } from 'node:test';
import assert from 'node:assert/strict';
import { uniformCircular, stateAt } from '../site/js/physics/circular.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_circular_speed_and_centripetal_acceleration', () => {
  const u = uniformCircular({ r: 2, T: 4, m: 0.5 });
  close(u.v, Math.PI); // 2π·2/4
  close(u.ac, (u.v * u.v) / 2); // v²/r and 4π²r/T² agree
  close(u.Fc, 0.5 * u.ac);
  close(u.f, 0.25);
});

test('test_circular_velocity_is_tangent_and_speed_constant', () => {
  const s = { r: 3, T: 5 };
  for (const t of [0, 0.7, 2.2, 4.9]) {
    const st = stateAt(s, t);
    close(st.x * st.vx + st.y * st.vy, 0, 1e-9); // r ⟂ v
    close(Math.hypot(st.vx, st.vy), (2 * Math.PI * 3) / 5);
    close(Math.hypot(st.x, st.y), 3);
  }
});
