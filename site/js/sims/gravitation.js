import { gravForce, earthFieldAtAltitude } from '../physics/gravitation.js';
import { earthRadius, earthMass } from '../physics/constants.js';
import { fitCanvas, theme, clear, arrow, line, text, subText } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'F<sub>g</sub> = Gm<sub>1</sub>m<sub>2</sub> / r²', what: 'r is centre to centre' },
  { html: 'g = GM / r²', what: 'gravitational field strength (N/kg = m/s²)' },
  { html: 'F<sub>g</sub> = mg', what: 'weight at that distance' },
  { html: 'r = R<sub>E</sub> + h', what: 'distance from Earth’s centre, not from the ground' },
];

export const prompts = [
  'Double r. Predict the new force before you look. Now triple it.',
  'Double one mass. What happens to the force on <em>each</em> object?',
  'Above Earth: at what altitude is g half its surface value? (Hint: r is not doubled.)',
  'The ISS orbits about 400 km up. Is g there close to zero? Why do astronauts float, then?',
  'Two 70 kg people stand 1 m apart. Why don’t they drift together?',
];

export const legend = [
  { color: 'gravity', label: 'gravitational force' },
  { color: 'accent', label: 'inverse-square curve' },
];

const MODES = [
  { value: 'pair', label: 'Two objects' },
  { value: 'earth', label: 'Above Earth' },
];

