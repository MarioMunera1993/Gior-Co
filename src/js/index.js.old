const INVENTORY_STORAGE_KEY = "inventoryData_v1";
const SALES_STORAGE_KEY = "salesData_v1";
const USER_STORAGE_KEY = "userData_v1";

let charts = {};
let currentTab = "inventario";
let currentUser = null;

const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

const PASSWORDS = {
  "Gior&Co2026*": { role: ROLES.ADMIN, username: "Administrador" },
  "Gior2026*": { role: ROLES.EMPLOYEE, username: "Trabajador" },
};

function showLoginModal() {
  document.getElementById("password-input").value = "";
  document.getElementById("login-modal").classList.remove("hidden");
  document.getElementById("app-content").classList.add("hidden");
  currentUser = null;
  updateUIPermissions();
}
window.showLoginModal = showLoginModal;

function hideLoginModal() {
  document.getElementById("login-modal").classList.add("hidden");
  if (currentUser) {
    document.getElementById("app-content").classList.remove("hidden");
  }
}

function hideEditModal() {
  document.getElementById("edit-modal").classList.add("hidden");
}
window.hideEditModal = hideEditModal;

function handleLogin(e) {
  e.preventDefault();
  const password = document.getElementById("password-input").value.trim();

  const userConfig = PASSWORDS[password];

  if (userConfig) {
    currentUser = {
      username: userConfig.username,
      role: userConfig.role,
      id: crypto.randomUUID(),
    };

    hideLoginModal();
    loadInventoryAndRefreshUI();
    updateUIPermissions();
    showNotification(
      `Bienvenido, ${currentUser.username} (${currentUser.role === ROLES.ADMIN ? "Admin" : "Empleado"})`,
      "info",
    );

    if (currentTab === "inventario") {
      showTab("inventario");
    } else {
      showTab("ventas");
    }
  } else {
    showNotification("Contraseña incorrecta. Inténtelo de nuevo.", "error");
  }
}

function updateUIPermissions() {
  const isAdmin = currentUser?.role === ROLES.ADMIN;

  document.getElementById("current-user-info").textContent = currentUser
    ? `${currentUser.username} | ${isAdmin ? "ADMIN" : "EMPLEADO"}`
    : "Sin sesión";

  const addSection = document.getElementById("add-product-section");
  const chartsSection = document.getElementById("inventory-charts-section");
  const salesDashboardSection = document.getElementById(
    "sales-dashboard-section",
  );
  const salesChartsSection = document.getElementById("sales-charts-section");
  const actionsHeader = document.getElementById("acciones-header");

  // NUEVO: Cabecera de acciones de Ventas
  const salesActionsHeader = document.getElementById("acciones-ventas-header");

  if (addSection) addSection.classList.toggle("hidden", !isAdmin);
  if (chartsSection) chartsSection.classList.toggle("hidden", !isAdmin);
  if (salesDashboardSection)
    salesDashboardSection.classList.toggle("hidden", !isAdmin);
  if (salesChartsSection)
    salesChartsSection.classList.toggle("hidden", !isAdmin);
  if (actionsHeader)
    actionsHeader.style.display = isAdmin ? "table-cell" : "none";
  // NUEVO: Mostrar/Ocultar cabecera de acciones de ventas
  if (salesActionsHeader)
    salesActionsHeader.style.display = isAdmin ? "table-cell" : "none";

  renderInventoryTable();
  renderSalesTable();
}

function showTab(tabName) {
  currentTab = tabName;
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
    loadInventoryAndRefreshUI();
  } else if (tabName === "ventas") {
    populateSaleProductSelect();
    renderSalesTable();
    if (currentUser?.role === ROLES.ADMIN) {
      updateSalesDashboard();
      initSalesCharts();
    }
  }
}

