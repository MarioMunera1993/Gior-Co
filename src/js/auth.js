// Auth Module - Autenticación y permisos
const ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
};

const PASSWORDS = {
  "Gior&Co2026*": { role: ROLES.ADMIN, username: "Administrador" },
  "Gior2026*": { role: ROLES.EMPLOYEE, username: "Trabajador" },
};

let currentUser = null;

const Auth = {
  login(password) {
    const validation = InputValidator.validatePassword(password);
    if (!validation.isValid) {
      return { success: false, error: validation.errors[0] };
    }

    const userConfig = PASSWORDS[password];

    if (userConfig) {
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
    const savedUser = Storage.getUser();
    if (savedUser) {
      currentUser = savedUser;
      return true;
    }
    return false;
  },
};
