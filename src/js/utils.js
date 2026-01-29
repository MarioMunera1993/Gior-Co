/**
 * MÓDULO DE UTILIDADES
 * ====================
 * Funciones reutilizables en toda la aplicación
 * - Formateo de moneda y fechas
 * - Cálculo de estado de stock
 * - Generación de IDs únicos
 */

const Utils = {
  // Convertir número a formato de moneda colombiana
  formatCurrency(value) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0, // Pesos colombianos suelen no usar decimales para montos grandes
      maximumFractionDigits: 0
    }).format(value);
  },

  // Formatear fecha ISO a formato legible en español
  formatDate(isoString) {
    if (!isoString || isoString.startsWith("Invalid")) {
      return "Fecha no válida";
    }
    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) {
        return "Fecha no válida";
      }
      return date.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Fecha no válida";
    }
  },

  // Determinar estado de stock (OK, Bajo, Agotado) con estilos y filtro
  getStockStatus(cantidad) {
    if (cantidad === 0)
      return {
        text: "Agotado",
        class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
        filter: "agotado",
      };
    if (cantidad <= 5)
      return {
        text: "Bajo",
        class:
          "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
        filter: "bajo",
      };
    return {
      text: "OK",
      class:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      filter: "ok",
    };
  },

  // Generar ID único usando crypto API del navegador
  generateId() {
    return crypto.randomUUID();
  },
};
