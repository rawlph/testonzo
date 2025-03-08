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
        energy: 0,
        movementPoints: 1,
        currentAction: null,
        moveCounter: 0,
        turnCount: 0,
        currentLevelSenses: 0,
        hasUsedSenserBonus: false
    },
    
    // Resource system
    resources: {
        energy: 0,      // Used for movement and basic actions
        essence: 0,     // Used for stabilization and evolution
        knowledge: 0,   // Used to unlock new abilities
        stability: 50   // Affects success rate of actions (0-100 scale)
    },
    
    // Resource limits and rates
    resourceLimits: {
        energy: 100,
        essence: 1000,
        knowledge: 500,
        stability: 100
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
                // Add early game events to the pool
                eventPool = [...eventPool, ...this.events.early];
            } else if (this.worldEvolution.age < 15) {
                // Add mid game events to the pool
                eventPool = [...eventPool, ...this.events.mid];
            } else {
                // Add late game events to the pool
                eventPool = [...eventPool, ...this.events.late];
            }
        }
        
        // Filter events that could be triggered by this trigger type
        const triggeredEvents = [];
        
        eventPool.forEach(event => {
            // Skip events that have been completed if they're one-time events
            if (event.oneTime && event.completed) {
                return;
            }
            
            // Check if this event is triggered
            if (this.isEventTriggered(event, triggerType, context)) {
                console.log(`Event triggered: ${event.name}`);
                
                // Apply event effect
                this.applyEventEffect(event);
                
                // Mark as completed for one-time events
                if (event.oneTime) {
                    event.completed = true;
                }
                
                // Add to triggered events list
                this.events.triggered.push({
                    ...event,
                    triggeredAt: this.worldEvolution.age,
                    triggerContext: { ...context }
                });
                
                triggeredEvents.push(event);
                
                // Update event chain if applicable
                if (event.chain) {
                    this.advanceEventChain(event.chain, event.id);
                }
            }
        });
        
        return triggeredEvents;
    },
    
    /**
     * Checks if an event is triggered based on its conditions
     * @param {Object} event - Event to check
     * @param {string} triggerType - Type of trigger
     * @param {Object} context - Context information for the trigger
     * @returns {boolean} Whether the event is triggered
     */
    isEventTriggered(event, triggerType, context) {
        if (!event.trigger) {
            return false;
        }
        
        // Handle the new trigger format (with type)
        if (event.trigger.type) {
            // Different trigger type than what we're checking
            if (event.trigger.type !== triggerType) {
                return false;
            }
            
            // Check for chance-based triggers
            if (typeof event.trigger.chance === 'number') {
                if (Math.random() > event.trigger.chance) {
                    return false;
                }
            }
            
            // Check for minimum turn requirement
            if (event.trigger.minTurn && 
                (!context.turnCount || context.turnCount < event.trigger.minTurn)) {
                return false;
            }
            
            // Check for target type for sense triggers
            if (triggerType === 'sense' && event.trigger.targetType) {
                if (!context.tileType || context.tileType !== event.trigger.targetType) {
                    return false;
                }
            }
            
            // Check for global requirements
            if (event.requirement) {
                if (event.requirement.globalChaos && 
                    this.worldEvolution.globalChaos < event.requirement.globalChaos) {
                    return false;
                }
                
                if (event.requirement.globalOrder && 
                    this.worldEvolution.globalOrder < event.requirement.globalOrder) {
                    return false;
                }
            }
            
            // Passed all checks
            return true;
        }
        
        // Handle the old trigger format (with condition)
        if (event.trigger.condition) {
            const { condition, value } = event.trigger;
            
            switch (condition) {
                // World triggers
                case 'chaos_below':
                    return triggerType === 'world' && this.worldEvolution.globalChaos < value;
                case 'chaos_above':
                    return triggerType === 'world' && this.worldEvolution.globalChaos > value;
                case 'order_below':
                    return triggerType === 'world' && this.worldEvolution.globalOrder < value;
                case 'order_above':
                    return triggerType === 'world' && this.worldEvolution.globalOrder > value;
                case 'stability_above':
                    return triggerType === 'world' && this.resources.stability > value;
                
                // Tile triggers
                case 'poke_chaos_tile':
                    return triggerType === 'tile' && 
                          context.action === 'poke' && 
                          context.tile && 
                          context.tile.chaos > value;
                case 'sense_order_tile':
                    return triggerType === 'tile' && 
                          context.action === 'sense' && 
                          context.tile && 
                          context.tile.order > value;
                case 'stabilize_tile':
                    return triggerType === 'tile' && 
                          context.action === 'stabilize';
                case 'stabilize_order_tile':
                    return triggerType === 'tile' && 
                          context.action === 'stabilize' && 
                          context.tile && 
                          context.tile.order > value;
                
                // Evolution triggers
                case 'any_path_level':
                    return triggerType === 'evolution' && 
                          Object.values(this.evolution.paths).some(path => path.level >= value);
                
                default:
                    return false;
            }
        }
        
        return false;
    },
    
    /**
     * Advances an event chain to the next step
     * @param {string} chainId - ID of the chain
     * @param {number} step - Current step
     * @returns {Object} Updated chain information
     */
    advanceEventChain(chainId, step) {
        if (!this.events.chains || !this.events.chains[chainId]) {
            return null;
        }
        
        const chain = this.events.chains[chainId];
        
        // Update the current step
        chain.currentStep = step;
        
        // Check if the chain is complete
        if (step >= chain.steps) {
            // Mark all events in this chain as completed
            const chainEvents = Object.values(this.events.availableEvents)
                .flat()
                .filter(event => event.type === 'chain' && event.chainId === chainId);
            
            for (const event of chainEvents) {
                if (!this.events.completedEvents.includes(event.id)) {
                    this.events.completedEvents.push(event.id);
                }
            }
        }
        
        // Save the updated chain
        this.events.eventChains[chainId] = chain;
        
        return {
            chainId,
            currentStep: step,
            totalSteps: chain.steps,
            isComplete: step >= chain.steps
        };
    },
    
    /**
     * Applies the effects of an event
     * @param {Object} event - Event to apply
     * @returns {Object} Result of applying the event
     */
    applyEventEffect(event) {
        if (!event.effect) {
            return { success: false, message: 'No effect defined for event' };
        }
        
        const { type } = event.effect;
        
        switch (type) {
            case 'resource_gain':
                // Apply resource gains/losses
                const results = {};
                for (const [resource, amount] of Object.entries(event.effect)) {
                    if (resource !== 'type' && this.resources[resource] !== undefined) {
                        this.updateResource(resource, amount);
                        results[resource] = { amount, newValue: this.resources[resource] };
                    }
                }
                return { success: true, type: 'resource_gain', results };
            
            case 'special':
                // Handle special effects
                const special = event.effect.special;
                switch (special) {
                    case 'reality_anchor':
                        // Create a reality anchor (permanent order point)
                        if (this.level.tileData && this.player.currentRow !== undefined && this.player.currentCol !== undefined) {
                            const tile = this.level.tileData[this.player.currentRow][this.player.currentCol];
                            if (tile) {
                                tile.chaos = 0.1; // Set to minimum chaos
                                tile.order = 0.9; // Set to maximum order
                                tile.realityAnchor = true; // Mark as a reality anchor
                                return { success: true, type: 'special', special, location: { row: this.player.currentRow, col: this.player.currentCol } };
                            }
                        }
                        return { success: false, message: 'Could not create reality anchor' };
                    
                    case 'consciousness_ally':
                        // Add consciousness as an ally
                        if (!this.progress.allies) {
                            this.progress.allies = [];
                        }
                        this.progress.allies.push('consciousness');
                        return { success: true, type: 'special', special, ally: 'consciousness' };
                    
                    default:
                        return { success: false, message: `Unknown special effect: ${special}` };
                }
            
            default:
                return { success: false, message: `Unknown effect type: ${type}` };
        }
    },
    
    /**
     * Applies effects from all active traits
     */
    applyTraitEffects() {
        // Reset any modified limits or rates to defaults
        this.resourceLimits = {
            energy: 100,
            essence: 1000,
            knowledge: 500,
            stability: 100
        };
        
        this.resourceRates = {
            energyPerRest: 10,
            essencePerStabilize: 1,
            knowledgePerSense: 2,
            stabilityDecayPerTurn: 1,
            stabilityGainPerStabilize: 5
        };
        
        // Apply effects from each active trait
        this.evolution.activeTraits.forEach(trait => {
            switch (trait.effect) {
                case 'vision_range_+1':
                    // Will be applied in updateVision function
                    break;
                case 'sense_efficiency_+20%':
                    this.resourceRates.knowledgePerSense *= 1.2;
                    break;
                case 'poke_energy_-1':
                    // Will be applied in poke action
                    break;
                case 'poke_success_+20%':
                    // Will be applied in applyStabilityToChance
                    break;
                case 'poke_effect_+50%':
                    // Will be applied in poke action
                    break;
                case 'stabilize_effect_+20%':
                    // Will be applied in stabilize action
                    break;
                case 'stability_per_turn_+2':
                    // Will be applied in endTurn
                    break;
                case 'free_move_every_3':
                    // Will be applied in move action
                    break;
                case 'max_energy_+25':
                    this.resourceLimits.energy += 25;
                    break;
                case 'stability_loss_-50%':
                    // Will be applied in endTurn
                    break;
            }
        });
    },
    
    /**
     * Calculates evolution points after completing a level
     * @returns {Object} Evolution points for each path
     */
    calculateEvolutionPoints() {
        return {
            explorer: Math.round(this.metrics.sensesMade * 10 + this.metrics.tilesExplored * 5),
            manipulator: Math.round(this.metrics.pokesMade * 10 + this.metrics.specialTilesInteracted * 5),
            stabilizer: Math.round(Math.abs(this.progress.orderContributions) * 100),
            survivor: Math.round(this.metrics.movesMade * 2 + this.metrics.restsTaken * 5)
        };
    },
    
    /**
     * Adds evolution XP to a specific path
     * @param {string} path - Evolution path ('explorer', 'manipulator', 'stabilizer', 'survivor')
     * @param {number} xp - Amount of XP to add
     * @returns {Object} Updated path information
     */
    addEvolutionXP(path, xp) {
        if (!this.evolution.paths[path]) {
            console.error(`Invalid evolution path: ${path}`);
            return null;
        }
        
        const pathData = this.evolution.paths[path];
        pathData.xp += xp;
        
        // Check for level up
        let leveledUp = false;
        while (pathData.xp >= pathData.xpToNext) {
            pathData.xp -= pathData.xpToNext;
            pathData.level++;
            pathData.xpToNext = Math.round(pathData.xpToNext * 1.5); // Increase XP required for next level
            leveledUp = true;
        }
        
        return {
            path,
            level: pathData.level,
            xp: pathData.xp,
            xpToNext: pathData.xpToNext,
            leveledUp
        };
    },
    
    /**
     * Gets available traits for a specific path and level
     * @param {string} path - Evolution path
     * @returns {Array} Available traits
     */
    getAvailableTraits(path) {
        // Ensure evolution paths and availableTraits exist
        if (!this.evolution || !this.evolution.paths || !this.evolution.availableTraits) {
            console.error('Evolution system not properly initialized');
            return [];
        }
        
        // Check if the requested path exists
        if (!this.evolution.paths[path]) {
            console.error(`Invalid evolution path: ${path}`);
            return [];
        }
        
        // Check if traits for this path exist
        if (!this.evolution.availableTraits[path]) {
            console.error(`No traits defined for path: ${path}`);
            return [];
        }
        
        const pathLevel = this.evolution.paths[path].level;
        const alreadyUnlocked = this.evolution.paths[path].traits || [];
        
        return this.evolution.availableTraits[path].filter(trait => 
            trait.level <= pathLevel && !alreadyUnlocked.includes(trait.id)
        );
    },
    
    /**
     * Unlocks a trait for a specific path
     * @param {string} path - Evolution path
     * @param {string} traitId - ID of the trait to unlock
     * @returns {Object} Result of the unlock attempt
     */
    unlockTrait(path, traitId) {
        if (!this.evolution.paths[path]) {
            return { success: false, message: `Invalid evolution path: ${path}` };
        }
        
        // Find the trait
        const trait = this.evolution.availableTraits[path].find(t => t.id === traitId);
        if (!trait) {
            return { success: false, message: `Trait not found: ${traitId}` };
        }
        
        // Check if already unlocked
        if (this.evolution.paths[path].traits.includes(traitId)) {
            return { success: false, message: `Trait already unlocked: ${trait.name}` };
        }
        
        // Check level requirement
        if (trait.level > this.evolution.paths[path].level) {
            return { success: false, message: `${path} level ${trait.level} required for ${trait.name}` };
        }
        
        // Check resource costs
        for (const [resource, cost] of Object.entries(trait.cost)) {
            if (this.resources[resource] < cost) {
                return { success: false, message: `Not enough ${resource}: ${this.resources[resource]}/${cost}` };
            }
        }
        
        // Deduct resources
        for (const [resource, cost] of Object.entries(trait.cost)) {
            this.updateResource(resource, -cost);
        }
        
        // Unlock the trait
        this.evolution.paths[path].traits.push(traitId);
        this.evolution.activeTraits.push(trait);
        
        // Add to progress traits for backward compatibility
        if (!this.progress.traits.includes(trait.name)) {
            this.progress.traits.push(trait.name);
        }
        
        // Apply trait effects
        this.applyTraitEffects();
        
        return { 
            success: true, 
            message: `Unlocked ${trait.name}!`,
            trait: trait
        };
    },
    
    /**
     * Resets player state for a new level
     */
    resetPlayerState() {
        this.player.currentRow = 0;
        this.player.currentCol = 0;
        this.player.energy = 5 * (this.grid.rows + this.grid.cols - 2);
        this.player.movementPoints = this.progress.stats.movementRange;
        this.player.turnCount = 0;
        this.player.currentLevelSenses = 0;
        this.player.moveCounter = 0;
        this.player.hasUsedSenserBonus = false;
        this.player.currentAction = null;
        this.level.temporaryInventory = [];
        this.isActive = true;
        
        // Reset resources for new level
        this.resources.energy = Math.min(this.player.energy * 2, this.resourceLimits.energy);
        // Don't reset essence and knowledge as they persist between levels
        this.resources.stability = 50; // Reset to neutral stability
    },
    
    /**
     * Updates a resource value
     * @param {string} type - Resource type ('energy', 'essence', 'knowledge', 'stability')
     * @param {number} amount - Amount to change (positive or negative)
     * @returns {Object} Updated resource information
     */
    updateResource(type, amount) {
        // Update the resource
        this.resources[type] += amount;
        
        // Enforce limits
        if (type === 'stability') {
            this.resources.stability = Math.max(0, Math.min(this.resourceLimits.stability, this.resources.stability));
        } else {
            this.resources[type] = Math.max(0, Math.min(this.resourceLimits[type], this.resources[type]));
            
            // Track total resources gained (only for positive changes)
            if (amount > 0 && this.progress.totalResources[`${type}Gained`] !== undefined) {
                this.progress.totalResources[`${type}Gained`] += amount;
            }
        }
        
        // For energy, also update the player.energy for backward compatibility
        if (type === 'energy') {
            this.player.energy = this.resources.energy;
        }
        
        // For essence, also update progress.essence for backward compatibility
        if (type === 'essence') {
            this.progress.essence = this.resources.essence;
        }
        
        return {
            type,
            value: this.resources[type],
            change: amount,
            limit: this.resourceLimits[type]
        };
    },
    
    /**
     * Applies stability effects to an action's success chance
     * @param {string} actionType - Type of action ('sense', 'poke', 'stabilize')
     * @param {number} baseChance - Base success chance (0-1)
     * @returns {number} Modified success chance
     */
    applyStabilityToChance(actionType, baseChance) {
        const stability = this.resources.stability;
        let modifier = 0;
        
        // Different actions are affected differently by stability
        switch (actionType) {
            case 'sense':
                // Sensing is easier with higher stability
                modifier = (stability - 50) / 100; // -0.5 to +0.5
                break;
            case 'poke':
                // Poking is more effective with lower stability (more chaos)
                modifier = (50 - stability) / 100; // +0.5 to -0.5
                
                // Apply Reactive trait if active
                if (this.evolution.activeTraits.some(trait => trait.effect === 'poke_success_+20%')) {
                    modifier += 0.2;
                }
                break;
            case 'stabilize':
                // Stabilizing is easier with higher stability
                modifier = (stability - 50) / 100; // -0.5 to +0.5
                break;
            default:
                modifier = 0;
        }
        
        // Apply the modifier
        const modifiedChance = baseChance + (modifier * 0.3); // Scale the effect
        
        // Ensure the chance stays within 0-1 range
        return Math.max(0.1, Math.min(0.95, modifiedChance));
    },
    
    /**
     * Saves current progress to localStorage
     */
    saveProgress() {
        // Include world evolution data, resources, evolution, and events in the saved progress
        this.progress.worldEvolution = this.worldEvolution;
        this.progress.resources = this.resources;
        this.progress.evolution = this.evolution;
        this.progress.events = this.events;
        localStorage.setItem('playerProgress', JSON.stringify(this.progress));
    },
    
    /**
     * Updates progress after completing a level
     * @param {number} xpGain - XP gained from completing the level
     * @param {boolean} foundZoe - Whether Zoe was found in this level
     * @param {boolean} foundKey - Whether a key was found in this level
     * @returns {Object} Updated traits and other information
     */
    completeLevelProgress(xpGain, foundZoe, foundKey) {
        // Update XP
        this.progress.xp += xpGain;
        
        // Handle Zoe discovery
        if (!this.progress.hasFoundZoe && foundZoe) {
            this.progress.hasFoundZoe = true;
            this.progress.zoeLevelsCompleted = 1;
            if (!this.progress.traits.includes('zoeInitiate')) {
                this.progress.traits.push('zoeInitiate');
            }
        } else if (this.progress.hasFoundZoe) {
            this.progress.zoeLevelsCompleted += 1;
            if (this.progress.zoeLevelsCompleted === 4 && !this.progress.traits.includes('zoeAdept')) {
                this.progress.traits.push('zoeAdept');
            } else if (this.progress.zoeLevelsCompleted === 7 && !this.progress.traits.includes('zoeMaster')) {
                this.progress.traits.push('zoeMaster');
            }
        }
        
        // Handle key discovery
        if (foundKey && !this.progress.traits.includes('Keymaster')) {
            this.progress.traits.push('Keymaster');
        }
        
        // Update metrics
        this.progress.sensesMade += this.metrics.sensesMade;
        this.progress.pokesMade += this.metrics.pokesMade;
        this.progress.totalTurns = (this.progress.totalTurns || 0) + this.metrics.turnsTaken;
        
        // Calculate evolution points
        const evolutionPoints = this.calculateEvolutionPoints();
        
        // Add evolution XP to each path
        const evolutionResults = {};
        let leveledUp = false;
        for (const [path, points] of Object.entries(evolutionPoints)) {
            const result = this.addEvolutionXP(path, points);
            evolutionResults[path] = result;
            if (result.leveledUp) {
                leveledUp = true;
            }
        }
        
        // Check for evolution events if any path leveled up
        if (leveledUp) {
            const evolutionEvents = this.checkEvents('evolution');
            if (evolutionEvents.length > 0) {
                // Add to active events to be shown later
                evolutionEvents.forEach(event => {
                    if (!this.events.activeEvents.includes(event.id)) {
                        this.events.activeEvents.push(event.id);
                    }
                });
            }
        }
        
        // Evolve the world
        const worldEvolutionResult = this.evolveWorld();
        
        // Save progress
        this.saveProgress();
        
        return {
            traits: this.progress.traits,
            xp: this.progress.xp,
            essence: this.resources.essence,
            knowledge: this.resources.knowledge,
            worldAge: worldEvolutionResult.newAge,
            globalOrder: worldEvolutionResult.globalOrder,
            globalChaos: worldEvolutionResult.globalChaos,
            evolution: evolutionResults
        };
    },
    
    /**
     * Evolves the world state after completing a level
     * @returns {Object} Updated world state information
     */
    evolveWorld() {
        // Increase world age
        this.worldEvolution.age++;
        
        // Calculate new global balance based on player actions
        const orderContribution = this.progress.orderContributions;
        const stabilizationFactor = 0.05 * Math.min(1, this.metrics.tilesExplored / (this.grid.rows * this.grid.cols));
        
        // World evolves toward order but with diminishing returns
        this.worldEvolution.globalOrder = Math.min(0.9, this.worldEvolution.globalOrder + 
            (stabilizationFactor * orderContribution) / (this.worldEvolution.age * 0.5 + 1));
        this.worldEvolution.globalChaos = 1 - this.worldEvolution.globalOrder;
        
        // Adjust thresholds based on world age
        if (this.worldEvolution.age > 5) {
            this.worldEvolution.stabilityThreshold = Math.min(0.6, this.worldEvolution.stabilityThreshold + 0.02);
            this.worldEvolution.complexityThreshold = Math.max(0.4, this.worldEvolution.complexityThreshold - 0.02);
        }
        
        return {
            newAge: this.worldEvolution.age,
            globalOrder: this.worldEvolution.globalOrder,
            globalChaos: this.worldEvolution.globalChaos,
            stabilityThreshold: this.worldEvolution.stabilityThreshold,
            complexityThreshold: this.worldEvolution.complexityThreshold
        };
    },
    
    /**
     * Resets all progress to default values
     */
    resetAllProgress() {
        console.log("Resetting all progress...");
        
        // Default progress state
        this.progress = {
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
        };
        
        // Reset world evolution state
        this.worldEvolution = {
            globalChaos: 0.8,
            globalOrder: 0.2,
            age: 0,
            eventHistory: []
        };
        
        // Reset resources
        this.resources = {
            energy: 10,
            essence: 0,
            knowledge: 0,
            stability: 0
        };
        
        // Reset evolution paths
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
        
        // Reset events
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
        
        // Reset level state
        this.level = {
            temporaryInventory: [],
            hasKey: false,
            foundZoe: false,
            requiresKey: true
        };
        
        // Reset recent metrics
        this.recentMetrics = {
            previousChaos: this.worldEvolution.globalChaos,
            previousOrder: this.worldEvolution.globalOrder
        };
        
        // Save the reset state
        this.saveProgress();
        
        console.log("All progress reset to defaults");
    },
    
    /**
     * Updates grid dimensions
     * @param {number} rows - New row count
     * @param {number} cols - New column count
     */
    updateGridSize(rows, cols) {
        if (rows >= 3 && cols >= 3 && rows <= 20 && cols <= 20) {
            this.grid.rows = rows;
            this.grid.cols = cols;
            return true;
        }
        return false;
    },
    
    /**
     * Updates the system chaos/order balance based on the current level
     * @param {Array} tileData - 2D array of tile data
     * @returns {Object} Updated system balance information
     */
    updateSystemBalance(tileData) {
        let totalChaos = 0;
        const rows = this.grid.rows;
        const cols = this.grid.cols;
        
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                totalChaos += tileData[r][c].chaos;
            }
        }
        
        const avgChaos = totalChaos / (rows * cols);
        this.progress.systemChaos = avgChaos;
        this.progress.systemOrder = 1 - avgChaos;
        
        const orderContribution = this.progress.systemOrder - 0.5;
        this.progress.orderContributions += orderContribution;
        
        if (this.progress.systemOrder > 0.5) {
            this.progress.levelsWithPositiveOrder = (this.progress.levelsWithPositiveOrder || 0) + 1;
            
            // Check for orderKeeper trait
            if (this.progress.levelsWithPositiveOrder >= 5 && !this.progress.traits.includes('orderKeeper')) {
                this.progress.traits.push('orderKeeper');
                return { newTrait: 'orderKeeper' };
            }
        }
        
        return {
            systemChaos: this.progress.systemChaos,
            systemOrder: this.progress.systemOrder,
            levelsWithPositiveOrder: this.progress.levelsWithPositiveOrder
        };
    },
    
    /**
     * Determines the type of a tile based on its chaos level and world age
     * @param {number} chaos - Chaos level of the tile (0-1)
     * @returns {string} The type of the tile
     */
    determineTileType(chaos) {
        const worldAge = this.worldEvolution.age;
        let tileType = 'normal';
        
        // Early game has more basic tile types
        if (worldAge < 3) {
            if (chaos > 0.7) {
                tileType = Math.random() < 0.7 ? 'blocked' : 'water';
            } else if (chaos < 0.3) {
                tileType = Math.random() < 0.7 ? 'normal' : 'energy';
            } else {
                tileType = 'normal';
            }
        }
        // Mid game introduces more variety
        else if (worldAge < 7) {
            if (chaos > 0.8) {
                tileType = 'blocked';
            } else if (chaos > 0.6) {
                tileType = Math.random() < 0.6 ? 'water' : 'normal';
            } else if (chaos > 0.4) {
                tileType = 'normal';
            } else if (chaos > 0.2) {
                tileType = Math.random() < 0.7 ? 'normal' : 'energy';
            } else {
                tileType = 'energy';
            }
        }
        // Late game has full variety
        else {
            if (chaos > 0.8) {
                tileType = 'blocked';
            } else if (chaos > 0.6) {
                tileType = Math.random() < 0.5 ? 'water' : 'normal';
            } else if (chaos > 0.4) {
                tileType = 'normal';
            } else if (chaos > 0.2) {
                tileType = Math.random() < 0.5 ? 'normal' : 'energy';
            } else {
                tileType = 'energy';
            }
        }
        
        return tileType;
    }
};

