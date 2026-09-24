import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Gr from '../site/js/physics/gravitation.js';
import { G, earthMass, earthRadius } from '../site/js/physics/constants.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${a} ≠ ${b}`);

test('test_gravitation_force_between_two_people', () => {
  // Two 70.0 kg people 1.00 m apart: F = Gm₁m₂/r² = 3.27 × 10⁻⁷ N.
  close(Gr.gravForce(70, 70, 1), 3.2683e-7, 1e-4);
  // Inverse square: double r, quarter F.
  close(Gr.gravForce(5, 8, 4), Gr.gravForce(5, 8, 2) / 4);
});

test('test_gravitation_surface_field_rounds_to_data_sheet_g', () => {
  // GM/R² with data sheet values is 9.813…, which a student writes as 9.81 N/kg.
  assert.equal(Gr.earthFieldAtAltitude(0).toPrecision(3), '9.81');
  close(Gr.earthFieldAtAltitude(earthRadius), Gr.earthFieldAtAltitude(0) / 4);
});

test('test_orbits_kepler_constant_same_for_every_radius', () => {
  const K = (4 * Math.PI * Math.PI) / (G * earthMass);
  for (const r of [6.77e6, 2.0e7, 4.22e7]) close(Gr.circularOrbit(earthMass, r).keplerK, K);
  const o = Gr.circularOrbit(earthMass, 6.77e6);
  close(o.T, (2 * Math.PI * 6.77e6) / o.v);
  close(o.ac, Gr.gravField(earthMass, 6.77e6));
});

test('test_orbits_geostationary_radius', () => {
  // T = 24.0 h gives r = 4.22 × 10⁷ m (about 35 800 km up).
  const r = Gr.orbitRadiusForPeriod(earthMass, 86400);
  assert.equal(r.toPrecision(3), '4.22e+7');
  close(Gr.circularOrbit(earthMass, r).T, 86400);
});
