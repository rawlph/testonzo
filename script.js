/**
 * Game State Management System
 * Centralizes game state and provides methods to update it
 */
const GameState = {
    // Game status
    isActive: true,
    
    // Grid configuration
    grid: {
        rows: 5,
        cols: 5,
        hexVisualWidth: 86.6,
        hexHeight: 100,
        rowOffset: 75, // hexHeight * 0.75
        colOffset: 86.6
    },
    
    // Player state
    player: {
        currentRow: 0,
        currentCol: 0,
        turnCount: 0,
        currentLevelSenses: [],
        moveCounter: 0,
        hasUsedSenserBonus: false,
        currentAction: null,
        movementPoints: 1
    },
    
    // Game progress
    progress: {
        stats: {
            movementRange: 1,
            luck: 1
        },
        traits: [],
        persistentInventory: [],
        xp: 0,
        sensedTypes: [],
        uniqueSensedTypes: [],
        sensesMade: 0,
        pokesMade: 0,
        hasFoundZoe: false,
        zoeLevelsCompleted: 0,
        essence: 0,
        systemChaos: 0.5,
        systemOrder: 0.5,
        orderContributions: 0
    },
    
    // World state
    worldEvolution: {
        globalChaos: 0.8,
        globalOrder: 0.2,
        age: 0,
        eventHistory: []
    },
    
    // Resource limits and rates
    resourceLimits: {
        energy: 20,
        essence: 50,
        knowledge: 50,
        stability: 50
    },
    
    resourceRates: {
        energyPerTurn: 2,
        essencePerChaos: 1,
        knowledgePerSense: 1,
        stabilityPerStabilize: 1,
        stabilityDecayPerTurn: 0.5
    },
    
    // Current resources
    resources: {
        energy: 10,
        essence: 0,
        knowledge: 0,
        stability: 0
    },
    
    // Level state
    level: {
        temporaryInventory: [],
        hasKey: false,
        foundZoe: false,
        requiresKey: true
    },
    
    /**
     * Determines the type of a tile based on its chaos value
     * @param {number} chaos - Chaos value between 0 and 1
     * @returns {string} Tile type
     */
    determineTileType(chaos) {
        // Default to normal
        let type = 'normal';
        
        // Determine type based on chaos level
        if (chaos < 0.2) {
            // High order tiles
            const types = ['normal'];
            type = types[Math.floor(Math.random() * types.length)];
        } else if (chaos < 0.4) {
            // Order tiles
            const types = ['normal'];
            type = types[Math.floor(Math.random() * types.length)];
        } else if (chaos < 0.6) {
            // Balanced tiles
            const types = ['normal'];
            type = types[Math.floor(Math.random() * types.length)];
        } else if (chaos < 0.8) {
            // Chaos tiles
            const types = ['normal'];
            type = types[Math.floor(Math.random() * types.length)];
        } else {
            // High chaos tiles
            const types = ['normal'];
            type = types[Math.floor(Math.random() * types.length)];
        }
        
        return type;
    },
    
    // Resource system
    resources: {
        energy: 0,      // Used for movement and basic actions
        essence: 0,     // Used for stabilization and evolution
        knowledge: 0,   // Used to unlock new abilities
        stability: 50   // Affects success rate of actions (0-100 scale)
    },
    
    // Resource generation/consumption rates
    resourceRates: {
        energyPerRest: 10,
        essencePerStabilize: 1,
        knowledgePerSense: 2,
        stabilityDecayPerTurn: 1,
        stabilityGainPerStabilize: 5
    },
    
    // Evolution system
    evolution: {
        // Evolution paths
        paths: {
            explorer: { level: 0, xp: 0, xpToNext: 100, traits: [] },
            manipulator: { level: 0, xp: 0, xpToNext: 100, traits: [] },
            stabilizer: { level: 0, xp: 0, xpToNext: 100, traits: [] },
            survivor: { level: 0, xp: 0, xpToNext: 100, traits: [] }
        },
        
        // Available traits for each path
        availableTraits: {
            explorer: [
                { id: 'enhanced_vision', name: 'Enhanced Vision', description: 'Increases vision range by 1', effect: 'vision_range_+1', cost: { knowledge: 50 }, level: 1 },
                { id: 'pattern_recognition', name: 'Pattern Recognition', description: 'Sense actions reveal more information', effect: 'sense_efficiency_+20%', cost: { knowledge: 100 }, level: 2 },
                { id: 'intuition', name: 'Intuition', description: 'Chance to automatically sense adjacent tiles', effect: 'auto_sense_chance_20%', cost: { knowledge: 150 }, level: 3 }
            ],
            manipulator: [
                { id: 'dexterous', name: 'Dexterous', description: 'Poke actions cost 1 less energy', effect: 'poke_energy_-1', cost: { essence: 50 }, level: 1 },
                { id: 'reactive', name: 'Reactive', description: 'Poke actions have 20% better success rate', effect: 'poke_success_+20%', cost: { essence: 100 }, level: 2 },
                { id: 'adaptive', name: 'Adaptive', description: 'Poke effects are 50% stronger', effect: 'poke_effect_+50%', cost: { essence: 150 }, level: 3 }
            ],
            stabilizer: [
                { id: 'harmonizer', name: 'Harmonizer', description: 'Stabilize actions are 20% more effective', effect: 'stabilize_effect_+20%', cost: { essence: 50 }, level: 1 },
                { id: 'balancer', name: 'Balancer', description: 'Gain 2 stability each turn', effect: 'stability_per_turn_+2', cost: { essence: 100 }, level: 2 },
                { id: 'architect', name: 'Architect', description: 'Stabilize actions affect adjacent tiles slightly', effect: 'stabilize_adjacent', cost: { essence: 150 }, level: 3 }
            ],
            survivor: [
                { id: 'efficient_movement', name: 'Efficient Movement', description: 'Movement costs no energy every 3rd step', effect: 'free_move_every_3', cost: { energy: 50 }, level: 1 },
                { id: 'energy_storage', name: 'Energy Storage', description: 'Increases maximum energy by 25', effect: 'max_energy_+25', cost: { energy: 100 }, level: 2 },
                { id: 'resilience', name: 'Resilience', description: 'Reduces stability loss in chaotic areas by 50%', effect: 'stability_loss_-50%', cost: { energy: 150 }, level: 3 }
            ]
        },
        
        // Active traits (those that have been unlocked)
        activeTraits: []
    },
    
    // Event system
    events: {
        // Currently active events
        activeEvents: [],
        
        // Events that have been completed
        completedEvents: [],
        
        // Multi-step event chains
        eventChains: {},
        
        // Available events by world age
        availableEvents: {
            // Early game events (world age 0-4)
            early: [
                {
                    id: 'primordial_spark',
                    name: 'Primordial Spark',
                    type: 'world',
                    trigger: { condition: 'chaos_below', value: 0.7 },
                    description: 'The chaos begins to form patterns...',
                    effect: { type: 'resource_gain', resource: 'knowledge', amount: 20 },
                    flavor: 'As the primordial chaos settles, you sense the first glimmers of order emerging from the void.'
                },
                {
                    id: 'energy_surge',
                    name: 'Energy Surge',
                    type: 'tile',
                    trigger: { condition: 'poke_chaos_tile', value: 0.8 },
                    description: 'A surge of raw energy erupts from the chaotic tile!',
                    effect: { type: 'resource_gain', resource: 'energy', amount: 15 },
                    flavor: 'The chaotic energies coalesce and flow into your being, invigorating you.'
                },
                {
                    id: 'stability_fluctuation',
                    name: 'Stability Fluctuation',
                    type: 'tile',
                    trigger: { condition: 'stabilize_tile', value: 0.5 },
                    description: 'Your stabilization efforts create unexpected patterns.',
                    effect: { type: 'resource_gain', resource: 'stability', amount: 10 },
                    flavor: 'The patterns you create seem to resonate with the surrounding environment.'
                }
            ],
            
            // Mid game events (world age 5-9)
            mid: [
                {
                    id: 'first_life',
                    name: 'First Life',
                    type: 'evolution',
                    trigger: { condition: 'any_path_level', value: 3 },
                    description: 'Simple life forms begin to emerge in the ordered regions.',
                    effect: { type: 'resource_gain', resource: 'essence', amount: 30 },
                    flavor: 'Tiny, primitive organisms appear in the areas you\'ve stabilized, drawn to the order you\'ve created.'
                },
                {
                    id: 'knowledge_repository',
                    name: 'Knowledge Repository',
                    type: 'tile',
                    trigger: { condition: 'sense_order_tile', value: 0.7 },
                    description: 'You discover a concentrated pocket of organized information.',
                    effect: { type: 'resource_gain', resource: 'knowledge', amount: 25 },
                    flavor: 'The ordered patterns contain complex information structures that you can absorb and understand.'
                },
                {
                    id: 'chaotic_resonance',
                    name: 'Chaotic Resonance',
                    type: 'world',
                    trigger: { condition: 'chaos_above', value: 0.6 },
                    description: 'The remaining chaos begins to resonate with your actions.',
                    effect: { type: 'resource_gain', resource: 'energy', amount: -10, stability: -15 },
                    flavor: 'The chaotic forces resist your ordering influence, creating turbulence in your path.'
                }
            ],
            
            // Late game events (world age 10+)
            late: [
                {
                    id: 'consciousness',
                    name: 'Consciousness',
                    type: 'chain',
                    trigger: { condition: 'stability_above', value: 70 },
                    description: 'Something new is awakening in the ordered regions...',
                    chainId: 'consciousness_emergence',
                    step: 1,
                    effect: { type: 'resource_gain', resource: 'knowledge', amount: 50 },
                    flavor: 'You sense a new pattern forming—one that seems to observe and respond to its surroundings.'
                },
                {
                    id: 'ecosystem_formation',
                    name: 'Ecosystem Formation',
                    type: 'world',
                    trigger: { condition: 'order_above', value: 0.7 },
                    description: 'The ordered regions begin to form complex, interconnected systems.',
                    effect: { type: 'resource_gain', resource: 'essence', amount: 40 },
                    flavor: 'Life forms begin to interact with each other, creating a web of relationships and dependencies.'
                },
                {
                    id: 'reality_stabilization',
                    name: 'Reality Stabilization',
                    type: 'tile',
                    trigger: { condition: 'stabilize_order_tile', value: 0.8 },
                    description: 'Your stabilization creates a permanent anchor point in reality.',
                    effect: { type: 'special', special: 'reality_anchor' },
                    flavor: 'This region now exists as a fixed point in the cosmos, immune to the forces of chaos.'
                }
            ]
        },
        
        // Event chains (multi-step events)
        chains: {
            consciousness_emergence: {
                name: 'The Emergence of Consciousness',
                steps: 3,
                currentStep: 0,
                description: 'A new form of awareness is developing in the ordered regions of the world.',
                stepDetails: [
                    {
                        description: 'The first glimmers of self-awareness appear in the ordered patterns.',
                        effect: { type: 'resource_gain', resource: 'knowledge', amount: 50 },
                        flavor: 'Something is watching you from within the patterns you\'ve created.'
                    },
                    {
                        description: 'The consciousness begins to communicate through pattern manipulation.',
                        effect: { type: 'resource_gain', resource: 'essence', amount: 50 },
                        flavor: 'Subtle changes in the environment suggest an attempt at communication.'
                    },
                    {
                        description: 'The consciousness fully emerges and recognizes you as its creator.',
                        effect: { type: 'special', special: 'consciousness_ally' },
                        flavor: 'A new entity has been born from your efforts to create order from chaos.'
                    }
                ]
            }
        }
    },
    
    // Level data
    level: {
        tileData: null,
        temporaryInventory: []
    },
    
    // Progress data (persisted)
    progress: {
        stats: { movementRange: 1, luck: 0 },
        traits: [],
        persistentInventory: [],
        xp: 0,
        sensedTypes: [],
        sensesMade: 0,
        pokesMade: 0,
        hasFoundZoe: false,
        zoeLevelsCompleted: 0,
        essence: 0,
        systemChaos: 0.5,
        systemOrder: 0.5,
        orderContributions: 0,
        levelsWithPositiveOrder: 0,
        uniqueSensedTypes: [],
        totalResources: {
            energyGained: 0,
            essenceGained: 0,
            knowledgeGained: 0
        }
    },
    
    // World evolution system
    worldEvolution: {
        age: 0,                  // Increases with each level completed
        globalChaos: 0.8,        // Starting at 80% chaos
        globalOrder: 0.2,        // Starting at 20% order
        stabilityThreshold: 0.4, // Minimum order needed for certain features
        complexityThreshold: 0.6, // Higher order enables more complex features
        tileVariance: 0.2        // How much individual tiles can vary from global state
    },
    
    // Metrics tracking
    metrics: null,
    recentMetrics: null,
    
    /**
     * Initializes the game state
     */
    init() {
        console.log("Initializing game state...");
        
        // Load saved progress or create default state
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            try {
                const parsedState = JSON.parse(savedState);
                
                // Restore saved properties
                this.grid = parsedState.grid || this.grid;
                this.progress = parsedState.progress || this.progress;
                this.worldEvolution = parsedState.worldEvolution || this.worldEvolution;
                
                console.log("Loaded saved game state");
            } catch (error) {
                console.error("Error loading saved state:", error);
                this.resetAllProgress();
            }
        } else {
            console.log("No saved state found, using defaults");
            this.resetAllProgress();
        }
        
        // Initialize evolution paths if they don't exist
        if (!this.evolution || !this.evolution.paths) {
            console.log("Initializing evolution system...");
            this.evolution = {
                paths: {
                    chaos: {
                        name: "Path of Chaos",
                        description: "Embrace the unpredictable nature of chaos to gain powers of transformation and creation.",
                        xp: 0,
                        unlocked: false,
                        traits: [
                            {
                                id: "chaos_affinity",
                                name: "Chaos Affinity",
                                description: "Gain 1 essence for each chaotic tile you interact with.",
                                cost: 10,
                                unlocked: false,
                                effect: "gain_essence_from_chaos"
                            },
                            {
                                id: "enhanced_poke",
                                name: "Enhanced Poke",
                                description: "Increases chance of successfully changing a tile when poking by 20%.",
                                cost: 20,
                                unlocked: false,
                                effect: "poke_success_+20%"
                            },
                            {
                                id: "chaos_vision",
                                name: "Chaos Vision",
                                description: "Can see the chaos level of tiles within vision range.",
                                cost: 30,
                                unlocked: false,
                                effect: "see_chaos_levels"
                            }
                        ]
                    },
                    order: {
                        name: "Path of Order",
                        description: "Master the principles of order to stabilize the world and enhance your resilience.",
                        xp: 0,
                        unlocked: false,
                        traits: [
                            {
                                id: "order_affinity",
                                name: "Order Affinity",
                                description: "Gain 1 stability for each ordered tile you interact with.",
                                cost: 10,
                                unlocked: false,
                                effect: "gain_stability_from_order"
                            },
                            {
                                id: "efficient_movement",
                                name: "Efficient Movement",
                                description: "Reduce energy cost of movement by 1.",
                                cost: 20,
                                unlocked: false,
                                effect: "movement_cost_-1"
                            },
                            {
                                id: "order_shield",
                                name: "Order Shield",
                                description: "Gain resistance to chaotic effects.",
                                cost: 30,
                                unlocked: false,
                                effect: "chaos_resistance"
                            }
                        ]
                    },
                    balance: {
                        name: "Path of Balance",
                        description: "Walk the line between chaos and order to gain versatile abilities.",
                        xp: 0,
                        unlocked: false,
                        traits: [
                            {
                                id: "balanced_insight",
                                name: "Balanced Insight",
                                description: "Gain 1 knowledge when interacting with balanced tiles.",
                                cost: 10,
                                unlocked: false,
                                effect: "gain_knowledge_from_balance"
                            },
                            {
                                id: "enhanced_vision",
                                name: "Enhanced Vision",
                                description: "Increase vision range by 1.",
                                cost: 20,
                                unlocked: false,
                                effect: "vision_range_+1"
                            },
                            {
                                id: "harmony",
                                name: "Harmony",
                                description: "All resources regenerate 1 per turn.",
                                cost: 30,
                                unlocked: false,
                                effect: "all_resources_regen_1"
                            }
                        ]
                    }
                },
                activeTraits: []
            };
            console.log("Evolution system initialized");
        }
        
        // Initialize events system if it doesn't exist
        if (!this.events || !this.events.available || !this.events.triggered || !this.events.chains) {
            console.log("Initializing events system...");
            this.events = {
                available: [
                    {
                        id: "chaos_spike",
                        name: "Chaos Spike",
                        description: "A sudden surge of chaos energy has been detected in the area.",
                        trigger: { type: "gameStart", chance: 0.3 },
                        effect: { type: "increaseChaos", value: 0.2 },
                        requirement: { globalChaos: 0.4 },
                        oneTime: false,
                        completed: false
                    },
                    {
                        id: "order_stabilization",
                        name: "Order Stabilization",
                        description: "A wave of order energy is stabilizing the surrounding area.",
                        trigger: { type: "gameStart", chance: 0.3 },
                        effect: { type: "increaseOrder", value: 0.2 },
                        requirement: { globalOrder: 0.4 },
                        oneTime: false,
                        completed: false
                    },
                    {
                        id: "energy_bloom",
                        name: "Energy Bloom",
                        description: "A bloom of energy has appeared nearby.",
                        trigger: { type: "turn", chance: 0.2, minTurn: 5 },
                        effect: { type: "spawnEnergyTile" },
                        oneTime: false,
                        completed: false
                    },
                    {
                        id: "ancient_knowledge",
                        name: "Ancient Knowledge",
                        description: "You've discovered ancient knowledge about the world's creation.",
                        trigger: { type: "sense", targetType: "special", chance: 1.0 },
                        effect: { type: "grantResource", resource: "knowledge", value: 5 },
                        oneTime: true,
                        completed: false
                    },
                    {
                        id: "zoe_insight",
                        name: "Zoe's Insight",
                        description: "Zoe shares wisdom about the balance of chaos and order.",
                        trigger: { type: "findZoe", chance: 1.0 },
                        effect: { type: "unlockEvolutionPath", path: "balance" },
                        oneTime: true,
                        completed: false,
                        chain: "zoe_story"
                    }
                ],
                triggered: [],
                chains: {
                    "zoe_story": {
                        name: "Zoe's Journey",
                        description: "Follow Zoe's story as she navigates the balance between chaos and order.",
                        events: ["zoe_insight", "zoe_quest", "zoe_revelation"],
                        currentStep: 0,
                        completed: false
                    }
                },
                early: [], // Early game events
                mid: [],   // Mid game events
                late: []   // Late game events
            };
            console.log("Events system initialized");
        }
        
        // Set starting resources if not set
        if (!this.resources) {
            this.resources = {
                energy: 10,
                essence: 0,
                knowledge: 0,
                stability: 0
            };
        }
        
        // Set resource limits if not set
        if (!this.resourceLimits) {
            this.resourceLimits = {
                energy: 20,
                essence: 50,
                knowledge: 50,
                stability: 50
            };
        }
        
        // Initialize metrics tracking system
        if (!this.metrics) {
            this.metrics = {
                turnsTaken: 0,
                sensesMade: 0,
                pokesMade: 0,
                energyUsedForMovement: 0,
                energyUsedForExploration: 0,
                movesMade: 0,
                restsTaken: 0,
                tilesExplored: 0,
                specialTilesInteracted: 0,
                
                incrementTurns() { this.turnsTaken++; },
                incrementSenses() { this.sensesMade++; },
                incrementPokes() { this.pokesMade++; },
                addEnergyForMovement(cost) { this.energyUsedForMovement += cost; },
                addEnergyForExploration(cost) { this.energyUsedForExploration += cost; },
                incrementMoves() { this.movesMade++; },
                incrementRests() { this.restsTaken++; },
                incrementTilesExplored() { this.tilesExplored++; },
                incrementSpecialTiles() { this.specialTilesInteracted++; },
                
                reset() {
                    this.turnsTaken = 0;
                    this.sensesMade = 0;
                    this.pokesMade = 0;
                    this.energyUsedForMovement = 0;
                    this.energyUsedForExploration = 0;
                    this.movesMade = 0;
                    this.restsTaken = 0;
                    this.tilesExplored = 0;
                    this.specialTilesInteracted = 0;
                },
                
                getEnergyUsageRatio() {
                    const total = this.energyUsedForMovement + this.energyUsedForExploration;
                    return total === 0 ? 0 : this.energyUsedForMovement / total;
                },
                
                getMovementEfficiency(safestPathLength) {
                    return safestPathLength === 0 ? 0 : safestPathLength / this.movesMade;
                }
            };
        }
        
        // Initialize level-specific state
        this.level = {
            temporaryInventory: [],
            hasKey: false,
            foundZoe: false,
            requiresKey: true
        };
        
        // Recent metrics for rate-of-change calculations
        this.recentMetrics = {
            previousChaos: this.worldEvolution.globalChaos,
            previousOrder: this.worldEvolution.globalOrder
        };
        
        console.log("Game state initialized successfully");
    },
    
    /**
     * Check which events are triggered based on the trigger type
     * @param {string} triggerType - The trigger type to check (e.g., 'gameStart', 'turn', 'sense')
     * @param {Object} context - Additional context for the trigger check
     * @returns {Array} - List of triggered events
     */
    checkEvents(triggerType, context = {}) {
        console.log(`Checking for events of type: ${triggerType}`);
        
        if (!this.events || !this.events.available) {
            console.warn("Events system not properly initialized");
            return [];
        }
        
        // Ensure event categories exist
        if (!this.events.early) this.events.early = [];
        if (!this.events.mid) this.events.mid = [];
        if (!this.events.late) this.events.late = [];
        
        // Determine which event pool to use based on world age
        let eventPool = this.events.available;
        if (this.worldEvolution && this.worldEvolution.age) {
            if (this.worldEvolution.age < 5) {
                eventPool = this.events.early;
            } else if (this.worldEvolution.age < 10) {
                eventPool = this.events.mid;
            } else {
                eventPool = this.events.late;
            }
        }
        
        // Filter events based on trigger type
        const triggeredEvents = eventPool.filter(event => event.trigger.type === triggerType);
        
        // Trigger events
        triggeredEvents.forEach(event => {
            if (Math.random() < event.trigger.chance) {
                this.triggerEvent(event);
            }
        });
        
        return triggeredEvents;
    },
    
    /**
     * Triggers an event
     * @param {Object} event - The event to trigger
     */
    triggerEvent(event) {
        console.log(`Triggering event: ${event.name}`);
        
        // Update event status
        event.completed = true;
        
        // Apply event effect
        if (event.effect) {
            if (event.effect.type === 'resource_gain') {
                if (event.effect.resource === 'energy') {
                    this.resources.energy += event.effect.amount;
                } else if (event.effect.resource === 'essence') {
                    this.resources.essence += event.effect.amount;
                } else if (event.effect.resource === 'knowledge') {
                    this.resources.knowledge += event.effect.amount;
                } else if (event.effect.resource === 'stability') {
                    this.resources.stability += event.effect.amount;
                }
            } else if (event.effect.type === 'resource_loss') {
                if (event.effect.resource === 'energy') {
                    this.resources.energy -= event.effect.amount;
                } else if (event.effect.resource === 'essence') {
                    this.resources.essence -= event.effect.amount;
                } else if (event.effect.resource === 'knowledge') {
                    this.resources.knowledge -= event.effect.amount;
                } else if (event.effect.resource === 'stability') {
                    this.resources.stability -= event.effect.amount;
                }
            } else if (event.effect.type === 'special') {
                if (event.effect.special === 'reality_anchor') {
                    // Implement reality anchor effect
                }
            } else if (event.effect.type === 'increaseChaos') {
                this.worldEvolution.globalChaos += event.effect.value;
            } else if (event.effect.type === 'increaseOrder') {
                this.worldEvolution.globalOrder += event.effect.value;
            } else if (event.effect.type === 'spawnEnergyTile') {
                // Implement spawn energy tile effect
            } else if (event.effect.type === 'grantResource') {
                if (event.effect.resource === 'knowledge') {
                    this.resources.knowledge += event.effect.value;
                }
            } else if (event.effect.type === 'unlockEvolutionPath') {
                if (event.effect.path === 'balance') {
                    // Implement balance path unlock effect
                }
            }
        }
        
        // Update event history
        this.worldEvolution.eventHistory.push(event.name);
        
        // Update progress
        if (event.effect.type === 'resource_gain') {
            if (event.effect.resource === 'knowledge') {
                this.progress.xp += event.effect.amount;
            } else if (event.effect.resource === 'essence') {
                this.progress.xp += event.effect.amount;
            } else if (event.effect.resource === 'stability') {
                this.progress.stability += event.effect.amount;
            }
        }
        
        // Update world evolution
        if (event.effect.type === 'increaseChaos') {
            this.worldEvolution.globalChaos += event.effect.value;
        } else if (event.effect.type === 'increaseOrder') {
            this.worldEvolution.globalOrder += event.effect.value;
        }
        
        // Update metrics
        this.metrics.incrementTurns();
        if (event.effect.type === 'resource_gain') {
            if (event.effect.resource === 'knowledge') {
                this.metrics.incrementSenses();
            } else if (event.effect.resource === 'essence') {
                this.metrics.incrementPokes();
            } else if (event.effect.resource === 'stability') {
                this.metrics.incrementSenses();
            }
        }
        
        console.log(`Event triggered: ${event.name}`);
    },
    
    /**
     * Creates a 2D array of tile data for the grid
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     * @returns {Array} 2D array of tile data
     */
    createTileData(rows, cols) {
        debug(`Creating tile data: ${rows}x${cols}`);
        
        // Validate input
        if (!rows || !cols || rows <= 0 || cols <= 0) {
            debug(`Invalid grid dimensions: ${rows}x${cols}`);
            // Default to 5x5 if invalid dimensions
            rows = 5;
            cols = 5;
        }
        
        // Default global chaos value
        const globalChaos = GameState.worldEvolution ? GameState.worldEvolution.globalChaos : 0.8;
        
        // Default variance value (20% variance)
        const variance = 0.2;
        
        debug(`Global chaos: ${globalChaos}, Variance: ${variance}`);
        
        // Create a 2D array to store tile data
        const tileData = [];
        
        for (let r = 0; r < rows; r++) {
            tileData[r] = [];
            for (let c = 0; c < cols; c++) {
                // Randomize chaos value with some variance around global chaos
                const randomVariance = (Math.random() * 2 - 1) * variance;
                const chaos = Math.max(0, Math.min(1, globalChaos + randomVariance));
                
                // Determine tile type based on chaos level
                const type = GameState.determineTileType(chaos);
                
                // Store tile data
                tileData[r][c] = {
                    type: type,
                    chaos: chaos,
                    order: 1 - chaos,
                    explored: false,
                    sensed: false,
                    stability: 0
                };
                
                // For debugging, log a sample of tile data
                if (r === 0 && c === 0) {
                    debug(`Sample tile data at [0,0]:`, tileData[0][0]);
                }
            }
        }
        
        debug(`Tile data created with ${rows * cols} tiles`);
        return tileData;
    },
    
    /**
     * Resets all progress to default values
     */
    resetAllProgress() {
        console.log("Resetting all progress...");
        debug("Resetting all progress");
        
        // Default progress state
        this.progress = {
            stats: {
                movementRange: 1,
                luck: 1
            },
            traits: [],
        this.grid = {
            rows: 5,
            cols: 5,
            hexVisualWidth: 86.6,
            hexHeight: 100,
            rowOffset: 75, // hexHeight * 0.75
            colOffset: 86.6
        };
        this.progress = {
            stats: { movementRange: 1, luck: 1 },
            traits: [],
            persistentInventory: [],
            xp: 0,
            sensedTypes: [],
            sensesMade: 0,
            pokesMade: 0,
            hasFoundZoe: false,
            zoeLevelsCompleted: 0,
            essence: 0,
            systemChaos: 0.5,
            systemOrder: 0.5,
            orderContributions: 0
        };
        this.worldEvolution = {
            globalChaos: 0.8,
            globalOrder: 0.2,
            age: 0,
            eventHistory: []
        };
        this.resourceLimits = {
            energy: 20,
            essence: 50,
            knowledge: 50,
            stability: 50
        };
        this.resourceRates = {
            energyPerTurn: 2,
            essencePerChaos: 1,
            knowledgePerSense: 1,
            stabilityPerStabilize: 1,
            stabilityDecayPerTurn: 0.5
        };
        this.resources = {
            energy: 10,
            essence: 0,
            knowledge: 0,
            stability: 0
        };
        this.level = {
            temporaryInventory: [],
            hasKey: false,
            foundZoe: false,
            requiresKey: true
        };
        this.metrics = {
            turnsTaken: 0,
            sensesMade: 0,
            pokesMade: 0,
            energyUsedForMovement: 0,
            energyUsedForExploration: 0,
            movesMade: 0,
            restsTaken: 0,
            tilesExplored: 0,
            specialTilesInteracted: 0,
            
            incrementTurns() { this.turnsTaken++; },
            incrementSenses() { this.sensesMade++; },
            incrementPokes() { this.pokesMade++; },
            addEnergyForMovement(cost) { this.energyUsedForMovement += cost; },
            addEnergyForExploration(cost) { this.energyUsedForExploration += cost; },
            incrementMoves() { this.movesMade++; },
            incrementRests() { this.restsTaken++; },
            incrementTilesExplored() { this.tilesExplored++; },
            incrementSpecialTiles() { this.specialTilesInteracted++; },
            
            reset() {
                this.turnsTaken = 0;
                this.sensesMade = 0;
                this.pokesMade = 0;
                this.energyUsedForMovement = 0;
                this.energyUsedForExploration = 0;
                this.movesMade = 0;
                this.restsTaken = 0;
                this.tilesExplored = 0;
                this.specialTilesInteracted = 0;
            },
            
            getEnergyUsageRatio() {
                const total = this.energyUsedForMovement + this.energyUsedForExploration;
                return total === 0 ? 0 : this.energyUsedForMovement / total;
            },
            
            getMovementEfficiency(safestPathLength) {
                return safestPathLength === 0 ? 0 : safestPathLength / this.movesMade;
            }
        };
        this.recentMetrics = {
            previousChaos: this.worldEvolution.globalChaos,
            previousOrder: this.worldEvolution.globalOrder
        };
        this.events = {
            available: [],
            triggered: [],
            chains: {}
        };
        this.level.tileData = this.createTileData(this.grid.rows, this.grid.cols);
        this.progress.totalResources = {
            energyGained: 0,
            essenceGained: 0,
            knowledgeGained: 0
        };
        this.progress.levelsWithPositiveOrder = 0;
        this.progress.uniqueSensedTypes = [];
        this.worldEvolution.age = 0;
        this.worldEvolution.stabilityThreshold = 0.4;
        this.worldEvolution.complexityThreshold = 0.6;
        this.worldEvolution.tileVariance = 0.2;
        this.metrics.reset();
        this.recentMetrics.reset();
        console.log("All progress reset");
    },
    
    /**
     * Places tiles on the grid based on tile data
     * @param {Array} tileData - 2D array of tile data
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     */
    placeTiles(tileData, rows, cols) {
        debug(`Placing tiles on ${rows}x${cols} grid`);
        
        // Validate input
        if (!tileData || !rows || !cols) {
            debug("Invalid parameters for placeTiles");
            return;
        }
        
        try {
            // Place goal tile in the bottom right
            const goalRow = rows - 1;
            const goalCol = cols - 1;
            tileData[goalRow][goalCol].type = 'goal';
            debug(`Goal tile set at [${goalRow}, ${goalCol}]`);
            
            // Set player start position in the top left
            const playerStartRow = 0;
            const playerStartCol = 0;
            window.currentRow = playerStartRow;
            window.currentCol = playerStartCol;
            GameState.player.currentRow = playerStartRow;
            GameState.player.currentCol = playerStartCol;
            
            // Generate non-path positions
            const nonPathPositions = getNonPathPositions(rows, cols);
            debug(`Got ${nonPathPositions.length} non-path positions`);
            
            // Shuffle positions for random placement
            nonPathPositions.sort(() => Math.random() - 0.5);
            
            // Place Zoe (if available)
            let zoeRow, zoeCol;
            if (nonPathPositions.length > 0 && !GameState.progress.hasFoundZoe) {
                const zoePos = nonPathPositions.pop();
                zoeRow = zoePos[0];
                zoeCol = zoePos[1];
                tileData[zoeRow][zoeCol].type = 'zoe';
                debug(`Zoe placed at [${zoeRow}, ${zoeCol}]`);
            }
            
            // Place key
            if (nonPathPositions.length > 0 && GameState.level.requiresKey) {
                const keyPos = nonPathPositions.pop();
                const keyRow = keyPos[0];
                const keyCol = keyPos[1];
                tileData[keyRow][keyCol].type = 'key';
                debug(`Key placed at [${keyRow}, ${keyCol}]`);
            }
            
            // Calculate counts for special tiles
            const blockedTileCount = Math.floor(nonPathPositions.length * 0.3); // 30% of remaining tiles
            const waterTileCount = Math.floor(nonPathPositions.length * 0.1);   // 10% of remaining tiles
            const energyTileCount = Math.floor(nonPathPositions.length * 0.05); // 5% of remaining tiles
            
            // Place blocked tiles
            let blockedCount = 0;
            for (let i = 0; i < blockedTileCount && nonPathPositions.length > 0; i++) {
                const pos = nonPathPositions.pop();
                const r = pos[0];
                const c = pos[1];
                tileData[r][c].type = 'blocked';
                tileData[r][c].chaos = Math.min(1, tileData[r][c].chaos + 0.2); // Increase chaos for blocked tiles
                blockedCount++;
            }
            
            // Place water tiles
            let waterCount = 0;
            for (let i = 0; i < waterTileCount && nonPathPositions.length > 0; i++) {
                const pos = nonPathPositions.pop();
                const r = pos[0];
                const c = pos[1];
                tileData[r][c].type = 'water';
                tileData[r][c].chaos = Math.max(0, tileData[r][c].chaos - 0.2); // Decrease chaos for water tiles
                waterCount++;
            }
            
            // Place energy tiles
            let energyCount = 0;
            for (let i = 0; i < energyTileCount && nonPathPositions.length > 0; i++) {
                const pos = nonPathPositions.pop();
                const r = pos[0];
                const c = pos[1];
                tileData[r][c].type = 'energy';
                energyCount++;
            }
            
            debug(`Placed ${blockedCount} blocked tiles, ${waterCount} water tiles, ${energyCount} energy tiles`);
            
            // Ensure traversable path
            ensureTraversablePath(tileData, rows, cols);
            debug("Ensured traversable path");
            
            // Log a sample of tile data after placement
            debug(`Sample tile at [0,0] after placement:`, tileData[0][0]);
            debug(`Sample tile at [${goalRow},${goalCol}] (goal):`, tileData[goalRow][goalCol]);
            
        } catch (error) {
            debug("Error in placeTiles:", error.message);
        }
    },
    
    /**
     * Gets non-path positions for placing special tiles
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     * @returns {Array} Array of non-path positions
     */
    getNonPathPositions(rows, cols) {
        console.log(`Getting non-path positions for ${rows}x${cols} grid`);
        
        // Create an array to store positions
        const positions = [];
        
        // Get the start and goal positions
        const startRow = 0;
        const startCol = 0;
        const goalRow = rows - 1;
        const goalCol = cols - 1;
        
        // Add all positions except start and goal
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Skip start and goal positions
                if ((r === startRow && c === startCol) || (r === goalRow && c === goalCol)) {
                    continue;
                }
                
                // Add position to array
                positions.push([r, c]);
            }
        }
        
        console.log(`Found ${positions.length} non-path positions`);
        return positions;
    },
    
    /**
     * Ensures the path is traversable
     * @param {Array} tileData - 2D array of tile data
     * @param {number} rows - Number of rows
     * @param {number} cols - Number of columns
     */
    ensureTraversablePath(tileData, rows, cols) {
        // Implementation of ensureTraversablePath method
    },
    
    /**
     * Updates a resource value
     * @param {string} type - Resource type
     * @param {number} amount - Amount to change (positive or negative)
     * @returns {number} New resource value
     */
    updateResource(type, amount) {
        if (!this.resources || !this.resourceLimits) {
            console.warn(`Resources or resource limits not initialized`);
            return 0;
        }
        
        if (!this.resources[type]) {
            console.warn(`Resource type ${type} not found`);
            return 0;
        }
        
        // Update resource value
        this.resources[type] += amount;
        
        // Ensure value is within limits
        this.resources[type] = Math.max(0, Math.min(this.resources[type], this.resourceLimits[type]));
        
        // Update window variable for compatibility
        if (type === 'energy') {
            window.energy = this.resources.energy;
        }
        
        console.log(`Updated ${type}: ${this.resources[type]} (${amount > 0 ? '+' : ''}${amount})`);
        return this.resources[type];
    },
    
    /**
     * Resets the player state for a new game
     */
    resetPlayerState() {
        console.log("Resetting player state");
        
        // Reset player position
        this.player.currentRow = 0;
        this.player.currentCol = 0;
        this.player.turnCount = 0;
        this.player.currentLevelSenses = [];
        this.player.moveCounter = 0;
        this.player.hasUsedSenserBonus = false;
        this.player.currentAction = null;
        this.player.movementPoints = this.progress.stats.movementRange || 1;
        
        // Reset resources
        this.resources.energy = 10;
        this.resources.essence = 0;
        this.resources.knowledge = 0;
        this.resources.stability = 0;
        
        // Reset level state
        this.level.temporaryInventory = [];
        this.level.hasKey = false;
        this.level.foundZoe = false;
        
        console.log("Player state reset");
    },
    
    /**
     * Applies effects from active traits
     */
    applyTraitEffects() {
        console.log("Applying trait effects");
        
        if (!this.evolution || !this.evolution.paths) {
            console.warn("Evolution system not properly initialized");
            return;
        }
        
        // Clear active traits
        this.evolution.activeTraits = [];
        
        // Collect all unlocked traits
        Object.values(this.evolution.paths).forEach(path => {
            if (path.traits) {
                path.traits.forEach(trait => {
                    if (trait.unlocked) {
                        this.evolution.activeTraits.push(trait);
                    }
                });
            }
        });
        
        console.log(`Found ${this.evolution.activeTraits.length} active traits`);
        
        // Apply effects for each trait
        this.evolution.activeTraits.forEach(trait => {
            console.log(`Applying effect for trait: ${trait.name}`);
            
            switch (trait.effect) {
                case 'movement_cost_-1':
                    // Reduce movement cost
                    console.log("Applying movement cost reduction");
                    break;
                    
                case 'vision_range_+1':
                    // Increase vision range
                    console.log("Applying vision range increase");
                    break;
                    
                case 'all_resources_regen_1':
                    // Resources will regenerate each turn
                    console.log("Applying resource regeneration");
                    break;
                    
                case 'gain_essence_from_chaos':
                    // Will be handled during interactions
                    console.log("Applying chaos essence gain");
                    break;
                    
                case 'gain_stability_from_order':
                    // Will be handled during interactions
                    console.log("Applying order stability gain");
                    break;
                    
                case 'gain_knowledge_from_balance':
                    // Will be handled during interactions
                    console.log("Applying balance knowledge gain");
                    break;
                    
                case 'chaos_resistance':
                    // Will be handled during chaos effects
                    console.log("Applying chaos resistance");
                    break;
                    
                case 'poke_success_+20%':
                    // Will be handled during poke action
                    console.log("Applying poke success increase");
                    break;
                    
                case 'see_chaos_levels':
                    // Will be handled during rendering
                    console.log("Applying chaos vision");
                    break;
                    
                default:
                    console.log(`Unknown trait effect: ${trait.effect}`);
            }
        });
        
        console.log("Trait effects applied");
    },
    
    /**
     * Gets available traits for a given evolution path
     * @param {string} path - Evolution path ID
     * @returns {Array} Array of available trait IDs
     */
    getAvailableTraits(path) {
        console.log(`Getting available traits for path: ${path}`);
        
        if (!this.evolution || !this.evolution.paths || !this.evolution.paths[path]) {
            console.warn("Evolution system not properly initialized");
            return [];
        }
        
        const pathData = this.evolution.paths[path];
        const availableTraits = [];
        
        // Check if path is unlocked
        if (!pathData.unlocked) {
            console.log(`Path ${path} is locked`);
            return [];
        }
        
        // Get traits that are not unlocked yet
        pathData.traits.forEach(trait => {
            if (!trait.unlocked) {
                // Check if player has enough XP
                if (pathData.xp >= trait.cost) {
                    availableTraits.push(trait.id);
                }
            }
        });
        
        console.log(`Found ${availableTraits.length} available traits for path ${path}`);
        return availableTraits;
    },
    
    /**
     * Updates grid dimensions
     * @param {number} rows - New row count
     * @param {number} cols - New column count
     * @returns {boolean} Whether the update was successful
     */
    updateGridSize(rows, cols) {
        console.log(`Updating grid size to ${rows}x${cols}`);
        
        if (rows >= 3 && cols >= 3 && rows <= 20 && cols <= 20) {
            this.grid.rows = rows;
            this.grid.cols = cols;
            console.log(`Grid size updated to ${rows}x${cols}`);
            return true;
        }
        
        console.warn(`Invalid grid dimensions: ${rows}x${cols}`);
        return false;
    }
};

