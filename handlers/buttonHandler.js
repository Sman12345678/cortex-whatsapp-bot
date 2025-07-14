const logger = require('../utils/logger');
const gameHandler = require('./gameHandler');

class ButtonHandler {
    constructor() {
        this.buttonHandlers = new Map();
        this.setupHandlers();
    }

    setupHandlers() {
        // Game handlers
        this.buttonHandlers.set('rps_rock', gameHandler.handleRockPaperScissors.bind(gameHandler));
        this.buttonHandlers.set('rps_paper', gameHandler.handleRockPaperScissors.bind(gameHandler));
        this.buttonHandlers.set('rps_scissors', gameHandler.handleRockPaperScissors.bind(gameHandler));
        this.buttonHandlers.set('rps_play_again', gameHandler.startRockPaperScissors.bind(gameHandler));
        
        // Quiz handlers
        this.buttonHandlers.set('quiz_a', gameHandler.handleQuizAnswer.bind(gameHandler));
        this.buttonHandlers.set('quiz_b', gameHandler.handleQuizAnswer.bind(gameHandler));
        this.buttonHandlers.set('quiz_c', gameHandler.handleQuizAnswer.bind(gameHandler));
        this.buttonHandlers.set('quiz_d', gameHandler.handleQuizAnswer.bind(gameHandler));
        this.buttonHandlers.set('quiz_next', gameHandler.nextQuizQuestion.bind(gameHandler));
        
        // Admin handlers
        this.buttonHandlers.set('admin_stats', this.handleAdminStats.bind(this));
        this.buttonHandlers.set('admin_users', this.handleAdminUsers.bind(this));
        this.buttonHandlers.set('admin_broadcast', this.handleAdminBroadcast.bind(this));
        this.buttonHandlers.set('admin_settings', this.handleAdminSettings.bind(this));
        
        // Help handlers
        this.buttonHandlers.set('help_commands', this.handleHelpCommands.bind(this));
        this.buttonHandlers.set('help_games', this.handleHelpGames.bind(this));
        this.buttonHandlers.set('help_ai', this.handleHelpAI.bind(this));
        this.buttonHandlers.set('help_admin', this.handleHelpAdmin.bind(this));
        
        // Navigation handlers
        this.buttonHandlers.set('main_menu', this.handleMainMenu.bind(this));
        this.buttonHandlers.set('back', this.handleBack.bind(this));
        this.buttonHandlers.set('cancel', this.handleCancel.bind(this));
    }

