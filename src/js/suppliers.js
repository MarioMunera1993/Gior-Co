/**
 * MÓDULO DE GESTIÓN DE PROVEEDORES
 * ================================
 * Gestiona el registro de proveedores via API
 */

const Suppliers = {
  async loadAndRefreshUI() {
    try {
      const suppliers = await Storage.getSuppliers();
      this.updateStats(suppliers);
      this.applyFiltersAndRender(suppliers);
      if (Auth.isAdmin()) {
        if (typeof Charts !== 'undefined' && Charts.initSuppliersCharts) {
          Charts.initSuppliersCharts(suppliers);
        }
      }
    } catch (e) {
      console.error("Error loading suppliers", e);
    }
  },

  updateStats(suppliers) {
    if (!suppliers) return;
    if (document.getElementById("stat-proveedores-total"))
      document.getElementById("stat-proveedores-total").textContent = suppliers.length;
  },

  async applyFiltersAndRender(suppliers) {
    if (!suppliers) suppliers = await Storage.getSuppliers();

    const searchInput = document.getElementById("buscar-proveedores");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

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

  renderSuppliersTable(suppliers) {
    try {
      const tbody = document.getElementById("tabla-proveedores").querySelector("tbody");
      tbody.innerHTML = "";
      const isAdmin = Auth.isAdmin();

      suppliers.forEach((s) => {
        const row = tbody.insertRow();

        row.className = "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150";

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

        if (row.cells[0]) row.cells[0].setAttribute("data-label", "Razón Social");
        if (row.cells[1]) row.cells[1].setAttribute("data-label", "Identificación");
        if (row.cells[2]) row.cells[2].setAttribute("data-label", "Contacto");
        if (row.cells[3]) row.cells[3].setAttribute("data-label", "Teléfono");
        if (row.cells[4]) row.cells[4].setAttribute("data-label", "Correo");
        if (row.cells[5]) row.cells[5].setAttribute("data-label", "Dirección");
      });
    } catch (error) {
      console.error("Error al renderizar tabla de proveedores:", error);
      UI.showNotification("Error al mostrar proveedores", "error");
    }
  },

  async addSupplier(razonSocial, identificacion, tipoIdentificacion, direccion, telefono, nombreContacto, correo) {
    if (!Auth.isAdmin()) {
      UI.showNotification("Permiso denegado.", "error");
      return false;
    }

    const validation = SupplierValidator.validateSupplier(razonSocial, identificacion, tipoIdentificacion, direccion, telefono, nombreContacto, correo);

    if (!validation.isValid) {
      validation.errors.forEach((error) => UI.showNotification(error, "error"));
      return false;
    }

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

    try {
      const result = await Storage.API.createSupplier(newSupplier);
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }
      UI.showNotification("Proveedor agregado con éxito", "success");
      await this.loadAndRefreshUI();
      return true;
    } catch (e) {
      UI.showNotification("Error al agregar proveedor", "error");
      return false;
    }
  },

  async editSupplier(id, razonSocial, identificacion, tipoIdentificacion, direccion, telefono, nombreContacto, correo) {
    const validation = SupplierValidator.validateSupplier(razonSocial, identificacion, tipoIdentificacion, direccion, telefono, nombreContacto, correo);

    if (!validation.isValid) {
      validation.errors.forEach((error) => UI.showNotification(error, "error"));
      return false;
    }

    const updateData = {
      id: id,
      razonSocial: razonSocial.trim(),
      identificacion: identificacion.trim(),
      tipoIdentificacion: tipoIdentificacion.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      nombreContacto: nombreContacto.trim(),
      correo: correo.trim().toLowerCase()
    };

    try {
      const result = await Storage.API.updateSupplier(updateData);
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }
      UI.showNotification("Proveedor actualizado con éxito", "success");
      await this.loadAndRefreshUI();
      return true;
    } catch (e) {
      UI.showNotification("Error al actualizar proveedor", "error");
      return false;
    }
  },

  async deleteSupplier(id) {
    if (!Auth.isAdmin()) {
      UI.showNotification("Permiso denegado.", "error");
      return false;
    }

    if (!confirm("¿Está seguro de que desea eliminar este proveedor?")) {
      return false;
    }

    try {
      const result = await Storage.API.deleteSupplier(id);
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }
      UI.showNotification("Proveedor eliminado con éxito", "success");
      await this.loadAndRefreshUI();
      return true;
    } catch (e) {
      UI.showNotification("Error al eliminar proveedor", "error");
      return false;
    }
  },
};

// Exportar funciones globales para HTML
window.deleteSupplier = Suppliers.deleteSupplier;
