import { uniformMotion, areaUnderVt, turnaroundTime, distanceTravelled } from '../physics/motion1d.js';
import { fitCanvas, theme, clear, arrow, line, text, subText, vecLen, niceStep } from '../lib/canvas.js';
import { section, slider, toggle, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

export const equations = [
  { html: 'v = Δx / Δt', what: 'the slope of the position–time graph' },
  { html: 'a = Δv / Δt', what: 'the slope of the velocity–time graph' },
  { html: 'Δx = area under the v–t graph', what: 'area below the axis counts as negative' },
  { html: 'Δx = v<sub>i</sub>t + ½at², &nbsp; v<sub>f</sub> = v<sub>i</sub> + at', what: 'constant acceleration' },
];

export const prompts = [
  'Set a = 0. What shape is each graph? Sketch them first, then check.',
  'Give the object a positive v<sub>i</sub> and a negative a. Predict the moment it turns around, then pause there. What is v? What is a?',
  'At the turnaround, is the object at rest? Is its acceleration zero? Explain the difference.',
  'Pause at any time. Use the shaded area under the v–t graph to find Δx, and compare with the readout.',
  'When the object comes back, why is the distance travelled bigger than the displacement?',
];

export const legend = [
  { color: 'ink', label: 'graph' },
  { color: 'velocity', label: 'velocity / tangent slope' },
  { color: 'accel', label: 'acceleration' },
];

export const tallOnMobile = true;

const T_END = 8; // s shown on every graph

export function mount(ui) {
  const box = section(ui.controls, 'Starting conditions');
  const x0 = slider(box, { label: 'Initial position x<sub>i</sub>', min: -10, max: 10, step: 0.5, value: -8, unit: 'm' });
  const v0 = slider(box, { label: 'Initial velocity v<sub>i</sub>', min: -10, max: 10, step: 0.5, value: 6, unit: 'm/s' });
  const a = slider(box, { label: 'Acceleration a', min: -4, max: 4, step: 0.25, value: -1.5, unit: 'm/s²' });
  const show = section(ui.controls, 'Show');
  const showTan = toggle(show, { label: 'Tangent on the x–t graph', checked: true });
  const showArea = toggle(show, { label: 'Area under the v–t graph', checked: true });

  const out = readouts(ui.readouts, [
    { id: 'x', label: 'Position x' },
    { id: 'v', label: 'Velocity v (slope of x–t)' },
    { id: 'a', label: 'Acceleration a (slope of v–t)' },
    { id: 'dx', label: 'Displacement Δx (area under v–t)' },
    { id: 'dist', label: 'Distance travelled' },
    { id: 'tr', label: 'Turns around at' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  [x0, v0, a].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  // One graph panel: returns pixel mappers for t and for its quantity.
  function panel(ctx, th, r, lo, hi, label, unit) {
    const step = niceStep(hi - lo, 4);
    ctx.strokeStyle = th.grid;
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    const tx = (t) => r.x + (t / T_END) * r.w;
    const qy = (q) => r.y + r.h - ((q - lo) / (hi - lo)) * r.h;
    for (let q = Math.ceil(lo / step) * step; q <= hi + 1e-9; q += step) {
      line(ctx, r.x, qy(q), r.x + r.w, qy(q), { color: th.grid, width: Math.abs(q) < 1e-9 ? 2 : 1 });
      text(ctx, fmt(snap(q, step), 2).replace(/\.0+$/, ''), r.x - 6, qy(q), { color: th.muted, size: 10, align: 'right' });
    }
    for (let t = 1; t <= T_END; t++) line(ctx, tx(t), r.y, tx(t), r.y + r.h, { color: th.grid });
    subText(ctx, `${label} (${unit})`, r.x + 6, r.y + 10, { color: th.muted, size: 11, weight: 650 });
    return { tx, qy };
  }

  function curve(ctx, color, tx, qy, f, tEnd = T_END) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const n = 120;
    for (let i = 0; i <= n; i++) {
      const t = (tEnd * i) / n;
      i ? ctx.lineTo(tx(t), qy(f(t))) : ctx.moveTo(tx(t), qy(f(t)));
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const p = { x0: x0.value, v0: v0.value, a: a.value };
    if (clk.t >= T_END) {
      clk.t = T_END;
      clk.pause();
    }
    const t = clk.t;
    const s = uniformMotion(p, t);
    const at = (tt) => uniformMotion(p, tt);
    clear(ctx, w, h);

    // Ranges cover the whole run so the axes don't jump while it plays.
    let xLo = Infinity, xHi = -Infinity, vMax = 1;
    for (let i = 0; i <= 80; i++) {
      const q = at((T_END * i) / 80);
      xLo = Math.min(xLo, q.x);
      xHi = Math.max(xHi, q.x);
      vMax = Math.max(vMax, Math.abs(q.v));
    }
    const xPad = Math.max(1, (xHi - xLo) * 0.1);
    xLo -= xPad;
    xHi += xPad;
    vMax *= 1.15;

    // --- the object on a number line ---
    const left = 48;
    const right = w - 14;
    const trackY = Math.max(34, h * 0.09);
    const mx = (x) => left + ((x - xLo) / (xHi - xLo)) * (right - left);
    line(ctx, left, trackY, right, trackY, { color: th.ink, width: 2 });
    const tick = niceStep(xHi - xLo, 6);
    for (let q = Math.ceil(xLo / tick) * tick; q <= xHi; q += tick) {
      line(ctx, mx(q), trackY - 4, mx(q), trackY + 4, { color: th.ink });
      text(ctx, fmt(snap(q, tick), 2).replace(/\.0+$/, ''), mx(q), trackY + 14, { color: th.muted, size: 10, align: 'center' });
    }
    text(ctx, 'x (m)', right, trackY - 26, { color: th.muted, size: 11, align: 'right' });
    ctx.fillStyle = th.seriesA;
    ctx.beginPath();
    ctx.arc(mx(s.x), trackY - 9, 8, 0, Math.PI * 2);
    ctx.fill();
    const aMax = Math.min(80, w * 0.12);
    arrow(ctx, mx(s.x), trackY - 24, vecLen(s.v, 5, aMax), 0, { color: th.velocity, label: Math.abs(s.v) > 0.3 ? 'v' : '' });
    if (p.a !== 0) arrow(ctx, mx(s.x), trackY + 26, vecLen(p.a, 2, aMax), 0, { color: th.accel, width: 2, label: 'a' });

    // --- three stacked graphs sharing the time axis ---
    const gTop = trackY + 44;
    const gap = 16;
    const gh = (h - gTop - 34 - 2 * gap) / 3;
    const R = (i) => ({ x: left, y: gTop + i * (gh + gap), w: right - left, h: gh });

    const G1 = panel(ctx, th, R(0), xLo, xHi, 'x', 'm');
    curve(ctx, th.grid, G1.tx, G1.qy, (tt) => at(tt).x);
    curve(ctx, th.ink, G1.tx, G1.qy, (tt) => at(tt).x, t);
    if (showTan.value) {
      const span = T_END * 0.12;
      const [ta, tb] = [Math.max(0, t - span), Math.min(T_END, t + span)];
      line(ctx, G1.tx(ta), G1.qy(s.x + s.v * (ta - t)), G1.tx(tb), G1.qy(s.x + s.v * (tb - t)), { color: th.velocity, width: 2 });
    }

    const G2 = panel(ctx, th, R(1), -vMax, vMax, 'v', 'm/s');
    if (showArea.value && t > 0) {
      ctx.save();
      ctx.fillStyle = th.velocity;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(G2.tx(0), G2.qy(0));
      for (let i = 0; i <= 60; i++) {
        const tt = (t * i) / 60;
        ctx.lineTo(G2.tx(tt), G2.qy(at(tt).v));
      }
      ctx.lineTo(G2.tx(t), G2.qy(0));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    curve(ctx, th.grid, G2.tx, G2.qy, (tt) => at(tt).v);
    curve(ctx, th.ink, G2.tx, G2.qy, (tt) => at(tt).v, t);

    const G3 = panel(ctx, th, R(2), -5, 5, 'a', 'm/s²');
    curve(ctx, th.grid, G3.tx, G3.qy, () => p.a);
    curve(ctx, th.accel, G3.tx, G3.qy, () => p.a, t);

    // Time cursor through all three graphs.
    line(ctx, G1.tx(t), R(0).y, G1.tx(t), R(2).y + gh, { color: th.muted, dash: [4, 4] });
    for (const [G, q] of [[G1, s.x], [G2, s.v], [G3, p.a]]) {
      ctx.fillStyle = th.ink;
      ctx.beginPath();
      ctx.arc(G.tx(t), G.qy(q), 4, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let tt = 0; tt <= T_END; tt += 2) text(ctx, String(tt), G3.tx(tt), R(2).y + gh + 12, { color: th.muted, size: 10, align: 'center' });
    text(ctx, 't (s)', right, R(2).y + gh + 24, { color: th.muted, size: 11, align: 'right' });

    const vs = Math.max(Math.abs(p.v0), Math.abs(p.a) * T_END, 1);
    out.set('x', `${fmt(snap(s.x, Math.max(Math.abs(xLo), Math.abs(xHi))))} m`);
    out.set('v', `${fmt(snap(s.v, vs))} m/s`);
    out.set('a', `${fmt(p.a)} m/s²`);
    out.set('dx', `${fmt(snap(areaUnderVt(p, t), vs * T_END))} m`);
    out.set('dist', `${fmt(snap(distanceTravelled(p, t), vs * T_END))} m`);
    const tr = turnaroundTime(p);
    out.set('tr', tr === null ? 'never' : `t = ${fmt(tr)} s`);
    clk.setTimeLabel(`t = ${t.toFixed(2)} s`);
  }
}
