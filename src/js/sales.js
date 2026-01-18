// Sales Module - Gestión de ventas
const Sales = {
  updateDashboard() {
    try {
      const sales = Storage.getSales();
      let totalVentas = sales.reduce((sum, sale) => sum + sale.cantidad, 0);
      let totalIngreso = sales.reduce((sum, sale) => sum + sale.totalVenta, 0);

      const today = new Date().toISOString().split("T")[0];
      const salesToday = sales.filter((sale) => sale.fecha.startsWith(today));
      let totalVentasHoy = salesToday.reduce(
        (sum, sale) => sum + sale.cantidad,
        0
      );
      let totalIngresoHoy = salesToday.reduce(
        (sum, sale) => sum + sale.totalVenta,
        0
      );

      document.getElementById("stat-ventas-total").textContent = totalVentas;
      document.getElementById("stat-ingreso-total").textContent =
        Utils.formatCurrency(totalIngreso);
      document.getElementById("stat-ventas-hoy").textContent =
        totalVentasHoy;
      document.getElementById("stat-ingreso-hoy").textContent =
        Utils.formatCurrency(totalIngresoHoy);
    } catch (error) {
      console.error("Error al actualizar dashboard de ventas:", error);
    }
  },

  populateProductSelect() {
    try {
      const select = document.getElementById("venta-producto");
      const inventory = Storage.getInventory();

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

      select.removeEventListener("change", this.handleProductChange);
      select.addEventListener(
        "change",
        this.handleProductChange.bind(this)
      );

      const initialValue = select.value;
      if (initialValue) {
        this.updateSaleFormPrice(initialValue.split("|")[0]);
      }
    } catch (error) {
      console.error("Error al poblar selector de productos:", error);
    }
  },

  handleProductChange(e) {
    const selectedValue = e.target.value;
    const productId = selectedValue ? selectedValue.split("|")[0] : null;
    Sales.updateSaleFormPrice(productId);
  },

  updateSaleFormPrice(productId) {
    const inventory = Storage.getInventory();
    const product = inventory.find((p) => p.id === productId);
    const priceInput = document.getElementById("venta-precio-final");

    if (product) {
      priceInput.value = product.precio.toFixed(2);
    } else {
      priceInput.value = "";
    }
  },

  registerSale(selectedOption, cantidadVendida, precioUnitarioFinal, detalle) {
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
      const productoVendido = parts[1];

      // Validación
      const validation = InputValidator.validateSale(
        cantidadVendida,
        precioUnitarioFinal,
        productoVendido
      );

      if (!validation.isValid) {
        validation.errors.forEach((error) =>
          UI.showNotification(error, "error")
        );
        return false;
      }

      let inventory = Storage.getInventory();
      const index = inventory.findIndex((p) => p.id === idVendido);

      if (index !== -1) {
        const producto = inventory[index];

        if (producto.cantidad < cantidadVendida) {
          UI.showNotification(
            `Stock insuficiente. Solo quedan ${producto.cantidad} unidades.`,
            "error"
          );
          return false;
        }

        producto.cantidad -= cantidadVendida;
        Storage.saveInventory(inventory);

        const totalVenta = cantidadVendida * precioUnitarioFinal;
        const sales = Storage.getSales();
        sales.push({
          id: Utils.generateId(),
          idProducto: idVendido,
          codigoProducto: producto.codigo,
          nombreProducto: producto.nombre,
          cantidad: cantidadVendida,
          precioUnitario: precioUnitarioFinal,
          totalVenta: totalVenta,
          detalle: detalle.trim(),
          fecha: new Date().toISOString(),
          vendedor: Auth.getCurrentUser().username,
        });
        Storage.saveSales(sales);

        UI.showNotification(
          `Venta registrada: ${cantidadVendida}x ${producto.nombre} por ${Utils.formatCurrency(totalVenta)}`,
          "success"
        );

        return true;
      } else {
        UI.showNotification(
          "Error: Producto no encontrado en el inventario.",
          "error"
        );
        return false;
      }
    } catch (error) {
      console.error("Error al registrar venta:", error);
      UI.showNotification("Error al registrar la venta", "error");
      return false;
    }
  },

  renderSalesTable() {
    try {
      const tbody = document
        .getElementById("tabla-ventas")
        .querySelector("tbody");
      const sales = Storage.getSales().sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
      tbody.innerHTML = "";

      const isAdmin = Auth.isAdmin();
      const salesActionsHeader = document.getElementById(
        "acciones-ventas-header"
      );
      if (salesActionsHeader) {
        salesActionsHeader.style.display = isAdmin ? "table-cell" : "none";
      }

      sales.forEach((sale) => {
        const row = tbody.insertRow();
        row.className =
          "hover:bg-gray-50 dark:hover:bg-gray-600 transition duration-150";

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

        row.cells[0].setAttribute("data-label", "Fecha");
        row.cells[1].setAttribute("data-label", "Producto");
        row.cells[2].setAttribute("data-label", "Cantidad");
        row.cells[3].setAttribute("data-label", "Precio Unitario");
        row.cells[4].setAttribute("data-label", "Total Venta");
        row.cells[5].setAttribute("data-label", "Detalle");
      });
    } catch (error) {
      console.error("Error al renderizar tabla de ventas:", error);
      UI.showNotification("Error al mostrar ventas", "error");
    }
  },

  deleteSale(id) {
    try {
      if (!Auth.isAdmin()) {
        UI.showNotification(
          "Permiso denegado. Solo Administradores pueden eliminar ventas.",
          "error"
        );
        return false;
      }

      if (
        !confirm(
          "¿Está seguro de que desea **ELIMINAR** este registro de venta? Se **REVERTIRÁ** la cantidad al inventario."
        )
      ) {
        return false;
      }

      let sales = Storage.getSales();
      const saleIndex = sales.findIndex((s) => s.id === id);

      if (saleIndex === -1) {
        UI.showNotification("Error: Registro de venta no encontrado.", "error");
        return false;
      }

      const saleToDelete = sales[saleIndex];
      let inventory = Storage.getInventory();
      const productIndex = inventory.findIndex(
        (p) => p.id === saleToDelete.idProducto
      );

      if (productIndex !== -1) {
        inventory[productIndex].cantidad += saleToDelete.cantidad;
        Storage.saveInventory(inventory);
        UI.showNotification(
          `Stock de ${saleToDelete.nombreProducto} revertido: +${saleToDelete.cantidad} unidades.`,
          "info"
        );
      } else {
        UI.showNotification(
          "Advertencia: Producto original no encontrado en el inventario. Solo se elimina el registro de venta.",
          "warning"
        );
      }

      sales.splice(saleIndex, 1);
      Storage.saveSales(sales);

      UI.showNotification(
        "Venta eliminada con éxito y stock reajustado.",
        "success"
      );

      if (AppState.currentTab === "inventario") Inventory.loadAndRefreshUI();
      if (AppState.currentTab === "ventas") {
        this.updateDashboard();
        Charts.initSalesCharts();
      }
      this.renderSalesTable();

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
