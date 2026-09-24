import { HYDROGEN_LEVELS, transition, ionizationEnergy } from '../physics/energylevels.js';
import { emBand } from '../physics/emr.js';
import { eV } from '../physics/constants.js';
import { fitCanvas, theme, clear, arrow, line, text } from '../lib/canvas.js';
import { section, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { wavelengthToRgb } from '../lib/color.js';
import { fmt } from '../lib/format.js';

// The level diagram needs height more than width on phones.
export const tallOnMobile = true;

export const equations = [
  { html: 'ΔE = E<sub>upper</sub> − E<sub>lower</sub>', what: 'energy of the photon emitted or absorbed' },
  { html: 'E = hf = hc / λ', what: 'photon energy, frequency and wavelength' },
  { html: 'h = 4.14 × 10⁻¹⁵ eV·s', what: 'use this h when ΔE is in eV' },
];

export const prompts = [
  'From the diagram, find ΔE for n = 3 → 2. Then find λ with λ = hc/ΔE and compare.',
  'Which transitions ending on n = 2 give visible light? What colours?',
  'Why do all the transitions down to n = 1 give ultraviolet?',
  'Switch to absorption. Why can the atom absorb a 10.2 eV photon but not a 5 eV one?',
  'How much energy ionizes a hydrogen atom that is already in n = 2?',
];

export const legend = [
  { color: 'ink', label: 'energy levels' },
  { color: 'accent', label: 'electron transition' },
];

const levelOptions = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => ({ value: from + i, label: `n = ${from + i} (${HYDROGEN_LEVELS[from + i - 1].toFixed(2)} eV)` }));

