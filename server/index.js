const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Pool de conexión (Misma config)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Data2026*',
    database: process.env.DB_NAME || 'gior_co_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Rutas de la API (Adaptada a Schema v2)

// --- INVENTARIO (Productos + Stock) ---
app.get('/api/inventory', async (req, res) => {
    try {
        // Query para unir producto, stock, tipo y talla
        // Alias para mantener compatibilidad con frontend (id, nombre, etc.)
        const query = `
            SELECT 
                p.idProducto as id,
                p.codigo,
                p.descripcion as nombre,
                t.nombre as talla,
                p.color,
                tp.nombre as tipo,
                s.cantidadActual as cantidad,
                p.precio
            FROM producto p
            LEFT JOIN stock s ON p.idProducto = s.idProducto
            LEFT JOIN talla t ON p.idTalla = t.idTalla
            LEFT JOIN tipo_producto tp ON p.idTipoProducto = tp.idTipoProducto
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error GET /inventory:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    try {
        const { codigo, nombre, talla, color, cantidad, precio } = req.body;
        // frontend envia 'nombre' que es descripcion

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Buscar o Crear ID Talla
            let idTalla = null;
            const [tallas] = await connection.query('SELECT idTalla FROM talla WHERE nombre = ?', [talla]);
            if (tallas.length > 0) {
                idTalla = tallas[0].idTalla;
            } else {
                const [resTalla] = await connection.query('INSERT INTO talla (nombre) VALUES (?)', [talla]);
                idTalla = resTalla.insertId;
            }

            // 2. Buscar o Crear ID Tipo Producto (Por defecto 'Genérico' si no se especifica, aquí asumiremos 'Ropa' o inferencia simple)
            // Para esta demo, asignamos al primer tipo disponible o creamos uno
            let idTipo = 1; // Default

            // 3. Insertar Producto
            const [resProd] = await connection.query(
                'INSERT INTO producto (codigo, idTipoProducto, descripcion, color, idTalla, precio) VALUES (?, ?, ?, ?, ?, ?)',
                [codigo, idTipo, nombre, color, idTalla, precio]
            );
            const idProducto = resProd.insertId;

            // 4. Insertar Stock Inicial
            await connection.query(
                'INSERT INTO stock (idProducto, cantidadActual) VALUES (?, ?)',
                [idProducto, cantidad]
            );

            // 5. Registrar Movimiento Inicial (Entrada)
            await connection.query(
                'INSERT INTO inventario (idProducto, tipoMovimiento, cantidad) VALUES (?, ?, ?)',
                [idProducto, 'ENTRADA', cantidad]
            );

            await connection.commit();
            res.json({ message: 'Producto agregado', id: idProducto });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error POST /inventory:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- CLIENTES ---
app.get('/api/customers', async (req, res) => {
    try {
        // Alias para compatibilidad parcial: idCliente -> id
        const [rows] = await pool.query('SELECT idCliente as id, primerApellido, segundoApellido, nombre, telefono, correo, direccion FROM cliente');
        res.json(rows);
    } catch (error) {
        console.error('Error GET /customers:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { primerApellido, segundoApellido, nombre, telefono, correo, direccion } = req.body;
        // No necesitamos ID, es auto increment. Frontend enviaba UUID pero lo ignoramos o lo usamos como referencia externa si hubiera campo.
        // Aquí usaremos AUTO_INCREMENT nativo.

        await pool.query(
            'INSERT INTO cliente (primerApellido, segundoApellido, nombre, telefono, correo, direccion, fechaCreacion) VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE)',
            [primerApellido, segundoApellido, nombre, telefono, correo, direccion]
        );
        res.json({ message: 'Cliente agregado' });
    } catch (error) {
        console.error('Error POST /customers:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- PROVEEDORES ---
app.get('/api/suppliers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT idProveedor as id, razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion FROM proveedor');
        res.json(rows);
    } catch (error) {
        console.error('Error GET /suppliers:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    try {
        const { razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion } = req.body;

        await pool.query(
            'INSERT INTO proveedor (razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion]
        );
        res.json({ message: 'Proveedor agregado' });
    } catch (error) {
        console.error('Error POST /suppliers:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- VENTAS ---
app.get('/api/sales', async (req, res) => {
    try {
        // JOIN para obtener nombres y códigos
        const query = `
            SELECT 
                dv.idDetalleVenta as id, -- ID unico del renglon
                v.fechaVenta as fecha,
                p.codigo as codigoProducto,
                p.descripcion as nombreProducto,
                dv.cantidad,
                dv.precioUnitario,
                (dv.cantidad * dv.precioUnitario) as totalVenta,
                v.vendedor,
                CONCAT(c.nombre, ' ', c.primerApellido) as detalle -- Usamos nombre cliente como detalle por ahora
            FROM detalle_venta dv
            JOIN venta v ON dv.idVenta = v.idVenta
            JOIN producto p ON dv.idProducto = p.idProducto
            JOIN cliente c ON v.idCliente = c.idCliente
            ORDER BY v.fechaVenta DESC
        `;
        const [rows] = await pool.query(query);
        res.json(rows);
    } catch (error) {
        console.error('Error GET /sales:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sales', async (req, res) => {
    try {
        const { idProducto, cantidad, precioUnitario, detalle, vendedor, idCliente } = req.body;
        // El frontend envia 'idProducto' que ahora debe ser el INT de la tabla producto.

        // Validación de cliente
        if (!idCliente) throw new Error("Cliente es requerido");

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Verificar Stock
            const [stocks] = await connection.query('SELECT cantidadActual FROM stock WHERE idProducto = ?', [idProducto]);
            if (stocks.length === 0) throw new Error('Producto no encontrado en stock');
            if (stocks[0].cantidadActual < cantidad) throw new Error('Stock insuficiente');

            // 2. Crear Venta (Cabecera)
            const total = cantidad * precioUnitario;
            const [resVenta] = await connection.query(
                'INSERT INTO venta (idCliente, total, vendedor) VALUES (?, ?, ?)',
                [idCliente, total, vendedor]
            );
            const idVenta = resVenta.insertId;

            // 3. Crear Detalle Venta
            await connection.query(
                'INSERT INTO detalle_venta (idVenta, idProducto, cantidad, precioUnitario) VALUES (?, ?, ?, ?)',
                [idVenta, idProducto, cantidad, precioUnitario]
            );

            // 4. Actualizar Stock
            await connection.query('UPDATE stock SET cantidadActual = cantidadActual - ? WHERE idProducto = ?', [cantidad, idProducto]);

            // 5. Registrar Movimiento (Salida)
            await connection.query(
                'INSERT INTO inventario (idProducto, tipoMovimiento, cantidad, referenciaId) VALUES (?, ?, ?, ?)',
                [idProducto, 'SALIDA', quantidade = cantidad, idVenta]
            );

            await connection.commit();
            res.json({ message: 'Venta registrada', id: idVenta });

        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error POST /sales:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    try {
        const { password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE password = ?', [password]);

        if (users.length > 0) {
            const user = users[0];
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            res.json({ success: false, error: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('Error Login:', error);
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor v2 corriendo en http://localhost:${PORT}`);
});