let isGameActive = true; // Tracks if the game is active or finished
let tileData; // Declare tileData in the outer scope
/**
 * MetricsTracker - Object to track and manage game metrics
 * Handles recording and calculating various gameplay statistics
 */
const MetricsTracker = {
    // Core metrics
    turnsTaken: 0,
    sensesMade: 0,
    pokesMade: 0,
    energyUsedForMovement: 0,
    energyUsedForExploration: 0,
    movesMade: 0,
    restsTaken: 0,
    tilesExplored: 0,
    specialTilesInteracted: 0,

    // Update methods
    incrementTurns() { this.turnsTaken++; },
    incrementSenses() { this.sensesMade++; },
    incrementPokes() { this.pokesMade++; },
    addEnergyForMovement(cost) { this.energyUsedForMovement += cost; },
    addEnergyForExploration(cost) { this.energyUsedForExploration += cost; },
    incrementMoves() { this.movesMade++; },
    incrementRests() { this.restsTaken++; },
    incrementTilesExplored() { this.tilesExplored++; },
    incrementSpecialTiles() { this.specialTilesInteracted++; },

    // Reset for new levels
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

    // Derived metrics
    getEnergyUsageRatio() {
        const totalEnergy = this.energyUsedForMovement + this.energyUsedForExploration;
        return totalEnergy > 0 ? this.energyUsedForMovement / totalEnergy : 0;
    },
    getMovementEfficiency(safestPathLength) {
        return this.movesMade > 0 ? safestPathLength / this.movesMade : 0;
    }
};

