import { refractionAngle, criticalAngle, speedInMedium } from '../physics/optics.js';
import { fitCanvas, theme, clear, line, text, subText } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'n = c / v', what: 'index of refraction' },
  { html: 'n<sub>1</sub> sin θ<sub>1</sub> = n<sub>2</sub> sin θ<sub>2</sub>', what: 'Snell’s law, angles from the normal' },
  { html: 'sin θ<sub>c</sub> = n<sub>2</sub> / n<sub>1</sub>', what: 'critical angle (only when n<sub>1</sub> > n<sub>2</sub>)' },
  { html: 'θ<sub>r</sub> = θ<sub>i</sub>', what: 'law of reflection' },
];

export const prompts = [
  'Drag the incoming ray. Going from air into glass, does light bend toward or away from the normal?',
  'Swap the media (glass on top, air below). Find the angle where the refracted ray disappears.',
  'Check the critical angle you found against sin θ<sub>c</sub> = n<sub>2</sub>/n<sub>1</sub>.',
  'Why can total internal reflection never happen going from air into water?',
  'How fast does light travel in diamond? Use n = c/v, then compare with the readout.',
];

export const legend = [
  { color: 'accent', label: 'incident and refracted ray' },
  { color: 'muted', label: 'normal' },
];

const MEDIA = [
  { value: 1.0, label: 'Air (n = 1.00)' },
  { value: 1.33, label: 'Water (n = 1.33)' },
  { value: 1.5, label: 'Glass (n = 1.50)' },
  { value: 2.42, label: 'Diamond (n = 2.42)' },
];

