// Game configuration
const TOURNAMENT_ROUNDS_TO_WIN = 3;
const POINTS_PER_MATCH = 2;

// Game state
let gameState = {
    overall_wins: 0,
    overall_losses: 0,
    current_win_streak: 0,
    tournament_round: 0,
    match_score: { player: 0, computer: 0 },
    last_player_choice: null,
    player_move_history: [],
    player_name: "Player",
    difficulty: "Medium"
};

// DOM Elements
const playerScore = document.getElementById('player-score');
const computerScore = document.getElementById('computer-score');
const tournamentRound = document.getElementById('tournament-round');
const matchPlayerScore = document.getElementById('match-player-score');
const matchComputerScore = document.getElementById('match-computer-score');
const winStreak = document.getElementById('win-streak');
const difficultyDisplay = document.getElementById('difficulty-display');
const playerName = document.getElementById('player-name');
const playerChoiceImg = document.getElementById('player-choice');
const computerChoiceImg = document.getElementById('computer-choice');
const messageEl = document.getElementById('message');

// Modals
const overlay = document.getElementById('overlay');
const winnerModal = document.getElementById('winner-modal');
const winnerText = document.getElementById('winner-text');
const continueBtn = document.getElementById('continue-btn');
const newGameBtn = document.getElementById('new-game-btn');
const difficultyModal = document.getElementById('difficulty-modal');
const confirmDifficultyBtn = document.getElementById('confirm-difficulty');
const cancelDifficultyBtn = document.getElementById('cancel-difficulty');
const helpModal = document.getElementById('help-modal');
const closeHelpBtn = document.getElementById('close-help');
const statsModal = document.getElementById('stats-modal');
const statsContent = document.getElementById('stats-content');
const closeStatsBtn = document.getElementById('close-stats');

// Load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('rpsGameState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        gameState = { ...gameState, ...parsedState };
    }
    updateUI();
}

// Save game state to localStorage
function saveGameState() {
    localStorage.setItem('rpsGameState', JSON.stringify(gameState));
}

// Update UI with current game state
function updateUI() {
    playerScore.textContent = gameState.overall_wins;
    computerScore.textContent = gameState.overall_losses;
    tournamentRound.textContent = gameState.tournament_round;
    matchPlayerScore.textContent = gameState.match_score.player;
    matchComputerScore.textContent = gameState.match_score.computer;
    winStreak.textContent = gameState.current_win_streak;
    difficultyDisplay.textContent = gameState.difficulty;
    playerName.textContent = gameState.player_name;
}

// Update message with appropriate color
function updateMessage(message, type) {
    messageEl.textContent = message;
    messageEl.className = 'message'; // Reset class
    
    if (type === 'win') {
        messageEl.classList.add('win-color');
    } else if (type === 'lose') {
        messageEl.classList.add('lose-color');
    } else if (type === 'draw') {
        messageEl.classList.add('draw-color');
    }
}

// Get pattern prediction for AI
function getPatternPrediction() {
    if (gameState.player_move_history.length < 3) {
        return null;
    }
    
    // Look for repeated patterns in the player's last few moves
    const lastMoves = gameState.player_move_history.slice(-3);
    
    // Simple pattern: player repeats the same move
    if (lastMoves[2] === lastMoves[1]) {
        return lastMoves[2];  // Predict they'll play it again
    }
    
    // Pattern: player cycles through R->P->S or similar
    if (gameState.player_move_history.length >= 4) {
        const rockPaperScissors = ["rock", "paper", "scissors"];
        const paperScissorsRock = ["paper", "scissors", "rock"];
        const scissorsRockPaper = ["scissors", "rock", "paper"];
        
        if (JSON.stringify(lastMoves) === JSON.stringify(rockPaperScissors)) {
            return "rock";  // Predict they'll start cycle again
        } else if (JSON.stringify(lastMoves) === JSON.stringify(paperScissorsRock)) {
            return "paper";
        } else if (JSON.stringify(lastMoves) === JSON.stringify(scissorsRockPaper)) {
            return "scissors";
        }
    }
    
    // Fallback: predict based on most frequent move
    const moveCounts = { "rock": 0, "paper": 0, "scissors": 0 };
    for (const move of gameState.player_move_history.slice(-5)) {
        moveCounts[move]++;
    }
    
    let maxCount = 0;
    let predictedMove = null;
    for (const [move, count] of Object.entries(moveCounts)) {
        if (count > maxCount) {
            maxCount = count;
            predictedMove = move;
        }
    }
    
    return predictedMove;
}

