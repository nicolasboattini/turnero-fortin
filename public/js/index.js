function openModal() {
    document.getElementById('fortinModal').classList.add('active');
}

function closeModal() {
    document.getElementById('fortinModal').classList.remove('active');
}

function closeModalOnOutsideClick(event) {
    if (event.target.id === 'fortinModal') {
    closeModal();
    }
}

async function handleModalAction(action, button) {
    await print(button);
    console.log('Acción seleccionada:', action);
    closeModal();
}

async function print(button) {
    const res = await fetch('/print-button/' + button);
    const data = await res.json();
    console.log(data);
    document.getElementById('status').textContent = 'Turno impreso correctamente';
    setTimeout(() => {
    document.getElementById('status').textContent = '';
    }, 3000);
}