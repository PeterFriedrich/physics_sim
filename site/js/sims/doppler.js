import { dopplerSource, wavefronts } from '../physics/waves.js';
import { fitCanvas, makeView, theme, clear, arrow, text } from '../lib/canvas.js';
import { section, slider, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'f = f<sub>s</sub> · v / (v − v<sub>s</sub>)', what: 'source moving toward you: higher pitch' },
  { html: 'f = f<sub>s</sub> · v / (v + v<sub>s</sub>)', what: 'source moving away: lower pitch' },
  { html: 'v = fλ', what: 'the speed of sound doesn’t change, so a shorter λ means a higher f' },
];

export const prompts = [
  'With the source at rest, are the wavefronts evenly spaced? What does each listener hear?',
  'Speed the source up. Which listener hears a higher pitch? Look at the spacing of the wavefronts in front.',
  'A 500 Hz siren approaches at 30.0 m/s. Predict what you hear, then set it up and check.',
  'Does the speed of the sound waves change when the source moves? What does change?',
  'What happens to the wavefronts ahead as v<sub>s</sub> gets close to v?',
];

export const legend = [
  { color: 'normal', label: 'wavefronts' },
  { color: 'velocity', label: 'source velocity' },
];

const LOOP = 14; // periods per pass across the picture
const PPS = 1.5; // drawn periods per real second: the real sound is hundreds per second

export function mount(ui) {
  const box = section(ui.controls, 'Source');
  const fs = slider(box, { label: 'Source frequency f<sub>s</sub>', min: 100, max: 1000, step: 10, value: 500, unit: 'Hz' });
  const vs = slider(box, { label: 'Source speed v<sub>s</sub>', min: 0, max: 250, step: 1, value: 100, unit: 'm/s' });
  const v = slider(box, { label: 'Speed of sound v', min: 320, max: 360, step: 1, value: 343, unit: 'm/s' });

  const out = readouts(ui.readouts, [
    { id: 'l0', label: 'λ with the source at rest' },
    { id: 'fa', label: 'Heard ahead f' },
    { id: 'la', label: 'λ ahead' },
    { id: 'fb', label: 'Heard behind f' },
    { id: 'lb', label: 'λ behind' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw, autoplay: true });
  [fs, vs, v].forEach((c) => c.onChange(() => clock.reset()));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const p = { fs: fs.value, v: v.value, vs: vs.value };
    const d = dopplerSource(p);
    const mach = p.vs / p.v;
    // Drawn in units of the at-rest wavelength; time in source periods.
    const t = (clk.t * PPS) % LOOP;
    const x0 = (-mach * LOOP) / 2;
    const view = makeView({ w, h }, { xMin: -10, xMax: 10, yMin: -6.5, yMax: 6.5 }, { pad: 10 });
    clear(ctx, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    ctx.strokeStyle = th.normal;
    ctx.lineWidth = 1.5;
    for (const f of wavefronts(mach, t)) {
      if (f.r <= 0) continue;
      ctx.globalAlpha = Math.max(0.25, 1 - f.r / 14);
      ctx.beginPath();
      ctx.arc(view.px(x0 + f.x), view.py(0), f.r * view.sx, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    const sx = view.px(x0 + mach * t);
    const sy = view.py(0);
    ctx.fillStyle = th.ink;
    ctx.beginPath();
    ctx.arc(sx, sy, 7, 0, Math.PI * 2);
    ctx.fill();
    if (p.vs > 0) arrow(ctx, sx, sy - 18, 20 + 60 * mach, 0, { color: th.velocity, label: 'v_s' });

    // Listeners at each side.
    const ly = h - 18;
    text(ctx, `◀ behind: ${fmt(d.fBehind)} Hz`, 10, ly, { color: th.ink, size: 13, weight: 650 });
    text(ctx, `ahead: ${fmt(d.fAhead)} Hz ▶`, w - 10, ly, { color: th.ink, size: 13, weight: 650, align: 'right' });
    text(ctx, 'Drawn slowed down (real sound: hundreds of waves a second)', 10, 16, { color: th.muted, size: 12 });

    out.set('l0', `${fmt(d.lambda0)} m`);
    out.set('fa', `${fmt(d.fAhead)} Hz`);
    out.set('la', `${fmt(d.lambdaAhead)} m`);
    out.set('fb', `${fmt(d.fBehind)} Hz`);
    out.set('lb', `${fmt(d.lambdaBehind)} m`);
  }
}
