/***** STATE *****/
let fields = [
  null, null, null,
  null, null, 'cross',
  null, null, 'circle'
];

let mode = 'pvp';               // 'pvp' | 'cpu'
let startSymbol = 'cross';       // 'cross' | 'circle' (wer beginnt)
let humanSymbol = 'cross';       // im CPU-Modus: Mensch spielt dieses Symbol
let currentTurn = 'cross';       // wer ist dran
let gameOver = false;

// Overlay
let settingsOpen = true;         // Start: Einstellungen offen
let tempStartSymbol = startSymbol;
let tempMode = mode;

const WINLINE_ANIM_MS = 500;
const AI_MOVE_DELAY = 300;

const SYMBOLS = {
  cross: () => crossSVG(),
  circle: () => circleSVG()
};

const WINNING_COMBINATIONS = [
  [0,1,2], [3,4,5], [6,7,8],
  [0,3,6], [1,4,7], [2,5,8],
  [0,4,8], [2,4,6]
];

/***** INIT / RENDER *****/
function initTurnFromBoard() {
  const crosses = fields.filter(v => v === 'cross').length;
  const circles = fields.filter(v => v === 'circle').length;
  currentTurn = crosses <= circles ? 'cross' : 'circle';
}

function symbolPreview(symbol, size = 36) {
  return symbol === 'cross'
    ? crossSVG({ size, perStrokeDuration: 100, strokeWidth: 6, margin: 6 })
    : circleSVG({ size, duration: 200, strokeWidth: 4 });
}

function render() {
  const parts = [];

  // UI-Bar: Restart immer sichtbar + Settings-Button
  parts.push(`
    <div class="ui-bar">
      <button class="btn" onclick="restartGame()">↻ Restart</button>
      <button class="btn" onclick="openSettings()">⚙️ Einstellungen</button>
    </div>
  `);

  // Board + Overlay
  parts.push(`<div class="board-wrap" style="position:relative;display:inline-block;">`);
  parts.push('<table class="board">');

  for (let row = 0; row < 3; row++) {
    parts.push('<tr>');
    for (let col = 0; col < 3; col++) {
      const i = row * 3 + col;
      const val = fields[i];
      const content = val ? SYMBOLS[val]() : '';
      const clickable = !val && !gameOver && !settingsOpen;
      const onclick = clickable ? ` onclick="handleCellClick(this, ${i})"` : '';
      parts.push(`<td class="cell" data-index="${i}"${onclick}>${content}</td>`);
    }
    parts.push('</tr>');
  }

  parts.push('</table>');
  parts.push('<svg class="win-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0;pointer-events:none;"></svg>');

  // SETTINGS OVERLAY (Buttons mit aktivem Zustand)
  parts.push(`
    <div class="settings-overlay" style="display:${settingsOpen ? 'flex' : 'none'};">
      <div class="backdrop" onclick="closeSettings()"></div>
      <div class="modal">
        <h3>Einstellungen</h3>

        <div class="group">
          <div class="label">Startsymbol</div>
          <div class="btn-row">
            <button class="btn-toggle ${tempStartSymbol==='cross'?'is-active':''}" onclick="selectStart('cross')">
              ${symbolPreview('cross', 32)}
              <span>X</span>
            </button>
            <button class="btn-toggle ${tempStartSymbol==='circle'?'is-active':''}" onclick="selectStart('circle')">
              ${symbolPreview('circle', 32)}
              <span>O</span>
            </button>
          </div>
        </div>

        <div class="group">
          <div class="label">Modus</div>
          <div class="btn-row">
            <button class="btn-toggle ${tempMode==='pvp'?'is-active':''}" onclick="selectMode('pvp')">👥 Zwei Spieler</button>
            <button class="btn-toggle ${tempMode==='cpu'?'is-active':''}" onclick="selectMode('cpu')">🤖 Computer</button>
          </div>
        </div>

        <div class="btn-row end">
          <button class="btn" onclick="closeSettings()">Abbrechen</button>
          <button class="btn primary" onclick="applySettings()">Übernehmen & Start</button>
          <button class="btn" onclick="restartGame()">↻ Restart</button>
        </div>

        <p class="hint">Im Computer-Modus spielt der Mensch mit dem gewählten Startsymbol.</p>
      </div>
    </div>
  `);

  parts.push('</div>'); // board-wrap

  const el = document.getElementById('content');
  if (el) el.innerHTML = parts.join('');
}

function openSettings() {
  tempStartSymbol = startSymbol;
  tempMode = mode;
  settingsOpen = true;
  render();
}
function closeSettings() { settingsOpen = false; render(); }

function selectStart(sym) { tempStartSymbol = sym; render(); }
function selectMode(m)    { tempMode = m;         render(); }

function applySettings() {
  startSymbol = tempStartSymbol;
  mode = tempMode;
  humanSymbol = startSymbol;
  restartGame();
}

/***** GAME MANAGEMENT *****/
function restartGame() {
  fields = Array(9).fill(null);
  gameOver = false;
  currentTurn = startSymbol;
  settingsOpen = false;
  render();

  // CPU am Zug? (wenn CPU-Modus und Mensch NICHT dran)
  if (mode === 'cpu' && currentTurn !== humanSymbol) {
    setTimeout(computerMove, AI_MOVE_DELAY);
  }
}

/***** GAME LOGIC *****/
function getNextSymbol() { return currentTurn; }
function toggleTurn()    { currentTurn = currentTurn === 'cross' ? 'circle' : 'cross'; }

