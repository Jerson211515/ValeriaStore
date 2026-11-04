/* ==========================================================
   SCRIPT.JS — La lógica de la tienda
   ----------------------------------------------------------
   Es el "vendedor": muestra los productos, atiende el carrito
   y lleva el pedido al WhatsApp del dueño.
   Lee los datos de config.js y de data/productos.json.
   Usa los componentes de Bootstrap 5 (Modal, Offcanvas y Toast).
   No hace falta modificar este archivo para cambiar de negocio.
   ========================================================== */


/* ==========================================================
   1. ESTADO DE LA TIENDA (lo que la tienda "recuerda")
   ========================================================== */
let productos       = [];       // lista cargada desde productos.json
let carrito         = [];       // productos que el cliente va agregando
let categoriaActual = "todo";   // categoría seleccionada
let productoAbierto = null;     // producto que se ve en la ventana de detalle
let varianteElegida = null;     // color elegido en la ventana de detalle
let cantidadElegida = 1;        // cantidad elegida en la ventana de detalle

const CANTIDAD_MAXIMA = 20;

// Componentes de Bootstrap (se crean al iniciar la tienda)
let ventanaProducto = null;   // bootstrap.Modal     → detalle del producto
let avisoFlotante   = null;   // bootstrap.Toast     → "Agregado al carrito"

// Atajo para no escribir document.getElementById cada vez
const $ = (id) => document.getElementById(id);

// Imagen de respaldo si una foto no existe o tiene mal el nombre
const IMAGEN_RESPALDO = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect width="100" height="100" fill="#F4E4EA"/>' +
  '<text x="50" y="60" font-size="32" text-anchor="middle">📦</text></svg>'
);


/* ==========================================================
   2. HERRAMIENTAS PEQUEÑAS (se usan en todo el archivo)
   ========================================================== */

// Crea un elemento HTML con clase y texto
function crear(etiqueta, clase = "", texto = "") {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto) elemento.textContent = texto;
  return elemento;
}

// Pone una imagen y, si falla, muestra la de respaldo
function ponerImagen(img, ruta, descripcion) {
  img.onerror = () => {
    img.onerror = null;
    img.src = IMAGEN_RESPALDO;
  };
  img.src = ruta;
  img.alt = descripcion;
}

function crearImagen(ruta, descripcion, clase) {
  const img = crear("img", clase);
  ponerImagen(img, ruta, descripcion);
  return img;
}

// 45 → "S/ 45.00"
function formatearPrecio(numero) {
  return `${CONFIG.tienda.moneda} ${Number(numero).toFixed(2)}`;
}

// Quita tildes y mayúsculas para que el buscador encuentre
// "bebe" aunque esté escrito "Bebé"
function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// ["Yape", "Plin"] → "Yape y Plin"
function unirLista(lista) {
  if (lista.length <= 1) return lista.join("");
  return lista.slice(0, -1).join(", ") + " y " + lista[lista.length - 1];
}

// Crea un ícono de Bootstrap Icons: icono("trash3") → <i class="bi bi-trash3">
function icono(nombre) {
  const i = crear("i", "bi bi-" + nombre);
  i.setAttribute("aria-hidden", "true");
  return i;
}

// Mensaje flotante que desaparece solo (Toast de Bootstrap)
function mostrarAviso(texto) {
  $("aviso-texto").textContent = texto;
  avisoFlotante.show();
}


/* ==========================================================
   3. APLICAR CONFIG.JS (nombre, logo, colores...)
   ========================================================== */
