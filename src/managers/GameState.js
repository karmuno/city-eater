/**
 * GameState.js - Manages overall game state, including unit tracking, victory conditions, and game events
 */
class GameState {
  /**
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   */
  constructor(scene) {
    this.scene = scene;
    
    // Core game state
    this.units = new Map(); // Map of unit IDs to unit objects
    this.monsters = new Map(); // Map of monster IDs to monster objects
    this.markers = new Map(); // Map of marker IDs to marker objects (fire, rubble, web)
    
    // Track the current turn
    this.currentTurn = 1;
    this.currentPlayer = 'monster'; // 'monster' or 'human'
    
    // Victory points tracking
    this.victoryPoints = {
      monster: 0,
      human: 0
    };
    
    // Game configuration (loaded from scenario)
    this.config = {
      maxTurns: 20,
      victoryPointGoal: 100,
      windDirection: 1, // 1-6 for fire spread
      scenario: 'learning' // Default scenario
    };
    
    // Track which nodes have units, markers, etc.
    this.nodeContents = {}; // nodeId -> { units: [], markers: [] }
    
    // Setup event listeners
    this.setupEvents();
  }
  
  /**
   * Set up event listeners for game events
   */
  setupEvents() {
    // Listen for unit creation
    this.scene.events.on('unit-created', this.registerUnit, this);
    
    // Listen for unit destruction
    this.scene.events.on('unit-destroyed', this.unregisterUnit, this);
    
    // Listen for unit movement
    this.scene.events.on('unit-moved', this.updateUnitPosition, this);
    
    // Listen for monster creation
    this.scene.events.on('monster-created', this.registerMonster, this);
    
    // Listen for marker placement (fire, rubble, web)
    this.scene.events.on('marker-placed', this.registerMarker, this);
    
    // Listen for marker removal
    this.scene.events.on('marker-removed', this.unregisterMarker, this);
    
    // Listen for turn changes
    this.scene.events.on('turn-changed', this.onTurnChanged, this);
    
    // Listen for combat results
    this.scene.events.on('combat-resolved', this.onCombatResolved, this);
  }
  
  /**
   * Register a new unit with the game state
   * @param {Unit} unit - The unit to register
   */
  registerUnit(unit) {
    // Add to units map
    this.units.set(unit.id, unit);
    
    // Update node contents
    this.addToNode(unit.currentNodeId, 'units', unit);
    
    console.log(`Unit ${unit.type} (ID: ${unit.id}) registered at node ${unit.currentNodeId}`);
  }
  
  /**
   * Unregister a unit (when destroyed)
   * @param {Unit} unit - The unit to unregister
   */
  unregisterUnit(unit) {
    // Remove from units map
    this.units.delete(unit.id);
    
    // Update node contents
    this.removeFromNode(unit.currentNodeId, 'units', unit);
    
    console.log(`Unit ${unit.type} (ID: ${unit.id}) unregistered`);
    
    // Check if this affects victory conditions
    this.checkVictoryConditions();
  }
  
  /**
   * Update unit position when it moves
   * @param {Unit} unit - The unit that moved
   */
  updateUnitPosition(unit) {
    // First remove from old node
    this.removeFromNode(unit.previousNodeId, 'units', unit);
    
    // Then add to new node
    this.addToNode(unit.currentNodeId, 'units', unit);
    
    console.log(`Unit ${unit.type} (ID: ${unit.id}) moved from node ${unit.previousNodeId} to ${unit.currentNodeId}`);
  }
  
  /**
   * Register a monster with the game state
   * @param {Monster} monster - The monster to register
   */
  registerMonster(monster) {
    // Add to monsters map
    this.monsters.set(monster.id, monster);
    
    // Update node contents
    this.addToNode(monster.currentNodeId, 'monsters', monster);
    
    console.log(`Monster (ID: ${monster.id}) registered at node ${monster.currentNodeId}`);
  }
  
  /**
   * Register a marker (fire, rubble, web) with the game state
   * @param {Object} marker - The marker to register
   */
  registerMarker(marker) {
    // Add to markers map
    this.markers.set(marker.id, marker);
    
    // Update node contents
    this.addToNode(marker.nodeId, 'markers', marker);
    
    console.log(`Marker ${marker.type} (ID: ${marker.id}) placed at node ${marker.nodeId}`);
    
    // If this is a fire or rubble marker, may affect victory points
    if (marker.type === 'fire' || marker.type === 'rubble') {
      this.checkVictoryConditions();
    }
  }
  
  /**
   * Unregister a marker (when removed)
   * @param {Object} marker - The marker to unregister
   */
  unregisterMarker(marker) {
    // Remove from markers map
    this.markers.delete(marker.id);
    
    // Update node contents
    this.removeFromNode(marker.nodeId, 'markers', marker);
    
    console.log(`Marker ${marker.type} (ID: ${marker.id}) removed from node ${marker.nodeId}`);
    
    // If this was a fire or rubble marker, may affect victory points
    if (marker.type === 'fire' || marker.type === 'rubble') {
      this.checkVictoryConditions();
    }
  }
  
