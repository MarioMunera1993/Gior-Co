/**
 * MÓDULO DE AUTENTICACIÓN
 * ======================
 */

// Roles disponibles en el sistema
const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

// Usuario actualmente autenticado (en memoria)
let currentUser = null;

const Auth = {
  async login(password) {
    // Validar formato localmente primero
    const validation = InputValidator.validatePassword(password);
    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    try {
      const result = await Storage.API.login(password);

      if (result.success) {
        currentUser = result.user;
        Storage.saveUser(currentUser); // Persistir sesión localmente
        return { success: true, user: currentUser };
      } else {
        return { success: false, error: result.error || "Login fallido" };
      }
    } catch (e) {
      console.error("Login error:", e);
      return { success: false, error: "Error de conexión con el servidor" };
    }
  },

  logout() {
    currentUser = null;
    Storage.clearUser();
  },

  getCurrentUser() {
    return currentUser;
  },

  setCurrentUser(user) {
    currentUser = user;
  },

  isAdmin() {
    return currentUser?.role === ROLES.ADMIN;
  },

  isEmployee() {
    return currentUser?.role === ROLES.EMPLOYEE;
  },

  isAuthenticated() {
    return currentUser !== null;
  },

  restoreSession() {
    // Recuperar sesión guardada
    const savedUser = Storage.getUser();
    if (savedUser) {
      currentUser = savedUser;
      return true;
    }
    return false;
  },
};
