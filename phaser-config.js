import BootScene from './src/scenes/BootScene.js';
import MainMenuScene from './src/scenes/MainMenuScene.js';
import GameScene from './src/scenes/GameScene.js';

const config = {
    type: Phaser.AUTO, // Auto-detect WebGL or Canvas
    parent: 'game-container', // ID of the HTML container
    width: 1200, // Map width (adjust to match your tilemap)
    height: 800, // Map height
    backgroundColor: '#2d2d2d',
    scene: [BootScene, MainMenuScene, GameScene], // Scene order matters!
    scale: {
      mode: Phaser.Scale.FIT, // Responsive scaling
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
      default: 'arcade',
      arcade: { 
        gravity: { y: 0 }, // No gravity for top-down game
        debug: false // Toggle for collision debugging
      }
    },
    // Add EasyStar.js pathfinding later
  };
  
  // Initialize the game
  const game = new Phaser.Game(config);