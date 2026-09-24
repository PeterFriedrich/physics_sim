import { uniformCircular, stateAt } from '../physics/circular.js';
import { fitCanvas, makeView, theme, clear, grid, arrow, line, text, vecLen } from '../lib/canvas.js';
import { section, slider, toggle, buttons, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'v = 2πr / T', what: 'speed: one circumference per period' },
  { html: 'a<sub>c</sub> = v² / r = 4π²r / T²', what: 'always toward the centre' },
  { html: 'F<sub>c</sub> = ma<sub>c</sub>', what: 'the net force needed to keep turning' },
  { html: 'f = 1 / T', what: 'revolutions per second (Hz)' },
];

export const prompts = [
  'Before you cut the string: sketch the path you expect the ball to take.',
  'Cut the string at different points. Which vector does the new path follow — v or a?',
  'Double the radius but keep T the same. What happens to v and to a<sub>c</sub>?',
  'Halve the period. By what factor does F<sub>c</sub> change?',
  'What force provides F<sub>c</sub> here? What provides it for a car on a curve, or the Moon?',
];

export const legend = [
  { color: 'velocity', label: 'velocity' },
  { color: 'accel', label: 'centripetal acceleration' },
];

const VIEW = 6.2;

export function mount(ui) {
  const box = section(ui.controls, 'Motion');
  const r = slider(box, { label: 'Radius r', min: 0.5, max: 5, step: 0.1, value: 3, unit: 'm' });
  const T = slider(box, { label: 'Period T', min: 0.5, max: 6, step: 0.1, value: 3, unit: 's' });
  const m = slider(box, { label: 'Mass m', min: 0.1, max: 5, step: 0.1, value: 1, unit: 'kg' });
  const show = section(ui.controls, 'Show');
  const showV = toggle(show, { label: 'Velocity', checked: true });
  const showA = toggle(show, { label: 'Acceleration', checked: true });
  const act = section(ui.controls, 'Newton’s first law');
  let released = null;
  const [cutBtn] = buttons(act, [
    {
      label: 'Cut the string',
      onClick: () => {
        if (released) return;
        released = { t0: clock.t, ...stateAt({ r: r.value, T: T.value }, clock.t) };
        cutBtn.disabled = true;
        clock.play();
      },
    },
  ]);

  const out = readouts(ui.readouts, [
    { id: 'v', label: 'Speed v' },
    { id: 'ac', label: 'a<sub>c</sub>' },
    { id: 'Fc', label: 'F<sub>c</sub>' },
    { id: 'f', label: 'Frequency f' },
    { id: 'rev', label: 'Revolutions' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, {
    frame: draw,
    onReset: () => {
      released = null;
      cutBtn.disabled = false;
    },
  });
  [r, T].forEach((c) => c.onChange(() => (clock.pause(), clock.reset())));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const p = { r: r.value, T: T.value };
    const u = uniformCircular({ ...p, m: m.value });
    const box = { xMin: -VIEW, xMax: VIEW, yMin: -VIEW, yMax: VIEW };
    const view = makeView({ w, h }, box, { pad: 20 });

    clear(ctx, w, h);
    grid(ctx, view, box, 1);

    ctx.save();
    ctx.strokeStyle = th.muted;
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(view.px(0), view.py(0), p.r * view.sx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = th.ink;
    ctx.beginPath();
    ctx.arc(view.px(0), view.py(0), 4, 0, Math.PI * 2);
    ctx.fill();

    let s;
    if (released) {
      const dt = clk.t - released.t0;
      s = { x: released.x + released.vx * dt, y: released.y + released.vy * dt, vx: released.vx, vy: released.vy };
      line(ctx, view.px(released.x), view.py(released.y), view.px(s.x), view.py(s.y), { color: th.accent, width: 2 });
      text(ctx, 'string cut here', view.px(released.x) + 8, view.py(released.y) + 14, { color: th.muted, size: 12 });
      if (Math.hypot(s.x, s.y) > VIEW * 1.5 && clk.running) clk.pause();
    } else {
      s = stateAt(p, clk.t);
      line(ctx, view.px(0), view.py(0), view.px(s.x), view.py(s.y), { color: th.muted, width: 1.5 });
    }

    const bx = view.px(s.x);
    const by = view.py(s.y);
    const v = Math.hypot(s.vx, s.vy);
    if (showV.value) {
      const L = vecLen(v, 8, Math.min(150, Math.min(w, h) * 0.3));
      arrow(ctx, bx, by, (s.vx / v) * L, (-s.vy / v) * L, { color: th.velocity, label: 'v' });
    }
    if (showA.value && !released) {
      const L = vecLen(u.ac, 12, Math.min(110, Math.min(w, h) * 0.22));
      const d = Math.hypot(s.x, s.y);
      arrow(ctx, bx, by, (-s.x / d) * L, (s.y / d) * L, { color: th.accel, label: 'a_c' });
    }
    ctx.fillStyle = th.ink;
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fill();
    if (released && showA.value) text(ctx, 'no net force → a = 0', 12, 18, { color: th.muted, size: 13 });

    out.set('v', `${fmt(u.v)} m/s`);
    out.set('ac', released ? '0 (no string)' : `${fmt(u.ac)} m/s²`);
    out.set('Fc', released ? '0 N' : `${fmt(u.Fc)} N`);
    out.set('f', `${fmt(u.f)} Hz`);
    out.set('rev', released ? '—' : fmt(clk.t / p.T, 3));
    clk.setTimeLabel(`t = ${clk.t.toFixed(2)} s`);
  }
}