function aplicarConfig() {
  // Colores: reemplaza las variables de style.css
  for (const [nombre, valor] of Object.entries(CONFIG.colores)) {
    document.documentElement.style.setProperty("--" + nombre, valor);
  }

  // Textos e imágenes de la tienda
  $("tienda-nombre").textContent  = CONFIG.tienda.nombre;
  $("tienda-eslogan").textContent = CONFIG.tienda.eslogan;
  $("tienda-pagos").textContent   = unirLista(CONFIG.pagos);
  $("pie-nombre").textContent     = CONFIG.tienda.nombre;
  $("pie-ciudad").textContent     = CONFIG.tienda.ciudad;

  ponerImagen($("tienda-logo"),    CONFIG.tienda.logo,    "Logo de " + CONFIG.tienda.nombre);
  ponerImagen($("tienda-portada"), CONFIG.tienda.portada, "Portada de " + CONFIG.tienda.nombre);
}


/* ==========================================================
   4. CARGAR LOS PRODUCTOS
   ========================================================== */
async function cargarProductos() {
  try {
    const respuesta = await fetch("data/productos.json");
    if (!respuesta.ok) throw new Error("No se encontró data/productos.json");
    productos = await respuesta.json();
    return true;
  } catch (error) {
    console.error("Error al cargar productos:", error);
    const mensaje = $("sin-resultados");
    mensaje.textContent = "No pudimos cargar los productos. " +
      "Si estás probando en tu PC, abre la tienda con Live Server. " +
      "Si ya está publicada, revisa que data/productos.json no tenga comas de más.";
    mensaje.hidden = false;
    return false;
  }
}


/* ==========================================================
   5. CATEGORÍAS
   Solo muestra las que tienen al menos un producto
   ========================================================== */
function mostrarCategorias() {
  const contenedor = $("lista-categorias");
  contenedor.innerHTML = "";

  CONFIG.categorias.forEach((categoria) => {
    const tieneProductos = categoria.id === "todo" ||
      productos.some((p) => p.categoria === categoria.id);
    if (!tieneProductos) return;

    const boton = crear("button", "btn btn-sm rounded-pill categoria", categoria.nombre);
    boton.type = "button";
    if (categoria.id === categoriaActual) boton.classList.add("activa");

    boton.addEventListener("click", () => {
      categoriaActual = categoria.id;
      mostrarCategorias();
      mostrarProductos();
    });

    contenedor.appendChild(boton);
  });
}


/* ==========================================================
   6. CATÁLOGO (tarjetas de productos)
   ========================================================== */
function mostrarProductos() {
  const grilla = $("grilla-productos");
  const busqueda = normalizar($("buscador").value.trim());

  const visibles = productos
    .filter((p) => categoriaActual === "todo" || p.categoria === categoriaActual)
    .filter((p) => normalizar(p.nombre + " " + (p.descripcion || "")).includes(busqueda))
    // Los agotados van al final
    .sort((a, b) => Number(a.agotado) - Number(b.agotado));

  grilla.innerHTML = "";
  visibles.forEach((producto) => {
    // Cada tarjeta va dentro de una columna de la grilla de Bootstrap
    const columna = crear("div", "col");
    columna.appendChild(crearTarjeta(producto));
    grilla.appendChild(columna);
  });

  $("sin-resultados").hidden = visibles.length > 0;
}

function crearTarjeta(producto) {
  // Componente Card de Bootstrap; h-100 iguala la altura de todas
  const tarjeta = crear("button", "card tarjeta h-100");
  tarjeta.type = "button";
  if (producto.agotado) tarjeta.classList.add("agotado");

  const imagen = crearImagen(producto.imagen, producto.nombre, "card-img-top tarjeta-imagen");
  imagen.loading = "lazy";   // carga la foto solo cuando se acerca a la pantalla
  tarjeta.appendChild(imagen);

  if (producto.agotado) {
    tarjeta.appendChild(crear("span", "badge rounded-pill etiqueta-producto etiqueta-agotado", "Agotado"));
  } else if (producto.nuevo) {
    tarjeta.appendChild(crear("span", "badge rounded-pill etiqueta-producto etiqueta-nuevo", "Nuevo"));
  }

  const info = crear("div", "card-body tarjeta-info");
  info.appendChild(crear("span", "tarjeta-nombre", producto.nombre));
  info.appendChild(crear("span", "tarjeta-precio", formatearPrecio(producto.precio)));
  tarjeta.appendChild(info);

  tarjeta.addEventListener("click", () => abrirDetalle(producto));
  return tarjeta;
}


