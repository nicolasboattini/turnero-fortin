const socket = io();

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const postresCounter = document.getElementById('postresCont');
const bebidasCounter = document.getElementById('bebidaCont');
const fechaEl = document.getElementById('fecha');
const serialEl = document.getElementById('serial');

// Manejo de conexión
socket.on('connect', () => {
console.log('✓ Conectado al servidor en tiempo real');
statusDot.classList.remove('disconnected');
statusText.textContent = 'En vivo';
socket.emit('joinRoom', 'barra');
});

socket.on('disconnect', () => {
console.log('✗ Desconectado del servidor');
statusDot.classList.add('disconnected');
statusText.textContent = 'Desconectado';
});

// Recibir actualizaciones de datos en tiempo real
socket.on('dataUpdate', (data) => {
console.log('📡 Actualización recibida:', data);
console.log('Datos de COCA:', data.COCA);
console.log('Datos de PEPSI:', data.PEPSI);
console.log('Todas las keys del objeto:', Object.keys(data));
updateBarra(data);
});

function updateBarra(data) {
// Actualizar fecha y serial
if (data.date) fechaEl.textContent = data.date; //OK
if (data.serial) serialEl.textContent = data.serial; //OK
//Actualizar contadores totales
if (bebidasCounter) bebidasCounter.textContent = data.B || 0; //OK
if (postresCounter) postresCounter.textContent = data.P || 0; //OK

// Actualizar contadores individuales de bebidas y postres por item
const bebidas = [ "AGUA-SGAS", "AGUA-CGAS", "COCA", "COCA-ZERO","PEPSI", "PEPSI-ZERO", "FANTA", "MIRINDA", "SPRITE", "SEVEN-UP", "SEVEN-UP-ZERO", "PDLT-POMA", "PDLT-TONICA", "LEV-PERA", "LEV-MANZANA", "LEV-POMELO", "LEV-NARANJA", "LEV-LIMONADA" ];
const postres = [ "TE", "CAFE", "ENS-FRUTA", "CHOCOTORTA", "FLAN", "MAMON-QUESO" ];
bebidas.forEach(bebida => {
    const valueEl = document.querySelector([`[data-value="${bebida}"]`]);
    if (valueEl) {
    console.log("Actualizando:", data[bebida], 'Elemento encontrado:', !!valueEl);
    }
    if (valueEl && data[bebida] !== undefined) {
    const newValue = data[bebida];
    valueEl.textContent = newValue;
    }
});
postres.forEach(postre => {
    const valuePo = document.querySelector([`[data-value="${postre}"]`]);
    if (valuePo && data[postre] !== undefined) {
    const newValue = data[postre];
    valuePo.textContent = newValue;
    }
});
}

async function updateItem(item, amount, category) {
    await update(item, amount, category);
}

async function update(item, amount, category) {

    const res = await fetch('/update-item/' + category + '/' + item + '/' + amount );
    const data = await res.json();
    console.log(data);
    // document.getElementById('status').textContent = 'Turno impreso correctamente';
    // setTimeout(() => {
    // document.getElementById('status').textContent = '';
    // }, 3000);
}