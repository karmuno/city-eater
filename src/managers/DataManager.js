/**
 * DataManager.js - Loads and manages game data from JSON files
 */
class DataManager {
  /**
   * @param {Phaser.Scene} scene - The scene this manager belongs to
   */
  constructor(scene) {
    this.scene = scene;
    
    // Store loaded data
    this.combatTables = null;
    this.unitStats = null;
    this.mapNodes = null;
    this.scenarios = null;
    
    // Track loading status
    this.isLoaded = {
      combatTables: false,
      unitStats: false,
      mapNodes: false,
      scenarios: false
    };
    
    // Listeners for data loaded events
    this.loadingListeners = [];
  }
  
  /**
   * Load all game data
   * @returns {Promise} Resolves when all data is loaded
   */
  loadAll() {
    return Promise.all([
      this.loadCombatTables(),
      this.loadUnitStats(),
      this.loadMapNodes(),
      this.loadScenarios()
    ]);
  }
  
  /**
   * Load combat tables from JSON file
   * @returns {Promise} Resolves when data is loaded
   */
  loadCombatTables() {
    return new Promise((resolve, reject) => {
      this.scene.load.json('combatTables', 'assets/data/combat-tables.json');
      
      // Listen for load completion
      this.scene.load.once('complete', () => {
        try {
          this.combatTables = this.scene.cache.json.get('combatTables');
          this.isLoaded.combatTables = true;
          this.validateCombatTables();
          this.notifyListeners('combatTables');
          resolve(this.combatTables);
        } catch (error) {
          console.error('Error loading combat tables:', error);
          reject(error);
        }
      });
      
      // Start loading
      this.scene.load.start();
    });
  }
  
  /**
   * Load unit stats from JSON file
   * @returns {Promise} Resolves when data is loaded
   */
  loadUnitStats() {
    return new Promise((resolve, reject) => {
      this.scene.load.json('unitStats', 'assets/data/unit-stats.json');
      
      // Listen for load completion
      this.scene.load.once('complete', () => {
        try {
          this.unitStats = this.scene.cache.json.get('unitStats');
          this.isLoaded.unitStats = true;
          this.validateUnitStats();
          this.notifyListeners('unitStats');
          resolve(this.unitStats);
        } catch (error) {
          console.error('Error loading unit stats:', error);
          reject(error);
        }
      });
      
      // Start loading
      this.scene.load.start();
    });
  }
  
  /**
   * Load map nodes from JSON file
   * @returns {Promise} Resolves when data is loaded
   */
  loadMapNodes() {
    return new Promise((resolve, reject) => {
      this.scene.load.json('mapNodes', 'assets/data/map-nodes.json');
      
      // Listen for load completion
      this.scene.load.once('complete', () => {
        try {
          this.mapNodes = this.scene.cache.json.get('mapNodes');
          this.isLoaded.mapNodes = true;
          this.validateMapNodes();
          this.notifyListeners('mapNodes');
          resolve(this.mapNodes);
        } catch (error) {
          console.error('Error loading map nodes:', error);
          reject(error);
        }
      });
      
      // Start loading
      this.scene.load.start();
    });
  }
  
  /**
   * Load scenarios from JSON file
   * @returns {Promise} Resolves when data is loaded
   */
  loadScenarios() {
    return new Promise((resolve, reject) => {
      this.scene.load.json('scenarios', 'assets/data/scenarios.json');
      
      // Listen for load completion
      this.scene.load.once('complete', () => {
        try {
          this.scenarios = this.scene.cache.json.get('scenarios');
          this.isLoaded.scenarios = true;
          this.validateScenarios();
          this.notifyListeners('scenarios');
          resolve(this.scenarios);
        } catch (error) {
          console.error('Error loading scenarios:', error);
          reject(error);
        }
      });
      
      // Start loading
      this.scene.load.start();
    });
  }
  
  /**
   * Register a listener for data loaded events
   * @param {Function} callback - Function to call when data is loaded
   * @param {string} dataType - Type of data to listen for (or 'all')
   */
  onDataLoaded(callback, dataType = 'all') {
    this.loadingListeners.push({
      callback,
      dataType
    });
  }
  
  /**
   * Notify listeners that data has been loaded
   * @param {string} dataType - Type of data that was loaded
   */
  notifyListeners(dataType) {
    this.loadingListeners.forEach(listener => {
      if (listener.dataType === 'all' || listener.dataType === dataType) {
        listener.callback(dataType, this[dataType]);
      }
    });
  }
  
