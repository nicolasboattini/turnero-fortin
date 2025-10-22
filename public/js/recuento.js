const socket = io();

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const bebidaCont = document.getElementById('bebidaCont');
const postresCont = document.getElementById('postresCont');
const fechaEl = document.getElementById('fecha');
const serialEl = document.getElementById('serial');

// Manejo de conexión
socket.on('connect', () => {
console.log('✓ Conectado al servidor en tiempo real');
statusDot.classList.remove('disconnected');
statusText.textContent = 'En vivo';
socket.emit('joinRoom', 'recuento');
});

socket.on('disconnect', () => {
console.log('✗ Desconectado del servidor');
statusDot.classList.add('disconnected');
statusText.textContent = 'Desconectado';
});

// Recibir actualizaciones de datos en tiempo real
socket.on('dataUpdate', (data) => {
console.log('📡 Actualización recibida:', data);
updateRecuento(data);
});

function updateRecuento(data) {
// Actualizar fecha y serial
if (data.date) fechaEl.textContent = data.date;
if (data.serial) serialEl.textContent = data.serial;
if (data.BBS) bebidaCont.textContent = data.BBS;
if (data.PPS) postresCont.textContent = data.PPS;

// Categorías a actualizar
const categories = ['BL', 'PL', 'BU', 'PA', 'B', 'P', 'J', 'BF', 'AT', 'BT', 'PT'];

categories.forEach(cat => {
    const valueEl = document.querySelector(`[data-value="${cat}"]`);
    const itemEl = document.querySelector(`[data-category="${cat}"]`);

    if (valueEl && data[cat] !== undefined) {
        const newValue = data[cat] + 1;
        const currentValue = parseInt(valueEl.textContent);

        // Solo animar si cambió
        if (newValue !== currentValue) {
            // Animar el número
            animateValue(valueEl, currentValue, newValue);
            // Flash en el item
            itemEl.classList.add('updated');
            setTimeout(() => itemEl.classList.remove('updated'), 500);
        }
    }

    });
}

function animateValue(element, start, end) {
const duration = 400;
const steps = 10;
const increment = (end - start) / steps;
let current = start;
let step = 0;

element.classList.add('counting');

const timer = setInterval(() => {
    current += increment;
    step++;
    element.textContent = Math.round(current);

    if (step >= steps) {
    element.textContent = end;
    element.classList.remove('counting');
    clearInterval(timer);
    }
}, duration / steps);
}