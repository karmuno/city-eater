/**
 * TurnManager.js - Manages turn-based gameplay, alternating between monster and human players
 */
class TurnManager {
  /**
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {GameState} gameState - Reference to the game state manager
   */
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    
    // Initialize turn tracking
    this.currentTurn = 1;
    this.currentPhase = 'monster'; // 'monster' or 'human'
    
    // Track sub-phases within each player's turn
    this.monsterPhases = ['movement', 'combat', 'destruction'];
    this.humanPhases = ['movement', 'combat', 'fire-control'];
    
    this.currentSubPhase = this.monsterPhases[0];
    
    // Track available actions per turn
    this.actionsRemaining = {
      movement: 0,
      combat: 0,
      destruction: 3, // Monster gets 3 destruction attempts per turn
      'fire-control': 0
    };
    
    // Action limits - default values
    this.actionLimits = {
      movement: Infinity, // No limit on movement actions
      combat: Infinity, // No limit on combat actions
      destruction: 3, // 3 destruction attempts per turn for monster
      'fire-control': Infinity // No limit on fire control actions
    };
    
    // Flag for when turn is ready to advance
    this.readyToAdvance = false;
    
    // Set up event listeners
    this.setupEvents();
    
    // Create UI (optional - could be done in a separate UI class)
    this.createTurnUI();
  }
  
  /**
   * Set up event listeners
   */
  setupEvents() {
    // Listen for action completion events
    this.scene.events.on('movement-completed', this.onMovementCompleted, this);
    this.scene.events.on('combat-completed', this.onCombatCompleted, this);
    this.scene.events.on('destruction-completed', this.onDestructionCompleted, this);
    this.scene.events.on('fire-control-completed', this.onFireControlCompleted, this);
    
    // Listen for "end phase" button click
    this.scene.events.on('end-phase-clicked', this.endCurrentSubPhase, this);
    
    // Listen for "end turn" button click
    this.scene.events.on('end-turn-clicked', this.endCurrentTurn, this);
  }
  
  /**
   * Create turn indicator UI elements
   */
  createTurnUI() {
    // This would be better handled by a dedicated UI class
    console.log('Turn UI would be created here or in a UI class');
  }
  
  /**
   * Start a new game
   */
  startGame() {
    this.currentTurn = 1;
    this.currentPhase = 'monster';
    this.currentSubPhase = this.monsterPhases[0];
    
    // Reset action tracking
    this.resetActions();
    
    // Announce first turn
    this.announceTurn();
    
    // Apply start-of-turn effects
    this.applyTurnStartEffects();
  }
  
  /**
   * Move to the next player turn
   */
  nextTurn() {
    if (this.currentPhase === 'monster') {
      // Switch to human player
      this.currentPhase = 'human';
      this.currentSubPhase = this.humanPhases[0];
    } else {
      // Switch back to monster player and increment turn counter
      this.currentPhase = 'monster';
      this.currentSubPhase = this.monsterPhases[0];
      this.currentTurn++;
    }
    
    // Reset action tracking
    this.resetActions();
    
    // Announce the new turn
    this.announceTurn();
    
    // Apply start-of-turn effects
    this.applyTurnStartEffects();
    
    // Emit turn changed event for game state and other systems
    this.scene.events.emit('turn-changed', {
      turn: this.currentTurn,
      player: this.currentPhase,
      subPhase: this.currentSubPhase
    });
  }
  
  /**
   * End current player's turn
   */
  endCurrentTurn() {
    console.log(`Ending ${this.currentPhase} player's turn`);
    
    // Apply end-of-turn effects
    this.applyTurnEndEffects();
    
    // Move to next player's turn
    this.nextTurn();
  }
  
  /**
   * Move to the next sub-phase within current player's turn
   */
  nextSubPhase() {
    const phases = this.currentPhase === 'monster' ? this.monsterPhases : this.humanPhases;
    const currentIndex = phases.indexOf(this.currentSubPhase);
    
    if (currentIndex < phases.length - 1) {
      // Move to next sub-phase
      this.currentSubPhase = phases[currentIndex + 1];
      console.log(`Moving to ${this.currentPhase} player's ${this.currentSubPhase} phase`);
      
      // Reset action counters for the new sub-phase
      this.resetActionsForCurrentSubPhase();
      
      // Emit sub-phase changed event
      this.scene.events.emit('sub-phase-changed', {
        player: this.currentPhase,
        subPhase: this.currentSubPhase
      });
    } else {
      // No more sub-phases, end turn
      this.endCurrentTurn();
    }
  }
  
  /**
   * End the current sub-phase
   */
  endCurrentSubPhase() {
    console.log(`Ending ${this.currentPhase} player's ${this.currentSubPhase} phase`);
    
    // Apply end-of-subphase effects if any
    this.applySubPhaseEndEffects();
    
    // Move to next sub-phase
    this.nextSubPhase();
  }
  
  /**
   * Reset action counters for all phases
   */
  resetActions() {
    // Reset all action counters
    for (const action in this.actionsRemaining) {
      this.actionsRemaining[action] = this.actionLimits[action];
    }
    
    // Reset "ready to advance" flag
    this.readyToAdvance = false;
  }
  
  /**
   * Reset action counters for the current sub-phase only
   */
  resetActionsForCurrentSubPhase() {
    // Reset only the current sub-phase's action counter
    this.actionsRemaining[this.currentSubPhase] = this.actionLimits[this.currentSubPhase];
    
    // Reset "ready to advance" flag
    this.readyToAdvance = false;
  }
  
  /**
   * Announce the current turn via console and UI
   */
  announceTurn() {
    console.log(`Turn ${this.currentTurn}: ${this.currentPhase} player's turn (${this.currentSubPhase} phase)`);
    
    // Update UI elements if they exist
    // This would be handled by the UI class in a real implementation
  }
  
  /**
   * Apply start-of-turn effects (e.g., reset movement points, etc.)
   */
  applyTurnStartEffects() {
    if (this.currentPhase === 'monster') {
      // Reset monster movement points
      for (const monster of this.gameState.monsters.values()) {
        // Check if the monster has the resetMovementPoints method
        if (typeof monster.resetMovementPoints === 'function') {
          monster.resetMovementPoints();
        } else {
          // Fallback for placeholder monster objects
          console.log('Monster does not have resetMovementPoints method - using fallback');
          monster.currentMovementPoints = monster.strengths?.movement || 
                                        monster.config?.movement || 
                                        4; // Default movement value
        }
      }
      
      // Other monster-specific turn start effects
      // ...
    } else {
      // Reset human unit movement points
      for (const unit of this.gameState.units.values()) {
        // Check if the unit has the resetMovementPoints method
        if (typeof unit.resetMovementPoints === 'function') {
          unit.resetMovementPoints();
        } else {
          // Fallback for placeholder unit objects
          console.log('Unit does not have resetMovementPoints method - using fallback');
          unit.currentMovementPoints = unit.stats?.movement || 2; // Default movement value
        }
      }
      
      // Other human-specific turn start effects
      // ...
    }
    
    // Emit turn start event
    this.scene.events.emit('turn-start-effects-applied', {
      turn: this.currentTurn,
      player: this.currentPhase
    });
  }
  
  /**
   * Apply end-of-turn effects
   */
  applyTurnEndEffects() {
    if (this.currentPhase === 'monster') {
      // Monster-specific turn end effects
      // ...
    } else {
      // Human-specific turn end effects
      
      // Fire spread (if any fire markers exist)
      this.handleFireSpread();
      
      // Other human-specific turn end effects
      // ...
    }
    
    // Emit turn end event
    this.scene.events.emit('turn-end-effects-applied', {
      turn: this.currentTurn,
      player: this.currentPhase
    });
  }
  
  /**
   * Apply effects at the end of a sub-phase
   */
  applySubPhaseEndEffects() {
    // Apply any effects specific to the end of the current sub-phase
    switch (this.currentSubPhase) {
      case 'movement':
        // End of movement phase effects
        break;
      case 'combat':
        // End of combat phase effects
        break;
      case 'destruction':
        // End of destruction phase effects
        break;
      case 'fire-control':
        // End of fire control phase effects
        break;
    }
    
    // Emit sub-phase end event
    this.scene.events.emit('sub-phase-end-effects-applied', {
      player: this.currentPhase,
      subPhase: this.currentSubPhase
    });
  }
  
  /**
   * Handle fire spread at the end of human turn
   */
  handleFireSpread() {
    // This would invoke the fire management system
    console.log('Fire spread would be handled here');
    
    // In a real implementation, we'd call something like:
    // this.scene.fireManager.spreadFires(this.gameState.config.windDirection);
  }
  
  /**
   * Check if an action of the given type is available
   * @param {string} actionType - Type of action to check
   * @returns {boolean} True if action is available
   */
  canPerformAction(actionType) {
    // Check if we're in the correct sub-phase for this action
    if (this.currentSubPhase !== actionType) {
      console.log(`Cannot perform ${actionType} action during ${this.currentSubPhase} phase`);
      return false;
    }
    
    // Check if we have actions remaining
    if (this.actionsRemaining[actionType] <= 0) {
      console.log(`No ${actionType} actions remaining this turn`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Consume an action of the given type
   * @param {string} actionType - Type of action to consume
   * @returns {boolean} True if action was consumed
   */
  consumeAction(actionType) {
    if (!this.canPerformAction(actionType)) {
      return false;
    }
    
    // Decrement action counter
    this.actionsRemaining[actionType]--;
    
    console.log(`${actionType} action consumed. ${this.actionsRemaining[actionType]} remaining.`);
    
    // Emit action consumed event
    this.scene.events.emit('action-consumed', {
      type: actionType,
      remaining: this.actionsRemaining[actionType]
    });
    
    return true;
  }
  
  /**
   * Handle completion of a movement action
   */
  onMovementCompleted() {
    // No need to decrement counter for movement, as units track their own movement points
    
    // Check if all units have used their movement points
    const allUnitsMoved = this.checkAllUnitsMoved();
    
    if (allUnitsMoved) {
      console.log('All units have used their movement points');
      this.readyToAdvance = true;
      
      // Optionally auto-advance to next phase
      // this.endCurrentSubPhase();
    }
  }
  
  /**
   * Handle completion of a combat action
   */
  onCombatCompleted() {
    // Combat doesn't have a limited number of actions, but we can track them
    this.consumeAction('combat');
  }
  
  /**
   * Handle completion of a destruction action (monster only)
   * @param {boolean} successful - Whether destruction was successful
   */
  onDestructionCompleted(successful) {
    // Only consume action if destruction was successful
    if (successful) {
      this.consumeAction('destruction');
    }
    
    // Check if all destruction actions have been used
    if (this.actionsRemaining.destruction <= 0) {
      console.log('All destruction actions have been used');
      this.readyToAdvance = true;
      
      // Optionally auto-advance to next phase
      // this.endCurrentSubPhase();
    }
  }
  
  /**
   * Handle completion of a fire control action (human only)
   */
  onFireControlCompleted() {
    // Fire control doesn't have a limited number of actions
    this.consumeAction('fire-control');
  }
  
  /**
   * Check if all units have used their movement points
   * @returns {boolean} True if all units have 0 movement points remaining
   */
  checkAllUnitsMoved() {
    if (this.currentPhase === 'monster') {
      // Check if all monsters have used their movement points
      for (const monster of this.gameState.monsters.values()) {
        if (monster.currentMovementPoints > 0) {
          return false;
        }
      }
    } else {
      // Check if all human units have used their movement points
      for (const unit of this.gameState.units.values()) {
        if (unit.faction === 'human' && unit.currentMovementPoints > 0) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * Get string representation of current turn state
   * @returns {string} Turn state description
   */
  getTurnStateText() {
    return `Turn ${this.currentTurn}: ${this.currentPhase.toUpperCase()} PLAYER - ${this.currentSubPhase.toUpperCase()} PHASE`;
  }
  
  /**
   * Get string representation of actions remaining
   * @returns {string} Actions remaining description
   */
  getActionsRemainingText() {
    if (this.currentSubPhase === 'destruction') {
      return `Destruction attempts remaining: ${this.actionsRemaining.destruction}`;
    } else if (this.currentSubPhase === 'movement') {
      return 'Use unit movement points';
    } else if (this.currentSubPhase === 'combat') {
      return 'Perform combat actions';
    } else if (this.currentSubPhase === 'fire-control') {
      return 'Extinguish fires';
    }
    
    return '';
  }
  
  /**
   * Update the turn indicator UI
   */
  updateUI() {
    // This would be better handled by a dedicated UI class
    console.log('Turn UI would be updated here or in a UI class');
  }
}

export default TurnManager;