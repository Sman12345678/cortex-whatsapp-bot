
const logger = require('../utils/logger');

class OnCommand {
    async handle(socket, message, user, args) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Only administrators can enable the bot.'
                });
                return;
            }

            const commandHandler = require('./index');
            commandHandler.setBotEnabled(true);

            await socket.sendMessage(message.key.remoteJid, {
                text: '✅ **Bot Enabled**\n\nThe bot has been turned ON by admin.\n\n• All users can now interact with the bot\n• AI features are available\n• All commands are working\n• Use `/off` to disable if needed'
            });

            logger.info(`✅ Bot enabled by admin: ${user.phoneNumber}`);

        } catch (error) {
            logger.error('❌ Error in on command:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error enabling bot. Please try again.'
            });
        }
    }
}

module.exports = new OnCommand();
