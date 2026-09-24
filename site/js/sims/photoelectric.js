import * as P from '../physics/photoelectric.js';
import { hEv } from '../physics/constants.js';
import { fitCanvas, theme, clear, line, text, subText, roundRect } from '../lib/canvas.js';
import { section, slider, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { wavelengthToRgb, bandName } from '../lib/color.js';
import { fmt } from '../lib/format.js';

// Tube and graph stack on phones, so ask for a taller canvas there.
export const tallOnMobile = true;

export const equations = [
  { html: 'E = hf = hc / λ', what: 'energy of one photon' },
  { html: 'E<sub>k,max</sub> = hf − W', what: 'Einstein’s photoelectric equation' },
  { html: 'W = hf<sub>0</sub>', what: 'threshold frequency' },
  { html: 'E<sub>k,max</sub> = qV<sub>stop</sub>', what: 'stopping voltage' },
];

export const prompts = [
  'Pick sodium and red light. Turn the intensity all the way up. Are any electrons ejected? Why not?',
  'Find the threshold wavelength by slowly shortening λ. Check it with W = hc/λ<sub>0</sub>.',
  'With electrons flowing, make the voltage negative until the current stops. Compare with E<sub>k,max</sub>.',
  'Double the intensity. What changes: the number of electrons, their maximum energy, or both?',
  'On the graph, what do the slope and the horizontal intercept represent?',
];

export const legend = [
  { color: 'velocity', label: 'photoelectrons' },
  { color: 'accent', label: 'E<sub>k,max</sub> vs f for this metal' },
];

// Typical textbook work functions; sources differ in the second decimal.
const METALS = [
  { value: 2.14, label: 'Cesium (W = 2.14 eV)' },
  { value: 2.28, label: 'Sodium (W = 2.28 eV)' },
  { value: 2.87, label: 'Calcium (W = 2.87 eV)' },
  { value: 4.33, label: 'Zinc (W = 4.33 eV)' },
  { value: 4.7, label: 'Copper (W = 4.70 eV)' },
];

export function mount(ui) {
  const metal = section(ui.controls, 'Metal surface');
  const preset = choice(metal, { label: 'Metal', options: METALS, value: 2.28 });
  const W = slider(metal, { label: 'Work function W', min: 1.5, max: 6, step: 0.01, value: 2.28, unit: 'eV' });
  preset.onChange((v) => (W.value = v));
  const light = section(ui.controls, 'Light');
  const lam = slider(light, { label: 'Wavelength λ', min: 100, max: 800, step: 1, value: 450, unit: 'nm' });
  const inten = slider(light, { label: 'Intensity', min: 0, max: 100, step: 1, value: 60, unit: '%' });
  const circuit = section(ui.controls, 'Circuit');
  const V = slider(circuit, { label: 'Anode voltage V', min: -5, max: 5, step: 0.05, value: 0, unit: 'V' });

  const out = readouts(ui.readouts, [
    { id: 'band', label: 'Light' },
    { id: 'f', label: 'Frequency f' },
    { id: 'E', label: 'Photon energy' },
    { id: 'f0', label: 'Threshold f<sub>0</sub>' },
    { id: 'l0', label: 'Threshold λ<sub>0</sub>' },
    { id: 'ek', label: 'E<sub>k,max</sub>' },
    { id: 'vs', label: 'Stopping voltage' },
    { id: 'I', label: 'Current (relative)' },
  ]);

  const canvas = fitCanvas(ui.canvas);
  let electrons = [];
  let spawnDebt = 0;
  createClock(ui.transport, { frame: draw, autoplay: true, onReset: () => (electrons = []) });

  function step(dt, ek, volts) {
    // Visual units: gap = 1, electron "mass" 2, so speed = √E_k (eV) and the
    // field adds V/2 per unit time² — an electron turns back exactly when
    // E_k < e|V|, the same rule the photocurrent model uses.
    const TIME = 0.9;
    const rate = ek > 0 ? inten.value * 0.9 : 0;
    spawnDebt += rate * dt;
    while (spawnDebt >= 1) {
      spawnDebt -= 1;
      electrons.push({ u: 0, v: Math.sqrt(Math.random() * ek), y: Math.random() });
    }
    for (const el of electrons) {
      el.v += (volts / 2) * dt * TIME;
      el.u += el.v * dt * TIME;
    }
    electrons = electrons.filter((el) => el.u >= 0 && el.u <= 1);
  }

  function draw(clk, dt) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const ek = P.maxKineticEv(lam.value, W.value);
    step(dt, ek, V.value);
    clear(ctx, w, h);

    // --- left: the phototube ---
    const narrow = w < 620;
    const tw = narrow ? w : w * 0.52;
    const th0 = narrow ? h * 0.55 : h;
    const cx = tw * 0.22;
    const ax = tw * 0.84;
    const top = th0 * 0.16;
    const bot = th0 * 0.76;
    ctx.strokeStyle = th.muted;
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx - 30, top - 20, ax - cx + 60, bot - top + 40, 30);
    ctx.stroke();
    ctx.fillStyle = th.ink;
    ctx.fillRect(cx - 8, top, 8, bot - top);
    ctx.fillRect(ax, top, 8, bot - top);
    text(ctx, 'cathode (metal)', cx - 4, bot + 30, { color: th.muted, size: 12, align: 'center' });
    text(ctx, 'anode', ax + 4, bot + 30, { color: th.muted, size: 12, align: 'center' });

    const col = wavelengthToRgb(lam.value);
    ctx.save();
    ctx.strokeStyle = col ?? th.muted;
    ctx.globalAlpha = 0.25 + 0.6 * (inten.value / 100);
    ctx.lineWidth = 14;
    if (!col) ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(cx + tw * 0.25, 6);
    ctx.lineTo(cx, (top + bot) / 2);
    ctx.stroke();
    ctx.restore();
    text(ctx, `${lam.value} nm (${bandName(lam.value)})`, cx + tw * 0.25 + 8, 16, { color: th.muted, size: 12 });

    ctx.fillStyle = th.velocity;
    for (const el of electrons) {
      ctx.beginPath();
      ctx.arc(cx + el.u * (ax - cx), top + 8 + el.y * (bot - top - 16), 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    const Irel = P.photocurrent({ lambdaNm: lam.value, workFunctionEv: W.value, intensity: inten.value, voltage: V.value });
    text(ctx, `V = ${V.value.toFixed(2)} V`, (cx + ax) / 2, bot + 30, { color: th.ink, size: 13, weight: 650, align: 'center' });
    if (ek <= 0) text(ctx, 'No electrons: photon energy < W', (cx + ax) / 2, (top + bot) / 2, { color: th.friction, size: 14, weight: 700, align: 'center' });

    // --- right (or below): E_k,max against frequency ---
    const gx = narrow ? 56 : tw + 56;
    const gy = narrow ? th0 + 36 : 30;
    const gw = (narrow ? w : w - tw) - 76;
    const gh = (narrow ? h - th0 : h) - 76;
    const fMax = 3e15;
    const eMax = 8;
    const X = (f) => gx + (f / fMax) * gw;
    const Y = (e) => gy + gh - (e / eMax) * gh;
    line(ctx, gx, gy, gx, gy + gh, { color: th.ink });
    line(ctx, gx, gy + gh, gx + gw, gy + gh, { color: th.ink });
    for (let e = 2; e <= eMax; e += 2) {
      line(ctx, gx, Y(e), gx + gw, Y(e), { color: th.grid });
      text(ctx, `${e}`, gx - 6, Y(e), { color: th.muted, size: 11, align: 'right' });
    }
    for (let f = 1e15; f <= fMax; f += 1e15) text(ctx, `${f / 1e15}`, X(f), gy + gh + 12, { color: th.muted, size: 11, align: 'center' });
    subText(ctx, 'E_k,max (eV)', gx, gy - 12, { color: th.muted, size: 12 });
    text(ctx, 'f (× 10¹⁵ Hz)', gx + gw, gy + gh + 28, { color: th.muted, size: 12, align: 'right' });
    const f0 = P.thresholdFrequency(W.value);
    // Slope h, horizontal intercept f0.
    const fTop = Math.min(fMax, (eMax + W.value) / hEv);
    line(ctx, X(f0), Y(0), X(fTop), Y(hEv * fTop - W.value), { color: th.accent, width: 2.5 });
    subText(ctx, 'f_0', X(f0) - 8, gy + gh - 12, { color: th.accent, size: 12, weight: 650, align: 'right' });
    const f = P.frequency(lam.value);
    if (f <= fMax) {
      ctx.fillStyle = ek > 0 ? th.accent : th.friction;
      ctx.beginPath();
      ctx.arc(X(f), Y(ek), 6, 0, Math.PI * 2);
      ctx.fill();
    }

    out.set('band', bandName(lam.value));
    out.set('f', `${fmt(f)} Hz`);
    out.set('E', `${fmt(P.photonEnergyEv(lam.value))} eV`);
    out.set('f0', `${fmt(f0)} Hz`);
    out.set('l0', `${fmt(P.thresholdWavelengthNm(W.value))} nm`);
    out.set('ek', `${fmt(ek)} eV`);
    out.set('vs', `${fmt(P.stoppingVoltage(lam.value, W.value))} V`);
    out.set('I', `${Math.round(Irel)} %`);
    clk.setTimeLabel(`${electrons.length} electrons in flight`);
  }
}
