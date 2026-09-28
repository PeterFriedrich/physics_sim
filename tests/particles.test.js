import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hadron, protonMeV, BETA, chargeThirds, quarkMassPercent } from '../site/js/physics/particles.js';

test('test_particles_nucleons_from_quarks', () => {
  assert.deepEqual(hadron(['u', 'u', 'd']), { thirds: 3, kind: 'baryon', name: 'proton (p)', quarkMeV: 9.6 });
  assert.equal(hadron(['d', 'u', 'd']).name, 'neutron (n)');
  assert.equal(hadron(['d', 'u', 'd']).thirds, 0);
  assert.equal(hadron(['ubar', 'ubar', 'dbar']).thirds, -3);
  assert.equal(hadron(['ubar', 'ubar', 'dbar']).kind, 'antibaryon');
});

test('test_particles_mesons_and_non_hadrons', () => {
  const pi = hadron(['u', 'dbar']);
  assert.deepEqual([pi.thirds, pi.kind, pi.name, pi.quarkMeV.toFixed(1)], [3, 'meson', 'pion (π⁺)', '7.2']);
  assert.equal(hadron(['ubar', 'd']).name, 'pion (π⁻)');
  assert.equal(hadron(['u', 'u']).kind, 'not a hadron');
  assert.equal(hadron(['u', 'u']).name, null);
  assert.equal(hadron(['u', 'd', 'dbar']).kind, 'not a hadron');
  assert.equal(hadron(['u']).kind, 'not a hadron');
});

test('test_particles_beta_decay_conserves_charge', () => {
  for (const mode of ['minus', 'plus']) {
    for (const level of ['quark', 'nucleon']) {
      const { before, after } = BETA[mode][level];
      assert.equal(chargeThirds(before), chargeThirds(after), `${mode} ${level}`);
    }
  }
});

test('test_particles_quarks_are_a_percent_of_the_proton_mass', () => {
  // mₚc² = 1.67e-27 × (3.00e8)² / 1.60e-19 J/eV = 939 MeV with sheet values.
  assert.equal(protonMeV.toPrecision(3), '939');
  // uud: 9.6 / 939 = 1.0 %; udd: 12.0 / 939 = 1.3 %.
  assert.equal(quarkMassPercent(hadron(['u', 'u', 'd']).quarkMeV).toFixed(1), '1.0');
  assert.equal(quarkMassPercent(hadron(['u', 'd', 'd']).quarkMeV).toFixed(1), '1.3');
});
