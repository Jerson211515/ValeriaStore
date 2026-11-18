/* ==========================================================
   CARRITO SERVICE — el carrito de compras
   ----------------------------------------------------------
   Responsabilidades:
   - Agregar, quitar y vaciar productos
   - Aplicar las reglas: color obligatorio, no vender agotados,
     máximo 20 unidades por producto
   - Calcular subtotal, envío y total
   - Guardar el carrito en el celular (localStorage)
   - Avisar a la interfaz cada vez que el carrito cambia
     (patrón "observador": la interfaz se suscribe)
   ========================================================== */

const CANTIDAD_MAXIMA = 20;
const CLAVE_CARRITO = "carrito-" + CONFIG.tienda.nombre;

let items = leerGuardado();
const suscriptores = new Set();


/* ---------- Persistencia ---------- */

function leerGuardado() {
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    return Array.isArray(guardado) ? guardado : [];
  } catch (error) {
    return [];
  }
}

function guardar() {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(items));
  } catch (error) {
    // Si el navegador no deja guardar, el carrito sigue funcionando
  }
}

// Guarda y avisa a todos los que estén escuchando
function notificar() {
  guardar();
  const copia = carritoService.obtenerItems();
  suscriptores.forEach((funcion) => funcion(copia));
}


export const carritoService = {
  CANTIDAD_MAXIMA,

  // La interfaz se suscribe para enterarse de los cambios
  suscribir(funcion) {
    suscriptores.add(funcion);
    funcion(this.obtenerItems());
    return () => suscriptores.delete(funcion);
  },

  // Devuelve una COPIA: nadie de afuera puede modificar el carrito directamente
  obtenerItems() {
    return items.map((item) => ({ ...item }));
  },

  agregar(producto, variante, cantidad) {
    if (producto.agotado) {
      throw new Error("Este producto está agotado");
    }
    if ((producto.variantes || []).length > 0 && !variante) {
      throw new Error("Elige un color primero");
    }

    // Mismo producto + mismo color = se suma la cantidad
    const clave = `${producto.id}|${variante || ""}`;
    const existente = items.find((item) => item.clave === clave);

    if (existente) {
      existente.cantidad = Math.min(CANTIDAD_MAXIMA, existente.cantidad + cantidad);
    } else {
      items.push({
        clave,
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        imagen: producto.imagen,
        variante: variante || null,
        cantidad: Math.min(CANTIDAD_MAXIMA, cantidad)
      });
    }
    notificar();
  },

  quitar(clave) {
    items = items.filter((item) => item.clave !== clave);
    notificar();
  },

  vaciar() {
    items = [];
    notificar();
  },

  contarUnidades() {
    return items.reduce((suma, item) => suma + item.cantidad, 0);
  },

  calcularTotales(entrega) {
    const subtotal  = items.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
    const envioFijo = typeof entrega?.costo === "number";
    const envio     = envioFijo ? entrega.costo : 0;
    return { subtotal, envio, envioFijo, total: subtotal + envio };
  },

  // Actualiza precios y quita lo que ya no existe o se agotó.
  // Devuelve cuántos productos se quitaron.
  sincronizar(productos) {
    const antes = items.length;
    items = items.filter((item) => {
      const producto = productos.find((p) => p.id === item.id);
      if (!producto || producto.agotado) return false;
      item.nombre = producto.nombre;
      item.precio = producto.precio;
      item.imagen = producto.imagen;
      return true;
    });
    notificar();
    return antes - items.length;
  }
};
