class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
    this.scenarios = [
      { 
        id: 'learning', 
        name: 'Learning Scenario', 
        description: 'Simplified rules. No special abilities.', 
        humanPoints: 25,
        monsterPoints: 13,
        victoryPoints: 25,
        specialRules: 'No special abilities or helicopters'
      },
      { 
        id: 'basic', 
        name: 'Basic Scenario', 
        description: 'Standard game without advanced rules', 
        humanPoints: 32,
        monsterPoints: 18,
        victoryPoints: 32,
        specialRules: 'No helicopters or fire attack abilities'
      },
      { 
        id: 'advancedA', 
        name: 'Advanced Scenario A', 
        description: 'Full rules with balanced forces', 
        humanPoints: 44,
        monsterPoints: 30,
        victoryPoints: 40,
        specialRules: 'All rules are used'
      },
      { 
        id: 'advancedB', 
        name: 'Advanced Scenario B', 
        description: 'Full rules with stronger forces', 
        humanPoints: 60,
        monsterPoints: 40,
        victoryPoints: 55,
        specialRules: 'All rules are used'
      },
      { 
        id: 'cityEating', 
        name: 'City Eating Scenario', 
        description: 'Monster grows stronger as it eats', 
        humanPoints: 60,
        monsterPoints: 25,
        victoryPoints: 55,
        specialRules: 'Monster gains strength by destroying buildings'
      }
    ];
  }
  
  preload() {
    console.log("MainMenuScene loaded!"); 
  }
  
  create() {
    const { width, height } = this.cameras.main;
    
    // Title
    const title = this.add.text(width / 2, height * 0.15, 'THE CREATURE THAT ATE SHEBOYGAN', {
      fontFamily: '"Press Start 2P"',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Subtitle
    this.add.text(width / 2, height * 0.25, 'SELECT SCENARIO', {
      fontFamily: '"Press Start 2P"',
      fontSize: '18px',
      color: '#ffff00',
      align: 'center'
    }).setOrigin(0.5);
    
    // Create scenario selection buttons
    this.createScenarioButtons();
    
    // Add rules/instructions button
    const rulesButton = this.add.text(width / 2, height * 0.85, 'RULES & INSTRUCTIONS', {
      fontFamily: '"Press Start 2P"',
      fontSize: '14px',
      color: '#4cd3c2',
      align: 'center',
      padding: { x: 20, y: 10 },
      backgroundColor: '#000000'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => rulesButton.setColor('#ffffff'))
      .on('pointerout', () => rulesButton.setColor('#4cd3c2'))
      .on('pointerdown', () => this.showRulesModal());
  }
  
  createScenarioButtons() {
    const { width, height } = this.cameras.main;
    const startY = height * 0.35;
    const spacing = height * 0.09;
    
    this.scenarios.forEach((scenario, index) => {
      // Button background
      const button = this.add.rectangle(
        width / 2,
        startY + (spacing * index),
        width * 0.6,
        spacing * 0.8,
        0x333333
      ).setInteractive({ useHandCursor: true });
      
      // Button text
      const buttonText = this.add.text(
        width / 2,
        startY + (spacing * index) - 12,
        scenario.name,
        {
          fontFamily: '"Press Start 2P"',
          fontSize: '16px',
          color: '#ffffff'
        }
      ).setOrigin(0.5);
      
      // Description text
      const descText = this.add.text(
        width / 2,
        startY + (spacing * index) + 12,
        scenario.description,
        {
          fontFamily: '"Press Start 2P"',
          fontSize: '10px',
          color: '#cccccc'
        }
      ).setOrigin(0.5);
      
      // Make the whole button interactive
      button.on('pointerover', () => {
        button.setFillStyle(0x555555);
        buttonText.setColor('#ffff00');
      });
      
      button.on('pointerout', () => {
        button.setFillStyle(0x333333);
        buttonText.setColor('#ffffff');
      });
      
      button.on('pointerdown', () => {
        this.selectScenario(scenario);
      });
    });
  }
  
  selectScenario(scenario) {
    console.log(`Selected scenario: ${scenario.id}`);
    // Store the selected scenario information
    this.registry.set('scenario', scenario);
    
    // Start the setup process
    this.scene.start('SetupScene');
  }
  
  showRulesModal() {
    const { width, height } = this.cameras.main;
    
    // Darkened background
    const modalBg = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.8
    ).setInteractive()
      .on('pointerdown', () => this.closeRulesModal());
    
    // Modal container
    const modal = this.add.rectangle(
      width / 2,
      height / 2,
      width * 0.8,
      height * 0.8,
      0x222222,
      0.95
    ).setInteractive().setName('rulesModal');
    
    // Modal title
    const modalTitle = this.add.text(
      width / 2,
      height * 0.2,
      'RULES & INSTRUCTIONS',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '18px',
        color: '#ffffff'
      }
    ).setOrigin(0.5).setName('rulesTitle');
    
    // Rules text
    const rulesText = this.add.text(
      width / 2,
      height * 0.4,
      'Rising from the depths of Lake Michigan, the creature\nshook its massive head and looked north on Route 42.\n' +
      'Slowly, it pulled its massive body from the waters and\nbegan trundling down the superhighway.\n\n' +
      'The Creature That Ate Sheboygan is a turn-based strategy game\nwhere one player controls the monster while the other\ncontrols the human forces defending the city.\n\n' +
      'Game Basics:\n' +
      '- Players alternate turns (Monster, then Human forces)\n' +
      '- The monster can move, destroy buildings, and attack units\n' +
      '- Human forces can move units and attack the monster\n' +
      '- The monster wins by reaching the Victory Point threshold\n' +
      '- Humans win if they reduce monster defense to zero',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '10px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 10
      }
    ).setOrigin(0.5).setName('rulesText');
    
    // Close button
    const closeButton = this.add.text(
      width / 2,
      height * 0.75,
      'CLOSE',
      {
        fontFamily: '"Press Start 2P"',
        fontSize: '14px',
        color: '#ff0000',
        backgroundColor: '#333333',
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setName('closeButton')
      .on('pointerover', () => closeButton.setColor('#ffffff'))
      .on('pointerout', () => closeButton.setColor('#ff0000'))
      .on('pointerdown', () => this.closeRulesModal());
    
    this.rulesElements = [modalBg, modal, modalTitle, rulesText, closeButton];
  }
  
  closeRulesModal() {
    if (this.rulesElements) {
      this.rulesElements.forEach(element => element.destroy());
      this.rulesElements = null;
    }
  }
}

export default MainMenuScene;