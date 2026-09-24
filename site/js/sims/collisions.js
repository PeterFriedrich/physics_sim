import { collide1D, momentum, kineticEnergy, collisionTime } from '../physics/momentum.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text, subText, vecLen, roundRect } from '../lib/canvas.js';
import { section, slider, choice, el } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

// Bar charts stack under the track on phones.
export const tallOnMobile = true;

export const equations = [
  { html: 'p = mv', what: 'momentum is a vector: sign gives direction' },
  { html: 'm<sub>1</sub>v<sub>1</sub> + m<sub>2</sub>v<sub>2</sub> = m<sub>1</sub>v<sub>1</sub>′ + m<sub>2</sub>v<sub>2</sub>′', what: 'conservation of momentum' },
  { html: 'J = FΔt = Δp', what: 'impulse' },
  { html: 'E<sub>k</sub> = ½mv²', what: 'conserved only in elastic collisions' },
];

export const prompts = [
  'Predict the final velocities with conservation of momentum, then play to check.',
  'Compare the impulse on each cart. Why are they equal and opposite?',
  'Make the collision perfectly inelastic. Where does the “lost” kinetic energy go?',
  'Equal masses, elastic, cart 2 at rest: what happens? Try a heavy cart hitting a light one, then the reverse.',
  'Watch the total-momentum bar during the collision. Does it ever change?',
];

export const legend = [
  { color: 'series-a', label: 'cart 1' },
  { color: 'series-b', label: 'cart 2' },
  { color: 'total', label: 'total' },
];

const TYPES = [
  { value: 1, label: 'Elastic (bounce, Ek conserved)' },
  { value: 0.5, label: 'Inelastic (some Ek lost)' },
  { value: 0, label: 'Perfectly inelastic (carts stick)' },
];

const TRACK = 8; // m
const CW = 0.6; // cart length, m

function table(parent) {
  const t = el('table', { class: 'data-table' }, parent);
  // Quantities down the side, carts across: seven columns do not fit the panel.
  const ROWS = ['v', 'v′', 'p', 'p′', 'E<sub>k</sub>', 'E<sub>k</sub>′'];
  t.innerHTML = `<thead><tr><th></th><th>Cart 1</th><th>Cart 2</th><th>Total</th></tr></thead><tbody>${ROWS.map(
    (r, i) => `<tr${i % 2 ? ' class="after"' : ''}><td>${r}</td><td>—</td><td>—</td><td>—</td></tr>`
  ).join('')}</tbody>`;
  const note = el('p', { style: 'margin:8px 0 0;font-size:13px;color:var(--c-muted)' }, parent);
  return {
    // col 0 = cart 1, 1 = cart 2, 2 = total; values in ROWS order.
    set(col, values) {
      const trs = t.querySelectorAll('tbody tr');
      values.forEach((v, i) => {
        const td = trs[i].children[col + 1];
        if (td.textContent !== v) td.textContent = v;
      });
    },
    note(s) {
      if (note.innerHTML !== s) note.innerHTML = s;
    },
  };
}

