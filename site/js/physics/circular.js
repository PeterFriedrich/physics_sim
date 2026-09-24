// Uniform circular motion (Physics 20 Unit C). Counter-clockwise, starting on +x.

export function uniformCircular({ r, T, m }) {
  const v = (2 * Math.PI * r) / T;
  const ac = (4 * Math.PI * Math.PI * r) / (T * T);
  return { v, ac, Fc: m * ac, f: 1 / T };
}

export function stateAt({ r, T }, t) {
  const theta = (2 * Math.PI * t) / T;
  const v = (2 * Math.PI * r) / T;
  return {
    theta,
    x: r * Math.cos(theta),
    y: r * Math.sin(theta),
    vx: -v * Math.sin(theta),
    vy: v * Math.cos(theta),
  };
}
