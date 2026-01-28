/**
 * MÓDULO DE INTERFAZ DE USUARIO
 * =============================
 * Gestiona:
 * - Visibilidad de modales (login, edición de productos, clientes, proveedores)
 * - Validación de permisos
 * - Modo oscuro/claro
 * - Notificaciones visuales
 */

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

  async showEditModal(productId) {
    try {
      const inventory = await Storage.getInventory();
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
    } catch (e) {
      UI.showNotification("Error al cargar producto.", "error");
    }
  },

  hideEditModal() {
    document.getElementById("edit-modal").classList.add("hidden");
  },

  async showEditCustomerModal(customerId) {
    try {
      const customers = await Storage.getCustomers();
      const customer = customers.find((c) => c.id === customerId);

      if (customer) {
        document.getElementById("edit-customer-id").value = customer.id;
        document.getElementById("edit-customer-primer-apellido").value = customer.primerApellido;
        document.getElementById("edit-customer-segundo-apellido").value = customer.segundoApellido || "";
        document.getElementById("edit-customer-nombre").value = customer.nombre;
        document.getElementById("edit-customer-telefono").value = customer.telefono;
        document.getElementById("edit-customer-correo").value = customer.correo;
        document.getElementById("edit-customer-direccion").value = customer.direccion;

        document.getElementById("edit-customer-modal").classList.remove("hidden");
      } else {
        UI.showNotification("Cliente no encontrado para editar.", "error");
      }
    } catch (e) {
      UI.showNotification("Error al cargar cliente.", "error");
    }
  },

  hideEditCustomerModal() {
    document.getElementById("edit-customer-modal").classList.add("hidden");
  },

  async showEditSupplierModal(supplierId) {
    try {
      const suppliers = await Storage.getSuppliers();
      const supplier = suppliers.find((s) => s.id === supplierId);

      if (supplier) {
        document.getElementById("edit-supplier-id").value = supplier.id;
        document.getElementById("edit-supplier-razon-social").value = supplier.razonSocial;
        document.getElementById("edit-supplier-identificacion").value = supplier.identificacion;
        document.getElementById("edit-supplier-tipo-identificacion").value = supplier.tipoIdentificacion;
        document.getElementById("edit-supplier-direccion").value = supplier.direccion;
        document.getElementById("edit-supplier-telefono").value = supplier.telefono;
        document.getElementById("edit-supplier-nombre-contacto").value = supplier.nombreContacto;
        document.getElementById("edit-supplier-correo").value = supplier.correo;

        document.getElementById("edit-supplier-modal").classList.remove("hidden");
      } else {
        UI.showNotification("Proveedor no encontrado para editar.", "error");
      }
    } catch (e) {
      UI.showNotification("Error al cargar proveedor.", "error");
    }
  },

  hideEditSupplierModal() {
    document.getElementById("edit-supplier-modal").classList.add("hidden");
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
    // Manejo de Auth.getCurrentUser() que puede ser null si no hay sesion
    const user = Auth.getCurrentUser();
    const userInfo = Auth.isAuthenticated() && user
      ? `${user.username} | ${isAdmin ? "ADMIN" : "EMPLEADO"}`
      : "Sin sesión";

    document.getElementById("current-user-info").textContent = userInfo;
  },

  updateUIPermissions() {
    const isAdmin = Auth.isAdmin();

    UI.updateCurrentUserInfo();

    const addSection = document.getElementById("add-product-section");
    const chartsSection = document.getElementById("inventory-charts-section");
    const salesDashboardSection = document.getElementById("sales-dashboard-section");
    const salesChartsSection = document.getElementById("sales-charts-section");
    const actionsHeader = document.getElementById("acciones-header");
    const salesActionsHeader = document.getElementById("acciones-ventas-header");

    if (addSection) addSection.classList.toggle("hidden", !isAdmin);
    if (chartsSection) chartsSection.classList.toggle("hidden", !isAdmin);
    if (salesDashboardSection) salesDashboardSection.classList.toggle("hidden", !isAdmin);
    if (salesChartsSection) salesChartsSection.classList.toggle("hidden", !isAdmin);
    if (actionsHeader) actionsHeader.style.display = isAdmin ? "table-cell" : "none";
    if (salesActionsHeader) salesActionsHeader.style.display = isAdmin ? "table-cell" : "none";

    // Recargar tablas con nuevos permisos (mostrar/ocultar botones)
    if (typeof Inventory !== 'undefined') Inventory.loadAndRefreshUI();
    if (typeof Sales !== 'undefined') Sales.renderSalesTable();
  },

  toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
    document.getElementById("dark-mode-label").textContent = isDark ? "Light" : "Dark";

    const dot = document.querySelector("#toggle-dark .dot");
    dot.classList.toggle("mr-2", !isDark);
    dot.classList.toggle("ml-auto", isDark);

    if (Auth.isAdmin()) {
      // Charts might need reload logic or not, depending on implementation
      if (AppState.currentTab === "inventario" && typeof Charts !== 'undefined') Charts.initInventoryCharts();
      if (AppState.currentTab === "ventas" && typeof Charts !== 'undefined') Charts.initSalesCharts();
    }
  },

  initDarkMode() {
    const darkModeEnabled = localStorage.getItem("darkMode") === "enabled";
    if (darkModeEnabled) {
      document.documentElement.classList.add("dark");
      document.getElementById("dark-mode-label").textContent = "Light";
      const dot = document.querySelector("#toggle-dark .dot");
      if (dot) {
        dot.classList.add("ml-auto");
        dot.classList.remove("mr-2");
      }
    } else {
      const label = document.getElementById("dark-mode-label");
      if (label) label.textContent = "Dark";
    }
  },

  showTab(tabName) {
    if (typeof AppState !== 'undefined') AppState.currentTab = tabName;

    document.querySelectorAll(".tab-content").forEach((content) => content.classList.add("hidden"));
    const moduleTab = document.getElementById(`module-${tabName}`);
    if (moduleTab) moduleTab.classList.remove("hidden");

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
      if (Sales.populateCustomerSelect) Sales.populateCustomerSelect();
      Sales.renderSalesTable();
      if (Auth.isAdmin()) {
        Sales.updateDashboard();
        if (typeof Charts !== 'undefined') Charts.initSalesCharts();
      }
    } else if (tabName === "clientes") {
      Customers.loadAndRefreshUI();
    } else if (tabName === "proveedores") {
      Suppliers.loadAndRefreshUI();
    }
  },
};

// Exportar funciones globales para HTML
window.showEditModal = UI.showEditModal;
window.hideEditModal = UI.hideEditModal;
window.showEditCustomerModal = UI.showEditCustomerModal;
window.hideEditCustomerModal = UI.hideEditCustomerModal;
window.showEditSupplierModal = UI.showEditSupplierModal;
window.hideEditSupplierModal = UI.hideEditSupplierModal;
window.showLoginModal = UI.showLoginModal;