/* ==========================================================
   7. VENTANA DE DETALLE (foto grande, color y cantidad)
   ========================================================== */
function abrirDetalle(producto) {
  productoAbierto = producto;
  varianteElegida = null;
  cantidadElegida = 1;

  ponerImagen($("detalle-imagen"), producto.imagen, producto.nombre);
  $("detalle-nombre").textContent      = producto.nombre;
  $("detalle-precio").textContent      = formatearPrecio(producto.precio);
  $("detalle-descripcion").textContent = producto.descripcion || "";
  $("detalle-cantidad").textContent    = cantidadElegida;

  // Colores: solo si el producto los tiene
  const variantes = producto.variantes || [];
  const lista = $("lista-variantes");
  lista.innerHTML = "";
  $("detalle-variantes").hidden = variantes.length === 0;

  variantes.forEach((variante) => {
    const boton = crear("button", "btn btn-sm rounded-pill variante", variante);
    boton.type = "button";
    boton.addEventListener("click", () => {
      varianteElegida = variante;
      lista.querySelectorAll(".variante").forEach((b) => b.classList.toggle("activa", b === boton));
    });
    lista.appendChild(boton);
  });

  // Botón agregar: desactivado si está agotado
  const botonAgregar = $("btn-agregar");
  botonAgregar.disabled = Boolean(producto.agotado);
  botonAgregar.textContent = producto.agotado ? "Agotado por ahora" : "Agregar al carrito";

  ventanaProducto.show();

  // Cambia la dirección a .../#id-del-producto para poder compartirla
  history.replaceState(null, "", "#" + producto.id);
}

function cambiarCantidad(cambio) {
  cantidadElegida = Math.min(CANTIDAD_MAXIMA, Math.max(1, cantidadElegida + cambio));
  $("detalle-cantidad").textContent = cantidadElegida;
}

function agregarAlCarrito() {
  const producto = productoAbierto;
  if (!producto || producto.agotado) return;

  const tieneColores = (producto.variantes || []).length > 0;
  if (tieneColores && !varianteElegida) {
    mostrarAviso("Elige un color primero");
    return;
  }

  // Mismo producto y mismo color = se suma la cantidad
  const clave = producto.id + "|" + (varianteElegida || "");
  const existente = carrito.find((item) => item.clave === clave);

  if (existente) {
    existente.cantidad = Math.min(CANTIDAD_MAXIMA, existente.cantidad + cantidadElegida);
  } else {
    carrito.push({
      clave,
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      variante: varianteElegida,
      cantidad: cantidadElegida
    });
  }

  guardarCarrito();
  actualizarCarrito();
  ventanaProducto.hide();
  mostrarAviso("✓ Agregado al carrito");

  // Pequeño salto del contador
  const contador = $("carrito-contador");
  contador.classList.remove("rebote");
  void contador.offsetWidth;   // reinicia la animación
  contador.classList.add("rebote");
}


/* ==========================================================
   8. CARRITO
   ========================================================== */
