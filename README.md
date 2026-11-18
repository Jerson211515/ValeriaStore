# ValeriaStore

Tienda virtual para un emprendimiento de productos importados en Chachapoyas. El cliente ve el catálogo, filtra, busca, elige color y cantidad, arma su carrito y confirma el pedido, que se registra en la capa de servicio y se envía por WhatsApp.

- **Tienda publicada:** https://jerson211515.github.io/ValeriaStore/
- **Tecnologías:** HTML5, CSS3, JavaScript (módulos ES), Bootstrap 5 y Bootstrap Icons

> Proyecto en desarrollo progresivo, como parte del curso de programación.

---

## Arquitectura en capas

```
┌──────────────────────────────────────────────────────────┐
│  CAPA DE PRESENTACIÓN                                    │
│  index.html · style.css · js/ui/vistas.js                │
│  Dibuja la pantalla y recibe las acciones del cliente    │
└───────────────────────────┬──────────────────────────────┘
                            │  js/main.js (controlador)
┌───────────────────────────▼──────────────────────────────┐
│  CAPA DE SERVICIO (lógica del negocio)                   │
│  productoService · carritoService · pedidoService        │
└───────────────────────────┬──────────────────────────────┘
                            │  get() / post()
┌───────────────────────────▼──────────────────────────────┐
│  CAPA DE ACCESO A DATOS                                  │
│  js/api/apiCliente.js  →  servidorSimulado.js  →  data/  │
└──────────────────────────────────────────────────────────┘
```

Cada capa solo conversa con la de abajo. La interfaz nunca llama a la API directamente: siempre pasa por un servicio.

## Componentes y responsabilidades

| Componente | Archivo | Responsabilidad |
|---|---|---|
| Vistas | `js/ui/vistas.js` | Dibujar catálogo, detalle, carrito, estados de carga, error y confirmación. Sin lógica de negocio. |
| Controlador | `js/main.js` | Escuchar eventos del cliente, llamar al servicio correcto y pasar el resultado a las vistas. |
| ProductoService | `js/services/productoService.js` | Obtener productos y categorías, guardarlos en caché y filtrarlos. |
| CarritoService | `js/services/carritoService.js` | Agregar y quitar productos, aplicar reglas (color obligatorio, agotados, máx. 20 unidades), calcular totales, guardar en el celular y avisar cambios (patrón observador). |
| PedidoService | `js/services/pedidoService.js` | Validar datos del cliente, registrar el pedido y armar el mensaje y enlace de WhatsApp. |
| ApiCliente | `js/api/apiCliente.js` | Único punto de comunicación con el servidor. Envía peticiones, convierte errores en `ErrorApi` y las registra en consola. |
| Servidor simulado | `js/api/servidorSimulado.js` | Imita un backend con rutas, controladores y códigos HTTP. Lee `data/` y guarda pedidos en `localStorage`. |
| Configuración | `config.js` | Datos del negocio: nombre, WhatsApp, entregas, colores y modo de la API. |

## Endpoints de la API

| Método | Ruta | Respuesta | Uso en la tienda |
|---|---|---|---|
| GET | `/productos` | 200: lista de productos | Cargar el catálogo |
| GET | `/productos/:id` | 200: producto · 404: no existe | Abrir un producto desde un enlace compartido |
| GET | `/categorias` | 200: lista de categorías | Botones de categoría |
| POST | `/pedidos` | 201: pedido creado · 400: datos inválidos · 404 / 409: producto no disponible o agotado | Confirmar el pedido |

El servidor **no confía en los precios del navegador**: el cliente envía solo `id`, `variante` y `cantidad`, y el servidor vuelve a consultar el catálogo para calcular el total.

## Flujo de datos: confirmar un pedido

1. El cliente toca **Confirmar pedido** → `main.js`
2. `pedidoService.validarCliente()` revisa nombre y dirección → si hay errores, `vistas.js` los marca en rojo
3. `pedidoService.registrar()` → `apiCliente.post("/pedidos")`
4. El servidor valida stock, calcula el total y responde **201** con un código (ej. `VS-1117-K4P9`)
5. `vistas.js` muestra la confirmación con el código y el botón de WhatsApp
6. Si responde **409** (producto agotado), se muestra el aviso y el catálogo se vuelve a cargar

Durante la espera, la interfaz muestra tarjetas de carga (placeholders) o un spinner. Si falla la conexión, aparece un mensaje con botón **Reintentar**.

## Cambiar a un backend real

En `config.js`:

```js
api: {
  modo: "real",
  urlBase: "https://mi-servidor.com/api"
}
```

Los servicios, la interfaz y el controlador no cambian: solo deja de usarse `servidorSimulado.js`.

## Estructura del proyecto

```
ValeriaStore/
├── index.html
├── style.css
├── config.js
├── data/
│   ├── productos.json
│   └── categorias.json
├── img/
│   ├── logo.png
│   ├── portada.png
│   └── productos/
└── js/
    ├── main.js
    ├── utils.js
    ├── api/
    │   ├── apiCliente.js
    │   └── servidorSimulado.js
    ├── services/
    │   ├── productoService.js
    │   ├── carritoService.js
    │   └── pedidoService.js
    └── ui/
        └── vistas.js
```

## Cómo probarlo

- **Publicado:** abrir el enlace de GitHub Pages.
- **En la PC:** abrir la carpeta con la extensión **Live Server** de VS Code. Con doble clic en `index.html` no funciona, porque los módulos y `fetch` necesitan un servidor.
- **Ver la capa de servicio en acción:** presionar `F12` → pestaña **Consola**. Cada petición aparece así: `[API] GET /productos → 200 (405 ms)`.

---

Tienda creada por JersonTIC
