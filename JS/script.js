const apuesta = 10;
const palos = ["♠", "♥", "♦", "♣"];
const nombres = ["", "", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const nombresManos = ["carta alta", "pareja", "doble pareja", "trío", "escalera", "color", "full", "póquer", "escalera de color"];

const jugador = document.querySelector("#player-hand");
const banca = document.querySelector("#dealer-hand");
const fichasJugador = document.querySelector("#player-chips");
const fichasBanca = document.querySelector("#dealer-chips");
const mensaje = document.querySelector("#game-message");
const resultadoJugador = document.querySelector("#player-result");
const resultadoBanca = document.querySelector("#dealer-result");
const botonRepartir = document.querySelector("#deal-button");
const botonCambiar = document.querySelector("#draw-button");
const botonReiniciar = document.querySelector("#reset-button");

let fichas = 100;
let fichasDeBanca = 100;
let baraja = [];
let cartasJugador = [];
let cartasBanca = [];
let descartes = new Set();
let turnoDeCambio = false;

// Crea y mezcla las 52 cartas.
function crearBaraja() {
  const cartas = [];
  for (const palo of palos) {
    for (let valor = 2; valor <= 14; valor++) {
      cartas.push({ valor, palo });
    }
  }

  for (let i = cartas.length - 1; i > 0; i--) {
    const otroIndice = Math.floor(Math.random() * (i + 1));
    [cartas[i], cartas[otroIndice]] = [cartas[otroIndice], cartas[i]];
  }
  return cartas;
}

// Muestra tus cartas y oculta las de la banca hasta el final.
function mostrarCartas(revelarBanca = false) {
  jugador.replaceChildren();

  cartasJugador.forEach((carta, indice) => {
    const boton = document.createElement("button");
    boton.textContent = nombres[carta.valor] + carta.palo;
    boton.disabled = !turnoDeCambio;
    boton.setAttribute("aria-pressed", descartes.has(indice));
    boton.onclick = () => {
      if (descartes.has(indice)) {
        descartes.delete(indice);
      } else if (descartes.size < 3) {
        descartes.add(indice);
      } else {
        mensaje.textContent = "Solo puedes cambiar tres cartas.";
      }
      mostrarCartas();
    };
    jugador.append(boton);
  });

  if (revelarBanca) {
    banca.textContent = cartasBanca
      .map(carta => nombres[carta.valor] + carta.palo)
      .join("  ");
  } else {
    banca.textContent = "🂠  🂠  🂠  🂠  🂠";
  }
}

// Devuelve la fuerza de una mano: primero su categoría y luego sus cartas altas.
function puntuarMano(mano) {
  const valores = mano.map(carta => carta.valor).sort((a, b) => a - b);
  const valoresAltos = [...valores].reverse();
  const conteo = {};

  for (const carta of mano) {
    conteo[carta.valor] = (conteo[carta.valor] || 0) + 1;
  }

  const grupos = Object.entries(conteo)
    .map(([valor, cantidad]) => [cantidad, Number(valor)])
    .sort((a, b) => b[0] - a[0] || b[1] - a[1]);

  const rueda = valores.join(",") === "2,3,4,5,14";
  const escalera = new Set(valores).size === 5 &&
    (valores[4] - valores[0] === 4 || rueda);
  const color = mano.every(carta => carta.palo === mano[0].palo);
  const altoEscalera = rueda ? 5 : valores[4];

  if (escalera && color) return [8, altoEscalera];
  if (grupos[0][0] === 4) return [7, ...grupos.map(grupo => grupo[1])];
  if (grupos[0][0] === 3 && grupos[1][0] === 2) return [6, ...grupos.map(grupo => grupo[1])];
  if (color) return [5, ...valoresAltos];
  if (escalera) return [4, altoEscalera];
  if (grupos[0][0] === 3) return [3, ...grupos.map(grupo => grupo[1])];
  if (grupos[0][0] === 2 && grupos[1][0] === 2) return [2, ...grupos.map(grupo => grupo[1])];
  if (grupos[0][0] === 2) return [1, ...grupos.map(grupo => grupo[1])];
  return [0, ...valoresAltos];
}

function compararManos(mano1, mano2) {
  const puntos1 = puntuarMano(mano1);
  const puntos2 = puntuarMano(mano2);

  for (let i = 0; i < puntos1.length; i++) {
    if (puntos1[i] > puntos2[i]) return 1;
    if (puntos1[i] < puntos2[i]) return -1;
  }
  return 0;
}

function actualizarFichas() {
  fichasJugador.textContent = fichas;
  fichasBanca.textContent = fichasDeBanca;
}

function repartirCartas() {
  if (fichas < apuesta || fichasDeBanca < apuesta) {
    mensaje.textContent = "Se acabaron las fichas. Empieza una partida nueva.";
    botonReiniciar.hidden = false;
    botonRepartir.hidden = true;
    return;
  }

  fichas -= apuesta;
  fichasDeBanca -= apuesta;
  actualizarFichas();

  baraja = crearBaraja();
  cartasJugador = baraja.splice(0, 5);
  cartasBanca = baraja.splice(0, 5);
  descartes.clear();
  turnoDeCambio = true;

  resultadoJugador.textContent = "";
  resultadoBanca.textContent = "";
  mensaje.textContent = "Elige hasta tres cartas para cambiar.";
  botonRepartir.hidden = true;
  botonCambiar.hidden = false;
  mostrarCartas();
}

function terminarMano() {
  // Cambia las cartas elegidas por cartas nuevas.
  for (const indice of [...descartes].sort((a, b) => b - a)) {
    cartasJugador[indice] = baraja.pop();
  }

  // La banca cambia tres cartas al azar.
  const indicesBanca = [];
  while (indicesBanca.length < 3) {
    const indice = Math.floor(Math.random() * 5);
    if (!indicesBanca.includes(indice)) indicesBanca.push(indice);
  }
  for (const indice of indicesBanca) {
    cartasBanca[indice] = baraja.pop();
  }

  turnoDeCambio = false;
  const puntosJugador = puntuarMano(cartasJugador);
  const puntosBanca = puntuarMano(cartasBanca);
  const ganador = compararManos(cartasJugador, cartasBanca);

  resultadoJugador.textContent = `Tu mano: ${nombresManos[puntosJugador[0]]}.`;
  resultadoBanca.textContent = `Banca: ${nombresManos[puntosBanca[0]]}.`;

  if (ganador > 0) {
    fichas += apuesta * 2;
    mensaje.textContent = "¡Has ganado!";
  } else if (ganador < 0) {
    fichasDeBanca += apuesta * 2;
    mensaje.textContent = "Gana la banca.";
  } else {
    fichas += apuesta;
    fichasDeBanca += apuesta;
    mensaje.textContent = "Empate: se devuelven las apuestas.";
  }

  actualizarFichas();
  mostrarCartas(true);
  botonCambiar.hidden = true;

  if (fichas >= apuesta && fichasDeBanca >= apuesta) {
    botonRepartir.hidden = false;
  } else {
    mensaje.textContent += " Partida terminada.";
    botonReiniciar.hidden = false;
  }
}

function reiniciarPartida() {
  fichas = 100;
  fichasDeBanca = 100;
  cartasJugador = [];
  cartasBanca = [];
  turnoDeCambio = false;
  resultadoJugador.textContent = "";
  resultadoBanca.textContent = "";
  jugador.replaceChildren();
  banca.textContent = "";
  mensaje.textContent = "Pulsa «Repartir» para empezar.";
  actualizarFichas();
  botonRepartir.hidden = false;
  botonCambiar.hidden = true;
  botonReiniciar.hidden = true;
}

botonRepartir.onclick = repartirCartas;
botonCambiar.onclick = terminarMano;
botonReiniciar.onclick = reiniciarPartida;
actualizarFichas();
