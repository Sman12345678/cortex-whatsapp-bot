const { DataTypes } = require('sequelize');
const { sequelize } = require('./connection');

// User Model
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    phoneNumber: {
        type: DataTypes.STRING(20),
        unique: true,
        allowNull: false,
        field: 'phone_number'
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_admin'
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_banned'
    },
    bannedBy: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'banned_by',
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    bannedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'banned_at'
    },
    banReason: {
        type: DataTypes.STRING(256),
        allowNull: true,
        field: 'ban_reason'
    },
    lastSeen: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'last_seen'
    },
    gameStats: {
        type: DataTypes.JSON,
        defaultValue: {},
        field: 'game_stats'
    }
}, {
    tableName: 'users',
    indexes: [
        { fields: ['phone_number'] },
        { fields: ['is_admin'] },
        { fields: ['is_banned'] }
    ]
});

// Group Model
const Group = sequelize.define('Group', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    groupId: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        field: 'group_id'
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active'
    },
    settings: {
        type: DataTypes.JSON,
        defaultValue: {},
        field: 'settings'
    }
}, {
    tableName: 'groups',
    indexes: [
        { fields: ['group_id'] },
        { fields: ['is_active'] }
    ]
});

// Message Model
const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    messageId: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
        field: 'message_id'
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    groupId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'group_id',
        references: {
            model: Group,
            key: 'id'
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    messageType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'message_type'
    },
    isCommand: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'is_command'
    },
    commandName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'command_name'
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        field: 'metadata'
    }
}, {
    tableName: 'messages',
    indexes: [
        { fields: ['message_id'] },
        { fields: ['user_id'] },
        { fields: ['group_id'] },
        { fields: ['is_command'] },
        { fields: ['command_name'] },
        { fields: ['createdAt'] }
    ]
});

// AI Request Model
const AIRequest = sequelize.define('AIRequest', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    requestType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'request_type'
    },
    prompt: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    response: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tokensUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'tokens_used'
    },
    processingTime: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
        field: 'processing_time'
    },
    modelUsed: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'model_used'
    }
}, {
    tableName: 'ai_requests',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['request_type'] },
        { fields: ['createdAt'] }
    ]
});

// File Processing Model
const FileProcessing = sequelize.define('FileProcessing', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    filename: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    fileType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'file_type'
    },
    fileSize: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'file_size'
    },
    contentExtracted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'content_extracted'
    },
    aiAnalyzed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'ai_analyzed'
    },
    processingTime: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
        field: 'processing_time'
    },
    extractedContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'extracted_content'
    }
}, {
    tableName: 'file_processing',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['file_type'] },
        { fields: ['createdAt'] }
    ]
});

// Bot Stats Model
const BotStats = sequelize.define('BotStats', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    metricName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'metric_name'
    },
    metricValue: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'metric_value'
    },
    date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
    }
}, {
    tableName: 'bot_stats',
    indexes: [
        { fields: ['metric_name'] },
        { fields: ['date'] },
        { fields: ['metric_name', 'date'] }
    ]
});

// Game Session Model
const GameSession = sequelize.define('GameSession', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'user_id',
        references: {
            model: User,
            key: 'id'
        }
    },
    gameType: {
        type: DataTypes.STRING(50),
        allowNull: false,
        field: 'game_type'
    },
    gameData: {
        type: DataTypes.JSON,
        defaultValue: {},
        field: 'game_data'
    },
    status: {
        type: DataTypes.STRING(20),
        defaultValue: 'active',
        validate: {
            isIn: [['active', 'completed', 'cancelled', 'expired']]
        }
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at'
    }
}, {
    tableName: 'game_sessions',
    indexes: [
        { fields: ['user_id'] },
        { fields: ['game_type'] },
        { fields: ['status'] },
        { fields: ['createdAt'] }
    ]
});

// Define Associations
User.hasMany(Message, { foreignKey: 'userId', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Group.hasMany(Message, { foreignKey: 'groupId', as: 'messages' });
Message.belongsTo(Group, { foreignKey: 'groupId', as: 'group' });

User.hasMany(AIRequest, { foreignKey: 'userId', as: 'aiRequests' });
AIRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(FileProcessing, { foreignKey: 'userId', as: 'fileProcessings' });
FileProcessing.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(GameSession, { foreignKey: 'userId', as: 'gameSessions' });
GameSession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Self-referencing association for banned users
User.belongsTo(User, { foreignKey: 'bannedBy', as: 'bannedByUser' });

module.exports = {
    User,
    Group,
    Message,
    AIRequest,
    FileProcessing,
    BotStats,
    GameSession,
    sequelize
};