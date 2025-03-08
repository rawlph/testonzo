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
        console.log(`Creating tile data: ${rows}x${cols}`);
        
        // Default global chaos value
        const globalChaos = this.worldEvolution.globalChaos || 0.8;
        
        // Default variance value (20% variance)
        const variance = 0.2;
        
        console.log(`Global chaos: ${globalChaos}, Variance: ${variance}`);
        
        // Create a 2D array to store tile data
        const tileData = [];
        
        for (let r = 0; r < rows; r++) {
            tileData[r] = [];
            for (let c = 0; c < cols; c++) {
                // Randomize chaos value with some variance around global chaos
                const randomVariance = (Math.random() * 2 - 1) * variance;
                const chaos = Math.max(0, Math.min(1, globalChaos + randomVariance));
                
                // Determine tile type based on chaos level
                const type = this.determineTileType(chaos);
                
                // Store tile data
                tileData[r][c] = {
                    type: type,
                    chaos: chaos,
                    order: 1 - chaos,
                    explored: false,
                    sensed: false,
                    stability: 0
                };
            }
        }
        
        console.log(`Tile data created with ${rows * cols} tiles`);
        return tileData;
    },
    
    /**
     * Resets all progress
     */
    resetAllProgress() {
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
            width: 100%;
            height: 100vh;
            overflow: hidden;
            background-color: #222;
        }
        
        .grid-container {
            position: relative;
            margin: 100px auto 150px auto; /* Added more margin at top and bottom */
            background-color: #333;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            overflow: visible;
        }
        
        .hex-container {
            position: absolute;
            width: 100px;
            height: 100px;
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
    
    // Create game container if it doesn't exist
    let gameContainer = document.getElementById('game-container');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        gameContainer.className = 'game-container';
        document.body.appendChild(gameContainer);
        console.log("Created game container");
    } else {
        console.log("Game container already exists");
    }
    
    // Create resource bars if they don't exist
    if (!document.querySelector('.resource-bars')) {
        const resourceBars = document.createElement('div');
        resourceBars.className = 'resource-bars';
        resourceBars.innerHTML = `
            <div class="resource-bar">
                <span class="resource-label">Energy:</span>
                <div class="resource-progress" id="energy-progress">
                    <div class="resource-value energy-value" id="energy-value" style="width: 50%;"></div>
                </div>
                <span class="resource-text" id="energy-text">10/20</span>
            </div>
            <div class="resource-bar">
                <span class="resource-label">Essence:</span>
                <div class="resource-progress" id="essence-progress">
                    <div class="resource-value essence-value" id="essence-value" style="width: 0%;"></div>
                </div>
                <span class="resource-text" id="essence-text">0/50</span>
            </div>
            <div class="resource-bar">
                <span class="resource-label">Knowledge:</span>
                <div class="resource-progress" id="knowledge-progress">
                    <div class="resource-value knowledge-value" id="knowledge-value" style="width: 0%;"></div>
                </div>
                <span class="resource-text" id="knowledge-text">0/50</span>
            </div>
            <div class="resource-bar">
                <span class="resource-label">Stability:</span>
                <div class="resource-progress" id="stability-progress">
                    <div class="resource-value stability-value" id="stability-value" style="width: 0%;"></div>
                </div>
                <span class="resource-text" id="stability-text">0/50</span>
            </div>
            <div id="system-balance">Balanced Forces | Age: 0 | 50% Chaos / 50% Order</div>
            <div id="turn-counter">Turns: 0</div>
            <div id="stats-display">Moves: 1 | Luck: 1 | XP: 0</div>
            <div id="traits-display">Traits: None</div>
            <div id="temp-inventory-display">Level Items: None</div>
            <div id="persistent-inventory-display">Persistent Items: None</div>
        `;
        gameContainer.appendChild(resourceBars);
        console.log("Created resource bars");
    }
    
    // Create admin tools if they don't exist
    if (!document.querySelector('.admin-tools')) {
        const adminTools = document.createElement('div');
        adminTools.className = 'admin-tools';
        adminTools.innerHTML = `
            <div>
                <input id="rows-input" type="number" min="3" max="20" value="5" />
                <span>×</span>
                <input id="cols-input" type="number" min="3" max="20" value="5" />
                <button id="resize-btn">Resize Grid</button>
            </div>
            <button id="reset-stats-btn">Reset All Progress</button>
        `;
        gameContainer.appendChild(adminTools);
        
        // Add event listeners to admin controls
        document.getElementById('resize-btn').addEventListener('click', () => {
            const newRows = parseInt(document.getElementById('rows-input').value);
            const newCols = parseInt(document.getElementById('cols-input').value);
            
            if (GameState.updateGridSize(newRows, newCols)) {
                // Update local variables for compatibility
                window.rows = GameState.grid.rows;
                window.cols = GameState.grid.cols;
                
                startGame();
            } else {
                alert('Please choose rows and columns between 3 and 20.');
            }
        });
        
        document.getElementById('reset-stats-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
                GameState.resetAllProgress();
                startGame();
            }
        });
        
        console.log("Created admin tools");
    }
    
    // Remove any duplicate action consoles
    const actionConsoles = document.querySelectorAll('.action-console');
    if (actionConsoles.length > 1) {
        console.log(`Found ${actionConsoles.length} action consoles, removing duplicates`);
        // Keep only the first one
        for (let i = 1; i < actionConsoles.length; i++) {
            actionConsoles[i].parentNode.removeChild(actionConsoles[i]);
        }
    }
    
    // Create action console if it doesn't exist
    if (document.querySelectorAll('.action-console').length === 0) {
        const actionConsole = document.createElement('div');
        actionConsole.className = 'action-console';
        actionConsole.innerHTML = `
            <button id="move-btn" class="console-btn">Move</button>
            <button id="sense-btn" class="console-btn">Sense</button>
            <button id="poke-btn" class="console-btn">Poke</button>
            <button id="stabilize-btn" class="console-btn">Stabilize</button>
            <button id="rest-btn" class="console-btn">Rest</button>
            <button id="end-turn-btn" class="console-btn">End Turn</button>
            <button id="evolution-btn" class="console-btn">Evolution</button>
            <button id="events-btn" class="console-btn">Events</button>
            <button id="stats-btn" class="console-btn">Stats</button>
        `;
        gameContainer.appendChild(actionConsole);
        console.log("Created action console");
        
        // Add event listeners to buttons
        document.getElementById('move-btn').addEventListener('click', () => {
            console.log("Move button clicked");
            highlightTiles('move');
        });
        
        document.getElementById('sense-btn').addEventListener('click', () => {
            console.log("Sense button clicked");
            highlightTiles('sense');
        });
        
        document.getElementById('poke-btn').addEventListener('click', () => {
            console.log("Poke button clicked");
            highlightTiles('poke');
        });
        
        document.getElementById('stabilize-btn').addEventListener('click', () => {
            console.log("Stabilize button clicked");
            highlightTiles('stabilize');
        });
        
        document.getElementById('rest-btn').addEventListener('click', rest);
        document.getElementById('end-turn-btn').addEventListener('click', endTurn);
        
        document.getElementById('evolution-btn').addEventListener('click', () => {
            const evolutionWindow = document.getElementById('evolution-window');
            if (evolutionWindow) {
                updateEvolutionUI();
                evolutionWindow.style.display = 'block';
            }
        });
        
        document.getElementById('events-btn').addEventListener('click', () => {
            const eventsWindow = document.getElementById('events-window');
            if (eventsWindow) {
                updateEventsUI();
                eventsWindow.style.display = 'block';
            }
        });
        
        document.getElementById('stats-btn').addEventListener('click', () => {
            const statsWindow = document.getElementById('stats-window');
            if (statsWindow) {
                updateStatsWindow();
                statsWindow.style.display = 'block';
            }
        });
    } else {
        console.log("Action console already exists");
    }
    
    // Create stats window if it doesn't exist
    if (!document.getElementById('stats-window')) {
        const statsWindow = document.createElement('div');
        statsWindow.id = 'stats-window';
        statsWindow.className = 'window';
        statsWindow.innerHTML = `
            <div class="window-header">
                <h2>Game Statistics</h2>
                <button id="close-stats-btn" class="close-btn">×</button>
            </div>
            <div class="window-content">
                <h3>Recent Stats</h3>
                <div id="recent-turns">Turns: 0</div>
                <div id="recent-senses">Senses: 0</div>
                <div id="recent-pokes">Pokes: 0</div>
                <div id="recent-energy-ratio">Energy Ratio: 0.00</div>
                <div id="recent-efficiency">Efficiency: 0.00</div>
                <h3>General Stats</h3>
                <div id="general-turns">Total Turns: 0</div>
                <div id="general-senses">Total Senses: 0</div>
                <div id="general-pokes">Total Pokes: 0</div>
                <div id="general-energy-ratio">Energy Ratio: N/A</div>
                <div id="general-efficiency">Efficiency: N/A</div>
            </div>
        `;
        document.body.appendChild(statsWindow);
        
        // Add event listener to close button
        document.getElementById('close-stats-btn').addEventListener('click', () => {
            statsWindow.style.display = 'none';
        });
        
        console.log("Created stats window");
    }
    
    // Create events window if it doesn't exist
    if (!document.getElementById('events-window')) {
        const eventsWindow = document.createElement('div');
        eventsWindow.id = 'events-window';
        eventsWindow.className = 'window';
        eventsWindow.style.width = '500px';
        eventsWindow.style.maxHeight = '80%';
        eventsWindow.style.overflow = 'auto';
        eventsWindow.style.display = 'none';
        eventsWindow.innerHTML = `
            <div class="window-header">
                <h2>World Events</h2>
                <button id="close-events-btn" class="close-btn">×</button>
            </div>
            <div class="window-content">
                <div class="events-tabs">
                    <button class="events-tab-btn active" data-type="triggered">Triggered</button>
                    <button class="events-tab-btn" data-type="available">Available</button>
                    <button class="events-tab-btn" data-type="chains">Chains</button>
                </div>
                <div class="events-tab-content active" id="triggered-events-tab">
                    <div id="triggered-events" class="events-list"></div>
                </div>
                <div class="events-tab-content" id="available-events-tab">
                    <div id="available-events" class="events-list"></div>
                </div>
                <div class="events-tab-content" id="chains-events-tab">
                    <div id="chains-events" class="events-list"></div>
                </div>
            </div>
        `;
        document.body.appendChild(eventsWindow);
        
        // Add event listener to close button
        document.getElementById('close-events-btn').addEventListener('click', () => {
            eventsWindow.style.display = 'none';
        });
        
        // Add event listeners to tab buttons
        const tabButtons = document.querySelectorAll('.events-tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and content
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.events-tab-content').forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const type = button.getAttribute('data-type');
                document.getElementById(`${type}-events-tab`).classList.add('active');
            });
        });
        
        console.log("Created events window");
    }
    
    // Create event notification window if it doesn't exist
    if (!document.getElementById('event-notification')) {
        const eventNotification = document.createElement('div');
        eventNotification.id = 'event-notification';
        eventNotification.className = 'window';
        eventNotification.style.display = 'none';
        eventNotification.style.width = '400px';
        eventNotification.style.zIndex = '40';
        eventNotification.innerHTML = `
            <div class="window-header">
                <h2>Event Triggered</h2>
                <button id="event-notification-close-btn" class="close-btn">×</button>
            </div>
            <div class="window-content">
                <h3 id="event-notification-title">Event Title</h3>
                <p id="event-notification-description">Event description goes here.</p>
                <div id="event-notification-effects">Event effects will be shown here.</div>
            </div>
        `;
        document.body.appendChild(eventNotification);
        
        // Add event listener to close button
        document.getElementById('event-notification-close-btn').addEventListener('click', () => {
            eventNotification.style.display = 'none';
        });
        
        console.log("Created event notification");
    }
    
    // Create notification element if it doesn't exist
    if (!document.getElementById('notification')) {
        const notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
        console.log("Created notification element");
    }
    
    console.log("Game UI setup complete");
}