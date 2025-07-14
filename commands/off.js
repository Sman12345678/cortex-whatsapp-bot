
const logger = require('../utils/logger');

class OffCommand {
    async handle(socket, message, user, args) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Only administrators can disable the bot.'
                });
                return;
            }

            const commandHandler = require('./index');
            commandHandler.setBotEnabled(false);

            await socket.sendMessage(message.key.remoteJid, {
                text: '🔇 **Bot Disabled**\n\nThe bot has been turned OFF by admin.\n\n• Regular users cannot interact with the bot\n• Only admin commands will work\n• Use `/on` to re-enable the bot'
            });

            logger.info(`🔇 Bot disabled by admin: ${user.phoneNumber}`);

        } catch (error) {
            logger.error('❌ Error in off command:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error disabling bot. Please try again.'
            });
        }
    }
}

module.exports = new OffCommand();
