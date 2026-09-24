import { inclineForces, criticalAngleDeg, slideFromRest, timeToSlide } from '../physics/dynamics.js';
import { g } from '../physics/constants.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text, subText } from '../lib/canvas.js';
import { section, slider, toggle, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'F<sub>g</sub> = mg', what: 'weight, straight down' },
  { html: 'F<sub>g∥</sub> = mg sin θ, &nbsp; F<sub>g⊥</sub> = mg cos θ', what: 'components along and across the slope' },
  { html: 'F<sub>N</sub> = F<sub>g⊥</sub>', what: 'no acceleration across the slope' },
  { html: 'F<sub>f</sub> ≤ μ<sub>s</sub>F<sub>N</sub> (at rest), &nbsp; F<sub>f</sub> = μ<sub>k</sub>F<sub>N</sub> (sliding)', what: '' },
  { html: 'F<sub>net</sub> = F<sub>g∥</sub> − F<sub>f</sub> = ma', what: 'Newton’s second law along the slope' },
];

export const prompts = [
  'Draw the free-body diagram yourself first, then switch on the components to check it.',
  'Slowly raise the angle. At what angle does the block start to slide? Compare with tan θ = μ<sub>s</sub>.',
  'While the block is at rest, is the friction force equal to μ<sub>s</sub>F<sub>N</sub>? What is it equal to?',
  'Double the mass on a sliding block. What happens to the acceleration, and why?',
  'Set both μ to zero. Show that a = g sin θ.',
];

export const legend = [
  { color: 'gravity', label: 'gravity' },
  { color: 'normal', label: 'normal' },
  { color: 'friction', label: 'friction' },
  { color: 'force', label: 'net force' },
];

const L = 6; // slope length, m
const B = 0.8; // block size, m
const S0 = 0.7; // start distance down the slope, m

