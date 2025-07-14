const logger = require('../utils/logger');
const aiService = require('../services/aiService');
const config = require('../config/config');

class AICommand {
    async handleAICommand(socket, message, user, args) {
        try {
            if (args.length === 0) {
                await this.showAIHelp(socket, message, user);
                return;
            }

            const prompt = args.join(' ');
            await this.handleTextMessage(socket, message, user, prompt);

        } catch (error) {
            logger.error('❌ Error in AI command:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing AI command. Please try again.'
            });
        }
    }

    async handleTextMessage(socket, message, user, text) {
        try {
            if (!aiService.isAvailable()) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '🤖 AI service is currently unavailable.\n\nPlease ensure the GEMINI_API_KEY is configured properly.'
                });
                return;
            }

            // Send typing indicator
            await socket.sendPresenceUpdate('composing', message.key.remoteJid);

            const startTime = Date.now();
            
            // Prepare user context
            const userContext = {
                name: user.name,
                isAdmin: user.isAdmin,
                phoneNumber: user.phoneNumber
            };

            // Generate AI response
            const response = await aiService.generateChatResponse(text, userContext);
            const processingTime = (Date.now() - startTime) / 1000;

            // Stop typing indicator
            await socket.sendPresenceUpdate('available', message.key.remoteJid);

            // Send response
            let responseText = `🤖 ${response}`;
            
            // Add processing time if admin
            if (user.isAdmin) {
                responseText += `\n\n⏱️ _Processed in ${processingTime.toFixed(2)}s_`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: responseText
            });

            // Log AI request
            await aiService.logAIRequest(
                user.id,
                'chat',
                text,
                response,
                config.AI_CHAT_MODEL,
                processingTime
            );

            logger.info(`🤖 AI chat response sent to user ${user.phoneNumber} in ${processingTime.toFixed(2)}s`);

        } catch (error) {
            logger.error('❌ Error handling AI text message:', error);
            
            await socket.sendPresenceUpdate('available', message.key.remoteJid);
            
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Sorry, I encountered an error while processing your message. Please try again in a moment.'
            });
        }
    }

    async showAIHelp(socket, message, user) {
        try {
            const helpText = `🤖 *AI Assistant*\n\n` +
                `I'm your intelligent AI assistant powered by Google Gemini!\n\n` +
                `💬 *How to chat:*\n` +
                `• Send any message to start chatting\n` +
                `• Use /ai <message> for direct interaction\n` +
                `• Ask questions, get explanations\n` +
                `• Request creative writing help\n\n` +
                `📄 *File Analysis:*\n` +
                `• Send documents for analysis\n` +
                `• Support for PDF, Word, Excel, etc.\n` +
                `• Code file analysis\n` +
                `• Data extraction and insights\n\n` +
                `🖼️ *Image Analysis:*\n` +
                `• Send images for detailed analysis\n` +
                `• Object and scene recognition\n` +
                `• Text extraction (OCR)\n` +
                `• Visual content description\n\n` +
                `💡 *Examples:*\n` +
                `• "Explain quantum physics simply"\n` +
                `• "Write a poem about nature"\n` +
                `• "Help me debug this code"\n` +
                `• "Summarize this document"\n\n` +
                `⚡ Ready to start? Send me a message!`;

            const buttons = [
                { id: 'ai_demo', text: '🤖 Try AI Chat' },
                { id: 'help_commands', text: '📚 All Commands' },
                { id: 'main_menu', text: '🏠 Main Menu' }
            ];

            await socket.sendMessage(message.key.remoteJid, {
                text: helpText,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1,
                footer: '🤖 AI Assistant Guide'
            });

        } catch (error) {
            logger.error('❌ Error showing AI help:', error);
        }
    }

    async handleAIDemo(socket, message, user) {
        try {
            const demoText = `🤖 *AI Demo*\n\n` +
                `Let me show you what I can do!\n\n` +
                `Try asking me:\n` +
                `• "What's the weather like?"\n` +
                `• "Explain machine learning"\n` +
                `• "Write a short story"\n` +
                `• "Help me solve math problems"\n\n` +
                `Or send me a document/image to analyze!\n\n` +
                `What would you like to try first?`;

            await socket.sendMessage(message.key.remoteJid, {
                text: demoText
            });

        } catch (error) {
            logger.error('❌ Error in AI demo:', error);
        }
    }

    async generateCreativeContent(socket, message, user, type, prompt) {
        try {
            if (!aiService.isAvailable()) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '🤖 AI service is currently unavailable.'
                });
                return;
            }

            await socket.sendPresenceUpdate('composing', message.key.remoteJid);

            const startTime = Date.now();
            let enhancedPrompt = '';

            switch (type) {
                case 'story':
                    enhancedPrompt = `Write a creative short story based on: ${prompt}. Make it engaging and well-structured.`;
                    break;
                case 'poem':
                    enhancedPrompt = `Write a beautiful poem about: ${prompt}. Use creative language and imagery.`;
                    break;
                case 'joke':
                    enhancedPrompt = `Create a funny, family-friendly joke about: ${prompt}. Keep it clever and appropriate.`;
                    break;
                case 'explanation':
                    enhancedPrompt = `Explain this topic in simple, easy-to-understand terms: ${prompt}. Use examples and analogies.`;
                    break;
                default:
                    enhancedPrompt = prompt;
            }

            const response = await aiService.generateChatResponse(enhancedPrompt, {
                name: user.name,
                isAdmin: user.isAdmin
            });

            const processingTime = (Date.now() - startTime) / 1000;

            await socket.sendPresenceUpdate('available', message.key.remoteJid);

            let responseText = `✨ *Creative Content*\n\n${response}`;
            
            if (user.isAdmin) {
                responseText += `\n\n⏱️ _Generated in ${processingTime.toFixed(2)}s_`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: responseText
            });

            // Log AI request
            await aiService.logAIRequest(
                user.id,
                'creative_content',
                enhancedPrompt,
                response,
                config.AI_CHAT_MODEL,
                processingTime
            );

        } catch (error) {
            logger.error('❌ Error generating creative content:', error);
            await socket.sendPresenceUpdate('available', message.key.remoteJid);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error generating creative content. Please try again.'
            });
        }
    }

    async handleCodeAnalysis(socket, message, user, code, language = 'unknown') {
        try {
            if (!aiService.isAvailable()) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '🤖 AI service is currently unavailable.'
                });
                return;
            }

            await socket.sendPresenceUpdate('composing', message.key.remoteJid);

            const startTime = Date.now();
            const analysisPrompt = `Analyze this ${language} code and provide insights:

${code}

Please provide:
1. Code overview and purpose
2. Key functions and logic
3. Potential improvements
4. Best practices suggestions
5. Any issues or bugs found

Keep the analysis clear and constructive.`;

            const response = await aiService.analyzeDocument(code, `code.${language}`, language);
            const processingTime = (Date.now() - startTime) / 1000;

            await socket.sendPresenceUpdate('available', message.key.remoteJid);

            let responseText = `💻 *Code Analysis*\n\n${response}`;
            
            if (user.isAdmin) {
                responseText += `\n\n⏱️ _Analyzed in ${processingTime.toFixed(2)}s_`;
            }

            await socket.sendMessage(message.key.remoteJid, {
                text: responseText
            });

            // Log AI request
            await aiService.logAIRequest(
                user.id,
                'code_analysis',
                analysisPrompt,
                response,
                config.AI_ANALYSIS_MODEL,
                processingTime
            );

        } catch (error) {
            logger.error('❌ Error analyzing code:', error);
            await socket.sendPresenceUpdate('available', message.key.remoteJid);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error analyzing code. Please try again.'
            });
        }
    }
}

module.exports = new AICommand();