export function mount(ui) {
  const modeBox = section(ui.controls, 'Situation');
  const mode = choice(modeBox, { label: 'Show', options: MODES, value: 'pair' });
  const pairBox = section(ui.controls, 'Two objects');
  const m1 = slider(pairBox, { label: 'Mass m<sub>1</sub>', min: 10, max: 1000, step: 10, value: 500, unit: 'kg' });
  const m2 = slider(pairBox, { label: 'Mass m<sub>2</sub>', min: 10, max: 1000, step: 10, value: 200, unit: 'kg' });
  const r = slider(pairBox, { label: 'Separation r', min: 1, max: 10, step: 0.1, value: 2, unit: 'm' });
  const earthBox = section(ui.controls, 'Above Earth');
  const alt = slider(earthBox, { label: 'Altitude h', min: 0, max: 40000, step: 10, value: 6370, unit: 'km' });
  const m = slider(earthBox, { label: 'Object mass m', min: 1, max: 1000, step: 1, value: 100, unit: 'kg' });

  const outPair = readouts(ui.readouts, [
    { id: 'F', label: 'F<sub>g</sub> on each object' },
    { id: 'F2', label: 'F<sub>g</sub> at 2r' },
  ]);
  const outEarth = readouts(ui.readouts, [
    { id: 'r', label: 'r = R<sub>E</sub> + h' },
    { id: 'rRE', label: 'r / R<sub>E</sub>' },
    { id: 'g', label: 'g at that height' },
    { id: 'ratio', label: 'g / g<sub>surface</sub>' },
    { id: 'W', label: 'Weight F<sub>g</sub> = mg' },
  ]);
  const dls = ui.readouts.querySelectorAll('dl');

  const canvas = fitCanvas(ui.canvas);
  createClock(ui.transport, { frame: draw });
  ui.transport.hidden = true;

  // A graph of an inverse-square quantity with the current value marked.
  function graph(ctx, th, R, xs, f, xNow, xLabel, yLabel, yMax) {
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(R.x, R.y, R.w, R.h);
    const X = (x) => R.x + ((x - xs[0]) / (xs[1] - xs[0])) * R.w;
    const Y = (y) => R.y + R.h - (y / yMax) * R.h;
    ctx.save();
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = xs[0] + ((xs[1] - xs[0]) * i) / 200;
      const y = Math.min(f(x), yMax * 1.02);
      i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y));
    }
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = th.gravity;
    ctx.beginPath();
    ctx.arc(X(xNow), Y(f(xNow)), 5, 0, Math.PI * 2);
    ctx.fill();
    line(ctx, X(xNow), Y(f(xNow)), X(xNow), R.y + R.h, { color: th.gravity, dash: [3, 4] });
    subText(ctx, yLabel, R.x + 6, R.y + 12, { color: th.muted, size: 11, weight: 650 });
    subText(ctx, xLabel, R.x + R.w, R.y + R.h + 14, { color: th.muted, size: 11, align: 'right' });
    return { X, Y };
  }

  function draw() {
    const { ctx, w, h } = canvas;
    const th = theme();
    const isPair = mode.value === 'pair';
    pairBox.hidden = !isPair;
    earthBox.hidden = isPair;
    dls[0].hidden = !isPair;
    dls[1].hidden = isPair;
    clear(ctx, w, h);
    const topH = h * 0.55;
    const G = { x: 56, y: topH + 16, w: w - 76, h: h - topH - 42 };

    if (isPair) {
      const F = gravForce(m1.value, m2.value, r.value);
      // Separation drawn to scale against the 10 m slider range.
      const sx = (w - 120) / 10;
      const cx1 = w / 2 - (r.value * sx) / 2;
      const cx2 = w / 2 + (r.value * sx) / 2;
      const cy = topH * 0.55;
      const rad = (mm) => Math.min(topH * 0.3, 10 + 6 * Math.cbrt(mm));
      line(ctx, cx1, cy + topH * 0.33, cx2, cy + topH * 0.33, { color: th.muted });
      text(ctx, `r = ${fmt(r.value)} m`, w / 2, cy + topH * 0.33 + 12, { color: th.muted, size: 12, align: 'center' });
      for (const [cx, mm, lab] of [[cx1, m1.value, 'm_1'], [cx2, m2.value, 'm_2']]) {
        ctx.fillStyle = th.grid;
        ctx.strokeStyle = th.ink;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rad(mm), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        subText(ctx, lab, cx, cy - rad(mm) - 12, { color: th.ink, size: 13, weight: 650, align: 'center' });
      }
      // Equal and opposite (Newton's third law): the same length on both.
      const L = Math.min(70, (cx2 - cx1) * 0.4);
      arrow(ctx, cx1, cy, L, 0, { color: th.gravity });
      arrow(ctx, cx2, cy, -L, 0, { color: th.gravity });
      subText(ctx, 'F_g on 1', cx1 + L / 2, cy + 16, { color: th.gravity, size: 12, weight: 650, align: 'center' });
      subText(ctx, 'F_g on 2', cx2 - L / 2, cy - 16, { color: th.gravity, size: 12, weight: 650, align: 'center' });
      text(ctx, 'Arrows are always equal and opposite; the readout gives the size.', 12, 16, { color: th.muted, size: 12 });

      const Fmax = gravForce(m1.value, m2.value, 1);
      graph(ctx, th, G, [1, 10], (x) => gravForce(m1.value, m2.value, x), r.value, 'r (m)', 'F_g (N)', Fmax);
      text(ctx, `top: ${fmt(Fmax, 2)} N`, G.x + G.w - 6, G.y + 12, { color: th.muted, size: 10, align: 'right' });
      text(ctx, '0', G.x - 6, G.y + G.h, { color: th.muted, size: 10, align: 'right' });
      outPair.set('F', `${fmt(F)} N`);
      outPair.set('F2', `${fmt(gravForce(m1.value, m2.value, 2 * r.value))} N`);
      return;
    }

    const hM = alt.value * 1000;
    const rNow = earthRadius + hM;
    const g = earthFieldAtAltitude(hM);
    const g0 = earthFieldAtAltitude(0);
    // Earth and the object, to scale along the line to the object.
    const span = (earthRadius + 40000e3) * 1.08;
    const sc = Math.min((w - 60) / (span + earthRadius), (topH - 30) / (2 * earthRadius));
    const ex = 30 + earthRadius * sc;
    const ey = topH / 2 + 8;
    ctx.fillStyle = th.normal;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(ex, ey, earthRadius * sc, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = th.normal;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'Earth', ex, ey, { color: th.ink, size: 12, weight: 650, align: 'center' });
    const ox = ex + rNow * sc;
    line(ctx, ex, ey, ox, ey, { color: th.muted, dash: [4, 4] });
    text(ctx, `r = ${fmt(rNow)} m`, Math.max(ex + earthRadius * sc + 60, (ex + earthRadius * sc + ox) / 2), ey + 20, { color: th.muted, size: 12, align: 'center' });
    ctx.fillStyle = th.ink;
    ctx.beginPath();
    ctx.arc(ox, ey, 6, 0, Math.PI * 2);
    ctx.fill();
    arrow(ctx, ox, ey - 16, -Math.max(12, 70 * (g / g0)), 0, { color: th.gravity, label: 'g' });

    const Gr = graph(ctx, th, G, [1, 7.5], (x) => g0 / (x * x), rNow / earthRadius, 'r / R_E', 'g (N/kg)', g0 * 1.05);
    text(ctx, fmt(g0), G.x - 6, Gr.Y(g0), { color: th.muted, size: 10, align: 'right' });
    text(ctx, '0', G.x - 6, G.y + G.h, { color: th.muted, size: 10, align: 'right' });
    for (let k = 1; k <= 7; k++) text(ctx, String(k), Gr.X(k), G.y + G.h + 14, { color: th.muted, size: 10, align: 'center' });
    outEarth.set('r', `${fmt(rNow)} m`);
    outEarth.set('rRE', fmt(rNow / earthRadius));
    outEarth.set('g', `${fmt(g)} N/kg`);
    outEarth.set('ratio', fmt(g / g0));
    outEarth.set('W', `${fmt(gravForce(m.value, earthMass, rNow))} N`);
  }
}
