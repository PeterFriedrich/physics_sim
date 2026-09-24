import * as E from '../physics/electrostatics.js';
import { fitCanvas, makeView, theme, clear, grid, arrow, line, text, subText, vecLen } from '../lib/canvas.js';
import { section, slider, toggle, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'F<sub>e</sub> = kq<sub>1</sub>q<sub>2</sub> / r²', what: 'Coulomb’s law (magnitude)' },
  { html: 'E = kq / r²', what: 'field of a point charge: away from +, toward −' },
  { html: 'E = F<sub>e</sub> / q', what: 'field is force per unit (positive test) charge' },
  { html: 'F<sub>net</sub> = F<sub>1</sub> + F<sub>2</sub> + …', what: 'add forces and fields as vectors' },
];

export const prompts = [
  'Drag q<sub>2</sub> twice as far from q<sub>1</sub>. Predict the new force before you let go.',
  'Make both charges positive. Where between them is the field zero? Find it with the probe.',
  'Turn on q<sub>3</sub>. Resolve the net force on q<sub>1</sub> into components and check the readout.',
  'Is the force on q<sub>1</sub> from q<sub>2</sub> ever different in size from the force on q<sub>2</sub> from q<sub>1</sub>? Try unequal charges.',
  'Put the probe on the line between + and −. Which way does E point, and why?',
];

export const legend = [
  { color: 'friction', label: 'positive charge' },
  { color: 'velocity', label: 'negative charge' },
  { color: 'force', label: 'net electric force' },
  { color: 'muted', label: 'field direction' },
];

const BOX = { xMin: -1, xMax: 1, yMin: -0.6, yMax: 0.6 };
const MICRO = 1e-6;

