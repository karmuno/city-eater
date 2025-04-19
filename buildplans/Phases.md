### Next 3 Steps:
1. **Fire Mechanics Implementation** - Add FireMarker.js class and fire spread mechanics
2. **UI Development** - Implement TurnIndicator and UnitPanel components
3. **Monster Dashboard** - Complete the MonsterDashboard UI for strength management

Here's a prioritized breakdown of build tasks for the game, ordered for logical progression:

---

### **Phase 1: Core Setup**
1. **Project Setup**  
   - Create folder structure (`src/`, `assets/`, etc.)  
   - Install dependencies (`npm init`, `phaser`, `easystar.js`)  
   - Configure `index.html` and `phaser-config.js`  

2. **Boot Scene**  
   - Preload essential assets (loading bar, fonts)  
   - Initialize game settings (scaling, input)  

3. **Main Menu Scene**  
   - Add buttons for scenario selection  
   - Link to rules/instructions (placeholder text)  

---

### **Phase 2: Game Foundation**  
4. **Tilemap & Grid System**  
   - Import Tiled map (`sheboygan_map.json`)  
   - Implement adjacency checks (no diagonal movement)  
   - Add terrain movement costs (rivers, streets, etc.)  

5. **Unit Base Classes**  
   - Create `Unit.js` (police, helicopters, populace)  
   - Add stats (combat strength, movement allowance)  
   - Load unit sprites from `/assets/images/units/`  

6. **Monster Class** ✓
   - Build `Monster.js` with customizable strengths  
   - Implement special ability placeholder system  

7. **Game State Management** ✓
   - Create `GameState.js` to track game state
   - Implement unit tracking and position management
   - Add state serialization for save/load capability
   - Build event system for state changes

---

### **Phase 3: Core Mechanics**  
8. **Data Loading** ✓
   - Load combat tables from JSON
   - Load unit stats and special abilities
   - Create data validation and error handling

9. **Turn System** ✓
   - Alternate between Monster/Human turns  
   - Track movement points and actions per turn  
   - Implement action limits (3 destruction attempts)

10. **Movement System**  
   - Highlight valid movement tiles  
   - Implement pathfinding with terrain costs
   - Add terrain restrictions (e.g., helicopters ignore rivers)  

11. **Combat System** ✓
   - Calculate odds ratios (attacker/defender strength)  
   - Integrate virtual die roll (1–6)  
   - Apply results from `combat-tables.json`  

---

### **Phase 4: Advanced Systems**  
12. **Line of Sight (LOS)**  
    - Add raycasting for blocked paths (high/low buildings)  
    - Visualize LOS during attack selection  

13. **Fire Mechanics**  
    - Flame marker placement/rubble conversion  
    - Wind-driven fire spread logic  
    - Firemen/fireboat extinguishing actions  

14. **Special Abilities**  
    - Implement 2–3 abilities first (e.g., Flying, Fire Breathing)  
    - Add cooldowns/UI indicators  

15. **Testing Framework**
    - Implement unit tests for critical systems
    - Create test scenarios for pathfinding
    - Add tests for combat resolution edge cases

---

### **Phase 5: UI/UX**  
16. **Unit Panel**  
    - Display selected unit stats/actions  
    - Add attack range visualization  

17. **Monster Dashboard**  
    - Show strength allocations (attack/defense/movement)  
    - Track Victory Points  

18. **Turn Indicator**  
    - Visual toggle between Monster/Human phases  
    - Action counter (e.g., "Destruction attempts remaining: 3")  

---

### **Phase 6: Polish**  
19. **Victory Conditions**  
    - Implement win/loss checks (monster death, VP threshold)  
    - Build `VictoryScene` with replay/exit options  

20. **Animations**  
    - Add combat effects (flames, explosions)  
    - Unit movement tweening  

21. **Sound Integration**  
    - Add SFX for combat, fire, monster actions  
    - Background music toggle  

22. **Scenario System**  
    - Load `scenarios.json` (Initial Strength Points, rulesets)  
    - Add difficulty selector to Main Menu  

---

### **Suggested Workflow**  
1. **Vertical Slice**: Build a minimal playable version first (e.g., Learning Scenario with basic movement/combat).  
2. **Iterate**: Test each system in isolation before combining.  
3. **Expand**: Add advanced features (fire, special abilities) once core works.