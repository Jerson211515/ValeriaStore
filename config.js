/* ==========================================================
   CONFIG.JS — Datos del negocio
   ----------------------------------------------------------
   Este es el ÚNICO archivo que necesitas cambiar para
   adaptar la tienda a otro negocio.
   No hace falta tocar index.html, style.css ni la carpeta js/.
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

  /* ---------- 5. Conexión con la API (capa de servicio) ----------
     "simulado": usa js/api/servidorSimulado.js, que lee los
                 archivos de data/ (ideal para GitHub Pages).
     "real":     envía las peticiones a un backend en urlBase.
     Las categorías y productos ya no van aquí: los entrega
     la API desde data/categorias.json y data/productos.json  */
  api: {
    modo: "simulado",
    urlBase: "",                // ej.: "https://mi-servidor.com/api" (solo modo real)
    demoraSimulada: 400,        // milisegundos, imita el viaje por internet
    mostrarEnConsola: true      // muestra cada petición en la consola (F12)
  },

  /* ---------- 6. Colores (sacados del logo) ----------
     js/ui/vistas.js los aplica automáticamente a style.css    */
  colores: {
    principal:   "#B8496D",   // rosa intenso: botones y precios
    suave:       "#E896AE",   // rosa Valeria: detalles
    secundario:  "#C4BFE3",   // lila: categorías y fondos suaves
    texto:       "#2F4A47",   // verde banca: textos y encabezado
    fondo:       "#FFF8F1",   // crema: fondo general
    whatsapp:    "#25D366"    // verde oficial de WhatsApp
  }
};