/**
 * Adds basic CSS styles for the game
 */
function addGameStyles() {
    // Check if styles already exist
    if (document.getElementById('game-styles')) {
        return;
    }
    
    // Create style element
    const styleElement = document.createElement('style');
    styleElement.id = 'game-styles';
    
    // Add CSS rules
    styleElement.textContent = `
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            overflow: hidden;
        }
        
        .game-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            overflow: auto;
            background-color: #222;
        }
        
        .grid-container {
            position: relative;
            margin: 100px auto 150px auto; /* Added more margin at top and bottom */
            background-color: #333;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            overflow: visible;
            z-index: 5;
        }
        
        .hex-container {
            position: absolute;
            width: 100px;
            height: 100px;
            transition: transform 0.2s;
            z-index: 2;
        }
        
        .hex-container:hover {
            transform: scale(1.05);
            z-index: 3;
        }
        
        .hex {
            position: relative;
            width: 86.6px;
            height: 100px;
            background-color: #666;
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            transition: background-color 0.3s;
        }
        
        .hex-inner {
            position: absolute;
            top: 5px;
            left: 5px;
            right: 5px;
            bottom: 5px;
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .coords {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        /* Tile types */
        .normal { background-color: #777; }
        .blocked { background-color: #555; }
        .water { background-color: #4488ff; }
        .energy { background-color: #ffcc44; }
        .goal { background-color: #44ff44; }
        .key { background-color: #ff88ff; }
        .zoe { background-color: #ff4488; }
        
        /* Chaos/Order styles */
        .high-chaos { background-color: #ff4444; }
        .chaos { background-color: #ff8844; }
        .high-order { background-color: #44ff88; }
        .order { background-color: #88ff88; }
        
        /* Unexplored tiles */
        .unexplored .hex {
            filter: brightness(0.5) grayscale(0.7);
        }
        
        /* Highlighting */
        .highlighted .hex {
            box-shadow: 0 0 10px #ffff00, 0 0 20px #ffff00;
            cursor: pointer;
            z-index: 10;
        }
        
        /* Player */
        .player {
            position: absolute;
            width: 30px;
            height: 30px;
            background-color: #ff0000;
            border-radius: 50%;
            z-index: 10;
            transform: translate(-50%, -50%);
            transition: left 0.3s, top 0.3s;
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.7);
        }
        
        /* Zoe */
        .zoe-character {
            position: absolute;
            width: 25px;
            height: 25px;
            background-color: #ff00ff;
            border-radius: 50%;
            z-index: 5;
            transform: translate(-50%, -50%);
            box-shadow: 0 0 10px rgba(255, 0, 255, 0.7);
        }
        
        /* Stability indicator */
        .stability-indicator {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 255, 255, 0.3);
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            z-index: 2;
            pointer-events: none;
        }
        
        /* UI elements */
        .action-console {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            display: flex;
            justify-content: center;
            gap: 10px;
            z-index: 20;
        }
        
        .console-btn {
            padding: 8px 15px;
            border: none;
            border-radius: 5px;
            background-color: #444;
            color: white;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .console-btn:hover {
            background-color: #666;
        }
        
        /* Resource bars */
        .resource-bars {
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 20;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            color: white;
            max-width: 300px;
        }
        
        .resource-bar {
            margin-bottom: 5px;
        }
        
        .resource-label {
            display: inline-block;
            width: 80px;
        }
        
        .resource-progress {
            display: inline-block;
            width: 150px;
            height: 10px;
            background-color: #333;
            border-radius: 5px;
            overflow: hidden;
        }
        
        .resource-value {
            height: 100%;
            transition: width 0.3s;
        }
        
        .energy-value { background-color: #ffcc44; }
        .essence-value { background-color: #ff44ff; }
        .knowledge-value { background-color: #44aaff; }
        .stability-value { background-color: #44ffaa; }
        
        /* Admin tools */
        .admin-tools {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 20;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 10px;
            border-radius: 5px;
            color: white;
        }
        
        /* Windows */
        .window {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(30, 30, 30, 0.9);
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
            z-index: 30;
            color: white;
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
            display: none;
        }
        
        #evolution-window, #events-window, #stats-window {
            width: 500px;
        }
        
        #event-notification {
            width: 400px;
        }
        
        .window-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            border-bottom: 1px solid #444;
        }
        
        .window-content {
            padding: 15px;
        }
        
        .close-btn {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
        }
        
        /* Events UI */
        .events-tabs {
            display: flex;
            margin-bottom: 10px;
            border-bottom: 1px solid #444;
        }
        
        .events-tab-btn {
            background-color: transparent;
            border: none;
            color: white;
            padding: 10px 15px;
            cursor: pointer;
            opacity: 0.7;
        }
        
        .events-tab-btn.active {
            opacity: 1;
            border-bottom: 2px solid white;
        }
        
        .events-tab-content {
            display: none;
        }
        
        .events-tab-content.active {
            display: block;
        }
        
        .events-list {
            margin-top: 10px;
        }
        
        /* Particles */
        .particle-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        }
        
        .particle {
            position: absolute;
            width: 5px;
            height: 5px;
            background-color: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            top: 0;
            animation: particleFall linear infinite;
        }
        
        @keyframes particleFall {
            0% { top: -10px; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100vh; opacity: 0; }
        }
        
        /* Notification */
        .notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
            pointer-events: none;
        }
        
        .notification.show {
            opacity: 1;
        }
        
        /* Effects */
        .sense-effect {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%);
            animation: pulseEffect 1s ease-out;
            z-index: 5;
            pointer-events: none;
        }
        
        .poke-effect {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(255,100,100,0.7) 0%, rgba(255,100,100,0) 70%);
            animation: pulseEffect 1s ease-out;
            z-index: 5;
            pointer-events: none;
        }
        
        .stabilize-effect {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle, rgba(100,255,255,0.7) 0%, rgba(100,255,255,0) 70%);
            animation: pulseEffect 1s ease-out;
            z-index: 5;
            pointer-events: none;
        }
        
        @keyframes pulseEffect {
            0% { opacity: 0; transform: scale(0.5); }
            50% { opacity: 1; }
            100% { opacity: 0; transform: scale(1.5); }
        }
        
        /* Evolution UI */
        .evolution-paths {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .evolution-path {
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
            padding: 10px;
            border: 1px solid #444;
        }
        
        .evolution-path.locked {
            opacity: 0.6;
        }
        
        .path-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .path-description {
            margin-bottom: 10px;
            font-size: 14px;
            color: #ccc;
        }
        
        .traits-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        .evolution-trait {
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            padding: 8px;
        }
        
        .evolution-trait.unlocked {
            background-color: rgba(100, 255, 100, 0.2);
        }
        
        .evolution-trait.locked {
            opacity: 0.5;
        }
        
        .evolution-trait h4 {
            margin: 0 0 5px 0;
        }
        
        .evolution-trait-description {
            font-size: 12px;
            margin-bottom: 5px;
        }
        
        .evolution-trait-cost {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
        }
        
        .evolution-trait-unlock-btn {
            background-color: #5588ff;
            border: none;
            border-radius: 3px;
            padding: 3px 8px;
            color: white;
            cursor: pointer;
        }
        
        .evolution-trait-unlock-btn:hover {
            background-color: #6699ff;
        }
        
        .evolution-trait-locked-msg {
            color: #ff5555;
        }
    `;
    
    // Add to document head
    document.head.appendChild(styleElement);
    console.log("Added game styles");
}

