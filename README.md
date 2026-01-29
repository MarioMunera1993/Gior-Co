# Gior&Co - Sistema de Inventario y Ventas

Sistema web para gestión de inventario y ventas de ropa con autenticación basada en roles, ahora potenciado con un backend **Node.js** y base de datos **MySQL**.

## 📋 Características

- ✅ **Autenticación con dos roles**: Administrador y Empleado (Gestión de sesiones vía API).
- 📦 **Gestión de Inventario**: CRUD completo con persistencia en base de datos.
- 💰 **Control de Ventas**: Registro de ventas con **selección de clientes** y control de stock transaccional.
- 👥 **Gestión de Clientes**: Base de datos de clientes integrada.
- 🏭 **Gestión de Proveedores**: Directorio de proveedores.
- 📊 **Gráficos y Analytics**: Visualización en tiempo real de stock e ingresos.
- 🌙 **Modo Oscuro**: Soporte nativo para temas claro/oscuro.
- 💾 **Base de Datos MySQL**: Datos centralizados y seguros, reemplazando a `localStorage`. (Solo se usa `localStorage` para sesión).

## 🔐 Credenciales de Acceso

| Rol | Usuario | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | Administrador | `Gior&Co2026*` | Acceso total (ABM productos, ventas, clientes, reportes). |
| **Empleado** | Trabajador | `Gior2026*` | Registrar ventas, ver inventario. |

## 🚀 Instalación y Ejecución

### Prerrequisitos
- **Node.js** (v18 o superior)
- **MySQL Server**

### 1. Configuración de Base de Datos
1. Asegúrate de que MySQL esté corriendo.
2. Crea la base de datos (si no existe, el sistema intentará crearla, pero es mejor asegurar):
   ```sql
   CREATE DATABASE gior_co_db;
   ```

### 2. Configuración del Servidor (Backend)
1. Navega a la carpeta del servidor:
   ```bash
   cd server
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Verifica/Crea el archivo `.env` (opcional, por defecto usa estos valores):
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=Data2026*
   DB_NAME=gior_co_db
   PORT=3000
   ```
4. **Inicia el servidor:**
   ```bash
   node index.js
   ```
   *Deberías ver: "Servidor corriendo en http://localhost:3000" y "Conectado a MySQL..."*

### 3. Ejecución del Cliente (Frontend)
1. Abre una nueva terminal en la raíz del proyecto.
2. Puedes abrir el archivo `index.html` directamente en tu navegador, o usar un servidor estático para evitar bloqueos CORS estrictos:
   ```bash
   npx serve .
   ```
3. Accede a la URL indicada (ej. `http://localhost:5000` o la ruta del archivo).

## 📁 Estructura del Proyecto

```
Gior-Co/
├── server/                  # [NUEVO] Backend Node.js
│   ├── index.js             # API REST (Express)
│   ├── db.js                # Conexión MySQL y Esquemas
│   ├── package.json         # Dependencias del servidor
│   └── ...scripts           # Scripts de utilidad
├── src/
│   ├── js/
│   │   ├── storage.js       # [ACTUALIZADO] Cliente API (Fetch)
│   │   ├── sales.js         # Lógica de ventas (con integración de clientes)
│   │   ├── ...              # Módulos de lógica frontend
│   └── css/                 # Estilos Tailwind/Custom
├── index.html               # SPA Principal
└── README.md                # Documentación
```

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5, Tailwind CSS, JavaScript (Vanilla ES6+).
- **Backend**: Node.js, Express.js.
- **Base de Datos**: MySQL (librería `mysql2` con `async/await`).
- **Gráficos**: Chart.js.

## ⚠️ Notas de Seguridad

> **Nota**: Este proyecto ha migrado de una versión puramente local. Aunque ahora usa backend, las contraseñas en la base de datos de demostración podrían estar en texto plano para facilitar pruebas iniciales. 
> **Recomendación Prod**: En un entorno real, siempre hashear contraseñas (bcrypt/argon2) y usar HTTPS.

---

**Última actualización**: 28 Enero 2026
