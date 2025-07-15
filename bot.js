const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    Browsers,
    delay,
    getContentType
} = require('@whiskeysockets/baileys');

let makeInMemoryStore;
try {
    makeInMemoryStore = require('@whiskeysockets/baileys').makeInMemoryStore;
} catch (e) {
    makeInMemoryStore = () => ({
        bind: (ev) => {
            console.log('Using fallback store implementation');
        },
        readFromFile: () => {},
        writeToFile: () => {}
    });
}
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const logger = require('./utils/logger');
const { initializeDatabase } = require('./database/connection');
const messageHandler = require('./handlers/messageHandler');
const { ensureDirectoryExists } = require('./utils/helpers');

class WhatsAppBot {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.qrCode = null;
        this.authState = null;
        try {
            this.store = makeInMemoryStore({});
            this.store.readFromFile('./sessions/baileys_store.json');
            setInterval(() => {
                this.store.writeToFile('./sessions/baileys_store.json');
            }, 30000);
        } catch (error) {
            logger.warn('⚠️ Store initialization failed, using fallback:', error.message);
            this.store = {
                bind: (ev) => logger.debug('Store bound to event emitter'),
                readFromFile: () => {},
                writeToFile: () => {}
            };
        }
        this.retryCount = 0;
        this.maxRetries = 5;
        this.startTime = Date.now();
        ensureDirectoryExists('./sessions');
    }

    async initialize() {
        try {
            logger.info('🚀 Initializing WhatsApp Bot...');
            const dbInitialized = await initializeDatabase();
            if (!dbInitialized) {
                throw new Error('Failed to initialize database');
            }
            const { state, saveCreds } = await useMultiFileAuthState('./sessions');
            this.authState = { state, saveCreds };
            await this.createConnection();
        } catch (error) {
            logger.error('❌ Bot initialization failed:', error);
            throw error;
        }
    }

    async createConnection() {
        try {
            logger.info('📱 Creating WhatsApp connection...');
            this.socket = makeWASocket({
                auth: this.authState.state,
                browser: Browsers.macOS('Desktop'),
                printQRInTerminal: false,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                syncFullHistory: false,
                fireInitQueries: true,
                generateHighQualityLinkPreview: true,
                // REMOVED: patchMessageBeforeSending for button/list logic
            });

            this.store.bind(this.socket.ev);
            this.setupEventHandlers();
        } catch (error) {
            logger.error('❌ Failed to create WhatsApp connection:', error);
            throw error;
        }
    }

    setupEventHandlers() {
        this.socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                logger.info('📱 QR Code received, displaying...');
                await this.handleQRCode(qr);
            }
            if (connection === 'close') {
                this.isConnected = false;
                const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
                logger.warn('🔌 Connection closed. Reconnecting:', shouldReconnect);
                if (shouldReconnect && this.retryCount < this.maxRetries) {
                    this.retryCount++;
                    logger.info(`🔄 Attempting to reconnect... (${this.retryCount}/${this.maxRetries})`);
                    await delay(5000);
                    await this.createConnection();
                } else if (this.retryCount >= this.maxRetries) {
                    logger.error('❌ Maximum retry attempts reached. Stopping bot.');
                    process.exit(1);
                } else {
                    logger.error('❌ Logged out. Please restart the bot to scan QR code again.');
                    process.exit(1);
                }
            } else if (connection === 'open') {
                this.isConnected = true;
                this.retryCount = 0;
                this.qrCode = null;
                logger.info('✅ WhatsApp connection established successfully!');
                logger.info(`📞 Bot connected as: ${this.socket.user?.name || 'Unknown'}`);
                logger.info(`📱 Phone: ${this.socket.user?.id || 'Unknown'}`);
            }
        });

        this.socket.ev.on('creds.update', this.authState.saveCreds);

        this.socket.ev.on('messages.upsert', async (messageUpdate) => {
            try {
                await messageHandler.handleMessages(this.socket, messageUpdate);
            } catch (error) {
                logger.error('❌ Error handling message:', error);
            }
        });

        this.socket.ev.on('messages.update', (updates) => {
            try {
                messageHandler.handleMessageUpdates(this.socket, updates);
            } catch (error) {
                logger.error('❌ Error handling message updates:', error);
            }
        });

        this.socket.ev.on('presence.update', (presenceUpdate) => {
            logger.debug('👁️ Presence update:', presenceUpdate);
        });

        this.socket.ev.on('groups.update', (groupUpdates) => {
            logger.debug('👥 Group updates:', groupUpdates);
        });

        this.socket.ev.on('contacts.update', (contactUpdates) => {
            logger.debug('📞 Contacts update:', contactUpdates);
        });
    }

    async handleQRCode(qr) {
        try {
            qrcode.generate(qr, { small: true });
            const qrCodeDataURL = await QRCode.toDataURL(qr, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            this.qrCode = {
                raw: qr,
                dataURL: qrCodeDataURL,
                timestamp: Date.now()
            };
            const qrCodePath = './web/public/qrcode.json';
            ensureDirectoryExists(path.dirname(qrCodePath));
            fs.writeFileSync(qrCodePath, JSON.stringify(this.qrCode, null, 2));
            logger.info('📱 QR Code saved for web interface');
            setTimeout(() => {
                if (this.qrCode && !this.isConnected) {
                    logger.warn('⏰ QR Code expired. Generating new one...');
                    this.qrCode = null;
                }
            }, config.QR_CODE_TIMEOUT);
        } catch (error) {
            logger.error('❌ Error handling QR code:', error);
        }
    }

    async sendMessage(jid, message, options = {}) {
        try {
            if (!this.isConnected) {
                throw new Error('Bot is not connected to WhatsApp');
            }
            const result = await this.socket.sendMessage(jid, message, options);
            logger.debug('📤 Message sent:', { jid, type: getContentType(message) });
            return result;
        } catch (error) {
            logger.error('❌ Error sending message:', error);
            throw error;
        }
    }

    async sendTextMessage(jid, text, options = {}) {
        return await this.sendMessage(jid, { text }, options);
    }

    // REMOVED: sendButtonMessage, sendListMessage

    async sendImageMessage(jid, imageBuffer, caption = '', options = {}) {
        return await this.sendMessage(jid, {
            image: imageBuffer,
            caption
        }, options);
    }

    async sendDocumentMessage(jid, documentBuffer, filename, mimetype, caption = '', options = {}) {
        return await this.sendMessage(jid, {
            document: documentBuffer,
            fileName: filename,
            mimetype,
            caption
        }, options);
    }

    async downloadMediaMessage(message) {
        try {
            const buffer = await this.socket.downloadMediaMessage(message, 'buffer');
            return buffer;
        } catch (error) {
            logger.error('❌ Error downloading media:', error);
            throw error;
        }
    }

    getUptime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            user: this.socket?.user || null,
            uptime: this.getUptime(),
            qrCode: this.qrCode,
            retryCount: this.retryCount
        };
    }

    async stop() {
        try {
            logger.info('🛑 Stopping WhatsApp Bot...');
            if (this.socket) {
                await this.socket.logout();
                this.socket = null;
            }
            this.isConnected = false;
            logger.info('✅ Bot stopped successfully');
        } catch (error) {
            logger.error('❌ Error stopping bot:', error);
        }
    }
}

module.exports = WhatsAppBot;
