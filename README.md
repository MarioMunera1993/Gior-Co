# Gior&Co - Sistema de Inventario y Ventas

Sistema web para gestión de inventario y ventas de ropa con autenticación basada en roles.

## 📋 Características

- ✅ **Autenticación con dos roles**: Administrador y Empleado
- 📦 **Gestión de inventario**: Agregar, editar y eliminar productos
- 💰 **Control de ventas**: Registrar y visualizar ventas
- � **Gestión de clientes**: Registrar y administrar clientes con campos: apellidos, nombre, teléfono, correo y dirección- 🏭 **Gestión de proveedores**: Registrar y administrar proveedores con campos: razón social, identificación, tipo de identificación, dirección, teléfono, contacto y correo- 📊 **Gráficos y analytics**: Visualización de datos con Chart.js
- 🌙 **Modo oscuro**: Soporte completo para dark mode
- 📱 **Diseño responsivo**: Funciona en desktop y móviles
- 💾 **Almacenamiento local**: Los datos se guardan en localStorage
- ✔️ **Validación robusta**: Validación de datos en entrada con mensajes descriptivos

## 🔐 Credenciales de Prueba

| Rol       | Contraseña         | Permisos                              |
|-----------|-------------------|---------------------------------------|
| Admin     | `Gior&Co2026*`   | Acceso completo (agregar, editar, ver gráficos, gestionar clientes y proveedores) |
| Empleado  | `Gior2026*`      | Visualizar inventario, registrar ventas, ver clientes y proveedores |

## 📁 Estructura del Proyecto

```
Gior-Co/
├── index.html           # HTML principal
├── README.md            # Este archivo
├── .gitignore           # Archivos a ignorar en git
├── src/
│   ├── css/
│   │   └── index.css              # Estilos personalizados
│   └── js/
│       ├── app.js                 # Inicialización de la app
│       ├── app-state.js           # Estado global
│       ├── auth.js                # Autenticación y permisos
│       ├── charts.js              # Gráficos y visualización
│       ├── customers.js           # Gestión de clientes
│       ├── suppliers.js           # Gestión de proveedores
│       ├── events.js              # Manejadores de eventos
│       ├── inventory.js           # Gestión de inventario
│       ├── sales.js               # Gestión de ventas
│       ├── storage.js             # Persistencia de datos (localStorage)
│       ├── ui.js                  # Funciones de UI/UX
│       ├── utils.js               # Funciones utilitarias
│       ├── index.js.old           # Archivo anterior (respaldo)
│       └── validators/
│           ├── customer.js        # Validación de clientes
│           ├── supplier.js        # Validación de proveedores
│           └── input.js           # Validación de entrada general
└── index.js.old         # Archivo original consolidado
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

## 👥 Módulo de Clientes

El módulo de gestión de clientes permite registrar y administrar la información de los clientes con los siguientes campos:

- **Primer Apellido** - Requerido, máximo 50 caracteres
- **Segundo Apellido** - Opcional, máximo 50 caracteres
- **Nombre** - Requerido, máximo 50 caracteres
- **Teléfono** - Requerido, mínimo 7 dígitos
- **Correo** - Requerido, debe ser un correo válido (único en el sistema)
- **Dirección** - Requerido, máximo 150 caracteres

**Funcionalidades:**
- ✅ Agregar nuevos clientes con validación
- ✅ Editar información de clientes existentes
- ✅ Eliminar clientes del sistema
- ✅ Buscar clientes por nombre, teléfono o correo
- ✅ Ver lista completa de clientes registrados
- ✅ Validación de correo único para evitar duplicados

**Permisos:**
- Solo administradores pueden agregar, editar y eliminar clientes
- Empleados pueden ver el listado de clientes

## 🏭 Módulo de Proveedores

El módulo de gestión de proveedores permite registrar y administrar la información de los proveedores con los siguientes campos:

- **Razón Social** - Requerido, máximo 100 caracteres
- **Identificación** - Requerido, máximo 30 caracteres
- **Tipo de Identificación** - Requerido (RUT, NIT, RFC, CURP, CUIT, PAS, OTR)
- **Dirección** - Requerido, máximo 150 caracteres
- **Teléfono** - Requerido, mínimo 7 dígitos
- **Nombre del Contacto** - Requerido, máximo 100 caracteres
- **Correo** - Requerido, debe ser un correo válido

**Funcionalidades:**
- ✅ Agregar nuevos proveedores con validación completa
- ✅ Editar información de proveedores existentes
- ✅ Eliminar proveedores del sistema
- ✅ Buscar proveedores por razón social, identificación, contacto o correo
- ✅ Ver lista completa de proveedores registrados
- ✅ Validación de identificación y correo únicos para evitar duplicados

**Permisos:**
- Solo administradores pueden agregar, editar y eliminar proveedores

## ⚠️ Notas de Seguridad

> **Importante**: Este es un proyecto de demostración. Para producción:
> - Implementar backend con autenticación segura
> - Usar tokens JWT en lugar de contraseñas hardcodeadas
> - Validar datos en servidor
> - Usar HTTPS
> - Implementar base de datos

## 📝 Posibles mejoras futuras

- [ ] Vincular clientes con ventas (historial de compras)
- [ ] Vincular proveedores con productos (gestión de compras)
- [ ] Gráficos de clientes y proveedores
- [ ] Sistema de órdenes de compra a proveedores
- [ ] Integración con backend
- [ ] Autenticación OAuth
- [ ] Exportar datos a PDF/Excel
- [ ] Búsqueda avanzada con filtros complejos
- [ ] Historial de cambios (auditoría)
- [ ] Multiidioma
- [ ] Sistema de crédito para clientes
- [ ] Notificaciones por correo

## 📧 Contacto

Proyecto desarrollado por Gior&Co

---

**Última actualización**: 18 Enero 2026
