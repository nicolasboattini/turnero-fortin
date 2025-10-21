import express from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import escpos from "escpos";
import escposNetwork from "escpos-network";
import path from 'path';
import http from 'http';
import {Server as socketIo} from 'socket.io';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';

// Configuración impresora
const recepcion = "10.0.202.226"; //Recepcion
const caja = "192.168.0.205"; //PV67

const printerPort = 9100; //6001
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, 'data.json');
const DATA_PATH_BAR = path.join(__dirname, 'bar.json');
const PORT = 3300;

escpos.Network = escposNetwork;

// Configuración del servidor
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = new socketIo(server, {
  cors: {
    origin: "*", // Ajustar en producción
    methods: ["GET", "POST"]
  }
});


function getCurrentDate() {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}-${month}-${year}`; // Formato: DD-MM-YYYY
}

function generateSerial() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let serial = '';
  for (let i = 0; i < 4; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

function loadDataBar() {
  try {
    if (!fs.existsSync(DATA_PATH_BAR)) {
      // Si no existe el archivo, crearlo con la estructura inicial
      const initialData = {
        date: getCurrentDate(),
        B: -1,
        P: -1,
        "AGUA-SGAS": -1,
        "AGUA-CGAS": -1,
        "AGUA-SGAS-DESC": -1,
        "AGUA-CGAS-DESC": -1,
        "COCA": -1,
        "COCA-ZERO": -1,
        "PEPSI": -1,
        "PEPSI-ZERO": -1,
        "FANTA": -1,
        "MIRINDA": -1,
        "SPRITE": -1,
        "SEVEN-UP": -1,
        "SEVEN-UP-ZERO": -1,
        "PDLT-POMA": -1,
        "PDLT-TONICA": -1,
        "LEV-PERA": -1,
        "LEV-MANZANA": -1,
        "LEV-POMELO": -1,
        "LEV-NARANJA": -1,
        "LEV-LIMONADA": -1,
        "TE": -1,
        "CAFE": -1,
        "ENS-FRUTA": -1,
        "CHOCOTORTA": -1,
        "FLAN": -1,
        "MAMON-QUESO": -1
      };
      fs.writeFileSync(DATA_PATH_BAR, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const raw = fs.readFileSync(DATA_PATH_BAR, "utf8") || "{}";
    const data = JSON.parse(raw);
    const today = getCurrentDate();
    // Verificar si la fecha cambió
    if (!data.date || data.date !== today) {
      console.log(`📅 Nueva fecha detectada: ${today}. Reiniciando contadores...`);
      // Reiniciar todos los contadores
      data.date = today;
      data.B = -1;
      data.P = -1;
      data["AGUA-SGAS"] = -1;
      data["AGUA-CGAS"] = -1;
      data["AGUA-SGAS-DESC"] = -1;
      data["AGUA-CGAS-DESC"] = -1;
      data["COCA"] = -1;
      data["COCA-ZERO"] = -1;
      data["PEPSI"] = -1;
      data["PEPSI-ZERO"] = -1;
      data["FANTA"] = -1;
      data["MIRINDA"] = -1;
      data["SPRITE"] = -1;
      data["SEVEN-UP"] = -1;
      data["SEVEN-UP-ZERO"] = -1;
      data["PDLT-POMA"] = -1;
      data["PDLT-TONICA"] = -1;
      data["LEV-PERA"] = -1;
      data["LEV-MANZANA"] = -1;
      data["LEV-POMELO"] = -1;
      data["LEV-NARANJA"] = -1;
      data["LEV-LIMONADA"] = -1;
      data["TE"] = -1;
      data["CAFE"] = -1;
      data["ENS-FRUTA"] = -1;
      data["CHOCOTORTA"] = -1;
      data["FLAN"] = -1;
      data["MAMON-QUESO"] = -1;
      // Guardar los cambios
      saveDataBar(data);
      console.log("✅ Contadores reiniciados para el nuevo día");
    }
    return data;
  } catch (error) {
    console.error("⚠️ Error leyendo data.json:", error);
    // En caso de error, retornar estructura inicial
    return {
      date: getCurrentDate(),
      B: -1,
      P: -1,
      "AGUA-SGAS": -1,
      "AGUA-CGAS": -1,
      "AGUA-SGAS-DESC": -1,
      "AGUA-CGAS-DESC": -1,
      "COCA": -1,
      "COCA-ZERO": -1,
      "PEPSI": -1,
      "PEPSI-ZERO": -1,
      "FANTA": -1,
      "MIRINDA": -1,
      "SPRITE": -1,
      "SEVEN-UP": -1,
      "SEVEN-UP-ZERO": -1,
      "PDLT-POMA": -1,
      "PDLT-TONICA": -1,
      "LEV-PERA": -1,
      "LEV-MANZANA": -1,
      "LEV-POMELO": -1,
      "LEV-NARANJA": -1,
      "LEV-LIMONADA": -1,
      "TE": -1,
      "CAFE": -1,
      "ENS-FRUTA": -1,
      "CHOCOTORTA": -1,
      "FLAN": -1,
      "MAMON-QUESO": -1
    };
  }
}

// Función segura para leer JSON
function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      // Si no existe el archivo, crearlo con la estructura inicial
      const initialData = {
        date: getCurrentDate(),
        serial: generateSerial(),
        B: -1,
        P: -1,
        PL: -1,
        PA: -1,
        BL: -1,
        BU: -1,
        J: -1,
        BF: -1,
        AT: -1,
        BT: -1,
        PT: -1
      };
      fs.writeFileSync(DATA_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const raw = fs.readFileSync(DATA_PATH, "utf8") || "{}";
    const data = JSON.parse(raw);
    const bar = loadDataBar();
    const today = getCurrentDate();
    // Verificar si la fecha cambió
    if (!data.date || data.date !== today) {
      console.log(`📅 Nueva fecha detectada: ${today}. Reiniciando contadores...`);
      // Reiniciar todos los contadores
      data.date = today;
      data.serial = generateSerial();
      data.B = -1;
      data.P = -1;
      data.PL = -1;
      data.PA = -1;
      data.BL = -1;
      data.BU = -1;
      data.J = -1;
      data.BF = -1;
      data.AT = -1;
      data.BT = -1;
      data.PT = -1;
      // Guardar los cambios
      saveData(data);
      bar["serial"] = data.serial;
      bar["date"] = data.date;
      saveDataBar(bar);
      console.log("✅ Contadores reiniciados para el nuevo día");
    }
    return data;
  } catch (error) {
    console.error("⚠️ Error leyendo data.json:", error);
    // En caso de error, retornar estructura inicial
    return {
      date: getCurrentDate(),
      serial: generateSerial(),
      B: -1,
      P: -1,
      PL: -1,
      PA: -1,
      BL: -1,
      BU: -1,
      J: -1,
      BF: -1,
      AT: -1,
      BT: -1,
      PT: -1
    };
  }
}



// Función para guardar el JSON actualizado
function saveData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function saveDataBar(data) {
  fs.writeFileSync(DATA_PATH_BAR, JSON.stringify(data, null, 2));
}

// Función general para imprimir un ticket
async function printTicket(category, number, ip_printer) {
  const now = new Date();
  const formattedDate = now.toLocaleString("es-AR");
  const serial = loadData().serial;

  await new Promise((resolve, reject) => {
    const device = new escpos.Network(ip_printer, printerPort);
    const printer = new escpos.Printer(device);

    device.open((err) => {
      if (err) return reject(err);

      printer
        .align("CT")
        .style("B")
        .size(2, 2)
        .text("FORTIN")
        .text("CATARATAS")
        .size(1, 1)
        .text("---------------------")
        .feed(1)
        .size(4, 4)
        .text(`${number}`)
        .feed(1)
        .size(1, 1)
        .text(`${category.toUpperCase()}`)
        .size(1, 1)
        .text("---------------------")
        .style("NORMAL")
        .text(`${formattedDate}`)
        .feed(1)
        .barcode(serial, 'CODE39', {
          width: 2,
          height: 60
        })
        .feed(3)
        .cut()
        .close();

      resolve();
    });
  });

  console.log(`✅ Ticket impreso: ${category} -> ${number}`);
  return { category, number, date: formattedDate };
}
function nextNumberGeneric(prefix) {
  const data = loadData();
  if (!data[prefix]) data[prefix] = 0;
  data[prefix]++;
  saveData(data);
  if (prefix === "B" || prefix === "P") {
    const dataBar = loadDataBar();
    if (!dataBar[prefix]) dataBar[prefix] = 0;
    dataBar[prefix]++;
    saveDataBar(dataBar);
  }
  return `${prefix}${String(data[prefix]).padStart(2, "0")}`;
}

// Buffet Pagante
async function handleFortinA() {
  nextNumberGeneric("BU");
  nextNumberGeneric("P");
  nextNumberGeneric("B");
  // const tickets = [];
  // tickets.push(await printTicket("BUFFET FORTIN", nextNumberGeneric("BU"), caja));
  // tickets.push(await printTicket("BEBIDA FORTIN", nextNumberGeneric("B"), caja));
  // tickets.push(await printTicket("POSTRE FORTIN", nextNumberGeneric("P"), caja));
  // return tickets;
}
//Buffet Liberado
async function handleFortinB() {
  nextNumberGeneric("BL"); // Conteo Buffet Liberado, no imprime ticket
  nextNumberGeneric("P");
  nextNumberGeneric("B");
  // const tickets = [];
  // tickets.push(await printTicket("BEBIDA FORTIN", nextNumberGeneric("B"), recepcion));
  // tickets.push(await printTicket("POSTRE FORTIN", nextNumberGeneric("P"), recepcion));
  // return tickets;
}

//Parrilla Pagante
async function handleFortinC() {
  nextNumberGeneric("PA");
  nextNumberGeneric("B");
  nextNumberGeneric("P");
  // const tickets = [];
  // tickets.push(await printTicket("PARRILLA PAGANTE", nextNumberGeneric("PA"), caja));
  // tickets.push(await printTicket("BEBIDA FORTIN", nextNumberGeneric("B"), caja));
  // tickets.push(await printTicket("POSTRE FORTIN", nextNumberGeneric("P"), caja));
  // return tickets;
}

//Parrilla Liberado
async function handleFortinD() {
  nextNumberGeneric("PL");
  nextNumberGeneric("B");
  nextNumberGeneric("P");
  // const tickets = [];
  // tickets.push(await printTicket("PARRILLA LIBERADO", nextNumberGeneric("PL"), recepcion));
  // tickets.push(await printTicket("BEBIDA FORTIN", nextNumberGeneric("B"), recepcion));
  // tickets.push(await printTicket("POSTRE FORTIN", nextNumberGeneric("P"), recepcion));
  // return tickets;
}

//Tripulante, para choferes/tc/guias
async function handleTripulante() {
  nextNumberGeneric("AT");
  nextNumberGeneric("BT");
  nextNumberGeneric("PT");
  // const tickets = [];
  // tickets.push(await printTicket("ALMUERZO TRIPULANTE", nextNumberGeneric("AT"), recepcion));
  // tickets.push(await printTicket("BEBIDA TRIPULANTE", nextNumberGeneric("BT"), recepcion));
  // tickets.push(await printTicket("POSTRE TRIPULANTE", nextNumberGeneric("PT"), recepcion));
  // return tickets;
}

// Botón JAGUAR → imprime un ticket normal
async function handleJaguar() {
  const number = nextNumberGeneric("J");
  //return [await printTicket("JAGUAR", number, recepcion)];
}

// Botón BAR → imprime un ticket con prefijo FB
async function handleBar() {
  const number = nextNumberGeneric("BF");
  //return [await printTicket("BAR FORTIN", number, recepcion)];
}

app.get("/print-button/:button", async (req, res) => {
  const { button } = req.params;
  try {
    let tickets;
    switch(button.toUpperCase()) {
      case "FORTINA":
        tickets = await handleFortinA();
        break;
      case "FORTINB":
        tickets = await handleFortinB();
        break;
      case "FORTINC":
        tickets = await handleFortinC();
        break;
      case "FORTIND":
        tickets = await handleFortinD();
        break;
      case "TRIPULANTE":
        tickets = await handleTripulante();
        break;      
      case "JAGUAR":
        tickets = await handleJaguar();
        break;
      case "BAR":
        tickets = await handleBar();
        break;
      default:
        return res.status(400).json({ success: false, error: "Botón desconocido" });
    }
    res.json({ success: true, tickets });
  } catch(e) {
    console.error("❌ Error al imprimir:", e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== WEBSOCKETS ====================

// Contador de clientes conectados
let connectedClients = {
  recuento: 0,
  barra: 0
};

io.on('connection', (socket) => {
  console.log(' ✓ Nuevo cliente conectado');

  socket.on('joinRoom', (room) => {
    if (room === 'recuento' || room === 'barra') {
      socket.join(room);
      connectedClients[room]++;
      console.log(`✓ Cliente unido a la sala ${room}. Total en ${room}: ${connectedClients[room]}`);

      const currentData = room === 'recuento' ? loadData() : loadDataBar();
      if (currentData) {
        socket.emit('dataUpdate', currentData);
      }
    }
  });
  
  socket.on('disconnect', () => {
    if (socket.rooms.has('recuento')) {
      connectedClients['recuento']--;
      console.log(`🛑 Cliente desconectado de la sala recuento. Total en recuento: ${connectedClients['recuento']}`);
    } else if (socket.rooms.has('barra')) {
      connectedClients['barra']--;
      console.log(`🛑 Cliente desconectado de la sala barra. Total en barra: ${connectedClients['barra']}`);
    }
  });
});

// ==================== CHOKIDAR FILE WATCHER ====================

const watcherRecuento = chokidar.watch(DATA_PATH, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 200,  // Esperar 200ms de estabilidad
    pollInterval: 100         // Checkear cada 100ms
  }
});

watcherRecuento.on('change', (filePath) => {
  console.log(`📄 Archivo modificado: ${filePath}`);
  
  const newData = loadData();
  if (newData) {
    // Emitir a TODOS los clientes conectados
    io.to('recuento').emit('dataUpdate', newData);
    console.log(`📡 Datos actualizados enviados a ${connectedClients['recuento']} cliente(s) en recuento`);
  }
});

watcherRecuento.on('error', (error) => {
  console.error('❌ Error en file watcher:', error);
});

const watcherBarra = chokidar.watch(DATA_PATH_BAR, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 200,
    pollInterval: 100
  }
});

watcherBarra.on('change', (filePath) => {
  console.log(`📄 Archivo modificado (barra): ${filePath}`);
  
  const newData = loadDataBar();
  if (newData) {
    // Emitir solo a los clientes de la sala "barra"
    io.to('barra').emit('dataUpdate', newData);
    console.log(`📡 Datos de barra enviados a ${connectedClients.barra} cliente(s)`);
  }
});

watcherBarra.on('error', (error) => {
  console.error('❌ Error en file watcher (barra):', error);
});

// Manejo graceful de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  watcherRecuento.close();
  watcherBarra.close();
  server.close(() => {
    console.log('✓ Servidor cerrado');
    process.exit(0);
  });
});



// Servir la interfaz HTML
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Turnero Fortín Cataratas</title>
      <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="shortcut icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-title" content="Turnero" />
      <link rel="manifest" href="/site.webmanifest" />
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          background: linear-gradient(135deg, #fef8df 0%, #fef8df 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .container {
          background: white;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          padding: 40px;
          max-width: 600px;
          width: 100%;
          text-align: center;
        }
        
        .logo-container {
          margin-bottom: 30px;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .logo-container img {
          max-width: 100%;
          max-height: 120px;
          object-fit: contain;
        }
        
        h1 {
          color: #333;
          margin-bottom: 40px;
          font-size: clamp(24px, 5vw, 32px);
        }
        
        .button-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 30px;
        }
        
        button {
          padding: 25px 40px;
          font-size: clamp(18px, 4vw, 24px);
          font-weight: bold;
          cursor: pointer;
          border-radius: 12px;
          background-color: #7D003E;
          color: white;
          border: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(125, 0, 62, 0.3);
        }
        
        button:hover {
          background-color: #97004c;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(125, 0, 62, 0.4);
        }
          
        .recuento-btn:hover {
          background-color: #97004c;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(125, 0, 62, 0.4);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        #status {
          margin-top: 20px;
          font-size: clamp(16px, 3vw, 20px);
          color: #555;
          min-height: 30px;
        }
        
        /* Modal */
        .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          animation: fadeIn 0.3s ease;
        }
        
        .modal.active {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-content {
          background-color: white;
          padding: 40px;
          border-radius: 20px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease;
        }
        
        .modal-content h2 {
          color: #333;
          margin-bottom: 30px;
          font-size: clamp(20px, 4vw, 26px);
        }
        
        .modal-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        
        .modal-buttons button {
          padding: 20px 30px;
          font-size: clamp(16px, 3vw, 20px);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Responsive para tablets */
        @media (min-width: 768px) {
          .button-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
          }
          
          .button-grid button:first-child {
            grid-column: 1 / -1;
          }

          .button-grid button:last-child {
            grid-column: 1 / -1;
          }

        }
        
        /* Responsive para desktop */
        @media (min-width: 1024px) {
          .container {
            padding: 50px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo-container">
          <!-- Aquí va tu logo -->
          <img src="/logo.png" alt="Logo Fortín Cataratas" id="logo">
        </div>
        
        <h1>Turnero Fortín Cataratas</h1>
        
        <div class="button-grid">
          <button onclick="openModal()">FORTÍN</button>
          <button onclick="print('JAGUAR')">JAGUAR</button>
          <button onclick="print('BAR')">BAR</button>
          <button onclick="window.location.href='/recuento'" class="recuento-btn">RECUENTO</button>
        </div>
        
        <div id="status"></div>
      </div>
      
      <!-- Modal -->
      <div id="fortinModal" class="modal" onclick="closeModalOnOutsideClick(event)">
        <div class="modal-content">
          <h2>Seleccione una opción</h2>
          <div class="modal-buttons">
            <button onclick="handleModalAction('BUFFET_LIBERADO', 'FORTINB')">BUFFET LIBERADO</button>
            <button onclick="handleModalAction('PARRILLA_LIBERADO', 'FORTIND')">PARRILLA LIBERADO</button>
            <button onclick="handleModalAction('TRIPULANTE', 'TRIPULANTE')">TRIPULANTE</button>
            <button onclick="handleModalAction('BUFFET_PAGANTE', 'FORTINA')">BUFFET PAGANTE CAJA</button>
            <button onclick="handleModalAction('PARRILLA_PAGANTE', 'FORTINC')">PARRILLA PAGANTE CAJA</button>
          </div>
        </div>
      </div>
      
      <script>
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
      </script>
    </body>
    </html>
  `);
});

