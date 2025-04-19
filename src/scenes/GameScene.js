import MapManager from '../managers/MapManager.js';
import GameState from '../managers/GameState.js';
import TurnManager from '../managers/TurnManager.js';
import DataManager from '../managers/DataManager.js';
import CombatManager from '../managers/CombatManager.js';
import * as pathfinding from '../utils/pathfinding.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.selectedPosition = null;
    this.targetPosition = null;
    this.movementPoints = 5; // Default movement points
    this.selectedUnit = null;
    this.selectedMonster = null;
  }
  
  init(data) {
    // Store the selected scenario if provided
    this.scenarioId = data.scenarioId || 'learning';
  }
  
  preload() {
    console.log("GameScene loaded!");
    // Load the map image as a background
    this.load.image('map-bg', 'assets/images/board/original-map.png');
    
    // Load the Tiled map JSON
    this.load.json('sheboygan-map', 'assets/tilemaps/sheboygan_map.json');
    
    // Preload a marker image for positions
    this.load.image('marker', 'assets/images/ui/loading-bar.png'); // Placeholder image
    
    // Preload unit and monster sprites
    this.load.image('infantry', 'assets/images/units/infantry.png');
    this.load.image('police', 'assets/images/units/police.png');
    this.load.image('tank', 'assets/images/units/tank.png');
    this.load.image('helicopter', 'assets/images/units/helicopter.png');
    this.load.image('populace', 'assets/images/units/populace.png');
    this.load.image('firemen', 'assets/images/units/firemen.png');
    this.load.image('fireboat', 'assets/images/units/fireboat.png');
    this.load.image('artillery', 'assets/images/units/artillery.png');
    
    // Preload monster sprites
    this.load.image('creature_a', 'assets/images/units/creature_a.png');
    this.load.image('creature_b', 'assets/images/units/creature_b.png');
    this.load.image('creature_c', 'assets/images/units/creature_c.png');
    this.load.image('creature_d', 'assets/images/units/creature_d.png');
    this.load.image('creature_e', 'assets/images/units/creature_e.png');
    this.load.image('creature_f', 'assets/images/units/creature_f.png');
    
    // Preload marker sprites
    this.load.image('fire', 'assets/images/markers/fire.png');
    this.load.image('rubble', 'assets/images/markers/rubble.png');
    this.load.image('web', 'assets/images/markers/web.png');
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
    
    // Initialize the data manager first as other systems depend on it
    this.dataManager = new DataManager(this);
    
    // Initialize the game state manager
    this.gameState = new GameState(this);
    
    // Initialize the map manager
    this.mapManager = new MapManager(this);
    
    // Initialize the turn manager
    this.turnManager = new TurnManager(this, this.gameState);
    
    // Initialize the combat manager
    this.combatManager = new CombatManager(this, this.gameState, this.dataManager);
    
    // Initialize marker graphics
    this.markerGraphics = this.add.graphics();
    
    // Load game data
    this.loadGameData();
    
    // Add click handler for map interaction
    this.setupInputHandlers();
    
    // Add UI elements
    this.createUI();
  }
  
  /**
   * Load all game data using the data manager
   */
  loadGameData() {
    // Show loading message
    const loadingText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Loading game data...',
      {
        fontSize: '24px',
        fontStyle: 'bold',
        fill: '#FFF',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5, 0.5).setScrollFactor(0);
    
    // Start loading all data
    this.dataManager.loadAll()
      .then(() => {
        console.log('All game data loaded successfully');
        
        // Load the map data
        this.mapManager.loadMap('sheboygan-map');
        
        // Draw debug visuals for terrain
        this.mapManager.drawDebugTerrain(true);
        
        // Setup the game based on selected scenario
        this.setupGame(this.scenarioId);
        
        // Remove loading text
        loadingText.destroy();
      })
      .catch(error => {
        console.error('Error loading game data:', error);
        loadingText.setText('Error loading game data. Check console for details.');
      });
  }
  
  /**
   * Set up the game based on the selected scenario
   * @param {string} scenarioId - ID of the scenario to set up
   */
  setupGame(scenarioId) {
    console.log(`Setting up game with scenario: ${scenarioId}`);
    
    // Get scenario data
    const scenario = this.dataManager.getScenario(scenarioId);
    
    if (!scenario) {
      console.error(`Scenario ${scenarioId} not found`);
      return;
    }
    
    // Store current scenario
    this.scenario = scenario;
    
    // Create the monster
    // TODO: Move this to a proper monster creation method
    this.createMonster(scenario.monsterConfig);
    
    // Create units based on scenario
    // TODO: Move this to a proper unit creation method
    this.createUnits(scenario.units);
    
    // Start the game
    this.turnManager.startGame();
  }
  
  /**
   * Create the monster based on scenario configuration
   * @param {Object} monsterConfig - Configuration for the monster
   */
  createMonster(monsterConfig) {
    // Placeholder implementation
    console.log('Would create monster with config:', monsterConfig);
    
    // TODO: Implement actual monster creation with Monster class
    // For now, we'll just emit an event for testing
    this.events.emit('monster-created', {
      id: 'monster-1',
      type: 'monster',
      currentNodeId: 1, // Starting node ID
      config: monsterConfig
    });
  }
  
  /**
   * Create units based on scenario configuration
   * @param {Array} units - Array of unit configurations
   */
  createUnits(units) {
    // Placeholder implementation
    console.log('Would create units:', units);
    
    // TODO: Implement actual unit creation with Unit class
    // For now, we'll just emit an event for testing
    if (units && units.length > 0) {
      units.forEach((unit, index) => {
        this.events.emit('unit-created', {
          id: `unit-${index}`,
          type: unit.type,
          currentNodeId: unit.nodeId,
          faction: 'human',
          stats: this.dataManager.getUnitStats(unit.type)
        });
      });
    }
  }
  
  /**
   * Set up input handlers for map interaction
   */
  setupInputHandlers() {
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
      
      // If we're in a game state where we need to select units, check for units at this node
      const units = this.gameState.getUnitsAtNode(nearestNode.id);
      const monsters = this.gameState.getMonstersAtNode(nearestNode.id);
      
      // Basic unit selection logic - will be expanded based on turn phase
      if (units.length > 0 && this.turnManager.currentPhase === 'human') {
        // Select a human unit
        this.selectUnit(units[0]);
      } else if (monsters.length > 0 && this.turnManager.currentPhase === 'monster') {
        // Select the monster
        this.selectMonster(monsters[0]);
      } else if (this.selectedUnit || this.selectedMonster) {
        // If we have a selected unit already, try to move it
        if (this.selectedUnit && this.turnManager.currentPhase === 'human') {
          this.moveSelectedUnit(nearestNode.id);
        } else if (this.selectedMonster && this.turnManager.currentPhase === 'monster') {
          this.moveSelectedMonster(nearestNode.id);
        }
      }
      
      // Legacy pathfinding demo code
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
    
    // Add keyboard control for ending turn
    this.input.keyboard.on('keydown-E', () => {
      console.log('End turn key pressed');
      this.turnManager.endCurrentTurn();
    });
    
    // Add keyboard control for ending phase
    this.input.keyboard.on('keydown-P', () => {
      console.log('End phase key pressed');
      this.turnManager.endCurrentSubPhase();
    });
  }
  
  /**
   * Create UI elements for the game scene
   */
  createUI() {
    // Add text to display current movement points
    this.movementText = this.add.text(20, 20, `Movement Points: ${this.movementPoints}`, {
      fontSize: '24px',
      fontStyle: 'bold',
      fill: '#FFF',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 }
    });
    this.movementText.setScrollFactor(0); // Fix to camera
    
    // Add text to display current turn state
    this.turnText = this.add.text(
      this.cameras.main.width / 2,
      20,
      'TURN 1: MONSTER PLAYER',
      {
        fontSize: '24px',
        fontStyle: 'bold',
        fill: '#FFF',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5, 0).setScrollFactor(0);
    
    // Add instructions
    this.instructionsText = this.add.text(20, 60, 
      'Instructions:\n' +
      '- Click to select a starting position\n' +
      '- Click again to select a target position\n' +
      '- Third click resets the selections\n' +
      '- Up/Down arrows change movement points\n' +
      '- E key ends turn, P key ends phase', 
      {
        fontSize: '16px',
        fill: '#FFF',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    );
    this.instructionsText.setScrollFactor(0); // Fix to camera
    
    // Update turn display when turn changes
    this.events.on('turn-changed', this.updateTurnDisplay, this);
    this.events.on('sub-phase-changed', this.updateTurnDisplay, this);
  }
  
  /**
   * Update the turn display with current turn information
   */
  updateTurnDisplay() {
    if (this.turnText) {
      this.turnText.setText(this.turnManager.getTurnStateText());
      
      // Change color based on current player
      const textColor = this.turnManager.currentPhase === 'monster' ? '#FF0000' : '#00FF00';
      this.turnText.setColor(textColor);
    }
  }
  
  /**
   * Select a unit for movement/combat
   * @param {Unit} unit - The unit to select
   */
  selectUnit(unit) {
    // Clear any previous selection
    this.clearSelection();
    
    // Store the selected unit
    this.selectedUnit = unit;
    
    console.log(`Selected unit ${unit.type} (ID: ${unit.id})`);
    
    // Show movement range for selected unit
    if (this.turnManager.currentSubPhase === 'movement') {
      this.mapManager.showMovementRange(
        unit.currentNodeId,
        unit.currentMovementPoints || 0,
        unit
      );
    }
    
    // Emit unit selected event
    this.events.emit('unit-selected', unit);
  }
  
  /**
   * Select the monster for movement/combat/abilities
   * @param {Monster} monster - The monster to select
   */
  selectMonster(monster) {
    // Clear any previous selection
    this.clearSelection();
    
    // Store the selected monster
    this.selectedMonster = monster;
    
    console.log(`Selected monster (ID: ${monster.id})`);
    
    // Show movement range for selected monster
    if (this.turnManager.currentSubPhase === 'movement') {
      this.mapManager.showMovementRange(
        monster.currentNodeId,
        monster.currentMovementPoints || 0,
        monster
      );
    }
    
    // Emit monster selected event
    this.events.emit('monster-selected', monster);
  }
  
  /**
   * Clear the current unit/monster selection
   */
  clearSelection() {
    this.selectedUnit = null;
    this.selectedMonster = null;
    
    // Clear movement range display
    if (this.mapManager.rangeGraphics) {
      this.mapManager.rangeGraphics.clear();
    }
  }
  
  /**
   * Move the selected unit to a target node
   * @param {number} targetNodeId - ID of the target node
   */
  moveSelectedUnit(targetNodeId) {
    if (!this.selectedUnit) return;
    
    if (this.turnManager.currentSubPhase !== 'movement') {
      console.log(`Cannot move during ${this.turnManager.currentSubPhase} phase`);
      return;
    }
    
    // Check if the unit can move
    if (this.selectedUnit.currentMovementPoints <= 0) {
      console.log('Unit has no movement points remaining');
      return;
    }
    
    // TODO: Implement actual unit movement
    console.log(`Would move unit ${this.selectedUnit.id} to node ${targetNodeId}`);
    
    // Emit movement completed event
    this.events.emit('movement-completed');
  }
  
  /**
   * Move the selected monster to a target node
   * @param {number} targetNodeId - ID of the target node
   */
  moveSelectedMonster(targetNodeId) {
    if (!this.selectedMonster) return;
    
    if (this.turnManager.currentSubPhase !== 'movement') {
      console.log(`Cannot move during ${this.turnManager.currentSubPhase} phase`);
      return;
    }
    
    // Check if the monster can move
    if (this.selectedMonster.currentMovementPoints <= 0) {
      console.log('Monster has no movement points remaining');
      return;
    }
    
    // TODO: Implement actual monster movement
    console.log(`Would move monster ${this.selectedMonster.id} to node ${targetNodeId}`);
    
    // Emit movement completed event
    this.events.emit('movement-completed');
  }
  
  /**
   * Initiate combat between attacker and defender
   * @param {Unit|Monster} attacker - The attacking unit
   * @param {Unit|Monster} defender - The defending unit
   */
  initiateCombat(attacker, defender) {
    if (this.turnManager.currentSubPhase !== 'combat') {
      console.log(`Cannot initiate combat during ${this.turnManager.currentSubPhase} phase`);
      return;
    }
    
    console.log(`Initiating combat between ${attacker.constructor.name} and ${defender.constructor.name}`);
    
    // Emit combat initiated event
    this.events.emit('combat-initiated', {
      attacker: attacker,
      defender: defender
    });
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