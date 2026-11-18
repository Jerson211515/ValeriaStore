/* ==========================================================
   MAIN.JS — el controlador de la tienda
   ----------------------------------------------------------
   Conecta las tres capas:

     INTERFAZ (vistas.js)  ⇄  SERVICIOS  ⇄  API (apiCliente)

   1. Escucha lo que hace el cliente (clics, búsquedas, formulario)
   2. Le pide el trabajo al servicio que corresponde
   3. Le pasa el resultado a las vistas para que lo dibujen
   ========================================================== */

import { productoService } from "./services/productoService.js";
import { carritoService }  from "./services/carritoService.js";
import { pedidoService }   from "./services/pedidoService.js";
import * as vista from "./ui/vistas.js";

const { $ } = vista;


/* ==========================================================
   ESTADO DE LA PANTALLA
   ========================================================== */
const estado = {
  productos: [],
  categorias: [],
  categoria: "todo",
  busqueda: "",
  productoAbierto: null,
  variante: null,
  cantidad: 1,
  entregaId: CONFIG.entrega[0].id,
  pedidoConfirmado: null
};

let modalProducto = null;   // bootstrap.Modal
let panelCarrito  = null;   // bootstrap.Offcanvas


/* ==========================================================
   1. CATÁLOGO: consumo de GET /productos y GET /categorias
   ========================================================== */
async function cargarCatalogo({ actualizar = false } = {}) {
  vista.mostrarCargando();
  try {
    estado.productos  = await productoService.listar({ actualizar });
    estado.categorias = await productoService.listarCategorias();

    const quitados = carritoService.sincronizar(estado.productos);
    if (quitados > 0) {
      vista.mostrarAviso("Actualizamos tu carrito: un producto se agotó", "error");
    }

    pintarCatalogo();
    return true;
  } catch (error) {
    console.error(error);
    vista.mostrarErrorCatalogo(error.message, () => cargarCatalogo({ actualizar: true }));
    return false;
  }
}

function pintarCatalogo() {
  vista.mostrarCategorias(estado.categorias, estado.categoria, elegirCategoria);
  const visibles = productoService.filtrar(estado.productos, estado);
  vista.mostrarProductos(visibles, abrirDetalle);
}

function elegirCategoria(id) {
  estado.categoria = id;
  pintarCatalogo();
}


/* ==========================================================
   2. DETALLE DEL PRODUCTO
   ========================================================== */
function abrirDetalle(producto) {
  estado.productoAbierto = producto;
  estado.variante = null;
  estado.cantidad = 1;

  vista.mostrarDetalle(producto, (variante) => { estado.variante = variante; });
  modalProducto.show();
  history.replaceState(null, "", "#" + producto.id);   // link para compartir
}

// Link compartido (.../#manta-felpa): consumo de GET /productos/:id
async function abrirDesdeEnlace() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  try {
    const producto = await productoService.obtenerPorId(id);
    abrirDetalle(producto);
  } catch (error) {
    history.replaceState(null, "", location.pathname + location.search);
    vista.mostrarAviso(error.message, "error");
  }
}

function cambiarCantidad(cambio) {
  estado.cantidad = Math.min(carritoService.CANTIDAD_MAXIMA, Math.max(1, estado.cantidad + cambio));
  vista.mostrarCantidad(estado.cantidad);
}

function agregarAlCarrito() {
  try {
    carritoService.agregar(estado.productoAbierto, estado.variante, estado.cantidad);
    modalProducto.hide();
    vista.mostrarAviso("✓ Agregado al carrito");
    vista.animarContador();
  } catch (error) {
    // Las reglas (color obligatorio, agotado) las decide el servicio
    vista.mostrarAviso(error.message, "error");
  }
}


/* ==========================================================
   3. CARRITO
   El servicio avisa cada vez que cambia y la vista se redibuja
   ========================================================== */
function alCambiarCarrito(items) {
  vista.mostrarCarrito(items, carritoService.contarUnidades(), (clave) => carritoService.quitar(clave));
  vista.mostrarTotales(carritoService.calcularTotales(pedidoService.obtenerEntrega(estado.entregaId)));
}