app.get("/recuento", async (req, res) => {
  try {
    // Leer el archivo data.json para cargar estado inicial
    const data = loadData();
    
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuento de Turnos</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #fef8df 0%, #fef8df 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 700px;
            width: 100%;
          }
          
          .logo-container {
            margin-bottom: 30px;
            min-height: 120px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          
          .logo-container img {
            max-width: 100%;
            max-height: 120px;
            object-fit: contain;
          }
          
          h1 {
            color: #333;
            margin-bottom: 40px;
            font-size: clamp(24px, 5vw, 32px);
            text-align: center;
          }

          /* Indicador de conexión */
          .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: white;
            padding: 10px 15px;
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
          }

          .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #22c55e;
            animation: pulse 2s infinite;
          }

          .status-dot.disconnected {
            background: #ef4444;
            animation: none;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .recuento-grid {
            display: grid;
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .recuento-item {
            background: linear-gradient(135deg, #fef8df 0%, #fef8df 100%);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: all 0.3s ease;
          }
          
          .recuento-item:hover {
            transform: translateY(-3px);
          }

          /* Animación de actualización */
          .recuento-item.updated {
            animation: flash 0.5s ease;
          }

          @keyframes flash {
            0%, 100% { 
              background: linear-gradient(135deg, #fef8df 0%, #fef8df 100%);
            }
            50% { 
              background: linear-gradient(135deg, #ffe5b4 0%, #78003cab 100%);
            }
          }
          
          .recuento-label {
            color: white;
            font-size: clamp(16px, 3vw, 20px);
            font-weight: bold;
          }
          
          .recuento-value {
            color: white;
            font-size: clamp(28px, 5vw, 42px);
            font-weight: bold;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 8px;
            min-width: 80px;
            text-align: center;
            transition: all 0.3s ease;
          }

          /* Animación del número */
          .recuento-value.counting {
            transform: scale(1.2);
            color: #78003cab;
          }
          
          .back-button {
            width: 100%;
            padding: 20px 40px;
            font-size: clamp(16px, 3vw, 20px);
            font-weight: bold;
            cursor: pointer;
            border-radius: 12px;
            background-color: #7D003E;
            color: white;
            border: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(125, 0, 62, 0.3);
          }
          
          .back-button:hover {
            background-color: #97004c;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(125, 0, 62, 0.4);
          }
          
          .back-button:active {
            transform: translateY(0);
          }
          
          @media (min-width: 768px) {
            .recuento-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (min-width: 768px) and (orientation: landscape) {
            .recuento-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          
          @media (min-width: 1024px) {
            .container {
              padding: 50px;
              max-width: 1000px;
            }
            
            .recuento-grid {
              grid-template-columns: repeat(3, 1fr);
            }
          }
        </style>
      </head>
      <body>
        <!-- Indicador de conexión -->
        <div class="connection-status">
          <div class="status-dot" id="statusDot"></div>
          <span id="statusText">En vivo</span>
        </div>

        <div class="container">
          <div class="logo-container">
            <img src="/logo.png" alt="Logo Fortín Cataratas" id="logo">
          </div>
          
          <h1>Recuento de Turnos</h1>

          <div style="text-align: center; margin-bottom: 20px;">
            <div style="color: #7D003E; font-size: 20px; font-weight: bold; margin-bottom: 10px;">
              📅 Fecha: <span id="fecha">${data.date || 'No disponible'}</span>
            </div>
            <div style="color: #7D003E; font-size: 20px; font-weight: bold;">
              🔐 Serial del día: <span id="serial">${data.serial || 'XXXX'}</span>
            </div>
          </div>
          
          <div class="recuento-grid">
            <div class="recuento-item" data-category="BL">
              <span class="recuento-label" style="color: #7D003E;">BUFFET LIBERADO</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="BL">${data.BL + 1}</span>
            </div>

            <div class="recuento-item" data-category="PL">
              <span class="recuento-label" style="color: #7D003E;">PARRILLA LIBERADO</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="PL">${data.PL + 1}</span>
            </div>
            
            <div class="recuento-item" data-category="BU">
              <span class="recuento-label" style="color: #7D003E;">BUFFET PAGANTE</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="BU">${data.BU + 1}</span>
            </div>
            
            <div class="recuento-item" data-category="PA">
              <span class="recuento-label" style="color: #7D003E;">PARRILLA PAGANTE</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="PA">${data.PA + 1}</span>
            </div>
            
            <div class="recuento-item" data-category="B">
              <span class="recuento-label" style="color: #7D003E;">BEBIDA FORTIN</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="B">${data.B + 1}</span>
            </div>
            
            <div class="recuento-item" data-category="P">
              <span class="recuento-label" style="color: #7D003E;">POSTRE FORTIN</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="P">${data.P + 1}</span>
            </div>

            <div class="recuento-item" data-category="J">
              <span class="recuento-label" style="color: #7D003E;">JAGUAR</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="J">${data.J + 1}</span>
            </div>
            
            <div class="recuento-item" data-category="BF">
              <span class="recuento-label" style="color: #7D003E;">BAR FORTÍN</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="BF">${data.BF + 1}</span>
            </div>

            <div class="recuento-item" data-category="AT">
              <span class="recuento-label" style="color: #7D003E;">ALMUERZO TRIPULANTE</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="AT">${data.AT + 1}</span>
            </div>

            <div class="recuento-item" data-category="BT">
              <span class="recuento-label" style="color: #7D003E;">BEBITA TRIPULANTE</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="BT">${data.BT + 1}</span>
            </div>

            <div class="recuento-item" data-category="PT">
              <span class="recuento-label" style="color: #7D003E;">POSTRE TRIPULANTE</span>
              <span class="recuento-value" style="color: #7D003E;" data-value="PT">${data.PT + 1}</span>
            </div>
          </div>

          
          <button class="back-button" onclick="window.location.href='/'">Volver al Turnero</button>
        </div>

        <!-- Socket.IO Client -->
        <script src="/socket.io/socket.io.js"></script>
        <script>
          const socket = io();
          
          const statusDot = document.getElementById('statusDot');
          const statusText = document.getElementById('statusText');
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

            // Categorías a actualizar
            const categories = ['BL', 'PL', 'BU', 'PA', 'B', 'P', 'J', 'BF', 'AT', 'BT', 'PT'];

            categories.forEach(cat => {
              const valueEl = document.querySelector(\`[data-value="\${cat}"]\`);
              const itemEl = document.querySelector(\`[data-category="\${cat}"]\`);
              
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

          // Sonido opcional cuando llega actualización (comentado por defecto)
          /*
          socket.on('dataUpdate', () => {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwPUKfk77RgGgU7k9nyw3onBSh+zPDTjDwJFmS68OuhUBELTKXh7bhlHAgzhM/y0YU1Bxtouu/nm08NE1Km4+mzXRkHOZHY8sR5KAUrhc7y2Yk3CBtrve/inU4ND1Cn5e+yXxoGPZPY8sFzJQYnfszwz4o8CRhnt/DqoE8RC02m4e24ZRsHNYPP8tGFNQcbabvv551ODA9RpuTos1waCD2T2fHBciQGKYLN8M2JPAUZY7jw66JREQ1NpuLsuGYaBzSBzvLShjYHHWu98OacTgwPUqfk6LJeGgdAldny');
            audio.play().catch(() => {});
          });
          */
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error al leer data.json:', error);
    res.status(500).send('Error al cargar los datos');
  }
});

app.get("/barra", async (req, res) => {
  try {
    // Leer el archivo barData.json
    const barData = loadDataBar();
    const data = loadData();
    
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Control de Barra</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
          }
          
          .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 30px;
            max-width: 1400px;
            margin: 0 auto;
          }
          
          .logo-container {
            margin-bottom: 20px;
            min-height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .logo-container img {
            max-width: 100%;
            max-height: 80px;
            object-fit: contain;
          }
          
          h1 {
            color: #333;
            margin-bottom: 30px;
            font-size: clamp(24px, 4vw, 32px);
            text-align: center;
          }

          /* Indicador de conexión */
          .connection-status {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
            background: white;
            padding: 10px 15px;
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
          }

          .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #22c55e;
            animation: pulse 2s infinite;
          }

          .status-dot.disconnected {
            background: #ef4444;
            animation: none;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          /* Contadores superiores */
          .header-counters {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }
          
          .counter-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          
          .counter-label {
            color: white;
            font-size: clamp(14px, 2vw, 16px);
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 10px;
          }
          
          .counter-value {
            color: white;
            font-size: clamp(48px, 8vw, 72px);
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
          }
          
          .counter-sublabel {
            color: rgba(255, 255, 255, 0.9);
            font-size: clamp(16px, 3vw, 20px);
            font-weight: bold;
            margin-top: 5px;
          }
          
          /* Secciones */
          .section {
            margin-bottom: 40px;
          }
          
          .section-title {
            color: #7D003E;
            font-size: clamp(22px, 4vw, 28px);
            font-weight: bold;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid #7D003E;
          }
          
          .items-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
          }
          
          /* Card de artículo */
          .item-card {
            background: #f8f9fa;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          
          .item-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
          }
          
          .item-name {
            color: #333;
            font-size: clamp(16px, 2.5vw, 18px);
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
            min-height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .item-controls {
            display: grid;
            grid-template-columns: 60px 1fr 60px 80px;
            gap: 10px;
            align-items: center;
          }
          
          .control-btn {
            background: #7D003E;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(125, 0, 62, 0.3);
          }
          
          .control-btn:hover {
            background: #97004c;
            transform: scale(1.05);
          }
          
          .control-btn:active {
            transform: scale(0.95);
          }
          
          .item-image {
            width: 100%;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          
          .item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .item-counter {
            background: #667eea;
            color: white;
            font-size: clamp(24px, 4vw, 32px);
            font-weight: bold;
            border-radius: 10px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          }
          
          /* Botón volver */
          .back-button {
            width: 100%;
            padding: 20px;
            margin-top: 30px;
            font-size: clamp(16px, 3vw, 20px);
            font-weight: bold;
            cursor: pointer;
            border-radius: 12px;
            background-color: #7D003E;
            color: white;
            border: none;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(125, 0, 62, 0.3);
          }
          
          .back-button:hover {
            background-color: #97004c;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(125, 0, 62, 0.4);
          }
          
          /* Responsive */
          @media (max-width: 768px) {
            .items-grid {
              grid-template-columns: 1fr;
            }
            
            .item-controls {
              grid-template-columns: 50px 1fr 50px 70px;
            }
          }
        </style>
      </head>
      <body>
        <!-- Indicador de conexión -->
        <div class="connection-status">
          <div class="status-dot" id="statusDot"></div>
          <span id="statusText">En vivo</span>
        </div>

        <div class="container">
          <div class="logo-container">
            <img src="/logo.png" alt="Logo Fortín Cataratas">
          </div>
          
          <h1>Control de Barra</h1>
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="color: #7D003E; font-size: 20px; font-weight: bold; margin-bottom: 10px;">
              📅 Fecha: <span id="fecha">${barData.date || 'No disponible'}</span>
            </div>
            <div style="color: #7D003E; font-size: 20px; font-weight: bold;">
              🔐 Serial del día: <span id="serial">${barData.serial || 'XXXX'}</span>
            </div>
          </div>
          
          <!-- Contadores superiores -->
          <div class="header-counters">
            <div class="counter-card">
              <div class="counter-label">Disponibles</div>
              <div id="bebidaCont" class="counter-value">${barData.B || 0}</div>
              <div class="counter-sublabel">BEBIDAS</div>
            </div>
            
            <div class="counter-card">
              <div class="counter-label">Disponibles</div>
              <div id="postresCont" class="counter-value">${barData.P || 0}</div>
              <div class="counter-sublabel">POSTRES</div>
            </div>
          </div>
          
          <!-- Sección Bebidas -->
          <div class="section">
            <h2 class="section-title">BEBIDAS</h2>
            <div class="items-grid" id="bebidas-grid">
              <!-- Ejemplo de un botón/card -->
              <div class="item-card">
                <div class="item-name">Coca Cola</div>
                <div class="item-controls">
                  <button class="control-btn" onclick="updateItem('COCA', -1, B)">−</button>
                  <div class="item-image">
                    <img src="/images/coca-cola.jpg" alt="Coca Cola" onerror="this.style.display='none'">
                  </div>
                  <button class="control-btn" onclick="updateItem('COCA', 1, B)">+</button>
                  <div class="item-counter" data-value="COCA">${barData["COCA"] || 0}</div>
                </div>
              </div>
              <!-- Aquí agregas los otros 20 botones de bebidas -->
              <div class="item-card">
                <div class="item-name">Pepsi</div>
                <div class="item-controls">
                  <button class="control-btn" onclick="updateItem('PEPSI', -1, B)">−</button>
                  <div class="item-image">
                    <img src="/images/pepsi.jpg" alt="Pepsi" onerror="this.style.display='none'">
                  </div>
                  <button class="control-btn" onclick="updateItem('PEPSI', 1, B)">+</button>
                  <div class="item-counter" data-value="PEPSI">${barData["PEPSI"] || 0}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Sección Postres -->
          <div class="section">
            <h2 class="section-title">POSTRES</h2>
            <div class="items-grid" id="postres-grid">
              <!-- Aquí agregas los 6 botones de postres con el mismo formato -->
            </div>
          </div>
          
          <button class="back-button" onclick="window.location.href='/'">Volver al Turnero</button>
        </div>
        
        <!-- Socket.IO Client -->
        <script src="/socket.io/socket.io.js"></script>
        <script>
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
              const valueEl = document.querySelector(\`[data-value="\${bebida}"]\`);
              if (valueEl) {
              console.log("Actualizando:", data[bebida], 'Elemento encontrado:', !!valueEl);
              }
              if (valueEl && data[bebida] !== undefined) {
                const newValue = data[bebida];
                valueEl.textContent = newValue;
              }
            });
            postres.forEach(postre => {
              const valuePo = document.querySelector(\`[data-value="\${postre}"]\`);
              if (valuePo && data[postre] !== undefined) {
                const newValue = data[postre];
                valuePo.textContent = newValue;
              }
            });
          }
          // Función genérica para actualizar items
          async function updateItem(item, cant, category) {
            try {
              const response = await fetch('/api/bar/update', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  item: itemKey,
                  delta: delta
                })
              });
              
              const data = await response.json();
              
              if (data.success) {
                // Actualizar el contador visual
                const counterElement = document.getElementById('counter-' + itemKey);
                if (counterElement) {
                  counterElement.textContent = data.newValue;
                }
                
                // Actualizar contadores superiores si es necesario
                // Esto dependerá de cómo manejes B y P en relación a los items individuales
              }
            } catch (error) {
              console.error('Error actualizando item:', error);
              alert('Error al actualizar el item');
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error al cargar barData.json:', error);
    res.status(500).send('Error al cargar los datos de la barra');
  }
});

// ==================== INICIAR SERVIDOR ====================

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🎫 Servidor Turnero Iniciado            ║
║   📡 Puerto: ${PORT}                         ║
║   🔄 WebSockets: Activo                   ║
║   👀 Observando: data.json y barData.json ║
╚═══════════════════════════════════════════╝
  `);
});