function actualizarCarrito() {
  const lista = $("carrito-lista");
  lista.innerHTML = "";

  carrito.forEach((item, indice) => {
    const fila = crear("li", "item-carrito");
    fila.appendChild(crearImagen(item.imagen, item.nombre, "item-imagen"));

    const info = crear("div", "item-info");
    info.appendChild(crear("p", "item-nombre", item.nombre));
    const detalle = `${item.cantidad} × ${formatearPrecio(item.precio)}` +
      (item.variante ? ` · ${item.variante}` : "");
    info.appendChild(crear("p", "item-detalle", detalle));
    info.appendChild(crear("p", "item-precio", formatearPrecio(item.precio * item.cantidad)));
    fila.appendChild(info);

    const quitar = crear("button", "btn btn-quitar");
    quitar.type = "button";
    quitar.appendChild(icono("trash3"));
    quitar.setAttribute("aria-label", "Quitar " + item.nombre);
    quitar.addEventListener("click", () => {
      carrito.splice(indice, 1);
      guardarCarrito();
      actualizarCarrito();
    });
    fila.appendChild(quitar);

    lista.appendChild(fila);
  });

  const vacio = carrito.length === 0;
  $("carrito-vacio").hidden = !vacio;
  $("carrito-formulario").hidden = vacio;

  const unidades = carrito.reduce((suma, item) => suma + item.cantidad, 0);
  $("carrito-contador").textContent = unidades;

  actualizarTotal();
}

// Guarda el carrito en el celular del cliente, por si cierra la página
function guardarCarrito() {
  try {
    localStorage.setItem("carrito-" + CONFIG.tienda.nombre, JSON.stringify(carrito));
  } catch (error) {
    // Si el navegador no permite guardar, la tienda sigue funcionando
  }
}

function leerCarritoGuardado() {
  try {
    const guardado = JSON.parse(localStorage.getItem("carrito-" + CONFIG.tienda.nombre));
    return Array.isArray(guardado) ? guardado : [];
  } catch (error) {
    return [];
  }
}

// Si cambió un precio o algo se agotó desde la última visita,
// el carrito guardado se actualiza con los datos nuevos
function recuperarCarrito() {
  carrito = leerCarritoGuardado().filter((item) => {
    const producto = productos.find((p) => p.id === item.id);
    if (!producto || producto.agotado) return false;
    item.nombre = producto.nombre;
    item.precio = producto.precio;
    item.imagen = producto.imagen;
    return true;
  });
  guardarCarrito();
}


/* ==========================================================
   9. ENTREGA Y TOTAL
   ========================================================== */
function mostrarOpcionesEntrega() {
  const contenedor = $("opciones-entrega");
  contenedor.innerHTML = "";

  CONFIG.entrega.forEach((opcion, indice) => {
    const etiqueta = crear("label", "opcion-entrega");

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.className = "form-check-input";
    radio.name = "entrega";
    radio.value = opcion.id;
    radio.checked = indice === 0;
    radio.addEventListener("change", actualizarDatoEntrega);

    const textos = crear("span");
    textos.appendChild(crear("strong", "", opcion.nombre));
    textos.appendChild(crear("small", "", opcion.descripcion));

    etiqueta.append(radio, textos);
    contenedor.appendChild(etiqueta);
  });

  actualizarDatoEntrega();
}

function entregaElegida() {
  const marcada = document.querySelector('input[name="entrega"]:checked');
  return CONFIG.entrega.find((e) => marcada && e.id === marcada.value) || CONFIG.entrega[0];
}

// Delivery pide dirección; agencia pide ciudad
function actualizarDatoEntrega() {
  const entrega = entregaElegida();
  $("cliente-dato-etiqueta").textContent = entrega.pedirDato;
  $("cliente-dato").placeholder = entrega.pedirDato;
  actualizarTotal();
}

function calcularTotal() {
  const subtotal = carrito.reduce((suma, item) => suma + item.precio * item.cantidad, 0);
  const entrega = entregaElegida();
  const envioFijo = typeof entrega.costo === "number";
  const envio = envioFijo ? entrega.costo : 0;
  return { subtotal, envio, envioFijo, total: subtotal + envio };
}

function actualizarTotal() {
  const cuenta = calcularTotal();
  $("carrito-total").textContent = formatearPrecio(cuenta.total);
  $("nota-envio").textContent = cuenta.envioFijo
    ? `Incluye envío: ${formatearPrecio(cuenta.envio)}`
    : "El costo de envío se coordina por WhatsApp.";
}