export function mount(ui) {
  const box1 = section(ui.controls, 'Block and ramp');
  const m = slider(box1, { label: 'Mass m', min: 1, max: 20, step: 0.5, value: 5, unit: 'kg' });
  const ang = slider(box1, { label: 'Ramp angle θ', min: 0, max: 60, step: 1, value: 30, unit: '°' });
  const box2 = section(ui.controls, 'Friction');
  const muS = slider(box2, { label: 'Static μ<sub>s</sub>', min: 0, max: 1, step: 0.01, value: 0.4 });
  const muK = slider(box2, { label: 'Kinetic μ<sub>k</sub>', min: 0, max: 1, step: 0.01, value: 0.25 });
  const box3 = section(ui.controls, 'Show');
  const showComp = toggle(box3, { label: 'Components of F<sub>g</sub>', checked: false });
  const showNet = toggle(box3, { label: 'Net force', checked: true });

  const out = readouts(ui.readouts, [
    { id: 'Fg', label: 'F<sub>g</sub>' },
    { id: 'Fpar', label: 'F<sub>g∥</sub>' },
    { id: 'Fperp', label: 'F<sub>g⊥</sub>' },
    { id: 'Fn', label: 'F<sub>N</sub>' },
    { id: 'Ff', label: 'F<sub>f</sub>' },
    { id: 'Fnet', label: 'F<sub>net</sub>' },
    { id: 'a', label: 'a' },
    { id: 'v', label: 'v' },
    { id: 'crit', label: 'Slides above' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  [m, ang, muS, muK].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const f = inclineForces({ m: m.value, angleDeg: ang.value, muS: muS.value, muK: muK.value, g });
    const rad = (ang.value * Math.PI) / 180;
    const sEnd = L - B;
    let s = S0;
    let v = 0;
    if (f.slides) {
      clk.t = Math.min(clk.t, timeToSlide(f.a, sEnd - S0));
      const m = slideFromRest(f.a, clk.t);
      s = S0 + m.d;
      v = m.v;
      if (s >= sEnd - 1e-9 && clk.running) clk.pause();
    }

    // Ramp: top at (0, L sin θ), foot at (L cos θ, 0). Down-slope unit u, outward normal n.
    const top = { x: 0, y: L * Math.sin(rad) };
    const foot = { x: L * Math.cos(rad), y: 0 };
    const u = { x: Math.cos(rad), y: -Math.sin(rad) };
    const n = { x: Math.sin(rad), y: Math.cos(rad) };
    const view = makeView({ w, h }, { xMin: -1.6, xMax: L + 1.2, yMin: -0.6, yMax: Math.max(L * Math.sin(rad), 1.5) + 2.2 }, { pad: 30 });

    clear(ctx, w, h);
    ctx.fillStyle = th.grid;
    ctx.beginPath();
    ctx.moveTo(view.px(top.x), view.py(top.y));
    ctx.lineTo(view.px(foot.x), view.py(foot.y));
    ctx.lineTo(view.px(top.x), view.py(0));
    ctx.closePath();
    ctx.fill();
    line(ctx, view.px(-1.6), view.py(0), view.px(L + 1.2), view.py(0), { color: th.ink, width: 2 });
    line(ctx, view.px(top.x), view.py(top.y), view.px(foot.x), view.py(foot.y), { color: th.ink, width: 2 });

    // Angle arc at the foot.
    if (ang.value > 0) {
      const r = 34;
      ctx.strokeStyle = th.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(view.px(foot.x), view.py(0), r, Math.PI, Math.PI + rad);
      ctx.stroke();
      text(ctx, `θ = ${ang.value}°`, view.px(foot.x) - r - 8, view.py(0) - 12, { color: th.muted, size: 12, align: 'right' });
    }

    // Block: centre sits half a block off the surface.
    const c = { x: top.x + u.x * (s + B / 2) + n.x * (B / 2), y: top.y + u.y * (s + B / 2) + n.y * (B / 2) };
    const cx = view.px(c.x);
    const cy = view.py(c.y);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rad);
    ctx.fillStyle = th.surface;
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 2;
    const bp = B * view.sx;
    ctx.fillRect(-bp / 2, -bp / 2, bp, bp);
    ctx.strokeRect(-bp / 2, -bp / 2, bp, bp);
    ctx.restore();
    if (bp > 44) text(ctx, `${fmt(m.value, 2)} kg`, cx, cy + bp * 0.3, { color: th.muted, size: 11, align: 'center' });

    // Free-body diagram, scaled so F_g is always the same length: the arrows
    // compare forces with each other, the readouts give the sizes.
    const k = Math.min(120, h * 0.2) / f.Fg;
    const vec = (ux, uy, mag) => [ux * mag * k, -uy * mag * k];
    arrow(ctx, cx, cy, ...vec(0, -1, f.Fg), { color: th.gravity, label: 'F_g' });
    arrow(ctx, cx, cy, ...vec(n.x, n.y, f.Fn), { color: th.normal, label: 'F_N' });
    if (f.Ff > 1e-9) {
      // Friction acts along the contact surface, so start it at the block's base.
      const bx = view.px(c.x - n.x * (B / 2));
      const by = view.py(c.y - n.y * (B / 2));
      arrow(ctx, bx, by, ...vec(-u.x, -u.y, f.Ff), { color: th.friction, label: 'F_f' });
    }
    if (showComp.value) {
      arrow(ctx, cx, cy, ...vec(u.x, u.y, f.FgPar), { color: th.gravity, width: 2, dash: [5, 4], label: 'F_g∥' });
      arrow(ctx, cx, cy, ...vec(-n.x, -n.y, f.FgPerp), { color: th.gravity, width: 2, dash: [5, 4], label: 'F_g⊥' });
    }
    if (showNet.value) {
      // Drawn off to the side so it does not sit on top of F_g∥.
      const [nx, ny] = vec(u.x, u.y, f.Fnet);
      const ox = view.px(c.x + n.x * B * 1.6);
      const oy = view.py(c.y + n.y * B * 1.6);
      arrow(ctx, ox, oy, nx, ny, { color: th.force, width: 3, label: f.Fnet > 1e-9 ? 'F_net' : 'F_net = 0' });
    }

    subText(ctx, f.slides ? 'Sliding: kinetic friction' : 'At rest: static friction balances F_g∥', 12, 18, { color: th.muted, size: 13 });

    out.set('Fg', `${fmt(f.Fg)} N`);
    out.set('Fpar', `${fmt(f.FgPar)} N`);
    out.set('Fperp', `${fmt(f.FgPerp)} N`);
    out.set('Fn', `${fmt(f.Fn)} N`);
    out.set('Ff', `${fmt(f.Ff)} N ${f.slides ? '(kinetic)' : '(static)'}`);
    out.set('Fnet', `${fmt(f.Fnet)} N`);
    out.set('a', `${fmt(f.a)} m/s²`);
    out.set('v', `${fmt(v)} m/s`);
    out.set('crit', `${fmt(criticalAngleDeg(muS.value))}°`);
    clk.setTimeLabel(`t = ${clk.t.toFixed(2)} s`);
  }
}
