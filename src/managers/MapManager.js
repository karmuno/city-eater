import TerrainTypes from '../utils/TerrainTypes.js';

/**
 * MapManager - Handles the map, terrain objects, and movement calculations
 */
class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.terrainObjects = [];
    this.debugGraphics = null;
    this.terrainTypes = TerrainTypes;
  }

  /**
   * Load the Tiled map JSON file
   * @param {string} mapKey - The key used when loading the map JSON
   */
  loadMap(mapKey) {
    this.mapData = this.scene.cache.json.get(mapKey);
    
    if (!this.mapData) {
      console.error(`Map data for key ${mapKey} not found!`);
      return;
    }
    
    // Process the map layers and extract terrain objects
    this.processTerrainLayer();
    
    console.log(`Loaded map with ${this.terrainObjects.length} terrain objects`);
  }
  
  /**
   * Extract terrain objects from map data
   */
  processTerrainLayer() {
    // Find the terrain objects layer
    const terrainLayer = this.mapData.layers.find(layer => layer.name === 'Terrain');
    
    if (!terrainLayer || !terrainLayer.objects) {
      console.error('No terrain layer or objects found in map data');
      return;
    }
    
    // Process each terrain object
    this.terrainObjects = terrainLayer.objects.map(obj => {
      // Determine the terrain type from properties, default to 'default'
      const terrainProperty = obj.properties?.find(prop => prop.name === 'terrainType');
      const terrainType = terrainProperty ? terrainProperty.value : 'default';
      
      return {
        id: obj.id,
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height,
        terrainType: terrainType
      };
    });
  }
  
  /**
   * Draw debug visuals for terrain objects
   * @param {boolean} showLabels - Whether to show terrain type labels
   */
  drawDebugTerrain(showLabels = false) {
    // Clear any existing debug graphics
    if (this.debugGraphics) {
      this.debugGraphics.clear();
    } else {
      this.debugGraphics = this.scene.add.graphics();
    }
    
    const colors = {
      default: 0xCCCCCC,
      street: 0x888888,
      river: 0x0088FF,
      building: 0xDD8855,
      forest: 0x33AA33,
      mountain: 0x885533,
      bridge: 0xFFCC00
    };
    
    // Draw each terrain object
    this.terrainObjects.forEach(obj => {
      const color = colors[obj.terrainType] || colors.default;
      
      // Different opacity based on whether terrain is passable
      const opacity = this.terrainTypes.isPassable(obj.terrainType) ? 0.5 : 0.7;
      
      this.debugGraphics.lineStyle(2, 0x000000, 0.8);
      this.debugGraphics.fillStyle(color, opacity);
      this.debugGraphics.fillRect(obj.x, obj.y, obj.width, obj.height);
      this.debugGraphics.strokeRect(obj.x, obj.y, obj.width, obj.height);
      
      // Optionally draw labels
      if (showLabels) {
        // Get terrain display name and cost
        const terrainInfo = this.terrainTypes[obj.terrainType];
        const displayName = terrainInfo ? terrainInfo.name : obj.terrainType;
        const cost = this.getMovementCost(obj.terrainType);
        const label = `${displayName} (${cost > 0 ? cost : 'X'})`;
        
        const text = this.scene.add.text(
          obj.x + obj.width / 2, 
          obj.y + obj.height / 2, 
          label,
          { 
            fontFamily: 'Arial', 
            fontSize: '12px', 
            fill: '#000',
            backgroundColor: '#ffffff88',
            padding: { x: 2, y: 2 }
          }
        );
        text.setOrigin(0.5, 0.5);
      }
    });
  }
  
  /**
   * Find the terrain object at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {object|null} Terrain object or null if not found
   */
  getTerrainAtPosition(x, y) {
    // Find the terrain object that contains this point
    return this.terrainObjects.find(obj => 
      x >= obj.x && x < obj.x + obj.width && 
      y >= obj.y && y < obj.y + obj.height
    ) || null;
  }
  
  /**
   * Get the terrain type at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {string} Terrain type name ('default' if not found)
   */
  getTerrainTypeAtPosition(x, y) {
    const terrainObj = this.getTerrainAtPosition(x, y);
    return terrainObj ? terrainObj.terrainType : 'default';
  }
  
  /**
   * Get the movement cost for a terrain type
   * @param {string} terrainType - The terrain type
   * @param {object} unit - Optional unit object for unit-specific effects
   * @returns {number} Movement cost (-1 for impassable)
   */
  getMovementCost(terrainType, unit = null) {
    return this.terrainTypes.getMovementCost(terrainType, unit);
  }
  
  /**
   * Check if two positions are adjacent (no diagonal movement)
   * @param {object} pos1 - {x, y} First position
   * @param {object} pos2 - {x, y} Second position
   * @param {number} threshold - Maximum distance to be considered adjacent
   * @returns {boolean} True if positions are adjacent
   */
  isAdjacent(pos1, pos2, threshold = 100) {
    // Calculate Manhattan distance
    const dx = Math.abs(pos1.x - pos2.x);
    const dy = Math.abs(pos1.y - pos2.y);
    
    // Adjacent means one coordinate differs by less than threshold, and the other is close to zero
    // No diagonal movement, so only one direction can have significant difference
    return (dx < threshold && dy < 20) || (dy < threshold && dx < 20);
  }
  
  /**
   * Get adjacent positions to the given position (no diagonal movement)
   * @param {object} pos - {x, y} Starting position
   * @param {number} step - Step distance for adjacency
   * @returns {array} Array of adjacent positions as {x, y} objects
   */
  getAdjacentPositions(pos, step = 75) {
    // The four cardinal directions
    const directions = [
      { x: 0, y: -step }, // North
      { x: step, y: 0 },  // East
      { x: 0, y: step },  // South
      { x: -step, y: 0 }  // West
    ];
    
    // Apply each direction and filter to only include positions that have valid terrain
    return directions.map(dir => ({
      x: pos.x + dir.x,
      y: pos.y + dir.y
    })).filter(newPos => {
      // Ensure position is within a terrain object
      return this.getTerrainAtPosition(newPos.x, newPos.y) !== null;
    });
  }
  
  /**
   * Calculate total movement cost from one position to another
   * @param {object} fromPos - {x, y} Starting position
   * @param {object} toPos - {x, y} Target position
   * @param {object} unit - Optional unit for terrain-specific effects
   * @returns {number} Movement cost (-1 if not possible)
   */
  calculateMovementCost(fromPos, toPos, unit = null) {
    // First check if the positions are adjacent
    if (!this.isAdjacent(fromPos, toPos)) {
      return -1; // Not adjacent, so movement not possible
    }
    
    // Get terrain type at destination
    const terrainType = this.getTerrainTypeAtPosition(toPos.x, toPos.y);
    
    // Return movement cost for terrain type
    return this.getMovementCost(terrainType, unit);
  }
  
  /**
   * Helper function to create a pathfinding node at a specific position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {object} unit - Optional unit for terrain-specific effects
   * @returns {object|null} Node information or null if position is invalid
   */
  createPathNode(x, y, unit = null) {
    // Get the terrain at this position
    const terrain = this.getTerrainAtPosition(x, y);
    
    // If no terrain found, this isn't a valid position
    if (!terrain) return null;
    
    // Get movement cost
    const moveCost = this.getMovementCost(terrain.terrainType, unit);
    
    // Return node information
    return {
      x,
      y,
      terrain: terrain.terrainType,
      cost: moveCost,
      isPassable: moveCost > 0
    };
  }
  
  /**
   * Find all positions reachable from a starting position with given movement points
   * @param {object} startPos - {x, y} Starting position
   * @param {number} movementPoints - Available movement points
   * @param {object} unit - Optional unit for terrain-specific effects
   * @returns {array} Array of reachable positions with their costs
   */
  findReachablePositions(startPos, movementPoints, unit = null) {
    const visited = new Map(); // Map of positions to their movement costs
    visited.set(`${startPos.x},${startPos.y}`, 0);
    
    const result = [{ x: startPos.x, y: startPos.y, cost: 0 }];
    const queue = [{ pos: startPos, remainingPoints: movementPoints }];
    
    while (queue.length > 0) {
      const current = queue.shift();
      const currentCost = visited.get(`${current.pos.x},${current.pos.y}`);
      
      // Get adjacent positions
      const adjacent = this.getAdjacentPositions(current.pos);
      
      for (const nextPos of adjacent) {
        const posKey = `${nextPos.x},${nextPos.y}`;
        
        // Calculate movement cost
        const moveCost = this.calculateMovementCost(current.pos, nextPos, unit);
        
        // Skip impassable terrain or if not enough movement points
        if (moveCost < 0 || moveCost > current.remainingPoints) continue;
        
        const newCost = currentCost + moveCost;
        const newRemainingPoints = current.remainingPoints - moveCost;
        
        // If we haven't visited this position before, or found a cheaper path
        if (!visited.has(posKey) || newCost < visited.get(posKey)) {
          visited.set(posKey, newCost);
          result.push({ 
            x: nextPos.x, 
            y: nextPos.y, 
            cost: newCost,
            remainingPoints: newRemainingPoints,
            terrainType: this.getTerrainTypeAtPosition(nextPos.x, nextPos.y)
          });
          
          // Only add to queue if we have remaining movement points
          if (newRemainingPoints > 0) {
            queue.push({ pos: nextPos, remainingPoints: newRemainingPoints });
          }
        }
      }
    }
    
    return result;
  }
  
  /**
   * Draw movement range visualization
   * @param {object} startPos - {x, y} Starting position
   * @param {number} movementPoints - Available movement points
   * @param {object} unit - Optional unit for terrain-specific effects
   * @param {boolean} showCosts - Whether to show movement costs
   */
  showMovementRange(startPos, movementPoints, unit = null, showCosts = true) {
    // Clear any existing debug graphics
    if (this.rangeGraphics) {
      this.rangeGraphics.clear();
      
      // Also clear any existing cost texts
      if (this.costTexts) {
        this.costTexts.forEach(text => text.destroy());
      }
    } else {
      this.rangeGraphics = this.scene.add.graphics();
    }
    
    // Initialize cost texts array
    this.costTexts = [];
    
    // Find reachable positions
    const reachable = this.findReachablePositions(startPos, movementPoints, unit);
    
    console.log(`Found ${reachable.length} reachable positions from (${startPos.x}, ${startPos.y}) with ${movementPoints} movement points`);
    
    // Draw reachable areas
    this.rangeGraphics.lineStyle(1, 0x000000, 0.5);
    
    // Draw with gradient colors based on remaining movement points
    for (const pos of reachable) {
      // Skip the starting position
      if (pos.x === startPos.x && pos.y === startPos.y) continue;
      
      // Calculate color based on movement cost - green for low cost, red for high cost
      const ratio = pos.cost / movementPoints;
      const colorValue = 0x00FF00 + Math.floor(ratio * 0xFF) * 0x10000 - Math.floor(ratio * 0xFF) * 0x100;
      
      // Draw a circle at each reachable position
      this.rangeGraphics.fillStyle(colorValue, 0.4);
      this.rangeGraphics.fillCircle(pos.x, pos.y, 30);
      this.rangeGraphics.strokeCircle(pos.x, pos.y, 30);
      
      // Show cost if requested
      if (showCosts) {
        const text = this.scene.add.text(
          pos.x, 
          pos.y, 
          `${pos.cost}`, 
          { 
            fontSize: '16px', 
            fontStyle: 'bold',
            fill: '#000',
            backgroundColor: '#ffffff88',
            padding: { x: 3, y: 3 },
          }
        ).setOrigin(0.5);
        
        this.costTexts.push(text);
      }
    }
    
    // Draw the starting position
    this.rangeGraphics.fillStyle(0x0000FF, 0.6);
    this.rangeGraphics.fillCircle(startPos.x, startPos.y, 35);
    this.rangeGraphics.lineStyle(3, 0xFFFFFF, 0.8);
    this.rangeGraphics.strokeCircle(startPos.x, startPos.y, 35);
    
    // Add starting position text
    if (showCosts) {
      const startText = this.scene.add.text(
        startPos.x, 
        startPos.y, 
        'Start', 
        { 
          fontSize: '14px', 
          fontStyle: 'bold',
          fill: '#FFF',
          backgroundColor: '#00008888',
          padding: { x: 3, y: 3 },
        }
      ).setOrigin(0.5);
      
      this.costTexts.push(startText);
    }
  }
}

export default MapManager;