/**
 * Creates basic UI elements for the game
 */
function createGameUI() {
    console.log("Setting up game UI");
    debug("Setting up game UI");

    // Check if the game container already exists
    if (document.getElementById('game-container')) {
        console.warn("Game container already exists, skipping UI creation.");
        return;
    }

    // Create game container
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.className = 'game-container';
    document.body.appendChild(gameContainer);

    // Create resource bars
    const resourceBars = document.createElement('div');
    resourceBars.className = 'resource-bars';
    gameContainer.appendChild(resourceBars);

    // Create action console
    const actionConsole = document.createElement('div');
    actionConsole.className = 'action-console';
    gameContainer.appendChild(actionConsole);

    // Create notification element
    const notificationElement = document.createElement('div');
    notificationElement.id = 'notification';
    notificationElement.className = 'notification';
    gameContainer.appendChild(notificationElement);

    console.log("Game UI setup complete");
    debug("Game UI setup complete");
}

/**
 * Builds the hexagonal grid for the game
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {Array} tileData - 2D array containing tile data
 */
function buildGrid(rows, cols, tileData) {
    debug(`Building grid: ${rows}x${cols}`);
    
    // Validate input
    if (!rows || !cols || rows <= 0 || cols <= 0) {
        debug("Invalid grid dimensions", { rows, cols });
        return null;
    }
    
    if (!tileData) {
        debug("No tile data provided");
        return null;
    }
    
    // Access grid configuration
    const hexVisualWidth = window.hexVisualWidth || GameState.grid.hexVisualWidth;
    const hexHeight = window.hexHeight || GameState.grid.hexHeight;
    const rowOffset = window.rowOffset || GameState.grid.rowOffset;
    const colOffset = window.colOffset || GameState.grid.colOffset;
    
    debug(`Grid config:`, { hexVisualWidth, hexHeight, rowOffset, colOffset });
    
    // Get the game container
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        debug("Game container not found");
        return null;
    }
    
    // Get or create the grid element
    let grid = document.getElementById('grid');
    if (!grid) {
        debug("Grid element not found, creating one");
        grid = document.createElement('div');
        grid.id = 'grid';
        grid.className = 'grid-container';
        gameContainer.appendChild(grid);
    } else {
        debug("Found existing grid element");
    }
    
    // Clear existing grid
    grid.innerHTML = '';
    
    // Calculate total width and height of the grid
    const totalWidth = cols * colOffset;
    const totalHeight = (rows * rowOffset) + (hexHeight * 0.25);
    
    debug(`Grid dimensions:`, { totalWidth, totalHeight });
    
    // Set grid dimensions
    grid.style.width = `${totalWidth}px`;
    grid.style.height = `${totalHeight}px`;
    
    // Ensure the grid is visible
    grid.style.display = 'block';
    grid.style.position = 'relative';
    grid.style.margin = '100px auto';
    grid.style.backgroundColor = '#333';
    grid.style.border = '2px solid red'; // Add a border for visibility
    
    // Create hexagons for each tile
    let tileCount = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            try {
                const hexContainer = document.createElement('div');
                hexContainer.className = 'hex-container unexplored';
                hexContainer.setAttribute('data-row', r);
                hexContainer.setAttribute('data-col', c);
                hexContainer.id = `hex-${r}-${c}`;
                
                // Position the hex container
                const xPos = c * colOffset;
                const yPos = r * rowOffset;
                hexContainer.style.left = `${xPos}px`;
                hexContainer.style.top = `${yPos}px`;
                
                // Create the hex shape
                const hex = document.createElement('div');
                hex.className = 'hex';
                
                // Check if tileData exists for this position
                if (!tileData[r] || !tileData[r][c]) {
                    debug(`No tile data for position [${r}, ${c}]`);
                    continue;
                }
                
                // Set the background color based on the chaos/order value
                const chaos = tileData[r][c].chaos;
                const tileType = tileData[r][c].type;
                
                // Add class for tile type
                hex.classList.add(tileType);
                
                // Add color based on chaos level
                if (chaos < 0.2) {
                    hex.classList.add('high-order');
                } else if (chaos < 0.4) {
                    hex.classList.add('order');
                } else if (chaos > 0.8) {
                    hex.classList.add('high-chaos');
                } else if (chaos > 0.6) {
                    hex.classList.add('chaos');
                }
                
                // Create inner hexagon
                const hexInner = document.createElement('div');
                hexInner.className = 'hex-inner';
                
                // Add coordinates for debugging
                const coords = document.createElement('div');
                coords.className = 'coords';
                coords.textContent = `${r},${c}`;
                
                // Put it all together
                hexInner.appendChild(coords);
                hex.appendChild(hexInner);
                hexContainer.appendChild(hex);
                grid.appendChild(hexContainer);
                tileCount++;
                
                // Add stability indicator if tile has stability
                if (tileData[r][c].stability && tileData[r][c].stability > 0) {
                    const stabilityIndicator = document.createElement('div');
                    stabilityIndicator.className = 'stability-indicator';
                    stabilityIndicator.style.opacity = tileData[r][c].stability;
                    hexContainer.appendChild(stabilityIndicator);
                }
            } catch (error) {
                debug(`Error creating tile at [${r}, ${c}]`, error.message);
            }
        }
    }
    
    // Create player element if it doesn't exist
    let playerElement = document.getElementById('player');
    if (!playerElement) {
        playerElement = document.createElement('div');
        playerElement.id = 'player';
        playerElement.className = 'player';
        gameContainer.appendChild(playerElement);
    }
    
    // Create Zoe element if it doesn't exist
    let zoeElement = document.getElementById('zoe-character');
    if (!zoeElement) {
        zoeElement = document.createElement('div');
        zoeElement.id = 'zoe-character';
        zoeElement.className = 'zoe-character';
        gameContainer.appendChild(zoeElement);
    }
    
    debug(`Grid built with ${tileCount} tiles`);
    
    // Position the grid in the center of the game container
    const gameContainerWidth = gameContainer.offsetWidth;
    const gameContainerHeight = gameContainer.offsetHeight;
    const gridLeft = (gameContainerWidth - totalWidth) / 2;
    const gridTop = 100; // Fixed top margin
    
    grid.style.left = `${gridLeft}px`;
    grid.style.top = `${gridTop}px`;
    
    debug(`Grid positioned at (${gridLeft}, ${gridTop})`);
    
    return grid;
}