// AI choice logic
function computerChoice() {
    const choices = ["rock", "paper", "scissors"];
    const counterMap = {
        "rock": "paper",
        "paper": "scissors",
        "scissors": "rock"
    };
    
    // Easy mode: random with slight bias to let player win
    if (gameState.difficulty === "Easy") {
        if (Math.random() < 0.3 && gameState.last_player_choice) {
            // 30% chance to let player win
            const losingMoves = {
                "rock": "scissors",
                "paper": "rock",
                "scissors": "paper"
            };
            return losingMoves[gameState.last_player_choice];
        } else {
            return choices[Math.floor(Math.random() * choices.length)];
        }
    }
    
    // Medium mode: Mix of random and reactive play
    else if (gameState.difficulty === "Medium") {
        // 70% chance to counter the last move
        if (gameState.last_player_choice && Math.random() < 0.7) {
            return counterMap[gameState.last_player_choice];
        } else {
            return choices[Math.floor(Math.random() * choices.length)];
        }
    }
    
    // Hard mode: Sophisticated AI that predicts patterns
    else {
        // Add randomness to prevent predictable AI
        const randomFactor = Math.random();
        
        // Sometimes play completely randomly (15% chance)
        if (randomFactor < 0.15) {
            return choices[Math.floor(Math.random() * choices.length)];
        }
        
        // If we have enough history, try to predict patterns (60% chance)
        else if (randomFactor < 0.75 && gameState.player_move_history.length >= 3) {
            const predictedMove = getPatternPrediction();
            
            if (predictedMove) {
                // Add some noise - 80% counter the predicted move, 20% play another move
                if (Math.random() < 0.8) {
                    return counterMap[predictedMove];
                } else {
                    const otherMoves = choices.filter(m => m !== counterMap[predictedMove]);
                    return otherMoves[Math.floor(Math.random() * otherMoves.length)];
                }
            } else {
                // No clear pattern, counter last move if available
                if (gameState.last_player_choice) {
                    return counterMap[gameState.last_player_choice];
                } else {
                    return choices[Math.floor(Math.random() * choices.length)];
                }
            }
        }
        
        // Otherwise, use a strategic mix (25% chance)
        else {
            // If the player frequently uses the same move, counter that
            if (gameState.player_move_history.length >= 5) {
                const moveCounts = { "rock": 0, "paper": 0, "scissors": 0 };
                for (const move of gameState.player_move_history.slice(-5)) {
                    moveCounts[move]++;
                }
                
                // Find most used move
                let maxMove = "rock";
                let maxCount = 0;
                for (const [move, count] of Object.entries(moveCounts)) {
                    if (count > maxCount) {
                        maxCount = count;
                        maxMove = move;
                    }
                }
                
                // If any move is used 60% or more, counter it
                if (moveCounts[maxMove] >= 3) {  // 3 out of 5 = 60%
                    return counterMap[maxMove];
                }
            }
            
            // Otherwise, counter last move with some randomness
            if (gameState.last_player_choice) {
                if (Math.random() < 0.7) {
                    return counterMap[gameState.last_player_choice];
                } else {
                    const otherMoves = choices.filter(m => m !== counterMap[gameState.last_player_choice]);
                    return otherMoves[Math.floor(Math.random() * otherMoves.length)];
                }
            } else {
                return choices[Math.floor(Math.random() * choices.length)];
            }
        }
    }
}

// Check who wins
function checkWinner(playerChoice, computerChoice) {
    if (playerChoice === computerChoice) {
        return "draw";
    } else if (
        (playerChoice === "rock" && computerChoice === "scissors") ||
        (playerChoice === "paper" && computerChoice === "rock") ||
        (playerChoice === "scissors" && computerChoice === "paper")
    ) {
        return "win";
    } else {
        return "lose";
    }
}

