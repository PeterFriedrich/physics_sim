import { comptonWavelength, scatter } from '../physics/compton.js';
import { fitCanvas, theme, clear, arrow, line, text, vecLen } from '../lib/canvas.js';
import { section, slider, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt, snap } from '../lib/format.js';

// Scattering picture and momentum diagram stack on phones.
export const tallOnMobile = true;

export const equations = [
  { html: 'Δλ = (h / mc)(1 − cos θ)', what: 'm is the electron’s mass; h/mc = 2.43 × 10⁻¹² m' },
  { html: 'p = h / λ', what: 'a photon’s momentum' },
  { html: 'E = pc = hc / λ', what: 'a photon’s energy' },
  { html: 'p⃗ = p⃗′ + p⃗<sub>e</sub>', what: 'momentum is conserved: the after-vectors close the triangle' },
];

export const prompts = [
  'At θ = 90°, calculate Δλ = h/mc by hand. Then change λ: does Δλ change?',
  'Set λ = 5.00 pm and θ = 90°. Find λ′, then p′ = h/λ′ and E′ = hc/λ′, and check the readouts.',
  'Where did the photon’s lost energy go? Compare E − E′ with the electron’s E<sub>k</sub>.',
  'Try λ = 100 pm, then 1 pm, at the same angle. Why is the Compton effect only noticeable for X-rays and gamma rays?',
  'Before moving the slider, sketch the momentum triangle for θ = 180°. Which way does the electron go?',
];

export const legend = [
  { color: 'series-a', label: 'photon (p, p′)' },
  { color: 'series-b', label: 'recoil electron (p<sub>e</sub>)' },
];

const pm = (m) => `${fmt(m * 1e12)} pm`;

