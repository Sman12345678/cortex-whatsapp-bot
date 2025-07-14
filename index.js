const WhatsAppBot = require('./bot');
const logger = require('./utils/logger');
const config = require('./config/config');

// Web dashboard
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

async function startBot() {
    try {
        logger.info('🚀 Starting WhatsApp AI Bot...');
        
        // Create bot instance
        const bot = new WhatsAppBot();
        
        // Initialize bot
        await bot.initialize();
        
        // Setup web dashboard if enabled
        if (config.DASHBOARD_ENABLED) {
            await startWebDashboard(bot);
        }
        
        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            logger.info('🛑 Received SIGINT, shutting down gracefully...');
            await bot.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            logger.info('🛑 Received SIGTERM, shutting down gracefully...');
            await bot.stop();
            process.exit(0);
        });
        
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        });
        
        logger.info('✅ WhatsApp AI Bot started successfully!');
        
    } catch (error) {
        logger.error('❌ Failed to start bot:', error);
        process.exit(1);
    }
}

async function startWebDashboard(bot) {
    try {
        const app = express();
        
        // Security middleware
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: ["'self'"],
                    fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
                }
            }
        }));
        
        app.use(cors());
        app.use(compression());
        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));
        
        // Static files
        app.use('/static', express.static(path.join(__dirname, 'web/public')));
        
        // Set view engine
        app.set('view engine', 'ejs');
        app.set('views', path.join(__dirname, 'web/views'));
        
        // Dashboard route
        app.get('/', async (req, res) => {
            try {
                const userService = require('./services/userService');
                const gameHandler = require('./handlers/gameHandler');
                const aiService = require('./services/aiService');
                
                const userStats = await userService.getUserStats();
                const gameStats = gameHandler.getGameStats();
                const botStatus = bot.getConnectionStatus();
                
                const dashboardData = {
                    botName: config.BOT_NAME,
                    connectionStatus: botStatus,
                    userStats: userStats || { total: 0, active: 0, admins: 0, banned: 0 },
                    gameStats: gameStats || { activeGames: 0, gameTypes: [] },
                    aiAvailable: aiService.isAvailable(),
                    qrCode: botStatus.qrCode,
                    daily_messages: [],
                    message_types: {},
                    popular_commands: [],
                    last_updated: new Date().toISOString()
                };
                
                res.render('dashboard', { data: dashboardData });
            } catch (error) {
                logger.error('❌ Error rendering dashboard:', error);
                const fallbackData = {
                    botName: config.BOT_NAME || 'WhatsApp Bot',
                    connectionStatus: { connected: false, uptime: 0, retryCount: 0 },
                    userStats: { total: 0, active: 0, admins: 0, banned: 0 },
                    gameStats: { activeGames: 0, gameTypes: [] },
                    aiAvailable: false,
                    qrCode: null,
                    daily_messages: [],
                    message_types: {},
                    popular_commands: [],
                    last_updated: new Date().toISOString()
                };
                res.render('dashboard', { data: fallbackData });
            }
        });
        
        // API endpoints
        app.get('/api/status', (req, res) => {
            const status = bot.getConnectionStatus();
            res.json(status);
        });
        
        app.get('/api/qr', (req, res) => {
            const status = bot.getConnectionStatus();
            if (status.qrCode) {
                res.json(status.qrCode);
            } else {
                res.json({ error: 'No QR code available' });
            }
        });
        
        app.get('/api/stats', async (req, res) => {
            try {
                const userService = require('./services/userService');
                const gameHandler = require('./handlers/gameHandler');
                const { Message, AIRequest, FileProcessing } = require('./database/models');
                
                const userStats = await userService.getUserStats();
                const gameStats = gameHandler.getGameStats();
                const totalMessages = await Message.count();
                const totalAIRequests = await AIRequest.count();
                const totalFileProcessing = await FileProcessing.count();
                
                res.json({
                    total_users: userStats.total || 0,
                    total_messages: totalMessages || 0,
                    ai_requests: totalAIRequests || 0,
                    files_processed: totalFileProcessing || 0,
                    active_groups: 0,
                    active_users_7d: userStats.active || 0,
                    commands_used: 0,
                    uptime: `${Math.floor(bot.getUptime() / 60)}m ${bot.getUptime() % 60}s`,
                    user_stats: userStats || { total: 0, active_7d: 0, admins: 0, banned: 0 },
                    game_stats: gameStats || { activeGames: 0, gameTypes: [] },
                    daily_messages: [],
                    message_types: {},
                    popular_commands: [],
                    last_updated: new Date().toISOString()
                });
            } catch (error) {
                logger.error('❌ Error getting stats:', error);
                res.status(500).json({ error: 'Failed to get statistics' });
            }
        });
        
        // Health check
        app.get('/health', (req, res) => {
            const status = bot.getConnectionStatus();
            res.json({
                status: status.connected ? 'healthy' : 'unhealthy',
                uptime: bot.getUptime(),
                timestamp: new Date().toISOString()
            });
        });
        
        // Start server
        const port =  process.env.PORT || 3000;
        app.listen(port, '0.0.0.0', () => {
            logger.info(`🌐 Web dashboard started on http://0.0.0.0:${port}`);
        });
        
    } catch (error) {
        logger.error('❌ Failed to start web dashboard:', error);
    }
}

// Start the bot
startBot();
