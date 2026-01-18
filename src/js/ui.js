// UI Module - Funciones de interfaz de usuario
const UI = {
  showLoginModal() {
    document.getElementById("password-input").value = "";
    document.getElementById("login-modal").classList.remove("hidden");
    document.getElementById("app-content").classList.add("hidden");
  },

  hideLoginModal() {
    document.getElementById("login-modal").classList.add("hidden");
    if (Auth.isAuthenticated()) {
      document.getElementById("app-content").classList.remove("hidden");
    }
  },

  showEditModal(productId) {
    const inventory = Storage.getInventory();
    const product = inventory.find((p) => p.id === productId);

    if (product) {
      document.getElementById("edit-id").value = product.id;
      document.getElementById("edit-codigo").value = product.codigo;
      document.getElementById("edit-nombre").value = product.nombre;
      document.getElementById("edit-talla").value = product.talla;
      document.getElementById("edit-color").value = product.color;
      document.getElementById("edit-cantidad").value = product.cantidad;
      document.getElementById("edit-precio").value = product.precio;

      document.getElementById("edit-modal").classList.remove("hidden");
    } else {
      UI.showNotification("Producto no encontrado para editar.", "error");
    }
  },

  hideEditModal() {
    document.getElementById("edit-modal").classList.add("hidden");
  },

  showEditCustomerModal(customerId) {
    const customers = Storage.getCustomers();
    const customer = customers.find((c) => c.id === customerId);

    if (customer) {
      document.getElementById("edit-customer-id").value = customer.id;
      document.getElementById("edit-customer-primer-apellido").value =
        customer.primerApellido;
      document.getElementById("edit-customer-segundo-apellido").value =
        customer.segundoApellido || "";
      document.getElementById("edit-customer-nombre").value = customer.nombre;
      document.getElementById("edit-customer-telefono").value = customer.telefono;
      document.getElementById("edit-customer-correo").value = customer.correo;
      document.getElementById("edit-customer-direccion").value =
        customer.direccion;

      document.getElementById("edit-customer-modal").classList.remove("hidden");
    } else {
      UI.showNotification("Cliente no encontrado para editar.", "error");
    }
  },

  hideEditCustomerModal() {
    document.getElementById("edit-customer-modal").classList.add("hidden");
  },

  showNotification(message, type = "info") {
    try {
      const container = document.getElementById("notificaciones");
      const notification = document.createElement("div");

      let className = "bg-info";
      if (type === "success") className = "bg-success";
      if (type === "error") className = "bg-error";

      notification.className = `notificacion-item ${className}`;
      notification.textContent = message;

      container.prepend(notification);

      setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 500);
      }, 5000);
    } catch (error) {
      console.error("Error al mostrar notificación:", error);
    }
  },

  updateCurrentUserInfo() {
    const isAdmin = Auth.isAdmin();
    const userInfo = Auth.isAuthenticated()
      ? `${Auth.getCurrentUser().username} | ${isAdmin ? "ADMIN" : "EMPLEADO"}`
      : "Sin sesión";

    document.getElementById("current-user-info").textContent = userInfo;
  },

  updateUIPermissions() {
    const isAdmin = Auth.isAdmin();

    UI.updateCurrentUserInfo();

    const addSection = document.getElementById("add-product-section");
    const chartsSection = document.getElementById("inventory-charts-section");
    const salesDashboardSection = document.getElementById(
      "sales-dashboard-section"
    );
    const salesChartsSection = document.getElementById("sales-charts-section");
    const actionsHeader = document.getElementById("acciones-header");
    const salesActionsHeader = document.getElementById("acciones-ventas-header");

    if (addSection) addSection.classList.toggle("hidden", !isAdmin);
    if (chartsSection) chartsSection.classList.toggle("hidden", !isAdmin);
    if (salesDashboardSection)
      salesDashboardSection.classList.toggle("hidden", !isAdmin);
    if (salesChartsSection) salesChartsSection.classList.toggle("hidden", !isAdmin);
    if (actionsHeader)
      actionsHeader.style.display = isAdmin ? "table-cell" : "none";
    if (salesActionsHeader)
      salesActionsHeader.style.display = isAdmin ? "table-cell" : "none";

    Inventory.renderInventoryTable();
    Sales.renderSalesTable();
  },

  toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
    document.getElementById("dark-mode-label").textContent = isDark
      ? "Light"
      : "Dark";

    const dot = document.querySelector("#toggle-dark .dot");
    dot.classList.toggle("mr-2", !isDark);
    dot.classList.toggle("ml-auto", isDark);

    if (Auth.isAdmin()) {
      if (AppState.currentTab === "inventario") Charts.initInventoryCharts();
      if (AppState.currentTab === "ventas") Charts.initSalesCharts();
    }
  },

  initDarkMode() {
    const darkModeEnabled = localStorage.getItem("darkMode") === "enabled";
    if (darkModeEnabled) {
      document.documentElement.classList.add("dark");
      document.getElementById("dark-mode-label").textContent = "Light";
      const dot = document.querySelector("#toggle-dark .dot");
      dot.classList.add("ml-auto");
      dot.classList.remove("mr-2");
    } else {
      document.getElementById("dark-mode-label").textContent = "Dark";
    }
  },

  showTab(tabName) {
    AppState.currentTab = tabName;
    document
      .querySelectorAll(".tab-content")
      .forEach((content) => content.classList.add("hidden"));
    document.getElementById(`module-${tabName}`).classList.remove("hidden");

    document.querySelectorAll(".tab-button").forEach((button) => {
      button.classList.remove("tab-active");
      if (button.dataset.tab === tabName) {
        button.classList.add("tab-active");
      }
    });

    if (tabName === "inventario") {
      Inventory.loadAndRefreshUI();
    } else if (tabName === "ventas") {
      Sales.populateProductSelect();
      Sales.renderSalesTable();
      if (Auth.isAdmin()) {
        Sales.updateDashboard();
        Charts.initSalesCharts();
      }
    } else if (tabName === "clientes") {
      Customers.loadAndRefreshUI();
    }
  },
};

// Exportar funciones globales para HTML
window.showEditModal = UI.showEditModal;
window.hideEditModal = UI.hideEditModal;
window.showEditCustomerModal = UI.showEditCustomerModal;
window.hideEditCustomerModal = UI.hideEditCustomerModal;
window.showLoginModal = UI.showLoginModal;
