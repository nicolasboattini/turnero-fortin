import chokidar from 'chokidar';
import escpos from "escpos";
import escposNetwork from "escpos-network";
import express from "express";
import fs from "fs";
import http from 'http';
import path from 'path';
import { Server as socketIo } from 'socket.io';
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
        serial: "XXXX",
        B: 0,
        P: 0,
        "AGUA-SGAS": 0,
        "AGUA-CGAS": 0,
        "AGUA-SGAS-DESC": 0,
        "AGUA-CGAS-DESC": 0,
        "COCA": 0,
        "COCA-ZERO": 0,
        "PEPSI": 0,
        "PEPSI-ZERO": 0,
        "FANTA": 0,
        "MIRINDA": 0,
        "SPRITE": 0,
        "SEVEN-UP": 0,
        "SEVEN-UP-ZERO": 0,
        "PDLT-POMA": 0,
        "PDLT-TONICA": 0,
        "LEV-PERA": 0,
        "LEV-MANZANA": 0,
        "LEV-POMELO": 0,
        "LEV-NARANJA": 0,
        "LEV-LIMONADA": 0,
        "TE": 0,
        "CAFE": 0,
        "ENS-FRUTA": 0,
        "CHOCOTORTA": 0,
        "FLAN": 0,
        "MAMON-QUESO": 0
      };
      fs.writeFileSync(DATA_PATH_BAR, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const raw = fs.readFileSync(DATA_PATH_BAR, "utf8") || "{}";
    const data = JSON.parse(raw);
    
    const today = getCurrentDate();
      if (!data.date || data.date !== today) {
      data.date = today;
      data.serial = "XXXX";
      data.B = 0;
      data.P = 0;
      data["AGUA-SGAS"] = 0;
      data["AGUA-CGAS"] = 0;
      data["AGUA-SGAS-DESC"] = 0;
      data["AGUA-CGAS-DESC"] = 0;
      data["COCA"] = 0;
      data["COCA-ZERO"] = 0;
      data["PEPSI"] = 0;
      data["PEPSI-ZERO"] = 0;
      data["FANTA"] = 0;
      data["MIRINDA"] = 0;
      data["SPRITE"] = 0;
      data["SEVEN-UP"] = 0;
      data["SEVEN-UP-ZERO"] = 0;
      data["PDLT-POMA"] = 0;
      data["PDLT-TONICA"] = 0;
      data["LEV-PERA"] = 0;
      data["LEV-MANZANA"] = 0;
      data["LEV-POMELO"] = 0;
      data["LEV-NARANJA"] = 0;
      data["LEV-LIMONADA"] = 0;
      data["TE"] = 0;
      data["CAFE"] = 0;
      data["ENS-FRUTA"] = 0;
      data["CHOCOTORTA"] = 0;
      data["FLAN"] = 0;
      data["MAMON-QUESO"] = 0;
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
      serial: "XXXX",
      B: 0,
      P: 0,
      "AGUA-SGAS": 0,
      "AGUA-CGAS": 0,
      "AGUA-SGAS-DESC": 0,
      "AGUA-CGAS-DESC": 0,
      "COCA": 0,
      "COCA-ZERO": 0,
      "PEPSI": 0,
      "PEPSI-ZERO": 0,
      "FANTA": 0,
      "MIRINDA": 0,
      "SPRITE": 0,
      "SEVEN-UP": 0,
      "SEVEN-UP-ZERO": 0,
      "PDLT-POMA": 0,
      "PDLT-TONICA": 0,
      "LEV-PERA": 0,
      "LEV-MANZANA": 0,
      "LEV-POMELO": 0,
      "LEV-NARANJA": 0,
      "LEV-LIMONADA": 0,
      "TE": 0,
      "CAFE": 0,
      "ENS-FRUTA": 0,
      "CHOCOTORTA": 0,
      "FLAN": 0,
      "MAMON-QUESO": 0
    };
  }
}

