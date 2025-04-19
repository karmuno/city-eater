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
    
    // Return movement cost for terrain type
    return this.getMovementCost(terrainType, unit);
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
    
    while (queue.length > 0) {
      const current = queue.shift();
      const currentCost = visited.get(current.nodeId);
      
      // Get adjacent nodes
      const adjacentNodes = this.getAdjacentNodes(current.nodeId);
      
      for (const nextNode of adjacentNodes) {
        // Calculate movement cost
        const moveCost = this.calculateMovementCost(current.nodeId, nextNode.id, unit);
        
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
      const colorValue = 0x00FF00 + Math.floor(ratio * 0xFF) * 0x10000 - Math.floor(ratio * 0xFF) * 0x100;
      
      // Draw a circle at each reachable node
      this.rangeGraphics.fillStyle(colorValue, 0.4);
      this.rangeGraphics.fillCircle(node.x, node.y, 30);
      this.rangeGraphics.strokeCircle(node.x, node.y, 30);
      
      // Show cost if requested
      if (showCosts) {
        const text = this.scene.add.text(
          node.x, 
          node.y, 
          `${node.cost}`, 
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
    const startNode = this.nodes[startNodeId];
    const endNode = this.nodes[endNodeId];
    
    if (!startNode || !endNode) return [];
    
    // A* pathfinding implementation
    const openSet = [startNodeId];
    const cameFrom = {};
    
    // Cost from start to each node
    const gScore = {};
    gScore[startNodeId] = 0;
    
    // Estimated total cost from start to goal through each node
    const fScore = {};
    fScore[startNodeId] = this.heuristic(startNode, endNode);
    
    while (openSet.length > 0) {
      // Find node with lowest fScore
      let current = openSet.reduce((lowest, nodeId) => 
        (fScore[nodeId] < fScore[lowest]) ? nodeId : lowest, openSet[0]);
      
      // If we've reached the end node, reconstruct and return the path
      if (current === endNodeId) {
        return this.reconstructPath(cameFrom, current);
      }
      
      // Remove current from openSet
      openSet.splice(openSet.indexOf(current), 1);
      
      // Check each neighbor
      const neighbors = this.getAdjacentNodes(current);
      
      for (const neighbor of neighbors) {
        // Get movement cost to this neighbor
        const moveCost = this.calculateMovementCost(current, neighbor.id, unit);
        
        // Skip impassable terrain
        if (moveCost < 0) continue;
        
        // Calculate tentative gScore
        const tentativeGScore = gScore[current] + moveCost;
        
        // If this is a better path to the neighbor
        if (!gScore[neighbor.id] || tentativeGScore < gScore[neighbor.id]) {
          // Record this path
          cameFrom[neighbor.id] = current;
          gScore[neighbor.id] = tentativeGScore;
          fScore[neighbor.id] = gScore[neighbor.id] + this.heuristic(neighbor, endNode);
          
          // Add neighbor to openSet if not already there
          if (!openSet.includes(neighbor.id)) {
            openSet.push(neighbor.id);
          }
        }
      }
    }
    
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
    while (cameFrom[current]) {
      current = cameFrom[current];
      totalPath.unshift(current);
    }
    return totalPath;
  }
}

export default MapManager;