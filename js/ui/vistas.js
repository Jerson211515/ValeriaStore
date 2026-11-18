/* ==========================================================
   VISTAS.JS — capa de presentación (lo que se ve)
   ----------------------------------------------------------
   Solo dibuja en la pantalla con los datos que recibe.
   No pide nada a la API ni decide reglas del negocio:
   eso lo hacen los servicios.
   Usa componentes de Bootstrap: Card, Placeholder, Toast,
   Spinner y validación de formularios.
   ========================================================== */

import { formatearPrecio, unirLista } from "../utils.js";

// Atajo para no escribir document.getElementById cada vez
export const $ = (id) => document.getElementById(id);

// Imagen de respaldo si una foto no existe o tiene mal el nombre
const IMAGEN_RESPALDO = "data:image/svg+xml;utf8," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect width="100" height="100" fill="#F4E4EA"/>' +
  '<text x="50" y="60" font-size="32" text-anchor="middle">📦</text></svg>'
);


/* ---------- Ayudantes para crear elementos ---------- */

export function crear(etiqueta, clase = "", texto = "") {
  const elemento = document.createElement(etiqueta);
  if (clase) elemento.className = clase;
  if (texto) elemento.textContent = texto;
  return elemento;
}

export function icono(nombre) {
  const i = crear("i", "bi bi-" + nombre);
  i.setAttribute("aria-hidden", "true");
  return i;
}

export function ponerImagen(img, ruta, descripcion) {
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


/* ==========================================================
   MARCA (datos de config.js)
   ========================================================== */
export function aplicarMarca() {
  for (const [nombre, valor] of Object.entries(CONFIG.colores)) {
    document.documentElement.style.setProperty("--" + nombre, valor);
  }
  $("tienda-nombre").textContent  = CONFIG.tienda.nombre;
  $("tienda-eslogan").textContent = CONFIG.tienda.eslogan;
  $("tienda-pagos").textContent   = unirLista(CONFIG.pagos);
  $("pie-nombre").textContent     = CONFIG.tienda.nombre;
  $("pie-ciudad").textContent     = CONFIG.tienda.ciudad;
  ponerImagen($("tienda-logo"),    CONFIG.tienda.logo,    "Logo de " + CONFIG.tienda.nombre);
  ponerImagen($("tienda-portada"), CONFIG.tienda.portada, "Portada de " + CONFIG.tienda.nombre);
}


/* ==========================================================
   AVISO FLOTANTE (Toast de Bootstrap)
   ========================================================== */
let toast = null;
export function mostrarAviso(texto, tipo = "normal") {
  toast ??= new bootstrap.Toast($("aviso"));
  $("aviso").classList.toggle("aviso-error", tipo === "error");
  $("aviso-texto").textContent = texto;
  toast.show();
}


/* ==========================================================
   ESTADOS DE CARGA Y ERROR DEL CATÁLOGO
   ========================================================== */

// Tarjetas "fantasma" mientras llega la respuesta (Placeholder de Bootstrap)
export function mostrarCargando(cantidad = 8) {
  const grilla = $("grilla-productos");
  grilla.innerHTML = "";
  grilla.setAttribute("aria-busy", "true");
  $("sin-resultados").hidden = true;

  for (let i = 0; i < cantidad; i++) {
    const columna = crear("div", "col");
    columna.innerHTML = `
      <div class="card tarjeta h-100" aria-hidden="true">
        <div class="tarjeta-imagen placeholder-glow"><span class="placeholder w-100 h-100"></span></div>
        <div class="card-body tarjeta-info placeholder-glow">
          <span class="placeholder col-10 rounded"></span>
          <span class="placeholder col-6 rounded mt-2"></span>
        </div>
      </div>`;
    grilla.appendChild(columna);
  }

  const categorias = $("lista-categorias");
  categorias.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    categorias.appendChild(crear("span", "placeholder-glow")).innerHTML =
      '<span class="placeholder categoria-fantasma rounded-pill"></span>';
  }
}

export function mostrarErrorCatalogo(mensaje, alReintentar) {
  const grilla = $("grilla-productos");
  grilla.removeAttribute("aria-busy");
  $("lista-categorias").innerHTML = "";
  grilla.innerHTML = "";

  const caja = crear("div", "col-12");
  const alerta = crear("div", "alert alerta-error text-center");
  alerta.setAttribute("role", "alert");
  alerta.append(
    icono("wifi-off"),
    crear("p", "fw-bold mb-1 mt-2", "No pudimos cargar los productos"),
    crear("p", "mb-3 small", mensaje)
  );
  const boton = crear("button", "btn btn-principal btn-reintentar");
  boton.type = "button";
  boton.append(icono("arrow-clockwise"), " Reintentar");
  boton.addEventListener("click", alReintentar);
  alerta.appendChild(boton);

  caja.appendChild(alerta);
  grilla.appendChild(caja);
}


/* ==========================================================
   CATEGORÍAS Y PRODUCTOS
   ========================================================== */
export function mostrarCategorias(categorias, activa, alElegir) {
  const contenedor = $("lista-categorias");
  contenedor.innerHTML = "";

  [{ id: "todo", nombre: "Todo", icono: "grid" }, ...categorias].forEach((categoria) => {
    const boton = crear("button", "btn btn-sm rounded-pill categoria");
    boton.type = "button";
    if (categoria.id === activa) boton.classList.add("activa");
    if (categoria.icono) boton.appendChild(icono(categoria.icono));
    boton.append(" " + categoria.nombre);
    boton.addEventListener("click", () => alElegir(categoria.id));
    contenedor.appendChild(boton);
  });
}

