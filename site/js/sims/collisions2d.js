import { collide2D, contactGeometry, contactTime } from '../physics/momentum2d.js';
import { momentum, kineticEnergy } from '../physics/momentum.js';
import { magnitude, directionDeg } from '../physics/vectors.js';
import { fitCanvas, makeView, theme, clear, grid, arrow, line, text, subText } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

// Table and vector diagram stack on phones.
export const tallOnMobile = true;

export const equations = [
  { html: 'Σp<sub>x</sub> before = Σp<sub>x</sub> after', what: 'conserve each component separately' },
  { html: 'Σp<sub>y</sub> before = Σp<sub>y</sub> after', what: '' },
  { html: 'p<sub>x</sub> = p cos θ, &nbsp; p<sub>y</sub> = p sin θ', what: 'resolve each momentum vector' },
  { html: 'p⃗<sub>1</sub> = p⃗<sub>1</sub>′ + p⃗<sub>2</sub>′', what: 'tip-to-tail: the after-vectors close the triangle' },
];

export const prompts = [
  'Hit off-centre. Before looking at the readouts, sketch the tip-to-tail momentum diagram.',
  'Equal masses, elastic: measure the angle between the two outgoing paths. Try several aims.',
  'Use the readouts for disc 1 after the collision to calculate disc 2’s velocity by components. Check it.',
  'Aim above the centre of disc 2. Which way does disc 2 go? Why along that line?',
  'Make them stick together. Where is the momentum triangle now?',
];

export const legend = [
  { color: 'series-a', label: 'disc 1' },
  { color: 'series-b', label: 'disc 2' },
  { color: 'total', label: 'total momentum' },
];

const R = 0.1; // disc radius, m
const X0 = -1.0; // disc 1 start
const TABLE = { xMin: -1.15, xMax: 1.15, yMin: -0.75, yMax: 0.75 };
const TYPES = [
  { value: 'elastic', label: 'Elastic (Ek conserved)' },
  { value: 'inelastic', label: 'Inelastic (some Ek lost)' },
  { value: 'stick', label: 'Perfectly inelastic (stick together)' },
];

// "3.00 m/s at 25.0° above +x"
function polar(x, y, unit, scale) {
  const m = snap(magnitude(x, y), scale);
  if (m === 0) return `0 ${unit}`;
  const d = directionDeg(x, y);
  const signed = d > 180 ? d - 360 : d;
  const a = Math.abs(snap(signed, 180));
  const where = a === 0 ? 'along +x' : `at ${fmt(a, 3)}° ${signed > 0 ? 'above' : 'below'} +x`;
  return `${fmt(m)}${unit ? ` ${unit}` : ''} ${where}`;
}

