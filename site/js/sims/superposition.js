import { displacement, meetingTime } from '../physics/waves.js';
import { fitCanvas, makeView, theme, clear, line, text } from '../lib/canvas.js';
import { section, slider, toggle, buttons, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

export const equations = [
  { html: 'y<sub>total</sub> = y<sub>A</sub> + y<sub>B</sub>', what: 'principle of superposition' },
  { html: 'v = d / t', what: 'each pulse keeps its own speed' },
  { html: 'v = fλ', what: 'the universal wave equation (for periodic waves)' },
];

export const prompts = [
  'Press <em>Constructive</em>. At the moment of overlap, how tall is the string compared with each pulse?',
  'Press <em>Destructive</em>. The string goes flat for an instant — where did the energy go?',
  'After the pulses pass through each other, have they changed shape, speed or size?',
  'Give the pulses different amplitudes. Predict the largest displacement before you play.',
];

export const legend = [
  { color: 'series-a', label: 'pulse A' },
  { color: 'series-b', label: 'pulse B' },
  { color: 'ink', label: 'string (sum)' },
];

const LEN = 10; // string length, m

export function mount(ui) {
  const box = section(ui.controls, 'Pulses');
  const ampA = slider(box, { label: 'Pulse A amplitude', min: -40, max: 40, step: 1, value: 25, unit: 'cm' });
  const ampB = slider(box, { label: 'Pulse B amplitude', min: -40, max: 40, step: 1, value: 25, unit: 'cm' });
  const width = slider(box, { label: 'Pulse width', min: 0.6, max: 3, step: 0.1, value: 1.6, unit: 'm' });
  const speed = slider(box, { label: 'Wave speed v', min: 0.5, max: 3, step: 0.1, value: 1.5, unit: 'm/s' });
  const pre = section(ui.controls, 'Presets');
  buttons(pre, [
    { label: 'Constructive', onClick: () => ((ampA.value = 25), (ampB.value = 25), restart()) },
    { label: 'Destructive', onClick: () => ((ampA.value = 25), (ampB.value = -25), restart()) },
  ]);
  const show = section(ui.controls, 'Show');
  const showParts = toggle(show, { label: 'Individual pulses', checked: true });

  const out = readouts(ui.readouts, [
    { id: 'meet', label: 'Peaks meet at' },
    { id: 'mid', label: 'y at midpoint' },
    { id: 'max', label: 'Largest |y| now' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  const restart = () => {
    clock.reset();
    clock.play();
  };
  [ampA, ampB, width, speed].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const wd = width.value;
    const s = {
      xA: wd / 2, xB: LEN - wd / 2, v: speed.value,
      ampA: ampA.value / 100, widthA: wd, ampB: ampB.value / 100, widthB: wd,
    };
    const tEnd = (LEN - wd / 2) / s.v;
    if (clk.t >= tEnd) {
      clk.t = tEnd;
      if (clk.running) clk.pause();
    }
    // xMin below 0 leaves room for the y-axis labels.
    const box = { xMin: -0.9, xMax: LEN, yMin: -0.9, yMax: 0.9 };
    const view = makeView({ w, h }, box, { equal: false, pad: 36 });
    clear(ctx, w, h);

    for (const y of [-0.8, -0.4, 0.4, 0.8]) {
      line(ctx, view.px(0), view.py(y), view.px(LEN), view.py(y), { color: th.grid });
      text(ctx, `${fmt(y * 100, 2)} cm`, view.px(0) - 6, view.py(y), { color: th.muted, size: 11, align: 'right' });
    }
    line(ctx, view.px(0), view.py(0), view.px(LEN), view.py(0), { color: th.grid, width: 1.5 });
    for (let x = 0; x <= LEN; x += 1) text(ctx, `${x}`, view.px(x), view.py(-0.9) + 14, { color: th.muted, size: 11, align: 'center' });
    text(ctx, 'position (m)', view.px(LEN), view.py(-0.9) + 28, { color: th.muted, size: 11, align: 'right' });

    const N = 400;
    // `onlyPulse` skips the flat stretches so a dashed pulse does not paint
    // over the string where it has no displacement.
    const curve = (pick, color, width, dash, onlyPulse) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= N; i++) {
        const x = (LEN * i) / N;
        const y = pick(displacement(x, clk.t, s));
        if (onlyPulse && y === 0) {
          pen = false;
          continue;
        }
        pen ? ctx.lineTo(view.px(x), view.py(y)) : ctx.moveTo(view.px(x), view.py(y));
        pen = true;
      }
      ctx.stroke();
      ctx.restore();
    };
    curve((d) => d.y, th.ink, 3);
    if (showParts.value) {
      curve((d) => d.ya, th.seriesA, 2, [6, 5], true);
      curve((d) => d.yb, th.seriesB, 2, [6, 5], true);
    }

    let maxY = 0;
    for (let i = 0; i <= N; i++) {
      const y = displacement((LEN * i) / N, clk.t, s).y;
      if (Math.abs(y) > Math.abs(maxY)) maxY = y;
    }
    const scale = Math.max(Math.abs(s.ampA), Math.abs(s.ampB), 1e-3);
    out.set('meet', `${fmt(meetingTime(s))} s`);
    out.set('mid', `${fmt(snap(displacement(LEN / 2, clk.t, s).y, scale) * 100, 3)} cm`);
    out.set('max', `${fmt(Math.abs(snap(maxY, scale)) * 100, 3)} cm`);
    clk.setTimeLabel(`t = ${clk.t.toFixed(2)} s`);
  }
}
