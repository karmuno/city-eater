/**
 * CombatManager.js - Handles combat resolution between units and monsters
 */
class CombatManager {
  /**
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   * @param {GameState} gameState - Reference to the game state
   * @param {DataManager} dataManager - Reference to the data manager
   */
  constructor(scene, gameState, dataManager) {
    this.scene = scene;
    this.gameState = gameState;
    this.dataManager = dataManager;
    
    // Track current combat state
    this.activeCombat = null;
    
    // Set up event listeners
    this.setupEvents();
  }
  
  /**
   * Set up event listeners
   */
  setupEvents() {
    // Listen for combat initiation
    this.scene.events.on('combat-initiated', this.initiateCombat, this);
    
    // Listen for data loaded events
    this.dataManager.onDataLoaded(this.onDataLoaded.bind(this), 'combatTables');
  }
  
  /**
   * Handle data loaded events
   * @param {string} dataType - Type of data that was loaded
   */
  onDataLoaded(dataType) {
    console.log(`CombatManager: ${dataType} loaded`);
  }
  
  /**
   * Initiate combat between units
   * @param {Object} params - Combat parameters
   * @param {Unit|Monster} params.attacker - The attacking unit/monster
   * @param {Unit|Monster} params.defender - The defending unit/monster
   * @param {boolean} params.isRanged - Whether this is a ranged attack
   */
  initiateCombat(params) {
    console.log('Combat initiated:', params);
    
    // Validate combat participants
    if (!this.validateCombatants(params.attacker, params.defender)) {
      return;
    }
    
    // Store current combat state
    this.activeCombat = {
      attacker: params.attacker,
      defender: params.defender,
      isRanged: params.isRanged || false,
      terrainModifiers: this.calculateTerrainModifiers(params.defender),
      specialModifiers: this.calculateSpecialModifiers(params.attacker, params.defender)
    };
    
    // Calculate combat odds
    const odds = this.calculateCombatOdds();
    
    // Roll for result
    const dieRoll = this.rollDie();
    
    // Get result from combat table
    const result = this.resolveCombat(odds, dieRoll);
    
    // Apply combat result to units
    this.applyCombatResult(result, dieRoll);
    
    // Clean up after combat
    this.activeCombat = null;
  }
  
