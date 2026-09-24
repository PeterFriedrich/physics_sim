import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as O from '../site/js/physics/oscillations.js';
import { g } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_spring_period_formula', () => {
  close(O.springPeriod(0.5, 20), 2 * Math.PI * Math.sqrt(0.025));
  close(O.pendulumPeriod(1, g), 2 * Math.PI * Math.sqrt(1 / g));
});

test('test_spring_mechanical_energy_conserved', () => {
  const s = { m: 0.8, k: 30, A: 0.15 };
  const T = O.springPeriod(s.m, s.k);
  for (let i = 0; i <= 20; i++) {
    const st = O.springState(s, (i / 20) * T);
    close(st.Ek + st.Ep, st.Et, 1e-12);
  }
});

test('test_spring_max_speed_at_equilibrium', () => {
  const s = { m: 2, k: 50, A: 0.3 };
  const st = O.springState(s, O.springPeriod(s.m, s.k) / 4);
  close(st.x, 0, 1e-12);
  close(Math.abs(st.v), O.maxSpeed(s));
  close(O.maxSpeed(s), 0.3 * 5);
});

test('test_spring_restoring_force_opposes_displacement', () => {
  const st = O.springState({ m: 1, k: 10, A: 0.2 }, 0);
  close(st.F, -2);
  close(st.a, -2);
});

test('test_pendulum_period_independent_of_mass_and_amplitude', () => {
  // L = 1.00 m on Earth: T = 2π√(L/g) = 2.01 s.
  assert.equal(O.pendulumPeriod(1, g).toPrecision(3), '2.01');
  const T = O.pendulumPeriod(1, g);
  for (const m of [0.1, 5]) for (const th of [5, 15]) close(O.pendulumState({ L: 1, m, thetaMaxDeg: th, g }, T).thetaDeg, th, 1e-9);
});

test('test_pendulum_restoring_force_toward_lowest_point', () => {
  const s = O.pendulumState({ L: 2, m: 0.5, thetaMaxDeg: 10, g }, 0);
  close(s.Frestore, -0.5 * g * Math.sin((10 * Math.PI) / 180));
  close(s.h, 2 * (1 - Math.cos((10 * Math.PI) / 180)));
  const q = O.pendulumState({ L: 2, m: 0.5, thetaMaxDeg: 10, g }, O.pendulumPeriod(2, g) / 4);
  close(q.thetaDeg, 0, 1e-9);
  close(q.Frestore, 0, 1e-9);
});
