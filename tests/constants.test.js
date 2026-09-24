import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../site/js/physics/constants.js';

test('test_constants_match_alberta_data_sheet', () => {
  // Deliberately the rounded data-sheet values (docs/DECISIONS.md), not CODATA.
  assert.equal(C.g, 9.81);
  assert.equal(C.G, 6.67e-11);
  assert.equal(C.k, 8.99e9);
  assert.equal(C.e, 1.6e-19);
  assert.equal(C.c, 3.0e8);
  assert.equal(C.h, 6.63e-34);
  assert.equal(C.hEv, 4.14e-15);
  assert.equal(C.me, 9.11e-31);
  assert.equal(C.mp, 1.67e-27);
  assert.equal(C.mn, 1.67e-27);
  assert.equal(C.alphaMass, 6.65e-27);
  assert.equal(C.u, 1.66e-27);
  assert.equal(C.earthRadius, 6.37e6);
  assert.equal(C.earthMass, 5.97e24);
});

test('test_constants_earth_mass_per_course_sheet', () => {
  // Physics 30 sheet: 5.97 × 10²⁴ kg. Physics 20 formula sheet: 5.98 × 10²⁴ kg.
  assert.equal(C.earthMass, 5.97e24);
  assert.equal(C.earthMassP20, 5.98e24);
});