  /**
   * Validate combat participants
   * @param {Unit|Monster} attacker - The attacking unit
   * @param {Unit|Monster} defender - The defending unit
   * @returns {boolean} True if combat is valid
   */
  validateCombatants(attacker, defender) {
    // Check if participants exist
    if (!attacker || !defender) {
      console.error('Invalid combat participants: Missing attacker or defender');
      return false;
    }
    
    // Check if attacker can attack
    if (attacker.currentMovementPoints <= 0) {
      console.error('Attacker has no movement points remaining');
      return false;
    }
    
    // Check if units are in adjacent nodes (unless ranged attack)
    const isAdjacent = this.scene.mapManager.areNodesAdjacent(
      attacker.currentNodeId, 
      defender.currentNodeId
    );
    
    const hasRangedAttack = attacker.specialAbilities && 
                           attacker.specialAbilities.includes('rangedAttack');
    
    if (!isAdjacent && !hasRangedAttack) {
      console.error('Units must be adjacent for combat (or attacker must have ranged attack)');
      return false;
    }
    
    // Check if units are on the same node
    if (attacker.currentNodeId === defender.currentNodeId) {
      // Determine if it's a monster attacking units on same node
      const isMonsterAttackingUnit = attacker.constructor.name === 'Monster' && 
                                    defender.constructor.name === 'Unit';
      
      if (!isMonsterAttackingUnit) {
        console.error('Units on the same node cannot attack each other (except monster)');
        return false;
      }
    }
    
    // Check for valid factions (only opposing factions can attack)
    const attackerFaction = attacker.constructor.name === 'Monster' ? 'monster' : 'human';
    const defenderFaction = defender.constructor.name === 'Monster' ? 'monster' : 'human';
    
    if (attackerFaction === defenderFaction) {
      console.error('Units of the same faction cannot attack each other');
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculate terrain modifiers for combat
   * @param {Unit|Monster} defender - The defending unit
   * @returns {Object} Terrain modifiers
   */
  calculateTerrainModifiers(defender) {
    const nodeId = defender.currentNodeId;
    const node = this.scene.mapManager.nodes[nodeId];
    
    if (!node) return { attack: 0, defense: 0 };
    
    // Terrain defense bonuses
    const terrainDefenseModifiers = {
      'rubble': 1,
      'lowBuilding': 2,
      'highBuilding': 3,
      'park': 0,
      'street': 0,
      'river': -1,  // Penalty when defending in water (except for waterborne units)
      'bridge': 0
    };
    
    let defenseMod = terrainDefenseModifiers[node.terrainType] || 0;
    
    // Special case for waterborne units
    if (node.terrainType === 'river' && 
        defender.specialAbilities && 
        defender.specialAbilities.includes('waterOnly')) {
      defenseMod = 1;  // Waterborne units get bonus in water
    }
    
    return {
      attack: 0,  // Terrain doesn't affect attack strength
      defense: defenseMod
    };
  }
  
  /**
   * Calculate special ability modifiers for combat
   * @param {Unit|Monster} attacker - The attacking unit
   * @param {Unit|Monster} defender - The defending unit
   * @returns {Object} Special ability modifiers
   */
  calculateSpecialModifiers(attacker, defender) {
    const attackMod = 0;
    let defenseMod = 0;
    
    // Check for special abilities
    if (attacker.specialAbilities) {
      // Example: Flying units get +1 when attacking non-flying units
      if (attacker.specialAbilities.includes('flying') && 
          (!defender.specialAbilities || !defender.specialAbilities.includes('flying'))) {
        attackMod += 1;
      }
    }
    
    // Check defender special abilities
    if (defender.specialAbilities) {
      // Add defensive bonuses
    }
    
    return {
      attack: attackMod,
      defense: defenseMod
    };
  }
  
  /**
   * Calculate combat odds ratio
   * @returns {number} Odds ratio (positive for attacker advantage, negative for defender advantage)
   */
  calculateCombatOdds() {
    const { attacker, defender, terrainModifiers, specialModifiers } = this.activeCombat;
    
    // Get base strength values
    let attackStrength = attacker.strengths ? attacker.strengths.attack : attacker.stats.attack;
    let defenseStrength = defender.strengths ? defender.strengths.defense : defender.stats.defense;
    
    // Apply modifiers
    attackStrength += terrainModifiers.attack + specialModifiers.attack;
    defenseStrength += terrainModifiers.defense + specialModifiers.defense;
    
    // Ensure positive values
    attackStrength = Math.max(1, attackStrength);
    defenseStrength = Math.max(1, defenseStrength);
    
    // Calculate odds ratio
    let ratio;
    if (attackStrength >= defenseStrength) {
      ratio = Math.floor(attackStrength / defenseStrength);
      // Cap at 5-1 for display
      ratio = Math.min(5, ratio);
    } else {
      ratio = -Math.floor(defenseStrength / attackStrength);
      // Cap at 1-3 for display
      ratio = Math.max(-3, ratio);
    }
    
    console.log(`Combat odds: ${attackStrength}:${defenseStrength} (${ratio > 0 ? ratio + ':1' : '1:' + Math.abs(ratio)})`);
    
    return ratio;
  }
  
  /**
   * Roll a die for combat resolution
   * @returns {number} Die roll result (1-6)
   */
  rollDie() {
    const result = Math.floor(Math.random() * 6) + 1;
    console.log(`Combat die roll: ${result}`);
    return result;
  }
  
  /**
   * Resolve combat using odds and die roll
   * @param {number} odds - Odds ratio
   * @param {number} dieRoll - Die roll result
   * @returns {Object} Combat result
   */
  resolveCombat(odds, dieRoll) {
    // Use the data manager to get result from combat tables
    let result;
    
    if (this.dataManager.isLoaded.combatTables) {
      // Get attacker and defender strengths for data manager
      const { attacker, defender, terrainModifiers, specialModifiers } = this.activeCombat;
      
      const attackStrength = (attacker.strengths ? attacker.strengths.attack : attacker.stats.attack) + 
                           terrainModifiers.attack + specialModifiers.attack;
                           
      const defenseStrength = (defender.strengths ? defender.strengths.defense : defender.stats.defense) + 
                            terrainModifiers.defense + specialModifiers.defense;
      
      // Get result from combat tables
      result = this.dataManager.getCombatResult(attackStrength, defenseStrength, dieRoll);
    } else {
      // Fallback if combat tables aren't loaded
      console.warn('Combat tables not loaded, using fallback resolution');
      result = this.fallbackCombatResolution(odds, dieRoll);
    }
    
    console.log('Combat result:', result);
    return result;
  }
  
  /**
   * Fallback combat resolution when tables aren't loaded
   * @param {number} odds - Odds ratio
   * @param {number} dieRoll - Die roll result
   * @returns {Object} Combat result
   */
  fallbackCombatResolution(odds, dieRoll) {
    // Simple fallback logic:
    // - High roll + positive odds: defender suffers
    // - Low roll + negative odds: attacker suffers
    // - Middle values: mixed results
    
    if (odds > 0) {
      // Attacker has advantage
      if (dieRoll >= 5) {
        return { defender: 'eliminated', attacker: 'none' }; // DE
      } else if (dieRoll >= 3) {
        return { defender: 'retreat', attacker: 'none' }; // DR
      } else if (dieRoll >= 2) {
        return { defender: 'none', attacker: 'none' }; // NE
      } else {
        return { defender: 'none', attacker: 'retreat' }; // AR
      }
    } else {
      // Defender has advantage
      if (dieRoll <= 2) {
        return { defender: 'none', attacker: 'eliminated' }; // AE
      } else if (dieRoll <= 4) {
        return { defender: 'none', attacker: 'retreat' }; // AR
      } else if (dieRoll <= 5) {
        return { defender: 'none', attacker: 'none' }; // NE
      } else {
        return { defender: 'retreat', attacker: 'none' }; // DR
      }
    }
  }
  
  /**
   * Apply combat result to units
   * @param {Object} result - Combat result
   * @param {number} dieRoll - Die roll result
   */
  applyCombatResult(result, dieRoll) {
    const { attacker, defender } = this.activeCombat;
    let attackerDestroyed = false;
    let defenderDestroyed = false;
    
    // Apply result to defender
    switch (result.defender) {
      case 'eliminated':
        // Destroy defender
        defenderDestroyed = true;
        break;
        
      case 'retreat':
        // Retreat defender
        this.retreatUnit(defender);
        break;
        
      case 'damage':
        // Damage defender
        if (defender.constructor.name === 'Monster') {
          const damageAmount = Math.ceil(defender.strengths.defense * 0.25); // 25% damage
          defenderDestroyed = defender.takeDamage(damageAmount);
        }
        break;
    }
    
    // Apply result to attacker
    switch (result.attacker) {
      case 'eliminated':
        // Destroy attacker
        attackerDestroyed = true;
        break;
        
      case 'retreat':
        // Retreat attacker
        this.retreatUnit(attacker);
        break;
        
      case 'damage':
        // Damage attacker
        if (attacker.constructor.name === 'Monster') {
          const damageAmount = Math.ceil(attacker.strengths.defense * 0.25); // 25% damage
          attackerDestroyed = attacker.takeDamage(damageAmount);
        }
        break;
    }
    
    // Destroy units if needed
    if (defenderDestroyed) {
      this.destroyUnit(defender);
    }
    
    if (attackerDestroyed) {
      this.destroyUnit(attacker);
    }
    
    // Consume attacker's movement points (always costs all movement for attack)
    if (attacker.currentMovementPoints) {
      attacker.currentMovementPoints = 0;
    }
    
    // Emit combat resolved event
    this.scene.events.emit('combat-resolved', {
      attacker: attacker,
      defender: defender,
      result: result,
      dieRoll: dieRoll,
      winner: result.defender === 'eliminated' ? 'attacker' : 
              (result.attacker === 'eliminated' ? 'defender' : 'draw'),
      unitDestroyed: defenderDestroyed,
      monsterDamaged: defender.constructor.name === 'Monster' && result.defender === 'damage',
      damageAmount: defender.constructor.name === 'Monster' && result.defender === 'damage' ? 
                    Math.ceil(defender.strengths.defense * 0.25) : 0
    });
  }
  
  /**
   * Force a unit to retreat
   * @param {Unit|Monster} unit - The unit to retreat
   */
  retreatUnit(unit) {
    // Get possible retreat paths
    const currentNode = this.scene.mapManager.nodes[unit.currentNodeId];
    if (!currentNode) return;
    
    // Get adjacent nodes that aren't occupied by enemies
    const adjacentNodes = currentNode.adjacentNodes
      .map(nodeId => this.scene.mapManager.nodes[nodeId])
      .filter(node => {
        // Check if node exists
        if (!node) return false;
        
        // Check if node is blocked by terrain
        if (['rubble', 'highBuilding'].includes(node.terrainType)) {
          return false;
        }
        
        // If unit can't enter water, exclude rivers
        if (node.terrainType === 'river' && 
            (!unit.specialAbilities || !unit.specialAbilities.includes('waterOnly'))) {
          return false;
        }
        
        // If unit is monster, don't retreat to nodes with human units
        if (unit.constructor.name === 'Monster') {
          return !this.gameState.getUnitsAtNode(node.id).length;
        }
        
        // If unit is human, don't retreat to nodes with monster
        return !this.gameState.getMonstersAtNode(node.id).length;
      });
    
    if (adjacentNodes.length === 0) {
      // No retreat path, unit is eliminated
      console.log('Unit has nowhere to retreat, eliminated');
      this.destroyUnit(unit);
      return;
    }
    
    // Choose random retreat node
    const retreatNode = adjacentNodes[Math.floor(Math.random() * adjacentNodes.length)];
    
    // Move unit to retreat node
    console.log(`Unit retreating to node ${retreatNode.id}`);
    unit.moveToNode(retreatNode.id);
  }
  
  /**
   * Destroy a unit after combat
   * @param {Unit|Monster} unit - The unit to destroy
   */
  destroyUnit(unit) {
    console.log(`Destroying ${unit.constructor.name} after combat`);
    
    // Remove from game
    if (unit.constructor.name === 'Monster') {
      // Emit monster destroyed event
      unit.onDestroyed();
    } else {
      // Remove unit from game
      unit.destroy();
      
      // Emit unit destroyed event
      this.scene.events.emit('unit-destroyed', unit);
    }
  }
  
  /**
   * Show preview of combat odds before attacking
   * @param {Unit|Monster} attacker - The attacking unit
   * @param {Unit|Monster} defender - The defending unit
   * @returns {Object} Odds information for display
   */
  getCombatPreview(attacker, defender) {
    // Store current state temporarily
    this.activeCombat = {
      attacker,
      defender,
      terrainModifiers: this.calculateTerrainModifiers(defender),
      specialModifiers: this.calculateSpecialModifiers(attacker, defender)
    };
    
    // Calculate odds
    const odds = this.calculateCombatOdds();
    
    // Reset active combat
    const preview = {
      ratio: odds,
      displayRatio: odds > 0 ? `${odds}:1` : `1:${Math.abs(odds)}`,
      attackerStrength: attacker.strengths ? attacker.strengths.attack : attacker.stats.attack,
      defenderStrength: defender.strengths ? defender.strengths.defense : defender.stats.defense,
      terrainBonus: this.activeCombat.terrainModifiers.defense,
      specialBonus: this.activeCombat.specialModifiers.defense
    };
    
    this.activeCombat = null;
    
    return preview;
  }
}

export default CombatManager;