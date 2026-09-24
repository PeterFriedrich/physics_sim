import * as F from '../physics/fields.js';
import { e, mp, me, alphaMass } from '../physics/constants.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text, niceStep } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'F<sub>m</sub> = qvB', what: 'velocity perpendicular to the field' },
  { html: 'F<sub>m</sub> = F<sub>c</sub> &nbsp;⇒&nbsp; qvB = mv² / r', what: 'the magnetic force is the centripetal force' },
  { html: 'r = mv / (qB)', what: 'radius of the path' },
  { html: 'T = 2πm / (qB)', what: 'period does not depend on speed' },
];

export const prompts = [
  'Use a hand rule to predict which way a proton curves, then fire it. Now try an electron.',
  'Double the speed. What happens to the radius? To the period?',
  'Switch the field direction from out of the page to into the page. What changes?',
  'Why does the magnetic force never change the particle’s speed?',
  'An alpha particle has twice the charge of a proton and about four times the mass. Predict r<sub>α</sub> / r<sub>p</sub> at the same speed.',
];

export const legend = [
  { color: 'velocity', label: 'velocity' },
  { color: 'force', label: 'magnetic force' },
];

// Alpha particle: charge +2e, mass ≈ 4 u.
const PARTICLES = [
  { value: 'proton', label: 'Proton (+e)', q: e, m: mp },
  { value: 'electron', label: 'Electron (−e)', q: -e, m: me },
  { value: 'alpha', label: 'Alpha particle (+2e)', q: 2 * e, m: alphaMass },
];

// Speeds and fields students meet, from tabletop electron beams to mass spectrometers.
const FIELD_UNITS = {
  proton: { B: [0.01, 1, 0.01, 0.2], unit: 'T', mult: 1 },
  electron: { B: [0.1, 10, 0.1, 2], unit: 'mT', mult: 1e-3 },
  alpha: { B: [0.01, 1, 0.01, 0.2], unit: 'T', mult: 1 },
};

export function mount(ui) {
  const box = section(ui.controls, 'Particle');
  const part = choice(box, { label: 'Particle', options: PARTICLES, value: 'proton' });
  const v = slider(box, { label: 'Speed v (× 10⁶ m/s)', min: 0.1, max: 10, step: 0.1, value: 2, unit: '' });
  const field = section(ui.controls, 'Magnetic field');
  const dir = choice(field, {
    label: 'Direction',
    options: [
      { value: 1, label: 'Out of the page (•)' },
      { value: -1, label: 'Into the page (×)' },
    ],
    value: 1,
  });
  const fieldBox = document.createElement('div');
  field.appendChild(fieldBox);
  let B;
  const buildB = () => {
    fieldBox.textContent = '';
    const u = FIELD_UNITS[part.value];
    B = slider(fieldBox, { label: 'Strength B', min: u.B[0], max: u.B[1], step: u.B[2], value: u.B[3], unit: u.unit });
    B.onChange(restart);
  };

  const out = readouts(ui.readouts, [
    { id: 'q', label: 'Charge q' },
    { id: 'm', label: 'Mass m' },
    { id: 'F', label: 'Force F<sub>m</sub>' },
    { id: 'r', label: 'Radius r' },
    { id: 'T', label: 'Period T' },
    { id: 'turn', label: 'Curves' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw, autoplay: true });
  function restart() {
    clock.reset();
    clock.play();
  }
  buildB();
  part.onChange(() => (buildB(), restart()));
  [v, dir].forEach((c) => c.onChange(restart));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const pt = part.option;
    const Bmag = B.value * FIELD_UNITS[part.value].mult;
    const Bz = Bmag * dir.value;
    const speed = v.value * 1e6;
    const r = F.radius(pt.m, speed, pt.q, Bmag);
    const T = F.period(pt.m, pt.q, Bmag);
    // Real periods are nanoseconds; show one revolution per 4 s of playback.
    const tSim = (clk.t / 4) * T;
    const s0 = { q: pt.q, m: pt.m, Bz, vx: speed, vy: 0, x0: 0, y0: 0 };

    // Frame the circle: its centre is r to the particle's left or right.
    const cy = F.omega(pt.q, pt.m, Bz) > 0 ? r : -r;
    const box = { xMin: -1.9 * r, xMax: 1.9 * r, yMin: cy - 1.3 * r, yMax: cy + 1.3 * r };
    const view = makeView({ w, h }, box, { pad: 18 });
    clear(ctx, w, h);

    // Field symbols on a pixel grid.
    const gap = 38;
    ctx.fillStyle = ctx.strokeStyle = th.muted;
    ctx.lineWidth = 1.3;
    for (let px = gap / 2; px < w; px += gap) {
      for (let py = gap / 2; py < h; py += gap) {
        if (dir.value > 0) {
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(px - 3.5, py - 3.5);
          ctx.lineTo(px + 3.5, py + 3.5);
          ctx.moveTo(px + 3.5, py - 3.5);
          ctx.lineTo(px - 3.5, py + 3.5);
          ctx.stroke();
        }
      }
    }

    // Path so far (at most one full circle).
    const tDraw = Math.min(tSim, T);
    ctx.save();
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const n = 200;
    for (let i = 0; i <= n; i++) {
      const st = F.stateAt(s0, (tDraw * i) / n);
      i ? ctx.lineTo(view.px(st.x), view.py(st.y)) : ctx.moveTo(view.px(st.x), view.py(st.y));
    }
    ctx.stroke();
    ctx.restore();

    const st = F.stateAt(s0, tSim);
    const bx = view.px(st.x);
    const by = view.py(st.y);
    const vl = Math.hypot(st.vx, st.vy);
    arrow(ctx, bx, by, (st.vx / vl) * 70, (-st.vy / vl) * 70, { color: th.velocity, label: 'v' });
    const f = F.forceVector(s0, st.vx, st.vy);
    const fl = Math.hypot(f.Fx, f.Fy);
    arrow(ctx, bx, by, (f.Fx / fl) * 60, (-f.Fy / fl) * 60, { color: th.force, label: 'F' });
    ctx.fillStyle = pt.q > 0 ? th.friction : th.velocity;
    ctx.beginPath();
    ctx.arc(bx, by, 9, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, pt.q > 0 ? '+' : '−', bx, by + 1, { color: '#fff', size: 14, weight: 700, align: 'center' });

    // Scale bar.
    const step = niceStep(r * 2, 2);
    const sbx = 16;
    const sby = h - 18;
    line(ctx, sbx, sby, sbx + step * view.sx, sby, { color: th.ink, width: 2 });
    const unit = step >= 1 ? [step, 'm'] : step >= 1e-3 ? [step * 1e3, 'mm'] : [step * 1e6, 'µm'];
    text(ctx, `${fmt(unit[0], 2)} ${unit[1]}`, sbx, sby - 10, { color: th.ink, size: 12 });
    text(ctx, `B ${dir.value > 0 ? 'out of' : 'into'} the page`, w - 12, 18, { color: th.muted, size: 13, align: 'right' });

    const cw = F.omega(pt.q, pt.m, Bz) < 0;
    out.set('q', `${fmt(pt.q)} C`);
    out.set('m', `${fmt(pt.m)} kg`);
    out.set('F', `${fmt(F.magneticForce(pt.q, speed, Bmag))} N`);
    out.set('r', `${fmt(r)} m`);
    out.set('T', `${fmt(T)} s`);
    out.set('turn', cw ? 'clockwise' : 'counter-clockwise');
    clk.setTimeLabel(`${(tSim / T).toFixed(2)} rev`);
  }
}
