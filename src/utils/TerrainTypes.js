/**
 * TerrainTypes - Defines movement costs and rules for different terrain types
 * Based on the rulebook's Terrain Effects Chart
 */
const TerrainTypes = {
  // Base terrain types from the rulebook
  street: {
    name: 'Street',
    movementCost: 1,
    combatEffect: 'none',
    destructStrength: 0,  // Not applicable
    victoryPoints: 0,
    description: 'Urban roads with easy movement'
  },
  
  park: {
    name: 'Park',
    movementCost: 2,
    combatEffect: 'none',
    destructStrength: 0,  // Not applicable
    victoryPoints: 0,
    description: 'Green areas that slow movement'
  },
  
  lowBuilding: {
    name: 'Low Building',
    movementCost: 3,
    combatEffect: 'defx2',  // Defender strength doubled
    destructStrength: 2,
    victoryPoints: 3,
    description: 'Low structures that are impassable to monsters, armor, and artillery'
  },
  
  highBuilding: {
    name: 'High Building',
    movementCost: 3,
    combatEffect: 'defx2',  // Defender strength doubled
    destructStrength: 4,
    victoryPoints: 5,
    description: 'Tall structures that are impassable to monsters, armor, and artillery'
  },
  
  bridge: {
    name: 'Bridge',
    movementCost: 1,
    combatEffect: 'none',
    destructStrength: 2,
    victoryPoints: 5,
    description: 'Structures crossing water with normal movement'
  },
  
  tunnel: {
    name: 'Tunnel',
    movementCost: 1,
    combatEffect: 'defx2',  // Defender strength doubled
    destructStrength: 0,  // Not applicable
    victoryPoints: 0,
    description: 'Underground passages'
  },
  
  river: {
    name: 'River',
    movementCost: 1,
    combatEffect: 'none',
    destructStrength: 0,  // Not applicable
    victoryPoints: 0,
    description: 'Water that can only be entered by monsters, helicopters, and fireboats'
  },
  
  rubble: {
    name: 'Rubble',
    movementCost: 2,
    combatEffect: 'none',
    destructStrength: 0,  // Not applicable
    victoryPoints: 0,
    description: 'Destroyed buildings'
  },
  
  default: {
    name: 'Unknown',
    movementCost: 1,
    combatEffect: 'none',
    destructStrength: 0,
    victoryPoints: 0,
    description: 'Default terrain with no special properties'
  },
  
  /**
   * Check if terrain is passable for a given unit type
   * @param {string} terrainType - The type of terrain
   * @param {string} unitType - The type of unit (monster, infantry, armor, etc.)
   * @returns {boolean} Whether the terrain is passable
   */
  isPassable(terrainType, unitType) {
    if (!this[terrainType]) {
      terrainType = 'default';
    }
    
    // Impassable terrain based on unit type
    switch(unitType) {
      case 'monster':
        // Monsters can't enter buildings unless they have flying ability
        return !['lowBuilding', 'highBuilding'].includes(terrainType);
        
      case 'armor':
      case 'artillery':
        // Armor and artillery can't enter buildings
        return !['lowBuilding', 'highBuilding'].includes(terrainType);
        
      case 'infantry':
      case 'police':
        // Infantry and police can enter any terrain
        return true;
        
      case 'helicopter':
        // Helicopters can enter any terrain
        return true;
        
      case 'fireboat':
        // Fireboats can only enter river boxes
        return terrainType === 'river';
        
      default:
        // By default, assume passable
        return true;
    }
  },
  
  /**
   * Get movement cost for a specific terrain type and unit
   * @param {string} terrainType - Terrain type name
   * @param {string} unitType - Type of unit
   * @returns {number} Movement cost (or -1 if impassable)
   */
  getMovementCost(terrainType, unitType) {
    // If terrain is impassable for this unit, return -1
    if (!this.isPassable(terrainType, unitType)) {
      return -1;
    }
    
    // Use default terrain if type doesn't exist
    if (!this[terrainType]) {
      terrainType = 'default';
    }
    
    // Special movement costs based on unit type
    switch(unitType) {
      case 'helicopter':
        // Helicopters pay 1 MP for any terrain
        return 1;
        
      case 'monster':
        if (terrainType === 'river') {
          return 2; // Monsters move slower in water
        }
        break;
    }
    
    // Return standard movement cost for terrain
    return this[terrainType].movementCost;
  },
  
  /**
   * Get all terrain information
   * @param {string} terrainType - Terrain type name
   * @returns {object} Terrain information or default if not found
   */
  getInfo(terrainType) {
    return this[terrainType] || this.default;
  }
};

export default TerrainTypes;