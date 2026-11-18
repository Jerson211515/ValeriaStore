/* ==========================================================
   PRODUCTO SERVICE — todo lo relacionado al catálogo
   ----------------------------------------------------------
   Responsabilidades:
   - Pedir productos y categorías a la API
   - Guardar el catálogo en memoria (caché) para no pedirlo
     cada vez que el cliente filtra o busca
   - Filtrar y ordenar productos (reglas del negocio)

   No toca la pantalla: solo entrega datos.
   ========================================================== */

import { apiCliente } from "../api/apiCliente.js";
import { normalizar } from "../utils.js";

let cacheProductos = null;

export const productoService = {

  // GET /productos (usa la caché salvo que se pida actualizar)
  async listar({ actualizar = false } = {}) {
    if (!cacheProductos || actualizar) {
      cacheProductos = await apiCliente.get("/productos");
    }
    return cacheProductos;
  },

  // GET /productos/:id
  async obtenerPorId(id) {
    return apiCliente.get(`/productos/${encodeURIComponent(id)}`);
  },

  // GET /categorias — devuelve solo las que tienen productos
  async listarCategorias() {
    // Las dos peticiones viajan al mismo tiempo (en paralelo)
    const [categorias, productos] = await Promise.all([
      apiCliente.get("/categorias"),
      this.listar()
    ]);
    return categorias.filter((c) => productos.some((p) => p.categoria === c.id));
  },

  // Filtro local: categoría + búsqueda, con los agotados al final
  filtrar(productos, { categoria = "todo", busqueda = "" } = {}) {
    const texto = normalizar(busqueda.trim());
    return productos
      .filter((p) => categoria === "todo" || p.categoria === categoria)
      .filter((p) => normalizar(`${p.nombre} ${p.descripcion || ""}`).includes(texto))
      .sort((a, b) => Number(a.agotado) - Number(b.agotado));
  }
};
