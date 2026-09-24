# Spec — Phase 1: one simulation per course unit

## 1. Goal

A tutor (or student) opens a link, picks a Physics 20 or Physics 30 topic, and
gets an interactive simulation that makes the concept visible and whose numbers
can be checked against a hand calculation. Phase 1 covers every unit of both
courses with at least one simulation.

## 2. Audience and use

- **Tutor-led:** screen-shared or on a tablet during a session. The tutor sets
  up a situation, asks the student to predict, then plays it.
- **Student alone:** the "Try this" prompts on each page give a predict →
  check → explain sequence without a tutor.
- Devices: laptop and phone/tablet browsers. Light and dark mode.

## 3. Scope

| Course | Unit | Simulation (catalog id) |
|---|---|---|
| Physics 20 | A Kinematics | Projectile motion (`projectile`) |
| Physics 20 | B Dynamics | Forces on an incline (`incline`) |
| Physics 20 | C Circular Motion, Work, and Energy | Uniform circular motion (`circular`) |
| Physics 20 | D Oscillatory Motion and Mechanical Waves | Mass–spring oscillator (`spring`), pulse superposition (`superposition`) |
| Physics 30 | A Momentum and Impulse | 1-D collisions (`collisions`) |
| Physics 30 | B Forces and Fields | Charge in a magnetic field (`magnetic`) |
| Physics 30 | C Electromagnetic Radiation | Refraction and Snell's law (`refraction`), photoelectric effect (`photoelectric`) |
| Physics 30 | D Atomic Physics | Radioactive decay and half-life (`halflife`) |

Out of scope for phase 1: accounts, saved progress, a backend, worked-solution
generation, and any claim of alignment to specific outcome codes (units are
mapped by unit title only — see `TODO.md`).

## 4. Every simulation page must have

1. A canvas view with play/pause, reset and slow-motion where anything moves.
2. Controls for every variable the unit's equations use, with units shown.
3. Readouts of the quantities a student would calculate, in significant
   figures and scientific notation written the way students write it.
4. A "Key equations" list and at least three "Try this" prompts.
5. Vectors in the site-wide colours (velocity blue, acceleration orange, force
   magenta; gravity / normal / friction have their own).

## 5. Acceptance criteria

1. Every readout comes from a function in `site/js/physics/` with a unit test
   that checks it against the textbook equation or a worked example.
2. Physical constants are the Alberta data sheet values (`constants.js`).
3. `npm run check` passes (unit tests + doc guards) on the merge gate.
4. `npm run verify` loads every page at 390 px and 1280 px, light and dark,
   with no console errors, no blank canvas and no horizontal scroll.
5. A human has looked at each sim's screenshot and the numbers on screen agree
   with a hand calculation for the default settings.
