// Events Module - Manejadores de eventos
const Events = {
  handleLogin(e) {
    e.preventDefault();
    const password = document.getElementById("password-input").value.trim();

    const loginResult = Auth.login(password);

    if (loginResult.success) {
      UI.hideLoginModal();
      Inventory.loadAndRefreshUI();
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

      document
        .getElementById("form-venta")
        .addEventListener("submit", (e) => this.handleRegisterSale(e));

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
