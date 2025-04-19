class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  preload() {
    console.log("GameScene loaded!");
    // Load just the map image directly
    this.load.image('map-bg', 'assets/images/board/original-map-upscaled.png');
  }
  
  create() {
    // Add the map image as a background
    const mapImage = this.add.image(0, 0, 'map-bg');
    
    // Set the origin to top-left corner (0,0)
    mapImage.setOrigin(0, 0);
    
    // Optional: Adjust the scale if needed
    // mapImage.setScale(0.8);
    
    // Optional: Center in the game world if needed
    mapImage.setPosition(this.cameras.main.width / 2 - mapImage.width / 2,
                        this.cameras.main.height / 2 - mapImage.height / 2);
    
    // Optional: Set up camera bounds to match the map size
    this.cameras.main.setBounds(0, 0, mapImage.width, mapImage.height);
    
    console.log("Map background added!");
  }
}