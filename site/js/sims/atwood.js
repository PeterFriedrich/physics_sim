import { connectedMasses } from '../physics/connected.js';
import { slideFromRest, timeToSlide } from '../physics/dynamics.js';
import { g } from '../physics/constants.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text, subText } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

export const equations = [
  { html: 'F<sub>net</sub> = m<sub>total</sub>a', what: 'treat both masses as one system' },
  { html: 'Table: a = (m<sub>2</sub>g − μm<sub>1</sub>g) / (m<sub>1</sub> + m<sub>2</sub>)', what: 'm<sub>2</sub>’s weight pulls, friction on m<sub>1</sub> resists' },
  { html: 'Atwood: a = (m<sub>2</sub> − m<sub>1</sub>)g / (m<sub>1</sub> + m<sub>2</sub>)', what: '' },
  { html: 'm<sub>2</sub>g − F<sub>T</sub> = m<sub>2</sub>a', what: 'then one mass alone gives the tension' },
];

export const prompts = [
  'Before you play: is the tension bigger than, smaller than, or equal to m<sub>2</sub>g? Check the readout.',
  'Set μ = 0 and make m<sub>1</sub> huge. What happens to a? What if m<sub>1</sub> is tiny?',
  'Raise μ until the masses no longer move. Show that m<sub>2</sub>g ≤ μm<sub>1</sub>g there.',
  'Atwood machine: make the masses equal. Is the tension zero? What is it?',
  'Draw a free-body diagram for each mass separately, then check yours against the arrows.',
];

export const legend = [
  { color: 'gravity', label: 'gravity' },
  { color: 'force', label: 'tension' },
  { color: 'normal', label: 'normal' },
  { color: 'friction', label: 'friction' },
  { color: 'accel', label: 'acceleration' },
];

const MODES = [
  { value: 'table', label: 'm₁ on a table' },
  { value: 'hanging', label: 'Both hanging (Atwood)' },
];
const TRAVEL = { table: 1.3, hanging: 0.6 }; // m before the run stops
const B = 0.34; // block size, m

