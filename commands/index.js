const logger = require('../utils/logger');

// Import command handlers
const startCommand = require('./start');
const helpCommand = require('./help');
const adminCommand = require('./admin');
const aiCommand = require('./ai');
const gameCommand = require('./games');

class CommandHandler {
    constructor() {
        this.commands = new Map();
        this.botEnabled = true; // Bot is enabled by default
        this.registerCommands();
    }

    registerCommands() {
        // Basic commands
        this.commands.set('start', startCommand.handle.bind(startCommand));
        this.commands.set('help', helpCommand.handle.bind(helpCommand));
        this.commands.set('menu', startCommand.showMainMenu.bind(startCommand));

        // AI commands
        this.commands.set('ai', aiCommand.handleAICommand.bind(aiCommand));
        this.commands.set('chat', aiCommand.handleTextMessage.bind(aiCommand));
        this.commands.set('ask', aiCommand.handleTextMessage.bind(aiCommand));

        // Game commands
        this.commands.set('games', gameCommand.showGameMenu.bind(gameCommand));
        this.commands.set('rps', gameCommand.startRockPaperScissors.bind(gameCommand));
        this.commands.set('rockpaperscissors', gameCommand.startRockPaperScissors.bind(gameCommand));
        this.commands.set('quiz', gameCommand.startQuiz.bind(gameCommand));
        this.commands.set('trivia', gameCommand.startQuiz.bind(gameCommand));
        this.commands.set('gamestats', gameCommand.showGameStats.bind(gameCommand));

        // Admin commands (only accessible by admins)
        this.commands.set('admin', adminCommand.handle.bind(adminCommand));
        this.commands.set('stats', adminCommand.showBotStats.bind(adminCommand));
        this.commands.set('users', adminCommand.showUserManagement.bind(adminCommand));
        this.commands.set('broadcast', adminCommand.handleBroadcast.bind(adminCommand));
        this.commands.set('ban', adminCommand.handleBanUser.bind(adminCommand));
        this.commands.set('unban', adminCommand.handleUnbanUser.bind(adminCommand));
        this.commands.set('promote', adminCommand.handlePromoteUser.bind(adminCommand));
        this.commands.set('demote', adminCommand.handleDemoteUser.bind(adminCommand));
        this.commands.set('off', this.handleBotOff.bind(this));
        this.commands.set('on', this.handleBotOn.bind(this));

        // Utility commands
        this.commands.set('ping', this.handlePing.bind(this));
        this.commands.set('uptime', this.handleUptime.bind(this));
        this.commands.set('about', this.handleAbout.bind(this));
        this.commands.set('status', this.handleStatus.bind(this));

        logger.info(`📝 Registered ${this.commands.size} commands`);
    }

    async handleCommand(socket, message, user, commandData) {
        try {
            const { command, args } = commandData;
            
            logger.info(`🔧 Processing command: ${command} from user ${user.phoneNumber}`);

            // Check if bot is disabled (only allow ON command and admin-only commands)
            if (!this.botEnabled && command !== 'on' && !user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '🔇 Bot is currently disabled by admin.\n\nPlease wait for admin to enable it again.'
                });
                return;
            }

            // Check if command exists
            const handler = this.commands.get(command);
            if (!handler) {
                await this.handleUnknownCommand(socket, message, user, command);
                return;
            }