  /**
   * Add an entity to a node's contents
   * @param {number} nodeId - The node ID
   * @param {string} category - Category ('units', 'monsters', 'markers')
   * @param {Object} entity - The entity to add
   */
  addToNode(nodeId, category, entity) {
    // Initialize node contents if not exists
    if (!this.nodeContents[nodeId]) {
      this.nodeContents[nodeId] = {
        units: [],
        monsters: [],
        markers: []
      };
    }
    
    // Add entity to the specified category
    this.nodeContents[nodeId][category].push(entity);
  }
  
  /**
   * Remove an entity from a node's contents
   * @param {number} nodeId - The node ID
   * @param {string} category - Category ('units', 'monsters', 'markers')
   * @param {Object} entity - The entity to remove
   */
  removeFromNode(nodeId, category, entity) {
    // Check if this node has been initialized
    if (!this.nodeContents[nodeId]) return;
    
    // Find and remove the entity from the category array
    const index = this.nodeContents[nodeId][category].findIndex(e => e.id === entity.id);
    
    if (index !== -1) {
      this.nodeContents[nodeId][category].splice(index, 1);
    }
  }
  
  /**
   * Handle turn change events
   * @param {Object} data - Turn change data
   */
  onTurnChanged(data) {
    this.currentPlayer = data.player;
    
    if (data.player === 'monster') {
      this.currentTurn = data.turn;
    }
    
    console.log(`Turn changed to ${data.player} player (Turn ${this.currentTurn})`);
    
    // Check wind direction for fire spread (once per complete turn)
    if (data.player === 'monster') {
      this.rollWindDirection();
    }
    
    // Check victory conditions at the start of each turn
    this.checkVictoryConditions();
  }
  
  /**
   * Handle combat resolution events
   * @param {Object} result - Combat result data
   */
  onCombatResolved(result) {
    // Award victory points based on combat results
    if (result.winner === 'monster') {
      // Award points for destroyed units
      if (result.unitDestroyed) {
        const pointValue = this.getUnitPointValue(result.defender);
        this.awardVictoryPoints('monster', pointValue);
      }
    } else if (result.winner === 'human') {
      // Humans get points for damaging the monster
      if (result.monsterDamaged) {
        this.awardVictoryPoints('human', result.damageAmount * 5);
      }
    }
    
    // Check victory conditions after combat
    this.checkVictoryConditions();
  }
  
  /**
   * Get victory point value for a unit
   * @param {Unit} unit - The unit to evaluate
   * @returns {number} Point value
   */
  getUnitPointValue(unit) {
    // Unit point values
    const pointValues = {
      'infantry': 10,
      'police': 8,
      'artillery': 15,
      'tank': 20,
      'helicopter': 25,
      'populace': 5,
      'firemen': 8,
      'fireboat': 12
    };
    
    return pointValues[unit.type] || 5; // Default 5 points if type not found
  }
  
  /**
   * Award victory points to a player
   * @param {string} player - The player ('monster' or 'human')
   * @param {number} points - Number of points to award
   */
  awardVictoryPoints(player, points) {
    this.victoryPoints[player] += points;
    
    console.log(`${player} player awarded ${points} victory points (total: ${this.victoryPoints[player]})`);
    
    // Emit event for UI to update
    this.scene.events.emit('victory-points-changed', {
      player: player,
      points: points,
      total: this.victoryPoints[player]
    });
    
    // Check if this triggered a victory condition
    this.checkVictoryConditions();
  }
  
  /**
   * Roll for wind direction for fire spread
   */
  rollWindDirection() {
    // Roll 1-6 for wind direction
    this.config.windDirection = Phaser.Math.Between(1, 6);
    
    console.log(`Wind direction changed to ${this.config.windDirection}`);
    
    // Emit event for fire spread
    this.scene.events.emit('wind-direction-changed', this.config.windDirection);
  }
  
  /**
   * Check if any victory conditions have been met
   * @returns {Object|null} Victory result or null if game continues
   */
  checkVictoryConditions() {
    // Check victory point threshold
    if (this.victoryPoints.monster >= this.config.victoryPointGoal) {
      return this.endGame('monster', 'victory-points');
    }
    
    // Check if monster is defeated
    if (this.monsters.size === 0) {
      return this.endGame('human', 'monster-defeated');
    }
    
    // Check if all humans are defeated
    if (this.getHumanUnitCount() === 0) {
      return this.endGame('monster', 'humans-defeated');
    }
    
    // Check max turns reached
    if (this.currentTurn > this.config.maxTurns) {
      // If max turns reached, winner is determined by victory points
      const winner = this.victoryPoints.monster > this.victoryPoints.human ? 'monster' : 'human';
      return this.endGame(winner, 'max-turns-reached');
    }
    
    // Game continues
    return null;
  }
  