  /**
   * Check if all data is loaded
   * @returns {boolean} True if all data is loaded
   */
  isAllLoaded() {
    return Object.values(this.isLoaded).every(loaded => loaded);
  }
  
  /**
   * Validate combat tables data structure
   * @throws {Error} If validation fails
   */
  validateCombatTables() {
    if (!this.combatTables) {
      throw new Error('Combat tables data is missing or empty');
    }
    
    // Check for expected properties
    if (!this.combatTables.odds || !Array.isArray(this.combatTables.odds)) {
      console.warn('Combat tables missing or malformed odds array');
      this.combatTables.odds = [];
    }
    
    if (!this.combatTables.results || !Array.isArray(this.combatTables.results)) {
      console.warn('Combat tables missing or malformed results array');
      this.combatTables.results = [];
    }
    
    console.log('Combat tables validated successfully');
  }
  
  /**
   * Validate unit stats data structure
   * @throws {Error} If validation fails
   */
  validateUnitStats() {
    if (!this.unitStats) {
      throw new Error('Unit stats data is missing or empty');
    }
    
    // Check if unit stats is an object with unit types as keys
    if (typeof this.unitStats !== 'object') {
      console.warn('Unit stats is not an object, initializing empty object');
      this.unitStats = {};
    }
    
    // Check each unit type has the required properties
    const requiredProperties = ['attack', 'defense', 'movement'];
    
    Object.keys(this.unitStats).forEach(unitType => {
      const unit = this.unitStats[unitType];
      
      requiredProperties.forEach(prop => {
        if (typeof unit[prop] === 'undefined') {
          console.warn(`Unit ${unitType} missing required property: ${prop}`);
          unit[prop] = 0;
        }
      });
    });
    
    console.log('Unit stats validated successfully');
  }
  
  /**
   * Validate map nodes data structure
   * @throws {Error} If validation fails
   */
  validateMapNodes() {
    if (!this.mapNodes) {
      throw new Error('Map nodes data is missing or empty');
    }
    
    // Check for nodes array
    if (!Array.isArray(this.mapNodes.nodes)) {
      console.warn('Map nodes missing or malformed nodes array');
      this.mapNodes.nodes = [];
    }
    
    // Validate each node
    this.mapNodes.nodes.forEach(node => {
      if (typeof node.id === 'undefined') {
        console.warn('Map node missing ID');
        node.id = Math.floor(Math.random() * 10000);
      }
      
      if (typeof node.x === 'undefined' || typeof node.y === 'undefined') {
        console.warn(`Map node ${node.id} missing coordinates`);
        node.x = 0;
        node.y = 0;
      }
      
      if (!Array.isArray(node.adjacentNodes)) {
        console.warn(`Map node ${node.id} missing adjacent nodes array`);
        node.adjacentNodes = [];
      }
      
      if (!node.terrainType) {
        console.warn(`Map node ${node.id} missing terrain type`);
        node.terrainType = 'street';
      }
    });
    
    console.log('Map nodes validated successfully');
  }
  
  /**
   * Validate scenarios data structure
   * @throws {Error} If validation fails
   */
  validateScenarios() {
    if (!this.scenarios) {
      throw new Error('Scenarios data is missing or empty');
    }
    
    // Check for scenarios array
    if (!Array.isArray(this.scenarios)) {
      console.warn('Scenarios is not an array, initializing empty array');
      this.scenarios = [];
    }
    
    // Validate each scenario
    this.scenarios.forEach(scenario => {
      if (!scenario.id) {
        console.warn('Scenario missing ID');
        scenario.id = `scenario_${Math.floor(Math.random() * 10000)}`;
      }
      
      if (!scenario.name) {
        console.warn(`Scenario ${scenario.id} missing name`);
        scenario.name = scenario.id;
      }
      
      if (!scenario.description) {
        console.warn(`Scenario ${scenario.id} missing description`);
        scenario.description = 'No description provided.';
      }
      
      if (!scenario.monsterConfig) {
        console.warn(`Scenario ${scenario.id} missing monster configuration`);
        scenario.monsterConfig = {
          attack: 5,
          defense: 10,
          buildingDestruction: 3,
          movement: 4,
          specialAbilities: []
        };
      }
      
      if (!Array.isArray(scenario.units)) {
        console.warn(`Scenario ${scenario.id} missing units array`);
        scenario.units = [];
      }
    });
    
    console.log('Scenarios validated successfully');
  }
  
