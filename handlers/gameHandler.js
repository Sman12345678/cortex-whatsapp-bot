const logger = require('../utils/logger');
const { generateGameSessionId, getRandomElement } = require('../utils/helpers');
const aiService = require('../services/aiService');
const userService = require('../services/userService');

class GameHandler {
    constructor() {
        this.activeGames = new Map(); // Store active game sessions
        this.gameTimeouts = new Map(); // Store game timeouts
    }

    async startRockPaperScissors(socket, message, user) {
        try {
            const gameId = generateGameSessionId();
            const game = {
                id: gameId,
                type: 'rock_paper_scissors',
                userId: user.id,
                chatId: message.key.remoteJid,
                status: 'waiting_for_move',
                userScore: 0,
                botScore: 0,
                round: 1,
                maxRounds: 3,
                startTime: Date.now()
            };

            this.activeGames.set(gameId, game);

            const buttons = [
                { id: 'rps_rock', text: '🪨 Rock' },
                { id: 'rps_paper', text: '📄 Paper' },
                { id: 'rps_scissors', text: '✂️ Scissors' }
            ];

            await socket.sendMessage(message.key.remoteJid, {
                text: `🎮 *Rock Paper Scissors* - Round ${game.round}/${game.maxRounds}\n\n🤖 Bot: ${game.botScore} | 👤 You: ${game.userScore}\n\nChoose your move!`,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1,
                footer: 'Choose wisely!'
            });

            // Set timeout for the game
            this.setGameTimeout(gameId, 30000);

        } catch (error) {
            logger.error('❌ Error starting Rock Paper Scissors:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error starting game. Please try again.'
            });
        }
    }

    async handleRockPaperScissors(socket, message, user, buttonId) {
        try {
            const userMove = buttonId.split('_')[1]; // Extract move from button ID
            const gameId = this.findActiveGame(user.id, 'rock_paper_scissors');
            
            if (!gameId) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ No active Rock Paper Scissors game found. Use /rps to start a new game.'
                });
                return;
            }

            const game = this.activeGames.get(gameId);
            const botMoves = ['rock', 'paper', 'scissors'];
            const botMove = getRandomElement(botMoves);

            // Determine winner
            const result = this.determineRPSWinner(userMove, botMove);
            
            let resultText = '';
            let resultEmoji = '';
            
            switch (result) {
                case 'win':
                    game.userScore++;
                    resultText = 'You win this round!';
                    resultEmoji = '🎉';
                    break;
                case 'lose':
                    game.botScore++;
                    resultText = 'Bot wins this round!';
                    resultEmoji = '😔';
                    break;
                case 'draw':
                    resultText = "It's a draw!";
                    resultEmoji = '🤝';
                    break;
            }

            const moveEmojis = {
                rock: '🪨',
                paper: '📄',
                scissors: '✂️'
            };

            let responseText = `${resultEmoji} *Round ${game.round} Result*\n\n`;
            responseText += `👤 You: ${moveEmojis[userMove]} ${userMove.charAt(0).toUpperCase() + userMove.slice(1)}\n`;
            responseText += `🤖 Bot: ${moveEmojis[botMove]} ${botMove.charAt(0).toUpperCase() + botMove.slice(1)}\n\n`;
            responseText += `${resultText}\n\n`;
            responseText += `📊 *Score:* 🤖 ${game.botScore} - ${game.userScore} 👤\n\n`;

            game.round++;

            if (game.round > game.maxRounds) {
                // Game finished
                const finalResult = this.determineFinalWinner(game.userScore, game.botScore);
                responseText += `🏁 *Game Over!*\n\n`;
                
                if (finalResult === 'win') {
                    responseText += `🎉 *Congratulations! You won!*`;
                    await userService.updateGameStats(user.id, 'rock_paper_scissors', {
                        played: 1,
                        won: 1,
                        score: 10
                    });
                } else if (finalResult === 'lose') {
                    responseText += `😔 *Better luck next time! Bot wins!*`;
                    await userService.updateGameStats(user.id, 'rock_paper_scissors', {
                        played: 1,
                        lost: 1,
                        score: 2
                    });
                } else {
                    responseText += `🤝 *It's a tie! Great game!*`;
                    await userService.updateGameStats(user.id, 'rock_paper_scissors', {
                        played: 1,
                        draw: 1,
                        score: 5
                    });
                }

                await socket.sendMessage(message.key.remoteJid, {
                    text: responseText,
                    buttons: [{
                        buttonId: 'rps_play_again',
                        buttonText: { displayText: '🔄 Play Again' },
                        type: 1
                    }],
                    headerType: 1,
                    footer: 'Thanks for playing!'
                });

                this.endGame(gameId);
            } else {
                // Continue to next round
                responseText += `*Round ${game.round}/${game.maxRounds}* - Choose your next move!`;

                const buttons = [
                    { id: 'rps_rock', text: '🪨 Rock' },
                    { id: 'rps_paper', text: '📄 Paper' },
                    { id: 'rps_scissors', text: '✂️ Scissors' }
                ];

                await socket.sendMessage(message.key.remoteJid, {
                    text: responseText,
                    buttons: buttons.map((btn, index) => ({
                        buttonId: btn.id,
                        buttonText: { displayText: btn.text },
                        type: 1
                    })),
                    headerType: 1,
                    footer: 'Round continues!'
                });

                this.setGameTimeout(gameId, 30000);
            }

        } catch (error) {
            logger.error('❌ Error handling Rock Paper Scissors move:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing your move. Please try again.'
            });
        }
    }

    async startQuiz(socket, message, user, topic = 'general knowledge') {
        try {
            const gameId = generateGameSessionId();
            
            // Generate first question
            const question = await aiService.generateQuizQuestion(topic);
            
            if (!question) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Failed to generate quiz question. Please try again later.'
                });
                return;
            }

            const game = {
                id: gameId,
                type: 'quiz',
                userId: user.id,
                chatId: message.key.remoteJid,
                status: 'waiting_for_answer',
                score: 0,
                currentQuestion: 1,
                maxQuestions: 5,
                topic: topic,
                currentQuestionData: question,
                startTime: Date.now()
            };

            this.activeGames.set(gameId, game);

            const buttons = question.options.map((option, index) => ({
                id: `quiz_${String.fromCharCode(97 + index)}`, // quiz_a, quiz_b, etc.
                text: option
            }));

            await socket.sendMessage(message.key.remoteJid, {
                text: `🧠 *Quiz Time!* (${topic})\n\n*Question ${game.currentQuestion}/${game.maxQuestions}:*\n${question.question}\n\n📊 Score: ${game.score}`,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1,
                footer: 'Choose your answer!'
            });

            this.setGameTimeout(gameId, 60000);

        } catch (error) {
            logger.error('❌ Error starting quiz:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error starting quiz. Please try again.'
            });
        }
    }

    async handleQuizAnswer(socket, message, user, buttonId) {
        try {
            const answer = buttonId.split('_')[1].toUpperCase(); // Extract A, B, C, D
            const gameId = this.findActiveGame(user.id, 'quiz');
            
            if (!gameId) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ No active quiz found. Use /quiz to start a new quiz.'
                });
                return;
            }

            const game = this.activeGames.get(gameId);
            const question = game.currentQuestionData;
            const isCorrect = answer === question.correct;

            let responseText = '';
            
            if (isCorrect) {
                game.score += 10;
                responseText = `✅ *Correct!* (+10 points)\n\n`;
            } else {
                responseText = `❌ *Wrong!*\n\n`;
            }

            responseText += `*Correct answer:* ${question.correct}) ${question.options.find(opt => opt.startsWith(question.correct + ')')).substring(3)}\n\n`;
            responseText += `💡 *Explanation:* ${question.explanation}\n\n`;
            responseText += `📊 *Your Score:* ${game.score} points`;

            game.currentQuestion++;

            if (game.currentQuestion > game.maxQuestions) {
                // Quiz finished
                responseText += `\n\n🏁 *Quiz Complete!*\n\n`;
                responseText += `🎯 *Final Score:* ${game.score}/${game.maxQuestions * 10} points\n`;
                
                const percentage = (game.score / (game.maxQuestions * 10)) * 100;
                if (percentage >= 80) {
                    responseText += `🌟 *Excellent!* You're a ${game.topic} expert!`;
                } else if (percentage >= 60) {
                    responseText += `👍 *Good job!* Well done on ${game.topic}!`;
                } else if (percentage >= 40) {
                    responseText += `📚 *Not bad!* Keep studying ${game.topic}!`;
                } else {
                    responseText += `💪 *Keep learning!* Practice makes perfect!`;
                }

                await userService.updateGameStats(user.id, 'quiz', {
                    played: 1,
                    score: game.score,
                    won: percentage >= 60 ? 1 : 0
                });

                await socket.sendMessage(message.key.remoteJid, {
                    text: responseText,
                    buttons: [{
                        buttonId: 'quiz_next',
                        buttonText: { displayText: '🔄 New Quiz' },
                        type: 1
                    }],
                    headerType: 1,
                    footer: 'Thanks for playing!'
                });

                this.endGame(gameId);
            } else {
                // Continue to next question
                await socket.sendMessage(message.key.remoteJid, {
                    text: responseText,
                    buttons: [{
                        buttonId: 'quiz_next',
                        buttonText: { displayText: '➡️ Next Question' },
                        type: 1
                    }],
                    headerType: 1,
                    footer: 'Ready for the next question?'
                });
            }

        } catch (error) {
            logger.error('❌ Error handling quiz answer:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error processing your answer. Please try again.'
            });
        }
    }

    async nextQuizQuestion(socket, message, user) {
        try {
            const gameId = this.findActiveGame(user.id, 'quiz');
            
            if (!gameId) {
                // Start new quiz
                await this.startQuiz(socket, message, user);
                return;
            }

            const game = this.activeGames.get(gameId);
            
            if (game.currentQuestion > game.maxQuestions) {
                // Start new quiz
                this.endGame(gameId);
                await this.startQuiz(socket, message, user, game.topic);
                return;
            }

            // Generate next question
            const question = await aiService.generateQuizQuestion(game.topic);
            
            if (!question) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❌ Failed to generate next question. Please try /quiz to start a new quiz.'
                });
                this.endGame(gameId);
                return;
            }

            game.currentQuestionData = question;

            const buttons = question.options.map((option, index) => ({
                id: `quiz_${String.fromCharCode(97 + index)}`,
                text: option
            }));

            await socket.sendMessage(message.key.remoteJid, {
                text: `🧠 *Quiz Time!* (${game.topic})\n\n*Question ${game.currentQuestion}/${game.maxQuestions}:*\n${question.question}\n\n📊 Score: ${game.score}`,
                buttons: buttons.map((btn, index) => ({
                    buttonId: btn.id,
                    buttonText: { displayText: btn.text },
                    type: 1
                })),
                headerType: 1,
                footer: 'Choose your answer!'
            });

            this.setGameTimeout(gameId, 60000);

        } catch (error) {
            logger.error('❌ Error getting next quiz question:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading next question. Please try again.'
            });
        }
    }

    async handleGameButton(socket, message, user, buttonId) {
        // Handle other game-specific buttons
        logger.info(`🎮 Game button pressed: ${buttonId}`);
        
        if (buttonId.startsWith('game_end_')) {
            const gameId = buttonId.replace('game_end_', '');
            this.endGame(gameId);
            await socket.sendMessage(message.key.remoteJid, {
                text: '🏁 Game ended. Thanks for playing!'
            });
        }
    }

    determineRPSWinner(userMove, botMove) {
        if (userMove === botMove) return 'draw';
        
        const winConditions = {
            rock: 'scissors',
            paper: 'rock',
            scissors: 'paper'
        };
        
        return winConditions[userMove] === botMove ? 'win' : 'lose';
    }

    determineFinalWinner(userScore, botScore) {
        if (userScore > botScore) return 'win';
        if (botScore > userScore) return 'lose';
        return 'draw';
    }

    findActiveGame(userId, gameType) {
        for (const [gameId, game] of this.activeGames) {
            if (game.userId === userId && game.type === gameType && game.status !== 'completed') {
                return gameId;
            }
        }
        return null;
    }

    setGameTimeout(gameId, timeout) {
        // Clear existing timeout
        if (this.gameTimeouts.has(gameId)) {
            clearTimeout(this.gameTimeouts.get(gameId));
        }

        // Set new timeout
        const timeoutId = setTimeout(() => {
            this.endGame(gameId);
            logger.info(`⏰ Game ${gameId} timed out`);
        }, timeout);

        this.gameTimeouts.set(gameId, timeoutId);
    }

    endGame(gameId) {
        if (this.activeGames.has(gameId)) {
            const game = this.activeGames.get(gameId);
            game.status = 'completed';
            this.activeGames.delete(gameId);
        }

        if (this.gameTimeouts.has(gameId)) {
            clearTimeout(this.gameTimeouts.get(gameId));
            this.gameTimeouts.delete(gameId);
        }
    }

    getActiveGames(userId) {
        const userGames = [];
        for (const [gameId, game] of this.activeGames) {
            if (game.userId === userId) {
                userGames.push(game);
            }
        }
        return userGames;
    }

    getGameStats() {
        return {
            activeGames: this.activeGames.size,
            gameTypes: [...new Set([...this.activeGames.values()].map(g => g.type))]
        };
    }
}

module.exports = new GameHandler();