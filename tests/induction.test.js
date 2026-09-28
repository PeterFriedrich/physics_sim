import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lenz, relativeFlux, relativeFluxRate } from '../site/js/physics/induction.js';

test('test_induction_lenz_opposes_the_change', () => {
  // N pushed in: the near end becomes N and repels it.
  assert.deepEqual(lenz('N', 1), {
    flux: 'increasing', nearPole: 'N', seenFromMagnet: 'counterclockwise', frontCurrent: 1, onMagnet: 'repels',
  });
  // N pulled out: the near end becomes S and holds it back.
  assert.deepEqual(lenz('N', -1), {
    flux: 'decreasing', nearPole: 'S', seenFromMagnet: 'clockwise', frontCurrent: -1, onMagnet: 'attracts',
  });
  assert.equal(lenz('S', 1).nearPole, 'S');
  assert.equal(lenz('S', -1).nearPole, 'N');
});

test('test_induction_flipping_pole_or_motion_reverses_current', () => {
  for (const f of ['N', 'S']) for (const v of [1, -1]) {
    const other = f === 'N' ? 'S' : 'N';
    assert.equal(lenz(f, v).frontCurrent, -lenz(other, v).frontCurrent);
    assert.equal(lenz(f, v).frontCurrent, -lenz(f, -v).frontCurrent);
    // Flipping both leaves the current unchanged.
    assert.equal(lenz(f, v).frontCurrent, lenz(other, -v).frontCurrent);
  }
});

test('test_induction_no_motion_no_current', () => {
  const r = lenz('N', 0);
  assert.equal(r.frontCurrent, 0);
  assert.equal(r.flux, 'unchanged');
  assert.equal(relativeFluxRate(1, 0), 0);
});

test('test_induction_needle_grows_with_speed', () => {
  assert.equal(relativeFlux(0), 1);
  assert.ok(relativeFlux(1) < relativeFlux(0.5));
  assert.ok(Math.abs(relativeFluxRate(1, 2) - 2 * relativeFluxRate(1, 1)) < 1e-15);
  // Matches a numerical derivative of the flux.
  const d = 1e-6;
  const num = (relativeFlux(1.3 + d) - relativeFlux(1.3 - d)) / (2 * d);
  assert.ok(Math.abs(relativeFluxRate(1.3, 1) - Math.abs(num)) < 1e-6);
});
