/**
 * RubbleMarker.js - Visual representation of destroyed buildings
 */
class RubbleMarker extends Phaser.GameObjects.Container {
  /**
   * @param {Phaser.Scene} scene - The scene this rubble marker belongs to
   * @param {number} x - The x position of this marker
   * @param {number} y - The y position of this marker
   * @param {number} nodeId - The ID of the node this rubble is on
   */
  constructor(scene, x, y, nodeId) {
    super(scene, x, y);
    
    this.id = `rubble-${Date.now()}-${Math.floor(Math.random() * 1000)}`; // Unique ID
    this.type = 'rubble';
    this.nodeId = nodeId;
    
    // Create the visual representation
    this.createVisuals();
    
    // Add to the scene
    scene.add.existing(this);
    
    // Add pointer interactions
    this.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
    this.on('pointerdown', this.onClick, this);
    this.on('pointerover', this.onHover, this);
    this.on('pointerout', this.onHoverEnd, this);
    
    // Emit event that a rubble marker has been placed
    scene.events.emit('marker-placed', this);
  }
  
  /**
   * Create visual representation of the rubble
   */
  createVisuals() {
    // Create base sprite
    this.sprite = this.scene.add.sprite(0, 0, 'rubble');
    this.sprite.setScale(0.7);
    this.add(this.sprite);
    
    // Create particles for dust effect
    this.createDustEffect();
  }
  
  /**
   * Create a dust particle effect
   */
  createDustEffect() {
    // Only create if the particle system is available
    if (!this.scene.particles) return;
    
    // Create a one-time dust particle effect
    const particles = this.scene.add.particles('rubble');
    
    const emitter = particles.createEmitter({
      alpha: { start: 0.7, end: 0 },
      scale: { start: 0.3, end: 0.1 },
      speed: { min: 5, max: 30 },
      lifespan: 2000,
      blendMode: 'ADD'
    });
    
    // Emit a burst of particles
    emitter.explode(20, this.x, this.y);
    
    // Auto-destroy after emission
    this.scene.time.delayedCall(2000, () => {
      particles.destroy();
    });
  }
  
  /**
   * Handle click on rubble marker
   */
  onClick() {
    console.log(`Rubble marker clicked (Node: ${this.nodeId})`);
    
    // Emit selected event
    this.scene.events.emit('rubble-marker-selected', this);
  }
  
  /**
   * Handle hover on rubble marker
   */
  onHover() {
    // Scale up slightly to indicate hover
    this.sprite.setScale(0.8);
    
    // Show tooltip with info
    this.showTooltip();
  }
  
  /**
   * Handle hover end
   */
  onHoverEnd() {
    // Reset scale
    this.sprite.setScale(0.7);
    
    // Hide tooltip
    this.hideTooltip();
  }
  
  /**
   * Show tooltip with rubble information
   */
  showTooltip() {
    if (this.tooltip) {
      this.hideTooltip();
    }
    
    const text = [
      'Rubble',
      `Node: ${this.nodeId}`,
      'Destroyed building'
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
   * Clear the rubble (repair)
   */
  clear() {
    // Play a clearing animation
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      scale: 0.3,
      duration: 500,
      onComplete: () => {
        // Remove the marker
        this.destroy();
      }
    });
  }
  
  /**
   * Destroy this rubble marker
   */
  destroy() {
    // Hide tooltip if visible
    this.hideTooltip();
    
    // Emit marker removed event before destruction
    this.scene.events.emit('marker-removed', this);
    
    // Call parent destroy method
    super.destroy();
  }
}

export default RubbleMarker;