// src/scenes/BootScene.js
class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 1. Load assets needed for the loading screen itself
    this.load.image('loading-bar', 'assets/images/ui/loading-bar.png'); // Simple progress bar graphic
    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js'); // For custom fonts

    // 2. Set up loading progress bar
    this.createLoadingBar();
  }

  createLoadingBar() {
    // Add progress bar graphics
    const { width, height } = this.cameras.main;
    const loadingBar = this.add.graphics();
    const progressBox = this.add.rectangle(width / 2, height / 2, 400, 30, 0x222222);
    const progressBar = this.add.rectangle(width / 2 - 190, height / 2, 10, 20, 0x00ff00);

    // Update bar as files load
    this.load.on('progress', (value) => {
      progressBar.width = 380 * value; // Scale from 0 to 380px
    });

    // Handle load errors
    this.load.on('loaderror', () => {
      console.error('Failed to load critical assets!');
    });
  }

  create() {
    // 1. Initialize fonts (example: Google Fonts)
    WebFont.load({
      google: { families: ['Press Start 2P'] }, // Retro-style font
      active: () => {
        // 2. Configure input settings
        this.initializeInputSettings();
        
        // 3. Fonts loaded – proceed to Main Menu
        this.scene.start('MainMenuScene');
      }
    });
  }
  
  initializeInputSettings() {
    // Configure keyboard inputs
    this.input.keyboard.createCursorKeys();
    
    // Set up mouse/touch interaction
    this.input.setDefaultCursor('pointer');
    
    // Configure input for multi-touch/drag operations
    this.input.setPollAlways();
  }
}