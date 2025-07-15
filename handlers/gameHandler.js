const logger = require('../utils/logger');
const { generateGameSessionId, getRandomElement } = require('../utils/helpers');
const aiService = require('../services/aiService');
const userService = require('../services/userService');

class GameHandler {
    constructor() {
        this.activeGames = new Map(); // Store active game sessions
        this.gameTimeouts = new Map(); // Store game timeouts
    }

    // Start Rock Paper Scissors game, prompt user to reply with text
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

            await socket.sendMessage(message.key.remoteJid, 
                `🎮 *Rock Paper Scissors* - Round ${game.round}/${game.maxRounds}\n\n🤖 Bot: ${game.botScore} | 👤 You: ${game.userScore}\n\nType 'rock', 'paper', or 'scissors' to make your move.`
            );

            // Set timeout for the game
            this.setGameTimeout(gameId, 30000);

        } catch (error) {
            logger.error('❌ Error starting Rock Paper Scissors:', error);
            await socket.sendMessage(message.key.remoteJid, '❌ Error starting game. Please try again.');
        }
    }

    // Handle user's move (sent as text: 'rock', 'paper', 'scissors')
    async handleRockPaperScissorsMove(socket, message, user, userMoveRaw) {
        try {
            const userMove = userMoveRaw.trim().toLowerCase();
            if (!['rock', 'paper', 'scissors'].includes(userMove)) {
                await socket.sendMessage(message.key.remoteJid, "❌ Invalid move. Type 'rock', 'paper' or 'scissors'.");
                return;
            }
            const gameId = this.findActiveGame(user.id, 'rock_paper_scissors');
            
            if (!gameId) {
                await socket.sendMessage(message.key.remoteJid, '❌ No active Rock Paper Scissors game found. Use /rps to start a new game.');
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

                responseText += `\n\nType '/rps' to play again.`;
                await socket.sendMessage(message.key.remoteJid, responseText);

                this.endGame(gameId);
            } else {
                // Continue to next round
                responseText += `*Round ${game.round}/${game.maxRounds}* - Type 'rock', 'paper', or 'scissors' for your next move.`;
                await socket.sendMessage(message.key.remoteJid, responseText);

                this.setGameTimeout(gameId, 30000);
            }

        } catch (error) {
            logger.error('❌ Error handling Rock Paper Scissors move:', error);
            await socket.sendMessage(message.key.remoteJid, '❌ Error processing your move. Please try again.');
        }
    }

    async startQuiz(socket, message, user, topic = 'general knowledge') {
        try {
            const gameId = generateGameSessionId();
            
            const question = await aiService.generateQuizQuestion(topic);
            
            if (!question) {
                await socket.sendMessage(message.key.remoteJid, '❌ Failed to generate quiz question. Please try again later.');
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

            await socket.sendMessage(
                message.key.remoteJid, 
                `🧠 *Quiz Time!* (${topic})\n\n*Question ${game.currentQuestion}/${game.maxQuestions}:*\n${question.question}\n\nOptions:\nA) ${question.options[0]}\nB) ${question.options[1]}\nC) ${question.options[2]}\nD) ${question.options[3]}\n\nType 'A', 'B', 'C', or 'D' to answer. 📊 Score: ${game.score}`
            );

            this.setGameTimeout(gameId, 60000);

        } catch (error) {
            logger.error('❌ Error starting quiz:', error);
            await socket.sendMessage(message.key.remoteJid, '❌ Error starting quiz. Please try again.');
        }
    }

    async handleQuizAnswer(socket, message, user, answerRaw) {
        try {
            const answer = answerRaw.trim().toUpperCase();
            if (!['A', 'B', 'C', 'D'].includes(answer)) {
                await socket.sendMessage(message.key.remoteJid, "❌ Invalid answer. Please reply with 'A', 'B', 'C', or 'D'.");
                return;
            }
            const gameId = this.findActiveGame(user.id, 'quiz');
            
            if (!gameId) {
                await socket.sendMessage(message.key.remoteJid, '❌ No active quiz found. Use /quiz to start a new quiz.');
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

            responseText += `*Correct answer:* ${question.correct}) ${question.options["ABCD".indexOf(question.correct)]}\n\n`;
            responseText += `💡 *Explanation:* ${question.explanation}\n\n`;
            responseText += `📊 *Your Score:* ${game.score} points`;

            game.currentQuestion++;

            if (game.currentQuestion > game.maxQuestions) {
                // Quiz finished
                responseText += `\n\n🏁 *Quiz Complete!*\n\n🎯 *Final Score:* ${game.score}/${game.maxQuestions * 10} points\n`;
                
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

                responseText += `\n\nType '/quiz' for a new quiz.`;
                await socket.sendMessage(message.key.remoteJid, responseText);

                this.endGame(gameId);
            } else {
                // Continue to next question
                await this.nextQuizQuestion(socket, message, user);
            }

        } catch (error) {
            logger.error('❌ Error handling quiz answer:', error);
            await socket.sendMessage(message.key.remoteJid, '❌ Error processing your answer. Please try again.');
        }
    }

    async nextQuizQuestion(socket, message, user) {
        try {
            const gameId = this.findActiveGame(user.id, 'quiz');
            
            if (!gameId) {
                await this.startQuiz(socket, message, user);
                return;
            }

            const game = this.activeGames.get(gameId);
            
            if (game.currentQuestion > game.maxQuestions) {
                this.endGame(gameId);
                await this.startQuiz(socket, message, user, game.topic);
                return;
            }

            const question = await aiService.generateQuizQuestion(game.topic);
            
            if (!question) {
                await socket.sendMessage(message.key.remoteJid, '❌ Failed to generate next question. Please try /quiz to start a new quiz.');
                this.endGame(gameId);
                return;
            }

            game.currentQuestionData = question;

            await socket.sendMessage(
                message.key.remoteJid, 
                `🧠 *Quiz Time!* (${game.topic})\n\n*Question ${game.currentQuestion}/${game.maxQuestions}:*\n${question.question}\n\nOptions:\nA) ${question.options[0]}\nB) ${question.options[1]}\nC) ${question.options[2]}\nD) ${question.options[3]}\n\nType 'A', 'B', 'C', or 'D' to answer. 📊 Score: ${game.score}`
            );

            this.setGameTimeout(gameId, 60000);

        } catch (error) {
            logger.error('❌ Error getting next quiz question:', error);
            await socket.sendMessage(message.key.remoteJid, '❌ Error loading next question. Please try again.');
        }
    }

    // Remove all button handling, use text for ending games
    async handleGameEnd(socket, message, user) {
        const gameId = this.findActiveGame(user.id);
        if (gameId) {
            this.endGame(gameId);
            await socket.sendMessage(message.key.remoteJid, '🏁 Game ended. Thanks for playing!');
        }
    }

    determineRPSWinner(userMove, botMove) {
        if (userMove === botMove) return 'draw';
        const winConditions = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
        return winConditions[userMove] === botMove ? 'win' : 'lose';
    }

    determineFinalWinner(userScore, botScore) {
        if (userScore > botScore) return 'win';
        if (botScore > userScore) return 'lose';
        return 'draw';
    }

    findActiveGame(userId, gameType) {
        for (const [gameId, game] of this.activeGames) {
            if (game.userId === userId && (!gameType || game.type === gameType) && game.status !== 'completed') {
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
