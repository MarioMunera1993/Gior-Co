const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gior_co_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initDB() {
    try {
        const connection = await pool.getConnection();

        // Crear base de datos si no existe (esto requiere permiso root a veces, o conexión sin especificar DB)
        // Para simplificar, asumiremos que la DB se puede crear o ya existe. 
        // Nota: mysql2 pool con 'database' especificado fallará si la DB no existe. 
        // Mejor enfoque: Conectar sin DB, crearla, re-conectar o usar 'CREATE DATABASE IF NOT EXISTS' via query si el usuario tiene permisos.
        // Dado el setup simple, intentaremos crear las tablas directamente. Si falla conexión, avisaremos.

        console.log('Conectado a MySQL...');

        // Tabla Usuarios
        await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'employee') NOT NULL
      )
    `);

        // Insertar usuario admin por defecto si no existe
        const [users] = await connection.query('SELECT * FROM users WHERE username = "Administrador"');
        if (users.length === 0) {
            await connection.query(`
        INSERT INTO users (username, password, role) VALUES 
        ('Administrador', 'Gior&Co2026*', 'admin'),
        ('Trabajador', 'Gior2026*', 'employee')
      `);
            console.log('Usuarios por defecto creados.');
        }

        // Tabla Clientes
        await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        primerApellido VARCHAR(100),
        segundoApellido VARCHAR(100),
        nombre VARCHAR(100),
        telefono VARCHAR(20),
        correo VARCHAR(100),
        direccion TEXT,
        fechaRegistro DATETIME
      )
    `);

        // Tabla Proveedores
        await connection.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id VARCHAR(50) PRIMARY KEY,
        razonSocial VARCHAR(100),
        identificacion VARCHAR(50),
        tipoIdentificacion VARCHAR(20),
        nombreContacto VARCHAR(100),
        telefono VARCHAR(20),
        correo VARCHAR(100),
        direccion TEXT,
        fechaRegistro DATETIME
      )
    `);

        // Tabla Inventario
        await connection.query(`
      CREATE TABLE IF NOT EXISTS inventory (
        id VARCHAR(50) PRIMARY KEY,
        codigo VARCHAR(50) UNIQUE,
        nombre VARCHAR(100),
        talla VARCHAR(20),
        color VARCHAR(50),
        cantidad INT,
        precio DECIMAL(10, 2)
      )
    `);

        // Tabla Ventas
        await connection.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id VARCHAR(50) PRIMARY KEY,
        idProducto VARCHAR(50),
        codigoProducto VARCHAR(50),
        nombreProducto VARCHAR(100),
        cantidad INT,
        precioUnitario DECIMAL(10, 2),
        totalVenta DECIMAL(10, 2),
        detalle TEXT,
        fecha DATETIME,
        vendedor VARCHAR(100),
        FOREIGN KEY (idProducto) REFERENCES inventory(id) ON DELETE SET NULL
      )
    `);

        console.log('Tablas inicializadas correctamente.');
        connection.release();
    } catch (error) {
        console.error('Error al inicializar la base de datos:', error);
        // Si el error es 'Unknown database', sugerir creación
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error(`\n¡ATENCION! La base de datos '${process.env.DB_NAME || 'gior_co_db'}' no existe.`);
            console.error("Por favor, crea la base de datos manualmente en MySQL ejecutando: CREATE DATABASE gior_co_db;");
        }
    }
}

module.exports = { pool, initDB };
