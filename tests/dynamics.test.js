import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inclineForces, criticalAngleDeg } from '../site/js/physics/dynamics.js';
import { g } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_incline_frictionless_acceleration_is_g_sin_theta', () => {
  const f = inclineForces({ m: 5, angleDeg: 30, muS: 0, muK: 0, g });
  close(f.a, g * 0.5);
  close(f.Fn, 5 * g * Math.cos(Math.PI / 6));
  assert.equal(f.slides, true);
});

test('test_incline_static_friction_holds_block_below_critical_angle', () => {
  const f = inclineForces({ m: 2, angleDeg: 20, muS: 0.5, muK: 0.3, g });
  assert.equal(f.slides, false);
  close(f.a, 0);
  close(f.Ff, f.FgPar); // static friction matches the parallel component, not μs·Fn
  assert.ok(f.Ff < f.FsMax);
});

test('test_incline_kinetic_friction_when_sliding', () => {
  const f = inclineForces({ m: 3, angleDeg: 40, muS: 0.4, muK: 0.25, g });
  assert.equal(f.slides, true);
  const expected = g * (Math.sin((40 * Math.PI) / 180) - 0.25 * Math.cos((40 * Math.PI) / 180));
  close(f.a, expected);
});

test('test_incline_kinetic_mu_above_static_is_clamped', () => {
  const f = inclineForces({ m: 1, angleDeg: 45, muS: 0.5, muK: 0.9, g });
  assert.ok(f.a >= 0, 'a sliding block must not accelerate uphill');
});

test('test_incline_critical_angle_is_arctan_mu_s', () => {
  close(criticalAngleDeg(1), 45);
  const theta = criticalAngleDeg(0.6);
  assert.equal(inclineForces({ m: 1, angleDeg: theta - 0.01, muS: 0.6, muK: 0.4, g }).slides, false);
  assert.equal(inclineForces({ m: 1, angleDeg: theta + 0.01, muS: 0.6, muK: 0.4, g }).slides, true);
});
