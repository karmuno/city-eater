class GameScene extends Phaser.Scene {
    constructor() {
      super({ key: 'GameScene' });
    }
  
    preload() {
      console.log("GameScene loaded!");
      // Load the map tileset image and the tilemap JSON
      this.load.image('original-map', 'assets/images/board/original-map-upscaled.png');
      this.load.tilemapTiledJSON('map', 'assets/tilemaps/sheboygan_map.json');
    }
  
    create() {
      // Create the tilemap and display the background layer
      const map = this.make.tilemap({ key: 'map' });
      const tileset = map.addTilesetImage('original-map', 'original-map');
      const background = map.createLayer('Background', tileset, 0, 0);
      
      // TODO: Add additional layers, objects, and game logic here
    }
  }