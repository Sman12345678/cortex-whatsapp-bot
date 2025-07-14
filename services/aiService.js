const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/config');
const logger = require('../utils/logger');

class AIService {
    constructor() {
        if (!config.GEMINI_API_KEY) {
            logger.warn('⚠️ GEMINI_API_KEY not provided. AI features will be disabled.');
            this.client = null;
        } else {
            this.client = new GoogleGenerativeAI(config.GEMINI_API_KEY);
        }
    }

    isAvailable() {
        return this.client !== null;
    }

    getSystemInstruction(type = 'chat') {
        const instructions = {
            chat: `You are an intelligent WhatsApp AI assistant named "${config.BOT_NAME}". 

Core Personality:
- Friendly, helpful, and professional
- Concise but comprehensive responses
- Use emojis appropriately but not excessively
- Speak in simple, everyday language
- Always be respectful and family-friendly

Capabilities:
- Answer questions on various topics
- Help with problem-solving
- Provide explanations and tutorials
- Assist with creative writing
- Offer advice and recommendations
- Play text-based games

Guidelines:
- Keep responses under 1000 characters when possible
- Use WhatsApp formatting (bold *text*, italic _text_)
- If unsure, admit it and offer to help find the answer
- Never provide harmful, inappropriate, or dangerous content
- Encourage users to try bot commands by mentioning available features

Remember: You're communicating via WhatsApp, so keep messages mobile-friendly and conversational.`,

            analysis: `You are a professional document and content analysis AI. Your role is to:

1. Analyze and summarize content accurately
2. Extract key insights and important information
3. Identify patterns, trends, and anomalies
4. Provide structured, actionable recommendations
5. Maintain objectivity and precision

Response Format:
- Start with a brief summary
- List key findings with bullet points
- Provide analysis and insights
- End with recommendations if applicable
- Use clear, professional language
- Structure responses with headers when appropriate

Focus on being thorough yet concise, practical, and valuable to the user.`,

            image: `You are an advanced image analysis AI. Your capabilities include:

1. Describing visual content in detail
2. Identifying objects, people, text, and scenes
3. Reading and transcribing text from images
4. Analyzing composition, style, and quality
5. Detecting potential issues or interesting features
6. Providing context and explanations

Response Guidelines:
- Start with a clear, comprehensive description
- Identify all readable text accurately
- Point out notable features or elements
- Mention any technical aspects if relevant
- Be objective and descriptive
- Use appropriate emojis to enhance understanding
- Keep responses informative but accessible`
        };

        return instructions[type] || instructions.chat;
    }

    async generateChatResponse(message, userContext = {}) {
        if (!this.isAvailable()) {
            return "🤖 AI service is currently unavailable. Please make sure the GEMINI_API_KEY is configured properly.";
        }

        try {
            const model = this.client.getGenerativeModel({ 
                model: config.AI_CHAT_MODEL,
                systemInstruction: this.getSystemInstruction('chat')
            });

            const context = userContext.name ? `[User: ${userContext.name}] ` : '';
            const prompt = `${context}${message}`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            
            if (!response) {
                throw new Error('No response from AI model');
            }

            return response.text();
        } catch (error) {
            logger.error('❌ Error generating chat response:', error);
            
            if (error.message.includes('API_KEY')) {
                return "🔑 AI service configuration error. Please check the API key.";
            } else if (error.message.includes('SAFETY')) {
                return "⚠️ Your message was blocked by safety filters. Please try rephrasing your question.";
            } else if (error.message.includes('QUOTA')) {
                return "💰 AI service quota exceeded. Please try again later.";
            }
            
            return "❌ Sorry, I'm having trouble processing your request right now. Please try again in a moment.";
        }
    }

