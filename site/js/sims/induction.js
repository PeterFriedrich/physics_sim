import { lenz, relativeFluxRate } from '../physics/induction.js';
import { fitCanvas, theme, clear, arrow, line, text } from '../lib/canvas.js';
import { section, slider, choice, buttons, readouts } from '../lib/controls.js';
import { createClock } from '../lib/clock.js';

export const equations = [
  { html: 'Lenz’s law', what: 'the induced current flows so that its magnetic field opposes the change in flux that caused it' },
  { html: 'no change in flux → no current', what: 'a magnet at rest inside a coil induces nothing' },
  { html: 'right-hand grip rule', what: 'curl the fingers along the current; the thumb points to the coil’s N end' },
];

export const prompts = [
  'Push the N pole in. Before looking, predict which pole appears at the coil’s left end.',
  'Now pull it out. Why does the needle swing the other way?',
  'Hold the magnet still inside the coil. Why is there no current, even though the flux is large?',
  'Turn the magnet round (S facing the coil) and push it in. Compare the current with the N pole going in.',
  'Push in slowly, then quickly. What changes, and what stays the same?',
  'If the coil helped the magnet in instead of pushing back, where would the extra energy come from?',
];

export const legend = [
  { color: 'friction', label: 'N pole' },
  { color: 'velocity', label: 'S pole' },
  { color: 'force', label: 'induced current I' },
];

// Magnet travel in coil radii, measured from the coil's centre to the magnet's
// facing pole: it stops at the centre going in and at S_MAX going out.
const S_MAX = 4;

