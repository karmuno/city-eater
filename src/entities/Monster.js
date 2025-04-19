/**
 * Monster class - Represents the monster that the player controls
 * Implements customizable strengths and special abilities
 */
class Monster extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The Scene to which this monster belongs
   * @param {number} x - The initial x position
   * @param {number} y - The initial y position
   * @param {number} nodeId - The ID of the node this monster is on
   * @param {object} config - Configuration for monster strengths and abilities
   */
  constructor(scene, x, y, nodeId, config = {}) {
    super(scene, x, y);
    
    this.currentNodeId = nodeId;
    
    // Initialize strengths with provided values or defaults
    this.strengths = {
      attack: config.attack || 5,
      defense: config.defense || 10,
      buildingDestruction: config.buildingDestruction || 3,
      movement: config.movement || 4,
      maxDefense: config.defense || 10, // Track original defense for health percentage
    };
    
    // Initialize current movement points
    this.currentMovementPoints = this.strengths.movement;
    
    // Special abilities configuration
    this.specialAbilities = config.specialAbilities || [];
    
    // Ability cooldowns (turns until ability can be used again)
    this.abilityCooldowns = {};
    
    // Initialize all abilities with 0 cooldown
    this.specialAbilities.forEach(ability => {
      this.abilityCooldowns[ability] = 0;
    });
    
    // Monster state tracking
    this.isFlying = false;
    this.isInWater = false;
    this.victoryPoints = 0;
    
    // Track destruction attempts for this turn
    this.remainingDestructionAttempts = 3;
    
    // Create the visual representation
    this.createSprite(config.variant || 'a');
    
    // Add this container to the scene
    scene.add.existing(this);
  }
  
  /**
   * Create the visual sprite for the monster
   * @param {string} variant - The monster variant (a-f)
   */
  createSprite(variant) {
    // Add monster sprite based on the variant (a-f)
    const spriteKey = `creature_${variant}`;
    this.sprite = this.scene.add.sprite(0, 0, spriteKey);
    
    // If sprite isn't loaded yet, create a placeholder
    if (!this.sprite.texture.key || this.sprite.texture.key === '__MISSING') {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(0xFF0000, 1); // Red
      graphics.fillCircle(0, 0, 40);
      graphics.lineStyle(3, 0x000000, 1);
      graphics.strokeCircle(0, 0, 40);
      this.add(graphics);
      
      // Add a text indicating it's the monster
      const text = this.scene.add.text(0, 0, 'M', {
        fontFamily: 'Arial',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#FFFFFF'
      }).setOrigin(0.5);
      this.add(text);
    } else {
      // Add the actual sprite
      this.add(this.sprite);
      
      // Set up animations if needed
      // this.setupAnimations();
    }
    
    // Add a health bar
    this.healthBar = this.createHealthBar();
    this.add(this.healthBar);
    
    // Add interactive behavior
    this.setInteractive(new Phaser.Geom.Circle(0, 0, 40), Phaser.Geom.Circle.Contains);
    this.on('pointerdown', this.onClick, this);
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onHoverEnd, this);
  }
  
  /**
   * Create a health bar for the monster
   * @returns {Phaser.GameObjects.Container} Health bar container
   */
  createHealthBar() {
    const barContainer = new Phaser.GameObjects.Container(this.scene, 0, -50);
    
    // Background bar
    const barBg = this.scene.add.rectangle(0, 0, 80, 10, 0x000000);
    barBg.setOrigin(0.5, 0.5);
    barContainer.add(barBg);
    
    // Health bar
    const healthBar = this.scene.add.rectangle(0, 0, 80, 10, 0x00FF00);
    healthBar.setOrigin(0.5, 0.5);
    barContainer.add(healthBar);
    
    // Store a reference to the health bar for updates
    barContainer.healthBar = healthBar;
    
    return barContainer;
  }
  
  /**
   * Update the health bar display
   */
  updateHealthBar() {
    const healthPercentage = this.strengths.defense / this.strengths.maxDefense;
    this.healthBar.healthBar.width = 80 * healthPercentage;
    
    // Change color based on health
    let color;
    if (healthPercentage > 0.6) {
      color = 0x00FF00; // Green
    } else if (healthPercentage > 0.3) {
      color = 0xFFFF00; // Yellow
    } else {
      color = 0xFF0000; // Red
    }
    
    this.healthBar.healthBar.fillColor = color;
  }
  
  /**
   * Handle click on monster
   */
  onClick() {
    console.log(`Monster clicked at node ${this.currentNodeId}`);
    
    // Show movement range
    this.showMovementRange();
    
    // Emit selected event for other systems to respond
    this.scene.events.emit('monster-selected', this);
  }
  
  /**
   * Handle hover on monster
   */
  onHover() {
    // Scale up slightly to indicate hover
    this.setScale(1.1);
    
    // Show strengths as tooltip
    this.showStrengthsTooltip();
  }
  
  /**
   * Handle hover end
   */
  onHoverEnd() {
    // Reset scale
    this.setScale(1.0);
    
    // Hide tooltip
    this.hideStrengthsTooltip();
  }
  
  /**
   * Show a tooltip with monster strengths
   */
  showStrengthsTooltip() {
    if (this.strengthsTooltip) {
      this.hideStrengthsTooltip();
    }
    
    const text = [
      `Attack: ${this.strengths.attack}`,
      `Defense: ${this.strengths.defense}`,
      `Building Destruction: ${this.strengths.buildingDestruction}`,
      `Movement: ${this.strengths.movement}`,
      `Victory Points: ${this.victoryPoints}`
    ].join('\n');
    
    this.strengthsTooltip = this.scene.add.text(
      this.x + 60, 
      this.y - 30, 
      text,
      {
        fontSize: '14px',
        backgroundColor: '#00000099',
        padding: { x: 5, y: 5 },
        color: '#FFFFFF'
      }
    );
    
    this.strengthsTooltip.setDepth(1000); // Ensure it's on top
  }
  
  /**
   * Hide the strengths tooltip
   */
  hideStrengthsTooltip() {
    if (this.strengthsTooltip) {
      this.strengthsTooltip.destroy();
      this.strengthsTooltip = null;
    }
  }
  
  /**
   * Show the movement range for the monster
   */
  showMovementRange() {
    this.scene.mapManager.showMovementRange(
      this.currentNodeId, 
      this.currentMovementPoints, 
      this
    );
  }
  
  /**
   * Move monster to a new node
   * @param {number} targetNodeId - ID of the node to move to
   * @returns {boolean} True if move was successful
   */
  moveToNode(targetNodeId) {
    // Make sure target node exists
    const targetNode = this.scene.mapManager.nodes[targetNodeId];
    if (!targetNode) return false;
    
    // Get all reachable nodes to check for special movement cases
    const reachableNodes = this.scene.mapManager.findReachableNodes(
      this.currentNodeId, 
      this.currentMovementPoints, 
      this
    );
    
    // Find the target node in the reachable nodes
    const targetInfo = reachableNodes.find(node => node.id === targetNodeId);
    
    // If target node is reachable via special movement
    if (targetInfo && targetInfo.specialMovement) {
      // Special movement cases handle direct movement without a path
      console.log(`Using special movement '${targetInfo.specialMovement}' to node ${targetNodeId}`);
      
      // Create a direct path for visualization
      const path = [this.currentNodeId, targetNodeId];
      
      // Always use all movement points for special movement
      this.moveAlongPath(path, this.currentMovementPoints);
      return true;
    }
    
    // Normal pathfinding for standard movement
    const path = this.scene.mapManager.findPath(this.currentNodeId, targetNodeId, this);
    
    if (path.length === 0) {
      console.log(`No path found from node ${this.currentNodeId} to ${targetNodeId}`);
      return false;
    }
    
    // Calculate total movement cost
    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const cost = this.scene.mapManager.calculateMovementCost(path[i], path[i + 1], this);
      
      // Handle Infinity cost as all movement points
      if (cost === Infinity) {
        totalCost = this.currentMovementPoints;
        break;
      }
      
      totalCost += cost;
    }
    
    // Check if we have enough movement points
    if (totalCost > this.currentMovementPoints) {
      // Check for rule 5.15 - If adjacent, can always move with all movement points
      const currentNode = this.scene.mapManager.nodes[this.currentNodeId];
      
      if (currentNode.adjacentNodes.includes(targetNodeId)) {
        console.log(`Using rule 5.15: Moving to adjacent node ${targetNodeId} by expending all movement points`);
        this.moveAlongPath([this.currentNodeId, targetNodeId], this.currentMovementPoints);
        return true;
      }
      
      console.log(`Not enough movement points (${this.currentMovementPoints}) to move to node ${targetNodeId} (cost: ${totalCost})`);
      return false;
    }
    
    // Move along the path
    this.moveAlongPath(path, totalCost);
    return true;
  }
  
  /**
   * Move monster along a path of nodes
   * @param {array} path - Array of node IDs to move through
   * @param {number} totalCost - Total movement cost
   */
  moveAlongPath(path, totalCost) {
    // Get node coordinates for the path
    const coordinates = path.map(nodeId => {
      const node = this.scene.mapManager.nodes[nodeId];
      return { x: node.x, y: node.y };
    });
    
    // Create a timeline for movement
    const timeline = this.scene.tweens.createTimeline();
    
    // Add tweens for each step of the path
    for (let i = 1; i < coordinates.length; i++) {
      timeline.add({
        targets: this,
        x: coordinates[i].x,
        y: coordinates[i].y,
        duration: 300, // Slower for the monster
        ease: 'Power2',
        onStart: () => {
          // Emit event for movement start
          this.scene.events.emit('monster-move-start', this, path[i]);
          
          // TODO: Add movement sound
        }
      });
    }
    
    // Start the timeline
    timeline.play();
    
    // Update monster data after movement completes
    timeline.on('complete', () => {
      // Update current node and movement points
      this.currentNodeId = path[path.length - 1];
      this.currentMovementPoints -= totalCost;
      
      // Update water state
      const newNode = this.scene.mapManager.nodes[this.currentNodeId];
      this.isInWater = newNode && newNode.terrainType === 'river';
      
      // Emit movement completed event
      this.scene.events.emit('monster-moved', this);
      
      console.log(`Monster moved to node ${this.currentNodeId}, ${this.currentMovementPoints} MP remaining`);
    });
  }
  
  /**
   * Reset movement points and abilities at start of turn
   */
  startTurn() {
    // Reset movement points to full strength
    this.currentMovementPoints = this.strengths.movement;
    
    // Reset destruction attempts
    this.remainingDestructionAttempts = 3;
    
    // Reduce ability cooldowns
    for (const ability in this.abilityCooldowns) {
      if (this.abilityCooldowns[ability] > 0) {
        this.abilityCooldowns[ability]--;
      }
    }
    
    // Emit event that monster turn is starting
    this.scene.events.emit('monster-turn-start', this);
    
    console.log('Monster turn started');
  }
  
  /**
   * End the monster's turn
   */
  endTurn() {
    // Clear any movement range display
    if (this.scene.mapManager.rangeGraphics) {
      this.scene.mapManager.rangeGraphics.clear();
    }
    
    // If flying, decide whether to land or remain flying
    if (this.isFlying) {
      // For now, always land at the end of the turn
      this.isFlying = false;
    }
    
    // Emit event that monster turn is ending
    this.scene.events.emit('monster-turn-end', this);
    
    console.log('Monster turn ended');
  }
  
  /**
   * Attempt to destroy a building or bridge
   * @param {number} targetNodeId - ID of the node to attempt to destroy
   * @returns {boolean} True if destruction was attempted (success determined by dice roll)
   */
  attemptDestruction(targetNodeId) {
    // Check if we have destruction attempts remaining
    if (this.remainingDestructionAttempts <= 0) {
      console.log('No destruction attempts remaining this turn');
      return false;
    }
    
    // Verify target node exists
    const targetNode = this.scene.mapManager.nodes[targetNodeId];
    if (!targetNode) {
      console.log(`Target node ${targetNodeId} does not exist`);
      return false;
    }
    
    // Check if node is adjacent to monster
    const currentNode = this.scene.mapManager.nodes[this.currentNodeId];
    if (!currentNode || !currentNode.adjacentNodes.includes(targetNodeId)) {
      console.log(`Target node ${targetNodeId} is not adjacent to monster at ${this.currentNodeId}`);
      return false;
    }
    
    // Check if target is a destroyable terrain type
    const terrainType = targetNode.terrainType;
    const isDestroyable = ['lowBuilding', 'highBuilding', 'bridge'].includes(terrainType);
    
    if (!isDestroyable) {
      console.log(`Target node terrain (${terrainType}) cannot be destroyed`);
      return false;
    }
    
    // Reduce destruction attempts
    this.remainingDestructionAttempts--;
    
    // TODO: Roll dice and determine if destruction succeeds based on Building Destruction Rules
    // For now, use a basic calculation
    const destructionStrength = this.strengths.buildingDestruction;
    const buildingStrength = this.getTargetDestructionStrength(terrainType);
    
    // Calculate odds
    const ratio = Math.floor(destructionStrength / buildingStrength);
    const cappedRatio = Math.min(5, Math.max(1, ratio)); // Cap between 1-5
    
    // Roll a die (1-6)
    const dieRoll = Math.floor(Math.random() * 6) + 1;
    
    // Simplified destruction table
    // Higher ratios and higher rolls mean more likely to succeed
    const successThreshold = 7 - cappedRatio; // 5-1 ratio needs 2+, 1-1 ratio needs 6
    const success = dieRoll >= successThreshold;
    
    console.log(`Destruction attempt: ${destructionStrength} vs ${buildingStrength} (${cappedRatio}:1 odds), rolled ${dieRoll}, ${success ? 'SUCCESS' : 'FAILED'}`);
    
    // If successful, mark the node as destroyed
    if (success) {
      this.destroyNode(targetNodeId, terrainType);
    }
    
    // Emit event about the destruction attempt
    this.scene.events.emit('monster-destruction-attempt', {
      monsterId: this.id,
      targetNodeId: targetNodeId,
      success: success,
      dieRoll: dieRoll,
      ratio: cappedRatio,
      remainingAttempts: this.remainingDestructionAttempts
    });
    
    return true;
  }
  
  /**
   * Get the destruction strength of a target based on terrain type
   * @param {string} terrainType - Type of terrain
   * @returns {number} Destruction strength (higher = harder to destroy)
   */
  getTargetDestructionStrength(terrainType) {
    // Destruction strengths from the rulebook
    const strengths = {
      'lowBuilding': 2,
      'highBuilding': 4,
      'bridge': 2
    };
    
    return strengths[terrainType] || 1;
  }
  
  /**
   * Destroy a node after a successful destruction attempt
   * @param {number} nodeId - ID of the node to destroy
   * @param {string} terrainType - Original terrain type
   */
  destroyNode(nodeId, terrainType) {
    // Change terrain type to rubble
    const node = this.scene.mapManager.nodes[nodeId];
    if (!node) return;
    
    // Store original terrain for victory points calculation
    const originalTerrain = node.terrainType;
    
    // Update the node's terrain type to rubble
    node.terrainType = terrainType === 'bridge' ? 'river' : 'rubble'; // Bridges become river
    
    // Add victory points based on the terrain type
    let pointsGained = 0;
    
    if (originalTerrain === 'lowBuilding') {
      pointsGained = 3;
    } else if (originalTerrain === 'highBuilding') {
      pointsGained = 5;
    } else if (originalTerrain === 'bridge') {
      pointsGained = 5;
    }
    
    this.victoryPoints += pointsGained;
    
    // Check for City Eating Scenario rule - monster gains strength from destruction
    if (this.scene.scenario && this.scene.scenario.id === 'cityEating') {
      // Gain 2 strength points for destroying a box
      this.gainStrength(2);
    }
    
    console.log(`Node ${nodeId} destroyed! Terrain changed from ${originalTerrain} to ${node.terrainType}, gained ${pointsGained} VP`);
    
    // TODO: Add visual effect for destruction
    
    // Emit event about the destruction
    this.scene.events.emit('node-destroyed', {
      nodeId: nodeId,
      originalTerrain: originalTerrain,
      newTerrain: node.terrainType,
      victoryPoints: pointsGained
    });
  }
  
  /**
   * Gain strength points (for City Eating scenario)
   * @param {number} points - Number of points to gain
   */
  gainStrength(points) {
    if (points <= 0) return;
    
    // Let player choose which strengths to increase
    // For now, distribute evenly starting with attack
    const distribution = [
      'attack',
      'defense',
      'buildingDestruction',
      'movement'
    ];
    
    for (let i = 0; i < points; i++) {
      const strength = distribution[i % distribution.length];
      this.strengths[strength]++;
      
      // If defense increased, also increase maxDefense
      if (strength === 'defense') {
        this.strengths.maxDefense++;
      }
      
      console.log(`Monster gained 1 point to ${strength} (now ${this.strengths[strength]})`);
    }
    
    // Update health bar if defense changed
    this.updateHealthBar();
  }
  
  /**
   * Use a special ability
   * @param {string} abilityName - Name of the ability to use
   * @param {object} targetInfo - Information about the target (node, unit, etc.)
   * @returns {boolean} True if ability was used successfully
   */
  useAbility(abilityName, targetInfo = {}) {
    // Check if monster has this ability
    if (!this.specialAbilities.includes(abilityName)) {
      console.log(`Monster does not have the ${abilityName} ability`);
      return false;
    }
    
    // Check if ability is on cooldown
    if (this.abilityCooldowns[abilityName] > 0) {
      console.log(`${abilityName} is on cooldown for ${this.abilityCooldowns[abilityName]} more turns`);
      return false;
    }
    
    // Handle different abilities
    switch (abilityName) {
      case 'flying':
        return this.useFlying();
        
      case 'fireBreathing':
        return this.useFireBreathing(targetInfo.nodeId);
        
      case 'webSpinning':
        return this.useWebSpinning(targetInfo.nodeId);
        
      case 'fearImmobilization':
        return this.useFearImmobilization(targetInfo.unitIds);
        
      // Add more abilities as needed
        
      default:
        console.log(`Ability ${abilityName} not implemented yet`);
        return false;
    }
  }
  
  /**
   * Use the Flying ability
   * @returns {boolean} True if successful
   */
  useFlying() {
    this.isFlying = true;
    this.abilityCooldowns.flying = 1; // Can only be used once per turn
    
    console.log('Monster is now flying');
    
    // Emit event about the ability use
    this.scene.events.emit('monster-ability-used', {
      monsterId: this.id,
      ability: 'flying'
    });
    
    return true;
  }
  
  /**
   * Use the Fire Breathing ability
   * @param {number} targetNodeId - ID of node to breathe fire on
   * @returns {boolean} True if successful
   */
  useFireBreathing(targetNodeId) {
    // Verify target exists
    const targetNode = this.scene.mapManager.nodes[targetNodeId];
    if (!targetNode) return false;
    
    // Check if node is adjacent to monster
    const currentNode = this.scene.mapManager.nodes[this.currentNodeId];
    if (!currentNode || !currentNode.adjacentNodes.includes(targetNodeId)) {
      console.log(`Target node ${targetNodeId} is not adjacent to monster`);
      return false;
    }
    
    // Check if target is a valid terrain for fire (building or park)
    const validTerrains = ['lowBuilding', 'highBuilding', 'park'];
    if (!validTerrains.includes(targetNode.terrainType)) {
      console.log(`Cannot set fire to terrain type: ${targetNode.terrainType}`);
      return false;
    }
    
    // Set cooldown
    this.abilityCooldowns.fireBreathing = 1;
    
    // Roll die to determine if fire starts (1-3 on d6 means success)
    const dieRoll = Math.floor(Math.random() * 6) + 1;
    const success = dieRoll <= 3;
    
    if (success) {
      console.log(`Fire started at node ${targetNodeId}`);
      
      // TODO: Create fire marker on the node
      // For now just emit an event
      this.scene.events.emit('fire-started', {
        nodeId: targetNodeId,
        stage: 1 // Fire starts at stage 1
      });
    } else {
      console.log(`Failed to start fire at node ${targetNodeId} (rolled ${dieRoll})`);
    }
    
    // Emit event about the ability use
    this.scene.events.emit('monster-ability-used', {
      monsterId: this.id,
      ability: 'fireBreathing',
      targetNodeId: targetNodeId,
      success: success,
      dieRoll: dieRoll
    });
    
    return true;
  }
  
  /**
   * Use the Web Spinning ability
   * @param {number} targetNodeId - ID of node to place web
   * @returns {boolean} True if successful
   */
  useWebSpinning(targetNodeId) {
    // Verify target exists
    const targetNode = this.scene.mapManager.nodes[targetNodeId];
    if (!targetNode) return false;
    
    // Check if node is adjacent to monster
    const currentNode = this.scene.mapManager.nodes[this.currentNodeId];
    if (!currentNode || !currentNode.adjacentNodes.includes(targetNodeId)) {
      console.log(`Target node ${targetNodeId} is not adjacent to monster`);
      return false;
    }
    
    // Use all remaining movement points for this turn
    this.currentMovementPoints = 0;
    
    // Set cooldown
    this.abilityCooldowns.webSpinning = 1;
    
    console.log(`Web placed at node ${targetNodeId}`);
    
    // TODO: Create web marker on the node
    // For now just emit an event
    this.scene.events.emit('web-placed', {
      nodeId: targetNodeId
    });
    
    // Emit event about the ability use
    this.scene.events.emit('monster-ability-used', {
      monsterId: this.id,
      ability: 'webSpinning',
      targetNodeId: targetNodeId
    });
    
    return true;
  }
  
  /**
   * Use the Fear Immobilization ability
   * @param {array} unitIds - IDs of units to immobilize
   * @returns {boolean} True if successful
   */
  useFearImmobilization(unitIds) {
    if (!unitIds || unitIds.length === 0) {
      console.log('No units specified for fear immobilization');
      return false;
    }
    
    // Set cooldown
    this.abilityCooldowns.fearImmobilization = 1;
    
    console.log(`Units immobilized by fear: ${unitIds.join(', ')}`);
    
    // Emit event about the ability use
    this.scene.events.emit('monster-ability-used', {
      monsterId: this.id,
      ability: 'fearImmobilization',
      unitIds: unitIds
    });
    
    return true;
  }
  
  /**
   * Take damage from combat
   * @param {number} amount - Amount of damage to take
   * @returns {boolean} True if monster was destroyed (defense reduced to 0)
   */
  takeDamage(amount) {
    if (amount <= 0) return false;
    
    // Reduce defense by damage amount
    this.strengths.defense = Math.max(0, this.strengths.defense - amount);
    
    // Update health bar
    this.updateHealthBar();
    
    console.log(`Monster took ${amount} damage, defense now ${this.strengths.defense}/${this.strengths.maxDefense}`);
    
    // Check if monster is destroyed
    if (this.strengths.defense <= 0) {
      this.onDestroyed();
      return true;
    }
    
    return false;
  }
  
  /**
   * Handle monster destruction
   */
  onDestroyed() {
    console.log('Monster has been destroyed!');
    
    // Emit destroyed event
    this.scene.events.emit('monster-destroyed', this);
    
    // TODO: Play destruction animation
    
    // If monster has Great Height ability, it crushes what it falls on
    if (this.specialAbilities.includes('greatHeight')) {
      // Let player choose where monster falls
      // For now, just fall in place
      this.crushOnDeath(this.currentNodeId);
    }
  }
  
  /**
   * Crush a node when monster with Great Height dies
   * @param {number} targetNodeId - ID of node to crush
   */
  crushOnDeath(targetNodeId) {
    // Verify target exists
    const targetNode = this.scene.mapManager.nodes[targetNodeId];
    if (!targetNode) return;
    
    console.log(`Monster crushes node ${targetNodeId} as it falls`);
    
    // Change terrain to rubble
    targetNode.terrainType = 'rubble';
    
    // TODO: Destroy any units in the node
    
    // Emit event
    this.scene.events.emit('node-crushed', {
      nodeId: targetNodeId
    });
  }
}

export default Monster;