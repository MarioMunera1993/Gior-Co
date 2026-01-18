// Main App - Inicialización y orquestación
function init() {
  try {
    // Inicializar dark mode
    UI.initDarkMode();

    // Restaurar sesión si existe
    const sessionRestored = Auth.restoreSession();

    if (sessionRestored) {
      UI.hideLoginModal();
      Inventory.loadAndRefreshUI();
      UI.updateUIPermissions();
      UI.showTab("inventario");
    } else {
      UI.showLoginModal();
    }

    // Inicializar event listeners
    Events.initializeEventListeners();
  } catch (error) {
    console.error("Error fatal al inicializar la aplicación:", error);
    document.body.innerHTML =
      '<div style="padding: 20px; color: red; font-family: sans-serif;"><h1>Error al cargar la aplicación</h1><p>Por favor, recarga la página.</p></div>';
  }
}

// Iniciar cuando el DOM está listo
window.addEventListener("load", init);
