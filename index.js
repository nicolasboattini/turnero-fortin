import express from "express";
import fs from "fs";
import fsPromises from "fs/promises";
import escpos from "escpos";
import escposNetwork from "escpos-network";
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración impresora
const recepcion = "10.0.202.226"; //Recepcion
const caja = "192.168.0.205"; //PV67

const printerPort = 9100; //6001
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

escpos.Network = escposNetwork;

// Configuración del servidor
const app = express();
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = 3300;

// Ruta del archivo JSON donde guardamos los contadores
const DATA_FILE = "./data.json";

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

// Función segura para leer JSON
function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
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
        BF: -1
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const raw = fs.readFileSync(DATA_FILE, "utf8") || "{}";
    const data = JSON.parse(raw);
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
      saveData(data);
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
      BF: -1
    };
  }
}

// Función para guardar el JSON actualizado
function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
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
  return `${prefix}${String(data[prefix]).padStart(2, "0")}`;
}

// Buffet Pagante
async function handleFortinA() {
  const tickets = [];
  tickets.push(await printTicket("BUFFET FORTIN", nextNumberGeneric("BU"), caja));
  tickets.push(await printTicket("BEBIDA FORTIN", nextNumberGeneric("B"), caja));
  tickets.push(await printTicket("POSTRE FORTIN", nextNumberGeneric("P"), caja));
  return tickets;
}
//Buffet Liberado
async function handleFortinB() {
  const trash = nextNumberGeneric("BL"); // ticket basura
  const tickets = [];
  tickets.push(await printTicket("BEBIDA FORTIN", nextNumberGeneric("B"), recepcion));
  tickets.push(await printTicket("POSTRE FORTIN", nextNumberGeneric("P"), recepcion));
  return tickets;
}

//Parrilla Pagante
async function handleFortinC() {
  const tickets = [];
  tickets.push(await printTicket("PARRILLA PAGANTE", nextNumberGeneric("PA"), caja));
  tickets.push(await printTicket("BEBIDA FORTIN", nextNumberGeneric("B"), caja));
  tickets.push(await printTicket("POSTRE FORTIN", nextNumberGeneric("P"), caja));
  return tickets;
}

//Parrilla Liberado
async function handleFortinD() {
  const tickets = [];
  tickets.push(await printTicket("PARRILLA LIBERADO", nextNumberGeneric("PL"), recepcion));
  tickets.push(await printTicket("BEBIDA FORTIN", nextNumberGeneric("B"), recepcion));
  tickets.push(await printTicket("POSTRE FORTIN", nextNumberGeneric("P"), recepcion));
  return tickets;
}

// Botón JAGUAR → imprime un ticket normal
async function handleJaguar() {
  const number = nextNumberGeneric("J");
  return [await printTicket("JAGUAR", number, recepcion)];
}

// Botón BAR → imprime un ticket con prefijo FB
async function handleBar() {
  const number = nextNumberGeneric("BF");
  return [await printTicket("BAR FORTIN", number, recepcion)];
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
            <button onclick="handleModalAction('BUFFET_PAGANTE', 'FORTINA')">BUFFET PAGANTE</button>
            <button onclick="handleModalAction('PARRILLA_PAGANTE', 'FORTINC')">PARRILLA PAGANTE</button>
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
    // Leer el archivo data.json
    const dataPath = path.join(__dirname, 'data.json');
    const fileContent = await fsPromises.readFile(dataPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
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
          
          .recuento-grid {
            display: grid;
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .recuento-item {
            background: linear-gradient(135deg, #fef8df 0%, #fef8df 100%);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px #6d633eff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: transform 0.3s ease;
          }
          
          .recuento-item:hover {
            transform: translateY(-3px);
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
          
          <h1>Recuento de Turnos</h1>

          <div style="text-align: center; margin-bottom: 20px;">
            <div style="color: #7D003E; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
              📅 Fecha: ${data.date || 'No disponible'}
            </div>
            <div style="color: #2c5282; font-size: 16px; font-weight: bold;">
              🔐 Serial del día: ${data.serial || 'XXXX'}
            </div>
          </div>
          
          <div class="recuento-grid">
            <div class="recuento-item">
              <span class="recuento-label" style="color: #7D003E;">BUFFET LIBERADO</span>
              <span class="recuento-value" style="color: #7D003E;">${data.BL + 1}</span>
            </div>

            <div class="recuento-item">
              <span class="recuento-label" style="color: #7D003E;">PARRILLA LIBERADO</span>
              <span class="recuento-value" style="color: #7D003E;">${data.PL + 1}</span>
            </div>
            
            <div class="recuento-item">
              <span class="recuento-label" style="color: #7D003E;">BUFFET PAGANTE</span>
              <span class="recuento-value" style="color: #7D003E;">${data.BU + 1}</span>
            </div>
            
            <div class="recuento-item">
              <span class="recuento-label" style="color: #7D003E;">PARRILLA PAGANTE</span>
              <span class="recuento-value" style="color: #7D003E;">${data.PA + 1}</span>
            </div>
            
            <div class="recuento-item">
              <span class="recuento-label" style="color: #7D003E;">BEBIDA FORTIN</span>
              <span class="recuento-value" style="color: #7D003E;">${data.B + 1}</span>
            </div>
            
            <div class="recuento-item">
              <span class="recuento-label" style="color: #7D003E;">POSTRE FORTIN</span>
              <span class="recuento-value" style="color: #7D003E;">${data.P + 1}</span>
            </div>

            <div class="recuento-item">
              <span class="recuento-label" style="color: #7D003E;">JAGUAR</span>
              <span class="recuento-value" style="color: #7D003E;">${data.J + 1}</span>
            </div>
            
            <div class="recuento-item">
              <span class="recuento-label" style="color: #7D003E;">BAR FORTÍN</span>
              <span class="recuento-value" style="color: #7D003E;">${data.BF + 1}</span>
            </div>
          </div>

          
          <button class="back-button" onclick="window.location.href='/'">Volver al Turnero</button>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error al leer data.json:', error);
    res.status(500).send('Error al cargar los datos');
  }
});

app.listen(PORT, () => {
  console.log(`🖨️ Servidor corriendo en http://localhost:${PORT}`);
});
