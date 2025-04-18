Here’s a prioritized breakdown of build tasks for the game, ordered for logical progression:

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

6. **Monster Class**  
   - Build `Monster.js` with customizable strengths  
   - Implement special ability placeholder system  

---

### **Phase 3: Core Mechanics**  
7. **Turn System**  
   - Alternate between Monster/Human turns  
   - Track movement points and actions per turn  

8. **Movement System**  
   - Highlight valid movement tiles  
   - Implement pathfinding with `easystar.js`  
   - Add terrain restrictions (e.g., helicopters ignore rivers)  

9. **Combat System**  
   - Calculate odds ratios (attacker/defender strength)  
   - Integrate virtual die roll (1–6)  
   - Apply results from `combat-tables.json`  

---

### **Phase 4: Advanced Systems**  
10. **Line of Sight (LOS)**  
    - Add raycasting for blocked paths (high/low buildings)  
    - Visualize LOS during attack selection  

11. **Fire Mechanics**  
    - Flame marker placement/rubble conversion  
    - Wind-driven fire spread logic  
    - Firemen/fireboat extinguishing actions  

12. **Special Abilities**  
    - Implement 2–3 abilities first (e.g., Flying, Fire Breathing)  
    - Add cooldowns/UI indicators  

---

### **Phase 5: UI/UX**  
13. **Unit Panel**  
    - Display selected unit stats/actions  
    - Add attack range visualization  

14. **Monster Dashboard**  
    - Show strength allocations (attack/defense/movement)  
    - Track Victory Points  

15. **Turn Indicator**  
    - Visual toggle between Monster/Human phases  
    - Action counter (e.g., "Destruction attempts remaining: 3")  

---

### **Phase 6: Polish**  
16. **Victory Conditions**  
    - Implement win/loss checks (monster death, VP threshold)  
    - Build `VictoryScene` with replay/exit options  

17. **Animations**  
    - Add combat effects (flames, explosions)  
    - Unit movement tweening  

18. **Sound Integration**  
    - Add SFX for combat, fire, monster actions  
    - Background music toggle  

19. **Scenario System**  
    - Load `scenarios.json` (Initial Strength Points, rulesets)  
    - Add difficulty selector to Main Menu  

---

### **Suggested Workflow**  
1. **Vertical Slice**: Build a minimal playable version first (e.g., Learning Scenario with basic movement/combat).  
2. **Iterate**: Test each system in isolation before combining.  
3. **Expand**: Add advanced features (fire, special abilities) once core works.  

Would you like me to elaborate on any specific task’s implementation steps?