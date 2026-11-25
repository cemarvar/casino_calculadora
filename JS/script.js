/* Dados 7: apuestas a la suma de 2 dados */

let saldo = 1000;

// Lo que paga cada apuesta (1 = 1:1, 4 = 4:1)
const pagos = { menos7: 1, siete: 4, mas7: 1 };

function jugar() {
    const apuesta = document.getElementById("apuesta").value;
    const importe = Number(document.getElementById("importe").value);

    if (importe <= 0 || importe > saldo) {
        document.getElementById("mensaje").textContent = "Importe no válido";
        return;
    }

    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const suma = d1 + d2;

    let resultado = "siete";
    if (suma < 7) resultado = "menos7";
    if (suma > 7) resultado = "mas7";

    if (resultado === apuesta) {
        saldo += importe * pagos[apuesta];
        document.getElementById("mensaje").textContent = "¡Ganaste!";
    } else {
        saldo -= importe;
        document.getElementById("mensaje").textContent = "Perdiste";
    }

    document.getElementById("dados").textContent = `${d1} + ${d2} = ${suma}`;
    document.getElementById("saldo").textContent = saldo;
}

document.getElementById("tirar").addEventListener("click", jugar);
