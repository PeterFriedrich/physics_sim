import { NUCLIDES, DECAYS, emitted, balance, energyReleased, electronMassU } from '../physics/reactions.js';
import { fitCanvas, theme, clear, text } from '../lib/canvas.js';
import { section, choice, readouts, el } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

export const equations = [
  { html: 'Δm = m<sub>parent</sub> − m<sub>products</sub>', what: 'mass defect' },
  { html: 'ΔE = Δmc²', what: 'energy released' },
  { html: 'u = 1.66 × 10⁻²⁷ kg, &nbsp; 1 eV = 1.60 × 10⁻¹⁹ J', what: 'from the data sheet' },
  { html: 'charge and nucleon number are conserved', what: 'the top and bottom numbers must balance' },
];

export const prompts = [
  'Before looking: write the balanced equation for U-238 alpha decay. Check the top and bottom numbers.',
  'Calculate Δm in u for the uranium decay, convert it to kg, then find the energy with ΔE = Δmc².',
  'In β⁻ decay the nucleon number stays the same. Which particle inside the nucleus changed?',
  'Why does β⁺ decay subtract two electron masses when you use atomic masses?',
  'Compare the energy from one alpha decay with the energy of a visible photon (about 2 eV).',
];

export const legend = [
  { color: 'friction', label: 'protons' },
  { color: 'muted', label: 'neutrons' },
  { color: 'accent', label: 'emitted particle' },
];

const MODE_NAME = { alpha: 'alpha decay', 'beta-': 'beta-minus decay', 'beta+': 'beta-plus decay', gamma: 'gamma decay' };
const OPTIONS = DECAYS.map((d, i) => ({ value: i, label: `${d.parent} (${MODE_NAME[d.mode]})` }));

// A over Z, stacked to the left of the symbol, as written on paper.
const nuc = (A, Z, sym) => `<span class="nuc"><span class="az"><span>${A}</span><span>${Z}</span></span>${sym}</span>`;

function nuclideHtml(key) {
  const n = NUCLIDES[key];
  return nuc(n.A, n.Z, `${n.symbol}${key.endsWith('m') ? '*' : ''}`);
}

const PARTICLE_HTML = {
  alpha: [nuc(4, 2, 'He')],
  'beta-': [nuc(0, '−1', 'e'), nuc(0, 0, 'ν̄')],
  'beta+': [nuc(0, '+1', 'e'), nuc(0, 0, 'ν')],
  gamma: [nuc(0, 0, 'γ')],
};