/* ==========================================================
   10. ENVIAR EL PEDIDO POR WHATSAPP
   ========================================================== */
function enviarPedido(evento) {
  evento.preventDefault();
  if (carrito.length === 0) return;

  const nombre = $("cliente-nombre").value.trim();
  const dato   = $("cliente-dato").value.trim();
  if (!nombre || !dato) {
    mostrarAviso("Completa tus datos para enviar el pedido");
    return;
  }

  const entrega = entregaElegida();
  const cuenta  = calcularTotal();

  const lineasProductos = carrito.map((item) =>
    `• ${item.cantidad} x ${item.nombre}` +
    (item.variante ? ` (${item.variante})` : "") +
    ` - ${formatearPrecio(item.precio * item.cantidad)}`
  );

  const mensaje = [
    CONFIG.whatsapp.saludo,
    "",
    ...lineasProductos,
    "",
    cuenta.envioFijo ? `Envío: ${formatearPrecio(cuenta.envio)}` : null,
    `*Total: ${formatearPrecio(cuenta.total)}*`,
    cuenta.envioFijo ? null : "(Costo de envío por coordinar)",
    "",
    `Nombre: ${nombre}`,
    `Entrega: ${entrega.nombre}`,
    `${entrega.pedirDato}: ${dato}`
  ].filter((linea) => linea !== null).join("\n");

  const enlace = `https://wa.me/${CONFIG.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;

  // Abre WhatsApp; si el navegador bloquea la pestaña nueva, abre en la misma
  const ventana = window.open(enlace, "_blank");
  if (ventana) {
    ventana.opener = null;
  } else {
    window.location.href = enlace;
  }
}


/* ==========================================================
   11. COMPONENTES DE BOOTSTRAP
   Bootstrap se encarga de abrir, cerrar, animar y bloquear
   el fondo. El carrito (Offcanvas) se abre solo con
   data-bs-toggle en index.html, sin JavaScript extra.
   ========================================================== */
function prepararComponentes() {
  ventanaProducto = new bootstrap.Modal($("modal-producto"));
  avisoFlotante   = new bootstrap.Toast($("aviso"));

  // Al cerrar el detalle, quita el #producto de la dirección
  $("modal-producto").addEventListener("hidden.bs.modal", () => {
    history.replaceState(null, "", location.pathname + location.search);
  });
}

// Si alguien entra con un link compartido (.../#manta-felpa),
// se abre directamente ese producto
function abrirDesdeEnlace() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const producto = productos.find((p) => p.id === id);
  if (producto) abrirDetalle(producto);
}


/* ==========================================================
   12. CONECTAR BOTONES CON SUS ACCIONES
   ========================================================== */
function conectarEventos() {
  $("buscador").addEventListener("input", mostrarProductos);

  $("btn-menos").addEventListener("click", () => cambiarCantidad(-1));
  $("btn-mas").addEventListener("click", () => cambiarCantidad(1));
  $("btn-agregar").addEventListener("click", agregarAlCarrito);

  $("carrito-formulario").addEventListener("submit", enviarPedido);
}


/* ==========================================================
   13. ARRANQUE DE LA TIENDA
   ========================================================== */
async function iniciar() {
  if (typeof CONFIG === "undefined") {
    console.error("Falta config.js o tiene un error. Revisa que esté antes de script.js en index.html.");
    return;
  }
  if (typeof bootstrap === "undefined") {
    console.error("No cargó Bootstrap. Revisa tu conexión a internet o el enlace del CDN en index.html.");
    return;
  }

  prepararComponentes();
  aplicarConfig();
  mostrarOpcionesEntrega();
  conectarEventos();

  const cargo = await cargarProductos();
  if (!cargo) return;

  recuperarCarrito();
  mostrarCategorias();
  mostrarProductos();
  actualizarCarrito();
  abrirDesdeEnlace();
}

iniciar();