export function mount(ui) {
  const box = section(ui.controls, 'Charges (drag to move)');
  const q = [
    slider(box, { label: 'q<sub>1</sub>', min: -10, max: 10, step: 0.5, value: 2, unit: 'µC' }),
    slider(box, { label: 'q<sub>2</sub>', min: -10, max: 10, step: 0.5, value: -3, unit: 'µC' }),
    slider(box, { label: 'q<sub>3</sub> (0 = off)', min: -10, max: 10, step: 0.5, value: 0, unit: 'µC' }),
  ];
  const show = section(ui.controls, 'Show');
  const showField = toggle(show, { label: 'Field vectors', checked: true });
  const showForce = toggle(show, { label: 'Net force on each charge', checked: true });

  const out = readouts(ui.readouts, [
    { id: 'r', label: 'Separation r<sub>12</sub>' },
    { id: 'F12', label: 'F between q<sub>1</sub> and q<sub>2</sub>' },
    { id: 'n1', label: 'Net F on q<sub>1</sub>' },
    { id: 'n2', label: 'Net F on q<sub>2</sub>' },
    { id: 'n3', label: 'Net F on q<sub>3</sub>' },
    { id: 'Ep', label: 'E at probe P' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Directions are degrees from +x, counter-clockwise. Grid squares are 10 cm.</p>');

  // Positions in metres; the probe is a massless point where E is measured.
  const pos = [
    { x: -0.4, y: 0 },
    { x: 0.4, y: 0 },
    { x: 0, y: 0.4 },
  ];
  const probe = { x: 0, y: -0.35 };

  const canvas = fitCanvas(ui.canvas);
  createClock(ui.transport, { frame: draw });
  ui.transport.hidden = true;

  let view = null;
  let dragging = null;
  const pick = (ev) => {
    const r = ui.canvas.getBoundingClientRect();
    return { px: ev.clientX - r.left, py: ev.clientY - r.top };
  };
  const targets = () => [...pos.map((p, i) => ({ p, on: i < 2 || q[2].value !== 0 })), { p: probe, on: true }];
  ui.canvas.addEventListener('pointerdown', (ev) => {
    if (!view) return;
    const { px, py } = pick(ev);
    let best = null;
    let bestD = 26;
    for (const t of targets()) {
      if (!t.on) continue;
      const d = Math.hypot(view.px(t.p.x) - px, view.py(t.p.y) - py);
      if (d < bestD) [best, bestD] = [t.p, d];
    }
    if (best) {
      dragging = best;
      ui.canvas.setPointerCapture(ev.pointerId);
    }
  });
  ui.canvas.addEventListener('pointermove', (ev) => {
    if (!dragging || !view) return;
    const { px, py } = pick(ev);
    const x = Math.min(BOX.xMax - 0.03, Math.max(BOX.xMin + 0.03, view.wx(px)));
    const y = Math.min(BOX.yMax - 0.03, Math.max(BOX.yMin + 0.03, view.wy(py)));
    // Keep charges from sitting on top of each other, where kq/r² blows up.
    const clash = pos.some((p) => p !== dragging && dragging !== probe && Math.hypot(p.x - x, p.y - y) < 0.06);
    if (!clash) Object.assign(dragging, { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  });
  const stop = () => (dragging = null);
  ui.canvas.addEventListener('pointerup', stop);
  ui.canvas.addEventListener('pointercancel', stop);
  ui.canvas.style.cursor = 'grab';

  function draw() {
    const { ctx, w, h } = canvas;
    const th = theme();
    view = makeView({ w, h }, BOX, { pad: 12 });
    const charges = pos.map((p, i) => ({ q: q[i].value * MICRO, x: p.x, y: p.y })).filter((c, i) => i < 2 || c.q !== 0);
    clear(ctx, w, h);
    grid(ctx, view, BOX, 0.1);

    if (showField.value) {
      const step = Math.max(34, Math.min(w, h) / 12);
      const ref = (8.99e9 * 2 * MICRO) / 0.3 ** 2;
      for (let px = step / 2; px < w; px += step) {
        for (let py = step / 2; py < h; py += step) {
          const f = E.fieldAt(charges, view.wx(px), view.wy(py));
          const m = Math.hypot(f.Ex, f.Ey);
          if (m === 0) continue;
          const L = vecLen(m, ref, step * 0.7);
          arrow(ctx, px - ((f.Ex / m) * L) / 2, py + ((f.Ey / m) * L) / 2, (f.Ex / m) * L, (-f.Ey / m) * L, { color: th.muted, width: 1.3, head: 5 });
        }
      }
    }

    charges.forEach((c, i) => {
      const cx = view.px(c.x);
      const cy = view.py(c.y);
      if (showForce.value && charges.length > 1) {
        const f = E.netForceOn(charges, i);
        const m = Math.hypot(f.Fx, f.Fy);
        if (m > 0) {
          const L = vecLen(m, 0.2, 110);
          arrow(ctx, cx, cy, (f.Fx / m) * L, (-f.Fy / m) * L, { color: th.force, width: 3, label: `F_${i + 1}` });
        }
      }
      ctx.fillStyle = c.q > 0 ? th.friction : c.q < 0 ? th.velocity : th.muted;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, c.q > 0 ? '+' : c.q < 0 ? '−' : '0', cx, cy + 1, { color: '#fff', size: 18, weight: 700, align: 'center' });
      subText(ctx, `q_${i + 1} = ${fmt(c.q / MICRO, 2)} µC`, cx, cy + 28, { color: th.ink, size: 12, weight: 600, align: 'center' });
    });

    // Probe P, with the field there drawn in the accent colour.
    const ep = E.fieldAt(charges, probe.x, probe.y);
    const em = Math.hypot(ep.Ex, ep.Ey);
    const ppx = view.px(probe.x);
    const ppy = view.py(probe.y);
    if (em > 0) {
      const L = vecLen(em, 1e5, 80);
      arrow(ctx, ppx, ppy, (ep.Ex / em) * L, (-ep.Ey / em) * L, { color: th.accent, width: 2.5, label: 'E' });
    }
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ppx, ppy, 7, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, 'P', ppx - 12, ppy - 12, { color: th.ink, size: 13, weight: 700, align: 'center' });

    // Separation line between q1 and q2.
    line(ctx, view.px(pos[0].x), view.py(pos[0].y), view.px(pos[1].x), view.py(pos[1].y), { color: th.grid, width: 1.5, dash: [4, 5] });

    const r12 = E.magnitude(pos[1].x - pos[0].x, pos[1].y - pos[0].y);
    const q1 = charges[0].q;
    const q2 = charges[1].q;
    const kind = q1 * q2 > 0 ? 'repel' : q1 * q2 < 0 ? 'attract' : 'no force';
    out.set('r', `${fmt(r12)} m`);
    out.set('F12', `${fmt(E.coulombForce(q1, q2, r12))} N (${kind})`);
    const vec = (i) => {
      if (i >= charges.length) return 'q₃ off';
      const f = E.netForceOn(charges, i);
      const m = E.magnitude(f.Fx, f.Fy);
      return m === 0 ? '0 N' : `${fmt(m)} N at ${fmt(E.directionDeg(f.Fx, f.Fy), 3)}°`;
    };
    out.set('n1', vec(0));
    out.set('n2', vec(1));
    out.set('n3', vec(2));
    out.set('Ep', em === 0 ? '0 N/C' : `${fmt(em)} N/C at ${fmt(E.directionDeg(ep.Ex, ep.Ey), 3)}°`);
  }
}