/**
 * Initializes or restarts the game with current settings
 */
function startGame() {
    console.log("Starting game...");
    
    try {
        // Reset game metrics
        GameState.metrics.reset();
        GameState.resetPlayerState();
        
        // Update local variables for compatibility
        window.turnCount = GameState.player.turnCount;
        window.currentRow = GameState.player.currentRow;
        window.currentCol = GameState.player.currentCol;
        window.currentLevelSenses = GameState.player.currentLevelSenses;
        window.moveCounter = GameState.player.moveCounter;
        window.hasUsedsenserBonus = GameState.player.hasUsedSenserBonus;
        window.currentAction = GameState.player.currentAction;
        window.energy = GameState.resources.energy;
        window.movementPoints = GameState.player.movementPoints;
        window.temporaryInventory = GameState.level.temporaryInventory;
        
        // Update grid dimensions
        window.rows = GameState.grid.rows;
        window.cols = GameState.grid.cols;
        window.hexVisualWidth = GameState.grid.hexVisualWidth;
        window.hexHeight = GameState.grid.hexHeight;
        window.rowOffset = GameState.grid.rowOffset;
        window.colOffset = GameState.grid.colOffset;
        
        console.log(`Grid size: ${window.rows}x${window.cols}`);
        console.log(`Grid config: hexVisualWidth=${window.hexVisualWidth}, hexHeight=${window.hexHeight}, rowOffset=${window.rowOffset}, colOffset=${window.colOffset}`);
        
        // Create the tile data using the standalone function
        window.tileData = createTileData(window.rows, window.cols);
        GameState.tileData = window.tileData;
        console.log("Tile data created");
        
        // Place tiles on the grid using the standalone function
        placeTiles(window.tileData, window.rows, window.cols);
        console.log("Tiles placed");
        
        // Build the grid
        const grid = buildGrid(window.rows, window.cols, window.tileData);
        console.log("Grid built");
        
        // Position player character
        positionPlayerCharacter();
        
        // Position Zoe character if present
        positionZoeCharacter();
        
        // Update evolution UI
        try {
            updateEvolutionUI();
            console.log("Evolution UI updated");
        } catch (error) {
            console.error("Error updating evolution UI:", error);
        }
        
        // Update events UI
        try {
            updateEventsUI();
            console.log("Events UI updated");
        } catch (error) {
            console.error("Error updating events UI:", error);
        }
        
        // Apply trait effects
        try {
            if (typeof GameState.applyTraitEffects === 'function') {
                GameState.applyTraitEffects();
            }
        } catch (error) {
            console.error("Error applying trait effects:", error);
        }
        
        // Create notification element if it doesn't exist
        if (!document.getElementById('notification')) {
            const notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
        }
        
        // Update vision for the starting position
        updateVision();
        
        // Update UI
        updateUI();
        
        // Set game to active
        GameState.isActive = true;
        window.isGameActive = true;
        
        // Hide all windows
        const windows = document.querySelectorAll('.window');
        windows.forEach(window => {
            window.style.display = 'none';
        });
        
        console.log("Game started successfully");
    } catch (error) {
        console.error("Error starting game:", error);
        showNotification("Error starting game. Check console for details.");
    }
}

