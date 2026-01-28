const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Data2026*',
            database: process.env.DB_NAME || 'gior_co_db',
        });

        console.log('Conectado a la BD para actualización...');

        // Verificar si la columna ya existe
        const [columns] = await connection.query("SHOW COLUMNS FROM sales LIKE 'idCliente'");

        if (columns.length === 0) {
            console.log('Agregando columna idCliente a la tabla sales...');
            // Asumiendo que customers.id es INT (basado en create_db.js usual, verificar si es varchar)
            // En db.js initDB users es id INT AUTO_INCREMENT. Customers probable id VARCHAR(50) si se usaba el generator.
            // Espera, en storage.js generábamos IDs.
            // Voy a chequear customers en la BD real primero o asumir VARCHAR(50) para estar seguros, ya que Utils.generateId() son strings.

            // Mejor verifico tipo de dato de customers.id primero
            const [custColumns] = await connection.query("SHOW COLUMNS FROM customers LIKE 'id'");
            const idType = custColumns[0].Type;
            console.log('Tipo de dato de customers.id:', idType);

            await connection.query(`ALTER TABLE sales ADD COLUMN idCliente ${idType}`);
            console.log('Columna agregada.');

            // Agregar FK (opcional, puede fallar si hay datos)
            // await connection.query('ALTER TABLE sales ADD CONSTRAINT fk_sales_customer FOREIGN KEY (idCliente) REFERENCES customers(id) ON DELETE SET NULL');
        } else {
            console.log('La columna idCliente ya existe.');
        }

        await connection.end();
        console.log('Esquema actualizado.');

    } catch (error) {
        console.error('Error actualizando esquema:', error);
    }
}

updateSchema();
