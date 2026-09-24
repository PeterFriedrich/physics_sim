# TODO

The source of truth for what's left. Read first every session; update in place.

**Format contract** (`tools/todo_archive.py` depends on it): top-level items are
`- [ ]` / `- [x]` lines directly under `## Open work`; `###` sub-headings may
group them; closed items are moved to `docs/TODO_archive.md` by the tool, which
leaves a one-line stub under `## Done`. An open item can be stale — reproduce the
symptom before acting on it.

## Open work

### Before tutoring with it

- [ ] **Owner walkthrough of every sim against hand calculations.** SPEC_phase1.md §5 criterion 5: default settings for each sim, compute the readouts by hand with the data sheet, confirm they match. Done when each sim has a ✓ (or a bug filed) here.
- [ ] **Map sims to program-of-studies outcomes.** Units are matched by title only; the specific outcome codes (e.g. which General/Specific Outcome each sim serves) should be checked against the Alberta Education programs of study before they are shown on the page.

### More simulations (one per bullet; propose each first — CLAUDE.md)

- [ ] Physics 20 A: 1-D motion graphs (position–time, velocity–time, acceleration–time from a draggable object).
- [ ] Physics 20 A: vector addition / relative velocity (boat crossing a river).
- [ ] Physics 20 B: Newton's law of universal gravitation and g at altitude; Atwood machine / connected masses.
- [ ] Physics 20 C: work–energy on a track (roller coaster: E<sub>p</sub> ↔ E<sub>k</sub>, with friction toggle); Kepler's third law orbits.
- [ ] Physics 20 D: simple pendulum; standing waves and resonance in air columns; Doppler effect.
- [ ] Physics 30 B: velocity selector / mass spectrometer; electromagnetic induction (magnet through a coil); electric potential and equipotentials.
- [ ] Physics 30 C: double-slit interference and diffraction gratings; EM spectrum explorer.
- [ ] Physics 30 D: Bohr model energy levels and line spectra; nuclear reactions and mass defect.

### Tooling

- [ ] Promote `tools/verify-sims.js` to a CI job if UI regressions reach `main` (DECISIONS.md, merge-gate row).

## Done

Closed items moved out of `## Open work` live in **`docs/TODO_archive.md`** — one line each below, reasoning there.

- [x] **Enable GitHub Pages** — CLOSED 2026-09-24 · `docs/TODO_archive.md`
- [x] **Physics 30 A: 2-D collisions with vector momentum diagrams. `collisions2d` (SPEC_phase2.md).** · `docs/TODO_archive.md`
- [x] **Physics 30 B: Coulomb's law and electric fields; charge between parallel plates. `coulomb`, `plates` (SPEC_phase2.md).** · `docs/TODO_archive.md`
