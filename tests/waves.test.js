import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pulseShape, displacement, meetingTime } from '../site/js/physics/waves.js';

const s = { xA: 1, xB: 9, v: 2, ampA: 0.5, widthA: 1.5, ampB: 0.5, widthB: 1.5 };

test('test_waves_pulse_is_zero_outside_its_width', () => {
  assert.equal(pulseShape(5, 3, 1, 2), 0);
  assert.equal(pulseShape(3, 3, 0.7, 2), 0.7);
});

test('test_waves_constructive_interference_doubles_amplitude', () => {
  const t = meetingTime(s);
  assert.equal(t, 2);
  assert.ok(Math.abs(displacement(5, t, s).y - 1.0) < 1e-12);
});

test('test_waves_destructive_interference_cancels', () => {
  const inv = { ...s, ampB: -0.5 };
  const t = meetingTime(inv);
  for (const x of [4.5, 4.8, 5, 5.3]) assert.ok(Math.abs(displacement(x, t, inv).y) < 1e-12);
});

test('test_waves_pulses_emerge_unchanged', () => {
  // Superposition is not a collision: after passing, each pulse has its original shape.
  const t = 3.5;
  const d = displacement(1 + 2 * t, t, s);
  assert.ok(Math.abs(d.ya - 0.5) < 1e-12);
  assert.equal(d.yb, 0);
});
