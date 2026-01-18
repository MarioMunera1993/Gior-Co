/**
 * MÓDULO DE GESTIÓN DE PROVEEDORES
 * ================================
 * Gestiona el registro de proveedores
 * - Agregar proveedores (razón social, identificación, tipo de ID, dirección, teléfono, contacto, correo)
 * - Editar y eliminar proveedores
 * - Búsqueda y filtrado de proveedores
 * - Soporta múltiples tipos de identificación (RUT, NIT, RFC, CURP, CUIT, PAS, OTR)
 * - Estadísticas de proveedores
 */

const Suppliers = {
  loadAndRefreshUI() {
    this.updateStats();
    this.applyFiltersAndRender();
    if (Auth.isAdmin()) {
      Charts.initSuppliersCharts();
    }
  },

  updateStats() {
    const suppliers = Storage.getSuppliers();
    document.getElementById("stat-proveedores-total").textContent =
      suppliers.length;
  },

  applyFiltersAndRender() {
    const suppliers = Storage.getSuppliers();
    const searchText = document
      .getElementById("buscar-proveedores")
      .value.toLowerCase()
      .trim();

    const filteredSuppliers = suppliers.filter((s) => {
      const matchesSearch =
        s.razonSocial.toLowerCase().includes(searchText) ||
        s.identificacion.includes(searchText) ||
        s.correo.toLowerCase().includes(searchText) ||
        s.nombreContacto.toLowerCase().includes(searchText);

      return matchesSearch;
    });

    this.renderSuppliersTable(filteredSuppliers);
  },

  renderSuppliersTable(suppliers = Storage.getSuppliers()) {
    try {
      const tbody = document
        .getElementById("tabla-proveedores")
        .querySelector("tbody");
      tbody.innerHTML = "";
      const isAdmin = Auth.isAdmin();

      suppliers.forEach((s) => {
        const row = tbody.insertRow();

        row.className =
          "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150";

        row.insertCell().innerHTML = s.razonSocial;
        row.insertCell().innerHTML = `${s.tipoIdentificacion}: ${s.identificacion}`;
        row.insertCell().innerHTML = s.nombreContacto;
        row.insertCell().innerHTML = s.telefono;
        row.insertCell().innerHTML = s.correo;
        row.insertCell().innerHTML = s.direccion;

        const actionsCell = row.insertCell();
        actionsCell.className = "px-6 py-4 whitespace-nowrap text-center";
        actionsCell.setAttribute("data-label", "Acciones");

        if (isAdmin) {
          actionsCell.style.display = "table-cell";
          actionsCell.innerHTML = `
            <button onclick="showEditSupplierModal('${s.id}')" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 transition mr-3">
              Editar
            </button>
            <button onclick="deleteSupplier('${s.id}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition">
              Eliminar
            </button>
          `;
        } else {
          actionsCell.style.display = "none";
        }

        row.cells[0].setAttribute("data-label", "Razón Social");
        row.cells[1].setAttribute("data-label", "Identificación");
        row.cells[2].setAttribute("data-label", "Contacto");
        row.cells[3].setAttribute("data-label", "Teléfono");
        row.cells[4].setAttribute("data-label", "Correo");
        row.cells[5].setAttribute("data-label", "Dirección");
      });
    } catch (error) {
      console.error("Error al renderizar tabla de proveedores:", error);
      UI.showNotification("Error al mostrar proveedores", "error");
    }
  },

  addSupplier(
    razonSocial,
    identificacion,
    tipoIdentificacion,
    direccion,
    telefono,
    nombreContacto,
    correo
  ) {
    if (!Auth.isAdmin()) {
      UI.showNotification(
        "Permiso denegado. Solo Administradores pueden agregar proveedores.",
        "error"
      );
      return false;
    }

    // Validación
    const validation = SupplierValidator.validateSupplier(
      razonSocial,
      identificacion,
      tipoIdentificacion,
      direccion,
      telefono,
      nombreContacto,
      correo
    );

    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        UI.showNotification(error, "error")
      );
      return false;
    }

    let suppliers = Storage.getSuppliers();

    const exists = suppliers.some(
      (supp) =>
        supp.identificacion.toLowerCase() ===
          identificacion.trim().toLowerCase() ||
        supp.correo.toLowerCase() === correo.trim().toLowerCase()
    );

    if (!exists) {
      const newSupplier = {
        id: Utils.generateId(),
        razonSocial: razonSocial.trim(),
        identificacion: identificacion.trim(),
        tipoIdentificacion: tipoIdentificacion.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        nombreContacto: nombreContacto.trim(),
        correo: correo.trim().toLowerCase(),
        fechaRegistro: new Date().toISOString(),
      };

      suppliers.push(newSupplier);
      Storage.saveSuppliers(suppliers);

      UI.showNotification("Proveedor agregado con éxito", "success");
      return true;
    } else {
      UI.showNotification(
        "Error: El identificador o correo ya está registrado.",
        "error"
      );
      return false;
    }
  },

  editSupplier(
    id,
    razonSocial,
    identificacion,
    tipoIdentificacion,
    direccion,
    telefono,
    nombreContacto,
    correo
  ) {
    const suppliers = Storage.getSuppliers();

    // Validación
    const validation = SupplierValidator.validateSupplier(
      razonSocial,
      identificacion,
      tipoIdentificacion,
      direccion,
      telefono,
      nombreContacto,
      correo
    );

    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        UI.showNotification(error, "error")
      );
      return false;
    }

    const index = suppliers.findIndex((s) => s.id === id);

    if (index !== -1) {
      const originalEmail = suppliers[index].correo;
      const newEmail = correo.trim().toLowerCase();
      const originalId = suppliers[index].identificacion;
      const newId = identificacion.trim();

      // Verificar si el identificador o correo ya existe (excluir el actual)
      const exists = suppliers.some(
        (s) =>
          (s.identificacion.toLowerCase() === newId.toLowerCase() ||
            s.correo === newEmail) &&
          s.id !== id
      );

      if (exists) {
        UI.showNotification(
          "Error: El identificador o correo ya está registrado.",
          "error"
        );
        return false;
      }

      suppliers[index] = {
        id: id,
        razonSocial: razonSocial.trim(),
        identificacion: newId,
        tipoIdentificacion: tipoIdentificacion.trim(),
        direccion: direccion.trim(),
        telefono: telefono.trim(),
        nombreContacto: nombreContacto.trim(),
        correo: newEmail,
        fechaRegistro: suppliers[index].fechaRegistro,
      };

      Storage.saveSuppliers(suppliers);
      UI.showNotification("Proveedor actualizado con éxito", "success");
      return true;
    } else {
      UI.showNotification("Error: Proveedor no encontrado.", "error");
      return false;
    }
  },

  deleteSupplier(id) {
    if (!Auth.isAdmin()) {
      UI.showNotification(
        "Permiso denegado. Solo Administradores pueden eliminar.",
        "error"
      );
      return false;
    }

    if (!confirm("¿Está seguro de que desea eliminar este proveedor?")) {
      return false;
    }

    let suppliers = Storage.getSuppliers();
    const initialLength = suppliers.length;
    suppliers = suppliers.filter((s) => s.id !== id);

    if (suppliers.length < initialLength) {
      Storage.saveSuppliers(suppliers);
      UI.showNotification("Proveedor eliminado con éxito", "success");
      return true;
    } else {
      UI.showNotification("Error al intentar eliminar el proveedor.", "error");
      return false;
    }
  },
};

// Exportar funciones globales para HTML
window.deleteSupplier = Suppliers.deleteSupplier;
