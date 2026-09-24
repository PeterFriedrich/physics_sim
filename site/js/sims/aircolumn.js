import { airColumn, resonantLength, columnEnvelope, nodesAndAntinodes } from '../physics/waves.js';
import { fitCanvas, theme, clear, line, text } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'v = fλ', what: 'the universal wave equation' },
  { html: 'Closed at one end: L = (2n − 1)λ / 4', what: 'λ/4, 3λ/4, 5λ/4 … a node at the closed end' },
  { html: 'Open at both ends: L = nλ / 2', what: 'λ/2, λ, 3λ/2 … antinodes at both ends' },
  { html: 'Successive resonant lengths differ by λ / 2', what: 'for either kind of pipe' },
];

export const prompts = [
  'Closed pipe, first resonance: what fraction of a wavelength fits in the pipe? Count the nodes and antinodes.',
  'Keep the length fixed and step through the resonances. How are the frequencies related to the first one?',
  'A 512 Hz tuning fork resonates over a closed tube. Using v = 343 m/s, predict the first two resonant lengths.',
  'Switch to an open pipe of the same length. Is its lowest frequency higher or lower? By what factor?',
  'On a hot day sound travels faster. What happens to the pipe’s resonant frequencies?',
];

export const legend = [
  { color: 'series-a', label: 'air displacement now' },
  { color: 'muted', label: 'envelope' },
];

const TYPES = [
  { value: 'closed', label: 'Closed at one end' },
  { value: 'open', label: 'Open at both ends' },
];

export function mount(ui) {
  const box = section(ui.controls, 'Pipe');
  const type = choice(box, { label: 'Pipe', options: TYPES, value: 'closed' });
  const L = slider(box, { label: 'Length L', min: 0.1, max: 2, step: 0.01, value: 0.5, unit: 'm' });
  const n = slider(box, { label: 'Resonance number n', min: 1, max: 5, step: 1, value: 1 });
  const v = slider(box, { label: 'Speed of sound v', min: 320, max: 360, step: 1, value: 343, unit: 'm/s' });

  const out = readouts(ui.readouts, [
    { id: 'lambda', label: 'Wavelength λ' },
    { id: 'f', label: 'Frequency f' },
    { id: 'harm', label: 'Harmonic' },
    { id: 'f1', label: 'Lowest resonance f<sub>1</sub>' },
    { id: 'lens', label: 'Resonant lengths at this f' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  // The air really oscillates hundreds of times a second; the picture swings at 1 Hz.
  createClock(ui.transport, { frame: draw, autoplay: true });

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const kind = type.value;
    const p = { type: kind, L: L.value, n: n.value, v: v.value };
    const r = airColumn(p);
    const { nodes, antinodes } = nodesAndAntinodes(kind, r.lambda, p.L);
    clear(ctx, w, h);

    const x0 = 40;
    const x1 = w - 40;
    const X = (x) => x0 + (x / p.L) * (x1 - x0);
    const cy = h * 0.45;
    const half = Math.min(h * 0.22, 90);
    // Pipe walls.
    line(ctx, x0, cy - half, x1, cy - half, { color: th.ink, width: 3 });
    line(ctx, x0, cy + half, x1, cy + half, { color: th.ink, width: 3 });
    if (kind === 'closed') line(ctx, x0, cy - half - 1.5, x0, cy + half + 1.5, { color: th.ink, width: 6 });
    text(ctx, kind === 'closed' ? 'closed end' : 'open end', x0, cy + half + 16, { color: th.muted, size: 11 });
    text(ctx, 'open end', x1, cy + half + 16, { color: th.muted, size: 11, align: 'right' });

    const amp = half * 0.8;
    const phase = Math.cos(2 * Math.PI * clk.t);
    const curve = (f, color, width, dash) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      for (let i = 0; i <= 240; i++) {
        const x = (p.L * i) / 240;
        const y = cy - f(x) * amp;
        i ? ctx.lineTo(X(x), y) : ctx.moveTo(X(x), y);
      }
      ctx.stroke();
      ctx.restore();
    };
    curve((x) => columnEnvelope(kind, r.lambda, x), th.muted, 1.5, [5, 4]);
    curve((x) => -columnEnvelope(kind, r.lambda, x), th.muted, 1.5, [5, 4]);
    curve((x) => columnEnvelope(kind, r.lambda, x) * phase, th.seriesA, 3);

    for (const x of nodes) text(ctx, 'N', X(x), cy - half - 14, { color: th.ink, size: 13, weight: 700, align: 'center' });
    for (const x of antinodes) text(ctx, 'A', X(x), cy - half - 14, { color: th.accel, size: 13, weight: 700, align: 'center' });
    text(ctx, 'N = node (air still), A = antinode (air moves most)', 12, 16, { color: th.muted, size: 12 });

    // Length scale bar with the wavelength for comparison.
    const sy = cy + half + 44;
    line(ctx, X(0), sy, X(p.L), sy, { color: th.ink });
    line(ctx, X(0), sy - 5, X(0), sy + 5, { color: th.ink });
    line(ctx, X(p.L), sy - 5, X(p.L), sy + 5, { color: th.ink });
    text(ctx, `L = ${fmt(p.L)} m`, (X(0) + X(p.L)) / 2, sy + 14, { color: th.ink, size: 12, align: 'center' });
    // How much of a wavelength fits: (2n − 1)/4 for closed, n/2 for open.
    const frac = kind === 'closed' ? `${2 * p.n - 1}/4` : `${p.n}/2`;
    text(ctx, `L = ${frac} λ, so λ = ${fmt(r.lambda)} m`, (X(0) + X(p.L)) / 2, sy + 36, { color: th.seriesA, size: 13, weight: 650, align: 'center' });

    const harm = kind === 'closed' ? 2 * p.n - 1 : p.n;
    const ord = (k) => `${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'}`;
    out.set('lambda', `${fmt(r.lambda)} m`);
    out.set('f', `${fmt(r.f)} Hz`);
    out.set('harm', `${ord(harm)} harmonic (f = ${harm}f₁)`);
    out.set('f1', `${fmt(airColumn({ ...p, n: 1 }).f)} Hz`);
    out.set('lens', [1, 2, 3].map((k) => fmt(resonantLength(kind, r.lambda, k))).join(', ') + ' m');
  }
}
