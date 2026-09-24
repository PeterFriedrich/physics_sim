# Data sheets: what students have in front of them

Transcribed 2026-09-24 from the two sheets the owner supplied. Every constant
in `site/js/physics/constants.js` must match a value here, and each sim uses
its own course's sheet (`tests/constants.test.js`). When a sheet is updated,
update this file first, then the constants, then the tests.

## 1. Physics 30: Alberta Education data sheet ("Updated September 2017")

### 1.1 Constants

| Quantity | Value |
|---|---|
| Acceleration due to gravity near Earth | 9.81 m/s² |
| Gravitational constant G | 6.67 × 10⁻¹¹ N·m²/kg² |
| Radius of Earth | 6.37 × 10⁶ m |
| Mass of Earth | 5.97 × 10²⁴ kg |
| Elementary charge e | 1.60 × 10⁻¹⁹ C |
| Coulomb's law constant k | 8.99 × 10⁹ N·m²/C² |
| Electron volt | 1 eV = 1.60 × 10⁻¹⁹ J |
| Index of refraction of air | 1.00 |
| Speed of light in vacuum c | 3.00 × 10⁸ m/s |
| Planck's constant h | 6.63 × 10⁻³⁴ J·s = 4.14 × 10⁻¹⁵ eV·s |
| Atomic mass unit u | 1.66 × 10⁻²⁷ kg |

### 1.2 Particles

| Particle | Charge | Mass |
|---|---|---|
| Alpha particle | +2e | 6.65 × 10⁻²⁷ kg |
| Electron | −1e | 9.11 × 10⁻³¹ kg |
| Proton | +1e | 1.67 × 10⁻²⁷ kg |
| Neutron | 0 | 1.67 × 10⁻²⁷ kg |

The first-generation fermion table (electron and positron ~0.511 MeV/c²,
neutrinos < 2.2 eV/c², up quark +⅔e ~2.4 MeV/c², down quark −⅓e ~4.8 MeV/c²,
and their antiparticles) is also printed.

### 1.3 Equations printed (relevant to the sims)

- **Waves:** λ = d sin θ / n and λ = xd/(nl); n₂/n₁ = sin θ₁/sin θ₂ = v₁/v₂ = λ₁/λ₂; v = fλ; the Doppler formula.
- **Electricity and magnetism:** |F<sub>e</sub>| = kq₁q₂/r²; |E| = kq/r²; E = F<sub>e</sub>/q; |E| = ΔV/Δd; ΔV = ΔE/q; I = q/t; |F<sub>m</sub>| = I l<sub>⊥</sub> |B|; |F<sub>m</sub>| = q v<sub>⊥</sub> |B|.
- **Atomic physics:** W = hf₀; E = hf = hc/λ; E<sub>k,max</sub> = q<sub>e</sub>V<sub>stop</sub>; N = N₀(½)ⁿ.
- **Quantum and nuclear:** ΔE = Δmc²; E = pc; p = h/λ; Δλ = (h/mc)(1 − cos θ).
- **Not printed:** emf = BLv, V = kq/r, any hydrogen energy levels or the Rydberg constant. Questions give energy-level diagrams and nuclide masses when needed.

## 2. Physics 20: formula sheet supplied by the owner

### 2.1 Constants

| Quantity | Value |
|---|---|
| Gravitational field g | 9.81 m/s² or 9.81 N/kg |
| Gravitational constant G | 6.67 × 10⁻¹¹ N·m²/kg² |
| Mass of Earth | **5.98 × 10²⁴ kg** (the Physics 30 sheet says 5.97) |
| Radius of Earth | 6.37 × 10⁶ m |

### 2.2 Equations printed

- **Kinematics:** v = d/t; v<sub>f</sub>² = v<sub>i</sub>² + 2aΔd; Δd = v<sub>i</sub>t + ½at², Δd = v<sub>f</sub>t − ½at², Δd = ((v<sub>f</sub> + v<sub>i</sub>)/2)t; a = Δv/t.
- **Dynamics:** F<sub>net</sub> = ma; F<sub>f</sub> = μF<sub>N</sub>; F<sub>g</sub> = mg; F<sub>s</sub> = −kx.
- **Energetics:** W = ΔE; W = F<sub>∥</sub>d; P = W/t; E<sub>k</sub> = ½mv²; E<sub>pg</sub> = mgh; E<sub>s</sub> = ½kx²; efficiency = E<sub>out</sub>/E<sub>in</sub>.
- **Circular motion and gravitation:** v = 2πr/T; a<sub>c</sub> = v²/r = 4π²r/T²; F<sub>c</sub> = ma<sub>c</sub>; F<sub>g</sub> = GM₁m₂/r²; g = GM₁/r²; Kepler's third law, k = T₁²/R₁³ = T₂²/R₂³.
- **Waves and SHM:** f = cycles/time; T = time/cycles; f = 1/T; T = 2π√(m/k); T = 2π√(L/g); v = fλ; f = f<sub>s</sub>(v/(v ± v<sub>s</sub>)); f<sub>n</sub> = nf₀; L = n(0.5λ); L = n(0.25λ).

## 3. Consequences for the sims

- With the Physics 20 sheet, GM/R² at Earth's surface is 9.83 N/kg rather than the printed 9.81, and the geostationary radius is 4.23 × 10⁷ m. The Physics 20 gravity sims show those values, because they are what a student gets by hand (DECISIONS.md, Earth-mass row).
- Nuclide masses and energy-level values are "given" data on the relevant pages, labelled as such, because no sheet prints them (ARCHITECTURE.md §7).