  /**
   * Get unit stats by unit type
   * @param {string} unitType - Type of unit to get stats for
   * @returns {object|null} Unit stats or null if not found
   */
  getUnitStats(unitType) {
    if (!this.isLoaded.unitStats) {
      console.warn('Unit stats not loaded yet');
      return null;
    }
    
    return this.unitStats[unitType] || null;
  }
  
  /**
   * Get combat result based on odds and die roll
   * @param {number} attackerStrength - Attacker's strength
   * @param {number} defenderStrength - Defender's strength
   * @param {number} dieRoll - Die roll (1-6)
   * @returns {object|null} Combat result or null if not found
   */
  getCombatResult(attackerStrength, defenderStrength, dieRoll) {
    if (!this.isLoaded.combatTables) {
      console.warn('Combat tables not loaded yet');
      return null;
    }
    
    // Calculate odds ratio
    let ratio;
    if (attackerStrength >= defenderStrength) {
      ratio = Math.floor(attackerStrength / defenderStrength);
      // Cap at maximum odds in table
      ratio = Math.min(ratio, this.combatTables.odds.length);
    } else {
      ratio = -Math.floor(defenderStrength / attackerStrength);
      // Cap at minimum odds in table
      ratio = Math.max(ratio, -this.combatTables.odds.length);
    }
    
    // Find the odds column
    const oddsIndex = this.combatTables.odds.indexOf(ratio);
    if (oddsIndex === -1) {
      console.warn(`Odds ratio ${ratio} not found in combat table`);
      return null;
    }
    
    // Validate die roll
    if (dieRoll < 1 || dieRoll > 6) {
      console.warn(`Invalid die roll: ${dieRoll} (must be 1-6)`);
      return null;
    }
    
    // Get result from table
    const resultRow = this.combatTables.results[dieRoll - 1];
    if (!resultRow) {
      console.warn(`No result row for die roll ${dieRoll}`);
      return null;
    }
    
    const result = resultRow[oddsIndex];
    if (!result) {
      console.warn(`No result for odds ${ratio} and die roll ${dieRoll}`);
      return null;
    }
    
    return this.parseResult(result);
  }
  
  /**
   * Parse a combat result string into an object
   * @param {string} result - Result string from combat table
   * @returns {object} Parsed result object
   */
  parseResult(result) {
    // Example result format: "DE" (Defender Eliminated)
    const resultMap = {
      'DE': { defender: 'eliminated', attacker: 'none' },
      'DR': { defender: 'retreat', attacker: 'none' },
      'DD': { defender: 'damage', attacker: 'none' },
      'NE': { defender: 'none', attacker: 'none' },
      'AD': { defender: 'none', attacker: 'damage' },
      'AR': { defender: 'none', attacker: 'retreat' },
      'AE': { defender: 'none', attacker: 'eliminated' },
      'EX': { defender: 'eliminated', attacker: 'eliminated' }
    };
    
    return resultMap[result] || { defender: 'none', attacker: 'none' };
  }
  
  /**
   * Get a scenario by ID
   * @param {string} scenarioId - ID of scenario to get
   * @returns {object|null} Scenario object or null if not found
   */
  getScenario(scenarioId) {
    if (!this.isLoaded.scenarios) {
      console.warn('Scenarios not loaded yet');
      return null;
    }
    
    return this.scenarios.find(s => s.id === scenarioId) || null;
  }
  
  /**
   * Get all available scenarios
   * @returns {array} Array of scenario objects
   */
  getAllScenarios() {
    if (!this.isLoaded.scenarios) {
      console.warn('Scenarios not loaded yet');
      return [];
    }
    
    return this.scenarios;
  }
  
  /**
   * Get a map node by ID
   * @param {number} nodeId - ID of node to get
   * @returns {object|null} Node object or null if not found
   */
  getMapNode(nodeId) {
    if (!this.isLoaded.mapNodes) {
      console.warn('Map nodes not loaded yet');
      return null;
    }
    
    return this.mapNodes.nodes.find(n => n.id === nodeId) || null;
  }
  
  /**
   * Get all map nodes
   * @returns {array} Array of map node objects
   */
  getAllMapNodes() {
    if (!this.isLoaded.mapNodes) {
      console.warn('Map nodes not loaded yet');
      return [];
    }
    
    return this.mapNodes.nodes;
  }
}

export default DataManager;