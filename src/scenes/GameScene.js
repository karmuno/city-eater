import MapManager from '../managers/MapManager.js';
import * as pathfinding from '../utils/pathfinding.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.selectedPosition = null;
    this.targetPosition = null;
    this.movementPoints = 5; // Default movement points
  }
  
  preload() {
    console.log("GameScene loaded!");
    // Load the map image as a background
    this.load.image('map-bg', 'assets/images/board/original-map-upscaled.png');
    
    // Load the Tiled map JSON
    this.load.json('sheboygan-map', 'assets/tilemaps/sheboygan_map.json');
    
    // Preload a marker image for positions
    this.load.image('marker', 'assets/images/ui/loading-bar.png'); // Placeholder image
  }
  
  create() {
    // Add the map image as a background
    const mapImage = this.add.image(0, 0, 'map-bg');
    
    // Set the origin to top-left corner (0,0)
    mapImage.setOrigin(0, 0);
    
    // Center in the game world if needed
    mapImage.setPosition(this.cameras.main.width / 2 - mapImage.width / 2,
                        this.cameras.main.height / 2 - mapImage.height / 2);
    
    // Set up camera bounds to match the map size
    this.cameras.main.setBounds(0, 0, mapImage.width, mapImage.height);
    
    console.log("Map background added!");
    
    // Initialize the map manager
    this.mapManager = new MapManager(this);
    
    // Load the map data
    this.mapManager.loadMap('sheboygan-map');
    
    // Draw debug visuals for terrain
    this.mapManager.drawDebugTerrain(true);
    
    // Initialize marker graphics
    this.markerGraphics = this.add.graphics();
    
    // Add a click handler to show movement range and handle path selection
    this.input.on('pointerdown', (pointer) => {
      const terrainType = this.mapManager.getTerrainTypeAtPosition(pointer.x, pointer.y);
      
      if (!terrainType) {
        console.log('Clicked outside valid terrain');
        return;
      }
      
      console.log(`Clicked on ${terrainType} terrain. Movement cost: ${this.mapManager.getMovementCost(terrainType)}`);
      
      // If this is the first click, set as selected position
      if (!this.selectedPosition) {
        this.selectedPosition = { x: pointer.x, y: pointer.y };
        this.mapManager.showMovementRange(this.selectedPosition, this.movementPoints);
        this.drawPositionMarker(this.selectedPosition, 0x0000FF);
        console.log(`Selected starting position: (${this.selectedPosition.x}, ${this.selectedPosition.y})`);
      } 
      // If this is the second click, try to find a path to the target
      else if (!this.targetPosition) {
        this.targetPosition = { x: pointer.x, y: pointer.y };
        this.drawPositionMarker(this.targetPosition, 0xFF0000);
        console.log(`Selected target position: (${this.targetPosition.x}, ${this.targetPosition.y})`);
        
        // Find path between the two points
        const path = pathfinding.findPath(
          this.selectedPosition, 
          this.targetPosition, 
          this.mapManager, 
          this.movementPoints
        );
        
        if (path.length > 0) {
          console.log(`Found path with ${path.length} steps`);
          this.drawPath(path);
        } else {
          console.log('No valid path found');
        }
      } 
      // Reset on third click
      else {
        this.clearMarkers();
        this.selectedPosition = null;
        this.targetPosition = null;
        this.mapManager.showMovementRange({x: pointer.x, y: pointer.y}, this.movementPoints);
        console.log('Reset positions');
      }
    });
    
    // Add keyboard controls for adjusting movement points
    this.input.keyboard.on('keydown-UP', () => {
      this.movementPoints += 1;
      console.log(`Increased movement points to ${this.movementPoints}`);
      this.updateMovementDisplay();
      
      // Update movement range if we have a selected position
      if (this.selectedPosition) {
        this.mapManager.showMovementRange(this.selectedPosition, this.movementPoints);
      }
    });
    
    this.input.keyboard.on('keydown-DOWN', () => {
      this.movementPoints = Math.max(1, this.movementPoints - 1);
      console.log(`Decreased movement points to ${this.movementPoints}`);
      this.updateMovementDisplay();
      
      // Update movement range if we have a selected position
      if (this.selectedPosition) {
        this.mapManager.showMovementRange(this.selectedPosition, this.movementPoints);
      }
    });
    
    // Add text to display current movement points
    this.movementText = this.add.text(20, 20, `Movement Points: ${this.movementPoints}`, {
      fontSize: '24px',
      fontStyle: 'bold',
      fill: '#FFF',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 }
    });
    this.movementText.setScrollFactor(0); // Fix to camera
    
    // Add instructions
    this.instructionsText = this.add.text(20, 60, 
      'Instructions:\n' +
      '- Click to select a starting position\n' +
      '- Click again to select a target position\n' +
      '- Third click resets the selections\n' +
      '- Up/Down arrows change movement points', 
      {
        fontSize: '16px',
        fill: '#FFF',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    );
    this.instructionsText.setScrollFactor(0); // Fix to camera
  }
  
  /**
   * Update the movement points display
   */
  updateMovementDisplay() {
    if (this.movementText) {
      this.movementText.setText(`Movement Points: ${this.movementPoints}`);
    }
  }
  
  /**
   * Draw a marker at a specific position
   * @param {object} position - The {x, y} position to mark
   * @param {number} color - The color of the marker
   */
  drawPositionMarker(position, color) {
    this.markerGraphics.fillStyle(color, 0.8);
    this.markerGraphics.fillCircle(position.x, position.y, 15);
    this.markerGraphics.lineStyle(3, 0xFFFFFF, 1);
    this.markerGraphics.strokeCircle(position.x, position.y, 15);
  }
  
  /**
   * Draw a path between positions
   * @param {array} path - Array of positions forming the path
   */
  drawPath(path) {
    this.markerGraphics.lineStyle(5, 0xFFFF00, 0.8);
    
    // Draw line segments connecting path points
    this.markerGraphics.beginPath();
    this.markerGraphics.moveTo(path[0].x, path[0].y);
    
    for (let i = 1; i < path.length; i++) {
      this.markerGraphics.lineTo(path[i].x, path[i].y);
      
      // Draw small circles at each path point
      this.markerGraphics.fillStyle(0xFFFF00, 0.6);
      this.markerGraphics.fillCircle(path[i].x, path[i].y, 10);
    }
    
    this.markerGraphics.strokePath();
  }
  
  /**
   * Clear all markers and path visuals
   */
  clearMarkers() {
    if (this.markerGraphics) {
      this.markerGraphics.clear();
    }
  }
}

export default GameScene;