            // Check admin privileges for admin commands
            const adminCommands = ['admin', 'stats', 'users', 'broadcast', 'ban', 'unban', 'promote', 'demote', 'off', 'on'];
            if (adminCommands.includes(command) && !user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to use this command.\n\nContact the bot administrator if you believe this is an error.'
                });
                return;
            }

            // Execute command
            await handler(socket, message, user, args);

            // Log command usage
            await this.logCommand(user.id, command, args);

        } catch (error) {
            logger.error(`❌ Error handling command ${commandData.command}:`, error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ An error occurred while processing your command. Please try again.'
            });
        }
    }

    async handleUnknownCommand(socket, message, user, command) {
        const suggestions = this.getSimilarCommands(command);
        
        let response = `❓ Unknown command: *${command}*\n\n`;
        
        if (suggestions.length > 0) {
            response += `💡 Did you mean:\n`;
            suggestions.forEach(cmd => {
                response += `• /${cmd}\n`;
            });
            response += '\n';
        }
        
        response += `Type */help* to see all available commands.`;
        
        await socket.sendMessage(message.key.remoteJid, {
            text: response
        });
    }

    getSimilarCommands(command) {
        const allCommands = Array.from(this.commands.keys());
        const similarities = [];
        
        for (const cmd of allCommands) {
            const similarity = this.calculateSimilarity(command.toLowerCase(), cmd.toLowerCase());
            if (similarity > 0.5) {
                similarities.push({ command: cmd, similarity });
            }
        }
        
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
            .map(item => item.command);
    }

    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    async handlePing(socket, message, user) {
        const startTime = Date.now();
        await socket.sendMessage(message.key.remoteJid, {
            text: `🏓 Pong!\n\n⏱️ Response time: ${Date.now() - startTime}ms`
        });
    }

    async handleUptime(socket, message, user) {
        const WhatsAppBot = require('../bot');
        const bot = new WhatsAppBot();
        const uptime = bot.getUptime();
        
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;
        
        let uptimeText = '⏰ *Bot Uptime*\n\n';
        if (days > 0) uptimeText += `📅 ${days} days, `;
        if (hours > 0) uptimeText += `🕐 ${hours} hours, `;
        if (minutes > 0) uptimeText += `⏰ ${minutes} minutes, `;
        uptimeText += `⏱️ ${seconds} seconds`;
        
        await socket.sendMessage(message.key.remoteJid, {
            text: uptimeText
        });
    }

    async handleAbout(socket, message, user) {
        const config = require('../config/config');
        
        const aboutText = `🤖 *${config.BOT_NAME}*\n\n` +
            `📝 *Description:*\n` +
            `An advanced AI-powered WhatsApp bot with comprehensive features including:\n\n` +
            `🎯 *Features:*\n` +
            `• 🤖 AI Chat & Analysis\n` +
            `• 📄 File Processing & Analysis\n` +
            `• 🎮 Interactive Games\n` +
            `• 👑 Admin Management\n` +
            `• 📊 Analytics & Statistics\n` +
            `• 🔘 Interactive Buttons\n\n` +
            `🔧 *Technology:*\n` +
            `• Node.js & Baileys\n` +
            `• Google Gemini AI\n` +
            `• SQLite Database\n` +
            `• Express Web Dashboard\n\n` +
            `💡 Type */help* for available commands!`;
        
        await socket.sendMessage(message.key.remoteJid, {
            text: aboutText
        });
    }

    async handleStatus(socket, message, user) {
        const WhatsAppBot = require('../bot');
        const aiService = require('../services/aiService');
        const gameHandler = require('../handlers/gameHandler');
        
        const bot = new WhatsAppBot();
        const status = bot.getConnectionStatus();
        const gameStats = gameHandler.getGameStats();
        
        let statusText = `📊 *Bot Status*\n\n`;
        statusText += `🔗 *Connection:* ${status.connected ? '✅ Connected' : '❌ Disconnected'}\n`;
        statusText += `🤖 *AI Service:* ${aiService.isAvailable() ? '✅ Available' : '❌ Unavailable'}\n`;
        statusText += `🎮 *Active Games:* ${gameStats.activeGames}\n`;
        statusText += `⏰ *Uptime:* ${Math.floor(status.uptime / 60)} minutes\n`;
        
        if (user.isAdmin) {
            const userService = require('../services/userService');
            const userStats = await userService.getUserStats();
            statusText += `\n👥 *User Stats:*\n`;
            statusText += `• Total: ${userStats.total}\n`;
            statusText += `• Active: ${userStats.active}\n`;
            statusText += `• Admins: ${userStats.admins}\n`;
            statusText += `• Banned: ${userStats.banned}`;
        }
        
        await socket.sendMessage(message.key.remoteJid, {
            text: statusText
        });
    }

    async handleBotOff(socket, message, user) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to disable the bot.'
                });
                return;
            }

            this.botEnabled = false;
            
            await socket.sendMessage(message.key.remoteJid, {
                text: '🔇 *Bot Disabled*\n\nThe bot has been turned OFF by admin.\n\n• All users will receive a disabled message\n• Only admins can use commands\n• Use /on to re-enable the bot'
            });

            logger.warn(`🔇 Bot disabled by admin: ${user.phoneNumber}`);

        } catch (error) {
            logger.error('❌ Error disabling bot:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error disabling bot. Please try again.'
            });
        }
    }

    async handleBotOn(socket, message, user) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to enable the bot.'
                });
                return;
            }

            this.botEnabled = true;
            
            await socket.sendMessage(message.key.remoteJid, {
                text: '🔊 *Bot Enabled*\n\nThe bot has been turned ON by admin.\n\n• All users can now use the bot normally\n• All commands and features are active\n• AI chat is available'
            });

            logger.info(`🔊 Bot enabled by admin: ${user.phoneNumber}`);

        } catch (error) {
            logger.error('❌ Error enabling bot:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error enabling bot. Please try again.'
            });
        }
    }

    async logCommand(userId, command, args) {
        try {
            const { Message } = require('../database/models');
            
            // This would typically be handled by the message logger
            // but we can also track command usage separately
            logger.info(`📝 Command logged: ${command} by user ${userId}`);
            
        } catch (error) {
            logger.error('❌ Error logging command:', error);
        }
    }

    // Getter for bot status
    isBotEnabled() {
        return this.botEnabled;
    }

    getAvailableCommands(isAdmin = false) {
        const basicCommands = [
            'start', 'help', 'menu', 'ai', 'chat', 'ask', 'games', 'rps', 
            'quiz', 'gamestats', 'ping', 'uptime', 'about', 'status'
        ];
        
        const adminCommands = [
            'admin', 'stats', 'users', 'broadcast', 'ban', 'unban', 'promote', 'demote'
        ];
        
        return isAdmin ? [...basicCommands, ...adminCommands] : basicCommands;
    }

    getCommandInfo(command) {
        const commandInfo = {
            'start': { description: 'Start the bot and show welcome message', usage: '/start' },
            'help': { description: 'Show help information and available commands', usage: '/help [command]' },
            'menu': { description: 'Show main menu with options', usage: '/menu' },
            'ai': { description: 'Chat with AI assistant', usage: '/ai <message>' },
            'chat': { description: 'Chat with AI assistant', usage: '/chat <message>' },
            'ask': { description: 'Ask AI a question', usage: '/ask <question>' },
            'games': { description: 'Show available games', usage: '/games' },
            'rps': { description: 'Start Rock Paper Scissors game', usage: '/rps' },
            'quiz': { description: 'Start a quiz game', usage: '/quiz [topic]' },
            'gamestats': { description: 'Show your game statistics', usage: '/gamestats' },
            'ping': { description: 'Test bot responsiveness', usage: '/ping' },
            'uptime': { description: 'Show bot uptime', usage: '/uptime' },
            'about': { description: 'About this bot', usage: '/about' },
            'status': { description: 'Show bot status', usage: '/status' },
            'admin': { description: 'Admin panel (admin only)', usage: '/admin' },
            'stats': { description: 'Show bot statistics (admin only)', usage: '/stats' },
            'users': { description: 'User management (admin only)', usage: '/users' },
            'broadcast': { description: 'Broadcast message (admin only)', usage: '/broadcast <message>' },
            'ban': { description: 'Ban a user (admin only)', usage: '/ban <phone_number>' },
            'unban': { description: 'Unban a user (admin only)', usage: '/unban <phone_number>' },
            'promote': { description: 'Promote user to admin (admin only)', usage: '/promote <phone_number>' },
            'demote': { description: 'Demote admin to user (admin only)', usage: '/demote <phone_number>' },
            'off': { description: 'Disable bot (admin only)', usage: '/off' },
            'on': { description: 'Enable bot (admin only)', usage: '/on' }
        };
        
        return commandInfo[command] || null;
    }
}

module.exports = new CommandHandler();