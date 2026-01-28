const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsers() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Data2026*',
            database: process.env.DB_NAME || 'gior_co_db',
        });

        console.log('Consultando usuarios...');
        const [rows] = await connection.query('SELECT id, username, password, role FROM users');
        console.log('Usuarios encontrados:', rows);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers();
