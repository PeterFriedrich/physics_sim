# Spec — Phase 4: the rest of Physics 30

## 1. Goal

Cover the Physics 30 topics a tutor reaches for that phases 1 and 2 left out,
using only what is on the Physics 30 data sheet (DATA_SHEET.md §1). Proposed
in S02 and approved 2026-09-24, with the induction slot replaced by a
current-carrying wire in a field, because emf = BLv is not on the sheet.

## 2. Scope

Build order is top to bottom.

| Unit | Simulation (catalog id) | The student changes | The student reads off |
|---|---|---|---|
| 30 B Forces and Fields | Mass spectrometer (`massspec`) | ion, selector ΔV and plate gap, B₁, B₂ | E = ΔV/d; F<sub>e</sub> and F<sub>m</sub> in the selector; v = E/B₁; r = mv/(qB₂); landing distance 2r; ions at other speeds hitting the plates |
| 30 B Forces and Fields | Accelerating through a potential difference (`potential`) | particle, ΔV, gap d, probe position | ΔE = qΔV (J and eV); speed from rest from qΔV = ½mv²; E = ΔV/d; V at the probe; equipotential lines |
| 30 C Electromagnetic Radiation | Double slit and diffraction grating (`doubleslit`) | λ, d (or lines/mm), l, order n | bright-fringe angle θ and position x; λ = xd/(nl) and λ = d sin θ/n side by side; highest order |
| 30 D Atomic Physics | Energy levels and spectra (`energylevels`) | upper and lower level, emission or absorption | ΔE; photon f and λ; series; visible or not |
| 30 C Electromagnetic Radiation | Electromagnetic spectrum (`emspectrum`) | λ (log scale) | band, f = c/λ, E = hc/λ in J and eV |
| 30 B Forces and Fields | Current-carrying wire in a magnetic field (`wireforce`) | I, L, B, angle between wire and field, current and field direction | l<sub>⊥</sub>; F<sub>m</sub> = I l<sub>⊥</sub> B; force direction (into or out of the page) by hand rule |
| 30 D Atomic Physics | Nuclear decay equations (`reactions`) | parent nuclide and decay mode | balanced equation with charge and nucleon totals; Δm (u and kg); E = Δmc² (J and MeV) |

## 3. Teaching models

- **Mass spectrometer**: the selector's plates and B₁ are crossed so the
  forces oppose; ions enter along the axis. Ion masses are mass number × u,
  as Diploma questions usually give them.
- **Potential**: the particle starts from rest; non-relativistic, and gravity
  is neglected. Only the uniform field between plates is used, because V = kq/r
  is not on the sheet.
- **Double slit**: λ = xd/(nl) is the small-angle form. The page shows it next
  to the exact λ = d sin θ/n and says when they differ (large angles, gratings).
  The drawn intensity pattern ignores the single-slit envelope.
- **Energy levels**: the hydrogen level values are printed on the page as
  *given* data, as a Diploma question would supply them. No sheet has them.
- **EM spectrum**: band boundaries are approximate and labelled so.
- **Wire in a field**: B lies in the page, the wire lies in the page at angle θ
  to B, so the force points into or out of the page. Current is conventional;
  the page shows both hand rules.
- **Nuclear decay**: atomic masses in u are *given* data with a source label.
  With atomic masses, the electrons cancel for β⁻; β⁺ subtracts two electron
  masses; γ takes its energy as given.

## 4. Acceptance criteria

Phase 1's criteria (SPEC_phase1.md §5) apply unchanged, plus phase 2's
direction-convention rule (SPEC_phase2.md §3).
