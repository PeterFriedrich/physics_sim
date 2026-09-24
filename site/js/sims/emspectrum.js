import { emBand, photon } from '../physics/emr.js';
import { fitCanvas, theme, clear, line, text } from '../lib/canvas.js';
import { section, slider, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { wavelengthToRgb } from '../lib/color.js';
import { fmt, superscript } from '../lib/format.js';

export const equations = [
  { html: 'c = fλ', what: 'all EM waves travel at 3.00 × 10⁸ m/s in a vacuum' },
  { html: 'E = hf = hc / λ', what: 'energy of one photon' },
  { html: 'h = 6.63 × 10⁻³⁴ J·s = 4.14 × 10⁻¹⁵ eV·s', what: '' },
];

export const prompts = [
  'Put the marker on green light (about 550 nm). Calculate f and E by hand, then check.',
  'An FM station broadcasts at 100 MHz. What is its wavelength? Find it on the spectrum.',
  'How many times more energy does an X-ray photon of 0.1 nm carry than a 500 nm photon?',
  'Why can ultraviolet photons damage skin cells when a much brighter infrared lamp does not?',
  'Which band has wavelengths about the size of a building? Of an atom?',
];

export const legend = [{ color: 'ink', label: 'selected wavelength' }];

// Band colours for the bar (visible light is drawn as a true spectrum).
const REGIONS = [
  { name: 'gamma rays', from: -13, to: -11, example: 'radioactive decay, nuclear reactions' },
  { name: 'X-rays', from: -11, to: -8, example: 'medical imaging' },
  { name: 'ultraviolet', from: -8, to: Math.log10(380e-9), example: 'sunburn, black lights' },
  { name: 'visible light', from: Math.log10(380e-9), to: Math.log10(750e-9), example: 'what your eyes detect' },
  { name: 'infrared', from: Math.log10(750e-9), to: -3, example: 'heat lamps, TV remotes' },
  { name: 'microwaves', from: -3, to: 0, example: 'microwave ovens, radar, Wi-Fi' },
  { name: 'radio waves', from: 0, to: 4, example: 'AM/FM radio, TV broadcasts' },
];

export function mount(ui) {
  const box = section(ui.controls, 'Wavelength');
  const logLam = slider(box, { label: 'log₁₀(λ in metres)', min: -13, max: 4, step: 0.01, value: Math.log10(550e-9) });

  const out = readouts(ui.readouts, [
    { id: 'band', label: 'Band' },
    { id: 'lam', label: 'Wavelength λ' },
    { id: 'f', label: 'Frequency f' },
    { id: 'EJ', label: 'Photon energy (J)' },
    { id: 'EeV', label: 'Photon energy (eV)' },
    { id: 'eg', label: 'Found in' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Band boundaries are approximate; textbooks draw them in slightly different places. The slider is logarithmic: each step of 1 is a factor of 10 in λ.</p>');

  const canvas = fitCanvas(ui.canvas);
  createClock(ui.transport, { frame: draw });
  ui.transport.hidden = true;

  function draw() {
    const { ctx, w, h } = canvas;
    const th = theme();
    const lambda = Math.pow(10, logLam.value);
    const p = photon(lambda);
    const band = emBand(lambda);
    clear(ctx, w, h);

    const x0 = 24;
    const x1 = w - 24;
    const X = (lg) => x0 + ((lg + 13) / 17) * (x1 - x0);
    const barY = h * 0.32;
    const barH = 44;

    // The bar: bands in alternating greys, visible light as a real spectrum.
    REGIONS.forEach((r, i) => {
      ctx.fillStyle = i % 2 ? th.grid : th.bg;
      ctx.fillRect(X(r.from), barY, X(r.to) - X(r.from), barH);
      if (r.name === 'visible light') {
        for (let nm = 380; nm < 750; nm += 2) {
          const a = X(Math.log10(nm * 1e-9));
          const b = X(Math.log10((nm + 2) * 1e-9));
          ctx.fillStyle = wavelengthToRgb(nm);
          ctx.fillRect(a, barY, b - a + 0.5, barH);
        }
      }
      const mid = (X(r.from) + X(r.to)) / 2;
      const narrow = X(r.to) - X(r.from) < 60;
      text(ctx, r.name, mid, narrow ? barY - 22 : barY + barH / 2, {
        color: r.name === band ? th.ink : th.muted, size: 12, weight: r.name === band ? 700 : 500, align: 'center',
      });
    });
    // λ axis (top) and f axis (bottom), both powers of ten.
    for (let lg = -12; lg <= 4; lg += 2) {
      line(ctx, X(lg), barY + barH, X(lg), barY + barH + 6, { color: th.muted });
      text(ctx, `10${superscript(lg)} m`, X(lg), barY + barH + 16, { color: th.muted, size: 10, align: 'center' });
      const flog = Math.log10(3e8) - lg;
      text(ctx, `${fmt(Math.pow(10, flog), 1)} Hz`, X(lg), barY + barH + 30, { color: th.muted, size: 10, align: 'center' });
    }
    text(ctx, 'λ', x0 - 14, barY + barH + 16, { color: th.muted, size: 11 });
    text(ctx, 'f', x0 - 14, barY + barH + 30, { color: th.muted, size: 11 });
    text(ctx, '← higher f, higher photon energy', x0, barY - 44, { color: th.muted, size: 12 });
    text(ctx, 'longer λ →', x1, barY - 44, { color: th.muted, size: 12, align: 'right' });

    // Marker.
    const mx = X(logLam.value);
    line(ctx, mx, barY - 10, mx, barY + barH + 10, { color: th.ink, width: 3 });
    ctx.fillStyle = th.ink;
    ctx.beginPath();
    ctx.moveTo(mx, barY - 10);
    ctx.lineTo(mx - 7, barY - 20);
    ctx.lineTo(mx + 7, barY - 20);
    ctx.fill();

    // A wave, not to scale: a few cycles whose spacing tracks λ on the log scale.
    const wy = h * 0.8;
    const cycles = Math.max(1.5, Math.min(24, 13 - logLam.value * 0.7));
    const col = wavelengthToRgb(lambda * 1e9) ?? th.accent;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const x = x0 + ((x1 - x0) * i) / 400;
      const y = wy + 18 * Math.sin((i / 400) * cycles * 2 * Math.PI);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    text(ctx, 'wave drawn not to scale: more cycles = shorter λ', x1, wy + 34, { color: th.muted, size: 11, align: 'right' });

    const region = REGIONS.find((r) => r.name === band);
    out.set('band', band);
    out.set('lam', `${fmt(lambda)} m`);
    out.set('f', `${fmt(p.f)} Hz`);
    out.set('EJ', `${fmt(p.EJ)} J`);
    out.set('EeV', `${fmt(p.EeV)} eV`);
    out.set('eg', region ? region.example : '—');
  }
}

