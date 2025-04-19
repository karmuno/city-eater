/**
 * FireManager.js - Manages fire spread, damage, and extinguishing mechanics
 */
class FireManager {
  /**
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {GameState} gameState - Reference to game state
   * @param {MapManager} mapManager - Reference to map manager
   */
  constructor(scene, gameState, mapManager) {
    this.scene = scene;
    this.gameState = gameState;
    this.mapManager = mapManager;
    
    // Group to hold all fire markers
    this.fireGroup = scene.add.group();
    
    // Set up event listeners
    this.setupEvents();
  }
  
  /**
   * Set up event listeners
   */
  setupEvents() {
    // Listen for fire creation events
    this.scene.events.on('fire-started', this.onFireStarted, this);
    
    // Listen for fire marker placed
    this.scene.events.on('marker-placed', this.onMarkerPlaced, this);
    
    // Listen for fire marker removed
    this.scene.events.on('marker-removed', this.onMarkerRemoved, this);
    
    // Listen for wind direction changes
    this.scene.events.on('wind-direction-changed', this.onWindDirectionChanged, this);
    
    // Listen for turn changes to determine fire spread
    this.scene.events.on('turn-end-effects-applied', this.onTurnEnd, this);
  }
  
  /**
   * Handle fire started event
   * @param {Object} data - Fire data
   */
  onFireStarted(data) {
    console.log(`Fire started at node ${data.nodeId} with intensity ${data.stage || 1}`);
    
    // Create a new fire marker
    this.createFireMarker(data.nodeId, data.stage || 1);
  }
  
  /**
   * Handle marker placed event
   * @param {Object} marker - The marker that was placed
   */
  onMarkerPlaced(marker) {
    // Only handle fire markers
    if (marker.type !== 'fire') return;
    
    // Add to fire group if it's a FireMarker instance
    if (marker.constructor.name === 'FireMarker') {
      this.fireGroup.add(marker);
    }
  }
  
  /**
   * Handle marker removed event
   * @param {Object} marker - The marker that was removed
   */
  onMarkerRemoved(marker) {
    // Only handle fire markers
    if (marker.type !== 'fire') return;
    
    // Remove from fire group if it's in the group
    if (marker.constructor.name === 'FireMarker') {
      this.fireGroup.remove(marker);
    }
  }
  
  /**
   * Handle wind direction change
   * @param {number} windDirection - New wind direction (1-6)
   */
  onWindDirectionChanged(windDirection) {
    console.log(`Wind direction changed to ${windDirection}`);
    // Could update visualizations or UI indicators here
  }
  
  /**
   * Handle end of turn to process fire spread
   * @param {Object} data - Turn end data
   */
  onTurnEnd(data) {
    // Only spread fires at the end of human turns
    if (data.player === 'human') {
      console.log('Processing fire spread at end of human turn');
      this.spreadFires();
    }
  }
  
