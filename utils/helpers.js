const moment = require('moment');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phoneNumber) {
    // Remove all non-numeric characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
        cleaned = '1' + cleaned;
    }
    
    return cleaned;
}

/**
 * Extract user ID from WhatsApp JID
 */
function extractUserId(jid) {
    return jid.split('@')[0];
}

/**
 * Check if user is admin
 */
function isAdmin(phoneNumber) {
    const adminPhone = config.BOT_ADMIN_PHONE;
    if (!adminPhone) return false;
    
    return formatPhoneNumber(phoneNumber) === formatPhoneNumber(adminPhone);
}

/**
 * Parse command from message
 */
function parseCommand(message) {
    const text = message.trim();
    if (!text.startsWith(config.BOT_PREFIX)) {
        return null;
    }
    
    const parts = text.slice(config.BOT_PREFIX.length).split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    return {
        command,
        args,
        fullText: text
    };
}

/**
 * Format uptime string
 */
function formatUptime(seconds) {
    const duration = moment.duration(seconds, 'seconds');
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

/**
 * Get file extension
 */
function getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
}

/**
 * Check if file type is supported
 */
function isSupportedFileType(filename) {
    const extension = getFileExtension(filename);
    return config.SUPPORTED_FILE_TYPES.includes(extension);
}

/**
 * Check if image type is supported
 */
function isSupportedImageType(filename) {
    const extension = getFileExtension(filename);
    return config.SUPPORTED_IMAGE_TYPES.includes(extension);
}

/**
 * Generate random string
 */
function generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Sleep function
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate phone number
 */
function isValidPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Get current timestamp
 */
function getCurrentTimestamp() {
    return moment().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Escape markdown characters
 */
function escapeMarkdown(text) {
    return text.replace(/[_*~`]/g, '\\$&');
}

/**
 * Truncate text
 */
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Check if string is empty or whitespace
 */
function isEmpty(str) {
    return !str || str.trim().length === 0;
}

/**
 * Generate game session ID
 */
function generateGameSessionId() {
    return `game_${Date.now()}_${generateRandomString(6)}`;
}

/**
 * Format currency (for game scores)
 */
function formatCurrency(amount, currency = '$') {
    return `${currency}${amount.toLocaleString()}`;
}

/**
 * Get random element from array
 */
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

module.exports = {
    formatPhoneNumber,
    extractUserId,
    isAdmin,
    parseCommand,
    formatUptime,
    getFileExtension,
    isSupportedFileType,
    isSupportedImageType,
    generateRandomString,
    sleep,
    formatFileSize,
    isValidPhoneNumber,
    ensureDirectoryExists,
    getCurrentTimestamp,
    escapeMarkdown,
    truncateText,
    isEmpty,
    generateGameSessionId,
    formatCurrency,
    getRandomElement,
    shuffleArray
};