    async analyzeImage(imageBuffer, prompt = "Analyze this image in detail") {
        if (!this.isAvailable()) {
            return "🤖 AI service is currently unavailable. Please make sure the GEMINI_API_KEY is configured properly.";
        }

        try {
            const model = this.client.getGenerativeModel({ 
                model: config.AI_IMAGE_GENERATION_MODEL,
                systemInstruction: this.getSystemInstruction('image')
            });

            const imagePart = {
                inlineData: {
                    data: imageBuffer.toString('base64'),
                    mimeType: 'image/jpeg'
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const response = result.response;
            
            if (!response) {
                throw new Error('No response from AI model');
            }

            return response.text();
        } catch (error) {
            logger.error('❌ Error analyzing image:', error);
            
            if (error.message.includes('API_KEY')) {
                return "🔑 AI service configuration error. Please check the API key.";
            } else if (error.message.includes('SAFETY')) {
                return "⚠️ This image was blocked by safety filters.";
            } else if (error.message.includes('QUOTA')) {
                return "💰 AI service quota exceeded. Please try again later.";
            }
            
            return "❌ Sorry, I couldn't analyze this image. Please try again.";
        }
    }

    async analyzeDocument(content, filename, fileType) {
        if (!this.isAvailable()) {
            return "🤖 AI service is currently unavailable. Please make sure the GEMINI_API_KEY is configured properly.";
        }

        try {
            const model = this.client.getGenerativeModel({ 
                model: config.AI_ANALYSIS_MODEL,
                systemInstruction: this.getSystemInstruction('analysis')
            });

            const prompt = `Analyze this ${fileType} document (${filename}):

${content}

Provide a comprehensive analysis including:
1. Summary of content
2. Key findings and insights
3. Important data or information
4. Recommendations or action items (if applicable)
5. Any notable patterns or issues

Keep the analysis professional and structured.`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            
            if (!response) {
                throw new Error('No response from AI model');
            }

            return response.text();
        } catch (error) {
            logger.error('❌ Error analyzing document:', error);
            
            if (error.message.includes('API_KEY')) {
                return "🔑 AI service configuration error. Please check the API key.";
            } else if (error.message.includes('SAFETY')) {
                return "⚠️ This document was blocked by safety filters.";
            } else if (error.message.includes('QUOTA')) {
                return "💰 AI service quota exceeded. Please try again later.";
            }
            
            return "❌ Sorry, I couldn't analyze this document. Please try again.";
        }
    }

    async generateQuizQuestion(topic = "general knowledge", difficulty = "medium") {
        if (!this.isAvailable()) {
            return null;
        }

        try {
            const model = this.client.getGenerativeModel({ 
                model: config.AI_CHAT_MODEL
            });

            const prompt = `Generate a ${difficulty} level multiple choice question about ${topic}.

Format your response exactly like this:
QUESTION: [Your question here]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A, B, C, or D]
EXPLANATION: [Brief explanation of the correct answer]

Make sure the question is engaging and educational.`;

            const result = await model.generateContent(prompt);
            const response = result.response.text();
            
            // Parse the response
            const lines = response.split('\n');
            const question = lines.find(line => line.startsWith('QUESTION:'))?.replace('QUESTION:', '').trim();
            const options = lines.filter(line => /^[A-D]\)/.test(line.trim()));
            const correct = lines.find(line => line.startsWith('CORRECT:'))?.replace('CORRECT:', '').trim();
            const explanation = lines.find(line => line.startsWith('EXPLANATION:'))?.replace('EXPLANATION:', '').trim();

            if (question && options.length === 4 && correct && explanation) {
                return {
                    question,
                    options,
                    correct: correct.toUpperCase(),
                    explanation
                };
            }
            
            return null;
        } catch (error) {
            logger.error('❌ Error generating quiz question:', error);
            return null;
        }
    }

    async logAIRequest(userId, requestType, prompt, response, modelUsed, processingTime) {
        try {
            const { AIRequest } = require('../database/models');
            
            await AIRequest.create({
                userId,
                requestType,
                prompt: prompt ? prompt.substring(0, 1000) : null, // Limit prompt length
                response: response ? response.substring(0, 2000) : null, // Limit response length
                modelUsed,
                processingTime,
                tokensUsed: 0 // Gemini doesn't provide token count easily
            });
        } catch (error) {
            logger.error('❌ Error logging AI request:', error);
        }
    }
}

module.exports = new AIService();