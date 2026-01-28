/**
 * MÓDULO DE VENTAS
 * ================
 * Gestiona el registro de ventas via API
 */

const Sales = {
  async updateDashboard() {
    try {
      const sales = await Storage.getSales();
      let totalVentas = sales.reduce((sum, sale) => sum + sale.cantidad, 0);
      let totalIngreso = sales.reduce((sum, sale) => sum + parseFloat(sale.totalVenta), 0);

      const today = new Date().toISOString().split("T")[0];
      const salesToday = sales.filter((sale) => sale.fecha.startsWith(today));
      let totalVentasHoy = salesToday.reduce((sum, sale) => sum + sale.cantidad, 0);
      let totalIngresoHoy = salesToday.reduce((sum, sale) => sum + parseFloat(sale.totalVenta), 0);

      if (document.getElementById("stat-ventas-total")) document.getElementById("stat-ventas-total").textContent = totalVentas;
      if (document.getElementById("stat-ingreso-total")) document.getElementById("stat-ingreso-total").textContent = Utils.formatCurrency(totalIngreso);
      if (document.getElementById("stat-ventas-hoy")) document.getElementById("stat-ventas-hoy").textContent = totalVentasHoy;
      if (document.getElementById("stat-ingreso-hoy")) document.getElementById("stat-ingreso-hoy").textContent = Utils.formatCurrency(totalIngresoHoy);
    } catch (error) {
      console.error("Error al actualizar dashboard de ventas:", error);
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
    } catch (error) {
      console.error("Error al poblar selector de productos:", error);
    }
  },

  async handleProductChange(e) {
    const selectedValue = e.target.value;
    const productId = selectedValue ? selectedValue.split("|")[0] : null;
    await Sales.updateSaleFormPrice(productId);
  },

  async updateSaleFormPrice(productId) {
    if (!productId) {
      document.getElementById("venta-precio-final").value = "";
      return;
    }
    const inventory = await Storage.getInventory(); // Esto podría ser ineficiente (fetch cada vez), pero seguro.
    const product = inventory.find((p) => p.id === productId);
    const priceInput = document.getElementById("venta-precio-final");

    if (product) {
      priceInput.value = product.precio.toFixed(2);
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

      const parts = selectedOption.split("|");
      if (parts.length !== 2) {
        UI.showNotification("Seleccione un producto válido.", "error");
        return false;
      }

      const idVendido = parts[0];
      const codigoVendido = parts[1]; // codigo no viene en value parts[1]?? En populate parts[1] es codigo.

      // Necesitamos info completa del producto para nombre, etc.
      // Backend deberia encargarse de validar stock, buscar nombre, etc.
      // Pero el frontend envía: id, idProducto, codigoProducto, nombreProducto...
      // Vamos a obtener el producto para llenar estos datos.
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
};

// Exportar funciones globales para HTML
window.deleteSale = Sales.deleteSale;
