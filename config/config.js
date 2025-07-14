require('dotenv').config();

const config = {
    // Bot Configuration
    BOT_NAME: process.env.BOT_NAME || 'WhatsApp AI Bot',
    BOT_PREFIX: process.env.BOT_PREFIX || '/',
    BOT_ADMIN_PHONE: process.env.BOT_ADMIN_PHONE || '',

    // Google Gemini AI
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    AI_CHAT_MODEL: process.env.AI_CHAT_MODEL || 'gemini-1.5-flash',
    AI_ANALYSIS_MODEL: process.env.AI_ANALYSIS_MODEL || 'gemini-1.5-pro',
    AI_IMAGE_GENERATION_MODEL: process.env.AI_IMAGE_GENERATION_MODEL || 'gemini-pro-vision',

    // Database
    DATABASE_URL: process.env.DATABASE_URL || 'sqlite:./database/bot.db',
    DATABASE_TYPE: process.env.DATABASE_TYPE || 'sqlite',

    // Server
    PORT: parseInt(process.env.PORT) || 5000,
    HOST: process.env.HOST || '0.0.0.0',
    WEB_PORT: parseInt(process.env.WEB_PORT) || 3000,
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this',

    // Bot Settings
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 16777216, // 16MB
    MAX_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 30,

    // QR Code
    QR_CODE_TIMEOUT: parseInt(process.env.QR_CODE_TIMEOUT) || 60000,
    AUTO_RECONNECT: process.env.AUTO_RECONNECT === 'true',

    // Admin Dashboard
    DASHBOARD_ENABLED: process.env.DASHBOARD_ENABLED === 'true',
    DASHBOARD_PASSWORD: process.env.DASHBOARD_PASSWORD || 'admin123',

    // Rate Limiting
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX) || 30,

    // File Processing
    SUPPORTED_FILE_TYPES: (process.env.SUPPORTED_FILE_TYPES || 'pdf,txt,html,js,py,json,csv,md,xml,yaml,yml,log,css,java,cpp,c,php,rb,go,rs,swift').split(','),
    SUPPORTED_IMAGE_TYPES: (process.env.SUPPORTED_IMAGE_TYPES || 'jpg,jpeg,png,gif,webp').split(','),

    // Games
    ROCK_PAPER_SCISSORS_TIMEOUT: parseInt(process.env.ROCK_PAPER_SCISSORS_TIMEOUT) || 30000,
    QUIZ_TIMEOUT: parseInt(process.env.QUIZ_TIMEOUT) || 60000,

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || './logs/bot.log',

    // Validation
    validate() {
        const required = ['GEMINI_API_KEY'];
        const missing = required.filter(key => !this[key]);
        
        if (missing.length > 0) {
            console.warn(`Warning: Missing environment variables: ${missing.join(', ')}`);
            console.warn('Bot will run with limited functionality. Please check your .env file.');
        }

        if (!this.BOT_ADMIN_PHONE) {
            console.warn('Warning: BOT_ADMIN_PHONE not set. Admin features will be disabled.');
        }

        return true;
    }
};

// Validate configuration
config.validate();

module.exports = config;