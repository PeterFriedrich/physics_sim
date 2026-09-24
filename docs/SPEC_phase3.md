# Spec — Phase 3: Physics 20 depth

## 1. Goal

Cover the rest of the Physics 20 topics a tutor reaches for, one simulation
each, on top of phase 1's one-per-unit set. Proposed and approved 2026-09-24.

## 2. Scope

| Unit | Simulation (catalog id) | The student changes | The student reads off |
|---|---|---|---|
| 20 A Kinematics | Motion graphs (`motiongraphs`) | x<sub>i</sub>, v<sub>i</sub>, a | x–t, v–t, a–t graphs; tangent slope = v; area under v–t = Δx; distance vs displacement; turnaround time |
| 20 A Kinematics | Crossing a river (`river`) | boat speed, current, heading, river width | resultant speed and direction, crossing time, drift, heading that lands straight across |
| 20 B Dynamics | Universal gravitation (`gravitation`) | two masses and r; or altitude above Earth | F<sub>g</sub> = Gm₁m₂/r², F at 2r; g at altitude, g/g<sub>surface</sub>, weight |
| 20 B Dynamics | Connected masses (`atwood`) | m₁, m₂, table (with μ) or Atwood | a, tension, friction, F<sub>net</sub>, distance and speed; free-body diagrams |
| 20 C Circular Motion, Work, and Energy | Energy on a track (`coaster`) | release height, mass, friction force | E<sub>p</sub>, E<sub>k</sub>, W<sub>f</sub> = F<sub>f</sub>d summing to mgh₀; speed at the first dip; whether it clears the 14 m hill |
| 20 C Circular Motion, Work, and Energy | Satellite orbits (`orbits`) | altitudes of satellites A and B | r, v, T, T²/r³ for each; geostationary altitude |
| 20 D Oscillatory Motion and Mechanical Waves | Simple pendulum (`pendulum`) | length, mass, amplitude (≤ 15°), gravity | T, f, θ, restoring force; T vs l graph |
| 20 D Oscillatory Motion and Mechanical Waves | Resonance in air columns (`aircolumn`) | closed/open pipe, L, resonance n, v | λ, f, which harmonic, f₁, resonant lengths at this f; nodes and antinodes |
| 20 D Oscillatory Motion and Mechanical Waves | Doppler effect (`doppler`) | f<sub>s</sub>, v<sub>s</sub>, v | f and λ ahead and behind |

## 3. Teaching models

Each is stated in the physics module's header comment and on the page where a
student could be misled (see ARCHITECTURE.md §7).

- **Motion graphs** use sliders, not a dragged object: readouts from a dragged
  object would be finite differences of noisy input that no hand calculation
  matches.
- **Energy on a track**: friction is a constant force opposing the motion, so
  W<sub>f</sub> = F<sub>f</sub>d with d the distance travelled. The car's
  position along the curved track is stepped in time (no closed form exists);
  every readout comes from the energy equation at that position.
- **Pendulum**: small-angle closed form, amplitude capped at 15° (period error
  under 0.5 %). The restoring-force arrow has its own scale and says so.
- **Orbits** are circular and around Earth only, so every constant is on the
  data sheet.
- **Doppler**: moving source, stationary listener, v<sub>s</sub> < v — the
  cases the Physics 20 formula covers. Wavefronts are drawn slowed down.
- **Connected masses**: one μ serves for "does it start?" and "while sliding".
- **Speed of sound** is a slider defaulting to 343 m/s, since textbooks differ.
- Moon (1.62 m/s²) and Mars (3.71 m/s²) gravity are textbook values, not data
  sheet values, as in the projectile sim.

## 4. Acceptance criteria

Phase 1's criteria (SPEC_phase1.md §5) apply unchanged.
