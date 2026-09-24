import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pulseShape, displacement, meetingTime } from '../site/js/physics/waves.js';
import * as W from '../site/js/physics/waves.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

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

test('test_air_column_closed_resonances_are_odd_quarter_wavelengths', () => {
  // Closed tube 0.250 m, v = 343 m/s: λ = 4L = 1.00 m, f = 343 Hz; next is 3f.
  const a = W.airColumn({ type: 'closed', L: 0.25, n: 1, v: 343 });
  close(a.lambda, 1);
  close(a.f, 343);
  close(W.airColumn({ type: 'closed', L: 0.25, n: 2, v: 343 }).f, 3 * 343);
  close(W.resonantLength('closed', 1, 1), 0.25);
  close(W.resonantLength('closed', 1, 2) - W.resonantLength('closed', 1, 1), 0.5);
});

test('test_air_column_open_resonances_are_half_wavelengths', () => {
  const a = W.airColumn({ type: 'open', L: 0.5, n: 1, v: 343 });
  close(a.lambda, 1);
  close(W.airColumn({ type: 'open', L: 0.5, n: 2, v: 343 }).f, 2 * 343);
  close(W.resonantLength('open', 1, 3), 1.5);
});

test('test_air_column_node_at_closed_end_antinode_at_open_end', () => {
  for (const n of [1, 2, 3]) {
    const { lambda } = W.airColumn({ type: 'closed', L: 0.6, n, v: 343 });
    close(W.columnEnvelope('closed', lambda, 0), 0, 1e-12);
    close(Math.abs(W.columnEnvelope('closed', lambda, 0.6)), 1, 1e-12);
    const o = W.airColumn({ type: 'open', L: 0.6, n, v: 343 });
    close(Math.abs(W.columnEnvelope('open', o.lambda, 0)), 1, 1e-12);
    close(Math.abs(W.columnEnvelope('open', o.lambda, 0.6)), 1, 1e-12);
  }
});

test('test_air_column_nodes_and_antinodes_positions', () => {
  // Closed tube at its 2nd resonance, L = 3λ/4 with λ = 1.00 m.
  const c = W.nodesAndAntinodes('closed', 1, 0.75);
  assert.deepEqual(c.nodes, [0, 0.5]);
  assert.deepEqual(c.antinodes, [0.25, 0.75]);
  // Open tube at its 1st resonance, L = λ/2: antinodes at both ends, one node in the middle.
  const o = W.nodesAndAntinodes('open', 1, 0.5);
  assert.deepEqual(o.nodes, [0.25]);
  assert.deepEqual(o.antinodes, [0, 0.5]);
});

test('test_doppler_moving_source', () => {
  // 500 Hz source at 30.0 m/s, v = 343 m/s: 548 Hz ahead, 460 Hz behind.
  const d = W.dopplerSource({ fs: 500, v: 343, vs: 30 });
  assert.equal(d.fAhead.toPrecision(3), '548');
  assert.equal(d.fBehind.toPrecision(3), '460');
  close(d.lambdaAhead * d.fAhead, 343);
  close(d.lambdaBehind * d.fBehind, 343);
  const still = W.dopplerSource({ fs: 500, v: 343, vs: 0 });
  close(still.fAhead, 500);
});

test('test_doppler_wavefront_spacing_ahead_is_one_minus_mach', () => {
  const f = W.wavefronts(0.4, 5.5);
  assert.equal(f.length, 6);
  // Leading edges of consecutive fronts, ahead of the source: spacing (1 − mach)λ₀.
  close((f[0].x + f[0].r) - (f[1].x + f[1].r), 0.6);
  close((f[1].x - f[1].r) - (f[0].x - f[0].r), 1.4);
});
