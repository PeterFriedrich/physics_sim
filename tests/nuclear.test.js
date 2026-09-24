import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as N from '../site/js/physics/nuclear.js';

test('test_nuclear_remaining_halves_each_half_life', () => {
  assert.equal(N.remaining(800, 0, 5), 800);
  assert.equal(N.remaining(800, 5, 5), 400);
  assert.equal(N.remaining(800, 15, 5), 100);
  assert.equal(N.halfLivesElapsed(15, 5), 3);
});

test('test_nuclear_decay_probability_compounds_to_one_half', () => {
  const p = N.decayProbability(1, 4);
  assert.ok(Math.abs(Math.pow(1 - p, 4) - 0.5) < 1e-12);
});

test('test_nuclear_random_decay_tracks_expected_curve', () => {
  const n0 = 20000;
  const alive = new Uint8Array(n0).fill(1);
  const rand = N.seededRandom(42);
  let left = n0;
  const T = 10;
  for (let step = 0; step < 100; step++) left -= N.stepDecay(alive, 0.1, T, rand);
  // After one half-life ~10 000 remain; 3σ for a binomial is ~210.
  assert.ok(Math.abs(left - n0 / 2) < 250, `left=${left}`);
  assert.equal(left, alive.reduce((a, b) => a + b, 0));
});

test('test_nuclear_seeded_random_is_reproducible', () => {
  const a = N.seededRandom(7);
  const b = N.seededRandom(7);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});
