/**
 * VALIDADOR DE ENTRADA - PRODUCTOS Y VENTAS
 * ==========================================
 * Valida datos de formularios
 * - Validación de productos (código, nombre, talla, color, cantidad, precio)
 * - Validación de ventas (producto seleccionado, cantidad, precio)
 * - Retorna array de errores descriptivos en español
 */

const InputValidator = {
  // Validar producto
  validateProduct(codigo, nombre, talla, color, cantidad, precio) {
    const errors = [];

    if (!codigo || codigo.trim() === "") {
      errors.push("El código del producto es requerido");
    } else if (codigo.length > 20) {
      errors.push("El código no puede exceder 20 caracteres");
    }

    if (!nombre || nombre.trim() === "") {
      errors.push("El nombre del producto es requerido");
    } else if (nombre.length > 100) {
      errors.push("El nombre no puede exceder 100 caracteres");
    }

    if (!talla || talla.trim() === "") {
      errors.push("La talla es requerida");
    }

    if (!color || color.trim() === "") {
      errors.push("El color es requerido");
    } else if (color.length > 50) {
      errors.push("El color no puede exceder 50 caracteres");
    }

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum < 0) {
      errors.push("La cantidad debe ser un número no negativo");
    }

    const precioNum = parseFloat(precio);
    if (isNaN(precioNum) || precioNum < 0) {
      errors.push("El precio debe ser un número no negativo");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Validar venta
  validateSale(cantidad, precioFinal, productName) {
    const errors = [];

    const cantidadNum = parseInt(cantidad);
    if (isNaN(cantidadNum) || cantidadNum <= 0) {
      errors.push("La cantidad debe ser mayor a 0");
    }

    const precioNum = parseFloat(precioFinal);
    if (isNaN(precioNum) || precioNum < 0) {
      errors.push("El precio final no puede ser negativo");
    }

    if (!productName) {
      errors.push("Debe seleccionar un producto válido");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // Validar contraseña
  validatePassword(password) {
    if (!password || password.trim() === "") {
      return {
        isValid: false,
        errors: ["La contraseña es requerida"],
      };
    }
    return { isValid: true, errors: [] };
  },
};