let victoryScreenContent = '';

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing game...");
    
    // Initialize game state
    GameState.init();
    
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
    let energy = GameState.player.energy;
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
    
    // Create particles
    createParticles(25);
    
    // Attach event listeners for the evolution system
    attachEvolutionListeners();
    
    // Attach event listeners for the events system
    attachEventsListeners();
    
    // Initialize the game
    startGame();
});

/**
 * Creates particle effects in the game background
 * @param {number} count - Number of particles to create
 */
    function createParticles(count) {
        const container = document.createElement('div');
        container.classList.add('particle-container');
        document.body.appendChild(container);
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${5 + Math.random() * 8}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(particle);
        }
    }

/**
 * Highlights tiles that can be interacted with based on the current action
 * @param {string} action - The action to highlight tiles for ('move', 'sense', 'poke', 'stabilize')
 */
    function highlightTiles(action) {
        console.log(`Highlighting tiles for action: ${action}`);
        
        // Clear previous highlights
        document.querySelectorAll('.highlighted').forEach(el => {
            el.classList.remove('highlighted');
        });
        
        // Update current action
        window.currentAction = action;
        GameState.player.currentAction = action;
        
        // Get the player's current position
        const currentRow = window.currentRow;
        const currentCol = window.currentCol;
        
        console.log(`Player position: [${currentRow}, ${currentCol}]`);
        
        // Get range based on action
        let range = 1; // Default range
        
        if (action === 'move') {
            // For move, range is based on movement range stat
            range = GameState.progress.stats.movementRange || 1;
            console.log(`Movement range: ${range}`);
        } else if (action === 'sense' || action === 'poke' || action === 'stabilize') {
            // These actions typically have a range of 1
            range = 1;
        }
        
        // Get tiles within range
        const tilesInRange = getTilesInRange(currentRow, currentCol, range);
        console.log(`Found ${tilesInRange.length} tiles in range`);
        
        // Highlight each tile based on action type
        tilesInRange.forEach(pos => {
            // Extract row and col from the position object
            const row = pos.row;
            const col = pos.col;
            const tileId = `hex-${row}-${col}`;
            const tileElement = document.getElementById(tileId);
            
            if (!tileElement) {
                console.warn(`Tile element not found: ${tileId}`);
                return;
            }
            
            // Check if this is a valid tile for the action
            let isValidTile = false;
            
            if (action === 'move') {
                // Can move to tiles that aren't blocked and aren't occupied by the player
                const tileType = window.tileData[row][col].type;
                isValidTile = tileType !== 'blocked' && !(row === currentRow && col === currentCol);
            } else if (action === 'sense') {
                // Can sense any adjacent tile
                isValidTile = !(row === currentRow && col === currentCol);
            } else if (action === 'poke') {
                // Can poke any adjacent tile that isn't already stable
                const stability = window.tileData[row][col].stability || 0;
                isValidTile = stability < 1 && !(row === currentRow && col === currentCol);
            } else if (action === 'stabilize') {
                // Can stabilize the current tile
                isValidTile = (row === currentRow && col === currentCol);
            }
            
            // Add highlight if valid
            if (isValidTile) {
                tileElement.classList.add('highlighted');
                
                // Add click event for the highlighted tile
                tileElement.addEventListener('click', function onTileClick() {
                    console.log(`Clicked on tile: ${tileId} for action: ${action}`);
                    
                    // Remove highlight and click event after action
                    document.querySelectorAll('.highlighted').forEach(el => {
                        el.classList.remove('highlighted');
                        el.removeEventListener('click', onTileClick);
                    });
                    
                    // Perform the action
                    if (action === 'move') {
                        moveToTile(row, col);
                    } else if (action === 'sense') {
                        senseTile(row, col);
                    } else if (action === 'poke') {
                        pokeTile(row, col);
                    } else if (action === 'stabilize') {
                        stabilizeTile(row, col);
                    }
                    
                    // Reset current action
                    window.currentAction = null;
                    GameState.player.currentAction = null;
                });
            }
        });
        
        console.log(`Highlighted ${document.querySelectorAll('.highlighted').length} tiles`);
    }

/**
 * Updates visible tiles based on player's vision range
 * Clears fog of war permanently for explored tiles
 */
    function updateVision() {
    // Default vision range is 1
    let visionRange = 1;
    
    // Apply Enhanced Vision trait if active
    if (GameState.evolution.activeTraits.some(trait => trait.effect === 'vision_range_+1')) {
        visionRange += 1;
    }
    
    const visibleTiles = getTilesInRange(window.currentRow, window.currentCol, visionRange);

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
    }

/**
 * Gets all tiles within a specified range from a position
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @param {number} range - Vision range
 * @returns {Array} Array of tile positions within range
 */
    function getTilesInRange(row, col, range) {
        const tiles = [];
    const rows = window.rows;
    const cols = window.cols;
    
        for (let r = Math.max(0, row - range); r <= Math.min(rows - 1, row + range); r++) {
            for (let c = Math.max(0, col - range); c <= Math.min(cols - 1, col + range); c++) {
                const distance = Math.max(Math.abs(r - row), Math.abs(c - col));
                if (distance <= range) tiles.push({ row: r, col: c });
            }
        }
        return tiles;
    }

/**
 * Creates the initial tile data structure
 * @param {number} rows - Number of rows in the grid
 * @param {number} cols - Number of columns in the grid
 * @returns {Array} 2D array of tile data
 */
    function createTileData(rows, cols) {
    console.log(`Creating tile data: ${rows}x${cols}`);
    
        const tileData = [];
    const globalChaos = GameState.worldEvolution.globalChaos;
    const variance = GameState.worldEvolution.tileVariance;
    
    console.log(`Global chaos: ${globalChaos}, Variance: ${variance}`);
    
        for (let row = 0; row < rows; row++) {
            tileData[row] = [];
            for (let col = 0; col < cols; col++) {
            // Calculate chaos level with some variance
            // More variance at the edges of the grid (representing frontier areas)
            const edgeFactor = Math.max(
                Math.abs(row / rows - 0.5) * 2,
                Math.abs(col / cols - 0.5) * 2
            );
            const extraVariance = edgeFactor * variance * 0.5;
            
            // Generate chaos value with variance
            let chaos = globalChaos + (Math.random() * 2 - 1) * (variance + extraVariance);
            
            // Ensure chaos stays within 0-1 range
            chaos = Math.max(0.1, Math.min(0.9, chaos));
            
            // Create special pockets of order/chaos
            if (Math.random() < 0.1) {
                // 10% chance of a special pocket
                if (Math.random() < 0.5) {
                    // Order pocket
                    chaos = Math.max(0.1, chaos - 0.3);
                } else {
                    // Chaos pocket
                    chaos = Math.min(0.9, chaos + 0.3);
                }
            }
            
                tileData[row][col] = {
                type: 'normal', // Will be set in placeTiles
                    effects: [],
                    state: 'active',
                    explored: false,
                chaos: chaos,
                order: 1 - chaos
                };
            }
        }
    
    console.log(`Tile data created with ${rows * cols} tiles`);
        return tileData;
    }

