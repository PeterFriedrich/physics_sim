import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as O from '../site/js/physics/optics.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);
const sin = (d) => Math.sin((d * Math.PI) / 180);

test('test_optics_snells_law', () => {
  const t2 = O.refractionAngle(1.0, 1.5, 40);
  close(1.0 * sin(40), 1.5 * sin(t2));
  assert.ok(t2 < 40, 'bends toward the normal entering a denser medium');
  close(O.refractionAngle(1.33, 1.33, 25), 25);
});

test('test_optics_total_internal_reflection_beyond_critical_angle', () => {
  const tc = O.criticalAngle(1.5, 1.0);
  close(sin(tc), 1 / 1.5);
  assert.notEqual(O.refractionAngle(1.5, 1.0, tc - 0.1), null);
  assert.equal(O.refractionAngle(1.5, 1.0, tc + 0.1), null);
  assert.equal(O.criticalAngle(1.0, 1.5), null);
});

test('test_optics_speed_and_wavelength_in_medium', () => {
  close(O.speedInMedium(1.5), 2.0e8);
  close(O.wavelengthInMedium(600, 1.5), 400);
});