export function mount(ui) {
  const d1 = section(ui.controls, 'Disc 1 (moving)');
  const m1 = slider(d1, { label: 'Mass m<sub>1</sub>', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg' });
  const v1 = slider(d1, { label: 'Speed v<sub>1</sub>', min: 0.5, max: 4, step: 0.1, value: 2, unit: 'm/s' });
  const b = slider(d1, { label: 'Aim offset (+ = above centre)', min: -19, max: 19, step: 1, value: 10, unit: 'cm' });
  const d2 = section(ui.controls, 'Disc 2 (at rest)');
  const m2 = slider(d2, { label: 'Mass m<sub>2</sub>', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg' });
  const kind = section(ui.controls, 'Collision');
  const type = choice(kind, { label: 'Type', options: TYPES, value: 'elastic' });

  const out = readouts(ui.readouts, [
    { id: 'v1f', label: 'v<sub>1</sub>′' },
    { id: 'v2f', label: 'v<sub>2</sub>′' },
    { id: 'pb', label: 'Σp' },
    { id: 'pa', label: 'Σp′' },
    { id: 'pxy', label: 'Σp<sub>x</sub>′, Σp<sub>y</sub>′' },
    { id: 'ek', label: 'ΣE<sub>k</sub> → ΣE<sub>k</sub>′' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Primes are after the collision; momentum in kg·m/s. Discs are 20 cm across; the impulse acts along the line joining their centres at contact.</p>');

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  [m1, v1, b, m2, type].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const bm = b.value / 100;
    const s = { m1: m1.value, v1: v1.value, m2: m2.value, b: bm, R, e: type.value === 'elastic' ? 1 : 0.5, stick: type.value === 'stick' };
    const r = collide2D(s);
    const tc = contactTime({ x0: X0, v1: s.v1, b: bm, R });
    const g = contactGeometry(bm, R);

    let p1;
    let p2;
    if (clk.t < tc) {
      p1 = { x: X0 + s.v1 * clk.t, y: bm };
      p2 = { x: 0, y: 0 };
    } else {
      const dt = clk.t - tc;
      p1 = { x: g.x1 + r.v1f.x * dt, y: g.y1 + r.v1f.y * dt };
      p2 = { x: r.v2f.x * dt, y: r.v2f.y * dt };
    }
    const off = (p) => Math.abs(p.x) > TABLE.xMax + R || Math.abs(p.y) > TABLE.yMax + R;
    if (clk.running && ((off(p1) && (off(p2) || !r.hit)) || clk.t > 12)) clk.pause();

    clear(ctx, w, h);
    const narrow = w < 560;
    const tableRect = narrow ? { w, h: h * 0.52 } : { w: w * 0.62, h };
    const view = makeView(tableRect, TABLE, { pad: 12 });
    grid(ctx, view, TABLE, 0.25);
    line(ctx, view.px(TABLE.xMin), view.py(bm), view.px(0), view.py(bm), { color: th.grid, width: 1.5, dash: [5, 5] });

    const disc = (p, color, label) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(view.px(p.x), view.py(p.y), R * view.sx, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, label, view.px(p.x), view.py(p.y), { color: '#fff', size: 12, weight: 700, align: 'center' });
    };
    // Trails from the contact point.
    if (clk.t >= tc && r.hit) {
      line(ctx, view.px(g.x1), view.py(g.y1), view.px(p1.x), view.py(p1.y), { color: th.seriesA, width: 2, dash: [4, 4] });
      line(ctx, view.px(0), view.py(0), view.px(p2.x), view.py(p2.y), { color: th.seriesB, width: 2, dash: [4, 4] });
    }
    disc(p2, th.seriesB, '2');
    disc(p1, th.seriesA, '1');
    if (!r.hit) text(ctx, 'Miss — aim within ±20 cm of disc 2’s centre.', 12, 18, { color: th.muted, size: 13 });

    // Momentum vector diagram: before (p1 alone) vs after (p1′ then p2′, tip to tail).
    const pb = { x: momentum(s.m1, s.v1), y: 0 };
    const q1 = { x: momentum(s.m1, r.v1f.x), y: momentum(s.m1, r.v1f.y) };
    const q2 = { x: momentum(s.m2, r.v2f.x), y: momentum(s.m2, r.v2f.y) };
    const panel = narrow ? { x: 0, y: h * 0.52, w, h: h * 0.48 } : { x: w * 0.62, y: 0, w: w * 0.38, h };
    ctx.fillStyle = th.bg;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    text(ctx, 'Momentum vectors (tip to tail)', panel.x + 12, panel.y + 16, { color: th.muted, size: 12, weight: 650 });
    // Fit both the before arrow and the after triangle (whose height is |p′_1y|).
    const k = Math.min(panel.w * 0.62, panel.h * 0.42 / Math.max(Math.abs(q1.y) / pb.x, 0.25)) / Math.max(pb.x, 1e-9);
    const ox = panel.x + panel.w * 0.16;
    const oyB = panel.y + panel.h * 0.26;
    // The after-triangle opens up for a positive aim, down for a negative one.
    const oyA = panel.y + panel.h * (q1.y >= 0 ? 0.84 : 0.46);
    text(ctx, 'before', ox - 8, oyB, { color: th.muted, size: 11, align: 'right' });
    arrow(ctx, ox, oyB, pb.x * k, 0, { color: th.seriesA, width: 3 });
    subText(ctx, 'p_1', ox + (pb.x * k) / 2, oyB - 12, { color: th.seriesA, size: 12, weight: 650, align: 'center' });
    text(ctx, 'after', ox - 8, oyA, { color: th.muted, size: 11, align: 'right' });
    arrow(ctx, ox, oyA, pb.x * k, 0, { color: th.total, width: 1.5, dash: [4, 4] });
    if (r.hit && clk.t >= tc) {
      arrow(ctx, ox, oyA, q1.x * k, -q1.y * k, { color: th.seriesA, width: 3, label: 'p_1′' });
      arrow(ctx, ox + q1.x * k, oyA - q1.y * k, q2.x * k, -q2.y * k, { color: th.seriesB, width: 3, label: 'p_2′' });
    } else {
      text(ctx, 'press Play to collide', ox, oyA + 18, { color: th.muted, size: 11 });
    }

    const scale = pb.x;
    const after = clk.t >= tc && r.hit;
    const ekB = kineticEnergy(s.m1, s.v1);
    const ekA = kineticEnergy(s.m1, magnitude(r.v1f.x, r.v1f.y)) + kineticEnergy(s.m2, magnitude(r.v2f.x, r.v2f.y));
    out.set('v1f', after ? polar(r.v1f.x, r.v1f.y, 'm/s', s.v1) : '—');
    out.set('v2f', after ? polar(r.v2f.x, r.v2f.y, 'm/s', s.v1) : '—');
    out.set('pb', polar(pb.x, 0, '', scale));
    out.set('pa', after ? polar(q1.x + q2.x, q1.y + q2.y, '', scale) : '—');
    out.set('pxy', after ? `${fmt(snap(q1.x + q2.x, scale))}, ${fmt(snap(q1.y + q2.y, scale))}` : '—');
    out.set('ek', after ? `${fmt(ekB)} J → ${fmt(snap(ekA, ekB))} J` : `${fmt(ekB)} J`);
    clk.setTimeLabel(`t = ${clk.t.toFixed(2)} s`);
  }
}