// Función segura para leer JSON
function loadData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      // Si no existe el archivo, crearlo con la estructura inicial
      const bar = loadDataBar();
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
        PT: -1,
        BBS: 0,
        PPS: 0
      };
      saveData(initialData);
      bar["serial"] = initialData.serial;
      bar["date"] = initialData.date;
      saveDataBar(bar);
      return initialData;
    }
    const raw = fs.readFileSync(DATA_PATH, "utf8") || "{}";
    const data = JSON.parse(raw);
    const today = getCurrentDate();
    // Verificar si la fecha cambió
    if (!data.date || data.date !== today) {
      console.log(`📅 Nueva fecha detectada: ${today}. Reiniciando contadores...`);
      const bar = loadDataBar();
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
      data.BBS = 0;
      data.PPS = 0;
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
      PT: -1,
      BBS: 0,
      PPS: 0
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
    data['BBS']++;
    data['PPS']++;
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
  
  // Variable para trackear la sala actual de este socket
  let currentRoom = null;

  socket.on('joinRoom', (room) => {
    if (room === 'recuento' || room === 'barra') {
      // Si ya estaba en una sala, salir primero
      if (currentRoom) {
        socket.leave(currentRoom);
        connectedClients[currentRoom]--;
        console.log(`⚠️ Cliente salió de ${currentRoom}. Total: ${connectedClients[currentRoom]}`);
      }
      
      // Unirse a la nueva sala
      socket.join(room);
      currentRoom = room; // Guardar la sala actual
      connectedClients[room]++;
      console.log(`✓ Cliente unido a la sala ${room}. Total en ${room}: ${connectedClients[room]}`);

      const currentData = room === 'recuento' ? loadData() : loadDataBar();
      if (currentData) {
        socket.emit('dataUpdate', currentData);
      }
    }
  });

  socket.on('disconnect', () => {
    // Solo decrementar si estaba en alguna sala
    if (currentRoom && (currentRoom === 'recuento' || currentRoom === 'barra')) {
      connectedClients[currentRoom] = Math.max(0, connectedClients[currentRoom] - 1);
      console.log(`🛑 Cliente desconectado de la sala ${currentRoom}. Total en ${currentRoom}: ${connectedClients[currentRoom]}`);
      currentRoom = null;
    }
  });
});

// ==================== CHOKIDAR FILE WATCHER ====================

const watcherRecuento = chokidar.watch(DATA_PATH, {
  persistent: true,
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 150,  // Esperar 200ms de estabilidad
    pollInterval: 75         // Checkear cada 100ms
  }
});

watcherRecuento.on('change', (filePath) => {
  console.log(`📄 Archivo modificado: ${filePath}`);
  
  const newData = loadData();
  const barData = loadDataBar();
  if (newData) {
    // Emitir a TODOS los clientes conectados
    io.to('recuento').emit('dataUpdate', newData);
    io.to('barra').emit('dataUpdate', barData);
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
    stabilityThreshold: 150,
    pollInterval: 75
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

app.get("/update-item/:category/:item/:amount", async (req, res) => {
  const { category, item} = req.params;
  const amount = parseInt(req.params.amount);
  try {
    const data = loadDataBar();
    const conteo = loadData();
    if (!data[item]) data[item] = 0;
    if (!data[category]) data[category] = 0;
      data[item] += amount;
      data[category] += -amount;
      saveDataBar(data);
      if (category === "B") {
        conteo['BBS'] += amount;
      } else if (category === "P") {
        conteo['PPS'] += amount;
      }
      saveData(conteo);
      res.json({ success: true, data });
  } catch (error) {
    console.error('Error al actualizar barra:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

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

//ruta para /recuento
app.get("/recuento", async (req, res) => {
  try {
    const data = loadData();
    
    // Leer el archivo HTML
    let html = fs.readFileSync(path.join(__dirname, 'public', 'recuento.html'), 'utf8');
    const placeholders = ['BL', 'PL', 'BU', 'PA', 'B', 'P', 'J', 'BF', 'AT', 'BT', 'PT'];
    // Reemplazar los placeholders con los datos
    placeholders.forEach(placeholder => {
      html = html.replace(`{{${placeholder}}}`, data[placeholder] + 1);
    });
    html = html.replace('{{date}}', data.date || 'No disponible');
    html = html.replace('{{serial}}', data.serial || 'XXXX');
    html = html.replace('{{BBS}}', data.BBS || 0);
    html = html.replace('{{PPS}}', data.PPS || 0);

    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error al cargar la página');
  }
});

app.get("/barra", async (req, res) => {
  try {
    const conteo = loadData();
    const data = loadDataBar();
    
    // Leer el archivo HTML
    let html = fs.readFileSync(path.join(__dirname, 'public', 'barra.html'), 'utf8');
    const placeholders = [ "B", "P", "AGUA-SGAS", "AGUA-CGAS", "AGUA-SGAS-DESC", "AGUA-CGAS-DESC", "COCA", "COCA-ZERO","PEPSI", "PEPSI-ZERO", "FANTA", "MIRINDA", "SPRITE", "SEVEN-UP", "SEVEN-UP-ZERO", "PDLT-POMA", "PDLT-TONICA", "LEV-PERA", "LEV-MANZANA", "LEV-POMELO", "LEV-NARANJA", "LEV-LIMONADA", "TE", "CAFE", "ENS-FRUTA", "CHOCOTORTA", "FLAN", "MAMON-QUESO" ];
    // Reemplazar los placeholders con los datos
    placeholders.forEach(placeholder => {
      html = html.replace(`{{${placeholder}}}`, data[placeholder] || 0);
    });

    html = html.replace('{{date}}', data.date || 'No disponible');
    html = html.replace('{{serial}}', data.serial || 'XXXX');
    
    res.send(html);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error al cargar la página');
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
