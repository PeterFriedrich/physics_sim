import * as M from '../physics/massspec.js';
import { radius } from '../physics/fields.js';
import { plateField } from '../physics/electrostatics.js';
import { e, u, mp, alphaMass } from '../physics/constants.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: '|E| = ΔV / Δd', what: 'field between the selector plates' },
  { html: 'qE = qvB<sub>1</sub> &nbsp;⇒&nbsp; v = E / B<sub>1</sub>', what: 'only this speed goes straight through' },
  { html: 'qvB<sub>2</sub> = mv² / r &nbsp;⇒&nbsp; r = mv / (qB<sub>2</sub>)', what: 'half circle in the second field' },
  { html: 'm = qB<sub>2</sub>r / v', what: 'measuring the mass from where it lands' },
];

export const prompts = [
  'Calculate the selected speed from ΔV, d and B<sub>1</sub>. Check it against the readout.',
  'Why do faster ions bend up and slower ions bend down inside the selector?',
  'Choose the carbon mix. Predict how far apart the ¹²C⁺ and ¹⁴C⁺ marks land.',
  'Double B<sub>2</sub>. What happens to where every ion lands?',
  'An alpha particle and a proton leave the selector at the same speed. Which has the larger radius, and by what factor?',
];

export const legend = [
  { color: 'friction', label: 'ions' },
  { color: 'force', label: 'electric force' },
  { color: 'velocity', label: 'magnetic force' },
];

const IONS = [
  { value: 'c12', label: '¹²C⁺ (12 u, +e)', ions: [{ name: '¹²C⁺', m: 12 * u, q: e }] },
  { value: 'c14', label: '¹⁴C⁺ (14 u, +e)', ions: [{ name: '¹⁴C⁺', m: 14 * u, q: e }] },
  { value: 'cmix', label: 'Mix: ¹²C⁺ and ¹⁴C⁺', ions: [{ name: '¹²C⁺', m: 12 * u, q: e }, { name: '¹⁴C⁺', m: 14 * u, q: e }] },
  { value: 'nemix', label: 'Mix: ²⁰Ne⁺ and ²²Ne⁺', ions: [{ name: '²⁰Ne⁺', m: 20 * u, q: e }, { name: '²²Ne⁺', m: 22 * u, q: e }] },
  { value: 'proton', label: 'Proton (+e)', ions: [{ name: 'p⁺', m: mp, q: e }] },
  { value: 'alpha', label: 'Alpha particle (+2e)', ions: [{ name: 'α', m: alphaMass, q: 2 * e }] },
];

const L = 0.1; // selector length, m
const GAP = 0.03; // selector exit to B₂ region, m
const SLIT = 5e-4; // exit slit half-width, m
const X2 = L + GAP; // where B₂ starts and the detector sits

