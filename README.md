# physics_sim

Interactive simulations for tutoring **Alberta Physics 20 and Physics 30**.
Each sim shows the concept, lets the student change the variables, and prints
readouts computed with the course data sheet constants, so the numbers match a
hand calculation.

| Course | Unit | Simulations |
|---|---|---|
| Physics 20 | A Kinematics | Projectile motion |
| | B Dynamics | Forces on an incline (friction, free-body diagram) |
| | C Circular Motion, Work, and Energy | Uniform circular motion ("cut the string") |
| | D Oscillatory Motion and Mechanical Waves | Mass–spring SHM with energy bars; pulse superposition |
| Physics 30 | A Momentum and Impulse | 1-D collisions (elastic / inelastic / stick); 2-D glancing collisions with vector diagrams |
| | B Forces and Fields | Coulomb's law and electric fields (drag the charges); charge between parallel plates; charged particle in a magnetic field |
| | C Electromagnetic Radiation | Refraction and Snell's law; photoelectric effect |
| | D Atomic Physics | Radioactive decay and half-life |

Every page has a "Key equations" list and "Try this" predict-and-check prompts.

## Run it

No install and no build step: plain HTML, CSS and ES modules.

```bash
./bootstrap.sh     # enables the git hooks, runs the tests
npm run serve      # http://localhost:8000
```

(Opening `site/index.html` straight from disk does not work: browsers block ES
modules on `file://`.)

## Check it

```bash
npm run check      # unit tests + doc guards (the CI merge gate)
npm run verify     # every page in headless Chromium; screenshots in output/
VERIFY_WIDTHS=390,1280 VERIFY_THEME=dark npm run verify
```

## Deploy

`.github/workflows/deploy.yml` builds `site/` with `tools/build-site.js`,
which cache-busts every asset so visitors never get a half-old site, and
publishes it to GitHub Pages on every push to `main` after re-running the tests. Enable it once: repository **Settings →
Pages → Source: GitHub Actions**.

## Working on it

The project follows the workflow from
[cc-data-project-template](https://github.com/PeterFriedrich/cc-data-project-template),
minus the data-specific parts: spec → architecture → one module at a time with
tests, a decisions log whose rows cite tests, `/handoff` notes between
sessions, and a pre-push hook that refuses to push to an already-merged branch.
Start with `CLAUDE.md`, `CONTRIBUTING.md` and `TODO.md`.

Not affiliated with Alberta Education.