/**
 * Gets positions that are not part of the main path
 * @param {number} rows - Number of rows in the grid
 * @param {number} cols - Number of columns in the grid
 * @returns {Array} Array of positions not on the main path
 */
    function getNonPathPositions(rows, cols) {
        const path = [];
        for (let col = 0; col < cols; col++) path.push({ row: 0, col });
        for (let row = 1; row < rows; row++) path.push({ row, col: cols - 1 });

        const nonPathPositions = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const isPath = path.some(p => p.row === row && p.col === col);
                const isStartOrGoal = (row === 0 && col === 0) || (row === rows - 1 && col === cols - 1);
                if (!isPath && !isStartOrGoal) {
                    nonPathPositions.push({ row, col });
                }
            }
        }
        return nonPathPositions;
    }

/**
 * Places different tile types on the grid
 * @param {Array} tileData - 2D array of tile data
 * @param {number} rows - Number of rows in the grid
 * @param {number} cols - Number of columns in the grid
 */
    function placeTiles(tileData, rows, cols) {
    console.log(`Placing tiles on ${rows}x${cols} grid`);
    
    // Always set the goal tile
        tileData[rows - 1][cols - 1].type = 'goal';
    console.log(`Goal tile set at [${rows - 1}, ${cols - 1}]`);
    
    // Get non-path positions
        let nonPathPositions = getNonPathPositions(rows, cols);
    console.log(`Got ${nonPathPositions.length} non-path positions`);
    
    // Shuffle non-path positions
        for (let i = nonPathPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nonPathPositions[i], nonPathPositions[j]] = [nonPathPositions[j], nonPathPositions[i]];
        }

    // Place Zoe if not found yet
    if (!GameState.progress.hasFoundZoe) {
            const zoeRow = 2;
            const zoeCol = 2;
            tileData[zoeRow][zoeCol].type = 'zoe';
        console.log(`Zoe placed at [${zoeRow}, ${zoeCol}]`);
            nonPathPositions = nonPathPositions.filter(pos => !(pos.row === zoeRow && pos.col === zoeCol));
        }

    // Place a key
        if (nonPathPositions.length > 0) {
        const keyPos = nonPathPositions.shift();
        tileData[keyPos.row][keyPos.col].type = 'key';
        console.log(`Key placed at [${keyPos.row}, ${keyPos.col}]`);
    }
    
    // Determine tile types based on chaos levels
    let blockedCount = 0;
    let waterCount = 0;
    let energyCount = 0;
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // Skip already assigned tiles (goal, zoe, key)
            if (tileData[row][col].type !== 'normal') {
                continue;
            }
            
            // Skip the start position
            if (row === 0 && col === 0) {
                continue;
            }
            
            // Determine tile type based on chaos level
            const chaos = tileData[row][col].chaos;
            const tileType = GameState.determineTileType(chaos);
            tileData[row][col].type = tileType;
            
            // Count tile types
            if (tileType === 'blocked') blockedCount++;
            if (tileType === 'water') waterCount++;
            if (tileType === 'energy') energyCount++;
        }
    }
    
    console.log(`Placed ${blockedCount} blocked tiles, ${waterCount} water tiles, ${energyCount} energy tiles`);
    
    // Ensure there is a traversable path from start to goal
    ensureTraversablePath(tileData, rows, cols);
    console.log("Ensured traversable path");
}

/**
 * Ensures there is a traversable path from start to goal
 * @param {Array} tileData - 2D array of tile data
 * @param {number} rows - Number of rows in the grid
 * @param {number} cols - Number of columns in the grid
 */
function ensureTraversablePath(tileData, rows, cols) {
    // Define a guaranteed path from start to goal
    // This path will follow the top row and then the rightmost column
    const guaranteedPath = [];
    
    // Add top row to path
    for (let col = 0; col < cols; col++) {
        guaranteedPath.push({ row: 0, col });
    }
    
    // Add rightmost column to path (excluding the top-right corner which is already included)
    for (let row = 1; row < rows; row++) {
        guaranteedPath.push({ row, col: cols - 1 });
    }
    
    // Clear any blocked tiles along the guaranteed path
    guaranteedPath.forEach(pos => {
        if (tileData[pos.row][pos.col].type === 'blocked' || tileData[pos.row][pos.col].type === 'water') {
            tileData[pos.row][pos.col].type = 'normal';
            
            // Also adjust chaos/order levels to be more favorable
            tileData[pos.row][pos.col].chaos = Math.min(tileData[pos.row][pos.col].chaos, 0.6);
            tileData[pos.row][pos.col].order = 1 - tileData[pos.row][pos.col].chaos;
        }
    });
    
    // Verify path using pathfinding
    const pathExists = verifyPath(tileData, 0, 0, rows - 1, cols - 1);
    
    // If no path exists (which shouldn't happen with our guaranteed path, but just in case),
    // create a direct path
    if (!pathExists) {
        console.warn("Path verification failed, creating direct path");
        createDirectPath(tileData, 0, 0, rows - 1, cols - 1);
    }
}

/**
 * Verifies if a path exists from start to goal using breadth-first search
 * @param {Array} tileData - 2D array of tile data
 * @param {number} startRow - Starting row
 * @param {number} startCol - Starting column
 * @param {number} goalRow - Goal row
 * @param {number} goalCol - Goal column
 * @returns {boolean} Whether a path exists
 */
function verifyPath(tileData, startRow, startCol, goalRow, goalCol) {
    const rows = tileData.length;
    const cols = tileData[0].length;
    
    // Create a visited array
    const visited = Array(rows).fill().map(() => Array(cols).fill(false));
    
    // Queue for BFS
    const queue = [{ row: startRow, col: startCol }];
    visited[startRow][startCol] = true;
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        // Check if we've reached the goal
        if (current.row === goalRow && current.col === goalCol) {
            return true;
        }
        
        // Get adjacent tiles
        const adjacentTiles = getAdjacentTiles(current.row, current.col);
        
        // Check each adjacent tile
        for (const tile of adjacentTiles) {
            // Skip if already visited
            if (visited[tile.row][tile.col]) continue;
            
            // Skip if blocked or water
            if (tileData[tile.row][tile.col].type === 'blocked' || 
                tileData[tile.row][tile.col].type === 'water') continue;
            
            // Mark as visited and add to queue
            visited[tile.row][tile.col] = true;
            queue.push(tile);
        }
    }
    
    // If we've exhausted the queue without finding the goal, no path exists
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
 * Builds the hexagonal grid for the game
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @param {Array} tileData - 2D array containing tile data
 */
function buildGrid(rows, cols, tileData) {
    console.log(`Building grid: ${rows}x${cols}`);
    
    // Access grid configuration
    const hexVisualWidth = window.hexVisualWidth || GameState.grid.hexVisualWidth;
    const hexHeight = window.hexHeight || GameState.grid.hexHeight;
    const rowOffset = window.rowOffset || GameState.grid.rowOffset;
    const colOffset = window.colOffset || GameState.grid.colOffset;
    
    console.log(`Grid config: hexVisualWidth=${hexVisualWidth}, hexHeight=${hexHeight}, rowOffset=${rowOffset}, colOffset=${colOffset}`);
    
    // Get the grid element
    const grid = document.getElementById('grid');
    if (!grid) {
        console.error("Grid element not found");
        return;
    }
    
    // Clear existing grid
    grid.innerHTML = '';
    
    // Calculate total width and height of the grid
    const totalWidth = cols * colOffset;
    const totalHeight = (rows * rowOffset) + (hexHeight * 0.25);
    
    console.log(`Grid dimensions: ${totalWidth}x${totalHeight}`);
    
    // Set grid dimensions
    grid.style.width = `${totalWidth}px`;
    grid.style.height = `${totalHeight}px`;
    
    // Create hexagons for each tile
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
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
            
            // Add stability indicator if tile has stability
            if (tileData[r][c].stability && tileData[r][c].stability > 0) {
                const stabilityIndicator = document.createElement('div');
                stabilityIndicator.className = 'stability-indicator';
                stabilityIndicator.style.opacity = tileData[r][c].stability;
                hexContainer.appendChild(stabilityIndicator);
            }
        }
    }
    
    console.log(`Grid built with ${rows * cols} tiles`);
}

/**
 * Attaches event listeners to the victory screen elements
 */
    function attachVictoryScreenListeners() {
        const statsWindow = document.getElementById('stats-window');
        document.getElementById('view-stats-btn').addEventListener('click', () => {
            restoreStatsWindow();
            updateStatsWindow();
            statsWindow.style.display = 'block';
        });
        document.getElementById('next-level-btn').addEventListener('click', () => {
            statsWindow.style.display = 'none';
        GameState.isActive = true;
            isGameActive = true;
            startGame();
        });
        document.getElementById('upgrade-btn').addEventListener('click', () => {
        const upgradeCost = 5;
        if (GameState.resources.essence >= upgradeCost) {
            // Consume essence
            GameState.updateResource('essence', -upgradeCost);
            essence = GameState.resources.essence; // Update local variable
            
            // Increase movement range
            GameState.progress.stats.movementRange += 1;
            stats.movementRange = GameState.progress.stats.movementRange; // Update local variable
            
            // Save progress
            GameState.saveProgress();
            
            // Update UI
                updateUI();
            
            // Show feedback
            alert(`Movement range increased to ${GameState.progress.stats.movementRange}!`);
            
            // Update the button text to reflect new cost
            const upgradeBtn = document.getElementById('upgrade-btn');
            if (upgradeBtn) {
                upgradeBtn.textContent = `Spend ${Math.min(5, GameState.resources.essence)} Essence: +1 Movement`;
            }
            } else {
                alert('Not enough Essence!');
            }
    });
    
    // Evolution button
    const viewEvolutionBtn = document.getElementById('view-evolution-btn');
    if (viewEvolutionBtn) {
        viewEvolutionBtn.addEventListener('click', () => {
            // Hide stats window
            statsWindow.style.display = 'none';
            
            // Show evolution window
            showEvolutionWindow();
        });
    }
}

/**
 * Ends the current turn and resets movement points
 */
    function endTurn() {
    if (!GameState.isActive) {
            console.log("Level complete—cannot end turn!");
            return;
        }
    
    if (GameState.player.movementPoints > 0) {
            const confirmEnd = confirm("You still have resources left. Are you sure you want to end your turn?");
            if (!confirmEnd) return;
        }
    
    // Reset movement points
    GameState.player.movementPoints = GameState.progress.stats.movementRange;
    movementPoints = GameState.player.movementPoints;
    
    // Increment turn counter
    GameState.player.turnCount++;
    turnCount = GameState.player.turnCount;
    
    // Track metrics
    GameState.metrics.incrementTurns();
    GameState.recentMetrics.incrementTurns();
    
    // Apply stability decay based on world chaos
    const worldChaos = GameState.worldEvolution.globalChaos;
    let stabilityDecay = GameState.resourceRates.stabilityDecayPerTurn * (1 + worldChaos); // More decay in chaotic worlds
    
    // Apply Resilience trait if active
    if (GameState.evolution.activeTraits.some(trait => trait.effect === 'stability_loss_-50%')) {
        stabilityDecay *= 0.5; // Reduce stability loss by 50%
    }
    
    // Apply stability decay
    GameState.updateResource('stability', -stabilityDecay);
    
    // Apply Balancer trait if active
    if (GameState.evolution.activeTraits.some(trait => trait.effect === 'stability_per_turn_+2')) {
        GameState.updateResource('stability', 2); // Gain 2 stability each turn
    }
    
    // Check for world events
    const worldEvents = GameState.checkEvents('world');
    if (worldEvents.length > 0) {
        // Show the first triggered event
        showEventNotification(worldEvents[0]);
    }
    
    // Update UI
        updateUI();
        highlightTiles(null);
    
    console.log(`Turn ${GameState.player.turnCount} ended. MP reset to ${GameState.player.movementPoints}.`);
    }

