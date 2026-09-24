import { perpendicularLength, wireForce, forceZ } from '../physics/wireforce.js';
import { fitCanvas, theme, clear, arrow, line, text, subText } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: '|F<sub>m</sub>| = I l<sub>⊥</sub> |B|', what: 'only the length perpendicular to B counts' },
  { html: 'l<sub>⊥</sub> = l sin θ', what: 'θ is the angle between the wire and the field' },
  { html: 'I = q / t', what: 'current is charge per unit time' },
];

export const prompts = [
  'Set θ = 90°. Calculate F = IlB by hand, then check the readout.',
  'Turn the wire until it is parallel to B. What happens to the force, and why?',
  'At θ = 30°, what is l⊥? Use it to predict F.',
  'Use a hand rule to predict whether the force is into or out of the page. Then reverse the current.',
  'Reverse both the current and the field. What happens to the force direction?',
];

export const legend = [
  { color: 'velocity', label: 'magnetic field B' },
  { color: 'friction', label: 'wire and current I' },
  { color: 'force', label: 'force (into or out of the page)' },
];

export function mount(ui) {
  const box = section(ui.controls, 'Wire');
  const I = slider(box, { label: 'Current I', min: 0, max: 10, step: 0.1, value: 3, unit: 'A' });
  const L = slider(box, { label: 'Length in the field l', min: 0.05, max: 0.5, step: 0.01, value: 0.2, unit: 'm' });
  const ang = slider(box, { label: 'Angle to the field θ', min: 0, max: 180, step: 1, value: 90, unit: '°' });
  const cur = choice(box, {
    label: 'Current direction',
    options: [
      { value: 1, label: 'Along the wire, up the page' },
      { value: -1, label: 'Along the wire, down the page' },
    ],
    value: 1,
  });
  const fieldBox = section(ui.controls, 'Magnetic field');
  const B = slider(fieldBox, { label: 'Field strength B', min: 0.05, max: 1, step: 0.01, value: 0.5, unit: 'T' });
  const fdir = choice(fieldBox, {
    label: 'Field direction',
    options: [
      { value: 1, label: 'Left to right (N on the left)' },
      { value: -1, label: 'Right to left (N on the right)' },
    ],
    value: 1,
  });

  const out = readouts(ui.readouts, [
    { id: 'lp', label: 'l<sub>⊥</sub> = l sin θ' },
    { id: 'F', label: 'Force |F<sub>m</sub>|' },
    { id: 'dir', label: 'Force direction' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Conventional current (+ to −). Right hand: thumb along I, fingers along B, palm pushes in the direction of F. For electron flow use the left hand the same way.</p>');

  const canvas = fitCanvas(ui.canvas);
  createClock(ui.transport, { frame: draw });
  ui.transport.hidden = true;

  function draw() {
    const { ctx, w, h } = canvas;
    const th = theme();
    const theta = ang.value;
    const fs = fdir.value;
    const cs = cur.value;
    const Fz = forceZ({ I: I.value, L: L.value, B: B.value, thetaDeg: theta, currentSign: cs, fieldSign: fs });
    const Fmag = wireForce(I.value, L.value, B.value, theta);
    clear(ctx, w, h);

    // Magnet poles and field lines.
    const poleW = Math.min(70, w * 0.1);
    ctx.fillStyle = th.friction;
    ctx.fillRect(0, h * 0.1, poleW, h * 0.8);
    ctx.fillStyle = th.velocity;
    ctx.fillRect(w - poleW, h * 0.1, poleW, h * 0.8);
    text(ctx, fs > 0 ? 'N' : 'S', poleW / 2, h / 2, { color: '#fff', size: 26, weight: 700, align: 'center' });
    text(ctx, fs > 0 ? 'S' : 'N', w - poleW / 2, h / 2, { color: '#fff', size: 26, weight: 700, align: 'center' });
    const x0 = poleW + 14;
    const x1 = w - poleW - 14;
    for (let i = 1; i <= 6; i++) {
      const y = h * 0.1 + (h * 0.8 * i) / 7;
      const ax = fs > 0 ? x0 : x1;
      arrow(ctx, ax, y, fs * (x1 - x0), 0, { color: th.velocity, width: 1.4, head: 8 });
    }
    text(ctx, 'B', fs > 0 ? x1 - 8 : x0 + 8, h * 0.1 + (h * 0.8) / 7 - 12, { color: th.velocity, size: 14, weight: 700, align: 'center' });

    // The wire through the centre at angle θ to +x (field direction when fs = +1).
    const cx = w / 2;
    const cy = h / 2;
    const half = Math.min(h * 0.38, (x1 - x0) * 0.45) * (0.4 + (0.6 * L.value) / 0.5);
    const rad = (theta * Math.PI) / 180;
    const ux = Math.cos(rad);
    const uy = Math.sin(rad);
    line(ctx, cx - ux * half, cy + uy * half, cx + ux * half, cy - uy * half, { color: th.friction, width: 6 });
    // Current arrows along the wire.
    if (I.value > 0) {
      for (const f of [-0.55, 0.55]) {
        const px = cx + ux * half * f;
        const py = cy - uy * half * f;
        arrow(ctx, px - cs * ux * 16, py + cs * uy * 16, cs * ux * 32, -cs * uy * 32, { color: th.ink, width: 2.5, head: 10 });
      }
      subText(ctx, 'I', cx + ux * half * 0.8 + 14, cy - uy * half * 0.8, { color: th.ink, size: 14, weight: 700 });
    }
    // l⊥: the wire's projection perpendicular to B.
    const lp = perpendicularLength(L.value, theta);
    if (lp > 1e-9) {
      const ex = cx + ux * half;
      const ey = cy - uy * half;
      line(ctx, ex, ey, ex, cy + uy * half, { color: th.muted, width: 1.5, dash: [5, 4] });
      subText(ctx, 'l_⊥', ex + 10, cy, { color: th.muted, size: 13, weight: 650 });
    }
    text(ctx, `θ = ${theta}°`, cx + 30, cy + 22, { color: th.ink, size: 13, weight: 650 });

    // Force: ⊙ out of the page or ⊗ into it, sized by |F|.
    if (Fmag > 1e-9) {
      const r = 10 + 22 * Math.min(1, Fmag / 1.5);
      const fx = cx;
      const fy = cy;
      ctx.save();
      ctx.strokeStyle = th.force;
      ctx.fillStyle = th.force;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx, fy, r, 0, Math.PI * 2);
      ctx.stroke();
      if (Fz > 0) {
        ctx.beginPath();
        ctx.arc(fx, fy, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const k = r * 0.6;
        ctx.beginPath();
        ctx.moveTo(fx - k, fy - k);
        ctx.lineTo(fx + k, fy + k);
        ctx.moveTo(fx + k, fy - k);
        ctx.lineTo(fx - k, fy + k);
        ctx.stroke();
      }
      ctx.restore();
      text(ctx, Fz > 0 ? 'F out of the page' : 'F into the page', cx - r - 12, cy - r - 6, { color: th.force, size: 13, weight: 700, align: 'right' });
    } else {
      text(ctx, 'No force: the wire is parallel to B', cx, cy - 30, { color: th.force, size: 13, weight: 700, align: 'center' });
    }

    out.set('lp', `${fmt(lp)} m`);
    out.set('F', `${fmt(Fmag)} N`);
    out.set('dir', Fmag > 1e-9 ? (Fz > 0 ? 'out of the page (⊙)' : 'into the page (⊗)') : 'none');
  }
}
