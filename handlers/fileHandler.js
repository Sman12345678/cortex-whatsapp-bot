const fs = require('fs');
const path = require('path');
const { getContentType } = require('@whiskeysockets/baileys');
const logger = require('../utils/logger');
const config = require('../config/config');
const aiService = require('../services/aiService');
const { 
    formatFileSize, 
    isSupportedFileType, 
    isSupportedImageType, 
    getFileExtension,
    ensureDirectoryExists 
} = require('../utils/helpers');

// File processors
const pdfParse = require('pdf-parse');
const xlsx = require('xlsx');

class FileHandler {
    constructor() {
        // Ensure temp directory exists
        ensureDirectoryExists('./temp');
    }

    async handleImageMessage(socket, message, user) {
        try {
            const imageMessage = message.message.imageMessage;
            const caption = imageMessage.caption || '';
            
            logger.info(`🖼️ Processing image from user ${user.phoneNumber}`);
            
            // Check file size
            if (imageMessage.fileLength > config.MAX_FILE_SIZE) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ Image too large (${formatFileSize(imageMessage.fileLength)}). Maximum size is ${formatFileSize(config.MAX_FILE_SIZE)}.`
                });
                return;
            }
            
            // Send processing message
            await socket.sendMessage(message.key.remoteJid, {
                text: '🔍 Analyzing your image... Please wait.'
            });
            
            const startTime = Date.now();
            
            // Download image
            const imageBuffer = await socket.downloadMediaMessage(message);
            
            // Analyze with AI
            const prompt = caption || "Analyze this image and describe what you see in detail.";
            const analysis = await aiService.analyzeImage(imageBuffer, prompt);
            
            const processingTime = (Date.now() - startTime) / 1000;
            
            // Send response
            await socket.sendMessage(message.key.remoteJid, {
                text: `🖼️ *Image Analysis*\n\n${analysis}\n\n⏱️ _Processed in ${processingTime.toFixed(2)}s_`
            });
            
            // Log AI request
            await aiService.logAIRequest(
                user.id, 
                'image_analysis', 
                prompt, 
                analysis, 
                config.AI_IMAGE_GENERATION_MODEL, 
                processingTime
            );
            
            // Log file processing
            await this.logFileProcessing(
                user.id,
                'image.jpg',
                'image',
                imageMessage.fileLength || 0,
                true,
                true,
                processingTime
            );
            
        } catch (error) {
            logger.error('❌ Error handling image message:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing image. Please try again.'
            });
        }
    }

    async handleDocumentMessage(socket, message, user) {
        try {
            const documentMessage = message.message.documentMessage || 
                                  message.message.documentWithCaptionMessage?.message?.documentMessage;
            
            if (!documentMessage) {
                return;
            }
            
            const filename = documentMessage.fileName || 'document';
            const mimetype = documentMessage.mimetype || '';
            const fileSize = documentMessage.fileLength || 0;
            const caption = message.message.documentWithCaptionMessage?.message?.caption || '';
            
            logger.info(`📄 Processing document ${filename} from user ${user.phoneNumber}`);
            
            // Check file size
            if (fileSize > config.MAX_FILE_SIZE) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ File too large (${formatFileSize(fileSize)}). Maximum size is ${formatFileSize(config.MAX_FILE_SIZE)}.`
                });
                return;
            }
            
            // Check file type
            const fileExtension = getFileExtension(filename);
            const isSupported = isSupportedFileType(filename) || isSupportedImageType(filename);
            
            if (!isSupported) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ Unsupported file type: .${fileExtension}\n\n*Supported formats:*\n📄 Documents: ${config.SUPPORTED_FILE_TYPES.join(', ')}\n🖼️ Images: ${config.SUPPORTED_IMAGE_TYPES.join(', ')}`
                });
                return;
            }
            
            // Send processing message
            await socket.sendMessage(message.key.remoteJid, {
                text: `🔍 Processing ${filename}... Please wait.`
            });
            
            const startTime = Date.now();
            
            try {
                // Download file
                const fileBuffer = await socket.downloadMediaMessage(message);
                
                // Extract content
                const extractedContent = await this.extractFileContent(fileBuffer, filename, fileExtension);
                
                if (!extractedContent) {
                    await socket.sendMessage(message.key.remoteJid, {
                        text: `❌ Could not extract content from ${filename}. The file might be corrupted or in an unsupported format.`
                    });
                    return;
                }
                
                // Analyze with AI if content was extracted
                let analysis = '';
                let aiAnalyzed = false;
                
                if (extractedContent.length > 50) { // Only analyze if there's substantial content
                    analysis = await aiService.analyzeDocument(extractedContent, filename, fileExtension);
                    aiAnalyzed = true;
                }
                
                const processingTime = (Date.now() - startTime) / 1000;
                
                // Prepare response
                let response = `📄 *File Analysis: ${filename}*\n\n`;
                response += `📊 *File Info:*\n`;
                response += `• Type: ${fileExtension.toUpperCase()}\n`;
                response += `• Size: ${formatFileSize(fileSize)}\n`;
                response += `• Content Length: ${extractedContent.length} characters\n\n`;
                
                if (aiAnalyzed && analysis) {
                    response += `🤖 *AI Analysis:*\n${analysis}\n\n`;
                }
                
                // Show content preview if it's short enough
                if (extractedContent.length <= 500) {
                    response += `📝 *Content Preview:*\n\`\`\`\n${extractedContent}\n\`\`\`\n\n`;
                } else {
                    response += `📝 *Content Preview:* (First 300 characters)\n\`\`\`\n${extractedContent.substring(0, 300)}...\n\`\`\`\n\n`;
                }
                
                response += `⏱️ _Processed in ${processingTime.toFixed(2)}s_`;
                
                // Send response (might need to split if too long)
                if (response.length > 4000) {
                    // Split into multiple messages
                    const parts = this.splitMessage(response, 4000);
                    for (const part of parts) {
                        await socket.sendMessage(message.key.remoteJid, { text: part });
                    }
                } else {
                    await socket.sendMessage(message.key.remoteJid, { text: response });
                }
                
                // Log AI request if analysis was performed
                if (aiAnalyzed) {
                    await aiService.logAIRequest(
                        user.id,
                        'file_analysis',
                        `Analyze ${filename}`,
                        analysis,
                        config.AI_ANALYSIS_MODEL,
                        processingTime
                    );
                }
                
                // Log file processing
                await this.logFileProcessing(
                    user.id,
                    filename,
                    fileExtension,
                    fileSize,
                    !!extractedContent,
                    aiAnalyzed,
                    processingTime
                );
                
            } catch (processingError) {
                logger.error('❌ Error processing file:', processingError);
                await socket.sendMessage(message.key.remoteJid, {
                    text: `❌ Error processing ${filename}. The file might be corrupted or in an unsupported format.`
                });
            }
            
        } catch (error) {
            logger.error('❌ Error handling document message:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing document. Please try again.'
            });
        }
    }

    async extractFileContent(fileBuffer, filename, fileExtension) {
        try {
            switch (fileExtension.toLowerCase()) {
                case 'pdf':
                    return await this.extractPDFContent(fileBuffer);
                
                case 'txt':
                case 'md':
                case 'log':
                    return fileBuffer.toString('utf8');
                
                case 'json':
                    return this.extractJSONContent(fileBuffer);
                
                case 'csv':
                    return this.extractCSVContent(fileBuffer);
                
                case 'xlsx':
                case 'xls':
                    return await this.extractExcelContent(fileBuffer);
                
                case 'html':
                case 'htm':
                    return this.extractHTMLContent(fileBuffer);
                
                case 'xml':
                    return this.extractXMLContent(fileBuffer);
                
                case 'yaml':
                case 'yml':
                    return this.extractYAMLContent(fileBuffer);
                
                case 'js':
                case 'py':
                case 'java':
                case 'cpp':
                case 'c':
                case 'php':
                case 'rb':
                case 'go':
                case 'rs':
                case 'swift':
                case 'css':
                    return this.extractCodeContent(fileBuffer, fileExtension);
                
                default:
                    // Try to read as text
                    return fileBuffer.toString('utf8');
            }
        } catch (error) {
            logger.error(`❌ Error extracting content from ${fileExtension} file:`, error);
            return null;
        }
    }

    async extractPDFContent(buffer) {
        try {
            const data = await pdfParse(buffer);
            return data.text;
        } catch (error) {
            logger.error('❌ Error extracting PDF content:', error);
            return null;
        }
    }

    extractJSONContent(buffer) {
        try {
            const jsonData = JSON.parse(buffer.toString('utf8'));
            return JSON.stringify(jsonData, null, 2);
        } catch (error) {
            return buffer.toString('utf8');
        }
    }

    extractCSVContent(buffer) {
        try {
            const csvText = buffer.toString('utf8');
            const lines = csvText.split('\n').slice(0, 20); // First 20 lines
            return lines.join('\n') + (csvText.split('\n').length > 20 ? '\n... (truncated)' : '');
        } catch (error) {
            return buffer.toString('utf8');
        }
    }

    async extractExcelContent(buffer) {
        try {
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            let content = '';
            
            workbook.SheetNames.forEach(sheetName => {
                content += `Sheet: ${sheetName}\n`;
                const sheet = workbook.Sheets[sheetName];
                const csvData = xlsx.utils.sheet_to_csv(sheet);
                const lines = csvData.split('\n').slice(0, 10); // First 10 lines per sheet
                content += lines.join('\n') + '\n\n';
            });
            
            return content;
        } catch (error) {
            logger.error('❌ Error extracting Excel content:', error);
            return null;
        }
    }

    extractHTMLContent(buffer) {
        try {
            const html = buffer.toString('utf8');
            // Simple HTML tag removal (basic extraction)
            return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
        } catch (error) {
            return buffer.toString('utf8');
        }
    }

    extractXMLContent(buffer) {
        try {
            return buffer.toString('utf8');
        } catch (error) {
            return null;
        }
    }

    extractYAMLContent(buffer) {
        try {
            return buffer.toString('utf8');
        } catch (error) {
            return null;
        }
    }

    extractCodeContent(buffer, extension) {
        try {
            const code = buffer.toString('utf8');
            return `Language: ${extension}\n\n${code}`;
        } catch (error) {
            return buffer.toString('utf8');
        }
    }

    splitMessage(message, maxLength) {
        const parts = [];
        let currentPart = '';
        
        const lines = message.split('\n');
        
        for (const line of lines) {
            if ((currentPart + line + '\n').length > maxLength) {
                if (currentPart) {
                    parts.push(currentPart.trim());
                    currentPart = '';
                }
                
                if (line.length > maxLength) {
                    // Split very long lines
                    for (let i = 0; i < line.length; i += maxLength) {
                        parts.push(line.substring(i, i + maxLength));
                    }
                } else {
                    currentPart = line + '\n';
                }
            } else {
                currentPart += line + '\n';
            }
        }
        
        if (currentPart) {
            parts.push(currentPart.trim());
        }
        
        return parts;
    }

    async logFileProcessing(userId, filename, fileType, fileSize, contentExtracted, aiAnalyzed, processingTime) {
        try {
            const { FileProcessing } = require('../database/models');
            
            await FileProcessing.create({
                userId,
                filename,
                fileType,
                fileSize,
                contentExtracted,
                aiAnalyzed,
                processingTime
            });
        } catch (error) {
            logger.error('❌ Error logging file processing:', error);
        }
    }
}

module.exports = new FileHandler();