export function mount(ui) {
  const c1 = section(ui.controls, 'Cart 1 (left)');
  const m1 = slider(c1, { label: 'Mass m<sub>1</sub>', min: 0.5, max: 5, step: 0.1, value: 2, unit: 'kg' });
  const v1 = slider(c1, { label: 'Velocity v<sub>1</sub>', min: -4, max: 6, step: 0.1, value: 3, unit: 'm/s' });
  const c2 = section(ui.controls, 'Cart 2 (right)');
  const m2 = slider(c2, { label: 'Mass m<sub>2</sub>', min: 0.5, max: 5, step: 0.1, value: 1, unit: 'kg' });
  const v2 = slider(c2, { label: 'Velocity v<sub>2</sub>', min: -6, max: 4, step: 0.1, value: 0, unit: 'm/s' });
  const kind = section(ui.controls, 'Collision');
  const type = choice(kind, { label: 'Type', options: TYPES, value: 1 });

  const tab = table(ui.readouts);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:4px 0 0;font-size:12px;color:var(--c-muted)">v in m/s, p in kg·m/s, E<sub>k</sub> in J; primes are after the collision. +x is to the right.</p>');

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  [m1, v1, m2, v2, type].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const s = { m1: m1.value, v1: v1.value, m2: m2.value, v2: v2.value, e: type.value };
    const x10 = 1.6;
    const x20 = 5.2;
    const tc = collisionTime({ gap: x20 - x10 - CW, v1: s.v1, v2: s.v2 });
    const after = collide1D(s);
    const hit = clk.t >= tc;
    const pos = (x0, v, vf) => (hit ? x0 + v * tc + vf * (clk.t - tc) : x0 + v * clk.t);
    const x1 = pos(x10, s.v1, after.v1f);
    const x2 = pos(x20, s.v2, after.v2f);
    const u1 = hit ? after.v1f : s.v1;
    const u2 = hit ? after.v2f : s.v2;
    if ((x1 < -0.8 || x2 > TRACK + 0.8 || x2 < -0.8 || x1 > TRACK + 0.8 || clk.t > 12) && clk.running) clk.pause();

    clear(ctx, w, h);
    const narrow = w < 560;
    const trackH = h * (narrow ? 0.34 : 0.5);
    const view = makeView({ x: 0, y: 0, w, h: trackH }, { xMin: -0.4, xMax: TRACK + 0.4, yMin: -0.5, yMax: 1.3 }, { pad: 20 });
    line(ctx, view.px(-0.4), view.py(0), view.px(TRACK + 0.4), view.py(0), { color: th.ink, width: 2 });
    for (let x = 0; x <= TRACK; x++) text(ctx, `${x}`, view.px(x), view.py(0) + 14, { color: th.muted, size: 11, align: 'center' });

    const cart = (x, m, v, color, label) => {
      const cw = CW * view.sx;
      const ch = cw * (0.35 + 0.12 * m);
      const left = view.px(x - CW / 2);
      const top = view.py(0) - ch - 8;
      ctx.fillStyle = color;
      roundRect(ctx, left, top, cw, ch, 5);
      ctx.fill();
      ctx.fillStyle = th.ink;
      for (const wx of [0.25, 0.75]) {
        ctx.beginPath();
        ctx.arc(left + cw * wx, view.py(0) - 5, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      if (cw > 48) text(ctx, label, left + cw / 2, top + ch / 2, { color: th.surface, size: 12, weight: 700, align: 'center' });
      arrow(ctx, left + cw / 2, top - 18, vecLen(v, 3, 90), 0, { color: th.velocity, width: 2.5 });
      text(ctx, `${fmt(snap(v, 1), 3)} m/s`, left + cw / 2, top - 36, { color: th.velocity, size: 12, align: 'center' });
    };
    cart(x1, s.m1, u1, th.seriesA, `${fmt(s.m1, 2)} kg`);
    cart(x2, s.m2, u2, th.seriesB, `${fmt(s.m2, 2)} kg`);
    if (tc === Infinity) text(ctx, 'These carts never meet — cart 1 must be faster than cart 2.', 12, 18, { color: th.muted, size: 13 });
    else if (hit) text(ctx, `Collision at t = ${fmt(tc)} s`, 12, 18, { color: th.muted, size: 13 });

    // Live bar charts: momentum (signed) and kinetic energy.
    const p1 = momentum(s.m1, u1);
    const p2 = momentum(s.m2, u2);
    const k1 = kineticEnergy(s.m1, u1);
    const k2 = kineticEnergy(s.m2, u2);
    const pMax = Math.max(1e-6, Math.abs(momentum(s.m1, s.v1)) + Math.abs(momentum(s.m2, s.v2)), Math.abs(momentum(s.m1, after.v1f)) + Math.abs(momentum(s.m2, after.v2f)));
    const kMax = Math.max(1e-6, kineticEnergy(s.m1, s.v1) + kineticEnergy(s.m2, s.v2));
    const panelY = trackH + 10;
    const panelH = (h - panelY - 12) / (narrow ? 2 : 1);
    const half = w / 2;
    const rows = (x0, pw, title, vals, max, signed, panelY) => {
      text(ctx, title, x0, panelY + 8, { color: th.muted, size: 12, weight: 650 });
      const rowH = Math.min(44, (panelH - 26) / 3);
      const zero = signed ? x0 + 70 + (pw - 80) / 2 : x0 + 70;
      // Leave room past the bar end for its value label.
      const span = signed ? (pw - 120) / 2 : pw - 120;
      vals.forEach(([lab, v, col], i) => {
        const y = panelY + 26 + i * rowH;
        subText(ctx, lab, x0, y + rowH / 2 - 3, { color: th.ink, size: 12 });
        const len = (v / max) * span;
        ctx.fillStyle = col;
        ctx.fillRect(Math.min(zero, zero + len), y + 3, Math.abs(len), rowH - 12);
        text(ctx, fmt(snap(v, max), 3), zero + len + (len >= 0 ? 6 : -6), y + rowH / 2 - 3, { color: th.muted, size: 11, align: len >= 0 ? 'left' : 'right' });
      });
      line(ctx, zero, panelY + 22, zero, panelY + 26 + 3 * rowH - 6, { color: th.ink });
    };
    const pw = narrow ? w - 28 : half - 28;
    rows(16, pw, 'Momentum p (kg·m/s)', [['p_1', p1, th.seriesA], ['p_2', p2, th.seriesB], ['p_total', p1 + p2, th.total]], pMax, true, panelY);
    rows(narrow ? 16 : half + 12, pw, 'Kinetic energy (J)', [['E_k1', k1, th.seriesA], ['E_k2', k2, th.seriesB], ['E_k total', k1 + k2, th.total]], kMax, false, narrow ? panelY + panelH : panelY);

    const f = (x) => fmt(snap(x, pMax + kMax), 3);
    const pb1 = momentum(s.m1, s.v1), pb2 = momentum(s.m2, s.v2);
    const pa1 = momentum(s.m1, after.v1f), pa2 = momentum(s.m2, after.v2f);
    const kb1 = kineticEnergy(s.m1, s.v1), kb2 = kineticEnergy(s.m2, s.v2);
    const ka1 = kineticEnergy(s.m1, after.v1f), ka2 = kineticEnergy(s.m2, after.v2f);
    const never = tc === Infinity;
    const dash = (x) => (never ? '—' : f(x));
    tab.set(0, [f(s.v1), dash(after.v1f), f(pb1), dash(pa1), f(kb1), dash(ka1)]);
    tab.set(1, [f(s.v2), dash(after.v2f), f(pb2), dash(pa2), f(kb2), dash(ka2)]);
    tab.set(2, ['', '', f(pb1 + pb2), dash(pa1 + pa2), f(kb1 + kb2), dash(ka1 + ka2)]);
    tab.note(never ? 'No collision.' : `Impulse on cart 1: J = Δp = <b>${f(pa1 - pb1)}</b> kg·m/s; on cart 2: <b>${f(pa2 - pb2)}</b> kg·m/s. ΔE<sub>k</sub> = ${f(ka1 + ka2 - kb1 - kb2)} J.`);
    clk.setTimeLabel(`t = ${clk.t.toFixed(2)} s`);
  }
}
