import * as N from '../physics/nuclear.js';
import { fitCanvas, theme, clear, line, text } from '../lib/canvas.js';
import { section, choice, toggle, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

// Sample grid and graph stack on phones, so ask for a taller canvas there.
export const tallOnMobile = true;

export const equations = [
  { html: 'N = N<sub>0</sub>(½)<sup>n</sup>', what: 'n = number of half-lives elapsed' },
  { html: 'n = t / t<sub>½</sub>', what: '' },
  { html: 'A = A<sub>0</sub>(½)<sup>t / t½</sup>', what: 'activity falls the same way' },
];

export const prompts = [
  'Predict how many nuclei remain after 3 half-lives, then pause there and count.',
  'Run the small sample several times. Why does it not follow the curve exactly?',
  'Which nucleus will decay next? Can you tell? What <em>can</em> you predict?',
  'Carbon-14 and iodine-131 behave identically on this graph. What is different about them?',
  'How long until less than 1% of the sample remains?',
];

export const legend = [
  { color: 'series-a', label: 'undecayed nuclei' },
  { color: 'muted', label: 'expected N = N₀(½)ⁿ' },
];

const ISOTOPES = [
  { value: 'I-131', label: 'Iodine-131 (t½ = 8.02 d)', half: 8.02, unit: 'd' },
  { value: 'Rn-222', label: 'Radon-222 (t½ = 3.82 d)', half: 3.82, unit: 'd' },
  { value: 'Co-60', label: 'Cobalt-60 (t½ = 5.27 a)', half: 5.27, unit: 'a' },
  { value: 'C-14', label: 'Carbon-14 (t½ = 5730 a)', half: 5730, unit: 'a' },
];
const SIZES = [100, 400, 1024].map((n) => ({ value: n, label: `${n} nuclei` }));
const SECONDS_PER_HALF_LIFE = 3; // playback at 1×
const MAX_HALF_LIVES = 7;

export function mount(ui) {
  const box = section(ui.controls, 'Sample');
  const iso = choice(box, { label: 'Isotope', options: ISOTOPES, value: 'I-131' });
  const size = choice(box, { label: 'Sample size', options: SIZES, value: 400 });
  const show = section(ui.controls, 'Show');
  const showCurve = toggle(show, { label: 'Expected curve', checked: true });

  const out = readouts(ui.readouts, [
    { id: 't', label: 'Elapsed time' },
    { id: 'n', label: 'Half-lives n' },
    { id: 'N', label: 'Remaining (this run)' },
    { id: 'Ne', label: 'Expected N<sub>0</sub>(½)<sup>n</sup>' },
    { id: 'pct', label: 'Percent remaining' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  let alive;
  let history;
  const init = () => {
    alive = new Uint8Array(size.value).fill(1);
    history = [[0, size.value]];
  };
  init();
  const clock = createClock(ui.transport, { frame: draw, onReset: init });
  [iso, size].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function draw(clk, dt) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const n0 = alive.length;
    let n = clk.t / SECONDS_PER_HALF_LIFE;
    if (n >= MAX_HALF_LIVES) {
      n = MAX_HALF_LIVES;
      if (clk.running) clk.pause();
    }
    if (dt > 0) {
      N.stepDecay(alive, dt / SECONDS_PER_HALF_LIFE, 1);
      history.push([n, alive.reduce((a, b) => a + b, 0)]);
    }
    const left = history[history.length - 1][1];
    clear(ctx, w, h);

    // --- left: the sample ---
    const narrow = w < 620;
    const sw = narrow ? w : Math.min(w * 0.42, h);
    const sh = narrow ? h * 0.45 : h;
    const cols = Math.ceil(Math.sqrt(n0 * (sw / sh)));
    const rows = Math.ceil(n0 / cols);
    const cell = Math.min((sw - 32) / cols, (sh - 32) / rows);
    const ox = (sw - cell * cols) / 2;
    const oy = (sh - cell * rows) / 2;
    for (let i = 0; i < n0; i++) {
      const x = ox + (i % cols) * cell + cell / 2;
      const y = oy + Math.floor(i / cols) * cell + cell / 2;
      ctx.fillStyle = alive[i] ? th.seriesA : th.grid;
      ctx.beginPath();
      ctx.arc(x, y, cell * 0.38, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- right (or below): N against t ---
    const gx = narrow ? 56 : sw + 60;
    const gy = narrow ? sh + 24 : 30;
    const gw = w - gx - 20;
    const gh = (narrow ? h - sh : h) - (narrow ? 62 : 76);
    const X = (hl) => gx + (hl / MAX_HALF_LIVES) * gw;
    const Y = (v) => gy + gh - (v / n0) * gh;
    for (let k = 1; k <= 3; k++) {
      line(ctx, gx, Y(n0 / 2 ** k), gx + gw, Y(n0 / 2 ** k), { color: th.grid, dash: [4, 4] });
      text(ctx, `N₀/${2 ** k}`, gx - 6, Y(n0 / 2 ** k), { color: th.muted, size: 11, align: 'right' });
    }
    text(ctx, `${n0}`, gx - 6, Y(n0), { color: th.muted, size: 11, align: 'right' });
    line(ctx, gx, gy, gx, gy + gh, { color: th.ink });
    line(ctx, gx, gy + gh, gx + gw, gy + gh, { color: th.ink });
    const ip = iso.option;
    for (let k = 1; k <= MAX_HALF_LIVES; k++) {
      text(ctx, `${fmt(k * ip.half, 3)}`, X(k), gy + gh + 12, { color: th.muted, size: 11, align: 'center' });
    }
    text(ctx, `time (${ip.unit === 'd' ? 'days' : 'years'})`, gx + gw, gy + gh + 28, { color: th.muted, size: 12, align: 'right' });
    text(ctx, 'N remaining', gx, gy - 12, { color: th.muted, size: 12 });

    if (showCurve.value) {
      ctx.save();
      ctx.strokeStyle = th.muted;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      for (let i = 0; i <= 140; i++) {
        const hl = (MAX_HALF_LIVES * i) / 140;
        const y = Y(N.remaining(n0, hl, 1));
        i ? ctx.lineTo(X(hl), y) : ctx.moveTo(X(hl), y);
      }
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = th.seriesA;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    history.forEach(([hl, v], i) => (i ? ctx.lineTo(X(hl), Y(v)) : ctx.moveTo(X(hl), Y(v))));
    ctx.stroke();
    ctx.restore();

    const expected = N.remaining(n0, n, 1);
    out.set('t', `${fmt(n * ip.half, 3)} ${ip.unit}`);
    out.set('n', fmt(n, 3));
    out.set('N', `${left}`);
    out.set('Ne', fmt(expected, 3));
    out.set('pct', `${((100 * left) / n0).toFixed(1)} %`);
    clk.setTimeLabel(`n = ${n.toFixed(2)} half-lives`);
  }
}
