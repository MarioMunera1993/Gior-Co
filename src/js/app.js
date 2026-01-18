/**
 * MÓDULO PRINCIPAL DE APLICACIÓN
 * ==============================
 * Punto de entrada de la aplicación
 * - Inicializa el tema oscuro
 * - Restaura sesión del usuario si existe
 * - Configura event listeners globales
 * - Maneja errores fatales
 */

// Función principal de inicialización
function init() {
  try {
    // Aplicar configuración de dark mode si estaba activado
    UI.initDarkMode();

    // Intentar restaurar la sesión del usuario guardada en localStorage
    const sessionRestored = Auth.restoreSession();

    if (sessionRestored) {
      // Si hay sesión activa, ocultar modal de login y mostrar contenido
      UI.hideLoginModal();
      Inventory.loadAndRefreshUI();
      UI.updateUIPermissions();
      UI.showTab("inventario");
    } else {
      // Si no hay sesión, mostrar modal de login
      UI.showLoginModal();
    }

    // Inicializar todos los event listeners de la aplicación
    Events.initializeEventListeners();
  } catch (error) {
    // Capturar y mostrar errores fatales
    console.error("Error fatal al inicializar la aplicación:", error);
    document.body.innerHTML =
      '<div style="padding: 20px; color: red; font-family: sans-serif;"><h1>Error al cargar la aplicación</h1><p>Por favor, recarga la página.</p></div>';
  }
}

// Ejecutar función de inicialización cuando el DOM esté completamente cargado
window.addEventListener("load", init);
