// Import constants from the game module
import { blockSize, rows, cols } from './game.mjs';

class Player {
  constructor({ x, y, score, id }) {
    // Initialize player properties
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
    // Initialize key state for player movement
    this.keyState = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false
    };
  }

  // Generate a random player at the start of the game
  static generatePlayer(sid) {
    return new Player({
      x: blockSize * Math.floor(Math.random() * cols),
      y: blockSize * Math.floor(Math.random() * rows),
      score: 0,
      id: sid
    });
  }

  // Update key state when pressed or released (and enable using ZQSD to move)
  updateKeyState(direction, pressed) {
    // Convert ZQSD keys to Arrow keys
    switch (direction) {
      case "KeyW":
        direction = "ArrowUp";
        break;
      case "KeyS":
        direction = "ArrowDown";
        break;
      case "KeyA":
        direction = "ArrowLeft";
        break;
      case "KeyD":
        direction = "ArrowRight";
        break;
    }
    // Update key state
    this.keyState[direction] = pressed;
  }

  // Move the player based on key inputs
  movePlayer(speed) {
    // Calculate movement in x and y directions based on key inputs
    const dx = (this.keyState.ArrowLeft ? -speed : (this.keyState.ArrowRight ? speed : 0));
    const dy = (this.keyState.ArrowUp ? -speed : (this.keyState.ArrowDown ? speed : 0));
    // Update player position
    this.x += dx;
    this.y += dy;
  }

  // Check for collision with a collectible item
  collision(item) {
    // Check if player's position overlaps with item's position
    return Math.abs(this.x - item.x) < blockSize && Math.abs(this.y - item.y) < blockSize;
  }

  // Placeholder for calculating player rank (e.g., based on score)
  calculateRank(value) {
    // Increment player's score by the given value
    this.score += value;
  }
}

// Export the Player class
export default Player;
