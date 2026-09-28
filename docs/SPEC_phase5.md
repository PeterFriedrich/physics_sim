# Spec — Phase 5: photon momentum, induction, quarks

## 1. Goal

Build the three candidates left in TODO.md after phase 4, using only what is
on the Physics 30 data sheet (DATA_SHEET.md §1). Proposed and approved
2026-09-28. Owner's calls: Compton scattering sits in Unit C; the quark sim
covers charge conservation only (no baryon or lepton number); the quark page
carries a short note comparing quark masses with the proton's.

## 2. Scope

Build order is top to bottom.

| Unit | Simulation (catalog id) | The student changes | The student reads off |
|---|---|---|---|
| 30 C Electromagnetic Radiation | Compton scattering (`compton`) | incident λ (pm), scattering angle θ | h/mc; Δλ and λ′; p = h/λ before and after; E = hc/λ = pc before and after (eV); electron E<sub>k</sub> = E − E′; electron momentum and recoil angle from a tip-to-tail momentum diagram |
| 30 B Forces and Fields | Induction: magnet and coil (`induction`) | pole facing the coil, push in / pull out / hold still, speed | flux increasing, decreasing or unchanged; the induced pole at the magnet's end of the coil; current direction on the drawn coil and seen from the magnet; galvanometer needle side; whether the coil pushes or pulls the magnet. **No numeric emf** |
| 30 D Atomic Physics | Quarks and fermions (`particles`) | up to three quarks or antiquarks (u, d, ū, d̄); β⁻ or β⁺ at the quark level | total charge; baryon, meson or not a hadron; names for the common ones (p, n, π⁺ …); d → u + e⁻ + ν̄<sub>e</sub> and u → d + e⁺ + ν<sub>e</sub> with charge balanced |

## 3. Teaching models

- **Compton**: the electron starts free and at rest; the photon comes in
  along +x. Every number comes from p = h/λ, E = pc and
  Δλ = (h/mc)(1 − cos θ) with the sheet's constants, so λ<sub>C</sub> = 2.43 pm.
  The page shows the electron's energy and momentum but not its speed: recoil
  electrons can be relativistic, and ½mv² would be wrong.
- **Induction**: direction logic only, because emf = BLv is not on the sheet.
  The magnet moves along the coil's axis; the coil is treated as one loop at
  its centre for the needle's *relative* size (flux of a point dipole on the
  axis, ∝ (1 + s²)<sup>−3/2</sup>), which is never shown as a number.
- **Quarks**: first generation only. Charge is conserved; baryon and lepton
  number are out of scope (owner's call). Masses are the sheet's approximate
  values; the note that uud adds up to about 1 % of the proton's mass uses
  m<sub>p</sub> from the sheet (939 MeV/c² with the sheet's constants).

## 4. Acceptance criteria

Phase 1's criteria (SPEC_phase1.md §5) apply unchanged, plus phase 2's
direction-convention rule (SPEC_phase2.md §3).
