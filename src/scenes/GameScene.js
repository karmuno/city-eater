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
    
    // Load the nodes data JSON
    this.load.json('map-nodes', 'assets/data/map-nodes.json');
    
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
      
      // Find the nearest node to the clicked position
      const nearestNode = this.mapManager.findNearestNode(pointer.x, pointer.y);
      if (!nearestNode) {
        console.log('No valid node found near click position');
        return;
      }
      
      const movementCost = this.mapManager.getMovementCost(terrainType);
      console.log(`Clicked on ${terrainType} terrain. Movement cost: ${movementCost}`);
      
      // If this is the first click, set as selected position
      if (!this.selectedPosition) {
        this.selectedPosition = { 
          x: pointer.x, 
          y: pointer.y,
          nodeId: nearestNode.id
        };
        // Show movement range using node ID
        this.mapManager.showMovementRange(nearestNode.id, this.movementPoints);
        this.drawPositionMarker(this.selectedPosition, 0x0000FF);
        console.log(`Selected starting position: (${this.selectedPosition.x}, ${this.selectedPosition.y}) at node ${nearestNode.id}`);
      } 
      // If this is the second click, try to find a path to the target
      else if (!this.targetPosition) {
        this.targetPosition = { 
          x: pointer.x, 
          y: pointer.y,
          nodeId: nearestNode.id
        };
        this.drawPositionMarker(this.targetPosition, 0xFF0000);
        console.log(`Selected target position: (${this.targetPosition.x}, ${this.targetPosition.y}) at node ${nearestNode.id}`);
        
        // Find path between node IDs
        try {
          // Debug adjacency to help troubleshoot pathfinding
          this.debugPathBetweenNodes(
            this.selectedPosition.nodeId,
            this.targetPosition.nodeId
          );
          
          const nodePath = this.mapManager.findPath(
            this.selectedPosition.nodeId, 
            this.targetPosition.nodeId
          );
          
          if (nodePath.length > 0) {
            console.log(`Found path with ${nodePath.length} nodes:`, nodePath);
            
            // Convert node IDs to positions for visualization
            const path = nodePath.map(nodeId => {
              const node = this.mapManager.nodes[nodeId];
              return { x: node.x, y: node.y };
            });
            
            this.drawPath(path);
          } else {
            console.log('No valid path found');
            // Show an error message to the user
            this.showNoPathMessage();
          }
        } catch (error) {
          console.error("Error finding path:", error);
          this.showNoPathMessage();
        }
      } 
      // Reset on third click
      else {
        this.clearMarkers();
        this.selectedPosition = null;
        this.targetPosition = null;
        this.mapManager.showMovementRange(nearestNode.id, this.movementPoints);
        console.log('Reset positions');
      }
    });
    
    // Add keyboard controls for adjusting movement points
    this.input.keyboard.on('keydown-UP', () => {
      this.movementPoints += 1;
      console.log(`Increased movement points to ${this.movementPoints}`);
      this.updateMovementDisplay();
      
      // Update movement range if we have a selected position
      if (this.selectedPosition && this.selectedPosition.nodeId) {
        this.mapManager.showMovementRange(this.selectedPosition.nodeId, this.movementPoints);
      }
    });
    
    this.input.keyboard.on('keydown-DOWN', () => {
      this.movementPoints = Math.max(1, this.movementPoints - 1);
      console.log(`Decreased movement points to ${this.movementPoints}`);
      this.updateMovementDisplay();
      
      // Update movement range if we have a selected position
      if (this.selectedPosition && this.selectedPosition.nodeId) {
        this.mapManager.showMovementRange(this.selectedPosition.nodeId, this.movementPoints);
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
    
    // Clear any error messages
    if (this.errorText) {
      this.errorText.destroy();
      this.errorText = null;
    }
  }
  
  /**
   * Show an error message when no path can be found
   */
  showNoPathMessage() {
    if (this.errorText) {
      this.errorText.destroy();
    }
    
    this.errorText = this.add.text(
      this.cameras.main.width / 2,
      100,
      'No valid path between these nodes!',
      {
        fontSize: '20px',
        fontStyle: 'bold',
        fill: '#FF0000',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5, 0.5);
    
    this.errorText.setScrollFactor(0); // Fix to camera
    
    // Make the text fade out after a few seconds
    this.tweens.add({
      targets: this.errorText,
      alpha: 0,
      duration: 3000,
      delay: 2000,
      onComplete: () => {
        if (this.errorText) {
          this.errorText.destroy();
          this.errorText = null;
        }
      }
    });
  }
  
  /**
   * Debug utility to log adjacency information between nodes
   * @param {number} startNodeId - Starting node ID
   * @param {number} endNodeId - Target node ID
   */
  debugPathBetweenNodes(startNodeId, endNodeId) {
    const startNode = this.mapManager.nodes[startNodeId];
    const endNode = this.mapManager.nodes[endNodeId];
    
    if (!startNode || !endNode) {
      console.error("Invalid nodes for debug:", startNodeId, endNodeId);
      return;
    }
    
    console.log("==== PATH DEBUG INFO ====");
    console.log(`Start Node ${startNodeId}: (${startNode.x}, ${startNode.y}) - ${startNode.terrainType}`);
    console.log(`Adjacent to: ${startNode.adjacentNodes.join(', ')}`);
    console.log(`End Node ${endNodeId}: (${endNode.x}, ${endNode.y}) - ${endNode.terrainType}`);
    console.log(`Adjacent to: ${endNode.adjacentNodes.join(', ')}`);
    
    // Try to find a path manually by checking common adjacencies
    const startAdjSet = new Set(startNode.adjacentNodes);
    const endAdjSet = new Set(endNode.adjacentNodes);
    
    // Find common adjacent nodes (potential intermediate steps)
    const commonNodes = [...startAdjSet].filter(id => endAdjSet.has(id));
    
    if (commonNodes.length > 0) {
      console.log(`Found common adjacent nodes: ${commonNodes.join(', ')}`);
    } else {
      console.log("No common adjacent nodes");
    }
    
    console.log("=========================");
  }
}

export default GameScene;