export function mount(ui) {
  const box = section(ui.controls, 'Decay');
  const pick = choice(box, { label: 'Parent nuclide', options: OPTIONS, value: 0 });

  const eq = el('div', { class: 'decay-eq', style: 'font: 20px/1.4 "Cambria Math", Georgia, serif; padding: 4px 0 10px' }, ui.readouts);
  const out = readouts(ui.readouts, [
    { id: 'Z', label: 'Charge Z: before → after' },
    { id: 'A', label: 'Nucleons A: before → after' },
    { id: 'masses', label: 'Masses used' },
    { id: 'dmU', label: 'Δm' },
    { id: 'dmKg', label: 'Δm in kg' },
    { id: 'EJ', label: 'ΔE = Δmc²' },
    { id: 'EMeV', label: 'ΔE (MeV)' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Atomic masses (u, including electrons) are given data from standard tables, as a Diploma question supplies them; they are not on the data sheet. * marks an excited nucleus.</p>');

  const canvas = fitCanvas(ui.canvas);
  const clock = createClock(ui.transport, { frame: draw, autoplay: true });
  pick.onChange(() => (clock.reset(), clock.play()));

  // Deterministic nucleon packing so the picture does not jitter between frames.
  function packed(Z, A, cx, cy, scale) {
    const pts = [];
    const nShow = Math.min(A, 60);
    for (let i = 0; i < nShow; i++) {
      const ang = i * 2.39996;
      const rr = Math.sqrt(i + 0.5) * scale;
      pts.push({ x: cx + rr * Math.cos(ang), y: cy + rr * Math.sin(ang), proton: i % Math.round(A / Math.max(1, Math.min(Z, A))) === 0 });
    }
    return pts;
  }

  function draw(clk) {
    const { ctx, w, h } = canvas;
    const th = theme();
    const d = DECAYS[pick.value];
    const P = NUCLIDES[d.parent];
    const D = NUCLIDES[d.daughter];
    const E = energyReleased(d);
    const b = balance(d);
    clear(ctx, w, h);

    // Loop: parent sits, then emits; the emitted particle flies right.
    const phase = (clk.t % 4) / 4;
    const cx = w * 0.32;
    const cy = h * 0.5;
    const R = Math.min(w, h) * 0.018;
    const nucleus = packed(phase < 0.3 ? P.Z : D.Z, phase < 0.3 ? P.A : D.A, cx, cy, R);
    for (const p of nucleus) {
      ctx.fillStyle = p.proton ? th.friction : th.muted;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R * 0.95, 0, Math.PI * 2);
      ctx.fill();
    }
    const label = phase < 0.3 ? d.parent : d.daughter;
    text(ctx, label, cx, cy + Math.sqrt(60) * R + 24, { color: th.ink, size: 15, weight: 700, align: 'center' });
    text(ctx, phase < 0.3 ? 'parent' : 'daughter', cx, cy + Math.sqrt(60) * R + 42, { color: th.muted, size: 12, align: 'center' });

    if (phase >= 0.3) {
      const k = (phase - 0.3) / 0.7;
      const ex = cx + 40 + k * (w * 0.6);
      const parts = emitted(d.mode);
      parts.forEach((pt, i) => {
        const ey = cy + (i === 0 ? -1 : 1) * (parts.length > 1 ? 30 * k + 8 : 0);
        ctx.fillStyle = th.accent;
        if (d.mode === 'gamma') {
          ctx.save();
          ctx.strokeStyle = th.accent;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let j = 0; j <= 30; j++) {
            const x = ex - 30 + (60 * j) / 30;
            const y = ey + 8 * Math.sin((j / 30) * Math.PI * 6);
            j ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(ex, ey, d.mode === 'alpha' ? R * 2 : R * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
        text(ctx, pt.label, ex, ey - 22, { color: th.ink, size: 12, align: 'center' });
      });
      text(ctx, `+ ${fmt(E.MeV, 3)} MeV of kinetic energy`, w * 0.65, h * 0.14, { color: th.ink, size: 14, weight: 650, align: 'center' });
    }

    // Equation (HTML) and readouts.
    const html = `${nuclideHtml(d.parent)} → ${nuclideHtml(d.daughter)} + ${PARTICLE_HTML[d.mode].join(' + ')}`;
    if (eq.innerHTML !== html) eq.innerHTML = html;
    out.set('Z', `${b.left.Z} → ${b.right.Z}`);
    out.set('A', `${b.left.A} → ${b.right.A}`);
    if (d.mode === 'gamma') {
      out.set('masses', `none: γ energy given (${d.gammaMeV} MeV)`);
    } else {
      const parts = [`${d.parent} ${P.mass}`, `${d.daughter} ${D.mass}`];
      if (d.mode === 'alpha') parts.push(`He-4 ${NUCLIDES['He-4'].mass}`);
      if (d.mode === 'beta+') parts.push(`2mₑ = ${(2 * electronMassU).toFixed(6)}`);
      out.set('masses', `${parts.join(', ')} u`);
    }
    out.set('dmU', `${E.dmU.toFixed(6)} u`);
    out.set('dmKg', `${fmt(E.dmKg)} kg`);
    out.set('EJ', `${fmt(E.J)} J`);
    out.set('EMeV', `${fmt(E.MeV)} MeV`);
    clk.setTimeLabel(MODE_NAME[d.mode]);
  }
}

