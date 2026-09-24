import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../site/js/physics/track.js';
import { g } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

function run(p, seconds) {
  let s = { x: T.startX(p.h0), dir: 1, d: 0, stopped: false };
  const states = [];
  for (let t = 0; t < seconds; t += 0.02) {
    s = T.advance(p, s, 0.02);
    states.push(s);
  }
  return states;
}

test('test_track_geometry_passes_through_key_points', () => {
  for (const [x, y] of T.TRACK) close(T.trackHeight(x), y);
  for (const h of [2, 10, 19.5]) close(T.trackHeight(T.startX(h)), h);
  // Along a curve is longer than across it.
  assert.ok(T.pathLength(0, 12) > Math.hypot(12, 20));
});

test('test_track_energy_frictionless_speed_at_bottom', () => {
  // Released from 15.0 m: at the 0 m dip, v = √(2gh) = 17.2 m/s, whatever the mass.
  for (const m of [1, 50]) close(T.energyAt({ m, h0: 15, Ff: 0, g }, 0, 30).v, Math.sqrt(2 * g * 15));
  const e = T.energyAt({ m: 2, h0: 15, Ff: 3, g }, 4, 10);
  close(e.Ek + e.Ep + e.Wf, e.Et);
  close(e.Wf, 30);
});

test('test_track_ball_clears_lower_hill_and_turns_back_at_higher', () => {
  const over = run({ m: 1, h0: 15, Ff: 0, g }, 12);
  assert.ok(over.some((s) => s.x > 24), 'from 15 m it should clear the 14 m hill');
  const back = run({ m: 1, h0: 13, Ff: 0, g }, 12);
  assert.ok(back.every((s) => s.x < 24), 'from 13 m it cannot clear the 14 m hill');
  assert.ok(back.some((s) => s.dir === -1), 'it should turn back');
  // Never above the release height without friction.
  for (const s of over) assert.ok(T.trackHeight(s.x) <= 15 + 1e-9);
});

test('test_track_friction_brings_ball_to_rest', () => {
  const p = { m: 1, h0: 18, Ff: 1.5, g };
  const states = run(p, 120);
  const last = states.at(-1);
  assert.ok(last.stopped, 'friction should stop the ball');
  // Energy it has lost equals the work done by friction.
  const e = T.energyAt(p, T.trackHeight(last.x), last.d);
  assert.ok(e.Ek < 1e-9);
  assert.ok(Math.abs(e.Et - e.Ep - e.Wf) < 1e-6 * e.Et);
});
