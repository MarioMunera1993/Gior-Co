const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDBv2() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Data2026*'
        });

        console.log('Conectado a MySQL. Preparando base de datos...');

        // Crear BD si no existe y usarla
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'gior_co_db'}`);
        await connection.query(`USE ${process.env.DB_NAME || 'gior_co_db'}`);

        // Desactivar FK checks para poder borrar tablas en cualquier orden
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // Borrar tablas viejas o existentes para empezar limpio
        const tables = [
            'stock', 'inventario', 'detalle_venta', 'detalle_compra', 'venta', 'compra',
            'producto', 'cliente', 'proveedor', 'talla', 'tipo_producto',
            'users', 'customers', 'suppliers', 'sales', 'inventory' // Tablas de version anterior
        ];

        for (const table of tables) {
            await connection.query(`DROP TABLE IF EXISTS ${table}`);
        }
        console.log('Tablas anteriores eliminadas.');

        // --- USUARIOS (Sistema Auth) ---
        // Mantenemos la tabla users para el login, adaptada o simple
        await connection.query(`
        CREATE TABLE users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'employee') DEFAULT 'employee',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

        // Insertar usuarios por defecto
        await connection.query(`
        INSERT INTO users (username, password, role) VALUES 
        ('Administrador', 'Gior&Co2026*', 'admin'),
        ('Trabajador', 'Gior2026*', 'employee')
    `);

        // --- TABLAS MAESTRAS ---

        // Proveedores
        await connection.query(`
        CREATE TABLE proveedor (
            idProveedor INT PRIMARY KEY AUTO_INCREMENT,
            razonSocial VARCHAR(150) NOT NULL,
            tipoIdentificacion VARCHAR(20) NOT NULL,
            identificacion VARCHAR(50) NOT NULL UNIQUE,
            direccion VARCHAR(150),
            telefono VARCHAR(20),
            nombreContacto VARCHAR(100),
            correo VARCHAR(100),
            activo TINYINT(1) DEFAULT 1,
            fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fechaModificacion TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_identificacion (identificacion),
            INDEX idx_razonSocial (razonSocial)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Clientes
        await connection.query(`
        CREATE TABLE cliente(
            idCliente INT PRIMARY KEY AUTO_INCREMENT,
            primerApellido VARCHAR(50) NOT NULL,
            segundoApellido VARCHAR(50),
            nombre VARCHAR(50) NOT NULL,
            telefono VARCHAR(20),
            correo VARCHAR(100),
            direccion VARCHAR(100),
            fechaCreacion DATE NOT NULL DEFAULT (CURRENT_DATE),
            fechaModificacion DATETIME DEFAULT (CURRENT_DATE),
            activo TINYINT(1) DEFAULT 1
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Catálogos
        await connection.query(`
        CREATE TABLE tipo_producto (
            idTipoProducto INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(50) NOT NULL UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Insertar algunos tipos por defecto
        await connection.query(`INSERT INTO tipo_producto (nombre) VALUES ('Camisa'), ('Pantalón'), ('Zapato'), ('Accesorio')`);

        await connection.query(`
        CREATE TABLE talla (
            idTalla INT PRIMARY KEY AUTO_INCREMENT,
            nombre VARCHAR(10) NOT NULL UNIQUE,
            homologacion INT UNIQUE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // Insertar tallas por defecto
        await connection.query(`INSERT INTO talla (nombre) VALUES ('XS'), ('S'), ('M'), ('L'), ('XL'), ('38'), ('39'), ('40'), ('41'), ('42')`);

        // PRODUCTO
        await connection.query(`
        CREATE TABLE producto (
            idProducto INT PRIMARY KEY AUTO_INCREMENT,
            codigo VARCHAR(50) NOT NULL UNIQUE,
            idTipoProducto INT NOT NULL,
            descripcion VARCHAR(150) NOT NULL,
            color VARCHAR(50),
            idTalla INT,
            precio DECIMAL(12,2) NOT NULL DEFAULT 0, -- Agregado precio aquí para simplificar ventas
            activo TINYINT(1) DEFAULT 1,
            fechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fechaModificacion TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (idTipoProducto) REFERENCES tipo_producto(idTipoProducto),
            FOREIGN KEY (idTalla) REFERENCES talla(idTalla),
            INDEX idx_codigo (codigo),
            INDEX idx_tipo (idTipoProducto)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        // STOCK
        await connection.query(`
        CREATE TABLE stock (
            idProducto INT PRIMARY KEY,
            cantidadActual INT NOT NULL DEFAULT 0,
            stockMinimo INT NOT NULL DEFAULT 0,
            stockMaximo INT NOT NULL DEFAULT 0,
            ultimaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (idProducto) REFERENCES producto(idProducto) ON DELETE CASCADE
        )
    `);

        // --- TRANSNACIONALES ---

        // Compras (Entradas)
        await connection.query(`
        CREATE TABLE compra (
            idCompra INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            idProveedor INT NOT NULL,
            fechaCompra TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            numeroFactura VARCHAR(50),
            total DECIMAL(12,2),
            FOREIGN KEY (idProveedor) REFERENCES proveedor(idProveedor)
        ) ENGINE=InnoDB
    `);

        await connection.query(`
        CREATE TABLE detalle_compra (
            idDetalleCompra INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            idCompra INT UNSIGNED NOT NULL,
            idProducto INT NOT NULL,
            cantidad INT NOT NULL,
            precioUnitario DECIMAL(12,2) NOT NULL,
            CONSTRAINT fk_det_compra FOREIGN KEY (idCompra) REFERENCES compra(idCompra) ON DELETE CASCADE,
            CONSTRAINT fk_det_prod_c FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
        ) ENGINE=InnoDB
    `);

        // Ventas (Salidas)
        await connection.query(`
        CREATE TABLE venta (
            idVenta INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            idCliente INT NOT NULL,
            fechaVenta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total DECIMAL(12,2),
            vendedor VARCHAR(100), -- Agregado para rastrear quién vendió
            CONSTRAINT fk_venta_cli FOREIGN KEY (idCliente) REFERENCES cliente(idCliente)
        ) ENGINE=InnoDB
    `);

        await connection.query(`
        CREATE TABLE detalle_venta (
            idDetalleVenta INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            idVenta INT UNSIGNED NOT NULL,
            idProducto INT NOT NULL,
            cantidad INT NOT NULL,
            precioUnitario DECIMAL(12,2) NOT NULL,
            CONSTRAINT fk_det_venta FOREIGN KEY (idVenta) REFERENCES venta(idVenta) ON DELETE CASCADE,
            CONSTRAINT fk_det_prod_v FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
        ) ENGINE=InnoDB
    `);

        // Inventario (Kardex/Historial)
        await connection.query(`
        CREATE TABLE inventario (
            idInventario INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            idProducto INT NOT NULL,
            tipoMovimiento ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
            cantidad INT NOT NULL,
            referenciaId INT UNSIGNED, -- El ID de la compra o de la venta
            fechaMovimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_inv_prod FOREIGN KEY (idProducto) REFERENCES producto(idProducto)
        ) ENGINE=InnoDB
    `);

        // Reactivar FK checks
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Esquema normalizado v2 inicializado correctamente.');
        await connection.end();

    } catch (error) {
        console.error('Error al inicializar la BD:', error);
    }
}

initDBv2();
