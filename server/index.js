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

// --- CATÁLOGOS ---
app.get('/api/product-types', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT idTipoProducto as id, nombre FROM tipo_producto ORDER BY nombre');
        res.json(rows);
    } catch (error) {
        console.error('Error GET /product-types:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/sizes', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT idTalla as id, nombre FROM talla ORDER BY idTalla');
        res.json(rows);
    } catch (error) {
        console.error('Error GET /sizes:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    try {
        const { codigo, nombre, idTalla, color, cantidad, precio, idTipoProducto } = req.body;
        // frontend envia 'nombre' que es descripcion

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 3. Insertar Producto
            const [resProd] = await connection.query(
                'INSERT INTO producto (codigo, idTipoProducto, descripcion, color, idTalla, precio) VALUES (?, ?, ?, ?, ?, ?)',
                [codigo, idTipoProducto, nombre, color, idTalla, precio]
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
                v.idVenta, -- ID de la FACTURA
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
        const { items, vendedor, idCliente } = req.body;
        // items: [{ idProducto, cantidad, precioUnitario }, ...]

        // Validaciones básicas
        if (!idCliente) throw new Error("Cliente es requerido");
        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error("La venta debe contener al menos un producto");
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Verificar Stock de TODOS los productos antes de proceder
            for (const item of items) {
                const [stocks] = await connection.query(
                    'SELECT cantidadActual FROM stock WHERE idProducto = ?',
                    [item.idProducto]
                );
                if (stocks.length === 0) {
                    throw new Error(`Producto ID ${item.idProducto} no encontrado en stock`);
                }
                if (stocks[0].cantidadActual < item.cantidad) {
                    throw new Error(`Stock insuficiente para producto ID ${item.idProducto}`);
                }
            }

            // 2. Calcular total de la venta
            const total = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);

            // 3. Crear Venta (Cabecera)
            const [resVenta] = await connection.query(
                'INSERT INTO venta (idCliente, total, vendedor) VALUES (?, ?, ?)',
                [idCliente, total, vendedor]
            );
            const idVenta = resVenta.insertId;

            // 4. Para cada producto: crear detalle, actualizar stock y registrar movimiento
            for (const item of items) {
                // 4a. Crear Detalle Venta
                await connection.query(
                    'INSERT INTO detalle_venta (idVenta, idProducto, cantidad, precioUnitario) VALUES (?, ?, ?, ?)',
                    [idVenta, item.idProducto, item.cantidad, item.precioUnitario]
                );

                // 4b. Actualizar Stock
                await connection.query(
                    'UPDATE stock SET cantidadActual = cantidadActual - ? WHERE idProducto = ?',
                    [item.cantidad, item.idProducto]
                );

                // 4c. Registrar Movimiento (Salida)
                await connection.query(
                    'INSERT INTO inventario (idProducto, tipoMovimiento, cantidad, referenciaId) VALUES (?, ?, ?, ?)',
                    [item.idProducto, 'SALIDA', item.cantidad, idVenta]
                );
            }

            await connection.commit();
            res.json({ message: 'Venta registrada exitosamente', id: idVenta, itemsCount: items.length });

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

app.delete('/api/sales/:id', async (req, res) => {
    const { id } = req.params; // ID de la VENTA (Factura)
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Obtener todos los items de la venta para revertir stock
        const [items] = await connection.query(
            'SELECT idProducto, cantidad FROM detalle_venta WHERE idVenta = ?',
            [id]
        );

        if (items.length === 0) {
            const [venta] = await connection.query('SELECT idVenta FROM venta WHERE idVenta = ?', [id]);
            if (venta.length === 0) {
                // Si no existe la venta, devolvemos 404
                throw new Error("Venta no encontrada");
            }
        }

        // 2. Revertir Stock y borrar movimientos
        for (const item of items) {
            // Devolver stock
            await connection.query(
                'UPDATE stock SET cantidadActual = cantidadActual + ? WHERE idProducto = ?',
                [item.cantidad, item.idProducto]
            );

            // Registrar movimiento de reversión
            await connection.query(
                'INSERT INTO inventario (idProducto, tipoMovimiento, cantidad, referenciaId) VALUES (?, ?, ?, ?)',
                [item.idProducto, 'ENTRADA (ANULACION)', item.cantidad, id]
            );
        }

        // 3. Borrar Venta (Cascade borrará detalles)
        await connection.query('DELETE FROM detalle_venta WHERE idVenta = ?', [id]);
        await connection.query('DELETE FROM venta WHERE idVenta = ?', [id]);

        await connection.commit();
        res.json({ message: 'Venta eliminada y stock revertido correctamente' });

    } catch (error) {
        await connection.rollback();
        console.error('Error DELETE /sales:', error);
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
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
