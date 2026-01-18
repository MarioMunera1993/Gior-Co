/**
 * MÓDULO DE AUTENTICACIÓN
 * ======================
 * Gestiona:
 * - Login/Logout de usuarios
 * - Roles de acceso (Admin, Employee)
 * - Verificación de permisos
 * - Sesiones persistentes
 * 
 * Credenciales disponibles:
 * - Admin: Gior&Co2026* (acceso total)
 * - Employee: Gior2026* (acceso limitado)
 */

// Roles disponibles en el sistema
const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

// Credenciales válidas (en producción usar backend con tokens)
const PASSWORDS = {
  "Gior&Co2026*": { role: ROLES.ADMIN, username: "Administrador" },
  "Gior2026*": { role: ROLES.EMPLOYEE, username: "Trabajador" },
};

// Usuario actualmente autenticado
let currentUser = null;

const Auth = {
  // Validar contraseña e iniciar sesión
  login(password) {
    const validation = InputValidator.validatePassword(password);
    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    const userConfig = PASSWORDS[password];

    if (userConfig) {
      // Crear objeto de usuario autenticado
      currentUser = {
        username: userConfig.username,
        role: userConfig.role,
        id: Utils.generateId(),
      };
      Storage.saveUser(currentUser);
      return { success: true, user: currentUser };
    }

    return { success: false, error: "Contraseña incorrecta" };
  },

  // Cerrar sesión
  logout() {
    currentUser = null;
    Storage.clearUser();
  },

  // Obtener usuario actual
  getCurrentUser() {
    return currentUser;
  },

  // Establecer usuario manualmente
  setCurrentUser(user) {
    currentUser = user;
  },

  // Verificar si usuario es administrador
  isAdmin() {
    return currentUser?.role === ROLES.ADMIN;
  },

  // Verificar si usuario es empleado
  isEmployee() {
    return currentUser?.role === ROLES.EMPLOYEE;
  },

  // Verificar si hay sesión activa
  isAuthenticated() {
    return currentUser !== null;
  },

  // Intentar restaurar sesión anterior
  restoreSession() {
    const savedUser = Storage.getUser();
    if (savedUser) {
      currentUser = savedUser;
      return true;
    }
    return false;
  },
};
