# Architecture

## 1. Shape

A static site with no build step and no dependencies. ES modules are served
as-is from `site/`, so GitHub Pages (or any static host) can publish the folder
directly, and tests import the same files the browser runs.

```
site/
├── index.html            home: renders the catalog
├── sim.html              one page for every sim: ?id=<catalog id>
├── css/style.css         tokens (light + dark), layout
└── js/
    ├── catalog.js        courses, units, sims — the single list
    ├── home.js           home page renderer
    ├── sim-page.js       loads js/sims/<id>.js into sim.html
    ├── physics/          pure functions, SI units, no DOM   ← tested
    ├── lib/              canvas, controls, clock, format, colour
    └── sims/             one module per simulation: UI + drawing only
tests/                    node:test — physics, format, catalog, repo invariants
tools/                    serve.js (dev server), verify-sims.js (browser smoke test)
scripts/                  Python guards from the workflow template (stdlib only)
```

## 2. Layers and what each may do

| Layer | May | May not |
|---|---|---|
| `physics/` | maths, constants | touch the DOM, format numbers, know about pixels |
| `lib/` | DOM, canvas, formatting | contain physics formulas |
| `sims/` | wire controls → physics → drawing | compute a readout without a physics function |
| `catalog.js` | list sims and units | import sim modules |

The rule that matters: **a number on screen traces to a tested physics
function.** Rendering code can be wrong-looking; it cannot be wrong-valued.

## 3. The sim page contract

`sim-page.js` imports `js/sims/<id>.js` and expects:

- `equations`: `[{ html, what }]` — shown under "Key equations".
- `prompts`: `[html]` — shown under "Try this" (at least three).
- `legend` (optional): `[{ color, label }]`, `color` naming a `--c-*` token.
- `tallOnMobile` (optional): `true` gives the canvas a portrait aspect on phones
  for sims that stack two views.
- `mount(ui)`: builds the sim into `ui = { canvas, controls, readouts, transport }`.

`tests/catalog.test.js` checks every catalog entry against this contract, and
that no module in `sims/` is missing from the catalog.

## 4. Time and drawing

`lib/clock.js` runs one `requestAnimationFrame` loop per page. Simulated time
advances only while playing (times the speed setting); the frame callback runs
every frame regardless, so a paused sim still redraws when a slider moves.
Sims read control values each frame rather than keeping derived state, except
where a change must restart the run (`onChange` → reset).

Positions come from closed-form solutions of `t` wherever one exists
(projectile, SHM, circular motion, charge in B field, collisions). Only the
photoelectric electrons and the random decay step incrementally, and neither
feeds a readout: the readouts use the closed forms.

## 5. Theming

Colours are CSS custom properties on `:root`, redefined for dark mode.
`lib/canvas.js` `theme()` reads them so canvas drawing follows the page theme.
Vector colours are shared across sims so students learn one code.

## 6. Verification and deployment

- **Merge gate (`.github/workflows/tests.yml`)**: `node --test` plus the two
  Python doc guards. Offline, secret-free, dependency-free, so it cannot flake
  on an upstream outage and never gets ignored.
- **Browser smoke test (`tools/verify-sims.js`)**: headless Chromium over every
  page. Not on the gate — it needs a browser download there — so it is run
  locally before merging UI work (`npm run verify`). If UI regressions start
  slipping through, promote it to its own CI job rather than weakening it.
- **Deploy (`.github/workflows/deploy.yml`)**: on push to `main`, re-runs the
  unit tests and publishes `site/` to GitHub Pages. One-time setup: repository
  Settings → Pages → Source: *GitHub Actions*.
- The workflow guards stay in Python (stdlib only, no `pip install`) as they
  came from the template; the one pytest file was ported to `node:test` so the
  repo has a single test runner.

## 7. Teaching models (deliberate simplifications)

Each is stated in the code where it lives and flagged to the student where it
could mislead.

- **Photocurrent** (`physics/photoelectric.js`): current ∝ intensity; with a
  retarding voltage, emitted kinetic energies are taken as uniform on
  [0, E<sub>k,max</sub>]. It reproduces the textbook I–V shape and threshold; it
  is not a device model.
- **Work functions** are typical textbook values; sources differ in the second
  decimal, so the slider lets a tutor match their textbook.
- **Alpha particle mass** 6.65 × 10⁻²⁷ kg (≈ 4 u), not on the data sheet.
- **Incline**: the block is released from rest, and μ<sub>k</sub> is clamped to
  μ<sub>s</sub> so a mis-set slider cannot make friction accelerate it uphill.
- **2-D collisions** (`physics/momentum2d.js`): smooth, frictionless discs, so
  the impulse acts only along the line of centres at contact; the target
  starts at rest. "Perfectly inelastic" means the discs lock together, a
  separate case from restitution e = 0 (which would still let them slide apart).
- **Charges between plates**: gravity neglected (the page says so); fields
  outside the plates are taken as zero.
- **Arrow lengths** saturate (`lib/canvas.js` `vecLen`), so direction is exact
  and magnitude is only qualitative; the readouts carry the size. The incline's
  free-body diagram is the exception: its arrows are to scale with each other.
