// Moneda que se muestra junto a los importes. Cámbiala si hace falta ("$", "€", "").
const MONEDA = "€";

// Pagos por juego: "pago" es lo que ganas por cada 1 apostado (35 = paga 35 a 1).
const JUEGOS = {
    "Ruleta": [
        { nombre: "Pleno (1 número)", pago: 35 },
        { nombre: "Caballo (2 números)", pago: 17 },
        { nombre: "Calle (3 números)", pago: 11 },
        { nombre: "Cuadro (4 números)", pago: 8 },
        { nombre: "Línea (6 números)", pago: 5 },
        { nombre: "Docena", pago: 2 },
        { nombre: "Columna", pago: 2 },
        { nombre: "Rojo / Negro", pago: 1 },
        { nombre: "Par / Impar", pago: 1 },
        { nombre: "Falta / Pasa (1-18 / 19-36)", pago: 1 }
    ],
    "Blackjack": [
        { nombre: "Victoria normal", pago: 1 },
        { nombre: "Blackjack (3 a 2)", pago: 1.5 },
        { nombre: "Seguro (2 a 1)", pago: 2 }
    ],
    "Bacarrá": [
        { nombre: "Jugador", pago: 1 },
        { nombre: "Banca (5% comisión)", pago: 0.95 },
        { nombre: "Empate", pago: 8 }
    ]
};

const selJuego = document.getElementById("juego");
const selApuesta = document.getElementById("tipoApuesta");
const inputImporte = document.getElementById("importe");
const pagoInfo = document.getElementById("pagoInfo");
const outGanancia = document.getElementById("ganancia");
const outTotal = document.getElementById("total");
const outPerdida = document.getElementById("perdida");

// Redondea a céntimos para evitar errores de coma flotante (0.1 + 0.2).
function redondear(n) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

function formatear(n) {
    return MONEDA + " " + n.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function calcularPago(importe, pago) {
    const ganancia = redondear(importe * pago);
    return {
        ganancia: ganancia,
        total: redondear(importe + ganancia),
        perdida: redondear(importe)
    };
}

function cargarJuegos() {
    selJuego.innerHTML = "";
    Object.keys(JUEGOS).forEach(function (juego) {
        selJuego.add(new Option(juego, juego));
    });
}

function cargarApuestas() {
    selApuesta.innerHTML = "";
    JUEGOS[selJuego.value].forEach(function (apuesta, i) {
        selApuesta.add(new Option(apuesta.nombre, i));
    });
}

function actualizar() {
    const apuesta = JUEGOS[selJuego.value][selApuesta.value];
    const importe = parseFloat(inputImporte.value);
    const valido = Number.isFinite(importe) && importe > 0;

    pagoInfo.textContent = "Paga " + apuesta.pago.toLocaleString("es-ES") + " a 1";

    const r = valido ? calcularPago(importe, apuesta.pago) : { ganancia: 0, total: 0, perdida: 0 };
    outGanancia.textContent = formatear(r.ganancia);
    outTotal.textContent = formatear(r.total);
    outPerdida.textContent = "- " + formatear(r.perdida);
}

selJuego.addEventListener("change", function () {
    cargarApuestas();
    actualizar();
});
selApuesta.addEventListener("change", actualizar);
inputImporte.addEventListener("input", actualizar);

document.querySelectorAll(".ficha").forEach(function (boton) {
    boton.addEventListener("click", function () {
        const actual = parseFloat(inputImporte.value) || 0;
        inputImporte.value = redondear(actual + Number(boton.dataset.valor));
        actualizar();
    });
});

document.getElementById("limpiar").addEventListener("click", function () {
    inputImporte.value = "";
    actualizar();
});

cargarJuegos();
cargarApuestas();
actualizar();
