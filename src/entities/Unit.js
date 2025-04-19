/**
 * Unit class - Base class for all units (military, civilian, etc.)
 */
class Unit extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The Scene to which this unit belongs
   * @param {number} x - The initial x position
   * @param {number} y - The initial y position
   * @param {string} type - The type of unit (e.g., 'infantry', 'artillery')
   * @param {number} nodeId - The ID of the node this unit is on
   * @param {object} stats - Unit statistics
   */
  constructor(scene, x, y, type, nodeId, stats = {}) {
    super(scene, x, y);
    
    this.type = type;
    this.currentNodeId = nodeId;
    
    // Default stats
    this.stats = {
      movementPoints: 4,
      attack: 2,
      defense: 2,
      health: 10,
      maxHealth: 10,
      ...stats
    };
    
    // Track current movement points (reset at beginning of turn)
    this.currentMovementPoints = this.stats.movementPoints;
    
    // Create visual representation
    this.createSprite();
    
    // Add this container to the scene
    scene.add.existing(this);
  }
  
  /**
   * Create the visual sprite for this unit
   */
  createSprite() {
    // Create a placeholder for the unit
    const unitColors = {
      infantry: 0x0000FF,
      artillery: 0xFF0000,
      armor: 0x00FF00,
      air: 0xFFFF00,
      civilian: 0xFF00FF
    };
    
    // Default color if type not found
    const color = unitColors[this.type] || 0xCCCCCC;
    
    // Create a circle for the unit
    const unitGraphic = this.scene.add.graphics();
    unitGraphic.fillStyle(color, 1);
    unitGraphic.lineStyle(2, 0x000000, 1);
    unitGraphic.fillCircle(0, 0, 15);
    unitGraphic.strokeCircle(0, 0, 15);
    
    // Add a text indicating unit type
    const text = this.scene.add.text(0, 0, this.type.charAt(0).toUpperCase(), {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    
    // Add the graphics and text to this container
    this.add([unitGraphic, text]);
    
    // Add interactive behavior
    this.setInteractive(new Phaser.Geom.Circle(0, 0, 15), Phaser.Geom.Circle.Contains);
    
    this.on('pointerdown', this.onClick, this);
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onHoverEnd, this);
  }
  
  /**
   * Handle click on unit
   */
  onClick() {
    console.log(`Unit ${this.type} clicked at node ${this.currentNodeId}`);
    
    // Show movement range
    this.showMovementRange();
    
    // Emit selected event for other systems to respond
    this.scene.events.emit('unit-selected', this);
  }
  
  /**
   * Handle hover on unit
   */
  onHover() {
    // Scale up slightly to indicate hover
    this.setScale(1.1);
  }
  
  /**
   * Handle hover end
   */
  onHoverEnd() {
    // Reset scale
    this.setScale(1.0);
  }
  
  /**
   * Show the movement range for this unit
   */
  showMovementRange() {
    this.scene.mapManager.showMovementRange(
      this.currentNodeId, 
      this.currentMovementPoints, 
      this
    );
  }
  
  /**
   * Move unit to a new node
   * @param {number} targetNodeId - ID of the node to move to
   * @returns {boolean} True if move was successful
   */
  moveToNode(targetNodeId) {
    // Make sure target node exists
    const targetNode = this.scene.mapManager.nodes[targetNodeId];
    if (!targetNode) return false;
    
    // Calculate path and movement cost
    const path = this.scene.mapManager.findPath(this.currentNodeId, targetNodeId, this);
    
    if (path.length === 0) {
      console.log(`No path found from node ${this.currentNodeId} to ${targetNodeId}`);
      return false;
    }
    
    // Calculate total movement cost
    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const cost = this.scene.mapManager.calculateMovementCost(path[i], path[i + 1], this);
      totalCost += cost;
    }
    
    // Check if we have enough movement points
    if (totalCost > this.currentMovementPoints) {
      console.log(`Not enough movement points (${this.currentMovementPoints}) to move to node ${targetNodeId} (cost: ${totalCost})`);
      return false;
    }
    
    // Move along the path
    this.moveAlongPath(path, totalCost);
    return true;
  }
  
  /**
   * Move unit along a path of nodes
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
        duration: 200,
        ease: 'Linear'
      });
    }
    
    // Start the timeline
    timeline.play();
    
    // Update unit data after movement completes
    timeline.on('complete', () => {
      // Update current node and movement points
      this.currentNodeId = path[path.length - 1];
      this.currentMovementPoints -= totalCost;
      
      // Emit movement completed event
      this.scene.events.emit('unit-moved', this);
      
      console.log(`Unit ${this.type} moved to node ${this.currentNodeId}, ${this.currentMovementPoints} MP remaining`);
    });
  }
  
  /**
   * Reset movement points at start of turn
   */
  resetMovementPoints() {
    this.currentMovementPoints = this.stats.movementPoints;
  }
  
  /**
   * Take damage
   * @param {number} amount - Amount of damage to take
   * @returns {boolean} True if unit was destroyed
   */
  takeDamage(amount) {
    this.stats.health -= amount;
    
    // Check if unit is destroyed
    if (this.stats.health <= 0) {
      this.destroy();
      return true;
    }
    
    return false;
  }
  
  /**
   * Heal unit
   * @param {number} amount - Amount to heal
   */
  heal(amount) {
    this.stats.health = Math.min(this.stats.health + amount, this.stats.maxHealth);
  }
}

export default Unit;