  /**
   * Get count of human-controlled units
   * @returns {number} Number of human units
   */
  getHumanUnitCount() {
    let count = 0;
    for (const unit of this.units.values()) {
      if (unit.faction === 'human') {
        count++;
      }
    }
    return count;
  }
  
  /**
   * End the game and transition to victory scene
   * @param {string} winner - The winning player ('monster' or 'human')
   * @param {string} condition - Victory condition that was met
   */
  endGame(winner, condition) {
    console.log(`Game over: ${winner} wins by ${condition}`);
    
    // Prepare victory data
    const victoryData = {
      winner: winner,
      condition: condition,
      victoryPoints: this.victoryPoints,
      turns: this.currentTurn
    };
    
    // Emit game over event
    this.scene.events.emit('game-over', victoryData);
    
    // Transition to victory scene
    this.scene.scene.start('VictoryScene', victoryData);
    
    return victoryData;
  }
  
  /**
   * Get units at a specific node
   * @param {number} nodeId - The node ID to check
   * @returns {Array} Array of units at this node
   */
  getUnitsAtNode(nodeId) {
    if (!this.nodeContents[nodeId]) return [];
    return this.nodeContents[nodeId].units;
  }
  
  /**
   * Get monsters at a specific node
   * @param {number} nodeId - The node ID to check
   * @returns {Array} Array of monsters at this node
   */
  getMonstersAtNode(nodeId) {
    if (!this.nodeContents[nodeId]) return [];
    return this.nodeContents[nodeId].monsters;
  }
  
  /**
   * Get markers at a specific node
   * @param {number} nodeId - The node ID to check
   * @param {string} [type] - Optional filter by marker type
   * @returns {Array} Array of markers at this node
   */
  getMarkersAtNode(nodeId, type) {
    if (!this.nodeContents[nodeId]) return [];
    
    if (type) {
      return this.nodeContents[nodeId].markers.filter(marker => marker.type === type);
    }
    
    return this.nodeContents[nodeId].markers;
  }
  
  /**
   * Check if a node has a specific marker type
   * @param {number} nodeId - The node ID to check
   * @param {string} markerType - The marker type to check for
   * @returns {boolean} True if the node has this marker type
   */
  hasMarker(nodeId, markerType) {
    const markers = this.getMarkersAtNode(nodeId);
    return markers.some(marker => marker.type === markerType);
  }
  
  /**
   * Serialize game state (for save/load)
   * @returns {Object} Serialized game state
   */
  serialize() {
    // Create a serializable representation of the game state
    return {
      currentTurn: this.currentTurn,
      currentPlayer: this.currentPlayer,
      victoryPoints: this.victoryPoints,
      config: this.config,
      
      // Serialize units
      units: Array.from(this.units.values()).map(unit => ({
        id: unit.id,
        type: unit.type,
        nodeId: unit.currentNodeId,
        stats: unit.stats,
        currentMovementPoints: unit.currentMovementPoints
      })),
      
      // Serialize monsters
      monsters: Array.from(this.monsters.values()).map(monster => ({
        id: monster.id,
        nodeId: monster.currentNodeId,
        strength: monster.strength,
        currentMovementPoints: monster.currentMovementPoints
      })),
      
      // Serialize markers
      markers: Array.from(this.markers.values()).map(marker => ({
        id: marker.id,
        type: marker.type,
        nodeId: marker.nodeId
      }))
    };
  }
  
  /**
   * Deserialize and load game state
   * @param {Object} data - Serialized game state
   */
  deserialize(data) {
    // Clear current state
    this.units.clear();
    this.monsters.clear();
    this.markers.clear();
    this.nodeContents = {};
    
    // Restore basic state
    this.currentTurn = data.currentTurn;
    this.currentPlayer = data.currentPlayer;
    this.victoryPoints = data.victoryPoints;
    this.config = data.config;
    
    // Recreate units (this would need coordination with scene to create actual unit objects)
    // This is a simplified version - actual implementation would need to create the game objects
    data.units.forEach(unitData => {
      // Placeholder for unit recreation - would need to call scene methods to create actual units
      console.log(`Would recreate unit: ${unitData.type} at node ${unitData.nodeId}`);
    });
    
    // Similar for monsters and markers
    data.monsters.forEach(monsterData => {
      console.log(`Would recreate monster at node ${monsterData.nodeId}`);
    });
    
    data.markers.forEach(markerData => {
      console.log(`Would recreate ${markerData.type} marker at node ${markerData.nodeId}`);
    });
    
    // Emit state loaded event
    this.scene.events.emit('game-state-loaded');
    
    console.log('Game state loaded');
  }
}

export default GameState;