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
        // Set default evolution structure if it doesn't exist
        if (!this.evolution) {
            this.evolution = {
                paths: {
                    explorer: { level: 0, xp: 0, xpToNext: 100, traits: [] },
                    manipulator: { level: 0, xp: 0, xpToNext: 100, traits: [] },
                    stabilizer: { level: 0, xp: 0, xpToNext: 100, traits: [] },
                    survivor: { level: 0, xp: 0, xpToNext: 100, traits: [] }
                },
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
                activeTraits: []
            };
        }
        
        // Set default events structure if it doesn't exist
        if (!this.events) {
            this.events = {
                activeEvents: [],
                completedEvents: [],
                eventChains: {},
                availableEvents: {
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
            };
        }
        
        // Load saved progress if available
        const savedProgress = JSON.parse(localStorage.getItem('playerProgress'));
        if (savedProgress) {
            this.progress = savedProgress;
            
            // If we have saved world evolution data, load it
            if (savedProgress.worldEvolution) {
                this.worldEvolution = savedProgress.worldEvolution;
            }
            
            // Initialize resources from saved progress if available
            if (savedProgress.resources) {
                this.resources = savedProgress.resources;
            }
            
            // Initialize evolution data from saved progress if available
            if (savedProgress.evolution) {
                // Make sure we preserve the availableTraits definition
                const availableTraits = this.evolution.availableTraits;
                this.evolution = savedProgress.evolution;
                
                // Ensure availableTraits is always defined with the correct structure
                if (!this.evolution.availableTraits) {
                    this.evolution.availableTraits = availableTraits;
                }
            }
            
            // Initialize events data from saved progress if available
            if (savedProgress.events) {
                // Make sure we preserve the event definitions
                const availableEvents = this.events.availableEvents;
                const chains = this.events.chains;
                this.events = savedProgress.events;
                
                // Ensure event definitions are always preserved
                if (!this.events.availableEvents) {
                    this.events.availableEvents = availableEvents;
                }
                if (!this.events.chains) {
                    this.events.chains = chains;
                }
            }
        }
        
        // Initialize metrics trackers
        this.metrics = Object.create(MetricsTracker);
        this.recentMetrics = Object.create(MetricsTracker);
        
        // Calculate initial energy based on grid size
        this.resetPlayerState();
        
        // Apply active trait effects
        this.applyTraitEffects();
    },
    
    /**
     * Checks for events that should be triggered
     * @param {string} triggerType - Type of trigger ('world', 'tile', 'evolution')
     * @param {Object} context - Context information for the trigger
     * @returns {Array} Triggered events
     */
    checkEvents(triggerType, context = {}) {
        if (!this.events) {
            return [];
        }
        
        const triggeredEvents = [];
        const worldAge = this.worldEvolution.age;
        
        // Determine which event pool to use based on world age
        let eventPool = 'early';
        if (worldAge >= 10) {
            eventPool = 'late';
        } else if (worldAge >= 5) {
            eventPool = 'mid';
        }
        
        // Check each event in the pool
        const eventsToCheck = this.events.availableEvents[eventPool] || [];
        
        for (const event of eventsToCheck) {
            // Skip events that have already been completed
            if (this.events.completedEvents.includes(event.id)) {
                continue;
            }
            
            // Skip events that don't match the trigger type
            if (event.type !== triggerType && event.type !== 'chain') {
                continue;
            }
            
            // Check if the event is triggered
            if (this.isEventTriggered(event, triggerType, context)) {
                triggeredEvents.push(event);
                
                // For non-chain events, mark as completed
                if (event.type !== 'chain') {
                    this.events.completedEvents.push(event.id);
                } else {
                    // For chain events, update the chain progress
                    this.advanceEventChain(event.chainId, event.step);
                }
            }
        }
        
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
        if (!event.trigger || !event.trigger.condition) {
            return false;
        }
        
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
     * Resets all progress (for testing/debugging)
     */
    resetAllProgress() {
        this.progress = {
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
        };
        
        // Reset world evolution
        this.worldEvolution = {
            age: 0,
            globalChaos: 0.8,
            globalOrder: 0.2,
            stabilityThreshold: 0.4,
            complexityThreshold: 0.6,
            tileVariance: 0.2
        };
        
        // Reset resources
        this.resources = {
            energy: 0,
            essence: 0,
            knowledge: 0,
            stability: 50
        };
        
        // Reset evolution
        this.evolution = {
            paths: {
                explorer: { level: 0, xp: 0, xpToNext: 100, traits: [] },
                manipulator: { level: 0, xp: 0, xpToNext: 100, traits: [] },
                stabilizer: { level: 0, xp: 0, xpToNext: 100, traits: [] },
                survivor: { level: 0, xp: 0, xpToNext: 100, traits: [] }
            },
            activeTraits: []
        };
        
        // Reset events
        this.events = {
            activeEvents: [],
            completedEvents: [],
            eventChains: {}
        };
        
        this.saveProgress();
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

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing game...");
    
    // Attach event listeners for UI elements
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            restoreStatsWindow();
            updateStatsWindow();
            document.getElementById('stats-window').style.display = 'block';
        });
    }
    
    const closeStatsBtn = document.getElementById('close-stats-btn');
    if (closeStatsBtn) {
        closeStatsBtn.addEventListener('click', () => {
            document.getElementById('stats-window').style.display = 'none';
        });
    }
    
    const resizeBtn = document.getElementById('resize-btn');
    if (resizeBtn) {
        resizeBtn.addEventListener('click', () => {
            const newRows = parseInt(document.getElementById('rows-input').value);
            const newCols = parseInt(document.getElementById('cols-input').value);
            
            if (GameState.updateGridSize(newRows, newCols)) {
                // Update local variables for compatibility
                rows = GameState.grid.rows;
                cols = GameState.grid.cols;
                
                startGame();
            } else {
                alert('Please choose rows and columns between 3 and 20.');
            }
        });
    }
    
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            // Reset all progress
            GameState.resetAllProgress();
            
            // Update local variables for compatibility
            ({ stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, 
               hasFoundZoe, zoeLevelsCompleted, essence, systemChaos, systemOrder, 
               orderContributions, uniquesensedTypes } = GameState.progress);
            
            startGame();
        });
    }
    
    // Initialize game state
    GameState.init();
    
    // Extract frequently used values from state for backward compatibility
    // This helps with the transition to the new state management system
    rows = GameState.grid.rows;
    cols = GameState.grid.cols;
    turnCount = GameState.player.turnCount;
    currentRow = GameState.player.currentRow;
    currentCol = GameState.player.currentCol;
    currentLevelSenses = GameState.player.currentLevelSenses;
    moveCounter = GameState.player.moveCounter;
    hasUsedsenserBonus = GameState.player.hasUsedSenserBonus;
    currentAction = GameState.player.currentAction;
    energy = GameState.player.energy;
    movementPoints = GameState.player.movementPoints;
    
    // Extract progress data
    ({ stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, 
       hasFoundZoe, zoeLevelsCompleted, essence, systemChaos, systemOrder, 
       orderContributions, uniquesensedTypes } = GameState.progress);
    
    temporaryInventory = GameState.level.temporaryInventory;
    metrics = GameState.metrics;
    recentMetrics = GameState.recentMetrics;
    
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
 * Highlights tiles based on the current action
 * @param {string} action - Current action ('move', 'sense', 'poke', or 'stabilize')
 */