export function mount(ui) {
  const box = section(ui.controls, 'Masses');
  const mode = choice(box, { label: 'Setup', options: MODES, value: 'table' });
  const m1 = slider(box, { label: 'Mass m<sub>1</sub>', min: 0.5, max: 10, step: 0.5, value: 4, unit: 'kg' });
  const m2 = slider(box, { label: 'Mass m<sub>2</sub> (hanging)', min: 0.5, max: 10, step: 0.5, value: 2, unit: 'kg' });
  const mu = slider(box, { label: 'Friction μ (table)', min: 0, max: 1, step: 0.01, value: 0.2 });

  const out = readouts(ui.readouts, [
    { id: 'a', label: 'Acceleration a' },
    { id: 'T', label: 'Tension F<sub>T</sub>' },
    { id: 'Ff', label: 'Friction F<sub>f</sub>' },
    { id: 'Fnet', label: 'F<sub>net</sub> on the system' },
    { id: 'd', label: 'Distance moved' },
    { id: 'v', label: 'Speed' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  [mode, m1, m2, mu].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function block(ctx, th, cx, cy, size, label) {
    ctx.fillStyle = th.surface;
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 2;
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
    // Beside the block, since the force arrows start at its centre.
    subText(ctx, label, cx - size / 2 - 6, cy - size / 2 + 8, { color: th.ink, size: 13, weight: 650, align: 'right' });
  }

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const md = mode.value;
    const r = connectedMasses({ m1: m1.value, m2: m2.value, mu: md === 'table' ? mu.value : 0, mode: md, g });
    const tEnd = timeToSlide(Math.abs(r.a), TRAVEL[md]);
    if (clk.t >= tEnd) {
      clk.t = tEnd;
      clk.pause();
    }
    const run = slideFromRest(Math.abs(r.a), Number.isFinite(tEnd) ? clk.t : 0);
    const dir = Math.sign(r.a); // +1: m2 goes down
    const d = run.d * dir;
    clear(ctx, w, h);

    // Forces share one scale, set by the heavier weight, so arrows compare.
    const k = Math.min(90, h * 0.2) / (Math.max(m1.value, m2.value) * g);
    const ptxt = (s) => subText(ctx, s, 12, 18, { color: th.muted, size: 13 });

    if (md === 'table') {
      const view = makeView({ w, h }, { xMin: -0.2, xMax: 2.6, yMin: -1.8, yMax: 1.3 }, { pad: 20 });
      const top = 0;
      const px0 = 2.1; // pulley x
      const pr = 0.1;
      ctx.fillStyle = th.grid;
      ctx.fillRect(view.px(-0.2), view.py(top), view.px(px0) - view.px(-0.2), view.py(-1.8) - view.py(top));
      line(ctx, view.px(-0.2), view.py(top), view.px(px0), view.py(top), { color: th.ink, width: 2 });
      const bx = 0.4 + d;
      const hy = -0.35 - d;
      const sz = B * view.sx;
      // String: block → top of pulley → down to m2.
      line(ctx, view.px(bx + B / 2), view.py(top + B / 2), view.px(px0), view.py(top + B / 2), { color: th.muted });
      line(ctx, view.px(px0 + pr), view.py(top + B / 2 - pr), view.px(px0 + pr), view.py(hy + B / 2), { color: th.muted });
      ctx.strokeStyle = th.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(view.px(px0), view.py(top + B / 2 - pr), pr * view.sx, 0, Math.PI * 2);
      ctx.stroke();
      const c1 = { x: view.px(bx), y: view.py(top + B / 2) };
      const c2 = { x: view.px(px0 + pr), y: view.py(hy) };
      block(ctx, th, c1.x, c1.y, sz, 'm_1');
      block(ctx, th, c2.x, c2.y, sz, 'm_2');
      const Fg1 = m1.value * g;
      arrow(ctx, c1.x, c1.y, 0, Fg1 * k, { color: th.gravity, label: 'F_g' });
      arrow(ctx, c1.x, c1.y, 0, -Fg1 * k, { color: th.normal, label: 'F_N' });
      arrow(ctx, c1.x + sz / 2, c1.y - sz * 0.2, r.T * k, 0, { color: th.force, label: 'F_T' });
      if (r.Ff > 1e-9) arrow(ctx, c1.x - sz / 2, c1.y + sz / 2 - 3, -r.Ff * k, 0, { color: th.friction, label: 'F_f' });
      arrow(ctx, c2.x, c2.y, 0, m2.value * g * k, { color: th.gravity, label: 'F_g' });
      arrow(ctx, c2.x, c2.y - sz / 2, 0, -r.T * k, { color: th.force, label: 'F_T' });
      if (r.moves) {
        arrow(ctx, c1.x, c1.y - sz / 2 - 40, 44, 0, { color: th.accel, width: 2, label: 'a' });
        arrow(ctx, c2.x - sz / 2 - 44, c2.y, 0, 44, { color: th.accel, width: 2, label: 'a' });
      }
      ptxt(r.moves ? 'Sliding: friction = μ × normal force' : 'At rest: friction balances m₂g');
    } else {
      const view = makeView({ w, h }, { xMin: -1.3, xMax: 1.3, yMin: -0.6, yMax: 2.4 }, { pad: 20 });
      const pr = 0.16;
      const py = 2.0;
      line(ctx, view.px(-0.5), view.py(2.2), view.px(0.5), view.py(2.2), { color: th.ink, width: 3 });
      line(ctx, view.px(0), view.py(2.2), view.px(0), view.py(py), { color: th.ink, width: 2 });
      ctx.strokeStyle = th.ink;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(view.px(0), view.py(py), pr * view.sx, 0, Math.PI * 2);
      ctx.stroke();
      line(ctx, view.px(-1.3), view.py(0), view.px(1.3), view.py(0), { color: th.ink, width: 2 });
      const y1 = 1.0 + d;
      const y2 = 1.0 - d;
      line(ctx, view.px(-pr), view.py(py), view.px(-pr), view.py(y1 + B / 2), { color: th.muted });
      line(ctx, view.px(pr), view.py(py), view.px(pr), view.py(y2 + B / 2), { color: th.muted });
      const sz = B * view.sx;
      const c1 = { x: view.px(-pr), y: view.py(y1) };
      const c2 = { x: view.px(pr), y: view.py(y2) };
      block(ctx, th, c1.x, c1.y, sz, 'm_1');
      block(ctx, th, c2.x, c2.y, sz, 'm_2');
      // Forces drawn out to the side so the two diagrams don't overlap.
      const off = sz * 1.3;
      for (const [c, mm, side] of [[c1, m1.value, -1], [c2, m2.value, 1]]) {
        const x = c.x + side * off;
        arrow(ctx, x, c.y, 0, mm * g * k, { color: th.gravity, label: 'F_g' });
        arrow(ctx, x, c.y, 0, -r.T * k, { color: th.force, label: 'F_T' });
        line(ctx, c.x + (side * sz) / 2, c.y, x, c.y, { color: th.grid, dash: [2, 3] });
      }
      if (r.moves) {
        arrow(ctx, c1.x - off * 2, c1.y, 0, -44 * dir, { color: th.accel, width: 2, label: 'a' });
        arrow(ctx, c2.x + off * 2, c2.y, 0, 44 * dir, { color: th.accel, width: 2, label: 'a' });
      }
      ptxt(r.moves ? (dir > 0 ? 'm₂ is heavier: it falls, m₁ rises' : 'm₁ is heavier: it falls, m₂ rises') : 'Equal masses: balanced, no acceleration');
    }

    const scale = Math.max(m1.value, m2.value) * g;
    out.set('a', `${fmt(snap(Math.abs(r.a), g))} m/s²`);
    out.set('T', `${fmt(r.T)} N`);
    out.set('Ff', md === 'table' ? `${fmt(snap(r.Ff, scale))} N` : '— (no table)');
    out.set('Fnet', `${fmt(snap(Math.abs(r.Fnet), scale))} N`);
    out.set('d', `${fmt(snap(run.d, 1))} m`);
    out.set('v', `${fmt(snap(run.v, 1))} m/s`);
    clk.setTimeLabel(`t = ${clk.t.toFixed(2)} s`);
  }
}
