const config = require('../config/config');
const logger = require('../utils/logger');
const commandHandler = require('./index');

class HelpCommand {
    async handle(socket, message, user, args) {
        try {
            if (args.length > 0) {
                await this.showCommandHelp(socket, message, user, args[0]);
            } else {
                await this.showHelpMenu(socket, message, user);
            }
        } catch (error) {
            logger.error('❌ Error in help command:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading help. Please try again.'
            });
        }
    }

    async showHelpMenu(socket, message, user) {
        try {
            const helpTextHeader = `📚 *Help Center*\n\nWelcome to *${config.BOT_NAME}*! Here's a list of available commands:\n\n`;
            let helpText = '';

            for (const [cmd, info] of Object.entries(commandHandler.getCommandInfo('') || {})) {
                if (!info.description) continue;
                if (info.adminOnly && !user.isAdmin) continue;
                helpText += `• /${cmd} — ${info.description}\n`;
            }

            helpText += `\n💡 Tip: Use /help <command> to see usage.`;

            await socket.sendMessage(message.key.remoteJid, { text: helpTextHeader + helpText });
        } catch (error) {
            logger.error('❌ Error showing help menu:', error);
        }
    }

    async showCommandHelp(socket, message, user, specificCommand = null) {
        try {
            const commandInfo = commandHandler.getCommandInfo(specificCommand);

            if (commandInfo) {
                let helpText = `📋 *Command: /${specificCommand}*\n\n`;
                helpText += `📝 *Description:* ${commandInfo.description}\n`;
                helpText += `💡 *Usage:* ${commandInfo.usage}\n`;
                helpText += `\nNeed more help? Use /help to see all commands.`;

                await socket.sendMessage(message.key.remoteJid, { text: helpText });
            } else {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❓ Command "/${specificCommand}" not found.\n\nUse /help to see all available commands.`
                });
            }
        } catch (error) {
            logger.error('❌ Error showing command help:', error);
        }
    }

    async showAIHelp(socket, message, user) {
        try {
            const aiHelpText = `🤖 *AI Features Help*\n\n` +
                `Our AI assistant can help you with various tasks:\n\n` +
                `💬 *Chat Features:*\n` +
                `• Natural conversations\n` +
                `• Question answering\n` +
                `• Problem solving\n` +
                `• Creative writing help\n` +
                `• Explanations & tutorials\n\n` +
                `📄 *Document Analysis:*\n` +
                `• PDF text extraction\n` +
                `• Code file analysis\n` +
                `• JSON/CSV processing\n` +
                `• Excel spreadsheet reading\n` +
                `• HTML content extraction\n\n` +
                `🖼️ *Image Analysis:*\n` +
                `• Object recognition\n` +
                `• Text extraction (OCR)\n` +
                `• Scene description\n` +
                `• Image content analysis\n\n` +
                `💡 *How to Use:*\n` +
                `• Send any message to chat\n` +
                `• Use /ai <message> for direct chat\n` +
                `• Send files/images for analysis\n` +
                `• Ask follow-up questions\n\n` +
                `⚡ *Pro Tips:*\n` +
                `• Be specific in your questions\n` +
                `• Ask for examples when needed\n` +
                `• Use follow-up questions\n` +
                `• Try different file formats`;

            await socket.sendMessage(message.key.remoteJid, { text: aiHelpText });
        } catch (error) {
            logger.error('❌ Error showing AI help:', error);
        }
    }

    async showGameHelp(socket, message, user) {
        try {
            const gameHelpText = `🎮 *Games Help*\n\n` +
                `Available games and how to play:\n\n` +
                `🪨 *Rock Paper Scissors:*\n` +
                `• Classic game vs bot\n` +
                `• Best of 3 rounds\n` +
                `• Command: /rps\n\n` +
                `🧠 *Quiz & Trivia:*\n` +
                `• AI-generated questions\n` +
                `• Multiple choice format\n` +
                `• Command: /quiz [topic]\n\n` +
                `🏆 *Scoring System:*\n` +
                `• Earn points by playing\n` +
                `• Climb the leaderboards\n` +
                `• Track your statistics\n` +
                `• Unlock achievements\n\n` +
                `📊 *Statistics:*\n` +
                `• View with /gamestats\n` +
                `• Track wins/losses\n` +
                `• See your ranking\n` +
                `• Compare with others\n\n` +
                `💡 *Tips:*\n` +
                `• Play regularly to improve\n` +
                `• Try different quiz topics\n` +
                `• Check leaderboards\n` +
                `• Challenge yourself!`;

            await socket.sendMessage(message.key.remoteJid, { text: gameHelpText });
        } catch (error) {
            logger.error('❌ Error showing game help:', error);
        }
    }

    async showAdminHelp(socket, message, user) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Admin help is only available to administrators.'
                });
                return;
            }

            const adminHelpText = `👑 *Admin Help*\n\n` +
                `Administrative commands and features:\n\n` +
                `📊 *Statistics & Monitoring:*\n` +
                `• /stats - Detailed bot statistics\n` +
                `• /status - Current bot status\n` +
                `• View user activity & metrics\n` +
                `• Monitor bot performance\n\n` +
                `👥 *User Management:*\n` +
                `• /users - User management panel\n` +
                `• /ban <phone> - Ban users\n` +
                `• /unban <phone> - Unban users\n` +
                `• /promote <phone> - Make admin\n` +
                `• /demote <phone> - Remove admin\n\n` +
                `📢 *Broadcasting:*\n` +
                `• /broadcast <message> - Send to all\n` +
                `• Target specific user groups\n` +
                `• Schedule announcements\n` +
                `• Track delivery status\n\n` +
                `⚙️ *Bot Configuration:*\n` +
                `• Modify bot settings\n` +
                `• Update welcome messages\n` +
                `• Configure rate limits\n` +
                `• Manage file restrictions\n\n` +
                `🔧 *Maintenance:*\n` +
                `• Database cleanup\n` +
                `• Log file management\n` +
                `• Performance optimization\n` +
                `• Backup & restore\n\n` +
                `⚠️ *Security:*\n` +
                `• Monitor abuse attempts\n` +
                `• Review user reports\n` +
                `• Audit admin actions\n` +
                `• Emergency controls`;

            await socket.sendMessage(message.key.remoteJid, { text: adminHelpText });
        } catch (error) {
            logger.error('❌ Error showing admin help:', error);
        }
    }
}

module.exports = new HelpCommand();
