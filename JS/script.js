// ---------- Datos ----------
const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const ARC = 2 * Math.PI / ORDER.length;
const COLORS = { r: '#b3202a', b: '#15171a', g: '#0b7a43' };
const NAMES = { r: 'rojo', b: 'negro', g: 'verde' };
const colorOf = n => n === 0 ? 'g' : RED.includes(n) ? 'r' : 'b';

// Cada apuesta: [texto, ¿gana con el número x?, multiplicador de cobro, posición en el tapete, color]
const rules = { n0: ['0', x => x === 0, 36, '1 / 1 / 4 / 2', 'g'] };
for (let n = 1; n <= 36; n++) {
  rules['n' + n] = [String(n), x => x === n, 36, `${3 - (n - 1) % 3} / ${1 + Math.ceil(n / 3)}`, colorOf(n)];
}
Object.assign(rules, {
  c3:    ['2 a 1',     x => x > 0 && x % 3 === 0, 3, '1 / 14'],
  c2:    ['2 a 1',     x => x % 3 === 2,          3, '2 / 14'],
  c1:    ['2 a 1',     x => x % 3 === 1,          3, '3 / 14'],
  d1:    ['1.ª docena', x => x >= 1 && x <= 12,   3, '4 / 2 / 5 / 6'],
  d2:    ['2.ª docena', x => x >= 13 && x <= 24,  3, '4 / 6 / 5 / 10'],
  d3:    ['3.ª docena', x => x >= 25,             3, '4 / 10 / 5 / 14'],
  low:   ['1 a 18',    x => x >= 1 && x <= 18,    2, '5 / 2 / 6 / 4'],
  even:  ['Par',       x => x > 0 && x % 2 === 0, 2, '5 / 4 / 6 / 6'],
  red:   ['Rojo',      x => RED.includes(x),      2, '5 / 6 / 6 / 8', 'r'],
  black: ['Negro',     x => x > 0 && !RED.includes(x), 2, '5 / 8 / 6 / 10', 'b'],
  odd:   ['Impar',     x => x % 2 === 1,          2, '5 / 10 / 6 / 12'],
  high:  ['19 a 36',   x => x >= 19,              2, '5 / 12 / 6 / 14'],
});

// ---------- Estado ----------
let balance = 1000, chip = 5, bets = {}, spinning = false, wheelAngle = 0, lastIdx = null, history = [];
const $ = id => document.getElementById(id);
const total = () => Object.values(bets).reduce((a, b) => a + b, 0);
const ctx = $('wheel').getContext('2d');
const SIZE = 460;

// ---------- Tapete ----------
const cells = {};
for (const key in rules) {
  const [text, , , area, color] = rules[key];
  const cell = document.createElement('button');
  cell.className = 'cell ' + (color || '') + (key[0] === 'n' ? '' : ' out');
  cell.style.gridArea = area;
  cell.innerHTML = text + '<span class="chip"></span>';
  cell.onclick = () => place(key);
  $('board').append(cell);
  cells[key] = cell;
}

document.querySelectorAll('.chip-btn').forEach(btn => {
  btn.onclick = () => {
    chip = +btn.dataset.value;
    document.querySelectorAll('.chip-btn').forEach(b => b.classList.toggle('on', b === btn));
  };
});

function render() {
  $('bal').textContent = balance;
  $('tot').textContent = total();
  for (const key in cells) cells[key].querySelector('.chip').textContent = bets[key] || '';
}

function clearWin() {
  document.querySelectorAll('.win').forEach(c => c.classList.remove('win'));
}

function place(key) {
  if (spinning) return;
  if (balance < chip) { $('msg').textContent = 'Saldo insuficiente.'; return; }
  clearWin();
  balance -= chip;
  bets[key] = (bets[key] || 0) + chip;
  render();
}

$('clear').onclick = () => {
  if (spinning) return;
  balance += total();
  bets = {};
  render();
};

// ---------- Giro ----------
$('spin').onclick = () => {
  if (spinning || !total()) return;
  spinning = true;
  clearWin();
  $('msg').textContent = 'Rien ne va plus…';

  const idx = Math.floor(Math.random() * ORDER.length);   // casilla ganadora
  const start = wheelAngle;
  const end = start + 6 * Math.PI;                        // la rueda da 3 vueltas
  const t0 = performance.now(), duration = 6000;

  function frame(now) {
    const p = Math.min((now - t0) / duration, 1);
    const e = 1 - (1 - p) ** 3;                           // frena poco a poco
    wheelAngle = start + (end - start) * e;
    // La bola gira en sentido contrario y termina justo en la casilla ganadora
    const ballAngle = end + idx * ARC - Math.PI / 2 + 14 * Math.PI * (1 - e);
    const ballRadius = p < 0.6 ? 0.87 : 0.87 - 0.17 * Math.min((p - 0.6) / 0.3, 1);
    draw(ballAngle, ballRadius);
    if (p < 1) requestAnimationFrame(frame); else finish(idx);
  }
  requestAnimationFrame(frame);
};

function finish(idx) {
  const n = ORDER[idx], bet = total();
  let payout = 0;
  for (const key in bets) {
    if (rules[key][1](n)) { payout += bets[key] * rules[key][2]; cells[key].classList.add('win'); }
  }
  cells['n' + n].classList.add('win');

  balance += payout;
  bets = {};
  lastIdx = idx;
  history = [n, ...history].slice(0, 12);

  let text = `Ha salido el ${n} (${NAMES[colorOf(n)]}). ` + (payout ? `Cobras ${payout}.` : 'Sin premio.');
  if (balance < 1) { balance = 1000; text += ' Se reinicia tu saldo a 1000.'; }
  $('msg').textContent = text;
  $('hist').innerHTML = history.map(h => `<span class="dot ${colorOf(h)}">${h}</span>`).join('');
  spinning = false;
  render();
  draw(wheelAngle + idx * ARC - Math.PI / 2, 0.7);
}

// ---------- Dibujo ----------
function draw(ballAngle, ballRadius) {
  const c = SIZE / 2, R = c - 4;
  ctx.clearRect(0, 0, SIZE, SIZE);
  ctx.fillStyle = '#3a2314';
  ctx.beginPath(); ctx.arc(c, c, R, 0, 2 * Math.PI); ctx.fill();

  ctx.font = '700 12px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#d9b25f';

  ORDER.forEach((n, i) => {
    const a = wheelAngle + i * ARC - Math.PI / 2;          // centro de la casilla
    ctx.beginPath();
    ctx.arc(c, c, R * 0.8, a - ARC / 2, a + ARC / 2);
    ctx.arc(c, c, R * 0.6, a + ARC / 2, a - ARC / 2, true);
    ctx.closePath();
    ctx.fillStyle = COLORS[colorOf(n)];
    ctx.fill(); ctx.stroke();

    ctx.save();
    ctx.translate(c, c); ctx.rotate(a);
    ctx.fillStyle = '#fff';
    ctx.fillText(n, R * 0.78, 0);
    ctx.restore();
  });

  if (ballAngle !== null) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(c + Math.cos(ballAngle) * ballRadius * R, c + Math.sin(ballAngle) * ballRadius * R, 7, 0, 2 * Math.PI);
    ctx.fill();
  }
}

render();
draw(null);
