// Every simulation the site hosts. The home page and the sim page both render
// from this list; tests/catalog.test.js checks that each entry has a module
// under js/sims/ exporting what sim-page.js needs.
//
// Units follow the Alberta Physics 20 and Physics 30 programs of study.

export const courses = [
  {
    id: 'p20',
    title: 'Physics 20',
    units: [
      { id: 'A', title: 'Kinematics' },
      { id: 'B', title: 'Dynamics' },
      { id: 'C', title: 'Circular Motion, Work, and Energy' },
      { id: 'D', title: 'Oscillatory Motion and Mechanical Waves' },
    ],
  },
  {
    id: 'p30',
    title: 'Physics 30',
    units: [
      { id: 'A', title: 'Momentum and Impulse' },
      { id: 'B', title: 'Forces and Fields' },
      { id: 'C', title: 'Electromagnetic Radiation' },
      { id: 'D', title: 'Atomic Physics' },
    ],
  },
];

export const sims = [
  {
    id: 'projectile',
    course: 'p20',
    unit: 'A',
    title: 'Projectile Motion',
    summary: 'Launch a ball at any speed, angle and height. Horizontal and vertical motion are independent.',
    concepts: ['2-D motion', 'vector components', 'range', 'time of flight'],
  },
  {
    id: 'motiongraphs',
    course: 'p20',
    unit: 'A',
    title: 'Motion Graphs',
    summary: 'Watch the position–time, velocity–time and acceleration–time graphs draw themselves as an object moves.',
    concepts: ['slope of x–t is v', 'area under v–t is Δx', 'uniform acceleration'],
  },
  {
    id: 'river',
    course: 'p20',
    unit: 'A',
    title: 'Crossing a River',
    summary: 'Steer a boat across a flowing river. Add the velocities tip to tail to find where it lands.',
    concepts: ['vector addition', 'relative velocity', 'components'],
  },
  {
    id: 'incline',
    course: 'p20',
    unit: 'B',
    title: 'Forces on an Incline',
    summary: 'A block on a ramp with friction. Build the free-body diagram and find the acceleration.',
    concepts: ['free-body diagrams', 'Newton’s second law', 'static vs kinetic friction'],
  },
  {
    id: 'circular',
    course: 'p20',
    unit: 'C',
    title: 'Uniform Circular Motion',
    summary: 'Swing a mass in a circle, then cut the string. Where does it go?',
    concepts: ['centripetal acceleration', 'period and frequency', 'Newton’s first law'],
  },
  {
    id: 'spring',
    course: 'p20',
    unit: 'D',
    title: 'Mass–Spring Oscillator',
    summary: 'Simple harmonic motion with live energy bars and a position–time graph.',
    concepts: ['Hooke’s law', 'period of SHM', 'conservation of energy'],
  },
  {
    id: 'superposition',
    course: 'p20',
    unit: 'D',
    title: 'Wave Pulses and Superposition',
    summary: 'Send two pulses toward each other and watch them add while they overlap.',
    concepts: ['superposition', 'constructive interference', 'destructive interference'],
  },
  {
    id: 'collisions',
    course: 'p30',
    unit: 'A',
    title: '1-D Collisions',
    summary: 'Collide two carts. Momentum is always conserved; kinetic energy only sometimes.',
    concepts: ['conservation of momentum', 'impulse', 'elastic vs inelastic'],
  },
  {
    id: 'collisions2d',
    course: 'p30',
    unit: 'A',
    title: '2-D Collisions',
    summary: 'A glancing collision between two discs, with the momentum vectors drawn tip to tail.',
    concepts: ['momentum components', 'vector diagrams', 'glancing collisions'],
  },
  {
    id: 'magnetic',
    course: 'p30',
    unit: 'B',
    title: 'Charge in a Magnetic Field',
    summary: 'Fire a proton, electron or alpha particle into a uniform magnetic field.',
    concepts: ['magnetic force', 'hand rules', 'circular path radius'],
  },
  {
    id: 'coulomb',
    course: 'p30',
    unit: 'B',
    title: 'Coulomb’s Law and Electric Fields',
    summary: 'Drag point charges around and watch the forces and the field respond.',
    concepts: ['Coulomb’s law', 'electric field', 'vector addition of forces'],
  },
  {
    id: 'plates',
    course: 'p30',
    unit: 'B',
    title: 'Charge Between Parallel Plates',
    summary: 'Fire an electron, proton or alpha particle between charged plates and measure the deflection.',
    concepts: ['uniform electric field', 'E = ΔV/d', 'deflection of charges'],
  },
  {
    id: 'refraction',
    course: 'p30',
    unit: 'C',
    title: 'Refraction and Snell’s Law',
    summary: 'Bend light between media and find the critical angle for total internal reflection.',
    concepts: ['Snell’s law', 'index of refraction', 'total internal reflection'],
  },
  {
    id: 'photoelectric',
    course: 'p30',
    unit: 'C',
    title: 'Photoelectric Effect',
    summary: 'Shine light on a metal and measure the ejected electrons’ energy.',
    concepts: ['photon energy', 'work function', 'stopping voltage'],
  },
  {
    id: 'halflife',
    course: 'p30',
    unit: 'D',
    title: 'Radioactive Decay and Half-Life',
    summary: 'Watch a sample of nuclei decay at random, and compare with the half-life curve.',
    concepts: ['half-life', 'random decay', 'exponential decrease'],
  },
];

export function findSim(id) {
  return sims.find((s) => s.id === id) ?? null;
}

export function unitOf(sim) {
  const course = courses.find((c) => c.id === sim.course);
  return { course, unit: course?.units.find((u) => u.id === sim.unit) };
}
