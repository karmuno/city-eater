/**
 * MonsterDashboard.js - UI component for managing monster strength allocations
 * Shows the monster's current strengths and allows for reallocation during setup
 */
class MonsterDashboard extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this UI element belongs to
   * @param {number} x - X position of the dashboard
   * @param {number} y - Y position of the dashboard
   * @param {Object} config - Configuration options
   */
  constructor(scene, x, y, config = {}) {
    super(scene, x, y);
    
    this.config = {
      width: config.width || 300,
      height: config.height || 400,
      isSetupPhase: config.isSetupPhase || false,
      initialStrengthPoints: config.initialStrengthPoints || 18,
      minPerStat: config.minPerStat || 1,
      maxPerStat: config.maxPerStat || 12
    };
    
    // Store reference to monster when available
    this.monster = null;
    
    // Tracking for available points in setup phase
    this.availablePoints = this.config.initialStrengthPoints;
    this.allocatedPoints = {
      attack: this.config.minPerStat,
      defense: this.config.minPerStat,
      buildingDestruction: this.config.minPerStat,
      movement: this.config.minPerStat
    };
    
    // Calculate initially allocated points
    this.availablePoints -= Object.values(this.allocatedPoints).reduce((a, b) => a + b, 0);
    
    // Create UI components
    this.createBackground();
    this.createHeader();
    this.createStrengthAllocation();
    this.createAbilitySelection();
    this.createActionButtons();
    
    // Add to scene and fix to camera
    scene.add.existing(this);
    this.setScrollFactor(0);
    
    // Set depth to ensure it's above game elements
    this.setDepth(100);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Hide initially
    this.visible = false;
  }
  
  /**
   * Create dashboard background
   */
  createBackground() {
    // Create a rounded rectangle background
    this.background = this.scene.add.rectangle(
      0, 0,
      this.config.width, this.config.height,
      0x000000, 0.8
    );
    this.background.setOrigin(0, 0);
    this.add(this.background);
    
    // Create a title bar
    this.titleBar = this.scene.add.rectangle(
      0, 0,
      this.config.width, 40,
      0x555555, 1
    );
    this.titleBar.setOrigin(0, 0);
    this.add(this.titleBar);
  }
  
  /**
   * Create dashboard header
   */
  createHeader() {
    // Add title text
    this.titleText = this.scene.add.text(
      this.config.width / 2, 20,
      'MONSTER DASHBOARD',
      {
        fontSize: '18px',
        fontStyle: 'bold',
        fill: '#FFFFFF'
      }
    ).setOrigin(0.5, 0.5);
    this.add(this.titleText);
    
    // Add close button if not in setup phase
    if (!this.config.isSetupPhase) {
      this.closeButton = this.scene.add.rectangle(
        this.config.width - 30, 20,
        24, 24,
        0xFF0000, 1
      );
      this.closeButton.setInteractive({ useHandCursor: true });
      this.closeButton.on('pointerdown', this.hide, this);
      this.add(this.closeButton);
      
      // Close button X
      this.closeX = this.scene.add.text(
        this.config.width - 30, 20,
        'X',
        {
          fontSize: '16px',
          fontStyle: 'bold',
          fill: '#FFFFFF'
        }
      ).setOrigin(0.5, 0.5);
      this.add(this.closeX);
    }
    
    // Add subtitle text that changes based on phase
    const subtitleText = this.config.isSetupPhase
      ? 'Allocate Strength Points'
      : 'Monster Status';
    
    this.subtitleText = this.scene.add.text(
      this.config.width / 2, 50,
      subtitleText,
      {
        fontSize: '14px',
        fill: '#CCCCCC'
      }
    ).setOrigin(0.5, 0.5);
    this.add(this.subtitleText);
    
    // Add available points text for setup phase
    if (this.config.isSetupPhase) {
      this.availablePointsText = this.scene.add.text(
        this.config.width / 2, 75,
        `Available Points: ${this.availablePoints}`,
        {
          fontSize: '16px',
          fontStyle: 'bold',
          fill: '#FFFF00'
        }
      ).setOrigin(0.5, 0.5);
      this.add(this.availablePointsText);
    } else {
      // Add victory points display for in-game
      this.victoryPointsText = this.scene.add.text(
        this.config.width / 2, 75,
        'Victory Points: 0',
        {
          fontSize: '16px',
          fontStyle: 'bold',
          fill: '#FFFF00'
        }
      ).setOrigin(0.5, 0.5);
      this.add(this.victoryPointsText);
    }
  }
  
  /**
   * Create strength allocation controls
   */
  createStrengthAllocation() {
    // Container for strength controls
    this.strengthContainer = new Phaser.GameObjects.Container(this.scene, 0, 100);
    this.add(this.strengthContainer);
    
    // Header
    this.strengthHeader = this.scene.add.text(
      this.config.width / 2, 0,
      'MONSTER STRENGTHS',
      {
        fontSize: '16px',
        fontStyle: 'bold',
        fill: '#FFFFFF'
      }
    ).setOrigin(0.5, 0.5);
    this.strengthContainer.add(this.strengthHeader);
    
    // Create controls for each strength
    this.strengthControls = {};
    const strengths = [
      { key: 'attack', label: 'Attack' },
      { key: 'defense', label: 'Defense' },
      { key: 'buildingDestruction', label: 'Building Destruction' },
      { key: 'movement', label: 'Movement' }
    ];
    
    let yOffset = 40;
    for (const strength of strengths) {
      const control = this.createStrengthControl(
        strength.key,
        strength.label,
        this.config.width / 2,
        yOffset,
        this.allocatedPoints[strength.key]
      );
      this.strengthControls[strength.key] = control;
      this.strengthContainer.add(control);
      yOffset += 50;
    }
  }
  
  /**
   * Create controls for a single strength attribute
   * @param {string} key - The strength key (e.g., 'attack')
   * @param {string} label - Display label
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {number} initialValue - Initial strength value
   * @returns {Phaser.GameObjects.Container} Container with controls
   */
  createStrengthControl(key, label, x, y, initialValue) {
    const container = new Phaser.GameObjects.Container(this.scene, x, y);
    
    // Label
    const labelText = this.scene.add.text(
      0, 0,
      label,
      {
        fontSize: '14px',
        fill: '#FFFFFF'
      }
    ).setOrigin(0.5, 0.5);
    container.add(labelText);
    
    // Value display
    const valueDisplay = this.scene.add.text(
      0, 20,
      initialValue.toString(),
      {
        fontSize: '18px',
        fontStyle: 'bold',
        fill: '#FFFFFF'
      }
    ).setOrigin(0.5, 0.5);
    container.valueDisplay = valueDisplay;
    container.add(valueDisplay);
    
    // Only add adjustment controls in setup phase
    if (this.config.isSetupPhase) {
      // Decrement button
      const decrementButton = this.scene.add.rectangle(
        -50, 20,
        30, 30,
        0x555555, 1
      );
      decrementButton.setInteractive({ useHandCursor: true });
      decrementButton.on('pointerdown', () => this.adjustStrength(key, -1));
      container.add(decrementButton);
      
      // Decrement button text
      const decrementText = this.scene.add.text(
        -50, 20,
        '-',
        {
          fontSize: '18px',
          fontStyle: 'bold',
          fill: '#FFFFFF'
        }
      ).setOrigin(0.5, 0.5);
      container.add(decrementText);
      
      // Increment button
      const incrementButton = this.scene.add.rectangle(
        50, 20,
        30, 30,
        0x555555, 1
      );
      incrementButton.setInteractive({ useHandCursor: true });
      incrementButton.on('pointerdown', () => this.adjustStrength(key, 1));
      container.add(incrementButton);
      
      // Increment button text
      const incrementText = this.scene.add.text(
        50, 20,
        '+',
        {
          fontSize: '18px',
          fontStyle: 'bold',
          fill: '#FFFFFF'
        }
      ).setOrigin(0.5, 0.5);
      container.add(incrementText);
      
      // Store references to buttons for enabling/disabling
      container.decrementButton = decrementButton;
      container.incrementButton = incrementButton;
      
      // Update button states
      this.updateButtonStates(key);
    }
    
    return container;
  }
  
  /**
   * Create ability selection controls
   */
  createAbilitySelection() {
    // Container for ability controls
    this.abilityContainer = new Phaser.GameObjects.Container(this.scene, 0, 300);
    this.add(this.abilityContainer);
    
    // Header
    this.abilityHeader = this.scene.add.text(
      this.config.width / 2, 0,
      'SPECIAL ABILITIES',
      {
        fontSize: '16px',
        fontStyle: 'bold',
        fill: '#FFFFFF'
      }
    ).setOrigin(0.5, 0.5);
    this.abilityContainer.add(this.abilityHeader);
    
    // List of available abilities
    const abilities = [
      { key: 'flying', label: 'Flying - Move over any terrain' },
      { key: 'fireBreathing', label: 'Fire Breathing - Start fires' },
      { key: 'webSpinning', label: 'Web Spinning - Immobilize units' },
      { key: 'fearImmobilization', label: 'Fear - Paralyze nearby units' }
    ];
    
    // Create checkbox controls for each ability
    this.abilityControls = {};
    let yOffset = 30;
    
    if (this.config.isSetupPhase) {
      for (const ability of abilities) {
        const control = this.createAbilityControl(
          ability.key,
          ability.label,
          20,
          yOffset
        );
        this.abilityControls[ability.key] = control;
        this.abilityContainer.add(control);
        yOffset += 30;
      }
    } else {
      // Just display abilities without controls
      this.abilityListText = this.scene.add.text(
        20, 30,
        'None selected',
        {
          fontSize: '14px',
          fill: '#CCCCCC'
        }
      );
      this.abilityContainer.add(this.abilityListText);
    }
  }
  
  /**
   * Create a control for a single ability
   * @param {string} key - The ability key
   * @param {string} label - Display label
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Phaser.GameObjects.Container} Container with control
   */
  createAbilityControl(key, label, x, y) {
    const container = new Phaser.GameObjects.Container(this.scene, x, y);
    
    // Checkbox (unchecked by default)
    const checkbox = this.scene.add.rectangle(
      0, 0,
      20, 20,
      0xFFFFFF, 1
    );
    checkbox.setOrigin(0, 0.5);
    checkbox.setInteractive({ useHandCursor: true });
    checkbox.on('pointerdown', () => this.toggleAbility(key));
    container.add(checkbox);
    
    // Checkbox state tracking
    checkbox.isChecked = false;
    container.checkbox = checkbox;
    
    // Label
    const labelText = this.scene.add.text(
      30, 0,
      label,
      {
        fontSize: '14px',
        fill: '#FFFFFF'
      }
    ).setOrigin(0, 0.5);
    container.add(labelText);
    
    // Checkmark (hidden initially)
    const checkmark = this.scene.add.text(
      10, 0,
      '',
      {
        fontSize: '16px',
        fontStyle: 'bold',
        fill: '#000000'
      }
    ).setOrigin(0.5, 0.5);
    checkmark.visible = false;
    container.add(checkmark);
    container.checkmark = checkmark;
    
    return container;
  }
  
  /**
   * Create action buttons at the bottom of the dashboard
   */
  createActionButtons() {
    // Only relevant in setup phase
    if (!this.config.isSetupPhase) return;
    
    // Container for buttons
    this.buttonContainer = new Phaser.GameObjects.Container(
      this.scene,
      0,
      this.config.height - 60
    );
    this.add(this.buttonContainer);
    
    // Confirm button
    this.confirmButton = this.scene.add.rectangle(
      this.config.width / 2,
      0,
      200,
      40,
      0x005500,
      1
    );
    this.confirmButton.setInteractive({ useHandCursor: true });
    this.confirmButton.on('pointerdown', this.confirmSetup, this);
    this.buttonContainer.add(this.confirmButton);
    
    // Button text
    this.confirmText = this.scene.add.text(
      this.config.width / 2,
      0,
      'CONFIRM',
      {
        fontSize: '16px',
        fontStyle: 'bold',
        fill: '#FFFFFF'
      }
    ).setOrigin(0.5, 0.5);
    this.buttonContainer.add(this.confirmText);
    
    // Disable button initially if points remain
    this.updateConfirmButton();
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for monster creation
    this.scene.events.on('monster-created', this.setMonster, this);
    
    // Listen for turn changes to update dashboard if needed
    this.scene.events.on('turn-changed', this.update, this);
    
    // Listen for victory point changes
    this.scene.events.on('monster-vp-changed', this.updateVictoryPoints, this);
    
    // Request dashboard button
    this.scene.events.on('show-monster-dashboard', this.show, this);
  }
  
  /**
   * Set the monster reference
   * @param {Monster} monster - The monster object
   */
  setMonster(monster) {
    this.monster = monster;
    
    // Update UI with monster data
    this.updateFromMonster();
  }
  
  /**
   * Update UI with data from monster object
   */
  updateFromMonster() {
    if (!this.monster) return;
    
    // Update strength displays
    for (const key in this.strengthControls) {
      if (this.monster.strengths && this.monster.strengths[key] !== undefined) {
        // Update the allocated points for setup phase
        if (this.config.isSetupPhase) {
          this.allocatedPoints[key] = this.monster.strengths[key];
        }
        
        // Update the displayed value
        const display = this.strengthControls[key].valueDisplay;
        if (display) {
          display.setText(this.monster.strengths[key].toString());
        }
      }
    }
    
    // Update abilities list
    if (!this.config.isSetupPhase && this.abilityListText) {
      if (this.monster.specialAbilities && this.monster.specialAbilities.length > 0) {
        const abilityNames = this.monster.specialAbilities.map(this.formatAbilityName);
        this.abilityListText.setText(abilityNames.join('\n'));
      } else {
        this.abilityListText.setText('None');
      }
    }
    
    // Update victory points
    this.updateVictoryPoints();
  }
  
  /**
   * Format ability name for display
   * @param {string} ability - Raw ability name
   * @returns {string} Formatted ability name
   */
  formatAbilityName(ability) {
    return ability
      // Insert space before capital letters
      .replace(/([A-Z])/g, ' $1')
      // Capitalize first letter
      .replace(/^./, str => str.toUpperCase());
  }
  
  /**
   * Update victory points display
   */
  updateVictoryPoints() {
    if (!this.config.isSetupPhase && this.victoryPointsText && this.monster) {
      this.victoryPointsText.setText(`Victory Points: ${this.monster.victoryPoints || 0}`);
    }
  }
  
  /**
   * Adjust strength value
   * @param {string} key - Strength key to adjust
   * @param {number} amount - Amount to adjust by (+1 or -1)
   */
  adjustStrength(key, amount) {
    // Only allowed in setup phase
    if (!this.config.isSetupPhase) return;
    
    const currentValue = this.allocatedPoints[key];
    const newValue = currentValue + amount;
    
    // Check limits
    if (newValue < this.config.minPerStat || newValue > this.config.maxPerStat) {
      return;
    }
    
    // Check available points
    if (amount > 0 && this.availablePoints <= 0) {
      return;
    }
    
    // Update allocated points
    this.allocatedPoints[key] = newValue;
    this.availablePoints -= amount;
    
    // Update displays
    this.strengthControls[key].valueDisplay.setText(newValue.toString());
    this.availablePointsText.setText(`Available Points: ${this.availablePoints}`);
    
    // Update button states
    this.updateButtonStates(key);
    this.updateAllButtonStates();
    this.updateConfirmButton();
  }
  
  /**
   * Update increment/decrement button states for a specific strength
   * @param {string} key - Strength key to update
   */
  updateButtonStates(key) {
    const control = this.strengthControls[key];
    if (!control || !control.decrementButton || !control.incrementButton) return;
    
    const currentValue = this.allocatedPoints[key];
    
    // Decrement button - disabled at minimum
    if (currentValue <= this.config.minPerStat) {
      control.decrementButton.fillColor = 0x333333;
      control.decrementButton.disableInteractive();
    } else {
      control.decrementButton.fillColor = 0x555555;
      control.decrementButton.setInteractive({ useHandCursor: true });
    }
    
    // Increment button - disabled at maximum or when no points left
    if (currentValue >= this.config.maxPerStat || this.availablePoints <= 0) {
      control.incrementButton.fillColor = 0x333333;
      control.incrementButton.disableInteractive();
    } else {
      control.incrementButton.fillColor = 0x555555;
      control.incrementButton.setInteractive({ useHandCursor: true });
    }
  }
  
  /**
   * Update all strength button states
   */
  updateAllButtonStates() {
    for (const key in this.strengthControls) {
      this.updateButtonStates(key);
    }
  }
  
  /**
   * Toggle ability selection
   * @param {string} key - Ability key to toggle
   */
  toggleAbility(key) {
    // Only allowed in setup phase
    if (!this.config.isSetupPhase) return;
    
    const control = this.abilityControls[key];
    if (!control || !control.checkbox || !control.checkmark) return;
    
    // Toggle checked state
    control.checkbox.isChecked = !control.checkbox.isChecked;
    control.checkmark.visible = control.checkbox.isChecked;
    
    // Update confirm button
    this.updateConfirmButton();
  }
  
  /**
   * Update confirm button state
   */
  updateConfirmButton() {
    if (!this.config.isSetupPhase || !this.confirmButton) return;
    
    // Disable if there are still points to allocate
    if (this.availablePoints > 0) {
      this.confirmButton.fillColor = 0x333333;
      this.confirmButton.disableInteractive();
      this.confirmText.setText('ALLOCATE ALL POINTS');
    } else {
      this.confirmButton.fillColor = 0x005500;
      this.confirmButton.setInteractive({ useHandCursor: true });
      this.confirmText.setText('CONFIRM');
    }
  }
  
  /**
   * Confirm monster setup
   */
  confirmSetup() {
    // Only relevant in setup phase
    if (!this.config.isSetupPhase) return;
    
    // Make sure all points are allocated
    if (this.availablePoints > 0) {
      return;
    }
    
    // Gather selected abilities
    const selectedAbilities = [];
    for (const key in this.abilityControls) {
      const control = this.abilityControls[key];
      if (control.checkbox.isChecked) {
        selectedAbilities.push(key);
      }
    }
    
    // Emit event with monster configuration
    this.scene.events.emit('monster-setup-complete', {
      strengths: { ...this.allocatedPoints },
      specialAbilities: selectedAbilities
    });
    
    // Hide dashboard
    this.hide();
  }
  
  /**
   * Show the dashboard
   */
  show() {
    this.visible = true;
    
    // Update with current data if not in setup phase
    if (!this.config.isSetupPhase && this.monster) {
      this.updateFromMonster();
    }
  }
  
  /**
   * Hide the dashboard
   */
  hide() {
    this.visible = false;
  }
  
  /**
   * Update the dashboard
   */
  update() {
    if (this.visible && !this.config.isSetupPhase && this.monster) {
      this.updateFromMonster();
    }
  }
  
  /**
   * Resize the dashboard for different screen sizes
   * @param {number} width - New screen width
   * @param {number} height - New screen height
   */
  resize(width, height) {
    // Position at center of screen
    this.setPosition(
      width / 2 - this.config.width / 2,
      height / 2 - this.config.height / 2
    );
  }
}

export default MonsterDashboard;