export function mount(ui) {
  const top = section(ui.controls, 'Medium 1 (top, incident)');
  const m1 = choice(top, { label: 'Preset', options: MEDIA, value: 1.0 });
  const n1 = slider(top, { label: 'n<sub>1</sub>', min: 1, max: 2.5, step: 0.01, value: 1.0 });
  const bot = section(ui.controls, 'Medium 2 (bottom)');
  const m2 = choice(bot, { label: 'Preset', options: MEDIA, value: 1.5 });
  const n2 = slider(bot, { label: 'n<sub>2</sub>', min: 1, max: 2.5, step: 0.01, value: 1.5 });
  m1.onChange((v) => (n1.value = v));
  m2.onChange((v) => (n2.value = v));
  const ray = section(ui.controls, 'Ray');
  const ang = slider(ray, { label: 'Angle of incidence θ<sub>1</sub>', min: 0, max: 89, step: 0.5, value: 40, unit: '°' });

  const out = readouts(ui.readouts, [
    { id: 't1', label: 'θ<sub>1</sub>' },
    { id: 't2', label: 'θ<sub>2</sub>' },
    { id: 'tc', label: 'Critical angle θ<sub>c</sub>' },
    { id: 'v1', label: 'v<sub>1</sub>' },
    { id: 'v2', label: 'v<sub>2</sub>' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  // Nothing moves on its own here; the clock just drives redraws.
  createClock(ui.transport, { frame: draw });
  ui.transport.hidden = true;

  // Drag in the top half to aim the incident ray.
  const aim = (ev) => {
    const r = ui.canvas.getBoundingClientRect();
    const dx = ev.clientX - r.left - r.width / 2;
    const dy = r.height / 2 - (ev.clientY - r.top);
    if (dy <= 0) return;
    ang.value = Math.min(89, Math.round(((Math.atan2(Math.abs(dx), dy) * 180) / Math.PI) * 2) / 2);
  };
  ui.canvas.addEventListener('pointerdown', (ev) => {
    ui.canvas.setPointerCapture(ev.pointerId);
    aim(ev);
  });
  ui.canvas.addEventListener('pointermove', (ev) => ev.buttons && aim(ev));
  ui.canvas.style.cursor = 'crosshair';

  function draw() {
    const { ctx, w, h } = canvas;
    const th = theme();
    const a1 = ang.value;
    const a2 = refractionAngle(n1.value, n2.value, a1);
    const tc = criticalAngle(n1.value, n2.value);
    const ox = w / 2;
    const oy = h / 2;
    const R = Math.hypot(w, h);
    const rad = (d) => (d * Math.PI) / 180;

    clear(ctx, w, h);
    // Denser media get a stronger tint.
    const tint = (n) => Math.min(0.35, (n - 1) * 0.22);
    ctx.fillStyle = th.accent;
    ctx.globalAlpha = tint(n1.value);
    ctx.fillRect(0, 0, w, oy);
    ctx.globalAlpha = tint(n2.value);
    ctx.fillRect(0, oy, w, h - oy);
    ctx.globalAlpha = 1;
    line(ctx, 0, oy, w, oy, { color: th.ink, width: 2 });
    line(ctx, ox, 16, ox, h - 16, { color: th.muted, width: 1.5, dash: [6, 6] });
    subText(ctx, `n_1 = ${n1.value.toFixed(2)}`, 14, 20, { color: th.ink, size: 14, weight: 650 });
    subText(ctx, `n_2 = ${n2.value.toFixed(2)}`, 14, h - 20, { color: th.ink, size: 14, weight: 650 });
    text(ctx, 'normal', ox + 6, 22, { color: th.muted, size: 12 });

    const ray = (angleFromNormalUp, alpha, width, towardO) => {
      const dx = Math.sin(angleFromNormalUp);
      const dy = -Math.cos(angleFromNormalUp);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = th.accent;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox + dx * R, oy + dy * R);
      ctx.stroke();
      // Direction chevron halfway along.
      const mx = ox + dx * 110;
      const my = oy + dy * 110;
      const s = towardO ? -1 : 1;
      const ux = dx * s;
      const uy = dy * s;
      ctx.fillStyle = th.accent;
      ctx.beginPath();
      ctx.moveTo(mx + ux * 9, my + uy * 9);
      ctx.lineTo(mx - ux * 5 - uy * 6, my - uy * 5 + ux * 6);
      ctx.lineTo(mx - ux * 5 + uy * 6, my - uy * 5 - ux * 6);
      ctx.fill();
      ctx.restore();
    };
    // Incident comes in from the upper left; refracted leaves lower right.
    ray(-rad(a1), 1, 3, true);
    ray(rad(a1), a2 === null ? 1 : 0.28, a2 === null ? 3 : 2, false);
    if (a2 !== null) ray(Math.PI - rad(a2), 1, 3, false);

    const arc = (from, to, r, label, lx, ly) => {
      ctx.save();
      ctx.strokeStyle = th.ink;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ox, oy, r, from, to);
      ctx.stroke();
      ctx.restore();
      subText(ctx, label, lx, ly, { color: th.ink, size: 13, weight: 650, align: 'center' });
    };
    if (a1 > 0.5) {
      arc(-Math.PI / 2 - rad(a1), -Math.PI / 2, 60, `θ_1 = ${fmt(a1, 3)}°`, ox - 80 * Math.sin(rad(a1 / 2)) - 30, oy - 80 * Math.cos(rad(a1 / 2)));
    }
    if (a2 !== null && a2 > 0.5) {
      arc(Math.PI / 2 - rad(a2), Math.PI / 2, 60, `θ_2 = ${fmt(a2, 3)}°`, ox + 80 * Math.sin(rad(a2 / 2)) + 34, oy + 80 * Math.cos(rad(a2 / 2)));
    }
    if (a2 === null) text(ctx, 'Total internal reflection', w / 2, h - 44, { color: th.friction, size: 15, weight: 700, align: 'center' });

    out.set('t1', `${fmt(a1, 3)}°`);
    out.set('t2', a2 === null ? 'none (TIR)' : `${fmt(a2, 3)}°`);
    out.set('tc', tc === null ? 'none (n₁ ≤ n₂)' : `${fmt(tc, 3)}°`);
    out.set('v1', `${fmt(speedInMedium(n1.value))} m/s`);
    out.set('v2', `${fmt(speedInMedium(n2.value))} m/s`);
  }
}