function elegirEntrega(id) {
  estado.entregaId = id;
  const entrega = pedidoService.obtenerEntrega(id);
  vista.mostrarDatoEntrega(entrega);
  vista.limpiarError("cliente-dato");
  vista.mostrarTotales(carritoService.calcularTotales(entrega));
}


/* ==========================================================
   4. PEDIDO: consumo de POST /pedidos
   ========================================================== */
async function confirmarPedido(evento) {
  evento.preventDefault();

  const datos = {
    nombre: $("cliente-nombre").value,
    dato: $("cliente-dato").value,
    entregaId: estado.entregaId,
    items: carritoService.obtenerItems()
  };
  if (datos.items.length === 0) return;

  const errores = pedidoService.validarCliente(datos);
  vista.mostrarErrores(errores);
  if (Object.keys(errores).length > 0) return;

  vista.botonConfirmarCargando(true);
  try {
    const pedido = await pedidoService.registrar(datos);
    estado.pedidoConfirmado = pedido;
    vista.mostrarConfirmacion(pedido, pedidoService.generarEnlaceWhatsApp(pedido));
  } catch (error) {
    vista.mostrarAviso(error.message, "error");
    // 404 o 409: el catálogo cambió → se vuelve a pedir
    if (error.estado === 404 || error.estado === 409) {
      await cargarCatalogo({ actualizar: true });
    }
  } finally {
    vista.botonConfirmarCargando(false);
  }
}

// El cliente tocó "Enviar por WhatsApp": el pedido terminó
function pedidoEnviado() {
  estado.pedidoConfirmado = null;
  carritoService.vaciar();
  $("carrito-formulario").reset();
  elegirEntrega(CONFIG.entrega[0].id);
  setTimeout(() => {
    vista.ocultarConfirmacion();
    panelCarrito.hide();
  }, 600);
}


/* ==========================================================
   5. EVENTOS
   ========================================================== */
function conectarEventos() {
  modalProducto = new bootstrap.Modal($("modal-producto"));
  panelCarrito  = bootstrap.Offcanvas.getOrCreateInstance($("carrito"));

  $("modal-producto").addEventListener("hidden.bs.modal", () => {
    history.replaceState(null, "", location.pathname + location.search);
  });

  // Si cierra el carrito sin enviar, vuelve a ver el formulario
  $("carrito").addEventListener("hidden.bs.offcanvas", () => {
    if (estado.pedidoConfirmado) vista.ocultarConfirmacion();
  });

  $("buscador").addEventListener("input", (e) => {
    estado.busqueda = e.target.value;
    pintarCatalogo();
  });

  $("btn-menos").addEventListener("click", () => cambiarCantidad(-1));
  $("btn-mas").addEventListener("click", () => cambiarCantidad(1));
  $("btn-agregar").addEventListener("click", agregarAlCarrito);

  $("carrito-formulario").addEventListener("submit", confirmarPedido);
  $("cliente-nombre").addEventListener("input", () => vista.limpiarError("cliente-nombre"));
  $("cliente-dato").addEventListener("input", () => vista.limpiarError("cliente-dato"));
  $("btn-enviar-whatsapp").addEventListener("click", pedidoEnviado);
  $("btn-volver-carrito").addEventListener("click", vista.ocultarConfirmacion);
}


/* ==========================================================
   6. ARRANQUE
   ========================================================== */
async function iniciar() {
  if (typeof bootstrap === "undefined") {
    console.error("No cargó Bootstrap. Revisa tu conexión a internet o el enlace del CDN en index.html.");
    return;
  }

  vista.aplicarMarca();
  vista.mostrarEntregas(pedidoService.obtenerEntregas(), elegirEntrega);
  elegirEntrega(estado.entregaId);
  conectarEventos();
  carritoService.suscribir(alCambiarCarrito);

  const cargo = await cargarCatalogo();
  if (cargo) abrirDesdeEnlace();
}

iniciar();