function highlightTiles(action) {
    const adjacentTiles = getAdjacentTiles(currentRow, currentCol);
    document.querySelectorAll('.hex-container').forEach(container => {
        const row = parseInt(container.getAttribute('data-row'));
        const col = parseInt(container.getAttribute('data-col'));
        container.classList.remove('highlight-move', 'highlight-sense', 'highlight-poke', 'highlight-stabilize');
        if (action === 'move' && adjacentTiles.some(t => t.row === row && t.col === col)) {
            container.classList.add('highlight-move');
        } else if (action === 'sense' || action === 'poke' || action === 'stabilize') {
            if ((row === currentRow && col === currentCol) || adjacentTiles.some(t => t.row === row && t.col === col)) {
                container.classList.add(action === 'sense' ? 'highlight-sense' : action === 'poke' ? 'highlight-poke' : 'highlight-stabilize');
            }
        }
    });
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
    
    const visibleTiles = getTilesInRange(currentRow, currentCol, visionRange);
    
    document.querySelectorAll('.hex-container').forEach(container => {
        const row = parseInt(container.getAttribute('data-row'));
        const col = parseInt(container.getAttribute('data-col'));
        
        // Check if this tile is visible
        const isVisible = visibleTiles.some(t => t.row === row && t.col === col);
        
        if (isVisible) {
            // Remove unexplored class if visible
            container.classList.remove('unexplored');
            
            // Mark as explored in data
            if (tileData[row][col]) {
                tileData[row][col].explored = true;
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
 * Builds the visual hex grid based on tile data
 * @param {number} rows - Number of rows in the grid
 * @param {number} cols - Number of columns in the grid
 * @param {Array} tileData - 2D array of tile data
 */
function buildGrid(rows, cols, tileData) {
    console.log(`Building grid: ${rows}x${cols}`);
    
    const grid = document.querySelector('.grid');
    if (!grid) {
        console.error('Grid element not found in HTML');
        return;
    }
    
    // Clear existing grid
    grid.innerHTML = '';
    
    const totalWidth = (cols - 1) * colOffset + hexVisualWidth;
    const totalHeight = (rows - 1) * rowOffset + hexHeight;
    grid.style.width = `${totalWidth}px`;
    grid.style.height = `${totalHeight}px`;
    grid.style.position = 'relative';
    
    console.log(`Grid dimensions: ${totalWidth}x${totalHeight}`);

    for (let row = 0; row < rows; row++) {
        const hexRow = document.createElement('div');
        hexRow.classList.add('hex-row');
        hexRow.style.position = 'absolute';
        hexRow.style.top = `${row * rowOffset}px`;
        hexRow.style.left = '0';

        for (let col = 0; col < cols; col++) {
            const hexContainer = document.createElement('div');
            hexContainer.classList.add('hex-container');
            hexContainer.setAttribute('data-row', row);
            hexContainer.setAttribute('data-col', col);
            
            // Add chaos/order data attributes
            const chaos = tileData[row][col].chaos;
            const order = tileData[row][col].order;
            
            // Set data attributes for styling
            if (order > 0.7) {
                hexContainer.setAttribute('data-order', 'high');
            } else if (order > 0.5) {
                hexContainer.setAttribute('data-order', 'medium');
            } else if (order > 0.3) {
                hexContainer.setAttribute('data-order', 'low');
            } else if (chaos > 0.7) {
                hexContainer.setAttribute('data-chaos', 'high');
            } else if (chaos > 0.5) {
                hexContainer.setAttribute('data-chaos', 'medium');
            }

            const isOddRow = row % 2 === 1;
            const rowShift = isOddRow ? hexVisualWidth / 2 : 0;
            const hexLeft = col * colOffset + rowShift;

            hexContainer.style.position = 'absolute';
            hexContainer.style.left = `${hexLeft}px`;
            hexContainer.style.top = '0';

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', hexVisualWidth);
            svg.setAttribute('height', hexHeight);
            svg.setAttribute('viewBox', '0 0 86.6 100');
            svg.style.overflow = 'visible';
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M43.3 0 L86.6 25 L86.6 75 L43.3 100 L0 75 L0 25 Z');
            
            // Adjust path color based on chaos/order
            if (order > 0.7) {
                path.style.fill = '#00ccff';
                path.style.filter = 'brightness(1.2)';
            } else if (order > 0.5) {
                path.style.fill = '#00aa99';
                path.style.filter = 'brightness(1.1)';
            } else if (chaos > 0.7) {
                path.style.fill = '#aa3300';
                path.style.filter = 'brightness(0.9)';
            } else if (chaos > 0.5) {
                path.style.fill = '#884400';
                path.style.filter = 'brightness(0.95)';
            }
            
            svg.appendChild(path);
            hexContainer.appendChild(svg);

            const character = document.createElement('div');
            character.classList.add('character');
            hexContainer.appendChild(character);
            
            // Add a visual indicator of the tile's chaos/order state
            const stateIndicator = document.createElement('div');
            stateIndicator.classList.add('tile-state-indicator');
            
            if (order > 0.7) {
                stateIndicator.classList.add('tile-state-order-high');
            } else if (order > 0.5) {
                stateIndicator.classList.add('tile-state-order-medium');
            } else if (chaos > 0.7) {
                stateIndicator.classList.add('tile-state-chaos-high');
            } else if (chaos > 0.5) {
                stateIndicator.classList.add('tile-state-chaos-medium');
            } else {
                stateIndicator.classList.add('tile-state-balanced');
            }
            
            hexContainer.appendChild(stateIndicator);

            const tileType = tileData[row][col].type;
            hexContainer.classList.add(tileType);

            if (!tileData[row][col].explored) {
                hexContainer.classList.add('unexplored');
            }

            hexRow.appendChild(hexContainer);
        }
        grid.appendChild(hexRow);
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
 * Allows player to rest to gain energy at the cost of ending turn
 */
function rest() {
    if (!GameState.isActive) {
        console.log("Level complete—cannot rest!");
        return;
    }
    
    const confirmRest = confirm("This ends the turn and lets you rest to gain energy. Are you sure?");
    if (confirmRest) {
        // Calculate energy gain based on stability
        const stabilityFactor = GameState.resources.stability / 50; // 0.0 to 2.0
        const baseEnergyGain = GameState.resourceRates.energyPerRest;
        const energyGain = Math.round(baseEnergyGain * stabilityFactor);
        
        // Update resources
        GameState.updateResource('energy', energyGain);
        
        // Stability naturally increases slightly when resting
        GameState.updateResource('stability', 2);
        
        // Update local variables for compatibility
        energy = GameState.resources.energy;
        
        // End movement for this turn
        GameState.player.movementPoints = 0;
        movementPoints = 0;
        
        // Track metrics
        GameState.metrics.incrementRests();
        GameState.recentMetrics.incrementRests();
        
        // Show feedback
        const feedbackMessage = document.getElementById('feedback-message');
        if (feedbackMessage) {
            feedbackMessage.textContent = `Rested and gained ${energyGain} energy.`;
            feedbackMessage.style.display = 'block';
            setTimeout(() => { feedbackMessage.style.display = 'none'; }, 2000);
        }
        
        // Update UI with animation
        updateResourceDisplay('energy', GameState.resources.energy, GameState.resourceLimits.energy, true);
        updateResourceDisplay('stability', GameState.resources.stability, GameState.resourceLimits.stability, true);
        
        endTurn();
    }
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
    
    // Reset metrics
    GameState.metrics.reset();
    GameState.recentMetrics.reset();
    
    // Reset player state
    GameState.resetPlayerState();
    
    // Update local variables for compatibility
    rows = GameState.grid.rows;
    cols = GameState.grid.cols;
    turnCount = GameState.player.turnCount;
    currentRow = GameState.player.currentRow;
    currentCol = GameState.player.currentCol;
    currentLevelSenses = GameState.player.currentLevelSenses;
    moveCounter = GameState.player.moveCounter;
    hasUsedsenserBonus = GameState.player.hasUsedSenserBonus;
    currentAction = GameState.player.currentAction;
    energy = GameState.player.energy;
    movementPoints = GameState.player.movementPoints;
    temporaryInventory = GameState.level.temporaryInventory;
    
    console.log(`Grid size: ${rows}x${cols}`);
    
    // Create and initialize tile data
    GameState.level.tileData = createTileData(rows, cols);
    tileData = GameState.level.tileData; // Update global reference
    
    console.log("Tile data created");
    
    // Place tiles and build grid
    placeTiles(tileData, rows, cols);
    console.log("Tiles placed");
    
    buildGrid(rows, cols, tileData);
    console.log("Grid built");

    document.querySelectorAll('.character').forEach(char => char.style.display = 'none');
    const startingHex = document.querySelector('.hex-container[data-row="0"][data-col="0"]');
    if (startingHex) {
        const character = startingHex.querySelector('.character');
        if (character) character.style.display = 'block';
    } else {
        console.error("Starting hex not found");
    }

    if (GameState.progress.hasFoundZoe) {
        const goalTile = document.querySelector(`.hex-container[data-row="${rows - 1}"][data-col="${cols - 1}"]`);
        if (goalTile) goalTile.classList.add('goal-visible');
    }
    
    // Initialize evolution UI
    try {
        updateEvolutionUI();
        console.log("Evolution UI updated");
    } catch (error) {
        console.error("Error updating evolution UI:", error);
    }
    
    // Initialize events UI
    try {
        updateEventsUI();
        console.log("Events UI updated");
    } catch (error) {
        console.error("Error updating events UI:", error);
    }
    
    // Apply trait effects
    GameState.applyTraitEffects();
    
    // Check for world events
    try {
        const worldEvents = GameState.checkEvents('world');
        console.log("World events checked:", worldEvents);
        if (worldEvents.length > 0) {
            // Show the first triggered event
            showEventNotification(worldEvents[0]);
        }
    } catch (error) {
        console.error("Error checking world events:", error);
    }
    
    highlightTiles(null);
    updateVision();
    updateUI();
    
    GameState.isActive = true;
    isGameActive = true;
    
    // Hide all windows
    const statsWindow = document.getElementById('stats-window');
    if (statsWindow) statsWindow.style.display = 'none';
    
    const evolutionWindow = document.getElementById('evolution-window');
    if (evolutionWindow) evolutionWindow.style.display = 'none';
    
    const eventsWindow = document.getElementById('events-window');
    if (eventsWindow) eventsWindow.style.display = 'none';
    
    const eventNotification = document.getElementById('event-notification');
    if (eventNotification) eventNotification.style.display = 'none';
    
    console.log("Game started successfully");
}

/**
 * Updates all UI elements with current game state
 */
function updateUI() {
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
    turnCount = GameState.player.turnCount;
    energy = GameState.player.energy;
    movementPoints = GameState.player.movementPoints;
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
 * Updates the evolution UI
 */
function updateEvolutionUI() {
    // Check if GameState.evolution is properly initialized
    if (!GameState.evolution || !GameState.evolution.paths) {
        console.error('Evolution system not properly initialized');
        return;
    }
    
    // Update each evolution path
    for (const path of ['explorer', 'manipulator', 'stabilizer', 'survivor']) {
        const pathData = GameState.evolution.paths[path];
        if (!pathData) {
            console.error(`Path data not found for: ${path}`);
            continue;
        }
        
        // Get DOM elements
        const levelElement = document.getElementById(`${path}-level`);
        const xpElement = document.getElementById(`${path}-xp`);
        const xpNextElement = document.getElementById(`${path}-xp-next`);
        const xpFillElement = document.getElementById(`${path}-xp-fill`);
        const traitsContainer = document.getElementById(`${path}-traits`);
        
        if (!levelElement || !xpElement || !xpNextElement || !xpFillElement || !traitsContainer) {
            console.error(`UI elements not found for path: ${path}`);
            continue;
        }
        
        // Update level and XP
        levelElement.textContent = pathData.level;
        xpElement.textContent = pathData.xp;
        xpNextElement.textContent = pathData.xpToNext;
        
        // Update XP bar
        const xpPercentage = (pathData.xp / pathData.xpToNext) * 100;
        xpFillElement.style.width = `${xpPercentage}%`;
        
        // Update traits
        traitsContainer.innerHTML = ''; // Clear existing traits
        
        try {
            // Get available traits for this path
            const availableTraits = GameState.getAvailableTraits(path);
            
            // Add unlocked traits
            const unlockedTraitIds = pathData.traits || [];
            for (const traitId of unlockedTraitIds) {
                if (!GameState.evolution.availableTraits || !GameState.evolution.availableTraits[path]) {
                    continue;
                }
                
                const trait = GameState.evolution.availableTraits[path].find(t => t.id === traitId);
                if (trait) {
                    const traitElement = createTraitElement(trait, path, true);
                    traitsContainer.appendChild(traitElement);
                }
            }
            
            // Add available traits
            for (const trait of availableTraits) {
                const traitElement = createTraitElement(trait, path, false);
                traitsContainer.appendChild(traitElement);
            }
            
            // Add locked traits (higher level requirements)
            if (GameState.evolution.availableTraits && GameState.evolution.availableTraits[path]) {
                const lockedTraits = GameState.evolution.availableTraits[path].filter(trait => 
                    trait.level > pathData.level && !(pathData.traits || []).includes(trait.id)
                );
                
                for (const trait of lockedTraits) {
                    const traitElement = createTraitElement(trait, path, false, true);
                    traitsContainer.appendChild(traitElement);
                }
            }
        } catch (error) {
            console.error(`Error updating traits for path ${path}:`, error);
            traitsContainer.innerHTML = '<p class="error-message">Error loading traits. Please try again.</p>';
        }
    }
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

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM content loaded, initializing game...");
    
    // Attach event listeners for UI elements
    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            restoreStatsWindow();
            updateStatsWindow();
            document.getElementById('stats-window').style.display = 'block';
        });
    }
    
    const closeStatsBtn = document.getElementById('close-stats-btn');
    if (closeStatsBtn) {
        closeStatsBtn.addEventListener('click', () => {
            document.getElementById('stats-window').style.display = 'none';
        });
    }
    
    const resizeBtn = document.getElementById('resize-btn');
    if (resizeBtn) {
        resizeBtn.addEventListener('click', () => {
            const newRows = parseInt(document.getElementById('rows-input').value);
            const newCols = parseInt(document.getElementById('cols-input').value);
            
            if (GameState.updateGridSize(newRows, newCols)) {
                // Update local variables for compatibility
                rows = GameState.grid.rows;
                cols = GameState.grid.cols;
                
                startGame();
            } else {
                alert('Please choose rows and columns between 3 and 20.');
            }
        });
    }
    
    const resetStatsBtn = document.getElementById('reset-stats-btn');
    if (resetStatsBtn) {
        resetStatsBtn.addEventListener('click', () => {
            // Reset all progress
            GameState.resetAllProgress();
            
            // Update local variables for compatibility
            ({ stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, 
               hasFoundZoe, zoeLevelsCompleted, essence, systemChaos, systemOrder, 
               orderContributions, uniquesensedTypes } = GameState.progress);
            
            startGame();
        });
    }
    
    // Initialize game state
    GameState.init();
    
    // Extract frequently used values from state for backward compatibility
    // This helps with the transition to the new state management system
    rows = GameState.grid.rows;
    cols = GameState.grid.cols;
    turnCount = GameState.player.turnCount;
    currentRow = GameState.player.currentRow;
    currentCol = GameState.player.currentCol;
    currentLevelSenses = GameState.player.currentLevelSenses;
    moveCounter = GameState.player.moveCounter;
    hasUsedsenserBonus = GameState.player.hasUsedSenserBonus;
    currentAction = GameState.player.currentAction;
    energy = GameState.player.energy;
    movementPoints = GameState.player.movementPoints;
    
    // Extract progress data
    ({ stats, traits, persistentInventory, xp, sensedTypes, sensesMade, pokesMade, 
       hasFoundZoe, zoeLevelsCompleted, essence, systemChaos, systemOrder, 
       orderContributions, uniquesensedTypes } = GameState.progress);
    
    temporaryInventory = GameState.level.temporaryInventory;
    metrics = GameState.metrics;
    recentMetrics = GameState.recentMetrics;
    
    // Create particles
    createParticles(25);
    
    // Attach event listeners for the evolution system
    attachEvolutionListeners();
    
    // Attach event listeners for the events system
    attachEventsListeners();
    
    // Initialize the game
    startGame();
});