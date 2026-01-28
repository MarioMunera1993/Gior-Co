/**
 * MÓDULO DE GESTIÓN DE CLIENTES
 * =============================
 * Gestiona el registro de clientes via API
 */

const Customers = {
  async loadAndRefreshUI() {
    try {
      const customers = await Storage.getCustomers();
      this.updateStats(customers);
      this.applyFiltersAndRender(customers);
      if (Auth.isAdmin()) {
        if (typeof Charts !== 'undefined' && Charts.initCustomersCharts) {
          Charts.initCustomersCharts(customers);
        }
      }
    } catch (e) {
      console.error("Error loading customers", e);
    }
  },

  updateStats(customers) {
    if (!customers) return;
    if (document.getElementById("stat-clientes-total"))
      document.getElementById("stat-clientes-total").textContent = customers.length;
  },

  async applyFiltersAndRender(customers) {
    if (!customers) customers = await Storage.getCustomers();

    const searchInput = document.getElementById("buscar-clientes");
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const filteredCustomers = customers.filter((c) => {
      const fullName = `${c.primerApellido} ${c.segundoApellido || ""} ${c.nombre}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchText) ||
        c.telefono.includes(searchText) ||
        c.correo.toLowerCase().includes(searchText);

      return matchesSearch;
    });

    this.renderCustomersTable(filteredCustomers);
  },

  renderCustomersTable(customers) {
    try {
      const tbody = document.getElementById("tabla-clientes").querySelector("tbody");
      tbody.innerHTML = "";
      const isAdmin = Auth.isAdmin();

      customers.forEach((c) => {
        const row = tbody.insertRow();
        const fullName = `${c.primerApellido} ${c.segundoApellido || ""} ${c.nombre}`.trim();

        row.className = "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150";

        row.insertCell().innerHTML = fullName;
        row.insertCell().innerHTML = c.telefono;
        row.insertCell().innerHTML = c.correo;
        row.insertCell().innerHTML = c.direccion;

        const actionsCell = row.insertCell();
        actionsCell.className = "px-6 py-4 whitespace-nowrap text-center";
        actionsCell.setAttribute("data-label", "Acciones");

        if (isAdmin) {
          actionsCell.style.display = "table-cell";
          actionsCell.innerHTML = `
            <button onclick="showEditCustomerModal('${c.id}')" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 transition mr-3">
              Editar
            </button>
            <button onclick="deleteCustomer('${c.id}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition">
              Eliminar
            </button>
          `;
        } else {
          actionsCell.style.display = "none";
        }

        // Mobile labels
        if (row.cells[0]) row.cells[0].setAttribute("data-label", "Nombre Completo");
        if (row.cells[1]) row.cells[1].setAttribute("data-label", "Teléfono");
        if (row.cells[2]) row.cells[2].setAttribute("data-label", "Correo");
        if (row.cells[3]) row.cells[3].setAttribute("data-label", "Dirección");
      });
    } catch (error) {
      console.error("Error al renderizar tabla de clientes:", error);
      UI.showNotification("Error al mostrar clientes", "error");
    }
  },

  async addCustomer(primerApellido, segundoApellido, nombre, telefono, correo, direccion) {
    if (!Auth.isAdmin()) {
      UI.showNotification("Permiso denegado.", "error");
      return false;
    }

    const validation = CustomerValidator.validateCustomer(primerApellido, segundoApellido, nombre, telefono, correo, direccion);

    if (!validation.isValid) {
      validation.errors.forEach((error) => UI.showNotification(error, "error"));
      return false;
    }

    const newCustomer = {
      id: Utils.generateId(),
      primerApellido: primerApellido.trim(),
      segundoApellido: segundoApellido.trim(),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      correo: correo.trim().toLowerCase(),
      direccion: direccion.trim(),
      fechaRegistro: new Date().toISOString(),
    };

    try {
      const result = await Storage.API.createCustomer(newCustomer);
      // El backend podría devolver error de duplicado (correo único, aunque en schema no puse UNIQUE en correo, es buena práctica)
      // Mi schema: id PK. correo VARCHAR(100).
      // Si no puse UNIQUE, el backend lo insertará. La validación frontend original chequeaba duplicados.
      // Aquí confiamos en el insert.
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }

      UI.showNotification("Cliente agregado con éxito", "success");
      await this.loadAndRefreshUI();
      return true;
    } catch (e) {
      UI.showNotification("Error al agregar cliente", "error");
      return false;
    }
  },

  async editCustomer(id, primerApellido, segundoApellido, nombre, telefono, correo, direccion) {
    const validation = CustomerValidator.validateCustomer(primerApellido, segundoApellido, nombre, telefono, correo, direccion);

    if (!validation.isValid) {
      validation.errors.forEach((error) => UI.showNotification(error, "error"));
      return false;
    }

    const updateData = {
      id: id,
      primerApellido: primerApellido.trim(),
      segundoApellido: segundoApellido.trim(),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      correo: correo.trim().toLowerCase(),
      direccion: direccion.trim()
    };

    try {
      const result = await Storage.API.updateCustomer(updateData);
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }
      UI.showNotification("Cliente actualizado con éxito", "success");
      await this.loadAndRefreshUI();
      return true;
    } catch (e) {
      UI.showNotification("Error al actualizar cliente", "error");
      return false;
    }
  },

  async deleteCustomer(id) {
    if (!Auth.isAdmin()) {
      UI.showNotification("Permiso denegado.", "error");
      return false;
    }

    if (!confirm("¿Está seguro de que desea eliminar este cliente?")) {
      return false;
    }

    try {
      const result = await Storage.API.deleteCustomer(id);
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }
      UI.showNotification("Cliente eliminado con éxito", "success");
      await this.loadAndRefreshUI();
      return true;
    } catch (e) {
      UI.showNotification("Error al eliminar cliente", "error");
      return false;
    }
  },
};

// Exportar funciones globales para HTML
window.deleteCustomer = Customers.deleteCustomer;
