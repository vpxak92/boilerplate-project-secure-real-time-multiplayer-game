// Import Player module
import Player from './Player.mjs';

// Initialize socket connection
const socket = io();

// Canvas and context setup
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

// DOM elements
const scoreSpan = document.querySelector('.score');

// Constants
const blockSize = 15;
const rows = 33;
const cols = 43;

// Game variables
let players = [];
let player;
let coinCoordinates;
let lastCoinId;
let end = false;

// Socket event handling
socket.on('connect', () => {
  // Create a new player, add to local players array, and emit to server
  player = Player.generatePlayer(socket.id);
  players.push(player);
  socket.emit('newPlayer', player);

  // Listen for new coin coordinates sent by the server
  socket.on('newCoinCoordinates', (newCoinCoordinates) => {
    coinCoordinates = newCoinCoordinates;
  });

  // Event listeners for key input
  document.addEventListener("keydown", event => player.updateKeyState(event.code, true));
  document.addEventListener("keyup", event => player.updateKeyState(event.code, false));

  // Event listener to handle player closing the tab
  window.addEventListener('beforeunload', () => {
    socket.disconnect();
  });

  // Event listener for game end event
  socket.on('ending', (message) => {
    end = true;
    alert(message);
  });
});

// Update players array with the latest version sent by server
socket.on('updatePlayers', (playerList) => {
  players = playerList;
});

// Initialize the game
function initializeGame() {
  // Set canvas height and width
  canvas.height = rows * blockSize;
  canvas.width = cols * blockSize;

  // Generate player and initial coin
  player = Player.generatePlayer(socket.id);
  scoreSpan.textContent = `My score: ${player.score}`;

  // Start the game loop after a short delay
  setTimeout(requestAnimationFrame.bind(null, update), 777);
}

// Main game loop
function update() {
  // Move the player
  player.movePlayer(5);

  // Boundaries for player movement
  player.x = Math.max(0, Math.min(player.x, canvas.width - blockSize));
  player.y = Math.max(0, Math.min(player.y, canvas.height - blockSize));

  // Update the coordinates of the corresponding player in the players array and send to server
  const playerIndex = players.findIndex(p => p.id === player.id);
  if (playerIndex !== -1) {
    players[playerIndex] = player;
    socket.emit('updateCoordinates', player);
  }

  // Update the coin coordinates & player score if a collision is detected
  if (player.collision(coinCoordinates) && coinCoordinates.id != lastCoinId) {
    player.calculateRank(coinCoordinates.value);
    socket.emit('collisionDetected', true, player.score, player.id);
    lastCoinId = coinCoordinates.id;
    scoreSpan.textContent = `My score: ${player.score}`;
  }

  // Draw all game elements
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = 'black';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw coin
  context.fillStyle = "red";
  context.fillRect(coinCoordinates.x, coinCoordinates.y, blockSize, blockSize);

  // Draw players
  Object.keys(players).forEach(key => {
    if (players[key].id == socket.id) {
      context.fillStyle = "lime";
    } else {
      context.fillStyle = "grey";
    }
    context.fillRect(players[key].x, players[key].y, blockSize, blockSize);
  });

  // Continue the game loop if the game hasn't ended
  if (!end) {
    requestAnimationFrame(update);
  }
}

// Call initializeGame when window loads
window.onload = initializeGame();

// Export constants
export { blockSize, rows, cols };
