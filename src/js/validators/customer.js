/**
 * VALIDADOR DE CLIENTES
 * ====================
 * Valida datos de clientes
 * - Validación de apellidos, nombre, teléfono, correo, dirección
 * - Formatos específicos para teléfono y correo
 * - Retorna array de errores descriptivos en español
 */

const CustomerValidator = {
  // Validar cliente
  validateCustomer(primerApellido, segundoApellido, nombre, telefono, correo, direccion) {
    const errors = [];

    if (!primerApellido || primerApellido.trim() === "") {
      errors.push("El primer apellido es requerido");
    } else if (primerApellido.length > 50) {
      errors.push("El primer apellido no puede exceder 50 caracteres");
    }

    if (segundoApellido && segundoApellido.length > 50) {
      errors.push("El segundo apellido no puede exceder 50 caracteres");
    }

    if (!nombre || nombre.trim() === "") {
      errors.push("El nombre es requerido");
    } else if (nombre.length > 50) {
      errors.push("El nombre no puede exceder 50 caracteres");
    }

    if (!telefono || telefono.trim() === "") {
      errors.push("El teléfono es requerido");
    } else if (!/^[\d\s\-\+\(\)]+$/.test(telefono)) {
      errors.push("El teléfono contiene caracteres no válidos");
    } else if (telefono.replace(/\D/g, "").length < 7) {
      errors.push("El teléfono debe tener al menos 7 dígitos");
    }

    if (!correo || correo.trim() === "") {
      errors.push("El correo es requerido");
    } else if (!this.isValidEmail(correo)) {
      errors.push("El correo no es válido");
    }

    if (!direccion || direccion.trim() === "") {
      errors.push("La dirección es requerida");
    } else if (direccion.length > 150) {
      errors.push("La dirección no puede exceder 150 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
};
