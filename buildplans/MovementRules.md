  Updated High-Level Plan for Movement System

  1. Grid Representation with Gap Tolerance:
    - Model each "box" (area) with its logically adjacent boxes
    - Introduce a tolerance parameter to account for small gaps between boxes
    - Consider boxes adjacent even if they have small gaps between their borders
  2. Object-Based Grid with Proximity Detection:
    - Create a map of terrain objects where each knows its adjacencies
    - Use a proximity-based approach rather than strict border sharing
    - Define a threshold distance where boxes are considered adjacent despite gaps
  3. Flexible Adjacency Discovery:
    - Calculate adjacency based on minimum distance between box edges rather than exact border sharing
    - Two boxes are adjacent if they are within a specified distance threshold
    - Filter out diagonal adjacencies (boxes that only meet at/near corners)
    - Consider direction vectors between boxes to differentiate side-adjacency from corner-adjacency
  4. Visual Debugging Tools:
    - Create visualization tools to show computed adjacencies
    - Allow adjustment of proximity thresholds to fine-tune the system
    - Provide visual feedback when selecting a tile to show all its adjacencies
  5. Proximity Graph Construction:
    - Build a graph representation where nodes are boxes and edges represent adjacency
    - Pre-compute this graph during map loading
    - Validate that each box has the expected number of adjacent boxes (3-6 as per rulebook)
  6. Movement Cost Implementation:
    - Apply terrain-specific movement costs as defined in the rulebook
    - Track terrain types and their effects on different unit types
    - Update movement visualization to reflect these costs
  7. Pathfinding with Irregular Adjacency:
    - Adapt A* algorithm to work with arbitrary adjacency graphs rather than grid directions
    - Use the pre-computed adjacency graph for path calculations
    - Ensure the pathfinding respects terrain costs and movement restrictions
  8. Special Movement Rules Implementation:
    - Handle special cases like river crossings, bridges, and tunnels
    - Implement unit-specific movement rules (flying, jumping, etc.)
    - Support the "towing" mechanic mentioned in the rulebook where artillery can be moved by armor
