import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as W from '../site/js/physics/wireforce.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_wireforce_perpendicular_wire', () => {
  // 3.0 A through 0.20 m of wire at 90° to 0.50 T: F = Il⊥B = 0.30 N.
  close(W.wireForce(3, 0.2, 0.5, 90), 0.3);
});

test('test_wireforce_only_perpendicular_length_counts', () => {
  close(W.perpendicularLength(0.2, 30), 0.1);
  close(W.wireForce(3, 0.2, 0.5, 30), 0.15);
  close(W.wireForce(3, 0.2, 0.5, 0), 0);
});

test('test_wireforce_direction_flips_with_current_or_field', () => {
  // Current along +y, B along +x: F = IL × B points into the page (−z).
  const s = { I: 2, L: 0.1, B: 0.4, thetaDeg: 90 };
  assert.ok(W.forceZ(s) < 0);
  assert.ok(W.forceZ({ ...s, currentSign: -1 }) > 0);
  assert.ok(W.forceZ({ ...s, fieldSign: -1 }) > 0);
  assert.ok(W.forceZ({ ...s, currentSign: -1, fieldSign: -1 }) < 0);
  close(Math.abs(W.forceZ(s)), W.wireForce(2, 0.1, 0.4, 90));
});
