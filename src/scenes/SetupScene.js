/**
 * SetupScene.js - Handles game setup based on rulebook
 */
import DataManager from '../managers/DataManager.js';

class SetupScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SetupScene' });
    
    // Setup state tracking
    this.setupState = {
      scenario: null,
      monsterConfig: {
        attack: 0,
        defense: 0, 
        buildingDestruction: 0,
        movement: 0,
        specialAbilities: [],
        variant: 'a'
      },
      monsterEntryEdge: null, // north, east, south, west
      humanUnits: [], // [{type, quantity}, ...]
      unitPlacements: {}, // {nodeId: [{type, id}, ...], ...}
    };
    
    // Initial strength points from scenario
    this.initialPoints = {
      monster: 0,
      human: 0
    };
    
    // Current setup phase
    this.currentPhase = 'monster-creation';
    // Phases: monster-creation -> monster-edge -> unit-purchase -> unit-placement
  }

  preload() {
    // Load UI assets
    this.load.image('button', 'assets/images/ui/loading-bar.png'); // Placeholder
    
    // Load map for unit placement
    this.load.image('map-bg', 'assets/images/board/original-map-upscaled.png');
    
    // Load monster and unit sprites
    this.load.image('creature_a', 'assets/images/units/creature_a.png');
    this.load.image('infantry', 'assets/images/units/infantry.png');
    this.load.image('police', 'assets/images/units/police.png');
    this.load.image('tank', 'assets/images/units/tank.png');
  }

  create() {
    // Initialize data manager
    this.dataManager = new DataManager(this);
    
    // Load game data
    this.loadGameData();
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
    ).setOrigin(0.5, 0.5);
    
    // Start loading all data
    this.dataManager.loadAll()
      .then(() => {
        console.log('All game data loaded successfully');
        loadingText.destroy();
        
        // Get scenario from registry (set by MainMenuScene)
        this.getScenarioFromRegistry();
        
        // Go straight to monster creation
        this.showMonsterCreation();
      })
      .catch(error => {
        console.error('Error loading game data:', error);
        loadingText.setText('Error loading game data. Check console for details.');
      });
  }
  
  /**
   * Get the selected scenario from the registry
   */
  getScenarioFromRegistry() {
    // Get scenario from registry (set by MainMenuScene)
    const scenario = this.registry.get('scenario');
    
    if (!scenario) {
      console.error('No scenario found in registry!');
      return;
    }
    
    console.log(`Using scenario from MainMenuScene: ${scenario.id}`);
    
    // Set scenario in setup state
    this.setupState.scenario = scenario;
    
    // Set initial points based on scenario
    this.initialPoints.monster = scenario.monsterPoints;
    this.initialPoints.human = scenario.humanPoints;
    
    console.log(`Monster points: ${this.initialPoints.monster}`);
    console.log(`Human points: ${this.initialPoints.human}`);
  }

  
  /**
   * Show monster creation screen
   */
  showMonsterCreation() {
    this.currentPhase = 'monster-creation';
    this.clearScreen();
    
    // Header
    this.createHeader('Create Your Monster');
    
    // Instructions based on rulebook
    this.add.text(
      this.cameras.main.width / 2,
      100,
      'Allocate your Initial Strength Points to determine your monster\'s abilities.',
      { fontSize: '18px', fill: '#FFFFFF' }
    ).setOrigin(0.5);
    
    // Points display
    const pointsUsed = 
      this.setupState.monsterConfig.attack + 
      this.setupState.monsterConfig.defense + 
      this.setupState.monsterConfig.buildingDestruction + 
      this.setupState.monsterConfig.movement +
      this.getSpecialAbilitiesPoints();
    
    this.pointsText = this.add.text(
      this.cameras.main.width / 2,
      130,
      `Points: ${pointsUsed} / ${this.initialPoints.monster}`,
      { fontSize: '20px', fill: '#FFFFFF' }
    ).setOrigin(0.5);
    
    // Monster stat allocation panel
    this.createMonsterStatsPanel();
    
    // Special abilities panel
    this.createSpecialAbilitiesPanel();
    
    // Monster appearance
    this.createMonsterAppearancePanel();
    
    // Notes from rulebook
    this.add.text(
      this.cameras.main.width / 2,
      550,
      'Note: At least 1/4 of points must be spent on special abilities.\nMaximum defense strength is 15.',
      { fontSize: '14px', fill: '#FFAA00', align: 'center' }
    ).setOrigin(0.5);
    
    // Continue button
    this.createContinueButton(() => {
      // Validate monster creation
      if (!this.validateMonsterCreation()) {
        return;
      }
      
      this.showMonsterEntrySelection();
    });
    
    // Back button
    this.createBackButton(() => {
      this.scene.start('MainMenuScene');
    });
  }
  
  /**
   * Create the monster stats allocation panel
   */
  createMonsterStatsPanel() {
    const panelX = 150;
    const panelY = 180;
    const panelWidth = 300;
    const panelHeight = 250;
    
    // Background
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x222222)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xFFFFFF);
    
    // Title
    this.add.text(panelX + panelWidth/2, panelY + 15, 'Monster Strengths', 
                { fontSize: '18px', fill: '#FFFFFF' })
      .setOrigin(0.5);
    
    // Create sliders for each stat
    const stats = [
      { name: 'Attack Strength', key: 'attack', description: 'Used in attacks against human units' },
      { name: 'Defense Strength', key: 'defense', description: 'Monster dies when reduced to 0' },
      { name: 'Building Destruction', key: 'buildingDestruction', description: 'Used to destroy buildings' },
      { name: 'Movement Allowance', key: 'movement', description: 'How far monster can move each turn' }
    ];
    
    let y = panelY + 50;
    stats.forEach(stat => {
      // Stat name
      this.add.text(panelX + 20, y, stat.name, { fontSize: '16px', fill: '#FFFFFF' });
      
      // Value display
      const valueText = this.add.text(
        panelX + panelWidth - 50, 
        y, 
        this.setupState.monsterConfig[stat.key].toString(), 
        { fontSize: '16px', fill: '#AAFFAA' }
      ).setName(`value_${stat.key}`);
      
      // Value controls
      const decrement = this.add.text(panelX + panelWidth - 80, y, '-', 
                                   { fontSize: '20px', fill: '#FF8888' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          if (this.setupState.monsterConfig[stat.key] > 0) {
            this.setupState.monsterConfig[stat.key]--;
            this.updateMonsterStatsDisplay();
          }
        });
      
      const increment = this.add.text(panelX + panelWidth - 30, y, '+', 
                                   { fontSize: '20px', fill: '#88FF88' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.setupState.monsterConfig[stat.key]++;
          this.updateMonsterStatsDisplay();
        });
      
      // Description
      this.add.text(panelX + 20, y + 20, stat.description, 
                  { fontSize: '12px', fill: '#AAAAAA' });
      
      y += 50;
    });
  }
  
  /**
   * Create special abilities selection panel
   */
  createSpecialAbilitiesPanel() {
    const panelX = 480;
    const panelY = 180;
    const panelWidth = 350;
    const panelHeight = 350;
    
    // Background
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x222222)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xFFFFFF);
    
    // Title
    this.add.text(panelX + panelWidth/2, panelY + 15, 'Special Abilities', 
                { fontSize: '18px', fill: '#FFFFFF' })
      .setOrigin(0.5);
    
    // Special ability points display
    this.specialPointsText = this.add.text(
      panelX + panelWidth/2, 
      panelY + 35,
      `Points spent on abilities: ${this.getSpecialAbilitiesPoints()}`,
      { fontSize: '14px', fill: '#AAFFAA' }
    ).setOrigin(0.5);
    
    // Minimum required
    const minRequired = Math.ceil(this.initialPoints.monster * 0.25);
    this.add.text(
      panelX + panelWidth/2, 
      panelY + 55,
      `(Minimum required: ${minRequired})`,
      { fontSize: '14px', fill: '#FFAAAA' }
    ).setOrigin(0.5);
    
    // Create checkboxes for abilities
    const abilities = [
      { name: 'Flame Immunity', key: 'flameImmunity', cost: 2, desc: 'Move through fire' },
      { name: 'Fire Breathing', key: 'fireBreathing', cost: 8, desc: 'Start fires in adjacent boxes' },
      { name: 'Lightning Throwing', key: 'lightningThrowing', cost: 6, desc: 'Attack at range 3' },
      { name: 'Great Height', key: 'greatHeight', cost: 5, desc: 'Crush box when killed' },
      { name: 'Web Spinning', key: 'webSpinning', cost: 5, desc: 'Create impassable webs' },
      { name: 'Fear Immobilization', key: 'fearImmobilization', cost: 4, desc: 'Immobilize units with fear' },
      { name: 'Blinding Light', key: 'blindingLight', cost: 4, desc: 'Twice per game, cannot be attacked' },
      { name: 'Jumping', key: 'jumpingOverBuildings', cost: 3, desc: 'Jump over adjacent boxes' },
      { name: 'Radiation', key: 'radiation', cost: 7, desc: 'Units must attack separately' },
      { name: 'Mind Control', key: 'mindControl', cost: 6, desc: 'Control one human unit' },
      { name: 'Flying', key: 'flying', cost: 8, desc: 'Move over any terrain/units' }
    ];
    
    // Layout in two columns
    const col1X = panelX + 20;
    const col2X = panelX + panelWidth/2 + 20;
    let col1Y = panelY + 80;
    let col2Y = panelY + 80;
    
    abilities.forEach((ability, index) => {
      const x = index < 6 ? col1X : col2X;
      const y = index < 6 ? col1Y : col2Y;
      
      // Checkbox
      const checkbox = this.add.rectangle(x, y, 16, 16, 0x333333)
        .setStrokeStyle(1, 0xFFFFFF)
        .setOrigin(0)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.toggleSpecialAbility(ability.key);
        });
      
      // If already selected, fill the checkbox
      if (this.setupState.monsterConfig.specialAbilities.includes(ability.key)) {
        checkbox.setFillStyle(0x00FF00);
      }
      
      // Ability name and cost
      this.add.text(x + 25, y, `${ability.name} (${ability.cost})`, 
                  { fontSize: '14px', fill: '#FFFFFF' });
      
      // Description
      this.add.text(x + 25, y + 15, ability.desc, 
                  { fontSize: '12px', fill: '#AAAAAA' });
      
      // Update Y position
      if (index < 6) {
        col1Y += 40;
      } else {
        col2Y += 40;
      }
    });
  }
  
  /**
   * Create monster appearance selection panel
   */
  createMonsterAppearancePanel() {
    const panelX = 150;
    const panelY = 450;
    const panelWidth = 680;
    const panelHeight = 80;
    
    // Background
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x222222)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xFFFFFF);
    
    // Title
    this.add.text(panelX + 10, panelY + 10, 'Monster Appearance:', 
                { fontSize: '16px', fill: '#FFFFFF' });
    
    // Monster variants
    const variants = ['a', 'b', 'c', 'd', 'e', 'f'];
    let x = panelX + 180;
    
    variants.forEach(variant => {
      const sprite = this.add.sprite(x, panelY + 40, `creature_${variant}`)
        .setScale(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.setupState.monsterConfig.variant = variant;
          this.updateSelectedVariant();
        });
      
      // Highlight selected variant
      if (variant === this.setupState.monsterConfig.variant) {
        this.add.circle(x, panelY + 40, 25)
          .setStrokeStyle(2, 0xFFFF00)
          .setName(`highlight_${variant}`);
      }
      
      x += 80;
    });
  }
  
  /**
   * Show monster entry edge selection screen
   */
  showMonsterEntrySelection() {
    this.currentPhase = 'monster-edge';
    this.clearScreen();
    
    // Header
    this.createHeader('Select Monster Entry Edge');
    
    // Instructions based on rulebook
    this.add.text(
      this.cameras.main.width / 2,
      100,
      'Select which map edge your monster will enter from.\nThe Human Player will then place units without knowing your choice.',
      { fontSize: '18px', fill: '#FFFFFF', align: 'center' }
    ).setOrigin(0.5);
    
    // Map visualization
    const mapX = this.cameras.main.width / 2;
    const mapY = this.cameras.main.height / 2;
    const mapWidth = 400;
    const mapHeight = 300;
    
    // Map outline
    this.add.rectangle(mapX - mapWidth/2, mapY - mapHeight/2, mapWidth, mapHeight, 0x333333)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xFFFFFF);
    
    // Edge selection buttons
    const edgeWidth = 30;
    
    // North edge
    const northEdge = this.add.rectangle(
      mapX - mapWidth/2, 
      mapY - mapHeight/2, 
      mapWidth, 
      edgeWidth, 
      0x0000FF, 
      0.6
    ).setOrigin(0, 0)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', () => this.selectMonsterEdge('north'));
    
    // East edge
    const eastEdge = this.add.rectangle(
      mapX + mapWidth/2 - edgeWidth, 
      mapY - mapHeight/2, 
      edgeWidth, 
      mapHeight, 
      0x00FF00, 
      0.6
    ).setOrigin(0, 0)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', () => this.selectMonsterEdge('east'));
    
    // South edge
    const southEdge = this.add.rectangle(
      mapX - mapWidth/2, 
      mapY + mapHeight/2 - edgeWidth, 
      mapWidth, 
      edgeWidth, 
      0xFF0000, 
      0.6
    ).setOrigin(0, 0)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', () => this.selectMonsterEdge('south'));
    
    // West edge
    const westEdge = this.add.rectangle(
      mapX - mapWidth/2, 
      mapY - mapHeight/2, 
      edgeWidth, 
      mapHeight, 
      0xFFFF00, 
      0.6
    ).setOrigin(0, 0)
     .setInteractive({ useHandCursor: true })
     .on('pointerdown', () => this.selectMonsterEdge('west'));
    
    // Label the city
    this.add.text(mapX, mapY, 'Sheboygan', { fontSize: '24px', fill: '#FFFFFF' })
      .setOrigin(0.5);
    
    // Selected edge text
    this.edgeText = this.add.text(
      this.cameras.main.width / 2,
      mapY + mapHeight/2 + 50,
      this.setupState.monsterEntryEdge ? 
        `Selected: ${this.setupState.monsterEntryEdge.toUpperCase()} edge` : 
        'No edge selected',
      { fontSize: '18px', fill: '#AAAAAA' }
    ).setOrigin(0.5);
    
    // Continue button
    this.continueButton = this.createContinueButton(() => {
      if (!this.setupState.monsterEntryEdge) {
        this.showWarningMessage('You must select an entry edge!');
        return;
      }
      
      this.showUnitPurchase();
    });
    
    // If no edge selected yet, disable continue button
    if (!this.setupState.monsterEntryEdge) {
      this.continueButton.setAlpha(0.5);
    }
    
    // Back button
    this.createBackButton(() => {
      this.showMonsterCreation();
    });
  }
  
  /**
   * Select a monster entry edge
   */
  selectMonsterEdge(edge) {
    this.setupState.monsterEntryEdge = edge;
    
    // Update edge text
    if (this.edgeText) {
      this.edgeText.setText(`Selected: ${edge.toUpperCase()} edge`);
      this.edgeText.setColor('#FFFFFF');
    }
    
    // Enable continue button
    if (this.continueButton) {
      this.continueButton.setAlpha(1);
    }
  }
  
  /**
   * Show unit purchase screen for human player
   */
  showUnitPurchase() {
    this.currentPhase = 'unit-purchase';
    this.clearScreen();
    
    // Header
    this.createHeader('Purchase Human Units');
    
    // Instructions based on rulebook
    this.add.text(
      this.cameras.main.width / 2,
      100,
      'Spend your Initial Strength Points to purchase units.\nPopulace units are free.\nUnits cost equal to their Combat Strength.',
      { fontSize: '18px', fill: '#FFFFFF', align: 'center' }
    ).setOrigin(0.5);
    
    // Points display
    const pointsUsed = this.calculateUnitPointsUsed();
    
    this.pointsText = this.add.text(
      this.cameras.main.width / 2,
      150,
      `Points: ${pointsUsed} / ${this.initialPoints.human}`,
      { fontSize: '20px', fill: '#FFFFFF' }
    ).setOrigin(0.5);
    
    // Create unit purchase grid
    this.createUnitPurchasePanel();
    
    // Notes from rulebook
    this.add.text(
      this.cameras.main.width / 2,
      520,
      'Note: You cannot purchase more units than provided in the countermix.\nFiremen/fireboat units appear automatically if monster has fire breathing.',
      { fontSize: '14px', fill: '#FFAA00', align: 'center' }
    ).setOrigin(0.5);
    
    // Continue button
    this.createContinueButton(() => {
      // Validate unit purchase
      if (pointsUsed > this.initialPoints.human) {
        this.showWarningMessage('You have spent too many points!');
        return;
      }
      
      // Ensure at least one unit was purchased
      if (this.getUnitCount() === 0) {
        this.showWarningMessage('You must purchase at least one unit!');
        return;
      }
      
      // If monster has fire breathing ability, add firemen/fireboat
      if (this.setupState.monsterConfig.specialAbilities.includes('fireBreathing')) {
        // Check if already added
        if (!this.setupState.humanUnits.some(u => u.type === 'firemen')) {
          // Add three firemen and one fireboat or four firemen (rulebook 11.31)
          this.setupState.humanUnits.push({ type: 'firemen', quantity: 3, cost: 0 });
          this.setupState.humanUnits.push({ type: 'fireboat', quantity: 1, cost: 0 });
        }
      }
      
      this.showUnitPlacement();
    });
    
    // Back button
    this.createBackButton(() => {
      this.showMonsterEntrySelection();
    });
  }
  
  /**
   * Create unit purchase panel
   */
  createUnitPurchasePanel() {
    const panelX = 100;
    const panelY = 180;
    const panelWidth = this.cameras.main.width - 200;
    const panelHeight = 300;
    
    // Background
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x222222)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0xFFFFFF);
    
    // Get unit stats
    const unitStats = this.dataManager.unitStats;
    if (!unitStats) return;
    
    const unitTypes = Object.keys(unitStats);
    const unitsPerRow = 4;
    const unitWidth = panelWidth / unitsPerRow;
    const unitHeight = 70;
    
    // Create unit grid
    unitTypes.forEach((unitType, index) => {
      // Skip special units based on scenario
      if (unitType === 'helicopter' && 
          this.setupState.scenario && 
          this.setupState.scenario.id === 'learning') {
        return; // Helicopters not in learning scenario
      }
      
      const stats = unitStats[unitType];
      const row = Math.floor(index / unitsPerRow);
      const col = index % unitsPerRow;
      
      const x = panelX + col * unitWidth + unitWidth/2;
      const y = panelY + row * unitHeight + 40;
      
      // Unit container
      const container = this.add.container(x, y);
      
      // Background
      const bg = this.add.rectangle(0, 0, unitWidth - 10, unitHeight - 10, 0x333333)
        .setStrokeStyle(1, 0x666666);
      container.add(bg);
      
      // Unit sprite
      const sprite = this.add.sprite(-unitWidth/2 + 30, 0, unitType);
      sprite.setScale(0.4);
      container.add(sprite);
      
      // Unit name
      const name = this.add.text(-unitWidth/2 + 60, -15, 
                              this.capitalizeFirstLetter(unitType), 
                              { fontSize: '16px', fill: '#FFFFFF' });
      container.add(name);
      
      // Unit stats
      const statsText = this.add.text(-unitWidth/2 + 60, 5, 
                                   `A: ${stats.attack}  D: ${stats.defense}  M: ${stats.movement}`, 
                                   { fontSize: '12px', fill: '#AAAAAA' });
      container.add(statsText);
      
      // Unit cost
      let cost = Math.max(stats.attack, stats.defense);
      
      // Populace is free per rulebook
      if (unitType === 'populace') {
        cost = 0;
      }
      
      const costText = this.add.text(unitWidth/2 - 60, -15, 
                                  `Cost: ${cost}`, 
                                  { fontSize: '14px', fill: '#AAFFAA' });
      container.add(costText);
      
      // Quantity controls
      // Find existing unit in setup
      const existingUnit = this.setupState.humanUnits.find(u => u.type === unitType);
      const currentQty = existingUnit ? existingUnit.quantity : 0;
      
      // Quantity text
      const qtyText = this.add.text(unitWidth/2 - 40, 5, currentQty.toString(), 
                                 { fontSize: '16px', fill: '#FFFFFF' })
        .setName(`qty_${unitType}`);
      container.add(qtyText);
      
      // Decrement button
      const decBtn = this.add.text(unitWidth/2 - 60, 5, '-', 
                                { fontSize: '20px', fill: '#FF8888' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.adjustUnitQuantity(unitType, -1, cost);
        });
      container.add(decBtn);
      
      // Increment button
      const incBtn = this.add.text(unitWidth/2 - 20, 5, '+', 
                                { fontSize: '20px', fill: '#88FF88' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.adjustUnitQuantity(unitType, 1, cost);
        });
      container.add(incBtn);
    });
  }
  
  /**
   * Show unit placement screen
   */
  showUnitPlacement() {
    this.currentPhase = 'unit-placement';
    this.clearScreen();
    
    // Header
    this.createHeader('Place Human Units');
    
    // For now, since this is complex UI, we'll just simulate it
    // and give instructions for the full implementation
    this.add.text(
      this.cameras.main.width / 2,
      200,
      'Full Unit Placement UI would allow the Human Player to\nplace purchased units on the map, respecting placement rules:\n\n- Units may not be placed adjacent to monster entry edge\n- One populace unit must be in each populace symbol box\n- Only two non-populace/helicopter/firemen units per box\n\nFor now, we will auto-place units when the game starts.',
      { fontSize: '18px', fill: '#FFFFFF', align: 'center' }
    ).setOrigin(0.5);
    
    // Start game button
    this.createContinueButton(() => {
      // Start the game with the current configuration
      this.startGame();
    }, 'Start Game');
    
    // Back button
    this.createBackButton(() => {
      this.showUnitPurchase();
    });
  }
  
  /**
   * Start the game with current configuration
   */
  startGame() {
    console.log('Starting game with configuration:', this.setupState);
    
    // Pass the configuration to the GameScene
    this.scene.start('GameScene', this.setupState);
  }
  
  // ======== Helper Methods ========
  
  /**
   * Adjust unit quantity in purchase
   */
  adjustUnitQuantity(unitType, delta, cost) {
    // Find unit in array
    const index = this.setupState.humanUnits.findIndex(u => u.type === unitType);
    
    if (index === -1 && delta > 0) {
      // Add new unit
      this.setupState.humanUnits.push({
        type: unitType,
        quantity: delta,
        cost: cost
      });
    } else if (index !== -1) {
      // Update existing
      const newQty = this.setupState.humanUnits[index].quantity + delta;
      
      if (newQty <= 0) {
        // Remove unit
        this.setupState.humanUnits.splice(index, 1);
      } else {
        // Update quantity
        this.setupState.humanUnits[index].quantity = newQty;
      }
    }
    
    // Update displays
    this.updateUnitQuantityDisplay(unitType);
    this.updatePointsDisplay();
  }
  
  /**
   * Update unit quantity display
   */
  updateUnitQuantityDisplay(unitType) {
    const text = this.children.getByName(`qty_${unitType}`);
    if (!text) return;
    
    const unit = this.setupState.humanUnits.find(u => u.type === unitType);
    text.setText(unit ? unit.quantity.toString() : '0');
  }
  
  /**
   * Calculate total points used for unit purchase
   */
  calculateUnitPointsUsed() {
    return this.setupState.humanUnits.reduce((total, unit) => {
      return total + (unit.cost * unit.quantity);
    }, 0);
  }
  
  /**
   * Get total number of units (non-populace)
   */
  getUnitCount() {
    return this.setupState.humanUnits.reduce((count, unit) => {
      if (unit.type !== 'populace') {
        return count + unit.quantity;
      }
      return count;
    }, 0);
  }
  
  /**
   * Toggle special ability selection
   */
  toggleSpecialAbility(abilityKey) {
    const index = this.setupState.monsterConfig.specialAbilities.indexOf(abilityKey);
    
    if (index === -1) {
      // Add ability
      this.setupState.monsterConfig.specialAbilities.push(abilityKey);
    } else {
      // Remove ability
      this.setupState.monsterConfig.specialAbilities.splice(index, 1);
    }
    
    // Update displays
    this.updateSpecialAbilitiesDisplay();
    this.updatePointsDisplay();
  }
  
  /**
   * Update selected monster variant
   */
  updateSelectedVariant() {
    // Remove all highlights
    this.children.list
      .filter(child => child.name && child.name.startsWith('highlight_'))
      .forEach(child => child.destroy());
    
    // Add highlight to selected variant
    const variants = ['a', 'b', 'c', 'd', 'e', 'f'];
    const panelX = 150;
    const panelY = 450;
    const variant = this.setupState.monsterConfig.variant;
    const index = variants.indexOf(variant);
    
    if (index !== -1) {
      const x = panelX + 180 + index * 80;
      this.add.circle(x, panelY + 40, 25)
        .setStrokeStyle(2, 0xFFFF00)
        .setName(`highlight_${variant}`);
    }
  }
  
  /**
   * Get total points spent on special abilities
   */
  getSpecialAbilitiesPoints() {
    const costs = {
      'flameImmunity': 2,
      'fireBreathing': 8,
      'lightningThrowing': 6,
      'greatHeight': 5,
      'webSpinning': 5,
      'fearImmobilization': 4,
      'blindingLight': 4,
      'jumpingOverBuildings': 3,
      'radiation': 7,
      'mindControl': 6,
      'flying': 8
    };
    
    return this.setupState.monsterConfig.specialAbilities.reduce((total, ability) => {
      return total + (costs[ability] || 0);
    }, 0);
  }
  
  /**
   * Update monster stats display
   */
  updateMonsterStatsDisplay() {
    // Update each stat value
    ['attack', 'defense', 'buildingDestruction', 'movement'].forEach(stat => {
      const text = this.children.getByName(`value_${stat}`);
      if (text) {
        text.setText(this.setupState.monsterConfig[stat].toString());
      }
    });
    
    this.updatePointsDisplay();
  }
  
  /**
   * Update special abilities display
   */
  updateSpecialAbilitiesDisplay() {
    if (this.specialPointsText) {
      this.specialPointsText.setText(`Points spent on abilities: ${this.getSpecialAbilitiesPoints()}`);
    }
  }
  
  /**
   * Update points display
   */
  updatePointsDisplay() {
    if (!this.pointsText) return;
    
    if (this.currentPhase === 'monster-creation') {
      const pointsUsed = 
        this.setupState.monsterConfig.attack + 
        this.setupState.monsterConfig.defense + 
        this.setupState.monsterConfig.buildingDestruction + 
        this.setupState.monsterConfig.movement +
        this.getSpecialAbilitiesPoints();
      
      this.pointsText.setText(`Points: ${pointsUsed} / ${this.initialPoints.monster}`);
      
      // Change color if over limit
      if (pointsUsed > this.initialPoints.monster) {
        this.pointsText.setColor('#FF0000');
      } else {
        this.pointsText.setColor('#FFFFFF');
      }
    } 
    else if (this.currentPhase === 'unit-purchase') {
      const pointsUsed = this.calculateUnitPointsUsed();
      
      this.pointsText.setText(`Points: ${pointsUsed} / ${this.initialPoints.human}`);
      
      // Change color if over limit
      if (pointsUsed > this.initialPoints.human) {
        this.pointsText.setColor('#FF0000');
      } else {
        this.pointsText.setColor('#FFFFFF');
      }
    }
  }
  
  /**
   * Validate monster creation
   * @returns {boolean} True if valid
   */
  validateMonsterCreation() {
    // Calculate total points
    const statPoints = 
      this.setupState.monsterConfig.attack + 
      this.setupState.monsterConfig.defense + 
      this.setupState.monsterConfig.buildingDestruction + 
      this.setupState.monsterConfig.movement;
    
    const abilityPoints = this.getSpecialAbilitiesPoints();
    const totalPoints = statPoints + abilityPoints;
    
    // Check total points
    if (totalPoints > this.initialPoints.monster) {
      this.showWarningMessage(`You have allocated too many points! (${totalPoints}/${this.initialPoints.monster})`);
      return false;
    }
    
    // Check defense cap (rule 3.1)
    if (this.setupState.monsterConfig.defense > 15) {
      this.showWarningMessage('Maximum defense strength is 15!');
      this.setupState.monsterConfig.defense = 15;
      this.updateMonsterStatsDisplay();
      return false;
    }
    
    // Check special abilities requirement (at least 25%, rule 3.1)
    const minSpecialPoints = Math.ceil(this.initialPoints.monster * 0.25);
    if (abilityPoints < minSpecialPoints) {
      this.showWarningMessage(`You must spend at least ${minSpecialPoints} points on special abilities!`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Create header text
   */
  createHeader(text) {
    return this.add.text(
      this.cameras.main.width / 2,
      50,
      text,
      { fontSize: '28px', fill: '#FFFFFF', fontStyle: 'bold' }
    ).setOrigin(0.5);
  }
  
  /**
   * Create continue button
   */
  createContinueButton(callback, text = 'Continue') {
    const button = this.add.container(this.cameras.main.width - 100, this.cameras.main.height - 50);
    
    // Background
    const bg = this.add.rectangle(0, 0, 180, 40, 0x006600)
      .setStrokeStyle(2, 0xFFFFFF);
    button.add(bg);
    
    // Text
    const buttonText = this.add.text(0, 0, text, { fontSize: '18px', fill: '#FFFFFF' })
      .setOrigin(0.5);
    button.add(buttonText);
    
    // Make interactive
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x008800))
      .on('pointerout', () => bg.setFillStyle(0x006600))
      .on('pointerdown', callback);
    
    return button;
  }
  
  /**
   * Create back button
   */
  createBackButton(callback) {
    const button = this.add.container(100, this.cameras.main.height - 50);
    
    // Background
    const bg = this.add.rectangle(0, 0, 100, 40, 0x660000)
      .setStrokeStyle(2, 0xFFFFFF);
    button.add(bg);
    
    // Text
    const buttonText = this.add.text(0, 0, 'Back', { fontSize: '18px', fill: '#FFFFFF' })
      .setOrigin(0.5);
    button.add(buttonText);
    
    // Make interactive
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => bg.setFillStyle(0x880000))
      .on('pointerout', () => bg.setFillStyle(0x660000))
      .on('pointerdown', callback);
    
    return button;
  }
  
  /**
   * Show a warning message
   */
  showWarningMessage(text) {
    // Remove any existing warning
    if (this.warningText) {
      this.warningText.destroy();
    }
    
    // Create warning
    this.warningText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height - 100,
      text,
      { 
        fontSize: '18px', 
        fill: '#FF0000', 
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5);
    
    // Auto-remove after a few seconds
    this.time.delayedCall(3000, () => {
      if (this.warningText) {
        this.warningText.destroy();
        this.warningText = null;
      }
    });
  }
  
  /**
   * Clear the screen for next phase
   */
  clearScreen() {
    this.children.list.slice().forEach(child => {
      if (child.type === 'Text' || 
          child.type === 'Rectangle' || 
          child.type === 'Container' ||
          child.type === 'Sprite' ||
          child.type === 'Image') {
        child.destroy();
      }
    });
    
    // Reset references
    this.pointsText = null;
    this.specialPointsText = null;
    this.edgeText = null;
    this.warningText = null;
    this.continueButton = null;
  }
  
  /**
   * Capitalize first letter of a string
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

export default SetupScene;