const config = require('../config/config');
const logger = require('../utils/logger');

class HelpCommand {
    async handle(socket, message, user, args) {
        try {
            if (args.length > 0) {
                // Show help for specific command
                await this.showCommandHelp(socket, message, user, args[0]);
            } else {
                // Show general help menu
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
            const helpText = `📚 *Help Center*\n\n` +
                `Welcome to the ${config.BOT_NAME} help center!\n\n` +
                `Choose a category to learn more:`;

            const buttons = [
                { id: 'help_commands', text: '📋 All Commands' },
                { id: 'help_ai', text: '🤖 AI Features' },
                { id: 'help_games', text: '🎮 Games' }
            ];

            if (user.isAdmin) {
                buttons.push({ id: 'help_admin', text: '👑 Admin Help' });
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: helpText,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1,
                footer: '📚 Choose a help category'
            });

        } catch (error) {
            logger.error('❌ Error showing help menu:', error);
        }
    }

    async showCommandHelp(socket, message, user, specificCommand = null) {
        try {
            const commandHandler = require('./index');
            
            let helpText = `📋 *Available Commands*\n\n`;
            
            if (specificCommand) {
                const commandInfo = commandHandler.getCommandInfo(specificCommand);
                if (commandInfo) {
                    helpText = `📋 *Command: /${specificCommand}*\n\n`;
                    helpText += `📝 *Description:* ${commandInfo.description}\n`;
                    helpText += `💡 *Usage:* ${commandInfo.usage}\n\n`;
                    helpText += `Need more help? Try /help for all commands.`;
                } else {
                    helpText = `❓ Command "/${specificCommand}" not found.\n\nUse /help to see all available commands.`;
                }
            } else {
                const basicCommands = [
                    { cmd: 'start', desc: 'Start the bot and show welcome message' },
                    { cmd: 'help', desc: 'Show this help message' },
                    { cmd: 'menu', desc: 'Show main menu with options' },
                    { cmd: 'about', desc: 'About this bot' },
                    { cmd: 'status', desc: 'Check bot status' }
                ];

                const aiCommands = [
                    { cmd: 'ai <message>', desc: 'Chat with AI assistant' },
                    { cmd: 'chat <message>', desc: 'Start AI conversation' },
                    { cmd: 'ask <question>', desc: 'Ask AI a question' }
                ];

                const gameCommands = [
                    { cmd: 'games', desc: 'Show available games' },
                    { cmd: 'rps', desc: 'Play Rock Paper Scissors' },
                    { cmd: 'quiz [topic]', desc: 'Start quiz game' },
                    { cmd: 'gamestats', desc: 'Show your game statistics' }
                ];

                helpText += `🔧 *Basic Commands:*\n`;
                basicCommands.forEach(c => helpText += `• /${c.cmd} - ${c.desc}\n`);

                helpText += `\n🤖 *AI Commands:*\n`;
                aiCommands.forEach(c => helpText += `• /${c.cmd} - ${c.desc}\n`);

                helpText += `\n🎮 *Game Commands:*\n`;
                gameCommands.forEach(c => helpText += `• /${c.cmd} - ${c.desc}\n`);

                if (user.isAdmin) {
                    const adminCommands = [
                        { cmd: 'admin', desc: 'Open admin panel' },
                        { cmd: 'stats', desc: 'Show bot statistics' },
                        { cmd: 'users', desc: 'Manage users' },
                        { cmd: 'broadcast', desc: 'Send message to all users' }
                    ];

                    helpText += `\n👑 *Admin Commands:*\n`;
                    adminCommands.forEach(c => helpText += `• /${c.cmd} - ${c.desc}\n`);
                }

                helpText += `\n💡 *Tips:*\n`;
                helpText += `• Send any text to chat with AI\n`;
                helpText += `• Send images/documents for analysis\n`;
                helpText += `• Use buttons for easier interaction\n`;
                helpText += `• Type /${config.BOT_PREFIX}help <command> for detailed help`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: helpText,
                buttons: [
                    {
                        buttonId: 'help_ai',
                        buttonText: { displayText: '🤖 AI Help' },
                        type: 1
                    },
                    {
                        buttonId: 'help_games',
                        buttonText: { displayText: '🎮 Game Help' },
                        type: 1
                    },
                    {
                        buttonId: 'main_menu',
                        buttonText: { displayText: '🏠 Main Menu' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: '📚 Command Reference'
            });

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

            await socket.sendMessage(message.key.remoteJid, {
                text: aiHelpText,
                buttons: [
                    {
                        buttonId: 'ai_demo',
                        buttonText: { displayText: '🤖 Try AI Chat' },
                        type: 1
                    },
                    {
                        buttonId: 'help_commands',
                        buttonText: { displayText: '📋 All Commands' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: '🤖 AI Assistant Guide'
            });

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
                `• Use buttons to choose\n` +
                `• Command: /rps\n\n` +
                `🧠 *Quiz & Trivia:*\n` +
                `• AI-generated questions\n` +
                `• Various topics available\n` +
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

            await socket.sendMessage(message.key.remoteJid, {
                text: gameHelpText,
                buttons: [
                    {
                        buttonId: 'rps_play_again',
                        buttonText: { displayText: '🪨 Play RPS' },
                        type: 1
                    },
                    {
                        buttonId: 'quiz_next',
                        buttonText: { displayText: '🧠 Start Quiz' },
                        type: 1
                    },
                    {
                        buttonId: 'gamestats_show',
                        buttonText: { displayText: '📊 My Stats' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: '🎮 Gaming Guide'
            });

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

            await socket.sendMessage(message.key.remoteJid, {
                text: adminHelpText,
                buttons: [
                    {
                        buttonId: 'admin_stats',
                        buttonText: { displayText: '📊 Bot Stats' },
                        type: 1
                    },
                    {
                        buttonId: 'admin_users',
                        buttonText: { displayText: '👥 User Management' },
                        type: 1
                    },
                    {
                        buttonId: 'admin_settings',
                        buttonText: { displayText: '⚙️ Settings' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: '👑 Administrator Guide'
            });

        } catch (error) {
            logger.error('❌ Error showing admin help:', error);
        }
    }
}

module.exports = new HelpCommand();