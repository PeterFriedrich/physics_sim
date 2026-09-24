import { pendulumPeriod, pendulumState } from '../physics/oscillations.js';
import { fitCanvas, theme, clear, arrow, line, text, subText } from '../lib/canvas.js';
import { section, slider, choice, toggle, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

export const equations = [
  { html: 'T = 2π√(l / g)', what: 'no mass and no amplitude in it (small swings)' },
  { html: 'f = 1 / T', what: '' },
  { html: 'F<sub>restoring</sub> = mg sin θ', what: 'the part of gravity along the arc, toward the lowest point' },
];

export const prompts = [
  'Double the mass. Predict the new period, then check.',
  'Make the pendulum 4× longer. By what factor does T change?',
  'Take the same pendulum to the Moon. Does it swing faster or slower? By how much?',
  'Where in the swing is the restoring force biggest? Where is it zero?',
  'Find the length that gives T = 2.00 s on Earth (a “seconds pendulum”).',
];

export const legend = [
  { color: 'gravity', label: 'gravity F<sub>g</sub>' },
  { color: 'force', label: 'restoring force (enlarged)' },
  { color: 'accent', label: 'T vs l' },
];

const GRAVITY = [
  { value: 9.81, label: 'Earth (9.81 m/s²)' },
  { value: 1.62, label: 'Moon (1.62 m/s²)' },
  { value: 3.71, label: 'Mars (3.71 m/s²)' },
];
const L_MAX = 3;

export const tallOnMobile = true;

export function mount(ui) {
  const box = section(ui.controls, 'Pendulum');
  const L = slider(box, { label: 'Length l', min: 0.2, max: L_MAX, step: 0.05, value: 1, unit: 'm' });
  const m = slider(box, { label: 'Mass m', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'kg' });
  const amp = slider(box, { label: 'Release angle (max 15°)', min: 2, max: 15, step: 1, value: 10, unit: '°' });
  const gSel = choice(box, { label: 'Gravity', options: GRAVITY, value: 9.81 });
  const show = section(ui.controls, 'Show');
  const showF = toggle(show, { label: 'Forces', checked: true });

  const out = readouts(ui.readouts, [
    { id: 'T', label: 'Period T' },
    { id: 'f', label: 'Frequency f' },
    { id: 'th', label: 'Angle θ' },
    { id: 'F', label: 'Restoring force' },
    { id: 'h', label: 'Height above lowest point' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  [L, m, amp, gSel].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const p = { L: L.value, m: m.value, thetaMaxDeg: amp.value, g: gSel.value };
    const T = pendulumPeriod(p.L, p.g);
    const s = pendulumState(p, clk.t);
    clear(ctx, w, h);

    // --- pendulum (left), scaled so the longest string fits ---
    const wide = w > 560;
    const pw = wide ? w * 0.52 : w;
    const ph = wide ? h : h * 0.58;
    const sc = (ph - 70) / L_MAX;
    const px = pw / 2;
    const py = 30;
    line(ctx, px - 50, py, px + 50, py, { color: th.ink, width: 3 });
    line(ctx, px, py, px, py + p.L * sc + 20, { color: th.grid, dash: [4, 4] });
    const tm = (p.thetaMaxDeg * Math.PI) / 180;
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(px, py, p.L * sc, Math.PI / 2 - tm, Math.PI / 2 + tm);
    ctx.stroke();
    const tr = (s.thetaDeg * Math.PI) / 180;
    const bx = px + p.L * sc * Math.sin(tr);
    const by = py + p.L * sc * Math.cos(tr);
    line(ctx, px, py, bx, by, { color: th.ink, width: 1.5 });
    const br = 7 + 4 * Math.cbrt(p.m);
    ctx.fillStyle = th.accent;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `θ = ${fmt(snap(s.thetaDeg, 15), 2)}°`, px + 8, py + 22, { color: th.muted, size: 12 });
    if (showF.value) {
      arrow(ctx, bx, by, 0, 70, { color: th.gravity, label: 'F_g' });
      // At ≤ 15° the restoring force is under a quarter of F_g, too short to
      // see on F_g's scale, so it gets its own: full length at the release point.
      const F = (s.Frestore / (p.m * p.g * Math.sin(tm))) * 70;
      // Along the arc: tangent (cos θ, −sin θ) in screen coordinates.
      arrow(ctx, bx, by, F * Math.cos(tr), -F * Math.sin(tr), { color: th.force, label: Math.abs(F) > 10 ? 'F_restoring' : '' });
    }

    // --- T vs l graph (right, or below on phones) ---
    const G = wide ? { x: pw + 40, y: 30, w: w - pw - 60, h: h - 70 } : { x: 48, y: ph + 16, w: w - 64, h: h - ph - 46 };
    const Tmax = pendulumPeriod(L_MAX, p.g) * 1.1;
    const X = (l) => G.x + (l / L_MAX) * G.w;
    const Y = (t) => G.y + G.h - (t / Tmax) * G.h;
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(G.x, G.y, G.w, G.h);
    const step = Tmax > 12 ? 4 : Tmax > 5 ? 2 : 1;
    for (let t = step; t < Tmax; t += step) {
      line(ctx, G.x, Y(t), G.x + G.w, Y(t), { color: th.grid });
      text(ctx, String(t), G.x - 6, Y(t), { color: th.muted, size: 10, align: 'right' });
    }
    for (let l = 1; l <= L_MAX; l++) text(ctx, String(l), X(l), G.y + G.h + 12, { color: th.muted, size: 10, align: 'center' });
    ctx.save();
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const l = (L_MAX * i) / 100;
      i ? ctx.lineTo(X(l), Y(pendulumPeriod(l, p.g))) : ctx.moveTo(X(l), Y(0));
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = th.ink;
    ctx.beginPath();
    ctx.arc(X(p.L), Y(T), 5, 0, Math.PI * 2);
    ctx.fill();
    subText(ctx, 'T (s)', G.x + 6, G.y + 12, { color: th.muted, size: 11, weight: 650 });
    text(ctx, 'l (m)', G.x + G.w, G.y + G.h + 24, { color: th.muted, size: 11, align: 'right' });

    out.set('T', `${fmt(T)} s`);
    out.set('f', `${fmt(1 / T)} Hz`);
    out.set('th', `${fmt(snap(s.thetaDeg, 15))}°`);
    out.set('F', `${fmt(snap(Math.abs(s.Frestore), p.m * p.g))} N`);
    out.set('h', `${fmt(snap(s.h * 100, 100 * p.L))} cm`);
    clk.setTimeLabel(`t = ${clk.t.toFixed(2)} s`);
  }
}
