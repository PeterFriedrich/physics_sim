import * as K from '../physics/kinematics.js';
import { fitCanvas, makeView, theme, clear, grid, niceStep, arrow, line, text, vecLen } from '../lib/canvas.js';
import { section, slider, choice, toggle, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'v<sub>x</sub> = v cos θ, &nbsp; v<sub>y</sub> = v sin θ', what: 'resolve the launch velocity' },
  { html: 'Δx = v<sub>x</sub>t', what: 'horizontal: constant velocity' },
  { html: 'Δy = v<sub>y</sub>t + ½at²', what: 'vertical: a = −g' },
  { html: 'v<sub>fy</sub> = v<sub>y</sub> + at', what: 'v<sub>y</sub> = 0 at the peak' },
];

export const prompts = [
  'Predict: which launch angle gives the greatest range on level ground? Test it.',
  'Find two angles that give the <em>same</em> range. How are they related?',
  'Set θ = 0° and raise the launch height. Does the horizontal speed change the time of flight?',
  'Switch to the Moon. By what factor does the range change, and why?',
  'Pause at the peak. What are v<sub>x</sub> and v<sub>y</sub> there?',
];

export const legend = [
  { color: 'velocity', label: 'velocity components' },
  { color: 'accel', label: 'acceleration (g)' },
  { color: 'muted', label: 'predicted path' },
];

const GRAVITY = [
  { value: 9.81, label: 'Earth (9.81 m/s²)' },
  { value: 1.62, label: 'Moon (1.62 m/s²)' },
  { value: 3.71, label: 'Mars (3.71 m/s²)' },
];

