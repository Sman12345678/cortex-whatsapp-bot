const config = require('../config/config');
const logger = require('../utils/logger');

class StartCommand {
    async handle(socket, message, user, args) {
        try {
            const welcomeText = `🎉 *Welcome to ${config.BOT_NAME}!*\n\n` +
                `👋 Hello ${user.name || 'there'}!\n\n` +
                `🤖 I'm an AI-powered WhatsApp bot with amazing features:\n\n` +
                `✨ *What I can do:*\n` +
                `🤖 AI Chat & Conversations\n` +
                `📄 Document Analysis\n` +
                `🖼️ Image Analysis\n` +
                `🎮 Interactive Games\n` +
                `📊 Statistics & Analytics\n` +
                `🔘 Button Interactions\n\n` +
                `💡 *Quick Start:*\n` +
                `• Type any message to chat with AI\n` +
                `• Send documents/images for analysis\n` +
                `• Use /help for all commands\n` +
                `• Try /games for fun activities\n\n` +
                `🚀 Ready to explore? Choose an option below!`;

            const buttons = [
                { id: 'help_commands', text: '📚 View Commands' },
                { id: 'help_games', text: '🎮 Play Games' },
                { id: 'help_ai', text: '🤖 AI Features' }
            ];

            if (user.isAdmin) {
                buttons.push({ id: 'admin_stats', text: '👑 Admin Panel' });
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: welcomeText,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1,
                footer: `${config.BOT_NAME} - Your AI Assistant`
            });

            logger.info(`👋 Welcome message sent to user ${user.phoneNumber}`);

        } catch (error) {
            logger.error('❌ Error in start command:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: `🤖 Welcome to ${config.BOT_NAME}!\n\nType /help to get started.`
            });
        }
    }

    async showMainMenu(socket, message, user) {
        try {
            const menuText = `🏠 *Main Menu*\n\n` +
                `Choose what you'd like to do:\n\n` +
                `🤖 *AI Features:*\n` +
                `• Chat with AI assistant\n` +
                `• Analyze documents & images\n` +
                `• Ask questions & get answers\n\n` +
                `🎮 *Games & Fun:*\n` +
                `• Rock Paper Scissors\n` +
                `• Quiz & Trivia\n` +
                `• More games coming soon!\n\n` +
                `🛠️ *Utilities:*\n` +
                `• Bot status & information\n` +
                `• Help & command list\n` +
                `• User statistics`;

            const sections = [
                {
                    title: "🤖 AI Features",
                    rows: [
                        { title: "💬 Chat with AI", description: "Start a conversation with AI", rowId: "help_ai" },
                        { title: "📄 Analyze Documents", description: "Send files for AI analysis", rowId: "help_ai" },
                        { title: "🖼️ Analyze Images", description: "Send images for AI analysis", rowId: "help_ai" }
                    ]
                },
                {
                    title: "🎮 Games",
                    rows: [
                        { title: "🪨 Rock Paper Scissors", description: "Play RPS with the bot", rowId: "rps_start" },
                        { title: "🧠 Quiz & Trivia", description: "Test your knowledge", rowId: "quiz_start" },
                        { title: "📊 Game Statistics", description: "View your game stats", rowId: "gamestats_show" }
                    ]
                },
                {
                    title: "🛠️ Utilities",
                    rows: [
                        { title: "📚 Help & Commands", description: "View all available commands", rowId: "help_commands" },
                        { title: "📊 Bot Status", description: "Check bot status and uptime", rowId: "status_show" },
                        { title: "ℹ️ About Bot", description: "Learn about this bot", rowId: "about_show" }
                    ]
                }
            ];

            if (user.isAdmin) {
                sections.push({
                    title: "👑 Admin Features",
                    rows: [
                        { title: "📊 Bot Statistics", description: "View detailed bot stats", rowId: "admin_stats" },
                        { title: "👥 User Management", description: "Manage users and permissions", rowId: "admin_users" },
                        { title: "📢 Broadcast Message", description: "Send message to all users", rowId: "admin_broadcast" },
                        { title: "⚙️ Bot Settings", description: "Configure bot settings", rowId: "admin_settings" }
                    ]
                });
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: menuText,
                footer: `${config.BOT_NAME} - Main Menu`,
                title: "🏠 Main Menu",
                buttonText: "📋 Select Option",
                sections: sections
            });

        } catch (error) {
            logger.error('❌ Error showing main menu:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: `🏠 *Main Menu*\n\nUse these commands:\n• /help - Show all commands\n• /games - Play games\n• /ai - Chat with AI\n\nOr just send any message to chat!`
            });
        }
    }

    async showQuickActions(socket, message, user) {
        try {
            const buttons = [
                { id: 'rps_play_again', text: '🪨 Play RPS' },
                { id: 'quiz_next', text: '🧠 Start Quiz' },
                { id: 'help_commands', text: '📚 Commands' }
            ];

            if (user.isAdmin) {
                buttons.push({ id: 'admin_stats', text: '👑 Admin' });
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: `⚡ *Quick Actions*\n\nChoose what you'd like to do:`,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1,
                footer: 'Quick access to popular features'
            });

        } catch (error) {
            logger.error('❌ Error showing quick actions:', error);
        }
    }

    async showUserProfile(socket, message, user) {
        try {
            const userService = require('../services/userService');
            const gameStats = user.gameStats || {};
            
            let profileText = `👤 *Your Profile*\n\n`;
            profileText += `📱 *Phone:* ${user.phoneNumber}\n`;
            profileText += `👤 *Name:* ${user.name || 'Not set'}\n`;
            profileText += `📅 *Member since:* ${new Date(user.createdAt).toLocaleDateString()}\n`;
            profileText += `⏰ *Last seen:* ${new Date(user.lastSeen).toLocaleString()}\n`;
            profileText += `👑 *Role:* ${user.isAdmin ? 'Admin' : 'User'}\n\n`;

            // Game statistics
            if (Object.keys(gameStats).length > 0) {
                profileText += `🎮 *Game Statistics:*\n`;
                
                Object.entries(gameStats).forEach(([game, stats]) => {
                    const gameName = game.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    profileText += `\n🎯 *${gameName}:*\n`;
                    profileText += `• Played: ${stats.played || 0}\n`;
                    profileText += `• Won: ${stats.won || 0}\n`;
                    profileText += `• Score: ${stats.score || 0}\n`;
                });
            } else {
                profileText += `🎮 *Games:* No games played yet\n\nTry /games to start playing!`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: profileText,
                buttons: [
                    {
                        buttonId: 'games',
                        buttonText: { displayText: '🎮 Play Games' },
                        type: 1
                    },
                    {
                        buttonId: 'main_menu',
                        buttonText: { displayText: '🏠 Main Menu' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: 'Your bot profile'
            });

        } catch (error) {
            logger.error('❌ Error showing user profile:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading your profile. Please try again.'
            });
        }
    }
}

module.exports = new StartCommand();