    async handleButtonResponse(socket, message, user) {
        try {
            const buttonResponse = message.message.buttonsResponseMessage;
            const buttonId = buttonResponse.selectedButtonId;
            
            logger.info(`🔘 Button pressed: ${buttonId} by user ${user.phoneNumber}`);
            
            const handler = this.buttonHandlers.get(buttonId);
            if (handler) {
                await handler(socket, message, user, buttonId);
            } else {
                // Handle dynamic button IDs (like user_123, game_456, etc.)
                await this.handleDynamicButton(socket, message, user, buttonId);
            }
        } catch (error) {
            logger.error('❌ Error handling button response:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing your selection. Please try again.'
            });
        }
    }

    async handleListResponse(socket, message, user) {
        try {
            const listResponse = message.message.listResponseMessage;
            const selectedItem = listResponse.singleSelectReply.selectedRowId;
            
            logger.info(`📋 List item selected: ${selectedItem} by user ${user.phoneNumber}`);
            
            const handler = this.buttonHandlers.get(selectedItem);
            if (handler) {
                await handler(socket, message, user, selectedItem);
            } else {
                await this.handleDynamicButton(socket, message, user, selectedItem);
            }
        } catch (error) {
            logger.error('❌ Error handling list response:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing your selection. Please try again.'
            });
        }
    }

    async handleDynamicButton(socket, message, user, buttonId) {
        try {
            if (buttonId.startsWith('user_')) {
                // Handle user management buttons
                await this.handleUserAction(socket, message, user, buttonId);
            } else if (buttonId.startsWith('game_')) {
                // Handle game-specific buttons
                await gameHandler.handleGameButton(socket, message, user, buttonId);
            } else if (buttonId.startsWith('confirm_')) {
                // Handle confirmation buttons
                await this.handleConfirmation(socket, message, user, buttonId);
            } else {
                logger.warn(`🤔 Unknown button ID: ${buttonId}`);
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❓ Unknown selection. Please try again.'
                });
            }
        } catch (error) {
            logger.error('❌ Error handling dynamic button:', error);
        }
    }

    async handleUserAction(socket, message, user, buttonId) {
        if (!user.isAdmin) {
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ You need admin privileges to perform this action.'
            });
            return;
        }

        const parts = buttonId.split('_');
        const action = parts[1];
        const targetUserId = parts[2];

        // Implementation for user management actions
        // This would integrate with admin commands
        const adminHandler = require('../commands/admin');
        await adminHandler.handleUserAction(socket, message, user, action, targetUserId);
    }

    async handleConfirmation(socket, message, user, buttonId) {
        const parts = buttonId.split('_');
        const action = parts[1];

        switch (action) {
            case 'ban':
            case 'unban':
            case 'promote':
            case 'demote':
                if (!user.isAdmin) {
                    await socket.sendMessage(message.key.remoteJid, {
                        text: '❌ You need admin privileges to perform this action.'
                    });
                    return;
                }
                // Handle admin confirmations
                break;
                
            case 'broadcast':
                if (!user.isAdmin) {
                    await socket.sendMessage(message.key.remoteJid, {
                        text: '❌ You need admin privileges to broadcast messages.'
                    });
                    return;
                }
                // Handle broadcast confirmation
                break;
                
            default:
                logger.warn(`🤔 Unknown confirmation action: ${action}`);
        }
    }

    async handleAdminStats(socket, message, user) {
        if (!user.isAdmin) {
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ You need admin privileges to view statistics.'
            });
            return;
        }

        const adminHandler = require('../commands/admin');
        await adminHandler.showBotStats(socket, message, user);
    }

    async handleAdminUsers(socket, message, user) {
        if (!user.isAdmin) {
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ You need admin privileges to manage users.'
            });
            return;
        }

        const adminHandler = require('../commands/admin');
        await adminHandler.showUserManagement(socket, message, user);
    }

    async handleAdminBroadcast(socket, message, user) {
        if (!user.isAdmin) {
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ You need admin privileges to broadcast messages.'
            });
            return;
        }

        await socket.sendMessage(message.key.remoteJid, {
            text: '📢 *Broadcast Message*\n\nPlease send the message you want to broadcast to all users.\n\nType /cancel to cancel the broadcast.'
        });

        // Set user state for broadcast
        // This would be handled by a state management system
    }

    async handleAdminSettings(socket, message, user) {
        if (!user.isAdmin) {
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ You need admin privileges to access settings.'
            });
            return;
        }

        const adminHandler = require('../commands/admin');
        await adminHandler.showSettings(socket, message, user);
    }

    async handleHelpCommands(socket, message, user) {
        const helpHandler = require('../commands/help');
        await helpHandler.showCommandHelp(socket, message, user);
    }

    async handleHelpGames(socket, message, user) {
        const helpHandler = require('../commands/help');
        await helpHandler.showGameHelp(socket, message, user);
    }

    async handleHelpAI(socket, message, user) {
        const helpHandler = require('../commands/help');
        await helpHandler.showAIHelp(socket, message, user);
    }

    async handleHelpAdmin(socket, message, user) {
        if (!user.isAdmin) {
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Admin help is only available to administrators.'
            });
            return;
        }

        const helpHandler = require('../commands/help');
        await helpHandler.showAdminHelp(socket, message, user);
    }

    async handleMainMenu(socket, message, user) {
        const startHandler = require('../commands/start');
        await startHandler.showMainMenu(socket, message, user);
    }

    async handleBack(socket, message, user) {
        await socket.sendMessage(message.key.remoteJid, {
            text: '🔙 Going back to main menu...'
        });
        
        const startHandler = require('../commands/start');
        await startHandler.showMainMenu(socket, message, user);
    }

    async handleCancel(socket, message, user) {
        await socket.sendMessage(message.key.remoteJid, {
            text: '❌ Operation cancelled.'
        });
    }
}

module.exports = new ButtonHandler();