/**
 * Allows the player to rest, recovering energy at the cost of a turn
 */
function rest() {
    console.log("Resting...");
    
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
    if (GameState.evolution.activeTraits) {
        GameState.evolution.activeTraits.forEach(trait => {
            if (trait.effect === 'enhanced_rest') {
                GameState.updateResource('energy', 2); // Additional energy
                GameState.updateResource('stability', 1); // Bonus stability
            }
        });
    }
    
    // Check for rest-based events
    const triggeredEvents = GameState.checkEvents('rest');
    if (triggeredEvents && triggeredEvents.length > 0) {
        showEventNotification(triggeredEvents[0]);
    }
    
    // Evolve the world (small chance when resting)
    if (Math.random() < 0.3) {
        GameState.evolveWorld();
    }
    
    // Update UI
    updateUI();
    
    showNotification(`Rested and recovered ${energyRestoreOnRest} energy.`);
    console.log(`Rested and recovered ${energyRestoreOnRest} energy.`);
}

/**
 * Updates the statistics window with current metrics
 */
    function updateStatsWindow() {
        const safeUpdate = (id, text) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = text;
            } else {
                console.warn(`Element with id '${id}' not found.`);
            }
        };
    safeUpdate('recent-turns', `Turns: ${GameState.recentMetrics.turnsTaken}`);
    safeUpdate('recent-senses', `Senses: ${GameState.recentMetrics.sensesMade}`);
    safeUpdate('recent-pokes', `Pokes: ${GameState.recentMetrics.pokesMade}`);
    const recentEnergyRatio = GameState.recentMetrics.getEnergyUsageRatio().toFixed(2);
        safeUpdate('recent-energy-ratio', `Energy Ratio: ${recentEnergyRatio}`);
        const safestPathLength = 2 * (Math.min(rows, cols) - 1);
    const recentEfficiency = GameState.recentMetrics.getMovementEfficiency(safestPathLength).toFixed(2);
        safeUpdate('recent-efficiency', `Efficiency: ${recentEfficiency}`);
    safeUpdate('general-turns', `Total Turns: ${GameState.progress.totalTurns || 0}`);
    safeUpdate('general-senses', `Total Senses: ${GameState.progress.sensesMade || 0}`);
    safeUpdate('general-pokes', `Total Pokes: ${GameState.progress.pokesMade || 0}`);
        safeUpdate('general-energy-ratio', `Energy Ratio: N/A`);
        safeUpdate('general-efficiency', `Efficiency: N/A`);
    }

/**
 * Displays the game over screen when player runs out of energy
 */
    function showLoseScreen() {
        const statsWindow = document.getElementById('stats-window');
        if (statsWindow) {
            statsWindow.innerHTML = `
                <h2>Energy Depleted!</h2>
                <p>You ran out of energy before reaching the goal.</p>
                <p>Turns: ${turnCount}</p>
            <p>Senses Made: ${GameState.progress.sensesMade}</p>
            <p>Pokes Made: ${GameState.progress.pokesMade}</p>
                <button id="restart-btn">Restart Level</button>
                <button id="view-stats-btn">View Stats</button>
            `;
            statsWindow.style.display = 'block';
            document.getElementById('restart-btn').addEventListener('click', () => {
                statsWindow.style.display = 'none';
            GameState.isActive = true;
                isGameActive = true;
                startGame();
            });
            document.getElementById('view-stats-btn').addEventListener('click', () => {
                restoreStatsWindow();
                updateStatsWindow();
                document.getElementById('stats-window').style.display = 'block';
            });
        }
    GameState.isActive = false;
        isGameActive = false;
    }

/**
 * Restores the stats window to its default state
 */
    function restoreStatsWindow() {
        const statsWindow = document.getElementById('stats-window');
        let buttonText = isGameActive ? "Close" : "Back to Victory Screen";
        statsWindow.innerHTML = `
            <div class="stats-columns">
                <div class="column recent-knowledge">
                    <h2>Recent Knowledge</h2>
                    <p id="recent-turns">Turns: 0</p>
                    <p id="recent-senses">Senses: 0</p>
                    <p id="recent-pokes">Pokes: 0</p>
                    <p id="recent-energy-ratio">Energy Ratio: 0.00</p>
                    <p id="recent-efficiency">Efficiency: 0.00</p>
                </div>
                <div class="column general-stats">
                    <h2>General Stats</h2>
                    <p id="general-turns">Total Turns: 0</p>
                    <p id="general-senses">Total Senses: 0</p>
                    <p id="general-pokes">Total Pokes: 0</p>
                    <p id="general-energy-ratio">Energy Ratio: N/A</p>
                    <p id="general-efficiency">Efficiency: N/A</p>
                </div>
            </div>
            <button id="close-stats-btn">${buttonText}</button>
        `;
        document.getElementById('close-stats-btn').addEventListener('click', () => {
            if (isGameActive) {
                statsWindow.style.display = 'none';
            } else {
                if (victoryScreenContent) {
                    statsWindow.innerHTML = victoryScreenContent;
                    statsWindow.style.display = 'block';
                    attachVictoryScreenListeners();
                } else {
                    statsWindow.style.display = 'none';
                }
            }
        });
    }

/**
 * Initializes or restarts the game with current settings
 */
    function startGame() {
        console.log("Starting game...");
        
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
        
        console.log(`Grid size: ${GameState.grid.rows}x${GameState.grid.cols}`);
        
        // Create the tile data
        window.tileData = createTileData(GameState.grid.rows, GameState.grid.cols);
        GameState.tileData = window.tileData;
        console.log("Tile data created");
        
        // Place tiles on the grid
        placeTiles(window.tileData, GameState.grid.rows, GameState.grid.cols);
        console.log("Tiles placed");
        
        // Build the grid
        buildGrid(GameState.grid.rows, GameState.grid.cols, window.tileData);
        console.log("Grid built");
        
        // Hide all character elements initially
        const playerElement = document.getElementById('player');
        if (playerElement) {
            playerElement.style.display = 'block';
            
            // Position player at starting position
            const startHex = document.getElementById(`hex-${window.currentRow}-${window.currentCol}`);
            if (startHex) {
                const hexRect = startHex.getBoundingClientRect();
                const gridRect = document.getElementById('grid').getBoundingClientRect();
                
                playerElement.style.left = `${hexRect.left - gridRect.left + hexRect.width / 2 - playerElement.offsetWidth / 2}px`;
                playerElement.style.top = `${hexRect.top - gridRect.top + hexRect.height / 2 - playerElement.offsetHeight / 2}px`;
            }
        }
        
        const zoeElement = document.getElementById('zoe-character');
        if (zoeElement) {
            // Only show Zoe if she's placed on the grid
            let zoeFound = false;
            for (let r = 0; r < GameState.grid.rows; r++) {
                for (let c = 0; c < GameState.grid.cols; c++) {
                    if (window.tileData[r][c].type === 'zoe') {
                        zoeFound = true;
                        const zoeHex = document.getElementById(`hex-${r}-${c}`);
                        if (zoeHex) {
                            const hexRect = zoeHex.getBoundingClientRect();
                            const gridRect = document.getElementById('grid').getBoundingClientRect();
                            
                            zoeElement.style.left = `${hexRect.left - gridRect.left + hexRect.width / 2 - zoeElement.offsetWidth / 2}px`;
                            zoeElement.style.top = `${hexRect.top - gridRect.top + hexRect.height / 2 - zoeElement.offsetHeight / 2}px`;
                            zoeElement.style.display = 'block';
                        }
                    }
                }
            }
            
            if (!zoeFound) {
                zoeElement.style.display = 'none';
            }
        }
        
        // Make goal visible if player has key
        if (GameState.level.hasKey) {
            // Find goal tile
            for (let r = 0; r < GameState.grid.rows; r++) {
                for (let c = 0; c < GameState.grid.cols; c++) {
                    if (window.tileData[r][c].type === 'goal') {
                        const goalHex = document.getElementById(`hex-${r}-${c}`);
                        if (goalHex) {
                            goalHex.classList.add('goal-visible');
                        }
                    }
                }
            }
        }
        
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
        GameState.applyTraitEffects();
        
        // Check for world events
        const triggeredEvents = GameState.checkEvents('gameStart');
        console.log("World events checked:", triggeredEvents);
        
        // Show event notification for triggered events
        if (triggeredEvents && triggeredEvents.length > 0) {
            showEventNotification(triggeredEvents[0]);
        }
        
        // Create notification element if it doesn't exist
        if (!document.getElementById('notification')) {
            const notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            document.body.appendChild(notification);
            
            // Add CSS for notification
            const style = document.createElement('style');
            style.textContent = `
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
            `;
            document.head.appendChild(style);
        }
        
        // Update vision for the starting position
        updateVision();
        
        // Update UI
        updateUI();
        
        // Set game to active
        GameState.isActive = true;
        window.isGameActive = true;
        
        // Hide all windows
        document.getElementById('stats-window').style.display = 'none';
        document.getElementById('evolution-window').style.display = 'none';
        document.getElementById('events-window').style.display = 'none';
        document.getElementById('event-notification').style.display = 'none';
        
        console.log("Game started successfully");
    }

/**
 * Updates all UI elements with current game state
 */
function updateUI() {
    console.log("Updating UI...");
    
    // Get UI element references
    const turnDisplay = document.getElementById('turn-counter');
    const statsDisplay = document.getElementById('stats-display');
    const traitsDisplay = document.getElementById('traits-display');
    const tempInventoryDisplay = document.getElementById('temp-inventory-display');
    const persistentInventoryDisplay = document.getElementById('persistent-inventory-display');
    
    if (turnDisplay) {
        turnDisplay.textContent = `Turns: ${GameState.player.turnCount}`;
    } else {
        console.warn("Turn counter element not found");
    }
    
    if (statsDisplay) {
        statsDisplay.textContent = `Moves: ${GameState.progress.stats.movementRange} | Luck: ${GameState.progress.stats.luck} | XP: ${GameState.progress.xp}`;
    } else {
        console.warn("Stats display element not found");
    }
    
    if (traitsDisplay) {
        traitsDisplay.textContent = `Traits: ${GameState.progress.traits.length > 0 ? GameState.progress.traits.join(', ') : 'None'}`;
    } else {
        console.warn("Traits display element not found");
    }
    
    if (tempInventoryDisplay) {
        tempInventoryDisplay.textContent = `Level Items: ${GameState.level.temporaryInventory.length > 0 ? GameState.level.temporaryInventory.join(', ') : 'None'}`;
    } else {
        console.warn("Temporary inventory display element not found");
    }
    
    if (persistentInventoryDisplay) {
        persistentInventoryDisplay.textContent = `Persistent Items: ${GameState.progress.persistentInventory.length > 0 ? GameState.progress.persistentInventory.join(', ') : 'None'}`;
    } else {
        console.warn("Persistent inventory display element not found");
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
    } else {
        console.warn("System balance element not found");
    }
    
    // Update local variables for compatibility
    window.turnCount = GameState.player.turnCount;
    window.energy = GameState.resources.energy;
    window.movementPoints = GameState.player.movementPoints;
    
    console.log("UI updated");
}

/**
 * Updates a resource display in the UI
 * @param {string} resourceType - Type of resource ('energy', 'essence', 'knowledge', 'stability')
 * @param {number} value - Current value
 * @param {number} max - Maximum value
 * @param {boolean} animate - Whether to animate the change
 */
