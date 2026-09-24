# Spec — Phase 2: Physics 30 depth (fields and 2-D momentum)

## 1. Goal

Deepen Physics 30 coverage where tutoring time goes: electrostatics (Unit B)
and two-dimensional momentum (Unit A). Physics 20 is unchanged and stays first
on the home page.

## 2. Scope

| Unit | Simulation (catalog id) | The student changes | The student reads off |
|---|---|---|---|
| 30 A Momentum and Impulse | 2-D collisions (`collisions2d`) | masses, speed, aim offset, elastic/inelastic | final speeds and directions; p<sub>x</sub>, p<sub>y</sub> before/after; tip-to-tail vector diagram |
| 30 B Forces and Fields | Coulomb's law and electric fields (`coulomb`) | up to three point charges (drag to move, µC) | separation, Coulomb force between 1 and 2, net force on each charge, E at a draggable probe |
| 30 B Forces and Fields | Charge between parallel plates (`plates`) | particle, entry speed, ΔV, plate gap and length, polarity | E = ΔV/d, F, a, time between plates, deflection or where it hits, exit velocity |

## 3. Acceptance criteria

Phase 1's criteria (SPEC_phase1.md §5) apply unchanged. In addition:

1. Vector answers are shown as magnitude **and** direction, with the direction
   convention written next to it (degrees from +x, counter-clockwise positive).
2. Gravity is neglected for charged particles and the page says so.
