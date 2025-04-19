/**
 * TerrainTypes - Defines movement costs and rules for different terrain types
 */

const TerrainTypes = {
  // Basic terrain types
  default: {
    name: 'Default',
    movementCost: 1,
    description: 'Standard terrain with no special properties'
  },
  
  street: {
    name: 'Street',
    movementCost: 1,
    description: 'Urban roads with easy movement'
  },
  
  river: {
    name: 'River',
    movementCost: 2,
    description: 'Water features that slow movement'
  },
  
  building: {
    name: 'Building',
    movementCost: 3,
    description: 'Urban structures that are difficult to navigate through'
  },
  
  forest: {
    name: 'Forest',
    movementCost: 2,
    description: 'Wooded areas with moderate movement penalty'
  },
  
  mountain: {
    name: 'Mountain',
    movementCost: -1, // -1 indicates impassable
    description: 'Impassable mountainous terrain'
  },
  
  // Special terrain types
  bridge: {
    name: 'Bridge',
    movementCost: 1,
    description: 'Structures crossing water with normal movement'
  },
  
  /**
   * Get movement cost for a specific terrain type
   * @param {string} type - Terrain type name
   * @param {object} unit - Optional unit object (for unit-specific effects)
   * @returns {number} Movement cost (-1 for impassable)
   */
  getMovementCost(type, unit = null) {
    // If the terrain type doesn't exist, use default
    if (!this[type]) {
      return this.default.movementCost;
    }
    
    // Get the base movement cost
    let cost = this[type].movementCost;
    
    // Apply unit-specific modifiers if unit is provided
    if (unit) {
      // Example: Flying units ignore terrain costs
      if (unit.abilities && unit.abilities.includes('flying')) {
        return 1;
      }
      
      // Example: Aquatic units can move through water easily
      if (type === 'river' && unit.abilities && unit.abilities.includes('aquatic')) {
        return 1;
      }
    }
    
    return cost;
  },
  
  /**
   * Check if terrain is passable for a unit
   * @param {string} type - Terrain type name
   * @param {object} unit - Optional unit object
   * @returns {boolean} True if passable
   */
  isPassable(type, unit = null) {
    return this.getMovementCost(type, unit) > 0;
  }
};

export default TerrainTypes;