function updateResourceDisplay(resourceType, value, max, animate = false) {
    const bar = document.getElementById(`${resourceType}-bar`);
    const valueDisplay = document.getElementById(`${resourceType}-value`);
    
    if (bar && valueDisplay) {
        // Calculate percentage
        const percentage = Math.min(100, Math.max(0, (value / max) * 100));
        
        // Update bar width
        bar.style.width = `${percentage}%`;
        
        // Update value text
        valueDisplay.textContent = `${Math.round(value)}/${max}`;
        
        // Apply animation if requested
        if (animate) {
            bar.classList.add('resource-change');
            setTimeout(() => {
                bar.classList.remove('resource-change');
            }, 500);
        }
        
        // Update color for stability based on value
        if (resourceType === 'stability') {
            if (value < 30) {
                bar.style.background = 'linear-gradient(to right, #ff3300, #ff6600)';
            } else if (value < 70) {
                bar.style.background = 'linear-gradient(to right, #ffcc00, #ffff00)';
            } else {
                bar.style.background = 'linear-gradient(to right, #00cc66, #00ffcc)';
            }
        }
    }
}

/**
 * Gets all adjacent tiles to a given position
 * @param {number} row - Current row
 * @param {number} col - Current column
 * @returns {Array} Array of adjacent tile positions
 */
function getAdjacentTiles(row, col) {
    const isOddRow = row % 2 === 1;
    const adjacent = [
        { row: row - 1, col: col },
        { row: row + 1, col: col },
        { row: row, col: col - 1 },
        { row: row, col: col + 1 },
        { row: row - 1, col: isOddRow ? col + 1 : col - 1 },
        { row: row + 1, col: isOddRow ? col + 1 : col - 1 }
    ];
    return adjacent.filter(tile => tile.row >= 0 && tile.row < rows && tile.col >= 0 && tile.col < cols);
}

document.getElementById('move-btn').addEventListener('click', () => {
    GameState.player.currentAction = 'move';
    currentAction = 'move'; // Update local variable for compatibility
    highlightTiles('move');
});

document.getElementById('sense-btn').addEventListener('click', () => {
    GameState.player.currentAction = 'sense';
    currentAction = 'sense'; // Update local variable for compatibility
    highlightTiles('sense');
});

document.getElementById('stabilize-btn').addEventListener('click', () => {
    GameState.player.currentAction = 'stabilize';
    currentAction = 'stabilize'; // Update local variable for compatibility
    highlightTiles('stabilize');
});

document.getElementById('poke-btn').addEventListener('click', () => {
    GameState.player.currentAction = 'poke';
    currentAction = 'poke'; // Update local variable for compatibility
    highlightTiles('poke');
});

document.getElementById('end-turn-btn').addEventListener('click', endTurn);

document.getElementById('rest-btn').addEventListener('click', rest);

/**
 * Updates the evolution UI with current player evolution progress
 */
function updateEvolutionUI() {
    console.log("Updating evolution UI...");
    
    // Check if evolution system is initialized
    if (!GameState.evolution || !GameState.evolution.paths) {
        console.warn("Evolution system not properly initialized");
        return;
    }
    
    // Get the evolution paths container
    const pathsContainer = document.getElementById('evolution-paths');
    if (!pathsContainer) {
        console.error("Evolution paths container not found");
        return;
    }
    
    // Clear existing paths
    pathsContainer.innerHTML = '';
    
    // Add each evolution path
    Object.entries(GameState.evolution.paths).forEach(([pathId, pathData]) => {
        // Create path container
        const pathContainer = document.createElement('div');
        pathContainer.className = `evolution-path ${pathData.unlocked ? 'unlocked' : 'locked'}`;
        pathContainer.id = `path-${pathId}`;
        
        // Path header
        const pathHeader = document.createElement('div');
        pathHeader.className = 'path-header';
        
        const pathName = document.createElement('h3');
        pathName.textContent = pathData.name;
        
        const pathXP = document.createElement('div');
        pathXP.className = 'path-xp';
        pathXP.textContent = `XP: ${pathData.xp}`;
        
        pathHeader.appendChild(pathName);
        pathHeader.appendChild(pathXP);
        
        // Path description
        const pathDesc = document.createElement('p');
        pathDesc.className = 'path-description';
        pathDesc.textContent = pathData.description;
        
        // Path traits
        const traitsContainer = document.createElement('div');
        traitsContainer.className = 'traits-container';
        
        // Get available traits for this path
        const availableTraits = GameState.getAvailableTraits(pathId);
        
        // Add traits to the container
        pathData.traits.forEach(trait => {
            const isUnlocked = trait.unlocked;
            const isLocked = !isUnlocked && !availableTraits.includes(trait.id);
            
            const traitElement = createTraitElement(trait, pathId, isUnlocked, isLocked);
            traitsContainer.appendChild(traitElement);
        });
        
        // Put it all together
        pathContainer.appendChild(pathHeader);
        pathContainer.appendChild(pathDesc);
        pathContainer.appendChild(traitsContainer);
        
        // Add to paths container
        pathsContainer.appendChild(pathContainer);
    });
    
    console.log("Evolution UI updated");
}

/**
 * Creates a trait element for the evolution UI
 * @param {Object} trait - Trait data
 * @param {string} path - Evolution path
 * @param {boolean} unlocked - Whether the trait is unlocked
 * @param {boolean} locked - Whether the trait is locked (level requirement not met)
 * @returns {HTMLElement} Trait element
 */
function createTraitElement(trait, path, unlocked, locked = false) {
    if (!trait || !path) {
        console.error('Invalid trait or path data');
        return document.createElement('div'); // Return empty div
    }
    
    const traitElement = document.createElement('div');
    traitElement.className = `evolution-trait ${unlocked ? 'unlocked' : locked ? 'locked' : ''}`;
    
    const costText = trait.cost ? Object.entries(trait.cost)
        .map(([resource, amount]) => `${resource}: ${amount}`)
        .join(', ') : 'No cost';
    
    traitElement.innerHTML = `
        <h4>${trait.name || 'Unknown Trait'}</h4>
        <div class="evolution-trait-description">${trait.description || 'No description available'}</div>
        <div class="evolution-trait-cost">
            <div class="evolution-trait-cost-item">${costText}</div>
            ${!unlocked && !locked ? `<button class="evolution-trait-unlock-btn" data-path="${path}" data-trait="${trait.id}">Unlock</button>` : ''}
            ${locked ? `<div class="evolution-trait-locked-msg">Requires Level ${trait.level}</div>` : ''}
        </div>
    `;
    
    // Add event listener to unlock button
    if (!unlocked && !locked && trait.cost) {
        const unlockBtn = traitElement.querySelector('.evolution-trait-unlock-btn');
        if (unlockBtn) {
            // Check if player has enough resources
            let canAfford = true;
            for (const [resource, cost] of Object.entries(trait.cost)) {
                if (!GameState.resources || GameState.resources[resource] < cost) {
                    canAfford = false;
                    break;
                }
            }
            
            if (!canAfford) {
                unlockBtn.disabled = true;
                unlockBtn.title = 'Not enough resources';
            } else {
                unlockBtn.addEventListener('click', () => {
                    try {
                        const result = GameState.unlockTrait(path, trait.id);
                        if (result.success) {
                            // Show success message
                    const feedbackMessage = document.getElementById('feedback-message');
                    if (feedbackMessage) {
                                feedbackMessage.textContent = result.message;
                        feedbackMessage.style.display = 'block';
                                setTimeout(() => { feedbackMessage.style.display = 'none'; }, 3000);
                    }
                            
                            // Update UI
                            updateEvolutionUI();
                    updateUI();
                } else {
                            // Show error message
                            alert(result.message);
                        }
                    } catch (error) {
                        console.error('Error unlocking trait:', error);
                        alert('An error occurred while unlocking the trait. Please try again.');
                    }
                });
            }
        }
    }
    
    return traitElement;
}

/**
 * Shows the evolution window
 */
function showEvolutionWindow() {
    const evolutionWindow = document.getElementById('evolution-window');
    if (evolutionWindow) {
        updateEvolutionUI();
        evolutionWindow.style.display = 'block';
    }
}

/**
 * Hides the evolution window
 */
function hideEvolutionWindow() {
    const evolutionWindow = document.getElementById('evolution-window');
    if (evolutionWindow) {
        evolutionWindow.style.display = 'none';
    }
}

/**
 * Attaches event listeners to the evolution window elements
 */
function attachEvolutionListeners() {
    // Tab buttons
    const tabButtons = document.querySelectorAll('.evolution-tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.evolution-tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const path = button.getAttribute('data-path');
            document.getElementById(`${path}-tab`).classList.add('active');
        });
    });
    
    // Close button
    const closeEvolutionBtn = document.getElementById('close-evolution-btn');
    if (closeEvolutionBtn) {
        closeEvolutionBtn.addEventListener('click', hideEvolutionWindow);
    }
    
    // Evolution button in action console
    const evolutionBtn = document.getElementById('evolution-btn');
    if (evolutionBtn) {
        evolutionBtn.addEventListener('click', showEvolutionWindow);
    }
}

/**
 * Updates the events UI
 */
function updateEventsUI() {
    // Check if GameState.events is properly initialized
    if (!GameState.events) {
        console.error('Events system not properly initialized');
        return;
    }
    
    // Update active events
    const activeEventsList = document.getElementById('active-events-list');
    if (activeEventsList) {
        activeEventsList.innerHTML = '';
        
        if (GameState.events.activeEvents && GameState.events.activeEvents.length > 0) {
            GameState.events.activeEvents.forEach(eventId => {
                const event = findEventById(eventId);
                if (event) {
                    const eventElement = createEventElement(event);
                    activeEventsList.appendChild(eventElement);
                }
            });
        } else {
            activeEventsList.innerHTML = '<p class="no-events-message">No active events.</p>';
        }
    }
    
    // Update completed events
    const completedEventsList = document.getElementById('completed-events-list');
    if (completedEventsList) {
        completedEventsList.innerHTML = '';
        
        if (GameState.events.completedEvents && GameState.events.completedEvents.length > 0) {
            // Get the last 10 completed events (most recent first)
            const recentCompletedEvents = [...GameState.events.completedEvents].reverse().slice(0, 10);
            
            recentCompletedEvents.forEach(eventId => {
                const event = findEventById(eventId);
                if (event) {
                    const eventElement = createEventElement(event, true);
                    completedEventsList.appendChild(eventElement);
                }
            });
        } else {
            completedEventsList.innerHTML = '<p class="no-events-message">No completed events.</p>';
        }
    }
    
    // Update event chains
    const chainsEventsList = document.getElementById('chains-events-list');
    if (chainsEventsList) {
        chainsEventsList.innerHTML = '';
        
        if (GameState.events.eventChains && Object.keys(GameState.events.eventChains).length > 0) {
            Object.entries(GameState.events.eventChains).forEach(([chainId, chainData]) => {
                const chainElement = createEventChainElement(chainId, chainData);
                chainsEventsList.appendChild(chainElement);
            });
        } else {
            chainsEventsList.innerHTML = '<p class="no-events-message">No active event chains.</p>';
        }
    }
}

/**
 * Finds an event by its ID
 * @param {string} eventId - ID of the event to find
 * @returns {Object} The event object, or null if not found
 */
function findEventById(eventId) {
    if (!GameState.events || !GameState.events.availableEvents) {
        return null;
    }
    
    // Search in all event pools
    for (const pool of ['early', 'mid', 'late']) {
        if (GameState.events.availableEvents[pool]) {
            const event = GameState.events.availableEvents[pool].find(e => e.id === eventId);
            if (event) {
                return event;
            }
        }
    }
    
    return null;
}