export function mount(ui) {
  const ionBox = section(ui.controls, 'Ions');
  const ionSel = choice(ionBox, { label: 'Ion', options: IONS, value: 'cmix' });
  const vSrc = slider(ionBox, { label: 'Source speeds centred on (× 10⁵ m/s)', min: 0.5, max: 5, step: 0.1, value: 2 });
  const sel = section(ui.controls, 'Velocity selector');
  const dV = slider(sel, { label: 'Plate voltage ΔV', min: 0, max: 2000, step: 10, value: 1000, unit: 'V' });
  const d = slider(sel, { label: 'Plate gap d', min: 0.5, max: 3, step: 0.1, value: 1, unit: 'cm' });
  const B1 = slider(sel, { label: 'Field B<sub>1</sub> (into page)', min: 0.05, max: 1, step: 0.01, value: 0.5, unit: 'T' });
  const sep = section(ui.controls, 'Separation chamber');
  const B2 = slider(sep, { label: 'Field B<sub>2</sub> (out of page)', min: 0.1, max: 1, step: 0.01, value: 0.5, unit: 'T' });

  const out = readouts(ui.readouts, [
    { id: 'E', label: 'Field E' },
    { id: 'v', label: 'Selected speed v' },
    { id: 'F', label: 'F<sub>e</sub> = F<sub>m</sub> (per ion)' },
    { id: 'r1', label: 'Radius r (ion 1)' },
    { id: 'x1', label: 'Lands at 2r (ion 1)' },
    { id: 'r2', label: 'Radius r (ion 2)' },
    { id: 'x2', label: 'Lands at 2r (ion 2)' },
    { id: 'gap', label: 'Separation of marks' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Ion masses are mass number × u (u = 1.66 × 10⁻²⁷ kg), as Diploma questions give them. Ions enter the selector with a spread of speeds; only v = E/B₁ goes straight through the exit slit.</p>');

  const canvas = fitCanvas(ui.canvas);
  let flying = [];
  let marks = [];
  let spawn = 0;
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const reset = () => {
    flying = [];
    marks = [];
  };
  const clock = createClock(ui.transport, { frame: draw, autoplay: true, onReset: reset });
  [ionSel, vSrc, dV, d, B1, B2].forEach((c) => c.onChange(reset));

  function draw(clk, dt) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const dm = d.value / 100;
    const E = plateField(dV.value, dm);
    const vSel = M.selectorSpeed(E, B1.value);
    const kinds = ionSel.option.ions;
    const rMax = Math.max(...kinds.map((k) => radius(k.m, vSel || 1, k.q, B2.value)));

    // Playback: the selector takes ~1.5 s to cross at the selected speed.
    const scale = L / (vSel || 2e5) / 1.5;
    if (dt > 0) {
      spawn += dt;
      while (spawn > 0.18) {
        spawn -= 0.18;
        const kind = kinds[Math.floor(rand() * kinds.length)];
        const v = vSrc.value * 1e5 * (0.5 + rand());
        const path = M.selectorExit({ q: kind.q, m: kind.m, v, E, B1: B1.value, L, d: dm, slitHalf: SLIT });
        flying.push({ kind, v, path, t: 0 });
      }
      for (const f of flying) f.t += dt * scale;
    }

    const yMin = -Math.min(0.5, Math.max(0.12, 2.3 * rMax));
    const view = makeView({ w, h }, { xMin: -0.03, xMax: X2 + Math.max(0.14, rMax * 1.25), yMin, yMax: 0.03 }, { pad: 14 });
    clear(ctx, w, h);

    // B₂ region (out of page: dots) and the detector plate along x = X2.
    const bx0 = view.px(X2);
    ctx.fillStyle = th.muted;
    for (let px = bx0 + 12; px < w; px += 26) {
      for (let py = view.py(0.03) + 10; py < h; py += 26) {
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    line(ctx, bx0, view.py(-0.002), bx0, h, { color: th.ink, width: 3 });
    text(ctx, 'detector', bx0 - 6, h - 12, { color: th.muted, size: 11, align: 'right' });
    text(ctx, 'B₂ out of page', w - 10, 14, { color: th.muted, size: 12, align: 'right' });

    // Selector: plates, crosses for B₁ into the page, field arrows.
    const x0 = view.px(0);
    const x1 = view.px(L);
    const top = view.py(dm / 2);
    const bot = view.py(-dm / 2);
    ctx.fillStyle = th.friction;
    ctx.fillRect(x0, top - 5, x1 - x0, 5);
    ctx.fillStyle = th.velocity;
    ctx.fillRect(x0, bot, x1 - x0, 5);
    text(ctx, '+', x0 - 8, top - 3, { color: th.ink, size: 13, weight: 700, align: 'center' });
    text(ctx, '−', x0 - 8, bot + 3, { color: th.ink, size: 13, weight: 700, align: 'center' });
    text(ctx, 'velocity selector (B₁ into page)', (x0 + x1) / 2, top - 16, { color: th.muted, size: 11, align: 'center' });
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1.2;
    for (let px = x0 + 10; px < x1; px += 20) {
      const py = (top + bot) / 2 + (bot - top) * 0.28;
      ctx.beginPath();
      ctx.moveTo(px - 3, py - 3);
      ctx.lineTo(px + 3, py + 3);
      ctx.moveTo(px + 3, py - 3);
      ctx.lineTo(px - 3, py + 3);
      ctx.stroke();
    }
    // Exit slit.
    line(ctx, view.px(L + 0.004), top - 5, view.px(L + 0.004), view.py(SLIT), { color: th.ink, width: 3 });
    line(ctx, view.px(L + 0.004), view.py(-SLIT), view.px(L + 0.004), bot + 5, { color: th.ink, width: 3 });

    // Force pair on a reference ion at the selector centre.
    if (kinds.length && vSel > 0) {
      const cx = view.px(L / 2);
      const cy = view.py(0);
      arrow(ctx, cx, cy, 0, 30, { color: th.force, width: 2.5, label: 'F_e' });
      arrow(ctx, cx, cy, 0, -30, { color: th.velocity, width: 2.5, label: 'F_m' });
    }

    // Landed marks.
    for (const mk of marks) {
      ctx.fillStyle = th.friction;
      ctx.fillRect(bx0 - 6, view.py(mk.y) - 1.5, 6, 3);
    }

    // Ions in flight.
    const keep = [];
    for (const f of flying) {
      const { path, v, kind } = f;
      let x;
      let y;
      let done = false;
      if (f.t <= path.t) {
        x = v * f.t;
        y = 0.5 * path.a * f.t * f.t;
      } else if (path.outcome !== 'pass') {
        x = path.x;
        y = path.y;
        done = f.t > path.t * 1.4;
      } else {
        const tAfter = f.t - path.t;
        const xs = L + v * tAfter;
        if (xs < X2) {
          x = xs;
          y = path.y;
        } else {
          const r = radius(kind.m, v, kind.q, B2.value);
          const phi = ((xs - X2) / r);
          if (phi >= Math.PI) {
            marks.push({ y: path.y - 2 * r });
            if (marks.length > 200) marks.shift();
            done = true;
          }
          x = X2 + r * Math.sin(Math.min(phi, Math.PI));
          y = path.y - r + r * Math.cos(Math.min(phi, Math.PI));
        }
      }
      if (!done) {
        keep.push(f);
        ctx.fillStyle = th.friction;
        ctx.beginPath();
        ctx.arc(view.px(x), view.py(y), kind.m > 13 * u ? 3.6 : 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    flying = keep;

    // Readouts for the selected speed.
    const k1 = kinds[0];
    const k2 = kinds[1];
    const F = M.selectorForces({ q: k1.q, v: vSel, E, B1: B1.value });
    out.set('E', `${fmt(E)} N/C`);
    out.set('v', `${fmt(vSel)} m/s`);
    out.set('F', `${fmt(F.Fe)} N`);
    const r1 = radius(k1.m, vSel, k1.q, B2.value);
    out.set('r1', `${fmt(r1 * 100)} cm (${k1.name})`);
    out.set('x1', `${fmt(M.landingDistance(k1.m, vSel, k1.q, B2.value) * 100)} cm`);
    if (k2) {
      const r2 = radius(k2.m, vSel, k2.q, B2.value);
      out.set('r2', `${fmt(r2 * 100)} cm (${k2.name})`);
      out.set('x2', `${fmt(M.landingDistance(k2.m, vSel, k2.q, B2.value) * 100)} cm`);
      out.set('gap', `${fmt(Math.abs(M.landingDistance(k2.m, vSel, k2.q, B2.value) - M.landingDistance(k1.m, vSel, k1.q, B2.value)) * 100)} cm`);
    } else {
      out.set('r2', '— (one ion)');
      out.set('x2', '—');
      out.set('gap', '—');
    }
    clk.setTimeLabel(`${marks.length} ions detected`);
  }
}
