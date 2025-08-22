let fields = [
  null, null, null,
  null, null, 'cross',
  null, null, 'circle'
];

// SVG-Funktionen (hier als Referenz genutzt – sie müssen bereits existieren)
const SYMBOLS = {
  cross: () => crossSVG(),   // ggf. crossStrokeSVG()
  circle: () => circleSVG()  // ggf. circleStrokeSVG()
};

// --- NEW: Gewinn-Kombinationen
const WINNING_COMBINATIONS = [
  [0,1,2], [3,4,5], [6,7,8], // Reihen
  [0,3,6], [1,4,7], [2,5,8], // Spalten
  [0,4,8], [2,4,6]           // Diagonalen
];

// Nächster Zug anhand der bisherigen Belegungen (immer abwechselnd)
function getNextSymbol() {
  const crosses = fields.filter(v => v === 'cross').length;
  const circles = fields.filter(v => v === 'circle').length;
  return crosses <= circles ? 'cross' : 'circle';
}

// --- NEW: Gewinner ermitteln
function getWinner() {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    const v = fields[a];
    if (v && v === fields[b] && v === fields[c]) {
      return { symbol: v, combo }; // {symbol:'cross'|'circle', combo:[...]}
    }
  }
  return null;
}

// --- NEW: Spielende prüfen (bei jedem Klick aufrufen)
function checkGameOver() {
  const result = getWinner();
  if (result) {
    drawWinLine(result.combo);
    disableAllClicks();
    return true;
  }
  // Optional: Unentschieden (wenn alle belegt)
  // if (fields.every(v => v !== null)) { disableAllClicks(); }
  return false;
}

// --- NEW: Alle weiteren Klicks deaktivieren
function disableAllClicks() {
  document
    .querySelectorAll('#content .cell[onclick]')
    .forEach(td => td.removeAttribute('onclick'));
}

// --- NEW: Gewinnlinie zeichnen (SVG-Overlay)
function drawWinLine(combo) {
  const overlay = document.querySelector('#content .win-overlay');
  if (!overlay) return;

  // Overlay leeren
  overlay.innerHTML = '';

  // Koordinaten in Prozent (0..100)
  const MARGIN = 5;
  const STEP = 100 / 3;
  const STROKE = 3;

  const rowOf = i => Math.floor(i / 3);
  const colOf = i => i % 3;

  let x1, y1, x2, y2;

  // Reihe
  if (rowOf(combo[0]) === rowOf(combo[1]) && rowOf(combo[1]) === rowOf(combo[2])) {
    const r = rowOf(combo[0]);
    const cy = (r + 0.5) * STEP;
    x1 = MARGIN;           y1 = cy;
    x2 = 100 - MARGIN;     y2 = cy;
  }
  // Spalte
  else if (colOf(combo[0]) === colOf(combo[1]) && colOf(combo[1]) === colOf(combo[2])) {
    const c = colOf(combo[0]);
    const cx = (c + 0.5) * STEP;
    x1 = cx;               y1 = MARGIN;
    x2 = cx;               y2 = 100 - MARGIN;
  }
  // Diagonale 0-4-8
  else if (combo.join(',') === '0,4,8') {
    x1 = MARGIN;           y1 = MARGIN;
    x2 = 100 - MARGIN;     y2 = 100 - MARGIN;
  }
  // Diagonale 2-4-6
  else if (combo.join(',') === '2,4,6') {
    x1 = 100 - MARGIN;     y1 = MARGIN;
    x2 = MARGIN;           y2 = 100 - MARGIN;
  }

  // Animierte Linie: wird von 0 → voll gezeichnet (stroke-dashoffset)
  overlay.innerHTML = `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
          stroke="white" stroke-width="${STROKE}" stroke-linecap="round"
          pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
      <animate attributeName="stroke-dashoffset"
               from="100" to="0"
               dur="${typeof WINLINE_ANIM_MS !== 'undefined' ? WINLINE_ANIM_MS : 500}ms"
               fill="freeze" />
    </line>
  `;
}

// Klick-Handler für Zellen
function handleCellClick(tdEl, index) {
  if (fields[index] !== null) return;           // schon belegt -> ignorieren
  const symbol = getNextSymbol();               // 'cross' oder 'circle'
  fields[index] = symbol;                       // Zustand updaten
  tdEl.innerHTML = SYMBOLS[symbol]();           // SVG in die Zelle schreiben
  tdEl.removeAttribute('onclick');              // weiteren Klick deaktivieren
  checkGameOver();                              // --- NEW: nach jedem Zug prüfen
}

// Render-Funktion
function render() {
  const parts = [];
  // --- NEW: Wrapper mit Overlay
  parts.push('<div class="board-wrap" style="position:relative;display:inline-block;">');
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
  // --- NEW: Overlay-SVG (für Gewinnlinie)
  parts.push('<svg class="win-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;pointer-events:none;"></svg>');
  parts.push('</div>');

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