function getWinner() {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    const v = fields[a];
    if (v && v === fields[b] && v === fields[c]) return { symbol: v, combo };
  }
  return null;
}

function checkGameOver() {
  const result = getWinner();
  if (result) {
    drawWinLine(result.combo);
    disableAllClicks();
    gameOver = true;
    return true;
  }
  if (fields.every(v => v !== null)) {
    disableAllClicks();
    gameOver = true;
    return true;
  }
  return false;
}

function disableAllClicks() {
  document.querySelectorAll('#content .cell[onclick]').forEach(td => td.removeAttribute('onclick'));
}

/***** WIN LINE *****/
function drawWinLine(combo) {
  const overlay = document.querySelector('#content .win-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  const MARGIN = 5, STEP = 100 / 3, STROKE = 3;
  const rowOf = i => Math.floor(i / 3);
  const colOf = i => i % 3;

  let x1, y1, x2, y2;

  if (rowOf(combo[0]) === rowOf(combo[1]) && rowOf(combo[1]) === rowOf(combo[2])) {
    const r = rowOf(combo[0]); const cy = (r + 0.5) * STEP;
    x1 = MARGIN; y1 = cy; x2 = 100 - MARGIN; y2 = cy;
  } else if (colOf(combo[0]) === colOf(combo[1]) && colOf(combo[1]) === colOf(combo[2])) {
    const c = colOf(combo[0]); const cx = (c + 0.5) * STEP;
    x1 = cx; y1 = MARGIN; x2 = cx; y2 = 100 - MARGIN;
  } else if (combo.join(',') === '0,4,8') {
    x1 = MARGIN; y1 = MARGIN; x2 = 100 - MARGIN; y2 = 100 - MARGIN;
  } else if (combo.join(',') === '2,4,6') {
    x1 = 100 - MARGIN; y1 = MARGIN; x2 = MARGIN; y2 = 100 - MARGIN;
  }

  overlay.innerHTML = `
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
          stroke="white" stroke-width="${STROKE}" stroke-linecap="round"
          pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
      <animate attributeName="stroke-dashoffset" from="100" to="0"
               dur="${WINLINE_ANIM_MS}ms" fill="freeze" />
    </line>
  `;
}

/***** HUMAN MOVE *****/
function handleCellClick(tdEl, index) {
  if (gameOver || settingsOpen) return;
  if (mode === 'cpu' && getNextSymbol() !== humanSymbol) return;
  if (fields[index] !== null) return;

  const symbol = getNextSymbol();
  fields[index] = symbol;
  tdEl.innerHTML = SYMBOLS[symbol]();
  tdEl.removeAttribute('onclick');

  if (checkGameOver()) return;
  toggleTurn();

  if (mode === 'cpu' && getNextSymbol() !== humanSymbol) {
    setTimeout(computerMove, AI_MOVE_DELAY);
  }
}

/***** COMPUTER MOVE *****/
function computerMove() {
  if (gameOver || settingsOpen) return;

  const aiSymbol = getNextSymbol();
  const human = humanSymbol;

  let move = findWinningMove(aiSymbol);
  if (move == null) move = findWinningMove(human);
  if (move == null && fields[4] === null) move = 4;
  if (move == null) {
    const corners = [0,2,6,8].filter(i => fields[i] === null);
    if (corners.length) move = corners[Math.floor(Math.random()*corners.length)];
  }
  if (move == null) {
    const sides = [1,3,5,7].filter(i => fields[i] === null);
    if (sides.length) move = sides[Math.floor(Math.random()*sides.length)];
  }
  if (move == null) return;

  fields[move] = aiSymbol;
  const td = document.querySelector(`#content .cell[data-index="${move}"]`);
  if (td) {
    td.innerHTML = SYMBOLS[aiSymbol]();
    td.removeAttribute('onclick');
  }

  if (checkGameOver()) return;
  toggleTurn();
}

/***** HELPERS *****/
function findWinningMove(symbol) {
  for (let i = 0; i < fields.length; i++) {
    if (fields[i] !== null) continue;
    fields[i] = symbol;
    const w = getWinner();
    fields[i] = null;
    if (w && w.symbol === symbol) return i;
  }
  return null;
}

/***** SVG ICONS (wie gehabt) *****/
function circleSVG({ size = 70, color = '#00B0EF', duration = 250, strokeWidth = 5 } = {}) {
  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Animated stroke circle">
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}">
    <animate attributeName="stroke-dashoffset" from="${circumference}" to="0" dur="${duration}ms" fill="freeze" />
  </circle>
</svg>`.trim();
}

function crossSVG({ size = 70, color = '#FFC000', strokeWidth = 8, perStrokeDuration = 125, margin = 10 } = {}) {
  const s = size, m = margin;
  const x1 = m,     y1 = m;
  const x2 = s - m, y2 = s - m;
  const x3 = s - m, y3 = m;
  const x4 = m,     y4 = s - m;
  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" role="img" aria-label="Animated cross">
  <g fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
      <animate attributeName="stroke-dashoffset" from="100" to="0" dur="${perStrokeDuration}ms" fill="freeze" />
    </line>
    <line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100">
      <animate attributeName="stroke-dashoffset" from="100" to="0" begin="${perStrokeDuration}ms" dur="${perStrokeDuration}ms" fill="freeze" />
    </line>
  </g>
</svg>`.trim();
}

/***** APP-START *****/
initTurnFromBoard();
render();
