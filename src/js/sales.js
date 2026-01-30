/**
 * MÓDULO DE VENTAS
 * ================
 * Gestiona el registro de ventas via API con soporte para carrito multi-producto
 */

const Sales = {
  // Carrito temporal (se limpia al finalizar venta)
  cart: [],

  async updateDashboard() {
    try {
      const sales = await Storage.getSales();

      // Agrupar ventas por idVenta para contar facturas únicas
      const uniqueSales = [...new Set(sales.map(s => s.idVenta))];
      let totalVentas = uniqueSales.length;

      let totalIngreso = sales.reduce((sum, sale) => sum + parseFloat(sale.totalVenta), 0);

      const today = new Date().toISOString().split("T")[0];
      const salesToday = sales.filter((sale) => sale.fecha.startsWith(today));
      const uniqueSalesToday = [...new Set(salesToday.map(s => s.idVenta))];

      let totalVentasHoy = uniqueSalesToday.length;
      let totalIngresoHoy = salesToday.reduce((sum, sale) => sum + parseFloat(sale.totalVenta), 0);

      if (document.getElementById("stat-ventas-total")) document.getElementById("stat-ventas-total").textContent = totalVentas;
      if (document.getElementById("stat-ingreso-total")) document.getElementById("stat-ingreso-total").textContent = Utils.formatCurrency(totalIngreso);
      if (document.getElementById("stat-ventas-hoy")) document.getElementById("stat-ventas-hoy").textContent = totalVentasHoy;
      if (document.getElementById("stat-ingreso-hoy")) document.getElementById("stat-ingreso-hoy").textContent = Utils.formatCurrency(totalIngresoHoy);
    } catch (error) {
      console.error("Error al actualizar dashboard de ventas:", error);
    }
  },

  async renderSalesTable() {
    try {
      const tbody = document.getElementById("tabla-ventas").querySelector("tbody");
      if (!tbody) return;

      const sales = await Storage.getSales();

      // Agrupar ventas por idVenta
      const salesByInvoice = {};
      sales.forEach(sale => {
        if (!salesByInvoice[sale.idVenta]) {
          salesByInvoice[sale.idVenta] = {
            idVenta: sale.idVenta,
            fecha: sale.fecha,
            vendedor: sale.vendedor,
            detalle: sale.detalle,
            items: [],
            total: 0
          };
        }
        salesByInvoice[sale.idVenta].items.push(sale);
        salesByInvoice[sale.idVenta].total += parseFloat(sale.totalVenta);
      });

      // Convertir a array y ordenar
      const sortedSales = Object.values(salesByInvoice).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      tbody.innerHTML = "";
      const isAdmin = Auth.isAdmin();

      sortedSales.forEach((sale) => {
        const row = tbody.insertRow();
        row.className = "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150 align-top";

        // Fecha
        row.insertCell().innerHTML = `<div class="font-bold text-gray-900 dark:text-white">#${sale.idVenta}</div><div class="text-xs text-gray-500">${Utils.formatDate(sale.fecha)}</div>`;

        // Productos (Resumen)
        const itemsList = sale.items.map(item =>
          `<div class="text-sm"><span class="font-semibold">${item.cantidad}x</span> ${item.nombreProducto} (${item.codigoProducto})</div>`
        ).join('');

        row.insertCell().innerHTML = `
          <div class="text-gray-900 dark:text-white">${itemsList}</div>
          <div class="text-xs text-gray-500 mt-1">Vendedor: ${sale.vendedor}</div>
        `;

        // Cantidad total de items
        const totalItems = sale.items.reduce((acc, item) => acc + item.cantidad, 0);
        const cantidadCell = row.insertCell();
        cantidadCell.className = "text-center";
        cantidadCell.innerHTML = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">${totalItems} items</span>`;

        // Precio Unitario (No aplica en venta agrupada, dejamos vacío o promedio)
        row.insertCell().innerHTML = "-";

        // Total Venta
        row.insertCell().innerHTML = `<div class="font-bold text-gray-900 dark:text-white">${Utils.formatCurrency(sale.total)}</div>`;

        // Detalle
        row.insertCell().innerHTML = sale.detalle || "-";

        // Acciones
        const actionsCell = row.insertCell();
        actionsCell.className = "px-6 py-4 whitespace-nowrap text-center";
        actionsCell.setAttribute("data-label", "Acciones");

        if (isAdmin) {
          actionsCell.style.display = "table-cell";
          actionsCell.innerHTML = `
            <button onclick="Sales.deleteSale('${sale.idVenta}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 transition" title="Eliminar Venta Completa">
              Eliminar
            </button>
          `;
        } else {
          actionsCell.style.display = "none";
        }
      });
    } catch (error) {
      console.error("Error al renderizar tabla de ventas:", error);
      UI.showNotification("Error al mostrar ventas", "error");
    }
  },

  async populateProductSelect(inventoryData) {
    try {
      const select = document.getElementById("venta-producto");
      if (!select) return;

      // Si nos pasan inventario, lo usamos, si no lo pedimos.
      const inventory = inventoryData || await Storage.getInventory();

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

      // Aseguramos que solo hay un listener (aunque cloneNode(true) es la via facil pa limpiar listeners, 
      // aqui usamos removeEventListener si tenemos la referencia, pero 'bind' crea nueva funcion.
      // Mejor práctica simple: asignar onchange directo o usar una propiedad del elemento para guardar la fn.)
      // Para simplificar, asignaremos onchange.
      select.onchange = this.handleProductChange; // Referencia a la funcion manejadora

      // Check initial Value logic if needed
      // Asegurar fecha actual
      const dateInput = document.getElementById("venta-fecha");
      if (dateInput) {
        dateInput.valueAsDate = new Date();
      }

    } catch (error) {
      console.error("Error al poblar selector de productos:", error);
    }
  },

  async populateCustomerSelect() {
    try {
      const select = document.getElementById("venta-cliente");
      if (!select) return;

      const customers = await Storage.getCustomers();

      // Preserve "Consumidor Final" or default option if desired, but here we rebuild
      select.innerHTML = '<option value="">Seleccione un cliente</option>';
      select.innerHTML += '<option value="consumidor_final">Consumidor Final</option>';

      customers.forEach((customer) => {
        const option = document.createElement("option");
        option.value = customer.id;
        option.textContent = `${customer.nombre} ${customer.primerApellido} (${customer.correo})`; // Mostrar info relevante
        select.appendChild(option);
      });
    } catch (error) {
      console.error("Error al poblar selector de clientes:", error);
    }
  },

  async handleProductChange(e) {
    const selectedValue = e.target.value;
    console.log("Selected Value:", selectedValue);
    const productId = selectedValue ? selectedValue.split("|")[0] : null;
    console.log("Extracted ProductID:", productId);
    await Sales.updateSaleFormPrice(productId);
  },

  async updateSaleFormPrice(productId) {
    console.log("Updating price for ID:", productId);
    if (!productId) {
      document.getElementById("venta-precio-final").value = "";
      return;
    }
    const inventory = await Storage.getInventory();
    console.log("Inventory loaded, size:", inventory.length);

    // Debug: ver si encontramos algo
    const product = inventory.find((p) => String(p.id) === String(productId));
    console.log("Product found:", product);

    const priceInput = document.getElementById("venta-precio-final");

    if (product) {
      priceInput.value = product.precio ? parseFloat(product.precio).toFixed(2) : "0";
    } else {
      priceInput.value = "";
    }
  },

  async registerSale(selectedOption, cantidadVendida, precioUnitarioFinal, detalle) {
    try {
      if (!selectedOption || selectedOption.trim() === "") {
        UI.showNotification("Seleccione un producto válido.", "error");
        return false;
      }

      // Validar Cliente seleccionado
      const clienteSelect = document.getElementById("venta-cliente");
      const idCliente = clienteSelect ? clienteSelect.value : null;
      if (!idCliente) {
        UI.showNotification("Seleccione un cliente.", "error");
        return false;
      }

      const parts = selectedOption.split("|");
      if (parts.length !== 2) {
        UI.showNotification("Seleccione un producto válido.", "error");
        return false;
      }

      const idVendido = parts[0];
      const codigoVendido = parts[1];

      // Necesitamos info completa del producto para nombre, etc.
      const inventory = await Storage.getInventory();
      const producto = inventory.find(p => p.id === idVendido);

      if (!producto) {
        UI.showNotification("Producto no encontrado.", "error");
        return false;
      }

      // Validación
      const validation = InputValidator.validateSale(cantidadVendida, precioUnitarioFinal, producto.nombre);
      if (!validation.isValid) {
        validation.errors.forEach((error) => UI.showNotification(error, "error"));
        return false;
      }

      // Creación objeto venta
      const newSale = {
        id: Utils.generateId(),
        idProducto: idVendido,
        codigoProducto: producto.codigo,
        nombreProducto: producto.nombre,
        cantidad: parseInt(cantidadVendida),
        precioUnitario: parseFloat(precioUnitarioFinal),
        totalVenta: parseInt(cantidadVendida) * parseFloat(precioUnitarioFinal),
        detalle: detalle.trim(),
        fecha: new Date().toISOString(),
        vendedor: Auth.getCurrentUser().username,
        idCliente: idCliente === 'consumidor_final' ? null : idCliente // Guardar null si es consumidor final o el ID
      };

      const result = await Storage.API.createSale(newSale);

      if (result.error) {
        UI.showNotification("Error al registrar venta: " + result.error, "error");
        return false;
      }

      UI.showNotification(`Venta registrada: ${newSale.cantidad}x ${newSale.nombreProducto}`, "success");

      // Actualizar UI
      if (typeof Inventory !== 'undefined') await Inventory.loadAndRefreshUI(); // Para actualizar stock visual
      await this.renderSalesTable(); // Actualizar tabla ventas si esta visible
      return true;

    } catch (error) {
      console.error("Error al registrar venta:", error);
      UI.showNotification("Error al registrar la venta", "error");
      return false;
    }
  },

  async renderSalesTable() {
    try {
      const tbody = document.getElementById("tabla-ventas").querySelector("tbody");
      if (!tbody) return; // Si no estamos en la vista de ventas

      const sales = await Storage.getSales();
      sales.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      tbody.innerHTML = "";
      const isAdmin = Auth.isAdmin();

      sales.forEach((sale) => {
        const row = tbody.insertRow();
        row.className = "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150";

        row.insertCell().innerHTML = Utils.formatDate(sale.fecha);

        row.insertCell().innerHTML = `
          <div class="font-medium text-gray-900 dark:text-white">${sale.codigoProducto} - ${sale.nombreProducto}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">Vendedor: ${sale.vendedor}</div>
        `;

        row.insertCell().innerHTML = sale.cantidad;
        row.insertCell().innerHTML = Utils.formatCurrency(sale.precioUnitario);
        row.insertCell().innerHTML = Utils.formatCurrency(sale.totalVenta);
        row.insertCell().innerHTML = sale.detalle || "-";

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

        // Mobile labels
        if (row.cells[0]) row.cells[0].setAttribute("data-label", "Fecha");
        if (row.cells[1]) row.cells[1].setAttribute("data-label", "Producto");
        if (row.cells[2]) row.cells[2].setAttribute("data-label", "Cantidad");
        if (row.cells[3]) row.cells[3].setAttribute("data-label", "Precio Unitario");
        if (row.cells[4]) row.cells[4].setAttribute("data-label", "Total Venta");
        if (row.cells[5]) row.cells[5].setAttribute("data-label", "Detalle");
      });
    } catch (error) {
      console.error("Error al renderizar tabla de ventas:", error);
    }
  },

  async deleteSale(id) {
    try {
      if (!Auth.isAdmin()) {
        UI.showNotification("Permiso denegado.", "error");
        return false;
      }

      if (!confirm("¿Está seguro de que desea **ELIMINAR** este registro de venta? Se **REVERTIRÁ** la cantidad al inventario.")) {
        return false;
      }

      const result = await Storage.API.deleteSale(id);

      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }

      UI.showNotification("Venta eliminada con éxito y stock reajustado.", "success");

      // Actualizar UI
      if (typeof Inventory !== 'undefined') await Inventory.loadAndRefreshUI();
      if (typeof AppState !== 'undefined' && AppState.currentTab === "ventas") {
        await this.updateDashboard();
        if (typeof Charts !== 'undefined' && Charts.initSalesCharts) Charts.initSalesCharts();
      }
      await this.renderSalesTable();

      return true;
    } catch (error) {
      console.error("Error al eliminar venta:", error);
      UI.showNotification("Error al eliminar la venta", "error");
      return false;
    }
  },

  // === FUNCIONES DE CARRITO ===

  addToCart(producto, cantidad, precioUnitario) {
    // Verificar si el producto ya está en el carrito
    const existingIndex = this.cart.findIndex(item => item.idProducto === producto.id);

    if (existingIndex >= 0) {
      // Si ya existe, incrementar cantidad
      this.cart[existingIndex].cantidad += parseInt(cantidad);
      this.cart[existingIndex].subtotal = this.cart[existingIndex].cantidad * this.cart[existingIndex].precioUnitario;
    } else {
      // Agregar nuevo item
      this.cart.push({
        idProducto: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        cantidad: parseInt(cantidad),
        precioUnitario: parseFloat(precioUnitario),
        subtotal: parseInt(cantidad) * parseFloat(precioUnitario)
      });
    }

    this.renderCart();
    UI.showNotification(`${producto.nombre} agregado al carrito`, "success");
  },

  removeFromCart(index) {
    this.cart.splice(index, 1);
    this.renderCart();
    UI.showNotification("Producto eliminado del carrito", "info");
  },

  renderCart() {
    const container = document.getElementById('carrito-container');
    const tbody = document.getElementById('carrito-items');
    const totalSpan = document.getElementById('carrito-total');

    if (this.cart.length === 0) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    tbody.innerHTML = '';

    this.cart.forEach((item, index) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td class="px-4 py-2 text-left text-gray-800 dark:text-white">${item.codigo} - ${item.nombre}</td>
        <td class="px-4 py-2 text-center text-gray-800 dark:text-white">${item.cantidad}</td>
        <td class="px-4 py-2 text-right text-gray-800 dark:text-white">${Utils.formatCurrency(item.precioUnitario)}</td>
        <td class="px-4 py-2 text-right text-gray-800 dark:text-white font-bold">${Utils.formatCurrency(item.subtotal)}</td>
        <td class="px-4 py-2 text-center">
          <button onclick="Sales.removeFromCart(${index})" 
            class="text-red-600 hover:text-red-800 dark:text-red-400 font-bold">
            ✕
          </button>
        </td>
      `;
    });

    const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
    totalSpan.textContent = Utils.formatCurrency(total);
  },

  clearCart() {
    this.cart = [];
    this.renderCart();
  },

  async finalizeSale() {
    try {
      if (this.cart.length === 0) {
        UI.showNotification("El carrito está vacío", "error");
        return false;
      }

      const clienteSelect = document.getElementById("venta-cliente");
      const idCliente = clienteSelect ? clienteSelect.value : null;

      if (!idCliente) {
        UI.showNotification("Seleccione un cliente antes de finalizar", "error");
        return false;
      }

      const vendedor = Auth.getCurrentUser().username;

      // Preparar items para el backend
      const items = this.cart.map(item => ({
        idProducto: item.idProducto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario
      }));

      // Enviar al backend
      const result = await Storage.API.createSale({ items, vendedor, idCliente });

      if (result.error) {
        UI.showNotification("Error al registrar venta: " + result.error, "error");
        return false;
      }

      UI.showNotification(`✅ Venta registrada: ${result.itemsCount} productos`, "success");

      // Limpiar carrito y actualizar UI
      this.clearCart();

      // Limpiar formulario
      document.getElementById("form-venta").reset();
      document.getElementById("venta-fecha").valueAsDate = new Date();

      // Actualizar inventario y tablas
      if (typeof Inventory !== 'undefined') await Inventory.loadAndRefreshUI();
      await this.renderSalesTable();
      await this.updateDashboard();

      return true;

    } catch (error) {
      console.error("Error al finalizar venta:", error);
      UI.showNotification("Error al finalizar la venta", "error");
      return false;
    }
  },
};

// Exportar funciones globales para HTML
window.deleteSale = Sales.deleteSale;