/**
 * Positions the player character on the grid
 */
function positionPlayerCharacter() {
    console.log(`Positioning player at [${window.currentRow}, ${window.currentCol}]`);
    
    const playerElement = document.getElementById('player');
    if (!playerElement) {
        console.error("Player element not found");
        return;
    }
    
    // Make player visible
    playerElement.style.display = 'block';
    
    // Position at current row/col
    const hexElement = document.getElementById(`hex-${window.currentRow}-${window.currentCol}`);
    if (!hexElement) {
        console.warn(`Hex element for player position not found: hex-${window.currentRow}-${window.currentCol}`);
        return;
    }
    
    const gridElement = document.getElementById('grid');
    if (!gridElement) {
        console.error("Grid element not found");
        return;
    }
    
    // Get positions
    const hexRect = hexElement.getBoundingClientRect();
    const gridRect = gridElement.getBoundingClientRect();
    
    // Calculate position relative to grid
    const left = hexRect.left - gridRect.left + hexRect.width / 2;
    const top = hexRect.top - gridRect.top + hexRect.height / 2;
    
    // Set position
    playerElement.style.left = `${left}px`;
    playerElement.style.top = `${top}px`;
    
    console.log(`Player positioned at (${left}, ${top})`);
}

/**
 * Positions Zoe character on the grid if present
 */