  /**
   * Create a fire marker at a specific node
   * @param {number} nodeId - ID of node to place fire on
   * @param {number} intensity - Initial fire intensity (1-3)
   * @returns {FireMarker|null} The created fire marker or null if failed
   */
  createFireMarker(nodeId, intensity = 1) {
    // Check if node already has a fire
    if (this.gameState.hasMarker(nodeId, 'fire')) {
      console.log(`Node ${nodeId} already has a fire`);
      
      // Instead of creating a new fire, increase intensity of existing fire
      const existingFires = this.gameState.getMarkersAtNode(nodeId, 'fire');
      if (existingFires.length > 0 && typeof existingFires[0].increaseIntensity === 'function') {
        existingFires[0].increaseIntensity();
      }
      
      return null;
    }
    
    // Get node position from map manager
    const node = this.mapManager.getNode(nodeId);
    if (!node) {
      console.error(`Invalid node ID: ${nodeId}`);
      return null;
    }
    
    // Check if terrain can support fire
    const validTerrains = ['lowBuilding', 'highBuilding', 'park'];
    if (!validTerrains.includes(node.terrainType)) {
      console.log(`Cannot place fire on terrain type: ${node.terrainType}`);
      return null;
    }
    
    // Create the fire marker
    // Use FireMarker if available
    if (typeof FireMarker !== 'undefined') {
      const fire = new FireMarker(
        this.scene, 
        node.x, 
        node.y, 
        nodeId, 
        intensity
      );
      
      return fire;
    } else {
      // Fallback to placeholder object for testing
      console.log('FireMarker class not available, creating placeholder object');
      
      // Create a placeholder object
      const fireMarker = {
        id: `fire-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'fire',
        nodeId: nodeId,
        intensity: intensity
      };
      
      // Emit marker placed event
      this.scene.events.emit('marker-placed', fireMarker);
      
      return fireMarker;
    }
  }
  
  /**
   * Process fire spread for all existing fires
   */
  spreadFires() {
    // Get current wind direction
    const windDirection = this.gameState.config.windDirection || 1;
    
    // Track nodes to add fires to after processing
    const nodesToAddFire = [];
    
    // Track fires to increase intensity
    const firesToIncrease = [];
    
    // Get all fire markers
    const fireMarkers = [];
    
    // If we have a proper fire group, use it
    if (this.fireGroup.getChildren) {
      fireMarkers.push(...this.fireGroup.getChildren());
    }
    
    // Also check game state for fire markers
    for (const marker of this.gameState.markers.values()) {
      if (marker.type === 'fire' && !fireMarkers.some(f => f.id === marker.id)) {
        fireMarkers.push(marker);
      }
    }
    
    console.log(`Processing fire spread for ${fireMarkers.length} fires with wind direction ${windDirection}`);
    
    // Process each fire for spread
    for (const fire of fireMarkers) {
      // Higher intensity fires are more likely to spread
      const intensity = fire.intensity || 1;
      
      // Get the node this fire is on
      const sourceNode = this.mapManager.getNode(fire.nodeId);
      if (!sourceNode) continue;
      
      // Get adjacent nodes
      const adjacentNodeIds = sourceNode.adjacentNodes || [];
      
      // Check each adjacent node for spread
      for (const targetNodeId of adjacentNodeIds) {
        // Skip if already marked for adding fire
        if (nodesToAddFire.includes(targetNodeId)) continue;
        
        // Skip if already has a fire
        if (this.gameState.hasMarker(targetNodeId, 'fire')) {
          // Instead of adding a new fire, mark for intensity increase
          const existingFires = this.gameState.getMarkersAtNode(targetNodeId, 'fire');
          if (existingFires.length > 0 && Math.random() < 0.3) {
            firesToIncrease.push(existingFires[0]);
          }
          continue;
        }
        
        // Check if fire can spread to this node
        let canSpread = false;
        
        // Use FireMarker's method if available
        if (typeof fire.canSpreadTo === 'function') {
          canSpread = fire.canSpreadTo(targetNodeId, windDirection);
        } else {
          // Fallback logic if FireMarker is not available
          // Get target node terrain
          const targetNode = this.mapManager.getNode(targetNodeId);
          if (!targetNode) continue;
          
          // Check if terrain can support fire
          const validTerrains = ['lowBuilding', 'highBuilding', 'park'];
          if (!validTerrains.includes(targetNode.terrainType)) continue;
          
          // Calculate spread probability based on intensity and wind
          const baseChance = intensity * 15; // 15%, 30%, or 45% base chance
          
          // Simple wind direction check - higher chance if wind is blowing that way
          // For a proper implementation, need to compare directions
          const windModifier = Math.random() < 0.5 ? 15 : 0; // 50% chance for a bonus
          
          const spreadChance = baseChance + windModifier;
          
          // Determine if spread happens
          canSpread = (Math.random() * 100) < spreadChance;
        }
        
        // If spread succeeds, add to list for creating new fires
        if (canSpread) {
          console.log(`Fire at node ${fire.nodeId} will spread to node ${targetNodeId}`);
          nodesToAddFire.push(targetNodeId);
        }
      }
    }
    
    // Create fires on nodes marked for spread
    for (const nodeId of nodesToAddFire) {
      this.createFireMarker(nodeId, 1);
    }
    
    // Increase intensity for marked fires
    for (const fire of firesToIncrease) {
      if (typeof fire.increaseIntensity === 'function') {
        fire.increaseIntensity();
      } else {
        // Fallback for placeholder objects
        fire.intensity = Math.min(3, (fire.intensity || 1) + 1);
        
        // Emit intensity changed event
        this.scene.events.emit('fire-intensity-changed', {
          nodeId: fire.nodeId,
          intensity: fire.intensity,
          marker: fire
        });
      }
    }
    
    // Check for buildings being destroyed by maximum intensity fires
    for (const fire of fireMarkers) {
      if ((fire.intensity || 1) >= 3) {
        this.checkForBuildingDestruction(fire);
      }
    }
    
    console.log(`Fire spread complete. Added ${nodesToAddFire.length} new fires and increased ${firesToIncrease.length} existing fires.`);
  }
  
  /**
   * Attempt to extinguish fire at a specific node
   * @param {number} nodeId - ID of node with fire to extinguish
   * @param {number} amount - Amount of fire to extinguish (1-3)
   * @param {Object} unit - The unit doing the extinguishing
   * @returns {boolean} Whether the action was successful
   */
  extinguishFire(nodeId, amount = 1, unit) {
    // Get fires at this node
    const fires = this.gameState.getMarkersAtNode(nodeId, 'fire');
    if (fires.length === 0) {
      console.log(`No fire at node ${nodeId} to extinguish`);
      return false;
    }
    
    const fire = fires[0];
    
    // Check if unit is adjacent to the fire
    if (unit && unit.currentNodeId) {
      const unitNode = this.mapManager.getNode(unit.currentNodeId);
      if (!unitNode || !unitNode.adjacentNodes.includes(nodeId)) {
        console.log(`Unit at node ${unit.currentNodeId} is not adjacent to fire at node ${nodeId}`);
        return false;
      }
    }
    
    // Adjust extinguish amount based on unit type
    let effectiveAmount = amount;
    
    if (unit && unit.type) {
      // Firemen and fireboats are more effective
      if (unit.type === 'firemen') {
        effectiveAmount += 1;
      } else if (unit.type === 'fireboat') {
        effectiveAmount += 2;
      }
    }
    
    console.log(`Attempting to extinguish fire at node ${nodeId} by ${effectiveAmount} levels`);
    
    // Use FireMarker's method if available
    if (typeof fire.extinguish === 'function') {
      return fire.extinguish(effectiveAmount);
    } else {
      // Fallback logic for placeholder objects
      if (fire.intensity <= effectiveAmount) {
        // Fire is completely extinguished
        this.scene.events.emit('marker-removed', fire);
        return true;
      } else {
        // Fire is partially extinguished
        fire.intensity -= effectiveAmount;
        
        // Emit intensity changed event
        this.scene.events.emit('fire-intensity-changed', {
          nodeId: fire.nodeId,
          intensity: fire.intensity,
          marker: fire
        });
        
        return false;
      }
    }
  }
  
  /**
   * Check if a stage 3 fire destroys a building
   * @param {FireMarker|Object} fire - The fire to check
   */
  checkForBuildingDestruction(fire) {
    // Get node data
    const node = this.mapManager.getNode(fire.nodeId);
    if (!node) return;
    
    // Only buildings can be destroyed
    if (!['lowBuilding', 'highBuilding'].includes(node.terrainType)) {
      return;
    }
    
    // Stage 3 fires have a chance to destroy buildings at the end of turn
    // Higher chance for low buildings
    const destroyChance = node.terrainType === 'lowBuilding' ? 40 : 20; // 40% for low, 20% for high
    
    if (Math.random() * 100 < destroyChance) {
      console.log(`Building at node ${fire.nodeId} destroyed by fire!`);
      
      // Change terrain to rubble
      const originalTerrain = node.terrainType;
      node.terrainType = 'rubble';
      
      // If using real FireMarker, destroy it and create a rubble marker
      if (typeof fire.destroy === 'function') {
        fire.destroy(true); // Create rubble marker
      } else {
        // For placeholder fires, remove fire marker and create a rubble marker
        this.scene.events.emit('marker-removed', fire);
        
        // Create a rubble marker
        const rubbleMarker = {
          id: `rubble-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          type: 'rubble',
          nodeId: fire.nodeId
        };
        
        // Emit marker placed event
        this.scene.events.emit('marker-placed', rubbleMarker);
      }
      
      // Award victory points to the monster for destruction
      const vpValue = originalTerrain === 'highBuilding' ? 5 : 3;
      
      // Emit building destroyed event
      this.scene.events.emit('building-destroyed', {
        nodeId: fire.nodeId,
        terrainType: originalTerrain,
        cause: 'fire',
        victoryPoints: vpValue
      });
    }
  }
  
  /**
   * Get information about fires on the map
   * @returns {Object} Fire statistics
   */
  getFireStats() {
    let totalFires = 0;
    let stage1 = 0;
    let stage2 = 0;
    let stage3 = 0;
    
    // Count fires by intensity
    for (const marker of this.gameState.markers.values()) {
      if (marker.type === 'fire') {
        totalFires++;
        
        const intensity = marker.intensity || 1;
        if (intensity === 1) stage1++;
        else if (intensity === 2) stage2++;
        else if (intensity === 3) stage3++;
      }
    }
    
    return {
      total: totalFires,
      stage1: stage1,
      stage2: stage2,
      stage3: stage3,
      windDirection: this.gameState.config.windDirection || 1
    };
  }
  
  /**
   * Create a visual representation of the wind direction
   * @param {number} x - X position to draw at
   * @param {number} y - Y position to draw at
   * @returns {Phaser.GameObjects.Container} Container with wind indicator
   */
  createWindIndicator(x, y) {
    const container = this.scene.add.container(x, y);
    
    // Create background
    const bg = this.scene.add.circle(0, 0, 30, 0x000000, 0.7);
    container.add(bg);
    
    // Create arrow graphics
    const arrow = this.scene.add.graphics();
    arrow.fillStyle(0xFFFFFF, 1);
    arrow.beginPath();
    arrow.moveTo(0, -20);
    arrow.lineTo(15, 10);
    arrow.lineTo(0, 0);
    arrow.lineTo(-15, 10);
    arrow.closePath();
    arrow.fillPath();
    
    container.add(arrow);
    
    // Create text for wind strength
    const text = this.scene.add.text(0, 15, 'Wind', {
      fontSize: '12px',
      fontStyle: 'bold',
      fill: '#FFFFFF'
    }).setOrigin(0.5);
    
    container.add(text);
    
    // Set rotation based on current wind direction
    // Wind direction is 1-6, where 1 is East, 2 is SE, 3 is SW, etc.
    const windDirection = this.gameState.config.windDirection || 1;
    const angle = (windDirection - 1) * Math.PI / 3; // Convert to radians (0 = East)
    
    arrow.setRotation(angle);
    
    // Update when wind changes
    this.scene.events.on('wind-direction-changed', (newDirection) => {
      const newAngle = (newDirection - 1) * Math.PI / 3;
      
      // Animate rotation change
      this.scene.tweens.add({
        targets: arrow,
        rotation: newAngle,
        duration: 500,
        ease: 'Cubic.easeOut'
      });
    });
    
    return container;
  }
}

export default FireManager;