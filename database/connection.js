const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// Ensure database directory exists
const dbDir = path.dirname('./database/bot.db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Create Sequelize instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './database/bot.db',
    logging: config.LOG_LEVEL === 'debug' ? console.log : false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: true,
        underscored: false
    }
});

// Test database connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        return false;
    }
}

// Initialize database
async function initializeDatabase() {
    try {
        // Import models
        require('./models');
        
        // Sync all models
        await sequelize.sync({ alter: true });
        console.log('✅ Database tables synchronized successfully.');
        
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
}

module.exports = {
    sequelize,
    testConnection,
    initializeDatabase
};