/**
 * MÓDULO DE EVENTOS
 * =================
 * Orquesta los manejadores de eventos de toda la aplicación
 * - Login/Logout
 * - Validación de formularios
 * - Operaciones CRUD para todos los módulos
 * - Cambio de pestañas
 * - Búsqueda y filtros
 */

const Events = {
  async handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById("password-input").value.trim();

    const loginResult = await Auth.login(password);

    if (loginResult.success) {
      UI.hideLoginModal();
      await Inventory.loadAndRefreshUI();
      UI.updateUIPermissions();
      UI.showNotification(
        `Bienvenido, ${loginResult.user.username} (${loginResult.user.role === ROLES.ADMIN ? "Admin" : "Empleado"})`,
        "info"
      );

      if (AppState.currentTab === "inventario") {
        UI.showTab("inventario");
      } else {
        UI.showTab("ventas");
      }
    } else {
      UI.showNotification(loginResult.error, "error");
    }
  },

  handleLogout(e) {
    e.preventDefault();
    Auth.logout();
    UI.showLoginModal();
  },

  handleAddProduct(e) {
    e.preventDefault();

    const codigo = document.getElementById("codigo").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const talla = document.getElementById("talla").value;
    const color = document.getElementById("color").value.trim();
    const cantidad = document.getElementById("cantidad").value;
    const precio = document.getElementById("precio").value;

    if (Inventory.addProduct(codigo, nombre, talla, color, cantidad, precio)) {
      e.target.reset();
      Inventory.loadAndRefreshUI();
    }
  },

  handleEditProduct(e) {
    e.preventDefault();

    const id = document.getElementById("edit-id").value;
    const nombre = document.getElementById("edit-nombre").value.trim();
    const talla = document.getElementById("edit-talla").value;
    const color = document.getElementById("edit-color").value.trim();
    const cantidad = document.getElementById("edit-cantidad").value;
    const precio = document.getElementById("edit-precio").value;

    if (Inventory.editProduct(id, nombre, talla, color, cantidad, precio)) {
      UI.hideEditModal();
      Inventory.loadAndRefreshUI();
    }
  },

  handleAddToCart(e) {
    e.preventDefault();

    const selectedOption = document.getElementById("venta-producto").value;
    const cantidadVendida = document.getElementById("venta-cantidad").value;
    const precioUnitarioFinal = document.getElementById("venta-precio-final").value;

    if (!selectedOption || selectedOption.trim() === "") {
      UI.showNotification("Seleccione un producto válido.", "error");
      return;
    }

    const parts = selectedOption.split("|");
    if (parts.length !== 2) {
      UI.showNotification("Seleccione un producto válido.", "error");
      return;
    }

    const idProducto = parts[0];
    const codigoProducto = parts[1];

    // Obtener info del producto del inventario
    Storage.getInventory().then(inventory => {
      // Buscar por ID (comparación flexible: string o número)
      const producto = inventory.find(p => String(p.id) === String(idProducto));

      if (!producto) {
        console.error("Producto no encontrado. ID buscado:", idProducto, "Inventario:", inventory);
        UI.showNotification("Producto no encontrado.", "error");
        return;
      }

      // Validar cantidad y precio
      const validation = InputValidator.validateSale(cantidadVendida, precioUnitarioFinal, producto.nombre);
      if (!validation.isValid) {
        validation.errors.forEach((error) => UI.showNotification(error, "error"));
        return;
      }

      // Agregar al carrito
      Sales.addToCart(producto, cantidadVendida, precioUnitarioFinal);

      // Limpiar campos de producto (mantener cliente y fecha)
      document.getElementById("venta-producto").value = "";
      document.getElementById("venta-cantidad").value = "1";
      document.getElementById("venta-precio-final").value = "";
    }).catch(error => {
      console.error("Error al obtener inventario:", error);
      UI.showNotification("Error al cargar productos", "error");
    });
  },

  handleRegisterSale(e) {
    e.preventDefault();

    const selectedOption = document.getElementById("venta-producto").value;
    const cantidadVendida = document.getElementById("venta-cantidad").value;
    const precioUnitarioFinal = document.getElementById(
      "venta-precio-final"
    ).value;
    const detalle = document.getElementById("venta-detalle").value;

    if (
      Sales.registerSale(
        selectedOption,
        cantidadVendida,
        precioUnitarioFinal,
        detalle
      )
    ) {
      e.target.reset();
      Inventory.loadAndRefreshUI();
      Sales.renderSalesTable();
      Sales.updateDashboard();
    }
  },

  handleAddCustomer(e) {
    e.preventDefault();

    const primerApellido =
      document.getElementById("customer-primer-apellido").value;
    const segundoApellido =
      document.getElementById("customer-segundo-apellido").value;
    const nombre = document.getElementById("customer-nombre").value;
    const telefono = document.getElementById("customer-telefono").value;
    const correo = document.getElementById("customer-correo").value;
    const direccion = document.getElementById("customer-direccion").value;

    if (
      Customers.addCustomer(
        primerApellido,
        segundoApellido,
        nombre,
        telefono,
        correo,
        direccion
      )
    ) {
      e.target.reset();
      Customers.loadAndRefreshUI();
    }
  },

  handleEditCustomer(e) {
    e.preventDefault();

    const id = document.getElementById("edit-customer-id").value;
    const primerApellido = document.getElementById(
      "edit-customer-primer-apellido"
    ).value;
    const segundoApellido = document.getElementById(
      "edit-customer-segundo-apellido"
    ).value;
    const nombre = document.getElementById("edit-customer-nombre").value;
    const telefono = document.getElementById("edit-customer-telefono").value;
    const correo = document.getElementById("edit-customer-correo").value;
    const direccion = document.getElementById("edit-customer-direccion").value;

    if (
      Customers.editCustomer(
        id,
        primerApellido,
        segundoApellido,
        nombre,
        telefono,
        correo,
        direccion
      )
    ) {
      UI.hideEditCustomerModal();
      Customers.loadAndRefreshUI();
    }
  },

  handleAddSupplier(e) {
    e.preventDefault();

    const razonSocial = document.getElementById("supplier-razon-social").value;
    const identificacion = document.getElementById(
      "supplier-identificacion"
    ).value;
    const tipoIdentificacion = document.getElementById(
      "supplier-tipo-identificacion"
    ).value;
    const direccion = document.getElementById("supplier-direccion").value;
    const telefono = document.getElementById("supplier-telefono").value;
    const nombreContacto = document.getElementById(
      "supplier-nombre-contacto"
    ).value;
    const correo = document.getElementById("supplier-correo").value;

    if (
      Suppliers.addSupplier(
        razonSocial,
        identificacion,
        tipoIdentificacion,
        direccion,
        telefono,
        nombreContacto,
        correo
      )
    ) {
      e.target.reset();
      Suppliers.loadAndRefreshUI();
    }
  },

  handleEditSupplier(e) {
    e.preventDefault();

    const id = document.getElementById("edit-supplier-id").value;
    const razonSocial = document.getElementById(
      "edit-supplier-razon-social"
    ).value;
    const identificacion = document.getElementById(
      "edit-supplier-identificacion"
    ).value;
    const tipoIdentificacion = document.getElementById(
      "edit-supplier-tipo-identificacion"
    ).value;
    const direccion = document.getElementById("edit-supplier-direccion").value;
    const telefono = document.getElementById("edit-supplier-telefono").value;
    const nombreContacto = document.getElementById(
      "edit-supplier-nombre-contacto"
    ).value;
    const correo = document.getElementById("edit-supplier-correo").value;

    if (
      Suppliers.editSupplier(
        id,
        razonSocial,
        identificacion,
        tipoIdentificacion,
        direccion,
        telefono,
        nombreContacto,
        correo
      )
    ) {
      UI.hideEditSupplierModal();
      Suppliers.loadAndRefreshUI();
    }
  },

  initializeEventListeners() {
    try {
      document
        .getElementById("toggle-dark")
        .addEventListener("click", () => UI.toggleDarkMode());

      document
        .getElementById("form-login")
        .addEventListener("submit", this.handleLogin);

      const logoutBtn = document.getElementById("logout-btn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => this.handleLogout(e));
      }

      document
        .getElementById("form-producto")
        .addEventListener("submit", (e) => this.handleAddProduct(e));

      document
        .getElementById("form-editar-producto")
        .addEventListener("submit", (e) => this.handleEditProduct(e));

      // Botón agregar al carrito
      const btnAgregarCarrito = document.getElementById("btn-agregar-carrito");
      if (btnAgregarCarrito) {
        btnAgregarCarrito.addEventListener("click", (e) => this.handleAddToCart(e));
      }

      // Botón finalizar venta
      const btnFinalizarVenta = document.getElementById("btn-finalizar-venta");
      if (btnFinalizarVenta) {
        btnFinalizarVenta.addEventListener("click", () => Sales.finalizeSale());
      }

      // Botón limpiar carrito
      const btnLimpiarCarrito = document.getElementById("btn-limpiar-carrito");
      if (btnLimpiarCarrito) {
        btnLimpiarCarrito.addEventListener("click", () => {
          if (confirm("¿Desea limpiar el carrito?")) {
            Sales.clearCart();
          }
        });
      }

      // Formulario de clientes
      const formAgregarCliente = document.getElementById("form-cliente");
      if (formAgregarCliente) {
        formAgregarCliente.addEventListener("submit", (e) =>
          this.handleAddCustomer(e)
        );
      }

      const formEditarCliente = document.getElementById(
        "form-editar-cliente"
      );
      if (formEditarCliente) {
        formEditarCliente.addEventListener("submit", (e) =>
          this.handleEditCustomer(e)
        );
      }

      // Búsqueda de clientes
      const buscarClientes = document.getElementById("buscar-clientes");
      if (buscarClientes) {
        buscarClientes.addEventListener("input", () =>
          Customers.applyFiltersAndRender()
        );
      }

      const limpiarFiltrosClientes = document.getElementById(
        "limpiar-filtros-clientes"
      );
      if (limpiarFiltrosClientes) {
        limpiarFiltrosClientes.addEventListener("click", () => {
          document.getElementById("buscar-clientes").value = "";
          Customers.applyFiltersAndRender();
        });
      }

      // Formulario de proveedores
      const formAgregarProveedor = document.getElementById("form-proveedor");
      if (formAgregarProveedor) {
        formAgregarProveedor.addEventListener("submit", (e) =>
          this.handleAddSupplier(e)
        );
      }

      const formEditarProveedor = document.getElementById(
        "form-editar-proveedor"
      );
      if (formEditarProveedor) {
        formEditarProveedor.addEventListener("submit", (e) =>
          this.handleEditSupplier(e)
        );
      }

      // Búsqueda de proveedores
      const buscarProveedores = document.getElementById("buscar-proveedores");
      if (buscarProveedores) {
        buscarProveedores.addEventListener("input", () =>
          Suppliers.applyFiltersAndRender()
        );
      }

      const limpiarFiltrosProveedores = document.getElementById(
        "limpiar-filtros-proveedores"
      );
      if (limpiarFiltrosProveedores) {
        limpiarFiltrosProveedores.addEventListener("click", () => {
          document.getElementById("buscar-proveedores").value = "";
          Suppliers.applyFiltersAndRender();
        });
      }

      // Filtros
      document
        .getElementById("buscar")
        .addEventListener("input", () => Inventory.applyFiltersAndRender());

      document
        .getElementById("filtro-talla")
        .addEventListener("change", () => Inventory.applyFiltersAndRender());

      document
        .getElementById("filtro-color")
        .addEventListener("input", () => Inventory.applyFiltersAndRender());

      document
        .getElementById("filtro-stock")
        .addEventListener("change", () => Inventory.applyFiltersAndRender());

      document
        .getElementById("filtro-precio-min")
        .addEventListener("input", () => Inventory.applyFiltersAndRender());

      document
        .getElementById("filtro-precio-max")
        .addEventListener("input", () => Inventory.applyFiltersAndRender());

      document
        .getElementById("limpiar-filtros")
        .addEventListener("click", () => {
          document.getElementById("buscar").value = "";
          document.getElementById("filtro-talla").value = "";
          document.getElementById("filtro-color").value = "";
          document.getElementById("filtro-stock").value = "";
          document.getElementById("filtro-precio-min").value = "";
          document.getElementById("filtro-precio-max").value = "";
          Inventory.applyFiltersAndRender();
        });

      // Tabs
      document.querySelectorAll(".tab-button").forEach((button) => {
        button.addEventListener("click", (e) => UI.showTab(e.target.dataset.tab));
      });
    } catch (error) {
      console.error("Error al inicializar event listeners:", error);
    }
  },
};