export function mount(ui) {
  const box = section(ui.controls, 'Transition');
  const mode = choice(box, {
    label: 'Process',
    options: [
      { value: 'emit', label: 'Emission (electron falls, photon out)' },
      { value: 'absorb', label: 'Absorption (photon in, electron rises)' },
    ],
    value: 'emit',
  });
  const upper = choice(box, { label: 'Upper level', options: levelOptions(2, 6), value: 3 });
  const lower = choice(box, { label: 'Lower level', options: levelOptions(1, 5), value: 2 });

  const out = readouts(ui.readouts, [
    { id: 'levels', label: 'Levels' },
    { id: 'dE', label: 'ΔE' },
    { id: 'dEJ', label: 'ΔE in joules' },
    { id: 'f', label: 'Photon frequency f' },
    { id: 'lam', label: 'Photon wavelength λ' },
    { id: 'band', label: 'Series and band' },
    { id: 'ion', label: 'Ionization from lower level' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Hydrogen energy levels are given data, as on a Diploma energy-level diagram; they are not on the data sheet.</p>');

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw, autoplay: true });
  // Keep upper above lower: moving one past the other drags the other along.
  upper.onChange((v) => lower.value >= v && (lower.value = v - 1));
  lower.onChange((v) => upper.value <= v && (upper.value = v + 1));
  [mode, upper, lower].forEach((c) => c.onChange(() => (clock.reset(), clock.play())));

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const nu = upper.value;
    const nl = lower.value;
    const t = transition(nu, nl);
    const col = wavelengthToRgb(t.lambda * 1e9);
    clear(ctx, w, h);

    // --- left: the level diagram (energy axis to scale) ---
    const dx0 = 70;
    const dx1 = Math.min(w * 0.55, w - 200);
    const top = 34;
    const bot = h - 70;
    const Y = (E) => top + ((0 - E) / 13.6) * (bot - top);
    line(ctx, dx0, Y(0), dx1, Y(0), { color: th.muted, width: 1, dash: [4, 4] });
    text(ctx, '0 eV (ionized)', dx1 + 6, Y(0), { color: th.muted, size: 11 });
    HYDROGEN_LEVELS.forEach((E, i) => {
      const n = i + 1;
      const hl = n === nu || n === nl;
      line(ctx, dx0, Y(E), dx1, Y(E), { color: hl ? th.ink : th.muted, width: hl ? 2.5 : 1.3 });
      if (n <= 4 || hl) {
        text(ctx, `n = ${n}`, dx0 - 8, Y(E), { color: th.ink, size: 12, weight: hl ? 700 : 500, align: 'right' });
        text(ctx, `${E.toFixed(2)} eV`, dx1 + 6, Y(E) + (n >= 5 ? 6 : 0), { color: th.muted, size: 11 });
      }
    });

    // Electron jump and photon, looping every 3 s.
    const phase = (clk.t % 3) / 3;
    const emit = mode.value === 'emit';
    const jx = dx0 + (dx1 - dx0) * 0.45;
    const yFrom = emit ? Y(HYDROGEN_LEVELS[nu - 1]) : Y(HYDROGEN_LEVELS[nl - 1]);
    const yTo = emit ? Y(HYDROGEN_LEVELS[nl - 1]) : Y(HYDROGEN_LEVELS[nu - 1]);
    arrow(ctx, jx, yFrom, 0, yTo - yFrom, { color: th.accent, width: 2.5, head: 9 });
    const jump = Math.min(1, Math.max(0, (phase - (emit ? 0.2 : 0.55)) / 0.2));
    ctx.fillStyle = th.velocity;
    ctx.beginPath();
    ctx.arc(jx, yFrom + (yTo - yFrom) * jump, 6, 0, Math.PI * 2);
    ctx.fill();

    // Photon as a wavy packet: leaving after the fall, or arriving before the rise.
    const px0 = jx + 14;
    const px1 = dx1 + 120;
    const pPos = emit ? Math.max(0, (phase - 0.4) / 0.6) : Math.min(1, phase / 0.55);
    const pxc = emit ? px0 + (px1 - px0) * pPos : px1 - (px1 - px0) * pPos;
    const pyc = (yFrom + yTo) / 2;
    if ((emit && phase > 0.4) || (!emit && phase < 0.55)) {
      ctx.save();
      ctx.strokeStyle = col ?? th.muted;
      ctx.lineWidth = 2.5;
      if (!col) ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const x = pxc - 30 + (60 * i) / 40;
        const y = pyc + 7 * Math.sin((i / 40) * Math.PI * 6);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }
    text(ctx, `photon ${fmt(t.dE, 3)} eV`, px1 - 30, pyc - 18, { color: th.ink, size: 12, weight: 650, align: 'center' });

    // --- bottom strip: this series' lines on a λ axis (log scale 90–2000 nm) ---
    const sy = h - 22;
    const sx0 = 20;
    const sx1 = w - 20;
    const LX = (nm) => sx0 + ((Math.log10(nm) - Math.log10(90)) / (Math.log10(2000) - Math.log10(90))) * (sx1 - sx0);
    ctx.fillStyle = th.grid;
    ctx.fillRect(sx0, sy - 8, sx1 - sx0, 12);
    for (let nm = 380; nm <= 750; nm += 4) {
      ctx.fillStyle = wavelengthToRgb(nm);
      ctx.fillRect(LX(nm), sy - 8, LX(nm + 4) - LX(nm) + 0.5, 12);
    }
    for (let k = nl + 1; k <= 6; k++) {
      const lk = transition(k, nl).lambda * 1e9;
      line(ctx, LX(lk), sy - 12, LX(lk), sy + 8, { color: k === nu ? th.ink : th.muted, width: k === nu ? 3 : 1.5 });
    }
    for (const nm of [100, 200, 500, 1000, 2000]) text(ctx, `${nm} nm`, LX(nm), sy + 16, { color: th.muted, size: 10, align: nm === 2000 ? 'right' : 'center' });

    out.set('levels', `n = ${nu} (${HYDROGEN_LEVELS[nu - 1].toFixed(2)} eV) ↔ n = ${nl} (${HYDROGEN_LEVELS[nl - 1].toFixed(2)} eV)`);
    out.set('dE', `${fmt(t.dE, 3)} eV`);
    out.set('dEJ', `${fmt(t.dE * eV)} J`);
    out.set('f', `${fmt(t.f)} Hz`);
    out.set('lam', `${fmt(t.lambda * 1e9, 3)} nm`);
    out.set('band', `${t.series} · ${emBand(t.lambda)}`);
    out.set('ion', `${fmt(ionizationEnergy(nl), 3)} eV`);
    clk.setTimeLabel(emit ? 'emission' : 'absorption');
  }
}
