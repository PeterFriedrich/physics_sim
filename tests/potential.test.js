import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../site/js/physics/potential.js';
import { e, me, mp } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b), 1e-300), `${a} ≠ ${b}`);

test('test_potential_energy_gained_is_q_delta_v', () => {
  // An electron through 250 V gains 250 eV = 4.00 × 10⁻¹⁷ J.
  close(P.energyGained(-e, 250), 4e-17);
  close(P.energyGained(-e, 250) / e, 250);
});

test('test_potential_speed_from_rest', () => {
  // ½mv² = qΔV → v = √(2qΔV/m): electron through 250 V ≈ 9.37 × 10⁶ m/s.
  const v = P.speedFromRest(-e, me, 250);
  close(0.5 * me * v * v, e * 250);
  assert.equal(v.toPrecision(3), '9.37e+6');
  // A proton through the same ΔV gains the same energy but is far slower.
  close(P.speedFromRest(e, mp, 250) / v, Math.sqrt(me / mp));
});

test('test_potential_uniform_field_between_plates', () => {
  close(P.potentialAt(0, 0.05, 300), 0);
  close(P.potentialAt(0.05, 0.05, 300), 300);
  close(P.potentialAt(0.02, 0.05, 300), 120);
  close(P.speedAfter(-e, me, 300, 0.05, 0.05), P.speedFromRest(-e, me, 300));
});

test('test_potential_crossing_time_matches_kinematics', () => {
  // Average speed from rest is v/2, so t = 2d/v.
  const t = P.crossingTime(-e, me, 250, 0.04);
  const v = P.speedFromRest(-e, me, 250);
  close(t, (2 * 0.04) / v);
  close(P.distanceAt(-e, me, 250, 0.04, t), 0.04);
  close(P.distanceAt(-e, me, 250, 0.04, t / 2), 0.01);
});
