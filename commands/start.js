const config = require('../config/config');
const logger = require('../utils/logger');

class StartCommand {
    async handle(socket, message, user, args) {
        try {
            const welcomeText = `🎉 *Welcome to ${config.BOT_NAME}!*\n\n` +
                `👋 Hello ${user.name || 'there'}!\n\n` +
                `🤖 I'm an AI-powered WhatsApp bot with amazing features:\n\n` +
                `✨ *What I can do:*\n` +
                `• AI Chat & Conversations\n` +
                `• Document Analysis\n` +
                `• Image Analysis\n` +
                `• Interactive Games\n` +
                `• Statistics & Analytics\n\n` +
                `💡 *Quick Start:*\n` +
                `• Type any message to chat with AI\n` +
                `• Send documents/images for analysis\n` +
                `• Use /help for all commands\n` +
                `• Try /games for fun activities\n\n` +
                `🚀 Ready to explore? Start with /help or send a message!`;

            await socket.sendMessage(message.key.remoteJid, { text: welcomeText });

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
            let menuText = `🏠 *Main Menu*\n\n` +
                `Here’s what you can do:\n\n` +
                `🤖 *AI Features:*\n` +
                `• Chat with AI assistant\n` +
                `• Analyze documents & images\n` +
                `• Ask questions & get answers\n\n` +
                `🎮 *Games & Fun:*\n` +
                `• Rock Paper Scissors (/rps)\n` +
                `• Quiz & Trivia (/quiz)\n` +
                `• Game Statistics (/gamestats)\n\n` +
                `🛠️ *Utilities:*\n` +
                `• Bot status (/status)\n` +
                `• Help & commands (/help)\n` +
                `• About the bot (/about)`;

            if (user.isAdmin) {
                menuText += `\n\n👑 *Admin Features:*\n` +
                    `• Bot Stats (/stats)\n` +
                    `• User Management (/users)\n` +
                    `• Broadcast Message (/broadcast <msg>)\n` +
                    `• Settings (/admin)`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: menuText
            });
        } catch (error) {
            logger.error('❌ Error showing main menu:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: `🏠 *Main Menu*\n\nUse commands:\n• /help — List all commands\n• /games — Start a game\n• /ai — Chat with AI\n\nOr just send any message to start.`
            });
        }
    }

    async showQuickActions(socket, message, user) {
        try {
            const quickText = `⚡ *Quick Actions*\n\n` +
                `Try these:\n` +
                `• /rps — Play Rock Paper Scissors\n` +
                `• /quiz — Start a quiz\n` +
                `• /help — Show all commands`;

            if (user.isAdmin) {
                quickText += `\n• /stats — View bot stats`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: quickText
            });
        } catch (error) {
            logger.error('❌ Error showing quick actions:', error);
        }
    }

    async showUserProfile(socket, message, user) {
        try {
            const gameStats = user.gameStats || {};
            let profileText = `👤 *Your Profile*\n\n` +
                `📱 *Phone:* ${user.phoneNumber}\n` +
                `👤 *Name:* ${user.name || 'Not set'}\n` +
                `📅 *Member since:* ${new Date(user.createdAt).toLocaleDateString()}\n` +
                `⏰ *Last seen:* ${new Date(user.lastSeen).toLocaleString()}\n` +
                `👑 *Role:* ${user.isAdmin ? 'Admin' : 'User'}\n\n`;

            if (Object.keys(gameStats).length > 0) {
                profileText += `🎮 *Game Statistics:*\n`;

                for (const [game, stats] of Object.entries(gameStats)) {
                    const gameName = game.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    profileText += `\n🎯 *${gameName}:*\n` +
                        `• Played: ${stats.played || 0}\n` +
                        `• Won: ${stats.won || 0}\n` +
                        `• Score: ${stats.score || 0}\n`;
                }
            } else {
                profileText += `🎮 *Games:* No games played yet\n\nTry /games to start playing!`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: profileText
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