export function mostrarProductos(productos, alAbrir) {
  const grilla = $("grilla-productos");
  grilla.removeAttribute("aria-busy");
  grilla.innerHTML = "";

  productos.forEach((producto) => {
    const columna = crear("div", "col");
    columna.appendChild(crearTarjeta(producto, alAbrir));
    grilla.appendChild(columna);
  });

  $("sin-resultados").hidden = productos.length > 0;
}

function crearTarjeta(producto, alAbrir) {
  const tarjeta = crear("button", "card tarjeta h-100");
  tarjeta.type = "button";
  if (producto.agotado) tarjeta.classList.add("agotado");

  const imagen = crearImagen(producto.imagen, producto.nombre, "card-img-top tarjeta-imagen");
  imagen.loading = "lazy";
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

  tarjeta.addEventListener("click", () => alAbrir(producto));
  return tarjeta;
}


/* ==========================================================
   DETALLE DEL PRODUCTO (Modal)
   ========================================================== */
export function mostrarDetalle(producto, alElegirVariante) {
  ponerImagen($("detalle-imagen"), producto.imagen, producto.nombre);
  $("detalle-nombre").textContent      = producto.nombre;
  $("detalle-precio").textContent      = formatearPrecio(producto.precio);
  $("detalle-descripcion").textContent = producto.descripcion || "";
  $("detalle-cantidad").textContent    = 1;

  const variantes = producto.variantes || [];
  const lista = $("lista-variantes");
  lista.innerHTML = "";
  $("detalle-variantes").hidden = variantes.length === 0;

  variantes.forEach((variante) => {
    const boton = crear("button", "btn btn-sm rounded-pill variante", variante);
    boton.type = "button";
    boton.addEventListener("click", () => {
      lista.querySelectorAll(".variante").forEach((b) => b.classList.toggle("activa", b === boton));
      alElegirVariante(variante);
    });
    lista.appendChild(boton);
  });

  const botonAgregar = $("btn-agregar");
  botonAgregar.disabled = Boolean(producto.agotado);
  botonAgregar.textContent = producto.agotado ? "Agotado por ahora" : "Agregar al carrito";
}

export function mostrarCantidad(cantidad) {
  $("detalle-cantidad").textContent = cantidad;
}


/* ==========================================================
   CARRITO (Offcanvas)
   ========================================================== */
export function mostrarCarrito(items, unidades, alQuitar) {
  const lista = $("carrito-lista");
  lista.innerHTML = "";

  items.forEach((item) => {
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
    quitar.addEventListener("click", () => alQuitar(item.clave));
    fila.appendChild(quitar);

    lista.appendChild(fila);
  });

  const vacio = items.length === 0;
  $("carrito-vacio").hidden = !vacio;
  $("carrito-formulario").hidden = vacio;
  $("carrito-contador").textContent = unidades;
}

export function animarContador() {
  const contador = $("carrito-contador");
  contador.classList.remove("rebote");
  void contador.offsetWidth;   // reinicia la animación
  contador.classList.add("rebote");
}

export function mostrarEntregas(entregas, alCambiar) {
  const contenedor = $("opciones-entrega");
  contenedor.innerHTML = "";

  entregas.forEach((opcion, indice) => {
    const etiqueta = crear("label", "opcion-entrega");
    const radio = crear("input", "form-check-input");
    radio.type = "radio";
    radio.name = "entrega";
    radio.value = opcion.id;
    radio.checked = indice === 0;
    radio.addEventListener("change", () => alCambiar(opcion.id));

    const textos = crear("span");
    textos.appendChild(crear("strong", "", opcion.nombre));
    textos.appendChild(crear("small", "", opcion.descripcion));

    etiqueta.append(radio, textos);
    contenedor.appendChild(etiqueta);
  });
}

export function mostrarDatoEntrega(entrega) {
  $("cliente-dato-etiqueta").textContent = entrega.pedirDato;
  $("cliente-dato").placeholder = entrega.pedirDato;
}

export function mostrarTotales(totales) {
  $("carrito-total").textContent = formatearPrecio(totales.total);
  $("nota-envio").textContent = totales.envioFijo
    ? `Incluye envío: ${formatearPrecio(totales.envio)}`
    : "El costo de envío se coordina por WhatsApp.";
}


/* ---------- Formulario: validación con estilos de Bootstrap ---------- */

export function mostrarErrores(errores) {
  [["nombre", "cliente-nombre"], ["dato", "cliente-dato"]].forEach(([campo, id]) => {
    const tieneError = Boolean(errores[campo]);
    $(id).classList.toggle("is-invalid", tieneError);
    $("error-" + campo).textContent = errores[campo] || "";
  });
  const primero = document.querySelector("#carrito-formulario .is-invalid");
  if (primero) primero.focus();
}

export function limpiarError(idCampo) {
  $(idCampo).classList.remove("is-invalid");
}

export function botonConfirmarCargando(cargando) {
  $("btn-confirmar").disabled = cargando;
  $("spinner-confirmar").hidden = !cargando;
  $("texto-confirmar").textContent = cargando ? "Registrando pedido..." : "Confirmar pedido";
}


/* ---------- Confirmación: respuesta del servidor ---------- */

export function mostrarConfirmacion(pedido, enlaceWhatsApp) {
  $("confirmacion-codigo").textContent = pedido.codigo;
  $("confirmacion-total").textContent  = formatearPrecio(pedido.total);
  $("confirmacion-nota").textContent   = pedido.envioFijo
    ? "Incluye el costo de envío."
    : "El costo de envío se coordina por WhatsApp.";
  $("btn-enviar-whatsapp").href = enlaceWhatsApp;

  $("carrito-contenido").hidden = true;
  $("pedido-confirmado").hidden = false;
}

export function ocultarConfirmacion() {
  $("pedido-confirmado").hidden = true;
  $("carrito-contenido").hidden = false;
}