export function mount(ui) {
  const box = section(ui.controls, 'Magnet');
  const pole = choice(box, {
    label: 'Pole facing the coil',
    options: [
      { value: 'N', label: 'N (north)' },
      { value: 'S', label: 'S (south)' },
    ],
    value: 'N',
  });
  const speed = slider(box, { label: 'Speed', min: 1, max: 5, step: 1, value: 2 });
  let dir = 0;
  let s = S_MAX;
  buttons(box, [
    { label: 'Push in', primary: true, onClick: () => (dir = s > 0 ? 1 : 0) },
    { label: 'Pull out', onClick: () => (dir = s < S_MAX ? -1 : 0) },
    { label: 'Hold still', onClick: () => (dir = 0) },
  ]);
  pole.onChange(() => (dir = 0));

  const out = readouts(ui.readouts, [
    { id: 'motion', label: 'Magnet' },
    { id: 'flux', label: 'Flux through the coil' },
    { id: 'pole', label: 'Induced pole at the left end' },
    { id: 'cur', label: 'Current seen from the magnet' },
    { id: 'force', label: 'Coil on the magnet' },
  ]);
  ui.readouts.insertAdjacentHTML('beforeend', '<p style="margin:8px 0 0;font-size:12px;color:var(--c-muted)">Directions only. The size of the emf needs emf = BLv or Faraday’s law, which are not on the Physics 30 data sheet; the needle shows only “bigger” or “smaller”. Conventional current.</p>');

  const canvas = fitCanvas(ui.canvas);
  createClock(ui.transport, { frame: draw, autoplay: true });
  ui.transport.hidden = true;

  function draw(clk, dt) {
    const { ctx, w, h } = canvas;
    const th = theme();
    // Speed slider 1–5 → 0.4–2 coil radii per second.
    const v = dir * speed.value * 0.4;
    s = Math.min(S_MAX, Math.max(0, s - v * dt));
    if ((dir > 0 && s === 0) || (dir < 0 && s === S_MAX)) dir = 0;
    const facing = pole.value;
    const L = lenz(facing, dir);
    const rate = relativeFluxRate(s, dir * speed.value * 0.4);
    clear(ctx, w, h);

    // Coil geometry in pixels: axis at y = ay, centre at cx, radius r.
    const ay = h * 0.4;
    const r = Math.min(h * 0.16, w * 0.085);
    const cx = w * 0.64;
    const coilLen = Math.min(w * 0.3, r * 3.2);
    const turns = 7;
    const x0 = cx - coilLen / 2;
    const x1 = cx + coilLen / 2;
    const ex = r * 0.32;
    const tx = (i) => x0 + (coilLen * i) / (turns - 1);
    const copper = '#b8732d';

    // Back halves of the turns, then the magnet, then the front halves.
    for (let i = 0; i < turns; i++) {
      ctx.save();
      ctx.strokeStyle = copper;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(tx(i), ay, ex, r, 0, Math.PI / 2, (3 * Math.PI) / 2, true);
      ctx.stroke();
      ctx.restore();
    }
    // Magnet: facing pole at x = cx − s·r, body extending left.
    const mLen = r * 2.6;
    const mh = r * 0.8;
    const face = cx - s * r;
    const other = facing === 'N' ? 'S' : 'N';
    const col = (p) => (p === 'N' ? th.friction : th.velocity);
    ctx.fillStyle = col(facing);
    ctx.fillRect(face - mLen / 2, ay - mh / 2, mLen / 2, mh);
    ctx.fillStyle = col(other);
    ctx.fillRect(face - mLen, ay - mh / 2, mLen / 2, mh);
    text(ctx, facing, face - mLen / 4, ay, { color: '#fff', size: 18, weight: 700, align: 'center' });
    text(ctx, other, face - (3 * mLen) / 4, ay, { color: '#fff', size: 18, weight: 700, align: 'center' });
    if (dir !== 0) arrow(ctx, face - mLen / 2 - 20 * dir, ay - mh / 2 - 16, 40 * dir, 0, { color: th.ink, width: 2.5, head: 9, label: 'v' });

    for (let i = 0; i < turns; i++) {
      ctx.save();
      ctx.strokeStyle = copper;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(tx(i), ay, ex, r, 0, -Math.PI / 2, Math.PI / 2, false);
      ctx.stroke();
      ctx.restore();
    }
    // Induced current on the front of the turns, and the induced poles.
    if (L.frontCurrent) {
      for (let i = 1; i < turns - 1; i += 2) arrow(ctx, tx(i) + ex, ay + L.frontCurrent * 14, 0, -L.frontCurrent * 28, { color: th.force, width: 2.5, head: 8 });
      const far = L.nearPole === 'N' ? 'S' : 'N';
      text(ctx, L.nearPole, x0 - ex - 4, ay - r - 14, { color: col(L.nearPole), size: 18, weight: 800, align: 'center' });
      text(ctx, far, x1 + ex + 4, ay - r - 14, { color: col(far), size: 18, weight: 800, align: 'center' });
      text(ctx, 'induced poles', cx, ay - r - 36, { color: th.muted, size: 12, align: 'center' });
    }

    // Leads to a galvanometer below the coil.
    const gx = cx;
    const gy = h * 0.8;
    const gr = Math.min(h * 0.14, 56);
    line(ctx, x0, ay + r, x0, gy, { color: copper, width: 2.5 });
    line(ctx, x0, gy, gx - gr, gy, { color: copper, width: 2.5 });
    line(ctx, x1, ay + r, x1, gy, { color: copper, width: 2.5 });
    line(ctx, x1, gy, gx + gr, gy, { color: copper, width: 2.5 });
    ctx.fillStyle = th.bg;
    ctx.strokeStyle = th.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(gx, gy, gr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (const t of [-1, -0.5, 0, 0.5, 1]) {
      const a = -Math.PI / 2 + t * 1.05;
      line(ctx, gx + Math.cos(a) * gr * 0.78, gy + Math.sin(a) * gr * 0.78, gx + Math.cos(a) * gr * 0.9, gy + Math.sin(a) * gr * 0.9, { color: th.muted, width: 1.5 });
    }
    // Needle: side from the current's direction, size from |dΦ/dt| (saturating).
    const defl = L.frontCurrent * 1.05 * (rate / (rate + 0.25));
    const na = -Math.PI / 2 + defl;
    line(ctx, gx, gy, gx + Math.cos(na) * gr * 0.85, gy + Math.sin(na) * gr * 0.85, { color: th.force, width: 3 });
    text(ctx, 'G', gx, gy + gr * 0.45, { color: th.muted, size: 13, weight: 700, align: 'center' });

    if (s === 0 && dir === 0) text(ctx, 'Magnet at rest inside the coil: no change in flux', 16, 20, { color: th.muted, size: 13 });

    out.set('motion', dir > 0 ? 'moving toward the coil' : dir < 0 ? 'moving away from the coil' : 'at rest');
    out.set('flux', L.flux);
    out.set('pole', L.nearPole ? `${L.nearPole} (opposes the change)` : 'none');
    out.set('cur', L.seenFromMagnet ?? 'none');
    out.set('force', L.onMagnet === 'repels' ? 'pushes it away (repels)' : L.onMagnet === 'attracts' ? 'pulls it back (attracts)' : 'no force');
    clk.setTimeLabel('');
  }
}
