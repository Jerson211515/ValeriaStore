/* ==========================================================
   CONFIG.JS — Datos del negocio
   ----------------------------------------------------------
   Este es el ÚNICO archivo que necesitas cambiar para
   adaptar la tienda a otro negocio.
   No hace falta tocar index.html, style.css ni script.js.
   ========================================================== */

const CONFIG = {

  /* ---------- 1. Datos de la tienda ---------- */
  tienda: {
    nombre: "ValeriaStore",
    eslogan: "Productos importados en Chachapoyas",
    ciudad: "Chachapoyas",
    logo: "img/logo.png",              // recorte circular (encabezado)
    portada: "img/portada.png",        // ilustración completa (inicio)
    moneda: "S/"
  },

  /* ---------- 2. WhatsApp ----------
     Escribe el número con código de país, sin espacios,
     sin el signo + y sin guiones.
     Perú = 51  →  51 + 965921194                      */
  whatsapp: {
    numero: "51965921194",
    saludo: "¡Hola ValeriaStore! 👋 Quiero hacer este pedido:"
  },

  /* ---------- 3. Formas de entrega ----------
     El cliente elige una antes de enviar el pedido.
     "pedirDato" es lo que la tienda le pregunta.
     costo: null significa "se coordina por WhatsApp".   */
  entrega: [
    {
      id: "delivery",
      nombre: "Delivery en Chachapoyas",
      descripcion: "Te lo llevamos a tu casa",
      pedirDato: "Dirección o referencia",
      costo: null
    },
    {
      id: "agencia",
      nombre: "Envío por agencia",
      descripcion: "Para otras ciudades del Perú",
      pedirDato: "Ciudad de destino",
      costo: null
    }
  ],

  /* ---------- 4. Formas de pago ----------
     Solo se muestran como información.
     El pago se coordina por WhatsApp.                   */
  pagos: ["Yape", "Plin"],

  /* ---------- 5. Categorías ----------
     El "id" debe coincidir con la categoría
     de cada producto en data/productos.json             */
  categorias: [
    { id: "todo",       nombre: "Todo" },
    { id: "hogar",      nombre: "Hogar" },
    { id: "cocina",     nombre: "Cocina" },
    { id: "belleza",    nombre: "Belleza" },
    { id: "tecnologia", nombre: "Tecnología" },
    { id: "ninos",      nombre: "Bebés y niños" }
  ],

  /* ---------- 6. Colores (sacados del logo) ----------
     script.js los aplica automáticamente a style.css    */
  colores: {
    principal:   "#B8496D",   // rosa intenso: botones y precios
    suave:       "#E896AE",   // rosa Valeria: detalles
    secundario:  "#C4BFE3",   // lila: categorías y fondos suaves
    texto:       "#2F4A47",   // verde banca: textos y encabezado
    fondo:       "#FFF8F1",   // crema: fondo general
    whatsapp:    "#25D366"    // verde oficial de WhatsApp
  }
};
