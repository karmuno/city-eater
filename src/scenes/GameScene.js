class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameScene' });
    }
  
    preload() {
      console.log("GameScene loaded!"); 
    }
  
    create() {
    //   this.scene.start('MainMenuScene'); 
    }
  }