export function mount(ui) {
  const box = section(ui.controls, 'Photon');
  const lam = slider(box, { label: 'Incident wavelength λ', min: 1, max: 100, step: 0.1, value: 5, unit: 'pm' });
  const ang = slider(box, { label: 'Scattering angle θ', min: 0, max: 180, step: 1, value: 90, unit: '°' });

  const out = readouts(ui.readouts, [
    { id: 'lc', label: 'h / mc' },
    { id: 'dl', label: 'Shift Δλ' },
    { id: 'lo', label: 'Scattered λ′' },
    { id: 'p', label: 'p = h/λ → p′ = h/λ′' },
    { id: 'E', label: 'E = hc/λ → E′' },
    { id: 'ek', label: 'Electron E<sub>k</sub> = E − E′' },
    { id: 'pe', label: 'Electron p<sub>e</sub>' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">1 pm = 10⁻¹² m; momentum in kg·m/s. The electron starts free and at rest. Its speed is not shown: recoil electrons can be relativistic, so ½mv² would give the wrong answer.</p>');

  const canvas = fitCanvas(ui.canvas);
  createClock(ui.transport, { frame: draw });
  ui.transport.hidden = true;

  // A wave drawn along a ray from (x, y) at angle a (radians, +y up).
  function wave(ctx, x, y, a, len, period, color) {
    const ux = Math.cos(a);
    const uy = -Math.sin(a);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let d = 0; d <= len; d += 1) {
      const amp = 7 * Math.sin((2 * Math.PI * d) / period);
      const px = x + ux * d - uy * amp;
      const py = y + uy * d + ux * amp;
      d ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function draw() {
    const { ctx, w, h } = canvas;
    const th = theme();
    const lambda = lam.value * 1e-12;
    const theta = ang.value;
    const s = scatter(lambda, theta);
    clear(ctx, w, h);

    const narrow = w < 560;
    const view = narrow ? { x: 0, y: 0, w, h: h * 0.55 } : { x: 0, y: 0, w: w * 0.58, h };
    const panel = narrow ? { x: 0, y: h * 0.55, w, h: h * 0.45 } : { x: w * 0.58, y: 0, w: w * 0.42, h };

    // Scattering picture. Drawn wavelengths keep the true ratio λ′/λ.
    const cx = view.x + view.w * 0.5;
    const cy = view.y + view.h * 0.55;
    const R = Math.min(view.w * 0.45, view.h * 0.42);
    const perIn = 14;
    const perOut = Math.min(90, perIn * (s.lambdaOut / lambda));
    const rad = (theta * Math.PI) / 180;
    line(ctx, view.x + 12, cy, view.x + view.w - 12, cy, { color: th.grid, width: 1.5, dash: [5, 5] });
    wave(ctx, cx - R, cy, 0, R - 12, perIn, th.seriesA);
    arrow(ctx, cx - 40, cy - 22, 24, 0, { color: th.seriesA, width: 2, head: 7 });
    text(ctx, 'photon λ', cx - R, cy - 24, { color: th.seriesA, size: 13, weight: 650 });
    wave(ctx, cx + 12 * Math.cos(rad), cy - 12 * Math.sin(rad), rad, R - 12, perOut, th.seriesA);
    text(ctx, 'λ′', cx + (R + 14) * Math.cos(rad), cy - (R + 14) * Math.sin(rad), { color: th.seriesA, size: 14, weight: 700, align: 'center' });
    if (theta > 0 && theta < 180) {
      ctx.save();
      ctx.strokeStyle = th.muted;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, -rad, 0);
      ctx.stroke();
      ctx.restore();
      text(ctx, `θ = ${theta}°`, cx + 40, cy - 16, { color: th.ink, size: 13, weight: 650 });
    }
    // atan2 leaves ~10⁻¹⁵° of residue at θ = 180°.
    const phiDeg = snap(s.phiDeg, 180);
    if (s.peMag > 0) {
      const phi = (phiDeg * Math.PI) / 180;
      const L = Math.abs(vecLen(s.peMag, s.pIn * 0.5, R * 0.9));
      arrow(ctx, cx, cy, L * Math.cos(phi), L * Math.sin(phi), { color: th.seriesB, width: 3 });
      text(ctx, `e⁻ recoils at ${fmt(phiDeg)}°`, cx + L * Math.cos(phi), cy + L * Math.sin(phi) + 18, { color: th.seriesB, size: 13, weight: 650, align: 'center' });
    }
    ctx.fillStyle = th.seriesB;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();

    // Momentum diagram: before (p alone) and after (p′ then pₑ, tip to tail).
    ctx.fillStyle = th.bg;
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    text(ctx, 'Momentum vectors (tip to tail)', panel.x + 12, panel.y + 16, { color: th.muted, size: 12, weight: 650 });
    const xmin = Math.min(0, s.pOutVec.x);
    const k = Math.min((panel.w * 0.72) / (s.pIn - xmin), (panel.h * 0.45) / Math.max(s.pOutVec.y, 0.25 * s.pIn));
    const ox = panel.x + panel.w * 0.14 - xmin * k;
    const oyB = panel.y + panel.h * 0.2;
    const oyA = panel.y + panel.h * 0.88;
    text(ctx, 'before', panel.x + 12, oyB - 16, { color: th.muted, size: 11 });
    arrow(ctx, ox, oyB, s.pIn * k, 0, { color: th.seriesA, width: 3, label: 'p' });
    text(ctx, 'after', panel.x + 12, oyA - panel.h * 0.5, { color: th.muted, size: 11 });
    arrow(ctx, ox, oyA, s.pIn * k, 0, { color: th.total, width: 1.5, dash: [4, 4] });
    arrow(ctx, ox, oyA, s.pOutVec.x * k, -s.pOutVec.y * k, { color: th.seriesA, width: 3, label: 'p′' });
    arrow(ctx, ox + s.pOutVec.x * k, oyA - s.pOutVec.y * k, s.pe.x * k, -s.pe.y * k, { color: th.seriesB, width: 3, label: 'p_e' });

    out.set('lc', `${fmt(comptonWavelength)} m`);
    out.set('dl', pm(s.dLambda));
    out.set('lo', pm(s.lambdaOut));
    out.set('p', `${fmt(s.pIn)} → ${fmt(s.pOut)} kg·m/s`);
    out.set('E', `${fmt(s.EIn)} J → ${fmt(s.EOut)} J (${fmt(s.EInEv)} eV → ${fmt(s.EOutEv)} eV)`);
    out.set('ek', `${fmt(s.Ek)} J = ${fmt(s.EInEv - s.EOutEv)} eV`);
    out.set('pe', s.peMag > 0 ? `${fmt(s.peMag)} kg·m/s at ${fmt(phiDeg)}° below the axis` : '0 (no scattering)');
  }
}
