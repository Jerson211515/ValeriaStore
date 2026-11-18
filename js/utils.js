/* ==========================================================
   UTILS.JS — Herramientas pequeñas compartidas
   ----------------------------------------------------------
   Funciones "puras": reciben un dato y devuelven otro,
   sin tocar la pantalla ni pedir nada al servidor.
   Las usan tanto los servicios como la interfaz.
   ========================================================== */

// 45 → "S/ 45.00"
export function formatearPrecio(numero) {
  return `${CONFIG.tienda.moneda} ${Number(numero).toFixed(2)}`;
}

// Quita tildes y mayúsculas: "Bebé" → "bebe"
export function normalizar(texto = "") {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// ["Yape", "Plin"] → "Yape y Plin"
export function unirLista(lista) {
  if (lista.length <= 1) return lista.join("");
  return lista.slice(0, -1).join(", ") + " y " + lista[lista.length - 1];
}
