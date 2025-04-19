import TerrainTypes from '../utils/TerrainTypes.js';

/**
 * MapManager - Handles the map, nodes, and movement calculations
 */
class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.nodes = {};
    this.debugGraphics = null;
    this.terrainTypes = TerrainTypes;
    this.debugMode = true; // Set to true to show nodes and connections
  }

  /**
   * Load the map data
   * @param {string} mapBackgroundKey - The key for the background map image
   * @param {string} nodesDataKey - The key for the nodes JSON data
   */
  loadMap(mapBackgroundKey, nodesDataKey = 'map-nodes') {
    // Load nodes data
    this.nodesData = this.scene.cache.json.get(nodesDataKey);
    
    if (!this.nodesData) {
      console.error(`Nodes data for key ${nodesDataKey} not found!`);
      return;
    }
    
    // Process the nodes
    this.setupNodes();
    
    console.log(`Loaded map with ${Object.keys(this.nodes).length} nodes`);
    
    // Draw debug visuals if debug mode is enabled
    if (this.debugMode) {
      this.drawDebugNodes();
    }
  }
  
  /**
   * Setup nodes from the JSON data
   */
  setupNodes() {
    this.nodes = {};
    
    if (this.nodesData && this.nodesData.nodes) {
      this.nodesData.nodes.forEach(node => {
        this.nodes[node.id] = {
          id: node.id,
          x: node.x,
          y: node.y,
          adjacentNodes: node.adjacentNodes || [],
          terrainType: node.terrainType || 'default'
        };
      });
    }
    
    // Validate the adjacencies to ensure they are bi-directional
    this.validateAdjacencies();
  }
  
  /**
   * Validate and fix node adjacencies
   * Ensures all adjacencies are bi-directional
   */
  validateAdjacencies() {
    // Check for unidirectional adjacencies and fix them
    for (const nodeId in this.nodes) {
      const node = this.nodes[nodeId];
      
      node.adjacentNodes.forEach(adjId => {
        const adjNode = this.nodes[adjId];
        
        if (adjNode && !adjNode.adjacentNodes.includes(parseInt(nodeId))) {
          console.warn(`Fixed unidirectional adjacency: node ${adjId} is adjacent to ${nodeId} but not vice versa`);
          adjNode.adjacentNodes.push(parseInt(nodeId));
        }
      });
    }
    
    // Validate that boxes have between 3-6 adjacencies as per the rulebook
    for (const nodeId in this.nodes) {
      const node = this.nodes[nodeId];
      const count = node.adjacentNodes.length;
      
      if (count < 3 && count !== 0) { // Allow 0 for edge cases or isolated nodes
        console.warn(`Node ${nodeId} has only ${count} adjacencies (minimum should be 3)`);
      } else if (count > 6) {
        console.warn(`Node ${nodeId} has ${count} adjacencies (maximum should be 6)`);
      }
    }
  }
  
  /**
   * Draw debug visuals for nodes and connections
   */
  drawDebugNodes() {
    // Clear any existing debug graphics
    if (this.debugGraphics) {
      this.debugGraphics.clear();
    } else {
      this.debugGraphics = this.scene.add.graphics();
    }
    
    const colors = {
      default: 0xCCCCCC,
      street: 0x888888,
      river: 0x0088FF,
      building: 0xDD8855,
      forest: 0x33AA33,
      mountain: 0x885533,
      bridge: 0xFFCC00
    };
    
    // Draw connections between nodes first (so they're under the nodes)
    this.debugGraphics.lineStyle(3, 0xFFFFFF, 0.5);
    
    Object.values(this.nodes).forEach(node => {
      // Draw lines to each adjacent node
      if (node.adjacentNodes) {
        node.adjacentNodes.forEach(adjId => {
          const adjNode = this.nodes[adjId];
          if (adjNode) {
            this.debugGraphics.lineBetween(node.x, node.y, adjNode.x, adjNode.y);
          }
        });
      }
    });
    
    // Now draw the nodes
    Object.values(this.nodes).forEach(node => {
      const color = colors[node.terrainType] || colors.default;
      
      // Different opacity based on whether terrain is passable
      const opacity = this.terrainTypes.isPassable(node.terrainType) ? 0.8 : 0.6;
      
      // Draw node
      this.debugGraphics.lineStyle(2, 0x000000, 0.8);
      this.debugGraphics.fillStyle(color, opacity);
      this.debugGraphics.fillCircle(node.x, node.y, 20);
      this.debugGraphics.strokeCircle(node.x, node.y, 20);
      
      // Add node ID text
      const text = this.scene.add.text(
        node.x, 
        node.y, 
        `${node.id}`,
        { 
          fontFamily: 'Arial', 
          fontSize: '14px',
          fontStyle: 'bold',
          fill: '#000',
          backgroundColor: '#ffffff88',
          padding: { x: 2, y: 2 }
        }
      );
      text.setOrigin(0.5, 0.5);
    });
  }
  
  /**
   * Draw debug terrain visuals
   * @param {boolean} showIds - Whether to show terrain IDs
   */
  drawDebugTerrain(showIds = false) {
    // If we don't have any nodes data yet, use the debug nodes visualization
    if (Object.keys(this.nodes).length === 0) {
      console.warn("No terrain data loaded, falling back to debug nodes visualization");
      this.drawDebugNodes();
      return;
    }
    
    // Clear any existing debug graphics
    if (this.debugGraphics) {
      this.debugGraphics.clear();
      
      // Also clear any existing texts
      if (this.debugTexts) {
        this.debugTexts.forEach(text => text.destroy());
      }
    } else {
      this.debugGraphics = this.scene.add.graphics();
    }
    
    // Initialize debug texts array
    this.debugTexts = [];
    
    // Draw terrain areas based on the nodes
    const colors = {
      default: 0xCCCCCC,
      street: 0x888888,
      river: 0x0088FF,
      building: 0xDD8855,
      lowBuilding: 0xDD8855,
      highBuilding: 0xCC6633,
      forest: 0x33AA33,
      mountain: 0x885533,
      bridge: 0xFFCC00,
      tunnel: 0x999999,
      park: 0x66CC66,
      rubble: 0xAA8866
    };
    
    // First draw all the terrain nodes
    Object.values(this.nodes).forEach(node => {
      const color = colors[node.terrainType] || colors.default;
      
      // Different opacity based on whether terrain is passable
      const opacity = this.terrainTypes.isPassable(node.terrainType) ? 0.7 : 0.5;
      
      // Draw terrain
      this.debugGraphics.fillStyle(color, opacity);
      this.debugGraphics.fillCircle(node.x, node.y, 40); // Larger area for terrain
      
      // Draw outline
      this.debugGraphics.lineStyle(1, 0x000000, 0.5);
      this.debugGraphics.strokeCircle(node.x, node.y, 40);
      
      // Add node ID text if requested
      if (showIds) {
        const text = this.scene.add.text(
          node.x, 
          node.y, 
          `${node.id}`,
          { 
            fontFamily: 'Arial', 
            fontSize: '14px',
            fontStyle: 'bold',
            fill: '#FFF',
            backgroundColor: '#00000088',
            padding: { x: 3, y: 3 }
          }
        );
        text.setOrigin(0.5, 0.5);
        this.debugTexts.push(text);
        
        // Add smaller terrain type text below
        const terrainText = this.scene.add.text(
          node.x, 
          node.y + 25, 
          node.terrainType,
          { 
            fontFamily: 'Arial', 
            fontSize: '10px',
            fill: '#FFF',
            backgroundColor: '#00000088',
            padding: { x: 2, y: 1 }
          }
        );
        terrainText.setOrigin(0.5, 0.5);
        this.debugTexts.push(terrainText);
      }
    });
    
    // Now draw adjacency connections on top
    this.debugGraphics.lineStyle(2, 0xFFFFFF, 0.4);
    
    Object.values(this.nodes).forEach(node => {
      if (node.adjacentNodes) {
        node.adjacentNodes.forEach(adjId => {
          const adjNode = this.nodes[adjId];
          if (adjNode) {
            this.debugGraphics.lineBetween(node.x, node.y, adjNode.x, adjNode.y);
          }
        });
      }
    });
  }
  
  /**
   * Get adjacent nodes for a given node ID
   * @param {number} nodeId - The ID of the node
   * @returns {array} Array of adjacent node objects
   */
  getAdjacentNodes(nodeId) {
    const node = this.nodes[nodeId];
    if (!node || !node.adjacentNodes) return [];
    
    return node.adjacentNodes
      .map(id => this.nodes[id])
      .filter(Boolean); // Filter out any undefined nodes
  }
  
  /**
   * Find the nearest node to a given position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {object|null} Nearest node or null if no nodes exist
   */
  findNearestNode(x, y) {
    let closestNode = null;
    let closestDistance = Infinity;
    
    Object.values(this.nodes).forEach(node => {
      const distance = Phaser.Math.Distance.Between(x, y, node.x, node.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestNode = node;
      }
    });
    
    return closestNode;
  }
  
  /**
   * Get the terrain type at a specific screen position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} threshold - Maximum distance to consider (default 50px)
   * @returns {string|null} Terrain type or null if no terrain found
   */
  getTerrainTypeAtPosition(x, y, threshold = 50) {
    // Find the nearest node to this position
    const nearestNode = this.findNearestNode(x, y);
    
    if (!nearestNode) {
      return null;
    }
    
    // Check if the position is within the threshold distance
    const distance = Phaser.Math.Distance.Between(x, y, nearestNode.x, nearestNode.y);
    
    if (distance <= threshold) {
      return nearestNode.terrainType;
    }
    
    return null;
  }
  
  /**
   * Get adjacent positions for a given position
   * Uses the node system to find adjacent positions
   * @param {object} position - {x, y} position
   * @param {number} threshold - Distance threshold for finding nearest node
   * @returns {array} Array of adjacent positions
   */
  getAdjacentPositions(position, threshold = 50) {
    // First, find the nearest node to this position
    const nearestNode = this.findNearestNode(position.x, position.y);
    
    if (!nearestNode) {
      return [];
    }
    
    // Check if the position is close enough to the node
    const distance = Phaser.Math.Distance.Between(position.x, position.y, nearestNode.x, nearestNode.y);
    if (distance > threshold) {
      return [];
    }
    
    // Get adjacent nodes to the nearest node
    const adjacentNodes = this.getAdjacentNodes(nearestNode.id);
    
    // Return the positions of the adjacent nodes
    return adjacentNodes.map(node => ({
      x: node.x,
      y: node.y
    }));
  }
  
  /**
   * Get the terrain type at a specific node
   * @param {number} nodeId - The ID of the node
   * @returns {string} Terrain type name ('default' if not found)
   */
  getNodeTerrainType(nodeId) {
    const node = this.nodes[nodeId];
    return node ? node.terrainType : 'default';
  }
  
  /**
   * Get the movement cost for a terrain type
   * @param {string} terrainType - The terrain type
   * @param {object} unit - Optional unit object for unit-specific effects
   * @returns {number} Movement cost (-1 for impassable)
   */
  getMovementCost(terrainType, unit = null) {
    return this.terrainTypes.getMovementCost(terrainType, unit);
  }
  
  /**
   * Calculate movement cost between adjacent nodes
   * @param {number} fromNodeId - Starting node ID
   * @param {number} toNodeId - Target node ID
   * @param {object} unit - Optional unit for terrain-specific effects
   * @returns {number} Movement cost (-1 if not possible or not adjacent)
   */
  calculateMovementCost(fromNodeId, toNodeId, unit = null) {
    const fromNode = this.nodes[fromNodeId];
    const toNode = this.nodes[toNodeId];
    
    // Check if nodes exist
    if (!fromNode || !toNode) return -1;
    
    // Check if nodes are adjacent
    if (!fromNode.adjacentNodes.includes(toNodeId)) return -1;
    
    // Get terrain type at destination
    const terrainType = toNode.terrainType;
    
    // Extract unit type if a unit object is provided
    const unitType = unit?.type || null;
    
    // Check special cases for movement between specific nodes
    const specialCost = this.checkSpecialMovementCases(fromNodeId, toNodeId, unitType);
    if (specialCost !== null) {
      return specialCost;
    }
    
    // Return movement cost for terrain type
    return this.getMovementCost(terrainType, unitType);
  }
  
  /**
   * Check for special movement cases between specific nodes
   * @param {number} fromNodeId - Starting node ID
   * @param {number} toNodeId - Target node ID
   * @param {string} unitType - Type of unit
   * @returns {number|null} Special movement cost or null if no special case applies
   */
  checkSpecialMovementCases(fromNodeId, toNodeId, unitType) {
    const fromNode = this.nodes[fromNodeId];
    const toNode = this.nodes[toNodeId];
    
    // Handle river crossings - Infantry can ford rivers with special movement rule
    if (fromNode.terrainType !== 'river' && toNode.terrainType === 'river' && unitType === 'infantry') {
      // Infantry needs all movement points to enter a river
      return Infinity; // Special value to indicate all movement points required
    }
    
    // Handle movement from river to land for infantry (after fording)
    if (fromNode.terrainType === 'river' && toNode.terrainType !== 'river' && unitType === 'infantry') {
      return Infinity; // Will require all movement points
    }
    
    // Handle bridge/tunnel and river in same location
    if (this.isBridgeOverRiver(fromNodeId, toNodeId)) {
      if (unitType === 'monster' || unitType === 'helicopter' || unitType === 'fireboat') {
        // These units can choose to use the river under the bridge
        return this.getMovementCost('river', unitType);
      } else {
        // Other units must use the bridge
        return this.getMovementCost('bridge', unitType);
      }
    }
    
    // Handle tunnel/river overlap
    if (this.isTunnelUnderRiver(fromNodeId, toNodeId)) {
      if (unitType === 'monster' || unitType === 'helicopter' || unitType === 'fireboat') {
        // These units can choose the river over the tunnel
        return this.getMovementCost('river', unitType);
      } else {
        // Other units must use the tunnel
        return this.getMovementCost('tunnel', unitType);
      }
    }
    
    // No special case applies
    return null;
  }
  
  /**
   * Check if movement is crossing a bridge over a river
   * @param {number} fromNodeId - Starting node ID
   * @param {number} toNodeId - Target node ID
   * @returns {boolean} True if this is a bridge over river case
   */
  isBridgeOverRiver(fromNodeId, toNodeId) {
    // This is a placeholder implementation - in a real implementation,
    // we would check if there's a bridge/river overlap at these nodes
    // For now, we'll return false as we haven't defined bridge/river overlaps yet
    return false;
  }
  
  /**
   * Check if movement is through a tunnel under a river
   * @param {number} fromNodeId - Starting node ID
   * @param {number} toNodeId - Target node ID
   * @returns {boolean} True if this is a tunnel under river case
   */
  isTunnelUnderRiver(fromNodeId, toNodeId) {
    // Similar to above, this is a placeholder implementation
    return false;
  }
  
  /**
   * Get the movement cost for a terrain type
   * @param {string} terrainType - The terrain type
   * @param {string} unitType - The type of unit (e.g., 'infantry', 'monster')
   * @returns {number} Movement cost (-1 for impassable)
   */
  getMovementCost(terrainType, unitType) {
    return this.terrainTypes.getMovementCost(terrainType, unitType);
  }
  
  /**
   * Find all nodes reachable from a starting node with given movement points
   * @param {number} startNodeId - ID of starting node
   * @param {number} movementPoints - Available movement points
   * @param {object} unit - Optional unit for terrain-specific effects
   * @returns {array} Array of reachable nodes with their costs
   */
  findReachableNodes(startNodeId, movementPoints, unit = null) {
    const startNode = this.nodes[startNodeId];
    if (!startNode) return [];
    
    const visited = new Map(); // Map of node IDs to their movement costs
    visited.set(startNodeId, 0);
    
    const result = [{ 
      id: startNodeId, 
      x: startNode.x, 
      y: startNode.y, 
      cost: 0,
      terrainType: startNode.terrainType
    }];
    
    const queue = [{ nodeId: startNodeId, remainingPoints: movementPoints }];
    
    // First discover all reachable nodes normally
    while (queue.length > 0) {
      const current = queue.shift();
      const currentCost = visited.get(current.nodeId);
      
      // Get adjacent nodes
      const adjacentNodes = this.getAdjacentNodes(current.nodeId);
      
      for (const nextNode of adjacentNodes) {
        // Calculate movement cost
        const moveCost = this.calculateMovementCost(current.nodeId, nextNode.id, unit);
        
        // Handle special case for river fording (Infinity movement cost)
        if (moveCost === Infinity) {
          // Can only move if we have all our movement points
          if (current.remainingPoints === movementPoints && current.nodeId === startNodeId) {
            visited.set(nextNode.id, movementPoints);
            result.push({ 
              id: nextNode.id, 
              x: nextNode.x, 
              y: nextNode.y, 
              cost: movementPoints,
              remainingPoints: 0,
              terrainType: nextNode.terrainType,
              specialMovement: 'fordingRiver'
            });
            // Don't add to queue as this consumes all movement
          }
          continue;
        }
        
        // Skip impassable terrain or if not enough movement points
        if (moveCost < 0 || moveCost > current.remainingPoints) continue;
        
        const newCost = currentCost + moveCost;
        const newRemainingPoints = current.remainingPoints - moveCost;
        
        // If we haven't visited this node before, or found a cheaper path
        if (!visited.has(nextNode.id) || newCost < visited.get(nextNode.id)) {
          visited.set(nextNode.id, newCost);
          result.push({ 
            id: nextNode.id, 
            x: nextNode.x, 
            y: nextNode.y, 
            cost: newCost,
            remainingPoints: newRemainingPoints,
            terrainType: nextNode.terrainType
          });
          
          // Only add to queue if we have remaining movement points
          if (newRemainingPoints > 0) {
            queue.push({ nodeId: nextNode.id, remainingPoints: newRemainingPoints });
          }
        }
      }
    }
    
    // Apply rule 5.15: If a unit begins its Movement Phase adjacent to a box 
    // it could not normally enter due to insufficient Movement Points, 
    // it may enter that box by expending all its Movement Points
    if (unit) { // Only apply to units, not monsters
      const adjacentNodes = this.getAdjacentNodes(startNodeId);
      
      for (const adjNode of adjacentNodes) {
        // Skip nodes we've already processed as reachable
        if (visited.has(adjNode.id)) continue;
        
        // Check if terrain is passable but cost is too high
        const moveCost = this.calculateMovementCost(startNodeId, adjNode.id, unit);
        
        // If terrain is passable (not -1) but cost exceeds movement points,
        // unit can still move there by expending all movement points
        if (moveCost > 0 && moveCost > movementPoints) {
          visited.set(adjNode.id, movementPoints);
          result.push({ 
            id: adjNode.id, 
            x: adjNode.x, 
            y: adjNode.y, 
            cost: movementPoints,
            remainingPoints: 0,
            terrainType: adjNode.terrainType,
            specialMovement: 'allPointsMove'
          });
        }
      }
    }
    
    return result;
  }
  
  /**
   * Draw movement range visualization
   * @param {number} startNodeId - ID of starting node
   * @param {number} movementPoints - Available movement points
   * @param {object} unit - Optional unit for terrain-specific effects
   * @param {boolean} showCosts - Whether to show movement costs
   */
  showMovementRange(startNodeId, movementPoints, unit = null, showCosts = true) {
    const startNode = this.nodes[startNodeId];
    if (!startNode) return;
    
    // Clear any existing range graphics
    if (this.rangeGraphics) {
      this.rangeGraphics.clear();
      
      // Also clear any existing cost texts
      if (this.costTexts) {
        this.costTexts.forEach(text => text.destroy());
      }
    } else {
      this.rangeGraphics = this.scene.add.graphics();
    }
    
    // Initialize cost texts array
    this.costTexts = [];
    
    // Find reachable nodes
    const reachable = this.findReachableNodes(startNodeId, movementPoints, unit);
    
    console.log(`Found ${reachable.length} reachable nodes from node ${startNodeId} with ${movementPoints} movement points`);
    
    // Draw reachable areas
    this.rangeGraphics.lineStyle(1, 0x000000, 0.5);
    
    // Draw with gradient colors based on remaining movement points
    for (const node of reachable) {
      // Skip the starting node
      if (node.id === startNodeId) continue;
      
      // Calculate color based on movement cost - green for low cost, red for high cost
      const ratio = node.cost / movementPoints;
      let colorValue = 0x00FF00 + Math.floor(ratio * 0xFF) * 0x10000 - Math.floor(ratio * 0xFF) * 0x100;
      
      // Use different colors for special movement cases
      if (node.specialMovement === 'fordingRiver') {
        colorValue = 0x00AAFF; // Light blue for fording river
      } else if (node.specialMovement === 'allPointsMove') {
        colorValue = 0xAA00FF; // Purple for "all points" moves
      }
      
      // Draw a circle at each reachable node
      this.rangeGraphics.fillStyle(colorValue, 0.4);
      this.rangeGraphics.fillCircle(node.x, node.y, 30);
      this.rangeGraphics.strokeCircle(node.x, node.y, 30);
      
      // Show cost if requested
      if (showCosts) {
        // Show different text for special movement
        let costText = `${node.cost}`;
        if (node.specialMovement === 'fordingRiver') {
          costText = 'Ford';
        } else if (node.specialMovement === 'allPointsMove') {
          costText = 'All';
        }
        
        const text = this.scene.add.text(
          node.x, 
          node.y, 
          costText, 
          { 
            fontSize: '16px', 
            fontStyle: 'bold',
            fill: '#000',
            backgroundColor: '#ffffff88',
            padding: { x: 3, y: 3 },
          }
        ).setOrigin(0.5);
        
        this.costTexts.push(text);
      }
    }
    
    // Draw the starting node
    this.rangeGraphics.fillStyle(0x0000FF, 0.6);
    this.rangeGraphics.fillCircle(startNode.x, startNode.y, 35);
    this.rangeGraphics.lineStyle(3, 0xFFFFFF, 0.8);
    this.rangeGraphics.strokeCircle(startNode.x, startNode.y, 35);
    
    // Add starting node text
    if (showCosts) {
      const startText = this.scene.add.text(
        startNode.x, 
        startNode.y, 
        'Start', 
        { 
          fontSize: '14px', 
          fontStyle: 'bold',
          fill: '#FFF',
          backgroundColor: '#00008888',
          padding: { x: 3, y: 3 },
        }
      ).setOrigin(0.5);
      
      this.costTexts.push(startText);
    }
  }
  
  /**
   * Find a path between two nodes
   * @param {number} startNodeId - Starting node ID
   * @param {number} endNodeId - Target node ID
   * @param {object} unit - Optional unit for terrain-specific effects
   * @returns {array} Array of node IDs forming the path, or empty if no path found
   */
  findPath(startNodeId, endNodeId, unit = null) {
    // Convert to integers if they're strings
    startNodeId = parseInt(startNodeId);
    endNodeId = parseInt(endNodeId);
    
    // Validate input
    if (isNaN(startNodeId) || isNaN(endNodeId)) {
      console.error("Invalid node IDs provided to findPath:", startNodeId, endNodeId);
      return [];
    }
    
    // Get nodes
    const startNode = this.nodes[startNodeId];
    const endNode = this.nodes[endNodeId];
    
    if (!startNode || !endNode) {
      console.error("Start or end node not found:", startNodeId, endNodeId);
      return [];
    }
    
    // For same node, return just that node
    if (startNodeId === endNodeId) {
      return [startNodeId];
    }
    
    console.log(`Finding path from node ${startNodeId} to ${endNodeId}`);
    
    // A* pathfinding implementation
    const openSet = [startNodeId];
    const closedSet = new Set(); // Track visited nodes
    const cameFrom = {};
    
    // Cost from start to each node
    const gScore = {};
    gScore[startNodeId] = 0;
    
    // Estimated total cost from start to goal through each node
    const fScore = {};
    fScore[startNodeId] = this.heuristic(startNode, endNode);
    
    // Safety counter to prevent infinite loops
    let iterations = 0;
    const MAX_ITERATIONS = 1000; // Adjust based on map size
    
    while (openSet.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Find node with lowest fScore
      let current = openSet.reduce((lowest, nodeId) => 
        (fScore[nodeId] < fScore[lowest]) ? nodeId : lowest, openSet[0]);
      
      // If we've reached the end node, reconstruct and return the path
      if (current === endNodeId) {
        console.log(`Path found in ${iterations} iterations`);
        return this.reconstructPath(cameFrom, current);
      }
      
      // Remove current from openSet and add to closedSet
      openSet.splice(openSet.indexOf(current), 1);
      closedSet.add(current);
      
      // Check each neighbor
      const neighbors = this.getAdjacentNodes(current);
      
      for (const neighbor of neighbors) {
        const neighborId = neighbor.id;
        
        // Skip if already processed
        if (closedSet.has(neighborId)) continue;
        
        // Get movement cost to this neighbor
        const moveCost = this.calculateMovementCost(current, neighborId, unit);
        
        // Skip impassable terrain
        if (moveCost < 0) continue;
        
        // Calculate tentative gScore
        const tentativeGScore = gScore[current] + moveCost;
        
        // If new path is better or node not visited yet
        if (!gScore[neighborId] || tentativeGScore < gScore[neighborId]) {
          // Record this path
          cameFrom[neighborId] = current;
          gScore[neighborId] = tentativeGScore;
          fScore[neighborId] = gScore[neighborId] + this.heuristic(neighbor, endNode);
          
          // Add neighbor to openSet if not already there
          if (!openSet.includes(neighborId)) {
            openSet.push(neighborId);
          }
        }
      }
    }
    
    if (iterations >= MAX_ITERATIONS) {
      console.error("Pathfinding exceeded maximum iterations");
    }
    
    console.log("No path found after", iterations, "iterations");
    // No path found
    return [];
  }
  
  /**
   * Heuristic function for A* (straight-line distance)
   * @param {object} nodeA - First node
   * @param {object} nodeB - Second node
   * @returns {number} Estimated cost between nodes
   */
  heuristic(nodeA, nodeB) {
    return Phaser.Math.Distance.Between(nodeA.x, nodeA.y, nodeB.x, nodeB.y) / 100;
  }
  
  /**
   * Reconstruct path from cameFrom map
   * @param {object} cameFrom - Map of node -> previous node
   * @param {number} current - End node ID
   * @returns {array} Array of node IDs forming the path
   */
  reconstructPath(cameFrom, current) {
    const totalPath = [current];
    const visitedNodes = new Set([current]); // Track visited nodes to prevent cycles
    
    // Safety counter to prevent infinite loops
    let safetyCounter = 0;
    const MAX_ITERATIONS = 100; // Adjust based on your map size
    
    while (cameFrom[current] && safetyCounter < MAX_ITERATIONS) {
      current = cameFrom[current];
      
      // Check for cycles
      if (visitedNodes.has(current)) {
        console.error("Cycle detected in path reconstruction");
        break;
      }
      
      visitedNodes.add(current);
      totalPath.unshift(current);
      safetyCounter++;
    }
    
    if (safetyCounter >= MAX_ITERATIONS) {
      console.error("Path reconstruction exceeded maximum iterations");
    }
    
    return totalPath;
  }
}

export default MapManager;