import { QUARKS, hadron, BETA, chargeThirds, protonMeV, quarkMassPercent } from '../physics/particles.js';
import { fitCanvas, theme, clear, text } from '../lib/canvas.js';
import { section, choice, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';
import { fmt } from '../lib/format.js';

// Hadron and β-decay views stack on phones.
export const tallOnMobile = true;

export const equations = [
  { html: 'baryon = three quarks', what: 'protons (uud) and neutrons (udd) are baryons' },
  { html: 'meson = quark + antiquark', what: 'for example π⁺ = u d̄' },
  { html: 'β⁻: d → u + e⁻ + ν̄<sub>e</sub>', what: 'inside a neutron, one down quark becomes an up quark' },
  { html: 'β⁺: u → d + e⁺ + ν<sub>e</sub>', what: 'inside a proton, one up quark becomes a down quark' },
];

export const prompts = [
  'Build a proton, then a neutron. Add up the quark charges by hand first.',
  'Build u d̄. What is its charge? What about ū d?',
  'Try two up quarks and nothing else. Why can’t that exist on its own?',
  'In β⁻ decay, check that the total charge before equals the total after, at both the quark and the nucleon level.',
  'The quarks in a proton add up to about 10 MeV/c². Where does the rest of its 939 MeV/c² come from?',
];

export const legend = [
  { color: 'series-a', label: 'quark' },
  { color: 'series-b', label: 'antiquark' },
];

const SLOT = [
  { value: '', label: '(empty)' },
  { value: 'u', label: 'u (up, +⅔e)' },
  { value: 'd', label: 'd (down, −⅓e)' },
  { value: 'ubar', label: 'ū (anti-up, −⅔e)' },
  { value: 'dbar', label: 'd̄ (anti-down, +⅓e)' },
];

// Charge in thirds of e, written the way students write it.
function charge(thirds) {
  if (thirds === 0) return '0';
  const sign = thirds > 0 ? '+' : '−';
  const a = Math.abs(thirds);
  if (a % 3 === 0) return `${sign}${a / 3}`;
  return sign + (a === 1 ? '⅓' : a === 2 ? '⅔' : `${a}/3`);
}

const TABLE = (`<table class="fermions" style="margin:10px 0 0;font-size:12px;border-collapse:collapse">
<caption style="text-align:left;color:var(--c-muted);padding-bottom:4px">First-generation fermions (Physics 30 data sheet)</caption>
<tr><th style="text-align:left;padding-right:10px">Particle</th><th style="text-align:left;padding-right:10px">Charge</th><th style="text-align:left">Mass</th></tr>
<tr><td>up quark u</td><td>+⅔e</td><td>~2.4 MeV/c²</td></tr>
<tr><td>down quark d</td><td>−⅓e</td><td>~4.8 MeV/c²</td></tr>
<tr><td>electron e⁻</td><td>−1e</td><td>0.511 MeV/c²</td></tr>
<tr><td>electron neutrino ν<sub>e</sub></td><td>0</td><td>&lt; 2.2 eV/c²</td></tr>
</table>
<p style="margin:6px 0 0;font-size:12px;color:var(--c-muted)">Each has an antiparticle with the same mass and opposite charge (ū, d̄, e⁺, ν̄<sub>e</sub>).</p>`).replaceAll('<td>', '<td style="padding-right:10px">');

export function mount(ui) {
  const box = section(ui.controls, 'Quarks');
  const slots = [
    choice(box, { label: 'Quark 1', options: SLOT, value: 'u' }),
    choice(box, { label: 'Quark 2', options: SLOT, value: 'u' }),
    choice(box, { label: 'Quark 3', options: SLOT, value: 'd' }),
  ];
  const betaBox = section(ui.controls, 'Beta decay');
  const mode = choice(betaBox, {
    label: 'Decay',
    options: [
      { value: 'minus', label: 'β⁻ (neutron → proton)' },
      { value: 'plus', label: 'β⁺ (proton → neutron)' },
    ],
    value: 'minus',
  });

  const out = readouts(ui.readouts, [
    { id: 'q', label: 'Quarks' },
    { id: 'charge', label: 'Total charge' },
    { id: 'kind', label: 'Type' },
    { id: 'name', label: 'Particle' },
    { id: 'mass', label: 'Quark rest energies' },
  ]);
  const note = document.createElement('p');
  note.style.cssText = 'margin:8px 0 0;font-size:12px;color:var(--c-muted)';
  ui.readouts.appendChild(note);
  ui.readouts.insertAdjacentHTML('beforeend', TABLE);

  const canvas = fitCanvas(ui.canvas);
  createClock(ui.transport, { frame: draw });
  ui.transport.hidden = true;

  function ball(ctx, x, y, r, q, th) {
    ctx.fillStyle = q.anti ? th.seriesB : th.seriesA;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, q.symbol, x, y - r * 0.18, { color: '#fff', size: r * 0.7, weight: 700, align: 'center' });
    text(ctx, `${charge(q.thirds)}e`, x, y + r * 0.45, { color: '#fff', size: r * 0.36, weight: 650, align: 'center' });
  }

  // One line of a decay: particles with their charges underneath, then Σq.
  function decayRow(ctx, { before, after }, x, y, wAvail, th, title) {
    const items = [...before.map((p) => ({ ...p })), { arrow: true }, ...after.flatMap((p, i) => (i ? [{ plus: true }, p] : [p]))];
    const step = wAvail / items.length;
    text(ctx, title, x, y - 34, { color: th.muted, size: 12, weight: 650 });
    items.forEach((it, i) => {
      const px = x + step * (i + 0.5);
      if (it.arrow) return text(ctx, '→', px, y, { color: th.ink, size: 18, weight: 700, align: 'center' });
      if (it.plus) return text(ctx, '+', px, y, { color: th.ink, size: 16, align: 'center' });
      // "p (uud)": the quark content goes on a second, smaller line so seven
      // items fit across a phone.
      const [sym, content] = it.symbol.split(' ');
      text(ctx, sym, px, y, { color: th.ink, size: 15, weight: 700, align: 'center' });
      if (content) text(ctx, content, px, y + 16, { color: th.muted, size: 11, align: 'center' });
      text(ctx, `${charge(it.thirds)}e`, px, y + (content ? 32 : 20), { color: th.muted, size: 12, align: 'center' });
    });
    const qb = chargeThirds(before);
    const qa = chargeThirds(after);
    text(ctx, `charge: ${charge(qb)}e before, ${charge(qa)}e after ${qb === qa ? '✓ conserved' : '✗'}`, x, y + 54, { color: th.potential, size: 12, weight: 650 });
  }

  function draw() {
    const { ctx, w, h } = canvas;
    const th = theme();
    const ids = slots.map((s) => s.value).filter(Boolean);
    const had = ids.length ? hadron(ids) : null;
    clear(ctx, w, h);

    const narrow = w < 560;
    const left = narrow ? { x: 0, y: 0, w, h: h * 0.48 } : { x: 0, y: 0, w: w * 0.45, h };
    const right = narrow ? { x: 0, y: h * 0.48, w, h: h * 0.52 } : { x: w * 0.45, y: 0, w: w * 0.55, h };

    // The hadron: quarks inside a "bag".
    const cx = left.x + left.w / 2;
    const cy = left.y + left.h * 0.46;
    const R = Math.min(left.w, left.h) * 0.3;
    const r = R * 0.34;
    ctx.save();
    ctx.strokeStyle = had && had.kind !== 'not a hadron' ? th.ink : th.muted;
    ctx.setLineDash(had && had.kind !== 'not a hadron' ? [] : [6, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    const n = ids.length;
    ids.forEach((id, i) => {
      const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const d = n === 1 ? 0 : R * 0.48;
      ball(ctx, cx + d * Math.cos(a), cy + d * Math.sin(a), r, QUARKS[id], th);
    });
    if (!n) text(ctx, 'pick some quarks', cx, cy, { color: th.muted, size: 13, align: 'center' });
    if (had) {
      const title = had.name ?? had.kind;
      text(ctx, title, cx, cy + R + 22, { color: had.kind === 'not a hadron' ? th.muted : th.ink, size: 15, weight: 700, align: 'center' });
      text(ctx, `charge ${charge(had.thirds)}e`, cx, cy + R + 42, { color: th.muted, size: 13, align: 'center' });
    }

    // β decay, at the quark level and the nucleon level.
    const b = BETA[mode.value];
    const pad = 16;
    ctx.fillStyle = th.bg;
    ctx.fillRect(right.x, right.y, right.w, right.h);
    decayRow(ctx, b.nucleon, right.x + pad, right.y + right.h * 0.24, right.w - 2 * pad, th, 'Nucleon level');
    decayRow(ctx, b.quark, right.x + pad, right.y + right.h * 0.68, right.w - 2 * pad, th, 'Quark level');

    out.set('q', n ? ids.map((id) => QUARKS[id].symbol).join(' ') : '—');
    out.set('charge', had ? `${charge(had.thirds)}e` : '—');
    out.set('kind', had ? had.kind : '—');
    out.set('name', had?.name ?? '—');
    out.set('mass', had ? `≈ ${fmt(had.quarkMeV, 2)} MeV/c²` : '—');
    const nucleon = had && /proton|neutron/.test(had.name ?? '');
    const msg = nucleon
      ? `Its quarks add up to about ${fmt(had.quarkMeV, 2)} MeV/c², only ${fmt(quarkMassPercent(had.quarkMeV), 2)} % of the ${fmt(protonMeV)} MeV/c² nucleon (mc² from the sheet’s 1.67 × 10⁻²⁷ kg). Most of a nucleon’s mass is the energy of the strong force holding the quarks together.`
      : had?.kind === 'not a hadron'
        ? 'Quarks are only found in threes (baryons) or as a quark–antiquark pair (mesons).'
        : '';
    if (note.textContent !== msg) note.textContent = msg;
  }
}
