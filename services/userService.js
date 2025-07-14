const { User } = require('../database/models');
const logger = require('../utils/logger');
const { formatPhoneNumber, isAdmin } = require('../utils/helpers');

class UserService {
    async getOrCreateUser(phoneNumber, name = null) {
        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            
            let user = await User.findOne({
                where: { phoneNumber: formattedPhone }
            });
            
            if (!user) {
                user = await User.create({
                    phoneNumber: formattedPhone,
                    name: name,
                    isAdmin: isAdmin(formattedPhone),
                    lastSeen: new Date()
                });
                
                logger.info(`👤 New user created: ${formattedPhone} (${name || 'Unknown'})`);
            } else if (name && user.name !== name) {
                // Update user name if provided and different
                await user.update({ name: name });
            }
            
            return user;
        } catch (error) {
            logger.error('❌ Error in getOrCreateUser:', error);
            throw error;
        }
    }
    
    async getUserByPhone(phoneNumber) {
        try {
            const formattedPhone = formatPhoneNumber(phoneNumber);
            return await User.findOne({
                where: { phoneNumber: formattedPhone }
            });
        } catch (error) {
            logger.error('❌ Error in getUserByPhone:', error);
            throw error;
        }
    }
    
    async updateLastSeen(userId) {
        try {
            await User.update(
                { lastSeen: new Date() },
                { where: { id: userId } }
            );
        } catch (error) {
            logger.error('❌ Error updating last seen:', error);
        }
    }
    
    async banUser(userId, bannedById, reason = null) {
        try {
            const result = await User.update({
                isBanned: true,
                bannedBy: bannedById,
                bannedAt: new Date(),
                banReason: reason
            }, {
                where: { id: userId }
            });
            
            if (result[0] > 0) {
                logger.info(`🚫 User ${userId} banned by ${bannedById}: ${reason || 'No reason'}`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('❌ Error banning user:', error);
            throw error;
        }
    }
    
    async unbanUser(userId) {
        try {
            const result = await User.update({
                isBanned: false,
                bannedBy: null,
                bannedAt: null,
                banReason: null
            }, {
                where: { id: userId }
            });
            
            if (result[0] > 0) {
                logger.info(`✅ User ${userId} unbanned`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('❌ Error unbanning user:', error);
            throw error;
        }
    }
    
    async promoteToAdmin(userId) {
        try {
            const result = await User.update({
                isAdmin: true
            }, {
                where: { id: userId }
            });
            
            if (result[0] > 0) {
                logger.info(`👑 User ${userId} promoted to admin`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('❌ Error promoting user:', error);
            throw error;
        }
    }
    
    async demoteFromAdmin(userId) {
        try {
            const result = await User.update({
                isAdmin: false
            }, {
                where: { id: userId }
            });
            
            if (result[0] > 0) {
                logger.info(`👤 User ${userId} demoted from admin`);
                return true;
            }
            return false;
        } catch (error) {
            logger.error('❌ Error demoting user:', error);
            throw error;
        }
    }
    
    async getAllUsers(options = {}) {
        try {
            const { limit = 50, offset = 0, banned = null, admin = null } = options;
            
            const where = {};
            if (banned !== null) where.isBanned = banned;
            if (admin !== null) where.isAdmin = admin;
            
            return await User.findAll({
                where,
                limit,
                offset,
                order: [['lastSeen', 'DESC']]
            });
        } catch (error) {
            logger.error('❌ Error getting all users:', error);
            throw error;
        }
    }
    
    async getUserStats() {
        try {
            const totalUsers = await User.count();
            const activeUsers = await User.count({
                where: {
                    lastSeen: {
                        [require('sequelize').Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            const bannedUsers = await User.count({
                where: { isBanned: true }
            });
            const adminUsers = await User.count({
                where: { isAdmin: true }
            });
            
            return {
                total: totalUsers,
                active: activeUsers,
                banned: bannedUsers,
                admins: adminUsers
            };
        } catch (error) {
            logger.error('❌ Error getting user stats:', error);
            throw error;
        }
    }
    
    async updateGameStats(userId, gameType, stats) {
        try {
            const user = await User.findByPk(userId);
            if (!user) return false;
            
            const currentStats = user.gameStats || {};
            if (!currentStats[gameType]) {
                currentStats[gameType] = {
                    played: 0,
                    won: 0,
                    lost: 0,
                    draw: 0,
                    score: 0
                };
            }
            
            // Update stats
            Object.keys(stats).forEach(key => {
                if (typeof stats[key] === 'number') {
                    currentStats[gameType][key] = (currentStats[gameType][key] || 0) + stats[key];
                }
            });
            
            await user.update({ gameStats: currentStats });
            return true;
        } catch (error) {
            logger.error('❌ Error updating game stats:', error);
            throw error;
        }
    }
    
    async getTopGamePlayers(gameType, limit = 10) {
        try {
            const users = await User.findAll({
                where: {
                    gameStats: {
                        [require('sequelize').Op.ne]: null
                    }
                }
            });
            
            // Filter and sort by game stats
            const filteredUsers = users
                .filter(user => user.gameStats && user.gameStats[gameType])
                .sort((a, b) => {
                    const aStats = a.gameStats[gameType];
                    const bStats = b.gameStats[gameType];
                    return (bStats.score || 0) - (aStats.score || 0);
                })
                .slice(0, limit);
            
            return filteredUsers.map(user => ({
                name: user.name || user.phoneNumber,
                phone: user.phoneNumber,
                stats: user.gameStats[gameType]
            }));
        } catch (error) {
            logger.error('❌ Error getting top game players:', error);
            throw error;
        }
    }
}

module.exports = new UserService();