const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDB() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Data2026*', // Usamos la clave proporcionada
        });

        await connection.query('CREATE DATABASE IF NOT EXISTS gior_co_db');
        console.log('Base de datos gior_co_db creada o ya existente.');
        await connection.end();
    } catch (error) {
        console.error('Error al crear la base de datos:', error);
    }
}

createDB();
