/**
 * MÓDULO DE INVENTARIO
 * ====================
 * Gestiona el registro de productos
 * - Agregar productos (código, nombre, talla, color, cantidad, precio)
 * - Editar y eliminar productos
 * - Búsqueda y filtrado de productos
 * - Estadísticas de inventario (total productos, valor total, stock bajo)
 */

const Inventory = {
  loadAndRefreshUI() {
    this.updateStats();
    this.applyFiltersAndRender();
    Sales.populateProductSelect();
    if (Auth.isAdmin()) {
      Charts.initInventoryCharts();
    }
  },

  updateStats() {
    const inventory = Storage.getInventory();
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
    document.getElementById("stat-valor").textContent = Utils.formatCurrency(
      totalValue
    );
  },

  applyFiltersAndRender() {
    const inventory = Storage.getInventory();
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
      document.getElementById("filtro-precio-min").value
    );
    const filterPriceMax = parseFloat(
      document.getElementById("filtro-precio-max").value
    );

    const filteredInventory = inventory.filter((p) => {
      const stockStatus = Utils.getStockStatus(p.cantidad).filter;

      const matchesSearch =
        p.codigo.toLowerCase().includes(searchText) ||
        p.nombre.toLowerCase().includes(searchText);

      const matchesTalla = !filterTalla || p.talla === filterTalla;

      const matchesColor =
        !filterColor || p.color.toLowerCase().includes(filterColor);

      const matchesStock = !filterStock || stockStatus === filterStock;

      const matchesPriceMin =
        isNaN(filterPriceMin) || p.precio >= filterPriceMin;

      const matchesPriceMax =
        isNaN(filterPriceMax) || p.precio <= filterPriceMax;

      return (
        matchesSearch &&
        matchesTalla &&
        matchesColor &&
        matchesStock &&
        matchesPriceMin &&
        matchesPriceMax
      );
    });

    this.renderInventoryTable(filteredInventory);
  },

  renderInventoryTable(inventory = Storage.getInventory()) {
    try {
      const tbody = document
        .getElementById("tabla-inventario")
        .querySelector("tbody");
      tbody.innerHTML = "";
      const isAdmin = Auth.isAdmin();

      inventory.forEach((p) => {
        const row = tbody.insertRow();
        const status = Utils.getStockStatus(p.cantidad);

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

        row.insertCell().innerHTML = Utils.formatCurrency(p.precio);

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
    } catch (error) {
      console.error("Error al renderizar tabla de inventario:", error);
      UI.showNotification("Error al mostrar inventario", "error");
    }
  },

  addProduct(codigo, nombre, talla, color, cantidad, precio) {
    if (!Auth.isAdmin()) {
      UI.showNotification(
        "Permiso denegado. Solo Administradores pueden agregar productos.",
        "error"
      );
      return false;
    }

    // Validación
    const validation = InputValidator.validateProduct(
      codigo,
      nombre,
      talla,
      color,
      cantidad,
      precio
    );

    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        UI.showNotification(error, "error")
      );
      return false;
    }

    let inventory = Storage.getInventory();

    const exists = inventory.some((p) => p.codigo === codigo);

    if (!exists) {
      const newProduct = {
        id: Utils.generateId(),
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        talla: talla,
        color: color.trim(),
        cantidad: parseInt(cantidad),
        precio: parseFloat(precio),
      };

      inventory.push(newProduct);
      Storage.saveInventory(inventory);

      UI.showNotification("Producto agregado con éxito", "success");
      return true;
    } else {
      UI.showNotification("Error: El código de producto ya existe.", "error");
      return false;
    }
  },

  editProduct(id, nombre, talla, color, cantidad, precio) {
    const inventory = Storage.getInventory();

    // Validación
    const validation = InputValidator.validateProduct(
      inventory.find((p) => p.id === id)?.codigo || "",
      nombre,
      talla,
      color,
      cantidad,
      precio
    );

    if (!validation.isValid) {
      validation.errors.forEach((error) =>
        UI.showNotification(error, "error")
      );
      return false;
    }

    const index = inventory.findIndex((p) => p.id === id);

    if (index !== -1) {
      inventory[index] = {
        id: id,
        codigo: inventory[index].codigo,
        nombre: nombre.trim(),
        talla: talla,
        color: color.trim(),
        cantidad: parseInt(cantidad),
        precio: parseFloat(precio),
      };

      Storage.saveInventory(inventory);
      UI.showNotification("Producto actualizado con éxito", "success");
      return true;
    } else {
      UI.showNotification("Error: Producto no encontrado.", "error");
      return false;
    }
  },

  deleteProduct(id) {
    if (!Auth.isAdmin()) {
      UI.showNotification(
        "Permiso denegado. Solo Administradores pueden eliminar.",
        "error"
      );
      return false;
    }

    if (
      !confirm(
        "¿Está seguro de que desea eliminar este producto del inventario?"
      )
    ) {
      return false;
    }

    let inventory = Storage.getInventory();
    const initialLength = inventory.length;
    inventory = inventory.filter((p) => p.id !== id);

    if (inventory.length < initialLength) {
      Storage.saveInventory(inventory);
      UI.showNotification("Producto eliminado con éxito", "success");
      return true;
    } else {
      UI.showNotification("Error al intentar eliminar el producto.", "error");
      return false;
    }
  },
};

// Exportar funciones globales para HTML
window.deleteProduct = Inventory.deleteProduct;
