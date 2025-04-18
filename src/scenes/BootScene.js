class BootScene extends Phaser.Scene {
    constructor() {
      super({ key: 'BootScene' });
    }
  
    preload() {
      console.log("BootScene loaded!"); 
    }
  
    create() {
      this.scene.start('MainMenuScene'); 
    }
  }