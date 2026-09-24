# Decisions Index

Append-only. **One ROW per locked decision** — when, what, why (including what
was rejected), and a pointer to where the argument lives in full. When a decision
locks, add a row; when one is superseded, strike it (`~~...~~`) or mark it
`SUPERSEDED <date>` in place and add the successor — don't delete history.

**What a row owes you:**

1. ⚠️ **EVERY ROW CARRIES A POINTER TO A DOC** — not only to code. Code moves;
   the argument has to live somewhere prose can hold it.
   `scripts/check_doc_citations.py` checks that every pointer resolves.
2. **The row is a self-contained summary** and may paraphrase the argument.
3. **The pointer is the authority.** When a row and its target disagree, the
   target wins and the row gets fixed.
4. **A row names the test that protects it** (`test_x`, the ID opening a
   `test(...)` title in `tests/*.test.js`; `verify-x.js`; `check_x.py`), or
   carries `[unverifiable]`. `scripts/check_decisions_log.py` enforces this on
   the merge gate (and that a superseded row is marked where it stands).

| When | Decision | Full reasoning |
|------|----------|----------------|
| 2026-09-24 | **Physical constants are the Alberta data sheet values** (g = 9.81, h = 6.63 × 10⁻³⁴, e = 1.60 × 10⁻¹⁹ …), not CODATA. Students check readouts against hand calculations done with the data sheet; a more precise constant would make a correct student answer look wrong in the third significant figure. Protected by `test_constants_match_alberta_data_sheet`. | SPEC_phase1.md §5 |
| 2026-09-24 | **Static site, ES modules, no build step and no npm dependencies.** Deploys by copying `site/`; tests import the exact files the browser runs; nothing to upgrade. Rejected: a bundler + framework (React/Vite) — no feature here needs one, and it would put a toolchain between a tutor and a one-line fix. Protected by `test_catalog_every_sim_module_exports_page_contract` (loads every sim module under node). | ARCHITECTURE.md §1 |
| 2026-09-24 | **Closed-form motion wherever a closed form exists**, instead of numerical integration. Readouts then equal the kinematics equations exactly, with no step-size drift that a student could "catch" as a wrong answer. Protected by `test_projectile_lands_at_ground_level`, `test_fields_path_stays_on_circle_of_that_radius`. | ARCHITECTURE.md §4 |
| 2026-09-24 | **Every on-screen number traces to a tested function in `site/js/physics/`**; sim modules only wire controls and draw. No mechanical check that a sim does not compute a readout inline — review catches it. [unverifiable] | ARCHITECTURE.md §2 |
| 2026-09-24 | **Merge gate stays offline and dependency-free** (node:test + stdlib Python guards); the headless-browser smoke test `verify-sims.js` runs locally, not on the gate. Rejected for now: Playwright in CI — a browser download on every PR for a site this small. Revisit if UI regressions reach `main`. | ARCHITECTURE.md §6 |
| 2026-09-24 | **Workflow guards kept from cc-data-project-template in Python**, adapted (JS test IDs, `main`, `site/` as substantive); the loaded-path pytest ported to `node:test` so there is one test runner. Protected by `test_at_most_three_handoffs_at_top_level`, `check_decisions_log.py`. | ARCHITECTURE.md §6 |
| 2026-09-24 | **The photocurrent is a teaching model**, not a device model: current ∝ intensity, emitted energies uniform on [0, E<sub>k,max</sub>] under a retarding voltage. Gives the textbook threshold, saturation and stopping voltage. Protected by `test_photoelectric_current_zero_at_stopping_voltage_and_saturates`, `test_photoelectric_no_emission_below_threshold_at_any_intensity`. | ARCHITECTURE.md §7 |
| 2026-09-24 | **Deploy to GitHub Pages from `main`** via Actions, re-running the unit tests first. Needs the one-time Pages source setting; until then the deploy job fails without affecting the merge gate. [unverifiable] | ARCHITECTURE.md §6 |
| 2026-09-24 | **Phase 2 focuses on Physics 30** (owner's call): Coulomb's law and fields, charges between parallel plates, 2-D collisions; Physics 20 stays first on the home page. 2-D collisions model smooth discs with the impulse along the line of centres, and "perfectly inelastic" is the stick-together case, not e = 0. Protected by `test_collisions2d_momentum_conserved_in_both_components`, `test_collisions2d_stick_together_moves_off_along_original_line`. | SPEC_phase2.md §2 |
| 2026-09-24 | **Deploy-time cache busting**: `build-site.js` stamps assets with `?v=<content hash>` and writes an import map so every ES module (static and dynamic imports) is fetched by its hashed URL. Pattern taken from edmonton-tax-viz. Rejected: a `?v=` on the entry script alone (it doesn't reach nested imports), and a commit-sha version (it would discard the cache for unchanged files on every deploy). Protected by `test_build_site_every_module_is_in_the_import_map_with_its_content_hash`, and by `verify-sims.js` with `VERIFY_ROOT` failing on unversioned requests. | ARCHITECTURE.md §6 |
