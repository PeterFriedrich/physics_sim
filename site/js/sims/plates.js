import * as E from '../physics/electrostatics.js';
import { e, mp, me, alphaMass } from '../physics/constants.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'E = ΔV / d', what: 'uniform field between parallel plates' },
  { html: 'F<sub>e</sub> = qE, &nbsp; a = F<sub>e</sub> / m', what: 'constant force, so constant acceleration' },
  { html: 'Δx = v<sub>0</sub>t, &nbsp; Δy = ½at²', what: 'like a projectile: gravity neglected' },
  { html: 'ΔE<sub>k</sub> = qΔV', what: 'energy gained crossing a potential difference' },
];

export const prompts = [
  'Which way will the electron bend? Decide from the plate signs first, then fire it.',
  'Switch to a proton at the same settings. Why does it bend the other way — and so much less?',
  'Double ΔV. What happens to E, to the acceleration, and to the deflection?',
  'Find the slowest entry speed that still makes it through without hitting a plate.',
  'Treat it as projectile motion: calculate the deflection at the exit and check the readout.',
];

export const legend = [
  { color: 'accent', label: 'path' },
  { color: 'velocity', label: 'velocity' },
  { color: 'force', label: 'electric force' },
  { color: 'muted', label: 'field E (+ to −)' },
];

const PARTICLES = [
  { value: 'electron', label: 'Electron (−e)', q: -e, m: me, vUnit: 1e7, vLabel: '× 10⁷ m/s', v: [0.5, 5, 0.1, 2] },
  { value: 'proton', label: 'Proton (+e)', q: e, m: mp, vUnit: 1e5, vLabel: '× 10⁵ m/s', v: [0.5, 5, 0.1, 5] },
  { value: 'alpha', label: 'Alpha particle (+2e)', q: 2 * e, m: alphaMass, vUnit: 1e5, vLabel: '× 10⁵ m/s', v: [0.5, 5, 0.1, 4] },
];

const BOX = { xMin: -0.035, xMax: 0.24, yMin: -0.062, yMax: 0.062 };

