const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDB, pool } = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Iniciar Base de Datos
initDB();

// Rutas de prueba
app.get('/', (req, res) => {
    res.send('API Gior-Co funcionando correctamente');
});

// Rutas de la API (Implementación básica)

// --- INVENTARIO ---
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM inventory');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    try {
        const { id, codigo, nombre, talla, color, cantidad, precio } = req.body;
        await pool.query(
            'INSERT INTO inventory (id, codigo, nombre, talla, color, cantidad, precio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, codigo, nombre, talla, color, cantidad, precio]
        );
        res.json({ message: 'Producto agregado', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { nombre, talla, color, cantidad, precio } = req.body;
        await pool.query(
            'UPDATE inventory SET nombre=?, talla=?, color=?, cantidad=?, precio=? WHERE id=?',
            [nombre, talla, color, cantidad, precio, req.params.id]
        );
        res.json({ message: 'Producto actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/inventory/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM inventory WHERE id=?', [req.params.id]);
        res.json({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- CLIENTES ---
app.get('/api/customers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM customers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/customers', async (req, res) => {
    try {
        const { id, primerApellido, segundoApellido, nombre, telefono, correo, direccion } = req.body;
        await pool.query(
            'INSERT INTO customers (id, primerApellido, segundoApellido, nombre, telefono, correo, direccion, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
            [id, primerApellido, segundoApellido, nombre, telefono, correo, direccion]
        );
        res.json({ message: 'Cliente agregado', id });
    } catch (error) {
        console.error("Error en POST /api/customers:", error);
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/customers/:id', async (req, res) => {
    try {
        const { primerApellido, segundoApellido, nombre, telefono, correo, direccion } = req.body;
        await pool.query(
            'UPDATE customers SET primerApellido=?, segundoApellido=?, nombre=?, telefono=?, correo=?, direccion=? WHERE id=?',
            [primerApellido, segundoApellido, nombre, telefono, correo, direccion, req.params.id]
        );
        res.json({ message: 'Cliente actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/customers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM customers WHERE id=?', [req.params.id]);
        res.json({ message: 'Cliente eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- PROVEEDORES ---
app.get('/api/suppliers', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM suppliers');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    try {
        const { id, razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion, fechaRegistro } = req.body;
        await pool.query(
            'INSERT INTO suppliers (id, razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion, fechaRegistro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion, fechaRegistro]
        );
        res.json({ message: 'Proveedor agregado', id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/suppliers/:id', async (req, res) => {
    try {
        const { razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion } = req.body;
        await pool.query(
            'UPDATE suppliers SET razonSocial=?, identificacion=?, tipoIdentificacion=?, nombreContacto=?, telefono=?, correo=?, direccion=? WHERE id=?',
            [razonSocial, identificacion, tipoIdentificacion, nombreContacto, telefono, correo, direccion, req.params.id]
        );
        res.json({ message: 'Proveedor actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM suppliers WHERE id=?', [req.params.id]);
        res.json({ message: 'Proveedor eliminado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- VENTAS ---
app.get('/api/sales', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM sales');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/sales', async (req, res) => {
    try {
        const { id, idProducto, codigoProducto, nombreProducto, cantidad, precioUnitario, totalVenta, detalle, fecha, vendedor, idCliente } = req.body;

        // Actualizar inventario (Transacción básica)
        const connection = await pool.getConnection(); // Obtener conexión para transacción
        try {
            await connection.beginTransaction();

            // Verificar stock actual
            const [products] = await connection.query('SELECT cantidad FROM inventory WHERE id = ?', [idProducto]);
            if (products.length === 0) throw new Error('Producto no encontrado');
            if (products[0].cantidad < cantidad) throw new Error('Stock insuficiente');

            // Restar stock
            await connection.query('UPDATE inventory SET cantidad = cantidad - ? WHERE id = ?', [cantidad, idProducto]);

            // Registrar venta
            // Ahora incluimos idCliente y usamos NOW() para la fecha
            await connection.query(
                'INSERT INTO sales (id, idProducto, codigoProducto, nombreProducto, cantidad, precioUnitario, totalVenta, detalle, fecha, vendedor, idCliente) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)',
                [id, idProducto, codigoProducto, nombreProducto, cantidad, precioUnitario, totalVenta, detalle, vendedor, idCliente]
            );

            await connection.commit();
            res.json({ message: 'Venta registrada', id });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error("Error en POST /api/sales:", error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/sales/:id', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Obtener venta para revertir stock
            const [sales] = await connection.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
            if (sales.length === 0) throw new Error('Venta no encontrada');

            const sale = sales[0];

            // Revertir stock
            await connection.query('UPDATE inventory SET cantidad = cantidad + ? WHERE id = ?', [sale.cantidad, sale.idProducto]);

            // Eliminar venta
            await connection.query('DELETE FROM sales WHERE id = ?', [req.params.id]);

            await connection.commit();
            res.json({ message: 'Venta eliminada y stock revertido' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- AUTH ---
app.post('/api/auth/login', async (req, res) => {
    console.log('--- INTENTO DE LOGIN ---');
    console.log('Body recibido:', req.body);
    try {
        const { password } = req.body;
        console.log(`Buscando usuario con password: '${password}'`);

        const [users] = await pool.query('SELECT * FROM users WHERE password = ?', [password]);
        console.log(`Usuarios encontrados: ${users.length}`);

        if (users.length > 0) {
            const user = users[0];
            console.log('Login exitoso para:', user.username);
            res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        } else {
            console.log('Login fallido: Contraseña incorrecta');
            res.json({ success: false, error: 'Contraseña incorrecta' });
        }
    } catch (error) {
        console.error('ERROR EN LOGIN:', error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
