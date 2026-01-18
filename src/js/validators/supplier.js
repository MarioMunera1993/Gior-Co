/**
 * VALIDADOR DE PROVEEDORES
 * =======================
 * Valida datos de proveedores
 * - Validación de razón social, identificación, tipo de ID
 * - Validación de dirección, teléfono, contacto, correo
 * - Soporta 7 tipos de identificación: RUT, NIT, RFC, CURP, CUIT, PAS, OTR
 * - Retorna array de errores descriptivos en español
 */

const SupplierValidator = {
  // Tipos de identificación válidos
  tiposIdentificacion: ["RUT", "NIT", "RFC", "CURP", "CUIT", "PAS", "OTR"],

  // Validar proveedor
  validateSupplier(
    razonSocial,
    identificacion,
    tipoIdentificacion,
    direccion,
    telefono,
    nombreContacto,
    correo
  ) {
    const errors = [];

    if (!razonSocial || razonSocial.trim() === "") {
      errors.push("La razón social es requerida");
    } else if (razonSocial.length > 100) {
      errors.push("La razón social no puede exceder 100 caracteres");
    }

    if (!identificacion || identificacion.trim() === "") {
      errors.push("La identificación es requerida");
    } else if (identificacion.length > 30) {
      errors.push("La identificación no puede exceder 30 caracteres");
    }

    if (!tipoIdentificacion || tipoIdentificacion.trim() === "") {
      errors.push("El tipo de identificación es requerido");
    } else if (!this.tiposIdentificacion.includes(tipoIdentificacion)) {
      errors.push("Tipo de identificación no válido");
    }

    if (!direccion || direccion.trim() === "") {
      errors.push("La dirección es requerida");
    } else if (direccion.length > 150) {
      errors.push("La dirección no puede exceder 150 caracteres");
    }

    if (!telefono || telefono.trim() === "") {
      errors.push("El teléfono es requerido");
    } else if (!/^[\d\s\-\+\(\)]+$/.test(telefono)) {
      errors.push("El teléfono contiene caracteres no válidos");
    } else if (telefono.replace(/\D/g, "").length < 7) {
      errors.push("El teléfono debe tener al menos 7 dígitos");
    }

    if (!nombreContacto || nombreContacto.trim() === "") {
      errors.push("El nombre del contacto es requerido");
    } else if (nombreContacto.length > 100) {
      errors.push("El nombre del contacto no puede exceder 100 caracteres");
    }

    if (!correo || correo.trim() === "") {
      errors.push("El correo es requerido");
    } else if (!this.isValidEmail(correo)) {
      errors.push("El correo no es válido");
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
