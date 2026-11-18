// One-dimensional collisions (Physics 30 Unit A). +x is to the right.
// `e` is the coefficient of restitution: 1 elastic, 0 perfectly inelastic
// (the carts stick). Momentum is conserved for every e; kinetic energy only for e = 1.

export function collide1D({ m1, v1, m2, v2, e }) {
  const p = m1 * v1 + m2 * v2;
  const M = m1 + m2;
  return {
    v1f: (p + m2 * e * (v2 - v1)) / M,
    v2f: (p + m1 * e * (v1 - v2)) / M,
  };
}

export const momentum = (m, v) => m * v;
export const kineticEnergy = (m, v) => 0.5 * m * v * v;

// Time until the gap between cart 1's front face and cart 2's back face closes;
// Infinity if they never meet.
export function collisionTime({ gap, v1, v2 }) {
  const closing = v1 - v2;
  return closing > 0 ? gap / closing : Infinity;
}

// Explosion / recoil: two objects moving together at v0 are pushed apart, and
// cart 2's final velocity v2f is given (the bullet's muzzle velocity in a
// gun-and-bullet question). Momentum fixes cart 1's recoil. `apart` is false
// when v2f < v0, which would need the carts to pass through each other.
export function explode1D({ m1, m2, v0, v2f }) {
  const v1f = ((m1 + m2) * v0 - m2 * v2f) / m1;
  return { v1f, v2f, apart: v2f >= v0 };
}
