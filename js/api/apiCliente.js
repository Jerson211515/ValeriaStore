/* ==========================================================
   API CLIENTE — el "mensajero" entre la tienda y el servidor
   ----------------------------------------------------------
   Es la ÚNICA pieza que sabe CÓMO se habla con el servidor.
   Los servicios solo le dicen: "tráeme /productos" o
   "envía este pedido a /pedidos", sin saber si del otro lado
   hay un servidor simulado o uno real en internet.

   Responsabilidades:
   - Enviar la petición (GET / POST)
   - Convertir los errores en un ErrorApi con mensaje claro
   - Registrar cada petición en la consola (F12) para depurar
   ========================================================== */

import { atenderPeticion } from "./servidorSimulado.js";

// Error propio de la API: guarda el código de estado HTTP
export class ErrorApi extends Error {
  constructor(mensaje, estado = 0) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;   // 0 = sin conexión, 404 = no existe, 409 = conflicto...
  }
}

function registrarEnConsola(metodo, ruta, estado, inicio) {
  if (!CONFIG.api.mostrarEnConsola) return;
  const ms = Math.round(performance.now() - inicio);
  const estilo = estado < 400 ? "color:#1D9E75" : "color:#E24B4A";
  console.info(`%c[API] ${metodo} ${ruta} → ${estado} (${ms} ms)`, estilo);
}

async function peticion(metodo, ruta, cuerpo = null) {
  const inicio = performance.now();
  let estado;
  let datos;

  try {
    if (CONFIG.api.modo === "real") {
      // Backend real: petición HTTP con fetch
      const respuesta = await fetch(CONFIG.api.urlBase + ruta, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined
      });
      estado = respuesta.status;
      datos = await respuesta.json().catch(() => null);
    } else {
      // Servidor simulado (GitHub Pages)
      ({ estado, datos } = await atenderPeticion(metodo, ruta, cuerpo));
    }
  } catch (error) {
    registrarEnConsola(metodo, ruta, 0, inicio);
    throw new ErrorApi("No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.", 0);
  }

  registrarEnConsola(metodo, ruta, estado, inicio);

  if (estado >= 400) {
    throw new ErrorApi(datos?.mensaje || `Error ${estado} del servidor.`, estado);
  }
  return datos;
}

export const apiCliente = {
  get:  (ruta)         => peticion("GET", ruta),
  post: (ruta, cuerpo) => peticion("POST", ruta, cuerpo)
};
