/**
 * MÓDULO DE ALMACENAMIENTO (Storage)
 * ==================================
 * Gestiona toda la persistencia de datos en localStorage
 * Incluye métodos para:
 * - Inventario (productos)
 * - Ventas
 * - Usuarios
 * - Clientes
 * - Proveedores
 * 
 * Todas las operaciones incluyen manejo de errores
 */

// Claves para identificar los datos en localStorage
const INVENTORY_STORAGE_KEY = "inventoryData_v1";
const SALES_STORAGE_KEY = "salesData_v1";
const USER_STORAGE_KEY = "userData_v1";
const CUSTOMERS_STORAGE_KEY = "customersData_v1";
const SUPPLIERS_STORAGE_KEY = "suppliersData_v1";

const Storage = {
  // Inventario
  getInventory() {
    try {
      const data = localStorage.getItem(INVENTORY_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error al obtener inventario:", error);
      return [];
    }
  },

  saveInventory(inventory) {
    try {
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(inventory));
    } catch (error) {
      console.error("Error al guardar inventario:", error);
    }
  },

  // Ventas
  getSales() {
    try {
      const data = localStorage.getItem(SALES_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      return [];
    }
  },

  saveSales(sales) {
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    } catch (error) {
      console.error("Error al guardar ventas:", error);
    }
  },

  // Usuario
  saveUser(user) {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      console.error("Error al guardar usuario:", error);
    }
  },

  getUser() {
    try {
      const data = localStorage.getItem(USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error al obtener usuario:", error);
      return null;
    }
  },

  clearUser() {
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  },

  // Clientes
  getCustomers() {
    try {
      const data = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      return [];
    }
  },

  saveCustomers(customers) {
    try {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    } catch (error) {
      console.error("Error al guardar clientes:", error);
    }
  },

  // Proveedores
  getSuppliers() {
    try {
      const data = localStorage.getItem(SUPPLIERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      return [];
    }
  },

  saveSuppliers(suppliers) {
    try {
      localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
    } catch (error) {
      console.error("Error al guardar proveedores:", error);
    }
  },
};
