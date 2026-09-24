import { TRACK, trackHeight, trackSlope, startX, pathLength, energyAt, advance } from '../physics/track.js';
import { g } from '../physics/constants.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text, subText, vecLen } from '../lib/canvas.js';
import { section, slider, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

export const equations = [
  { html: 'E<sub>p</sub> = mgh, &nbsp; E<sub>k</sub> = ½mv²', what: 'h measured from the lowest point of the track' },
  { html: 'E<sub>k</sub> + E<sub>p</sub> = mgh<sub>0</sub>', what: 'no friction: mechanical energy is conserved' },
  { html: 'W<sub>f</sub> = F<sub>f</sub>d', what: 'work done by friction over the distance travelled' },
  { html: 'E<sub>k</sub> + E<sub>p</sub> + W<sub>f</sub> = mgh<sub>0</sub>', what: 'with friction: the lost energy becomes heat' },
];

export const prompts = [
  'Released from 15 m with no friction, how fast is it at the bottom? Work out √(2gh), then play.',
  'Change the mass. Does the speed at the bottom change? Does the energy?',
  'Find the lowest release height that gets over the 14 m hill with no friction. Why is it that height?',
  'Add friction. Where does the "missing" mechanical energy go? Check that the bars always add to mgh<sub>0</sub>.',
  'With friction, predict whether the car will make it over the 14 m hill from 16 m.',
];

export const legend = [
  { color: 'potential', label: 'E<sub>p</sub>' },
  { color: 'kinetic', label: 'E<sub>k</sub>' },
  { color: 'friction', label: 'W<sub>f</sub> (heat)' },
  { color: 'total', label: 'mgh<sub>0</sub>' },
];

export const tallOnMobile = true;

const X_END = TRACK.at(-1)[0];
const HILL = TRACK[2]; // the 14 m hill

export function mount(ui) {
  const box = section(ui.controls, 'Car');
  const h0 = slider(box, { label: 'Release height h<sub>0</sub>', min: 1, max: 19.5, step: 0.5, value: 15, unit: 'm' });
  const m = slider(box, { label: 'Mass m', min: 10, max: 500, step: 10, value: 100, unit: 'kg' });
  const Ff = slider(box, { label: 'Friction force F<sub>f</sub> (0 = none)', min: 0, max: 100, step: 5, value: 0, unit: 'N' });

  const out = readouts(ui.readouts, [
    { id: 'h', label: 'Height h' },
    { id: 'v', label: 'Speed v' },
    { id: 'Ep', label: 'E<sub>p</sub>' },
    { id: 'Ek', label: 'E<sub>k</sub>' },
    { id: 'd', label: 'Distance travelled d' },
    { id: 'Wf', label: 'W<sub>f</sub> = F<sub>f</sub>d' },
    { id: 'Et', label: 'Total mgh<sub>0</sub>' },
    { id: 'vb', label: 'Speed at the first dip' },
    { id: 'hill', label: 'Clears the 14 m hill?' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const params = () => ({ m: m.value, h0: h0.value, Ff: Ff.value, g });
  let state;
  const start = () => (state = { x: startX(h0.value), dir: 1, d: 0, stopped: false });
  start();
  const clock = createClock(ui.transport, { frame: draw, onReset: start });
  [h0, m, Ff].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function draw(clk, dt) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const p = params();
    if (dt > 0) state = advance(p, state, dt);
    if (state.stopped && clk.running) clk.pause();
    const y = trackHeight(state.x);
    const e = energyAt(p, y, state.d);
    clear(ctx, w, h);

    // --- track ---
    const trackH = h * 0.64;
    const view = makeView({ w, h: trackH }, { xMin: -1, xMax: X_END + 1, yMin: -1, yMax: 26 }, { pad: 16, equal: false });
    ctx.save();
    ctx.fillStyle = th.grid;
    ctx.beginPath();
    ctx.moveTo(view.px(0), view.py(-1));
    for (let i = 0; i <= 300; i++) {
      const x = (X_END * i) / 300;
      ctx.lineTo(view.px(x), view.py(trackHeight(x)));
    }
    ctx.lineTo(view.px(X_END), view.py(-1));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    for (const [xk, yk] of TRACK.slice(1)) text(ctx, `${yk} m`, view.px(xk), view.py(yk) - 12, { color: th.muted, size: 11, align: 'center', baseline: 'bottom' });
    text(ctx, `${TRACK[0][1]} m`, view.px(0) + 4, view.py(TRACK[0][1]) - 12, { color: th.muted, size: 11, baseline: 'bottom' });
    // Release height: the car can never go above this line.
    line(ctx, view.px(0), view.py(p.h0), view.px(X_END), view.py(p.h0), { color: th.total, dash: [6, 5] });
    text(ctx, `h₀ = ${fmt(p.h0)} m`, view.px(X_END) - 4, view.py(p.h0) - 8, { color: th.total, size: 11, align: 'right', baseline: 'bottom' });

    // The car, sitting on the track, with velocity along the tangent.
    const slope = trackSlope(state.x);
    const ang = Math.atan2(slope * view.sy, view.sx);
    const cx = view.px(state.x);
    const cy = view.py(y);
    const nx = -Math.sin(ang);
    const ny = -Math.cos(ang);
    ctx.fillStyle = th.accent;
    ctx.beginPath();
    ctx.arc(cx + nx * 9, cy + ny * 9, 8, 0, Math.PI * 2);
    ctx.fill();
    if (e.v > 0.05) {
      const L = vecLen(e.v, 10, 70);
      arrow(ctx, cx + nx * 9, cy + ny * 9, Math.cos(ang) * L * state.dir, -Math.sin(ang) * L * state.dir, { color: th.velocity, label: 'v' });
    }
    if (state.stopped) text(ctx, 'Stopped: friction took all the kinetic energy', 12, 16, { color: th.muted, size: 12 });

    // --- energy bars, scaled to mgh0 ---
    const bTop = trackH + 18;
    const bh = h - bTop - 26;
    const bars = [
      ['E_p', e.Ep, th.potential],
      ['E_k', e.Ek, th.kinetic],
      ['W_f', e.Wf, th.friction],
      ['mgh₀', e.Et, th.total],
    ];
    const colW = Math.min(90, (w - 40) / bars.length);
    const x0 = (w - colW * bars.length) / 2;
    const bw = colW * 0.55;
    line(ctx, x0, bTop + bh, x0 + colW * bars.length, bTop + bh, { color: th.ink });
    bars.forEach(([lab, val, col], i) => {
      const x = x0 + i * colW + (colW - bw) / 2;
      const hh = (val / e.Et) * bh;
      ctx.fillStyle = col;
      ctx.fillRect(x, bTop + bh - hh, bw, hh);
      subText(ctx, lab, x + bw / 2, bTop + bh + 13, { color: th.muted, size: 12, align: 'center' });
    });

    // Readouts that look ahead: first pass through the dip and over the hill.
    const x0s = startX(p.h0);
    const dip = energyAt(p, 0, pathLength(x0s, TRACK[1][0]));
    const hill = energyAt(p, HILL[1], pathLength(x0s, HILL[0]));
    out.set('h', `${fmt(snap(y, 20))} m`);
    out.set('v', `${fmt(snap(e.v, 20))} m/s`);
    out.set('Ep', `${fmt(snap(e.Ep, e.Et))} J`);
    out.set('Ek', `${fmt(snap(e.Ek, e.Et))} J`);
    out.set('d', `${fmt(state.d)} m`);
    out.set('Wf', `${fmt(e.Wf)} J`);
    out.set('Et', `${fmt(e.Et)} J`);
    out.set('vb', dip.Ek > 0 ? `${fmt(dip.v)} m/s` : 'never gets there');
    out.set('hill', p.h0 <= HILL[1] ? 'no: h₀ is below it' : hill.Ek > 0 ? `yes, at ${fmt(hill.v)} m/s` : 'no: friction takes too much');
    clk.setTimeLabel(`t = ${clk.t.toFixed(1)} s`);
  }
}
