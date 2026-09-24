import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as K from '../site/js/physics/kinematics.js';
import { g } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_projectile_level_ground_matches_range_equation', () => {
  // R = v²·sin 2θ / g on level ground.
  const p = K.launch({ v0: 20, angleDeg: 30, h0: 0, g });
  close(K.range(p), (400 * Math.sin(Math.PI / 3)) / g);
  close(K.timeOfFlight(p), (2 * 20 * 0.5) / g);
  close(K.maxHeight(p), (10 * 10) / (2 * g));
});

test('test_projectile_lands_at_ground_level', () => {
  const p = K.launch({ v0: 15, angleDeg: 50, h0: 12, g });
  close(K.position(p, K.timeOfFlight(p)).y, 0, 1e-9);
});

test('test_projectile_horizontal_launch_from_cliff', () => {
  // Rolled off a 45.0 m cliff at 12.0 m/s: t = √(2h/g), Δx = v·t.
  const p = K.launch({ v0: 12, angleDeg: 0, h0: 45, g });
  const t = Math.sqrt((2 * 45) / g);
  close(K.timeOfFlight(p), t);
  close(K.range(p), 12 * t);
  close(K.maxHeight(p), 45);
});

test('test_projectile_vertical_velocity_zero_at_peak', () => {
  const p = K.launch({ v0: 25, angleDeg: 60, h0: 2, g });
  close(K.velocity(p, K.timeToPeak(p)).vy, 0, 1e-12);
  close(K.position(p, K.timeToPeak(p)).y, K.maxHeight(p));
});
