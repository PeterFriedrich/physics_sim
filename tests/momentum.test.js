import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collide1D, momentum, kineticEnergy, collisionTime } from '../site/js/physics/momentum.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const p = (m1, v1, m2, v2) => momentum(m1, v1) + momentum(m2, v2);
const ek = (m1, v1, m2, v2) => kineticEnergy(m1, v1) + kineticEnergy(m2, v2);

test('test_momentum_conserved_for_every_collision_type', () => {
  for (const e of [0, 0.5, 1]) {
    const c = { m1: 2, v1: 3, m2: 1.5, v2: -1, e };
    const { v1f, v2f } = collide1D(c);
    close(p(c.m1, v1f, c.m2, v2f), p(c.m1, c.v1, c.m2, c.v2));
  }
});

test('test_momentum_elastic_conserves_kinetic_energy', () => {
  const c = { m1: 2, v1: 3, m2: 1.5, v2: -1, e: 1 };
  const { v1f, v2f } = collide1D(c);
  close(ek(c.m1, v1f, c.m2, v2f), ek(c.m1, c.v1, c.m2, c.v2));
});

test('test_momentum_equal_mass_elastic_swaps_velocities', () => {
  const { v1f, v2f } = collide1D({ m1: 1, v1: 4, m2: 1, v2: 0, e: 1 });
  close(v1f, 0);
  close(v2f, 4);
});

test('test_momentum_perfectly_inelastic_carts_stick', () => {
  const { v1f, v2f } = collide1D({ m1: 3, v1: 2, m2: 1, v2: 0, e: 0 });
  close(v1f, 1.5);
  close(v2f, 1.5);
  assert.ok(ek(3, v1f, 1, v2f) < ek(3, 2, 1, 0));
});

test('test_momentum_collision_time', () => {
  close(collisionTime({ gap: 2, v1: 3, v2: -1 }), 0.5);
  assert.equal(collisionTime({ gap: 2, v1: 1, v2: 2 }), Infinity);
});
