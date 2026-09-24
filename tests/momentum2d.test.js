import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collide2D, contactGeometry, contactTime } from '../site/js/physics/momentum2d.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const ek = (m, v) => 0.5 * m * (v.x * v.x + v.y * v.y);

test('test_collisions2d_momentum_conserved_in_both_components', () => {
  for (const e of [0, 0.5, 1]) {
    for (const b of [-0.15, 0, 0.07, 0.19]) {
      const s = { m1: 2, v1: 3, m2: 1.5, b, R: 0.1, e };
      const r = collide2D(s);
      close(s.m1 * r.v1f.x + s.m2 * r.v2f.x, s.m1 * s.v1);
      close(s.m1 * r.v1f.y + s.m2 * r.v2f.y, 0);
    }
  }
});

test('test_collisions2d_elastic_conserves_kinetic_energy', () => {
  const s = { m1: 2, v1: 3, m2: 1.5, b: 0.08, R: 0.1, e: 1 };
  const r = collide2D(s);
  close(ek(2, r.v1f) + ek(1.5, r.v2f), 0.5 * 2 * 9);
});

test('test_collisions2d_equal_mass_elastic_glancing_leaves_at_90_degrees', () => {
  // The classic result: equal masses, target at rest, elastic, off-centre.
  const r = collide2D({ m1: 1, v1: 4, m2: 1, b: 0.1, R: 0.1, e: 1 });
  close(r.v1f.x * r.v2f.x + r.v1f.y * r.v2f.y, 0, 1e-9);
});

test('test_collisions2d_head_on_is_one_dimensional', () => {
  const r = collide2D({ m1: 1, v1: 4, m2: 1, b: 0, R: 0.1, e: 1 });
  close(r.v1f.x, 0);
  close(r.v2f.x, 4);
  close(r.v2f.y, 0);
});

test('test_collisions2d_target_moves_along_line_of_centres', () => {
  const b = 0.12;
  const r = collide2D({ m1: 1, v1: 2, m2: 3, b, R: 0.1, e: 0.7 });
  const g = contactGeometry(b, 0.1);
  close(r.v2f.x * g.ny - r.v2f.y * g.nx, 0, 1e-9); // v2' ∥ n
  assert.ok(r.v2f.y < 0, 'hit above centre → target goes below the axis');
});

test('test_collisions2d_stick_together_moves_off_along_original_line', () => {
  const r = collide2D({ m1: 3, v1: 2, m2: 1, b: 0.1, R: 0.1, e: 1, stick: true });
  close(r.v1f.x, 1.5);
  close(r.v1f.y, 0);
  assert.deepEqual(r.v1f, r.v2f);
});

test('test_collisions2d_miss_and_contact_time', () => {
  assert.equal(collide2D({ m1: 1, v1: 2, m2: 1, b: 0.25, R: 0.1, e: 1 }).hit, false);
  close(contactTime({ x0: -1, v1: 2, b: 0, R: 0.1 }), (1 - 0.2) / 2);
  assert.equal(contactTime({ x0: -1, v1: 2, b: 0.3, R: 0.1 }), Infinity);
});