function getInventory() {
  const data = localStorage.getItem(INVENTORY_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveInventory(inventory) {
  localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
}

function getSales() {
  const data = localStorage.getItem(SALES_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveSales(sales) {
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
}

function loadInventoryAndRefreshUI() {
  updateInventoryStats();
  applyFiltersAndRender();
  populateSaleProductSelect();
  if (currentUser?.role === ROLES.ADMIN) {
    initInventoryCharts();
  }
}

function showNotification(message, type = "info") {
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
}

function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDate(isoString) {
  // Validación básica para evitar el error de Invalid Date
  if (!isoString || isoString.startsWith("Invalid")) {
    return "Fecha no válida";
  }
  const date = new Date(isoString);
  // Si la fecha es inválida después de la conversión
  if (isNaN(date.getTime())) {
    return "Fecha no válida";
  }
  return date.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStockStatus(cantidad) {
  if (cantidad === 0)
    return {
      text: "Agotado",
      class: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      filter: "agotado",
    };
  if (cantidad <= 5)
    return {
      text: "Bajo",
      class:
        "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      filter: "bajo",
    };
  return {
    text: "OK",
    class: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    filter: "ok",
  };
}

function updateInventoryStats() {
  const inventory = getInventory();
  let totalProducts = 0;
  let totalAgotados = 0;
  let totalBajo = 0;
  let totalValue = 0;

  inventory.forEach((p) => {
    const cantidad = p.cantidad;
    totalProducts++;
    totalValue += cantidad * p.precio;

    if (cantidad === 0) {
      totalAgotados++;
    } else if (cantidad <= 5) {
      totalBajo++;
    }
  });

  document.getElementById("stat-total").textContent = inventory.length;
  document.getElementById("stat-agotados").textContent = totalAgotados;
  document.getElementById("stat-bajo").textContent = totalBajo;
  document.getElementById("stat-valor").textContent =
    formatCurrency(totalValue);
}

function updateSalesDashboard() {
  const sales = getSales();
  let totalVentas = sales.reduce((sum, sale) => sum + sale.cantidad, 0);
  let totalIngreso = sales.reduce((sum, sale) => sum + sale.totalVenta, 0);

  const today = new Date().toISOString().split("T")[0];
  const salesToday = sales.filter((sale) => sale.fecha.startsWith(today));
  let totalVentasHoy = salesToday.reduce((sum, sale) => sum + sale.cantidad, 0);
  let totalIngresoHoy = salesToday.reduce(
    (sum, sale) => sum + sale.totalVenta,
    0,
  );

  document.getElementById("stat-ventas-total").textContent = totalVentas;
  document.getElementById("stat-ingreso-total").textContent =
    formatCurrency(totalIngreso);
  document.getElementById("stat-ventas-hoy").textContent = totalVentasHoy;
  document.getElementById("stat-ingreso-hoy").textContent =
    formatCurrency(totalIngresoHoy);
}

function applyFiltersAndRender() {
  const inventory = getInventory();
  const searchText = document
    .getElementById("buscar")
    .value.toLowerCase()
    .trim();
  const filterTalla = document.getElementById("filtro-talla").value;
  const filterColor = document
    .getElementById("filtro-color")
    .value.toLowerCase()
    .trim();
  const filterStock = document.getElementById("filtro-stock").value;
  const filterPriceMin = parseFloat(
    document.getElementById("filtro-precio-min").value,
  );
  const filterPriceMax = parseFloat(
    document.getElementById("filtro-precio-max").value,
  );

  const filteredInventory = inventory.filter((p) => {
    const stockStatus = getStockStatus(p.cantidad).filter;

    const matchesSearch =
      p.codigo.toLowerCase().includes(searchText) ||
      p.nombre.toLowerCase().includes(searchText);

    const matchesTalla = !filterTalla || p.talla === filterTalla;

    const matchesColor =
      !filterColor || p.color.toLowerCase().includes(filterColor);

    const matchesStock = !filterStock || stockStatus === filterStock;

    const matchesPriceMin = isNaN(filterPriceMin) || p.precio >= filterPriceMin;

    const matchesPriceMax = isNaN(filterPriceMax) || p.precio <= filterPriceMax;

    return (
      matchesSearch &&
      matchesTalla &&
      matchesColor &&
      matchesStock &&
      matchesPriceMin &&
      matchesPriceMax
    );
  });

  renderInventoryTable(filteredInventory);
}

function renderInventoryTable(inventory = getInventory()) {
  const tbody = document
    .getElementById("tabla-inventario")
    .querySelector("tbody");
  tbody.innerHTML = "";
  const isAdmin = currentUser?.role === ROLES.ADMIN;

  inventory.forEach((p) => {
    const row = tbody.insertRow();
    const status = getStockStatus(p.cantidad);

    row.className =
      "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150";

    row.insertCell().innerHTML = p.codigo;
    row.insertCell().innerHTML = p.nombre;
    row.insertCell().innerHTML = p.talla;
    row.insertCell().innerHTML = p.color;

    const cantidadCell = row.insertCell();
    cantidadCell.className = "px-6 py-4 whitespace-nowrap text-right";
    cantidadCell.setAttribute("data-label", "Cantidad");
    cantidadCell.innerHTML = `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.class}">${p.cantidad}</span>`;

    row.insertCell().innerHTML = formatCurrency(p.precio);

    const actionsCell = row.insertCell();
    actionsCell.className = "px-6 py-4 whitespace-nowrap text-center";
    actionsCell.setAttribute("data-label", "Acciones");

    if (isAdmin) {
      actionsCell.style.display = "table-cell";
      actionsCell.innerHTML = `
                    <button onclick="showEditModal('${p.id}')" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 transition mr-3">
                        Editar
                    </button>
                    <button onclick="deleteProduct('${p.id}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition">
                        Eliminar
                    </button>
                `;
    } else {
      actionsCell.style.display = "none";
    }

    row.cells[0].setAttribute("data-label", "Código");
    row.cells[1].setAttribute("data-label", "Nombre");
    row.cells[2].setAttribute("data-label", "Talla");
    row.cells[3].setAttribute("data-label", "Color");
    row.cells[5].setAttribute("data-label", "Precio");
  });
}

function showEditModal(id) {
  const inventory = getInventory();
  const product = inventory.find((p) => p.id === id);

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
    showNotification("Producto no encontrado para editar.", "error");
  }
}
window.showEditModal = showEditModal;

function handleAddProduct(e) {
  e.preventDefault();

  if (currentUser?.role !== ROLES.ADMIN) {
    showNotification(
      "Permiso denegado. Solo Administradores pueden agregar productos.",
      "error",
    );
    return;
  }

  const codigo = document.getElementById("codigo").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const talla = document.getElementById("talla").value;
  const color = document.getElementById("color").value.trim();
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const precio = parseFloat(document.getElementById("precio").value);

  if (
    codigo &&
    nombre &&
    talla &&
    color &&
    !isNaN(cantidad) &&
    cantidad >= 0 &&
    !isNaN(precio) &&
    precio >= 0
  ) {
    let inventory = getInventory();

    const exists = inventory.some((p) => p.codigo === codigo);

    if (!exists) {
      const newProduct = {
        id: crypto.randomUUID(),
        codigo: codigo,
        nombre: nombre,
        talla: talla,
        color: color,
        cantidad: cantidad,
        precio: precio,
      };

      inventory.push(newProduct);
      saveInventory(inventory);

      e.target.reset();

      showNotification("Producto agregado con éxito", "success");
      loadInventoryAndRefreshUI();
    } else {
      showNotification("Error: El código de producto ya existe.", "error");
    }
  }
}

function handleEditProduct(e) {
  e.preventDefault();
  const inventory = getInventory();

  const id = document.getElementById("edit-id").value;
  const nombre = document.getElementById("edit-nombre").value.trim();
  const talla = document.getElementById("edit-talla").value;
  const color = document.getElementById("edit-color").value.trim();
  const cantidad = parseInt(document.getElementById("edit-cantidad").value);
  const precio = parseFloat(
    document.getElementById("edit-precio").value,
  ).toFixed(2);

  if (isNaN(cantidad) || isNaN(precio) || cantidad < 0 || precio < 0) {
    showNotification("Cantidad o Precio no son válidos.", "error");
    return;
  }

  const index = inventory.findIndex((p) => p.id === id);

  if (index !== -1) {
    inventory[index] = {
      id: id,
      codigo: inventory[index].codigo,
      nombre: nombre,
      talla: talla,
      color: color,
      cantidad: cantidad,
      precio: parseFloat(precio),
    };

    saveInventory(inventory);
    hideEditModal();
    showNotification("Producto actualizado con éxito", "success");
    loadInventoryAndRefreshUI();
  } else {
    showNotification("Error: Producto no encontrado.", "error");
    hideEditModal();
  }
}

function deleteProduct(id) {
  if (currentUser?.role !== ROLES.ADMIN) {
    showNotification(
      "Permiso denegado. Solo Administradores pueden eliminar.",
      "error",
    );
    return;
  }

  if (
    confirm("¿Está seguro de que desea eliminar este producto del inventario?")
  ) {
    let inventory = getInventory();
    const initialLength = inventory.length;
    inventory = inventory.filter((p) => p.id !== id);

    if (inventory.length < initialLength) {
      saveInventory(inventory);
      showNotification("Producto eliminado con éxito", "success");
      loadInventoryAndRefreshUI();
    } else {
      showNotification("Error al intentar eliminar el producto.", "error");
    }
  }
}
window.deleteProduct = deleteProduct;

function handleRegisterSale(e) {
  e.preventDefault();

  const selectedOption = document.getElementById("venta-producto").value;
  const parts = selectedOption.split("|");
  if (parts.length !== 2) {
    showNotification("Seleccione un producto válido.", "error");
    return;
  }

  const idVendido = parts[0];
  const productoVendido = parts[1];

  const cantidadVendida = parseInt(
    document.getElementById("venta-cantidad").value,
  );
  const precioUnitarioFinal = parseFloat(
    document.getElementById("venta-precio-final").value,
  );
  const detalle = document.getElementById("venta-detalle").value.trim();

  if (
    isNaN(cantidadVendida) ||
    cantidadVendida <= 0 ||
    isNaN(precioUnitarioFinal) ||
    precioUnitarioFinal < 0
  ) {
    showNotification("Cantidad o Precio final no son válidos.", "error");
    return;
  }

  let inventory = getInventory();
  const index = inventory.findIndex((p) => p.id === idVendido);

  if (index !== -1) {
    const producto = inventory[index];

    if (producto.cantidad < cantidadVendida) {
      showNotification(
        `Stock insuficiente. Solo quedan ${producto.cantidad} unidades.`,
        "error",
      );
      return;
    }

    producto.cantidad -= cantidadVendida;
    saveInventory(inventory);

    const totalVenta = cantidadVendida * precioUnitarioFinal;
    const sales = getSales();
    sales.push({
      id: crypto.randomUUID(),
      idProducto: idVendido,
      codigoProducto: producto.codigo,
      nombreProducto: producto.nombre,
      cantidad: cantidadVendida,
      precioUnitario: precioUnitarioFinal,
      totalVenta: totalVenta,
      detalle: detalle,
      fecha: new Date().toISOString(),
      vendedor: currentUser.username,
    });
    saveSales(sales);

    showNotification(
      `Venta registrada: ${cantidadVendida}x ${producto.nombre} por $${totalVenta.toFixed(2)}`,
      "success",
    );

    loadInventoryAndRefreshUI();
    renderSalesTable();

    e.target.reset();
    updateSaleFormPrice(producto.id);
  } else {
    showNotification(
      "Error: Producto no encontrado en el inventario.",
      "error",
    );
  }
}

function updateSaleFormPrice(productId) {
  const inventory = getInventory();
  const product = inventory.find((p) => p.id === productId);
  const priceInput = document.getElementById("venta-precio-final");

  if (product) {
    priceInput.value = product.precio.toFixed(2);
  } else {
    priceInput.value = "";
  }
}

function populateSaleProductSelect() {
  const select = document.getElementById("venta-producto");
  const inventory = getInventory();

  select.innerHTML = '<option value="">Seleccione un producto</option>';

  inventory.forEach((product) => {
    const option = document.createElement("option");
    option.value = `${product.id}|${product.codigo}`;
    option.textContent = `${product.codigo} - ${product.nombre} (${product.talla}) [Stock: ${product.cantidad}]`;
    if (product.cantidad === 0) {
      option.disabled = true;
      option.textContent += " - AGOTADO";
    }
    select.appendChild(option);
  });

  select.removeEventListener("change", handleSaleProductChange);
  select.addEventListener("change", handleSaleProductChange);

  const initialValue = select.value;
  if (initialValue) {
    updateSaleFormPrice(initialValue.split("|")[0]);
  }
}

function handleSaleProductChange(e) {
  const selectedValue = e.target.value;
  const productId = selectedValue ? selectedValue.split("|")[0] : null;
  updateSaleFormPrice(productId);
}

function renderSalesTable() {
  const tbody = document.getElementById("tabla-ventas").querySelector("tbody");
  const sales = getSales().sort(
    (a, b) => new Date(b.fecha) - new Date(a.fecha),
  );
  tbody.innerHTML = "";
  // NUEVO: Permiso de administrador para ver acciones
  const isAdmin = currentUser?.role === ROLES.ADMIN;
  const salesActionsHeader = document.getElementById("acciones-ventas-header");
  if (salesActionsHeader) {
    salesActionsHeader.style.display = isAdmin ? "table-cell" : "none";
  }

  sales.forEach((sale) => {
    const row = tbody.insertRow();
    row.className =
      "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150";

    row.insertCell().innerHTML = formatDate(sale.fecha);
    // row.insertCell().innerHTML = `${sale.codigoProducto} - ${sale.nombreProducto} (Vendedor: ${sale.vendedor})`; // Código original con el error
    // NUEVO: Corregir el formato de la columna de producto
    row.insertCell().innerHTML = `
                <div class="font-medium text-gray-900 dark:text-white">${sale.codigoProducto} - ${sale.nombreProducto}</div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Vendedor: ${sale.vendedor}</div>
            `;

    row.insertCell().innerHTML = sale.cantidad;
    row.insertCell().innerHTML = formatCurrency(sale.precioUnitario);
    row.insertCell().innerHTML = formatCurrency(sale.totalVenta);
    row.insertCell().innerHTML = sale.detalle || "-";

    // NUEVO: Celda de acciones para el administrador
    const actionsCell = row.insertCell();
    actionsCell.className = "px-6 py-4 whitespace-nowrap text-center";
    actionsCell.setAttribute("data-label", "Acciones");

    if (isAdmin) {
      actionsCell.style.display = "table-cell";
      actionsCell.innerHTML = `
                    <button onclick="deleteSale('${sale.id}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition">
                        Eliminar
                    </button>
                `;
    } else {
      actionsCell.style.display = "none";
    }

    row.cells[0].setAttribute("data-label", "Fecha");
    row.cells[1].setAttribute("data-label", "Producto");
    row.cells[2].setAttribute("data-label", "Cantidad");
    row.cells[3].setAttribute("data-label", "Precio Unitario");
    row.cells[4].setAttribute("data-label", "Total Venta");
    row.cells[5].setAttribute("data-label", "Detalle");
  });
}

// NUEVO: Función para eliminar una venta
function deleteSale(id) {
  if (currentUser?.role !== ROLES.ADMIN) {
    showNotification(
      "Permiso denegado. Solo Administradores pueden eliminar ventas.",
      "error",
    );
    return;
  }

  if (
    !confirm(
      "¿Está seguro de que desea **ELIMINAR** este registro de venta? Se **REVERTIRÁ** la cantidad al inventario.",
    )
  ) {
    return;
  }

  let sales = getSales();
  const saleIndex = sales.findIndex((s) => s.id === id);

  if (saleIndex === -1) {
    showNotification("Error: Registro de venta no encontrado.", "error");
    return;
  }

  const saleToDelete = sales[saleIndex];
  let inventory = getInventory();
  const productIndex = inventory.findIndex(
    (p) => p.id === saleToDelete.idProducto,
  );

  if (productIndex !== -1) {
    // Revertir el stock
    inventory[productIndex].cantidad += saleToDelete.cantidad;
    saveInventory(inventory);
    showNotification(
      `Stock de ${saleToDelete.nombreProducto} revertido: +${saleToDelete.cantidad} unidades.`,
      "info",
    );
  } else {
    showNotification(
      "Advertencia: Producto original no encontrado en el inventario. Solo se elimina el registro de venta.",
      "warning",
    );
  }

  // Eliminar el registro de venta
  sales.splice(saleIndex, 1);
  saveSales(sales);

  showNotification("Venta eliminada con éxito y stock reajustado.", "success");

  // Recargar tablas y paneles
  if (currentTab === "inventario") loadInventoryAndRefreshUI();
  if (currentTab === "ventas") {
    updateSalesDashboard();
    initSalesCharts();
  }
  renderSalesTable();
}
window.deleteSale = deleteSale; // Exportar la función para uso en HTML

function createChart(ctxId, type, data, options) {
  if (charts[ctxId]) {
    charts[ctxId].destroy();
  }
  const ctx = document.getElementById(ctxId).getContext("2d");
  charts[ctxId] = new Chart(ctx, { type, data, options });
}

function initInventoryCharts() {
  if (currentUser?.role !== ROLES.ADMIN) return;

  const inventory = getInventory();
  let agotados = 0;
  let bajo = 0;
  let ok = 0;

  inventory.forEach((p) => {
    if (p.cantidad === 0) agotados++;
    else if (p.cantidad <= 5) bajo++;
    else ok++;
  });

  const pieData = {
    labels: ["Stock OK", "Stock Bajo (≤ 5)", "Agotados"],
    datasets: [
      {
        data: [ok, bajo, agotados],
        backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
        hoverOffset: 4,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: document.body.classList.contains("dark") ? "white" : "black",
        },
      },
      title: { display: false },
    },
  };

  createChart("chart-stock-pie", "doughnut", pieData, pieOptions);

  const topSelling = getInventory()
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const barData = {
    labels: topSelling.map((p) => p.nombre),
    datasets: [
      {
        label: "Stock Actual",
        data: topSelling.map((p) => p.cantidad),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: document.body.classList.contains("dark") ? "white" : "black",
        },
      },
      x: {
        ticks: {
          color: document.body.classList.contains("dark") ? "white" : "black",
        },
      },
    },
  };

  createChart("chart-top-bar", "bar", barData, barOptions);
}

function initSalesCharts() {
  if (currentUser?.role !== ROLES.ADMIN) return;
  const sales = getSales();

  const salesByProduct = sales.reduce((acc, sale) => {
    const key = `${sale.codigoProducto} - ${sale.nombreProducto}`;
    acc[key] = (acc[key] || 0) + sale.cantidad;
    return acc;
  }, {});

  const sortedSales = Object.entries(salesByProduct)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topProductsData = {
    labels: sortedSales.map(([name]) => name),
    datasets: [
      {
        label: "Unidades Vendidas",
        data: sortedSales.map(([, count]) => count),
        backgroundColor: "#10b981",
      },
    ],
  };

  const topProductsOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: document.body.classList.contains("dark") ? "white" : "black",
        },
      },
      y: {
        ticks: {
          color: document.body.classList.contains("dark") ? "white" : "black",
        },
      },
    },
  };

  createChart(
    "chart-sales-top-products",
    "bar",
    topProductsData,
    topProductsOptions,
  );

  const monthlyRevenue = sales.reduce((acc, sale) => {
    const date = new Date(sale.fecha);
    const monthYear = date.toLocaleString("es-CO", {
      month: "short",
      year: "numeric",
    });
    acc[monthYear] = (acc[monthYear] || 0) + sale.totalVenta;
    return acc;
  }, {});

  const monthlyRevenueData = {
    labels: Object.keys(monthlyRevenue),
    datasets: [
      {
        label: "Ingresos ($)",
        data: Object.values(monthlyRevenue),
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245, 158, 11, 0.2)",
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const monthlyRevenueOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: document.body.classList.contains("dark") ? "white" : "black",
        },
      },
      x: {
        ticks: {
          color: document.body.classList.contains("dark") ? "white" : "black",
        },
      },
    },
  };

  createChart(
    "chart-sales-monthly-revenue",
    "line",
    monthlyRevenueData,
    monthlyRevenueOptions,
  );
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
  document.getElementById("dark-mode-label").textContent = isDark
    ? "Light"
    : "Dark";

  const dot = document.querySelector("#toggle-dark .dot");
  dot.classList.toggle("mr-2", !isDark);
  dot.classList.toggle("ml-auto", isDark);

  if (currentUser?.role === ROLES.ADMIN) {
    if (currentTab === "inventario") initInventoryCharts();
    if (currentTab === "ventas") initSalesCharts();
  }
}

