/**
 * MÓDULO DE GESTIÓN DE CLIENTES
 * =============================
 * Gestiona el registro de clientes
 * - Agregar clientes (nombre, apellidos, teléfono, correo, dirección)
 * - Editar y eliminar clientes
 * - Búsqueda y filtrado de clientes
 * - Estadísticas de clientes (total registrados)
 */

const Customers = {
  loadAndRefreshUI() {
    this.updateStats();
    this.applyFiltersAndRender();
    if (Auth.isAdmin()) {
      Charts.initCustomersCharts();
    }
  },

  updateStats() {
    const customers = Storage.getCustomers();
    document.getElementById("stat-clientes-total").textContent =
      customers.length;
  },

  applyFiltersAndRender() {
    const customers = Storage.getCustomers();
    const searchText = document
      .getElementById("buscar-clientes")
      .value.toLowerCase()
      .trim();

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

  renderCustomersTable(customers = Storage.getCustomers()) {
    try {
      const tbody = document
        .getElementById("tabla-clientes")
        .querySelector("tbody");
      tbody.innerHTML = "";
      const isAdmin = Auth.isAdmin();

      customers.forEach((c) => {
        const row = tbody.insertRow();
        const fullName = `${c.primerApellido} ${c.segundoApellido || ""} ${c.nombre}`.trim();

        row.className =
          "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150";

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

        row.cells[0].setAttribute("data-label", "Nombre Completo");
        row.cells[1].setAttribute("data-label", "Teléfono");
        row.cells[2].setAttribute("data-label", "Correo");
        row.cells[3].setAttribute("data-label", "Dirección");
      });
    } catch (error) {
      console.error("Error al renderizar tabla de clientes:", error);
      UI.showNotification("Error al mostrar clientes", "error");
    }
  },

  addCustomer(
    primerApellido,
    segundoApellido,
    nombre,
    telefono,
    correo,
    direccion
  ) {
    if (!Auth.isAdmin()) {
      UI.showNotification(
        "Permiso denegado. Solo Administradores pueden agregar clientes.",
        "error"
      );
      return false;
    }

    // Validación
    const validation = CustomerValidator.validateCustomer(
      primerApellido,
      segundoApellido,
      nombre,
      telefono,
      correo,
      direccion
    );

    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        UI.showNotification(error, "error")
      );
      return false;
    }

    let customers = Storage.getCustomers();

    const exists = customers.some(
      (cust) =>
        cust.correo.toLowerCase() ===
        correo.trim().toLowerCase()
    );

    if (!exists) {
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

      customers.push(newCustomer);
      Storage.saveCustomers(customers);

      UI.showNotification("Cliente agregado con éxito", "success");
      return true;
    } else {
      UI.showNotification("Error: El correo ya está registrado.", "error");
      return false;
    }
  },

  editCustomer(
    id,
    primerApellido,
    segundoApellido,
    nombre,
    telefono,
    correo,
    direccion
  ) {
    const customers = Storage.getCustomers();

    // Validación
    const validation = CustomerValidator.validateCustomer(
      primerApellido,
      segundoApellido,
      nombre,
      telefono,
      correo,
      direccion
    );

    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        UI.showNotification(error, "error")
      );
      return false;
    }

    const index = customers.findIndex((c) => c.id === id);

    if (index !== -1) {
      const originalEmail = customers[index].correo;
      const newEmail = correo.trim().toLowerCase();

      // Verificar si el correo ya existe (excluir el correo actual del cliente)
      const emailExists = customers.some(
        (c) => c.correo === newEmail && c.id !== id
      );

      if (emailExists) {
        UI.showNotification("Error: El correo ya está registrado.", "error");
        return false;
      }

      customers[index] = {
        id: id,
        primerApellido: primerApellido.trim(),
        segundoApellido: segundoApellido.trim(),
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        correo: newEmail,
        direccion: direccion.trim(),
        fechaRegistro: customers[index].fechaRegistro,
      };

      Storage.saveCustomers(customers);
      UI.showNotification("Cliente actualizado con éxito", "success");
      return true;
    } else {
      UI.showNotification("Error: Cliente no encontrado.", "error");
      return false;
    }
  },

  deleteCustomer(id) {
    if (!Auth.isAdmin()) {
      UI.showNotification(
        "Permiso denegado. Solo Administradores pueden eliminar.",
        "error"
      );
      return false;
    }

    if (!confirm("¿Está seguro de que desea eliminar este cliente?")) {
      return false;
    }

    let customers = Storage.getCustomers();
    const initialLength = customers.length;
    customers = customers.filter((c) => c.id !== id);

    if (customers.length < initialLength) {
      Storage.saveCustomers(customers);
      UI.showNotification("Cliente eliminado con éxito", "success");
      return true;
    } else {
      UI.showNotification("Error al intentar eliminar el cliente.", "error");
      return false;
    }
  },
};

// Exportar funciones globales para HTML
window.deleteCustomer = Customers.deleteCustomer;
