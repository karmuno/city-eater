/**
 * UnitPanel.js - Panel showing selected unit stats and actions
 */
class UnitPanel extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this UI element belongs to
   * @param {number} x - X position of the panel
   * @param {number} y - Y position of the panel
   */
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.selectedUnit = null;
    this.selectedMonster = null;
    
    // Create background and UI elements
    this.createBackground();
    this.createContent();
    
    // Add to scene and fix to camera
    scene.add.existing(this);
    this.setScrollFactor(0);
    
    // Set depth to ensure it's above game elements
    this.setDepth(100);
    
    // Listen for selection events
    this.setupEventListeners();
    
    // Hide initially until a unit is selected
    this.visible = false;
  }
  
  /**
   * Create the panel background
   */
  createBackground() {
    // Create a rounded rectangle background
    this.background = this.scene.add.rectangle(0, 0, 220, 300, 0x000000, 0.8);
    this.background.setOrigin(0, 0);
    this.add(this.background);
    
    // Create a title bar
    this.titleBar = this.scene.add.rectangle(0, 0, 220, 30, 0x555555, 1);
    this.titleBar.setOrigin(0, 0);
    this.add(this.titleBar);
    
    // Add title text
    this.titleText = this.scene.add.text(110, 15, 'UNIT INFO', {
      fontSize: '16px',
      fontStyle: 'bold',
      fill: '#FFFFFF'
    }).setOrigin(0.5, 0.5);
    this.add(this.titleText);
    
    // Close button
    this.closeButton = this.scene.add.rectangle(200, 15, 20, 20, 0xFF0000, 1);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.on('pointerdown', this.hide, this);
    this.add(this.closeButton);
    
    // Close button X
    this.closeX = this.scene.add.text(200, 15, 'X', {
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#FFFFFF'
    }).setOrigin(0.5, 0.5);
    this.add(this.closeX);
  }
  
  /**
   * Create the panel content containers
   */
  createContent() {
    // Create container for unit info (image, stats, etc.)
    this.infoContainer = new Phaser.GameObjects.Container(this.scene, 0, 40);
    this.add(this.infoContainer);
    
    // Create container for action buttons
    this.actionsContainer = new Phaser.GameObjects.Container(this.scene, 0, 200);
    this.add(this.actionsContainer);
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Listen for unit selection
    this.scene.events.on('unit-selected', this.showUnit, this);
    
    // Listen for monster selection
    this.scene.events.on('monster-selected', this.showMonster, this);
    
    // Listen for deselection events
    this.scene.events.on('unit-deselected', this.hide, this);
    this.scene.events.on('monster-deselected', this.hide, this);
    
    // Listen for phase changes to update available actions
    this.scene.events.on('sub-phase-changed', this.updateActions, this);
  }
  
  /**
   * Show the panel with unit information
   * @param {Unit} unit - The selected unit
   */
  showUnit(unit) {
    this.selectedUnit = unit;
    this.selectedMonster = null;
    
    // Clear existing content
    this.clearContent();
    
    // Set title
    this.titleText.setText(unit.type.toUpperCase());
    
    // Create unit image and stats
    this.createUnitContent(unit);
    
    // Create action buttons appropriate for the current phase
    this.createUnitActions(unit);
    
    // Show the panel
    this.visible = true;
    
    // Resize to fit content
    this.resizeToFit();
  }
  
  /**
   * Show the panel with monster information
   * @param {Monster} monster - The selected monster
   */
  showMonster(monster) {
    this.selectedMonster = monster;
    this.selectedUnit = null;
    
    // Clear existing content
    this.clearContent();
    
    // Set title
    this.titleText.setText('MONSTER');
    
    // Create monster image and stats
    this.createMonsterContent(monster);
    
    // Create action buttons appropriate for the current phase
    this.createMonsterActions(monster);
    
    // Show the panel
    this.visible = true;
    
    // Resize to fit content
    this.resizeToFit();
  }
  
  /**
   * Hide the panel
   */
  hide() {
    this.visible = false;
    this.selectedUnit = null;
    this.selectedMonster = null;
  }
  
  /**
   * Clear the panel content
   */
  clearContent() {
    this.infoContainer.removeAll(true);
    this.actionsContainer.removeAll(true);
  }
  
  /**
   * Create content for displaying unit information
   * @param {Unit} unit - The selected unit
   */
  createUnitContent(unit) {
    // Create unit image/icon
    let unitColor;
    switch (unit.type) {
      case 'infantry': unitColor = 0x0000FF; break;
      case 'artillery': unitColor = 0xFF0000; break;
      case 'tank': unitColor = 0x00FF00; break;
      case 'helicopter': unitColor = 0xFFFF00; break;
      case 'firemen': unitColor = 0xFF6600; break;
      case 'police': unitColor = 0x0066FF; break;
      default: unitColor = 0xCCCCCC;
    }
    
    // Create unit icon
    const unitIcon = this.scene.add.circle(60, 40, 30, unitColor, 1);
    this.infoContainer.add(unitIcon);
    
    // Add unit type icon/letter
    const unitText = this.scene.add.text(60, 40, unit.type.charAt(0).toUpperCase(), {
      fontSize: '24px',
      fontStyle: 'bold',
      fill: '#FFFFFF'
    }).setOrigin(0.5, 0.5);
    this.infoContainer.add(unitText);
    
    // Unit stats
    const statsHeader = this.scene.add.text(110, 20, 'STATS', {
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#FFFFFF'
    }).setOrigin(0, 0.5);
    this.infoContainer.add(statsHeader);
    
    // Create stat text
    const statsText = [
      `Movement: ${unit.stats?.movementPoints || 2}`,
      `Attack: ${unit.stats?.attack || 1}`,
      `Defense: ${unit.stats?.defense || 1}`,
      `Health: ${unit.stats?.health || 10}/${unit.stats?.maxHealth || 10}`
    ].join('\n');
    
    const stats = this.scene.add.text(110, 40, statsText, {
      fontSize: '12px',
      fill: '#FFFFFF',
      lineSpacing: 4
    }).setOrigin(0, 0.5);
    this.infoContainer.add(stats);
    
    // Current state information
    const stateText = [
      '',
      `Current Node: ${unit.currentNodeId || 'N/A'}`,
      `Movement Points: ${unit.currentMovementPoints || 0}/${unit.stats?.movementPoints || 2}`,
      unit.isTowed ? 'Being towed by armor' : ''
    ].join('\n');
    
    const state = this.scene.add.text(20, 100, stateText, {
      fontSize: '12px',
      fill: '#CCCCCC',
      lineSpacing: 4
    });
    this.infoContainer.add(state);
  }
  
  /**
   * Create content for displaying monster information
   * @param {Monster} monster - The selected monster
   */
  createMonsterContent(monster) {
    // Create monster icon
    const monsterIcon = this.scene.add.circle(60, 40, 30, 0xFF0000, 1);
    this.infoContainer.add(monsterIcon);
    
    // Add monster icon letter
    const monsterText = this.scene.add.text(60, 40, 'M', {
      fontSize: '24px',
      fontStyle: 'bold',
      fill: '#FFFFFF'
    }).setOrigin(0.5, 0.5);
    this.infoContainer.add(monsterText);
    
    // Monster stats
    const statsHeader = this.scene.add.text(110, 20, 'STRENGTHS', {
      fontSize: '14px',
      fontStyle: 'bold',
      fill: '#FFFFFF'
    }).setOrigin(0, 0.5);
    this.infoContainer.add(statsHeader);
    
    // Create stats text based on monster strengths
    const statsText = [
      `Attack: ${monster.strengths?.attack || 5}`,
      `Defense: ${monster.strengths?.defense || 10}/${monster.strengths?.maxDefense || 10}`,
      `Destruction: ${monster.strengths?.buildingDestruction || 3}`,
      `Movement: ${monster.strengths?.movement || 4}`
    ].join('\n');
    
    const stats = this.scene.add.text(110, 40, statsText, {
      fontSize: '12px',
      fill: '#FFFFFF',
      lineSpacing: 4
    }).setOrigin(0, 0.5);
    this.infoContainer.add(stats);
    
    // Special abilities section
    if (monster.specialAbilities && monster.specialAbilities.length > 0) {
      const abilitiesHeader = this.scene.add.text(20, 80, 'SPECIAL ABILITIES', {
        fontSize: '14px',
        fontStyle: 'bold',
        fill: '#FFFFFF'
      });
      this.infoContainer.add(abilitiesHeader);
      
      // Create ability list
      const abilitiesText = monster.specialAbilities.map(ability => {
        const cooldown = monster.abilityCooldowns[ability] > 0 ? 
          ` (Cooldown: ${monster.abilityCooldowns[ability]})` : '';
        return `" ${this.formatAbilityName(ability)}${cooldown}`;
      }).join('\n');
      
      const abilities = this.scene.add.text(20, 100, abilitiesText, {
        fontSize: '12px',
        fill: '#FFFFFF',
        lineSpacing: 4
      });
      this.infoContainer.add(abilities);
    }
    
    // Current state
    const stateText = [
      `Current Node: ${monster.currentNodeId || 'N/A'}`,
      `Movement Points: ${monster.currentMovementPoints || 0}/${monster.strengths?.movement || 4}`,
      `Victory Points: ${monster.victoryPoints || 0}`,
      `Destruction Attempts: ${monster.remainingDestructionAttempts || 0}/3`,
      monster.isFlying ? 'Currently Flying' : '',
      monster.isInWater ? 'In Water' : ''
    ].join('\n');
    
    const state = this.scene.add.text(20, 140, stateText, {
      fontSize: '12px',
      fill: '#CCCCCC',
      lineSpacing: 4
    });
    this.infoContainer.add(state);
  }
  
  /**
   * Format a camelCase ability name for display
   * @param {string} ability - The ability name
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
   * Create action buttons for unit
   * @param {Unit} unit - The selected unit
   */
  createUnitActions(unit) {
    // Get current phase from turn manager
    const turnManager = this.scene.turnManager;
    if (!turnManager) return;
    
    const currentPhase = turnManager.currentPhase;
    const currentSubPhase = turnManager.currentSubPhase;
    
    // Only show actions for human phase
    if (currentPhase !== 'human') {
      const noActionsText = this.scene.add.text(110, 20, 'No actions available\nduring monster turn', {
        fontSize: '14px',
        fill: '#CCCCCC',
        align: 'center'
      }).setOrigin(0.5, 0.5);
      this.actionsContainer.add(noActionsText);
      return;
    }
    
    // Create actions based on the current sub-phase
    if (currentSubPhase === 'movement') {
      // Move action
      this.createActionButton('MOVE', 110, 20, () => {
        // Emit event to request movement (will be handled by game scene)
        this.scene.events.emit('unit-action-move', unit);
      });
    }
    else if (currentSubPhase === 'combat') {
      // Attack action
      this.createActionButton('ATTACK', 110, 20, () => {
        this.scene.events.emit('unit-action-attack', unit);
      });
    }
    else if (currentSubPhase === 'fire-control') {
      // Only show for firemen and fireboats
      if (['firemen', 'fireboat'].includes(unit.type)) {
        this.createActionButton('EXTINGUISH FIRE', 110, 20, () => {
          this.scene.events.emit('unit-action-extinguish', unit);
        });
      } else {
        const noActionsText = this.scene.add.text(110, 20, 'This unit cannot\nextinguish fires', {
          fontSize: '14px',
          fill: '#CCCCCC',
          align: 'center'
        }).setOrigin(0.5, 0.5);
        this.actionsContainer.add(noActionsText);
      }
    }
  }
  
  /**
   * Create action buttons for monster
   * @param {Monster} monster - The selected monster
   */
  createMonsterActions(monster) {
    // Get current phase from turn manager
    const turnManager = this.scene.turnManager;
    if (!turnManager) return;
    
    const currentPhase = turnManager.currentPhase;
    const currentSubPhase = turnManager.currentSubPhase;
    
    // Only show actions for monster phase
    if (currentPhase !== 'monster') {
      const noActionsText = this.scene.add.text(110, 20, 'No actions available\nduring human turn', {
        fontSize: '14px',
        fill: '#CCCCCC',
        align: 'center'
      }).setOrigin(0.5, 0.5);
      this.actionsContainer.add(noActionsText);
      return;
    }
    
    // Create actions based on the current sub-phase
    if (currentSubPhase === 'movement') {
      // Move action
      this.createActionButton('MOVE', 110, 20, () => {
        // Emit event to request movement (will be handled by game scene)
        this.scene.events.emit('monster-action-move', monster);
      });
      
      // Flying ability (if monster has it)
      if (monster.specialAbilities && monster.specialAbilities.includes('flying')) {
        const cooldown = monster.abilityCooldowns.flying;
        
        if (cooldown <= 0) {
          this.createActionButton('FLY', 110, 60, () => {
            this.scene.events.emit('monster-action-fly', monster);
          });
        }
      }
    }
    else if (currentSubPhase === 'combat') {
      // Attack action
      this.createActionButton('ATTACK', 110, 20, () => {
        this.scene.events.emit('monster-action-attack', monster);
      });
    }
    else if (currentSubPhase === 'destruction') {
      // Destruction action
      this.createActionButton('DESTROY BUILDING', 110, 20, () => {
        this.scene.events.emit('monster-action-destroy', monster);
      });
      
      // Special abilities for destruction phase
      let yOffset = 60;
      
      // Fire breathing ability
      if (monster.specialAbilities && monster.specialAbilities.includes('fireBreathing')) {
        const cooldown = monster.abilityCooldowns.fireBreathing;
        
        if (cooldown <= 0) {
          this.createActionButton('BREATHE FIRE', 110, yOffset, () => {
            this.scene.events.emit('monster-action-fire', monster);
          });
          yOffset += 40;
        }
      }
      
      // Web spinning ability
      if (monster.specialAbilities && monster.specialAbilities.includes('webSpinning')) {
        const cooldown = monster.abilityCooldowns.webSpinning;
        
        if (cooldown <= 0) {
          this.createActionButton('SPIN WEB', 110, yOffset, () => {
            this.scene.events.emit('monster-action-web', monster);
          });
          yOffset += 40;
        }
      }
    }
  }
  
  /**
   * Create an action button
   * @param {string} label - Button label
   * @param {number} x - X position of button
   * @param {number} y - Y position of button
   * @param {function} callback - Function to call when clicked
   */
  createActionButton(label, x, y, callback) {
    // Create button background
    const button = this.scene.add.rectangle(x, y, 180, 30, 0x555555, 1);
    button.setInteractive({ useHandCursor: true });
    button.on('pointerdown', callback);
    button.on('pointerover', () => button.fillColor = 0x777777);
    button.on('pointerout', () => button.fillColor = 0x555555);
    this.actionsContainer.add(button);
    
    // Create button label
    const text = this.scene.add.text(x, y, label, {
      fontSize: '14px',
      fill: '#FFFFFF'
    }).setOrigin(0.5, 0.5);
    this.actionsContainer.add(text);
    
    return button;
  }
  
  /**
   * Update actions when phase changes
   */
  updateActions() {
    if (this.selectedUnit) {
      this.showUnit(this.selectedUnit);
    } else if (this.selectedMonster) {
      this.showMonster(this.selectedMonster);
    }
  }
  
  /**
   * Resize the panel to fit content
   */
  resizeToFit() {
    // Find the lowest element in the containers
    let lowestY = 0;
    
    // Check info container
    this.infoContainer.iterate(child => {
      const bottom = child.y + (child.height || 0);
      if (bottom > lowestY) lowestY = bottom;
    });
    
    // Check actions container (offset by its y position)
    this.actionsContainer.iterate(child => {
      const bottom = this.actionsContainer.y + child.y + (child.height || 0);
      if (bottom > lowestY) lowestY = bottom;
    });
    
    // Add padding at the bottom
    lowestY += 20;
    
    // Update background height
    this.background.height = lowestY;
  }
  
  /**
   * Reposition the panel
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  reposition(x, y) {
    this.setPosition(x, y);
  }
}

export default UnitPanel;