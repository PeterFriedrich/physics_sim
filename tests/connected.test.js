import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectedMasses } from '../site/js/physics/connected.js';
import { g } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_connected_table_with_friction', () => {
  // 4.0 kg on the table (μ = 0.20), 2.0 kg hanging:
  // a = (m₂g − μm₁g)/(m₁ + m₂) = 1.96 m/s², T = m₂(g − a) = 15.7 N.
  const r = connectedMasses({ m1: 4, m2: 2, mu: 0.2, mode: 'table', g });
  close(r.a, (2 * g - 0.2 * 4 * g) / 6);
  close(r.T, 2 * (g - r.a));
  close(r.Ff, 0.2 * 4 * g);
  // The table mass alone: T − F_f = m₁a.
  close(r.T - r.Ff, 4 * r.a);
});

test('test_connected_table_stays_at_rest_when_friction_holds', () => {
  const r = connectedMasses({ m1: 4, m2: 2, mu: 0.6, mode: 'table', g });
  assert.equal(r.moves, false);
  assert.equal(r.a, 0);
  close(r.Ff, 2 * g);
  close(r.T, 2 * g);
});

test('test_connected_atwood_machine', () => {
  // 3.0 kg and 5.0 kg: a = (m₂ − m₁)g/(m₁ + m₂) = 2.45 m/s², T = 2m₁m₂g/(m₁ + m₂) = 36.8 N.
  const r = connectedMasses({ m1: 3, m2: 5, mode: 'hanging', g });
  close(r.a, (2 * g) / 8);
  close(r.T, (30 * g) / 8);
  close(5 * g - r.T, 5 * r.a);
  close(r.T - 3 * g, 3 * r.a);
  // Heavier side on the left: m2 rises.
  assert.ok(connectedMasses({ m1: 5, m2: 3, mode: 'hanging', g }).a < 0);
  assert.equal(connectedMasses({ m1: 4, m2: 4, mode: 'hanging', g }).a, 0);
});
