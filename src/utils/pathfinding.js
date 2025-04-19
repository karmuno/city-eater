/**
 * Pathfinding utilities for the game
 */

/**
 * Check if two positions are close enough to be considered the same
 * @param {object} pos1 - {x, y} coordinates 
 * @param {object} pos2 - {x, y} coordinates
 * @param {number} threshold - Distance threshold
 * @returns {boolean} True if positions are close
 */
function isSamePosition(pos1, pos2, threshold = 20) {
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  return dx <= threshold && dy <= threshold;
}

/**
 * Calculate Manhattan distance between two points
 * @param {object} pos1 - {x, y} coordinates
 * @param {object} pos2 - {x, y} coordinates
 * @returns {number} Manhattan distance
 */
function manhattanDistance(pos1, pos2) {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

/**
 * Find a path between two points using A* algorithm and terrain costs
 * @param {object} startPos - {x, y} Starting position
 * @param {object} endPos - {x, y} Target position
 * @param {object} mapManager - Reference to the MapManager
 * @param {number} maxCost - Maximum movement cost allowed
 * @returns {array} Array of positions forming the path
 */
function findPath(startPos, endPos, mapManager, maxCost = Infinity) {
  // Use Map for better performance with object keys
  const openSet = new Map();
  const closedSet = new Map();
  const gScores = new Map();
  const fScores = new Map();
  const cameFrom = new Map();
  
  // Initialize with starting position
  const startKey = `${startPos.x},${startPos.y}`;
  openSet.set(startKey, startPos);
  gScores.set(startKey, 0);
  fScores.set(startKey, manhattanDistance(startPos, endPos));
  
  while (openSet.size > 0) {
    // Find node with lowest fScore
    let currentKey = null;
    let lowestFScore = Infinity;
    
    for (const [key, pos] of openSet.entries()) {
      const score = fScores.get(key);
      if (score < lowestFScore) {
        lowestFScore = score;
        currentKey = key;
      }
    }
    
    const current = openSet.get(currentKey);
    
    // Check if we've reached the destination
    if (isSamePosition(current, endPos)) {
      return reconstructPath(cameFrom, current);
    }
    
    // Move current node from open to closed set
    openSet.delete(currentKey);
    closedSet.set(currentKey, current);
    
    // Get neighbors
    const neighbors = mapManager.getAdjacentPositions(current);
    
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      
      // Skip if in closed set
      if (closedSet.has(neighborKey)) continue;
      
      // Calculate cost
      const moveCost = mapManager.calculateMovementCost(current, neighbor);
      
      // Skip impassable terrain
      if (moveCost < 0) continue;
      
      const tentativeGScore = gScores.get(currentKey) + moveCost;
      
      // Skip if exceeds max cost
      if (tentativeGScore > maxCost) continue;
      
      // If neighbor not in open set, or we found a better path
      if (!openSet.has(neighborKey) || tentativeGScore < gScores.get(neighborKey)) {
        // Record the path
        cameFrom.set(neighborKey, current);
        gScores.set(neighborKey, tentativeGScore);
        fScores.set(neighborKey, tentativeGScore + manhattanDistance(neighbor, endPos));
        
        // Add to open set if not already there
        if (!openSet.has(neighborKey)) {
          openSet.set(neighborKey, neighbor);
        }
      }
    }
  }
  
  // No path found
  return [];
}

/**
 * Reconstruct path from cameFrom map
 * @param {Map} cameFrom - Map of position keys to their parent positions
 * @param {object} current - Current position
 * @returns {array} Array of positions forming the path
 */
function reconstructPath(cameFrom, current) {
  const path = [current];
  let currentKey = `${current.x},${current.y}`;
  
  while (cameFrom.has(currentKey)) {
    current = cameFrom.get(currentKey);
    path.unshift(current);
    currentKey = `${current.x},${current.y}`;
  }
  
  return path;
}

export {
  isSamePosition,
  manhattanDistance,
  findPath
};