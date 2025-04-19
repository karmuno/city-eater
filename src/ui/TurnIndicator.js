/**
 * TurnIndicator.js - Visual indicator for the current turn and phase
 * Shows the current player, phase, and available actions
 */
class TurnIndicator extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this UI element belongs to
   * @param {number} x - X position of the indicator
   * @param {number} y - Y position of the indicator
   * @param {TurnManager} turnManager - Reference to the turn manager
   */
  constructor(scene, x, y, turnManager) {
    super(scene, x, y);
    
    this.turnManager = turnManager;
    
    // Create background and UI elements
    this.createBackground();
    this.createText();
    this.createButtons();
    
    // Add to scene and fix to camera
    scene.add.existing(this);
    this.setScrollFactor(0);
    
    // Set depth to ensure it's above game elements
    this.setDepth(100);
    
    // Listen for turn/phase changes
    this.setupEventListeners();
    
    // Initial update
    this.update();
  }
  
  /**
   * Create background element
   */
  createBackground() {
    // Create a rounded rectangle background
    this.background = this.scene.add.rectangle(0, 0, 300, 100, 0x000000, 0.7);
    this.background.setOrigin(0.5, 0);
    this.add(this.background);
    
    // Add a colored bar at the top to indicate player
    this.playerBar = this.scene.add.rectangle(0, 5, 280, 10, 0xFF0000, 1);
    this.playerBar.setOrigin(0.5, 0);
    this.add(this.playerBar);
  }
  
  /**
   * Create text elements
   */
  createText() {
    // Turn number and player text
    this.turnText = this.scene.add.text(0, 20, 'TURN 1: MONSTER PLAYER', {
      fontSize: '18px',
      fontStyle: 'bold',
      fill: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5, 0);
    this.add(this.turnText);
    
    // Phase text
    this.phaseText = this.scene.add.text(0, 45, 'MOVEMENT PHASE', {
      fontSize: '16px',
      fill: '#FFFFFF',
      align: 'center'
    }).setOrigin(0.5, 0);
    this.add(this.phaseText);
    
    // Actions remaining text
    this.actionsText = this.scene.add.text(0, 70, 'Actions remaining: 3', {
      fontSize: '14px',
      fill: '#CCCCCC',
      align: 'center'
    }).setOrigin(0.5, 0);
    this.add(this.actionsText);
  }
  
  /**
   * Create action buttons
   */
  createButtons() {
    // End Phase button
    this.endPhaseButton = this.scene.add.rectangle(-70, 95, 120, 30, 0x555555, 1);
    this.endPhaseButton.setInteractive({ useHandCursor: true });
    this.endPhaseButton.on('pointerdown', this.onEndPhaseClicked, this);
    this.endPhaseButton.on('pointerover', () => this.endPhaseButton.fillColor = 0x777777);
    this.endPhaseButton.on('pointerout', () => this.endPhaseButton.fillColor = 0x555555);
    this.add(this.endPhaseButton);
    
    this.endPhaseText = this.scene.add.text(-70, 95, 'End Phase', {
      fontSize: '14px',
      fill: '#FFFFFF'
    }).setOrigin(0.5, 0.5);
    this.add(this.endPhaseText);
    
    // End Turn button
    this.endTurnButton = this.scene.add.rectangle(70, 95, 120, 30, 0x555555, 1);
    this.endTurnButton.setInteractive({ useHandCursor: true });
    this.endTurnButton.on('pointerdown', this.onEndTurnClicked, this);
    this.endTurnButton.on('pointerover', () => this.endTurnButton.fillColor = 0x777777);
    this.endTurnButton.on('pointerout', () => this.endTurnButton.fillColor = 0x555555);
    this.add(this.endTurnButton);
    
    this.endTurnText = this.scene.add.text(70, 95, 'End Turn', {
      fontSize: '14px',
      fill: '#FFFFFF'
    }).setOrigin(0.5, 0.5);
    this.add(this.endTurnText);
  }
  
  /**
   * Set up event listeners for turn management
   */
  setupEventListeners() {
    // Listen for turn changes
    this.scene.events.on('turn-changed', this.update, this);
    
    // Listen for sub-phase changes
    this.scene.events.on('sub-phase-changed', this.update, this);
    
    // Listen for action consumption
    this.scene.events.on('action-consumed', this.update, this);
    
    // Listen for turn start and end effects
    this.scene.events.on('turn-start-effects-applied', this.update, this);
    this.scene.events.on('turn-end-effects-applied', this.update, this);
  }
  
  /**
   * Handle end phase button click
   */
  onEndPhaseClicked() {
    // Emit event to turn manager
    this.scene.events.emit('end-phase-clicked');
    
    // Visual feedback
    this.scene.tweens.add({
      targets: this.endPhaseButton,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 100,
      yoyo: true
    });
  }
  
  /**
   * Handle end turn button click
   */
  onEndTurnClicked() {
    // Emit event to turn manager
    this.scene.events.emit('end-turn-clicked');
    
    // Visual feedback
    this.scene.tweens.add({
      targets: this.endTurnButton,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 100,
      yoyo: true
    });
  }
  
  /**
   * Update the indicator with current turn state
   */
  update() {
    if (!this.turnManager) return;
    
    // Update the turn and phase text
    this.turnText.setText(`TURN ${this.turnManager.currentTurn}: ${this.turnManager.currentPhase.toUpperCase()} PLAYER`);
    this.phaseText.setText(`${this.turnManager.currentSubPhase.toUpperCase()} PHASE`);
    
    // Update actions remaining text
    this.actionsText.setText(this.turnManager.getActionsRemainingText());
    
    // Update player indicator bar color
    const playerColor = this.turnManager.currentPhase === 'monster' ? 0xFF0000 : 0x00FF00;
    this.playerBar.fillColor = playerColor;
    
    // Adjust background height based on content
    this.background.height = 130;
    
    // Adjust width based on text length
    const maxWidth = Math.max(
      this.turnText.width,
      this.phaseText.width,
      this.actionsText.width
    ) + 80;
    this.background.width = Math.max(300, maxWidth);
    this.playerBar.width = this.background.width - 20;
  }
  
  /**
   * Resize the indicator for different screen sizes
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    // Position at top center of screen
    this.setPosition(width / 2, 10);
    
    // Update after resize
    this.update();
  }
}

export default TurnIndicator;