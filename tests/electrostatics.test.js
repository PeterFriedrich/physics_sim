import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../site/js/physics/electrostatics.js';
import { k, e, me } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300), `${a} ≠ ${b}`);

test('test_coulomb_force_worked_example', () => {
  // 2.0 µC and −3.0 µC, 0.50 m apart: F = kq1q2/r² = 0.216 N.
  close(E.coulombForce(2e-6, -3e-6, 0.5), (k * 6e-12) / 0.25);
  close(E.coulombForce(2e-6, -3e-6, 0.5), 0.21576);
  // Inverse square: double r, quarter F.
  close(E.coulombForce(1e-6, 1e-6, 1) / E.coulombForce(1e-6, 1e-6, 2), 4);
});

test('test_coulomb_field_points_away_from_positive_toward_negative', () => {
  const pos = E.fieldAt([{ q: 1e-6, x: 0, y: 0 }], 1, 0);
  assert.ok(pos.Ex > 0 && Math.abs(pos.Ey) < 1e-12);
  close(pos.Ex, k * 1e-6);
  const neg = E.fieldAt([{ q: -1e-6, x: 0, y: 0 }], 0, 2);
  assert.ok(neg.Ey < 0);
});

test('test_coulomb_field_is_vector_sum', () => {
  // Equal like charges: the field at the midpoint cancels.
  const mid = E.fieldAt([{ q: 2e-6, x: -1, y: 0 }, { q: 2e-6, x: 1, y: 0 }], 0, 0);
  assert.ok(Math.abs(mid.Ex) < 1e-9 && Math.abs(mid.Ey) < 1e-9);
  // Opposite charges: they add, pointing from + to −.
  const dip = E.fieldAt([{ q: 2e-6, x: -1, y: 0 }, { q: -2e-6, x: 1, y: 0 }], 0, 0);
  close(dip.Ex, (2 * k * 2e-6) / 1);
});

test('test_coulomb_newtons_third_law', () => {
  const cs = [{ q: 3e-6, x: 0, y: 0 }, { q: -1e-6, x: 0.3, y: 0.4 }];
  const f1 = E.netForceOn(cs, 0);
  const f2 = E.netForceOn(cs, 1);
  close(f1.Fx, -f2.Fx);
  close(f1.Fy, -f2.Fy);
  close(E.magnitude(f1.Fx, f1.Fy), E.coulombForce(3e-6, -1e-6, 0.5));
  // Attraction: force on q1 points toward q2, at 53.1° from +x.
  close(E.directionDeg(f1.Fx, f1.Fy), (Math.atan2(0.4, 0.3) * 180) / Math.PI);
});

test('test_plates_field_and_deflection', () => {
  close(E.plateField(100, 0.04), 2500);
  // Electron at 2.0 × 10⁷ m/s through 10 cm plates, field pointing up.
  const s = { q: -e, m: me, v0: 2e7, Ey: 2500, d: 0.04, L: 0.1 };
  const tr = E.platesTrajectory(s);
  const a = (-e * 2500) / me;
  close(tr.ay, a);
  assert.equal(tr.hits, false);
  close(tr.t, 0.1 / 2e7);
  close(tr.y, 0.5 * a * (0.1 / 2e7) ** 2);
  assert.ok(tr.y < 0, 'an electron is pushed against the field');
  // Work done by the field equals the gain in kinetic energy.
  close(tr.dEk, 0.5 * me * (tr.vx ** 2 + tr.vy ** 2) - 0.5 * me * 2e7 ** 2, 1e-6);
  assert.ok(tr.dEk > 0);
});

test('test_plates_particle_that_hits_a_plate', () => {
  const s = { q: -e, m: me, v0: 5e6, Ey: 2500, d: 0.04, L: 0.1 };
  const tr = E.platesTrajectory(s);
  assert.equal(tr.hits, true);
  close(tr.y, -0.02);
  assert.ok(tr.x < 0.1);
  close(E.platesPosition(tr, tr.t).y, -0.02);
});

test('test_vectors_direction_degrees_counter_clockwise_from_x', async () => {
  const { directionDeg, magnitude } = await import('../site/js/physics/vectors.js');
  assert.equal(directionDeg(1, 0), 0);
  close(directionDeg(0, 1), 90);
  close(directionDeg(-1, 0), 180);
  close(directionDeg(0, -1), 270);
  assert.equal(magnitude(3, 4), 5);
});
