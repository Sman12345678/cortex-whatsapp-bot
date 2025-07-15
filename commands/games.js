const logger = require('../utils/logger');
const gameHandler = require('../handlers/gameHandler');
const userService = require('../services/userService');

class GameCommands {
    async showGameMenu(socket, message, user) {
        try {
            const gameText = `🎮 *Game Center*\n\n` +
                `Welcome to the Game Center! Choose from our exciting games:\n\n` +
                `🪨 *Rock Paper Scissors* — Classic game vs bot! (/rps)\n` +
                `🧠 *Quiz & Trivia* — Test your knowledge! (/quiz)\n` +
                `📊 *My Stats* — Track your performance (/gamestats)\n` +
                `🏆 *Leaderboard* — See top players (/leaderboard)\n\n` +
                `Type the commands above to begin playing!`;

            await socket.sendMessage(message.key.remoteJid, { text: gameText });

        } catch (error) {
            logger.error('❌ Error showing game menu:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading game menu. Please try again.'
            });
        }
    }

    async startRockPaperScissors(socket, message, user) {
        try {
            await gameHandler.startRockPaperScissors(socket, message, user);
        } catch (error) {
            logger.error('❌ Error starting Rock Paper Scissors:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error starting Rock Paper Scissors. Please try again.'
            });
        }
    }

    async startQuiz(socket, message, user, args = []) {
        try {
            const topic = args.length > 0 ? args.join(' ') : 'general knowledge';
            await gameHandler.startQuiz(socket, message, user, topic);
        } catch (error) {
            logger.error('❌ Error starting quiz:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error starting quiz. Please try again.'
            });
        }
    }

    async showGameStats(socket, message, user) {
        try {
            const gameStats = user.gameStats || {};

            if (Object.keys(gameStats).length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `📊 *Your Game Statistics*\n\n` +
                        `🎮 You haven't played any games yet!\n\n` +
                        `Try:\n• /rps - Rock Paper Scissors\n• /quiz - Quiz & Trivia\n\n` +
                        `Start playing to see your stats here!`
                });
                return;
            }

            let statsText = `📊 *Your Game Statistics*\n\n`;
            let totalGames = 0;
            let totalScore = 0;

            Object.entries(gameStats).forEach(([game, stats]) => {
                const gameName = game.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                statsText += `🎯 *${gameName}:*\n`;
                statsText += `• Games Played: ${stats.played || 0}\n`;
                statsText += `• Games Won: ${stats.won || 0}\n`;
                if (stats.lost) statsText += `• Games Lost: ${stats.lost}\n`;
                if (stats.draw) statsText += `• Draws: ${stats.draw}\n`;

                const winRate = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0;
                statsText += `• Win Rate: ${winRate}%\n`;
                statsText += `• Total Score: ${stats.score || 0}\n\n`;

                totalGames += stats.played || 0;
                totalScore += stats.score || 0;
            });

            statsText += `🏆 *Overall Summary:*\n`;
            statsText += `• Total Games: ${totalGames}\n`;
            statsText += `• Total Score: ${totalScore}\n`;

            const allGameTypes = Object.keys(gameStats);
            if (allGameTypes.length > 0) {
                const topPlayers = await userService.getTopGamePlayers(allGameTypes[0], 10);
                const userRank = topPlayers.findIndex(p => p.phone === user.phoneNumber) + 1;
                if (userRank > 0) statsText += `• Your Rank: #${userRank}\n`;
            }

            await socket.sendMessage(message.key.remoteJid, { text: statsText });

        } catch (error) {
            logger.error('❌ Error showing game stats:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading game statistics. Please try again.'
            });
        }
    }

    async showLeaderboard(socket, message, user, gameType = 'rock_paper_scissors') {
        try {
            const topPlayers = await userService.getTopGamePlayers(gameType, 10);

            if (topPlayers.length === 0) {
                await socket.sendMessage(message.key.remoteJid, {
                    text: `🏆 *Leaderboard - ${gameType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}*\n\n` +
                        `No players have played this game yet!\n\n` +
                        `Be the first to play and lead the board! 🚀`
                });
                return;
            }

            const gameName = gameType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let leaderboardText = `🏆 *Leaderboard - ${gameName}*\n\n`;

            topPlayers.forEach((player, index) => {
                const rank = index + 1;
                const emoji = rank === 1 ? '👑' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🏅';
                const winRate = player.stats.played > 0 ? Math.round((player.stats.won / player.stats.played) * 100) : 0;

                leaderboardText += `${emoji} *#${rank} ${player.name}*\n`;
                leaderboardText += `   Score: ${player.stats.score || 0} | Win Rate: ${winRate}%\n`;
                leaderboardText += `   Games: ${player.stats.played || 0} | Won: ${player.stats.won || 0}\n\n`;
            });

            const userRank = topPlayers.findIndex(p => p.phone === user.phoneNumber) + 1;
            if (userRank === 0) {
                leaderboardText += `📊 *Your Position:* Not ranked yet\n`;
                leaderboardText += `Play more games to appear on the leaderboard!`;
            } else if (userRank > 10) {
                leaderboardText += `📊 *Your Position:* #${userRank}`;
            }

            await socket.sendMessage(message.key.remoteJid, { text: leaderboardText });

        } catch (error) {
            logger.error('❌ Error showing leaderboard:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading leaderboard. Please try again.'
            });
        }
    }

    async showGameRules(socket, message, user, gameType) {
        try {
            let rulesText = '';

            switch (gameType) {
                case 'rps':
                case 'rock_paper_scissors':
                    rulesText = `🪨 *Rock Paper Scissors Rules*\n\n` +
                        `🎯 Win more rounds than the bot!\n\n` +
                        `📋 *Rules:*\n` +
                        `• Rock 🪨 beats Scissors ✂️\n` +
                        `• Scissors ✂️ beats Paper 📄\n` +
                        `• Paper 📄 beats Rock 🪨\n` +
                        `• Same choice = Draw 🤝\n\n` +
                        `🏆 *Scoring:*\n` +
                        `• Win: +10 points\n• Draw: +5 points\n• Lose: +2 points\n\n` +
                        `⏰ You have 30 seconds per move.`;
                    break;

                case 'quiz':
                    rulesText = `🧠 *Quiz Rules*\n\n` +
                        `🎯 Answer as many questions correctly!\n\n` +
                        `📋 *How to Play:*\n` +
                        `• 5 questions per session\n` +
                        `• Choose A, B, C, or D\n` +
                        `• Explanations included\n\n` +
                        `🏆 *Scoring:*\n` +
                        `• Correct: +10 points\n• Wrong: 0 points\n• Bonus for speed\n\n` +
                        `⏰ You have 60 seconds per question.`;
                    break;

                default:
                    rulesText = `📚 *Game Rules*\n\nAvailable Games:\n` +
                        `• 🪨 Rock Paper Scissors — /rps\n` +
                        `• 🧠 Quiz & Trivia — /quiz\n\n` +
                        `Use /rules <game> to get specific rules.`;
            }

            await socket.sendMessage(message.key.remoteJid, { text: rulesText });

        } catch (error) {
            logger.error('❌ Error showing game rules:', error);
            await socket.sendMessage(message.key.remoteJid, {
                text: '❌ Error loading game rules. Please try again.'
            });
        }
    }

    async handleGameCommand(socket, message, user, command, args) {
        switch (command) {
            case 'games':
                await this.showGameMenu(socket, message, user);
                break;
            case 'rps':
            case 'rockpaperscissors':
                await this.startRockPaperScissors(socket, message, user);
                break;
            case 'quiz':
            case 'trivia':
                await this.startQuiz(socket, message, user, args);
                break;
            case 'gamestats':
                await this.showGameStats(socket, message, user);
                break;
            case 'leaderboard':
                await this.showLeaderboard(socket, message, user, args[0]);
                break;
            case 'rules':
                await this.showGameRules(socket, message, user, args[0]);
                break;
            default:
                await socket.sendMessage(message.key.remoteJid, {
                    text: '❓ Unknown game command. Use /games to see available games.'
                });
        }
    }
}

module.exports = new GameCommands();
