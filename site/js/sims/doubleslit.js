import * as I from '../physics/interference.js';
import { fitCanvas, theme, clear, line, text, subText } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { wavelengthToRgb } from '../lib/color.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'λ = d sin θ / n', what: 'bright fringe of order n (exact)' },
  { html: 'λ = xd / (nl)', what: 'the same, for small angles (sin θ ≈ tan θ = x/l)' },
  { html: 'd = 1 / (lines per metre)', what: 'slit spacing of a grating' },
];

export const prompts = [
  'Double slit: measure x for n = 1 and use λ = xd/(nl). Does it match the λ you set?',
  'Halve d. Predict what happens to the fringe spacing before you move the slider.',
  'Switch to a 600 lines/mm grating. Why do the two λ readouts now disagree?',
  'What is the highest order you can see for violet light? For red? Check with n ≤ d/λ.',
  'Move the screen twice as far away. Which readouts change, and which stay the same?',
];

export const legend = [
  { color: 'accent', label: 'path to fringe n' },
  { color: 'muted', label: 'central axis' },
];

const MODES = [
  { value: 'slit', label: 'Double slit' },
  { value: 'grating', label: 'Diffraction grating' },
];

export function mount(ui) {
  const box = section(ui.controls, 'Setup');
  const mode = choice(box, { label: 'Apparatus', options: MODES, value: 'slit' });
  const lam = slider(box, { label: 'Wavelength λ', min: 380, max: 750, step: 1, value: 600, unit: 'nm' });
  const slitBox = document.createElement('div');
  box.appendChild(slitBox);
  const dSlit = slider(slitBox, { label: 'Slit separation d', min: 0.05, max: 1, step: 0.01, value: 0.25, unit: 'mm' });
  const gratBox = document.createElement('div');
  box.appendChild(gratBox);
  const lines = slider(gratBox, { label: 'Grating lines per mm', min: 100, max: 1200, step: 10, value: 600, unit: '/mm' });
  const l = slider(box, { label: 'Slits to screen l', min: 0.5, max: 3, step: 0.05, value: 2, unit: 'm' });
  const nBox = section(ui.controls, 'Measure');
  const n = slider(nBox, { label: 'Bright fringe order n', min: 1, max: 5, step: 1, value: 1 });

  const out = readouts(ui.readouts, [
    { id: 'd', label: 'd' },
    { id: 'theta', label: 'θ for this order' },
    { id: 'x', label: 'x (centre to fringe n)' },
    { id: 'lamSmall', label: 'λ = xd/(nl)' },
    { id: 'lamExact', label: 'λ = d sin θ / n' },
    { id: 'max', label: 'Highest order' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  createClock(ui.transport, { frame: draw });
  ui.transport.hidden = true;

  function draw() {
    const { ctx, w, h } = canvas;
    const th = theme();
    const grating = mode.value === 'grating';
    slitBox.hidden = grating;
    gratBox.hidden = !grating;
    const lambda = lam.value * 1e-9;
    const d = grating ? I.spacingFromLines(lines.value) : dSlit.value * 1e-3;
    const L = l.value;
    const nMax = I.maxOrder(lambda, d);
    const order = Math.min(n.value, Math.max(1, nMax));
    const f = I.brightFringe(lambda, d, order, L);
    const colour = wavelengthToRgb(lam.value) ?? th.ink;

    clear(ctx, w, h);

    // --- top: the screen pattern, x across ---
    const stripY = 30;
    const stripH = Math.min(90, h * 0.22);
    const shownOrder = Math.min(Math.max(order + 1, 3), Math.max(nMax, 1));
    const edge = I.brightFringe(lambda, d, shownOrder, L);
    const xRange = Math.min(edge ? edge.x * 1.15 : 5 * L, 5 * L);
    const X = (x) => w / 2 + (x / xRange) * (w / 2 - 20);
    const N = grating ? 24 : 2;
    ctx.fillStyle = '#000';
    ctx.fillRect(20, stripY, w - 40, stripH);
    for (let px = 20; px < w - 20; px++) {
      const x = ((px - w / 2) / (w / 2 - 20)) * xRange;
      const inten = I.intensity(Math.atan2(x, L), lambda, d, N);
      ctx.globalAlpha = Math.min(1, inten * 1.1);
      ctx.fillStyle = colour;
      ctx.fillRect(px, stripY, 1, stripH);
    }
    ctx.globalAlpha = 1;
    text(ctx, 'screen', 20, stripY - 12, { color: th.muted, size: 12 });
    for (let k = -nMax; k <= nMax; k++) {
      const fk = I.brightFringe(lambda, d, Math.abs(k), L);
      if (!fk) continue;
      const xk = Math.sign(k) * (k === 0 ? 0 : fk.x);
      if (Math.abs(xk) > xRange) continue;
      text(ctx, `${k}`, X(xk), stripY + stripH + 12, { color: k === order || k === -order ? th.ink : th.muted, size: 11, weight: k === order ? 700 : 500, align: 'center' });
    }
    if (f) {
      // Bracket the distance x from the central maximum to fringe n.
      const y = stripY + stripH + 28;
      line(ctx, X(0), y, X(f.x), y, { color: th.ink, width: 1.5 });
      line(ctx, X(0), y - 5, X(0), y + 5, { color: th.ink, width: 1.5 });
      line(ctx, X(f.x), y - 5, X(f.x), y + 5, { color: th.ink, width: 1.5 });
      text(ctx, `x = ${fmt(f.x * 100, 3)} cm`, (X(0) + X(f.x)) / 2, y + 13, { color: th.ink, size: 12, align: 'center' });
    }

    // --- bottom: the geometry (not to scale) ---
    const gy = stripY + stripH + 70;
    const gh = h - gy - 20;
    const sx = 60;
    const scrX = w - 40;
    const cy = gy + gh / 2;
    ctx.fillStyle = th.ink;
    ctx.fillRect(sx - 3, gy, 6, gh);
    ctx.fillStyle = th.surface;
    ctx.fillRect(sx - 3, cy - 10, 6, 5);
    ctx.fillRect(sx - 3, cy + 5, 6, 5);
    line(ctx, scrX, gy, scrX, gy + gh, { color: th.ink, width: 3 });
    line(ctx, sx, cy, scrX, cy, { color: th.muted, width: 1, dash: [5, 5] });
    text(ctx, grating ? 'grating' : 'slits', sx, gy - 10, { color: th.muted, size: 12, align: 'center' });
    subText(ctx, `l = ${fmt(L, 3)} m`, (sx + scrX) / 2, cy + 16, { color: th.muted, size: 12, align: 'center' });
    if (f) {
      // Draw the true angle; the screen is scaled so fringe n stays on it.
      const rad = (f.thetaDeg * Math.PI) / 180;
      const dx = scrX - sx;
      const yHit = Math.max(gy, cy - Math.tan(rad) * dx);
      const xHit = yHit === gy ? sx + (cy - gy) / Math.tan(rad) : scrX;
      line(ctx, sx, cy, xHit, yHit, { color: th.accent, width: 2.5 });
      ctx.strokeStyle = th.ink;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sx, cy, 46, -rad, 0);
      ctx.stroke();
      text(ctx, `θ = ${fmt(f.thetaDeg, 3)}°`, sx + 56, cy - 14, { color: th.ink, size: 12, weight: 650 });
      text(ctx, 'angle drawn true; distances not to scale', w - 20, h - 8, { color: th.muted, size: 11, align: 'right' });
    }

    // Readouts.
    out.set('d', grating ? `${fmt(d)} m (${lines.value}/mm)` : `${fmt(d)} m`);
    if (f) {
      const lamSmall = I.wavelengthFromFringe(f.x, d, order, L);
      const lamExact = I.wavelengthFromAngle(d, f.thetaDeg, order);
      out.set('theta', `${fmt(f.thetaDeg, 3)}° (n = ${order})`);
      out.set('x', `${fmt(f.x)} m`);
      const diff = (100 * (lamSmall - lamExact)) / lamExact;
      out.set('lamSmall', `${fmt(lamSmall * 1e9, 3)} nm${Math.abs(diff) >= 0.5 ? ` (${diff > 0 ? '+' : ''}${diff.toFixed(1)} %)` : ''}`);
      out.set('lamExact', `${fmt(lamExact * 1e9, 3)} nm`);
    } else {
      for (const id of ['theta', 'x', 'lamSmall', 'lamExact']) out.set(id, '— (no such order)');
    }
    out.set('max', `n = ${nMax}${n.value > nMax ? ` (n = ${n.value} does not exist)` : ''}`);
  }
}
