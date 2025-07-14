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
                `Choose an administrative function:`;

            const sections = [
                {
                    title: "📊 Statistics & Monitoring",
                    rows: [
                        { title: "📈 Bot Statistics", description: "View detailed bot analytics", rowId: "admin_stats" },
                        { title: "👥 User Analytics", description: "User activity and demographics", rowId: "admin_user_analytics" },
                        { title: "🎮 Game Statistics", description: "Gaming activity and leaderboards", rowId: "admin_game_stats" },
                        { title: "🤖 AI Usage Stats", description: "AI request analytics", rowId: "admin_ai_stats" }
                    ]
                },
                {
                    title: "👥 User Management",
                    rows: [
                        { title: "👤 All Users", description: "View and manage all users", rowId: "admin_users" },
                        { title: "🚫 Banned Users", description: "Manage banned users", rowId: "admin_banned_users" },
                        { title: "👑 Admin Users", description: "Manage administrators", rowId: "admin_admin_users" },
                        { title: "🔍 Search User", description: "Find specific user", rowId: "admin_search_user" }
                    ]
                },
                {
                    title: "📢 Communication",
                    rows: [
                        { title: "📢 Broadcast Message", description: "Send message to all users", rowId: "admin_broadcast" },
                        { title: "🎯 Targeted Message", description: "Send to specific groups", rowId: "admin_targeted_broadcast" },
                        { title: "📋 Message History", description: "View broadcast history", rowId: "admin_broadcast_history" }
                    ]
                },
                {
                    title: "⚙️ Bot Management",
                    rows: [
                        { title: "⚙️ Bot Settings", description: "Configure bot settings", rowId: "admin_settings" },
                        { title: "🔧 Maintenance", description: "Bot maintenance tools", rowId: "admin_maintenance" },
                        { title: "📊 System Status", description: "Check system health", rowId: "admin_system_status" },
                        { title: "🗄️ Database Tools", description: "Database management", rowId: "admin_database" }
                    ]
                }
            ];

            await socket.sendMessage(message.key.remoteJid, {
                text: panelText,
                footer: "👑 Administrator Panel",
                title: "Admin Control Panel",
                buttonText: "📋 Select Function",
                sections: sections
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
            
            // Get bot instance for uptime
            const bot = new WhatsAppBot();
            const uptime = bot.getUptime();
            
            // Get various statistics
            const userStats = await userService.getUserStats();
            const gameStats = gameHandler.getGameStats();
            
            // Get database stats
            const { Message, AIRequest, FileProcessing } = require('../database/models');
            
            const totalMessages = await Message.count();
            const totalAIRequests = await AIRequest.count();
            const totalFileProcessing = await FileProcessing.count();
            
            // Get today's stats
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
            
            // System Stats
            statsText += `🤖 *System Status:*\n`;
            statsText += `• Uptime: ${formatUptime(uptime)}\n`;
            statsText += `• AI Service: ${aiService.isAvailable() ? '✅ Online' : '❌ Offline'}\n`;
            statsText += `• Active Games: ${gameStats.activeGames}\n\n`;
            
            // User Stats
            statsText += `👥 *User Statistics:*\n`;
            statsText += `• Total Users: ${userStats.total}\n`;
            statsText += `• Active Users (7d): ${userStats.active}\n`;
            statsText += `• Admin Users: ${userStats.admins}\n`;
            statsText += `• Banned Users: ${userStats.banned}\n\n`;
            
            // Message Stats
            statsText += `💬 *Message Statistics:*\n`;
            statsText += `• Total Messages: ${totalMessages}\n`;
            statsText += `• Today's Messages: ${todayMessages}\n`;
            statsText += `• AI Requests: ${totalAIRequests}\n`;
            statsText += `• Today's AI Requests: ${todayAIRequests}\n\n`;
            
            // File Processing Stats
            statsText += `📄 *File Processing:*\n`;
            statsText += `• Files Processed: ${totalFileProcessing}\n`;
            
            // Game Stats
            if (gameStats.activeGames > 0) {
                statsText += `\n🎮 *Game Statistics:*\n`;
                statsText += `• Active Games: ${gameStats.activeGames}\n`;
                statsText += `• Game Types: ${gameStats.gameTypes.join(', ')}\n`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: statsText,
                buttons: [
                    {
                        buttonId: 'admin_user_analytics',
                        buttonText: { displayText: '👥 User Details' },
                        type: 1
                    },
                    {
                        buttonId: 'admin_refresh_stats',
                        buttonText: { displayText: '🔄 Refresh' },
                        type: 1
                    },
                    {
                        buttonId: 'admin_panel',
                        buttonText: { displayText: '🏠 Admin Panel' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: '📊 Bot Analytics Dashboard'
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

            let userListText = `👥 *User Management*\n\n`;
            userListText += `Recent users (showing ${users.length}):\n\n`;

            users.forEach((u, index) => {
                const status = u.isBanned ? '🚫' : u.isAdmin ? '👑' : '👤';
                const lastSeen = new Date(u.lastSeen).toLocaleDateString();
                userListText += `${status} *${u.name || 'Unknown'}*\n`;
                userListText += `   📱 ${u.phoneNumber}\n`;
                userListText += `   📅 Last seen: ${lastSeen}\n\n`;
            });

            const sections = [
                {
                    title: "👤 User Actions",
                    rows: [
                        { title: "🔍 Search User", description: "Find user by phone number", rowId: "admin_search_user" },
                        { title: "👑 Promote User", description: "Make user an admin", rowId: "admin_promote_user" },
                        { title: "👤 Demote Admin", description: "Remove admin privileges", rowId: "admin_demote_user" }
                    ]
                },
                {
                    title: "🚫 Moderation",
                    rows: [
                        { title: "🚫 Ban User", description: "Ban user from bot", rowId: "admin_ban_user" },
                        { title: "✅ Unban User", description: "Remove user ban", rowId: "admin_unban_user" },
                        { title: "📋 Banned Users", description: "View all banned users", rowId: "admin_banned_users" }
                    ]
                }
            ];

            await socket.sendMessage(message.key.remoteJid, {
                text: userListText,
                footer: "👥 User Management Panel",
                title: "User Management",
                buttonText: "📋 Select Action",
                sections: sections
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
            
            // Confirm broadcast
            await socket.sendMessage(message.key.remoteJid, {
                text: `📢 *Confirm Broadcast*\n\n*Message:*\n${broadcastMessage}\n\nThis will be sent to all users. Are you sure?`,
                buttons: [
                    {
                        buttonId: 'confirm_broadcast_yes',
                        buttonText: { displayText: '✅ Send Now' },
                        type: 1
                    },
                    {
                        buttonId: 'confirm_broadcast_no',
                        buttonText: { displayText: '❌ Cancel' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: 'Broadcast Confirmation'
            });

            // Store broadcast message for confirmation
            // This would typically be handled by a session management system
            // For now, we'll handle it in the button handler

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
                    // Don't send to the admin who sent the broadcast
                    if (targetUser.id === user.id) continue;

                    const targetJid = `${targetUser.phoneNumber}@s.whatsapp.net`;
                    await socket.sendMessage(targetJid, {
                        text: finalMessage
                    });
                    
                    successCount++;
                    
                    // Small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                } catch (error) {
                    logger.error(`❌ Failed to send broadcast to ${targetUser.phoneNumber}:`, error);
                    failureCount++;
                }
            }

            const resultText = `📢 *Broadcast Complete*\n\n` +
                `✅ Successfully sent: ${successCount}\n` +
                `❌ Failed to send: ${failureCount}\n` +
                `📊 Total users: ${users.length}`;

            await socket.sendMessage(message.key.remoteJid, {
                text: resultText
            });

            logger.info(`📢 Broadcast completed by admin ${user.phoneNumber}: ${successCount} success, ${failureCount} failures`);

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
            
            if (success) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `✅ User ${targetUser.name || phoneNumber} has been banned.\n\n*Reason:* ${reason}`
                });
            } else {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Failed to ban user. Please try again.'
                });
            }

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
            
            if (success) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `✅ User ${targetUser.name || phoneNumber} has been unbanned.`
                });
            } else {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Failed to unban user. Please try again.'
                });
            }

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
            
            if (success) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `✅ User ${targetUser.name || phoneNumber} has been promoted to admin.`
                });
            } else {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Failed to promote user. Please try again.'
                });
            }

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
            
            if (success) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `✅ User ${targetUser.name || phoneNumber} has been demoted from admin.`
                });
            } else {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Failed to demote user. Please try again.'
                });
            }

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
                `• RPS Timeout: ${config.ROCK_PAPER_SCISSORS_TIMEOUT/1000}s\n` +
                `• Quiz Timeout: ${config.QUIZ_TIMEOUT/1000}s\n\n` +
                `📄 *File Support:*\n` +
                `• Document Types: ${config.SUPPORTED_FILE_TYPES.length}\n` +
                `• Image Types: ${config.SUPPORTED_IMAGE_TYPES.length}\n\n` +
                `⚠️ Settings are configured via environment variables.`;

            await socket.sendMessage(message.key.remoteJid, {
                text: settingsText,
                buttons: [
                    {
                        buttonId: 'admin_system_status',
                        buttonText: { displayText: '📊 System Status' },
                        type: 1
                    },
                    {
                        buttonId: 'admin_stats',
                        buttonText: { displayText: '📈 Bot Stats' },
                        type: 1
                    },
                    {
                        buttonId: 'admin_panel',
                        buttonText: { displayText: '🏠 Admin Panel' },
                        type: 1
                    }
                ],
                headerType: 1,
                footer: '⚙️ Configuration Panel'
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