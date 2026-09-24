import { riverCrossing, headingStraightAcross } from '../physics/relative.js';
import { fitCanvas, makeView, theme, clear, arrow, line, text, subText, niceStep } from '../lib/canvas.js';
import { section, slider, toggle, buttons, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

export const equations = [
  { html: 'v⃗<sub>ground</sub> = v⃗<sub>boat</sub> + v⃗<sub>current</sub>', what: 'add the vectors tip to tail' },
  { html: 't = d / v<sub>across</sub>', what: 'only the across component gets you across' },
  { html: 'Δx<sub>downstream</sub> = v<sub>along</sub> t', what: 'drift while crossing' },
  { html: 'sin θ = v<sub>current</sub> / v<sub>boat</sub>', what: 'heading upstream that lands straight across' },
];

export const prompts = [
  'Aim straight across. Where do you land? Draw the vector triangle and check the resultant speed.',
  'Turn the current up. Does the crossing time change if you still aim straight across? Why not?',
  'Find the heading that lands you directly opposite. Is that crossing faster or slower than aiming straight across?',
  'Make the current faster than the boat. Can you still land straight across?',
  'Which heading gets you across in the least time?',
];

export const legend = [
  { color: 'normal', label: 'boat relative to the water' },
  { color: 'series-b', label: 'current' },
  { color: 'velocity', label: 'resultant (relative to the ground)' },
];

export function mount(ui) {
  const box = section(ui.controls, 'Boat and river');
  const vb = slider(box, { label: 'Boat speed (in still water)', min: 1, max: 8, step: 0.5, value: 4, unit: 'm/s' });
  const vc = slider(box, { label: 'Current speed', min: 0, max: 6, step: 0.5, value: 3, unit: 'm/s' });
  const hd = slider(box, { label: 'Heading (upstream of straight across)', min: -60, max: 80, step: 0.1, value: 0, unit: '°', digits: 1 });
  const W = slider(box, { label: 'River width d', min: 20, max: 200, step: 5, value: 80, unit: 'm' });
  const [aimBtn] = buttons(box, [
    {
      label: 'Aim to land straight across',
      onClick: () => {
        const a = headingStraightAcross(vb.value, vc.value);
        if (a !== null) {
          hd.value = a;
          restart();
        }
      },
    },
  ]);
  const show = section(ui.controls, 'Show');
  const showTri = toggle(show, { label: 'Vector triangle', checked: true });

  const out = readouts(ui.readouts, [
    { id: 'v', label: 'Speed (ground)' },
    { id: 'dir', label: 'Direction' },
    { id: 'vy', label: 'v across' },
    { id: 'vx', label: 'v downstream' },
    { id: 't', label: 'Crossing time' },
    { id: 'drift', label: 'Downstream drift' },
    { id: 'aim', label: 'Aim for straight across' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw });
  const restart = () => (clock.pause(), clock.reset());
  [vb, vc, hd, W].forEach((c) => c.onChange(restart));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const p = { vb: vb.value, vc: vc.value, headingDeg: hd.value, width: W.value };
    const r = riverCrossing(p);
    const aim = headingStraightAcross(p.vb, p.vc);
    aimBtn.disabled = aim === null;
    if (clk.t >= r.time) {
      clk.t = r.time;
      clk.pause();
    }
    const t = Math.min(clk.t, r.time);
    const bx = r.vx * t;
    const by = r.vy * t;
    clear(ctx, w, h);

    // River runs left→right; start at the origin on the near (bottom) bank.
    // The view follows the landing point, up to 3 river-widths of drift.
    const land = Number.isFinite(r.drift) ? Math.max(-3 * p.width, Math.min(3 * p.width, r.drift)) : 3 * p.width * Math.sign(r.vx || 1);
    const span = Math.max(p.width * 1.6, Math.abs(land) + p.width * 0.6);
    const mid = land / 2;
    const bank = p.width * 0.18;
    const vbox = { xMin: mid - span / 2, xMax: mid + span / 2, yMin: -bank, yMax: p.width + bank };
    const view = makeView({ w, h }, vbox, { pad: 16 });
    const X0 = view.px(vbox.xMin);
    const X1 = view.px(vbox.xMax);
    ctx.fillStyle = th.grid;
    ctx.fillRect(X0, view.py(p.width), X1 - X0, view.py(0) - view.py(p.width));
    line(ctx, X0, view.py(0), X1, view.py(0), { color: th.ink, width: 2 });
    line(ctx, X0, view.py(p.width), X1, view.py(p.width), { color: th.ink, width: 2 });
    // Current streaks, drifting with the water.
    const step = niceStep(span, 6);
    for (let gy = 0.25; gy < 1; gy += 0.25) {
      for (let gx = Math.floor(vbox.xMin / step) * step; gx < vbox.xMax; gx += step) {
        const x = gx + ((p.vc * clk.t) % step);
        if (p.vc > 0 && x > vbox.xMin && x + step * 0.3 < vbox.xMax)
          arrow(ctx, view.px(x), view.py(gy * p.width), step * 0.3 * view.sx, 0, { color: th.seriesB, width: 1.5, head: 6 });
      }
    }
    text(ctx, `river width d = ${fmt(p.width)} m`, X0 + 4, view.py(0) + 12, { color: th.muted, size: 12, baseline: 'top' });
    // Target straight across, and the path.
    line(ctx, view.px(0), view.py(0), view.px(0), view.py(p.width), { color: th.muted, dash: [4, 5] });
    if (Number.isFinite(r.time)) {
      line(ctx, view.px(0), view.py(0), view.px(r.drift), view.py(p.width), { color: th.velocity, width: 1.5, dash: [6, 5] });
    }
    line(ctx, view.px(0), view.py(0), view.px(bx), view.py(by), { color: th.velocity, width: 2.5 });

    // Boat: a hull pointing along its heading (relative to the water).
    const hr = (p.headingDeg * Math.PI) / 180;
    const ux = -Math.sin(hr);
    const uy = Math.cos(hr);
    const L = Math.max(10, Math.min(22, p.width * 0.08 * view.sx));
    const cx = view.px(bx);
    const cy = view.py(by);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.atan2(-uy, ux) + Math.PI / 2);
    ctx.fillStyle = th.surface;
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -L);
    ctx.quadraticCurveTo(L * 0.5, 0, L * 0.35, L * 0.7);
    ctx.lineTo(-L * 0.35, L * 0.7);
    ctx.quadraticCurveTo(-L * 0.5, 0, 0, -L);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Tip-to-tail triangle from the launch point, drawn to one scale, so
    // v_ground lies along the path.
    if (showTri.value) {
      const k = (Math.min(w * 0.3, (view.py(0) - view.py(p.width)) * 0.6)) / Math.max(p.vb, p.vc, r.speed);
      const cx = view.px(0);
      const cy = view.py(0);
      // Labels sit beside each arrow's midpoint: the three tips crowd together.
      const tag = (str, x, y, dx, dy, color, side) => {
        const len = Math.hypot(dx, dy) || 1;
        const ox = (side * -dy * 10) / len;
        const oy = (side * dx * 12) / len;
        const align = ox > 2 ? 'left' : ox < -2 ? 'right' : 'center';
        subText(ctx, str, x + dx / 2 + ox, y + dy / 2 + oy, { color, size: 13, weight: 650, align });
      };
      const bvx = ux * p.vb * k;
      const bvy = -uy * p.vb * k;
      arrow(ctx, cx, cy, bvx, bvy, { color: th.normal });
      tag('v_boat', cx, cy, bvx, bvy, th.normal, -1);
      if (p.vc > 0) {
        arrow(ctx, cx + bvx, cy + bvy, p.vc * k, 0, { color: th.seriesB });
        tag('v_current', cx + bvx, cy + bvy, p.vc * k, 0, th.seriesB, -1);
      }
      arrow(ctx, cx, cy, r.vx * k, -r.vy * k, { color: th.velocity, width: 3 });
      tag('v_ground', cx, cy, r.vx * k, -r.vy * k, th.velocity, 1);
    }
    if (!Number.isFinite(r.time)) subText(ctx, 'Pointed this way, the boat never reaches the far bank', 12, 18, { color: th.muted, size: 13 });
    else if (clk.t >= r.time) text(ctx, 'Landed', view.px(r.drift) + L + 6, view.py(p.width) - 8, { color: th.ink, size: 12, weight: 650, baseline: 'bottom' });

    out.set('v', `${fmt(r.speed)} m/s`);
    const dir = snap(r.driftAngleDeg, 90);
    out.set('dir', dir === 0 ? 'straight across' : `${fmt(Math.abs(dir))}° ${dir > 0 ? 'downstream' : 'upstream'}`);
    out.set('vy', `${fmt(snap(r.vy, p.vb))} m/s`);
    out.set('vx', `${fmt(snap(r.vx, p.vb + p.vc))} m/s`);
    out.set('t', Number.isFinite(r.time) ? `${fmt(r.time)} s` : 'never');
    out.set('drift', Number.isFinite(r.drift) ? `${fmt(snap(r.drift, p.width))} m` : '—');
    out.set('aim', aim === null ? 'impossible' : `${fmt(aim)}° upstream`);
    clk.setTimeLabel(`t = ${t.toFixed(1)} s`);
  }
}
