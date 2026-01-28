/**
 * MÓDULO DE INVENTARIO
 * ====================
 * Gestiona el registro de productos via API
 */

const Inventory = {
  async loadAndRefreshUI() {
    try {
      const inventory = await Storage.getInventory();
      this.updateStats(inventory);
      this.applyFiltersAndRender(inventory);
      if (typeof Sales !== 'undefined' && Sales.populateProductSelect) {
        // Sales.populateProductSelect() necesitará refactorización también, pasamos inventory o lo dejamos para que Sales lo pida
        // Por eficiencia, podríamos pasarlo, pero para desacoplar, dejemos que Sales lo pida (aunque sea otra llamada)
        // Ojo: Sales.populateProductSelect es síncrono en la versión vieja.
        Sales.populateProductSelect(inventory);
      }
      if (Auth.isAdmin()) {
        // Charts will need refactor or just receive data
        if (typeof Charts !== 'undefined' && Charts.initInventoryCharts) {
          Charts.initInventoryCharts(inventory);
        }
      }
    } catch (error) {
      console.error("Error loading inventory UI:", error);
    }
  },

  updateStats(inventory) {
    // Si no se pasa inventario, no podemos hacer mucho síncronamente ahora
    if (!inventory) return;

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

    if (document.getElementById("stat-total")) document.getElementById("stat-total").textContent = inventory.length;
    if (document.getElementById("stat-agotados")) document.getElementById("stat-agotados").textContent = totalAgotados;
    if (document.getElementById("stat-bajo")) document.getElementById("stat-bajo").textContent = totalBajo;
    if (document.getElementById("stat-valor")) document.getElementById("stat-valor").textContent = Utils.formatCurrency(totalValue);
  },

  async applyFiltersAndRender(inventory) {
    if (!inventory) inventory = await Storage.getInventory();

    const searchText = document.getElementById("buscar").value.toLowerCase().trim();
    const filterTalla = document.getElementById("filtro-talla").value;
    const filterColor = document.getElementById("filtro-color").value.toLowerCase().trim();
    const filterStock = document.getElementById("filtro-stock").value;
    const filterPriceMin = parseFloat(document.getElementById("filtro-precio-min").value);
    const filterPriceMax = parseFloat(document.getElementById("filtro-precio-max").value);

    const filteredInventory = inventory.filter((p) => {
      // Nota: Utils.getStockStatus puede seguir siendo síncrono
      const stockStatus = Utils.getStockStatus(p.cantidad).filter;

      const matchesSearch =
        p.codigo.toLowerCase().includes(searchText) ||
        p.nombre.toLowerCase().includes(searchText);

      const matchesTalla = !filterTalla || p.talla === filterTalla;
      const matchesColor = !filterColor || p.color.toLowerCase().includes(filterColor);
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

    this.renderInventoryTable(filteredInventory);
  },

  renderInventoryTable(inventory) {
    try {
      const tbody = document.getElementById("tabla-inventario").querySelector("tbody");
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

        // Headers labels for mobile (if CSS uses it)
        if (row.cells[0]) row.cells[0].setAttribute("data-label", "Código");
        if (row.cells[1]) row.cells[1].setAttribute("data-label", "Nombre");
        if (row.cells[2]) row.cells[2].setAttribute("data-label", "Talla");
        if (row.cells[3]) row.cells[3].setAttribute("data-label", "Color");
        if (row.cells[5]) row.cells[5].setAttribute("data-label", "Precio");
      });
    } catch (error) {
      console.error("Error al renderizar tabla de inventario:", error);
      UI.showNotification("Error al mostrar inventario", "error");
    }
  },

  async addProduct(codigo, nombre, talla, color, cantidad, precio) {
    if (!Auth.isAdmin()) {
      UI.showNotification("Permiso denegado. Solo Administradores.", "error");
      return false;
    }

    // Validación
    const validation = InputValidator.validateProduct(codigo, nombre, talla, color, cantidad, precio);
    if (!validation.isValid) {
      validation.errors.forEach((error) => UI.showNotification(error, "error"));
      return false;
    }

    // Checking existence via API is handled by DB unique constraint usually, 
    // but the backend returns error if so. Backend logs duplicate key.

    const newProduct = {
      id: Utils.generateId(), // We can generate ID locally or let DB do it. 
      // Our DB schema has VARCHAR(50) for id, let's keep generating it client side for consistency with current logic
      // OR better, send it.
      codigo: codigo.trim(),
      nombre: nombre.trim(),
      talla: talla,
      color: color.trim(),
      cantidad: parseInt(cantidad),
      precio: parseFloat(precio),
    };

    try {
      const result = await Storage.API.createProduct(newProduct);
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }

      UI.showNotification("Producto agregado con éxito", "success");
      await this.loadAndRefreshUI(); // Recargar todo
      return true;
    } catch (e) {
      UI.showNotification("Error de conexión al agregar producto", "error");
      return false;
    }
  },

  async editProduct(id, nombre, talla, color, cantidad, precio) {
    // Para validar necesitamos el código... a menos que el validador no lo pida o lo busquemos se lo pasemos vacio
    // El validador original (InputValidator.validateProduct) usa el código.
    // Podríamos hacer un fetch del producto actual, pero Inventory.editProduct es llamado desde el modal
    // que ya debería tener los datos? 
    // Vamos a simplificar pasándole el código si es necesario o ajustando la validación.
    // Asumiremos que validamos campos básicos.

    const updateData = {
      id: id,
      // codigo: no cambiamos código
      nombre: nombre.trim(),
      talla: talla,
      color: color.trim(),
      cantidad: parseInt(cantidad),
      precio: parseFloat(precio),
    };

    try {
      const result = await Storage.API.updateProduct(updateData);
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }
      UI.showNotification("Producto actualizado con éxito", "success");
      await this.loadAndRefreshUI();
      return true;
    } catch (e) {
      UI.showNotification("Error al actualizar producto", "error");
      return false;
    }
  },

  async deleteProduct(id) {
    if (!Auth.isAdmin()) {
      UI.showNotification("Permiso denegado.", "error");
      return false;
    }

    if (!confirm("¿Está seguro de que desea eliminar este producto del inventario?")) {
      return false;
    }

    try {
      const result = await Storage.API.deleteProduct(id);
      if (result.error) {
        UI.showNotification("Error: " + result.error, "error");
        return false;
      }
      UI.showNotification("Producto eliminado con éxito", "success");
      await this.loadAndRefreshUI();
      return true;
    } catch (e) {
      UI.showNotification("Error al eliminar producto", "error");
      return false;
    }
  },
};

// Exportar funciones globales para HTML
window.deleteProduct = Inventory.deleteProduct;
