/**
 * FireMarker.js - Visual and logical representation of fire on the map
 * Handles fire intensity, spread, and damage mechanics
 */
class FireMarker extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this fire marker belongs to
   * @param {number} x - The x position of this marker
   * @param {number} y - The y position of this marker
   * @param {number} nodeId - The ID of the node this fire is on
   * @param {number} intensity - The initial intensity of the fire (1-3)
   */
  constructor(scene, x, y, nodeId, intensity = 1) {
    super(scene, x, y);
    
    this.id = `fire-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Unique ID
    this.type = 'fire';
    this.nodeId = nodeId;
    this.intensity = Phaser.Math.Clamp(intensity, 1, 3); // Clamp between 1-3
    
    // Create the visual representation
    this.createVisuals();
    
    // Add to the scene
    scene.add.existing(this);
    
    // Add pointer interactions
    this.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
    this.on('pointerdown', this.onClick, this);
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onHoverEnd, this);
    
    // Emit event that a fire marker has been placed
    scene.events.emit('marker-placed', this);
  }
  
  /**
   * Create visual representation of the fire
   */
  createVisuals() {
    // Clear any existing visuals
    this.removeAll(true);
    
    // Create base sprite
    this.sprite = this.scene.add.sprite(0, 0, 'fire');
    this.add(this.sprite);
    
    // Apply visual changes based on intensity
    this.updateVisuals();
  }
  
  /**
   * Update visual appearance based on intensity
   */
  updateVisuals() {
    if (!this.sprite) return;
    
    // Scale based on intensity (larger for higher intensity)
    const baseScale = 0.7;
    this.sprite.setScale(baseScale + (this.intensity - 1) * 0.15);
    
    // Tint based on intensity (darker/redder for higher intensity)
    let tint;
    switch (this.intensity) {
      case 1:
        tint = 0xFFAA00; // Orange
        break;
      case 2:
        tint = 0xFF5500; // Orange-red
        break;
      case 3:
        tint = 0xFF0000; // Bright red
        break;
      default:
        tint = 0xFFAA00;
    }
    this.sprite.setTint(tint);
    
    // Add intensity indicators
    this.createIntensityIndicators();
    
    // Add flickering animation
    this.addFireAnimation();
  }
  
  /**
   * Create visual indicators for fire intensity
   */
  createIntensityIndicators() {
    // Remove any existing indicators
    if (this.intensityContainer) {
      this.remove(this.intensityContainer);
    }
    
    // Create container for intensity pips
    this.intensityContainer = new Phaser.GameObjects.Container(this.scene, 0, 25);
    this.add(this.intensityContainer);
    
    // Add pips based on intensity
    for (let i = 0; i < this.intensity; i++) {
      const pip = this.scene.add.circle(
        (i - (this.intensity - 1) / 2) * 10, 
        0, 
        3, 
        0xFF0000
      );
      this.intensityContainer.add(pip);
    }
  }
  
  /**
   * Add flickering animation to fire sprite
   */
  addFireAnimation() {
    // Stop any existing animations
    if (this.flickerTween) {
      this.flickerTween.stop();
    }
    
    // Create a random flicker effect
    this.flickerTween = this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.85, to: 1 },
      scaleX: { from: this.sprite.scaleX * 0.9, to: this.sprite.scaleX * 1.1 },
      scaleY: { from: this.sprite.scaleY * 0.9, to: this.sprite.scaleY * 1.1 },
      duration: 500 + Math.random() * 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  /**
   * Handle click on fire marker
   */
  onClick() {
    console.log(`Fire marker clicked (Node: ${this.nodeId}, Intensity: ${this.intensity})`);
    
    // Emit selected event
    this.scene.events.emit('fire-marker-selected', this);
  }
  
  /**
   * Handle hover on fire marker
   */
  onHover() {
    // Scale up slightly to indicate hover
    this.sprite.setScale(this.sprite.scaleX * 1.1);
    
    // Show tooltip with info
    this.showTooltip();
  }
  
  /**
   * Handle hover end
   */
  onHoverEnd() {
    // Reset scale
    this.updateVisuals();
    
    // Hide tooltip
    this.hideTooltip();
  }
  
  /**
   * Show tooltip with fire information
   */
  showTooltip() {
    if (this.tooltip) {
      this.hideTooltip();
    }
    
    const text = [
      `Fire (Intensity: ${this.intensity}/3)`,
      `Node: ${this.nodeId}`,
      `Spreads on wind direction: ${this.scene.gameState?.config?.windDirection || 'N/A'}`
    ].join('\n');
    
    this.tooltip = this.scene.add.text(
      this.x + 30,
      this.y - 20,
      text,
      {
        fontSize: '14px',
        backgroundColor: '#00000099',
        padding: { x: 5, y: 5 },
        color: '#FFFFFF'
      }
    );
    
    this.tooltip.setDepth(1000); // Ensure it's on top
  }
  
  /**
   * Hide the tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy();
      this.tooltip = null;
    }
  }
  
  /**
   * Increase fire intensity by one level
   * @returns {boolean} Whether intensity was increased
   */
  increaseIntensity() {
    if (this.intensity >= 3) {
      return false; // Already at max intensity
    }
    
    this.intensity++;
    this.updateVisuals();
    
    console.log(`Fire at node ${this.nodeId} increased to intensity ${this.intensity}`);
    
    // Emit intensity changed event
    this.scene.events.emit('fire-intensity-changed', {
      nodeId: this.nodeId,
      intensity: this.intensity,
      marker: this
    });
    
    return true;
  }
  
  /**
   * Decrease fire intensity by one level
   * @returns {boolean} Whether intensity was decreased
   */
  decreaseIntensity() {
    if (this.intensity <= 1) {
      return false; // Already at min intensity
    }
    
    this.intensity--;
    this.updateVisuals();
    
    console.log(`Fire at node ${this.nodeId} decreased to intensity ${this.intensity}`);
    
    // Emit intensity changed event
    this.scene.events.emit('fire-intensity-changed', {
      nodeId: this.nodeId,
      intensity: this.intensity,
      marker: this
    });
    
    return true;
  }
  
  /**
   * Extinguish the fire (partially or completely)
   * @param {number} amount - Amount of fire to extinguish (1-3)
   * @returns {boolean} Whether fire was completely extinguished
   */
  extinguish(amount = 1) {
    if (amount >= this.intensity) {
      // Fire is completely extinguished
      this.destroy();
      return true;
    } else {
      // Fire is partially extinguished
      this.intensity -= amount;
      this.updateVisuals();
      
      // Emit intensity changed event
      this.scene.events.emit('fire-intensity-changed', {
        nodeId: this.nodeId,
        intensity: this.intensity,
        marker: this
      });
      
      return false;
    }
  }
  
  /**
   * Check if the fire can spread to a target node
   * @param {number} targetNodeId - ID of node to check for spread eligibility
   * @param {number} windDirection - Current wind direction (1-6, clockwise)
   * @returns {boolean} Whether fire can spread to this node
   */
  canSpreadTo(targetNodeId, windDirection) {
    // Get the target node's data
    const targetNode = this.scene.mapManager.getNode(targetNodeId);
    if (!targetNode) return false;
    
    // Check if node already has a fire
    const hasExistingFire = this.scene.gameState.hasMarker(targetNodeId, 'fire');
    if (hasExistingFire) return false;
    
    // Check if node has valid terrain for fire
    const validTerrains = ['lowBuilding', 'highBuilding', 'park'];
    if (!validTerrains.includes(targetNode.terrainType)) return false;
    
    // Calculate source and target node relationship to determine spread chance
    // This is a simplified version - real game would use more complex logic
    const sourceNode = this.scene.mapManager.getNode(this.nodeId);
    if (!sourceNode || !sourceNode.adjacentNodes.includes(targetNodeId)) {
      return false; // Only spread to adjacent nodes
    }
    
    // Get the directional relationship between nodes
    const directionOfSpread = this.getDirectionBetweenNodes(sourceNode, targetNode);
    
    // Check if the spread direction aligns with wind direction
    // Wind direction is 1-6 (clockwise), so convert to 0-5 for calculations
    const adjustedWind = ((windDirection - 1) % 6);
    
    // Calculate directional alignment (0 = perfect alignment, 3 = opposite direction)
    // Wind strongly affects spread probability
    const directionalAlignment = Math.abs((directionOfSpread - adjustedWind + 3) % 6 - 3);
    
    // Calculate base spread probability based on intensity and wind alignment
    // Higher intensity = higher spread chance
    // Better wind alignment = higher spread chance
    const baseSpreadChance = this.intensity * 20; // 20%, 40%, or 60% base chance
    const windModifier = (3 - directionalAlignment) * 10; // 0% to 30% wind bonus
    
    const spreadChance = Math.min(90, baseSpreadChance + windModifier); // Cap at 90%
    
    // Determine if spread happens based on probability
    return (Math.random() * 100) < spreadChance;
  }
  
  /**
   * Get the directional relationship between two nodes (0-5)
   * @param {Object} sourceNode - Source node object
   * @param {Object} targetNode - Target node object
   * @returns {number} Direction value (0-5, clockwise)
   */
  getDirectionBetweenNodes(sourceNode, targetNode) {
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    
    // Calculate angle in radians
    const angle = Math.atan2(dy, dx);
    
    // Convert to 0-5 direction (clockwise from east)
    // 0 = East, 1 = Southeast, 2 = Southwest, 3 = West, 4 = Northwest, 5 = Northeast
    return Math.floor(((angle + Math.PI) / (Math.PI / 3) + 0.5) % 6);
  }
  
  /**
   * Destroy this fire marker
   * @param {boolean} [createRubble=false] - Whether to create a rubble marker when destroyed
   */
  destroy(createRubble = false) {
    // Stop animations
    if (this.flickerTween) {
      this.flickerTween.stop();
    }
    
    // Hide tooltip if visible
    this.hideTooltip();
    
    // Emit marker removed event before destruction
    this.scene.events.emit('marker-removed', this);
    
    // If this was a stage 3 fire and createRubble is true, create a rubble marker
    if (createRubble && this.intensity >= 3) {
      this.convertToRubble();
    }
    
    // Call parent destroy method
    super.destroy();
  }
  
  /**
   * Convert a maximum intensity fire to rubble
   */
  convertToRubble() {
    // Get the node data
    const node = this.scene.mapManager.getNode(this.nodeId);
    if (!node) return;
    
    // Only convert buildings to rubble
    if (!['lowBuilding', 'highBuilding'].includes(node.terrainType)) {
      return;
    }
    
    console.log(`Converting fire at node ${this.nodeId} to rubble`);
    
    // Change the node's terrain type to rubble
    node.terrainType = 'rubble';
    
    // Create a rubble marker
    // Note: This would be handled by a RubbleMarker class in a full implementation
    const rubbleMarker = {
      id: `rubble-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: 'rubble',
      nodeId: this.nodeId
    };
    
    // Emit event for the rubble marker creation
    this.scene.events.emit('marker-placed', rubbleMarker);
    
    // Award victory points to the monster for destruction
    // Points depend on the building type that was destroyed
    const vpValue = node.terrainType === 'highBuilding' ? 5 : 3;
    
    // Emit building destroyed event with victory points
    this.scene.events.emit('building-destroyed', {
      nodeId: this.nodeId,
      terrainType: node.terrainType,
      cause: 'fire',
      victoryPoints: vpValue
    });
  }
  
  /**
   * Update the fire marker (for game loop)
   * @param {number} time - Current time
   * @param {number} delta - Time since last update
   */
  update(time, delta) {
    // Animation updates could be handled here if needed
  }
}

export default FireMarker;