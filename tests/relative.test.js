import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as R from '../site/js/physics/relative.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_river_heading_straight_across_is_3_4_5_triangle', () => {
  // Boat 4.0 m/s aimed straight across an 80 m river with a 3.0 m/s current.
  const r = R.riverCrossing({ vb: 4, vc: 3, headingDeg: 0, width: 80 });
  close(r.speed, 5);
  close(r.driftAngleDeg, (Math.atan(3 / 4) * 180) / Math.PI);
  close(r.time, 20);
  close(r.drift, 60);
});

test('test_river_heading_upstream_cancels_current', () => {
  const th = R.headingStraightAcross(5, 3);
  close(th, (Math.asin(0.6) * 180) / Math.PI);
  const r = R.riverCrossing({ vb: 5, vc: 3, headingDeg: th, width: 100 });
  close(r.vx, 0, 1e-12);
  close(r.speed, 4);
  close(r.time, 25);
  assert.equal(R.headingStraightAcross(3, 3), null);
});

test('test_river_crossing_time_depends_only_on_across_component', () => {
  const a = R.riverCrossing({ vb: 4, vc: 0, headingDeg: 0, width: 60 });
  const b = R.riverCrossing({ vb: 4, vc: 3.5, headingDeg: 0, width: 60 });
  close(a.time, b.time);
  assert.equal(R.riverCrossing({ vb: 4, vc: 1, headingDeg: 90, width: 60 }).time, Infinity);
});