function positionZoeCharacter() {
    const zoeElement = document.getElementById('zoe-character');
    if (!zoeElement) {
        console.error("Zoe element not found");
        return;
    }
    
    // Only show Zoe if she's placed on the grid
    let zoeFound = false;
    
    for (let r = 0; r < window.rows; r++) {
        for (let c = 0; c < window.cols; c++) {
            if (window.tileData[r][c].type === 'zoe') {
                zoeFound = true;
                const zoeHex = document.getElementById(`hex-${r}-${c}`);
                if (zoeHex) {
                    const gridElement = document.getElementById('grid');
                    if (!gridElement) {
                        console.error("Grid element not found");
                        return;
                    }
                    
                    const hexRect = zoeHex.getBoundingClientRect();
                    const gridRect = gridElement.getBoundingClientRect();
                    
                    // Calculate position relative to grid
                    const left = hexRect.left - gridRect.left + hexRect.width / 2;
                    const top = hexRect.top - gridRect.top + hexRect.height / 2;
                    
                    // Set position
                    zoeElement.style.left = `${left}px`;
                    zoeElement.style.top = `${top}px`;
                    zoeElement.style.display = 'block';
                    
                    console.log(`Zoe positioned at (${left}, ${top})`);
                }
                break;
            }
        }
        if (zoeFound) break;
    }
    
    if (!zoeFound) {
        zoeElement.style.display = 'none';
        console.log("Zoe not found on grid, hiding character");
    }
}

/**
 * Ensures there is a traversable path from start to goal
 * @param {Array} tileData - 2D array of tile data
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 */
function ensureTraversablePath(tileData, rows, cols) {
    console.log("Ensuring traversable path...");
    
    // Define start and goal positions
    const startRow = 0;
    const startCol = 0;
    const goalRow = rows - 1;
    const goalCol = cols - 1;
    
    // Check if there's a path from start to goal
    const pathExists = verifyPath(tileData, startRow, startCol, goalRow, goalCol);
    
    // If no path exists, create one
    if (!pathExists) {
        console.log("No path found, creating direct path");
        createDirectPath(tileData, startRow, startCol, goalRow, goalCol);
    } else {
        console.log("Path already exists");
    }
}

/**
 * Verifies if a path exists from start to goal
 * @param {Array} tileData - 2D array of tile data
 * @param {number} startRow - Starting row
 * @param {number} startCol - Starting column
 * @param {number} goalRow - Goal row
 * @param {number} goalCol - Goal column
 * @returns {boolean} Whether a path exists
 */
function verifyPath(tileData, startRow, startCol, goalRow, goalCol) {
    // Create a visited array
    const visited = [];
    for (let r = 0; r < tileData.length; r++) {
        visited[r] = [];
        for (let c = 0; c < tileData[r].length; c++) {
            visited[r][c] = false;
        }
    }
    
    // Create a queue for BFS
    const queue = [[startRow, startCol]];
    visited[startRow][startCol] = true;
    
    // BFS to find path
    while (queue.length > 0) {
        const [r, c] = queue.shift();
        
        // Check if we've reached the goal
        if (r === goalRow && c === goalCol) {
            return true;
        }
        
        // Check adjacent tiles
        const adjacentTiles = getAdjacentTiles(r, c);
        
        for (const [adjR, adjC] of adjacentTiles) {
            // Check if tile is valid
            if (adjR >= 0 && adjR < tileData.length && 
                adjC >= 0 && adjC < tileData[0].length && 
                !visited[adjR][adjC] && 
                tileData[adjR][adjC].type !== 'blocked') {
                
                // Mark as visited and add to queue
                visited[adjR][adjC] = true;
                queue.push([adjR, adjC]);
            }
        }
    }
    
    // No path found
    return false;
}

/**
 * Creates a direct path from start to goal
 * @param {Array} tileData - 2D array of tile data
 * @param {number} startRow - Starting row
 * @param {number} startCol - Starting column
 * @param {number} goalRow - Goal row
 * @param {number} goalCol - Goal column
 */
function createDirectPath(tileData, startRow, startCol, goalRow, goalCol) {
    // Create a path using a simple algorithm
    let currentRow = startRow;
    let currentCol = startCol;
    
    while (currentRow !== goalRow || currentCol !== goalCol) {
        // Move horizontally or vertically toward the goal
        if (currentRow < goalRow) {
            currentRow++;
        } else if (currentRow > goalRow) {
            currentRow--;
        } else if (currentCol < goalCol) {
            currentCol++;
        } else if (currentCol > goalCol) {
            currentCol--;
        }
        
        // Clear any obstacles
        if (tileData[currentRow][currentCol].type === 'blocked' || 
            tileData[currentRow][currentCol].type === 'water') {
            tileData[currentRow][currentCol].type = 'normal';
            
            // Adjust chaos/order levels
            tileData[currentRow][currentCol].chaos = Math.min(tileData[currentRow][currentCol].chaos, 0.5);
            tileData[currentRow][currentCol].order = 1 - tileData[currentRow][currentCol].chaos;
        }
    }
}

/**
 * Debug function to help diagnose issues
 * @param {string} message - Debug message
 * @param {any} data - Optional data to log
 */
function debug(message, data) {
    console.log(`DEBUG: ${message}`);
    if (data !== undefined) {
        console.log(data);
    }
    
    // Also show in UI for visibility
    const debugElement = document.getElementById('debug-output');
    if (!debugElement) {
        const debugOutput = document.createElement('div');
        debugOutput.id = 'debug-output';
        debugOutput.style.position = 'fixed';
        debugOutput.style.top = '50%';
        debugOutput.style.left = '50%';
        debugOutput.style.transform = 'translate(-50%, -50%)';
        debugOutput.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        debugOutput.style.color = 'white';
        debugOutput.style.padding = '20px';
        debugOutput.style.borderRadius = '5px';
        debugOutput.style.zIndex = '1000';
        debugOutput.style.maxWidth = '80%';
        debugOutput.style.maxHeight = '80%';
        debugOutput.style.overflow = 'auto';
        document.body.appendChild(debugOutput);
    }
    
    const debugElement2 = document.getElementById('debug-output');
    if (debugElement2) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        if (data !== undefined) {
            messageElement.textContent += ': ' + JSON.stringify(data);
        }
        debugElement2.appendChild(messageElement);
        
        // Limit the number of messages
        if (debugElement2.children.length > 20) {
            debugElement2.removeChild(debugElement2.firstChild);
        }
    }
}

/**
 * Allows the player to rest, recovering energy at the cost of a turn
 */
function rest() {
    console.log("Resting...");
    debug("Player is resting");
    
    // Increment turn counter
    GameState.player.turnCount++;
    window.turnCount = GameState.player.turnCount;
    
    // Track in metrics
    GameState.metrics.incrementRests();
    GameState.metrics.incrementTurns();
    
    // Restore a significant amount of energy
    const energyRestoreOnRest = 6;
    GameState.updateResource('energy', energyRestoreOnRest);
    
    // Apply trait effects that happen when resting
    if (GameState.evolution && GameState.evolution.activeTraits) {
        GameState.evolution.activeTraits.forEach(trait => {
            if (trait.effect === 'enhanced_rest') {
                GameState.updateResource('energy', 2); // Additional energy
                GameState.updateResource('stability', 1); // Bonus stability
            }
        });
    }
    
    // Check for rest-based events
    try {
        const triggeredEvents = GameState.checkEvents('rest');
        if (triggeredEvents && triggeredEvents.length > 0) {
            showEventNotification(triggeredEvents[0]);
        }
    } catch (error) {
        debug("Error checking rest events", error.message);
    }
    
    // Evolve the world (small chance when resting)
    if (Math.random() < 0.3) {
        try {
            GameState.evolveWorld();
        } catch (error) {
            debug("Error evolving world", error.message);
        }
    }
    
    // Update UI
    updateUI();
    
    showNotification(`Rested and recovered ${energyRestoreOnRest} energy.`);
    debug(`Rested and recovered ${energyRestoreOnRest} energy.`);
}

