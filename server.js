require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');
const app = express();
const helmet = require('helmet');
const cors = require('cors');

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({origin: '*'})); 
app.use(helmet({
  xContentTypeOptions: false, //Prevent client from guess/sniff MIME
  noCache: true //Disabling client-side caching
}));
app.use((req, res, next) => {
  res.setHeader("X-Powered-By", "PHP 7.4.3"); //Give false x-powered-by (as a security measure).
  next();
});

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);

// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

// Set up Socket.IO
const io = socket(server);
let players = [];
let theCollectible = getNewCollectable();

// Socket.IO connections handling
io.on('connection', (socket) => {
  console.log('A user connected with socket ID:', socket.id);

  // Send initial coin when game starts
  io.emit('newCoinCoordinates', theCollectible);

  // When a new player joins, update players array and send to clients
  socket.on('newPlayer', (player) => {
    players.push(player);
    io.emit('update', players);
  });

  // Update player position and send new position to all clients
  socket.on('updateCoordinates', (updatedPlayer) => {
    const index = players.findIndex(player => player.id === updatedPlayer.id);
    if (index !== -1) {
      players[index] = updatedPlayer;
      io.emit('updatePlayers', players);
    }
  });

  // Handle collision detection
  socket.on('collisionDetected', (bool, playerScore, playerId) => {
    if (bool === true) {
      // Generate new collectible and send it to all clients
      theCollectible = getNewCollectable();
      io.emit('newCoinCoordinates', theCollectible);
      // Update score of the player who took the coin
      const findPlayer = players.findIndex(p => p.id === playerId);
      if (findPlayer !== -1) {
        players[findPlayer].score = playerScore;
        // Check if player won
        if (players[findPlayer].score >= 9999) {
          const msg = `Player ${players[findPlayer].id} won the game! Reload the page to play again.`;
          io.emit('ending', msg);
        }
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    players = players.filter(player => player.id !== socket.id);
    io.emit('update', players);
    console.log('User disconnected with socket ID:', socket.id);
  });
});

// Function to generate new collectible
function getNewCollectable() {
  const randX = Math.floor(Math.random() * 630);
  const randY = Math.floor(Math.random() * 480);
  const values = [125, 250, 500];
  const value = values[Math.floor(Math.random() * values.length)];
  const randId = crypto.randomUUID();
  return { x: randX, y: randY, value: value, id: randId };
}

module.exports = app; // For testing:
