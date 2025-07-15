const logger = require('../utils/logger');
const userService = require('../services/userService');
const { formatPhoneNumber, formatUptime } = require('../utils/helpers');

class AdminCommand {
    async handle(socket, message, user, args) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to use this command.'
                });
                return;
            }

            await this.showAdminPanel(socket, message, user);

        } catch (error) {
            logger.error('❌ Error in admin command:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading admin panel. Please try again.'
            });
        }
    }

    async showAdminPanel(socket, message, user) {
        try {
            const panelText = `👑 *Admin Control Panel*\n\n` +
                `Welcome, Administrator ${user.name || user.phoneNumber}!\n\n` +
                `Available Commands:\n\n` +
                `📊 Statistics & Monitoring\n` +
                `• /admin_stats - View detailed bot analytics\n` +
                `• /admin_user_analytics - User activity and demographics\n` +
                `• /admin_game_stats - Gaming activity and leaderboards\n` +
                `• /admin_ai_stats - AI request analytics\n\n` +
                `👥 User Management\n` +
                `• /admin_users - View and manage all users\n` +
                `• /admin_banned_users - Manage banned users\n` +
                `• /admin_admin_users - Manage administrators\n` +
                `• /admin_search_user - Find specific user\n\n` +
                `📢 Communication\n` +
                `• /admin_broadcast - Send message to all users\n` +
                `• /admin_targeted_broadcast - Send to specific groups\n` +
                `• /admin_broadcast_history - View broadcast history\n\n` +
                `⚙️ Bot Management\n` +
                `• /admin_settings - Configure bot settings\n` +
                `• /admin_maintenance - Bot maintenance tools\n` +
                `• /admin_system_status - Check system health\n` +
                `• /admin_database - Database management`;

            await socket.sendMessage(message.key.remoteJid, {
                text: panelText
            });

        } catch (error) {
            logger.error('❌ Error showing admin panel:', error);
        }
    }

    async showBotStats(socket, message, user) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to view statistics.'
                });
                return;
            }

            const WhatsAppBot = require('../bot');
            const aiService = require('../services/aiService');
            const gameHandler = require('../handlers/gameHandler');

            const bot = new WhatsAppBot();
            const uptime = bot.getUptime();

            const userStats = await userService.getUserStats();
            const gameStats = gameHandler.getGameStats();

            const { Message, AIRequest, FileProcessing } = require('../database/models');

            const totalMessages = await Message.count();
            const totalAIRequests = await AIRequest.count();
            const totalFileProcessing = await FileProcessing.count();

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const todayMessages = await Message.count({
                where: {
                    createdAt: {
                        [require('sequelize').Op.gte]: today
                    }
                }
            });

            const todayAIRequests = await AIRequest.count({
                where: {
                    createdAt: {
                        [require('sequelize').Op.gte]: today
                    }
                }
            });

            let statsText = `📊 *Bot Statistics*\n\n`;
            statsText += `🤖 *System Status:*\n`;
            statsText += `• Uptime: ${formatUptime(uptime)}\n`;
            statsText += `• AI Service: ${aiService.isAvailable() ? '✅ Online' : '❌ Offline'}\n`;
            statsText += `• Active Games: ${gameStats.activeGames}\n\n`;
            statsText += `👥 *User Statistics:*\n`;
            statsText += `• Total Users: ${userStats.total}\n`;
            statsText += `• Active Users (7d): ${userStats.active}\n`;
            statsText += `• Admin Users: ${userStats.admins}\n`;
            statsText += `• Banned Users: ${userStats.banned}\n\n`;
            statsText += `💬 *Message Statistics:*\n`;
            statsText += `• Total Messages: ${totalMessages}\n`;
            statsText += `• Today's Messages: ${todayMessages}\n`;
            statsText += `• AI Requests: ${totalAIRequests}\n`;
            statsText += `• Today's AI Requests: ${todayAIRequests}\n\n`;
            statsText += `📄 *File Processing:*\n`;
            statsText += `• Files Processed: ${totalFileProcessing}\n`;

            if (gameStats.activeGames > 0) {
                statsText += `\n🎮 *Game Statistics:*\n`;
                statsText += `• Active Games: ${gameStats.activeGames}\n`;
                statsText += `• Game Types: ${gameStats.gameTypes.join(', ')}\n`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: statsText
            });

        } catch (error) {
            logger.error('❌ Error showing bot stats:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading statistics. Please try again.'
            });
        }
    }

    async showUserManagement(socket, message, user) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to manage users.'
                });
                return;
            }

            const users = await userService.getAllUsers({ limit: 10 });

            if (users.length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '📋 *User Management*\n\nNo users found in the database.'
                });
                return;
            }

            let userListText = `👥 *User Management*\n\nRecent users (showing ${users.length}):\n\n`;

            users.forEach((u) => {
                const status = u.isBanned ? '🚫' : u.isAdmin ? '👑' : '👤';
                const lastSeen = new Date(u.lastSeen).toLocaleDateString();
                userListText += `${status} *${u.name || 'Unknown'}*\n   📱 ${u.phoneNumber}\n   📅 Last seen: ${lastSeen}\n\n`;
            });

            userListText += `\nAvailable Actions:\n` +
                `• /admin_search_user\n` +
                `• /admin_promote_user\n` +
                `• /admin_demote_user\n` +
                `• /admin_ban_user\n` +
                `• /admin_unban_user\n` +
                `• /admin_banned_users`;

            await socket.sendMessage(message.key.remoteJid, {
                text: userListText
            });

        } catch (error) {
            logger.error('❌ Error showing user management:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading user management. Please try again.'
            });
        }
    }

    async handleBroadcast(socket, message, user, args) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to broadcast messages.'
                });
                return;
            }

            if (args.length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '📢 *Broadcast Message*\n\nPlease provide the message to broadcast:\n\n*Usage:* /broadcast <your message>\n\nExample: /broadcast Hello everyone! The bot has been updated with new features.'
                });
                return;
            }

            const broadcastMessage = args.join(' ');

            await socket.sendMessage(message.key.remoteJid, {
                text: `📢 *Confirm Broadcast*\n\n*Message:*\n${broadcastMessage}\n\nThis will be sent to all users.\n\nType /confirm_broadcast to send or /cancel_broadcast to cancel.`
            });

        } catch (error) {
            logger.error('❌ Error handling broadcast:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error setting up broadcast. Please try again.'
            });
        }
    }

    async executeBroadcast(socket, message, user, broadcastMessage) {
        try {
            const users = await userService.getAllUsers({ banned: false });

            if (users.length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '📢 No users found to broadcast to.'
                });
                return;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: `📢 Broadcasting to ${users.length} users... Please wait.`
            });

            let successCount = 0;
            let failureCount = 0;

            const finalMessage = `📢 *Broadcast from Admin*\n\n${broadcastMessage}\n\n_This is an official message from the bot administrator._`;

            for (const targetUser of users) {
                try {
                    if (targetUser.id === user.id) continue;
                    const targetJid = `${targetUser.phoneNumber}@s.whatsapp.net`;
                    await socket.sendMessage(targetJid, {
                        text: finalMessage
                    });
                    successCount++;
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    logger.error(`❌ Failed to send broadcast to ${targetUser.phoneNumber}:`, error);
                    failureCount++;
                }
            }

            const resultText = `📢 *Broadcast Complete*\n\n✅ Successfully sent: ${successCount}\n❌ Failed to send: ${failureCount}\n📊 Total users: ${users.length}`;

            await socket.sendMessage(message.key.remoteJid, {
                text: resultText
            });

        } catch (error) {
            logger.error('❌ Error executing broadcast:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error executing broadcast. Some messages may not have been sent.'
            });
        }
    }

    async handleBanUser(socket, message, user, args) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to ban users.'
                });
                return;
            }

            if (args.length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '🚫 *Ban User*\n\nPlease provide the phone number to ban:\n\n*Usage:* /ban <phone_number> [reason]\n\nExample: /ban +1234567890 Spam behavior'
                });
                return;
            }

            const phoneNumber = formatPhoneNumber(args[0]);
            const reason = args.slice(1).join(' ') || 'No reason provided';

            const targetUser = await userService.getUserByPhone(phoneNumber);

            if (!targetUser) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ User with phone number ${phoneNumber} not found.`
                });
                return;
            }

            if (targetUser.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Cannot ban admin users. Please demote them first.'
                });
                return;
            }

            if (targetUser.isBanned) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ User ${targetUser.name || phoneNumber} is already banned.`
                });
                return;
            }

            const success = await userService.banUser(targetUser.id, user.id, reason);

            await socket.sendMessage(message.key.remoteJid, {
                text: success
                    ? `✅ User ${targetUser.name || phoneNumber} has been banned.\n\n*Reason:* ${reason}`
                    : '❌ Failed to ban user. Please try again.'
            });

        } catch (error) {
            logger.error('❌ Error banning user:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error banning user. Please try again.'
            });
        }
    }

    async handleUnbanUser(socket, message, user, args) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to unban users.'
                });
                return;
            }

            if (args.length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '✅ *Unban User*\n\nPlease provide the phone number to unban:\n\n*Usage:* /unban <phone_number>\n\nExample: /unban +1234567890'
                });
                return;
            }

            const phoneNumber = formatPhoneNumber(args[0]);
            const targetUser = await userService.getUserByPhone(phoneNumber);

            if (!targetUser) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ User with phone number ${phoneNumber} not found.`
                });
                return;
            }

            if (!targetUser.isBanned) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ User ${targetUser.name || phoneNumber} is not banned.`
                });
                return;
            }

            const success = await userService.unbanUser(targetUser.id);

            await socket.sendMessage(message.key.remoteJid, {
                text: success
                    ? `✅ User ${targetUser.name || phoneNumber} has been unbanned.`
                    : '❌ Failed to unban user. Please try again.'
            });

        } catch (error) {
            logger.error('❌ Error unbanning user:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error unbanning user. Please try again.'
            });
        }
    }

    async handlePromoteUser(socket, message, user, args) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to promote users.'
                });
                return;
            }

            if (args.length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '👑 *Promote User*\n\nPlease provide the phone number to promote:\n\n*Usage:* /promote <phone_number>\n\nExample: /promote +1234567890'
                });
                return;
            }

            const phoneNumber = formatPhoneNumber(args[0]);
            const targetUser = await userService.getUserByPhone(phoneNumber);

            if (!targetUser) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ User with phone number ${phoneNumber} not found.`
                });
                return;
            }

            if (targetUser.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ User ${targetUser.name || phoneNumber} is already an admin.`
                });
                return;
            }

            const success = await userService.promoteToAdmin(targetUser.id);

            await socket.sendMessage(message.key.remoteJid, {
                text: success
                    ? `✅ User ${targetUser.name || phoneNumber} has been promoted to admin.`
                    : '❌ Failed to promote user. Please try again.'
            });

        } catch (error) {
            logger.error('❌ Error promoting user:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error promoting user. Please try again.'
            });
        }
    }

    async handleDemoteUser(socket, message, user, args) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to demote users.'
                });
                return;
            }

            if (args.length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '👤 *Demote User*\n\nPlease provide the phone number to demote:\n\n*Usage:* /demote <phone_number>\n\nExample: /demote +1234567890'
                });
                return;
            }

            const phoneNumber = formatPhoneNumber(args[0]);
            const targetUser = await userService.getUserByPhone(phoneNumber);

            if (!targetUser) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ User with phone number ${phoneNumber} not found.`
                });
                return;
            }

            if (!targetUser.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ User ${targetUser.name || phoneNumber} is not an admin.`
                });
                return;
            }

            const success = await userService.demoteFromAdmin(targetUser.id);

            await socket.sendMessage(message.key.remoteJid, {
                text: success
                    ? `✅ User ${targetUser.name || phoneNumber} has been demoted from admin.`
                    : '❌ Failed to demote user. Please try again.'
            });

        } catch (error) {
            logger.error('❌ Error demoting user:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error demoting user. Please try again.'
            });
        }
    }

    async showSettings(socket, message, user) {
        try {
            if (!user.isAdmin) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ You need admin privileges to access settings.'
                });
                return;
            }

            const config = require('../config/config');

            const settingsText = `⚙️ *Bot Settings*\n\n` +
                `📱 *Bot Configuration:*\n` +
                `• Name: ${config.BOT_NAME}\n` +
                `• Prefix: ${config.BOT_PREFIX}\n` +
                `• Max File Size: ${(config.MAX_FILE_SIZE / 1024 / 1024).toFixed(1)}MB\n` +
                `• Rate Limit: ${config.MAX_REQUESTS_PER_MINUTE}/min\n\n` +
                `🤖 *AI Settings:*\n` +
                `• Chat Model: ${config.AI_CHAT_MODEL}\n` +
                `• Analysis Model: ${config.AI_ANALYSIS_MODEL}\n` +
                `• AI Available: ${require('../services/aiService').isAvailable() ? '✅' : '❌'}\n\n` +
                `🎮 *Game Settings:*\n` +
                `• RPS Timeout: ${config.ROCK_PAPER_SCISSORS_TIMEOUT / 1000}s\n` +
                `• Quiz Timeout: ${config.QUIZ_TIMEOUT / 1000}s\n\n` +
                `📄 *File Support:*\n` +
                `• Document Types: ${config.SUPPORTED_FILE_TYPES.length}\n` +
                `• Image Types: ${config.SUPPORTED_IMAGE_TYPES.length}\n\n` +
                `⚠️ Settings are configured via environment variables.`;

            await socket.sendMessage(message.key.remoteJid, {
                text: settingsText
            });

        } catch (error) {
            logger.error('❌ Error showing settings:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading settings. Please try again.'
            });
        }
    }
}

module.exports = new AdminCommand();