/**
 * Ends the current turn and advances the game state
 */
function endTurn() {
    console.log("Ending turn...");
    debug("Ending turn");
    
    // Increment turn counter
    GameState.player.turnCount++;
    window.turnCount = GameState.player.turnCount;
    
    // Track in metrics
    GameState.metrics.incrementTurns();
    
    // Restore some energy each turn
    const energyRestorePerTurn = 2;
    GameState.updateResource('energy', energyRestorePerTurn);
    
    // Apply trait effects that happen each turn
    if (GameState.evolution && GameState.evolution.activeTraits) {
        GameState.evolution.activeTraits.forEach(trait => {
            if (trait.effect === 'all_resources_regen_1') {
                GameState.updateResource('essence', 1);
                GameState.updateResource('knowledge', 1);
                GameState.updateResource('stability', 1);
            }
        });
    }
    
    // Check for turn-based events
    try {
        const triggeredEvents = GameState.checkEvents('turn', { turnCount: GameState.player.turnCount });
        if (triggeredEvents && triggeredEvents.length > 0) {
            showEventNotification(triggeredEvents[0]);
        }
    } catch (error) {
        debug("Error checking turn events", error.message);
    }
    
    // Evolve the world (small chance each turn)
    if (Math.random() < 0.2) {
        try {
            GameState.evolveWorld();
        } catch (error) {
            debug("Error evolving world", error.message);
        }
    }
    
    // Update UI
    updateUI();
    
    debug(`Turn ${GameState.player.turnCount} started`);
}

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing game...");
    debug("DOM content loaded, initializing game...");
    
    try {
        // Add basic CSS styles
        addGameStyles();
        debug("Added game styles");
        
        // Create UI elements
        createGameUI();
        debug("Created game UI");
        
        // Initialize game state
        GameState.init();
        debug("Game state initialized");
        
        // Extract frequently used values from state for backward compatibility
        // This helps with the transition to the new state management system
        let rows = GameState.grid.rows;
        let cols = GameState.grid.cols;
        const hexVisualWidth = GameState.grid.hexVisualWidth;
        const hexHeight = GameState.grid.hexHeight;
        const rowOffset = GameState.grid.rowOffset;
        const colOffset = GameState.grid.colOffset;
        let turnCount = GameState.player.turnCount;
        let currentRow = GameState.player.currentRow;
        let currentCol = GameState.player.currentCol;
        let currentLevelSenses = GameState.player.currentLevelSenses;
        let moveCounter = GameState.player.moveCounter;
        let hasUsedsenserBonus = GameState.player.hasUsedSenserBonus;
        let currentAction = GameState.player.currentAction;
        let energy = GameState.resources.energy;
        let movementPoints = GameState.player.movementPoints;
        
        // Extract progress data
        let { stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, 
              hasFoundZoe, zoeLevelsCompleted, essence, systemChaos, systemOrder, 
              orderContributions, uniquesensedTypes } = GameState.progress;
        
        let temporaryInventory = GameState.level.temporaryInventory;
        let metrics = GameState.metrics;
        let recentMetrics = GameState.recentMetrics;
        
        // Make these variables global so they can be accessed by all functions
        window.rows = rows;
        window.cols = cols;
        window.hexVisualWidth = hexVisualWidth;
        window.hexHeight = hexHeight;
        window.rowOffset = rowOffset;
        window.colOffset = colOffset;
        window.turnCount = turnCount;
        window.currentRow = currentRow;
        window.currentCol = currentCol;
        window.currentLevelSenses = currentLevelSenses;
        window.moveCounter = moveCounter;
        window.hasUsedsenserBonus = hasUsedsenserBonus;
        window.currentAction = currentAction;
        window.energy = energy;
        window.movementPoints = movementPoints;
        window.stats = stats;
        window.traits = traits;
        window.persistentInventory = persistentInventory;
        window.xp = xp;
        window.sensedTypes = sensedTypes;
        window.sensesMade = sensesMade;
        window.pokesMade = pokesMade;
        window.hasFoundZoe = hasFoundZoe;
        window.zoeLevelsCompleted = zoeLevelsCompleted;
        window.essence = essence;
        window.systemChaos = systemChaos;
        window.systemOrder = systemOrder;
        window.orderContributions = orderContributions;
        window.uniquesensedTypes = uniquesensedTypes;
        window.temporaryInventory = temporaryInventory;
        window.metrics = metrics;
        window.recentMetrics = recentMetrics;
        window.tileData = null; // Will be set in startGame
        window.isGameActive = true;
        
        debug("Global variables set", { rows, cols });
        
        // Create particles
        createParticles(25);
        debug("Particles created");
        
        // Attach event listeners for the evolution system
        attachEvolutionListeners();
        debug("Evolution listeners attached");
        
        // Attach event listeners for the events system
        attachEventsListeners();
        debug("Events listeners attached");
        
        // Initialize the game
        startGame();
        debug("Game started");
    } catch (error) {
        console.error("Error initializing game:", error);
        debug("Error initializing game", error.message);
    }
});

/**
 * Updates the events UI with current event data
 */
function updateEventsUI() {
    debug("Updating events UI");
    
    // Check if events system is initialized
    if (!GameState.events) {
        debug("Events system not initialized");
        return;
    }
    
    // Get the events containers
    const triggeredEventsContainer = document.getElementById('triggered-events');
    const availableEventsContainer = document.getElementById('available-events');
    const chainsEventsContainer = document.getElementById('chains-events');
    
    if (!triggeredEventsContainer || !availableEventsContainer || !chainsEventsContainer) {
        debug("Events containers not found");
        return;
    }
    
    // Clear existing content
    triggeredEventsContainer.innerHTML = '';
    availableEventsContainer.innerHTML = '';
    chainsEventsContainer.innerHTML = '';
    
    // Add triggered events
    if (GameState.events.triggered && GameState.events.triggered.length > 0) {
        GameState.events.triggered.forEach(event => {
            const eventElement = createEventElement(event, true);
            triggeredEventsContainer.appendChild(eventElement);
        });
    } else {
        triggeredEventsContainer.innerHTML = '<div class="no-events">No events triggered yet.</div>';
    }
    
    // Add available events
    if (GameState.events.available && GameState.events.available.length > 0) {
        GameState.events.available.forEach(event => {
            const eventElement = createEventElement(event);
            availableEventsContainer.appendChild(eventElement);
        });
    } else {
        availableEventsContainer.innerHTML = '<div class="no-events">No available events.</div>';
    }
    
    // Add event chains
    if (GameState.events.chains && Object.keys(GameState.events.chains).length > 0) {
        Object.entries(GameState.events.chains).forEach(([chainId, chainData]) => {
            const chainElement = createEventChainElement(chainId, chainData);
            chainsEventsContainer.appendChild(chainElement);
        });
    } else {
        chainsEventsContainer.innerHTML = '<div class="no-events">No event chains available.</div>';
    }
    
    debug("Events UI updated");
}

/**
 * Creates an event element for the events UI
 * @param {Object} event - Event data
 * @param {boolean} completed - Whether the event has been completed
 * @returns {HTMLElement} Event element
 */
function createEventElement(event, completed = false) {
    if (!event) {
        return document.createElement('div');
    }
    
    const eventElement = document.createElement('div');
    eventElement.className = `event-item ${completed ? 'completed' : ''}`;
    
    const eventHeader = document.createElement('div');
    eventHeader.className = 'event-header';
    
    const eventName = document.createElement('h3');
    eventName.textContent = event.name || 'Unknown Event';
    
    const eventStatus = document.createElement('span');
    eventStatus.className = 'event-status';
    eventStatus.textContent = completed ? 'Completed' : 'Available';
    
    eventHeader.appendChild(eventName);
    eventHeader.appendChild(eventStatus);
    
    const eventDescription = document.createElement('p');
    eventDescription.className = 'event-description';
    eventDescription.textContent = event.description || 'No description available';
    
    const eventEffects = document.createElement('div');
    eventEffects.className = 'event-effects';
    eventEffects.innerHTML = createEventEffectsHTML(event.effect);
    
    eventElement.appendChild(eventHeader);
    eventElement.appendChild(eventDescription);
    eventElement.appendChild(eventEffects);
    
    return eventElement;
}

/**
 * Creates HTML for event effects
 * @param {Object} effect - Event effect data
 * @returns {string} HTML for event effects
 */
function createEventEffectsHTML(effect) {
    if (!effect) {
        return '<div class="event-effect">No effects</div>';
    }
    
    let html = '<div class="event-effects-title">Effects:</div>';
    
    if (effect.type === 'resource_gain') {
        html += `<div class="event-effect">Gain ${effect.amount} ${getResourceIcon(effect.resource)} ${effect.resource}</div>`;
    } else if (effect.type === 'resource_loss') {
        html += `<div class="event-effect">Lose ${effect.amount} ${getResourceIcon(effect.resource)} ${effect.resource}</div>`;
    } else if (effect.type === 'increaseChaos') {
        html += `<div class="event-effect">Increase chaos by ${effect.value * 100}%</div>`;
    } else if (effect.type === 'increaseOrder') {
        html += `<div class="event-effect">Increase order by ${effect.value * 100}%</div>`;
    } else if (effect.type === 'spawnEnergyTile') {
        html += `<div class="event-effect">Spawn an energy tile</div>`;
    } else if (effect.type === 'grantResource') {
        html += `<div class="event-effect">Gain ${effect.value} ${getResourceIcon(effect.resource)} ${effect.resource}</div>`;
    } else if (effect.type === 'unlockEvolutionPath') {
        html += `<div class="event-effect">Unlock the ${effect.path} evolution path</div>`;
    } else {
        html += `<div class="event-effect">Unknown effect: ${effect.type}</div>`;
    }
    
    return html;
}

/**
 * Gets an icon for a resource
 * @param {string} resource - Resource name
 * @returns {string} HTML for resource icon
 */
function getResourceIcon(resource) {
    switch (resource) {
        case 'energy':
            return '⚡';
        case 'essence':
            return '✨';
        case 'knowledge':
            return '📚';
        case 'stability':
            return '🛡️';
        default:
            return '';
    }
}

/**
 * Creates an event chain element for the events UI
 * @param {string} chainId - Chain ID
 * @param {Object} chainData - Chain data
 * @returns {HTMLElement} Chain element
 */
