/* Kleine SVG-donutchart zonder externe library */

const PALETTE = ["#5b83e8","#2f5bd6","#1a3180","#0f1c4a","#8fa8ef","#3d6fdb","#213a8c","#6f90e0"];

function donutChart(segments, opts) {
  const size = (opts && opts.size) || 180;
  const stroke = (opts && opts.stroke) || 26;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((seg, i) => {
    const frac = seg.value / total;
    const dash = frac * circumference;
    const el = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${seg.color || PALETTE[i % PALETTE.length]}"
      stroke-width="${stroke}" stroke-dasharray="${dash} ${circumference - dash}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 ${c} ${c})" stroke-linecap="butt"></circle>`;
    offset += dash;
    return el;
  }).join("");

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Verdeling">
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--line-soft)" stroke-width="${stroke}"></circle>
    ${arcs}
  </svg>`;
}

function barList(rows, opts) {
  const max = Math.max(...rows.map(r => r.value), 1);
  return rows.map(r => `
    <div class="bar-row">
      <div class="lbl small">${r.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.max(2, (r.value / max) * 100)}%; background:${r.color || ""}"></div></div>
      <div class="amt">${(opts && opts.fmt ? opts.fmt(r.value) : r.value)}</div>
    </div>
  `).join("");
}
