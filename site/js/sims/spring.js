import { springPeriod, springState, maxSpeed } from '../physics/oscillations.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text, subText, vecLen, roundRect } from '../lib/canvas.js';
import { section, slider, toggle, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

export const equations = [
  { html: 'F = −kx', what: 'Hooke’s law: restoring force' },
  { html: 'T = 2π√(m / k)', what: 'period does not depend on amplitude' },
  { html: 'E<sub>p</sub> = ½kx², &nbsp; E<sub>k</sub> = ½mv²', what: '' },
  { html: 'E<sub>total</sub> = ½kA² = ½mv<sub>max</sub>²', what: 'no friction, so it stays constant' },
];

export const prompts = [
  'Where is the speed greatest? Where is the acceleration greatest? Check with the vectors.',
  'Double the amplitude. Does the period change? Does the total energy?',
  'Make the mass 4× bigger. Predict the new period before you look.',
  'Pause when E<sub>k</sub> = E<sub>p</sub>. What fraction of A is x there?',
  'Compare the position–time graph with a cosine curve. What are its amplitude and period?',
];

export const legend = [
  { color: 'velocity', label: 'velocity' },
  { color: 'force', label: 'restoring force' },
  { color: 'kinetic', label: 'kinetic energy' },
  { color: 'potential', label: 'elastic potential' },
];

const WALL = -1.05; // m, relative to equilibrium
const HALF = 0.12; // half block width, m

export function mount(ui) {
  const box = section(ui.controls, 'Oscillator');
  const m = slider(box, { label: 'Mass m', min: 0.2, max: 5, step: 0.1, value: 1, unit: 'kg' });
  const k = slider(box, { label: 'Spring constant k', min: 5, max: 100, step: 1, value: 20, unit: 'N/m' });
  const A = slider(box, { label: 'Amplitude A', min: 0.05, max: 0.5, step: 0.01, value: 0.3, unit: 'm' });
  const show = section(ui.controls, 'Show');
  const showVec = toggle(show, { label: 'Velocity and force', checked: true });

  const out = readouts(ui.readouts, [
    { id: 'T', label: 'Period T' },
    { id: 'f', label: 'Frequency f' },
    { id: 'x', label: 'Position x' },
    { id: 'v', label: 'Velocity v' },
    { id: 'a', label: 'Acceleration a' },
    { id: 'F', label: 'Force F' },
    { id: 'Ek', label: 'E<sub>k</sub>' },
    { id: 'Ep', label: 'E<sub>p</sub>' },
    { id: 'Et', label: 'E<sub>total</sub>' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  [m, k, A].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function spring(ctx, x1, x2, y, amp, color) {
    const coils = 12;
    const lead = 10;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x1 + lead, y);
    const span = x2 - x1 - 2 * lead;
    for (let i = 0; i < coils * 2; i++) {
      ctx.lineTo(x1 + lead + (span * (i + 0.5)) / (coils * 2), y + (i % 2 ? amp : -amp));
    }
    ctx.lineTo(x2 - lead, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
    ctx.restore();
  }

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const p = { m: m.value, k: k.value, A: A.value };
    const T = springPeriod(p.m, p.k);
    const s = springState(p, clk.t);
    clear(ctx, w, h);

    // --- top: the oscillator ---
    const topH = h * 0.52;
    const view = makeView({ x: 0, y: 0, w, h: topH }, { xMin: -1.2, xMax: 0.78, yMin: -0.08, yMax: 0.42 }, { pad: 22 });
    const floorY = view.py(0);
    line(ctx, view.px(-1.2), floorY, view.px(0.78), floorY, { color: th.ink, width: 2 });
    ctx.fillStyle = th.grid;
    ctx.fillRect(view.px(-1.2), view.py(0.4), view.px(WALL) - view.px(-1.2), floorY - view.py(0.4));
    line(ctx, view.px(WALL), view.py(0.4), view.px(WALL), floorY, { color: th.ink, width: 2 });

    for (const [xm, lab] of [[0, 'x = 0'], [p.A, '+A'], [-p.A, '−A']]) {
      line(ctx, view.px(xm), view.py(0.36), view.px(xm), floorY, { color: th.muted, width: 1, dash: [4, 4] });
      text(ctx, lab, view.px(xm), view.py(0.36) - 10, { color: th.muted, size: 12, align: 'center' });
    }

    const bs = HALF * 2 * view.sx;
    const bx = view.px(s.x);
    const by = floorY - bs / 2;
    spring(ctx, view.px(WALL), bx - bs / 2, by, bs * 0.22, th.muted);
    ctx.fillStyle = th.surface;
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 2;
    roundRect(ctx, bx - bs / 2, by - bs / 2, bs, bs, 4);
    ctx.fill();
    ctx.stroke();
    text(ctx, `${fmt(p.m, 2)} kg`, bx, by, { color: th.muted, size: 11, align: 'center' });
    if (showVec.value) {
      const aMax = Math.min(110, w * 0.16);
      arrow(ctx, bx, by - bs / 2 - 14, vecLen(s.v, maxSpeed(p) || 1, aMax), 0, { color: th.velocity, label: 'v' });
      arrow(ctx, bx, by + bs / 2 + 18, vecLen(s.F, p.k * p.A || 1, aMax), 0, { color: th.force, label: 'F' });
    }

    // --- bottom-left: x–t graph over a sliding window ---
    const gx0 = 56;
    const gy0 = topH + 24;
    const gw = w * 0.68 - gx0;
    const gh = h - gy0 - 30;
    const win = 2.5 * T;
    const t0 = Math.max(0, clk.t - win * 0.8);
    const tx = (t) => gx0 + ((t - t0) / win) * gw;
    const yx = (x) => gy0 + gh / 2 - (x / 0.5) * (gh / 2);
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(gx0, gy0, gw, gh);
    line(ctx, gx0, yx(0), gx0 + gw, yx(0), { color: th.grid });
    text(ctx, 'x (m)', gx0, gy0 - 8, { color: th.muted, size: 11 });
    text(ctx, '+0.5', gx0 - 8, yx(0.5) + 8, { color: th.muted, size: 11, align: 'right' });
    text(ctx, '0', gx0 - 8, yx(0), { color: th.muted, size: 11, align: 'right' });
    text(ctx, '−0.5', gx0 - 8, yx(-0.5) - 8, { color: th.muted, size: 11, align: 'right' });
    text(ctx, 't (s)', gx0 + gw, gy0 + gh + 14, { color: th.muted, size: 11, align: 'right' });
    for (let n = Math.ceil(t0 / T); n * T <= t0 + win; n++) {
      if (n === 0) continue;
      line(ctx, tx(n * T), gy0, tx(n * T), gy0 + gh, { color: th.grid, dash: [3, 4] });
      text(ctx, `${n}T`, tx(n * T), gy0 + gh + 14, { color: th.muted, size: 11, align: 'center' });
    }
    ctx.save();
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const tEnd = clk.t;
    const steps = 160;
    for (let i = 0; i <= steps; i++) {
      const t = t0 + ((tEnd - t0) * i) / steps;
      const y = yx(springState(p, t).x);
      i ? ctx.lineTo(tx(t), y) : ctx.moveTo(tx(t), y);
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = th.accent;
    ctx.beginPath();
    ctx.arc(tx(clk.t), yx(s.x), 4, 0, Math.PI * 2);
    ctx.fill();

    // --- bottom-right: energy bars, scaled to the current total ---
    const ex0 = w * 0.72;
    const ew = w * 0.26;
    const bars = [
      ['E_k', s.Ek, th.kinetic],
      ['E_p', s.Ep, th.potential],
      ['E_total', s.Et, th.total],
    ];
    const bw = Math.min(46, ew / 4);
    const scale = gh / Math.max(s.Et, 1e-9);
    bars.forEach(([lab, val, col], i) => {
      const x = ex0 + i * (ew / 3) + (ew / 3 - bw) / 2;
      const hh = val * scale;
      ctx.fillStyle = col;
      ctx.fillRect(x, gy0 + gh - hh, bw, hh);
      subText(ctx, lab, x + bw / 2, gy0 + gh + 14, { color: th.muted, size: 12, align: 'center' });
    });
    line(ctx, ex0, gy0 + gh, ex0 + ew, gy0 + gh, { color: th.ink });

    out.set('T', `${fmt(T)} s`);
    out.set('f', `${fmt(1 / T)} Hz`);
    const vmax = maxSpeed(p);
    out.set('x', `${fmt(snap(s.x, p.A))} m`);
    out.set('v', `${fmt(snap(s.v, vmax))} m/s`);
    out.set('a', `${fmt(snap(s.a, (p.k / p.m) * p.A))} m/s²`);
    out.set('F', `${fmt(snap(s.F, p.k * p.A))} N`);
    out.set('Ek', `${fmt(snap(s.Ek, s.Et))} J`);
    out.set('Ep', `${fmt(snap(s.Ep, s.Et))} J`);
    out.set('Et', `${fmt(s.Et)} J`);
    clk.setTimeLabel(`t = ${clk.t.toFixed(2)} s`);
  }
}
