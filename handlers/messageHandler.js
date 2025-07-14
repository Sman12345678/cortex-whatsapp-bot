const { getContentType } = require('@whiskeysockets/baileys');
const logger = require('../utils/logger');
const { parseCommand, extractUserId, formatPhoneNumber } = require('../utils/helpers');
const userService = require('../services/userService');
const commandHandler = require('../commands');
const fileHandler = require('./fileHandler');
const buttonHandler = require('./buttonHandler');

class MessageHandler {
    constructor() {
        this.processingMessages = new Set();
    }

    async handleMessages(socket, messageUpdate) {
        const { messages } = messageUpdate;
        
        for (const message of messages) {
            // Skip if already processing this message
            if (this.processingMessages.has(message.key.id)) {
                continue;
            }
            
            // Skip messages from status broadcast
            if (message.key.remoteJid === 'status@broadcast') {
                continue;
            }
            
            // Skip our own messages
            if (message.key.fromMe) {
                continue;
            }
            
            // Skip empty messages
            if (!message.message) {
                continue;
            }
            
            this.processingMessages.add(message.key.id);
            
            try {
                await this.processMessage(socket, message);
            } catch (error) {
                logger.error('❌ Error processing message:', error);
            } finally {
                // Remove from processing set after a delay to prevent duplicate processing
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
            
            // Get or create user
            const user = await userService.getOrCreateUser(phoneNumber, message.pushName);
            
            // Check if user is banned
            if (user.isBanned) {
                logger.warn(`🚫 Banned user ${phoneNumber} attempted to send message`);
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ You have been banned from using this bot.\n\n*Reason:* ${user.banReason || 'No reason provided'}\n*Banned by:* Admin\n*Date:* ${user.bannedAt ? new Date(user.bannedAt).toLocaleString() : 'Unknown'}`
                });
                return;
            }
            
            // Update user's last seen
            await userService.updateLastSeen(user.id);
            
            // Handle different message types
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
                    
                case 'buttonsResponseMessage':
                    await buttonHandler.handleButtonResponse(socket, message, user);
                    break;
                    
                case 'listResponseMessage':
                    await buttonHandler.handleListResponse(socket, message, user);
                    break;
                    
                default:
                    logger.debug(`🤔 Unhandled message type: ${messageType}`);
                    break;
            }
            
            // Log message to database
            await this.logMessage(message, user, messageType);
            
        } catch (error) {
            logger.error('❌ Error in processMessage:', error);
            
            // Send error message to user
            try {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Sorry, an error occurred while processing your message. Please try again later.'
                });
            } catch (sendError) {
                logger.error('❌ Error sending error message:', sendError);
            }
        }
    }

    async handleTextMessage(socket, message, user) {
        const text = message.message.conversation || message.message.extendedTextMessage?.text || '';
        
        // Parse command
        const commandData = parseCommand(text);
        
        if (commandData) {
            // Handle command
            await commandHandler.handleCommand(socket, message, user, commandData);
        } else {
            // Check if bot is enabled for regular messages
            if (!commandHandler.isBotEnabled() && !user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '🔇 Bot is currently disabled by admin.\n\nPlease wait for admin to enable it again.'
                });
                return;
            }
            
            // Handle regular text (AI chat)
            const aiHandler = require('../commands/ai');
            await aiHandler.handleTextMessage(socket, message, user, text);
        }
    }

    async handleImageMessage(socket, message, user) {
        try {
            const caption = message.message.imageMessage.caption || '';
            
            // Check if it's a command with image
            const commandData = parseCommand(caption);
            if (commandData) {
                await commandHandler.handleCommand(socket, message, user, commandData);
            } else {
                // Check if bot is enabled for image analysis
                if (!commandHandler.isBotEnabled() && !user.isAdmin) {
                    await socket.sendMessage(message.key.remoteJid, {
                        text: '🔇 Bot is currently disabled by admin.\n\nPlease wait for admin to enable it again.'
                    });
                    return;
                }
                
                // Handle image analysis
                await fileHandler.handleImageMessage(socket, message, user);
            }
        } catch (error) {
            logger.error('❌ Error handling image message:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing image. Please try again.'
            });
        }
    }

    async handleDocumentMessage(socket, message, user) {
        try {
            // Check if bot is enabled for document analysis
            if (!commandHandler.isBotEnabled() && !user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '🔇 Bot is currently disabled by admin.\n\nPlease wait for admin to enable it again.'
                });
                return;
            }
            
            await fileHandler.handleDocumentMessage(socket, message, user);
        } catch (error) {
            logger.error('❌ Error handling document message:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing document. Please try again.'
            });
        }
    }

    async handleAudioMessage(socket, message, user) {
        try {
            await socket.sendMessage(message.key.remoteJid, {
                text: '🎵 Audio message received! Audio processing is coming soon.'
            });
        } catch (error) {
            logger.error('❌ Error handling audio message:', error);
        }
    }

    async handleVideoMessage(socket, message, user) {
        try {
            await socket.sendMessage(message.key.remoteJid, {
                text: '🎥 Video message received! Video processing is coming soon.'
            });
        } catch (error) {
            logger.error('❌ Error handling video message:', error);
        }
    }

    async handleMessageUpdates(socket, updates) {
        for (const update of updates) {
            logger.debug('📝 Message update:', update);
            // Handle message reactions, read receipts, etc.
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
                groupId: null, // TODO: Handle group messages
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