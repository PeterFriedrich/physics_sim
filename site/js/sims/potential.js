import * as P from '../physics/potential.js';
import { plateField } from '../physics/electrostatics.js';
import { e, me, mp, alphaMass } from '../physics/constants.js';
import { fitCanvas, theme, clear, arrow, line, text } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'ΔV = ΔE / q', what: 'potential difference is energy per unit charge' },
  { html: 'ΔE = qΔV', what: 'energy gained crossing ΔV (1 eV per electron per volt)' },
  { html: 'qΔV = ½mv²', what: 'from rest, all of it becomes kinetic energy' },
  { html: '|E| = ΔV / Δd', what: 'uniform field between the plates' },
];

export const prompts = [
  'An electron crosses 250 V. How much energy does it gain, in eV and in J?',
  'Calculate the electron’s final speed with qΔV = ½mv², then check the readout.',
  'Double the plate gap at the same ΔV. Does the final speed change? What does change?',
  'Switch to a proton at the same ΔV. Same energy gained — so why is it so much slower?',
  'Move the probe halfway across. What is V there, and what fraction of the final energy has the particle gained?',
];

export const legend = [
  { color: 'muted', label: 'equipotential lines' },
  { color: 'force', label: 'electric field E' },
  { color: 'velocity', label: 'velocity' },
];

const PARTICLES = [
  { value: 'electron', label: 'Electron (−e)', q: -e, m: me },
  { value: 'proton', label: 'Proton (+e)', q: e, m: mp },
  { value: 'alpha', label: 'Alpha particle (+2e)', q: 2 * e, m: alphaMass },
];

export function mount(ui) {
  const box = section(ui.controls, 'Particle');
  const part = choice(box, { label: 'Particle (starts at rest)', options: PARTICLES, value: 'electron' });
  const plates = section(ui.controls, 'Plates');
  const dV = slider(plates, { label: 'Potential difference ΔV', min: 10, max: 5000, step: 10, value: 250, unit: 'V' });
  const d = slider(plates, { label: 'Plate gap d', min: 1, max: 10, step: 0.5, value: 4, unit: 'cm' });
  const probeBox = section(ui.controls, 'Probe');
  const probe = slider(probeBox, { label: 'Probe distance from the − plate', min: 0, max: 100, step: 1, value: 50, unit: '% of d' });

  const out = readouts(ui.readouts, [
    { id: 'E', label: 'Field E' },
    { id: 'dE', label: 'Energy gained ΔE' },
    { id: 'v', label: 'Final speed' },
    { id: 't', label: 'Time to cross' },
    { id: 'Vp', label: 'V at the probe' },
    { id: 'now', label: 'Speed now' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">V = 0 at the negative plate. The particle starts at rest at the plate that repels it. Gravity is neglected.</p>');

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw, autoplay: true });
  [part, dV, d].forEach((c) => c.onChange(() => (clock.reset(), clock.play())));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const pt = part.option;
    const dm = d.value / 100;
    const tCross = P.crossingTime(pt.q, pt.m, dV.value, dm);
    // Playback: the crossing takes 2.5 s at 1×; then the particle waits at the far plate.
    const tSim = Math.min(tCross, (clk.t / 2.5) * tCross);
    if (clk.t > 3.5 && clk.running) clk.pause();
    const s = P.distanceAt(pt.q, pt.m, dV.value, dm, tSim);

    clear(ctx, w, h);
    // Plates: the start plate on the left. For a negative particle it is the − plate.
    const xl = w * 0.2;
    const xr = w * 0.8;
    const top = h * 0.14;
    const bot = h * 0.86;
    const startNegative = pt.q < 0;
    const leftColor = startNegative ? th.velocity : th.friction;
    const rightColor = startNegative ? th.friction : th.velocity;
    ctx.fillStyle = leftColor;
    ctx.fillRect(xl - 8, top, 8, bot - top);
    ctx.fillStyle = rightColor;
    ctx.fillRect(xr, top, 8, bot - top);
    ctx.fillStyle = th.surface;
    ctx.fillRect(xr, (top + bot) / 2 - 7, 8, 14); // exit hole
    text(ctx, startNegative ? '−' : '+', xl - 4, top - 14, { color: th.ink, size: 18, weight: 700, align: 'center' });
    text(ctx, startNegative ? '+' : '−', xr + 4, top - 14, { color: th.ink, size: 18, weight: 700, align: 'center' });

    // Equipotentials: evenly spaced, labelled from V = 0 at the − plate.
    const nLines = 5;
    const X = (frac) => xl + frac * (xr - xl);
    for (let i = 0; i <= nLines; i++) {
      const fracFromNeg = i / nLines;
      const x = startNegative ? X(fracFromNeg) : X(1 - fracFromNeg);
      if (i > 0 && i < nLines) line(ctx, x, top + 10, x, bot - 10, { color: th.muted, width: 1, dash: [4, 5] });
      text(ctx, `${fmt(P.potentialAt(fracFromNeg * dm, dm, dV.value), 3)} V`, x, bot + 16, { color: th.muted, size: 11, align: 'center' });
    }
    // Field arrows point from + to −.
    const dir = startNegative ? -1 : 1;
    for (const fy of [0.25, 0.75]) {
      const y = top + fy * (bot - top);
      arrow(ctx, (xl + xr) / 2 - (dir * 60) / 2, y, dir * 60, 0, { color: th.force, width: 2, head: 8, label: fy === 0.25 ? 'E' : '' });
    }

    // Probe.
    const pf = probe.value / 100;
    const probeX = startNegative ? X(pf) : X(1 - pf);
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(probeX, top + (bot - top) * 0.12, 6, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, 'P', probeX + 11, top + (bot - top) * 0.12, { color: th.ink, size: 12, weight: 700 });

    // The particle.
    const px = X(s / dm);
    const py = (top + bot) / 2;
    const vNow = P.speedAfter(pt.q, pt.m, dV.value, dm, s);
    const vEnd = P.speedFromRest(pt.q, pt.m, dV.value);
    if (vNow > 0) arrow(ctx, px, py, 16 + 80 * (vNow / vEnd), 0, { color: th.velocity, width: 2.5, label: 'v' });
    ctx.fillStyle = pt.q < 0 ? th.velocity : th.friction;
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `d = ${fmt(d.value, 2)} cm`, (xl + xr) / 2, h - 10, { color: th.muted, size: 12, align: 'center' });

    const dEJ = P.energyGained(pt.q, dV.value);
    out.set('E', `${fmt(plateField(dV.value, dm))} N/C`);
    out.set('dE', `${fmt(dEJ)} J = ${fmt(dEJ / e)} eV`);
    out.set('v', `${fmt(vEnd)} m/s`);
    out.set('t', `${fmt(tCross)} s`);
    out.set('Vp', `${fmt(P.potentialAt(pf * dm, dm, dV.value))} V`);
    out.set('now', `${fmt(vNow)} m/s`);
    clk.setTimeLabel(`${Math.round((100 * s) / dm)} % across`);
  }
}