/**
 * Creates an event element for the events UI
 * @param {Object} event - Event data
 * @param {boolean} completed - Whether the event is completed
 * @returns {HTMLElement} Event element
 */
function createEventElement(event, completed = false) {
    if (!event) {
        return document.createElement('div');
    }
    
    const eventElement = document.createElement('div');
    eventElement.className = `event-card ${completed ? 'completed' : ''}`;
    
    // Create type badge
    const typeBadge = document.createElement('span');
    typeBadge.className = `event-type-badge event-type-${event.type}`;
    typeBadge.textContent = event.type;
    
    // Create event content
    eventElement.innerHTML = `
        <h4>${event.name || 'Unknown Event'}</h4>
        <div class="event-description">${event.description || 'No description available'}</div>
        ${event.flavor ? `<p class="event-flavor-text">${event.flavor}</p>` : ''}
        <div class="event-effects">
            ${createEventEffectsHTML(event.effect)}
        </div>
    `;
    
    eventElement.appendChild(typeBadge);
    
    return eventElement;
}

/**
 * Creates HTML for event effects
 * @param {Object} effect - Effect data
 * @returns {string} HTML for the effects
 */
function createEventEffectsHTML(effect) {
    if (!effect || !effect.type) {
        return '<p>No effects</p>';
    }
    
    let html = '';
    
    switch (effect.type) {
        case 'resource_gain':
            for (const [resource, amount] of Object.entries(effect)) {
                if (resource !== 'type' && typeof amount === 'number') {
                    const icon = getResourceIcon(resource);
                    const sign = amount >= 0 ? '+' : '';
                    html += `
                        <div class="event-effect">
                            <div class="event-effect-icon">${icon}</div>
                            <div class="event-effect-text">${sign}${amount} ${resource}</div>
                        </div>
                    `;
                }
            }
            break;
        
        case 'special':
            const specialEffect = effect.special;
            let specialText = 'Special effect';
            let specialIcon = '✨';
            
            switch (specialEffect) {
                case 'reality_anchor':
                    specialText = 'Creates a reality anchor point';
                    specialIcon = '🔱';
                    break;
                case 'consciousness_ally':
                    specialText = 'Consciousness becomes your ally';
                    specialIcon = '👁️';
                    break;
                default:
                    specialText = `Special effect: ${specialEffect}`;
            }
            
            html += `
                <div class="event-effect">
                    <div class="event-effect-icon">${specialIcon}</div>
                    <div class="event-effect-text">${specialText}</div>
                </div>
            `;
            break;
        
        default:
            html = '<p>Unknown effect type</p>';
    }
    
    return html;
}

/**
 * Gets an icon for a resource
 * @param {string} resource - Resource type
 * @returns {string} Icon for the resource
 */
function getResourceIcon(resource) {
    switch (resource) {
        case 'energy': return '⚡';
        case 'essence': return '✨';
        case 'knowledge': return '📚';
        case 'stability': return '⚖️';
        default: return '🔮';
    }
}

/**
 * Creates an event chain element for the events UI
 * @param {string} chainId - ID of the chain
 * @param {Object} chainData - Chain data
 * @returns {HTMLElement} Chain element
 */
function createEventChainElement(chainId, chainData) {
    if (!chainId || !chainData) {
        return document.createElement('div');
    }
    
    // Get chain definition
    const chainDefinition = GameState.events.chains[chainId];
    if (!chainDefinition) {
        return document.createElement('div');
    }
    
    const chainElement = document.createElement('div');
    chainElement.className = 'event-chain-card';
    
    // Calculate progress percentage
    const currentStep = chainData.currentStep || 0;
    const totalSteps = chainDefinition.steps || 1;
    const progressPercentage = (currentStep / totalSteps) * 100;
    
    // Create steps HTML
    let stepsHTML = '';
    if (chainDefinition.stepDetails) {
        chainDefinition.stepDetails.forEach((step, index) => {
            const isCompleted = index < currentStep;
            stepsHTML += `
                <div class="event-chain-step ${isCompleted ? 'completed' : ''}">
                    <div class="event-chain-step-number">${index + 1}</div>
                    <div class="event-chain-step-text">${step.description}</div>
                </div>
            `;
        });
    }
    
    chainElement.innerHTML = `
        <h4>${chainDefinition.name || 'Unknown Chain'}</h4>
        <div class="event-chain-description">${chainDefinition.description || 'No description available'}</div>
        <div class="event-chain-progress">
            <div class="event-chain-progress-bar">
                <div class="event-chain-progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="event-chain-progress-text">Progress: ${currentStep}/${totalSteps}</div>
        </div>
        <div class="event-chain-steps">
            ${stepsHTML}
        </div>
    `;
    
    return chainElement;
}

/**
 * Shows the events window
 */
function showEventsWindow() {
    const eventsWindow = document.getElementById('events-window');
    if (eventsWindow) {
        updateEventsUI();
        eventsWindow.style.display = 'block';
    }
}

/**
 * Hides the events window
 */
function hideEventsWindow() {
    const eventsWindow = document.getElementById('events-window');
    if (eventsWindow) {
        eventsWindow.style.display = 'none';
    }
}

/**
 * Shows an event notification
 * @param {Object} event - Event to show
 */
function showEventNotification(event) {
    if (!event) {
        console.error('No event provided to showEventNotification');
        return;
    }
    
    console.log('Showing event notification:', event);
    
    const notification = document.getElementById('event-notification');
    const title = document.getElementById('event-notification-title');
    const description = document.getElementById('event-notification-description');
    const flavor = document.getElementById('event-notification-flavor');
    const effects = document.getElementById('event-notification-effects');
    
    if (!notification || !title || !description || !flavor || !effects) {
        console.error('Event notification elements not found');
        return;
    }
    
    title.textContent = event.name || 'Event Triggered';
    description.textContent = event.description || '';
    flavor.textContent = event.flavor || '';
    effects.innerHTML = createEventEffectsHTML(event.effect);
    
    notification.style.display = 'flex';
    
    // Apply the event effect
    const effectResult = GameState.applyEventEffect(event);
    console.log('Event effect applied:', effectResult);
    
    // Update UI to reflect changes
    updateUI();
}

/**
 * Hides the event notification
 */
function hideEventNotification() {
    console.log('Hiding event notification');
    const notification = document.getElementById('event-notification');
    if (notification) {
        notification.style.display = 'none';
            } else {
        console.error('Event notification element not found');
    }
}

/**
 * Attaches event listeners to the events window elements
 */
function attachEventsListeners() {
    console.log('Attaching events listeners');
    
    // Tab buttons
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
    
    // Close button
    const closeEventsBtn = document.getElementById('close-events-btn');
    if (closeEventsBtn) {
        closeEventsBtn.addEventListener('click', hideEventsWindow);
    } else {
        console.error('Events window close button not found');
    }
    
    // Events button in action console
    const eventsBtn = document.getElementById('events-btn');
    if (eventsBtn) {
        eventsBtn.addEventListener('click', showEventsWindow);
    } else {
        console.error('Events button not found');
    }
    
    // Event notification close button
    const notificationCloseBtn = document.getElementById('event-notification-close-btn');
    if (notificationCloseBtn) {
        notificationCloseBtn.addEventListener('click', hideEventNotification);
    } else {
        console.error('Event notification close button not found');
    }
}

/**
 * Moves the player to the specified tile
 * @param {number} row - The target row
 * @param {number} col - The target column
 */
function moveToTile(row, col) {
    console.log(`Moving to tile: [${row}, ${col}]`);
    
    // Calculate movement cost (1 energy per tile)
    const movementCost = 1;
    
    // Check if player has enough energy
    if (GameState.resources.energy < movementCost) {
        console.log("Not enough energy to move");
        // Show a message to the player
        alert("Not enough energy to move");
        return;
    }
    
    // Update player position
    const oldRow = window.currentRow;
    const oldCol = window.currentCol;
    window.currentRow = row;
    window.currentCol = col;
    GameState.player.currentRow = row;
    GameState.player.currentCol = col;
    
    // Update player element position
    const playerElement = document.getElementById('player');
    if (playerElement) {
        const hexElement = document.getElementById(`hex-${row}-${col}`);
        if (hexElement) {
            const hexRect = hexElement.getBoundingClientRect();
            const gridRect = document.getElementById('grid').getBoundingClientRect();
            
            playerElement.style.left = `${hexRect.left - gridRect.left + hexRect.width / 2 - playerElement.offsetWidth / 2}px`;
            playerElement.style.top = `${hexRect.top - gridRect.top + hexRect.height / 2 - playerElement.offsetHeight / 2}px`;
        }
    }
    
    // Deduct energy
    GameState.updateResource('energy', -movementCost);
    GameState.metrics.addEnergyForMovement(movementCost);
    GameState.metrics.incrementMoves();
    
    // Update explored tiles
    if (!window.tileData[row][col].explored) {
        window.tileData[row][col].explored = true;
        GameState.metrics.incrementTilesExplored();
    }
    
    // Check for special interactions
    checkTileInteraction(row, col);
    
    // Update vision
    updateVision();
    
    // Update UI
    updateUI();
    
    console.log(`Moved from [${oldRow}, ${oldCol}] to [${row}, ${col}]`);
}

/**
 * Senses the specified tile, revealing information about it
 * @param {number} row - The target row
 * @param {number} col - The target column
 */
function senseTile(row, col) {
    console.log(`Sensing tile: [${row}, ${col}]`);
    
    // Calculate sense cost (1 energy by default)
    const senseCost = 1;
    
    // Check if player has enough energy
    if (GameState.resources.energy < senseCost) {
        console.log("Not enough energy to sense");
        alert("Not enough energy to sense");
        return;
    }
    
    // Deduct energy
    GameState.updateResource('energy', -senseCost);
    GameState.metrics.addEnergyForExploration(senseCost);
    GameState.metrics.incrementSenses();
    
    // Record this tile type as sensed
    const tileType = window.tileData[row][col].type;
    if (!GameState.progress.sensedTypes.includes(tileType)) {
        GameState.progress.sensedTypes.push(tileType);
        
        // Also add to uniqueSensedTypes if needed
        if (!GameState.progress.uniqueSensedTypes.includes(tileType)) {
            GameState.progress.uniqueSensedTypes.push(tileType);
            
            // Grant XP for discovering a new tile type
            GameState.progress.xp += 5;
            showNotification(`Discovered new tile type: ${tileType}! +5 XP`);
        }
    }
    
    // Mark the tile as sensed
    window.tileData[row][col].sensed = true;
    window.currentLevelSenses.push([row, col]);
    GameState.player.currentLevelSenses.push([row, col]);
    
    // Add visual indicator for sensed tile
    const hexElement = document.getElementById(`hex-${row}-${col}`);
    if (hexElement) {
        hexElement.classList.add('sensed');
        
        // Add sensing effect
        const senseEffect = document.createElement('div');
        senseEffect.className = 'sense-effect';
        hexElement.appendChild(senseEffect);
        
        // Remove the effect after animation
        setTimeout(() => {
            hexElement.removeChild(senseEffect);
        }, 1000);
    }
    
    // Check for chaos/order knowledge
    const chaos = window.tileData[row][col].chaos;
    let knowledge = 0;
    
    // More knowledge from high chaos or high order tiles
    if (chaos > 0.8 || chaos < 0.2) {
        knowledge = 2;
    } else if (chaos > 0.7 || chaos < 0.3) {
        knowledge = 1;
    }
    
    if (knowledge > 0) {
        GameState.updateResource('knowledge', knowledge);
        showNotification(`Gained ${knowledge} knowledge from sensing`);
    }
    
    // Check for event triggers
    GameState.checkEvents('sense', { row, col, tileType, chaos });
    
    // Update UI
    updateUI();
    
    console.log(`Sensed tile [${row}, ${col}] of type ${tileType} with chaos ${chaos}`);
}

