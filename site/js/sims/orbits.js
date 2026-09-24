import { circularOrbit, orbitRadiusForPeriod } from '../physics/gravitation.js';
import { earthMassP20, earthRadius } from '../physics/constants.js';
import { fitCanvas, makeView, theme, clear, arrow, text, subText } from '../lib/canvas.js';
import { section, slider, buttons, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'F<sub>g</sub> = F<sub>c</sub>: &nbsp; GMm / r² = mv² / r', what: 'gravity supplies the centripetal force' },
  { html: 'v = √(GM / r)', what: 'orbital speed does not depend on the satellite’s mass' },
  { html: 'T = 2πr / v', what: '' },
  { html: 'T² / r³ = 4π² / GM', what: 'Kepler’s third law: the same for everything orbiting Earth' },
];

export const prompts = [
  'Which satellite moves faster, the low one or the high one? Predict, then check v.',
  'Compare T²/r³ for A and B. Change either altitude. What stays the same?',
  'Find the altitude where T = 24.0 h (a geostationary orbit), then check with the button.',
  'Double r for one satellite. By what factor does T change? Use Kepler’s law to predict it.',
  'Does the satellite’s mass appear anywhere? Why not?',
];

export const legend = [
  { color: 'force', label: 'satellite A' },
  { color: 'series-b', label: 'satellite B' },
  { color: 'velocity', label: 'velocity' },
];

const SPEED = 3000; // simulated seconds per real second at 1×

export function mount(ui) {
  const box = section(ui.controls, 'Satellites');
  const hA = slider(box, { label: 'Altitude of A', min: 200, max: 40000, step: 10, value: 400, unit: 'km' });
  const hB = slider(box, { label: 'Altitude of B', min: 200, max: 40000, step: 10, value: 20200, unit: 'km' });
  buttons(box, [
    {
      label: 'Make B geostationary (T = 24.0 h)',
      onClick: () => {
        hB.value = Math.round((orbitRadiusForPeriod(earthMassP20, 86400) - earthRadius) / 1e4) * 10;
      },
    },
  ]);

  const out = readouts(ui.readouts, [
    { id: 'rA', label: 'A: r = R<sub>E</sub> + h' },
    { id: 'vA', label: 'A: speed v' },
    { id: 'TA', label: 'A: period T' },
    { id: 'KA', label: 'A: T² / r³' },
    { id: 'rB', label: 'B: r = R<sub>E</sub> + h' },
    { id: 'vB', label: 'B: speed v' },
    { id: 'TB', label: 'B: period T' },
    { id: 'KB', label: 'B: T² / r³' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw, autoplay: true });

  const hours = (s) => `${fmt(s)} s (${fmt(s / 3600)} h)`;

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const tSim = clk.t * SPEED;
    // Zoom to the outer orbit; Earth and both orbits stay on one scale.
    const R = (earthRadius + Math.max(hA.value, hB.value) * 1000) * 1.08;
    const view = makeView({ w, h }, { xMin: -R, xMax: R, yMin: -R, yMax: R }, { pad: 14 });
    clear(ctx, w, h);
    const ox = view.px(0);
    const oy = view.py(0);
    ctx.fillStyle = th.normal;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(ox, oy, earthRadius * view.sx, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = th.normal;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const sats = [
      ['A', hA.value, th.force],
      ['B', hB.value, th.seriesB],
    ];
    for (const [name, hk, col] of sats) {
      const r = earthRadius + hk * 1000;
      const o = circularOrbit(earthMassP20, r);
      const ang = (2 * Math.PI * tSim) / o.T;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(ox, oy, r * view.sx, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const sx = view.px(r * Math.cos(ang));
      const sy = view.py(r * Math.sin(ang));
      // Arrow length ∝ v, on one scale for both satellites.
      const L = (o.v / 8000) * 44;
      arrow(ctx, sx, sy, -Math.sin(ang) * L, -Math.cos(ang) * L, { color: th.velocity, width: 2 });
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, name, sx + 10, sy - 10, { color: col, size: 13, weight: 700 });
      out.set(`r${name}`, `${fmt(r)} m`);
      out.set(`v${name}`, `${fmt(o.v)} m/s`);
      out.set(`T${name}`, hours(o.T));
      out.set(`K${name}`, `${fmt(o.keplerK)} s²/m³`);
    }
    subText(ctx, 'Earth and orbits to scale', 12, 16, { color: th.muted, size: 12 });
    clk.setTimeLabel(`t = ${fmt(tSim / 3600, 3)} h`);
  }
}
