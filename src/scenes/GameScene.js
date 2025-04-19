import MapManager from '../managers/MapManager.js';
import GameState from '../managers/GameState.js';
import TurnManager from '../managers/TurnManager.js';
import DataManager from '../managers/DataManager.js';
import CombatManager from '../managers/CombatManager.js';
import FireManager from '../managers/FireManager.js';
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
    // Store the setup data from SetupScene or use defaults
    this.setupData = data || {};
    this.scenarioId = this.setupData.scenario ? this.setupData.scenario.id : 'learning';
    
    // Log the setup data
    console.log('Game initialized with setup:', this.setupData);
  }
  
  preload() {
    console.log("GameScene loaded!");
    // Load the map image as a background
    this.load.image('map-bg', 'assets/images/board/original-map-upscaled.png');
    
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
    
    // Initialize the fire manager
    this.fireManager = new FireManager(this, this.gameState, this.mapManager);
    
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
        this.mapManager.loadMap('sheboygan-map', 'mapNodes');
        
        // Always show movement nodes
        this.mapManager.drawDebugNodes();
        
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
    
    // If we have setup data, use that
    if (this.setupData && this.setupData.scenario) {
      console.log('Using custom setup data from SetupScene');
      
      // Store current scenario
      this.scenario = this.setupData.scenario;
      
      // Create the monster with custom configuration
      this.createMonster(this.setupData.monsterConfig || this.scenario.monsterConfig);
      
      // Create units with custom selections
      this.createUnits(this.setupData.humanUnits || this.scenario.units);
    } 
    // Otherwise use the predefined scenario
    else {
      // Get scenario data
      const scenario = this.dataManager.getScenario(scenarioId);
      
      if (!scenario) {
        console.error(`Scenario ${scenarioId} not found`);
        return;
      }
      
      // Store current scenario
      this.scenario = scenario;
      
      // Create the monster
      this.createMonster(scenario.monsterConfig);
      
      // Create units based on scenario
      this.createUnits(scenario.units);
    }
    
    // Update UI components for this scenario
    if (this.monsterDashboard) {
      // If this is the setup phase, configure the dashboard for setup
      if (this.scenario && this.scenario.id === 'setup') {
        this.monsterDashboard.config.isSetupPhase = true;
        // Show the dashboard for setup
        this.monsterDashboard.show();
      } else {
        this.monsterDashboard.config.isSetupPhase = false;
      }
      
      // Update dashboard with initial strength points
      if (this.scenario && this.scenario.initialStrengthPoints) {
        this.monsterDashboard.config.initialStrengthPoints = this.scenario.initialStrengthPoints;
      }
    }
    
    // Start the game
    this.turnManager.startGame();
  }
  
  /**
   * Create the monster based on configuration
   * @param {Object} monsterConfig - Configuration for the monster
   */
  createMonster(monsterConfig) {
    console.log('Creating monster with config:', monsterConfig);
    
    // Use setup data if available
    let config = monsterConfig;
    let startNodeId = 1; // Default entry node
    
    // If we have setup data, use the custom monster configuration
    if (this.setupData && this.setupData.monsterConfig) {
      config = this.setupData.monsterConfig;
      
      // Determine entry node based on selected edge
      if (this.setupData.monsterEntryEdge) {
        const edge = this.setupData.monsterEntryEdge;
        
        // Find a suitable entry node on the selected edge
        // This would be done better with actual map data
        switch (edge) {
          case 'north':
            startNodeId = 2; // Example node on north edge
            break;
          case 'east':
            startNodeId = 15; // Example node on east edge
            break;
          case 'south':
            startNodeId = 25; // Example node on south edge
            break;
          case 'west':
            startNodeId = 8; // Example node on west edge
            break;
        }
      }
      
      console.log(`Monster will enter from ${this.setupData.monsterEntryEdge} edge at node ${startNodeId}`);
    }
    
    // TODO: Create actual Monster instance
    // For now, we'll just emit an event for testing
    this.events.emit('monster-created', {
      id: 'monster-1',
      type: 'monster',
      currentNodeId: startNodeId,
      config: config,
      // Include the full monster config for stat tracking
      attack: config.attack,
      defense: config.defense,
      buildingDestruction: config.buildingDestruction,
      movement: config.movement,
      specialAbilities: config.specialAbilities || [],
      variant: config.variant || 'a'
    });
  }
  
  /**
   * Create units based on configuration
   * @param {Array} units - Array of unit configurations
   */
  createUnits(units) {
    console.log('Creating units with configuration:', units);
    
    // Use setup data if available
    let unitsToCreate = units || [];
    
    // If we have custom units from setup
    if (this.setupData && this.setupData.humanUnits && this.setupData.humanUnits.length > 0) {
      // Replace with the custom units
      unitsToCreate = [];
      
      // Convert purchased units into placeable units
      this.setupData.humanUnits.forEach(purchasedUnit => {
        // Skip if quantity is 0
        if (!purchasedUnit.quantity || purchasedUnit.quantity <= 0) return;
        
        // Create the specified quantity of each unit type
        for (let i = 0; i < purchasedUnit.quantity; i++) {
          // Find a valid placement location
          // In a real implementation, this would use the placement data
          const nodeId = this.getRandomValidNodeForUnit(purchasedUnit.type);
          
          unitsToCreate.push({
            type: purchasedUnit.type,
            nodeId: nodeId
          });
        }
      });
      
      console.log('Units after setup conversion:', unitsToCreate);
    }
    
    // Create all units
    if (unitsToCreate && unitsToCreate.length > 0) {
      unitsToCreate.forEach((unit, index) => {
        // Get stats for this unit type
        const stats = this.dataManager.getUnitStats(unit.type);
        
        // Emit unit creation event
        this.events.emit('unit-created', {
          id: `unit-${unit.type}-${index}`,
          type: unit.type,
          currentNodeId: unit.nodeId,
          faction: 'human',
          stats: stats,
          currentMovementPoints: stats ? stats.movement : 0
        });
      });
    }
  }
  
  /**
   * Find a valid node for placing a unit
   * @param {string} unitType - The type of unit to place
   * @returns {number} A valid node ID
   */
  getRandomValidNodeForUnit(unitType) {
    // This is a simplified implementation
    // In a real game, we would:
    // 1. Check for nodes that aren't adjacent to monster entry edge
    // 2. Check for valid terrain (e.g., no rivers for land units)
    // 3. Check stacking limits
    // 4. Place populace units on populace symbol boxes
    
    // For now, just return some valid node IDs based on unit type
    if (unitType === 'fireboat') {
      // Fireboat must be in river
      return 30; // Example river node
    } else if (unitType === 'populace') {
      // Populace should be in population centers
      return 12 + Math.floor(Math.random() * 5); // Example populace nodes
    } else {
      // Other units can go anywhere valid
      // Avoid nodes 1-5 which might be near monster entry
      return 10 + Math.floor(Math.random() * 20);
    }
  }
  
  /**
   * Set up input handlers for map interaction
   */
  setupInputHandlers() {
    // Listen for monster setup completion
    this.events.on('monster-setup-complete', this.onMonsterSetupComplete, this);
    
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
      
      // Get markers at this node (for fire control or monster abilities)
      const fireMarkers = this.gameState.getMarkersAtNode(nearestNode.id, 'fire');
      
      // Basic unit selection logic - will be expanded based on turn phase
      if (units.length > 0 && this.turnManager.currentPhase === 'human') {
        // Select a human unit
        this.selectUnit(units[0]);
      } else if (monsters.length > 0 && this.turnManager.currentPhase === 'monster') {
        // Select the monster
        this.selectMonster(monsters[0]);
      } else if (this.selectedUnit || this.selectedMonster) {
        // If we have a selected unit and we're in the fire control phase
        if (this.selectedUnit && 
            this.turnManager.currentPhase === 'human' && 
            this.turnManager.currentSubPhase === 'fire-control' &&
            ['firemen', 'fireboat'].includes(this.selectedUnit.type) && 
            fireMarkers.length > 0) {
          // Handle fire control
          this.handleFireControl(nearestNode.id);
        } 
        // If we have a selected unit in movement phase
        else if (this.selectedUnit && 
                this.turnManager.currentPhase === 'human' && 
                this.turnManager.currentSubPhase === 'movement') {
          this.moveSelectedUnit(nearestNode.id);
        } 
        // If monster using fire breathing ability
        else if (this.selectedMonster && 
                this.turnManager.currentPhase === 'monster' && 
                this.turnManager.currentSubPhase === 'destruction' &&
                this.selectedMonster.specialAbilities && 
                this.selectedMonster.specialAbilities.includes('fireBreathing')) {
          // Check if we're trying to use the fire breathing ability
          const sourceNode = this.mapManager.getNode(this.selectedMonster.currentNodeId);
          if (sourceNode && sourceNode.adjacentNodes.includes(nearestNode.id)) {
            // Start fire at the target node
            this.events.emit('fire-started', {
              nodeId: nearestNode.id,
              stage: 1
            });
          }
        }
        // Regular monster movement
        else if (this.selectedMonster && 
                this.turnManager.currentPhase === 'monster' && 
                this.turnManager.currentSubPhase === 'movement') {
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
    // Import UI components
    import('../ui/TurnIndicator.js').then(module => {
      const TurnIndicator = module.default;
      // Create turn indicator at top center
      this.turnIndicator = new TurnIndicator(
        this,
        this.cameras.main.width / 2,
        10,
        this.turnManager
      );
    }).catch(error => console.error("Error loading TurnIndicator:", error));
    
    import('../ui/UnitPanel.js').then(module => {
      const UnitPanel = module.default;
      // Create unit panel at bottom right
      this.unitPanel = new UnitPanel(
        this,
        this.cameras.main.width - 230,
        this.cameras.main.height - 330
      );
    }).catch(error => console.error("Error loading UnitPanel:", error));
    
    import('../ui/MonsterDashboard.js').then(module => {
      const MonsterDashboard = module.default;
      // Create monster dashboard (hidden initially)
      this.monsterDashboard = new MonsterDashboard(
        this,
        this.cameras.main.width / 2 - 150,
        this.cameras.main.height / 2 - 200,
        {
          isSetupPhase: false  // Will be set to true during setup phase
        }
      );
    }).catch(error => console.error("Error loading MonsterDashboard:", error));
    
    // Add movement points display (temporary, will be removed when movement system is complete)
    this.movementText = this.add.text(20, 20, `Movement Points: ${this.movementPoints}`, {
      fontSize: '18px',
      fill: '#FFF',
      backgroundColor: '#00000088',
      padding: { x: 10, y: 5 }
    });
    this.movementText.setScrollFactor(0); // Fix to camera
    
    // Add instructions (temporary, will be removed or moved to a help panel)
    this.instructionsText = this.add.text(20, 60, 
      'Instructions:\n' +
      '- Click to select a starting position\n' +
      '- Click again to select a target position\n' +
      '- Third click resets the selections\n' +
      '- Up/Down arrows change movement points', 
      {
        fontSize: '14px',
        fill: '#FFF',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    );
    this.instructionsText.setScrollFactor(0); // Fix to camera
    
    // Add a fire stats display in the corner
    this.fireStatsText = this.add.text(
      this.cameras.main.width - 20,
      20,
      'Fire Stats: None',
      {
        fontSize: '14px',
        fill: '#FF5500',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(1, 0).setScrollFactor(0);
    
    // Add wind direction indicator
    if (this.fireManager) {
      this.windIndicator = this.fireManager.createWindIndicator(
        this.cameras.main.width - 50,
        this.cameras.main.height - 50
      );
      this.windIndicator.setScrollFactor(0);
    }
    
    // Add toggle button for monster dashboard
    this.monsterDashboardButton = this.add.rectangle(
      80, this.cameras.main.height - 30,
      150, 30,
      0x555555, 1
    );
    this.monsterDashboardButton.setScrollFactor(0);
    this.monsterDashboardButton.setInteractive({ useHandCursor: true });
    this.monsterDashboardButton.on('pointerdown', () => {
      this.events.emit('show-monster-dashboard');
    });
    
    // Button text
    this.monsterDashboardButtonText = this.add.text(
      80, this.cameras.main.height - 30,
      'Monster Dashboard',
      {
        fontSize: '14px',
        fill: '#FFFFFF'
      }
    ).setOrigin(0.5, 0.5).setScrollFactor(0);
    
    // Update fire stats display when fire changes
    this.events.on('marker-placed', this.updateFireStats, this);
    this.events.on('marker-removed', this.updateFireStats, this);
    this.events.on('fire-intensity-changed', this.updateFireStats, this);
    this.events.on('wind-direction-changed', this.updateFireStats, this);
    
    // Handle window resize
    this.scale.on('resize', this.resizeUI, this);
  }
  
  /**
   * Update the fire statistics display
   */
  updateFireStats() {
    if (this.fireStatsText && this.fireManager) {
      const stats = this.fireManager.getFireStats();
      
      if (stats.total === 0) {
        this.fireStatsText.setText('Fire Stats: None');
      } else {
        this.fireStatsText.setText(
          `Fire Stats: ${stats.total} total\n` +
          `Stage 1: ${stats.stage1}, Stage 2: ${stats.stage2}, Stage 3: ${stats.stage3}\n` +
          `Wind Direction: ${stats.windDirection}`
        );
      }
    }
  }
  
  /**
   * Update the turn display with current turn information
   */
  updateTurnDisplay() {
    // For backward compatibility - the TurnIndicator now handles this
    // This method is kept for any code that might still call it
  }
  
  /**
   * Resize UI elements when window size changes
   * @param {Phaser.Scale.ScaleManager} scaleManager - The scale manager
   * @param {number} gameSize - New game size
   */
  resizeUI(scaleManager, gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    
    // Reposition TurnIndicator
    if (this.turnIndicator) {
      this.turnIndicator.resize(width, height);
    }
    
    // Reposition UnitPanel
    if (this.unitPanel) {
      this.unitPanel.reposition(width - 230, height - 330);
    }
    
    // Reposition MonsterDashboard
    if (this.monsterDashboard) {
      this.monsterDashboard.resize(width, height);
    }
    
    // Reposition fire stats text
    if (this.fireStatsText) {
      this.fireStatsText.setPosition(width - 20, 20);
    }
    
    // Reposition wind indicator
    if (this.windIndicator) {
      this.windIndicator.setPosition(width - 50, height - 50);
    }
    
    // Reposition monster dashboard button
    if (this.monsterDashboardButton && this.monsterDashboardButtonText) {
      this.monsterDashboardButton.setPosition(80, height - 30);
      this.monsterDashboardButtonText.setPosition(80, height - 30);
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
   * Start a fire at a specific node
   * @param {number} nodeId - The ID of the node to start fire at
   * @param {number} intensity - Initial fire intensity (1-3)
   */
  startFire(nodeId, intensity = 1) {
    console.log(`Starting fire at node ${nodeId} with intensity ${intensity}`);
    
    // Use the fire manager to create a fire
    this.fireManager.createFireMarker(nodeId, intensity);
  }
  
  /**
   * Attempt to extinguish a fire
   * @param {number} nodeId - The ID of the node with fire
   * @param {Object} unit - The unit performing the action
   * @returns {boolean} Whether extinguish was successful
   */
  extinguishFire(nodeId, unit) {
    console.log(`Attempting to extinguish fire at node ${nodeId} with unit ${unit?.type || 'unknown'}`);
    
    // Determine base extinguish amount
    let amount = 1;
    
    // Only firemen and fireboats can extinguish fire
    if (unit && ['firemen', 'fireboat'].includes(unit.type)) {
      // Fireboats are more effective than firemen
      amount = unit.type === 'fireboat' ? 2 : 1;
      
      // Use the fire manager to handle extinguishing
      return this.fireManager.extinguishFire(nodeId, amount, unit);
    } else {
      console.log('Only firemen and fireboats can extinguish fires');
      return false;
    }
  }
  
  /**
   * Handle the fire control phase
   * @param {number} nodeId - The node to perform fire control on
   */
  handleFireControl(nodeId) {
    // Only allowed during fire-control phase
    if (this.turnManager.currentSubPhase !== 'fire-control') {
      console.log(`Cannot perform fire control during ${this.turnManager.currentSubPhase} phase`);
      return false;
    }
    
    // Need a selected unit capable of fire control
    if (!this.selectedUnit || !['firemen', 'fireboat'].includes(this.selectedUnit.type)) {
      console.log('No fire control unit selected');
      return false;
    }
    
    // Attempt to extinguish fire
    const success = this.extinguishFire(nodeId, this.selectedUnit);
    
    if (success) {
      // Consume a fire control action
      this.turnManager.consumeAction('fire-control');
      
      // Emit event
      this.events.emit('fire-control-completed', {
        unitId: this.selectedUnit.id,
        nodeId: nodeId,
        success: true
      });
    }
    
    return success;
  }
  
  /**
   * Debug utility to log adjacency information between nodes
   * @param {number} startNodeId - Starting node ID
   * @param {number} endNodeId - Target node ID
   */
  /**
   * Handle monster setup completion event
   * @param {Object} config - Monster configuration from setup
   */
  onMonsterSetupComplete(config) {
    console.log("Monster setup completed with config:", config);
    
    // Create the monster with the provided configuration
    if (config.strengths && config.specialAbilities) {
      // Find an entry point for the monster
      // For simplicity, use a predefined entry node or the first node
      const entryNodeId = this.scenario.monsterEntryPoint || 1;
      
      // Get the node coordinates
      const entryNode = this.mapManager.getNode(entryNodeId);
      if (!entryNode) {
        console.error(`Invalid entry node ID: ${entryNodeId}`);
        return;
      }
      
      // Create a monster instance with the configuration
      const monsterConfig = {
        ...config,
        // Add any additional config from scenario
        variant: this.scenario.monsterVariant || 'a'
      };
      
      // Use the Monster class to create a monster
      import('../entities/Monster.js').then(module => {
        const Monster = module.default;
        const monster = new Monster(
          this,
          entryNode.x,
          entryNode.y,
          entryNodeId,
          monsterConfig
        );
        
        // Store the monster in the game state
        this.gameState.addMonster(monster);
        
        // Emit event that monster has been created
        this.events.emit('monster-created', monster);
        
        // Proceed to the first turn
        this.turnManager.startGame();
      }).catch(error => console.error("Error creating monster:", error));
    }
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