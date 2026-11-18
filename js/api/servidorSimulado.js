/* ==========================================================
   SERVIDOR SIMULADO — un backend "de mentira"
   ----------------------------------------------------------
   GitHub Pages solo publica archivos: no puede ejecutar un
   servidor. Este módulo IMITA a un backend real:

   1. Recibe una petición  →  método (GET/POST) + ruta + cuerpo
   2. Busca la RUTA que le corresponde
   3. Ejecuta su CONTROLADOR (la función que la resuelve)
   4. Responde con un código de estado HTTP y los datos

   - GET  lee los archivos JSON de la carpeta data/
   - POST guarda en localStorage (la "base de datos" del navegador)
   - Agrega una pequeña demora para imitar el viaje por internet

   Cuando exista un backend real, este archivo deja de usarse:
   solo se cambia CONFIG.api.modo a "real" en config.js.
   ========================================================== */

const CARPETA_DATOS = "data";
const CLAVE_PEDIDOS = "pedidos-" + CONFIG.tienda.nombre;


/* ---------- Herramientas internas ---------- */

const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

// Toda respuesta tiene la misma forma: { estado, datos }
const responder = (estado, datos) => ({ estado, datos });

// Lee un archivo de data/ (como si consultara una tabla de base de datos)
async function leerTabla(archivo) {
  const respuesta = await fetch(`${CARPETA_DATOS}/${archivo}`, { cache: "no-cache" });
  if (!respuesta.ok) throw new Error(`No se encontró ${CARPETA_DATOS}/${archivo}`);
  return respuesta.json();
}

// Código corto y legible para el pedido: VS-1117-K4P9
function generarCodigoPedido() {
  const hoy = new Date();
  const fecha = String(hoy.getMonth() + 1).padStart(2, "0") + String(hoy.getDate()).padStart(2, "0");
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // sin O, 0, I, 1 para no confundir
  let azar = "";
  for (let i = 0; i < 4; i++) azar += letras[Math.floor(Math.random() * letras.length)];
  const prefijo = CONFIG.tienda.nombre.replace(/[^A-Z]/g, "").slice(0, 2) || "PD";
  return `${prefijo}-${fecha}-${azar}`;
}

function guardarPedido(pedido) {
  try {
    const pedidos = JSON.parse(localStorage.getItem(CLAVE_PEDIDOS)) || [];
    pedidos.push(pedido);
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
  } catch (error) {
    // Si el navegador no deja guardar, el pedido igual se confirma
  }
}


/* ==========================================================
   CONTROLADORES: una función por cada ruta
   Reciben (parametros, cuerpo) y devuelven responder(estado, datos)
   ========================================================== */

// GET /productos
async function listarProductos() {
  const productos = await leerTabla("productos.json");
  return responder(200, productos);
}

// GET /productos/:id
async function obtenerProducto({ id }) {
  const productos = await leerTabla("productos.json");
  const producto = productos.find((p) => p.id === id);
  if (!producto) return responder(404, { mensaje: "Ese producto ya no está disponible." });
  return responder(200, producto);
}

// GET /categorias
async function listarCategorias() {
  const categorias = await leerTabla("categorias.json");
  return responder(200, categorias);
}

// POST /pedidos
// El servidor NO confía en los precios que manda el navegador:
// los vuelve a buscar en el catálogo y calcula el total él mismo.
async function registrarPedido(_parametros, cuerpo) {
  if (!cuerpo || !Array.isArray(cuerpo.items) || cuerpo.items.length === 0) {
    return responder(400, { mensaje: "El pedido no tiene productos." });
  }
  if (!cuerpo.cliente || !cuerpo.cliente.nombre) {
    return responder(400, { mensaje: "Falta el nombre del cliente." });
  }

  const entrega = CONFIG.entrega.find((e) => e.id === cuerpo.entrega?.id);
  if (!entrega) return responder(400, { mensaje: "La forma de entrega no es válida." });

  const catalogo = await leerTabla("productos.json");
  const items = [];

  for (const pedido of cuerpo.items) {
    const producto = catalogo.find((p) => p.id === pedido.id);
    if (!producto) {
      return responder(404, { mensaje: "Uno de los productos ya no está disponible." });
    }
    if (producto.agotado) {
      return responder(409, { mensaje: `Lo sentimos, "${producto.nombre}" se acaba de agotar.` });
    }
    const cantidad = Math.max(1, Math.min(20, Number(pedido.cantidad) || 1));
    items.push({
      id: producto.id,
      nombre: producto.nombre,
      variante: pedido.variante || null,
      cantidad,
      precio: producto.precio,
      subtotal: producto.precio * cantidad
    });
  }

  const subtotal  = items.reduce((suma, item) => suma + item.subtotal, 0);
  const envioFijo = typeof entrega.costo === "number";
  const envio     = envioFijo ? entrega.costo : 0;

  const nuevoPedido = {
    codigo: generarCodigoPedido(),
    fecha: new Date().toISOString(),
    estado: "pendiente",
    cliente: { nombre: String(cuerpo.cliente.nombre).trim() },
    entrega: {
      id: entrega.id,
      nombre: entrega.nombre,
      pedirDato: entrega.pedirDato,
      dato: String(cuerpo.entrega.dato || "").trim()
    },
    items,
    subtotal,
    envio,
    envioFijo,
    total: subtotal + envio
  };

  guardarPedido(nuevoPedido);
  return responder(201, nuevoPedido);   // 201 = "creado"
}


/* ==========================================================
   TABLA DE RUTAS (lo que en un backend real sería el "router")
   ========================================================== */
const RUTAS = [
  { metodo: "GET",  ruta: "/productos",     controlador: listarProductos },
  { metodo: "GET",  ruta: "/productos/:id", controlador: obtenerProducto },
  { metodo: "GET",  ruta: "/categorias",    controlador: listarCategorias },
  { metodo: "POST", ruta: "/pedidos",       controlador: registrarPedido }
];

// Compara "/productos/:id" con "/productos/manta-felpa" → { id: "manta-felpa" }
function compararRuta(plantilla, ruta) {
  const partesPlantilla = plantilla.split("/");
  const partesRuta = ruta.split("/");
  if (partesPlantilla.length !== partesRuta.length) return null;

  const parametros = {};
  for (let i = 0; i < partesPlantilla.length; i++) {
    if (partesPlantilla[i].startsWith(":")) {
      parametros[partesPlantilla[i].slice(1)] = decodeURIComponent(partesRuta[i]);
    } else if (partesPlantilla[i] !== partesRuta[i]) {
      return null;
    }
  }
  return parametros;
}


/* ==========================================================
   PUNTO DE ENTRADA: lo único que este módulo expone
   ========================================================== */
export async function atenderPeticion(metodo, ruta, cuerpo = null) {
  await esperar(CONFIG.api.demoraSimulada ?? 400);

  // Simula que el cuerpo viaja como texto (igual que por internet)
  const cuerpoRecibido = cuerpo ? JSON.parse(JSON.stringify(cuerpo)) : null;

  for (const definicion of RUTAS) {
    if (definicion.metodo !== metodo) continue;
    const parametros = compararRuta(definicion.ruta, ruta);
    if (!parametros) continue;

    try {
      return await definicion.controlador(parametros, cuerpoRecibido);
    } catch (error) {
      console.error("[Servidor simulado]", error);
      return responder(500, { mensaje: error.message || "Error interno del servidor." });
    }
  }

  return responder(404, { mensaje: `No existe la ruta ${metodo} ${ruta}` });
}