function init() {
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

  document
    .getElementById("toggle-dark")
    .addEventListener("click", toggleDarkMode);

  document.getElementById("form-login").addEventListener("submit", handleLogin);
  document
    .getElementById("form-producto")
    .addEventListener("submit", handleAddProduct);
  document
    .getElementById("form-editar-producto")
    .addEventListener("submit", handleEditProduct);
  document
    .getElementById("form-venta")
    .addEventListener("submit", handleRegisterSale);

  document
    .getElementById("buscar")
    .addEventListener("input", applyFiltersAndRender);
  document
    .getElementById("filtro-talla")
    .addEventListener("change", applyFiltersAndRender);
  document
    .getElementById("filtro-color")
    .addEventListener("input", applyFiltersAndRender);
  document
    .getElementById("filtro-stock")
    .addEventListener("change", applyFiltersAndRender);
  document
    .getElementById("filtro-precio-min")
    .addEventListener("input", applyFiltersAndRender);
  document
    .getElementById("filtro-precio-max")
    .addEventListener("input", applyFiltersAndRender);
  document.getElementById("limpiar-filtros").addEventListener("click", () => {
    document.getElementById("buscar").value = "";
    document.getElementById("filtro-talla").value = "";
    document.getElementById("filtro-color").value = "";
    document.getElementById("filtro-stock").value = "";
    document.getElementById("filtro-precio-min").value = "";
    document.getElementById("filtro-precio-max").value = "";
    applyFiltersAndRender();
  });

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", (e) => showTab(e.target.dataset.tab));
  });

  const initialUser = localStorage.getItem(USER_STORAGE_KEY);
  if (initialUser) {
    currentUser = JSON.parse(initialUser);
    hideLoginModal();
    loadInventoryAndRefreshUI();
    updateUIPermissions();
    showTab("inventario");
  } else {
    showLoginModal();
  }
}

window.addEventListener("load", init);
