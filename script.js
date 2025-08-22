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

// SVG-Funktionen (hier als Referenz genutzt – sie müssen bereits existieren)
const SYMBOLS = {
  cross: () => crossSVG(),   // falls deine Funktion anders heißt: crossStrokeSVG()
  circle: () => circleSVG()  // ggf. circleStrokeSVG()
};

// Nächster Zug anhand der bisherigen Belegungen (immer abwechselnd)
function getNextSymbol() {
  const crosses = fields.filter(v => v === 'cross').length;
  const circles = fields.filter(v => v === 'circle').length;
  return crosses <= circles ? 'cross' : 'circle';
}

// Klick-Handler für Zellen
function handleCellClick(tdEl, index) {
  if (fields[index] !== null) return;           // schon belegt -> ignorieren
  const symbol = getNextSymbol();               // 'cross' oder 'circle'
  fields[index] = symbol;                       // Zustand updaten
  tdEl.innerHTML = SYMBOLS[symbol]();           // SVG in die Zelle schreiben
  tdEl.removeAttribute('onclick');              // weiteren Klick deaktivieren
}

// Render-Funktion
function render() {
  const parts = [];
  parts.push('<table class="board">');

  for (let row = 0; row < 3; row++) {
    parts.push('<tr>');
    for (let col = 0; col < 3; col++) {
      const i = row * 3 + col;
      const val = fields[i];
      const content = val ? SYMBOLS[val]() : '';
      const onclick = val ? '' : ` onclick="handleCellClick(this, ${i})"`;
      parts.push(`<td class="cell" data-index="${i}"${onclick}>${content}</td>`);
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
  perStrokeDuration = 125, // ms pro Strich
  margin = 10
} = {}) {
  const s = size, m = margin;
  const x1 = m,     y1 = m;
  const x2 = s - m, y2 = s - m;
  const x3 = s - m, y3 = m;
  const x4 = m,     y4 = s - m;

  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="Animated cross">
  <g fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Erster Strich: "\" -->
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
          pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
      <animate attributeName="stroke-dashoffset"
               from="100" to="0"
               dur="${perStrokeDuration}ms"
               fill="freeze" />
    </line>

    <!-- Zweiter Strich: "/" startet zeitversetzt -->
    <line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}"
          pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
      <animate attributeName="stroke-dashoffset"
               from="100" to="0"
               begin="${perStrokeDuration}ms"
               dur="${perStrokeDuration}ms"
               fill="freeze" />
    </line>
  </g>
</svg>
  `.trim();
}