export function mount(ui) {
  const pbox = section(ui.controls, 'Particle');
  const part = choice(pbox, { label: 'Particle', options: PARTICLES, value: 'electron' });
  const speedBox = document.createElement('div');
  pbox.appendChild(speedBox);
  let v0;
  const buildSpeed = () => {
    speedBox.textContent = '';
    const o = part.option;
    v0 = slider(speedBox, { label: `Entry speed v<sub>0</sub> (${o.vLabel})`, min: o.v[0], max: o.v[1], step: o.v[2], value: o.v[3] });
    v0.onChange(restart);
  };
  const plates = section(ui.controls, 'Plates');
  const dV = slider(plates, { label: 'Potential difference ΔV', min: 0, max: 500, step: 5, value: 100, unit: 'V' });
  const d = slider(plates, { label: 'Plate separation d', min: 1, max: 10, step: 0.5, value: 4, unit: 'cm' });
  const L = slider(plates, { label: 'Plate length L', min: 2, max: 15, step: 0.5, value: 10, unit: 'cm' });
  const pol = choice(plates, {
    label: 'Polarity',
    options: [
      { value: 1, label: 'Top plate +, bottom −' },
      { value: -1, label: 'Top plate −, bottom +' },
    ],
    value: 1,
  });

  const out = readouts(ui.readouts, [
    { id: 'E', label: 'Field E' },
    { id: 'F', label: 'Force F<sub>e</sub>' },
    { id: 'a', label: 'Acceleration a' },
    { id: 't', label: 'Time between plates' },
    { id: 'y', label: 'Deflection' },
    { id: 'v', label: 'Speed leaving the field' },
    { id: 'dir', label: 'Direction leaving' },
    { id: 'dE', label: 'ΔE<sub>k</sub> gained' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Gravity is neglected: for these particles it is ~10¹⁴ times weaker than the electric force. Deflection: + is up.</p>');

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw, autoplay: true });
  function restart() {
    clock.reset();
    clock.play();
  }
  buildSpeed();
  part.onChange(() => (buildSpeed(), restart()));
  [dV, d, L, pol].forEach((c) => c.onChange(restart));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const o = part.option;
    const dm = d.value / 100;
    const Lm = L.value / 100;
    const Emag = E.plateField(dV.value, dm);
    const Ey = -pol.value * Emag; // top plate + → field points down
    const s = { q: o.q, m: o.m, v0: v0.value * o.vUnit, Ey, d: dm, L: Lm };
    const tr = E.platesTrajectory(s);

    // Real crossing times are nanoseconds; playback takes ~2.5 s to cross the plates.
    const scale = tr.t / 2.5;
    const t = clk.t * scale;
    let p;
    let vy;
    if (t <= tr.t) {
      p = E.platesPosition(tr, t);
      vy = tr.ay * t;
    } else if (tr.hits) {
      p = { x: tr.x, y: tr.y };
      vy = 0;
      if (clk.running) clk.pause();
    } else {
      // Field-free after the plates: straight line.
      const dt = t - tr.t;
      p = { x: tr.x + tr.vx * dt, y: tr.y + tr.vy * dt };
      vy = tr.vy;
      if ((p.x > BOX.xMax || Math.abs(p.y) > BOX.yMax) && clk.running) clk.pause();
    }

    const view = makeView({ w, h }, BOX, { pad: 16 });
    clear(ctx, w, h);

    // Plates.
    const plateW = 7;
    const top = view.py(dm / 2);
    const bot = view.py(-dm / 2);
    const x0 = view.px(0);
    const x1 = view.px(Lm);
    const sign = (s0) => (s0 > 0 ? '+' : '−');
    ctx.fillStyle = pol.value > 0 ? th.friction : th.velocity;
    ctx.fillRect(x0, top - plateW, x1 - x0, plateW);
    ctx.fillStyle = pol.value > 0 ? th.velocity : th.friction;
    ctx.fillRect(x0, bot, x1 - x0, plateW);
    const n = Math.max(2, Math.round((x1 - x0) / 36));
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i + 0.5) * (x1 - x0)) / n;
      text(ctx, sign(pol.value), x, top - plateW - 10, { color: th.ink, size: 14, weight: 700, align: 'center' });
      text(ctx, sign(-pol.value), x, bot + plateW + 11, { color: th.ink, size: 14, weight: 700, align: 'center' });
      if (dV.value > 0) {
        const len = (bot - top) * 0.55;
        const y0 = (top + bot) / 2 - (pol.value * len) / 2;
        arrow(ctx, x, y0, 0, pol.value * len, { color: th.muted, width: 1.5, head: 7 });
      }
    }
    text(ctx, `ΔV = ${dV.value} V`, x1 + 10, top - plateW / 2, { color: th.muted, size: 12 });

    // Path so far.
    ctx.save();
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(view.px(BOX.xMin), view.py(0));
    const steps = 80;
    const tIn = Math.min(t, tr.t);
    for (let i = 0; i <= steps; i++) {
      const q = E.platesPosition(tr, (tIn * i) / steps);
      ctx.lineTo(view.px(q.x), view.py(q.y));
    }
    if (t > tr.t && !tr.hits) ctx.lineTo(view.px(p.x), view.py(p.y));
    ctx.stroke();
    ctx.restore();
    line(ctx, view.px(BOX.xMin), view.py(0), view.px(BOX.xMax), view.py(0), { color: th.grid, dash: [3, 5] });

    const bx = view.px(p.x);
    const by = view.py(p.y);
    const hit = tr.hits && t >= tr.t;
    if (!hit) {
      const vx = s.v0;
      const vm = Math.hypot(vx, vy);
      arrow(ctx, bx, by, (vx / vm) * 60, (-vy / vm) * 60, { color: th.velocity, width: 2.5, label: 'v' });
      if (p.x >= 0 && p.x <= Lm && tr.ay !== 0) arrow(ctx, bx, by, 0, -Math.sign(tr.ay) * 40, { color: th.force, width: 2.5, label: 'F' });
    }
    ctx.fillStyle = o.q > 0 ? th.friction : th.velocity;
    ctx.beginPath();
    ctx.arc(bx, by, 6, 0, Math.PI * 2);
    ctx.fill();
    if (hit) text(ctx, `hits the plate at x = ${fmt(tr.x * 100, 3)} cm`, w / 2, 18, { color: th.friction, size: 14, weight: 700, align: 'center' });

    // Scale bar: 5 cm.
    const sb = 0.05 * view.sx;
    line(ctx, 14, h - 14, 14 + sb, h - 14, { color: th.ink, width: 2 });
    text(ctx, '5 cm', 14, h - 26, { color: th.ink, size: 12 });

    const F = Math.abs(o.q) * Emag;
    const speedOut = E.magnitude(tr.vx, tr.vy);
    const deg = E.directionDeg(tr.vx, tr.vy);
    const dirOut = deg > 180 ? deg - 360 : deg;
    const work = tr.dEk;
    out.set('E', `${fmt(Emag)} N/C`);
    out.set('F', `${fmt(F)} N`);
    out.set('a', `${fmt(Math.abs(tr.ay))} m/s²`);
    out.set('t', tr.hits ? `${fmt(tr.t)} s (to impact)` : `${fmt(tr.t)} s`);
    out.set('y', tr.hits ? `hits at x = ${fmt(tr.x * 100, 3)} cm` : `${fmt(tr.y * 100, 3)} cm`);
    out.set('v', tr.hits ? '— (absorbed)' : `${fmt(speedOut)} m/s`);
    out.set('dir', tr.hits ? '—' : `${fmt(Math.abs(dirOut), 3)}° ${dirOut >= 0 ? 'above' : 'below'} +x`);
    out.set('dE', `${fmt(work)} J = ${fmt(work / e)} eV`);
    clk.setTimeLabel(`t = ${fmt(Math.min(t, tr.hits ? tr.t : Infinity))} s`);
  }
}