function createEventChainElement(chainId, chainData) {
    if (!chainId || !chainData) {
        return document.createElement('div');
    }
    
    const chainElement = document.createElement('div');
    chainElement.className = `event-chain ${chainData.completed ? 'completed' : ''}`;
    
    const chainHeader = document.createElement('div');
    chainHeader.className = 'event-chain-header';
    
    const chainName = document.createElement('h3');
    chainName.textContent = chainData.name || 'Unknown Chain';
    
    const chainStatus = document.createElement('span');
    chainStatus.className = 'event-chain-status';
    chainStatus.textContent = chainData.completed ? 'Completed' : `Step ${chainData.currentStep + 1}/${chainData.events.length}`;
    
    chainHeader.appendChild(chainName);
    chainHeader.appendChild(chainStatus);
    
    const chainDescription = document.createElement('p');
    chainDescription.className = 'event-chain-description';
    chainDescription.textContent = chainData.description || 'No description available';
    
    const chainEvents = document.createElement('div');
    chainEvents.className = 'event-chain-events';
    
    if (chainData.events && chainData.events.length > 0) {
        chainData.events.forEach((eventId, index) => {
            const eventElement = document.createElement('div');
            eventElement.className = `event-chain-event ${index < chainData.currentStep ? 'completed' : index === chainData.currentStep ? 'current' : 'upcoming'}`;
            
            const event = findEventById(eventId);
            eventElement.textContent = event ? event.name : eventId;
            
            chainEvents.appendChild(eventElement);
        });
    } else {
        chainEvents.innerHTML = '<div class="no-events">No events in this chain.</div>';
    }
    
    chainElement.appendChild(chainHeader);
    chainElement.appendChild(chainDescription);
    chainElement.appendChild(chainEvents);
    
    return chainElement;
}

/**
 * Finds an event by its ID
 * @param {string} eventId - Event ID
 * @returns {Object} Event data
 */
function findEventById(eventId) {
    if (!GameState.events || !GameState.events.available) {
        return null;
    }
    
    // Check available events
    const availableEvent = GameState.events.available.find(event => event.id === eventId);
    if (availableEvent) {
        return availableEvent;
    }
    
    // Check triggered events
    if (GameState.events.triggered) {
        const triggeredEvent = GameState.events.triggered.find(event => event.id === eventId);
        if (triggeredEvent) {
            return triggeredEvent;
        }
    }
    
    return null;
}

/**
 * Shows an event notification
 * @param {Object} event - Event data
 */
function showEventNotification(event) {
    debug("Showing event notification", event);
    
    if (!event) {
        debug("No event provided");
        return;
    }
    
    const eventNotification = document.getElementById('event-notification');
    if (!eventNotification) {
        debug("Event notification element not found");
        return;
    }
    
    const titleElement = document.getElementById('event-notification-title');
    const descriptionElement = document.getElementById('event-notification-description');
    const effectsElement = document.getElementById('event-notification-effects');
    
    if (titleElement) {
        titleElement.textContent = event.name || 'Unknown Event';
    }
    
    if (descriptionElement) {
        descriptionElement.textContent = event.description || 'No description available';
    }
    
    if (effectsElement) {
        effectsElement.innerHTML = createEventEffectsHTML(event.effect);
    }
    
    eventNotification.style.display = 'block';
    debug("Event notification shown");
}

/**
 * Hides the event notification
 */
function hideEventNotification() {
    debug("Hiding event notification");
    
    const eventNotification = document.getElementById('event-notification');
    if (eventNotification) {
        eventNotification.style.display = 'none';
        debug("Event notification hidden");
    } else {
        debug("Event notification element not found");
    }
}

/**
 * Updates all UI elements with current game state
 */
function updateUI() {
    debug("Updating UI");
    
    try {
        // Get UI element references
        const turnDisplay = document.getElementById('turn-counter');
        const statsDisplay = document.getElementById('stats-display');
        const traitsDisplay = document.getElementById('traits-display');
        const tempInventoryDisplay = document.getElementById('temp-inventory-display');
        const persistentInventoryDisplay = document.getElementById('persistent-inventory-display');
        
        if (turnDisplay) {
            turnDisplay.textContent = `Turns: ${GameState.player.turnCount}`;
        }
        
        if (statsDisplay) {
            statsDisplay.textContent = `Moves: ${GameState.progress.stats.movementRange} | Luck: ${GameState.progress.stats.luck} | XP: ${GameState.progress.xp}`;
        }
        
        if (traitsDisplay) {
            traitsDisplay.textContent = `Traits: ${GameState.progress.traits.length > 0 ? GameState.progress.traits.join(', ') : 'None'}`;
        }
        
        if (tempInventoryDisplay) {
            tempInventoryDisplay.textContent = `Level Items: ${GameState.level.temporaryInventory.length > 0 ? GameState.level.temporaryInventory.join(', ') : 'None'}`;
        }
        
        if (persistentInventoryDisplay) {
            persistentInventoryDisplay.textContent = `Persistent Items: ${GameState.progress.persistentInventory.length > 0 ? GameState.progress.persistentInventory.join(', ') : 'None'}`;
        }
        
        // Update resource displays
        updateResourceDisplay('energy', GameState.resources.energy, GameState.resourceLimits.energy);
        updateResourceDisplay('essence', GameState.resources.essence, GameState.resourceLimits.essence);
        updateResourceDisplay('knowledge', GameState.resources.knowledge, GameState.resourceLimits.knowledge);
        updateResourceDisplay('stability', GameState.resources.stability, GameState.resourceLimits.stability);
        
        const systemBalance = document.getElementById('system-balance');
        if (systemBalance) {
            // Determine world state description
            let worldStateDesc = "";
            if (GameState.worldEvolution.globalChaos > 0.8) {
                worldStateDesc = "Primordial Chaos";
            } else if (GameState.worldEvolution.globalChaos > 0.6) {
                worldStateDesc = "Emerging Patterns";
            } else if (GameState.worldEvolution.globalChaos > 0.4) {
                worldStateDesc = "Balanced Forces";
            } else if (GameState.worldEvolution.globalChaos > 0.2) {
                worldStateDesc = "Ordered Systems";
            } else {
                worldStateDesc = "Harmonious Order";
            }
            
            const chaosPercent = (GameState.worldEvolution.globalChaos * 100).toFixed(0);
            const orderPercent = (GameState.worldEvolution.globalOrder * 100).toFixed(0);
            const worldAge = GameState.worldEvolution.age;
            
            systemBalance.innerHTML = `
                <span class="world-state">${worldStateDesc}</span> | 
                <span class="world-age">Age: ${worldAge}</span> | 
                <span class="world-balance">${chaosPercent}% Chaos / ${orderPercent}% Order</span>
            `;
        }
        
        // Update local variables for compatibility
        window.turnCount = GameState.player.turnCount;
        window.energy = GameState.resources.energy;
        window.movementPoints = GameState.player.movementPoints;
        
        debug("UI updated");
    } catch (error) {
        debug("Error updating UI", error.message);
    }
}

/**
 * Updates a resource display
 * @param {string} resourceType - Type of resource
 * @param {number} value - Current value
 * @param {number} max - Maximum value
 * @param {boolean} animate - Whether to animate the change
 */
function updateResourceDisplay(resourceType, value, max, animate = false) {
    const progressElement = document.getElementById(`${resourceType}-progress`);
    const valueElement = document.getElementById(`${resourceType}-value`);
    const textElement = document.getElementById(`${resourceType}-text`);
    
    if (!progressElement || !valueElement || !textElement) {
        return;
    }
    
    // Ensure value is within bounds
    value = Math.max(0, Math.min(value, max));
    
    // Calculate percentage
    const percentage = (value / max) * 100;
    
    // Update value element
    if (animate) {
        valueElement.style.transition = 'width 0.3s';
    } else {
        valueElement.style.transition = 'none';
    }
    
    valueElement.style.width = `${percentage}%`;
    
    // Update text
    textElement.textContent = `${value}/${max}`;
}

/**
 * Updates the statistics window with current metrics
 */
function updateStatsWindow() {
    debug("Updating stats window");
    
    try {
        const safeUpdate = (id, text) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            }
        };
        
        // Update recent stats
        safeUpdate('recent-turns', `Turns: ${GameState.metrics.turnsTaken}`);
        safeUpdate('recent-senses', `Senses: ${GameState.metrics.sensesMade}`);
        safeUpdate('recent-pokes', `Pokes: ${GameState.metrics.pokesMade}`);
        
        const recentEnergyRatio = GameState.metrics.getEnergyUsageRatio().toFixed(2);
        safeUpdate('recent-energy-ratio', `Energy Ratio: ${recentEnergyRatio}`);
        
        const safestPathLength = 2 * (Math.min(window.rows, window.cols) - 1);
        const recentEfficiency = GameState.metrics.getMovementEfficiency(safestPathLength).toFixed(2);
        safeUpdate('recent-efficiency', `Efficiency: ${recentEfficiency}`);
        
        // Update general stats
        safeUpdate('general-turns', `Total Turns: ${GameState.progress.totalTurns || 0}`);
        safeUpdate('general-senses', `Total Senses: ${GameState.progress.sensesMade || 0}`);
        safeUpdate('general-pokes', `Total Pokes: ${GameState.progress.pokesMade || 0}`);
        safeUpdate('general-energy-ratio', `Energy Ratio: N/A`);
        safeUpdate('general-efficiency', `Efficiency: N/A`);
        
        debug("Stats window updated");
    } catch (error) {
        debug("Error updating stats window", error.message);
    }
}

/**
 * Updates visible tiles based on player's vision range
 * Clears fog of war permanently for explored tiles
 */
function updateVision() {
    debug("Updating vision");
    
    try {
        // Default vision range is 1
        let visionRange = 1;
        
        // Apply Enhanced Vision trait if active
        if (GameState.evolution && GameState.evolution.activeTraits) {
            if (GameState.evolution.activeTraits.some(trait => trait.effect === 'vision_range_+1')) {
                visionRange += 1;
                debug("Enhanced vision trait active, range increased to 2");
            }
        }
        
        const visibleTiles = getTilesInRange(window.currentRow, window.currentCol, visionRange);
        debug(`Found ${visibleTiles.length} tiles in vision range`);
        
        document.querySelectorAll('.hex-container').forEach(container => {
            const row = parseInt(container.getAttribute('data-row'));
            const col = parseInt(container.getAttribute('data-col'));
            
            // Check if this tile is visible
            const isVisible = visibleTiles.some(t => t.row === row && t.col === col);
            
            if (isVisible) {
                // Remove unexplored class if visible
                container.classList.remove('unexplored');
                
                // Mark as explored in data
                if (window.tileData && window.tileData[row] && window.tileData[row][col]) {
                    window.tileData[row][col].explored = true;
                }
            }
        });
        
        debug("Vision updated");
    } catch (error) {
        debug("Error updating vision", error.message);
    }
}

/**
 * Gets adjacent tiles for a given position
 * @param {number} row - Row position
 * @param {number} col - Column position
 * @returns {Array} Array of adjacent tile positions
 */
function getAdjacentTiles(row, col) {
    const adjacentTiles = [];
    
    // Check all six adjacent hexes
    const directions = [
        [-1, 0],  // Up
        [-1, 1],  // Up-Right
        [0, 1],   // Right
        [1, 0],   // Down
        [1, -1],  // Down-Left
        [0, -1]   // Left
    ];
    
    for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        // Check if the new position is within bounds
        if (newRow >= 0 && newRow < window.rows && newCol >= 0 && newCol < window.cols) {
            adjacentTiles.push([newRow, newCol]);
        }
    }
    
    return adjacentTiles;
}

/**
 * Shows a notification to the player
 * @param {string} message - The message to display
 */
function showNotification(message) {
    debug(`Showing notification: ${message}`);
    
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    } else {
        debug("Notification element not found");
    }
}