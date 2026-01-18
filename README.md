# Gior&Co - Sistema de Inventario y Ventas

Sistema web para gestión de inventario y ventas de ropa con autenticación basada en roles.

## 📋 Características

- ✅ **Autenticación con dos roles**: Administrador y Empleado
- 📦 **Gestión de inventario**: Agregar, editar y eliminar productos
- 💰 **Control de ventas**: Registrar y visualizar ventas
- 📊 **Gráficos y analytics**: Visualización de datos con Chart.js
- 🌙 **Modo oscuro**: Soporte completo para dark mode
- 📱 **Diseño responsivo**: Funciona en desktop y móviles
- 💾 **Almacenamiento local**: Los datos se guardan en localStorage

## 🔐 Credenciales de Prueba

| Rol       | Contraseña         | Permisos                              |
|-----------|-------------------|---------------------------------------|
| Admin     | `Gior&Co2026*`   | Acceso completo (agregar, editar, gráficos) |
| Empleado  | `Gior2026*`      | Solo visualizar inventario y registrar ventas |

## 📁 Estructura del Proyecto

```
Gior-Co/
├── index.html           # HTML principal
├── src/
│   ├── css/
│   │   └── index.css    # Estilos personalizados
│   ├── js/
│   │   ├── index.js     # Lógica principal
│   │   ├── auth.js      # Autenticación
│   │   ├── inventory.js # Gestión de inventario
│   │   ├── sales.js     # Gestión de ventas
│   │   ├── ui.js        # Funciones de UI
│   │   ├── storage.js   # Manejo de datos
│   │   └── utils.js     # Funciones utilitarias
│   └── js/validators/   # Validaciones
│       └── input.js     # Validación de entrada
├── .gitignore
└── README.md
```

## 🚀 Cómo usar

1. Abre `index.html` en tu navegador
2. Ingresa una contraseña según tu rol
3. Accede al sistema de inventario y ventas

## 🛠️ Tecnologías

- **HTML5** - Estructura
- **CSS3** + **Tailwind CSS** - Estilos
- **JavaScript (Vanilla)** - Lógica
- **Chart.js** - Gráficos
- **LocalStorage** - Persistencia de datos

## ⚠️ Notas de Seguridad

> **Importante**: Este es un proyecto de demostración. Para producción:
> - Implementar backend con autenticación segura
> - Usar tokens JWT en lugar de contraseñas hardcodeadas
> - Validar datos en servidor
> - Usar HTTPS
> - Implementar base de datos

## 📝 Próximas mejoras

- [ ] Integración con backend
- [ ] Autenticación OAuth
- [ ] Exportar datos a PDF/Excel
- [ ] Búsqueda avanzada
- [ ] Historial de cambios
- [ ] Multiidioma

## 📧 Contacto

Proyecto desarrollado por Gior&Co

---

**Última actualización**: 18 Enero 2026
