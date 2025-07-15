const { getContentType } = require('@whiskeysockets/baileys');
const logger = require('../utils/logger');
const { parseCommand, extractUserId, formatPhoneNumber } = require('../utils/helpers');
const userService = require('../services/userService');
const commandHandler = require('../commands');
const fileHandler = require('./fileHandler');
// REMOVED: const buttonHandler = require('./buttonHandler');

class MessageHandler {
    constructor() {
        this.processingMessages = new Set();
    }

    async handleMessages(socket, messageUpdate) {
        const { messages } = messageUpdate;
        
        for (const message of messages) {
            if (this.processingMessages.has(message.key.id)) continue;
            if (message.key.remoteJid === 'status@broadcast') continue;
            if (message.key.fromMe) continue;
            if (!message.message) continue;
            
            this.processingMessages.add(message.key.id);
            
            try {
                await this.processMessage(socket, message);
            } catch (error) {
                logger.error('❌ Error processing message:', error);
            } finally {
                setTimeout(() => {
                    this.processingMessages.delete(message.key.id);
                }, 5000);
            }
        }
    }

    async processMessage(socket, message) {
        try {
            const messageType = getContentType(message.message);
            const isGroup = message.key.remoteJid.endsWith('@g.us');
            const userId = extractUserId(message.key.remoteJid);
            const phoneNumber = formatPhoneNumber(userId);
            
            logger.info(`📨 New ${messageType} message from ${phoneNumber}${isGroup ? ' (group)' : ''}`);
            
            const user = await userService.getOrCreateUser(phoneNumber, message.pushName);
            if (user.isBanned) {
                logger.warn(`🚫 Banned user ${phoneNumber} attempted to send message`);
                await socket.sendMessage(message.key.remoteJid, 
                    `❌ You have been banned from using this bot.\n\n*Reason:* ${user.banReason || 'No reason provided'}\n*Banned by:* Admin\n*Date:* ${user.bannedAt ? new Date(user.bannedAt).toLocaleString() : ''}`
                );
                return;
            }
            
            await userService.updateLastSeen(user.id);
            
            // Handle different message types (all button/list response handling removed)
            switch (messageType) {
                case 'conversation':
                case 'extendedTextMessage':
                    await this.handleTextMessage(socket, message, user);
                    break;
                case 'imageMessage':
                    await this.handleImageMessage(socket, message, user);
                    break;
                case 'documentMessage':
                case 'documentWithCaptionMessage':
                    await this.handleDocumentMessage(socket, message, user);
                    break;
                case 'audioMessage':
                    await this.handleAudioMessage(socket, message, user);
                    break;
                case 'videoMessage':
                    await this.handleVideoMessage(socket, message, user);
                    break;
                default:
                    logger.debug(`🤔 Unhandled message type: ${messageType}`);
                    break;
            }
            await this.logMessage(message, user, messageType);
        } catch (error) {
            logger.error('❌ Error in processMessage:', error);
            try {
                await socket.sendMessage(message.key.remoteJid, 
                    '❌ Sorry, an error occurred while processing your message. Please try again later.'
                );
            } catch (sendError) {
                logger.error('❌ Error sending error message:', sendError);
            }
        }
    }

    async handleTextMessage(socket, message, user) {
        const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
        const commandData = parseCommand(text);
        if (commandData) {
            await commandHandler.handleCommand(socket, message, user, commandData);
        } else {
            if (!commandHandler.isBotEnabled() && !user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid,
                    '🔇 Bot is currently disabled by admin.\n\nPlease wait for admin to enable it again.'
                );
                return;
            }
            const aiHandler = require('../commands/ai');
            await aiHandler.handleTextMessage(socket, message, user, text);
        }
    }

    async handleImageMessage(socket, message, user) {
        try {
            const caption = message.message.imageMessage.caption || '';
            const commandData = parseCommand(caption);
            if (commandData) {
                await commandHandler.handleCommand(socket, message, user, commandData);
            } else {
                if (!commandHandler.isBotEnabled() && !user.isAdmin) {
                    await socket.sendMessage(message.key.remoteJid,
                        '🔇 Bot is currently disabled by admin.\n\nPlease wait for admin to enable it again.'
                    );
                    return;
                }
                await fileHandler.handleImageMessage(socket, message, user);
            }
        } catch (error) {
            logger.error('❌ Error handling image message:', error);
            await socket.sendMessage(message.key.remoteJid, '❌ Error processing image. Please try again.');
        }
    }

    async handleDocumentMessage(socket, message, user) {
        try {
            if (!commandHandler.isBotEnabled() && !user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, 
                    '🔇 Bot is currently disabled by admin.\n\nPlease wait for admin to enable it again.'
                );
                return;
            }
            await fileHandler.handleDocumentMessage(socket, message, user);
        } catch (error) {
            logger.error('❌ Error handling document message:', error);
            await socket.sendMessage(message.key.remoteJid, '❌ Error processing document. Please try again.');
        }
    }

    async handleAudioMessage(socket, message, user) {
        try {
            await socket.sendMessage(message.key.remoteJid, '🎵 Audio message received! Audio processing is coming soon.');
        } catch (error) {
            logger.error('❌ Error handling audio message:', error);
        }
    }

    async handleVideoMessage(socket, message, user) {
        try {
            await socket.sendMessage(message.key.remoteJid, '🎥 Video message received! Video processing is coming soon.');
        } catch (error) {
            logger.error('❌ Error handling video message:', error);
        }
    }

    async handleMessageUpdates(socket, updates) {
        for (const update of updates) {
            logger.debug('📝 Message update:', update);
        }
    }

    async logMessage(message, user, messageType) {
        try {
            const { Message } = require('../database/models');
            const text = message.message.conversation || 
                        message.message.extendedTextMessage?.text || 
                        message.message.imageMessage?.caption ||
                        message.message.documentMessage?.caption ||
                        '';
            const commandData = parseCommand(text);
            await Message.create({
                messageId: message.key.id,
                userId: user.id,
                groupId: null,
                content: text,
                messageType: messageType,
                isCommand: !!commandData,
                commandName: commandData?.command || null,
                metadata: {
                    fromMe: message.key.fromMe,
                    timestamp: message.messageTimestamp,
                    messageType: messageType
                }
            });
        } catch (error) {
            logger.error('❌ Error logging message:', error);
        }
    }
}

module.exports = new MessageHandler();
