### Next 3 Steps:
1. **UI Development** - Implement TurnIndicator and UnitPanel components
2. **Monster Dashboard** - Complete the MonsterDashboard UI for strength management
3. **Special Abilities** - Implement 2-3 monster abilities (Flying, Fire Breathing, Web Spinning)

Here's a prioritized breakdown of build tasks for the game, ordered for logical progression:

---

### **Phase 1: Core Setup** ✓
1. **Project Setup** ✓
   - Create folder structure (`src/`, `assets/`, etc.) ✓
   - Install dependencies (`npm init`, `phaser`, `easystar.js`) ✓
   - Configure `index.html` and `phaser-config.js` ✓

2. **Boot Scene** ✓
   - Preload essential assets (loading bar, fonts) ✓
   - Initialize game settings (scaling, input) ✓

3. **Main Menu Scene** ✓
   - Add buttons for scenario selection ✓
   - Link to rules/instructions (placeholder text) ✓

---

### **Phase 2: Game Foundation** ✓
4. **Tilemap & Grid System** ✓
   - Import Tiled map (`sheboygan_map.json`) ✓
   - Implement adjacency checks (no diagonal movement) ✓
   - Add terrain movement costs (rivers, streets, etc.) ✓

5. **Unit Base Classes** ✓
   - Create `Unit.js` (police, helicopters, populace) ✓
   - Add stats (combat strength, movement allowance) ✓
   - Load unit sprites from `/assets/images/units/` ✓

6. **Monster Class** ✓
   - Build `Monster.js` with customizable strengths ✓
   - Implement special ability placeholder system ✓

7. **Game State Management** ✓
   - Create `GameState.js` to track game state ✓
   - Implement unit tracking and position management ✓
   - Add state serialization for save/load capability ✓
   - Build event system for state changes ✓

---

### **Phase 3: Core Mechanics**
8. **Data Loading** ✓
   - Load combat tables from JSON ✓
   - Load unit stats and special abilities ✓
   - Create data validation and error handling ✓

9. **Turn System** ✓
   - Alternate between Monster/Human turns ✓
   - Track movement points and actions per turn ✓
   - Implement action limits (3 destruction attempts) ✓

10. **Movement System** (⚒️ In Progress)
    - Highlight valid movement tiles ✓
    - Implement pathfinding with terrain costs (⚒️ In Progress)
    - Add terrain restrictions (e.g., helicopters ignore rivers) (⚒️ In Progress)

11. **Combat System** ✓
    - Calculate odds ratios (attacker/defender strength) ✓
    - Integrate virtual die roll (1–6) ✓
    - Apply results from `combat-tables.json` ✓

---

### **Phase 4: Advanced Systems**
12. **Line of Sight (LOS)**
    - Add raycasting for blocked paths (high/low buildings)
    - Visualize LOS during attack selection

13. **Fire Mechanics** ✓
    - Flame marker placement/rubble conversion ✓
    - Wind-driven fire spread logic ✓
    - Firemen/fireboat extinguishing actions ✓

14. **Special Abilities** (⚒️ In Progress)
    - Implement 2–3 abilities first (e.g., Flying, Fire Breathing) (⚒️ In Progress)
    - Add cooldowns/UI indicators (⚒️ In Progress)

15. **Testing Framework**
    - Implement unit tests for critical systems
    - Create test scenarios for pathfinding
    - Add tests for combat resolution edge cases

---

### **Phase 5: UI/UX** ✓
16. **Unit Panel** ✓
    - Display selected unit stats/actions ✓
    - Add attack range visualization ✓

17. **Monster Dashboard** ✓
    - Show strength allocations (attack/defense/movement) ✓
    - Track Victory Points ✓

18. **Turn Indicator** ✓
    - Visual toggle between Monster/Human phases ✓
    - Action counter (e.g., "Destruction attempts remaining: 3") ✓

---

### **Phase 6: Setup & Polish**
19. **Setup Phase** ✓
    - Implement monster creation UI (allocating Initial Strength Points) ✓
    - Create special abilities selection system ✓
    - Add unit purchase system for human player ✓
    - Implement map-edge selection for monster entry ✓
    - Add initial unit placement for human player ✓

20. **Victory Conditions** (⚒️ In Progress)
    - Implement win/loss checks (monster death, VP threshold) ✓
    - Build `VictoryScene` with replay/exit options (⚒️ In Progress)

21. **Animations** (⚒️ In Progress)
    - Add combat effects (flames, explosions) (⚒️ In Progress)
    - Unit movement tweening ✓

22. **Sound Integration**
    - Add SFX for combat, fire, monster actions
    - Background music toggle

23. **Scenario System** (⚒️ In Progress)
    - Load `scenarios.json` (Initial Strength Points, rulesets) ✓
    - Add difficulty selector to Main Menu (⚒️ In Progress)

---

### **Suggested Workflow**
1. **Vertical Slice**: Build a minimal playable version first (e.g., Learning Scenario with basic movement/combat). ✓
2. **Iterate**: Test each system in isolation before combining. ✓
3. **Expand**: Add advanced features (fire, special abilities) once core works. (⚒️ In Progress)