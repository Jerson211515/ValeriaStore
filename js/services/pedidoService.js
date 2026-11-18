/* ==========================================================
   PEDIDO SERVICE — registrar el pedido y enviarlo a WhatsApp
   ----------------------------------------------------------
   Responsabilidades:
   - Validar los datos del cliente
   - Registrar el pedido en la API (POST /pedidos)
   - Armar el mensaje y el enlace de WhatsApp con la
     respuesta del servidor (código, precios y total)
   ========================================================== */

import { apiCliente } from "../api/apiCliente.js";
import { formatearPrecio } from "../utils.js";

export const pedidoService = {

  obtenerEntregas() {
    return CONFIG.entrega;
  },

  obtenerEntrega(id) {
    return CONFIG.entrega.find((e) => e.id === id) || CONFIG.entrega[0];
  },

  // Devuelve los errores por campo: { nombre: "...", dato: "..." }
  validarCliente({ nombre, dato, entregaId }) {
    const errores = {};
    if (!nombre || nombre.trim().length < 3) {
      errores.nombre = "Escribe tu nombre (mínimo 3 letras).";
    }
    if (!dato || dato.trim().length < 3) {
      errores.dato = `Completa: ${this.obtenerEntrega(entregaId).pedirDato.toLowerCase()}.`;
    }
    return errores;
  },

  // POST /pedidos
  // Solo se envía id, color y cantidad: el precio lo pone el servidor
  async registrar({ nombre, dato, entregaId, items }) {
    return apiCliente.post("/pedidos", {
      cliente: { nombre: nombre.trim() },
      entrega: { id: entregaId, dato: dato.trim() },
      items: items.map(({ id, variante, cantidad }) => ({ id, variante, cantidad }))
    });
  },

  construirMensaje(pedido) {
    const lineas = pedido.items.map((item) =>
      `• ${item.cantidad} x ${item.nombre}` +
      (item.variante ? ` (${item.variante})` : "") +
      ` - ${formatearPrecio(item.subtotal)}`
    );

    return [
      CONFIG.whatsapp.saludo,
      `*Pedido N.° ${pedido.codigo}*`,
      "",
      ...lineas,
      "",
      pedido.envioFijo ? `Envío: ${formatearPrecio(pedido.envio)}` : null,
      `*Total: ${formatearPrecio(pedido.total)}*`,
      pedido.envioFijo ? null : "(Costo de envío por coordinar)",
      "",
      `Nombre: ${pedido.cliente.nombre}`,
      `Entrega: ${pedido.entrega.nombre}`,
      `${pedido.entrega.pedirDato}: ${pedido.entrega.dato}`
    ].filter((linea) => linea !== null).join("\n");
  },

  generarEnlaceWhatsApp(pedido) {
    const texto = encodeURIComponent(this.construirMensaje(pedido));
    return `https://wa.me/${CONFIG.whatsapp.numero}?text=${texto}`;
  }
};
