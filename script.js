let fields = [
    null,
    null,
    null,
    null,
    null,
    'cross',
    null,
    null,
    'circle'
];

const SYMBOLS = { cross: crossSVG() , circle: circleSVG() };

function render() {
  const parts = [];
  parts.push('<table class="board">');

  for (let row = 0; row < 3; row++) {
    parts.push('<tr>');
    for (let col = 0; col < 3; col++) {
      const i = row * 3 + col;
      const val = fields[i];
      const content = val ? `<span class="mark ${val}">${SYMBOLS[val]}</span>` : '';
      parts.push(`<td class="cell" data-index="${i}">${content}</td>`);
    }
    parts.push('</tr>');
  }

  parts.push('</table>');
  const el = document.getElementById('content');
  if (el) el.innerHTML = parts.join('');
}


function circleSVG({ size = 70, color = '#00B0EF', duration = 250, strokeWidth = 5 } = {}) {
  const r = (size - strokeWidth) / 2;          // Radius passend zur Größe
  const c = size / 2;                          // Mittelpunkt
  const circumference = 2 * Math.PI * r;       // Kreisumfang

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Animated stroke circle">
  <circle
    cx="${c}" cy="${c}" r="${r}"
    fill="none"
    stroke="${color}"
    stroke-width="${strokeWidth}"
    stroke-dasharray="${circumference}"
    stroke-dashoffset="${circumference}"
  >
    <animate
      attributeName="stroke-dashoffset"
      from="${circumference}"
      to="0"
      dur="${duration}ms"
      fill="freeze"
    />
  </circle>
</svg>
  `.trim();
}


function crossSVG({
  size = 70,
  color = '#FFC000',
  strokeWidth = 8,
  perStrokeDuration = 125, // ms pro Strich -> gesamt 250ms
  margin = 10              // Innenabstand, damit nichts abgeschnitten wird
} = {}) {
  const s = size;
  const m = margin;
  const x1 = m,         y1 = m;
  const x2 = s - m,     y2 = s - m;
  const x3 = s - m,     y3 = m;
  const x4 = m,         y4 = s - m;

  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="Animated cross">
  <g fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Erster Strich: "\" -->
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
      <animate id="draw1"
        attributeName="stroke-dashoffset"
        from="100" to="0"
        dur="${perStrokeDuration}ms"
        fill="freeze" />
    </line>

    <!-- Zweiter Strich: "/" startet nach draw1 -->
    <line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
      <animate
        attributeName="stroke-dashoffset"
        from="100" to="0"
        begin="draw1.end"
        dur="${perStrokeDuration}ms"
        fill="freeze" />
    </line>
  </g>
</svg>
  `.trim();
}