export function mount(ui) {
  const launchBox = section(ui.controls, 'Launch');
  const v0 = slider(launchBox, { label: 'Launch speed', min: 1, max: 40, step: 0.5, value: 20, unit: 'm/s' });
  const angle = slider(launchBox, { label: 'Launch angle θ', min: 0, max: 90, step: 1, value: 45, unit: '°' });
  const h0 = slider(launchBox, { label: 'Launch height', min: 0, max: 50, step: 0.5, value: 0, unit: 'm' });
  const gSel = choice(launchBox, { label: 'Gravity', options: GRAVITY, value: 9.81 });

  const showBox = section(ui.controls, 'Show');
  const showPath = toggle(showBox, { label: 'Predicted path', checked: true });
  const showVec = toggle(showBox, { label: 'Velocity components', checked: true });
  const keepGhosts = toggle(showBox, { label: 'Keep previous paths', checked: true });

  const out = readouts(ui.readouts, [
    { id: 'tf', label: 'Time of flight' },
    { id: 'R', label: 'Range Δx' },
    { id: 'H', label: 'Max height' },
    { id: 'x', label: 'x' },
    { id: 'y', label: 'y' },
    { id: 'vx', label: 'v<sub>x</sub>' },
    { id: 'vy', label: 'v<sub>y</sub>' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const params = () => K.launch({ v0: v0.value, angleDeg: angle.value, h0: h0.value, g: gSel.value });
  let ghosts = [];
  let current = params();

  const clock = createClock(ui.transport, {
    frame: draw,
    onReset: () => {
      current = params();
    },
  });

  // Any launch change starts a fresh shot; the finished one becomes a ghost.
  const relaunch = () => {
    if (keepGhosts.value && clock.t > 0) ghosts = [...ghosts.slice(-4), current];
    clock.pause();
    clock.reset();
  };
  [v0, angle, h0, gSel].forEach((c) => c.onChange(relaunch));
  keepGhosts.onChange((on) => !on && (ghosts = []));

  function sampled(p, tEnd) {
    const pts = [];
    const n = 80;
    for (let i = 0; i <= n; i++) pts.push(K.position(p, (tEnd * i) / n));
    return pts;
  }

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const p = current;
    const tf = K.timeOfFlight(p);
    if (clk.t >= tf) {
      clk.t = tf;
      if (clk.running) clk.pause();
    }
    const t = clk.t;

    // Frame the shot being shown and any ghosts, never shrinking below 10 m.
    const all = [p, ...ghosts];
    const xMax = Math.max(10, ...all.map((q) => K.range(q))) * 1.08;
    const yMax = Math.max(6, ...all.map((q) => K.maxHeight(q))) * 1.15;
    const box = { xMin: -xMax * 0.04, xMax, yMin: -yMax * 0.04, yMax };
    const view = makeView({ w, h }, box, { pad: 34 });

    clear(ctx, w, h);
    const step = niceStep(Math.max(xMax, yMax), 10);
    grid(ctx, view, box, step);
    for (let gx = step; gx < xMax; gx += step) text(ctx, fmt(gx, 2), view.px(gx), view.py(0) + 14, { color: th.muted, size: 11, align: 'center' });
    for (let gy = step; gy < yMax; gy += step) text(ctx, fmt(gy, 2), view.px(0) - 6, view.py(gy), { color: th.muted, size: 11, align: 'right' });
    text(ctx, 'metres', view.px(box.xMax), view.py(0) + 28, { color: th.muted, size: 11, align: 'right' });

    // Ground and launch platform.
    line(ctx, view.px(box.xMin), view.py(0), view.px(box.xMax), view.py(0), { color: th.ink, width: 2 });
    if (p.h0 > 0) {
      ctx.fillStyle = th.grid;
      ctx.fillRect(view.px(-xMax * 0.04), view.py(p.h0), view.px(0) - view.px(-xMax * 0.04), view.py(0) - view.py(p.h0));
      line(ctx, view.px(-xMax * 0.04), view.py(p.h0), view.px(0), view.py(p.h0), { color: th.ink, width: 2 });
    }

    const path = (pts, style) => {
      ctx.save();
      ctx.strokeStyle = style.color;
      ctx.lineWidth = style.width;
      if (style.dash) ctx.setLineDash(style.dash);
      ctx.beginPath();
      pts.forEach((q, i) => (i ? ctx.lineTo(view.px(q.x), view.py(q.y)) : ctx.moveTo(view.px(q.x), view.py(q.y))));
      ctx.stroke();
      ctx.restore();
    };

    for (const gp of ghosts) path(sampled(gp, K.timeOfFlight(gp)), { color: th.grid, width: 2 });
    if (showPath.value) path(sampled(p, tf), { color: th.muted, width: 1.5, dash: [5, 5] });
    if (t > 0) path(sampled(p, t), { color: th.accent, width: 2.5 });

    // Peak marker.
    if (showPath.value && p.vy > 0) {
      const pk = K.position(p, K.timeToPeak(p));
      text(ctx, `max ${fmt(K.maxHeight(p))} m`, view.px(pk.x), view.py(pk.y) - 14, { color: th.muted, size: 12, align: 'center' });
    }

    const pos = K.position(p, t);
    const vel = K.velocity(p, t);
    const bx = view.px(pos.x);
    const by = view.py(pos.y);
    if (showVec.value) {
      const ref = 15;
      arrow(ctx, bx, by, vecLen(vel.vx, ref, 110), 0, { color: th.velocity, label: 'v_x' });
      arrow(ctx, bx, by, 0, -vecLen(vel.vy, ref, 110), { color: th.velocity, label: 'v_y' });
      arrow(ctx, bx + 16, by, 0, 36, { color: th.accel, width: 2, label: 'g' });
    }
    ctx.fillStyle = th.ink;
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();

    out.set('tf', `${fmt(tf)} s`);
    out.set('R', `${fmt(K.range(p))} m`);
    out.set('H', `${fmt(K.maxHeight(p))} m`);
    out.set('x', `${fmt(pos.x)} m`);
    out.set('y', `${fmt(Math.max(0, pos.y))} m`);
    out.set('vx', `${fmt(vel.vx)} m/s`);
    out.set('vy', `${fmt(vel.vy)} m/s`);
    clk.setTimeLabel(`t = ${t.toFixed(2)} s`);
  }
}