// Play a round
function playRound(playerChoice) {
    // Log player's move for AI decision-making
    gameState.player_move_history.push(playerChoice);
    if (gameState.player_move_history.length > 20) {
        gameState.player_move_history = gameState.player_move_history.slice(-20);
    }
    
    // Get computer's choice
    const computer = computerChoice();
    
    // Update images
    playerChoiceImg.src = `images/${playerChoice}-user.png`;
    computerChoiceImg.src = `images/${computer}.png`;
    
    // Set last player choice for future AI decisions
    gameState.last_player_choice = playerChoice;
    
    // Determine winner
    const result = checkWinner(playerChoice, computer);
    
    // Update match score and message
    if (result === "win") {
        gameState.match_score.player++;
        updateMessage(`${gameState.player_name} scores! 💪`, 'win');
    } else if (result === "lose") {
        gameState.match_score.computer++;
        updateMessage("AI scores! 🤖", 'lose');
    } else {
        updateMessage("Draw! No points. 🤝", 'draw');
    }
    
    // Check if a match is won
    if (gameState.match_score.player >= POINTS_PER_MATCH) {
        gameState.tournament_round++;
        gameState.match_score.player = 0;
        gameState.match_score.computer = 0;
        
        // Check if tournament is won
        if (gameState.tournament_round >= TOURNAMENT_ROUNDS_TO_WIN) {
            showWinnerAnimation("You");
            updateMessage(`🏆 ${gameState.player_name} is the RPS Champion! 🎉`, 'win');
            gameState.overall_wins++;
            gameState.current_win_streak++;
            gameState.tournament_round = 0;
            saveGameState();
        } else {
            showWinnerAnimation("You");
            updateMessage(`${gameState.player_name} won Match ${gameState.tournament_round}! 🎉`, 'win');
        }
    } else if (gameState.match_score.computer >= POINTS_PER_MATCH) {
        gameState.tournament_round++;
        
        // Check if tournament is lost
        if (gameState.tournament_round >= TOURNAMENT_ROUNDS_TO_WIN) {
            showWinnerAnimation("AI");
            updateMessage("🤖 AI is the RPS Champion! Better luck next time.", 'lose');
            gameState.overall_losses++;
            gameState.current_win_streak = 0;
            gameState.tournament_round = 0;
            gameState.match_score.player = 0;
            gameState.match_score.computer = 0;
            saveGameState();
        } else {
            showWinnerAnimation("AI");
            updateMessage(`AI won Match ${gameState.tournament_round}! 😞`, 'lose');
            gameState.match_score.player = 0;
            gameState.match_score.computer = 0;
        }
    }
    
    updateUI();
}

// Show winner animation
function showWinnerAnimation(winner) {
    winnerText.textContent = winner === "You" ? "You Win!" : "AI Wins!";
    winnerText.className = winner === "You" ? "winner-text win-color" : "winner-text lose-color";
    
    overlay.classList.remove('hidden');
    winnerModal.classList.remove('hidden');
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (!winnerModal.classList.contains('hidden')) {
            overlay.classList.add('hidden');
            winnerModal.classList.add('hidden');
        }
    }, 5000);
}

// Change player name
function changePlayerName() {
    const newName = prompt("Enter your name:", gameState.player_name);
    if (newName && newName.trim() !== "") {
        gameState.player_name = newName.trim();
        updateUI();
        updateMessage(`Welcome, ${gameState.player_name}!`, 'win');
        saveGameState();
    }
}

// Show difficulty selection modal
function showDifficultyModal() {
    // Set the current difficulty in the radio buttons
    const radioButtons = document.querySelectorAll('input[name="difficulty"]');
    for (const radio of radioButtons) {
        if (radio.value === gameState.difficulty) {
            radio.checked = true;
        }
    }
    
    overlay.classList.remove('hidden');
    difficultyModal.classList.remove('hidden');
}

