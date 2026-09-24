// Two masses joined by a light string over a frictionless, massless pulley
// (Physics 20 Unit B), released from rest.
//   'table':   m1 slides on a horizontal table (friction μ), m2 hangs off the edge.
//   'hanging': both hang (Atwood machine).
// Sign: a > 0 means m2 moves down. Teaching model: one μ serves for both
// "does it start?" and "while sliding", as Physics 20 problems usually give one.

export function connectedMasses({ m1, m2, mu = 0, mode, g }) {
  const M = m1 + m2;
  if (mode === 'hanging') {
    const a = ((m2 - m1) * g) / M;
    return { a, T: (2 * m1 * m2 * g) / M, Ff: 0, Fnet: M * a, moves: a !== 0 };
  }
  const pull = m2 * g;
  const FfMax = mu * m1 * g;
  if (pull <= FfMax) return { a: 0, T: pull, Ff: pull, Fnet: 0, moves: false };
  const a = (pull - FfMax) / M;
  return { a, T: m2 * (g - a), Ff: FfMax, Fnet: M * a, moves: true };
}
