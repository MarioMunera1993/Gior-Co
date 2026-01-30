/**
 * MÓDULO DE ALMACENAMIENTO (Storage)
 * ==================================
 * Gestiona toda la persistencia de datos via API
 * Incluye métodos para:
 * - Inventario (productos)
 * - Ventas
 * - Usuarios
 * - Clientes
 * - Proveedores
 * 
 * Todas las operaciones regresan Promesas
 */

const API_URL = 'http://localhost:3000/api';

const Storage = {
  // Inventario
  async getInventory() {
    try {
      const response = await fetch(`${API_URL}/inventory`);
      if (!response.ok) throw new Error('Error de red');
      const data = await response.json();
      console.log('getInventory response:', data); // DEBUG
      return data;
    } catch (error) {
      console.error("Error al obtener inventario:", error);
      return [];
    }
  },

  async saveInventory(inventory) {
    // Este método ya no se usa como tal para "guardar todo", 
    // ahora usaremos métodos específicos (add, update, delete) en el API.
    // Mantenemos la función para compatibilidad o la dejamos vacía/logging warning.
    console.warn("Storage.saveInventory está obsoleto con MySQL. Use addProduct/updateProduct en la lógica de negocio.");
  },

  // Ventas
  async getSales() {
    try {
      const response = await fetch(`${API_URL}/sales`);
      if (!response.ok) throw new Error('Error de red');
      return await response.json();
    } catch (error) {
      console.error("Error al obtener ventas:", error);
      return [];
    }
  },

  async saveSales(sales) {
    console.warn("Storage.saveSales está obsoleto con MySQL.");
  },

  // Usuario
  async saveUser(user) {
    try {
      localStorage.setItem("user_session", JSON.stringify(user));
    } catch (error) {
      console.error("Error al guardar sesión de usuario:", error);
    }
  },

  getUser() {
    try {
      const data = localStorage.getItem("user_session");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error al obtener sesión de usuario:", error);
      return null;
    }
  },

  clearUser() {
    try {
      localStorage.removeItem("user_session");
    } catch (error) {
      console.error("Error al eliminar sesión de usuario:", error);
    }
  },

  // Clientes
  async getCustomers() {
    try {
      const response = await fetch(`${API_URL}/customers`);
      if (!response.ok) throw new Error('Error de red');
      return await response.json();
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      return [];
    }
  },

  async saveCustomers(customers) {
    console.warn("Storage.saveCustomers está obsoleto con MySQL.");
  },

  // Proveedores
  async getSuppliers() {
    try {
      const response = await fetch(`${API_URL}/suppliers`);
      if (!response.ok) throw new Error('Error de red');
      return await response.json();
    } catch (error) {
      console.error("Error al obtener proveedores:", error);
      return [];
    }
  },

  async saveSuppliers(suppliers) {
    console.warn("Storage.saveSuppliers está obsoleto con MySQL.");
  },

  // Catálogos
  async getProductTypes() {
    try {
      const response = await fetch(`${API_URL}/product-types`);
      if (!response.ok) throw new Error('Error de red');
      return await response.json();
    } catch (error) {
      console.error("Error al obtener tipos de producto:", error);
      return [];
    }
  },

  async getSizes() {
    try {
      const response = await fetch(`${API_URL}/sizes`);
      if (!response.ok) throw new Error('Error de red');
      return await response.json();
    } catch (error) {
      console.error("Error al obtener tallas:", error);
      return [];
    }
  },

  // Helpers para llamadas API directas (que reemplazarán a los .push y save... masivos)
  API: {
    // Inventory
    createProduct: async (product) => {
      const response = await fetch(`${API_URL}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      return response.json();
    },
    updateProduct: async (product) => {
      const response = await fetch(`${API_URL}/inventory/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      return response.json();
    },
    deleteProduct: async (id) => {
      const response = await fetch(`${API_URL}/inventory/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },

    // Customers
    createCustomer: async (customer) => {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      return response.json();
    },
    updateCustomer: async (customer) => {
      const response = await fetch(`${API_URL}/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
      });
      return response.json();
    },
    deleteCustomer: async (id) => {
      const response = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },

    // Suppliers
    createSupplier: async (supplier) => {
      const response = await fetch(`${API_URL}/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier)
      });
      return response.json();
    },
    updateSupplier: async (supplier) => {
      const response = await fetch(`${API_URL}/suppliers/${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplier)
      });
      return response.json();
    },
    deleteSupplier: async (id) => {
      const response = await fetch(`${API_URL}/suppliers/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },

    // Sales
    createSale: async (sale) => {
      const response = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      return response.json();
    },
    deleteSale: async (id) => {
      const response = await fetch(`${API_URL}/sales/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },

    // Auth - Login
    login: async (password) => {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return response.json();
    }
  }
};