// Confirm difficulty change
function confirmDifficulty() {
    const selectedDifficulty = document.querySelector('input[name="difficulty"]:checked').value;
    gameState.difficulty = selectedDifficulty;
    gameState.player_move_history = []; // Reset AI memory
    
    updateUI();
    updateMessage(`Difficulty set to ${gameState.difficulty}!`, 'win');
    saveGameState();
    
    // Close modal
    overlay.classList.add('hidden');
    difficultyModal.classList.add('hidden');
}

// Show help modal
function showHelpModal() {
    overlay.classList.remove('hidden');
    helpModal.classList.remove('hidden');
}

// Show stats modal
function showStatsModal() {
    // Calculate win ratio
    const totalGames = gameState.overall_wins + gameState.overall_losses;
    const winRatio = totalGames > 0 ? (gameState.overall_wins / totalGames) * 100 : 0;
    
    // Update stats content
    statsContent.innerHTML = `
        <p>🏆 Player Statistics 🏆</p>
        <p>Player: ${gameState.player_name}</p>
        <p>Overall Wins: ${gameState.overall_wins}</p>
        <p>Overall Losses: ${gameState.overall_losses}</p>
        <p>Current Win Streak: ${gameState.current_win_streak}</p>
        <p>Win Ratio: ${winRatio.toFixed(1)}%</p>
        <p>Current Tournament Round: ${gameState.tournament_round}/${TOURNAMENT_ROUNDS_TO_WIN}</p>
        <p>Current Match Score: ${gameState.match_score.player} - ${gameState.match_score.computer}</p>
        <p>AI Difficulty: ${gameState.difficulty}</p>
    `;
    
    overlay.classList.remove('hidden');
    statsModal.classList.remove('hidden');
}

// Reset current match
function resetMatch() {
    if (confirm("Are you sure you want to reset the current match score?")) {
        gameState.match_score.player = 0;
        gameState.match_score.computer = 0;
        gameState.last_player_choice = null;
        
        updateUI();
        updateMessage("Match reset.", 'draw');
        saveGameState();
    }
}

// Reset all scores
function resetAll(skipConfirm = false) {
    if (skipConfirm || confirm("Are you sure you want to reset ALL scores?")) {
        gameState.overall_wins = 0;
        gameState.overall_losses = 0;
        gameState.current_win_streak = 0;
        gameState.tournament_round = 0;
        gameState.match_score.player = 0;
        gameState.match_score.computer = 0;
        gameState.last_player_choice = null;
        gameState.player_move_history = [];
        
        // Reset images
        playerChoiceImg.src = 'images/placeholder.png';
        computerChoiceImg.src = 'images/placeholder.png';
        
        updateUI();
        updateMessage("New game started! Pick your move.", 'win');
        saveGameState();
    }
}

// Event Listeners
document.getElementById('rock').addEventListener('click', () => playRound('rock'));
document.getElementById('paper').addEventListener('click', () => playRound('paper'));
document.getElementById('scissors').addEventListener('click', () => playRound('scissors'));

document.getElementById('reset-match').addEventListener('click', resetMatch);
document.getElementById('reset-all').addEventListener('click', () => resetAll(false));
document.getElementById('change-name').addEventListener('click', changePlayerName);
document.getElementById('set-difficulty').addEventListener('click', showDifficultyModal);
document.getElementById('help').addEventListener('click', showHelpModal);
document.getElementById('stats').addEventListener('click', showStatsModal);

// Modal controls
continueBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    winnerModal.classList.add('hidden');
});

newGameBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    winnerModal.classList.add('hidden');
    resetAll(true);
});

confirmDifficultyBtn.addEventListener('click', confirmDifficulty);

cancelDifficultyBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    difficultyModal.classList.add('hidden');
});

closeHelpBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    helpModal.classList.add('hidden');
});

closeStatsBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    statsModal.classList.add('hidden');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        playRound('rock');
    } else if (e.key === 'p' || e.key === 'P') {
        playRound('paper');
    } else if (e.key === 's' || e.key === 'S') {
        playRound('scissors');
    }
});

// Initialize the game
loadGameState();
updateMessage(`Welcome, ${gameState.player_name}! Pick a move to start.`, 'win');