/**
 * Pokes the specified tile, potentially changing its state
 * @param {number} row - The target row
 * @param {number} col - The target column
 */
function pokeTile(row, col) {
    console.log(`Poking tile: [${row}, ${col}]`);
    
    // Calculate poke cost (2 energy by default)
    const pokeCost = 2;
    
    // Check if player has enough energy
    if (GameState.resources.energy < pokeCost) {
        console.log("Not enough energy to poke");
        alert("Not enough energy to poke");
        return;
    }
    
    // Deduct energy
    GameState.updateResource('energy', -pokeCost);
    GameState.metrics.addEnergyForExploration(pokeCost);
    GameState.metrics.incrementPokes();
    
    // Get the current tile's chaos value
    let chaos = window.tileData[row][col].chaos;
    
    // Base chance of changing the tile
    let changeChance = 0.5;
    
    // Apply stability modifier to chance
    changeChance = GameState.applyStabilityToChance('poke', changeChance);
    
    // Apply trait effects if needed
    if (GameState.progress.traits.includes('enhanced_poke')) {
        changeChance += 0.2;
    }
    
    console.log(`Poke change chance: ${changeChance}`);
    
    // Check if the poke succeeds
    if (Math.random() < changeChance) {
        // Determine new chaos value (random shift)
        const chaosShift = (Math.random() * 0.4) - 0.2; // Between -0.2 and 0.2
        const newChaos = Math.max(0, Math.min(1, chaos + chaosShift));
        
        // Update the tile's chaos value
        window.tileData[row][col].chaos = newChaos;
        
        // Determine if tile type changes
        const oldType = window.tileData[row][col].type;
        const newType = determineTileType(newChaos);
        
        if (oldType !== newType) {
            window.tileData[row][col].type = newType;
            
            // Update tile visually
            const hexElement = document.getElementById(`hex-${row}-${col}`);
            if (hexElement) {
                // Remove old type class
                hexElement.classList.remove(oldType);
                // Add new type class
                hexElement.classList.add(newType);
            }
            
            console.log(`Tile type changed from ${oldType} to ${newType}`);
            showNotification(`Poke successful! Tile changed from ${oldType} to ${newType}`);
        } else {
            console.log(`Tile chaos changed but type remained ${oldType}`);
            showNotification(`Poke successful! Chaos level adjusted`);
        }
        
        // Add poke effect
        const hexElement = document.getElementById(`hex-${row}-${col}`);
        if (hexElement) {
            const pokeEffect = document.createElement('div');
            pokeEffect.className = 'poke-effect';
            hexElement.appendChild(pokeEffect);
            
            // Remove the effect after animation
            setTimeout(() => {
                hexElement.removeChild(pokeEffect);
            }, 1000);
        }
        
        // Get essence based on how much the chaos changed
        const essenceGain = Math.ceil(Math.abs(chaos - newChaos) * 10);
        if (essenceGain > 0) {
            GameState.updateResource('essence', essenceGain);
            showNotification(`Gained ${essenceGain} essence from poking`);
        }
        
        // Update system balance
        GameState.updateSystemBalance(window.tileData);
    } else {
        console.log("Poke failed");
        showNotification("Poke failed. The tile resisted change.");
    }
    
    // Check for event triggers
    GameState.checkEvents('poke', { row, col, success: (Math.random() < changeChance) });
    
    // Update UI
    updateUI();
}

/**
 * Stabilizes the current tile, reducing its chaos or increasing its order
 * @param {number} row - The target row (should be current player position)
 * @param {number} col - The target column (should be current player position)
 */
function stabilizeTile(row, col) {
    console.log(`Stabilizing tile: [${row}, ${col}]`);
    
    // Calculate stabilize cost (3 energy by default)
    const stabilizeCost = 3;
    
    // Check if player has enough energy
    if (GameState.resources.energy < stabilizeCost) {
        console.log("Not enough energy to stabilize");
        alert("Not enough energy to stabilize");
        return;
    }
    
    // Deduct energy
    GameState.updateResource('energy', -stabilizeCost);
    GameState.metrics.addEnergyForExploration(stabilizeCost);
    
    // Get the current tile's stability and chaos
    let stability = window.tileData[row][col].stability || 0;
    let chaos = window.tileData[row][col].chaos;
    
    // If tile is already fully stable, can't stabilize further
    if (stability >= 1) {
        console.log("Tile is already fully stable");
        showNotification("This tile is already fully stable.");
        return;
    }
    
    // Increase stability
    const stabilityIncrease = 0.25; // 25% increase per action
    stability = Math.min(1, stability + stabilityIncrease);
    window.tileData[row][col].stability = stability;
    
    // Decrease chaos slightly
    const chaosReduction = 0.1; // 10% decrease per action
    const newChaos = Math.max(0, chaos - chaosReduction);
    window.tileData[row][col].chaos = newChaos;
    
    // Update visuals
    const hexElement = document.getElementById(`hex-${row}-${col}`);
    if (hexElement) {
        // Add stability indicator
        if (!hexElement.querySelector('.stability-indicator')) {
            const stabilityIndicator = document.createElement('div');
            stabilityIndicator.className = 'stability-indicator';
            hexElement.appendChild(stabilityIndicator);
        }
        
        // Update stability level
        const stabilityIndicator = hexElement.querySelector('.stability-indicator');
        if (stabilityIndicator) {
            stabilityIndicator.style.opacity = stability;
        }
        
        // Add stabilize effect
        const stabilizeEffect = document.createElement('div');
        stabilizeEffect.className = 'stabilize-effect';
        hexElement.appendChild(stabilizeEffect);
        
        // Remove the effect after animation
        setTimeout(() => {
            hexElement.removeChild(stabilizeEffect);
        }, 1000);
    }
    
    // Update game state
    GameState.updateResource('stability', 1);
    GameState.progress.orderContributions++;
    
    // Check if tile type changes due to reduced chaos
    const oldType = window.tileData[row][col].type;
    const newType = determineTileType(newChaos);
    
    if (oldType !== newType) {
        window.tileData[row][col].type = newType;
        
        // Update tile visually
        if (hexElement) {
            // Remove old type class
            hexElement.classList.remove(oldType);
            // Add new type class
            hexElement.classList.add(newType);
        }
        
        console.log(`Tile type changed from ${oldType} to ${newType} due to stabilization`);
    }
    
    // Notification based on stability level
    if (stability >= 1) {
        showNotification("Tile fully stabilized! It will resist chaos changes.");
    } else {
        showNotification(`Tile stability increased to ${Math.round(stability * 100)}%`);
    }
    
    // Check for event triggers
    GameState.checkEvents('stabilize', { row, col, stability });
    
    // Update system balance
    GameState.updateSystemBalance(window.tileData);
    
    // Update UI
    updateUI();
}

/**
 * Shows a notification to the player
 * @param {string} message - The message to display
 */
function showNotification(message) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    } else {
        console.log(`Notification: ${message}`);
    }
}

/**
 * Checks for interactions with special tiles
 * @param {number} row - The row to check
 * @param {number} col - The column to check
 */
function checkTileInteraction(row, col) {
    const tileType = window.tileData[row][col].type;
    
    // Special interactions based on tile type
    if (tileType === 'energy') {
        // Energy tiles provide energy
        const energyGain = 5;
        GameState.updateResource('energy', energyGain);
        showNotification(`Found energy source! +${energyGain} energy`);
        
        // Change tile to normal after collecting
        window.tileData[row][col].type = 'normal';
        window.tileData[row][col].chaos = 0.5;
        
        // Update visual
        const hexElement = document.getElementById(`hex-${row}-${col}`);
        if (hexElement) {
            hexElement.classList.remove('energy');
            hexElement.classList.add('normal');
        }
        
        GameState.metrics.incrementSpecialTiles();
    } else if (tileType === 'water') {
        // Water tiles restore some energy
        const energyGain = 2;
        GameState.updateResource('energy', energyGain);
        showNotification(`Refreshed at water! +${energyGain} energy`);
        
        GameState.metrics.incrementSpecialTiles();
    } else if (tileType === 'goal') {
        // Goal tile completes the level
        if (GameState.level.hasKey || !GameState.level.requiresKey) {
            showNotification("Level complete!");
            GameState.completeLevelProgress(10, GameState.level.foundZoe, GameState.level.hasKey);
        } else {
            showNotification("You need to find the key first!");
        }
    } else if (tileType === 'key') {
        // Key tile gives the key
        GameState.level.hasKey = true;
        window.tileData[row][col].type = 'normal';
        window.tileData[row][col].chaos = 0.5;
        
        // Update visual
        const hexElement = document.getElementById(`hex-${row}-${col}`);
        if (hexElement) {
            hexElement.classList.remove('key');
            hexElement.classList.add('normal');
        }
        
        showNotification("You found the key! Now you can exit through the goal.");
        GameState.metrics.incrementSpecialTiles();
    } else if (tileType === 'zoe') {
        // Zoe tile finds Zoe
        GameState.level.foundZoe = true;
        window.tileData[row][col].type = 'normal';
        window.tileData[row][col].chaos = 0.5;
        
        // Update visual
        const hexElement = document.getElementById(`hex-${row}-${col}`);
        if (hexElement) {
            hexElement.classList.remove('zoe');
            hexElement.classList.add('normal');
            
            // Hide Zoe character
            const zoeElement = document.getElementById('zoe-character');
            if (zoeElement) {
                zoeElement.style.display = 'none';
            }
        }
        
        showNotification("You found Zoe! She will help you on your journey.");
        GameState.metrics.incrementSpecialTiles();
        
        // Update progress
        if (!GameState.progress.hasFoundZoe) {
            GameState.progress.hasFoundZoe = true;
            GameState.progress.xp += 20;
            showNotification("First time finding Zoe! +20 XP");
        }
    }
}

/**
 * Ends the current turn and advances the game state
 */
function endTurn() {
    console.log("Ending turn...");
    
    // Increment turn counter
    GameState.player.turnCount++;
    window.turnCount = GameState.player.turnCount;
    
    // Track in metrics
    GameState.metrics.incrementTurns();
    
    // Restore some energy each turn
    const energyRestorePerTurn = 2;
    GameState.updateResource('energy', energyRestorePerTurn);
    
    // Apply trait effects that happen each turn
    if (GameState.evolution.activeTraits) {
        GameState.evolution.activeTraits.forEach(trait => {
            if (trait.effect === 'all_resources_regen_1') {
                GameState.updateResource('essence', 1);
                GameState.updateResource('knowledge', 1);
                GameState.updateResource('stability', 1);
            }
        });
    }
    
    // Check for turn-based events
    const triggeredEvents = GameState.checkEvents('turn', { turnCount: GameState.player.turnCount });
    if (triggeredEvents && triggeredEvents.length > 0) {
        showEventNotification(triggeredEvents[0]);
    }
    
    // Evolve the world (small chance each turn)
    if (Math.random() < 0.2) {
        GameState.evolveWorld();
    }
    
    // Update UI
    updateUI();
    
    console.log(`Turn ${GameState.player.turnCount} started`);
}