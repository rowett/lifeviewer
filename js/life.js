/* eslint-disable no-proto */
// Life
// written by Chris Rowett

// @ts-check

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Random Reflect Keywords littleEndian BoundingBox Allocator Float32 Uint8 Uint16 Uint32 Int32 Uint8Array Uint16Array Uint32Array Float32Array SnapshotManager HROT ViewConstants PatternConstants */

	// Life constants
	/** @const */
	var LifeConstants = {
		// number of snowflakes
		/** @const {number} */ flakes : 50000,

		// cell types for rotor/stator calculations
		/** @const {number} */ cellNotSeen : 0,
		/** @const {number} */ cellWasAlive : 1,
		/** @const {number} */ cellWasDead : 2,
		/** @const {number} */ cellHasChanged : 3,

		// transformation for mod hash
		/** @const {number} */ modFirstTrans : 0,
		/** @const {number} */ modRot90 : 0,
		/** @const {number} */ modRot180 : 1,
		/** @const {number} */ modRot270 : 2,
		/** @const {number} */ modFlipX : 3,
		/** @const {number} */ modFlipY : 4,
		/** @const {number} */ modRot90FlipX : 5,
		/** @const {number} */ modRot90FlipY : 6,
		/** @const {number} */ modLastTrans : 6,

		// maximum number of bits for rule tree lookup
		/** @const {number} */ maxRuleTreeLookupBits : 20,

		// mod type names
		/** @const {Array<string>} */ modTypeName : ["RotCW", "FlipXY", "RotCCW", "FlipX", "FlipY", "RotCWFlipX", "RotCWFlipY"],

		// maximum number of generations to check for oscillators
		/** @const {number} */ maxOscillatorGens : 1048576,

		// buffer full
		/** @const {string} */ bufferFullMessage : "Buffer Full",

		// PCA palette
		/** @const {Array<Array<number>>} */ coloursPCA : [[0, 0, 0], [255, 0, 0], [0, 255, 0], [128, 128, 0],
														   [16, 16, 255], [128, 0, 128], [0, 128, 128], [96, 96, 96],
														   [255, 255, 0], [255, 128, 0], [128, 255, 0], [170, 170, 0],
														   [144, 144, 144], [170, 85, 85], [85, 128, 43], [128, 128, 64],
														   [0, 0, 0], [255, 0, 0], [0, 255, 0], [128, 128, 0]],

		// NW glider (top left cell must be set for detection)
		/** @const {Array<Array<number>>} */ gliderNW : [[1, 1, 1],
														 [1, 0, 0],
														 [0, 1, 0]],

		// NE glider (top left cell must be set for detection)
		/** @const {Array<Array<number>>} */ gliderNE : [[1, 1, 1],
														 [0, 0, 1],
														 [0, 1, 0]],
		
		// SW glider (top middle cell only must be set for detection)
		/** @const {Array<Array<number>>} */ gliderSW : [[0, 1, 0],
														 [1, 0, 0],
														 [1, 1, 1]],

		// SE glider (top middle cell only must be set for detection)
		/** @const {Array<Array<number>>} */ gliderSE : [[0, 1, 0],
														 [0, 0, 1],
														 [1, 1, 1]],
		
		// hex and triangle cell coordinate buffer size
		/** @const {number} */ coordBufferSize : 4096,

		// hex cell bits for buffer (must be coordBufferSize * 16 bits big)
		/** @const {number} */ coordBufferBits : 16,

		// remove pattern cell buffer (must be power of 2)
		/** @const {number} */ removePatternBufferSize : 4096,

		// size of 3x3 hash lookup array
		/** @const {number} */ hash33 : 512,

		// size of 6x3 hash lookup array
		/** @const {number} */ hash63 : 262144,

		// size of Margolus lookup array
		/** @const {number} */ hashMargolus : 65536,

		// size of PCA lookup array
		/** @const {number} */ hashPCA : 65536,

		// size of 13bit triangular single cell hash lookup array
		/** @const {number} */ hashTriangular : 8192,

		// size of 17bit triangular double cell hash lookup array (includes odd/even bit)
		/** @const {number} */ hashTriDouble : 131072,

		// snapshot interval
		/** @const {number} */ snapshotInterval : 64,

		// maximum number of population samples for graph
		/** @const {number} */ maxPopSamples : 262144,

		// population samples chunk size 2^n
		/** @const {number} */ popChunkPower : 12,

		// cell value for alive start (for 2-state Themes)
		/** @const {number} */ aliveStart : 64,

		// cell value for alive maximum (for 2-state Themes)
		/** @const {number} */ aliveMax : 127,

		// cell colour index for cell just dead (for 2-state Themes)
		/** @const {number} */ deadStart : 63,

		// cell colour index for cell dead longest (for 2-state Themes)
		/** @const {number} */ deadMin : 1,

		// bit masks for surrounding tiles
		/** @const {number} */ leftSet : 1,
		/** @const {number} */ rightSet : 2,
		/** @const {number} */ topSet : 4,
		/** @const {number} */ bottomSet : 8,
		/** @const {number} */ topLeftSet : 16,
		/** @const {number} */ topRightSet : 32,
		/** @const {number} */ bottomLeftSet : 64,
		/** @const {number} */ bottomRightSet : 128
	};

	// Theme object
	/**
	 * @constructor
	 */
	function Theme(name, deadRange, aliveRange, unoccupied, aliveGen, dyingRangeGen, deadRangeGen, unoccupiedGen) {
		this.name = name;
		this.gridDefined = false;
		this.gridMajor = 10;
		this.gridColour = 0;
		this.gridMajorColour = 0;

		// 2-state theme
		this.unoccupied = unoccupied;
		this.aliveRange = aliveRange;
		this.deadRange = deadRange;

		// generations theme
		this.aliveGen = aliveGen;
		this.dyingRangeGen = dyingRangeGen;
		this.deadRangeGen = deadRangeGen;
		this.unoccupiedGen = unoccupiedGen;
		this.dyingRangeDynamic = false;

		// check for dynamic dying range
		if (this.dyingRangeGen.endColour.red === -1) {
			this.dyingRangeDynamic = true;
		}

		// pick light or dark grid lines based on theme background
		if (((this.unoccupied.red + this.unoccupied.green + this.unoccupied.blue) / 3) >= 128) {
			this.gridColour = ViewConstants.gridLineLightRawDefault;
			this.gridMajorColour = ViewConstants.gridLineLightBoldRawDefault;
		} else {
			this.gridColour = ViewConstants.gridLineRawDefault;
			this.gridMajorColour = ViewConstants.gridLineBoldRawDefault;
		}
	}
	
	// copy theme
	Theme.prototype.set = function(source) {
		this.gridDefined = source.gridDefined;
		this.gridMajor = source.gridMajor;
		this.gridColour = source.gridColour;
		this.gridMajorColour = source.gridMajorColour;

		this.unoccupied = source.unoccupied;
		this.aliveRange = source.aliveRange;
		this.deadRange = source.deadRange;

		this.aliveGen = source.aliveGen;
		this.dyingRangeGen = source.dyningRangeGen;
		this.deadRangeGen = source.deadRangeGen;
		this.unoccupiedGen = source.unoccupiedGen;
		this.dyingRangeGen = source.dyingRangeGen;
		this.dyingRangeDynamic = source.dyingRangeDynamic;
	};

	// add grid line settings to the theme
	Theme.prototype.setGridLines = function(gridMajor, gridColour, gridMajorColour) {
		this.gridDefined = true;
		this.gridMajor = gridMajor;
		this.gridColour = (gridColour.red << 16) | (gridColour.green << 8) | (gridColour.blue);
		this.gridMajorColour = (gridMajorColour.red << 16) | (gridMajorColour.green << 8) | (gridMajorColour.blue);
	};

	// set custom grid lines colours
	Theme.prototype.setGridLineColours = function(gridColour, gridMajorColour) {
		// check if the grid lines colour was specified
		if (gridColour !== -1) {
			// yes so set it
			this.gridColour = gridColour;
		} else {
			// no so pick the light or dark default based on the background colour
			if (((this.unoccupied.red + this.unoccupied.green + this.unoccupied.blue) / 3) >= 128) {
				this.gridColour = ViewConstants.gridLineLightRawDefault;
			} else {
				this.gridColour = ViewConstants.gridLineRawDefault;
			}
		}

		// check if the major grid lines colour was specified
		if (gridMajorColour !== -1) {
			// yes so set it
			this.gridMajorColour = gridMajorColour;
		} else {
			// no so pick the light or dark default based on the background colour
			if (((this.unoccupied.red + this.unoccupied.green + this.unoccupied.blue) / 3) >= 128) {
				this.gridMajorColour = ViewConstants.gridLineLightBoldRawDefault;
			} else {
				this.gridMajorColour = ViewConstants.gridLineBoldRawDefault;
			}
		}
	};

	// check if theme has colour history
	/** @return {boolean} */
	Theme.prototype.hasHistory = function(/** @type {boolean} */ isLifeHistory) {
		var result = true;

		// always return true if the pattern is [R]History since history states are saved in RLE
		if (!isLifeHistory) {
			// check if the alive start and end colour are the same, the dead start and end colour are the same and the dead and unoccupied colour are the same
			if ((this.aliveRange.startColour.isSameColour(this.aliveRange.endColour)) && (this.deadRange.startColour.isSameColour(this.deadRange.endColour)) && (this.deadRange.startColour.isSameColour(this.unoccupied))) {
				result = false;
			}
		}

		return result;
	};

	// Colour object
	/**
	 * @constructor
	 */
	function Colour(red, green, blue) {
		this.red = red;
		this.green = green;
		this.blue = blue;
	}

	// set function
	Colour.prototype.set = function(fromColour) {
		this.red = fromColour.red;
		this.green = fromColour.green;
		this.blue = fromColour.blue;
	};

	// is same colour function
	/** @return {boolean} */
	Colour.prototype.isSameColour = function(compareColour) {
		var result = false;

		// check if components are identical
		if ((this.red === compareColour.red) && (this.green === compareColour.green) && (this.blue === compareColour.blue)) {
			// colours are the same
			result = true;
		}

		// return whether the colours were the same
		return result;
	};

	// ColourRange object
	/**
	 * @constructor
	 */
	function ColourRange(startColour, endColour) {
		this.startColour = startColour;
		this.endColour = endColour;
	}

	// set function
	ColourRange.prototype.set = function(fromRange) {
		this.startColour.set(fromRange.startColour);
		this.endColour.set(fromRange.endColour);
	};

	// Life object
	/**
	 * @constructor
	 */
	function Life(context, /** @type {number} */ displayWidth, /** @type {number} */ displayHeight, /** @type {number} */ gridWidth, /** @type {number} */ gridHeight, manager) {
		// pattern manager
		this.manager = manager;

		// allocator
		this.allocator = new Allocator();

		// whether pretty rendering enabled
		/** @type {boolean} */ this.pretty = false;

		// scaling canvas
		this.sCanvas = null;
		this.sContext = null;
		this.sImageData = null;
		this.sData32 = null;

		// snow flakes (x, y, dy)
		this.snowX = null;
		this.snowY = null;
		this.snowDY = null;

		// snow flake revive list
		this.snowRevive = null;

		// initialise random number generator
		this.randGen = new Random;
		this.randGen.init(Date.now().toString());

		// whether current rule is RuleTree
		/** @type {boolean} */ this.isRuleTree = false;
		/** @type {number} */ this.ruleTreeNeighbours = 8;
		/** @type {number} */ this.ruleTreeStates = 2;
		/** @type {number} */ this.ruleTreeNodes = 0;
		/** @type {number} */ this.ruleTreeBase = -1;
		/** @type {Array<number>} */ this.ruleTreeA = null;
		/** @type {Array<number>} */ this.ruleTreeB = null;
		/** @type {Array<number>} */ this.ruleTreeColours = null;
		this.ruleTableIcons = null;

		// RuleTable
		this.ruleTableLUT = [];
		/** @type {Uint8Array} */ this.ruleTableOutput = null;
		/** @type {number} */ this.ruleTableCompressedRules = 0;
		/** @type {number} */ this.ruleTableNeighbourhood = 0;
		/** @type {number} */ this.ruleTableDups = 0;

		// icons
		this.ruleTableIcons = null;

		// identify lists
		this.hashList = null;
		this.genList = null;
		this.popList = null;
		this.bornList = null;
		this.diedList = null;
		this.boxList = null;
		this.nextList = null;
		this.startItem = 0;
		/** @type {number} */ this.oscLength = 0;
		this.countList = null;
		this.hashBox = new BoundingBox(0, 0, 0, 0);
		/** @type {number} */ this.modValue = 0;
		/** @type {number} */ this.modType = -1;

		// flag for alternating Margolus grid lines
		/** @type {boolean} */ this.altGrid = false;

		// flag for reverse Margolus playback
		/** @type {boolean} */ this.reverseMargolus = false;

		// flag for reverse pending
		/** @type {boolean} */ this.reversePending = false;

		// flag whether alternate rules specified
		/** @type {boolean} */ this.altSpecified = false;

		// flag whether shrink after edit needed
		/** @type {boolean} */ this.shrinkNeeded = false;

		// flag whether to clear escaping gliders
		/** @type {boolean} */ this.clearGliders = false;

		// count of escaping gliders cleared
		/** @type {number} */ this.numClearedGliders = 0;

		// gliders in 7x7 cell array
		/** @type {Array<Array<number>>} */ this.gliderNW7x7 = [];
		/** @type {Array<Array<number>>} */ this.gliderNE7x7 = [];
		/** @type {Array<Array<number>>} */ this.gliderSW7x7 = [];
		/** @type {Array<Array<number>>} */ this.gliderSE7x7 = [];

		// cell colour strings
		/** @type {Array<string>} */ this.cellColourStrings = [];

		// before and after RLE comments
		/** @type {string} */ this.beforeTitle = "";
		/** @type {string} */ this.afterTitle = "";

		// bounded grid border colour
		/** @type {number} */ this.boundedBorderColour = 255;

		// custom state colours
		this.customColours = null;

		// bit counts for 16bit values
		this.bitCounts16 = this.allocator.allocate(Uint8, 65536, "Life.bitCounts16");
		this.initBitCounts16();

		// population graph array
		this.popGraphData = null;
		this.birthGraphData = null;
		this.deathGraphData = null;

		// population graph entries
		/** @type {number} */ this.popGraphEntries = 0;

		// maximum population value
		/** @type {number} */ this.maxPopValue = 0;

		// x, y and z origin
		/** @type {number} */ this.originX = 0;
		/** @type {number} */ this.originY = 0;
		/** @type {number} */ this.originZ = 1;

		// whether anything is alive
		/** @type {number} */ this.anythingAlive = 0;

		// bounded grid type
		/** @type {number} */ this.boundedGridType = -1;

		// bounded grid size
		/** @type {number} */ this.boundedGridWidth = -1;
		/** @type {number} */ this.boundedGridHeight = -1;

		// bounded grid shifts
		/** @type {number} */ this.boundedGridHorizontalShift = 0;
		/** @type {number} */ this.boundedGridVerticalShift = 0;

		// bounded grid twists
		/** @type {boolean} */ this.boundedGridHorizontalTwist = false;
		/** @type {boolean} */ this.boundedGridVerticalTwist = false;

		// remove pattern radius
		/** @type {number}*/ this.removePatternRadius = ViewConstants.defaultDeleteRadius;

		// stack for boundary pattern clear
		this.boundaryX = [];
		this.boundaryY = [];
		this.boundaryX[0] = this.allocator.allocate(Int32, LifeConstants.removePatternBufferSize, "Life.boundaryX0");
		this.boundaryY[0] = this.allocator.allocate(Int32, LifeConstants.removePatternBufferSize, "Life.boundaryY0");

		// number of boundary pages
		/** @type {number} */ this.boundaryPages = 0;

		// boundary colour
		/** @type {number} */ this.boundaryColour = 0xffffffff;

		// whether rule is _none_
		/** @type {boolean} */ this.isNone = false;

		// whether rule is Margolus
		/** @type {boolean} */ this.isMargolus = false;

		// whether rule is PCA
		/** @type {boolean} */ this.isPCA = false;

		// whether rule is Wolfram
		/** @type {number} */ this.wolframRule = -1;

		// whether neighbourhood is triangular
		/** @type {boolean} */ this.isTriangular = false;

		// triangular neighbourhood
		/** @type {number} */ this.triangularNeighbourhood = this.manager.triangularAll;

		// whether neighbourhood is hex
		/** @type {boolean} */ this.isHex = false;

		// whether to draw cells as hexagons in hex display mode
		/** @type {boolean} */ this.useHexagons = true;

		// whether to display square or hex grid
		/** @type {boolean} */ this.patternDisplayMode = false;

		// whether neighbourhood is Von Neumann
		/** @type {boolean} */ this.isVonNeumann = false;

		// number of states for multi-state rules (Generations or HROT)
		/** @type {number} */ this.multiNumStates = -1;

		// whether pattern is [R]History
		/** @type {boolean} */ this.isLifeHistory = false;

		// whether to display [R]History states
		/** @type {boolean} */ this.displayLifeHistory = false;

		// how many history states to draw
		/** @type {number} */ this.historyStates = 0;

		// whether pattern is HROT
		/** @type {boolean} */ this.isHROT = false;

		// whether to draw overlay
		/** @type {boolean} */ this.drawOverlay = false;

		// create the snapshot manager
		this.snapshotManager = new SnapshotManager(this.allocator, this.bitCounts16);

		// next snapshot generation target
		this.nextSnapshotTarget = LifeConstants.snapshotInterval;

		// whether current theme has history
		/** @type {boolean} */ this.themeHistory = false;

		// whether to display grid lines
		/** @type {boolean} */ this.displayGrid = false;

		// whether cells have borders
		/** @type {boolean} */ this.cellBorders = false;

		// zoom bounding box
		this.zoomBox = null;

		// alive cell bounding box for HROT
		this.HROTBox = null;

		// initial bounding box for LifeHistory
		this.initialBox = null;

		// history bounding box
		this.historyBox = null;

		// track box bounding box
		this.trackBox = null;

		// program title
		/** @const {string} */ this.title = "LifeViewer";

		// width of life grid in pixels
		/** @type {number} */ this.width = gridWidth;

		// height of life grid in pixels
		/** @type {number} */ this.height = gridHeight;

		// number of pixels per tile (2^n)
		/** @const {number} */ this.tilePower = 4;

		// tile width in bytes
		/** @const {number} */ this.tileX = (1 << this.tilePower) >> 3;

		// tile height in pixels
		/** @const {number} */ this.tileY = 1 << this.tilePower;

		// number of tile columns
		/** @type {number} */ this.tileCols = this.width >> this.tilePower;

		// number of tile rows
		/** @type {number} */ this.tileRows = this.height >> this.tilePower;

		// snapshot for reset
		this.resetSnapshot = this.snapshotManager.createSnapshot(((this.tileCols - 1) >> 4) + 1, this.tileRows, true, 0, false);  // TBD 5th paramter is usingoverlay

		// display width
		/** @type {number} */ this.displayWidth = displayWidth;
		
		// display height
		/** @type {number} */ this.displayHeight = displayHeight;

		// population of grid
		/** @type {number} */ this.population = 0;

		// births in last generation
		/** @type {number} */ this.births = 0;

		// deaths in last generation
		/** @type {number} */ this.deaths = 0;

		// cell colour index for new cell
		/** @const {number} */ this.aliveStart = LifeConstants.aliveStart;

		// cell colour index for cell alive longest
		/** @const {number} */ this.aliveMax = LifeConstants.aliveMax;

		// cell colour index for cell just dead
		/** @const {number} */ this.deadStart = LifeConstants.deadStart;

		// cell colour index for cell dead longest
		/** @const {number} */ this.deadMin = LifeConstants.deadMin;

		// cell colour index for cell never occupied
		/** @const {number} */ this.unoccupied = 0;
		
		// last update time
		/** @type {number} */ this.lastUpdate = 0;

		// first update time
		/** @type {number} */ this.firstUpdate = 0;

		// number of layers to draw
		/** @type {number} */ this.layers = 1;

		// flag if depth shading on
		/** @type {boolean} */ this.depthOn = true;

		// flag if layers on
		/** @type {boolean} */ this.layersOn = true;

		// colour theme number
		/** @type {number} */ this.colourTheme = -1;

		// colour change
		/** @type {number} */ this.colourChange = 1;
		/** @type {number} */ this.colourChangeSteps = 30;

		// survival rule
		/** @type {number} */ this.survival = (1 << 2) | (1 << 3);

		// birth rule
		/** @type {number} */ this.birth = (1 << 3);

		// Margolus generation number (decreases with reverse playback)
		/** @type {number} */ this.counterMargolus = 0;

		// maximum Margolus generation number
		/** @type {number} */ this.maxMargolusGen = 0;

		// number of generations
		/** @type {number} */ this.counter = 0;

		// angle of rotation
		/** @type {number} */ this.angle = 0;

		// zoom factor
		/** @type {number} */ this.zoom = 6;
		
		// x and y pan
		/** @type {number} */ this.xOff = 0;
		/** @type {number} */ this.yOff = 0;

		// layer depth
		/** @type {number} */ this.layerDepth = 0.1;

		// current camera settings
		/** @type {number} */ this.camAngle = 0;
		/** @type {number} */ this.camZoom = 1;
		/** @type {number} */ this.camXOff = 0;
		/** @type {number} */ this.camYOff = 0;
		/** @type {number} */ this.camLayerDepth = 0.1;

		// endian flag
		/** @const {boolean} */ this.littleEndian = littleEndian;

		// list of themes
		this.themes = [];

		// current colour range
		this.deadColCurrent = null;
		this.aliveColCurrent = null;
		this.unoccupiedCurrent = null;
		this.aliveGenColCurrent = null;
		this.dyingGenColCurrent = null;
		this.deadGenColCurrent = null;
		this.unoccupiedGenCurrent = null;

		// target colour range
		this.deadColTarget = null;
		this.aliveColTarget = null;
		this.unoccupiedTarget = null;
		this.aliveGenColTarget = null;
		this.dyingGenColTarget = null;
		this.deadGenColTarget = null;
		this.unoccupiedGenTarget = null;

		// number of colour themes (will be computed when themes are added)
		/** @type {number} */ this.numThemes = -1;

		// 8 bit view of image data required if CanvasPixelArray used
		this.data8 = null;

		// 32 bit view of image data
		/** @type {Uint32Array} */ this.data32 = null;

		// image data
		this.imageData = null;

		// drawing context
		this.context = context;

		// bit masks for width and height
		/** @type {number} */ this.widthMask = 0;
		/** @type {number} */ this.heightMask = 0;

		// life tile grid and double buffer
		this.tileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.tileGrid");
		this.nextTileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.nextTileGrid");

		// life grid and double buffer
		this.grid = Array.matrix(Uint8, this.height, ((this.width - 1) >> 3) + 1, 0, this.allocator, "Life.grid");
		this.nextGrid = Array.matrix(Uint8, this.height, ((this.width - 1) >> 3) + 1, 0, this.allocator, "Life.nextGrid");

		// 16bit view of grid and double buffer
		this.grid16 = Array.matrixView(Uint16, this.grid, "Life.grid16");
		this.nextGrid16 = Array.matrixView(Uint16, this.nextGrid, "Life.nextGrid16");

		// blank pixel row for fast clear
		this.blankPixelRow = this.allocator.allocate(Uint32, this.displayWidth, "Life.blankPixelRow");

		// blank row for life grid to prevent wrap
		this.blankRow = this.allocator.allocate(Uint8, ((this.width - 1) >> 3) + 1, "Life.blankRow");

		// blank row for 16bit life grid
		this.blankRow16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.blankRow16");

		// blank tile row to prevent wrap
		this.blankTileRow = this.allocator.allocate(Uint16, this.tileCols >> 4, "Life.blankTileRow");

		// blank colour row
		this.blankColourRow = this.allocator.allocate(Uint8, this.width, "Life.blankColourRow");

		// colour grid
		this.colourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.colourGrid");

		// next colour grid for PCA rules
		/** @type {Array} */ this.nextColourGrid = null;
		this.nextcolourGrid16 = null;
		this.nextcolourGrid32 = null;

		// small colour grid used for zooms < 1
		this.smallColourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallColourGrid");

		// 16bit view of colour grid
		this.colourGrid16 = Array.matrixView(Uint16, this.colourGrid, "Life.colourGrid16");

		// 32bit view of colour grid
		this.colourGrid32 = Array.matrixView(Uint32, this.colourGrid, "Life.colourGrid32");

		// overlay grid for LifeHistory
		this.overlayGrid = null;

		// overlay colour grid used for zooms < 1
		this.smallOverlayGrid = null;
		
		// 16bit view of overlay grid
		this.overlayGrid16 = null;

		// 32bit view of overlay grid
		this.overlayGrid32 = null;

		// colour tile grid
		this.colourTileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.colourTileGrid");

		// colour tile history grid (where life has ever been)
		this.colourTileHistoryGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.colourTileHistoryGrid");

		// state 6 grid for [R]History
		this.state6Mask = null;
		this.state6Cells = null;
		this.state6Alive = null;

		// state6 tile grid for [R]History
		this.state6TileGrid = null;

		// colour definitions
		this.redChannel = this.allocator.allocate(Uint8, 256, "Life.redChannel");
		this.greenChannel = this.allocator.allocate(Uint8, 256, "Life.greenChannel");
		this.blueChannel = this.allocator.allocate(Uint8, 256, "Life.blueChannel");

		// pixel colours
		this.pixelColours = this.allocator.allocate(Uint32, 256, "Life.pixelColours");

		// ruleTree fast lookup
		this.ruleTreeLookup = null;

		// ruleTree lookup bits
		/** @type {number} */ this.ruleTreeLookupBits = 0;

		// 512 bit density all/odd generations
		/** @type {number} */ this.density = 0;
		/** @type {number} */ this.densityOdd = 0;

		// hash lookup for life generation (algorithm 6x3)
		this.indexLookup63 = null;
		this.indexLookup632 = null;

		// triangular lookup
		this.indexLookupTri1 = null;
		this.indexLookupTri2 = null;

		// Margolus lookup
		this.margolusLookup1 = null;
		this.margolusLookup2 = null;

		// Margolus reverse lookup
		this.margolusReverseLookup1 = null;
		this.margolusReverseLookup2 = null;

		// colour lookup for next generation
		this.colourLookup = this.allocator.allocate(Uint16, ((this.aliveMax + 1) * 2) << 8, "Life.colourLookup");

		// fast lookup for colour reset
		this.colourReset = this.allocator.allocate(Uint8, 256 * 8, "Life.colourReset");

		// grid line colour in raw format R G B
		this.gridLineRaw = ViewConstants.gridLineRawDefault;

		// grid line colour
		/** @type {number} */ this.gridLineColour = -1;

		// grid line bold colour in raw format R G B
		/** @type {number} */ this.gridLineBoldRaw = ViewConstants.gridLineBoldRawDefault;

		// grid line bold colour
		/** @type {number} */ this.gridLineBoldColour = -1;

		// grid line major interval and enablement
		/** @type {number} */ this.gridLineMajor = 10;
		/** @type {boolean} */ this.gridLineMajorEnabled = true;

		// user defined grid line major (to restore if theme doesn't define one)
		/** @type {number} */ this.definedGridLineMajor = 10;

		// column occupancy array for grid bounding box calculation
		this.columnOccupied16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.columnOccupied16");

		// row occupancy array for grid bounding box calculation
		this.rowOccupied16 = this.allocator.allocate(Uint16, ((this.height - 1) >> 4) + 1, "Life.rowOccupied16");

		// current maximum grid size
		/** @type {number} */ this.maxGridSize = 8192;

		// graph default colours
		/** @type {Array<number>} */ this.graphBgDefColor = [0, 0, 48];
		/** @type {Array<number>} */ this.graphAxisDefColor = [255, 255, 255];
		/** @type {Array<number>} */ this.graphAliveDefColor = [255, 255, 255];
		/** @type {Array<number>} */ this.graphBirthDefColor = [0, 255, 0];
		/** @type {Array<number>} */ this.graphDeathDefColor = [255, 0, 0];

		// graph current colours
		/** @type {Array<number>} */ this.graphBgColor = [0, 0, 48];
		/** @type {Array<number>} */ this.graphAxisColor = [255, 255, 255];
		/** @type {Array<number>} */ this.graphAliveColor = [255, 255, 255];
		/** @type {Array<number>} */ this.graphBirthColor = [0, 255, 0];
		/** @type {Array<number>} */ this.graphDeathColor = [255, 0, 0];

		// HROT engine
		// @ts-ignore
		this.HROT = new HROT(this.allocator, this, manager);

		// hex or triangle cell coordinates
		this.coords = this.allocator.allocate(Float32, 1, "Life.coords");

		// hex or triangle cell colours
		this.cellColours = this.allocator.allocate(Uint32, 1, "Life.cellColours");

		// number of hex or triangle cells
		/** @type {number} */ this.numCells = 0;
	}

	// initialise pretty rendering
	Life.prototype.initPretty = function() {
		var displayWidth = this.displayWidth,
			displayHeight = this.displayHeight,
			maxZoom = ViewConstants.maxZoom;

		// check if pretty rendering enabled
		if (this.pretty) {
			if (this.sCanvas === null) {
				this.sCanvas = document.createElement("canvas");
			}
			this.sCanvas.width = (displayWidth + maxZoom + maxZoom) << 1;
			this.sCanvas.height = (displayHeight + maxZoom + maxZoom) << 1;
			this.sContext = this.sCanvas.getContext("2d", {alpha: false});
			this.sContext.imageSmoothingQuality = "low";
			this.sImageData = this.sContext.getImageData(0, 0, this.sCanvas.width, this.sCanvas.height);
			this.sData32 = new Uint32Array(this.sImageData.data.buffer);
		} else {
			this.sContext = null;
			this.sImageData = null;
			this.sData32 = null;
		}
	};

	// initialise snow flakes
	Life.prototype.initSnow = function() {
		var /** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ d = 0,
			/** @const {number} */ maxX = this.displayWidth,
			/** @const {number} */ maxY = this.displayHeight,
			/** @const {number} */ yRange = 20 * maxY,
			/** @type {number} */ maxPos = -yRange,
			/** @type {number} */ yVal = 0,
			randGen = this.randGen,
			snowX = null,
			snowY = null,
			snowDY = null;

		// allocate snow flakes
		this.snowX = new Uint16Array(LifeConstants.flakes);
		this.snowY = new Float32Array(LifeConstants.flakes);
		this.snowDY = new Float32Array(LifeConstants.flakes);
		this.snowRevive = new Uint32Array(LifeConstants.flakes);
		snowX = this.snowX;
		snowY = this.snowY;
		snowDY = this.snowDY;

		// position each snowflake
		for (i = 0; i < LifeConstants.flakes; i += 1) {
			// pick integer x position
			snowX[i] = (randGen.random() * maxX) | 0;

			// pick y position as a normal distribution
			yVal = 0;
			for (j = 0; j < 10; j += 1) {
				yVal = yVal + randGen.random() * yRange;
			}
			snowY[i] = -yVal / 10;
			if (snowY[i] > maxPos) {
				maxPos = snowY[i];
			}

			// pick random delta
			snowDY[i] = randGen.random() / 5 + 0.8;

			// check whether there is space to make a big snowflake
			if (i < LifeConstants.flakes - 4) {
				if (randGen.random() < 0.2) {
					x = snowX[i];
					y = snowY[i];
					d = snowDY[i];

					// make a bigger snowflake
					i += 1;
					snowX[i] = x;
					snowY[i] = y - 2;
					snowDY[i] = d;
					i += 1;
					snowX[i] = x;
					snowY[i] = y + 2;
					snowDY[i] = d;
					if (x > 1) {
						i += 1;
						snowX[i] = x - 2;
						snowY[i] = y;
						snowDY[i] = d;
					}
					if (x < maxX - 2) {
						i += 1;
						snowX[i] = x + 2;
						snowY[i] = y;
						snowDY[i] = d;
					}
				}
			}
		}
		for (i = 0; i < LifeConstants.flakes; i += 1) {
			snowY[i] -= maxPos;
		}
	};

	// update and draw snowflakes
	Life.prototype.drawSnow = function() {
		var /** @type {number} */ i = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ r = 0,
			/** @type {number} */ numRevive = 0,
			/** @type {number} */ dx = 0,
			/** @type {number} */ lastX,
			/** @type {number} */ lastY,
			/** @type {number} */ dirY,
			/** @type {number} */ newX,
			/** @type {number} */ newY,
			/** @const {number} */ wd = this.displayWidth,
			/** @const {number} */ ht = this.displayHeight,
			/** @const {number} */ bg = this.pixelColours[0],
			/** @type {Uint32Array} */ screen = this.data32,
			randGen = this.randGen,
			snowX = this.snowX,
			snowY = this.snowY,
			snowDY = this.snowDY,
			snowRevive = this.snowRevive;

		// update each snowflake
		for (i = 0; i < LifeConstants.flakes; i += 1) {
			lastX = snowX[i];
			lastY = snowY[i];
			dirY = snowDY[i];
			newX = lastX;
			newY = lastY;
			// check if the flake is on screen
			if (lastY >= 0 && lastY < ht - 1) {
				// check if the delta moves the flake a pixel down
				if ((lastY | 0) == ((lastY + dirY) | 0)) {
					newY = lastY + dirY;
					// draw the flake at the current position
					screen[(newY | 0) * wd + newX] = -1;
				} else {
					// check if the space below is free
					if (screen[((lastY + dirY) | 0) * wd + lastX] === bg) {
						newY = lastY + dirY;
					} else {
						// space not free so check bottom left or bottom right
						r = randGen.random();
						if (r < 0.05) {
							dx = 1;
							if (r < 0.025) {
								dx = -1;
							}
							if (lastX + dx >= 0 && lastX + dx < wd) {
								if (screen[((lastY + dirY) | 0) * wd + lastX + dx] === bg && screen[(lastY | 0) * wd + lastX + dx] === bg) {
									newX = lastX + dx;
									newY = lastY + dirY;
								}
							}
						}
					}
					// draw the flake at the new position
					screen[(newY | 0) * wd + newX] = -1;
				}
			} else if (lastY < 0) {
				// flake is above the screen so move it down
				newY = lastY + dirY;
			}

			// if the flake is off the bottom then add to revive list
			if (newY >= ht - 1) {
				// add to revive list
				snowRevive[numRevive] = i
				numRevive += 1;
			}
			snowX[i] = newX;
			snowY[i] = newY;
		}

		// process any flakes to be revived
		if (numRevive > 5) {
			for (i = 0; i < numRevive; i += 1) {
				if (randGen.random() < 0.25) {
					j = snowRevive[i];
					newY = -(randGen.random() * ht);
					newX = (randGen.random() * wd) | 0;
					snowX[j] = newX;
					snowY[j] = newY;
					dirY = snowDY[j];
		
					// check whether there is space to make a big snowflake
					if (i < numRevive - 4) {
						if (randGen.random() < 0.2) {
							// make a bigger snowflake
							i += 1;
							j = snowRevive[i];
							snowX[j] = newX;
							snowY[j] = newY - 2;
							snowDY[j] = dirY;
							i += 1;
							j = snowRevive[i];
							snowX[j] = newX;
							snowY[j] = newY + 2;
							snowDY[j] = dirY;
							if (newX > 1) {
								i += 1;
								j = snowRevive[i];
								snowX[j] = newX - 2;
								snowY[j] = newY;
								snowDY[j] = dirY;
							}
							if (newX < wd - 2) {
								i += 1;
								j = snowRevive[i];
								snowX[j] = newX + 2;
								snowY[j] = newY;
								snowDY[j] = dirY;
							}
						}
					}
				}
			}
		}
	};

	// process icons
	Life.prototype.processIcons = function(icons) {
		//var stateCols = this.ruleTreeColours;

		this.ruleTableIcons = icons;
		//if (icons !== null) {  TBD !!!
			//console.debug("states", this.multiNumStates, "colour", stateCols.length, "icons", icons[0].height / icons[0].width, "iconcols", icons[0].colours.length);
		//}
	};

	// initialize oscillator search
	Life.prototype.initSearch = function(on) {
		// zero array index
		this.oscLength = 0;

		// check if search has been switched on
		if (on) {
			// just switched on so check if buffers are allocated
			if (this.hashList === null) {
				// allocate buffers
				this.hashList = this.allocator.allocate(Int32, LifeConstants.maxOscillatorGens, "Life.hashList");
				this.genList = this.allocator.allocate(Uint32, LifeConstants.maxOscillatorGens, "Life.genList");
				this.popList = this.allocator.allocate(Uint32, LifeConstants.maxOscillatorGens, "Life.popList");
				this.bornList = this.allocator.allocate(Uint32, LifeConstants.maxOscillatorGens, "Life.bornList");
				this.diedList = this.allocator.allocate(Uint32, LifeConstants.maxOscillatorGens, "Life.diedList");
				this.boxList = this.allocator.allocate(Uint32, 2 * LifeConstants.maxOscillatorGens, "Life.boxList");
				this.nextList = this.allocator.allocate(Int32, LifeConstants.maxOscillatorGens, "Life.nextList");
				this.countList = Array.matrix(Uint8, this.height, this.width, LifeConstants.cellNotSeen, this.allocator, "Life.countList");
				this.hashBox.leftX = this.width;
				this.hashBox.bottomY = this.height;
				this.hashBox.rightX = 0;
				this.hashBox.topY = 0;
				this.modValue = 0;
				this.modType = -1;
				this.startItem = -1;

				// clear next pointers
				this.nextList.fill(-1);
			}
		} else {
			// just switched off so release buffers
			this.hashList = null;
			this.genList = null;
			this.popList = null;
			this.bornList = null;
			this.diedList = null;
			this.boxList = null;
			this.nextList = null;
			this.countList = null;
			this.modValue = 0;
			this.modType = -1;
			this.startItem = -1;
		}
	};

	// ouput spaceship speed as string
	Life.prototype.spaceshipSpeed = function(period, deltaX, deltaY) {
		var message = deltaX + "," + deltaY;

		// add the speed
		message = "Spaceship (" + message + ")c";

		// add period if greather than 1
		if (period > 1) {
			message += "/" + period;
		}

		return message;
	};

	// get mod hash from pattern
	Life.prototype.getModHash = function(box, transform) {
		var /** @type {number} */ hash = 31415962,
			/** @const {number} */ factor = 1000003,
			left = box.leftX,
			bottom = box.bottomY,
			right = box.rightX,
			top = box.topY,
			width = right - left + 1,
			height = top - bottom + 1,
			wm1 = width - 1,
			hm1 = height - 1,
			checkWidth = width,
			checkHeight = height,
			swap = 0,
			state = 0,
			twoState = this.multiNumStates <= 2,
			x = 0,
			y = 0,
			cx = 0,
			cy = 0,
			iDivHeight = 0,
			iModHeight = 0,
			colourGrid = this.colourGrid,
			aliveStart = LifeConstants.aliveStart;

		// check for PCA or RuleTree rules
		if (this.isPCA || this.isRuleTree) {
			// swap grids every generation
			if ((this.counter & 1) !== 0) {
				colourGrid = this.nextColourGrid;
			}
		}

		// if rotate is used then swap check width and height
		if (transform === LifeConstants.modRot90 || transform === LifeConstants.modRot270 || transform === LifeConstants.modRot90FlipX || transform === LifeConstants.modRot90FlipY) {
			swap = checkWidth;
			checkWidth = checkHeight;
			checkHeight = swap;
		}

		// create a hash from every alive cell
		for (y = 0; y < checkHeight; y += 1) {
			for (x = 0; x < checkWidth; x += 1) {
				// adjust the coordinates based on the transformation
				switch (transform) {
				case LifeConstants.modRot90:
					cx = iDivHeight;
					cy = hm1 - iModHeight;
					break;
				case LifeConstants.modRot180:
					cx = wm1 - x;
					cy = hm1 - y;
					break;
				case LifeConstants.modRot270:
					cx = wm1 - iDivHeight;
					cy = iModHeight;
					break;
				case LifeConstants.modFlipX:
					cx = wm1 - x;
					cy = y;
					break;
				case LifeConstants.modFlipY:
					cx = x;
					cy = hm1 - y;
					break;
				case LifeConstants.modRot90FlipX:
					cx = iDivHeight;
					cy = iModHeight;
					break;
				case LifeConstants.modRot90FlipY:
					cx = wm1 - iDivHeight;
					cy = hm1 - iModHeight;
					break;
				}

				// get the cell state
				if (twoState) {
					if (colourGrid[cy + bottom][cx + left] >= aliveStart) {
						// update the hash
						hash = (hash * factor) ^ y;
						hash = (hash * factor) ^ x;
					}
				} else {
					state = colourGrid[cy + bottom][cx + left];
					if (state > this.historyStates) {
						state -= this.historyStates;
						// adjust sub-cells for PCA rules based on transformation
						if (this.isPCA) {
							switch (transform) {
							case LifeConstants.modRot90:
								state = ((state << 1) & 15) | ((state & 8) >> 3);
								break;
							case LifeConstants.modRot180:
								state = ((state & 3 << 2) | (state & 12 >> 2));
								break;
							case LifeConstants.modRot270:
								state = ((state >> 1) & 15) | ((state & 1) << 3);
								break;
							case LifeConstants.modFlipX:
								state = (state & 5) | ((state & 2) << 2) | ((state & 8) >> 2);
								break;
							case LifeConstants.modFlipY:
								state = (state & 10) | ((state & 1) << 2) | ((state & 4) >> 2);
								break;
							case LifeConstants.modRot90FlipX:
								state = ((state & 8) >> 3) | ((state & 4) >> 1) | ((state & 2) << 1) | ((state & 1) << 3);
								break;
							case LifeConstants.modRot90FlipY:
								state = ((state & 4) << 1) | ((state & 8) >> 1) | ((state & 1) << 1) | ((state & 2) >> 1);
								break;
							}
						}

						// update the hash value
						hash = (hash * factor) ^ y;
						hash = (hash * factor) ^ x;
						hash = (hash * factor) ^ state;
					}
				}
	
				// update index
				iModHeight += 1;
				if (iModHeight === height) {
					iModHeight = 0;
					iDivHeight += 1;
				}
			}
		}

		return hash | 0;
	};

	// check mod hashes
	Life.prototype.checkModHash = function(box) {
		var i = 0,
			trans = LifeConstants.modFirstTrans,
			found = -1,
			hash = 0;

		while (trans <= LifeConstants.modLastTrans && found === -1) {
			hash = this.getModHash(box, trans);

			// search entries
			i = this.startItem;
			while (i !== -1 && found === -1) {
				if (hash === this.hashList[i]) {
					// ignore entries at the current generation
					if (this.genList[i] !== this.counter) {
						found = i;
						this.modType = trans;
					} else {
						i = this.nextList[i];
					}
				} else {
					i = this.nextList[i];
				}
			}
			trans += 1;
		}

		return found;
	};

	// get hash from pattern
	Life.prototype.getHash = function(box, fast) {
		var /** @type {number} */ hash = 31415962,
			/** @const {number} */ factor = 1000003,
			/** @type {number} */ x = box.leftX,
			/** @type {number} */ y = box.bottomY,
			/** @type {number} */ right = box.rightX,
			/** @type {number} */ top = box.topY,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @type {number} */ yshift = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ countN = 0,
			/** @type {number} */ countE = 0,
			/** @type {number} */ countS = 0,
			/** @type {number} */ countW = 0,
			/** @type {boolean} */ twoState = this.multiNumStates <= 2,
			colourGrid = this.colourGrid,
			colourRow = null,
			countList = this.countList,
			countRow = null,
			/** @type {number} */ aliveStart = LifeConstants.aliveStart,
			hashBox = this.hashBox;

		// check for PCA rules
		if (this.isPCA || this.isRuleTree) {
			// swap grids every generation
			if ((this.counter & 1) !== 0) {
				colourGrid = this.nextColourGrid;
			}
		}

		// update bounding box for hash
		if (x < hashBox.leftX) {
			hashBox.leftX = x;
		}
		if (y < hashBox.bottomY) {
			hashBox.bottomY = y;
		}
		if (right > hashBox.rightX) {
			hashBox.rightX = right;
		}
		if (top > hashBox.topY) {
			hashBox.topY = top;
		}

		// create a hash from every alive cell
		for (cy = y; cy <= top; cy += 1) {
			yshift = cy - y;
			colourRow = colourGrid[cy];
			if (twoState) {
				for (cx = x; cx <= right; cx += 1) {
					if (colourRow[cx] >= aliveStart) {
						hash = (hash * factor) ^ yshift;
						hash = (hash * factor) ^ (cx - x);
					}
				}
			} else {
				for (cx = x; cx <= right; cx += 1) {
					// get the raw state
					state = colourRow[cx];
					if (state > this.historyStates) {
						state -= this.historyStates;
						hash = (hash * factor) ^ yshift;
						hash = (hash * factor) ^ (cx - x);
						hash = (hash * factor) ^ state;
					}
				}
			}
		}

		// update count if not fast mode
		if (!fast) {
			for (cy = hashBox.bottomY; cy <= hashBox.topY; cy += 1) {
				colourRow = colourGrid[cy];
				countRow = countList[cy];
				if (twoState) {
					for (cx = hashBox.leftX; cx <= hashBox.rightX; cx += 1) {
						if (colourRow[cx] >= aliveStart) {
							// update count
							if (countRow[cx] === LifeConstants.cellNotSeen) {
								countRow[cx] = LifeConstants.cellWasAlive;
							} else {
								if (countRow[cx] === LifeConstants.cellWasDead) {
									countRow[cx] = LifeConstants.cellHasChanged;
								}
							}
						} else {
							// update count
							if (countRow[cx] === LifeConstants.cellNotSeen) {
								countRow[cx] = LifeConstants.cellWasDead;
							} else {
								if (countRow[cx] === LifeConstants.cellWasAlive) {
									countRow[cx] = LifeConstants.cellHasChanged;
								}
							}
						}
					}
				} else {
					if (this.isPCA) {
						// handle sub-cells
						for (cx = hashBox.leftX; cx <= hashBox.rightX; cx += 1) {
							// get the 4 sub-cell counts
							count = countRow[cx];
	
							// get the 4 sub-cell states
							state = colourRow[cx];
							if (state > this.historyStates) {
								state -= this.historyStates;
							}
	
							// north sub-cell
							countN = count & 3;
							if ((state & 1) !== 0) {
								// update count
								if (countN === LifeConstants.cellNotSeen) {
									countN = LifeConstants.cellWasAlive;
								} else {
									if (countN === LifeConstants.cellWasDead) {
										countN = LifeConstants.cellHasChanged;
									}
								}
							} else {
								// update count
								if (countN === LifeConstants.cellNotSeen) {
									countN = LifeConstants.cellWasDead;
								} else {
									if (countN === LifeConstants.cellWasAlive) {
										countN = LifeConstants.cellHasChanged;
									}
								}
							}
	
							// east sub-cell
							countE = (count >> 2) & 3;
							if ((state & 2) !== 0) {
								// update count
								if (countE === LifeConstants.cellNotSeen) {
									countE = LifeConstants.cellWasAlive;
								} else {
									if (countE === LifeConstants.cellWasDead) {
										countE = LifeConstants.cellHasChanged;
									}
								}
							} else {
								// update count
								if (countE === LifeConstants.cellNotSeen) {
									countE = LifeConstants.cellWasDead;
								} else {
									if (countE === LifeConstants.cellWasAlive) {
										countE = LifeConstants.cellHasChanged;
									}
								}
							}
	
							// south sub-cell
							countS = (count >> 4) & 3;
							if ((state & 4) !== 0) {
								// update count
								if (countS === LifeConstants.cellNotSeen) {
									countS = LifeConstants.cellWasAlive;
								} else {
									if (countS === LifeConstants.cellWasDead) {
										countS = LifeConstants.cellHasChanged;
									}
								}
							} else {
								// update count
								if (countS === LifeConstants.cellNotSeen) {
									countS = LifeConstants.cellWasDead;
								} else {
									if (countS === LifeConstants.cellWasAlive) {
										countS = LifeConstants.cellHasChanged;
									}
								}
							}
	
							// west sub-cell
							countW = (count >> 6) & 3;
							if ((state & 8) !== 0) {
								// update count
								if (countW === LifeConstants.cellNotSeen) {
									countW = LifeConstants.cellWasAlive;
								} else {
									if (countW === LifeConstants.cellWasDead) {
										countW = LifeConstants.cellHasChanged;
									}
								}
							} else {
								// update count
								if (countW === LifeConstants.cellNotSeen) {
									countW = LifeConstants.cellWasDead;
								} else {
									if (countW === LifeConstants.cellWasAlive) {
										countW = LifeConstants.cellHasChanged;
									}
								}
							}

							// combine the counts
							countRow[cx] = countN | (countE << 2) | (countS << 4) | (countW << 6);
						}
					} else {
						for (cx = hashBox.leftX; cx <= hashBox.rightX; cx += 1) {
							if (colourRow[cx] > this.historyStates) {
								// update count
								if (countRow[cx] === LifeConstants.cellNotSeen) {
									countRow[cx] = LifeConstants.cellWasAlive;
								} else {
									if (countRow[cx] === LifeConstants.cellWasDead) {
										countRow[cx] = LifeConstants.cellHasChanged;
									}
								}
							} else {
								// update count
								if (countRow[cx] === LifeConstants.cellNotSeen) {
									countRow[cx] = LifeConstants.cellWasDead;
								} else {
									if (countRow[cx] === LifeConstants.cellWasAlive) {
										countRow[cx] = LifeConstants.cellHasChanged;
									}
								}
							}
						}
					}
				}
			}
		}

		return hash | 0;
	};

	// return identify results
	Life.prototype.identifyResults = function(i, message, period, deltaX, deltaY, boxWidth, boxHeight, fast) {
			// simple version of speed
		var simpleSpeed = "",

			// generation
			genMessage = String(this.counter - period),

			// type
			type = "",

			// direction
			direction = "",

			// slope
			slope = "",

			// max and min population
			min = this.population,
			max = min,
			avg = this.population,
			total = 0,
			popResult = "",

			// bounding box
			current = 0,
			currentWidth = 0,
			currentHeight = 0,
			currentLeft = 0,
			currentBottom = 0,
			minX = 16384,
			maxX = 0,
			minY = 16384,
			maxY = 0,
			boxResult = "",

			// last record to check
			last = this.oscLength,
			start = i,

			// heat
			minHeat = 16384,
			maxHeat = 0,
			avgHeat = 0,
			nextHeat = 0,
			heatVal = 0,
			heat = "",

			// volatility
			volatility = "",

			// count list
			countList = this.countList,
			countRow = null,
			count = 0,
			rotor = 0,
			stator = 0,
			activeResult = "",

			// mod value
			modValue = this.modValue,
			modResult = "",

			// temperature
			tempResult = "",

			// counters
			x = 0,
			y = 0;

		// only use one generation for still life
		if (period > 0) {
			genMessage += " and " + this.counter;
		}

		// check for movement
		deltaX = Math.abs(deltaX);
		deltaY = Math.abs(deltaY);
		
		// if a spaceship then compute simpified speed
		if (deltaX > 0 || deltaY > 0) {
			type = "Spaceship";
			if (deltaX === 0 || deltaY === 0) {
				slope = "0";
			} else {
				if (deltaX > deltaY) {
					slope = String((deltaX / deltaY) | 0);
				} else {
					slope = String((deltaY / deltaX) | 0);
				}
			}
			if ((deltaX === deltaY) || (deltaX === 0) || (deltaY === 0)) {
				if ((deltaX === deltaY) && (deltaX !== 0)) {
					direction = "Diagonal";
				} else {
					direction = "Orthogonal";
				}
				if (deltaX === 0) {
					deltaX = deltaY;
				}
				if (deltaX > 1) {
					if (period === 1) {
						simpleSpeed = deltaX + "c";
					} else {
						if (period % deltaX === 0) {
							simpleSpeed = "c/" + (period / deltaX) + " | " + deltaX + "c/" + period;
						} else {
							simpleSpeed = deltaX + "c/" + period;
						}
					}
				} else {
					// delta = 1
					simpleSpeed = "c";
					if (period > 1) {
						simpleSpeed += "/" + period;
					}
				}
			} else {
				direction = "Oblique";
				simpleSpeed = deltaX + "," + deltaY + "c";
				if (period > 1) {
					simpleSpeed += "/" + period;
				}
			}
		} else {
			if (period === 1) {
				type = "Still Life";
			} else {
				// oscillator
				type = "Oscillator";
			}
		}
		
		// compute the min and max population
		total = 0;
		while (i < last) {
			current = this.popList[i];
			total += current;
			if (current < min) {
				min = current;
			}
			if (current > max) {
				max = current;
			}
			i += 1;
		}
		if (min === max) {
			// if min and max are the same then just output one
			popResult = String(min);
		} else {
			// otherwise output min, max and average
			avg = total / (last - start);
			popResult = String(min) + " | " + String(max) + " | " + String(avg.toFixed(1));
		}

		// compute the bounding box
		i = start;
		if (type === "Spaceship") {
			while (i < last) {
				current = this.boxList[i << 1];
				currentWidth = current >> 16;
				currentHeight = current & 65535;
				if (currentWidth > boxWidth) {
					boxWidth = currentWidth;
				}
				if (currentHeight > boxHeight) {
					boxHeight = currentHeight;
				}
				i += 1;
			}
		} else {
			while (i < last) {
				current = this.boxList[i << 1];
				currentWidth = current >> 16;
				currentHeight = current & 65535;
				current = this.boxList[(i << 1) + 1];
				currentLeft = current >> 16;
				currentBottom = current & 65535;
	
				// update bounding box
				if (currentLeft < minX) {
					minX = currentLeft;
				}
				if (currentBottom < minY) {
					minY = currentBottom;
				}
				if (currentLeft + currentWidth - 1 > maxX) {
					maxX = currentLeft + currentWidth - 1;
				}
				if (currentBottom + currentHeight - 1 > maxY) {
					maxY = currentBottom + currentHeight - 1;
				}
				i += 1;
			}
			boxWidth = maxX - minX + 1;
			boxHeight = maxY - minY + 1;
		}
		boxResult = String(boxWidth + " x " + boxHeight + " = " + (boxWidth * boxHeight));

		// compute the heat
		if (period > 0) {
			heatVal = 0;
			i = start;
			while (i < last) {
				nextHeat = this.bornList[i] + this.diedList[i];
				if (nextHeat < minHeat) {
					minHeat = nextHeat;
				}
				if (nextHeat > maxHeat) {
					maxHeat = nextHeat;
				}
				heatVal += nextHeat;
				i += 1;
			}
			// if min and max are the same then just output onej
			if (minHeat === maxHeat) {
				avgHeat = minHeat;
				heat = String(avgHeat.toFixed(1));
			} else {
				// output min, max and average
				avgHeat = heatVal / (last - start);
				heat = String(minHeat.toFixed(1) + " | " + maxHeat.toFixed(1) + " | " + avgHeat.toFixed(1));
			}
		}
	
		// compute volatility
		if (type === "Oscillator" && !fast) {
			for (y = minY; y <= maxY; y += 1) {
				countRow = countList[y];
				if (this.isPCA) {
					// handle PCA sub-cells
					for (x = minX; x <= maxX; x += 1) {
						count = countRow[x];

						// north sub-cell
						if ((count & 3) === LifeConstants.cellHasChanged) {
							rotor += 1;
						} else {
							if ((count & 3) === LifeConstants.cellWasAlive) {
								stator += 1;
							}
						}

						// east sub-cell
						count >>= 2;
						if ((count & 3) === LifeConstants.cellHasChanged) {
							rotor += 1;
						} else {
							if ((count & 3) === LifeConstants.cellWasAlive) {
								stator += 1;
							}
						}

						// south sub-cell
						count >>= 2;
						if ((count & 3) === LifeConstants.cellHasChanged) {
							rotor += 1;
						} else {
							if ((count & 3) === LifeConstants.cellWasAlive) {
								stator += 1;
							}
						}

						// west sub-cell
						count >>= 2;
						if ((count & 3) === LifeConstants.cellHasChanged) {
							rotor += 1;
						} else {
							if ((count & 3) === LifeConstants.cellWasAlive) {
								stator += 1;
							}
						}
					}
				} else {
					for (x = minX; x <= maxX; x += 1) {
						if (countRow[x] === LifeConstants.cellHasChanged) {
							rotor += 1;
						} else {
							if (countRow[x] === LifeConstants.cellWasAlive) {
								stator += 1;
							}
						}
					}
				}
			}
			volatility = String((rotor / (rotor + stator)).toFixed(2));
		}

		// temperature
		if (type === "Oscillator" && !fast) {
			tempResult = String((avgHeat / (rotor + stator)).toFixed(2) + " | " + (avgHeat / rotor).toFixed(2));
		}

		// active cells
		if (!fast) {
			activeResult = String(rotor + " | " + stator + " | " + (rotor + stator));
		}

		// mod value
		if (!fast) {
			if (modValue === 0) {
				modValue = period;
				modResult = String(modValue);
			} else {
				// check the mod is a divisor of the period
				if (period % modValue === 0) {
					modResult = String(modValue) + " (" + LifeConstants.modTypeName[this.modType] + ")";
				} else {
					modValue = period;
					modResult = String(modValue);
				}
			}
		}

		// return the result
		return [message, type, direction, simpleSpeed, boxResult, genMessage, popResult, slope, period, heat, volatility, modResult, activeResult, tempResult];
	};

	// return true if pattern is empty, stable, oscillating or a spaceship
	Life.prototype.oscillating = function(fast) {
		// get bounding box
		var box = (this.isHROT ? this.HROTBox : this.zoomBox),
		leftX = box.leftX,
		bottomY = box.bottomY,
		rightX = box.rightX,
		topY = box.topY,
		boxWidth = rightX - leftX + 1,
		boxHeight = topY - bottomY + 1,

		// merge size into one value
		boxSize = (boxWidth << 16) | boxHeight,

		// merge location into one value
		boxLocation = (leftX << 16) | bottomY,

		// hash value of current pattern
		hash = 0,
		modHash = 0,
		currentValue = 0,

		// period
		period = 0,

		// flag to quit loop
		quitLoop = false,
		quit = false,

		// hash entry index
		i = 0,
		j = 0,
		lastI = 0,

		// movement vector
		deltaX = 0,
		deltaY = 0,

		// message
		message = "",

		// result
		result = [];

		// for alternating rules skip odd generations
		if (this.altSpecified && ((this.counter & 1) !== 0)) {
			return result;
		}

		// check buffer
		if (this.oscLength < LifeConstants.maxOscillatorGens) {
			// check population
			if (this.population === 0) {
				result = ["Empty Pattern", "Empty"];
				boxWidth = 0;
				boxHeight = 0;
				quit = true;
			} else {
				// get the hash of the current pattern
				hash = this.getHash(box, fast);

				// search hash list for match
				quitLoop = false;

				// get the start item
				i = this.startItem;
				lastI = -1;

				// search the hash list
				while ((i !== -1) && !quitLoop) {
					currentValue = this.hashList[i];
					if (hash > currentValue) {
						// hash value greater so try next
						lastI = i;
						i = this.nextList[i];
					} else {
						if (hash < this.hashList[i]) {
							// hash value less so truncate list here
							quitLoop = true;
						} else {
							if (hash === this.hashList[i]) {
								j = i << 1;
								// hash matched so check population and bounding box
								if ((this.population === this.popList[i]) && boxSize === this.boxList[j]) {
									period = this.counter - this.genList[i];
		
									if (this.boxList[j + 1] === boxLocation) {
										// pattern hasn't moved
										if (period === 1) {
											message = "Still Life";
										} else {
											message = "Oscillator period " + period;
										}
									} else {
										// pattern is moving
										deltaX = leftX - (this.boxList[j + 1] >> 16);
										deltaY = bottomY - (this.boxList[j + 1] & 65535);
										message = this.spaceshipSpeed(period, deltaX, deltaY);
									}
									quitLoop = true;
									quit = true;
	
									// create the results
									result = this.identifyResults(i, message, period, deltaX, deltaY, boxWidth, boxHeight, fast);
								} else {
									// false positive so try next
									lastI = i;
									i = this.nextList[i];
								}
							}
						}
					}
				}
			
				// add to the lists
				if (!quit) {
					// create the new record
					this.hashList[this.oscLength] = hash;
					this.genList[this.oscLength] = this.counter;
					this.popList[this.oscLength] = this.population;
					this.bornList[this.oscLength] = this.births;
					this.diedList[this.oscLength] = this.deaths;
					this.boxList[this.oscLength << 1] = boxSize;
					this.boxList[(this.oscLength << 1) + 1] = (leftX << 16) | bottomY;
					this.nextList[this.oscLength] = -1;

					// point the previous record at this one
					if (this.startItem === -1) {
						this.startItem = 0;
					} else {
						if (lastI === -1) {
							this.startItem = this.oscLength;
						} else {
							this.nextList[lastI] = this.oscLength;
						}
					}

					// check for mod matches if one hasn't already been found
					if (this.modValue === 0 && !fast) {
						modHash = this.checkModHash(box);
						if (modHash !== -1) {
							this.modValue = this.counter - this.genList[modHash];
						}
					}
	
					// check for buffer full
					this.oscLength += 1;
					if (this.oscLength === LifeConstants.maxOscillatorGens) {
						this.oscLength = 0;
						result = [LifeConstants.bufferFullMessage];
					}
				}
			}
		}

		// return results
		return result;
	};

	// draw triangle cells in selection
	Life.prototype.drawTriangleCellsInSelection = function(leftX, bottomY, rightX, topY, xOff, yOff, cells) {
		var /** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ m = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @const {number} */ w2 = this.width / 2 - 0.25,
			/** @const {number} */ h2 = this.height / 2,
			/** @type {number} */ state = 0,
			/** @type {Array<number>} */ coords = this.coords,
			/** @type {Array<number>} */ colours = this.cellColours,
			/** @type {number} */ yOff1 = this.height / 2 - this.yOff - this.originY + 0.5,
			/** @type {number} */ xOff1 = this.width / 2 - this.xOff - this.originX + 0.5,
			/** @type {number} */ zoom = this.zoom * this.originZ,
			/** @type {number} */ displayY = 0,
			/** @type {number} */ displayX = 0,
			/** @type {number} */ xOffset = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ oddEven = 0;

		// order coordinates
		if (leftX > rightX) {
			swap = rightX;
			rightX = leftX;
			leftX = swap;
		}
		if (bottomY > topY) {
			swap = topY;
			topY = bottomY;
			bottomY = swap;
		}
		leftX += xOff;
		rightX += xOff;
		bottomY += yOff;
		topY += yOff;

		// check if buffers have been allocated
		if (colours.length !== LifeConstants.coordBufferSize) {
			this.coords = this.allocator.allocate(Float32, 12 * LifeConstants.coordBufferSize, "Life.coords");
			this.cellColours = this.allocator.allocate(Uint32, LifeConstants.coordBufferSize, "Life.cellColours");
			coords = this.coords;
			colours = this.cellColours;
		}

		// create triangles
		this.context.lineWidth = 1.6;
		this.context.lineCap = "butt";
		this.context.lineJoin = "bevel";
		j = 0;
		k = 0;
		for (y = bottomY; y <= topY; y += 1) {
			// clip y to window
			displayY = (((y - h2) + yOff1) * zoom) + halfDisplayHeight;
			if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
				cy = (y - h2);
				xOffset = xOff1 - w2;
				for (x = leftX; x <= rightX; x += 1) {
					if (cells[m] > 0) {
						displayX = ((x + xOffset) * zoom) + halfDisplayWidth;
						if (displayX >= -zoom && displayX < this.displayWidth + zoom * 2) {
							// encode coordinate index into the colour state so it can be sorted later
							colours[j] = (state << LifeConstants.coordBufferBits) + k;
							cx = x - w2;
							oddEven = ((x + y) & 1);
							coords[k] = cx - 1;
							coords[k + 1] = cy + oddEven;
							coords[k + 2] = cx + 1;
							coords[k + 3] = cy + oddEven;
							coords[k + 4] = cx;
							coords[k + 5] = cy + 1 - oddEven;
							k += 6;
							j += 1;
	
							// check if buffer is full
							if (j === LifeConstants.coordBufferSize) {
								// draw buffer
								this.numCells = j;
								this.drawTriangleCells(true, false, true);
	
								// clear buffer
								j = 0;
								k = 0;
							}
						}
					}
					// next cell
					m += 1;
				}
			} else {
				// next row
				m += (rightX - leftX + 1);
			}
		}

		// draw any remaining cells
		this.numCells = j;
		if (j > 0) {
			// draw buffer
			this.drawTriangleCells(true, false, true);

			// clear buffer
			j = 0;
			k = 0;
		}
	};

	// draw triangle selection
	Life.prototype.drawTriangleSelection = function(leftX, bottomY, rightX, topY, xOff, yOff) {
		var /** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @const {number} */ w2 = this.width / 2 - 0.25,
			/** @const {number} */ h2 = this.height / 2,
			/** @type {number} */ state = 0,
			/** @type {Array<number>} */ coords = this.coords,
			/** @type {Array<number>} */ colours = this.cellColours,
			/** @type {number} */ yOff1 = this.height / 2 - this.yOff - this.originY + 0.5,
			/** @type {number} */ xOff1 = this.width / 2 - this.xOff - this.originX + 0.5,
			/** @type {number} */ zoom = this.zoom * this.originZ,
			/** @type {number} */ displayY = 0,
			/** @type {number} */ displayX = 0,
			/** @type {number} */ xOffset = 0,
			/** @type {number} */ swap = 0,
			/** @type {number} */ oddEven = 0;

		// order coordinates
		if (leftX > rightX) {
			swap = rightX;
			rightX = leftX;
			leftX = swap;
		}
		if (bottomY > topY) {
			swap = topY;
			topY = bottomY;
			bottomY = swap;
		}
		leftX += xOff;
		rightX += xOff;
		bottomY += yOff;
		topY += yOff;

		// check if buffers have been allocated
		if (colours.length !== LifeConstants.coordBufferSize) {
			this.coords = this.allocator.allocate(Float32, 12 * LifeConstants.coordBufferSize, "Life.coords");
			this.cellColours = this.allocator.allocate(Uint32, LifeConstants.coordBufferSize, "Life.cellColours");
			coords = this.coords;
			colours = this.cellColours;
		}

		// create triangles
		this.context.lineWidth = 1.6;
		this.context.lineCap = "butt";
		this.context.lineJoin = "bevel";
		j = 0;
		k = 0;
		for (y = bottomY; y <= topY; y += 1) {
			// clip y to window
			displayY = (((y - h2) + yOff1) * zoom) + halfDisplayHeight;
			if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
				cy = (y - h2);
				xOffset = xOff1 - w2;
				for (x = leftX; x <= rightX; x += 1) {
					displayX = ((x + xOffset) * zoom) + halfDisplayWidth;
					if (displayX >= -zoom && displayX < this.displayWidth + zoom * 2) {
						// encode coordinate index into the colour state so it can be sorted later
						colours[j] = (state << LifeConstants.coordBufferBits) + k;
						cx = x - w2;
						oddEven = ((x + y) & 1);
						coords[k] = cx - 1;
						coords[k + 1] = cy + oddEven;
						coords[k + 2] = cx + 1;
						coords[k + 3] = cy + oddEven;
						coords[k + 4] = cx;
						coords[k + 5] = cy + 1 - oddEven;
						k += 6;
						j += 1;

						// check if buffer is full
						if (j === LifeConstants.coordBufferSize) {
							// draw buffer
							this.numCells = j;
							this.drawTriangleCells(true, false, true);

							// clear buffer
							j = 0;
							k = 0;
						}
					}
				}
			}
		}

		// draw any remaining cells
		this.numCells = j;
		if (j > 0) {
			// draw buffer
			this.drawTriangleCells(true, false, true);

			// clear buffer
			j = 0;
			k = 0;
		}
	};

	// draw triangles 
	Life.prototype.drawTriangles = function() {
		var colourGrid = this.colourGrid,
			colourRow = null,
			overlayGrid = this.overlayGrid,
			overlayRow = null,
			zoomBox = this.historyBox,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @const {number} */ w2 = this.width / 2 - 0.25,
			/** @const {number} */ h2 = this.height / 2,
			/** @type {number} */ state = 0,
			/** @type {number} */ overState = 0,
			/** @type {number} */ state3 = ViewConstants.stateMap[3] + 128,
			/** @type {number} */ state4 = ViewConstants.stateMap[4] + 128,
			/** @type {number} */ state5 = ViewConstants.stateMap[5] + 128,
			/** @type {number} */ state6 = ViewConstants.stateMap[6] + 128,
			/** @type {number} */ aliveStart = this.aliveStart,
			/** @type {Array<number>} */ coords = this.coords,
			/** @type {Array<number>} */ colours = this.cellColours,
			/** @type {number} */ leftX = zoomBox.leftX,
			/** @type {number} */ rightX = zoomBox.rightX,
			/** @type {number} */ bottomY = zoomBox.bottomY,
			/** @type {number} */ topY = zoomBox.topY,
			/** @type {number} */ yOff = this.height / 2 - this.yOff - this.originY + 0.5,
			/** @type {number} */ xOff = this.width / 2 - this.xOff - this.originX + 0.5,
			/** @type {number} */ zoom = this.zoom * this.originZ,
			/** @type {number} */ displayY = 0,
			/** @type {number} */ displayX = 0,
			/** @type {number} */ xOffset = 0,
			/** @type {number} */ oddEven = 0,
			/** @type {boolean} */ drawFilledCellBorders = !this.displayGrid && !this.cellBorders;

		// switch buffers if required
		if (this.isRuleTree && ((this.counter & 1) !== 0)) {
			colourGrid = this.nextColourGrid;
		}

		// check if buffers have been allocated
		if (colours.length !== LifeConstants.coordBufferSize) {
			this.coords = this.allocator.allocate(Float32, 12 * LifeConstants.coordBufferSize, "Life.coords");
			this.cellColours = this.allocator.allocate(Uint32, LifeConstants.coordBufferSize, "Life.cellColours");
			coords = this.coords;
			colours = this.cellColours;
		}

		// use bounded grid if defined
		if (this.boundedGridType !== -1) {
			if (this.boundedGridWidth !== 0) {
				// set width to included bounded grid cells
				leftX = Math.round((this.width - this.boundedGridWidth) / 2) - 1;
				rightX = leftX + this.boundedGridWidth - 1 + 2;
			} else {
				// infinite width so set to grid width
				leftX = 0;
				rightX = this.width - 1;
			}

			if (this.boundedGridHeight !== 0) {
				// set height to included bounded grid cells
				bottomY = Math.round((this.height - this.boundedGridHeight) / 2) - 1;
				topY = bottomY + this.boundedGridHeight - 1 + 2;
			} else {
				// infinite height to set to grid height
				bottomY = 0;
				topY = this.height - 1;
			}
		}

		// create triangles from live cells
		this.context.lineWidth = 1.6;
		this.context.lineCap = "butt";
		this.context.lineJoin = "bevel";
		j = 0;
		k = 0;
		for (y = bottomY; y <= topY; y += 1) {
			// clip y to window
			displayY = (((y - h2) + yOff) * zoom) + halfDisplayHeight;
			if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
				colourRow = colourGrid[y];
				if (overlayGrid) {
					overlayRow = overlayGrid[y];
				}
				cy = (y - h2);
				xOffset = xOff - w2;
				for (x = leftX; x <= rightX; x += 1) {
					displayX = ((x + xOffset) * zoom) + halfDisplayWidth;
					if (displayX >= -zoom && displayX < this.displayWidth + zoom * 2) {
						state = colourRow[x];
						if (overlayRow) {
							overState = overlayRow[x];
							if (overState === state4 || overState === state6) {
								if (state > aliveStart) {
									state = state3;
								} else {
									state = overState;
								}
							} else {
								if (overState === state3 || overState === state5) {
									if (state < aliveStart) {
										state = state4;
									} else {
										state = overState;
									}
								}
							}
						}
						if (state > 0) {
							// encode coordinate index into the colour state so it can be sorted later
							colours[j] = (state << LifeConstants.coordBufferBits) + k;
							cx = x - w2;
							oddEven = ((x + y) & 1);
							coords[k] = cx - 1;
							coords[k + 1] = cy + oddEven;
							coords[k + 2] = cx + 1;
							coords[k + 3] = cy + oddEven;
							coords[k + 4] = cx;
							coords[k + 5] = cy + 1 - oddEven;
							k += 6;
							j += 1;
						}
						// check if buffer is full
						if (j === LifeConstants.coordBufferSize) {
							// draw buffer
							this.numCells = j;
							this.drawTriangleCells(true, drawFilledCellBorders, false);

							// draw cell borders if enabled and grid lines disabled
							if (this.cellBorders && !this.displayGrid) {
								this.context.strokeStyle = "rgb(" + this.redChannel[0] + "," + this.blueChannel[0] + "," + this.greenChannel[0] + ")";
								this.drawTriangleCells(false, false, false);
							}

							// clear buffer
							j = 0;
							k = 0;
						}
					}
				}
			}
		}

		// draw any remaining cells
		this.numCells = j;
		if (j > 0) {
			// draw buffer
			this.drawTriangleCells(true, drawFilledCellBorders, false);

			// draw cell borders if enabled and grid lines disabled
			if (this.cellBorders && !this.displayGrid) {
				this.context.strokeStyle = "rgb(" + this.redChannel[0] + "," + this.blueChannel[0] + "," + this.greenChannel[0] + ")";
				this.drawTriangleCells(false, false, false);
			}

			// clear buffer
			j = 0;
			k = 0;
		}

		// draw grid if enabled
		if (this.displayGrid) {
			// set grid line colour
			this.context.strokeStyle = "rgb(" + (this.gridLineRaw >> 16) + "," + ((this.gridLineRaw >> 8) & 255) + "," + (this.gridLineRaw & 255) + ")";
			this.context.lineWidth = 1;

			// create cell coordinates for window
			bottomY = ((-halfDisplayHeight / zoom) - yOff + h2) | 0;
			topY = ((halfDisplayHeight / zoom) - yOff + h2) | 0;

			j = 0;
			for (y = bottomY; y <= topY; y += 1) {
				// clip y to window
				displayY = (((y - h2) + yOff) * zoom) + halfDisplayHeight;
				if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
					colourRow = colourGrid[y];
					cy = (y - h2);
					xOffset = xOff - w2;
					leftX = ((-halfDisplayWidth / zoom) - xOffset - zoom) | 0;
					rightX = ((halfDisplayWidth / zoom) - xOffset + zoom) | 0;
					for (x = leftX; x <= rightX; x += 1) {
						displayX = ((x + xOffset) * zoom) + halfDisplayWidth;
						if (displayX >= -zoom && displayX < this.displayWidth + zoom) {
							cx = x - w2;
							oddEven = ((x + y) & 1);
							coords[k] = cx - 1;
							coords[k + 1] = cy + oddEven;
							coords[k + 2] = cx + 1;
							coords[k + 3] = cy + oddEven;
							coords[k + 4] = cx;
							coords[k + 5] = cy + 1 - oddEven;
							k += 6;
							j += 1;
						}
						// check if buffer is full
						if (j === LifeConstants.coordBufferSize) {
							// draw and clear buffer
							this.numCells = j;
							this.drawTriangleCells(false, false, false);
							j = 0;
							k = 0;
						}
					}
				}
			}

			// draw any remaining cells
			this.numCells = j;
			if (j > 0) {
				this.drawTriangleCells(false, false, false);
			}
		}
	};

	// draw triangle cells
	Life.prototype.drawTriangleCells = function(/** @type {boolean} */ filled, /** @type {boolean} */ borderWhenFilled, /** @type {boolean} */ drawingSelection) {
		var /** @type {number} */ i = 0,
			context = this.context,
			/** @type {number} */ xOff = this.width / 2 - this.xOff - this.originX,
			/** @type {number} */ yOff = this.height / 2 - this.yOff - this.originY,
			/** @const {number} */ xzoom = this.zoom * this.originZ,
			/** @const {number} */ yzoom = this.zoom * this.originZ * ViewConstants.sqrt3,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ cx2 = 0,
			/** @type {number} */ cy2 = 0,
			/** @type {number} */ coord = 0,
			/** @type {number} */ cx0 = 0,
			/** @type {number} */ cy0 = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ lastState = -1,
			/** @type {Array<number>} */ coords = this.coords,
			/** @const {number} */ numCoords = this.numCells,
			/** @type {Array<number>} */ colours = this.cellColours,
			/** @const {number} */ mask = (1 << LifeConstants.coordBufferBits) - 1;

		// if triangles are filled then sort by colour
		// check for sort function since IE doesn't have it
		if (filled && !drawingSelection && colours.sort) {
			// ensure unused buffer is at end
			state = (LifeConstants.coordBufferSize << LifeConstants.coordBufferBits) + 256;
			for (i = numCoords; i < LifeConstants.coordBufferSize; i += 1) {
				colours[i] = state;
			}
			colours.sort();
		}

		// draw each triangle
		context.beginPath();
		if (!filled) {
			// if drawing the grid then draw in order since all triangles are the grid colour
			coord = 0;
			state = 0;
			lastState = 0;
		}
		for (i = 0; i < numCoords; i += 1) {
			// get next triangle offset
			if (filled) {
				state = colours[i];
				coord = state & mask;
				state = state >> LifeConstants.coordBufferBits;
			}

			// get triangle start position
			cx0 = coords[coord];
			cy0 = coords[coord + 1];
			coord += 2;

			// draw the triangle
			y = ((cy0 + yOff) * yzoom) + halfDisplayHeight;
			x = ((cx0 + xOff) * xzoom) + halfDisplayWidth;
			cy2 = (coords[coord + 1] - cy0) * yzoom;
			cx2 = (coords[coord] - cx0) * xzoom;
			coord += 2;
	
			// set line colour
			if (state !== lastState) {
				lastState = state;
				if (i > 0) {
					// draw the batch of cells at the current colour
					if (filled) {
						// draw border if required
						if (borderWhenFilled) {
							context.stroke();
						}
						// fill the cells
						context.fill();
					} else {
						context.stroke();
					}
					// start a new batch
					context.beginPath();
				}
				if (filled) {
					// set the new cell colours
					if (!drawingSelection) {
						context.fillStyle = this.cellColourStrings[state];
						if (borderWhenFilled) {
							context.strokeStyle = this.cellColourStrings[state];
						}
					}
				}
			}

			// draw triangle
			context.moveTo(x | 0, y | 0);
			context.lineTo((cx2 + x) | 0, (cy2 + y) | 0);
			context.lineTo((cx2 + x) | 0, y | 0);
			cy2 = (coords[coord + 1] - cy0) * yzoom;
			cx2 = (coords[coord] - cx0) * xzoom;
			context.lineTo((cx2 + x) | 0, (cy2 + y) | 0);
			coord += 2;
		}

		// draw the final batch of cells
		if (filled) {
			// draw cell borders if required
			if (borderWhenFilled) {
				context.stroke();
			}
			// fill cells
			context.fill();
		} else {
			context.stroke();
		}
	};

	// draw hex cells in selection
	Life.prototype.drawHexCellsInSelection = function(leftX, bottomY, rightX, topY, xOff, yOff, cells) {
		var /** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ m = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @const {number} */ w2 = this.width / 2 - 0.25,
			/** @const {number} */ h2 = this.height / 2,
			/** @const {number} */ pi3 = Math.PI / 3,
			/** @const {number} */ yEdge = 0.5 / Math.cos(pi3 / 2) * 1.16, 
			/** @const {number} */ xEdge = (ViewConstants.sqrt3 / 4) / Math.cos(pi3 / 2) * 1.16,
			/** @const {Array<number>} */ xa = [],
			/** @const {Array<number>} */ ya = [],
			/** @type {number} */ state = 0,
			/** @type {number} */ xa0 = 0,
			/** @type {number} */ ya0 = 0,
			/** @type {number} */ xa1 = 0,
			/** @type {number} */ ya1 = 0,
			/** @type {number} */ xa2 = 0,
			/** @type {number} */ ya2 = 0,
			/** @type {number} */ xa3 = 0,
			/** @type {number} */ ya3 = 0,
			/** @type {number} */ xa4 = 0,
			/** @type {number} */ ya4 = 0,
			/** @type {number} */ xa5 = 0,
			/** @type {number} */ ya5 = 0,
			/** @type {Array<number>} */ coords = this.coords,
			/** @type {Array<number>} */ colours = this.cellColours,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** @type {number} */ xOff1 = this.width / 2 - this.xOff - this.originX,
			/** @type {number} */ yOff1 = this.height / 2 - this.yOff - this.originY,
			/** @const {number} */ hexAdjust = -(this.height >> 2),
			/** @type {number} */ displayX = 0,
			/** @type {number} */ displayY = 0,
			/** @type {number} */ zoom = this.camZoom,
			/** @type {number} */ swap = 0;

		// adjust for hex
		xOff1 += yOff1 / 2;
		xOff1 = xOff1 + hexAdjust + 0.5;
		yOff1 = yOff1 + 0.5;

		// order coordinates
		if (leftX > rightX) {
			swap = rightX;
			rightX = leftX;
			leftX = swap;
		}
		if (bottomY > topY) {
			swap = topY;
			topY = bottomY;
			bottomY = swap;
		}
		leftX += xOff;
		rightX += xOff;
		bottomY += yOff;
		topY += yOff;

		// check if buffers have been allocated
		if (colours.length !== LifeConstants.coordBufferSize) {
			this.coords = this.allocator.allocate(Float32, 12 * LifeConstants.coordBufferSize, "Life.coords");
			this.cellColours = this.allocator.allocate(Uint32, LifeConstants.coordBufferSize, "Life.cellColours");
			coords = this.coords;
			colours = this.cellColours;
		}

		// create hexagon coordinates
		k = pi3 / 2;
		for (j = 0; j <= 5; j += 1) {
			xa[j] = Math.cos(k) * xEdge;
			ya[j] = Math.sin(k) * yEdge;
			xa[j] += ya[j] / 2;
			k += pi3;
		}
		xa0 = xa[0];
		ya0 = ya[0];
		xa1 = xa[1];
		ya1 = ya[1];
		xa2 = xa[2];
		ya2 = ya[2];
		xa3 = xa[3];
		ya3 = ya[3];
		xa4 = xa[4];
		ya4 = ya[4];
		xa5 = xa[5];
		ya5 = ya[5];

		// create hexagons from selection box
		this.context.lineWidth = 1;
		this.context.lineCap = "round";
		this.context.lineJoin = "round";
		j = 0;
		k = 0;
		for (y = bottomY; y <= topY; y += 1) {
			cy = y - h2;
			displayY = (cy + yOff1) * zoom + halfDisplayHeight;
			// clip to display
			if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
				for (x = leftX; x <= rightX; x += 1) {
					if (cells[m] > 0) {
						cx = x - w2;
						displayX = (cx + xOff1 - (cy + yOff1) / 2) * zoom + halfDisplayWidth;
						// clip to display
						if (displayX >= -zoom && displayX < this.displayWidth + zoom) {
							// encode coordinate index into the colour state so it can be sorted later
							colours[j] = (state << LifeConstants.coordBufferBits) + k;
							coords[k] = xa0 + cx;
							coords[k + 1] = ya0 + cy;
							coords[k + 2] = xa1 + cx;
							coords[k + 3] = ya1 + cy;
							coords[k + 4] = xa2 + cx;
							coords[k + 5] = ya2 + cy;
							coords[k + 6] = xa3 + cx;
							coords[k + 7] = ya3 + cy;
							coords[k + 8] = xa4 + cx;
							coords[k + 9] = ya4 + cy;
							coords[k + 10] = xa5 + cx;
							coords[k + 11] = ya5 + cy;
							k += 12;
							j += 1;
			
							// check if buffer is full
							if (j === LifeConstants.coordBufferSize) {
								// draw buffer
								this.numCells = j;
								this.drawHexCells(true, false, false, true);
			
								// clear buffer
								j = 0;
								k = 0;
							}
						}
					}
					// next cell
					m += 1;
				}
			} else {
				// next row
				m += (rightX - leftX + 1);
			}
		}

		// draw any remaining cells
		this.numCells = j;
		if (j > 0) {
			// draw buffer
			this.drawHexCells(true, false, false, true);

			// clear buffer
			j = 0;
			k = 0;
		}
	};

	// draw hex selection
	Life.prototype.drawHexSelection = function(leftX, bottomY, rightX, topY, xOff, yOff) {
		var /** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @const {number} */ w2 = this.width / 2 - 0.25,
			/** @const {number} */ h2 = this.height / 2,
			/** @const {number} */ pi3 = Math.PI / 3,
			/** @const {number} */ yEdge = 0.5 / Math.cos(pi3 / 2) * 1.16, 
			/** @const {number} */ xEdge = (ViewConstants.sqrt3 / 4) / Math.cos(pi3 / 2) * 1.16,
			/** @const {Array<number>} */ xa = [],
			/** @const {Array<number>} */ ya = [],
			/** @type {number} */ state = 0,
			/** @type {number} */ xa0 = 0,
			/** @type {number} */ ya0 = 0,
			/** @type {number} */ xa1 = 0,
			/** @type {number} */ ya1 = 0,
			/** @type {number} */ xa2 = 0,
			/** @type {number} */ ya2 = 0,
			/** @type {number} */ xa3 = 0,
			/** @type {number} */ ya3 = 0,
			/** @type {number} */ xa4 = 0,
			/** @type {number} */ ya4 = 0,
			/** @type {number} */ xa5 = 0,
			/** @type {number} */ ya5 = 0,
			/** @type {Array<number>} */ coords = this.coords,
			/** @type {Array<number>} */ colours = this.cellColours,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** @type {number} */ xOff1 = this.width / 2 - this.xOff - this.originX,
			/** @type {number} */ yOff1 = this.height / 2 - this.yOff - this.originY,
			/** @const {number} */ hexAdjust = -(this.height >> 2),
			/** @type {number} */ displayX = 0,
			/** @type {number} */ displayY = 0,
			/** @type {number} */ zoom = this.camZoom,
			/** @type {number} */ swap = 0;

		// adjust for hex
		xOff1 += yOff1 / 2;
		xOff1 = xOff1 + hexAdjust + 0.5;
		yOff1 = yOff1 + 0.5;

		// order coordinates
		if (leftX > rightX) {
			swap = rightX;
			rightX = leftX;
			leftX = swap;
		}
		if (bottomY > topY) {
			swap = topY;
			topY = bottomY;
			bottomY = swap;
		}
		leftX += xOff;
		rightX += xOff;
		bottomY += yOff;
		topY += yOff;

		// check if buffers have been allocated
		if (colours.length !== LifeConstants.coordBufferSize) {
			this.coords = this.allocator.allocate(Float32, 12 * LifeConstants.coordBufferSize, "Life.coords");
			this.cellColours = this.allocator.allocate(Uint32, LifeConstants.coordBufferSize, "Life.cellColours");
			coords = this.coords;
			colours = this.cellColours;
		}

		// create hexagon coordinates
		k = pi3 / 2;
		for (j = 0; j <= 5; j += 1) {
			xa[j] = Math.cos(k) * xEdge;
			ya[j] = Math.sin(k) * yEdge;
			xa[j] += ya[j] / 2;
			k += pi3;
		}
		xa0 = xa[0];
		ya0 = ya[0];
		xa1 = xa[1];
		ya1 = ya[1];
		xa2 = xa[2];
		ya2 = ya[2];
		xa3 = xa[3];
		ya3 = ya[3];
		xa4 = xa[4];
		ya4 = ya[4];
		xa5 = xa[5];
		ya5 = ya[5];

		// create hexagons from selection box
		this.context.lineWidth = 1;
		this.context.lineCap = "round";
		this.context.lineJoin = "round";
		j = 0;
		k = 0;
		for (y = bottomY; y <= topY; y += 1) {
			cy = y - h2;
			displayY = (cy + yOff1) * zoom + halfDisplayHeight;
			// clip to display
			if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
				for (x = leftX; x <= rightX; x += 1) {
					cx = x - w2;
					displayX = (cx + xOff1 - (cy + yOff1) / 2) * zoom + halfDisplayWidth;
					// clip to display
					if (displayX >= -zoom && displayX < this.displayWidth + zoom) {
						// encode coordinate index into the colour state so it can be sorted later
						colours[j] = (state << LifeConstants.coordBufferBits) + k;
						coords[k] = xa0 + cx;
						coords[k + 1] = ya0 + cy;
						coords[k + 2] = xa1 + cx;
						coords[k + 3] = ya1 + cy;
						coords[k + 4] = xa2 + cx;
						coords[k + 5] = ya2 + cy;
						coords[k + 6] = xa3 + cx;
						coords[k + 7] = ya3 + cy;
						coords[k + 8] = xa4 + cx;
						coords[k + 9] = ya4 + cy;
						coords[k + 10] = xa5 + cx;
						coords[k + 11] = ya5 + cy;
						k += 12;
						j += 1;
		
						// check if buffer is full
						if (j === LifeConstants.coordBufferSize) {
							// draw buffer
							this.numCells = j;
							this.drawHexCells(true, false, false, true);
			
							// clear buffer
							j = 0;
							k = 0;
						}
					}
				}
			}
		}

		// draw any remaining cells
		this.numCells = j;
		if (j > 0) {
			// draw buffer
			this.drawHexCells(true, false, false, true);

			// clear buffer
			j = 0;
			k = 0;
		}
	};

	// draw hexagons 
	Life.prototype.drawHexagons = function() {
		var colourGrid = this.colourGrid,
			colourRow = null,
			overlayGrid = this.overlayGrid,
			overlayRow = null,
			zoomBox = this.historyBox,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ j = 0,
			/** @type {number} */ k = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @const {number} */ w2 = this.width / 2 - 0.25,
			/** @const {number} */ h2 = this.height / 2,
			/** @const {number} */ pi3 = Math.PI / 3,
			/** @const {number} */ yEdge = 0.5 / Math.cos(pi3 / 2) * 1.16, 
			/** @const {number} */ xEdge = (ViewConstants.sqrt3 / 4) / Math.cos(pi3 / 2) * 1.16,
			/** @const {Array<number>} */ xa = [],
			/** @const {Array<number>} */ ya = [],
			/** @type {number} */ state = 0,
			/** @type {number} */ overState = 0,
			/** @type {number} */ state3 = ViewConstants.stateMap[3] + 128,
			/** @type {number} */ state4 = ViewConstants.stateMap[4] + 128,
			/** @type {number} */ state5 = ViewConstants.stateMap[5] + 128,
			/** @type {number} */ state6 = ViewConstants.stateMap[6] + 128,
			/** @type {number} */ aliveStart = this.aliveStart,
			/** @type {number} */ xa0 = 0,
			/** @type {number} */ ya0 = 0,
			/** @type {number} */ xa1 = 0,
			/** @type {number} */ ya1 = 0,
			/** @type {number} */ xa2 = 0,
			/** @type {number} */ ya2 = 0,
			/** @type {number} */ xa3 = 0,
			/** @type {number} */ ya3 = 0,
			/** @type {number} */ xa4 = 0,
			/** @type {number} */ ya4 = 0,
			/** @type {number} */ xa5 = 0,
			/** @type {number} */ ya5 = 0,
			/** @type {Array<number>} */ coords = this.coords,
			/** @type {Array<number>} */ colours = this.cellColours,
			/** @type {number} */ leftX = zoomBox.leftX,
			/** @type {number} */ rightX = zoomBox.rightX,
			/** @type {number} */ bottomY = zoomBox.bottomY,
			/** @type {number} */ topY = zoomBox.topY,
			/** @type {number} */ yOff = this.height / 2 - this.yOff - this.originY + 0.5,
			/** @type {number} */ xOff = this.width / 2 - this.xOff - this.originX + 0.5 -(this.height >> 2) + yOff / 2,
			/** @type {number} */ zoom = this.zoom * this.originZ,
			/** @type {number} */ displayY = 0,
			/** @type {number} */ displayX = 0,
			/** @type {number} */ xOffset = 0,
			/** @type {boolean} */ drawFilledCellBorders = !this.displayGrid && !this.cellBorders;

		// switch buffers if required
		if (this.isRuleTree && ((this.counter & 1) !== 0)) {
			colourGrid = this.nextColourGrid;
		}

		// check if buffers have been allocated
		if (colours.length !== LifeConstants.coordBufferSize) {
			this.coords = this.allocator.allocate(Float32, 12 * LifeConstants.coordBufferSize, "Life.coords");
			this.cellColours = this.allocator.allocate(Uint32, LifeConstants.coordBufferSize, "Life.cellColours");
			coords = this.coords;
			colours = this.cellColours;
		}

		// use bounded grid if defined
		if (this.boundedGridType !== -1) {
			if (this.boundedGridWidth !== 0) {
				// set width to included bounded grid cells
				leftX = Math.round((this.width - this.boundedGridWidth) / 2) - 1;
				rightX = leftX + this.boundedGridWidth - 1 + 2;
			} else {
				// infinite width so set to grid width
				leftX = 0;
				rightX = this.width - 1;
			}

			if (this.boundedGridHeight !== 0) {
				// set height to included bounded grid cells
				bottomY = Math.round((this.height - this.boundedGridHeight) / 2) - 1;
				topY = bottomY + this.boundedGridHeight - 1 + 2;
			} else {
				// infinite height to set to grid height
				bottomY = 0;
				topY = this.height - 1;
			}
		}

		// create hexagon coordinates
		k = pi3 / 2;
		for (j = 0; j <= 5; j += 1) {
			xa[j] = Math.cos(k) * xEdge;
			ya[j] = Math.sin(k) * yEdge;
			xa[j] += ya[j] / 2;
			k += pi3;
		}
		xa0 = xa[0];
		ya0 = ya[0];
		xa1 = xa[1];
		ya1 = ya[1];
		xa2 = xa[2];
		ya2 = ya[2];
		xa3 = xa[3];
		ya3 = ya[3];
		xa4 = xa[4];
		ya4 = ya[4];
		xa5 = xa[5];
		ya5 = ya[5];

		// create hexagons from live cells
		this.context.lineWidth = 1;
		this.context.lineCap = "round";
		this.context.lineJoin = "round";
		j = 0;
		k = 0;
		for (y = bottomY; y <= topY; y += 1) {
			// clip y to window
			displayY = ((y + yOff - h2) * zoom) + halfDisplayHeight;
			if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
				colourRow = colourGrid[y];
				if (overlayGrid) {
					overlayRow = overlayGrid[y];
				}
				cy = y - h2;
				xOffset = xOff - w2 - ((cy + yOff) / 2);
				for (x = leftX; x <= rightX; x += 1) {
					displayX = ((x + xOffset) * zoom) + halfDisplayWidth;
					if (displayX >= -zoom && displayX < this.displayWidth + zoom) {
						state = colourRow[x];
						if (overlayRow) {
							overState = overlayRow[x];
							if (overState === state4 || overState === state6) {
								if (state > aliveStart) {
									state = state3;
								} else {
									state = overState;
								}
							} else {
								if (overState === state3 || overState === state5) {
									if (state < aliveStart) {
										state = state4;
									} else {
										state = overState;
									}
								}
							}
						}
						if (state > 0) {
							// encode coordinate index into the colour state so it can be sorted later
							colours[j] = (state << LifeConstants.coordBufferBits) + k;
							cx = x - w2;
							coords[k] = xa0 + cx;
							coords[k + 1] = ya0 + cy;
							coords[k + 2] = xa1 + cx;
							coords[k + 3] = ya1 + cy;
							coords[k + 4] = xa2 + cx;
							coords[k + 5] = ya2 + cy;
							coords[k + 6] = xa3 + cx;
							coords[k + 7] = ya3 + cy;
							coords[k + 8] = xa4 + cx;
							coords[k + 9] = ya4 + cy;
							coords[k + 10] = xa5 + cx;
							coords[k + 11] = ya5 + cy;
							k += 12;
							j += 1;
						}
						// check if buffer is full
						if (j === LifeConstants.coordBufferSize) {
							// draw buffer
							this.numCells = j;
							this.drawHexCells(true, drawFilledCellBorders, false, false);

							// draw cell borders if enabled and grid lines disabled
							if (this.cellBorders && !this.displayGrid) {
								this.context.strokeStyle = "rgb(" + this.redChannel[0] + "," + this.blueChannel[0] + "," + this.greenChannel[0] + ")";
								this.drawHexCells(false, false, false, false);
							}

							// clear buffer
							j = 0;
							k = 0;
						}
					}
				}
			}
		}

		// draw any remaining cells
		this.numCells = j;
		if (j > 0) {
			// draw buffer
			this.drawHexCells(true, drawFilledCellBorders, false, false);

			// draw cell borders if enabled and grid lines disabled
			if (this.cellBorders && !this.displayGrid) {
				this.context.strokeStyle = "rgb(" + this.redChannel[0] + "," + this.blueChannel[0] + "," + this.greenChannel[0] + ")";
				this.drawHexCells(false, false, false, false);
			}

			// clear buffer
			j = 0;
			k = 0;
		}

		// draw grid if enabled
		if (this.displayGrid) {
			// set grid line colour
			this.context.strokeStyle = "rgb(" + (this.gridLineRaw >> 16) + "," + ((this.gridLineRaw >> 8) & 255) + "," + (this.gridLineRaw & 255) + ")";
			this.context.lineWidth = 1;
			j = 0;

			// create cell coordinates for window
			bottomY = ((-halfDisplayHeight / zoom) - yOff + h2) | 0;
			topY = ((halfDisplayHeight / zoom) - yOff + h2) | 0;

			for (y = bottomY; y <= topY; y += 1) {
				// clip y to window
				displayY = ((y + yOff - h2) * zoom) + halfDisplayHeight;
				if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
					colourRow = colourGrid[y];
					cy = y - h2;
					xOffset = xOff - w2 - ((cy + yOff) / 2);
					leftX = ((-halfDisplayWidth / zoom) - xOffset - zoom) | 0;
					rightX = ((halfDisplayWidth / zoom) - xOffset + zoom) | 0;
					for (x = leftX; x <= rightX; x += 1) {
						displayX = ((x + xOffset) * zoom) + halfDisplayWidth;
						if (displayX >= -zoom && displayX < this.displayWidth + zoom) {
							cx = x - w2;
							coords[k] = xa0 + cx;
							coords[k + 1] = ya0 + cy;
							coords[k + 2] = xa1 + cx;
							coords[k + 3] = ya1 + cy;
							coords[k + 4] = xa2 + cx;
							coords[k + 5] = ya2 + cy;
							coords[k + 6] = xa3 + cx;
							coords[k + 7] = ya3 + cy;
							k += 8;
							j += 1;
						}
						// check if buffer is full
						if (j === LifeConstants.coordBufferSize) {
							// draw and clear buffer
							this.numCells = j;
							this.drawHexCells(false, false, true, false);
							j = 0;
							k = 0;
						}
					}
				}
			}

			// draw any remaining cells
			this.numCells = j;
			if (j > 0) {
				this.drawHexCells(false, false, true, false);
			}
		}
	};

	// draw hex cells
	Life.prototype.drawHexCells = function(/** @type {boolean} */ filled, /** @type {boolean} */ borderWhenFilled, /** @type {boolean} */ gridLines, /** @type {boolean} */ drawingSelection) {
		var /** @type {number} */ i = 0,
			context = this.context,
			/** @type {number} */ xOff = this.width / 2 - this.xOff - this.originX,
			/** @type {number} */ yOff = this.height / 2 - this.yOff - this.originY,
			/** @const {number} */ zoom = this.zoom * this.originZ,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ cx = 0,
			/** @type {number} */ cy = 0,
			/** @type {number} */ cx2 = 0,
			/** @type {number} */ cy2 = 0,
			/** @const {number} */ hexAdjust = -(this.height >> 2),
			/** @type {number} */ coord = 0,
			/** @type {number} */ cx0 = 0,
			/** @type {number} */ cy0 = 0,
			/** @type {number} */ target = 0,
			/** @type {number} */ batch = 12,
			/** @type {number} */ state = 0,
			/** @type {number} */ lastState = -1,
			/** @type {Array<number>} */ coords = this.coords,
			/** @const {number} */ numCoords = this.numCells,
			/** @type {Array<number>} */ colours = this.cellColours,
			/** @const {number} */ mask = (1 << LifeConstants.coordBufferBits) - 1;

		// adjust for hex
		xOff += yOff / 2;
		xOff = xOff + hexAdjust + 0.5;
		yOff = yOff + 0.5;

		// if hexagons are filled then sort by colour
		// check for sort function since IE doesn't have it
		if (filled && !drawingSelection && colours.sort) {
			// ensure unused buffer is at end
			state = (LifeConstants.coordBufferSize << LifeConstants.coordBufferBits) + 256;
			colours.fill(state, numCoords);
			colours.sort();
		}

		// draw each hexagon
		context.beginPath();
		if (!filled) {
			// if drawing the grid then only three line segments are needed
			if (gridLines) {
				batch = 8;
			} else {
				batch = 12;
			}
			target = batch;
			coord = 0;
			state = 0;
			lastState = 0;
		}
		for (i = 0; i < numCoords; i += 1) {
			// get next hexagon offset
			if (filled) {
				state = colours[i];
				coord = state & mask;
				target = coord + batch;
				state = state >> LifeConstants.coordBufferBits;
			}

			// get hexagon start position
			cx0 = coords[coord];
			cy0 = coords[coord + 1];
			cy = cy0 + yOff;
			cx = cx0 + xOff - cy / 2;
			coord += 2;

			// draw the hexagon
			y = (cy * zoom) + halfDisplayHeight;
			x = (cx * zoom) + halfDisplayWidth;
			cy2 = (coords[coord + 1] - cy0) * zoom;
			cx2 = (coords[coord] - cx0) * zoom - cy2 / 2;
			coord += 2;
	
			// set line colour
			if (state !== lastState) {
				lastState = state;
				if (i > 0) {
					if (filled) {
						// draw border if required
						if (borderWhenFilled) {
							context.stroke();
						}
						// fill the cells
						context.fill();
					} else {
						context.stroke();
					}
					// start a new batch
					context.beginPath();
				}
				if (filled) {
					// set the new cell colours unless drawing selection box
					if (!drawingSelection) {
						context.fillStyle = this.cellColourStrings[state];
						if (borderWhenFilled) {
							context.strokeStyle = this.cellColourStrings[state];
						}
					}
				}
			}

			// draw hexagon
			context.moveTo(x, y);
			context.lineTo((cx2 + x), (cy2 + y));
			while (coord < target) {
				cy2 = (coords[coord + 1] - cy0) * zoom;
				cx2 = (coords[coord] - cx0) * zoom - cy2 / 2;
				coord += 2;
				context.lineTo((cx2 + x), (cy2 + y));
			}
			target += batch;
		}
		if (filled) {
			// draw cell borders if required
			if (borderWhenFilled) {
				context.stroke();
			}
			// fill cells
			context.fill();
		} else {
			context.stroke();
		}
	};

	// convert grid to RLE
	/** @return {string} */
	Life.prototype.asRLE = function(view, me, /** @type {boolean} */ addComments) {
		var /** @type {string} */ rle = "",
			zoomBox = (me.isLifeHistory ? me.historyBox : me.zoomBox),
			/** @type {number} */ leftX = zoomBox.leftX,
			/** @type {number} */ rightX = zoomBox.rightX,
			/** @type {number} */ topY = zoomBox.topY,
			/** @type {number} */ bottomY = zoomBox.bottomY,
			/** @type {number} */ width = rightX - leftX + 1,
			/** @type {number} */ height = topY - bottomY + 1,
			/** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ state = 0,
			/** @type {number} */ last = 0,
			/** @type {number} */ count = 0,
			/** @type {number} */ rowCount = 0,
			/** @type {number} */ lastLength = 0,
			/** @const {number} */ charsPerRow = 69,
			/** @const {Array<string>} */ outputState = [],
			/** @type {number} */ maxState = 0,
			/** @const {number} */ asciiA = String("A").charCodeAt(0),
			/** @const {number} */ asciiP = String("p").charCodeAt(0),
			/** @type {boolean} */ twoState = false,
			colourGrid = this.colourGrid,
			colourRow = null,
			/** @type {number} */ col = 0,
			/** @type {number} */ xOff = (me.width >> 1) - (view.patternWidth >> 1),
			/** @type {number} */ yOff = (me.height >> 1) - (view.patternHeight >> 1),
			selBox = view.selectionBox;

		// check for selection
		if (view.isSelection) {
			leftX = selBox.leftX + xOff;
			bottomY = selBox.bottomY + yOff;
			rightX = selBox.rightX + xOff;
			topY = selBox.topY + yOff;
			width = rightX - leftX + 1;
			height = topY - bottomY + 1;
		}

		// check for triangular rules
		if (me.isTriangular) {
			if (leftX > 0 && ((leftX & 1) !== 0)) {
				leftX -= 1;
				width += 1;
			}
			if ((bottomY > 0) && ((bottomY & 1) !== 0)) {
				bottomY -= 1;
				height += 1;
			}
		}

		// check for Margolus rules
		if (me.isMargolus) {
			if (leftX > 0 && ((leftX & 1) === 0)) {
				leftX -= 1;
				width += 1;
			}
			if ((bottomY > 0) && ((bottomY & 1) === 0)) {
				bottomY -= 1;
				height += 1;
			}
		}

		// populate output states
		if (me.multiNumStates <= 2 && !me.displayLifeHistory) {
			twoState = true;
			outputState[0] = "b";
			outputState[1] = "o";
		} else {
			if (me.displayLifeHistory) {
				maxState = 7;
			} else {
				maxState = me.multiNumStates;
			}
			outputState[0] = ".";
			for (x = 0; x < maxState - 1; x += 1) {
				if (x >= 24) {
					outputState[x + 1] = String.fromCharCode(asciiP + ((x / 24) | 0) - 1) + String.fromCharCode(asciiA + (x % 24));
				} else {
					outputState[x + 1] = String.fromCharCode(asciiA + x);
				}
			}
		}

		// output comments if requested
		if (addComments) {
			rle += me.beforeTitle;
		}

		// check for zero population
		if (this.population === 0) {
			width = 0;
			height = 0;
			// ensure loop is skipped
			topY = bottomY - 1;
		}

		// output header
		rle += "x = " + width + ", y = " + height + ", rule = ";
		if (view.patternAliasName === "LifeHistory") {
			// if [R]History but history is not displayed then remove History from rule name
			if (!me.displayLifeHistory) {
				rle += "Life";
			} else {
				rle += view.patternAliasName;
			}
		} else {
			// if [R]History rule but history is not displayed then remove History from rule name
			if (me.isLifeHistory && !me.displayLifeHistory) {
				rle += view.patternRuleName.substr(0, view.patternRuleName.length - 7);
			} else {
				rle += view.patternRuleName;
			}
		}
		rle += view.patternBoundedGridDef;
		rle += "\n";
		lastLength = rle.length;

		// output pattern
		y = bottomY;
		while (y <= topY) {
			x = leftX;
			// check for 2 state pattern
			if (twoState) {
				// use fast lookup
				colourRow = colourGrid[y];
				col = colourRow[x];
				if (col <= this.deadStart || col === this.boundedBorderColour) {
					last = 0;
				} else {
					last = 1;
				}
			} else {
				// not 2 state so use full lookup
				last = me.getState(x, y, false);
			}
			count = 1;
			x += 1;
			while (x <= rightX + 1) {
				if (x > rightX) {
					state = -1;
				} else {
					// check for 2 state pattern
					if (twoState) {
						// use fast lookup
						col = colourRow[x];
						if (col <= this.deadStart || col === this.boundedBorderColour) {
							state = 0;
						} else {
							state = 1;
						}
					} else {
						// not 2 state so use full lookup
						state = me.getState(x, y, false);
					}
				}
				if (state !== last) {
					// output end of previous row(s)
					if (!(state === -1 && last === 0) && rowCount > 0) {
						if (rowCount > 1) {
							rle += rowCount;
						}
						rle += "$";
						if (rle.length - lastLength >= charsPerRow) {
							rle += "\n";
							lastLength = rle.length;
						}
						rowCount = 0;
					}
					// check if run is alive or dead
					if (last > 0) {
						if (count > 1) {
							rle += count;
						}
						rle += outputState[last];
					} else if (x <= rightX) {
						if (count > 1) {
							rle += count;
						}
						rle += outputState[last];
					}
					if (rle.length - lastLength >= charsPerRow) {
						rle += "\n";
						lastLength = rle.length;
					}
					count = 1;
					last = state;
				} else {
					count += 1;
				}
				x += 1;
			}
			// end of row
			rowCount += 1;
			y += 1;
		}
		rle += "!\n";

		// add final comments if requested
		if (addComments) {
			rle += me.afterTitle;
		}

		// return the RLE
		return rle;
	};

	// overridden by specific function below
	Life.prototype.setState = null;
	
	// get state (2 state patterns without bounded grid or [R]History)
	/** @result {number} */
	Life.prototype.setState2 = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ state, /** @type {boolean} */ deadZero) {
		var grid = this.grid16,
			tileGrid = this.tileGrid,
			colourGrid = this.colourGrid,
			colourTileGrid = this.colourTileGrid,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			zoomBox = this.zoomBox,
			historyBox = this.historyBox,
			cellAsBit = 0,
			cellAsTileBit = 0,

			// whether cell should be alive in bit grid
			/** @type {boolean} */ bitAlive = false,

			// whether the cell is on the grid
			/** @type {boolean} */ onGrid = true,

			// whether a cell was or became LifeHistory state6
			/** @type {number} */ result = 0,

			// left target for next tile
			/** @type {number} */ leftTarget = (this.isTriangular ? 1 : 0),

			// right target to next tile
			/** @type {number} */ rightTarget = (this.isTriangular ? 14 : 15),

			// x coordinate for boundary check
			/** @type {number} */ cx = 0;

		// check if the cell is on the grid
		if (!((x === (x & this.widthMask)) && (y === (y & this.heightMask)))) {
			onGrid = false;
			// attempt to grow the grid
			while (this.width < this.maxGridSize && !((x === (x & this.widthMask)) && (y === (y & this.heightMask)))) {
				this.growGrid();
				x += this.width >> 2;
				y += this.height >> 2;
			}
			// check if the cell is on the expanded grid
			if ((x === (x & this.widthMask)) && (y === (y & this.heightMask))) {
				// cell on expanded grid
				onGrid = true;
				// grid has changed so lookup again
				grid = this.grid16;
				tileGrid = this.tileGrid;
				colourGrid = this.colourGrid;
				colourTileGrid = this.colourTileGrid;
				colourTileHistoryGrid = this.colourTileHistoryGrid;
			}
		}

		// draw if on the grid
		if (onGrid) {
			// get correct grid for current generation
			if ((this.counter & 1) !== 0) {
				grid = this.nextGrid16;
				tileGrid = this.nextTileGrid;
			}

			// get the cell as a bit mask and tile mask
			cellAsBit = 1 << (~x & 15);
			cellAsTileBit = 1 << (~(x >> 4) & 15);
			bitAlive = ((state & 1) === 1);

			// draw alive or dead
			if (bitAlive) {
				// mark a cell is alive
				this.anythingAlive = 1;

				// adjust population if cell was dead
				if ((grid[y][x >> 4] & cellAsBit) === 0) {
					this.population += 1;
				}
				// set cell
				colourGrid[y][x] = this.aliveStart;
				colourTileGrid[y >> 4][x >> 8] |= cellAsTileBit;
				colourTileHistoryGrid[y >> 4][x >> 8] |= cellAsTileBit;
				grid[y][x >> 4] |= cellAsBit;
				tileGrid[y >> 4][x >> 8] |= cellAsTileBit;
				// check left boundary
				cx = x & 15;
				if ((x > 0) && (cx <= leftTarget)) {
					x -= (cx + 1);
					tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
					x += (cx + 1);
				} else {
					// check right boundary
					if ((x < this.width - 1) && (cx >= rightTarget)) {
						x += (16 - cx);
						tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						x -= (16 - cx);
					}
				}
				// check bottom boundary
				if ((y > 0) && ((y & 15) === 0)) {
					y -= 1;
					tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
					if ((x > 0) && (cx <= leftTarget)) {
						x -= (cx + 1);
						tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						x += (cx + 1);
					} else {
						if ((x < this.width - 1) && (cx >= rightTarget)) {
							x += (16 - cx);
							tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
							x -= (16 - cx);
						}
					}
					y += 1;
				} else {
					// check top boundary
					if ((y < this.height - 1) && ((y & 15) === 15)) {
						y += 1;
						tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						if ((x > 0) && (cx <= leftTarget)) {
							x -= (cx + 1);
							tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
							x += (cx + 1);
						} else {
							if ((x < this.width - 1) && (cx >= rightTarget)) {
								x += (16 - cx);
								tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
								x -= (16 - cx);
							}
						}
						y -= 1;
					}
				}
			} else {
				// adjust population if cell was alive
				if ((grid[y][x >> 4] & cellAsBit) !== 0) {
					this.population -= 1;
				}
				// clear cell
				if (deadZero) {
					colourGrid[y][x] = this.unoccupied;
				} else {
					colourGrid[y][x] = this.deadStart;
				}
				colourTileGrid[y >> 4][x >> 8] |= cellAsTileBit;
				colourTileHistoryGrid[y >> 4][x >> 8] |= cellAsTileBit;
				grid[y][x >> 4] &= ~cellAsBit;
			}

			// if the state is not dead (or history) then update bounding box
			if (state > 0) {
				if (x < zoomBox.leftX) {
					zoomBox.leftX = x;
				}
				if (x > zoomBox.rightX) {
					zoomBox.rightX = x;
				}
				if (y < zoomBox.bottomY) {
					zoomBox.bottomY = y;
				}
				if (y > zoomBox.topY) {
					zoomBox.topY = y;
				}
				if (x < historyBox.leftX) {
					historyBox.leftX = x;
				}
				if (x > historyBox.rightX) {
					historyBox.rightX = x;
				}
				if (y < historyBox.bottomY) {
					historyBox.bottomY = y;
				}
				if (y > historyBox.topY) {
					historyBox.topY = y;
				}

				// only shrink if the cell was on the boundary of the bounding box
				if (x === zoomBox.leftX || x === zoomBox.rightX || y === zoomBox.topY || y === zoomBox.bottomY) {
					// mark shrink needed
					this.shrinkNeeded = true;
				}
			}
		}

		// return whether LifeHistory state 6 changed
		return result;
	};

	// get state (2 state [R]History patterns without bounded grid)
	/** @result {number} */
	Life.prototype.setState2History = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ state, /** @type {boolean} */ deadZero) {
		var grid = this.grid16,
			tileGrid = this.tileGrid,
			colourGrid = this.colourGrid,
			colourTileGrid = this.colourTileGrid,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			overlayGrid = this.overlayGrid,
			zoomBox = this.zoomBox,
			historyBox = this.historyBox,
			cellAsBit = 0,
			cellAsTileBit = 0,

			// current cell state
			/** @type {number} */ current = 0,

			// whether cell should be alive in bit grid
			/** @type {boolean} */ bitAlive = false,

			// whether the cell is on the grid
			/** @type {boolean} */ onGrid = true,

			// whether a cell was or became LifeHistory state6
			/** @type {number} */ result = 0,

			// left target for next tile
			/** @type {number} */ leftTarget = (this.isTriangular ? 1 : 0),

			// right target to next tile
			/** @type {number} */ rightTarget = (this.isTriangular ? 14 : 15),

			// x coordinate for boundary check
			/** @type {number} */ cx = 0;

		// check if the cell is on the grid
		if (!((x === (x & this.widthMask)) && (y === (y & this.heightMask)))) {
			onGrid = false;
			// attempt to grow the grid
			while (this.width < this.maxGridSize && !((x === (x & this.widthMask)) && (y === (y & this.heightMask)))) {
				this.growGrid();
				x += this.width >> 2;
				y += this.height >> 2;
			}
			// check if the cell is on the expanded grid
			if ((x === (x & this.widthMask)) && (y === (y & this.heightMask))) {
				// cell on expanded grid
				onGrid = true;
				// grid has changed so lookup again
				grid = this.grid16;
				tileGrid = this.tileGrid;
				colourGrid = this.colourGrid;
				colourTileGrid = this.colourTileGrid;
				colourTileHistoryGrid = this.colourTileHistoryGrid;
				overlayGrid = this.overlayGrid;
			}
		}

		// draw if on the grid
		if (onGrid) {
			// get correct grid for current generation
			if ((this.counter & 1) !== 0) {
				grid = this.nextGrid16;
				tileGrid = this.nextTileGrid;
			}

			// get the cell as a bit mask and tile mask
			cellAsBit = 1 << (~x & 15);
			cellAsTileBit = 1 << (~(x >> 4) & 15);
			bitAlive = ((state & 1) === 1);

			// draw alive or dead
			if (bitAlive) {
				// mark a cell is alive
				this.anythingAlive = 1;

				// adjust population if cell was dead
				if ((grid[y][x >> 4] & cellAsBit) === 0) {
					this.population += 1;
				}
				// set cell
				colourGrid[y][x] = this.aliveStart;
				colourTileGrid[y >> 4][x >> 8] |= cellAsTileBit;
				colourTileHistoryGrid[y >> 4][x >> 8] |= cellAsTileBit;
				grid[y][x >> 4] |= cellAsBit;
				tileGrid[y >> 4][x >> 8] |= cellAsTileBit;
				// check left boundary
				cx = x & 15;
				if ((x > 0) && (cx <= leftTarget)) {
					x -= (cx + 1);
					tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
					x += (cx + 1);
				} else {
					// check right boundary
					if ((x < this.width - 1) && (cx >= rightTarget)) {
						x += (16 - cx);
						tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						x -= (16 - cx);
					}
				}
				// check bottom boundary
				if ((y > 0) && ((y & 15) === 0)) {
					y -= 1;
					tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
					if ((x > 0) && (cx <= leftTarget)) {
						x -= (cx + 1);
						tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						x += (cx + 1);
					} else {
						if ((x < this.width - 1) && (cx >= rightTarget)) {
							x += (16 - cx);
							tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
							x -= (16 - cx);
						}
					}
					y += 1;
				} else {
					// check top boundary
					if ((y < this.height - 1) && ((y & 15) === 15)) {
						y += 1;
						tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						if ((x > 0) && (cx <= leftTarget)) {
							x -= (cx + 1);
							tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
							x += (cx + 1);
						} else {
							if ((x < this.width - 1) && (cx >= rightTarget)) {
								x += (16 - cx);
								tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
								x -= (16 - cx);
							}
						}
						y -= 1;
					}
				}
			} else {
				// adjust population if cell was alive
				if ((grid[y][x >> 4] & cellAsBit) !== 0) {
					this.population -= 1;
				}
				// clear cell
				if (deadZero) {
					colourGrid[y][x] = this.unoccupied;
				} else {
					colourGrid[y][x] = this.deadStart;
				}
				colourTileGrid[y >> 4][x >> 8] |= cellAsTileBit;
				colourTileHistoryGrid[y >> 4][x >> 8] |= cellAsTileBit;
				grid[y][x >> 4] &= ~cellAsBit;
			}

			// check for LifeHistory
			if (overlayGrid) {
				// check if the cell used to be or has become state 6
				current = overlayGrid[y][x];
				if (current > 0) {
					current = ViewConstants.stateMap.indexOf(current - 128);
				}
				if ((state === 6 && current !== 6) || (state !== 6 && current === 6)) {
					result = 1;
				}

				// update colour grid if history state
				if (state === 2) {
					colourGrid[y][x] = LifeConstants.deadMin;
				} else {
					// update overlay grid if not
					if (state === 0) {
						overlayGrid[y][x] = 0;
					} else {
						overlayGrid[y][x] = ViewConstants.stateMap[state] + 128;
					}
				}
			}

			// if the state is not dead (or history) then update bounding box
			if (state > 0) {
				if (x < zoomBox.leftX) {
					zoomBox.leftX = x;
				}
				if (x > zoomBox.rightX) {
					zoomBox.rightX = x;
				}
				if (y < zoomBox.bottomY) {
					zoomBox.bottomY = y;
				}
				if (y > zoomBox.topY) {
					zoomBox.topY = y;
				}
				if (x < historyBox.leftX) {
					historyBox.leftX = x;
				}
				if (x > historyBox.rightX) {
					historyBox.rightX = x;
				}
				if (y < historyBox.bottomY) {
					historyBox.bottomY = y;
				}
				if (y > historyBox.topY) {
					historyBox.topY = y;
				}

				// only shrink if the cell was on the boundary of the bounding box
				if (x === zoomBox.leftX || x === zoomBox.rightX || y === zoomBox.topY || y === zoomBox.bottomY) {
					// mark shrink needed
					this.shrinkNeeded = true;
				}
			}
		}

		// return whether LifeHistory state 6 changed
		return result;
	};

	// get state (any pattern)
	/** @result {number} */
	Life.prototype.setStateAny = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ state, /** @type {boolean} */ deadZero) {
		var grid = this.grid16,
			tileGrid = this.tileGrid,
			colourGrid = this.colourGrid,
			colourTileGrid = this.colourTileGrid,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			overlayGrid = this.overlayGrid,
			zoomBox = this.zoomBox,
			HROTBox = this.HROTBox,
			historyBox = this.historyBox,
			cellAsBit = 0,
			cellAsTileBit = 0,

		    // bounded grid top left
		    /** @type {number} */ leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    /** @type {number} */ bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // bounded grid bottom right
		    /** @type {number} */ rightX = leftX + this.boundedGridWidth - 1,
			/** @type {number} */ topY = bottomY + this.boundedGridHeight - 1,

			// multi-state alive cell
			/** @type {number} */ aliveState = 0,

			// current cell state
			/** @type {number} */ current = 0,

			// whether cell should be alive in bit grid
			/** @type {boolean} */ bitAlive = false,

			// whether the cell is on the grid
			/** @type {boolean} */ onGrid = true,

			// whether a cell was or became LifeHistory state6
			/** @type {number} */ result = 0,

			// left target for next tile
			/** @type {number} */ leftTarget = (this.isTriangular ? 1 : 0),

			// right target to next tile
			/** @type {number} */ rightTarget = (this.isTriangular ? 14 : 15),

			// x coordinate for boundary check
			/** @type {number} */ cx = 0;

		// check for PCA rules
		if (this.isPCA || this.isRuleTree) {
			// swap grids every generation
			if ((this.counter & 1) !== 0) {
				colourGrid = this.nextColourGrid;
			}
		}

		// check for bounded grid cylinders
		if (this.boundedGridType !== -1) {
			if (this.boundedGridWidth === 0) {
				leftX = 0;
				rightX = this.width - 1;
			}
			if (this.boundedGridHeight === 0) {
				bottomY = 0;
				topY = this.height - 1;
			}
		}

		// check if the cell is on the grid
		if (!((x === (x & this.widthMask)) && (y === (y & this.heightMask)))) {
			onGrid = false;
			// attempt to grow the grid
			while (this.width < this.maxGridSize && !((x === (x & this.widthMask)) && (y === (y & this.heightMask)))) {
				this.growGrid();
				x += this.width >> 2;
				y += this.height >> 2;
			}
			// check if the cell is on the expanded grid
			if ((x === (x & this.widthMask)) && (y === (y & this.heightMask))) {
				// cell on expanded grid
				onGrid = true;
				// grid has changed so lookup again
				grid = this.grid16;
				tileGrid = this.tileGrid;
				colourGrid = this.colourGrid;
				colourTileGrid = this.colourTileGrid;
				colourTileHistoryGrid = this.colourTileHistoryGrid;
				overlayGrid = this.overlayGrid;
			}
		}

		// draw if on the grid
		if (onGrid) {
			// if bounded grid defined check the coordinates are within it
			if (this.boundedGridType !== -1 && (!(x >= leftX && x <= rightX && y >= bottomY && y <= topY))) {
				// do nothing
			} else {
				// check for PCA
				if (this.isPCA || this.isRuleTree) {
					current = colourGrid[y][x];
					colourGrid[y][x] = this.historyStates + state;
					colourTileHistoryGrid[y >> 4][x >> 8] = 65535;
					if (this.isRuleTree) {
						if ((this.counter & 1) !== 0) {
							grid = this.nextGrid16;
							tileGrid = this.nextTileGrid;
						}
		
						// get the tile mask
						cellAsTileBit = 1 << (~(x >> 4) & 15);
					}

					// update population
					if (state === 0) {
						if (current > this.historyStates) {
							if (this.isPCA) {
								this.population -= this.bitCounts16[current - this.historyStates];
							} else {
								this.population -= 1;
							}
						}
					} else {
						this.anythingAlive = 1;
						if (this.isPCA) {
							if (current <= this.historyStates) {
								this.population += this.bitCounts16[state];
							} else {
								this.population -= this.bitCounts16[current - this.historyStates];
								this.population += this.bitCounts16[state];
							}
						} else {
							tileGrid[y >> 4][x >> 8] |= cellAsTileBit;
							if (current === 0) {
								this.population += 1;
							}
						}
					}
				} else {
					// get correct grid for current generation
					if ((this.counter & 1) !== 0) {
						grid = this.nextGrid16;
						tileGrid = this.nextTileGrid;
					}
	
					// get the cell as a bit mask and tile mask
					cellAsBit = 1 << (~x & 15);
					cellAsTileBit = 1 << (~(x >> 4) & 15);
	
					// check for multi-state rules
					if (!this.isHROT) {
						if (this.multiNumStates <= 2) {
							// 2-state
							bitAlive = ((state & 1) === 1);
						} else {
							// generations
							bitAlive = (state === this.multiNumStates - 1);
						}
	
						// draw alive or dead
						if (bitAlive) {
							// mark a cell is alive
							this.anythingAlive = 1;
	
							// adjust population if cell was dead
							if ((grid[y][x >> 4] & cellAsBit) === 0) {
								this.population += 1;
							}
							// set cell
							colourGrid[y][x] = this.aliveStart;
							colourTileGrid[y >> 4][x >> 8] |= cellAsTileBit;
							colourTileHistoryGrid[y >> 4][x >> 8] |= cellAsTileBit;
							grid[y][x >> 4] |= cellAsBit;
							tileGrid[y >> 4][x >> 8] |= cellAsTileBit;
							// check left boundary
							cx = x & 15;
							if ((x > 0) && (cx <= leftTarget)) {
								x -= (cx + 1);
								tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
								x += (cx + 1);
							} else {
								// check right boundary
								if ((x < this.width - 1) && (cx >= rightTarget)) {
									x += (16 - cx);
									tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
									x -= (16 - cx);
								}
							}
							// check bottom boundary
							if ((y > 0) && ((y & 15) === 0)) {
								y -= 1;
								tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
								if ((x > 0) && (cx <= leftTarget)) {
									x -= (cx + 1);
									tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
									x += (cx + 1);
								} else {
									if ((x < this.width - 1) && (cx >= rightTarget)) {
										x += (16 - cx);
										tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
										x -= (16 - cx);
									}
								}
								y += 1;
							} else {
								// check top boundary
								if ((y < this.height - 1) && ((y & 15) === 15)) {
									y += 1;
									tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
									if ((x > 0) && (cx <= leftTarget)) {
										x -= (cx + 1);
										tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
										x += (cx + 1);
									} else {
										if ((x < this.width - 1) && (cx >= rightTarget)) {
											x += (16 - cx);
											tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
											x -= (16 - cx);
										}
									}
									y -= 1;
								}
							}
						} else {
							// adjust population if cell was alive
							if ((grid[y][x >> 4] & cellAsBit) !== 0) {
								this.population -= 1;
							}
							// clear cell
							if (deadZero) {
								colourGrid[y][x] = this.unoccupied;
							} else {
								colourGrid[y][x] = this.deadStart;
							}
							colourTileGrid[y >> 4][x >> 8] |= cellAsTileBit;
							colourTileHistoryGrid[y >> 4][x >> 8] |= cellAsTileBit;
							grid[y][x >> 4] &= ~cellAsBit;
						}
	
						// check for LifeHistory
						if (this.isLifeHistory && overlayGrid) {
							// check if the cell used to be or has become state 6
							current = overlayGrid[y][x];
							if (current > 0) {
								current = ViewConstants.stateMap.indexOf(current - 128);
							}
							if ((state === 6 && current !== 6) || (state !== 6 && current === 6)) {
								result = 1;
							}
		
							// update colour grid if history state
							if (state === 2) {
								colourGrid[y][x] = LifeConstants.deadMin;
							} else {
								// update overlay grid if not
								if (state === 0) {
									overlayGrid[y][x] = 0;
								} else {
									overlayGrid[y][x] = ViewConstants.stateMap[state] + 128;
								}
							}
						}
	
						// check for generations style rule
						if (this.multiNumStates > 2) {
							// write the correct state to the colour grid
							if (state > 0) {
								state = this.historyStates + state;
							}
							colourGrid[y][x] = state;
						}
					} else {
						// update population for HROT
						current = colourGrid[y][x];
						if (this.multiNumStates === 2) {
							aliveState = this.aliveStart;
							if (state === 1) {
								state = this.aliveStart;
								this.anythingAlive = 1;
							}
							colourGrid[y][x] = state;
						} else {
							aliveState = this.multiNumStates - 1 + this.historyStates;
							if (state > 0) {
								state = this.historyStates + state;
								this.anythingAlive = 1;
							}
							colourGrid[y][x] = state;
						}
						colourTileGrid[y >> 4][x >> 8] |= cellAsTileBit;
						colourTileHistoryGrid[y >> 4][x >> 8] |= cellAsTileBit;
						if (current !== aliveState && state === aliveState) {
							this.population += 1;
						} else {
							if (current === aliveState && state !== aliveState) {
								this.population -= 1;
							}
						}
					}
				}

				// if the state is not dead (or history) then update bounding box
				if (state > 0) {
					if (x < zoomBox.leftX) {
						zoomBox.leftX = x;
					}
					if (x > zoomBox.rightX) {
						zoomBox.rightX = x;
					}
					if (y < zoomBox.bottomY) {
						zoomBox.bottomY = y;
					}
					if (y > zoomBox.topY) {
						zoomBox.topY = y;
					}
					if (x < historyBox.leftX) {
						historyBox.leftX = x;
					}
					if (x > historyBox.rightX) {
						historyBox.rightX = x;
					}
					if (y < historyBox.bottomY) {
						historyBox.bottomY = y;
					}
					if (y > historyBox.topY) {
						historyBox.topY = y;
					}
					// if the state is alive then update HROT alive bounding box
					if (this.isHROT && state === this.multiNumStates - 1 + this.historyStates) {
						if (x < HROTBox.leftX) {
							HROTBox.leftX = x;
						}
						if (x > HROTBox.rightX) {
							HROTBox.rightX = x;
						}
						if (y < HROTBox.bottomY) {
							HROTBox.bottomY = y;
						}
						if (y > HROTBox.topY) {
							HROTBox.topY = y;
						}
					}
				} else {
					// only shrink if the cell was on the boundary of the bounding box
					if (x === zoomBox.leftX || x === zoomBox.rightX || y === zoomBox.topY || y === zoomBox.bottomY) {
						// mark shrink needed
						this.shrinkNeeded = true;
					}
				}
			}
		}

		// return whether LifeHistory state 6 changed
		return result;
	};

	// setup dynamic calls for performance
	Life.prototype.setupDynamicCalls = function() {
		var proto = null;
		
		// @ts-ignore
		if (window.Reflect) {
			// @ts-ignore
			if (window.Reflect.getPrototypeOf) {
				// @ts-ignore
				proto = Reflect.getPrototypeOf(this);
			}
		}
		if (proto === null) {
			// @ts-ignore
			proto = this.__proto__;
		}

		// pick optimized get and set cell calls based on pattern type and bounded grid
		if (this.multiNumStates == -1 && this.boundedGridType === -1 && !this.isNone) {
			if (this.isLifeHistory) {
				proto.getState = proto.getState2History;
				proto.setState = proto.setState2History;
			} else {
				proto.getState = proto.getState2;
				proto.setState = proto.setState2;
			}
		} else {
			proto.getState = proto.getStateAny;
			proto.setState = proto.setStateAny;
		}
	};

	// allocate or clear graph data
	Life.prototype.allocateGraphData = function(/** @type {boolean} */ allocate) {
		var /** @const {number} */ entries = 1 << LifeConstants.popChunkPower;

		if (allocate) {
			this.popGraphData = Array.matrix(Uint32, 1, entries, 0, this.allocator, "Life.popGraphData");
			this.birthGraphData = Array.matrix(Uint32, 1, entries, 0, this.allocator, "Life.birthGraphData");
			this.deathGraphData = Array.matrix(Uint32, 1, entries, 0, this.allocator, "Life.deathGraphData");
			this.popGraphEntries = entries;
		} else {
			this.popGraphData = Array.matrix(Uint32, 0, 0, 0, this.allocator, "Life.popGraphData");
			this.birthGraphData = Array.matrix(Uint32, 0, 0, 0, this.allocator, "Life.birthGraphData");
			this.deathGraphData = Array.matrix(Uint32, 0, 0, 0, this.allocator, "Life.deathGraphData");
			this.popGraphEntries = 0;
		}
	};

	// overridden by specific function below
	Life.prototype.getState = null;

	// get state (2 state patterns without bounded grid or [R]History)
	/** @result {number} */
	Life.prototype.getState2 = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ rawRequested) {
		// result
		var /** @type {number} */ result = 0,
		    /** @type {number} */ col = 0;

		// check if coordinates are on the grid
		if ((x === (x & this.widthMask)) && (y === (y & this.heightMask))) {
			// get the colour grid result
			col = this.colourGrid[y][x];
			if (rawRequested) {
				result = col;
			} else {
				if (col <= this.deadStart) {
					result = 0;
				} else {
					result = 1;
				}
			}
		}

		// return the result
		return result;
	};

	// get state (2 state [R]History patterns without bounded grid)
	/** @result {number} */
	Life.prototype.getState2History = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ rawRequested) {
		// result
		var /** @type {number} */ result = 0,
		    /** @type {number} */ col = 0,
		    /** @type {number} */ over = 0,

		    // get states 3, 4, 5 and 6
		    /** @const {number} */ state3 = ViewConstants.stateMap[3] + 128,
		    /** @const {number} */ state4 = ViewConstants.stateMap[4] + 128,
		    /** @const {number} */ state5 = ViewConstants.stateMap[5] + 128,
			/** @const {number} */ state6 = ViewConstants.stateMap[6] + 128;
			
		// check if coordinates are on the grid
		if ((x === (x & this.widthMask)) && (y === (y & this.heightMask))) {
			// get the colour grid result
			col = this.colourGrid[y][x];

			// check if raw data requested
			if (rawRequested) {
				result = col;
			} else {
				// check for the overlay grid
				if (this.overlayGrid) {
					// get the overlay colour
					over = this.overlayGrid[y][x];

					// states 4 and 6
					if (over === state4 || over === state6) {
						// if alive cell then use state 3
						if (col >= this.aliveStart) {
							over = state3;
						}
						result = ViewConstants.stateMap.indexOf(over - 128);
					} else {
						// states 3 and 5
						if (over === state3 || over === state5) {
							// if dead cell then use state 4
							if (col < this.aliveStart) {
								over = state4;
							}
							result = ViewConstants.stateMap.indexOf(over - 128);
						} else {
							if (col === this.unoccupied) {
								result = 0;
							} else {
								if (col <= this.deadStart) {
									result = 2;
								} else {
									result = 1;
								}
							}
						}
					}
				} else {
					// no overlay grid
					if (col <= this.deadStart) {
						result = 0;
					} else {
						result = 1;
					}
				}
			}
		}

		// return the result
		return result;
	};

	// get state (any pattern)
	/** @result {number} */
	Life.prototype.getStateAny = function(/** @type {number} */ x, /** @type {number} */ y, /** @type {boolean} */ rawRequested) {
		// result
		var /** @type {number} */ result = 0,
		    /** @type {number} */ col = 0,
		    /** @type {number} */ over = 0,

		    // get states 3, 4, 5 and 6
		    /** @const {number} */ state3 = ViewConstants.stateMap[3] + 128,
		    /** @const {number} */ state4 = ViewConstants.stateMap[4] + 128,
		    /** @const {number} */ state5 = ViewConstants.stateMap[5] + 128,
			/** @const {number} */ state6 = ViewConstants.stateMap[6] + 128,
			
		    // bounded grid top left
		    /** @type {number} */ leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    /** @type {number} */ bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // bounded grid bottom right
		    /** @type {number} */ rightX = leftX + this.boundedGridWidth - 1,
			/** @type {number} */ topY = bottomY + this.boundedGridHeight - 1,

			// colour grid
			colourGrid = this.colourGrid;

		// check for PCA rules
		if (this.isPCA || this.isRuleTree) {
			// swap grids every generation
			if ((this.counter & 1) !== 0) {
				colourGrid = this.nextColourGrid;
			}
		}

		// check if coordinates are on the grid
		if ((x === (x & this.widthMask)) && (y === (y & this.heightMask))) {
			// get the colour grid result
			col = colourGrid[y][x];

			// check if raw data requested or Generations or HROT rule used
			if (rawRequested || this.multiNumStates > 2) {
				// check if state is not dead
				if (this.multiNumStates > 2 && col > 0 && !this.isNone) {
					// check for history states
					if (col <= this.historyStates) {
						result = 0;
					} else {
						// check for bounded grid cylinders
						if (this.boundedGridType !== -1) {
							if (this.boundedGridWidth === 0) {
								leftX = 0;
								rightX = this.width - 1;
							}
							if (this.boundedGridHeight === 0) {
								bottomY = 0;
								topY = this.height - 1;
							}
						}

						// check for bounded grid border cell
						if (this.boundedGridType !== -1 && col === this.boundedBorderColour && (!(x >= leftX && x <= rightX && y >= bottomY && y <= topY))) {
							result = 0;
						} else {
							if (this.isPCA || this.isRuleTree) {
								result = col - this.historyStates;
							} else {
								result = this.multiNumStates + this.historyStates - col;
							}
						}
					}
				} else {
					result = col;
				}
			} else {
				// check for the overlay grid
				if (this.overlayGrid) {
					// get the overlay colour
					over = this.overlayGrid[y][x];

					// states 4 and 6
					if (over === state4 || over === state6) {
						// if alive cell then use state 3
						if (col >= this.aliveStart) {
							over = state3;
						}
						result = ViewConstants.stateMap.indexOf(over - 128);
					} else {
						// states 3 and 5
						if (over === state3 || over === state5) {
							// if dead cell then use state 4
							if (col < this.aliveStart) {
								over = state4;
							}
							result = ViewConstants.stateMap.indexOf(over - 128);
						} else {
							if (col === this.unoccupied) {
								result = 0;
							} else {
								if (col <= this.deadStart) {
									result = 2;
								} else {
									result = 1;
								}
							}
						}
					}
				} else {
					// no overlay grid
					if (col <= this.deadStart || col === this.boundedBorderColour) {
						result = 0;
					} else {
						result = 1;
					}
				}
			}
		}

		// return the result
		return result;
	};

	// count tiles in a grid
	/** @return {number} */
	Life.prototype.tileCount = function(tile) {
		var tileRow = null,
		    /** @type {number} */ y = 0,
		    /** @type {number} */ x = 0,
		    /** @type {number} */ tileGroup = 0,
		    /** @const {number} */ l = tile.length,
		    /** @const {number} */ w = tile[0].length,
		    bitCounts16 = this.bitCounts16,

		    // zero count
		    /** @type {number} */ result = 0;

		// count tiles used
		for (y = 0; y < l; y += 1) {
			// get the next tile row
			tileRow = tile[y];

			// get each set of tiles in the row
			for (x = 0; x < w; x += 1) {
				// get the next tile group
				tileGroup = tileRow[x];

				// count the tiles in the group
				if (tileGroup) {
					result += bitCounts16[tileGroup];
				}
			}
		}

		// return count
		return result;
	};

	// check for reverse playback
	Life.prototype.checkReverse = function(view, gen) {
		var i = 0,
			editList = view.editList,
			l = editList.length,
			record = null,
			found = false;

		// do nothing if not Margolus rule
		if (this.isMargolus || this.isPCA) {
			// see if there is a reverse playback record at the given generation
			this.reversePending = false;
			this.reverseMargolus = false;
			i = 0;
			while (!found && i < l) {
				// get next record
				record = editList[i];

				// check if it is before target generation
				if (record.gen < gen) {
					// check if it is a reverse playback record
					if (record.action === "reverse playback") {
						this.reverseMargolus = !this.reverseMargolus;
					}
					// next record
					i += 1;
				} else {
					// check if it is after taget generation
					if (record.gen > gen) {
						// bail out since generation passed
						found = true;
					} else {
						// at target generation
						if (record.action === "reverse playback") {
							this.reversePending = true;
							found = true;
						} else {
							// next record
							i += 1;
						}
					}
				}
			}
		}
	};

	// run to given generation (used to step back)
	Life.prototype.runTo = function(targetGen, statsOn, graphDisabled, view) {
		// get the latest snapshot
		var numSnapshots = this.snapshotManager.snapshots.length,
			snapshot = null;
			
		// if generation is earlier than current go from previous snapshot
		if (targetGen < this.counter) {
			snapshot = this.snapshotManager.snapshotBefore(targetGen);

			// check if a snapshot was deleted
			if (numSnapshots !== this.snapshotManager.snapshots.length) {
				// reduce snapshot target
				this.nextSnapshotTarget -= (LifeConstants.snapshotInterval * (numSnapshots - this.snapshotManager.snapshots.length));
			}
		}
	
		// check if the snapshot exists
		if (snapshot) {
			// restore the snapshot
			this.restoreSnapshot(snapshot);
			view.pasteRLEList();
		}

		// play from the snapshot counter to just before the target with stats off (for speed)
		while (this.counter < targetGen - 1) {
			if (this.anythingAlive) {
				// check for reverse direction
				this.checkReverse(view, this.counter);
				this.nextGeneration(false, true, graphDisabled, view.identify);
				if (!(this.anythingAlive === 0 && this.multiNumStates > 2)) {
					this.convertToPensTile();
				}
				// check for just died for 2 state patterns
				if (this.anythingAlive === 0 && this.multiNumStates <= 2) {
					// clear the other buffer
					this.anythingAlive = 1;
					this.checkReverse(view, this.counter);
					this.nextGeneration(false, false, graphDisabled, view.identify);
					this.anythingAlive = 0;
					this.counter -= 1;
				}
			} else {
				this.counter += 1;
				this.convertToPensTile();
			}
			view.pasteRLEList();
		}

		// compute the final generation with stats on if required
		if (this.counter < targetGen) {
			if (this.anythingAlive) {
				this.checkReverse(view, this.counter);
				this.nextGeneration(statsOn, true, graphDisabled, view.identify);
				if (!(this.anythingAlive === 0 && this.multiNumStates > 2)) {
					this.convertToPensTile();
				}
				// check for just died for 2 state patterns
				if (this.anythingAlive === 0 && this.multiNumStates <= 2) {
					// clear the other buffer
					this.anythingAlive = 1;
					this.checkReverse(view, this.counter);
					this.nextGeneration(false, false, graphDisabled, view.identify);
					this.anythingAlive = 0;
					this.counter -= 1;
				}
			} else {
				this.counter += 1;
				this.convertToPensTile();
			}
			view.pasteRLEList();
		} else {
			// for two state rules convert to pens once since colour grid was on previous generation when snapshot saved
			if (this.multiNumStates === -1) {
				this.convertToPensTile();
			}
		}

		// if paste every is defined then always flag there are alive cells
		// since cells will appear in the future
		if (view.isPasteEvery) {
			this.anythingAlive = 1;
		}
	};

	// restore snapshot
	Life.prototype.restoreSnapshot = function(snapshot) {
		var grid = null,
		    nextGrid = null,
		    tileGrid = null,
		    nextTileGrid = null,
			colourGrid = this.colourGrid;

		// restore the counter
		this.counter = snapshot.counter;
		this.counterMargolus = snapshot.counterMargolus;
		this.maxMargolusGen = snapshot.maxMargolusGen;

		// check which buffer to copy to
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid;
			nextGrid = this.grid;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.grid;
			nextGrid = this.nextGrid;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear the grid, colour grid and small colour grid
		grid.whole.fill(0);
		nextGrid.whole.fill(0);
		this.colourGrid.whole.fill(0);
		if (this.isPCA || this.isRuleTree) {
			this.nextColourGrid.whole.fill(0);
		}
		this.smallColourGrid.whole.fill(0);

		// copy the colour tile history grid into the colour grid
		Array.copy(this.colourTileHistoryGrid, this.colourTileGrid);

		// restore grid from snapshot
		snapshot.restoreGridUsingTile(grid, tileGrid, this);

		// restore colour grid from snapshot
		snapshot.restoreColourGridUsingTile(colourGrid, this.colourTileHistoryGrid, this);
		if (this.isPCA || this.isRuleTree) {
			Array.copy(colourGrid, this.nextColourGrid);
		}

		// copy the tile grid to the next tile grid
		Array.copy(tileGrid, nextTileGrid);
		Array.copy(grid, nextGrid);

		// restore the bounding box
		this.zoomBox.leftX = snapshot.zoomBox.leftX;
		this.zoomBox.bottomY = snapshot.zoomBox.bottomY;
		this.zoomBox.rightX = snapshot.zoomBox.rightX;
		this.zoomBox.topY = snapshot.zoomBox.topY;
		this.HROTBox.leftX = snapshot.HROTBox.leftX;
		this.HROTBox.bottomY = snapshot.HROTBox.bottomY;
		this.HROTBox.rightX = snapshot.HROTBox.rightX;
		this.HROTBox.topY = snapshot.HROTBox.topY;

		// restore the population
		this.population = snapshot.population;
		this.births = snapshot.births;
		this.deaths = snapshot.deaths;

		// restore the alive flags
		this.anythingAlive = snapshot.anythingAlive;
	};

	// save snapshot
	Life.prototype.saveSnapshot = function() {
		var grid = null,
		    tileGrid = null;

		// check which buffer to copy
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid;
			tileGrid = this.nextTileGrid;
		} else {
			grid = this.grid;
			tileGrid = this.tileGrid;
		}

		// save to specific snapshot
		this.saveToSnapshot(false, grid, tileGrid);
	};

	// restore saved grid
	Life.prototype.restoreSavedGrid = function(noHistory) {
		// restore the reset snapshot
		this.restoreSnapshot(this.resetSnapshot);

		// clear the snapshots
		this.snapshotManager.reset();
		this.nextSnapshotTarget = LifeConstants.snapshotInterval;

		// save reset position as initial snapshot if history enabled
		if (!noHistory) {
			this.saveSnapshot();
		}
	};

	// save to a specific snapshot
	Life.prototype.saveToSnapshot = function(isReset, grid, tileGrid) {
		var colourGrid = this.colourGrid;

		// check for PCA rules
		if (this.isPCA || this.isRuleTree) {
			// swap grids every generation
			if ((this.counter & 1) !== 0) {
				colourGrid = this.nextColourGrid;
			}
		}

		// create the snapshot
		this.snapshotManager.saveSnapshot(grid, tileGrid, colourGrid, this.colourTileHistoryGrid, this.overlayGrid, this.zoomBox, this.HROTBox, this.population, this.births, this.deaths, this.counter, this.counterMargolus, this.maxMargolusGen, ((this.tileCols - 1) >> 4) + 1, this.tileRows, this, isReset, this.anythingAlive);
	};

	// save grid
	Life.prototype.saveGrid = function(noHistory) {
		// reset snapshot manager
		this.snapshotManager.reset();

		// save initial position for reset
		this.saveToSnapshot(true, this.grid, this.tileGrid);

		// save reset position as initial snapshot if history enabled
		if (!noHistory) {
			this.saveSnapshot();
		}
	};

	// reset grid size
	Life.prototype.resetGridSize = function(width, height) {
		// get current grid buffers
		var currentOverlayGrid = this.overlayGrid,
		    currentMaskGrid = this.state6Mask;
			
		// set width and height
		this.width = width;
		this.height = height;

		// set HROT buffers if used
		if (this.isHROT) {
			this.HROT.resize(this.width, this.height);
		}

		// allocate the new buffers
		this.grid = Array.matrix(Uint8, this.height, ((this.width - 1) >> 3) + 1, 0, this.allocator, "Life.grid");
		this.nextGrid = Array.matrix(Uint8, this.height, ((this.width - 1) >> 3) + 1, 0, this.allocator, "Life.nextGrid");

		// 16bit view of grid and double buffer
		this.grid16 = Array.matrixView(Uint16, this.grid, "Life.grid16");
		this.nextGrid16 = Array.matrixView(Uint16, this.nextGrid, "Life.nextGrid16");

		// check if the mask is allocated
		if (currentMaskGrid) {
			this.state6Mask = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Mask");
			this.state6Alive = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Alive");
			this.state6Cells = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Cells");
		}

		// recompute the number of tile rows and columns
		this.tileCols = this.width >> this.tilePower;
		this.tileRows = this.height >> this.tilePower;

		// allocate the tile grids
		if (currentMaskGrid) {
			this.state6TileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.state6TileGrid");
		}
		this.tileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.tileGrid");
		this.nextTileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.nextTileGrid");
		this.colourTileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.colourTileGrid");
		this.colourTileHistoryGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.colourTileHistoryGrid");

		// blank row for life grid to prevent wrap
		this.blankRow = this.allocator.allocate(Uint8, ((this.width - 1) >> 3) + 1, "Life.blankRow");

		// blank row for 16 bit life grid
		this.blankRow16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.blankRow16");

		// blank tile row to prevent wrap
		this.blankTileRow = this.allocator.allocate(Uint16, this.tileCols >> 4, "Life.blankTileRow");

		// blank colour grid row
		this.blankColourRow = this.allocator.allocate(Uint8, this.width, "Life.blankColourRow");

		// column occupancy array for grid bounding box calculation
		this.columnOccupied16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.columnOccupied16");

		// row occupancy array for grid bounding box calculation
		this.rowOccupied16 = this.allocator.allocate(Uint16, ((this.height - 1) >> 4) + 1, "Life.rowOccupied16");

		// colour grid
		this.colourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.colourGrid");
		if (this.isPCA || this.isRuleTree) {
			this.nextColourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.nextColourGrid");
			this.nextColourGrid16 = Array.matrixView(Uint16, this.nextColourGrid, "Life.nextColourGrid16");
			this.nextColourGrid32 = Array.matrixView(Uint32, this.nextColourGrid, "Life.nextColourGrid32");
		} else {
			this.nextColourGrid = null;
			this.nextColourGrid16 = null;
			this.nextColourGrid32 = null;
		}
		this.smallColourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallColourGrid");
		this.colourGrid16 = Array.matrixView(Uint16, this.colourGrid, "Life.colourGrid16");
		this.colourGrid32 = Array.matrixView(Uint32, this.colourGrid, "Life.colourGrid32");

		// check if overlay grid was allocated
		if (currentOverlayGrid) {
			this.overlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.overlayGrid");
			this.smallOverlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallOverlayGrid");
			this.overlayGrid16 = Array.matrixView(Uint16, this.overlayGrid, "Life.overlayGrid16");
			this.overlayGrid32 = Array.matrixView(Uint32, this.overlayGrid, "Life.overlayGrid32");
		}

		// create the grid width and height masks
		this.widthMask = this.width - 1;
		this.heightMask = this.height - 1;

		// update the snapshots
		this.snapshotManager.resizeSnapshots(((this.tileCols - 1) >> 4) + 1, this.tileRows, 0);
	};

	// allocate grid
	Life.prototype.allocateGrid = function(width, height) {
		// allocate new grid
		this.width = width;
		this.height = height;

		// allocate the new buffers
		this.grid = Array.matrix(Uint8, this.height, ((this.width - 1) >> 3) + 1, 0, this.allocator, "Life.grid");
		this.nextGrid = Array.matrix(Uint8, this.height, ((this.width - 1) >> 3) + 1, 0, this.allocator, "Life.nextGrid");

		// 16bit view of grid and double buffer
		this.grid16 = Array.matrixView(Uint16, this.grid, "Life.grid16");
		this.nextGrid16 = Array.matrixView(Uint16, this.nextGrid, "Life.nextGrid16");

		// recompute the number of tile rows and columns
		this.tileCols = this.width >> this.tilePower;
		this.tileRows = this.height >> this.tilePower;

		// allocate tile grids
		this.tileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.tileGrid");
		this.nextTileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.nextTileGrid");
		this.colourTileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.colourTileGrid");
		this.colourTileHistoryGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.colourTileHistoryGrid");

		// blank row for life grid to prevent wrap
		this.blankRow = this.allocator.allocate(Uint8, ((this.width - 1) >> 3) + 1, "Life.blankRow");

		// blank row for 16 bit life grid
		this.blankRow16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.blankRow16");

		// blank tile row to prevent wrap
		this.blankTileRow = this.allocator.allocate(Uint16, this.tileCols >> 4, "Life.blankTileRow");

		// blank colour grid row
		this.blankColourRow = this.allocator.allocate(Uint8, this.width, "Life.blankColourRow");

		// column occupancy array for grid bounding box calculation
		this.columnOccupied16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.columnOccupied16");

		// row occupancy array for grid bounding box calculation
		this.rowOccupied16 = this.allocator.allocate(Uint16, ((this.height - 1) >> 4) + 1, "Life.rowOccupied16");

		// colour grid
		this.colourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.colourGrid");
		this.colourGrid16 = Array.matrixView(Uint16, this.colourGrid, "Life.colourGrid16");
		this.colourGrid32 = Array.matrixView(Uint32, this.colourGrid, "Life.colourGrid32");
		if (this.isPCA || this.isRuleTree) {
			this.nextColourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.nextColourGrid");
			this.nextColourGrid16 = Array.matrixView(Uint16, this.nextColourGrid, "Life.nextColourGrid16");
			this.nextColourGrid32 = Array.matrixView(Uint32, this.nextColourGrid, "Life.nextColourGrid32");
		} else {
			this.nextColourGrid = null;
			this.nextColourGrid16 = null;
			this.nextColourGrid32 = null;
		}

		// create the grid width and height masks
		this.widthMask = this.width - 1;
		this.heightMask = this.height - 1;
	};

	// grow grid
	Life.prototype.growGrid = function() {
		// get the current grid size
		var currentSize = this.width,

		    // get current grid buffers
		    currentGrid = this.grid,
		    currentNextGrid = this.nextGrid,
			currentColourGrid = this.colourGrid,
			currentNextColourGrid = this.nextColourGrid,
		    currentSmallColourGrid = this.smallColourGrid,
		    currentOverlayGrid = this.overlayGrid,
		    currentSmallOverlayGrid = this.smallOverlayGrid,
		    currentMaskGrid = this.state6Mask,
		    currentMaskAliveGrid = this.state6Alive,
			currentMaskCellsGrid = this.state6Cells,
			currentCountList = this.countList,

		    // get current tile buffers
		    currentMaskTileGrid = this.state6TileGrid,
		    currentTileGrid = this.tileGrid,
		    currentNextTileGrid = this.nextTileGrid,
		    currentColourTileGrid = this.colourTileGrid,
		    currentColourTileHistoryGrid = this.colourTileHistoryGrid,

		    // current height
		    currentHeight = this.height,

		    // current tile height
		    currentTileHeight = this.tileRows,

		    // x and y offsets
		    xOffset = this.width >> 1,
			yOffset = this.height >> 1,
			
			// identify bottom left
			idCurrent = 0,
			idBottom = 0,
			idLeft = 0,

		    // row number
		    y = 0;

		// check if already at maximum size
		if (currentSize < this.maxGridSize) {
			// double the size
			this.width *= 2;
			this.height *= 2;

			// grow HROT buffers if used
			if (this.isHROT) {
				this.HROT.resize(this.width, this.height);
			}

			// allocate the new buffers
			this.grid = Array.matrix(Uint8, this.height, ((this.width - 1) >> 3) + 1, 0, this.allocator, "Life.grid");
			this.nextGrid = Array.matrix(Uint8, this.height, ((this.width - 1) >> 3) + 1, 0, this.allocator, "Life.nextGrid");

			// 16bit view of grid and double buffer
			this.grid16 = Array.matrixView(Uint16, this.grid, "Life.grid16");
			this.nextGrid16 = Array.matrixView(Uint16, this.nextGrid, "Life.nextGrid16");

			// check if the mask is allocated
			if (currentMaskGrid) {
				this.state6Mask = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Mask");
				this.state6Alive = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Alive");
				this.state6Cells = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Cells");
			}

			// recompute the number of tile rows and columns
			this.tileCols = this.width >> this.tilePower;
			this.tileRows = this.height >> this.tilePower;

			// allocate the tile grids
			if (currentMaskGrid) {
				this.state6TileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.state6TileGrid");
			}
			this.tileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.tileGrid");
			this.nextTileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.nextTileGrid");
			this.colourTileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.colourTileGrid");
			this.colourTileHistoryGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.colourTileHistoryGrid");

			// blank row for life grid to prevent wrap
			this.blankRow = this.allocator.allocate(Uint8, ((this.width - 1) >> 3) + 1, "Life.blankRow");

			// blank row for 16 bit life grid
			this.blankRow16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.blankRow16");

			// blank tile row to prevent wrap
			this.blankTileRow = this.allocator.allocate(Uint16, this.tileCols >> 4, "Life.blankTileRow");

			// blank colour grid row
			this.blankColourRow = this.allocator.allocate(Uint8, this.width, "Life.blankColourRow");

			// column occupancy array for grid bounding box calculation
			this.columnOccupied16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.columnOccupied16");

			// row occupancy array for grid bounding box calculation
			this.rowOccupied16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.rowOccupied16");

			// count grid
			if (currentCountList) {
				this.countList = Array.matrix(Uint8, this.height, this.width, LifeConstants.cellNotSeen, this.allocator, "Life.countList");
			}

			// colour grid
			this.colourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.colourGrid");
			this.smallColourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallColourGrid");
			this.colourGrid16 = Array.matrixView(Uint16, this.colourGrid, "Life.colourGrid16");
			this.colourGrid32 = Array.matrixView(Uint32, this.colourGrid, "Life.colourGrid32");
			if (this.isPCA || this.isRuleTree) {
				this.nextColourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.nextColourGrid");
				this.nextColourGrid16 = Array.matrixView(Uint16, this.nextColourGrid, "Life.nextColourGrid16");
				this.nextColourGrid32 = Array.matrixView(Uint32, this.nextColourGrid, "Life.nextColourGrid32");
			} else {
				this.nextColourGrid = null;
				this.nextColourGrid16 = null;
				this.nextColourGrid32 = null;
			}

			// check if overlay grid was allocated
			if (currentOverlayGrid) {
				this.overlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.overlayGrid");
				this.smallOverlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallOverlayGrid");
				this.overlayGrid16 = Array.matrixView(Uint16, this.overlayGrid, "Life.overlayGrid16");
				this.overlayGrid32 = Array.matrixView(Uint32, this.overlayGrid, "Life.overlayGrid32");
			}

			// create the grid width and height masks
			this.widthMask = this.width - 1;
			this.heightMask = this.height - 1;

			// copy the old grids to the center of the new ones
			for (y = 0; y < currentHeight; y += 1) {
				this.grid[y + yOffset].set(currentGrid[y], xOffset >> 3);
				this.nextGrid[y + yOffset].set(currentNextGrid[y], xOffset >> 3);
				this.colourGrid[y + yOffset].set(currentColourGrid[y], xOffset);
				this.smallColourGrid[y + yOffset].set(currentSmallColourGrid[y], xOffset);
				if (this.isPCA || this.isRuleTree) {
					this.nextColourGrid[y + yOffset].set(currentNextColourGrid[y], xOffset);
				}
				if (this.countList) {
					this.countList[y + yOffset].set(currentCountList[y], xOffset);
				}

				// check if overlay grid was allocated
				if (currentOverlayGrid && currentSmallOverlayGrid) {
					this.overlayGrid[y + yOffset].set(currentOverlayGrid[y], xOffset);
					this.smallOverlayGrid[y + yOffset].set(currentSmallOverlayGrid[y], xOffset);
				}

				// check if the mask was allocated
				if (currentMaskGrid && currentMaskAliveGrid && currentMaskCellsGrid) {
					this.state6Mask[y + yOffset].set(currentMaskGrid[y], xOffset >> 4);
					this.state6Alive[y + yOffset].set(currentMaskAliveGrid[y], xOffset >> 4);
					this.state6Cells[y + yOffset].set(currentMaskCellsGrid[y], xOffset >> 4);
				}
			}

			// copy the old tile grids to the center of the new ones
			yOffset = currentTileHeight >> 1;
			for (y = 0; y < currentTileHeight; y += 1) {
				if (currentMaskTileGrid) {
					this.state6TileGrid[y + yOffset].set(currentMaskTileGrid[y], this.state6TileGrid[y].length >> 2);
				}
				this.tileGrid[y + yOffset].set(currentTileGrid[y], this.tileGrid[y].length >> 2);
				this.nextTileGrid[y + yOffset].set(currentNextTileGrid[y], this.nextTileGrid[y].length >> 2);
				this.colourTileGrid[y + yOffset].set(currentColourTileGrid[y], this.colourTileGrid[y].length >> 2);
				this.colourTileHistoryGrid[y + yOffset].set(currentColourTileHistoryGrid[y], this.colourTileHistoryGrid[y].length >> 2);
			}

			// update the x and y offsets
			xOffset = this.width >> 2;
			yOffset = this.height >> 2;

			// update the snapshots
			this.snapshotManager.resizeSnapshots(((this.tileCols - 1) >> 4) + 1, this.tileRows, xOffset);

			// update camera x and y
			this.xOff += xOffset;
			this.yOff += yOffset;

			// check for hex rule
			if (this.isHex) {
				this.xOff -= (yOffset / 2 | 0);
			}

			// update bounding boxes
			this.zoomBox.leftX += xOffset;
			this.zoomBox.rightX += xOffset;
			this.zoomBox.topY += yOffset;
			this.zoomBox.bottomY += yOffset;

			this.HROTBox.leftX += xOffset;
			this.HROTBox.rightX += xOffset;
			this.HROTBox.topY += yOffset;
			this.HROTBox.bottomY += yOffset;

			this.initialBox.leftX += xOffset;
			this.initialBox.rightX += xOffset;
			this.initialBox.topY += yOffset;
			this.initialBox.bottomY += yOffset;

			this.historyBox.leftX += xOffset;
			this.historyBox.rightX += xOffset;
			this.historyBox.topY += yOffset;
			this.historyBox.bottomY += yOffset;

			// update identify positions
			if (this.oscLength > 0) {
				for (y = 0; y < this.oscLength; y += 1) {
					idCurrent = this.boxList[(y << 1) + 1];
					idLeft = (idCurrent >> 16) + xOffset;
					idBottom = (idCurrent & 65535) + yOffset;
					this.boxList[(y << 1) + 1] = (idLeft << 16) | idBottom;
				}
			}
		}
	};

	// check if the grid buffer needs to grow
	Life.prototype.checkForGrowth = function(box, maxStep) {
	    // get the current grid width and height
		var width = this.width,
		    height = this.height,

		    // whether the buffer grew
		    result = false;

		// check if already at maximum size
		if (width < this.maxGridSize && this.anythingAlive) {
			// check bounding box
			if (box.leftX <= maxStep || box.bottomY <= maxStep || box.rightX >= (width - maxStep) || box.topY >= (height - maxStep)) {
				// grow the grid
				this.growGrid();
				result = true;
			}
		}

		// return whether the buffer grew
		return result;
	};

	// initialise 16bit counts
	Life.prototype.initBitCounts16 = function() {
		var i, v, c, bitCounts = this.bitCounts16;

		for (i = 0; i < 65536; i += 1) {
			v = i;
			for (c = 0; v; c += 1) {
				v &= v - 1;
			}
			bitCounts[i] = c;
		}
	};

	// initialise colour reset
	Life.prototype.initColourReset = function() {
		var h, b,
		    colourReset = this.colourReset,
		    aliveStart = this.aliveStart;

		// create the 8 colours for each of the 8 bit entries
		for (h = 0; h < 256; h += 1) {
			for (b = 0; b < 8; b += 1) {
				colourReset[(h << 3) + b] = (h & (1 << (7 - b))) ? aliveStart : 0;
			}
		}
	};

	// reset population for grid region
	Life.prototype.resetPopulationBox = function(grid16, colourGrid) {
		var h = 0, w = 0,
		    nextRow = null,
		    population = 0,
		    count = 0,
		    bitCounts16 = this.bitCounts16,

		    // get grid bounding box
		    zoomBox = this.zoomBox,
		    leftX = zoomBox.leftX,
		    rightX = zoomBox.rightX,
		    topY = zoomBox.topY,
			bottomY = zoomBox.bottomY;
			
		// check for HROT or PCA
		if (this.isHROT || this.isPCA || this.isRuleTree) {
			// compute population from colour grid
			for (h = bottomY; h <= topY; h += 1) {
				// get next row
				nextRow = colourGrid[h];

				// count population along the row
				for (w = leftX; w <= rightX; w += 1) {
					if (nextRow[w] > 0) {
						population += 1;
					}
				}
			}
		} else {
			// compute population from bit grid
			leftX >>= 4;
			rightX >>= 4;
			for (h = bottomY; h <= topY; h += 1) {
				// get next row
				nextRow = grid16[h];
	
				// count population along row
				for (w = leftX; w <= rightX; w += 1) {
					count = bitCounts16[nextRow[w]];
					population += count;
				}
			}
		}

		// save statistics
		this.population = population;
		this.births = 0;
		this.deaths = 0;
	};

	// resize life display
	Life.prototype.resizeDisplay = function(displayWidth, displayHeight) {
		var context = this.context,
		    pixelColour = 0,
		    i = 0;

		// set the black pixel colour
		if (this.littleEndian) {
			pixelColour = 0xff000000;
		} else {
			pixelColour = 0x000000ff;
		}

		// save the display width and height
		this.displayWidth = displayWidth;
		this.displayHeight = displayHeight;

		// clear the old buffers
		this.imageData = null;
		this.data32 = null;
		this.data8 = null;

		// update the drawing context
		this.imageData = context.createImageData(context.canvas.width, context.canvas.height);

		// check if buffer is available
		if (this.imageData.data.buffer) {
			// create 32 bit view over the image data buffer
			this.data32 = new Uint32Array(this.imageData.data.buffer);
		} else {
			// buffer not available so create buffer to copy
			this.data32 = new Uint32Array(this.imageData.data.length >> 2);

			// create an 8bit view of the buffer
			this.data8 = new Uint8Array(this.data32.buffer);
		}

		// create the new blank pixel row
		this.blankPixelRow = this.allocator.allocate(Uint32, displayWidth, "Life.blankPixelRow");
		for (i = 0; i < displayWidth; i += 1) {
			this.blankPixelRow[i] = pixelColour;
		}
		
		// clear pixels
		this.clearPixels(pixelColour);

		// resize the scale canvas to double the drawing canvas plus one zoom cell
		this.initPretty();
	};

	// copy state 2 cells to colour grid
	Life.prototype.copyState2 = function(pattern, panX, panY) {
		var x = 0,
		    y = 0,

		    // colour grid and row
		    colourGrid = this.colourGrid,
		    colourGridRow = null,

		    // pattern width and height
		    width = pattern.width,
		    height = pattern.height,

		    // width and height masks
		    wm = this.widthMask,
		    hm = this.heightMask,

		    // multi-state view
		    multiStateRow = null,

		    // starting dead colour
		    deadMin = this.deadMin,

		    // translated state 2 value
		    state2 = ViewConstants.stateMap[2];

		// copy LifeHistory state 2 to colour grid
		for (y = 0; y < height; y += 1) {
			multiStateRow = pattern.multiStateMap[y];
			colourGridRow = colourGrid[(y + panY) & hm];

			// check row
			for (x = 0; x < width; x += 1) {
				// check for state 2
				if (multiStateRow[x] === state2) {
					// set the colour grid to the dead start colour
					colourGridRow[(x + panX) & wm] = deadMin;
				}
			}
		}
	};

	// free the overlay
	Life.prototype.freeOverlay = function() {
		this.overlayGrid = null;
		this.smallOverlayGrid = null;
		this.overlayGrid16 = null;
		this.overlayGrid32 = null;
	};

	// create the overlay
	Life.prototype.createOverlay = function() {
		this.overlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.overlayGrid");
		this.smallOverlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallOverlayGrid");
		this.smallOverlayGrid4 = Array.matrixViewWithOffset(this.smallOverlayGrid, 1, "Life.smallOverlayGrid4");
		this.smallOverlayGrid8 = Array.matrixViewWithOffset(this.smallOverlayGrid, 3, "Life.smallOverlayGrid8");
		this.smallOverlayGrid16 = Array.matrixViewWithOffset(this.smallOverlayGrid, 7, "Life.smallOverlayGrid16");
		this.overlayGrid16 = Array.matrixView(Uint16, this.overlayGrid, "Life.overlayGrid16");
		this.overlayGrid32 = Array.matrixView(Uint32, this.overlayGrid, "Life.overlayGrid32");
	};

	// free the state6 mask
	Life.prototype.freeState6Mask = function() {
		this.state6Mask = null;
		this.state6Alive = null;
		this.state6Cells = null;
		this.state6TileGrid = null;
	};

	// create the state6 mask
	Life.prototype.createState6Mask = function() {
		// allocate the mask and alive mask
		this.state6Mask = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Mask");
		this.state6Alive = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Alive");
		this.state6Cells = Array.matrix(Uint16, this.height, ((this.width - 1) >> 4) + 1, 0, this.allocator, "Life.state6Cells");
		this.state6TileGrid = Array.matrix(Uint16, this.tileRows, ((this.tileCols - 1) >> 4) + 1, 0, this.allocator, "Life.state6TileGrid");
	};

	// populate the state6 mask from the colour grid
	Life.prototype.populateState6MaskFromColGrid = function() {
		var x = 0,
		    y = 0,

		    // mask rows
		    maskRow0 = null,
		    maskRow1 = null,
		    maskRow2 = null,
		    cellsRow = null,

		    // width and height masks
		    wm = this.widthMask,
		    hm = this.heightMask,

		    // multi-state view
		    overlayRow = null,

		    // bit offset
		    offset = 0,

		    // tile grid
		    tileGrid = this.state6TileGrid,
		    tileRow0 = null,
		    tileRow1 = null,
		    tileRow2 = null,

		    // tile size (2^n)
			tilePower = this.tilePower,
			
			// state 6 value in colour grid
			state6 = ViewConstants.stateMap[6] + 128;

		// clear current mask and cells
		this.state6Mask.whole.fill(0);
		this.state6Cells.whole.fill(0);
		this.state6Alive.whole.fill(0);

		// clear state6 tile grid
		this.state6TileGrid.whole.fill(0);

		// remove bits from the mask that are state 6 in the pattern
		for (y = 1; y < this.height - 1; y += 1) {
			// get the rows
			overlayRow = this.overlayGrid[y];
			maskRow0 = this.state6Mask[(y - 1) & hm];
			maskRow1 = this.state6Mask[y & hm];
			maskRow2 = this.state6Mask[(y + 1) & hm];
			cellsRow = this.state6Cells[y & hm];
			tileRow0 = tileGrid[((y - 1) & hm) >> tilePower];
			tileRow1 = tileGrid[(y & hm) >> tilePower];
			tileRow2 = tileGrid[((y + 1) & hm) >> tilePower];

			// check row
			for (x = 1; x <= this.width - 1; x += 1) {
				// check for state 6
				if (overlayRow[x] === state6) {
					// set the cell position itself
					offset = x & wm;
					cellsRow[offset >> 4] |= (1 << (~offset & 15));

					// set the cells around the state 6 cell in the mask
					maskRow0[offset >> 4] |= (1 << (~offset & 15));
					maskRow1[offset >> 4] |= (1 << (~offset & 15));
					maskRow2[offset >> 4] |= (1 << (~offset & 15));
					tileRow0[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow1[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow2[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					offset = (x - 1) & wm;
					maskRow0[offset >> 4] |= (1 << (~offset & 15));
					maskRow1[offset >> 4] |= (1 << (~offset & 15));
					maskRow2[offset >> 4] |= (1 << (~offset & 15));
					tileRow0[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow1[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow2[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					offset = (x + 1) & wm;
					maskRow0[offset >> 4] |= (1 << (~offset & 15));
					maskRow1[offset >> 4] |= (1 << (~offset & 15));
					maskRow2[offset >> 4] |= (1 << (~offset & 15));
					tileRow0[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow1[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow2[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
				}
			}
		}
	};

	// populate the state6 mask
	Life.prototype.populateState6Mask = function(pattern, panX, panY) {
		var x = 0,
		    y = 0,

		    // mask rows
		    maskRow0 = null,
		    maskRow1 = null,
		    maskRow2 = null,
		    cellsRow = null,

		    // pattern width and height
		    width = pattern.width,
		    height = pattern.height,

		    // width and height masks
		    wm = this.widthMask,
		    hm = this.heightMask,

		    // multi-state view
		    multiStateRow = null,

		    // bit offset
		    offset = 0,

		    // tile grid
		    tileGrid = this.state6TileGrid,
		    tileRow0 = null,
		    tileRow1 = null,
		    tileRow2 = null,

		    // tile size (2^n)
		    tilePower = this.tilePower;

		// remove bits from the mask that are state 6 in the pattern
		for (y = 0; y < height; y += 1) {
			// get the rows
			multiStateRow = pattern.multiStateMap[y];
			maskRow0 = this.state6Mask[(y - 1 + panY) & hm];
			maskRow1 = this.state6Mask[(y + panY) & hm];
			maskRow2 = this.state6Mask[(y + 1 + panY) & hm];
			cellsRow = this.state6Cells[(y + panY) & hm];
			tileRow0 = tileGrid[((y - 1 + panY) & hm) >> tilePower];
			tileRow1 = tileGrid[((y + panY) & hm) >> tilePower];
			tileRow2 = tileGrid[((y + 1 + panY) & hm) >> tilePower];

			// check row
			for (x = 0; x < width; x += 1) {
				// check for state 6
				if (multiStateRow[x] === 6) {
					// set the cell position itself
					offset = (x + panX) & wm;
					cellsRow[offset >> 4] |= (1 << (~offset & 15));

					// set the cells around the state 6 cell in the mask
					maskRow0[offset >> 4] |= (1 << (~offset & 15));
					maskRow1[offset >> 4] |= (1 << (~offset & 15));
					maskRow2[offset >> 4] |= (1 << (~offset & 15));
					tileRow0[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow1[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow2[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					offset = (x - 1 + panX) & wm;
					maskRow0[offset >> 4] |= (1 << (~offset & 15));
					maskRow1[offset >> 4] |= (1 << (~offset & 15));
					maskRow2[offset >> 4] |= (1 << (~offset & 15));
					tileRow0[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow1[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow2[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					offset = (x + 1 + panX) & wm;
					maskRow0[offset >> 4] |= (1 << (~offset & 15));
					maskRow1[offset >> 4] |= (1 << (~offset & 15));
					maskRow2[offset >> 4] |= (1 << (~offset & 15));
					tileRow0[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow1[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
					tileRow2[(offset >> (tilePower + tilePower))] |= 1 << (~(offset >> tilePower) & 15);
				}
			}
		}
	};

	// set the colour grid from the grid
	Life.prototype.resetColourGridBox = function(grid) {
		var x = 0, y = 0, cr = 0,
		    colourGrid = this.colourGrid,
		    colourReset = this.colourReset,
		    gridRow, colourRow, rowOffset = 0,

		    // get the grid bounding box
		    zoomBox = this.zoomBox,
		    leftX = zoomBox.leftX >> 4,
		    rightX = zoomBox.rightX >> 4,
		    topY = zoomBox.topY,
			bottomY = zoomBox.bottomY;

		// ignore for PCA rules
		if (!(this.isPCA || this.isRuleTree)) {
			// set the colour grid from the grid
			for (y = bottomY; y <= topY; y += 1) {
				gridRow = grid[y];
				colourRow = colourGrid[y];
				cr = (leftX << 4);
				for (x = leftX; x <= rightX; x += 1) {
					// get first 8 bits
					rowOffset = (gridRow[x] >> 8) << 3;
					colourRow[cr] = colourReset[rowOffset];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 1];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 2];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 3];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 4];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 5];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 6];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 7];
					cr += 1;
					// get second 8 bits
					rowOffset = (gridRow[x] & 255) << 3;
					colourRow[cr] = colourReset[rowOffset];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 1];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 2];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 3];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 4];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 5];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 6];
					cr += 1;
					colourRow[cr] = colourReset[rowOffset + 7];
					cr += 1;
				}
			}
		}
	};

	// create 7x7 glider
	Life.prototype.create7x7Glider = function(glider3x3) {
		var result = [],
			row = null,
			i = 0,
			j = 0;

		// create the empty 7x7 matrix
		for (j = 0; j < 7; j += 1) {
			row = [];
			for (i = 0; i < 7; i += 1) {
				row[i] = 0;
			}
			result[j] = row;
		}

		// fill the middle 3x3 from the glider
		for (j = 0; j < 3; j += 1) {
			for (i = 0; i < 3; i += 1) {
				result[j + 2][i + 2] = glider3x3[j][i];
			}
		}

		return result;
	};

	// create 7x7 gliders for glider detection and removal
	Life.prototype.create7x7Gliders = function() {
		this.gliderNW7x7 = this.create7x7Glider(LifeConstants.gliderNW);
		this.gliderNE7x7 = this.create7x7Glider(LifeConstants.gliderNE);
		this.gliderSW7x7 = this.create7x7Glider(LifeConstants.gliderSW);
		this.gliderSE7x7 = this.create7x7Glider(LifeConstants.gliderSE);
	};

	// initialise life engine
	Life.prototype.initEngine = function(context, displayWidth, displayHeight) {
		var unoccupied = this.unoccupied,
		    blankRow = this.blankRow,
		    blankColourRow = this.blankColourRow,
		    blankPixelRow = this.blankPixelRow,
		    blankTileRow = this.blankTileRow,
		    pixelColour = 0;

		// set the black pixel colour
		if (this.littleEndian) {
			pixelColour = 0xff000000;
		} else {
			pixelColour = 0x000000ff;
		}

		// disable overlay
		this.drawOverlay = false;

		// create the grid width and height masks
		this.widthMask = this.width - 1;
		this.heightMask = this.height - 1;

		// initialise the bounding boxes
		this.zoomBox = new BoundingBox(0, 0, this.width - 1, this.height - 1);

		// initial bounding box for HROT alive cells
		this.HROTBox = new BoundingBox(0, 0, this.width - 1, this.height - 1);
	
		// initial bounding box for LifeHistory
		this.initialBox = new BoundingBox(0, 0, this.width - 1, this.height - 1);

		// bounding box for history autofit
		this.historyBox = new BoundingBox(0, 0, this.width - 1, this.height - 1);

		// bounding box for track box
		this.trackBox = new BoundingBox(0, 0, this.width - 1, this.height - 1);

		// save drawing context
		this.context = context;

		// initialise colour reset
		this.initColourReset();

		// resize display
		this.resizeDisplay(displayWidth, displayHeight);

		// create the blank rows
		blankRow.fill(0);
		blankColourRow.fill(unoccupied);
		blankTileRow.fill(0);
		blankPixelRow.fill(pixelColour);

		// create the 7x7 gliders
		this.create7x7Gliders();
	};

	// create the colour themes
	Life.prototype.createColourThemes = function() {
		var i = 0;

		// parameter order is:  deadRamp, dead, alive, aliveRamp, unoccupied
		//						alive, dyingRamp, dying, deadRamp, dead, unoccupied

		// monochrome
		this.themes[i] = new Theme("Mono", new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new Colour(0, 0, 0),
									new Colour(255, 255, 255), new ColourRange(new Colour(0, 0, 0), new Colour(-1, -1, -1)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(0, 0, 0));
		i += 1;

		// black to dark blue, cyan to white
		this.themes[i] = new Theme("Blues", new ColourRange(new Colour(0, 0, 47), new Colour(0, 0, 255)), new ColourRange(new Colour(0, 255, 255), new Colour(255, 255, 255)), new Colour(0, 0, 0),
									new Colour(0, 255, 255), new ColourRange(new Colour(0, 0, 255), new Colour(-1, -1, -1)), new ColourRange(new Colour(0, 0, 47), new Colour(0, 0, 128)), new Colour(0, 0, 0));
		i += 1;

		// black to red, orange to yellow
		this.themes[i] = new Theme("Fire", new ColourRange(new Colour(32, 0, 0), new Colour(160, 0, 0)), new ColourRange(new Colour(255, 144, 0), new Colour(255, 255, 0)), new Colour(0, 0, 0),
									new Colour(255, 144, 0), new ColourRange(new Colour(240, 0, 0), new Colour(-1, -1, -1)), new ColourRange(new Colour(32, 0, 0), new Colour(160, 0, 0)), new Colour(0, 0, 0));
		i += 1;

		// black to green, cyan to white
		this.themes[i] = new Theme("Poison", new ColourRange(new Colour(0, 24, 0), new Colour(0, 128, 0)), new ColourRange(new Colour(0, 255, 255), new Colour(255, 255, 255)), new Colour(0, 0, 0),
									new Colour(0, 255, 255), new ColourRange(new Colour(0, 192, 0), new Colour(-1, -1, -1)), new ColourRange(new Colour(0, 24, 0), new Colour(0, 128, 0)), new Colour(0, 0, 0));
		i += 1;

		// black to purple, yellow to white
		this.themes[i] = new Theme("Yellow", new ColourRange(new Colour(0, 47, 0), new Colour(128, 0, 128)), new ColourRange(new Colour(255, 255, 0), new Colour(255, 255, 255)), new Colour(0, 32, 128),
									new Colour(255, 255, 0), new ColourRange(new Colour(192, 64, 64), new Colour(-1, -1, -1)), new ColourRange(new Colour(0, 47, 0), new Colour(128, 0, 128)), new Colour(0, 32, 128));
		i += 1;

		// grey scale
		this.themes[i] = new Theme("Gray", new ColourRange(new Colour(16, 16, 16), new Colour(104, 104, 104)), new ColourRange(new Colour(176, 176, 176), new Colour(240, 240, 240)), new Colour(0, 0, 0),
									new Colour(240, 240, 240), new ColourRange(new Colour(160, 160, 160), new Colour(-1, -1, -1)), new ColourRange(new Colour(16, 16, 16), new Colour(104, 104, 104)), new Colour(0, 0, 0));
		i += 1;

		// inverse monochrome
		this.themes[i] = new Theme("Inverse", new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(255, 255, 255),
									new Colour(0, 0, 0), new ColourRange(new Colour(255, 255, 255), new Colour(-1, -1, -1)), new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new Colour(255, 255, 255));
		i += 1;

		// white to cyan, blue to black
		this.themes[i] = new Theme("Day", new ColourRange(new Colour(240, 240, 240), new Colour(0, 255, 255)), new ColourRange(new Colour(0, 0, 255), new Colour(0, 0, 0)), new Colour(255, 255, 255),
									new Colour(0, 0, 255), new ColourRange(new Colour(0, 255, 255), new Colour(-1, -1, -1)), new ColourRange(new Colour(240, 240, 240), new Colour(0, 192, 192)), new Colour(255, 255, 255));
		i += 1;

		// occupied vs unoccupied
		this.themes[i] = new Theme("Occupied", new ColourRange(new Colour(240, 240, 240), new Colour(240, 240, 240)), new ColourRange(new Colour(240, 240, 240), new Colour(240, 240, 240)), new Colour(0, 0, 0),
									new Colour(240, 240, 240), new ColourRange(new Colour(240, 240, 240), new Colour(240, 240, 240)), new ColourRange(new Colour(240, 240, 240), new Colour(240, 240, 240)), new Colour(0, 0, 0));
		i += 1;

		// unoccupied, dead and alive only
		this.themes[i] = new Theme("Red", new ColourRange(new Colour(160, 0, 0), new Colour(160, 0, 0)), new ColourRange(new Colour(240, 240, 240), new Colour(240, 240, 240)), new Colour(0, 0, 0),
									new Colour(255, 255, 255), new ColourRange(new Colour(160, 160, 160), new Colour(160, 160, 160)), new ColourRange(new Colour(160, 0, 0), new Colour(160, 0, 0)), new Colour(0, 0, 0));
		i += 1;

		// LifeHistory
		this.themes[i] = new Theme("LifeHistory", new ColourRange(new Colour(0, 0, 96), new Colour(0, 0, 160)), new ColourRange(new Colour(0, 240, 0), new Colour(16, 255, 16)), new Colour(0, 0, 0),
									new Colour(16, 255, 16), new ColourRange(new Colour(0, 128, 160), new Colour(-1, -1, -1)), new ColourRange(new Colour(0, 0, 96), new Colour(0, 0, 160)), new Colour(0, 0, 0));
		i += 1;

		// Multi-state (Generations and HROT) - yellow to red
		this.themes[i] = new Theme("Generations", new ColourRange(new Colour(64, 0, 0), new Colour(255, 0, 0)), new ColourRange(new Colour(255, 255, 0), new Colour(255, 255, 255)), new Colour(0, 0, 0),
									new Colour(255, 255, 0), new ColourRange(new Colour(255, 0, 0), new Colour(-1, -1, -1)), new ColourRange(new Colour(64, 0, 0), new Colour(128, 0, 0)), new Colour(0, 0, 0));
		i += 1;

		// Golly theme
		this.themes[i] = new Theme("Golly", new ColourRange(new Colour(48, 48, 48), new Colour(48, 48, 48)), new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new Colour(48, 48, 48),
									new Colour(255, 255, 0), new ColourRange(new Colour(255, 0, 0), new Colour(-1, -1, -1)), new ColourRange(new Colour(48, 48, 48), new Colour(48, 48, 48)), new Colour(48, 48, 48));
		this.themes[i].setGridLines(10, new Colour(80, 80, 80), new Colour(112, 112, 112));
		i += 1;

		// MCell theme
		this.themes[i] = new Theme("MCell", new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new ColourRange(new Colour(255, 255, 0), new Colour(255, 255, 0)), new Colour(0, 0, 0),
									new Colour(255, 255, 0), new ColourRange(new Colour(0, 255, 0), new Colour(255, 255, 0)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(0, 0, 0));
		this.themes[i].setGridLines(5, new Colour(64, 0, 0), new Colour(99, 3, 1));
		i += 1;

		// Catagolue theme
		this.themes[i] = new Theme("Catagolue", new ColourRange(new Colour(160, 221, 204), new Colour(160, 221, 204)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(192, 255, 238),
									new Colour(0, 0, 0), new ColourRange(new Colour(96, 192, 139), new Colour(2, 129, 2)), new ColourRange(new Colour(160, 221, 204), new Colour(160, 221, 204)), new Colour(192, 255, 238));
		this.themes[i].setGridLines(0, new Colour(160, 221, 204), new Colour(160, 221, 204));
		i += 1;

		// Caterer theme
		this.themes[i] = new Theme("Caterer", new ColourRange(new Colour(54, 57, 62), new Colour(54, 57, 62)), new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new Colour(54, 57, 62),
									new Colour(255, 170, 0), new ColourRange(new Colour(255, 85, 0), new Colour(-1, -1, -1)), new ColourRange(new Colour(54, 57, 62), new Colour(54, 57, 62)), new Colour(54, 57, 62));
		this.themes[i].setGridLines(0, new Colour(0, 0, 0), new Colour(0, 0, 0));
		i += 1;

		// Life32 theme
		this.themes[i] = new Theme("Life32", new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new ColourRange(new Colour(0, 0, 128), new Colour(0, 0, 128)), new Colour(255, 255, 255),
									new Colour(0, 0, 128), new ColourRange(new Colour(0, 0, 64), new Colour(-1, -1, -1)), new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new Colour(255, 255, 255));
		this.themes[i].setGridLines(5, new Colour(192, 192, 192), new Colour(128, 128, 128));
		i += 1;

		// Margolus theme
		this.themes[i] = new Theme("Margolus", new ColourRange(new Colour(0, 0, 47), new Colour(0, 0, 128)), new ColourRange(new Colour(255, 255, 0), new Colour(255, 255, 255)), new Colour(0, 0, 0),
									new Colour(255, 255, 0), new ColourRange(new Colour(64, 64, 128), new Colour(-1, -1, -1)), new ColourRange(new Colour(0, 0, 47), new Colour(0, 0, 128)), new Colour(0, 0, 0));
		this.themes[i].setGridLines(2, new Colour(32, 32, 255), new Colour(64, 64, 128));
		i += 1;

		// PCA theme
		this.themes[i] = new Theme("PCA", new ColourRange(new Colour(24, 24, 24), new Colour(64, 64, 64)), new ColourRange(new Colour(176, 176, 176), new Colour(240, 240, 240)), new Colour(0, 0, 0),
									new Colour(240, 240, 240), new ColourRange(new Colour(160, 160, 160), new Colour(-1, -1, -1)), new ColourRange(new Colour(24, 24, 24), new Colour(64, 64, 64)), new Colour(0, 0, 0));
		i += 1;

		// custom theme
		this.themes[i] = new Theme(Keywords.themeCustomWord, new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(0, 0, 0),
									new Colour(0, 0, 0), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(0, 0, 0));
		i += 1;

		// save number of themes less one (for the custom theme)
		this.numThemes = this.themes.length - 1;

		// set current colour theme
		// 2-state
		this.aliveColCurrent = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.deadColCurrent = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.unoccupiedCurrent = new Colour(0, 0, 0);
		// multi-state
		this.aliveGenColCurrent = new Colour(0, 0, 0);
		this.dyingGenColCurrent = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.deadGenColCurrent = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.unoccupiedGenCurrent = new Colour(0, 0, 0);

		// set target colour theme
		// 2-state
		this.aliveColTarget = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.deadColTarget = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.unoccupiedTarget = new Colour(0, 0, 0);
		// multi-state
		this.aliveGenColTarget = new Colour(0, 0, 0);
		this.dyingGenColTarget = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.deadGenColTarget = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.unoccupiedGenTarget = new Colour(0, 0, 0);
	};

	// set the theme
	Life.prototype.setTheme = function(theme, switchTime, view) {
		var newTheme = this.themes[theme],
			currentHistory = this.themeHistory;

		// save the theme
		this.colourTheme = theme;

		// set current point to the target
		this.aliveColCurrent.set(this.aliveColTarget);
		this.deadColCurrent.set(this.deadColTarget);
		this.unoccupiedCurrent.set(this.unoccupiedTarget);
		this.aliveGenColCurrent.set(this.aliveGenColTarget);
		this.deadGenColCurrent.set(this.deadGenColTarget);
		this.dyingGenColCurrent.set(this.dyingGenColTarget);
		this.unoccupiedGenCurrent.set(this.unoccupiedGenTarget);

		// set the colour target to the theme
		this.aliveColTarget.set(newTheme.aliveRange);
		this.deadColTarget.set(newTheme.deadRange);
		this.unoccupiedTarget.set(newTheme.unoccupied);
		this.aliveGenColTarget.set(newTheme.aliveGen);
		this.deadGenColTarget.set(newTheme.deadRangeGen);
		this.dyingGenColTarget.set(newTheme.dyingRangeGen);
		this.unoccupiedGenTarget.set(newTheme.unoccupiedGen);

		// set the change time
		this.colourChange = switchTime;
		
		// check whether new theme has history
		this.themeHistory = newTheme.hasHistory(this.isLifeHistory);
		
		// check if history was just switched off
		if (currentHistory && !this.themeHistory && !this.isHROT && this.multiNumStates <= 2) {
			this.clearHistoryCells();
		}

		// copy grid line colours from theme
		this.gridLineRaw  = newTheme.gridColour;
		this.gridLineBoldRaw = newTheme.gridMajorColour;

		// if the Theme is not custom and the pattern is Margolus then set grid major to 2
		if (theme !== this.numThemes && this.isMargolus) {
			this.gridLineMajor = 2;
		} else {
			// copy grid line major interval from theme
			this.gridLineMajor = newTheme.gridMajor;
		}

		// create grid line colours
		if (this.littleEndian) {
			this.gridLineColour = (255 << 24) | ((this.gridLineRaw & 255) << 16) | (((this.gridLineRaw >> 8) & 255) << 8) | (this.gridLineRaw >> 16);
			this.gridLineBoldColour = (255 << 24) | ((this.gridLineBoldRaw & 255) << 16) | (((this.gridLineBoldRaw >> 8) & 255) << 8) | (this.gridLineBoldRaw >> 16);
		} else {
			this.gridLineColour = ((this.gridLineRaw >> 16) << 24) | (((this.gridLineRaw >> 8) & 255) << 16) | ((this.gridLineRaw & 255) << 8) | 255;
			this.gridLineBoldColour = ((this.gridLineBoldRaw >> 16) << 24) | (((this.gridLineBoldRaw >> 8) & 255) << 16) | ((this.gridLineBoldRaw & 255) << 8) | 255;
		}

		// clear help cache
		view.clearHelpCache();
	};

	// create the colour index
	Life.prototype.createColourIndex = function() {
		var colourLookup = this.colourLookup,
			aliveMax = this.aliveMax,
			aliveStart = this.aliveStart,
			deadMin = this.deadMin,
			deadStart = this.deadStart,
			i = 0,
			byteIndex = new Uint8Array(256);

		// create byte lookup
		// first pixel 
		byteIndex[0] = 0;
		byteIndex[aliveMax + 1] = aliveStart;

		for (i = 1; i < aliveMax + 1; i += 1) {
			byteIndex[i] = Math.min(Math.max(i - 1, deadMin), deadStart);
			byteIndex[i + aliveMax + 1] = Math.max(Math.min(i + 1, aliveMax), aliveStart);
		}

		// adjust for history states setting
		if (this.historyStates === 0) {
			for (i = this.aliveStart; i <= this.aliveMax; i += 1) {
				byteIndex[i] = 0;
			}
		} else {
			if (this.historyStates < this.deadStart) {
				byteIndex[this.deadStart - this.historyStates] = 0;
			}
		}

		// use byte lookup to create 16bit lookup
		for (i = 0; i < 65536; i += 1) {
			colourLookup[i] = (byteIndex[i >> 8] << 8) | byteIndex[i & 255];
		}
	};

	// process multi-state themes
	Life.prototype.processMultiStateThemes = function() {
		var i = 0,
		theme = null,
		weight = 1;

		// check for dynamic dying state in each theme
		for (i = 0; i < this.themes.length; i += 1) {
			theme = this.themes[i];
			// check if the dying colour was marked as dynamic
			if (theme.dyingRangeDynamic) {
				if (this.multiNumStates <= 2) {
					theme.dyingRangeGen.endColour.set(theme.aliveGen);
				} else {
					// convert it from the alive colour and number of states
					weight = 1 / (this.multiNumStates - 2);
					theme.dyingRangeGen.endColour.red = (theme.dyingRangeGen.startColour.red * weight + theme.aliveGen.red * (1 - weight)) | 0;
					theme.dyingRangeGen.endColour.green = (theme.dyingRangeGen.startColour.green * weight + theme.aliveGen.green * (1 - weight)) | 0;
					theme.dyingRangeGen.endColour.blue = (theme.dyingRangeGen.startColour.blue * weight + theme.aliveGen.blue * (1 - weight)) | 0;
				}
			}
		}
	};

	// create the colours
	Life.prototype.createColours = function() {
		var i, mixWeight, weight, currentComponent, targetComponent, current, deadMin;

		// set the weighting between the two colour ranges
		mixWeight = (this.colourChange - 1) / this.colourChangeSteps;

		// do nothing for "none" rule since colours are fixed
		if (!this.isNone) {
			// check for Generations, HROT or PCA rules
			if (this.multiNumStates > 2 || this.isRuleTree) {
				// set unoccupied colour
				i = 0;
				if (this.isRuleTree) {
					this.redChannel[i] = this.ruleTreeColours[i] >> 16;
					this.greenChannel[i] = (this.ruleTreeColours[i] >> 8) & 255;
					this.blueChannel[i] = this.ruleTreeColours[i] & 255;
				} else {
					this.redChannel[i] = this.unoccupiedGenCurrent.red * mixWeight + this.unoccupiedGenTarget.red * (1 - mixWeight);
					this.greenChannel[i] = this.unoccupiedGenCurrent.green * mixWeight + this.unoccupiedGenTarget.green * (1 - mixWeight);
					this.blueChannel[i] = this.unoccupiedGenCurrent.blue * mixWeight + this.unoccupiedGenTarget.blue * (1 - mixWeight);
				}

				// set generations or PCA colours
				for (i = 1; i < this.multiNumStates - 1; i += 1) {
					// compute the weighting between the start and end colours in the range
					if (this.multiNumStates <= 3) {
						weight = 0;
					} else {
						weight = (i - 1) / (this.multiNumStates - 3);
					}

					// check for PCA (theme is PCA or Custom)  TBD hard coded theme number!
					if (this.isPCA && this.colourTheme >= 18) {
						this.redChannel[i + this.historyStates] = LifeConstants.coloursPCA[i][0];
						this.greenChannel[i + this.historyStates] = LifeConstants.coloursPCA[i][1];
						this.blueChannel[i + this.historyStates] = LifeConstants.coloursPCA[i][2];
					} else {
						if (this.isRuleTree) {
							this.redChannel[i] = this.ruleTreeColours[i] >> 16;
							this.greenChannel[i] = (this.ruleTreeColours[i] >> 8) & 255;
							this.blueChannel[i] = this.ruleTreeColours[i] & 255;
						} else {
							// compute the red component of the current and target colour
							currentComponent = this.dyingGenColCurrent.endColour.red * weight + this.dyingGenColCurrent.startColour.red * (1 - weight);
							targetComponent = this.dyingGenColTarget.endColour.red * weight + this.dyingGenColTarget.startColour.red * (1 - weight);
							this.redChannel[i + this.historyStates] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
		
							// compute the green component of the current and target colour
							currentComponent = this.dyingGenColCurrent.endColour.green * weight + this.dyingGenColCurrent.startColour.green * (1 - weight);
							targetComponent = this.dyingGenColTarget.endColour.green * weight + this.dyingGenColTarget.startColour.green * (1 - weight);
							this.greenChannel[i + this.historyStates] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
		
							// compute the blue component of the current and target colour
							currentComponent = this.dyingGenColCurrent.endColour.blue * weight + this.dyingGenColCurrent.startColour.blue * (1 - weight);
							targetComponent = this.dyingGenColTarget.endColour.blue * weight + this.dyingGenColTarget.startColour.blue * (1 - weight);
							this.blueChannel[i + this.historyStates] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
		
							// override with custom colour if specified
							if (this.customColours && this.customColours.length >= i) {
								if (!(this.isHROT || this.isPCA || this.isRuleTree)) {
									current = this.customColours[this.multiNumStates - i];
								} else {
									current = this.customColours[i];
								}
								if (current !== -1) {
									this.redChannel[i + this.historyStates] = current >> 16;
									this.greenChannel[i + this.historyStates] = (current >> 8) & 255; 
									this.blueChannel[i + this.historyStates] = (current & 255);
								}
							}
						}
					}
				}

				// set alive colour
				i = this.multiNumStates - 1;
				if (this.isRuleTree) {
					this.redChannel[i] = this.ruleTreeColours[i] >> 16;
					this.greenChannel[i] = (this.ruleTreeColours[i] >> 8) & 255;
					this.blueChannel[i] = this.ruleTreeColours[i] & 255;
				} else {
					this.redChannel[i + this.historyStates] = this.aliveGenColCurrent.red * mixWeight + this.aliveGenColTarget.red * (1 - mixWeight);
					this.greenChannel[i + this.historyStates] = this.aliveGenColCurrent.green * mixWeight + this.aliveGenColTarget.green * (1 - mixWeight);
					this.blueChannel[i + this.historyStates] = this.aliveGenColCurrent.blue * mixWeight + this.aliveGenColTarget.blue * (1 - mixWeight);
				}

				// override with custom colour if specified
				if (this.customColours && this.customColours.length >= i) {
					if (!this.isHROT) {
						current = this.customColours[this.multiNumStates - i];
					} else {
						current = this.customColours[i];
					}
					if (current !== -1) {
						this.redChannel[i + this.historyStates] = current >> 16;
						this.greenChannel[i + this.historyStates] = (current >> 8) & 255; 
						this.blueChannel[i + this.historyStates] = (current & 255);
					}
				}

				// create history colours if specified
				for (i = 0; i < this.historyStates; i += 1) {
					if (this.historyStates > 1) {
						weight = 1 - (i / (this.historyStates - 1));
					} else {
						weight = 1;
					}
					// compute the red component of the current and target colour
					currentComponent = this.deadGenColCurrent.startColour.red * weight + this.deadGenColCurrent.endColour.red * (1 - weight);
					targetComponent = this.deadGenColTarget.startColour.red * weight + this.deadGenColTarget.endColour.red * (1 - weight);
					this.redChannel[i + 1] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

					// compute the green component of the current and target colour
					currentComponent = this.deadGenColCurrent.startColour.green * weight + this.deadGenColCurrent.endColour.green * (1 - weight);
					targetComponent = this.deadGenColTarget.startColour.green * weight + this.deadGenColTarget.endColour.green * (1 - weight);
					this.greenChannel[i + 1] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

					// compute the blue component of the current and target colour
					currentComponent = this.deadGenColCurrent.startColour.blue * weight + this.deadGenColCurrent.endColour.blue * (1 - weight);
					targetComponent = this.deadGenColTarget.startColour.blue * weight + this.deadGenColTarget.endColour.blue * (1 - weight);
					this.blueChannel[i + 1] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
				}

				// override colour 0 if specified
				if (this.customColours && this.customColours.length > 0) {
					current = this.customColours[0];
					if (current !== -1) {
						this.redChannel[0] = current >> 16;
						this.greenChannel[0] = (current >> 8) & 255; 
						this.blueChannel[0] = (current & 255);
					}
				}
			} else {
				// set unoccupied colour
				i = 0;
				this.redChannel[i] = this.unoccupiedCurrent.red * mixWeight + this.unoccupiedTarget.red * (1 - mixWeight);
				this.greenChannel[i] = this.unoccupiedCurrent.green * mixWeight + this.unoccupiedTarget.green * (1 - mixWeight);
				this.blueChannel[i] = this.unoccupiedCurrent.blue * mixWeight + this.unoccupiedTarget.blue * (1 - mixWeight);

				// set dead colours and start by clearing unused history colours
				if (this.historyStates === 0) {
					for (i = 1; i <= this.deadStart; i += 1) {
						this.redChannel[i] = this.unoccupiedCurrent.red * mixWeight + this.unoccupiedTarget.red * (1 - mixWeight);
						this.greenChannel[i] = this.unoccupiedCurrent.green * mixWeight + this.unoccupiedTarget.green * (1 - mixWeight);
						this.blueChannel[i] = this.unoccupiedCurrent.blue * mixWeight + this.unoccupiedTarget.blue * (1 - mixWeight);
					}
				} else {
					deadMin = this.deadStart - this.historyStates + 1;
					for (i = 1; i < deadMin; i += 1) {
						this.redChannel[i] = this.deadColCurrent.startColour.red * mixWeight + this.deadColTarget.startColour.red * (1 - mixWeight);
						this.greenChannel[i] = this.deadColCurrent.startColour.green * mixWeight + this.deadColTarget.startColour.green * (1 - mixWeight);
						this.blueChannel[i] = this.deadColCurrent.startColour.blue * mixWeight + this.deadColTarget.startColour.blue * (1 - mixWeight);
					}
					for (i = deadMin; i <= this.deadStart; i += 1) {
						// compute the weighting between the start and end colours in the range
						if (this.deadStart === deadMin) {
							weight = 1;
						} else {
							weight = 1 - ((i - deadMin) / (this.deadStart - deadMin));
						}
		
						// compute the red component of the current and target colour
						currentComponent = this.deadColCurrent.startColour.red * weight + this.deadColCurrent.endColour.red * (1 - weight);
						targetComponent = this.deadColTarget.startColour.red * weight + this.deadColTarget.endColour.red * (1 - weight);
						this.redChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
		
						// compute the green component of the current and target colour
						currentComponent = this.deadColCurrent.startColour.green * weight + this.deadColCurrent.endColour.green * (1 - weight);
						targetComponent = this.deadColTarget.startColour.green * weight + this.deadColTarget.endColour.green * (1 - weight);
						this.greenChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
		
						// compute the blue component of the current and target colour
						currentComponent = this.deadColCurrent.startColour.blue * weight + this.deadColCurrent.endColour.blue * (1 - weight);
						targetComponent = this.deadColTarget.startColour.blue * weight + this.deadColTarget.endColour.blue * (1 - weight);
						this.blueChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
					}
				}

				// set alive colours
				for (i = this.aliveStart; i <= this.aliveMax; i += 1) {
					// compute the weighting between the start and end colours in the range
					weight = 1 - ((i - this.aliveStart) / (this.aliveMax - this.aliveStart));

					// compute the red component of the current and target colour
					currentComponent = this.aliveColCurrent.startColour.red * weight + this.aliveColCurrent.endColour.red * (1 - weight);
					targetComponent = this.aliveColTarget.startColour.red * weight + this.aliveColTarget.endColour.red * (1 - weight);
					this.redChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

					// compute the green component of the current and target colour
					currentComponent = this.aliveColCurrent.startColour.green * weight + this.aliveColCurrent.endColour.green * (1 - weight);
					targetComponent = this.aliveColTarget.startColour.green * weight + this.aliveColTarget.endColour.green * (1 - weight);
					this.greenChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

					// compute the blue component of the current and target colour
					currentComponent = this.aliveColCurrent.startColour.blue * weight + this.aliveColCurrent.endColour.blue * (1 - weight);
					targetComponent = this.aliveColTarget.startColour.blue * weight + this.aliveColTarget.endColour.blue * (1 - weight);
					this.blueChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
					}
			}
		}
	};

	// create multi-state pixel colours
	Life.prototype.createMultiStateColours = function(colourList, customColours) {
		var redChannel = this.redChannel,
		greenChannel = this.greenChannel,
		blueChannel = this.blueChannel,
		i = 0,
		stateColour = 0;

		// create multi-state pixel colours
		for (i = 0; i < colourList.length; i += 1) {
			// check if a custom colour is defined
			if (customColours && customColours[i] !== -1) {
				// use the custom colour
				stateColour = customColours[i];
			} else {
				// use the library colour
				stateColour = colourList[i];
			}
			redChannel[i] = stateColour >> 16;
			greenChannel[i] = (stateColour >> 8) & 255;
			blueChannel[i] = stateColour & 255;
		}

		// clear colour change flag
		this.colourChange = 0;
	};

	// create LifeHistory overlay colours
	Life.prototype.createLHOverlayColours = function(colourList, customColours) {
		var redChannel = this.redChannel,
		    greenChannel = this.greenChannel,
		    blueChannel = this.blueChannel,

		    // look up the [R]History state translation map
		    stateMap = ViewConstants.stateMap,
		    i = 0;

		// create default colours
		for (i = 0; i < colourList.length; i += 1) {
			// check if a custom colour is defined
			if (customColours && customColours[i] !== -1) {
				// use the custom colour
				redChannel[128 + stateMap[i]] = customColours[i] >> 16;
				greenChannel[128 + stateMap[i]] = (customColours[i] >> 8) & 255;
				blueChannel[128 + stateMap[i]] = customColours[i] & 255;
			} else {
				// use the library colour
				redChannel[128 + stateMap[i]] = colourList[i] >> 16;
				greenChannel[128 + stateMap[i]] = (colourList[i] >> 8) & 255;
				blueChannel[128 + stateMap[i]] = colourList[i] & 255;
			}
		}
	};

	// create pixel colours
	Life.prototype.createPixelColours = function(brightness) {
		var redChannel = this.redChannel,
		greenChannel = this.greenChannel,
		blueChannel = this.blueChannel,
		pixelColours = this.pixelColours,
		gridLineRaw = this.gridLineRaw,
		gridLineBoldRaw = this.gridLineBoldRaw,
		colourStrings = this.cellColourStrings,
		needStrings = (this.isHex && this.useHexagons) || this.isTriangular,
		i = 0;

		// check for Generations or HROT
		if (this.multiNumStates > 2) {
			// create state colours
			if (this.littleEndian) {
				for (i = 0; i <= this.multiNumStates + this.historyStates; i += 1) {
					pixelColours[i] = (255 << 24) | ((blueChannel[i] * brightness) << 16) | ((greenChannel[i] * brightness) << 8) | (redChannel[i] * brightness);
					if (needStrings) {
						colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
					}
				}
			} else {
				for (i = 0; i <= this.multiNumStates + this.historyStates; i += 1) {
					pixelColours[i] = ((redChannel[i] * brightness) << 24) | ((greenChannel[i] * brightness) << 16) | ((blueChannel[i] * brightness) << 8) | 255;
					if (needStrings) {
						colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
					}
				}
			}
		} else {
			// create pixels from rgb and brightness
			if (this.littleEndian) {
				// create dead colours
				for (i = 0; i < this.aliveStart; i += 1) {
					pixelColours[i] = (255 << 24) | (blueChannel[i] << 16) | (greenChannel[i] << 8) | redChannel[i];
					if (needStrings) {
						colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
					}
				}

				// create alive colours
				for (i = this.aliveStart; i <= this.aliveMax; i += 1) {
					pixelColours[i] = (255 << 24) | ((blueChannel[i] * brightness) << 16) | ((greenChannel[i] * brightness) << 8) | (redChannel[i] * brightness);
					if (needStrings) {
						colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
					}
				}

				// create remaining multi-state colours
				for (i = this.aliveMax + 1; i < 256; i += 1) {
					pixelColours[i] = (255 << 24) | ((blueChannel[i] * brightness) << 16) | ((greenChannel[i] * brightness) << 8) | (redChannel[i] * brightness);
					if (needStrings) {
						colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
					}
				}
			} else {
				// create dead colours
				for (i = 0; i < this.aliveStart; i += 1) {
					pixelColours[i] = (redChannel[i] << 24) | (greenChannel[i] << 16) | (blueChannel[i] << 8) | 255;
					if (needStrings) {
						colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
					}
				}

				// create alive colours
				for (i = this.aliveStart; i <= this.aliveMax; i += 1) {
					pixelColours[i] = ((redChannel[i] * brightness) << 24) | ((greenChannel[i] * brightness) << 16) | ((blueChannel[i] * brightness) << 8) | 255;
					if (needStrings) {
						colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
					}
				}

				// create remaining multi-state colours
				for (i = this.aliveMax + 1; i < 256; i += 1) {
					pixelColours[i] = ((redChannel[i] * brightness) << 24) | ((greenChannel[i] * brightness) << 16) | ((blueChannel[i] * brightness) << 8) | 255;
					if (needStrings) {
						colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
					}
				}
			}
		}

		// create grid line colours
		if (this.littleEndian) {
			this.gridLineColour = (255 << 24) | ((gridLineRaw & 255) << 16) | (((gridLineRaw >> 8) & 255) << 8) | (gridLineRaw >> 16);
			this.gridLineBoldColour = (255 << 24) | ((gridLineBoldRaw & 255) << 16) | (((gridLineBoldRaw >> 8) & 255) << 8) | (gridLineBoldRaw >> 16);
		} else {
			this.gridLineColour = ((gridLineRaw >> 16) << 24) | (((gridLineRaw >> 8) & 255) << 16) | ((gridLineRaw & 255) << 8) | 255;
			this.gridLineBoldColour = ((gridLineBoldRaw >> 16) << 24) | (((gridLineBoldRaw >> 8) & 255) << 16) | ((gridLineBoldRaw & 255) << 8) | 255;
		}

		// create bounded grid border colour
		if (this.boundedGridType !== -1) {
			i = this.boundedBorderColour;
			if (this.littleEndian) {
				pixelColours[i] = (255 << 24) | ((blueChannel[i] * brightness) << 16) | ((greenChannel[i] * brightness) << 8) | (redChannel[i] * brightness);
			} else {
				pixelColours[i] = ((redChannel[i] * brightness) << 24) | ((greenChannel[i] * brightness) << 16) | ((blueChannel[i] * brightness) << 8) | 255;
			}
			if (needStrings) {
				colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);
			}
		}
	};

	// set the bounded grid border cell
	Life.prototype.setBoundedGridBorderCell = function() {
		var redChannel = this.redChannel,
			greenChannel = this.greenChannel,
			blueChannel = this.blueChannel;

		// check for bounded grid
		if (this.boundedGridType !== -1 && (this.multiNumStates + this.historyStates === 256)) {
			this.boundedBorderColour = 2;
		} else {
			this.boundedBorderColour = 255;
		}

		// create bounded grid border colour if specified
		if (this.boundedGridType !== -1 && (this.multiNumStates + this.historyStates < 256)) {
			redChannel[this.boundedBorderColour] = 0x80;
			greenChannel[this.boundedBorderColour] = 0x80;
			blueChannel[this.boundedBorderColour] = 0x80;
		}
	};

	// clear the life grids (or just the bit grids if specified)
	Life.prototype.clearGrids = function(bitOnly) {
		var grid = this.grid,
			nextGrid = this.nextGrid,
			colourGrid = this.colourGrid,
			nextColourGrid = this.nextColourGrid,
			smallColourGrid = this.smallColourGrid,
			overlayGrid = this.overlayGrid,
			smallOverlayGrid = this.smallOverlayGrid,
			tileGrid = this.tileGrid,
			colourTileGrid = this.colourTileGrid,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			nextTileGrid = this.nextTileGrid,
			unoccupied = this.unoccupied;
	
		// clear each cell
		grid.whole.fill(0);
		nextGrid.whole.fill(0);
		if (!bitOnly) {
			colourGrid.whole.fill(unoccupied);
			if (nextColourGrid) {
				nextColourGrid.whole.fill(unoccupied);
			}
			smallColourGrid.whole.fill(unoccupied);
			if (overlayGrid) {
				overlayGrid.whole.fill(unoccupied);
				smallOverlayGrid.whole.fill(unoccupied);
			}
		}

		// clear the tiles
		tileGrid.whole.fill(0);
		nextTileGrid.whole.fill(0);
		if (!bitOnly) {
			colourTileGrid.whole.fill(0);
			colourTileHistoryGrid.whole.fill(0);
		}
	};

	// create the triangular life index
	Life.prototype.createTriangularIndex = function(indexLookupTriangular, ruleArray) {
		var n = LifeConstants.hashTriangular,  // TBD will be Double when 2-cell lookup implemented
			i = 0;

		// create each hash entry
		for (i = 0; i < n; i += 1) {  // TBD set()?
			indexLookupTriangular[i] = ruleArray[i];
		}
	};

	// create the 6x3 lookup life index from the 3x3 index
	Life.prototype.createLifeIndex63 = function(indexLookup63, indexLookup33) {
		var n = LifeConstants.hash63,
		    i = 0, v = 0;

		// create each hash entry
		for (i = 0; i < n; i += 1) {
			// lookup four bits
			v = indexLookup33[((i >> 9) & 448) | ((i >> 6) & 56) | ((i >> 3) & 7)] << 3;
			v |= indexLookup33[((i >> 8) & 448) | ((i >> 5) & 56) | ((i >> 2) & 7)] << 2;
			v |= indexLookup33[((i >> 7) & 448) | ((i >> 4) & 56) | ((i >> 1) & 7)] << 1;
			v |= indexLookup33[((i >> 6) & 448) | ((i >> 3) & 56) | (i & 7)];

			// write into 6x3 array
			indexLookup63[i] = v;
		}
	};

	// calculate density from the rule map
	Life.prototype.calculateDensity = function(mapArray) {
		var i = 0,
		    result = 0;

		// find each non-zero element in the map
		for (i = 0; i < mapArray.length; i += 1) {
			if (mapArray[i]) {
				result += 1;
			}
		}

		// return density
		return result;
	};
			
	// create PCA index
	Life.prototype.createPCAIndex = function(index, ruleArray, reverse) {
		var i = 0,
			value = 0,
			reverseArray = null;

		// index lookup is 4 x 4bit values for n, e, s, w
		// n3 n2 n1 n0 e3 e2 e1 e0 s3 s2 s1 s0 w3 w2 w1 w0
		// 15 14 13 12 11 10 09 08 07 06 05 04 03 02 01 00
		//           2        3        0       1
		if (reverse) {
			reverseArray = new Uint8Array(16);

			// create the reverse transitions
			for (i = 0; i < 16; i += 1) {
				value = ruleArray[i];
				reverseArray[value] = i;
			}

			// create the lookup index
			for (i = 0; i < LifeConstants.hashPCA; i += 1) {
				value = (reverseArray[i >> 12] & 1) << 2;
				value |= (reverseArray[(i >> 8) & 15] & 2) << 2;
				value |= (reverseArray[(i >> 4) & 15] & 4) >> 2;
				value |= (reverseArray[i & 15] & 8) >> 2;
				index[i] = value;
			}
		} else {
			for (i = 0; i < LifeConstants.hashPCA; i += 1) {
				value = ((i >> 12) & 1) << 2;
				value |= ((i >> 8) & 2) << 2;
				value |= ((i >> 4) & 4) >> 2;
				value |= (i & 8) >> 2;
				index[i] = ruleArray[value];
			}
		}
	};

	// create Margolus index
	Life.prototype.createMargolusIndex = function(index, ruleArray) {
		var i = 0,
			j = 0,
			row0 = 0,
			row1 = 0,
			value = 0,
			mask = 0,
			shift = 0,
			lookup = 0,
			dest0 = 0,
			dest1 = 0;

		// index holds four 2x2 blocks
		// 00 00  01 01  02 02  03 03
		// 00 00  01 01  02 02  03 03
		for (i = 0; i < LifeConstants.hashMargolus; i += 1) {
			row1 = i >> 8;
			row0 = i & 255;
			mask = 192;
			shift = 6;
			dest0 = 0;
			dest1 = 0;
			for (j = 0; j < 4; j += 1) {
				// compute the lookup value
				if (shift === 0) {
					value = ((row0 & mask) << 2) | (row1 & mask);
				} else {
					value = ((row0 & mask) >> (shift - 2)) | ((row1 & mask) >> shift);
				}

				// get the mapping
				value = ((value & 8) >> 1) | ((value & 4) << 1) | ((value & 2) >> 1) | ((value & 1) << 1);
				lookup = ruleArray[value];
				lookup = ((lookup & 8) >> 1) | ((lookup & 4) << 1) | ((lookup & 2) >> 1) | ((lookup & 1) << 1);

				// update the destination rows
				dest0 <<= 2;
				dest1 <<= 2;
				dest0 |= (lookup >> 2) & 3;
				dest1 |= lookup & 3;

				// next 2x2 item
				mask >>= 2;
				shift -= 2;
			}

			// update the index
			index[i] = (dest1 << 8) | dest0;
		}
	};

	// check whether a margolus rule can reverse and if so reverse it
	Life.prototype.canReverse = function(rule, copy) {
		var i = 0,
			states = 0,
			bit = 0,
			value = 0,
			result = true,
			temp = new Uint8Array(16);

		// make sure there are no duplicate transitions
		i = 0;
		while (result && i < 16) {
			bit = 1 << rule[i];
			if ((states & bit) !== 0) {
				result = false;
			} else {
				states |= bit;
				i += 1;
			}
		}

		// check if reversible
		if (result) {
			// reverse rule
			for (i = 0; i < 16; i += 1) {
				value = rule[i];
				temp[value] = i;
			}

			// copy to original rule
			if (copy) {
				rule.set(temp);
			}
		}

		return result;
	};

	// create non-strobing Margolus alternate rules
	Life.prototype.createNonStrobingAlternates = function(ruleArray, ruleAltArray) {
		var i = 0;

		// create two alternate arrays
		for (i = 0; i < 16; i += 1) {
			ruleAltArray[i] = ruleArray[15 - i];
		}

		for (i = 0; i < 16; i += 1) {
			ruleArray[i] = 15 - ruleArray[i];
		}
	};

	// create rule tree lookup
	Life.prototype.createRuleTreeLookup = function() {
		// get number of cells in neighbourhood
		var /** @type {number} */ bitsNeeded = 0,
			/** @type {number} */ states = this.ruleTreeStates,
			/** @type {number} */ i = 0,
			/** @type {number} */ n = 0,
			/** @type {number} */ s = 0,
			/** @type {number} */ e = 0,
			/** @type {number} */ w = 0,
			/** @type {number} */ c = 0,
			/** @type {number} */ ni = 0,
			/** @type {number} */ ei = 0,
			/** @type {number} */ ci = 0,
			/** @type {number} */ wi = 0,
			/** @type {number} */ index = 0,
			/** @type {number} */ base = this.ruleTreeBase,
			/** @type {Array<number>} */ a = this.ruleTreeA,
			/** @type {Array<number>} */ b = this.ruleTreeB;

		// compute how many bits needed for states
		i = 0;
		while ((1 << i) < states) {
			i += 1;
		}

		// compute bits needed as cells in neighbourhood * state bits
		bitsNeeded = (this.ruleTreeNeighbours + 1) * i;

		// check lookup is small enough for lookup table
		if (bitsNeeded <= LifeConstants.maxRuleTreeLookupBits) {
			// build lookup table
			this.ruleTreeLookup = this.allocator.allocate(Uint8, (1 << bitsNeeded), "Life.ruleTreeLookup");

			// create the bit shifts
			this.ruleTreeLookupBits = i;
			ni = i;
			ei = ni + i;
			ci = ei + i;
			wi = ci + i;

			// create the entries
			if (this.ruleTreeNeighbours === 4) {
				for (n = 0; n < states; n += 1) {
					for (e = 0; e < states; e += 1) {
						for (c = 0; c < states; c += 1) {
							for (w = 0; w < states; w += 1) {
								for (s = 0; s < states; s += 1) {
									index = (n << ni) | (e << ei) | (c << ci) | (w << wi) | s;
									this.ruleTreeLookup[index] = b[a[a[a[a[base + n] + w] + e] + s] + c];
								}
							}
						}
					}
				}
			} else {
				// not implemented TBD
				this.ruleTreeLookup = null;
			}
		} else {
			this.ruleTreeLookup = null;
		}
	};

	// update the Life rule
	Life.prototype.updateLifeRule = function(view) {
		var i = 0,
		    tmp = 0,
			ruleArray = (this.isTriangular ? this.manager.ruleTriangularArray : this.manager.ruleArray),
			ruleAltArray = (this.isTriangular ? this.manager.ruleAltTriangularArray : this.manager.ruleAltArray),
			altSpecified = this.manager.altSpecified,
		    hashSize = (this.isTriangular ? LifeConstants.hashTriangular : LifeConstants.hash33),
			odd = false,
			match = true,
			savedArray = null,
			length = ruleArray.length;

		// save flag
		this.altSpecified = altSpecified;

		// check for RuleTree rules
		if (this.isRuleTree) {
			// attempt to create rule tree lookup
			this.ruleTreeLookup = null;
			this.createRuleTreeLookup();
			return;
		}

		// check if alternates are duplicates
		if (this.altSpecified) {
			// Margolus and PCA only uses first 16 entries
			if (this.isMargolus || this.isPCA) {
				length = 16;
			}

			// compare rule arrays
			i = 0;
			match = true;
			while (i < length && match) {
				if (ruleArray[i] !== ruleAltArray[i]) {
					match = false;
				} else {
					i += 1;
				}
			}

			// if identical then disable alternate rule
			if (match) {
				this.altSpecified = false;

				// update the rule name and alias name
				i = view.patternRuleName.indexOf("|");
				if (i !== -1) {
					view.patternRuleName = view.patternRuleName.substr(0, i);
				}
				i = view.patternAliasName.indexOf("|");
				if (i !== -1) {
					view.patternAliasName = view.patternAliasName.substr(0, i);
				}
			}

			// if alt specified then swap
			if (this.altSpecified && (this.isMargolus || this.isPCA)) {
				for (i = 0; i < length; i += 1) {
					tmp = ruleArray[i];
					ruleArray[i] = ruleAltArray[i];
					ruleAltArray[i] = tmp;
				}
			}
		}

		// clear rule buffers
		this.indexLookup63 = null;
		this.indexLookup632 = null;
		this.indexLookupTri1 = null;
		this.indexLookupTri2 = null;
		this.margolusLookup1 = null;
		this.margolusLookup2 = null;
		this.margolusReverseLookup1 = null;
		this.margolusReverseLookup2 = null;

		// check for PCA
		if (this.isPCA) {
			// create lookup array
			this.margolusLookup1 = this.allocator.allocate(Uint16, LifeConstants.hashPCA, "Life.PCALookup1");
			if (altSpecified) {
				this.margolusLookup2 = this.allocator.allocate(Uint16, LifeConstants.hashPCA, "Life.PCALookup2");
				this.createPCAIndex(this.margolusLookup2, ruleArray, false);
				this.createPCAIndex(this.margolusLookup1, ruleAltArray, false);

				// check for alternate
				if (this.canReverse(ruleArray, false) && this.canReverse(ruleAltArray, false)) {
					this.margolusReverseLookup1 = this.allocator.allocate(Uint16, LifeConstants.hashPCA, "Life.PCAReverseLookup1");
					this.margolusReverseLookup2 = this.allocator.allocate(Uint16, LifeConstants.hashPCA, "Life.PCAReverseLookup2");
					this.canReverse(ruleAltArray, false);
					this.createPCAIndex(this.margolusReverseLookup1, ruleAltArray, true);
					this.canReverse(ruleArray, false);
					this.createPCAIndex(this.margolusReverseLookup2, ruleArray, true);
				}
			} else {
				this.createPCAIndex(this.margolusLookup1, ruleArray, false);

				// check for reverse
				if (this.canReverse(ruleArray, false)) {
					this.margolusReverseLookup1 = this.allocator.allocate(Uint16, LifeConstants.hashPCA, "Life.PCAsReverseLookup1");
					this.createPCAIndex(this.margolusReverseLookup1, ruleArray, true);
				}
			}
		} else {
			// check for Margolus
			if (this.isMargolus) {
				// create lookup array
				this.margolusLookup1 = this.allocator.allocate(Uint16, LifeConstants.hashMargolus, "Life.margolusLookup1");

				//  check for V0 = 15 and V15 = 0
				if (ruleArray[0] === 15 && ruleArray[15] === 0) {
					this.altSpecified = true;
					altSpecified = true;

					// save the original array
					savedArray = new Uint8Array(16);
					for (i = 0; i < 16; i += 1) {
						savedArray[i] = ruleArray[i];
					}

					// create non-strobing alternate rules
					this.createNonStrobingAlternates(ruleArray, ruleAltArray);
				}

				if (altSpecified) {
					this.margolusLookup2 = this.allocator.allocate(Uint16, LifeConstants.hashMargolus, "Life.margolusLookup2");
					this.createMargolusIndex(this.margolusLookup2, ruleArray);
					this.createMargolusIndex(this.margolusLookup1, ruleAltArray);

					// check for reverse V0=15/V15=0
					if (savedArray && this.canReverse(savedArray, true)) {
						this.margolusReverseLookup1 = this.allocator.allocate(Uint16, LifeConstants.hashMargolus, "Life.margolusReverseLookup1");
						this.margolusReverseLookup2 = this.allocator.allocate(Uint16, LifeConstants.hashMargolus, "Life.margolusReverseLookup2");
						this.createNonStrobingAlternates(savedArray, ruleAltArray);
						this.createMargolusIndex(this.margolusReverseLookup1, ruleAltArray);
						this.createMargolusIndex(this.margolusReverseLookup2, savedArray);
					} else {
						// check for alternate
						if (this.canReverse(ruleArray, false) && this.canReverse(ruleAltArray, false)) {
							this.margolusReverseLookup1 = this.allocator.allocate(Uint16, LifeConstants.hashMargolus, "Life.margolusReverseLookup1");
							this.margolusReverseLookup2 = this.allocator.allocate(Uint16, LifeConstants.hashMargolus, "Life.margolusReverseLookup2");
							this.canReverse(ruleAltArray, true);
							this.createMargolusIndex(this.margolusReverseLookup1, ruleAltArray);
							this.canReverse(ruleArray, true);
							this.createMargolusIndex(this.margolusReverseLookup2, ruleArray);
						}
					}
				} else {
					this.createMargolusIndex(this.margolusLookup1, ruleArray);

					// check for reverse
					if (this.canReverse(ruleArray, true)) {
						this.margolusReverseLookup1 = this.allocator.allocate(Uint16, LifeConstants.hashMargolus, "Life.margolusReverseLookup1");
						this.createMargolusIndex(this.margolusReverseLookup1, ruleArray);
					}
				}
			} else {
				// check for Triangular
				if (this.isTriangular) {
					// create lookup arrays
					this.indexLookupTri1 = this.allocator.allocate(Uint8, LifeConstants.hashTriDouble, "Life.indexLookupTri1");
					if (altSpecified) {
						this.indexLookupTri2 = this.allocator.allocate(Uint8, LifeConstants.hashTriDouble, "Life.indexLookupTri2");
						this.createTriangularIndex(this.indexLookupTri2, ruleArray);
						this.createTriangularIndex(this.indexLookupTri1, ruleAltArray);
					} else {
						this.createTriangularIndex(this.indexLookupTri1, ruleArray);
					}
				} else {
					// create the first lookup array
					this.indexLookup63 = this.allocator.allocate(Uint8, LifeConstants.hash63, "Life.indexLookup63");
		
					// check for Wolfram
					if (this.wolframRule === -1) {
						// check for B0
						if (ruleArray[0]) {
							// check for Smax
							if (ruleArray[hashSize - 1]) {
								// B0 with Smax: rule -> NOT(reverse(bits))
								for (i = 0; i < hashSize / 2; i += 1) {
									tmp = ruleArray[i];
									ruleArray[i] = 1 - ruleArray[hashSize - i - 1];
									ruleArray[hashSize - i - 1] = 1 - tmp;
								}
							} else {
								// B0 without Smax needs two rules
								// odd rule -> reverse(bits)
								for (i = 0; i < hashSize / 2; i += 1) {
									tmp = ruleArray[i];
									ruleArray[i] = ruleArray[hashSize - i - 1];
									ruleArray[hashSize - i - 1] = tmp;
								}
								odd = true;
								this.indexLookup632 = this.allocator.allocate(Uint8, LifeConstants.hash63, "Life.indexLookup632");
								this.createLifeIndex63(this.indexLookup632, ruleArray);
		
								// even rule -> NOT(bits)
								for (i = 0; i < hashSize / 2; i += 1) {
									tmp = ruleArray[i];
									// need to reverse then invert due to even rule above
									ruleArray[i] = 1 - ruleArray[hashSize - i - 1];
									ruleArray[hashSize - i - 1] = 1 - tmp;
								}
							}
						}
					}

					// copy rules from pattern
					if (this.altSpecified) {
						this.indexLookup632 = this.allocator.allocate(Uint8, LifeConstants.hash63, "Life.indexLookup632");
						this.createLifeIndex63(this.indexLookup632, ruleArray);
						this.createLifeIndex63(this.indexLookup63, ruleAltArray);
					} else {
						this.createLifeIndex63(this.indexLookup63, ruleArray);
						if (odd) {
							this.altSpecified = true;
						}
					}
				}
			}
		}
	};

	// get the offset from the left most bit
	Life.prototype.leftBitOffset16 = function(value) {
		var result = 0;

		// find the left most bit number
		if ((value & 32768) !== 0) {
			result = 0;
		} else {
			if ((value & 16384) !== 0) {
				result = 1;
			} else {
				if ((value & 8192) !== 0) {
					result = 2;
				} else {
					if ((value & 4096) !== 0) {
						result = 3;
					} else {
						if ((value & 2048) !== 0) {
							result = 4;
						} else {
							if ((value & 1024) !== 0) {
								result = 5;
							} else {
								if ((value & 512) !== 0) {
									result = 6;
								} else {
									if ((value & 256) !== 0) {
										result = 7;
									} else {
										if ((value & 128) !== 0) {
											result = 8;
										} else {
											if ((value & 64) !== 0) {
												result = 9;
											} else {
												if ((value & 32) !== 0) {
													result = 10;
												} else {
													if ((value & 16) !== 0) {
														result = 11;
													} else {
														if ((value & 8) !== 0) {
															result = 12;
														} else {
															if ((value & 4) !== 0) {
																result = 13;
															} else {
																if ((value & 2) !== 0) {
																	result = 14;
																} else {
																	if ((value & 1) !== 0) {
																		result = 15;
																	}
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}

		// return the bit number
		return result;
	};

	// get the offset from the right most bit
	Life.prototype.rightBitOffset16 = function(value) {
		var result = 0;

		// find the right most bit number
		if ((value & 1) !== 0) {
			result = 15;
		} else {
			if ((value & 2) !== 0) {
				result = 14;
			} else {
				if ((value & 4) !== 0) {
					result = 13;
				} else {
					if ((value & 8) !== 0) {
						result = 12;
					} else {
						if ((value & 16) !== 0) {
							result = 11;
						} else {
							if ((value & 32) !== 0) {
								result = 10;
							} else {
								if ((value & 64) !== 0) {
									result = 9;
								} else {
									if ((value & 128) !== 0) {
										result = 8;
									} else {
										if ((value & 256) !== 0) {
											result = 7;
										} else {
											if ((value & 512) !== 0) {
												result = 6;
											} else {
												if ((value & 1024) !== 0) {
													result = 5;
												} else {
													if ((value & 2048) !== 0) {
														result = 4;
													} else {
														if ((value & 4096) !== 0) {
															result = 3;
														} else {
															if ((value & 8192) !== 0) {
																result = 2;
															} else {
																if ((value & 16384) !== 0) {
																	result = 1;
																}
															}
														}
													}
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}

		// return the bit number
		return result;
	};

	// create tiles for the overlay
	Life.prototype.createOverlayTiles = function(state1Fit) {
		// overlay grid
		var overlayGrid = this.overlayGrid,

		    // overlay row
		    overlayRow = null,

		    // tile grid
		    tileGrid = this.tileGrid,

		    // tile row
		    tileRow = null,

		    // width of overlay
		    width = this.width,

		    // height of overlay
		    height = this.height,

		    // tile size (2^n)
		    tilePower = this.tilePower,

		    // whether something alive in the row
		    rowAlive = 0,

		    // top and bottom bounding box
		    topY = this.zoomBox.topY,
		    bottomY = this.zoomBox.bottomY,
		    leftX = this.zoomBox.leftX,
		    rightX = this.zoomBox.rightX,
		
		    // counters
		    h = 0, w = 0;

		// process each row of the overlay grid
		for (h = 0; h < height; h += 1) {
			// get the overlay row
			overlayRow = overlayGrid[h];

			// get the tile row
			tileRow = tileGrid[h >> tilePower];
			rowAlive = 0;

			// check for non-zero states
			for (w = 0; w < width; w += 1) {
				if (overlayRow[w] !== 0) {
					// set the tile
					tileRow[(w >> (tilePower + tilePower))] |= 1 << (~(w >> tilePower) & 15);
					rowAlive |= overlayRow[w];

					// update bounding box
					if (w < leftX) {
						leftX = w;
					}
					if (w > rightX) {
						rightX = w;
					}
				}
			}

			// check if row was alive
			if (rowAlive) {
				if (h < bottomY) {
					bottomY = h;
				}
				if (h > topY) {
					topY = h;
				}	
			}	
		}

		// update bounding box
		if (!state1Fit) {
			this.zoomBox.topY = topY;
			this.zoomBox.bottomY = bottomY;
			this.zoomBox.leftX = leftX;
			this.zoomBox.rightX = rightX;
		}
	};

	// shrink the tile grid to the pattern
	Life.prototype.shrinkTileGrid = function() {
		var h = 0, b = 0,
		    output = 0, th = 0, tw = 0,

		    // grid
			grid = this.grid16,
		    gridRow = null,

		    // source tile grid (from next tile grid template)
		    tileGrid = this.nextTileGrid,
		    tileRow = null,

		    // destination tile grid
		    nextTileGrid = this.tileGrid,
		    nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,

		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
		    bottomY = 0, topY = 0, leftX = 0,

		    // flag if any cells in the tile are alive
		    tileAlive = false,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the destination tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// disable the tile at the start and end of each row to prevent overflow
			tileRow[0] &= 0x7fff;
			tileRow[tileCols16 - 1] &= 0xfffe;

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << b)) !== 0) {
							// flag nothing alive in the tile
							tileAlive = false;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							h = bottomY;

							// current row
							gridRow = grid[h];

							// get the cells from the grid
							output = gridRow[leftX];

							// check if any cells are set
							if (output) {
								// update tile alive flag
								tileAlive = true;

								// check for left column now set
								if ((output & 32768) !== 0) {
									neighbours |= LifeConstants.leftSet;
									neighbours |= LifeConstants.bottomLeftSet;
								}

								// check for right column now set
								if ((output & 1) !== 0) {
									neighbours |= LifeConstants.rightSet;
									neighbours |= LifeConstants.bottomRightSet;
								}

								// bottom row set
								neighbours |= LifeConstants.bottomSet;
							}

							// process middle rows of the tile
							h += 1;
							while (h < topY - 1) {
								// current row
								gridRow = grid[h];

								// get the cells from the grid
								output = gridRow[leftX];

								// check if any cells are set
								if (output) {
									// update tile alive flag
									tileAlive = true;

									// check for left column now set
									if ((output & 32768) !== 0) {
										neighbours |= LifeConstants.leftSet;
									}

									// check for right column now set
									if ((output & 1) !== 0) {
										neighbours |= LifeConstants.rightSet;
									}
								}

								// next row
								h += 1;
							}

							// process top row of tile
							gridRow = grid[h];

							// get the cells from the grid
							output = gridRow[leftX];

							// check if any cells are set
							if (output) {
								// update tile alive flag
								tileAlive = true;

								// check for left column now set
								if ((output & 32768) !== 0) {
									neighbours |= LifeConstants.leftSet;
									neighbours |= LifeConstants.topLeftSet;
								}

								// check for right column now set
								if ((output & 1) !== 0) {
									neighbours |= LifeConstants.rightSet;
									neighbours |= LifeConstants.topRightSet;
								}

								// top row set
								neighbours |= LifeConstants.topSet;
							}

							// check if the source was alive
							if (tileAlive) {
								// update 
								nextTiles |= (1 << b);

								// check for neighbours
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (b < 15) {
											nextTiles |= (1 << (b + 1));
										} else {
											// set in previous set
											if (tw > 0) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (b > 0) {
											nextTiles |= (1 << (b - 1));
										} else {
											// set carry over to go into next set
											if (tw < tileCols16 - 1) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << b);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << b);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (b < 15) {
											belowNextTiles |= (1 << (b + 1));
										} else {
											if (tw > 0) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										} else {
											if (tw < tileCols16 - 1) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										} else {
											if (tw > 0) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										} else {
											if (tw < tileCols16 - 1) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);
	};

	// shrink the tile grid to the pattern
	Life.prototype.shrinkTileGridGenerations = function() {
		// @ts-ignore
		var h = 0, b = 0,
		    output = 0, th = 0, tw = 0,

		    // grid
	       	    grid = this.grid16,
		    gridRow = null,

		    // source tile grid (from next tile grid template)
		    tileGrid = this.nextTileGrid,
		    tileRow = null,

		    // colour tile grid
		    colourGrid = this.colourGrid,
		    colourGridRow = null,

		    // destination tile grid
		    nextTileGrid = this.tileGrid,
		    nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,

		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    cr = 0,

		    // flag if any cells in the tile are alive
		    tileAlive = false,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the destination tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// disable the tile at the start and end of each row to prevent overflow
			tileRow[0] &= 0x7fff;
			tileRow[tileCols16 - 1] &= 0xfffe;

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << b)) !== 0) {
							// flag nothing alive in the tile
							tileAlive = false;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							h = bottomY;

							// current row
							gridRow = grid[h];
							colourGridRow = colourGrid[h];

							// get the cells from the grid
							output = gridRow[leftX];

							// update from the colour row
							cr = leftX << 4;
							if (colourGridRow[cr] > 0) {
								output |= 32768;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 16384;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 8192;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 4096;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 2048;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 1024;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 512;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 256;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 128;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 64;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 32;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 16;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 8;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 4;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 2;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 1;
							}

							// check if any cells are set
							if (output) {
								// update tile alive flag
								tileAlive = true;

								// check for left column now set
								if ((output & 32768) !== 0) {
									neighbours |= LifeConstants.leftSet;
									neighbours |= LifeConstants.bottomLeftSet;
								}

								// check for right column now set
								if ((output & 1) !== 0) {
									neighbours |= LifeConstants.rightSet;
									neighbours |= LifeConstants.bottomRightSet;
								}

								// bottom row set
								neighbours |= LifeConstants.bottomSet;
							}

							// process middle rows of the tile
							h += 1;
							while (h < topY - 1) {
								// current row
								gridRow = grid[h];
								colourGridRow = colourGrid[h];

								// get the cells from the grid
								output = gridRow[leftX];

								// update from the colour row
								cr = leftX << 4;
								if (colourGridRow[cr] > 0) {
									output |= 32768;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 16384;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 8192;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 4096;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 2048;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 1024;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 512;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 256;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 128;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 64;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 32;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 16;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 8;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 4;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 2;
								}
								cr += 1;
								if (colourGridRow[cr] > 0) {
									output |= 1;
								}

								// check if any cells are set
								if (output) {
									// update tile alive flag
									tileAlive = true;

									// check for left column now set
									if ((output & 32768) !== 0) {
										neighbours |= LifeConstants.leftSet;
									}

									// check for right column now set
									if ((output & 1) !== 0) {
										neighbours |= LifeConstants.rightSet;
									}
								}

								// next row
								h += 1;
							}

							// process top row of tile
							gridRow = grid[h];
							colourGridRow = colourGrid[h];

							// get the cells from the grid
							output = gridRow[leftX];

							// update from the colour row
							cr = leftX << 4;
							if (colourGridRow[cr] > 0) {
								output |= 32768;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 16384;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 8192;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 4096;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 2048;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 1024;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 512;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 256;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 128;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 64;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 32;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 16;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 8;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 4;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 2;
							}
							cr += 1;
							if (colourGridRow[cr] > 0) {
								output |= 1;
							}

							// check if any cells are set
							if (output) {
								// update tile alive flag
								tileAlive = true;

								// check for left column now set
								if ((output & 32768) !== 0) {
									neighbours |= LifeConstants.leftSet;
									neighbours |= LifeConstants.topLeftSet;
								}

								// check for right column now set
								if ((output & 1) !== 0) {
									neighbours |= LifeConstants.rightSet;
									neighbours |= LifeConstants.topRightSet;
								}

								// top row set
								neighbours |= LifeConstants.topSet;
							}

							// check if the source was alive
							if (tileAlive) {
								// update 
								nextTiles |= (1 << b);

								// check for neighbours
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (b < 15) {
											nextTiles |= (1 << (b + 1));
										} else {
											// set in previous set
											if (tw > 0) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (b > 0) {
											nextTiles |= (1 << (b - 1));
										} else {
											// set carry over to go into next set
											if (tw < tileCols16 - 1) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << b);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << b);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (b < 15) {
											belowNextTiles |= (1 << (b + 1));
										} else {
											if (tw > 0) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										} else {
											if (tw < tileCols16 - 1) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										} else {
											if (tw > 0) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										} else {
											if (tw < tileCols16 - 1) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);
	};

	// shrink grid (after major edit)
	Life.prototype.doShrink = function() {
		var w = 0,
		    h = 0,
		    input = 0,

		    // width in 16bit chunks
		    w16 = this.width >> 4,

		    // width and height
		    height = this.height,
		    width = this.width,

		    // life grid
		    grid16 = this.grid16,
		    gridRow16 = null,

		    // overlay colour grid
		    overlayGrid = this.overlayGrid,
		    overlayRow = null,

		    // colour grid
		    colourGrid = this.colourGrid,
		    colourGridRow = null,

		    // bounding boxes
			zoomBox = this.zoomBox,
			HROTBox = this.HROTBox,
		    initialBox = this.initialBox,

		    // new box extent
		    newBottomY = this.height,
		    newTopY = -1,
		    newLeftX = this.width,
		    newRightX = -1,

		    // new overlay extent
		    overlayBottomY = this.height,
		    overlayTopY = -1,
		    overlayLeftX = this.width,
		    overlayRightX = -1,

		    // flag if something in the row was alive
		    rowAlive = 0,

		    // flags if something in the column was alive
			columnOccupied16 = this.columnOccupied16;

		if (this.shrinkNeeded) {
			this.shrinkNeeded = false;

			// check for PCA rules
			if (this.isPCA || this.isRuleTree) {
				// swap grids every generation
				if ((this.counter & 1) !== 0) {
					colourGrid = this.nextColourGrid;
				}
			}

			// determine the buffer for current generation
			if ((this.counter & 1) !== 0) {
				grid16 = this.nextGrid16;
			} else {
				grid16 = this.grid16;
			}

			// check for LifeHistory pattern
			if (overlayGrid) {
				// use the overlay grid to set the bounding box (to cope with non-excecutable states)
				for (h = 0; h < height; h += 1) {
					overlayRow = overlayGrid[h];

					// flag nothing in the row
					rowAlive = 0;

					// check each column
					for (w = 0; w < width; w += 1) {
						input = overlayRow[w];
						rowAlive |= input;

						if (input) {
							if (w < overlayLeftX) {
								overlayLeftX = w;
							}
							if (w > overlayRightX) {
								overlayRightX = w;
							}
						}
					}

					// check if the row was alive
					if (rowAlive) {
						if (h < overlayBottomY) {
							overlayBottomY = h;
						}
						if (h > overlayTopY) {
							overlayTopY = h;
						}
					}
				}
			}

			// use the pattern grid to set the bounding box
			// clear column occupied flags
			columnOccupied16.fill(0);

			// check for Generations or HROT
			if (this.multiNumStates !== -1) {
				// check each row
				for (h = 0; h < height; h += 1) {
					colourGridRow = colourGrid[h];

					// flag nothing in the row
					rowAlive = 0;

					// check each column
					for (w = 0; w < width; w += 1) {
						input = colourGridRow[w];
						rowAlive |= input;

						if (input) {
							if (w < newLeftX) {
								newLeftX = w;
							}
							if (w > newRightX) {
								newRightX = w;
							}
						}
					}

					// check if the row was alive
					if (rowAlive) {
						if (h < newBottomY) {
							newBottomY = h;
						}
						if (h > newTopY) {
							newTopY = h;
						}
					}
				}
			} else {
				// check each row
				for (h = 0; h < height; h += 1) {
					gridRow16 = grid16[h];

					// flag nothing alive in the row
					rowAlive = 0;

					// check each column
					for (w = 0; w < w16; w += 1) {
						// update row alive flag
						input = gridRow16[w];
						rowAlive |= input;

						// update the column alive flag
						columnOccupied16[w] |= input;
					}

					// check if the row was alive
					if (rowAlive) {
						if (h < newBottomY) {
							newBottomY = h;
						}
						if (h > newTopY) {
							newTopY = h;
						}
					}
				}

				// check the width of the box
				for (w = 0; w < w16; w += 1) {
					if (columnOccupied16[w]) {
						if (w < newLeftX) {
							newLeftX = w;
						}
						if (w > newRightX) {
							newRightX = w;
						}
					}
				}

				// convert new width to pixels
				newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
				newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);
			}

			// ensure the box is not blank
			if (newTopY < 0 || newBottomY >= height || newLeftX >= width || newRightX < 0) {
				// set the box to the middle
				newTopY = height >> 1;
				newBottomY = newTopY;
				newLeftX = width >> 1;
				newRightX = newLeftX;
			}

			// merge with overlay if required
			if (overlayGrid) {
				if (overlayTopY < newTopY) {
					newTopY = overlayTopY;
				}
				if (overlayBottomY > newBottomY) {
					newBottomY = overlayBottomY;
				}
				if (overlayLeftX < newLeftX) {
					newLeftX = overlayLeftX;
				}
				if (overlayRightX > newRightX) {
					newRightX = overlayRightX;
				}
			}

			// clip to display
			if (newTopY > this.height - 1) {
				newTopY = this.height - 1;
			}
			if (newBottomY < 0) {
				newBottomY = 0;
			}
			if (newLeftX < 0) {
				newLeftX = 0;
			}
			if (newRightX > this.width - 1) {
				newRightX = this.width - 1;
			}

			// save new grid box
			zoomBox.topY = newTopY;
			zoomBox.bottomY = newBottomY;
			zoomBox.leftX = newLeftX;
			zoomBox.rightX = newRightX;

			// copy to HROT alive state box
			HROTBox.topY = newTopY;
			HROTBox.bottomY = newBottomY;
			HROTBox.leftX = newLeftX;
			HROTBox.rightX = newRightX;

			// copy to the original box (for LifeHistory)
			initialBox.topY = newTopY;
			initialBox.bottomY = newBottomY;
			initialBox.leftX = newLeftX;
			initialBox.rightX = newRightX;
		}
	};

	// create bounding box from current state
	Life.prototype.resetBoxes = function(state1Fit) {
		var w = 0,
		    h = 0,
		    input = 0,

		    // width in 16bit chunks
		    w16 = this.width >> 4,

		    // width and height
		    height = this.height,
		    width = this.width,

		    // life grid
		    grid16 = this.grid16,
		    gridRow16 = null,

		    // overlay colour grid
		    overlayGrid = this.overlayGrid,
		    overlayRow = null,

		    // colour grid
		    colourGrid = this.colourGrid,
		    colourGridRow = null,

		    // bounding boxes
			zoomBox = this.zoomBox,
			HROTBox = this.HROTBox,
		    initialBox = this.initialBox,

		    // new box extent
		    newBottomY = this.height,
		    newTopY = -1,
		    newLeftX = this.width,
		    newRightX = -1,

		    // new overlay extent
		    overlayBottomY = this.height,
		    overlayTopY = -1,
		    overlayLeftX = this.width,
		    overlayRightX = -1,

		    // flag if something in the row was alive
		    rowAlive = 0,

		    // flags if something in the column was alive
		    columnOccupied16 = this.columnOccupied16,

		    // tile grids
		    tileGrid = this.tileGrid,
		    tileRow = null,
		    nextTileGrid = this.nextTileGrid,

		    // colour tile grids
		    colourTileGrid = this.colourTileGrid,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,

		    // bottom tile row
		    bottomY = 0,

		    // top tile row
		    topY = 0,

		    // left tile group column
		    leftX = 0,

		    // right tile group column
		    rightX = 0;

		// determine the buffer for current generation
		if ((this.counter & 1) !== 0) {
			grid16 = this.nextGrid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid16 = this.grid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// check for LifeHistory pattern
		if (overlayGrid && !state1Fit) {
			// use the overlay grid to set the bounding box (to cope with non-excecutable states)
			for (h = 0; h < height; h += 1) {
				overlayRow = overlayGrid[h];

				// flag nothing in the row
				rowAlive = 0;

				// check each column
				for (w = 0; w < width; w += 1) {
					input = overlayRow[w];
					rowAlive |= input;

					if (input) {
						if (w < overlayLeftX) {
							overlayLeftX = w;
						}
						if (w > overlayRightX) {
							overlayRightX = w;
						}
					}
				}

				// check if the row was alive
				if (rowAlive) {
					if (h < overlayBottomY) {
						overlayBottomY = h;
					}
					if (h > overlayTopY) {
						overlayTopY = h;
					}
				}
			}
		}

		// use the pattern grid to set the bounding box
		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// check for Generations or HROT
		if (this.multiNumStates !== -1) {
			// check each row
			for (h = 0; h < height; h += 1) {
				colourGridRow = colourGrid[h];

				// flag nothing in the row
				rowAlive = 0;

				// check each column
				for (w = 0; w < width; w += 1) {
					input = colourGridRow[w];
					rowAlive |= input;

					if (input) {
						if (w < newLeftX) {
							newLeftX = w;
						}
						if (w > newRightX) {
							newRightX = w;
						}
					}
				}

				// check if the row was alive
				if (rowAlive) {
					if (h < newBottomY) {
						newBottomY = h;
					}
					if (h > newTopY) {
						newTopY = h;
					}
				}
			}
		} else {
			// check each row
			for (h = 0; h < height; h += 1) {
				gridRow16 = grid16[h];

				// flag nothing alive in the row
				rowAlive = 0;

				// check each column
				for (w = 0; w < w16; w += 1) {
					// update row alive flag
					input = gridRow16[w];
					rowAlive |= input;

					// update the column alive flag
					columnOccupied16[w] |= input;
				}

				// check if the row was alive
				if (rowAlive) {
					if (h < newBottomY) {
						newBottomY = h;
					}
					if (h > newTopY) {
						newTopY = h;
					}
				}
			}

			// check the width of the box
			for (w = 0; w < w16; w += 1) {
				if (columnOccupied16[w]) {
					if (w < newLeftX) {
						newLeftX = w;
					}
					if (w > newRightX) {
						newRightX = w;
					}
				}
			}

			// convert new width to pixels
			newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
			newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);
		}

		// ensure the box is not blank
		if (newTopY < 0 || newBottomY >= height || newLeftX >= width || newRightX < 0) {
			// set the box to the middle
			newTopY = height >> 1;
			newBottomY = newTopY;
			newLeftX = width >> 1;
			newRightX = newLeftX;
		}

		// merge with overlay if required
		if (overlayGrid && !state1Fit) {
			if (overlayTopY < newTopY) {
				newTopY = overlayTopY;
			}
			if (overlayBottomY > newBottomY) {
				newBottomY = overlayBottomY;
			}
			if (overlayLeftX < newLeftX) {
				newLeftX = overlayLeftX;
			}
			if (overlayRightX > newRightX) {
				newRightX = overlayRightX;
			}
		}

		// clip to display
		if (newTopY > this.height - 1) {
			newTopY = this.height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > this.width - 1) {
			newRightX = this.width - 1;
		}

		// save new grid box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// copy to HROT alive state box
		HROTBox.topY = newTopY;
		HROTBox.bottomY = newBottomY;
		HROTBox.leftX = newLeftX;
		HROTBox.rightX = newRightX;

		// copy to the original box (for LifeHistory)
		initialBox.topY = newTopY;
		initialBox.bottomY = newBottomY;
		initialBox.leftX = newLeftX;
		initialBox.rightX = newRightX;

		// extend box by one cell
		if (newLeftX > 0) {
			newLeftX -= 1;
		}
		if (newBottomY > 0) {
			newBottomY -= 1;
		}
		if (newRightX < this.width - 1) {
			newRightX += 1;
		}
		if (newTopY < this.height - 1) {
			newTopY += 1;
		}

		// set the initial tile row
		bottomY = newBottomY >> this.tilePower;
		topY = newTopY >> this.tilePower;
		leftX = newLeftX >> (this.tilePower + 4);
		rightX = newRightX >> (this.tilePower + 4);

		// set the tile grid from the bounding box
		for (h = bottomY; h <= topY; h += 1) {
			// get the tile row in the next tile grid since this will be used when shrinking
			tileRow = nextTileGrid[h];
			for (w = leftX; w <= rightX; w += 1) {
				tileRow[w] = -1;
			}
		}

		// shrink the tile grid to the pattern
		if (this.multiNumStates !== -1) {
			this.shrinkTileGridGenerations();
		} else {
			this.shrinkTileGrid();
		}

		// add the overlay grid to the tiles
		if (overlayGrid) {
			this.createOverlayTiles(state1Fit);
			initialBox.topY = zoomBox.topY;
			initialBox.bottomY = zoomBox.bottomY;
			initialBox.leftX = zoomBox.leftX;
			initialBox.rightX = zoomBox.rightX;
		}

		// copy tile grid to the next tile grid
		Array.copy(tileGrid, nextTileGrid);

		// copy to the colour grids
		Array.copy(tileGrid, colourTileGrid);
		Array.copy(tileGrid, colourTileHistoryGrid);
	};

	// clear boundary
	Life.prototype.clearBoundary = function(extra, statsOn) {
		// life grid
		var grid = null,

		    // top left
		    leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // bottom right
		    rightX = leftX + this.boundedGridWidth - 1,
		    topY = bottomY + this.boundedGridHeight - 1,

		    // left and right extent in 16bit words
		    left16 = (leftX - extra) >> 4,
		    right16 = (rightX + extra) >> 4,

		    // top and bottom row
		    topRow = null,
		    bottomRow = null,

		    // left and right word
		    leftWord = (leftX - extra) >> 4,
		    rightWord = (rightX + extra) >> 4,

		    // left and right mask
		    leftMask = ~(1 << (~(leftX - extra) & 15)),
			rightMask = ~(1 << (~(rightX + extra) & 15)),

		    // counters
		    x = 0,
			y = 0,
			
			// cell population to adjust
			bitCounts16 = this.bitCounts16,
			remove = 0,
			gridy = null;

		// determine the buffer for current generation
		if (!this.isPCA || this.isRuleTree) {
			if ((this.counter & 1) !== 0) {
				grid = this.nextGrid16;
			} else {
				grid = this.grid16;
			}

			// set top and bottom row
			topRow = grid[topY + extra];
			bottomRow = grid[bottomY - extra];

			// check for infinite width
			if (this.boundedGridWidth === 0) {
				// just clear top and bottom
				left16 = 0;
				right16 = this.width >> 4;
				for (x = left16; x < right16; x += 1) {
					remove += bitCounts16[bottomRow[x]];
					bottomRow[x] = 0;
					remove += bitCounts16[topRow[x]];
					topRow[x] = 0;
				}
			} else {
				// check for infinite height
				if (this.boundedGridHeight === 0) {
					// just clear left and right
					bottomY = 0;
					topY = this.height;
					for (y = 0; y < topY; y += 1) {
						gridy = grid[y];
						if (gridy[leftWord] & ~leftMask) {
							remove += 1;
						}
						gridy[leftWord] &= leftMask;
						if (gridy[rightWord] & ~rightMask) {
							remove += 1;
						}
						gridy[rightWord] &= rightMask;
					}
				} else {
					// clear top and bottom boundary
					for (x = left16; x <= right16; x += 1) {
						remove += bitCounts16[bottomRow[x]];
						bottomRow[x] = 0;
						remove += bitCounts16[topRow[x]];
						topRow[x] = 0;
					}

					// clear left and right boundary
					for (y = bottomY - extra + 1; y <= topY + extra - 1; y += 1) {
						gridy = grid[y];
						if (gridy[leftWord] & ~leftMask) {
							remove += 1;
						}
						gridy[leftWord] &= leftMask;
						if (gridy[rightWord] & ~rightMask) {
							remove += 1;
						}
						gridy[rightWord] &= rightMask;
					}
				}
			}

			// adjust population
			if (statsOn) {
				this.population -= remove;
			}
		}

		// check for Generations or HROT
		if (this.multiNumStates !== -1) {  // TBD what about population count?
			// clear the colour grid boundary
			grid = this.colourGrid;

			// check for PCA rules
			if (this.isPCA || this.isRuleTree) {
				// swap grids every generation
				if ((this.counter & 1) !== 0) {
					grid = this.nextColourGrid;
				}
			}

			// extend to the boundary
			leftX -= extra;
			rightX += extra;
			topY += extra;
			bottomY -= extra;

			// set top and bottom row
			topRow = grid[topY];
			bottomRow = grid[bottomY];

			// check for infinite width
			if (this.boundedGridWidth === 0) {
				// just clear top and bottom
				bottomRow.fill(0);
				topRow.fill(0);
			} else {
				// check for infinite height
				if (this.boundedGridHeight === 0) {
					// just clear left and right
					for (y = 0; y < this.height; y += 1) {
						grid[y][leftX] = 0;
						grid[y][rightX] = 0;
					}
				} else {
					// clear top and bottom boundary
					bottomRow.fill(0, leftX, rightX + 1);
					topRow.fill(0, leftX, rightX + 1);

					// clear left and right boundary
					for (y = bottomY + 1; y <= topY - 1; y += 1) {
						grid[y][leftX] = 0;
						grid[y][rightX] = 0;
					}
				}
			}
		}
	};

	// find N glider
	/** @return {boolean} */
	Life.prototype.findAndDeleteGlider = function(/** @type {Array<Array<number>>} */ glider, /** @type {number} */ x, /** @type {number} */ y) {
		var /** @type {boolean} */ found = false,
			/** @type {Array<number>} */ gliderRow = null,
			/** @type {number} */ state = 0,
			/** @type {number} */ xc = 0,
			/** @type {number} */ yc = 0,
			/** @type {number} */ cell = 0;

		// search grid for glider
		x -= 2;
		y -= 2;
		yc = 0;
		found = true;
		while (found && yc < glider.length) {
			xc = 0;
			gliderRow = glider[yc];
			while (found && xc < gliderRow.length) {
				cell = gliderRow[xc];
				state = this.colourGrid[y + yc][x + xc];
				if (!(state < this.aliveStart && cell === 0 || state >= this.aliveStart && cell === 1)) {
					found = false;
				}
				xc += 1;
			}
			yc += 1;
		}

		// if found then delete the cells
		if (found) {
			this.numClearedGliders += 1;
			for (yc = 0; yc < glider.length; yc += 1) {
				gliderRow = glider[yc];
				for (xc = 0; xc < gliderRow.length; xc += 1) {
					if (gliderRow[xc] === 1) {
						this.setState(x + xc, y + yc, 0, false);
					}
				}
			}
		}
		return found;
	};

	// clear escaping gliders
	Life.prototype.clearEscapingGliders = function() {
		var /** @type {number} */ x = 0,
			/** @type {number} */ y = 0,
			/** @const {number} */ leftX = this.zoomBox.leftX,
			/** @const {number} */ rightX = this.zoomBox.rightX,
			/** @const {number} */ bottomY = this.zoomBox.bottomY,
			/** @const {number} */ topY = this.zoomBox.topY,
			colourGrid = this.colourGrid,
			topRow = colourGrid[topY],
			bottomRow = colourGrid[bottomY],
			aliveStart = this.aliveStart,
			currentRow = null;

		// ignore bounded grids
		if (this.boundedGridType === -1) {
			// check top and bottom rows
			for (x = leftX; x <= rightX; x += 1) {
				if (bottomRow[x] >= aliveStart) {
					// NW and NE glider
					if (!this.findAndDeleteGlider(this.gliderNW7x7, x, bottomY)) {
						this.findAndDeleteGlider(this.gliderNE7x7, x, bottomY);
					}
				}
				if (topRow[x] >= aliveStart) {
					// SW and SE glider
					if (!this.findAndDeleteGlider(this.gliderSW7x7, x, topY - 2)) {
						this.findAndDeleteGlider(this.gliderSE7x7, x, topY - 2);
					}
				}
			}
			// check left and right columns
			for (y = bottomY; y <= topY; y += 1) {
				currentRow = colourGrid[y];
				if (currentRow[leftX] >= aliveStart) {
					// NW and SW glider
					if (!this.findAndDeleteGlider(this.gliderNW7x7, leftX, y)) {
						this.findAndDeleteGlider(this.gliderSW7x7, leftX, y - 1);
					}
				}
				if (currentRow[rightX] >= aliveStart) {
					// NE and SE glider
					if (!this.findAndDeleteGlider(this.gliderNE7x7, rightX - 2, y)) {
						this.findAndDeleteGlider(this.gliderSE7x7, rightX - 2, y - 1);
					}
				}
			}

			// check if shrink needed
			this.doShrink();
		}
	};

	// set bounded grid tiles
	Life.prototype.setBoundedTiles = function() {
		// counters
		var x = 0,
		    y = 0,
		    width = this.boundedGridWidth,
		    height = this.boundedGridHeight,
		    leftX = Math.round((this.width - width) / 2 - 1) >> this.tilePower,
		    rightX = Math.round((this.width + width) / 2) >> this.tilePower,
		    bottomY = Math.round((this.height - height) / 2 - 1) >> this.tilePower,
		    topY = Math.round((this.height + height) / 2) >> this.tilePower,
		    value = 0;

		// check for infinite height
		if (height === 0) {
			bottomY = 0;
			topY = (this.height >> this.tilePower) - 1;
		}

		// check for infinite width
		if (width === 0) {
			leftX = 0;
			rightX = (this.width >> this.tilePower) - 1;
		}

		// ensure tiles are on grid
		if (leftX < 0) {
			leftX = 0;
		}
		if (bottomY < 0) {
			bottomY = 0;
		}
		if (rightX >= (this.width >> this.tilePower)) {
			rightX = (this.width >> this.tilePower) - 1;
		}
		if (topY >= (this.height >> this.tilePower)) {
			topY = (this.height >> this.tilePower) - 1;
		}

		// set the top and bottom row of the bounded grid in the tile map
		for (x = leftX; x <= rightX; x += 1) {
			value = 1 << (~x & 15);

			// bottom row
			this.tileGrid[bottomY][x >> 4] |= value;
			this.nextTileGrid[bottomY][x >> 4] |= value;
			this.colourTileGrid[bottomY][x >> 4] |= value;
			this.colourTileHistoryGrid[bottomY][x >> 4] |= value;

			// top row
			this.tileGrid[topY][x >> 4] |= value;
			this.nextTileGrid[topY][x >> 4] |= value;
			this.colourTileGrid[topY][x >> 4] |= value;
			this.colourTileHistoryGrid[topY][x >> 4] |= value;
		}

		// set left and right column of the bounded grid in the tile map
		for (y = bottomY; y <= topY; y += 1) {
			// left column
			value = 1 << (~leftX & 15);
			this.tileGrid[y][leftX >> 4] |= value;
			this.nextTileGrid[y][leftX >> 4] |= value;
			this.colourTileGrid[y][leftX >> 4] |= value;
			this.colourTileHistoryGrid[y][leftX >> 4] |= value;

			// right column
			value = 1 << (~rightX & 15);
			this.tileGrid[y][rightX >> 4] |= value;
			this.nextTileGrid[y][rightX >> 4] |= value;
			this.colourTileGrid[y][rightX >> 4] |= value;
			this.colourTileHistoryGrid[y][rightX >> 4] |= value;
		}
	};

	// process torus for multi-state
	Life.prototype.processTorusMS = function(grid) {
		// bounded grid width and height
		var width = this.boundedGridWidth,
		    height = this.boundedGridHeight,

		    // bottom left
		    leftX = Math.round((this.width - width) / 2),
		    bottomY = Math.round((this.height - height) / 2),

		    // top right
		    rightX = leftX + width - 1,
		    topY = bottomY + height - 1,

		    // horizontal and vertical shifts
		    horizShift = this.boundedGridHorizontalShift,
		    vertShift = this.boundedGridVerticalShift,

			// colour tile grid
			colourTileGrid = this.colourTileHistoryGrid,

		    // counters
		    sourceX = 0,
		    sourceY = 0,
		    destX = 0,
			destY = 0,
			state = 0,
		    i = 0;

		// check for infinite width
		if (this.boundedGridWidth === 0) {
			// process whole width
			leftX = 0;
			rightX = this.width - 1;
			width = this.width;
		}

		// check for infinite height
		if (this.boundedGridHeight === 0) {
			// process whole height
			bottomY = 0;
			topY = this.height - 1;
			height = this.height;
		}

		// check for infinite height
		if (this.boundedGridHeight !== 0) {
			// perform vertical wrap
			for (i = 0; i < width; i += 1) {
				// copy top row to below bottom
				sourceX = leftX + i;
				destX = leftX + ((i + horizShift + width) % width);

				// check if cell set
				state = grid[topY][sourceX];
				if (state !== 0) {
					// copy cell to below bottom row
					grid[bottomY - 1][destX] = state;

					// set tile grid
					colourTileGrid[(bottomY - 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));

					// check for tile boundary
					if (((bottomY - 1) & 15) === 15) {
						colourTileGrid[((bottomY - 1) >> 4) + 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
					}
				}

				// copy bottom row to above top
				destX = leftX + ((i - horizShift + width) % width);

				// check if cell set
				state = grid[bottomY][sourceX];
				if (state !== 0) {
					// copy cell to above top row
					grid[topY + 1][destX] = state;

					// set tile grid
					colourTileGrid[(topY + 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));

					// check for tile boundary
					if (((topY + 1) & 15) === 0) {
						colourTileGrid[((topY + 1) >> 4) - 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
					}
				}
			}
		}

		// check for infinite width
		if (this.boundedGridWidth !== 0) {
			// perform horizontal wrap
			for (i = 0; i < height; i += 1) {
				// copy left column to right of right
				sourceY = bottomY + i;
				destY = bottomY + ((i - vertShift + height) % height);

				// check if cell set
				state = grid[sourceY][leftX];
				if (state !== 0) {
					// copy cell to right of right edge
					grid[destY][rightX + 1] = state;

					// set tile grid
					colourTileGrid[destY >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

					// check for tile boundary
					if (((rightX + 1) & 15) === 0) {
						colourTileGrid[destY >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
					}
				}

				// copy right column to left of left
				destY = bottomY + ((i + vertShift + height) % height);

				// check if cell set
				state = grid[sourceY][rightX];
				if (state !== 0) {
					// copy cell to left of left edge
					grid[destY][leftX - 1] = state;

					// set tile grid
					colourTileGrid[destY >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));

					// check for tile boundary
					if (((leftX - 1) & 15) === 15) {
						colourTileGrid[destY >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
					}
				}
			}
		}

		// only process corners if both dimensions are not infinite
		if (this.boundedGridWidth !== 0 && this.boundedGridHeight !== 0) {
			// bottom right corner
			sourceX = leftX + ((-horizShift + width) % width);
			sourceY = bottomY + ((height - 1 + vertShift + height) % height);
			state = grid[sourceY][sourceX];
			grid[bottomY - 1][rightX + 1] = state;

			// bottom left corner
			sourceX = leftX + ((width - 1 - horizShift + width) % width);
			sourceY = bottomY + ((height - 1 - vertShift + height) % height);
			state = grid[sourceY][sourceX];
			grid[bottomY - 1][leftX - 1] = state;

			// top right corner
			sourceX = leftX + ((horizShift + width) % width);
			sourceY = bottomY + ((vertShift + height) % height);
			state = grid[sourceY][sourceX];
			grid[topY + 1][rightX + 1] = state;

			// top left corner
			sourceX = leftX + ((width - 1 + horizShift + width) % width);
			sourceY = bottomY + ((-vertShift + height) % height);
			state = grid[sourceY][sourceX];
			grid[topY + 1][leftX - 1] = state;
		}
	};

	// process klein bottle for multi-state
	Life.prototype.processKleinMS = function(grid) {
		var colourTileGrid = this.colourTileHistoryGrid,
		    
		    // bounded grid width and height
		    width = this.boundedGridWidth,
		    height = this.boundedGridHeight,

		    // bottom left
		    leftX = Math.round((this.width - width) / 2),
		    bottomY = Math.round((this.height - height) / 2),

		    // top right
		    rightX = leftX + width - 1,
		    topY = bottomY + height - 1,

		    // horizontal and vertical shifts
		    horizShift = this.boundedGridHorizontalShift,
		    vertShift = this.boundedGridVerticalShift,

		    // horizontal and vertical twists
		    horizTwist = this.boundedGridHorizontalTwist,
		    vertTwist = this.boundedGridVerticalTwist,

		    // counters
		    sourceX = 0,
		    sourceY = 0,
		    destX = 0,
			destY = 0,
			state = 0,
		    i = 0;

		// perform vertical wrap
		for (i = 0; i < width; i += 1) {
			// copy top row to below bottom
			sourceX = leftX + i;

			// check for twist
			if (horizTwist) {
				destX = rightX - ((i + horizShift + width) % width);
			} else {
				destX = leftX + ((i + horizShift + width) % width);
			}

			state = grid[topY][sourceX];
			if (state !== 0) {
				// copy cell to below bottom
				grid[bottomY - 1][destX] = state;

				// set tile grid
				colourTileGrid[(bottomY - 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));

				// check for tile boundary
				if (((bottomY - 1) & 15) === 15) {
					colourTileGrid[((bottomY - 1) >> 4) + 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
				}
			}

			// copy bottom row to above top
			if (horizTwist) {
				destX = rightX - ((i - horizShift + width) % width);
			} else {
				destX = leftX + ((i - horizShift + width) % width);
			}

			state = grid[bottomY][sourceX];
			if (state !== 0) {
				// copy cell to above top
				grid[topY + 1][destX] = state;

				// set tile grid
				colourTileGrid[(topY + 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));

				// check for tile boundary
				if (((topY + 1) & 15) === 0) {
					colourTileGrid[((topY + 1) >> 4) - 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
				}
			}
		}

		// perform horizontal wrap
		for (i = 0; i < height; i += 1) {
			// copy left column to right of right
			sourceY = bottomY + i;

			// check for vertical twist
			if (vertTwist) {
				destY = topY - ((i - vertShift + height) % height);
			} else {
				destY = bottomY + ((i - vertShift + height) % height);
			}

			state = grid[sourceY][leftX];
			if (state !== 0) {
				// copy cell to right of right edge
				grid[destY][rightX + 1] = state;

				// set tile grid
				colourTileGrid[destY >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

				// check for tile boundary
				if (((rightX + 1) & 15) === 0) {
					colourTileGrid[destY >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
				}
			}

			// copy right column to left of left
			if (vertTwist) {
				destY = topY - ((i + vertShift + height) % height);
			} else {
				destY = bottomY + ((i + vertShift + height) % height);
			}

			state = grid[sourceY][rightX];
			if (state !== 0) {
				// copy cell to left of left edge
				grid[destY][leftX - 1] = state;

				// set tile grid
				colourTileGrid[destY >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));

				// check for tile boundary
				if (((leftX - 1) & 15) === 15) {
					colourTileGrid[destY >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
				}
			}
		}

		// bottom right corner
		if (horizTwist) {
			sourceX = rightX - ((-horizShift + width) % width);
		} else {
			sourceX = leftX + ((-horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((height - 1 + vertShift + height) % height);
		} else {
			sourceY = bottomY + ((height - 1 + vertShift + height) % height);
		}
		state = grid[sourceY][sourceX];
		grid[bottomY - 1][rightX + 1] = state;

		// bottom left corner
		if (horizTwist) {
			sourceX = rightX - ((width - 1 - horizShift + width) % width);
		} else {
			sourceX = leftX + ((width - 1 - horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((height - 1 + vertShift + height) % height);
		} else {
			sourceY = bottomY + ((height - 1 + vertShift + height) % height);
		}
		state = grid[sourceY][sourceX];
		grid[bottomY - 1][leftX - 1] = state;

		// top right corner
		if (horizTwist) {
			sourceX = rightX - ((horizShift + width) % width);
		} else {
			sourceX = leftX + ((horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((vertShift + height) % height);
		} else {
			sourceY = bottomY + ((vertShift + height) % height);
		}
		state = grid[sourceY][sourceX];
		grid[topY + 1][rightX + 1] = state;

		// top left corner
		if (horizTwist) {
			sourceX = rightX - ((width - 1 + horizShift + width) % width);
		} else {
			sourceX = leftX + ((width - 1 + horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((vertShift + height) % height);
		} else {
			sourceY = bottomY + ((vertShift + height) % height);
		}
		state = grid[sourceY][sourceX];
		grid[topY + 1][leftX - 1] = state;
	};

	// process cross-surface for multi-state
	Life.prototype.processCrossSurfaceMS = function(grid) {
		var colourTileGrid = this.colourTileGrid,

		    // bottom left
		    leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // top right
		    rightX = leftX + this.boundedGridWidth - 1,
		    topY = bottomY + this.boundedGridHeight - 1,

		    // counters
		    i = 0,
		    source = 0,
			dest = 0,
			state = 0;

		// perform vertical cross surface
		for (i = 0; i < this.boundedGridWidth; i += 1) {
			source = leftX + i;
			dest = rightX - i;

			// copy top row to below bottom inverse order
			state = grid[topY][source];
			if (state !== 0) {
				grid[bottomY - 1][dest] = state;

				// set tile grid
				colourTileGrid[(bottomY - 1) >> 4][dest >> 8] |= (1 << (~(dest >> 4) & 15));

				// check for tile boundary
				if (((bottomY - 1) & 15) === 15) {
					colourTileGrid[((bottomY - 1) >> 4) + 1][dest >> 8] |= (1 << (~(dest >> 4) & 15));
				}
			}

			// copy bottom row to above top inverse order
			state = grid[bottomY][source];
			if (state !== 0) {
				grid[topY + 1][dest] = state;

				// set tile grid
				colourTileGrid[(topY + 1) >> 4][dest >> 8] |= (1 << (~(dest >> 4) & 15));

				// check for tile boundary
				if (((topY + 1) & 15) === 0) {
					colourTileGrid[((topY + 1) >> 4) - 1][dest >> 8] |= (1 << (~(dest >> 4) & 15));
				}
			}
		}

		// perform horizontal cross surface
		for (i = 0; i <= this.boundedGridHeight; i += 1) {
			source = bottomY + i;
			dest = topY - i;

			// copy left column to right of right inverse order
			state = grid[source][leftX];
			if (state !== 0) {
				grid[dest][rightX + 1] = state;

				// set tile grid
				colourTileGrid[dest >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

				// check for tile boundary
				if (((rightX + 1) & 15) === 0) {
					colourTileGrid[dest >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
				}
			}

			// copy right column to left of left
			state = grid[source][rightX];
			if (state !== 0) {
				grid[dest][leftX - 1] = state;

				// set tile grid
				colourTileGrid[dest >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));

				// check for tile boundary
				if (((leftX - 1) & 15) === 15) {
					colourTileGrid[dest >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
				}
			}
		}

		// top left corner
		state = grid[topY][leftX];
		grid[topY + 1][leftX - 1] = state;

		// top right corner
		state = grid[topY][rightX];
		grid[topY + 1][rightX + 1] = state;

		// bottom left corner
		state = grid[bottomY][leftX];
		grid[bottomY - 1][leftX - 1] = state;

		// bottom right corner
		state = grid[bottomY][rightX];
		grid[bottomY - 1][rightX + 1] = state;
	};

	// process sphere for multi-state
	Life.prototype.processSphereMS = function(grid) {
		var colourTileGrid = this.colourTileGrid,

		    // bottom left
		    leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // top right
		    rightX = leftX + this.boundedGridWidth - 1,
		    topY = bottomY + this.boundedGridWidth - 1,

		    // counters
		    i = 0,
		    x = 0,
			y = 0,
			state = 0;

		// copy adjacent edges
		for (i = 0; i < this.boundedGridWidth; i += 1) {
			y = bottomY + i;
			x = leftX + i;

			// copy left column to below bottom row
			state = grid[y][leftX];
			if (state !== 0) {
				grid[bottomY - 1][x] = state;

				// set tile grid
				colourTileGrid[(bottomY - 1) >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));

				// check for tile boundary
				if (((bottomY - 1) & 15) === 15) {
					colourTileGrid[((bottomY - 1) >> 4) + 1][x >> 8] |= (1 << (~(x >> 4) & 15));
				}
			}

			// copy right column to above top row
			state = grid[y][rightX];
			if (state !== 0) {
				grid[topY + 1][x] = state;

				// set tile grid
				colourTileGrid[(topY + 1) >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));

				// check for tile boundary
				if (((topY + 1) & 15) === 0) {
					colourTileGrid[((topY + 1) >> 4) - 1][x >> 8] |= (1 << (~(x >> 4) & 15));
				}
			}

			// copy bottom row to left of left column
			state = grid[bottomY][x];
			if (state !== 0) {
				grid[y][leftX - 1] = state;

				// set tile grid
				colourTileGrid[y >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));
				// check for tile boundary
				if (((leftX - 1) & 15) === 15) {
					colourTileGrid[y >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
				}
			}

			// copy top row to right of right column
			state = grid[topY][x];
			if (state !== 0) {
				grid[y][rightX + 1] = state;

				// set tile grid
				colourTileGrid[y >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

				// check for tile boundary
				if (((rightX + 1) & 15) === 0) {
					colourTileGrid[y >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
				}
			}
		}

		// top left corner
		state = grid[topY][leftX];
		grid[topY + 1][leftX - 1] = state;

		// top right corner
		state = grid[topY][rightX];
		grid[topY + 1][rightX + 1] = state;

		// bottom left corner
		state = grid[bottomY][leftX];
		grid[bottomY - 1][leftX - 1] = state;

		// bottom right corner
		state = grid[bottomY][rightX];
		grid[bottomY - 1][rightX + 1] = state;
	};

	// process torus
	Life.prototype.processTorus = function() {
		// life grid
		var grid = null,
		    tileGrid = null,
		    colourTileGrid = this.colourTileGrid,
		    
		    // bounded grid width and height
		    width = this.boundedGridWidth,
		    height = this.boundedGridHeight,

		    // bottom left
		    leftX = Math.round((this.width - width) / 2),
		    bottomY = Math.round((this.height - height) / 2),

		    // top right
		    rightX = leftX + width - 1,
		    topY = bottomY + height - 1,

		    // horizontal and vertical shifts
		    horizShift = this.boundedGridHorizontalShift,
		    vertShift = this.boundedGridVerticalShift,

			// flag if extra horizontal cell is needed for triangular grid
			needExtra = (this.isTriangular && leftX > 0 && rightX < this.width - 1),

		    // counters
		    sourceX = 0,
		    sourceY = 0,
		    destX = 0,
		    destY = 0,
		    i = 0;

		// determine the buffer for current generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			tileGrid = this.nextTileGrid;
		} else {
			grid = this.grid16;
			tileGrid = this.tileGrid;
		}

		// check for infinite width
		if (this.boundedGridWidth === 0) {
			// process whole width
			leftX = 0;
			rightX = this.width - 1;
			width = this.width;
		}

		// check for infinite height
		if (this.boundedGridHeight === 0) {
			// process whole height
			bottomY = 0;
			topY = this.height - 1;
			height = this.height;
		}

		// check for infinite height
		if (this.boundedGridHeight !== 0) {
			// perform vertical wrap
			for (i = 0; i < width; i += 1) {
				// copy top row to below bottom
				sourceX = leftX + i;
				destX = leftX + ((i + horizShift + width) % width);

				// check if cell set
				if ((grid[topY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
					// copy cell to below bottom row
					grid[bottomY - 1][destX >> 4] |= (1 << (~destX & 15));

					// set tile grid
					tileGrid[(bottomY - 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));
					colourTileGrid[(bottomY - 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));

					// check for tile boundary
					if (((bottomY - 1) & 15) === 15) {
						tileGrid[((bottomY - 1) >> 4) + 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
						colourTileGrid[((bottomY - 1) >> 4) + 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
					}
				}

				// copy bottom row to above top
				destX = leftX + ((i - horizShift + width) % width);

				// check if cell set
				if ((grid[bottomY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
					// copy cell to above top row
					grid[topY + 1][destX >> 4] |= (1 << (~destX & 15));

					// set tile grid
					tileGrid[(topY + 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));
					colourTileGrid[(topY + 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));

					// check for tile boundary
					if (((topY + 1) & 15) === 0) {
						tileGrid[((topY + 1) >> 4) - 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
						colourTileGrid[((topY + 1) >> 4) - 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
					}
				}
			}
		}

		// check for infinite width
		if (this.boundedGridWidth !== 0) {
			// perform horizontal wrap
			for (i = 0; i < height; i += 1) {
				// copy left column to right of right
				sourceY = bottomY + i;
				destY = bottomY + ((i - vertShift + height) % height);

				// check if cell set
				if ((grid[sourceY][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
					// copy cell to right of right edge
					grid[destY][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));

					// set tile grid
					tileGrid[destY >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));
					colourTileGrid[destY >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

					// check for tile boundary
					if (((rightX + 1) & 15) === 0) {
						tileGrid[destY >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
						colourTileGrid[destY >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
					}
				}

				// for triangular grids we have to copy two cells
				if (needExtra) {
					leftX += 1;
					rightX += 1;
					// check if cell set
					if ((grid[sourceY][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
						// copy cell to right of right edge
						grid[destY][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));

						// set tile grid
						tileGrid[destY >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));
						colourTileGrid[destY >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

						// check for tile boundary
						if (((rightX + 1) & 15) === 0) {
							tileGrid[destY >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
							colourTileGrid[destY >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
						}
					}
					// restore columns
					leftX -= 1;
					rightX -= 1;
				}

				// copy right column to left of left
				destY = bottomY + ((i + vertShift + height) % height);

				// check if cell set
				if ((grid[sourceY][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
					// copy cell to left of left edge
					grid[destY][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));

					// set tile grid
					tileGrid[destY >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));
					colourTileGrid[destY >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));

					// check for tile boundary
					if (((leftX - 1) & 15) === 15) {
						tileGrid[destY >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
						colourTileGrid[destY >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
					}
				}

				// for triangular grids we have to copy two cells
				if (needExtra) {
					leftX -= 1;
					rightX -= 1;
					// check if cell set
					if ((grid[sourceY][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
						// copy cell to left of left edge
						grid[destY][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
	
						// set tile grid
						tileGrid[destY >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));
						colourTileGrid[destY >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));
	
						// check for tile boundary
						if (((leftX - 1) & 15) === 15) {
							tileGrid[destY >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
							colourTileGrid[destY >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
						}
					}
					// restore columns
					leftX += 1;
					rightX += 1;
				}
			}
		}

		// only process corners if both dimensions are not infinite
		if (this.boundedGridWidth !== 0 && this.boundedGridHeight !== 0) {
			// bottom right corner
			sourceX = leftX + ((-horizShift + width) % width);
			sourceY = bottomY + ((height - 1 + vertShift + height) % height);
			if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				grid[bottomY - 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
			} else {
				grid[bottomY - 1][(rightX + 1) >> 4] &= ~(1 << (~(rightX + 1) & 15));
			}

			// bottom left corner
			sourceX = leftX + ((width - 1 - horizShift + width) % width);
			sourceY = bottomY + ((height - 1 - vertShift + height) % height);
			if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				grid[bottomY - 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
			} else {
				grid[bottomY - 1][(leftX - 1) >> 4] &= ~(1 << (~(leftX - 1) & 15));
			}

			// top right corner
			sourceX = leftX + ((horizShift + width) % width);
			sourceY = bottomY + ((vertShift + height) % height);
			if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				grid[topY + 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
			} else {
				grid[topY + 1][(rightX + 1) >> 4] &= ~(1 << (~(rightX + 1) & 15));
			}

			// top left corner
			sourceX = leftX + ((width - 1 + horizShift + width) % width);
			sourceY = bottomY + ((-vertShift + height) % height);
			if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				grid[topY + 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
			} else {
				grid[topY + 1][(leftX - 1) >> 4] &= ~(1 << (~(leftX - 1) & 15));
			}
		}
	};

	// process klein bottle
	Life.prototype.processKlein = function() {
		// life grid
		var grid = null,
		    tileGrid = null,
		    colourTileGrid = this.colourTileGrid,
		    
		    // bounded grid width and height
		    width = this.boundedGridWidth,
		    height = this.boundedGridHeight,

		    // bottom left
		    leftX = Math.round((this.width - width) / 2),
		    bottomY = Math.round((this.height - height) / 2),

		    // top right
		    rightX = leftX + width - 1,
		    topY = bottomY + height - 1,

		    // horizontal and vertical shifts
		    horizShift = this.boundedGridHorizontalShift,
		    vertShift = this.boundedGridVerticalShift,

		    // horizontal and vertical twists
		    horizTwist = this.boundedGridHorizontalTwist,
		    vertTwist = this.boundedGridVerticalTwist,

		    // counters
		    sourceX = 0,
		    sourceY = 0,
		    destX = 0,
		    destY = 0,
		    i = 0;

		// determine the buffer for current generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			tileGrid = this.nextTileGrid;
		} else {
			grid = this.grid16;
			tileGrid = this.tileGrid;
		}

		// perform vertical wrap
		for (i = 0; i < width; i += 1) {
			// copy top row to below bottom
			sourceX = leftX + i;

			// check for twist
			if (horizTwist) {
				destX = rightX - ((i + horizShift + width) % width);
			} else {
				destX = leftX + ((i + horizShift + width) % width);
			}

			if ((grid[topY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				// copy cell to below bottom
				grid[bottomY - 1][destX >> 4] |= (1 << (~destX & 15));

				// set tile grid
				tileGrid[(bottomY - 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));
				colourTileGrid[(bottomY - 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));

				// check for tile boundary
				if (((bottomY - 1) & 15) === 15) {
					tileGrid[((bottomY - 1) >> 4) + 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
					colourTileGrid[((bottomY - 1) >> 4) + 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
				}
			}

			// copy bottom row to above top
			if (horizTwist) {
				destX = rightX - ((i - horizShift + width) % width);
			} else {
				destX = leftX + ((i - horizShift + width) % width);
			}

			if ((grid[bottomY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				// copy cell to above top
				grid[topY + 1][destX >> 4] |= (1 << (~destX & 15));

				// set tile grid
				tileGrid[(topY + 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));
				colourTileGrid[(topY + 1) >> 4][destX >> 8] |= (1 << (~(destX >> 4) & 15));

				// check for tile boundary
				if (((topY + 1) & 15) === 0) {
					tileGrid[((topY + 1) >> 4) - 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
					colourTileGrid[((topY + 1) >> 4) - 1][destX >> 8] |= (1 << (~(destX >> 4) & 15));
				}
			}
		}

		// perform horizontal wrap
		for (i = 0; i < height; i += 1) {
			// copy left column to right of right
			sourceY = bottomY + i;

			// check for vertical twist
			if (vertTwist) {
				destY = topY - ((i - vertShift + height) % height);
			} else {
				destY = bottomY + ((i - vertShift + height) % height);
			}

			if ((grid[sourceY][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
				// copy cell to right of right edge
				grid[destY][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));

				// set tile grid
				tileGrid[destY >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));
				colourTileGrid[destY >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

				// check for tile boundary
				if (((rightX + 1) & 15) === 0) {
					tileGrid[destY >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
					colourTileGrid[destY >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
				}
			}

			// copy right column to left of left
			if (vertTwist) {
				destY = topY - ((i + vertShift + height) % height);
			} else {
				destY = bottomY + ((i + vertShift + height) % height);
			}

			if ((grid[sourceY][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
				// copy cell to left of left edge
				grid[destY][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));

				// set tile grid
				tileGrid[destY >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));
				colourTileGrid[destY >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));

				// check for tile boundary
				if (((leftX - 1) & 15) === 15) {
					tileGrid[destY >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
					colourTileGrid[destY >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
				}
			}
		}

		// bottom right corner
		if (horizTwist) {
			sourceX = rightX - ((-horizShift + width) % width);
		} else {
			sourceX = leftX + ((-horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((height - 1 + vertShift + height) % height);
		} else {
			sourceY = bottomY + ((height - 1 + vertShift + height) % height);
		}
		if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
			grid[bottomY - 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
		}

		// bottom left corner
		if (horizTwist) {
			sourceX = rightX - ((width - 1 - horizShift + width) % width);
		} else {
			sourceX = leftX + ((width - 1 - horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((height - 1 + vertShift + height) % height);
		} else {
			sourceY = bottomY + ((height - 1 + vertShift + height) % height);
		}
		if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
			grid[bottomY - 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
		}

		// top right corner
		if (horizTwist) {
			sourceX = rightX - ((horizShift + width) % width);
		} else {
			sourceX = leftX + ((horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((vertShift + height) % height);
		} else {
			sourceY = bottomY + ((vertShift + height) % height);
		}
		if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
			grid[topY + 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
		}

		// top left corner
		if (horizTwist) {
			sourceX = rightX - ((width - 1 + horizShift + width) % width);
		} else {
			sourceX = leftX + ((width - 1 + horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((vertShift + height) % height);
		} else {
			sourceY = bottomY + ((vertShift + height) % height);
		}
		if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
			grid[topY + 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
		}
	};

	// process cross-surface
	Life.prototype.processCrossSurface = function() {
		// life grid
		var grid = null,
		    tileGrid = null,
		    colourTileGrid = this.colourTileGrid,

		    // bottom left
		    leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // top right
		    rightX = leftX + this.boundedGridWidth - 1,
		    topY = bottomY + this.boundedGridHeight - 1,

		    // counters
		    i = 0,
		    source = 0,
		    dest = 0;

		// determine the buffer for current generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			tileGrid = this.nextTileGrid;
		} else {
			grid = this.grid16;
			tileGrid = this.tileGrid;
		}

		// perform vertical cross surface
		for (i = 0; i < this.boundedGridWidth; i += 1) {
			source = leftX + i;
			dest = rightX - i;

			// copy top row to below bottom inverse order
			if ((grid[topY][source >> 4] & (1 << (~source & 15))) !== 0) {
				grid[bottomY - 1][dest >> 4] |= (1 << (~dest & 15));

				// set tile grid
				tileGrid[(bottomY - 1) >> 4][dest >> 8] |= (1 << (~(dest >> 4) & 15));
				colourTileGrid[(bottomY - 1) >> 4][dest >> 8] |= (1 << (~(dest >> 4) & 15));

				// check for tile boundary
				if (((bottomY - 1) & 15) === 15) {
					tileGrid[((bottomY - 1) >> 4) + 1][dest >> 8] |= (1 << (~(dest >> 4) & 15));
					colourTileGrid[((bottomY - 1) >> 4) + 1][dest >> 8] |= (1 << (~(dest >> 4) & 15));
				}
			}

			// copy bottom row to above top inverse order
			if ((grid[bottomY][source >> 4] & (1 << (~source & 15))) !== 0) {
				grid[topY + 1][dest >> 4] |= (1 << (~dest & 15));

				// set tile grid
				tileGrid[(topY + 1) >> 4][dest >> 8] |= (1 << (~(dest >> 4) & 15));
				colourTileGrid[(topY + 1) >> 4][dest >> 8] |= (1 << (~(dest >> 4) & 15));

				// check for tile boundary
				if (((topY + 1) & 15) === 0) {
					tileGrid[((topY + 1) >> 4) - 1][dest >> 8] |= (1 << (~(dest >> 4) & 15));
					colourTileGrid[((topY + 1) >> 4) - 1][dest >> 8] |= (1 << (~(dest >> 4) & 15));
				}
			}
		}

		// perform horizontal cross surface
		for (i = 0; i <= this.boundedGridHeight; i += 1) {
			source = bottomY + i;
			dest = topY - i;

			// copy left column to right of right inverse order
			if ((grid[source][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
				grid[dest][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));

				// set tile grid
				tileGrid[dest >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));
				colourTileGrid[dest >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

				// check for tile boundary
				if (((rightX + 1) & 15) === 0) {
					tileGrid[dest >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
					colourTileGrid[dest >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
				}
			}

			// copy right column to left of left
			if ((grid[source][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
				grid[dest][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));

				// set tile grid
				tileGrid[dest >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));
				colourTileGrid[dest >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));

				// check for tile boundary
				if (((leftX - 1) & 15) === 15) {
					tileGrid[dest >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
					colourTileGrid[dest >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
				}
			}
		}

		// top left corner
		if ((grid[topY][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
			grid[topY + 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
		}

		// top right corner
		if ((grid[topY][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
			grid[topY + 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
		}

		// bottom left corner
		if ((grid[bottomY][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
			grid[bottomY - 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
		}

		// bottom right corner
		if ((grid[bottomY][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
			grid[bottomY - 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
		}
	};

	// process sphere
	Life.prototype.processSphere = function() {
		// life grid
		var grid = null,
		    tileGrid = null,
		    colourTileGrid = this.colourTileGrid,

		    // bottom left
		    leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // top right
		    rightX = leftX + this.boundedGridWidth - 1,
		    topY = bottomY + this.boundedGridWidth - 1,

		    // counters
		    i = 0,
		    x = 0,
		    y = 0;

		// determine the buffer for current generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			tileGrid = this.nextTileGrid;
		} else {
			grid = this.grid16;
			tileGrid = this.tileGrid;
		}

		// copy adjacent edges
		for (i = 0; i < this.boundedGridWidth; i += 1) {
			y = bottomY + i;
			x = leftX + i;

			// copy left column to below bottom row
			if ((grid[y][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
				grid[bottomY - 1][x >> 4] |= (1 << (~x & 15));

				// set tile grid
				tileGrid[(bottomY - 1) >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
				colourTileGrid[(bottomY - 1) >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));

				// check for tile boundary
				if (((bottomY - 1) & 15) === 15) {
					tileGrid[((bottomY - 1) >> 4) + 1][x >> 8] |= (1 << (~(x >> 4) & 15));
					colourTileGrid[((bottomY - 1) >> 4) + 1][x >> 8] |= (1 << (~(x >> 4) & 15));
				}
			}

			// copy right column to above top row
			if ((grid[y][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
				grid[topY + 1][x >> 4] |= (1 << (~x & 15));

				// set tile grid
				tileGrid[(topY + 1) >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
				colourTileGrid[(topY + 1) >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));

				// check for tile boundary
				if (((topY + 1) & 15) === 0) {
					tileGrid[((topY + 1) >> 4) - 1][x >> 8] |= (1 << (~(x >> 4) & 15));
					colourTileGrid[((topY + 1) >> 4) - 1][x >> 8] |= (1 << (~(x >> 4) & 15));
				}
			}

			// copy bottom row to left of left column
			if ((grid[bottomY][x >> 4] & (1 << (~x & 15))) !== 0) {
				grid[y][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));

				// set tile grid
				tileGrid[y >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));
				colourTileGrid[y >> 4][(leftX - 1) >> 8] |= (1 << (~((leftX - 1) >> 4) & 15));
				// check for tile boundary
				if (((leftX - 1) & 15) === 15) {
					tileGrid[y >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
					colourTileGrid[y >> 4][(leftX + 15) >> 8] |= (1 << (~((leftX + 15) >> 4) & 15));
				}
			}

			// copy top row to right of right column
			if ((grid[topY][x >> 4] & (1 << (~x & 15))) !== 0) {
				grid[y][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));

				// set tile grid
				tileGrid[y >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));
				colourTileGrid[y >> 4][(rightX + 1) >> 8] |= (1 << (~((rightX + 1) >> 4) & 15));

				// check for tile boundary
				if (((rightX + 1) & 15) === 0) {
					tileGrid[y >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
					colourTileGrid[y >> 4][(rightX - 15) >> 8] |= (1 << (~((rightX - 15) >> 4) & 15));
				}
			}
		}

		// top left corner
		if ((grid[topY][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
			grid[topY + 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
		}

		// top right corner
		if ((grid[topY][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
			grid[topY + 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
		}

		// bottom left corner
		if ((grid[bottomY][leftX >> 4] & (1 << (~leftX & 15))) !== 0) {
			grid[bottomY - 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
		}

		// bottom right corner
		if ((grid[bottomY][rightX >> 4] & (1 << (~rightX & 15))) !== 0) {
			grid[bottomY - 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
		}
	};

	// post-process bounded grid
	Life.prototype.postProcessBoundedGrid = function(statsOn) {
		var i = 1,
			limit = 1;

		// determine grid type
		if (this.boundedGridType !== 0) {
			limit = 2;
		}
		
		// check for triangular grid
		if (this.isTriangular) {
			limit += 1;
		}

		// clear boundaries
		for (i = 1; i <= limit + 1; i += 1) {
			this.clearBoundary(i, statsOn);
		}
	};

	// pre-process bounded grid
	Life.prototype.preProcessBoundedGrid = function() {
		var colourGrid = this.colourGrid;

		// alternate colour grids for PCA rules
		if (this.isPCA || this.isRuleTree) {
			if ((this.counter & 1) !== 0) {
				colourGrid = this.nextColourGrid;
			}
			this.drawBoundedGridBorder(colourGrid, 0);
		}

		// set tiles on boundary
		this.setBoundedTiles();

		// determine grid type
		switch (this.boundedGridType) {
		case 0:
			// plane so nothing to do
			break;
		case 1:
			// torus
			if (this.isPCA || this.isRuleTree) {
				this.processTorusMS(colourGrid);
			} else {
				this.processTorus();
			}
			break;
		case 2:
			// klein bottle
			if (this.isPCA || this.isRuleTree) {
				this.processKleinMS(colourGrid);
			} else {
				this.processKlein();
			}
			break;
		case 3:
			// cross-surface
			if (this.isPCA || this.isRuleTree) {
				this.processCrossSurfaceMS(colourGrid);
			} else {
				this.processCrossSurface();
			}
			break;
		case 4:
			// sphere
			if (this.isPCA || this.isRuleTree) {
				this.processSphereMS(colourGrid);
			} else {
				this.processSphere();
			}
			break;
		}

		// set tiles on boundary
		this.setBoundedTiles();
	};

	// compute the next generation unless rule is none
	Life.prototype.nextGeneration = function(statsOn, noHistory, graphDisabled, identify) {
		// do nothing if rule is none
		if (!this.isNone) {
			this.processNextGen(statsOn, noHistory, graphDisabled, identify);
		} else {
			this.anythingAlive = 1;
			this.counter += 1;
		}
	};

	// compute the next generation with or without statistics
	Life.prototype.processNextGen = function(statsOn, noHistory, graphDisabled, identify) {
		var performSave = false,
		    zoomBox = this.zoomBox,
			historyBox = this.historyBox,
			boundarySize = 16;

		// turn stats on unless graph disabled or identify running
		if (!graphDisabled || identify) {
			statsOn = true;
		}

		// check if snapshot should be saved
		if (this.counter === this.nextSnapshotTarget - 1) {
			// save snapshot after next generation computed
			performSave = true;

			// check if history is on
			if (!noHistory) {
				// turn stats on since save will actually happen
				statsOn = true;
			}
		}

		// perform bounded grid pre-processing unless rule is HROT
		if (this.boundedGridType !== -1 && !this.isHROT) {
			this.preProcessBoundedGrid();
		}

		// check if state 6 is on
		if (this.state6Mask) {
			// pre-process for state 6
			this.state6Pre();
		}

		// check if any bitmap cells are alive
		if (this.anythingAlive) {
			// check for RuleTable rule
			if (this.isRuleTree) {
				if (this.ruleTableOutput === null) {
					this.nextGenerationRuleTreeTile();
				} else {
					this.nextGenerationRuleTableTile();
				}
			} else {
				if (this.isPCA) {
					this.nextGenerationPCATile();
				} else {
					if (this.isHROT) {
						// compute HROT next generation
						this.HROT.nextGenerationHROT(this.counter);
					} else {
						// stats are required if they are on but not for multi-state rules which compute their own stats
						if (statsOn && this.multiNumStates < 2) {
							if (this.isMargolus) {
								this.nextGenerationMargolusTile();
							} else {
								if (this.isTriangular) {
									this.nextGenerationTriTile();
								} else {
									this.nextGenerationTile();
								}
							}
						} else {
							if (this.isMargolus) {
								this.nextGenerationOnlyMargolusTile();
							} else {
								if (this.isTriangular) {
									this.nextGenerationOnlyTriTile();
								} else {
									this.nextGenerationOnlyTile();
								}
							}
						}
					}
				}
			}
		}

		// increment generation count
		this.counter += 1;

		// adjust PCA/Margolus generation based on playback direction
		if (this.isMargolus || this.isPCA) {
			if (this.reverseMargolus) {
				this.counterMargolus -= 1;
			} else {
				this.counterMargolus += 1;
			}
			// update maximum Margolus generation reached (used for PASTE EVERY)
			if (this.counterMargolus > this.maxMargolusGen) {
				this.maxMargolusGen = this.counterMargolus;
			}
		}

		// check for Generations
		if (this.multiNumStates !== -1 && !this.isHROT && !this.isPCA && !this.isRuleTree) {
			this.nextGenerationGenerations();
		}

		// check if state 6 is on
		if (this.state6Mask) {
			// post-process for state 6
			this.state6Post();
		}

		// perform bounded grid post-processing
		if (this.boundedGridType !== -1 && !this.isHROT) {
			this.postProcessBoundedGrid(statsOn);
		}

		// clear boundary if maximum grid size
		if (this.width === this.maxGridSize) {
			// check for LtL or HROT
			if (this.isHROT) {
				boundarySize = this.HROT.range * 2;
			} else {
				boundarySize = 16;
			}
			// check if the pattern is near a boundary
			if (zoomBox.leftX <= boundarySize || zoomBox.rightX >= (this.maxGridSize - boundarySize) || zoomBox.bottomY <= boundarySize || zoomBox.topY >= (this.maxGridSize - boundarySize)) {
				// clear grid boundary
				if (this.isHROT) {
					this.clearHRBoundary();
				} else {
					this.clearGridBoundary();
				}
			}
		}

		// save snapshot if required
		if (performSave) {
			// update the next snapshot generation
			this.nextSnapshotTarget += LifeConstants.snapshotInterval;

			// check if history is on
			if (!noHistory) {
				// save the snapshot
				this.saveSnapshot();
			}
		}

		// update history bounding box
		if (zoomBox.leftX < historyBox.leftX) {
			historyBox.leftX = zoomBox.leftX;
		}
		if (zoomBox.rightX > historyBox.rightX) {
			historyBox.rightX = zoomBox.rightX;
		}
		if (zoomBox.bottomY < historyBox.bottomY) {
			historyBox.bottomY = zoomBox.bottomY;
		}
		if (zoomBox.topY > historyBox.topY) {
			historyBox.topY = zoomBox.topY;
		}

		// update population graph if stats are on
		if (this.counter < LifeConstants.maxPopSamples) {
			if (statsOn) {
				this.savePopulationData(this.population, this.births, this.deaths);
				if (this.population > this.maxPopValue) {
					this.maxPopValue = this.population;
				}
				if (this.births > this.maxPopValue) {
					this.maxPopValue = this.births;
				}
				if (this.deaths > this.maxPopValue) {
					this.maxPopValue = this.deaths;
				}
			} else {
				this.savePopulationData(0, 0, 0);
			}
		}
	};

	// save population data
	Life.prototype.savePopulationData = function(population, births, deaths) {
		var popChunk = this.counter >> LifeConstants.popChunkPower,
			popOffset = this.counter & ((1 << LifeConstants.popChunkPower) - 1);

		if (this.popGraphData && this.popGraphData.length > 0) {
			// see if a new chunk needs to be allocated
			if (this.counter >= this.popGraphEntries) {
				// allocate new chunk
				Array.addRow(this.popGraphData, 0, "Life.popGraphData");
				Array.addRow(this.birthGraphData, 0, "Life.birthGraphData");
				Array.addRow(this.deathGraphData, 0, "Life.deathGraphData");
				this.popGraphEntries += (1 << LifeConstants.popChunkPower);
			}
			this.popGraphData[popChunk][popOffset] = population;
			this.birthGraphData[popChunk][popOffset] = births;
			this.deathGraphData[popChunk][popOffset] = deaths;
		}
	};

	// draw graph
	Life.prototype.renderGraph = function(ctx, graphCol, displayX, graphHeight, borderX, borderY, borderAxis, graphData, lines) {
		var i = 0, x = 0, y = 0,
		    index = 0, next = 0, inc = 1,
			minVal = 0, maxVal, nextVal = 0,
			popChunk = 0, popOffset = 0,
			popMask = (1 << LifeConstants.popChunkPower) - 1;

		// check if increment is needed
		if (this.counter > displayX) {
			inc = displayX / this.counter;
		}

		// check for lines
		if (lines) {
			ctx.strokeStyle = graphCol;
			ctx.beginPath();
			y = (graphHeight - graphHeight * (graphData[0] / this.maxPopValue)) | 0;
			ctx.moveTo(borderX + borderAxis + 0.5, y + borderY + borderAxis + 0.5);
		} else {
			ctx.fillStyle = graphCol;
		}

		// draw graph
		next = 0;
		index = 1;
		for (i = 1; i < displayX; i += 1) {
			// get the next graph data point
			if (index < LifeConstants.maxPopSamples) {
				popChunk = index >> LifeConstants.popChunkPower;
				popOffset = index & popMask;
				minVal = graphData[popChunk][popOffset];
				maxVal = minVal;
				next = next + inc;
				index = index + 1;
				while ((next | 0) === 0) {
					nextVal = graphData[index];
					index = index + 1;
					if (nextVal > maxVal) {
						maxVal = nextVal;
					}
					if (nextVal < minVal) {
						minVal = nextVal;
					}
					next = next + inc;
				}
				next = next - 1;
			} else {
				minVal = 0;
				maxVal = 0;
			}

			// check if there is data for this point
			if (i <= this.counter) {
				x = borderX + borderAxis + 1 + i;
				y = (graphHeight - graphHeight * (minVal / this.maxPopValue)) | 0;
				// check whether using lines or points
				if (lines) {
					// drawing lines
					ctx.lineTo(x + 0.5, y + borderY + borderAxis + 0.5);

					// check if there was a range of values at this sample point
					if (minVal !== maxVal) {
						y = (graphHeight - graphHeight * (maxVal / this.maxPopValue)) | 0;
						ctx.lineTo(x + 0.5, y + borderY + borderAxis + 0.5);
					}
				} else {
					// drawing points
					if (minVal > 0 && maxVal > 0) {
						// single value so draw point
						if (minVal === maxVal) {
							ctx.fillRect(x + 0.5, y + borderY + borderAxis + 0.5, 1, 1);
						} else {
							y = (graphHeight - graphHeight * (maxVal / this.maxPopValue)) | 0;
							ctx.fillRect(x + 0.5, y + borderY + borderAxis + 0.5, 1, 1);
						}
					}
				}
			}
		}

		if (lines) {
			ctx.stroke();
		}
	};

	// draw population data
	Life.prototype.drawPopGraph = function(lines, opacity, fullScreen, thumbnail, view) {
		var ctx = this.context,
			xScale = view.viewMenu.xScale,
			yScale = view.viewMenu.yScale,
		    borderX = 0, borderY = 48 * yScale,
		    borderAxis = 40 * xScale,
		    graphWidth = this.displayWidth - borderX - borderAxis,
		    graphHeight = this.displayHeight - borderY - borderAxis,
		    displayX = 0,
			i = 0,
		    graphBgColor = "rgb(" + this.graphBgColor[0] + "," + this.graphBgColor[1] + "," + this.graphBgColor[2] + ")",
		    graphAxisColor = "rgb(" + this.graphAxisColor[0] + "," + this.graphAxisColor[1] + "," + this.graphAxisColor[2] + ")",
		    graphAliveColor = "rgb(" + this.graphAliveColor[0] + "," + this.graphAliveColor[1] + "," + this.graphAliveColor[2] + ")",
		    graphBirthColor = "rgb(" + this.graphBirthColor[0] + "," + this.graphBirthColor[1] + "," + this.graphBirthColor[2] + ")",
		    graphDeathColor = "rgb(" + this.graphDeathColor[0] + "," + this.graphDeathColor[1] + "," + this.graphDeathColor[2] + ")";

		// check if data exists
		if (this.popGraphData && this.popGraphData.length > 0) {
			// check for full screen
			if (fullScreen || thumbnail) {
				borderY = 0;
				graphHeight += borderY * 2;
			}
			if (thumbnail) {
				borderAxis = 0;
				graphWidth = this.displayWidth - borderX;
			}

			// compute number of samples
			displayX = graphWidth - borderX - borderAxis;

			// save context
			ctx.save();

			// draw background
			ctx.fillStyle = graphBgColor;
			ctx.globalAlpha = opacity;
			ctx.fillRect(borderX, borderY, graphWidth + borderAxis, graphHeight);
			ctx.globalAlpha = 1;
			if (fullScreen) {
				graphHeight -= borderY;
			}

			// draw labels
			if (!thumbnail) {
				ctx.font = ((16 * xScale) | 0) + "px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "black";
				for (i = 2; i >= 0; i -= 2) {
					ctx.save();
					ctx.translate(this.displayWidth / 2, graphHeight + borderAxis / 2 - ((6 * xScale) | 0));
					ctx.fillText("Generation", i, i);
					ctx.restore();
					ctx.save();
					ctx.translate(borderX + borderAxis / 2 + ((6 * xScale) | 0), this.displayHeight / 2);
					ctx.rotate(-90 * Math.PI / 180);
					if (this.displayHeight < 320) {
						ctx.fillText("Pop", i, i);
					} else {
						ctx.fillText("Population", i, i);
					}
					ctx.restore();
					ctx.fillStyle = graphAxisColor;
				}

				// draw axes values
				ctx.fillStyle = "black";
				for (i = 2; i >= 0; i -= 2) {
					ctx.save();
					ctx.translate(borderX + borderAxis - borderAxis / 2 + ((6 * xScale) | 0), borderY + borderAxis);
					ctx.rotate(-90 * Math.PI / 180);
					ctx.fillText(String(this.maxPopValue), i, i);
					ctx.restore();
					ctx.save();
					ctx.translate(borderX + borderAxis - borderAxis / 2 + ((6 * xScale) | 0), graphHeight);
					ctx.rotate(-90 * Math.PI / 180);
					ctx.fillText("0", i, i);
					ctx.restore();
					ctx.save();
					ctx.translate(borderX + borderAxis, graphHeight + borderAxis / 2 - ((6 * xScale) | 0));
					ctx.fillText("0", i, i);
					ctx.restore();
					ctx.save();
					ctx.translate(graphWidth, graphHeight + borderAxis / 2 - ((6 * xScale) | 0));
					ctx.fillText(String(this.counter > displayX ? this.counter : (displayX | 0)), i, i);
					ctx.restore();
					ctx.fillStyle = graphAxisColor;
				}
			}

			// only draw births and deaths if grid is not bounded
			if (this.boundedGridType === -1) {
				// draw deaths
				this.renderGraph(ctx, graphDeathColor, displayX, graphHeight - borderY - borderAxis, borderX, borderY, borderAxis, this.deathGraphData, lines);

				// draw births
				this.renderGraph(ctx, graphBirthColor, displayX, graphHeight - borderY - borderAxis, borderX, borderY, borderAxis, this.birthGraphData, lines);
			}

			// draw population
			this.renderGraph(ctx, graphAliveColor, displayX, graphHeight - borderY - borderAxis, borderX, borderY, borderAxis, this.popGraphData, lines);

			// draw axes
			ctx.strokeStyle = graphAxisColor;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(borderX + borderAxis + 0.5, borderY + borderAxis + 0.5);
			ctx.lineTo(borderX + borderAxis + 0.5, graphHeight + 0.5);
			ctx.lineTo(graphWidth + 0.5, graphHeight + 0.5);
			ctx.lineTo(graphWidth + 0.5, graphHeight + 0.5 + 2);
			ctx.moveTo(borderX + borderAxis + 0.5, graphHeight + 0.5);
			ctx.lineTo(borderX + borderAxis + 0.5, graphHeight + 0.5 + 2);
			ctx.moveTo(borderX + borderAxis + 0.5, graphHeight + 0.5);
			ctx.lineTo(borderX + borderAxis + 0.5 - 2, graphHeight + 0.5);
			ctx.moveTo(borderX + borderAxis + 0.5, borderY + borderAxis + 0.5);
			ctx.lineTo(borderX + borderAxis + 0.5 - 2, borderY + borderAxis + 0.5);
			ctx.stroke();

			// restore context
			ctx.restore();
		}
	};

	// reset population data
	Life.prototype.resetPopulationData = function() {
		var popChunk = 0,
			popOffset = 0,
			popMask = (1 << LifeConstants.popChunkPower) - 1,
			i = 0;

		// clear population graph data
		if (this.popGraphData && this.popGraphData.length > 0) {
			for (i = 0; i < this.popGraphEntries; i += 1) {
				popChunk = i >> LifeConstants.popChunkPower;
				popOffset = i & popMask;
				this.popGraphData[popChunk][popOffset] = 0;
				this.birthGraphData[popChunk][popOffset] = 0;
				this.deathGraphData[popChunk][popOffset] = 0;
			}

			// set initial population
			this.popGraphData[0][0] = this.population;
		}

		// reset maximum population
		this.maxPopValue = this.population;
	};

	// reset history box
	Life.prototype.resetHistoryBox = function() {
		var zoomBox = this.zoomBox,
		    historyBox = this.historyBox;

		historyBox.leftX = zoomBox.leftX;
		historyBox.rightX = zoomBox.rightX;
		historyBox.topY = zoomBox.topY;
		historyBox.bottomY = zoomBox.bottomY;
	};

	// state 6 mask pre function
	Life.prototype.state6Pre = function() {
		var th = 0,
		    tw = 0,
		    b = 0,
		    y = 0,
		    bottomY = 0,
		    leftX = 0,

		    // 16bit view of grid
		    grid16 = null,

		    // state6 masks
		    mask = this.state6Mask,
		    aliveMask = this.state6Alive,
		    cells = this.state6Cells,

		    // state 6 tile grid
		    state6TileGrid = this.state6TileGrid,

		    // tile row
		    tileRow = null,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // current tile group
		    tiles = 0,

		    // tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1;

		// set initial tile row
		bottomY = 0;
		
		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid16 = this.nextGrid16;
		} else {
			grid16 = this.grid16;
		}

		// check each tile
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the next tile row
			tileRow = state6TileGrid[th];

			// scan the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// process the tiles in the group
					for (b = 15; b >= 0; b -= 1) {
						// check if the tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// process the tile
							for (y = bottomY; y < bottomY + 16; y += 1) {
								aliveMask[y][leftX] = (grid16[y][leftX] | cells[y][leftX]) & mask[y][leftX];
							}
						}

						// next tile column
						leftX += xSize;
					}
				} else {
					// skip tile group
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
		}
	};

	// state 6 mask pre function
	Life.prototype.state6Post = function() {
		var th = 0,
		    tw = 0,
		    b = 0,
		    y = 0,
		    bottomY = 0,
		    leftX = 0,

		    // 16bit view of grid
		    nextGrid16 = null,

		    // state6 masks
		    aliveMask = this.state6Alive,

		    // state 6 tile grid
		    state6TileGrid = this.state6TileGrid,

		    // tile row
		    tileRow = null,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // current tile group
		    tiles = 0,

		    // tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			nextGrid16 = this.nextGrid16;
		} else {
			nextGrid16 = this.grid16;
		}

		// set initial tile row
		bottomY = 0;
		
		// check each tile
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the next tile row
			tileRow = state6TileGrid[th];

			// scan the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// process the tiles in the group
					for (b = 15; b >= 0; b -= 1) {
						// check if the tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// process the tile
							for (y = bottomY; y < bottomY + 16; y += 1) {
								nextGrid16[y][leftX] &= ~aliveMask[y][leftX];
							}
						}

						// next tile column
						leftX += xSize;
					}
				} else {
					// skip tile group
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
		}
	};

	// remove pattern starting at a given cell
	Life.prototype.removePattern = function(x, y, grid16) {
		var tx = 0,
		    ty = 0,

		    // number of pages
		    pages = this.boundaryPages,

		    // current page
		    page = 0,

		    // boundary cell stack
		    bx = this.boundaryX[page],
		    by = this.boundaryY[page],
		    index = 0,

		    // maximum buffer size
		    max = LifeConstants.removePatternBufferSize,

		    // page mask
		    mask = max - 1,
		    
		    // start and end of current page
		    start = 0,
		    end = max,

		    // boundary cell radius
		    radius = this.removePatternRadius,

		    // width and height mask
		    widthMask = this.widthMask,
		    heightMask = this.heightMask;

		// stack the current cell
		bx[index] = x;
		by[index] = y;
		index += 1;

		// remove the cell
		grid16[y][x >> 4] &= ~(1 << (~x & 15));

		// keep going until all cells processed
		while (index > 0) {
			// get the next cell
			index -= 1;

			// check for previous page
			if (index < start) {
				// switch to previous page
				page -= 1;
				start -= max;
				end -= max;

				// get the page array
				bx = this.boundaryX[page];
				by = this.boundaryY[page];
			}
			x = bx[index & mask];
			y = by[index & mask];

			// check the surrounding cells
			ty = y - radius;
			while (ty <= y + radius) {
				tx = x - radius;
				while (tx <= x + radius) {
					// check cell is on grid
					if (tx === (tx & widthMask) && ty === (ty & heightMask)) {
						// check if cell set
						if ((grid16[ty][tx >> 4] & (1 << (~tx & 15))) !== 0) {
							// remove the cell
							grid16[ty][tx >> 4] &= ~(1 << (~tx & 15));

							// stack the cell
							if (index === end) {
								// switch to next page
								page += 1;
								start += max;
								end += max;

								// check if page is allocated
								if (page > pages) {
									// allocate new page
									this.boundaryX[page] = this.allocator.allocate(Int32, max, "Life.boundaryX" + page);
									this.boundaryY[page] = this.allocator.allocate(Int32, max, "Life.boundaryY" + page);

									// save new page
									pages += 1;
									this.boundaryPages = pages;
								}

								// get the page array
								bx = this.boundaryX[page];
								by = this.boundaryY[page];
							}

							// save the cell
							bx[index & mask] = tx;
							by[index & mask] = ty;
							index += 1;
						}
					}
					tx += 1;
				}
				ty += 1;
			}
		}
	};

	// remove pattern at top or bottom
	Life.prototype.removePatternY = function(x16, y, grid16) {
		// source word
		var source = grid16[y][x16],

		    // check each bit
		    x = 15;

		while (x >= 0) {
			if ((source & (1 << x)) !== 0) {
				// remove pattern
				this.removePattern((x16 << 4) + (~x & 15), y, grid16);
			}
			x -= 1;
		}
	};

	// remove pattern at left
	Life.prototype.removePatternLeft = function(x16, y, grid16) {
		// compute starting x
		var x = (x16 << 4);

		// remove pattern
		this.removePattern(x, y, grid16);
	};

	// remove pattern at right
	Life.prototype.removePatternRight = function(x16, y, grid16) {
		// compute starting x
		var x = (x16 << 4) + 15;

		// remove pattern
		this.removePattern(x, y, grid16);
	};

	// remove patterns that touch the boundary
	Life.prototype.clearGridBoundary = function() {
		// 16bit view of grid
		var grid16 = null,

		    // height and width
		    ht = 0,
		    wt = 0,

		    // counters
		    w = 0,
		    h = 0,

		    // top and bottom row
		    topGridRow = null,
		    bottomGridRow = null,

		    // bit masks
		    leftMask = 1 << 15,
		    rightMask = 1 << 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			// use grid
			grid16 = this.nextGrid16;
		} else {
			// use next grid
			grid16 = this.grid16;
		}

		// get the width and height
		ht = grid16.length;
		wt = grid16[0].length;

		// get the top and bottom rows
		topGridRow = grid16[0];
		bottomGridRow = grid16[ht - 1];

		// check the rows
		w = 0;
		while (w < wt) {
			// check the top row
			if (topGridRow[w]) {
				this.removePatternY(w, 0, grid16);
			}

			// check the bottom row
			if (bottomGridRow[w]) {
				this.removePatternY(w, ht - 1, grid16);
			}

			// next column
			w += 1;
		}

		// check the left and right columns
		h = 0;
		while (h < ht) {
			// check the left column
			if ((grid16[h][0] & leftMask) !== 0) {
				this.removePatternLeft(0, h, grid16);
			}

			// check the right column
			if ((grid16[h][wt - 1] & rightMask) !== 0) {
				this.removePatternRight(wt - 1, h, grid16);
			}
			
			// next row
			h += 1;
		}
	};

	// remove multi-state pattern starting at a given cell
	Life.prototype.removeMSPattern = function(x, y) {
		var tx = 0,
		    ty = 0,

			// multi-state grid
			colourGrid = this.colourGrid,
			colourRow = null,

		    // number of pages
		    pages = this.boundaryPages,

		    // current page
		    page = 0,

		    // boundary cell stack
		    bx = this.boundaryX[page],
		    by = this.boundaryY[page],
		    index = 0,

		    // maximum buffer size
		    max = LifeConstants.removePatternBufferSize,

		    // page mask
		    mask = max - 1,
		    
		    // start and end of current page
		    start = 0,
			end = max,
			
			// masks for width and height
			widthMask = this.widthMask,
			heightMask = this.heightMask,

			// alive state
			alive = (this.multiNumStates > 2 ? 0 : LifeConstants.aliveStart),
			dead = (this.multiNumStates > 2 ? 0 : LifeConstants.deadStart),

		    // boundary cell radius
			radius = this.removePatternRadius;

		// stack the current cell
		bx[index] = x;
		by[index] = y;
		index += 1;

		// remove the cell
		colourGrid[y][x] = 0;

		// keep going until all cells processed
		while (index > 0) {
			// get the next cell
			index -= 1;

			// check for previous page
			if (index < start) {
				// switch to previous page
				page -= 1;
				start -= max;
				end -= max;

				// get the page array
				bx = this.boundaryX[page];
				by = this.boundaryY[page];
			}
			x = bx[index & mask];
			y = by[index & mask];

			// check the surrounding cells
			ty = y - radius;
			while (ty <= y + radius) {
				tx = x - radius;
				colourRow = colourGrid[ty];
				while (tx <= x + radius) {
					// check cell is on grid
					if (tx === (tx & widthMask) && ty === (ty & heightMask)) {
						// check if cell set
						if (colourRow[tx] >= alive) {
							// remove the cell
							colourRow[tx] = dead;
							
							// stack the cell
							if (index === end) {
								// switch to next page
								page += 1;
								start += max;
								end += max;

								// check if page is allocated
								if (page > pages) {
									// allocate new page
									this.boundaryX[page] = this.allocator.allocate(Int32, max, "Life.boundaryX" + page);
									this.boundaryY[page] = this.allocator.allocate(Int32, max, "Life.boundaryY" + page);

									// save new page
									pages += 1;
									this.boundaryPages = pages;
								}

								// get the page array
								bx = this.boundaryX[page];
								by = this.boundaryY[page];
							}

							// save the cell
							bx[index & mask] = tx;
							by[index & mask] = ty;
							index += 1;
						}
					}
					tx += 1;
				}
				ty += 1;
			}
		}
	};

	// remove HROT patterns that touch the boundary
	Life.prototype.clearHRBoundary = function() {
		// grid
		var colourGrid = this.colourGrid,
			colourRow = null,

			// height and width
			ht = colourGrid.length,
			wd = colourGrid[0].length,

			// used grid
			zoomBox = this.zoomBox,
			leftX = zoomBox.leftX,
			rightX = zoomBox.rightX,
			bottomY = zoomBox.bottomY,
			topY = zoomBox.topY,

			// range
			range = this.HROT.range * 2 + 1,

			// alive and dead states
			alive = (this.multiNumStates > 2 ? 0 : LifeConstants.aliveStart),

			// counters
			x = 0,
			y = 0;

		// clear top boundary
		if ((ht - topY) <= range) {
			for (y = ht - range; y <= topY; y += 1) {
				colourRow = colourGrid[y];
				for (x = leftX; x <= rightX; x += 1) {
					if (colourRow[x] >= alive) {
						this.removeMSPattern(x, y);
					}
				}
			}
			zoomBox.topY = ht - range;
		}

		// clear bottom boundary
		if (bottomY <= range) {
			for (y = bottomY; y <= range; y += 1) {
				colourRow = colourGrid[y];
				for (x = leftX; x <= rightX; x += 1) {
					if (colourRow[x] >= alive) {
						this.removeMSPattern(x, y);
					}
				}
			}
			zoomBox.bottomY = range;
		}

		// clear left boundary
		if (leftX <= range) {
			for (y = bottomY; y <= topY; y += 1) {
				colourRow = colourGrid[y];
				for (x = leftX; x <= range; x += 1) {
					if (colourRow[x] >= alive) {
						this.removeMSPattern(x, y);
					}
				}
			}
			zoomBox.leftX = range;
		}

		// clear right boundary
		if ((wd - rightX) <= range) {
			for (y = bottomY; y <= topY; y += 1) {
				colourRow = colourGrid[y];
				for (x = wd - range; x <= rightX; x += 1) {
					if (colourRow[x] >= alive) {
						this.removeMSPattern(x, y);
					}
				}
			}
			zoomBox.rightX = wd - range;
		}
	};
	
	// update the life grid region using tiles for triangular grid
	Life.prototype.nextGenerationTriTile = function() {
		var indexLookup = this.indexLookupTri1,
		    gridRow0 = null,
		    gridRow1 = null,
		    gridRow2 = null,
		    h = 0, b = 0, swap = 0,
		    val0 = 0, val1 = 0, val2 = 0, output = 0, th = 0, tw = 0,
			grid = null, nextGrid = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
		    bottomY = 0, topY = 0, leftX = 0,

		    // which cells were set in source
		    origValue = 0,

		    // whether cells were set in the tile
		    tileCells = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
		    colOccupied = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
		    width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0,

		    // starting and ending tile row
		    tileStartRow = 0,
			tileEndRow = tileRows,
			
			// left, middle and right bitmasks for rule lookup
			/** @const{number} */ maskL = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8),
			/** @const{number} */ maskC = (1 << 7) | (1 << 6) | (1 << 5),
			/** @const{number} */ maskR = (1 << 4) | (1 << 3) | (1 << 2) | (1 << 1) | (1 << 0),

		    // bit counts for population
		    bitCounts16 = this.bitCounts16,

		    // population statistics
		    population = 0, births = 0, deaths = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			nextGrid = this.grid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;

			// get alternate lookup buffer if specified
			if (this.altSpecified) {
				indexLookup = this.indexLookupTri2;
			}
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// check start and end row are in range
		if (tileStartRow < 0) {
			tileStartRow = 0;
		}
		if (tileEndRow > tileRows) {
			tileEndRow = tileRows;
		}

		// set the initial tile row
		bottomY = tileStartRow << this.tilePower;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << b)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							h = bottomY;

							// deal with bottom row of the grid
							if (h === 0) {
								gridRow0 = this.blankRow;
							} else {
								gridRow0 = grid[h - 1];
							}

							// current row
							gridRow1 = grid[h];

							// next row
							gridRow2 = grid[h + 1];

							// get original value (used for top row only and then to determine if any cells were alive in tile)
							origValue = gridRow1[leftX];

							// mix of original cells and cells computed in this tile
							tileCells = origValue;

							// process normal tile
							val0 = (gridRow0[leftX - 1] << 18) | (gridRow0[leftX] << 2) | (gridRow0[leftX + 1] >> 14);
							val1 = (gridRow1[leftX - 1] << 18) | (origValue << 2) | (gridRow1[leftX + 1] >> 14);
							val2 = (gridRow2[leftX - 1] << 18) | (gridRow2[leftX] << 2) | (gridRow2[leftX + 1] >> 14);

							// get output
							output = indexLookup[((val0 >> 7) & maskL) | ((val2 >> 11) & maskC) | ((val1 >> 15) & maskR)] << 15;
							output |= indexLookup[((val2 >> 6) & maskL) | ((val0 >> 10) & maskC) | ((val1 >> 14) & maskR)] << 14;
							output |= indexLookup[((val0 >> 5) & maskL) | ((val2 >> 9) & maskC) | ((val1 >> 13) & maskR)] << 13;
							output |= indexLookup[((val2 >> 4) & maskL) | ((val0 >> 8) & maskC) | ((val1 >> 12) & maskR)] << 12;
							output |= indexLookup[((val0 >> 3) & maskL) | ((val2 >> 7) & maskC) | ((val1 >> 11) & maskR)] << 11;
							output |= indexLookup[((val2 >> 2) & maskL) | ((val0 >> 6) & maskC) | ((val1 >> 10) & maskR)] << 10;
							output |= indexLookup[((val0 >> 1) & maskL) | ((val2 >> 5) & maskC) | ((val1 >> 9) & maskR)] << 9;
							output |= indexLookup[((val2 >> 0) & maskL) | ((val0 >> 4) & maskC) | ((val1 >> 8) & maskR)] << 8;
							output |= indexLookup[((val0 << 1) & maskL) | ((val2 >> 3) & maskC) | ((val1 >> 7) & maskR)] << 7;
							output |= indexLookup[((val2 << 2) & maskL) | ((val0 >> 2) & maskC) | ((val1 >> 6) & maskR)] << 6;
							output |= indexLookup[((val0 << 3) & maskL) | ((val2 >> 1) & maskC) | ((val1 >> 5) & maskR)] << 5;
							output |= indexLookup[((val2 << 4) & maskL) | ((val0 >> 0) & maskC) | ((val1 >> 4) & maskR)] << 4;
							output |= indexLookup[((val0 << 5) & maskL) | ((val2 << 1) & maskC) | ((val1 >> 3) & maskR)] << 3;
							output |= indexLookup[((val2 << 6) & maskL) | ((val0 << 2) & maskC) | ((val1 >> 2) & maskR)] << 2;
							output |= indexLookup[((val0 << 7) & maskL) | ((val2 << 3) & maskC) | ((val1 >> 1) & maskR)] << 1;
							output |= indexLookup[((val2 << 8) & maskL) | ((val0 << 4) & maskC) | ((val1 >> 0) & maskR)] << 0;

							// save output 16bits
							nextGrid[h][leftX] = output;

							// update statistics
							population += bitCounts16[output];
							births += bitCounts16[output & ~origValue];
							deaths += bitCounts16[origValue & ~output];

							// check if any cells are set
							if (output) {
								// update column occupied flag
								colOccupied |= output;

								// update min and max row
								if (h < newBottomY) {
									newBottomY = h;
								}
								if (h > newTopY) {
									newTopY = h;
								}

								// check for left column now set (need two cells)
								if ((output & 49152) !== 0) {
									neighbours |= LifeConstants.bottomLeftSet;
								}

								// check for right column now set (need two cells)
								if ((output & 3) !== 0) {
									neighbours |= LifeConstants.bottomRightSet;
								}

								// bottom row set
								neighbours |= LifeConstants.bottomSet;
							}

							// process middle rows of the tile
							h += 1;
							while (h < topY - 1) {
								// get original value for next row
								origValue = gridRow2[leftX];
								tileCells |= origValue;

								// next row
								gridRow2 = grid[h + 1];
	
								// read three rows
								val0 = val1;
								val1 = val2;
								val2 = (gridRow2[leftX - 1] << 18) | (gridRow2[leftX] << 2) | (gridRow2[leftX + 1] >> 14);
	
								// check for odd/even
								if ((h & 1) !== 0) {
									swap = val0;
									val0 = val2;
									val2 = swap;
								}

								// get output
								output = indexLookup[((val0 >> 7) & maskL) | ((val2 >> 11) & maskC) | ((val1 >> 15) & maskR)] << 15;
								output |= indexLookup[((val2 >> 6) & maskL) | ((val0 >> 10) & maskC) | ((val1 >> 14) & maskR)] << 14;
								output |= indexLookup[((val0 >> 5) & maskL) | ((val2 >> 9) & maskC) | ((val1 >> 13) & maskR)] << 13;
								output |= indexLookup[((val2 >> 4) & maskL) | ((val0 >> 8) & maskC) | ((val1 >> 12) & maskR)] << 12;
								output |= indexLookup[((val0 >> 3) & maskL) | ((val2 >> 7) & maskC) | ((val1 >> 11) & maskR)] << 11;
								output |= indexLookup[((val2 >> 2) & maskL) | ((val0 >> 6) & maskC) | ((val1 >> 10) & maskR)] << 10;
								output |= indexLookup[((val0 >> 1) & maskL) | ((val2 >> 5) & maskC) | ((val1 >> 9) & maskR)] << 9;
								output |= indexLookup[((val2 >> 0) & maskL) | ((val0 >> 4) & maskC) | ((val1 >> 8) & maskR)] << 8;
								output |= indexLookup[((val0 << 1) & maskL) | ((val2 >> 3) & maskC) | ((val1 >> 7) & maskR)] << 7;
								output |= indexLookup[((val2 << 2) & maskL) | ((val0 >> 2) & maskC) | ((val1 >> 6) & maskR)] << 6;
								output |= indexLookup[((val0 << 3) & maskL) | ((val2 >> 1) & maskC) | ((val1 >> 5) & maskR)] << 5;
								output |= indexLookup[((val2 << 4) & maskL) | ((val0 >> 0) & maskC) | ((val1 >> 4) & maskR)] << 4;
								output |= indexLookup[((val0 << 5) & maskL) | ((val2 << 1) & maskC) | ((val1 >> 3) & maskR)] << 3;
								output |= indexLookup[((val2 << 6) & maskL) | ((val0 << 2) & maskC) | ((val1 >> 2) & maskR)] << 2;
								output |= indexLookup[((val0 << 7) & maskL) | ((val2 << 3) & maskC) | ((val1 >> 1) & maskR)] << 1;
								output |= indexLookup[((val2 << 8) & maskL) | ((val0 << 4) & maskC) | ((val1 >> 0) & maskR)] << 0;

								// update statistics
								population += bitCounts16[output];
								births += bitCounts16[output & ~origValue];
								deaths += bitCounts16[origValue & ~output];

								// check for odd/even
								if ((h & 1) !== 0) {
									swap = val0;
									val0 = val2;
									val2 = swap;
								}

								// save output 16bits
								nextGrid[h][leftX] = output;
	
								// check if any cells are set
								if (output) {
									// update column occupied flag
									colOccupied |= output;
	
									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h > newTopY) {
										newTopY = h;
									}
								}

								// next row
								h += 1;
							}

							// get original value
							origValue = gridRow2[leftX];
							tileCells |= origValue;

							// deal with top row
							if (h === this.height - 1) {
								gridRow2 = this.blankRow;
							} else {
								gridRow2 = grid[h + 1];
							}

							// read three rows
							val0 = val1;
							val1 = val2;
							val2 = (gridRow2[leftX - 1] << 18) | (gridRow2[leftX] << 2) | (gridRow2[leftX + 1] >> 14);

							// check for odd/even
							if ((h & 1) !== 0) {
								swap = val0;
								val0 = val2;
								val2 = swap;
							}

							// get output
							output = indexLookup[((val0 >> 7) & maskL) | ((val2 >> 11) & maskC) | ((val1 >> 15) & maskR)] << 15;
							output |= indexLookup[((val2 >> 6) & maskL) | ((val0 >> 10) & maskC) | ((val1 >> 14) & maskR)] << 14;
							output |= indexLookup[((val0 >> 5) & maskL) | ((val2 >> 9) & maskC) | ((val1 >> 13) & maskR)] << 13;
							output |= indexLookup[((val2 >> 4) & maskL) | ((val0 >> 8) & maskC) | ((val1 >> 12) & maskR)] << 12;
							output |= indexLookup[((val0 >> 3) & maskL) | ((val2 >> 7) & maskC) | ((val1 >> 11) & maskR)] << 11;
							output |= indexLookup[((val2 >> 2) & maskL) | ((val0 >> 6) & maskC) | ((val1 >> 10) & maskR)] << 10;
							output |= indexLookup[((val0 >> 1) & maskL) | ((val2 >> 5) & maskC) | ((val1 >> 9) & maskR)] << 9;
							output |= indexLookup[((val2 >> 0) & maskL) | ((val0 >> 4) & maskC) | ((val1 >> 8) & maskR)] << 8;
							output |= indexLookup[((val0 << 1) & maskL) | ((val2 >> 3) & maskC) | ((val1 >> 7) & maskR)] << 7;
							output |= indexLookup[((val2 << 2) & maskL) | ((val0 >> 2) & maskC) | ((val1 >> 6) & maskR)] << 6;
							output |= indexLookup[((val0 << 3) & maskL) | ((val2 >> 1) & maskC) | ((val1 >> 5) & maskR)] << 5;
							output |= indexLookup[((val2 << 4) & maskL) | ((val0 >> 0) & maskC) | ((val1 >> 4) & maskR)] << 4;
							output |= indexLookup[((val0 << 5) & maskL) | ((val2 << 1) & maskC) | ((val1 >> 3) & maskR)] << 3;
							output |= indexLookup[((val2 << 6) & maskL) | ((val0 << 2) & maskC) | ((val1 >> 2) & maskR)] << 2;
							output |= indexLookup[((val0 << 7) & maskL) | ((val2 << 3) & maskC) | ((val1 >> 1) & maskR)] << 1;
							output |= indexLookup[((val2 << 8) & maskL) | ((val0 << 4) & maskC) | ((val1 >> 0) & maskR)] << 0;

							// update statistics
							population += bitCounts16[output];
							births += bitCounts16[output & ~origValue];
							deaths += bitCounts16[origValue & ~output];

							// check for odd/even
							if ((h & 1) !== 0) {
								swap = val0;
								val0 = val2;
								val2 = swap;
							}

							// save output 16bits
							nextGrid[h][leftX] = output;

							// check if any cells are set
							if (output) {
								// update column occupied flag
								colOccupied |= output;

								// update min and max row
								if (h < newBottomY) {
									newBottomY = h;
								}
								if (h > newTopY) {
									newTopY = h;
								}

								// check for left column now set
								if ((output & 49152) !== 0) {
									neighbours |= LifeConstants.topLeftSet;
								}

								// check for right column now set
								if ((output & 3) !== 0) {
									neighbours |= LifeConstants.topRightSet;
								}

								// top row set
								neighbours |= LifeConstants.topSet;
							}

							// check which columns contained cells
							if (colOccupied) {
								// check for left column set (need two cells)
								if ((colOccupied & 49152) !== 0) {
									neighbours |= LifeConstants.leftSet;
								}

								// check for right column set (need two cells)
								if ((colOccupied & 3) !== 0) {
									neighbours |= LifeConstants.rightSet;
								}
							}

							// save the column occupied cells
							columnOccupied16[leftX] |= colOccupied;

							// check if the source or output were alive
							if (colOccupied || tileCells) {
								// update 
								nextTiles |= (1 << b);

								// check for neighbours
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (b < 15) {
											nextTiles |= (1 << (b + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (b > 0) {
											nextTiles |= (1 << (b - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << b);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << b);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (b < 15) {
											belowNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
	};

	// update the life grid region using tiles for Margolus grid
	Life.prototype.nextGenerationMargolusTile = function() {
		var indexLookup = this.margolusLookup1,
		    h = 0, b = 0,
			val0 = 0, val1 = 0, output = 0, th = 0, tw = 0,
			output0 = 0, output1 = 0,
			grid = null, nextGrid = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
		    bottomY = 0, topY = 0, leftX = 0,

		    // which cells were set in source
		    origValue = 0,

			// whether on right tile column
			rightTile = false,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
		    colOccupied = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
		    width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
			neighbours = 0,

		    // bit counts for population
		    bitCounts16 = this.bitCounts16,

		    // population statistics
			population = 0, births = 0, deaths = 0,
			
			// counter for even/odd
			counter = this.counter & 1;

		// check for change in playback direction
		if (this.reversePending) {
			this.reverseMargolus = !this.reverseMargolus;
			this.reversePending = false;
		}

		// switch buffers each generation
		if (counter !== 0) {
			grid = this.nextGrid16;
			nextGrid = this.grid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;

			// check for reverse playback
			if (this.reverseMargolus) {
				if (this.altSpecified) {
					indexLookup = this.margolusReverseLookup1;
				} else {
					indexLookup = this.margolusReverseLookup1;
				}
			}
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
			if (this.altSpecified) {
				indexLookup = this.margolusLookup2;
			}

			// check for reverse playback
			if (this.reverseMargolus) {
				if (this.altSpecified) {
					indexLookup = this.margolusReverseLookup2;
				} else {
					indexLookup = this.margolusReverseLookup1;
				}
			}
		}

		// invert odd/even for reverse playback
		if (this.reverseMargolus) {
			counter = 1 - counter;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// set the initial tile row
		bottomY = 1 - counter;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (b = 15; b >= 0; b -= 1) {
						// check if on right tile
						if (b === 0 && tw === tileCols16 - 1) {
							rightTile = true;
						} else {
							rightTile = false;
						}

						// check if this tile needs computing
						if ((tiles & (1 << b)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// check for even/odd phase
							if (counter !== 0) {
								// even phase
								// process bottom row
								h = bottomY;

								// get original value for next two rows
								val0 = grid[h][leftX];
								val1 = grid[h + 1][leftX];
								origValue = (val0 | val1);

								// get output
								output = indexLookup[(val0 & 65280) | (val1 >> 8)];
								output0 = output & 65280;
								output1 = (output & 255) << 8;
								output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
								output0 |= (output >> 8);
								output1 |= (output & 255);

								// save output 16bits
								nextGrid[h][leftX] = output0;
								nextGrid[h + 1][leftX] = output1;

								// update statistics
								population += bitCounts16[output0];
								births += bitCounts16[output0 & ~val0];
								deaths += bitCounts16[val0 & ~output0];
								population += bitCounts16[output1];
								births += bitCounts16[output1 & ~val1];
								deaths += bitCounts16[val1 & ~output1];
	
								// check if any cells are set
								output = output0 | output1;
								if (output) {
									// update column occupied flag
									colOccupied |= output;

									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h + 1 > newTopY) {
										newTopY = h + 1;
									}

									// check for left column now set
									if ((output & 49152) !== 0) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
	
									// check for right column now set
									if ((output & 3) !== 0) {
										neighbours |= LifeConstants.bottomRightSet;
									}
	
									// bottom row set
									neighbours |= LifeConstants.bottomSet;
								}

								// process middle rows of the tile
								h += 2;
								while (h < topY - 2) {
									// get original value for next two rows
									val0 = grid[h][leftX];
									val1 = grid[h + 1][leftX];
									origValue |= (val0 | val1);
	
									// get output
									output = indexLookup[(val0 & 65280) | (val1 >> 8)];
									output0 = output & 65280;
									output1 = (output & 255) << 8;
									output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
									output0 |= (output >> 8);
									output1 |= (output & 255);
	
									// save output 16bits
									nextGrid[h][leftX] = output0;
									nextGrid[h + 1][leftX] = output1;
	
									// update statistics
									population += bitCounts16[output0];
									births += bitCounts16[output0 & ~val0];
									deaths += bitCounts16[val0 & ~output0];
									population += bitCounts16[output1];
									births += bitCounts16[output1 & ~val1];
									deaths += bitCounts16[val1 & ~output1];

									// check if any cells are set
									output = output0 | output1;
									if (output) {
										// update column occupied flag
										colOccupied |= output;
		
										// update min and max row
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h + 1 > newTopY) {
											newTopY = h + 1;
										}
									}
	
									// next row
									h += 2;
								}
	
								// process top row
								val0 = grid[h][leftX];
								val1 = grid[h + 1][leftX];
								origValue |= (val0 | val1);
	
								// get output
								output = indexLookup[(val0 & 65280) | (val1 >> 8)];
								output0 = output & 65280;
								output1 = (output & 255) << 8;
								output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
								output0 |= (output >> 8);
								output1 |= (output & 255);
	
								// save output 16bits
								nextGrid[h][leftX] = output0;
								nextGrid[h + 1][leftX] = output1;
	
								// update statistics
								population += bitCounts16[output0];
								births += bitCounts16[output0 & ~val0];
								deaths += bitCounts16[val0 & ~output0];
								population += bitCounts16[output1];
								births += bitCounts16[output1 & ~val1];
								deaths += bitCounts16[val1 & ~output1];

								// check if any cells are set
								output = output0 | output1;
								if (output) {
									// update column occupied flag
									colOccupied |= output;
	
									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h + 1 > newTopY) {
										newTopY = h + 1;
									}
	
									// check for left column now set
									if (output) {
										if ((output & 49152) !== 0) {
											neighbours |= LifeConstants.topLeftSet;
										}
	
										// check for right column now set
										if ((output & 3) !== 0) {
											neighbours |= LifeConstants.topRightSet;
										}
	
										// top row set
										neighbours |= LifeConstants.topSet;
									}
								}

								// check which columns contained cells
								if (colOccupied) {
									// check for right column set in this tile or left column set in right hand tile
									if ((colOccupied & 49152) !== 0) {
										neighbours |= LifeConstants.leftSet;
									}
									if ((colOccupied & 3) !== 0) {
										neighbours |= LifeConstants.rightSet;
									}

									// save the column occupied cells
									columnOccupied16[leftX] |= colOccupied;
								}

								// if there were new cells or original cells then ensure right and top right get processed next generation
								if (colOccupied || origValue) {
									neighbours |= LifeConstants.topRightSet;
									neighbours |= LifeConstants.rightSet;
								}
							} else {
								// odd phase
								// process bottom row
								h = bottomY;

								// check for right hand tile
								if (rightTile) {
									// get original value for next two rows
									val0 = (grid[h][leftX] << 1) & 65535;
									val1 = (grid[h + 1][leftX] << 1) & 65535;
								} else {
									// get original value for next two rows
									val0 = ((grid[h][leftX] << 1) | (grid[h][leftX + 1] >> 15)) & 65535;
									val1 = ((grid[h + 1][leftX] << 1) | (grid[h + 1][leftX + 1] >> 15)) & 65535;
								}
								origValue = (val0 | val1);

								// get output
								output = indexLookup[(val0 & 65280) | (val1 >> 8)];
								output0 = output & 65280;
								output1 = (output & 255) << 8;
								output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
								output0 |= (output >> 8);
								output1 |= (output & 255);

								// save output 16bits
								if (rightTile) {
									nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
									nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
								} else {
									nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
									nextGrid[h][leftX + 1] = (nextGrid[h][leftX + 1] & 32767) | ((output0 & 1) << 15);
									nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
									nextGrid[h + 1][leftX + 1] = (nextGrid[h + 1][leftX + 1] & 32767) | ((output1 & 1) << 15);
								}

								// update statistics
								population += bitCounts16[output0];
								births += bitCounts16[output0 & ~val0];
								deaths += bitCounts16[val0 & ~output0];
								population += bitCounts16[output1];
								births += bitCounts16[output1 & ~val1];
								deaths += bitCounts16[val1 & ~output1];
								
								// check if any cells are set
								output = output0 | output1;
								if (output) {
									// update column occupied flag
									colOccupied |= output;

									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h + 1 > newTopY) {
										newTopY = h + 1;
									}

									// there is no neighbour below since this is the odd phase
								}

								// process middle rows of the tile
								h += 2;
								while (h < topY - 2) {
									// get original value for next two rows
									if (rightTile) {
										val0 = (grid[h][leftX] << 1) & 65535;
										val1 = (grid[h + 1][leftX] << 1)  & 65535;
									} else {
										val0 = ((grid[h][leftX] << 1) | (grid[h][leftX + 1] >> 15)) & 65535;
										val1 = ((grid[h + 1][leftX] << 1) | (grid[h + 1][leftX + 1] >> 15)) & 65535;
									}
									origValue |= (val0 | val1);
	
									// get output
									output = indexLookup[(val0 & 65280) | (val1 >> 8)];
									output0 = output & 65280;
									output1 = (output & 255) << 8;
									output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
									output0 |= (output >> 8);
									output1 |= (output & 255);
	
									// save output 16bits
									if (rightTile) {
										nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
										nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
									} else {
										nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
										nextGrid[h][leftX + 1] = (nextGrid[h][leftX + 1] & 32767) | ((output0 & 1) << 15);
										nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
										nextGrid[h + 1][leftX + 1] = (nextGrid[h + 1][leftX + 1] & 32767) | ((output1 & 1) << 15);
									}

									// update statistics
									population += bitCounts16[output0];
									births += bitCounts16[output0 & ~val0];
									deaths += bitCounts16[val0 & ~output0];
									population += bitCounts16[output1];
									births += bitCounts16[output1 & ~val1];
									deaths += bitCounts16[val1 & ~output1];
									
									// check if any cells are set
									output = output0 | output1;
									if (output) {
										// update column occupied flag
										colOccupied |= output;
		
										// update min and max row
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h + 1 > newTopY) {
											newTopY = h + 1;
										}
									}
	
									// next row
									h += 2;
								}

								// process top row
								if (rightTile) {
									val0 = (grid[h][leftX] << 1) & 65535;
									val1 = (grid[h + 1][leftX] << 1) & 65535;
								} else {
									val0 = ((grid[h][leftX] << 1) | (grid[h][leftX + 1] >> 15)) & 65535;
									val1 = ((grid[h + 1][leftX] << 1) | (grid[h + 1][leftX + 1] >> 15)) & 65535;
								}
								origValue |= (val0 | val1);

								// get output
								output = indexLookup[(val0 & 65280) | (val1 >> 8)];
								output0 = output & 65280;
								output1 = (output & 255) << 8;
								output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
								output0 |= (output >> 8);
								output1 |= (output & 255);

								// save output 16bits
								if (rightTile) {
									nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
									nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
								} else {
									nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
									nextGrid[h][leftX + 1] = (nextGrid[h][leftX + 1] & 32767) | ((output0 & 1) << 15);
									nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
									nextGrid[h + 1][leftX + 1] = (nextGrid[h + 1][leftX + 1] & 32767) | ((output1 & 1) << 15);
								}

								// update statistics
								population += bitCounts16[output0];
								births += bitCounts16[output0 & ~val0];
								deaths += bitCounts16[val0 & ~output0];
								population += bitCounts16[output1];
								births += bitCounts16[output1 & ~val1];
								deaths += bitCounts16[val1 & ~output1];
								
								// check if any cells are set
								output = output0 | output1;
								if (output) {
									// update column occupied flag
									colOccupied |= output;
	
									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h + 1 > newTopY) {
										newTopY = h + 1;
									}
	
									// check for right column set in this tile or left column set in right hand tile
									if ((output & 3) !== 0) {
										neighbours |= LifeConstants.topRightSet;
									}
	
									// top row set
									neighbours |= LifeConstants.topSet;
								}
								
								if (val0 | val1) {
									if (((val0 | val1) & 3) !== 0) {
										neighbours |= LifeConstants.topRightSet;
									}
									neighbours |= LifeConstants.topSet;
								}

								// check which columns contained cells
								if (colOccupied) {
									// check for right column set in this tile or left column set in right hand tile
									if ((colOccupied & 3) !== 0) {
										neighbours |= LifeConstants.rightSet;
									}

									// save the column occupied cells
									columnOccupied16[leftX] |= colOccupied >> 1;
									columnOccupied16[leftX + 1] |= ((colOccupied & 1) << 15);
								}

								if ((origValue & 3) !== 0) {
									neighbours |= LifeConstants.rightSet;
								}
							}
				
							// check if the source or output were alive
							if (colOccupied || origValue) {
								// update 
								nextTiles |= (1 << b);

								// check for neighbours
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (b < 15) {
											nextTiles |= (1 << (b + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (b > 0) {
											nextTiles |= (1 << (b - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << b);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << b);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (b < 15) {
											belowNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
			if (topY >= height) {
				topY = height - 1;
			}
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
	};

	// update the life grid region using tiles for Margolus grid (no stats)
	Life.prototype.nextGenerationOnlyMargolusTile = function() {
		var indexLookup = this.margolusLookup1,
		    h = 0, b = 0,
			val0 = 0, val1 = 0, output = 0, th = 0, tw = 0,
			output0 = 0, output1 = 0,
			grid = null, nextGrid = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
		    bottomY = 0, topY = 0, leftX = 0,

		    // which cells were set in source
		    origValue = 0,

			// whether on right tile column
			rightTile = false,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
		    colOccupied = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
		    width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
			neighbours = 0,
			
			// counter for even/odd
			counter = this.counter & 1;

		// check for change in playback direction
		if (this.reversePending) {
			this.reverseMargolus = !this.reverseMargolus;
			this.reversePending = false;
		}

		// switch buffers each generation
		if (counter !== 0) {
			grid = this.nextGrid16;
			nextGrid = this.grid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;

			// check for reverse playback
			if (this.reverseMargolus) {
				if (this.altSpecified) {
					indexLookup = this.margolusReverseLookup1;
				} else {
					indexLookup = this.margolusReverseLookup1;
				}
			}
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
			if (this.altSpecified) {
				indexLookup = this.margolusLookup2;
			}

			// check for reverse playback
			if (this.reverseMargolus) {
				if (this.altSpecified) {
					indexLookup = this.margolusReverseLookup2;
				} else {
					indexLookup = this.margolusReverseLookup1;
				}
			}
		}

		// invert odd/even for reverse playback
		if (this.reverseMargolus) {
			counter = 1 - counter;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// set the initial tile row
		bottomY = 1 - counter;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (b = 15; b >= 0; b -= 1) {
						// check if on right tile
						if (b === 0 && tw === tileCols16 - 1) {
							rightTile = true;
						} else {
							rightTile = false;
						}

						// check if this tile needs computing
						if ((tiles & (1 << b)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// check for even/odd phase
							if (counter !== 0) {
								// even phase
								// process bottom row
								h = bottomY;
								origValue = 0;

								// get original value for next two rows
								val0 = grid[h][leftX];
								val1 = grid[h + 1][leftX];
								origValue |= (val0 | val1);

								// get output
								output = indexLookup[(val0 & 65280) | (val1 >> 8)];
								output0 = output & 65280;
								output1 = (output & 255) << 8;
								output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
								output0 |= (output >> 8);
								output1 |= (output & 255);

								// save output 16bits
								nextGrid[h][leftX] = output0;
								nextGrid[h + 1][leftX] = output1;

								// check if any cells are set
								output = output0 | output1;
								if (output) {
									// update column occupied flag
									colOccupied |= output;

									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h + 1 > newTopY) {
										newTopY = h + 1;
									}

									// check for left column now set
									if (output) {
										if ((output & 49152) !== 0) {
											neighbours |= LifeConstants.bottomLeftSet;
										}
	
										// check for right column now set
										if ((output & 3) !== 0) {
											neighbours |= LifeConstants.bottomRightSet;
										}
	
										// bottom row set
										neighbours |= LifeConstants.bottomSet;
									}
								}

								// process middle rows of the tile
								h += 2;
								while (h < topY - 2) {
									// get original value for next two rows
									val0 = grid[h][leftX];
									val1 = grid[h + 1][leftX];
									origValue |= (val0 | val1);
	
									// get output
									output = indexLookup[(val0 & 65280) | (val1 >> 8)];
									output0 = output & 65280;
									output1 = (output & 255) << 8;
									output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
									output0 |= (output >> 8);
									output1 |= (output & 255);
	
									// save output 16bits
									nextGrid[h][leftX] = output0;
									nextGrid[h + 1][leftX] = output1;
	
									// check if any cells are set
									output = output0 | output1;
									if (output) {
										// update column occupied flag
										colOccupied |= output;
		
										// update min and max row
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h + 1 > newTopY) {
											newTopY = h + 1;
										}
									}
	
									// next row
									h += 2;
								}
	
								// process top row
								val0 = grid[h][leftX];
								val1 = grid[h + 1][leftX];
								origValue |= (val0 | val1);
	
								// get output
								output = indexLookup[(val0 & 65280) | (val1 >> 8)];
								output0 = output & 65280;
								output1 = (output & 255) << 8;
								output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
								output0 |= (output >> 8);
								output1 |= (output & 255);
	
								// save output 16bits
								nextGrid[h][leftX] = output0;
								nextGrid[h + 1][leftX] = output1;
	
								// check if any cells are set
								output = output0 | output1;
								if (output) {
									// update column occupied flag
									colOccupied |= output;
	
									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h + 1 > newTopY) {
										newTopY = h + 1;
									}
	
									// check for left column now set
									if (output) {
										if ((output & 49152) !== 0) {
											neighbours |= LifeConstants.topLeftSet;
										}
	
										// check for right column now set
										if ((output & 3) !== 0) {
											neighbours |= LifeConstants.topRightSet;
										}
	
										// top row set
										neighbours |= LifeConstants.topSet;
									}
								}

								// check which columns contained cells
								if (colOccupied) {
									// check for right column set in this tile or left column set in right hand tile
									if ((colOccupied & 49152) !== 0) {
										neighbours |= LifeConstants.leftSet;
									}
									if ((colOccupied & 3) !== 0) {
										neighbours |= LifeConstants.rightSet;
									}

									// save the column occupied cells
									columnOccupied16[leftX] |= colOccupied;
								}

								// if there were new cells or original cells then ensure right and top right get processed next generation
								if (colOccupied || origValue) {
									neighbours |= LifeConstants.topRightSet;
									neighbours |= LifeConstants.rightSet;
								}
							} else {
								// odd phase
								// process bottom row
								h = bottomY;
								origValue = 0;

								// check for right hand tile
								if (rightTile) {
									// get original value for next two rows
									val0 = (grid[h][leftX] << 1) & 65535;
									val1 = (grid[h + 1][leftX] << 1) & 65535;
								} else {
									// get original value for next two rows
									val0 = ((grid[h][leftX] << 1) | (grid[h][leftX + 1] >> 15)) & 65535;
									val1 = ((grid[h + 1][leftX] << 1) | (grid[h + 1][leftX + 1] >> 15)) & 65535;
								}
								origValue |= (val0 | val1);

								// get output
								output = indexLookup[(val0 & 65280) | (val1 >> 8)];
								output0 = output & 65280;
								output1 = (output & 255) << 8;
								output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
								output0 |= (output >> 8);
								output1 |= (output & 255);

								// save output 16bits
								if (rightTile) {
									nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
									nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
								} else {
									nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
									nextGrid[h][leftX + 1] = (nextGrid[h][leftX + 1] & 32767) | ((output0 & 1) << 15);
									nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
									nextGrid[h + 1][leftX + 1] = (nextGrid[h + 1][leftX + 1] & 32767) | ((output1 & 1) << 15);
								}

								// check if any cells are set
								output = output0 | output1;
								if (output) {
									// update column occupied flag
									colOccupied |= output;

									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h + 1 > newTopY) {
										newTopY = h + 1;
									}

									// there is no neighbour below since this is the odd phase
								}

								// process middle rows of the tile
								h += 2;
								while (h < topY - 2) {
									// get original value for next two rows
									if (rightTile) {
										val0 = (grid[h][leftX] << 1) & 65535;
										val1 = (grid[h + 1][leftX] << 1)  & 65535;
									} else {
										val0 = ((grid[h][leftX] << 1) | (grid[h][leftX + 1] >> 15)) & 65535;
										val1 = ((grid[h + 1][leftX] << 1) | (grid[h + 1][leftX + 1] >> 15)) & 65535;
									}
									origValue |= (val0 | val1);
	
									// get output
									output = indexLookup[(val0 & 65280) | (val1 >> 8)];
									output0 = output & 65280;
									output1 = (output & 255) << 8;
									output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
									output0 |= (output >> 8);
									output1 |= (output & 255);
	
									// save output 16bits
									if (rightTile) {
										nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
										nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
									} else {
										nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
										nextGrid[h][leftX + 1] = (nextGrid[h][leftX + 1] & 32767) | ((output0 & 1) << 15);
										nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
										nextGrid[h + 1][leftX + 1] = (nextGrid[h + 1][leftX + 1] & 32767) | ((output1 & 1) << 15);
									}

									// check if any cells are set
									output = output0 | output1;
									if (output) {
										// update column occupied flag
										colOccupied |= output;
		
										// update min and max row
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h + 1 > newTopY) {
											newTopY = h + 1;
										}
									}
	
									// next row
									h += 2;
								}

								// process top row
								if (rightTile) {
									val0 = (grid[h][leftX] << 1) & 65535;
									val1 = (grid[h + 1][leftX] << 1) & 65535;
								} else {
									val0 = ((grid[h][leftX] << 1) | (grid[h][leftX + 1] >> 15)) & 65535;
									val1 = ((grid[h + 1][leftX] << 1) | (grid[h + 1][leftX + 1] >> 15)) & 65535;
								}
								origValue |= (val0 | val1);

								// get output
								output = indexLookup[(val0 & 65280) | (val1 >> 8)];
								output0 = output & 65280;
								output1 = (output & 255) << 8;
								output = indexLookup[(val0 & 255) << 8 | (val1 & 255)];
								output0 |= (output >> 8);
								output1 |= (output & 255);

								// save output 16bits
								if (rightTile) {
									nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
									nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
								} else {
									nextGrid[h][leftX] = (nextGrid[h][leftX] & 32768) | (output0 >> 1);
									nextGrid[h][leftX + 1] = (nextGrid[h][leftX + 1] & 32767) | ((output0 & 1) << 15);
									nextGrid[h + 1][leftX] = (nextGrid[h + 1][leftX] & 32768) | (output1 >> 1);
									nextGrid[h + 1][leftX + 1] = (nextGrid[h + 1][leftX + 1] & 32767) | ((output1 & 1) << 15);
								}

								// check if any cells are set
								output = output0 | output1;
								if (output) {
									// update column occupied flag
									colOccupied |= output;
	
									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h + 1 > newTopY) {
										newTopY = h + 1;
									}
	
									// check for right column set in this tile or left column set in right hand tile
									if ((output & 3) !== 0) {
											neighbours |= LifeConstants.topRightSet;
									}
	
									// top row set
									neighbours |= LifeConstants.topSet;
								}

								if (val0 | val1) {
									if (((val0 | val1) & 3) !== 0) {
										neighbours |= LifeConstants.topRightSet;
									}
									neighbours |= LifeConstants.topSet;
								}

								// check which columns contained cells
								if (colOccupied) {
									// check for right column set in this tile or left column set in right hand tile
									if ((colOccupied & 3) !== 0) {
										neighbours |= LifeConstants.rightSet;
									}

									// save the column occupied cells
									columnOccupied16[leftX] |= colOccupied >> 1;
									columnOccupied16[leftX + 1] |= ((colOccupied & 1) << 15);
								}

								// if original had right most cell set this is actually the left cell of the tile to the right
								if ((origValue & 1) !== 0) {
									neighbours |= LifeConstants.rightSet;
								}
							}

							// check if the source or output were alive
							if (colOccupied || origValue) {
								// update 
								nextTiles |= (1 << b);

								// check for neighbours
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (b < 15) {
											nextTiles |= (1 << (b + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (b > 0) {
											nextTiles |= (1 << (b - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << b);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << b);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (b < 15) {
											belowNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
			if (topY >= height) {
				topY = height - 1;
			}
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);
	};

	// update the life grid region using tiles for triangular grid (no stats)
	Life.prototype.nextGenerationOnlyTriTile = function() {
		var indexLookup = this.indexLookupTri1,
		    gridRow0 = null,
		    gridRow1 = null,
		    gridRow2 = null,
		    h = 0, b = 0, swap = 0,
		    val0 = 0, val1 = 0, val2 = 0, output = 0, th = 0, tw = 0,
			grid = null, nextGrid = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
		    bottomY = 0, topY = 0, leftX = 0,

		    // which cells were set in source
		    origValue = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
		    colOccupied = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
		    width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0,

		    // starting and ending tile row
		    tileStartRow = 0,
			tileEndRow = tileRows,
			
			// left, middle and right bitmasks for rule lookup
			/** @const{number} */ maskL = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8),
			/** @const{number} */ maskC = (1 << 7) | (1 << 6) | (1 << 5),
			/** @const{number} */ maskR = (1 << 4) | (1 << 3) | (1 << 2) | (1 << 1) | (1 << 0);

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			nextGrid = this.grid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
			if (this.altSpecified) {
				indexLookup = this.indexLookupTri2;
			}
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// check start and end row are in range
		if (tileStartRow < 0) {
			tileStartRow = 0;
		}
		if (tileEndRow > tileRows) {
			tileEndRow = tileRows;
		}

		// set the initial tile row
		bottomY = tileStartRow << this.tilePower;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << b)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							h = bottomY;

							// deal with bottom row of the grid
							if (h === 0) {
								gridRow0 = this.blankRow;
							} else {
								gridRow0 = grid[h - 1];
							}

							// current row
							gridRow1 = grid[h];

							// next row
							gridRow2 = grid[h + 1];

							// get original value (used for top row only and then to determine if any cells were alive in tile)
							origValue = gridRow1[leftX];

							// process normal tile
							val0 = (gridRow0[leftX - 1] << 18) | (gridRow0[leftX] << 2) | (gridRow0[leftX + 1] >> 14);
							val1 = (gridRow1[leftX - 1] << 18) | (origValue << 2) | (gridRow1[leftX + 1] >> 14);
							val2 = (gridRow2[leftX - 1] << 18) | (gridRow2[leftX] << 2) | (gridRow2[leftX + 1] >> 14);

							// get output
							output = indexLookup[((val0 >> 7) & maskL) | ((val2 >> 11) & maskC) | ((val1 >> 15) & maskR)] << 15;
							output |= indexLookup[((val2 >> 6) & maskL) | ((val0 >> 10) & maskC) | ((val1 >> 14) & maskR)] << 14;
							output |= indexLookup[((val0 >> 5) & maskL) | ((val2 >> 9) & maskC) | ((val1 >> 13) & maskR)] << 13;
							output |= indexLookup[((val2 >> 4) & maskL) | ((val0 >> 8) & maskC) | ((val1 >> 12) & maskR)] << 12;
							output |= indexLookup[((val0 >> 3) & maskL) | ((val2 >> 7) & maskC) | ((val1 >> 11) & maskR)] << 11;
							output |= indexLookup[((val2 >> 2) & maskL) | ((val0 >> 6) & maskC) | ((val1 >> 10) & maskR)] << 10;
							output |= indexLookup[((val0 >> 1) & maskL) | ((val2 >> 5) & maskC) | ((val1 >> 9) & maskR)] << 9;
							output |= indexLookup[((val2 >> 0) & maskL) | ((val0 >> 4) & maskC) | ((val1 >> 8) & maskR)] << 8;
							output |= indexLookup[((val0 << 1) & maskL) | ((val2 >> 3) & maskC) | ((val1 >> 7) & maskR)] << 7;
							output |= indexLookup[((val2 << 2) & maskL) | ((val0 >> 2) & maskC) | ((val1 >> 6) & maskR)] << 6;
							output |= indexLookup[((val0 << 3) & maskL) | ((val2 >> 1) & maskC) | ((val1 >> 5) & maskR)] << 5;
							output |= indexLookup[((val2 << 4) & maskL) | ((val0 >> 0) & maskC) | ((val1 >> 4) & maskR)] << 4;
							output |= indexLookup[((val0 << 5) & maskL) | ((val2 << 1) & maskC) | ((val1 >> 3) & maskR)] << 3;
							output |= indexLookup[((val2 << 6) & maskL) | ((val0 << 2) & maskC) | ((val1 >> 2) & maskR)] << 2;
							output |= indexLookup[((val0 << 7) & maskL) | ((val2 << 3) & maskC) | ((val1 >> 1) & maskR)] << 1;
							output |= indexLookup[((val2 << 8) & maskL) | ((val0 << 4) & maskC) | ((val1 >> 0) & maskR)] << 0;

							// save output 16bits
							nextGrid[h][leftX] = output;

							// check if any cells are set
							if (output) {
								// update column occupied flag
								colOccupied |= output;

								// update min and max row
								if (h < newBottomY) {
									newBottomY = h;
								}
								if (h > newTopY) {
									newTopY = h;
								}

								// check for left column now set (need two cells)
								if ((output & 49152) !== 0) {
									neighbours |= LifeConstants.bottomLeftSet;
								}

								// check for right column now set (need two cells)
								if ((output & 3) !== 0) {
									neighbours |= LifeConstants.bottomRightSet;
								}

								// bottom row set
								neighbours |= LifeConstants.bottomSet;
							}

							// process middle rows of the tile
							h += 1;
							while (h < topY - 1) {
								// get original value for next row
								origValue |= gridRow2[leftX];

								// next row
								gridRow2 = grid[h + 1];
	
								// read three rows
								val0 = val1;
								val1 = val2;
								val2 = (gridRow2[leftX - 1] << 18) | (gridRow2[leftX] << 2) | (gridRow2[leftX + 1] >> 14);
	
								// check for odd/even
								if ((h & 1) !== 0) {
									swap = val0;
									val0 = val2;
									val2 = swap;
								}

								// get output
								output = indexLookup[((val0 >> 7) & maskL) | ((val2 >> 11) & maskC) | ((val1 >> 15) & maskR)] << 15;
								output |= indexLookup[((val2 >> 6) & maskL) | ((val0 >> 10) & maskC) | ((val1 >> 14) & maskR)] << 14;
								output |= indexLookup[((val0 >> 5) & maskL) | ((val2 >> 9) & maskC) | ((val1 >> 13) & maskR)] << 13;
								output |= indexLookup[((val2 >> 4) & maskL) | ((val0 >> 8) & maskC) | ((val1 >> 12) & maskR)] << 12;
								output |= indexLookup[((val0 >> 3) & maskL) | ((val2 >> 7) & maskC) | ((val1 >> 11) & maskR)] << 11;
								output |= indexLookup[((val2 >> 2) & maskL) | ((val0 >> 6) & maskC) | ((val1 >> 10) & maskR)] << 10;
								output |= indexLookup[((val0 >> 1) & maskL) | ((val2 >> 5) & maskC) | ((val1 >> 9) & maskR)] << 9;
								output |= indexLookup[((val2 >> 0) & maskL) | ((val0 >> 4) & maskC) | ((val1 >> 8) & maskR)] << 8;
								output |= indexLookup[((val0 << 1) & maskL) | ((val2 >> 3) & maskC) | ((val1 >> 7) & maskR)] << 7;
								output |= indexLookup[((val2 << 2) & maskL) | ((val0 >> 2) & maskC) | ((val1 >> 6) & maskR)] << 6;
								output |= indexLookup[((val0 << 3) & maskL) | ((val2 >> 1) & maskC) | ((val1 >> 5) & maskR)] << 5;
								output |= indexLookup[((val2 << 4) & maskL) | ((val0 >> 0) & maskC) | ((val1 >> 4) & maskR)] << 4;
								output |= indexLookup[((val0 << 5) & maskL) | ((val2 << 1) & maskC) | ((val1 >> 3) & maskR)] << 3;
								output |= indexLookup[((val2 << 6) & maskL) | ((val0 << 2) & maskC) | ((val1 >> 2) & maskR)] << 2;
								output |= indexLookup[((val0 << 7) & maskL) | ((val2 << 3) & maskC) | ((val1 >> 1) & maskR)] << 1;
								output |= indexLookup[((val2 << 8) & maskL) | ((val0 << 4) & maskC) | ((val1 >> 0) & maskR)] << 0;

								// check for odd/even
								if ((h & 1) !== 0) {
									swap = val0;
									val0 = val2;
									val2 = swap;
								}

								// save output 16bits
								nextGrid[h][leftX] = output;
	
								// check if any cells are set
								if (output) {
									// update column occupied flag
									colOccupied |= output;
	
									// update min and max row
									if (h < newBottomY) {
										newBottomY = h;
									}
									if (h > newTopY) {
										newTopY = h;
									}
								}

								// next row
								h += 1;
							}

							// get original value
							origValue |= gridRow2[leftX];

							// deal with top row
							if (h === this.height - 1) {
								gridRow2 = this.blankRow;
							} else {
								gridRow2 = grid[h + 1];
							}

							// read three rows
							val0 = val1;
							val1 = val2;
							val2 = (gridRow2[leftX - 1] << 18) | (gridRow2[leftX] << 2) | (gridRow2[leftX + 1] >> 14);

							// check for odd/even
							if ((h & 1) !== 0) {
								swap = val0;
								val0 = val2;
								val2 = swap;
							}

							// get output
							output = indexLookup[((val0 >> 7) & maskL) | ((val2 >> 11) & maskC) | ((val1 >> 15) & maskR)] << 15;
							output |= indexLookup[((val2 >> 6) & maskL) | ((val0 >> 10) & maskC) | ((val1 >> 14) & maskR)] << 14;
							output |= indexLookup[((val0 >> 5) & maskL) | ((val2 >> 9) & maskC) | ((val1 >> 13) & maskR)] << 13;
							output |= indexLookup[((val2 >> 4) & maskL) | ((val0 >> 8) & maskC) | ((val1 >> 12) & maskR)] << 12;
							output |= indexLookup[((val0 >> 3) & maskL) | ((val2 >> 7) & maskC) | ((val1 >> 11) & maskR)] << 11;
							output |= indexLookup[((val2 >> 2) & maskL) | ((val0 >> 6) & maskC) | ((val1 >> 10) & maskR)] << 10;
							output |= indexLookup[((val0 >> 1) & maskL) | ((val2 >> 5) & maskC) | ((val1 >> 9) & maskR)] << 9;
							output |= indexLookup[((val2 >> 0) & maskL) | ((val0 >> 4) & maskC) | ((val1 >> 8) & maskR)] << 8;
							output |= indexLookup[((val0 << 1) & maskL) | ((val2 >> 3) & maskC) | ((val1 >> 7) & maskR)] << 7;
							output |= indexLookup[((val2 << 2) & maskL) | ((val0 >> 2) & maskC) | ((val1 >> 6) & maskR)] << 6;
							output |= indexLookup[((val0 << 3) & maskL) | ((val2 >> 1) & maskC) | ((val1 >> 5) & maskR)] << 5;
							output |= indexLookup[((val2 << 4) & maskL) | ((val0 >> 0) & maskC) | ((val1 >> 4) & maskR)] << 4;
							output |= indexLookup[((val0 << 5) & maskL) | ((val2 << 1) & maskC) | ((val1 >> 3) & maskR)] << 3;
							output |= indexLookup[((val2 << 6) & maskL) | ((val0 << 2) & maskC) | ((val1 >> 2) & maskR)] << 2;
							output |= indexLookup[((val0 << 7) & maskL) | ((val2 << 3) & maskC) | ((val1 >> 1) & maskR)] << 1;
							output |= indexLookup[((val2 << 8) & maskL) | ((val0 << 4) & maskC) | ((val1 >> 0) & maskR)] << 0;

							// check for odd/even
							if ((h & 1) !== 0) {
								swap = val0;
								val0 = val2;
								val2 = swap;
							}

							// save output 16bits
							nextGrid[h][leftX] = output;

							// check if any cells are set
							if (output) {
								// update column occupied flag
								colOccupied |= output;

								// update min and max row
								if (h < newBottomY) {
									newBottomY = h;
								}
								if (h > newTopY) {
									newTopY = h;
								}

								// check for left column now set
								if ((output & 49152) !== 0) {
									neighbours |= LifeConstants.topLeftSet;
								}

								// check for right column now set
								if ((output & 3) !== 0) {
									neighbours |= LifeConstants.topRightSet;
								}

								// top row set
								neighbours |= LifeConstants.topSet;
							}

							// check which columns contained cells
							if (colOccupied) {
								// check for left column set (need two cells)
								if ((colOccupied & 49152) !== 0) {
									neighbours |= LifeConstants.leftSet;
								}

								// check for right column set (need two cells)
								if ((colOccupied & 3) !== 0) {
									neighbours |= LifeConstants.rightSet;
								}
							}

							// save the column occupied cells
							columnOccupied16[leftX] |= colOccupied;

							// check if the source or output were alive
							if (colOccupied || origValue) {
								// update 
								nextTiles |= (1 << b);

								// check for neighbours
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (b < 15) {
											nextTiles |= (1 << (b + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (b > 0) {
											nextTiles |= (1 << (b - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << b);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << b);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (b < 15) {
											belowNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);
	};

	// update the life grid region using tiles
	Life.prototype.nextGenerationTile = function() {
		var indexLookup63 = this.indexLookup63,
		    gridRow0 = null,
		    gridRow1 = null,
		    gridRow2 = null,
		    h = 0, b = 0,
		    val0 = 0, val1 = 0, val2 = 0, output = 0, th = 0, tw = 0,
			grid = null, nextGrid = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
			bottomY = 0, topY = 0, leftX = 0,

		    // which cells were set in source
			origValue = 0,
			
			// whether cells were set in the tile
			tileCells = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
			colOccupied = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			rowOccupied = 0,
			rowIndex = 0,

			// population statistics
			bitCounts16 = this.bitCounts16,
			population = 0, births = 0, deaths = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
		    width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
			neighbours = 0,

			// bounded grid width and height
			bWidth = this.boundedGridWidth,
		    bHeight = this.boundedGridHeight,

		    // bottom left
		    bLeftX = Math.round((this.width - bWidth) / 2),
		    bBottomY = Math.round((this.height - bHeight) / 2),

		    // top right
		    bRightX = bLeftX + bWidth - 1,
			bTopY = bBottomY + bHeight - 1;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			nextGrid = this.grid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;

			// get alternate lookup buffer if specified
			if (this.altSpecified) {
				indexLookup63 = this.indexLookup632;
			}
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << b)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							h = bottomY;
							rowIndex = 32768;

							// deal with bottom row of the grid
							if (h === 0) {
								gridRow0 = this.blankRow;
							} else {
								gridRow0 = grid[h - 1];
							}

							// current row
							gridRow1 = grid[h];

							// next row
							gridRow2 = grid[h + 1];

							// get original value (used for top row only and then to determine if any cells were alive in tile)
							origValue = gridRow1[leftX];

							// mix of original cells and cells computed in this tile
							tileCells = origValue;

							// check if at left edge of grid
							if (!leftX) {
								// process left edge tile first row
								val0 = (gridRow0[leftX] << 1) | (gridRow0[leftX + 1] >> 15);
								val1 = (origValue << 1) | (gridRow1[leftX + 1] >> 15);
								val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
								output = val0 | val1 | val2;
								if (output) {
									// get first 4 bits
									output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

									// check if any cells are set
									if (output) {
										// update row and column occupied flags
										colOccupied |= output;
										rowOccupied |= rowIndex;
	
										// check for right column now set
										if ((output & 1) !== 0) {
											neighbours |= LifeConstants.bottomRightSet;
										}

										// bottom row set
										neighbours |= LifeConstants.bottomSet;

										// update population
										population += bitCounts16[output];
									}
								}

								// save output 16bits
								nextGrid[h][leftX] = output;

								// update statistics
								if (output | origValue) {
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
								}
								
								// process left edge tile middle rows
								h += 1;
								rowIndex >>= 1;
								while (h < topY - 1) {
									// get original value for next row
									origValue = gridRow2[leftX];
									tileCells |= origValue;

									// next row
									gridRow2 = grid[h + 1];

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// add three sets of 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;

											// update population
											population += bitCounts16[output];
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// update statistics
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									
									// next row
									h += 1;
									rowIndex >>= 1;
								}

								// process left edge last row
								origValue = gridRow2[leftX];
								tileCells |= origValue;

								// deal with top row
								if (h === this.height - 1) {
									gridRow2 = this.blankRow;
								} else {
									gridRow2 = grid[h + 1];
								}

								// read three rows
								val0 = val1;
								val1 = val2;
								val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
								output = val0 | val1 | val2;
								if (output) {
									// get first 4 bits
									output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

									// check if any cells are set
									if (output) {
										// update row and column occupied flags
										colOccupied |= output;
										rowOccupied |= rowIndex;

										// update population
										population += bitCounts16[output];

										// check for right column now set
										if ((output & 1) !== 0) {
											neighbours |= LifeConstants.topRightSet;
										}

										// top row set
										neighbours |= LifeConstants.topSet;
									}
								}

								// save output 16bits
								nextGrid[h][leftX] = output;

								// update statistics
								if (output | origValue) {
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
								}
							} else {
								// check if at right edge
								if (leftX >= width16 - 1) {
									// process right edge tile first row
									val0 = ((gridRow0[leftX - 1] & 1) << 17) | (gridRow0[leftX] << 1);
									val1 = ((gridRow1[leftX - 1] & 1) << 17) | (origValue << 1);
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// add three sets of 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;

											// update population
											population += bitCounts16[output];

											// check for left column now set
											if ((output & 32768) !== 0) {
												neighbours |= LifeConstants.bottomLeftSet;
											}

											// bottom row set
											neighbours |= LifeConstants.bottomSet;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// update statistics
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}

									// process left edge tile middle rows
									h += 1;
									rowIndex >>= 1;
									while (h < topY - 1) {
										// get original value for next row
										origValue = gridRow2[leftX];
										tileCells |= origValue;

										// next row
										gridRow2 = grid[h + 1];

										// read three rows
										val0 = val1;
										val1 = val2;
										val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1);
										output = val0 | val1 | val2;
										if (output) {
											// get first 4 bits
											output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

											// add three sets of 4 bits
											output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
											output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
											output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
	
											// check if any cells are set
											if (output) {
												// update row and column occupied flags
												colOccupied |= output;
												rowOccupied |= rowIndex;

												// update population
												population += bitCounts16[output];
											}
										}

										// save output 16bits
										nextGrid[h][leftX] = output;

										// update statistics
										if (output | origValue) {
											births += bitCounts16[output & ~origValue];
											deaths += bitCounts16[origValue & ~output];
										}

										// next row
										h += 1;
										rowIndex >>= 1;
									}

									// process left edge last row
									origValue = gridRow2[leftX];
									tileCells |= origValue;

									// deal with top row
									if (h === this.height - 1) {
										gridRow2 = this.blankRow;
									} else {
										gridRow2 = grid[h + 1];
									}

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// get next 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;

											// update population
											population += bitCounts16[output];

											// check for left column now set
											if ((output & 32768) !== 0) {
													neighbours |= LifeConstants.topLeftSet;
											}

											// top row set
											neighbours |= LifeConstants.topSet;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// update statistics
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
								} else {
									// process normal tile
									val0 = ((gridRow0[leftX - 1] & 1) << 17) | (gridRow0[leftX] << 1) | (gridRow0[leftX + 1] >> 15);
									val1 = ((gridRow1[leftX - 1] & 1) << 17) | (origValue << 1) | (gridRow1[leftX + 1] >> 15);
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// add three sets of 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;
	
											// update population
											population += bitCounts16[output];

											// check for left column now set
											if ((output & 32768) !== 0) {
												neighbours |= LifeConstants.bottomLeftSet;
											}
	
											// check for right column now set
											if ((output & 1) !== 0) {
												neighbours |= LifeConstants.bottomRightSet;
											}
	
											// bottom row set
											neighbours |= LifeConstants.bottomSet;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// update statistics
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}

									// process middle rows of the tile
									h += 1;
									rowIndex >>= 1;

									// get original value for next row
									origValue = gridRow2[leftX];
									tileCells |= origValue;

									// next row
									gridRow2 = grid[h + 1];

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// get next 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;

											// update population
											population += bitCounts16[output];
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// update statistics
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}

									// next row
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
											population += bitCounts16[output];
										}
									}
									nextGrid[h][leftX] = output;
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
									h += 1;
									rowIndex >>= 1;

									// get original value
									origValue = gridRow2[leftX];
									tileCells |= origValue;

									// deal with top row
									if (h === this.height - 1) {
										gridRow2 = this.blankRow;
									} else {
										gridRow2 = grid[h + 1];
									}

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// get next 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flag
											colOccupied |= output;
											rowOccupied |= rowIndex;

											// update population
											population += bitCounts16[output];

											// check for left column now set
											if ((output & 32768) !== 0) {
												neighbours |= LifeConstants.topLeftSet;
											}

											// check for right column now set
											if ((output & 1) !== 0) {
												neighbours |= LifeConstants.topRightSet;
											}

											// top row set
											neighbours |= LifeConstants.topSet;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// update statistics
									if (output | origValue) {
										births += bitCounts16[output & ~origValue];
										deaths += bitCounts16[origValue & ~output];
									}
								}
							}

							// check which columns contained cells
							if (colOccupied) {
								// check for left column set
								if ((colOccupied & 32768) !== 0) {
									neighbours |= LifeConstants.leftSet;
								}

								// check for right column set
								if ((colOccupied & 1) !== 0) {
									neighbours |= LifeConstants.rightSet;
								}
							}

							// save the column occupied cells
							columnOccupied16[leftX] |= colOccupied;

							// check if the source or output were alive
							if (colOccupied || tileCells) {
								// update 
								nextTiles |= (1 << b);

								// check for neighbours
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (b < 15) {
											nextTiles |= (1 << (b + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (b > 0) {
											nextTiles |= (1 << (b - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << b);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << b);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (b < 15) {
											belowNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// remove bounded grid column and row entries (+1 in all directions)
		if (this.boundedGridType !== -1) {
			if (bWidth !== 0) {
				columnOccupied16[(bLeftX - 1) >> 4] &= ~(1 << (~(bLeftX - 1) & 15));
				columnOccupied16[(bRightX + 1) >> 4] &= ~(1 << (~(bRightX + 1) & 15));
				columnOccupied16[(bLeftX - 2) >> 4] &= ~(1 << (~(bLeftX - 2) & 15));
				columnOccupied16[(bRightX + 2) >> 4] &= ~(1 << (~(bRightX + 2) & 15));
			}
			if (bHeight !== 0) {
				rowOccupied16[(bBottomY - 1) >> 4] &= ~(1 << (~(bBottomY - 1) & 15));
				rowOccupied16[(bTopY + 1) >> 4] &= ~(1 << (~(bTopY + 1) & 15));
				rowOccupied16[(bBottomY - 2) >> 4] &= ~(1 << (~(bBottomY - 2) & 15));
				rowOccupied16[(bTopY + 2) >> 4] &= ~(1 << (~(bTopY + 2) & 15));
			}
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
	};

	// update the life grid region using tiles (no stats)
	Life.prototype.nextGenerationOnlyTile = function() {
		var indexLookup63 = this.indexLookup63,
		    gridRow0 = null,
		    gridRow1 = null,
		    gridRow2 = null,
		    h = 0, b = 0,
		    val0 = 0, val1 = 0, val2 = 0, output = 0, th = 0, tw = 0,
			grid = null, nextGrid = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
			bottomY = 0, topY = 0, leftX = 0,

		    // which cells were set in source
		    origValue = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
			colOccupied = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			rowOccupied = 0,
			rowIndex = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
		    width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16 bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0,

			// bounded grid width and height
			bWidth = this.boundedGridWidth,
		    bHeight = this.boundedGridHeight,

		    // bottom left
		    bLeftX = Math.round((this.width - bWidth) / 2),
		    bBottomY = Math.round((this.height - bHeight) / 2),

		    // top right
		    bRightX = bLeftX + bWidth - 1,
			bTopY = bBottomY + bHeight - 1;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			nextGrid = this.grid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;

			// get alternate lookup buffer if specified
			if (this.altSpecified) {
				indexLookup63 = this.indexLookup632;
			}
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << b)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							h = bottomY;
							rowIndex = 32768;

							// deal with bottom row of the grid
							if (h === 0) {
								gridRow0 = this.blankRow;
							} else {
								gridRow0 = grid[h - 1];
							}

							// current row
							gridRow1 = grid[h];

							// next row
							gridRow2 = grid[h + 1];

							// get original value (used for top row only and then to determine if any cells were alive in tile)
							origValue = gridRow1[leftX];

							// check if at left edge of grid
							if (!leftX) {
								// process left edge tile first row
								val0 = (gridRow0[leftX] << 1) | (gridRow0[leftX + 1] >> 15);
								val1 = (origValue << 1) | (gridRow1[leftX + 1] >> 15);
								val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
								output = val0 | val1 | val2;
								if (output) {
									// get first 4 bits
									output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

									// check if any cells are set
									if (output) {
										// update row and column occupied flags
										colOccupied |= output;
										rowOccupied |= rowIndex;
	
										// check for right column now set
										if ((output & 1) !== 0) {
											neighbours |= LifeConstants.bottomRightSet;
										}

										// bottom row set
										neighbours |= LifeConstants.bottomSet;
									}
								}

								// save output 16bits
								nextGrid[h][leftX] = output;
								
								// process left edge tile middle rows
								h += 1;
								rowIndex >>= 1;
								while (h < topY - 1) {
									// get original value for next row
									origValue |= gridRow2[leftX];

									// next row
									gridRow2 = grid[h + 1];

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// add three sets of 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// next row
									h += 1;
									rowIndex >>= 1;
								}

								// process left edge last row
								origValue |= gridRow2[leftX];

								// deal with top row
								if (h === this.height - 1) {
									gridRow2 = this.blankRow;
								} else {
									gridRow2 = grid[h + 1];
								}

								// read three rows
								val0 = val1;
								val1 = val2;
								val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
								output = val0 | val1 | val2;
								if (output) {
									// get first 4 bits
									output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

									// check if any cells are set
									if (output) {
										// update row and column occupied flags
										colOccupied |= output;
										rowOccupied |= rowIndex;

										// check for right column now set
										if ((output & 1) !== 0) {
											neighbours |= LifeConstants.topRightSet;
										}

										// top row set
										neighbours |= LifeConstants.topSet;
									}
								}

								// save output 16bits
								nextGrid[h][leftX] = output;
							} else {
								// check if at right edge
								if (leftX >= width16 - 1) {
									// process right edge tile first row
									val0 = ((gridRow0[leftX - 1] & 1) << 17) | (gridRow0[leftX] << 1);
									val1 = ((gridRow1[leftX - 1] & 1) << 17) | (origValue << 1);
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// add three sets of 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
													colOccupied |= output;
											rowOccupied |= rowIndex;

											// check for left column now set
											if ((output & 32768) !== 0) {
												neighbours |= LifeConstants.bottomLeftSet;
											}

											// bottom row set
											neighbours |= LifeConstants.bottomSet;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// process left edge tile middle rows
									h += 1;
									rowIndex >>= 1;
									while (h < topY - 1) {
										// get original value for next row
										origValue |= gridRow2[leftX];

										// next row
										gridRow2 = grid[h + 1];

										// read three rows
										val0 = val1;
										val1 = val2;
										val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1);
										output = val0 | val1 | val2;
										if (output) {
											// get first 4 bits
											output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

											// add three sets of 4 bits
											output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
											output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
											output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
	
											// check if any cells are set
											if (output) {
												// update row and column occupied flags
												colOccupied |= output;
												rowOccupied |= rowIndex;
											}
										}

										// save output 16bits
										nextGrid[h][leftX] = output;

										// next row
										h += 1;
										rowIndex >>= 1;
									}

									// process left edge last row
									origValue |= gridRow2[leftX];

									// deal with top row
									if (h === this.height - 1) {
										gridRow2 = this.blankRow;
									} else {
										gridRow2 = grid[h + 1];
									}

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// get next 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;

											// check for left column now set
											if ((output & 32768) !== 0) {
													neighbours |= LifeConstants.topLeftSet;
											}

											// top row set
											neighbours |= LifeConstants.topSet;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;
								} else {
									// process normal tile
									val0 = ((gridRow0[leftX - 1] & 1) << 17) | (gridRow0[leftX] << 1) | (gridRow0[leftX + 1] >> 15);
									val1 = ((gridRow1[leftX - 1] & 1) << 17) | (origValue << 1) | (gridRow1[leftX + 1] >> 15);
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// add three sets of 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;
	
											// check for left column now set
											if ((output & 32768) !== 0) {
												neighbours |= LifeConstants.bottomLeftSet;
											}
	
											// check for right column now set
											if ((output & 1) !== 0) {
												neighbours |= LifeConstants.bottomRightSet;
											}
	
											// bottom row set
											neighbours |= LifeConstants.bottomSet;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// process middle rows of the tile
									h += 1;
									rowIndex >>= 1;

									// get original value for next row
									origValue |= gridRow2[leftX];

									// next row
									gridRow2 = grid[h + 1];

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// get next 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flags
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;

									// next row
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
										if (output) {
											colOccupied |= output;
											rowOccupied |= rowIndex;
										}
									}
									nextGrid[h][leftX] = output;
									h += 1;
									rowIndex >>= 1;

									// get original value
									origValue |= gridRow2[leftX];

									// deal with top row
									if (h === this.height - 1) {
										gridRow2 = this.blankRow;
									} else {
										gridRow2 = grid[h + 1];
									}

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = ((gridRow2[leftX - 1] & 1) << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = val0 | val1 | val2;
									if (output) {
										// get first 4 bits
										output = indexLookup63[(val0 >> 12) | (val1 >> 12) << 6 | (val2 & 258048)] << 12;

										// get next 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 2) & 4032) | ((val2 << 4) & 258048)] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 << 2) & 4032) | ((val2 << 8) & 258048)] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

										// check if any cells are set
										if (output) {
											// update row and column occupied flag
											colOccupied |= output;
											rowOccupied |= rowIndex;

											// check for left column now set
											if ((output & 32768) !== 0) {
												neighbours |= LifeConstants.topLeftSet;
											}

											// check for right column now set
											if ((output & 1) !== 0) {
												neighbours |= LifeConstants.topRightSet;
											}

											// top row set
											neighbours |= LifeConstants.topSet;
										}
									}

									// save output 16bits
									nextGrid[h][leftX] = output;
								}
							}

							// check which columns contained cells
							if (colOccupied) {
								// check for left column set
								if ((colOccupied & 32768) !== 0) {
									neighbours |= LifeConstants.leftSet;
								}

								// check for right column set
								if ((colOccupied & 1) !== 0) {
									neighbours |= LifeConstants.rightSet;
								}
							}

							// save the column occupied cells
							columnOccupied16[leftX] |= colOccupied;

							// check if the source or output were alive
							if (colOccupied || origValue) {
								// update 
								nextTiles |= (1 << b);

								// check for neighbours
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (b < 15) {
											nextTiles |= (1 << (b + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (b > 0) {
											nextTiles |= (1 << (b - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << b);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << b);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (b < 15) {
											belowNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// remove bounded grid column and row entries (+1 in all directions)
		if (this.boundedGridType !== -1) {
			if (bWidth !== 0) {
				columnOccupied16[(bLeftX - 1) >> 4] &= ~(1 << (~(bLeftX - 1) & 15));
				columnOccupied16[(bRightX + 1) >> 4] &= ~(1 << (~(bRightX + 1) & 15));
				columnOccupied16[(bLeftX - 2) >> 4] &= ~(1 << (~(bLeftX - 2) & 15));
				columnOccupied16[(bRightX + 2) >> 4] &= ~(1 << (~(bRightX + 2) & 15));
			}
			if (bHeight !== 0) {
				rowOccupied16[(bBottomY - 1) >> 4] &= ~(1 << (~(bBottomY - 1) & 15));
				rowOccupied16[(bTopY + 1) >> 4] &= ~(1 << (~(bTopY + 1) & 15));
				rowOccupied16[(bBottomY - 2) >> 4] &= ~(1 << (~(bBottomY - 2) & 15));
				rowOccupied16[(bTopY + 2) >> 4] &= ~(1 << (~(bTopY + 2) & 15));
			}
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);
	};

	// create 2x2 colour grid with no history for 0.5 <= zoom < 1
	Life.prototype.create2x2ColourGridNoHistory16 = function(colourGrid, smallColourGrid) {
		var cr = 0, h = 0,
		    sourceRow = null,
		    sourceRow1 = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    value = 0, th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    tiles = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// update the small colour grid
							for (h = bottomY; h < topY; h += 2) {
								// get destination row
								destRow = smallColourGrid[h];

								// get the next two rows
								sourceRow = colourGrid[h];
								sourceRow1 = colourGrid[h + 1];
								cr = (leftX << 3);
									
								// find any set cells in each 2x2 block
								// first two cells in first row
								value = sourceRow[cr];

								// next two cells in next row
								value |= sourceRow1[cr];
								destRow[cr + cr] = value | (value >> 8);
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								value |= sourceRow1[cr];
								destRow[cr + cr] = value | (value >> 8);
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								value |= sourceRow1[cr];
								destRow[cr + cr] = value | (value >> 8);
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								value |= sourceRow1[cr];
								destRow[cr + cr] = value | (value >> 8);
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								value |= sourceRow1[cr];
								destRow[cr + cr] = value | (value >> 8);
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								value |= sourceRow1[cr];
								destRow[cr + cr] = value | (value >> 8);
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								value |= sourceRow1[cr];
								destRow[cr + cr] = value | (value >> 8);
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								value |= sourceRow1[cr];
								destRow[cr + cr] = value | (value >> 8);
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}
			
			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// create 2x2 colour grid for 0.5 <= zoom < 1
	Life.prototype.create2x2ColourGrid16 = function(colourGrid, smallColourGrid) {
		var cr = 0, h = 0,
		    sourceRow = null,
		    sourceRow1 = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    value = 0, th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    tiles = 0,
		    smallValue = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// update the small colour grid
							for (h = bottomY; h < topY; h += 2) {
								// get destination row
								destRow = smallColourGrid[h];

								// get the next two rows
								sourceRow = colourGrid[h];
								sourceRow1 = colourGrid[h + 1];
								cr = (leftX << 3);
									
								// get the maximum of 4 pixels
								// first two pixels in first row
								value = sourceRow[cr];
								smallValue = value & 255;
								value >>= 8;
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));

								// next two pixels in next row
								value = sourceRow1[cr];
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value >>= 8;
								destRow[cr + cr] = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								smallValue = value & 255;
								value >>= 8;
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value = sourceRow1[cr];
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value >>= 8;
								destRow[cr + cr] = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								smallValue = value & 255;
								value >>= 8;
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value = sourceRow1[cr];
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value >>= 8;
								destRow[cr + cr] = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								smallValue = value & 255;
								value >>= 8;
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value = sourceRow1[cr];
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value >>= 8;
								destRow[cr + cr] = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								smallValue = value & 255;
								value >>= 8;
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value = sourceRow1[cr];
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value >>= 8;
								destRow[cr + cr] = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								smallValue = value & 255;
								value >>= 8;
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value = sourceRow1[cr];
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value >>= 8;
								destRow[cr + cr] = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								smallValue = value & 255;
								value >>= 8;
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value = sourceRow1[cr];
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value >>= 8;
								destRow[cr + cr] = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								cr += 1;

								// loop unroll
								value = sourceRow[cr];
								smallValue = value & 255;
								value >>= 8;
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value = sourceRow1[cr];
								smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								value >>= 8;
								destRow[cr + cr] = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}
			
			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// create 4x4 colour grid with no history for 0.25 <= zoom < 0.5
	Life.prototype.create4x4ColourGridNoHistory32 = function(colourGrid, smallColourGrid) {
		var h = 0,
			cr = 0,
			dr = 0,
		    sourceRow = null,
		    sourceRow1 = null,
		    sourceRow2 = null,
		    sourceRow3 = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
			tiles = 0,
			value = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// update the small colour grid
							for (h = bottomY; h < topY; h += 4) {
								// get destination row
								destRow = smallColourGrid[h];

								// get the next four rows
								sourceRow = colourGrid[h];
								sourceRow1 = colourGrid[h + 1];
								sourceRow2 = colourGrid[h + 2];
								sourceRow3 = colourGrid[h + 3];
								cr = (leftX << 2);
								dr = (leftX << 4);
									
								// find any set cells in each 4x4 block
								value = sourceRow[cr] | sourceRow1[cr] | sourceRow2[cr] | sourceRow3[cr];
								// @ts-ignore
								destRow[dr] = (value > 0) << 6;
								cr += 1;
								dr += 4;

								// loop unroll
								value = sourceRow[cr] | sourceRow1[cr] | sourceRow2[cr] | sourceRow3[cr];
								// @ts-ignore
								destRow[dr] = (value > 0) << 6;
								cr += 1;
								dr += 4;

								// loop unroll
								value = sourceRow[cr] | sourceRow1[cr] | sourceRow2[cr] | sourceRow3[cr];
								// @ts-ignore
								destRow[dr] = (value > 0) << 6;
								cr += 1;
								dr += 4;

								// loop unroll
								value = sourceRow[cr] | sourceRow1[cr] | sourceRow2[cr] | sourceRow3[cr];
								// @ts-ignore
								destRow[dr] = (value > 0) << 6;
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}
			
			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// create 4x4 colour grid for 0.25 <= zoom < 0.5
	Life.prototype.create4x4ColourGrid32 = function(colourGrid, smallColourGrid) {
		var h = 0,
			cr = 0,
			dr = 0,
			i = 0,
		    sourceRow = null,
		    sourceRow1 = null,
		    sourceRow2 = null,
		    sourceRow3 = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    value = 0, th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    tiles = 0,
		    smallValue = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// update the small colour grid
							for (h = bottomY; h < topY; h += 4) {
								// get destination row
								destRow = smallColourGrid[h];

								// get the next four rows
								sourceRow = colourGrid[h];
								sourceRow1 = colourGrid[h + 1];
								sourceRow2 = colourGrid[h + 2];
								sourceRow3 = colourGrid[h + 3];
								cr = (leftX << 2);
								dr = (leftX << 4);
									
								// get the maximum of each 4x4 block
								for (i = 0; i < 4; i += 1) {
									smallValue = 0;

									value = sourceRow[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow1[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow2[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow3[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									destRow[dr] = smallValue;
									cr += 1;
									dr += 4;
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}
			
			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// create 8x8 colour grid with no history for 0.125 <= zoom < 0.25
	Life.prototype.create8x8ColourGridNoHistory32 = function(colourGrid, smallColourGrid) {
		var h = 0,
			cr = 0,
			dr = 0,
		    sourceRow = null,
		    sourceRow1 = null,
		    sourceRow2 = null,
		    sourceRow3 = null,
		    sourceRow4 = null,
		    sourceRow5 = null,
		    sourceRow6 = null,
		    sourceRow7 = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
			tiles = 0,
			value = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// update the small colour grid
							for (h = bottomY; h < topY; h += 8) {
								// get destination row
								destRow = smallColourGrid[h];

								// get the next 8 rows
								sourceRow = colourGrid[h];
								sourceRow1 = colourGrid[h + 1];
								sourceRow2 = colourGrid[h + 2];
								sourceRow3 = colourGrid[h + 3];
								sourceRow4 = colourGrid[h + 4];
								sourceRow5 = colourGrid[h + 5];
								sourceRow6 = colourGrid[h + 6];
								sourceRow7 = colourGrid[h + 7];
								cr = (leftX << 2);
								dr = (leftX << 4);
									
								// find any set cells in each 8x8 block
								value = sourceRow[cr] | sourceRow[cr + 1];
								value |= sourceRow1[cr] | sourceRow1[cr + 1];
								value |= sourceRow2[cr] | sourceRow2[cr + 1];
								value |= sourceRow3[cr] | sourceRow3[cr + 1];
								if (value === 0) {
									value |= sourceRow4[cr] | sourceRow4[cr + 1];
									value |= sourceRow5[cr] | sourceRow5[cr + 1];
									value |= sourceRow6[cr] | sourceRow6[cr + 1];
									value |= sourceRow7[cr] | sourceRow7[cr + 1];
								}
								// @ts-ignore
								destRow[dr] = (value > 0) << 6;
								cr += 2;
								dr += 8;

								// loop unroll
								value = sourceRow[cr] | sourceRow[cr + 1];
								value |= sourceRow1[cr] | sourceRow1[cr + 1];
								value |= sourceRow2[cr] | sourceRow2[cr + 1];
								value |= sourceRow3[cr] | sourceRow3[cr + 1];
								if (value === 0) {
									value |= sourceRow4[cr] | sourceRow4[cr + 1];
									value |= sourceRow5[cr] | sourceRow5[cr + 1];
									value |= sourceRow6[cr] | sourceRow6[cr + 1];
									value |= sourceRow7[cr] | sourceRow7[cr + 1];
								}
								// @ts-ignore
								destRow[dr] = (value > 0) << 6;
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}
			
			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// create 8x8 colour grid for 0.125 <= zoom < 0.25
	Life.prototype.create8x8ColourGrid32 = function(colourGrid, smallColourGrid) {
		var h = 0,
			cr = 0,
			dr = 0,
			i = 0,
		    sourceRow = null,
		    sourceRow1 = null,
		    sourceRow2 = null,
		    sourceRow3 = null,
		    sourceRow4 = null,
		    sourceRow5 = null,
		    sourceRow6 = null,
		    sourceRow7 = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    value = 0, th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    tiles = 0,
		    smallValue = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// update the small colour grid
							for (h = bottomY; h < topY; h += 8) {
								// get destination row
								destRow = smallColourGrid[h];

								// get the next 8 rows
								sourceRow = colourGrid[h];
								sourceRow1 = colourGrid[h + 1];
								sourceRow2 = colourGrid[h + 2];
								sourceRow3 = colourGrid[h + 3];
								sourceRow4 = colourGrid[h + 4];
								sourceRow5 = colourGrid[h + 5];
								sourceRow6 = colourGrid[h + 6];
								sourceRow7 = colourGrid[h + 7];
								cr = (leftX << 2);
								dr = (leftX << 4);
									
								// get the maximum of each 8x8 block
								for (i = 0; i < 2; i += 1) {
									smallValue = 0;
									value = sourceRow[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow[cr + 1];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow1[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow1[cr + 1];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow2[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow2[cr + 1];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow3[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow3[cr + 1];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow4[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow4[cr + 1];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow5[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow5[cr + 1];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow6[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow6[cr + 1];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow7[cr];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									value = sourceRow7[cr + 1];
									if (value) {
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
										value >>= 8;
										smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									}

									destRow[dr] = smallValue;
									cr += 2;
									dr += 8;
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}
			
			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// create 16x16 colour grid with no history for 0.0625 <= zoom < 0.125
	Life.prototype.create16x16ColourGridNoHistory32 = function(colourGrid, smallColourGrid) {
		var cr = 0,
			dr = 0,
		    sourceRow = null,
		    sourceRow1 = null,
		    sourceRow2 = null,
		    sourceRow3 = null,
		    sourceRow4 = null,
		    sourceRow5 = null,
		    sourceRow6 = null,
		    sourceRow7 = null,
		    sourceRow8 = null,
		    sourceRow9 = null,
		    sourceRow10 = null,
		    sourceRow11 = null,
		    sourceRow12 = null,
		    sourceRow13 = null,
		    sourceRow14 = null,
		    sourceRow15 = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    th = 0, tw = 0, b = 0,
		    bottomY = 0, leftX = 0,
			tiles = 0,
			value = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4;

		// set the initial tile row
		bottomY = 0;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// get the destination row
							destRow = smallColourGrid[bottomY]

							// get the next 16 rows
							sourceRow = colourGrid[bottomY];
							sourceRow1 = colourGrid[bottomY + 1];
							sourceRow2 = colourGrid[bottomY + 2];
							sourceRow3 = colourGrid[bottomY + 3];
							sourceRow4 = colourGrid[bottomY + 4];
							sourceRow5 = colourGrid[bottomY + 5];
							sourceRow6 = colourGrid[bottomY + 6];
							sourceRow7 = colourGrid[bottomY + 7];
							sourceRow8 = colourGrid[bottomY + 8];
							sourceRow9 = colourGrid[bottomY + 9];
							sourceRow10 = colourGrid[bottomY + 10];
							sourceRow11 = colourGrid[bottomY + 11];
							sourceRow12 = colourGrid[bottomY + 12];
							sourceRow13 = colourGrid[bottomY + 13];
							sourceRow14 = colourGrid[bottomY + 14];
							sourceRow15 = colourGrid[bottomY + 15];
							cr = (leftX << 2);
							dr = (leftX << 4);

							// find any set cells in the 16x16 block
							value = sourceRow[cr] | sourceRow[cr + 1] | sourceRow[cr + 2] | sourceRow[cr + 3];
							value |= sourceRow1[cr] | sourceRow1[cr + 1] | sourceRow1[cr + 2] | sourceRow1[cr + 3];
							value |= sourceRow2[cr] | sourceRow2[cr + 1] | sourceRow2[cr + 2] | sourceRow2[cr + 3];
							value |= sourceRow3[cr] | sourceRow3[cr + 1] | sourceRow3[cr + 2] | sourceRow3[cr + 3];
							if (value === 0) {
								value |= sourceRow4[cr] | sourceRow4[cr + 1] | sourceRow4[cr + 2] | sourceRow4[cr + 3];
								value |= sourceRow5[cr] | sourceRow5[cr + 1] | sourceRow5[cr + 2] | sourceRow5[cr + 3];
								value |= sourceRow6[cr] | sourceRow6[cr + 1] | sourceRow6[cr + 2] | sourceRow6[cr + 3];
								value |= sourceRow7[cr] | sourceRow7[cr + 1] | sourceRow7[cr + 2] | sourceRow7[cr + 3];
								if (value === 0) {
									value |= sourceRow8[cr] | sourceRow8[cr + 1] | sourceRow8[cr + 2] | sourceRow8[cr + 3];
									value |= sourceRow9[cr] | sourceRow9[cr + 1] | sourceRow9[cr + 2] | sourceRow9[cr + 3];
									value |= sourceRow10[cr] | sourceRow10[cr + 1] | sourceRow10[cr + 2] | sourceRow10[cr + 3];
									value |= sourceRow11[cr] | sourceRow11[cr + 1] | sourceRow11[cr + 2] | sourceRow11[cr + 3];
									if (value === 0) {
										value |= sourceRow12[cr] | sourceRow12[cr + 1] | sourceRow12[cr + 2] | sourceRow12[cr + 3];
										value |= sourceRow13[cr] | sourceRow13[cr + 1] | sourceRow13[cr + 2] | sourceRow13[cr + 3];
										value |= sourceRow14[cr] | sourceRow14[cr + 1] | sourceRow14[cr + 2] | sourceRow14[cr + 3];
										value |= sourceRow15[cr] | sourceRow15[cr + 1] | sourceRow15[cr + 2] | sourceRow15[cr + 3];
									}
								}
							}
									
							// output the cell
							// @ts-ignore
							destRow[dr] = (value > 0) << 6;
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}
			
			// next tile row
			bottomY += ySize;
		}
	};

	// create 16x16 colour grid for 0.0625 <= zoom < 0.125
	Life.prototype.create16x16ColourGrid32 = function(colourGrid, smallColourGrid) {
		var cr = 0,
			dr = 0,
		    sourceRow = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    value = 0, th = 0, tw = 0, b = 0, h = 0,
		    bottomY = 0, leftX = 0, topY = 0,
		    tiles = 0,
		    smallValue = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4;

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// update the small colour grid
							smallValue = 0;
							for (h = bottomY; h < topY; h += 1) {
								// get the next row
								sourceRow = colourGrid[h];
								cr = (leftX << 2);

								// get the maximum of 16 cells
								value = sourceRow[cr];
								if (value) {
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								}

								value = sourceRow[cr + 1];
								if (value) {
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								}

								value = sourceRow[cr + 2];
								if (value) {
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								}

								value = sourceRow[cr + 3];
								if (value) {
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
									value >>= 8;
									smallValue = smallValue - ((smallValue - (value & 255)) & ((smallValue - (value & 255)) >> 255));
								}
							}

							// get the destination row
							destRow = smallColourGrid[bottomY];
							dr = (leftX << 4);
							destRow[dr] = smallValue;
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}
			
			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// create the small colour grids based on zoom level
	Life.prototype.createSmallColourGrids = function(colourGrid16, colourGrid32) {
		var camZoom = this.camZoom;

		// check if 0.5 <= zoom < 1
		if (camZoom >= 0.5 && camZoom < 1) {
			// create 2x2 colour grid
			if (this.themeHistory || this.isHROT || this.isPCA || this.isRuleTree) {
				this.create2x2ColourGrid16(colourGrid16, this.smallColourGrid);
			} else {
				this.create2x2ColourGridNoHistory16(colourGrid16, this.smallColourGrid);
			}
		} else {
			// check if 0.25 <= zoom < 0.5
			if (camZoom >= 0.25 && camZoom < 0.5) {
				// create 4x4 colour grid
				if (this.themeHistory || this.isHROT || this.isPCA || this.isRuleTree) {
					this.create4x4ColourGrid32(colourGrid32, this.smallColourGrid);
				} else {
					this.create4x4ColourGridNoHistory32(colourGrid32, this.smallColourGrid);
				}
			} else {
				// check if 0.125 <= zoom < 0.25
				if (camZoom >= 0.125 && camZoom < 0.25) {
					// create 8x8 colour grid
					if (this.themeHistory || this.isHROT || this.isPCA || this.isRuleTree) {
						this.create8x8ColourGrid32(colourGrid32, this.smallColourGrid);
					} else {
						this.create8x8ColourGridNoHistory32(colourGrid32, this.smallColourGrid);
					}
				} else {
					// check if zoom < 0.125
					if (camZoom < 0.125) {
						// create 16x16 colour grid
						if (this.themeHistory || this.isHROT || this.isPCA || this.isRuleTree) {
							this.create16x16ColourGrid32(colourGrid32, this.smallColourGrid);
						} else {
							this.create16x16ColourGridNoHistory32(colourGrid32, this.smallColourGrid);
						}
					}
				}
			}
		}

		// check for overlay
		if (this.drawOverlay) {
			// check if 0.5 <= zoom < 1
			if (camZoom >= 0.5 && camZoom < 1) {
				// create 2x2 colour grid
				this.create2x2ColourGrid16(this.overlayGrid16, this.smallOverlayGrid);
			} else {
				// check if 0.25 <= zoom < 0.5
				if (camZoom >= 0.25 && camZoom < 0.5) {
					// create 4x4 colour grid
					this.create4x4ColourGrid32(this.overlayGrid32, this.smallOverlayGrid);
				} else {
					// check if 0.125 <= zoom < 0.25
					if (camZoom >= 0.125 && camZoom < 0.25) {
						// create 8x8 colour grid
						this.create8x8ColourGrid32(this.overlayGrid32, this.smallOverlayGrid);
					} else {
						// check if zoom < 0.125
						if (camZoom < 0.125) {
							// create 16x16 colour grid
							this.create16x16ColourGrid32(this.overlayGrid32, this.smallOverlayGrid);
						}
					}
				}
			}
		}
	};

	// compute generations rule next generation (after state 0 and 1)
	Life.prototype.nextGenerationGenerations = function() {
		var h = 0, cr = 0, nextCell = 0,
		    colourGrid = this.colourGrid,
		    colourGridRow = null, colourTileRow = null,
		    colourTileHistoryRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileGrid = this.colourTileGrid,
		    grid = null, gridRow = null, 
		    tileGrid = null, tileGridRow = null,
		    value = 0, th = 0, tw = 0, b = 0, n = 0,
		    bottomY = 0, topY = 0, leftX = 0,
			tiles = 0, nextTiles = 0,
			population = 0,
			births = 0,
			deaths = 0,
			lastValue = 0,

		    // whether the tile is alive
		    tileAlive = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // starting and ending tile row
		    tileStartRow = 0,
			tileEndRow = tileRows,
			
		    // maximum generations state
		    maxGenState = this.multiNumStates + this.historyStates - 1,

			// maximum dead state number
			deadState = this.historyStates,

			// minimum dead state number
			minDeadState = (this.historyStates > 0 ? 1 : 0);

		// clear anything alive
		this.anythingAlive = 0;

		// select the correct grid
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			tileGrid = this.nextTileGrid;
		} else {
			grid = this.grid16;
			tileGrid = this.tileGrid;
		}

		// check the start and end row are in range
		if (tileStartRow < 0) {
			tileStartRow = 0;
		}
		if (tileEndRow > tileRows) {
			tileEndRow = tileRows;
		}

		// set the initial tile row
		bottomY = tileStartRow << this.tilePower;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			tileGridRow = tileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileGridRow[tw] | colourTileRow[tw];
				nextTiles = 0;

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// flag nothing alive in the tile
							tileAlive = 0;

							// process each row
							for (h = bottomY; h < topY; h += 1) {
								// get the grid and colour grid row
								gridRow = grid[h];
								colourGridRow = colourGrid[h];

								// get correct starting colour index
								cr = (leftX << 4);

								// process each 16bit chunk (16 cells) along the row
								nextCell = gridRow[leftX];

								// process each cell in the chunk
								for (n = 1 << 15; n > 0; n >>= 1) {
									// get next colour cell
									value = colourGridRow[cr];
									lastValue = value;

									// process the Generations rule
									if ((value <= deadState || value === maxGenState) && ((nextCell & n) !== 0)) {
										value = maxGenState;
									} else {
										nextCell &= ~n;
										if (value > minDeadState) {
											value -= 1;
										}
									}
	
									// write the colour back
									colourGridRow[cr] = value;
									if (value > minDeadState) {
										tileAlive = 1;
										if (value === maxGenState) {
											population += 1;
											if (lastValue !== maxGenState) {
												births += 1;
											}
										}
									}
									if (lastValue === maxGenState && value !== maxGenState) {
										deaths += 1;
									}

									cr += 1;
								}

								// save the updated state 1 cells to the bitmap
								gridRow[leftX] = nextCell;
								this.anythingAlive |= nextCell;
							}

							// check if the row was alive
							if (tileAlive) {
								// update tile flag
								nextTiles |= (1 << b);
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}

				// save the tile group
				colourTileRow[tw] = nextTiles;
				colourTileHistoryRow[tw] |= nextTiles;
			}

			// next tile row
			bottomY += ySize;
			topY += ySize;
		}

		// update the population
		this.population = population;
		this.births = births;
		this.deaths = deaths;
	};

	// compute generations rule next generation for decay only
	Life.prototype.generationsDecayOnly = function() {
		var h = 0, cr = 0,
		    colourGrid = this.colourGrid,
		    colourGridRow = null,
		    colourTileHistoryRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    value = 0, th = 0, tw = 0, b = 0, n = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    tiles = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // starting and ending tile row
		    tileStartRow = 0,
			tileEndRow = tileRows,

			// minimum dead state number
			minDeadState = (this.historyStates > 0 ? 1 : 0);

		// check start and end row are in range
		if (tileStartRow < 0) {
			tileStartRow = 0;
		}
		if (tileEndRow > tileRows) {
			tileEndRow = tileRows;
		}

		// set the initial tile row
		bottomY = tileStartRow << this.tilePower;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the colour tile history rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// process each row
							for (h = bottomY; h < topY; h += 1) {
								// get colour grid row
								colourGridRow = colourGrid[h];

								// get correct starting colour index
								cr = (leftX << 4);

								// process each cell in the chunk
								for (n = 15; n >= 0; n -= 1) {
									// get next colour cell
									value = colourGridRow[cr];

									// process the Generations rule
									if (value > minDeadState) {
										value -= 1;
										colourGridRow[cr] = value;
									}
									cr += 1;
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// convert life grid region to pens using tiles
	Life.prototype.convertToPensTile = function() {
		// ignore if rule is none or PCA
		if (!(this.isNone || this.isPCA || this.isRuleTree)) {
			// check for generations or HROT rule
			if (this.multiNumStates === -1) {
				// check for theme history
				if (this.themeHistory) {
					// use regular converter
					this.convertToPensTileRegular();
				} else {
					this.convertToPensTileNoHistory();
				}
			} else {
				if (!this.anythingAlive) {
					this.generationsDecayOnly();
				}
			}
			// clear ecaping gliders if enabled
			if (this.clearGliders) {
				this.clearEscapingGliders();
			}
		}
	};
	
	// remove history cells from colour grid
	Life.prototype.clearHistoryCells = function() {
		var h = 0, cr = 0,
		    colourGrid16 = this.colourGrid16,
		    colourGridRow = null,
		    colourTileHistoryRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    tiles = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
			tileCols16 = this.tileCols >> 4,
			
			// alive mask for two cells
			aliveMask16 = (64 << 8) | 64;

		// initialize for first tile
		topY = ySize;

		// scan each row of tiles
		for (th = 0; th < tileRows; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = colourTileHistoryRow[tw];

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// process each row
							h = bottomY;
							while (h < topY) {
								// get the grid and colour grid row
								colourGridRow = colourGrid16[h];

								// get correct starting colour index
								cr = (leftX << 3);

								// mask out all but the two alive cells
								colourGridRow[cr] &= aliveMask16;
								cr += 1;
								colourGridRow[cr] &= aliveMask16;
								cr += 1;
								colourGridRow[cr] &= aliveMask16;
								cr += 1;
								colourGridRow[cr] &= aliveMask16;
								cr += 1;
								colourGridRow[cr] &= aliveMask16;
								cr += 1;
								colourGridRow[cr] &= aliveMask16;
								cr += 1;
								colourGridRow[cr] &= aliveMask16;
								cr += 1;
								colourGridRow[cr] &= aliveMask16;
								// cr += 1   - no need for final increment it will be reset next row

								// next row
								h += 1;
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// update the life grid region using tiles for RuleTable patterns
	Life.prototype.nextGenerationRuleTableTile = function() {
		switch (this.ruleTableNeighbourhood) {
		case PatternConstants.ruleTableVN:
			this.nextGenerationRuleTableTileVN();
			break;
		case PatternConstants.ruleTableMoore:
			this.nextGenerationRuleTableTileMoore();
			break;
		case PatternConstants.ruleTableHex:
			this.nextGenerationRuleTableTileHex();
			break;
		case PatternConstants.ruleTableOneD:
			this.nextGenerationRuleTableTile1D();
			break;
		}
	};

	// update the life grid region using tiles for 1D RuleTable patterns
	Life.prototype.nextGenerationRuleTableTile1D = function() {
		var gridRow1 = null,
			nextRow = null,
			lut = this.ruleTableLUT,
			lut0 = lut[0],
			lut1 = lut[1],
			lut2 = lut[2],
			lute = null,
			lutw = null,
			lutc = null,
			output = this.ruleTableOutput,
			nCompressed = this.ruleTableCompressedRules,
			isMatch = 0,
			iRuleC = 0,
			iBit = 0,
			mask = 0,

			// cells
			e = 0,
			w = 0,
			c = 0,
			
			state = 0,
			y = 0,
			x = 0,
			bit = 0,
			th = 0, tw = 0,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			colourTileHistoryRow = null,
			colourTileGrid = this.colourTileGrid,
			colourTileRow = null,
			grid = null,
			nextGrid = null,
			grid32 = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
			bottomY = 0, topY = 0, leftX = 0, rightX = 0,

			// whether cells were set in the tile
			tileCells = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
			colOccupied = 0,
			colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			rowOccupied = 0,
			rowIndex = 0,

			// population statistics
			population = 0, births = 0, deaths = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
			width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    xSize = this.tileY,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid = this.colourGrid;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid = this.nextColourGrid;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;
			rightX = leftX + xSize;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							// process each row of the tile
							while (y < topY) {
								// current row
								gridRow1 = grid[y];

								// get output row
								nextRow = nextGrid[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// get initial values for this row
								if (x === 0) {
									c = 0;
								} else {
									c = gridRow1[x - 1];
								}
								e = gridRow1[x];

								// process each cell along the tile row
								while (x < rightX - 1) {
									w = c;
									c = e;
									e = gridRow1[x + 1];
									lutc = lut0[c];
									lutw = lut1[w];
									lute = lut2[e];
									state = c;
									for (iRuleC = 0; iRuleC < nCompressed; iRuleC += 1) {
										isMatch = lutc[iRuleC] & lutw[iRuleC] & lute[iRuleC];
										if (isMatch) {
											iBit = 0;
											mask = 1;
											while (!(isMatch & mask)) {
												iBit += 1;
												mask <<= 1;
											}
											state = output[(iRuleC << 5) + iBit];
											break;
										}
									}
	
									// check if state is alive
									nextRow[x] = state;
									if (state > 0) {
										population += 1;
	
										// update births
										if (c === 0) {
											births += 1;
										}
										rowOccupied |= rowIndex;
										colOccupied |= colIndex;
									} else {
										// check for death
										if (c > 0) {
											// update deaths
											deaths += 1;
										}
									}
		
									// next column
									colIndex >>= 1;
									x += 1;
								}

								// handle right edge
								w = c;
								c = e;
								if (x === width - 1) {
									e = 0;
								} else {
									e = gridRow1[x + 1];
								}
								lutc = lut0[c];
								lutw = lut1[w];
								lute = lut2[e];
								state = c;
								for (iRuleC = 0; iRuleC < nCompressed; iRuleC += 1) {
									isMatch = lutc[iRuleC] & lutw[iRuleC] & lute[iRuleC];
									if (isMatch) {
										iBit = 0;
										mask = 1;
										while (!(isMatch & mask)) {
											iBit += 1;
											mask <<= 1;
										}
										state = output[(iRuleC << 5) + iBit];
										break;
									}
								}
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
						rightX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
					rightX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// update the life grid region using tiles for von Neumann RuleTable patterns
	Life.prototype.nextGenerationRuleTableTileVN = function() {
		var gridRow0 = null,
			gridRow1 = null,
			gridRow2 = null,
			nextRow = null,
			lut = this.ruleTableLUT,
			lut0 = lut[0],
			lut1 = lut[1],
			lut2 = lut[2],
			lut3 = lut[3],
			lut4 = lut[4],
			lutn = null,
			lute = null,
			luts = null,
			lutw = null,
			lutc = null,
			output = this.ruleTableOutput,
			nCompressed = this.ruleTableCompressedRules,
			isMatch = 0,
			iRuleC = 0,
			iBit = 0,
			mask = 0,

			// cells
			n = 0,
			e = 0,
			s = 0,
			w = 0,
			c = 0,
			
			state = 0,
			y = 0,
			x = 0,
			bit = 0,
			th = 0, tw = 0,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			colourTileHistoryRow = null,
			colourTileGrid = this.colourTileGrid,
			colourTileRow = null,
			grid = null,
			nextGrid = null,
			grid32 = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
			bottomY = 0, topY = 0, leftX = 0, rightX = 0,

			// whether cells were set in the tile
			tileCells = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
			colOccupied = 0,
			colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			rowOccupied = 0,
			rowIndex = 0,

			// population statistics
			population = 0, births = 0, deaths = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
			width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    xSize = this.tileY,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid = this.colourGrid;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid = this.nextColourGrid;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;
			rightX = leftX + xSize;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// get initial values for this row
								if (x === 0) {
									c = 0;
								} else {
									c = gridRow1[x - 1];
								}
								e = gridRow1[x];

								// process each cell along the tile row
								while (x < rightX - 1) {
									w = c;
									c = e;
									n = gridRow0[x];
									e = gridRow1[x + 1];
									s = gridRow2[x];
									lutc = lut0[c];
									lutn = lut1[n];
									lute = lut2[e];
									luts = lut3[s];
									lutw = lut4[w];
									state = c;
									for (iRuleC = 0; iRuleC < nCompressed; iRuleC += 1) {
										isMatch = lutc[iRuleC] & lutn[iRuleC];
										if (isMatch) {
											isMatch &= lute[iRuleC] & luts[iRuleC] & lutw[iRuleC];
											if (isMatch) {
												iBit = 0;
												mask = 1;
												while (!(isMatch & mask)) {
													iBit += 1;
													mask <<= 1;
												}
												state = output[(iRuleC << 5) + iBit];
												break;
											}
										}
									}

									// check if state is alive
									nextRow[x] = state;
									if (state > 0) {
										population += 1;
	
										// update births
										if (c === 0) {
											births += 1;
										}
										rowOccupied |= rowIndex;
										colOccupied |= colIndex;
									} else {
										// check for death
										if (c > 0) {
											// update deaths
											deaths += 1;
										}
									}
	
									// next column
									colIndex >>= 1;
									x += 1;
								}

								// handle right edge
								w = c;
								c = e;
								n = gridRow0[x];
								if (x === width - 1) {
									e = 0;
								} else {
									e = gridRow1[x + 1];
								}
								s = gridRow2[x];
								lutc = lut0[c];
								lutn = lut1[n];
								lute = lut2[e];
								luts = lut3[s];
								lutw = lut4[w];
								state = c;
								for (iRuleC = 0; iRuleC < nCompressed; iRuleC += 1) {
									isMatch = lutc[iRuleC] & lutn[iRuleC];
									if (isMatch) {
										isMatch &= lute[iRuleC] & luts[iRuleC] & lutw[iRuleC];
										if (isMatch) {
											iBit = 0;
											mask = 1;
											while (!(isMatch & mask)) {
												iBit += 1;
												mask <<= 1;
											}
											state = output[(iRuleC << 5) + iBit];
											break;
										}
									}
								}
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
						rightX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
					rightX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// update the life grid region using tiles for Moore RuleTable patterns
	Life.prototype.nextGenerationRuleTableTileMoore = function() {
		var gridRow0 = null,
			gridRow1 = null,
			gridRow2 = null,
			nextRow = null,
			lut = this.ruleTableLUT,
			lut0 = lut[0],
			lut1 = lut[1],
			lut2 = lut[2],
			lut3 = lut[3],
			lut4 = lut[4],
			lut5 = lut[5],
			lut6 = lut[6],
			lut7 = lut[7],
			lut8 = lut[8],
			lutnw = null,
			lutn = null,
			lutne = null,
			lutw = null,
			lutc = null,
			lute = null,
			lutsw = null,
			luts = null,
			lutse = null,
			output = this.ruleTableOutput,
			nCompressed = this.ruleTableCompressedRules,
			isMatch = 0,
			iRuleC = 0,
			iBit = 0,
			mask = 0,

			// cells
			n = 0,
			e = 0,
			s = 0,
			w = 0,
			c = 0,
			ne = 0,
			nw = 0,
			se = 0,
			sw = 0,
			
			// states and counters
			state = 0,
			y = 0,
			x = 0,
			bit = 0,
			th = 0, tw = 0,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			colourTileHistoryRow = null,
			colourTileGrid = this.colourTileGrid,
			colourTileRow = null,
			grid = null, nextGrid = null,
			grid32 = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
			bottomY = 0, topY = 0, leftX = 0, rightX = 0,

			// whether cells were set in the tile
			tileCells = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
			colOccupied = 0,
			colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			rowOccupied = 0,
			rowIndex = 0,

			// population statistics
			population = 0, births = 0, deaths = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
			width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    xSize = this.tileY,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid = this.colourGrid;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid = this.nextColourGrid;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;
			rightX = leftX + xSize;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// get initial values for this row
								if (x === 0) {
									n = 0;
									s = 0;
									c = 0;
								} else {
									n = gridRow0[x - 1];
									s = gridRow2[x - 1];
									c = gridRow1[x - 1];
								}
								ne = gridRow0[x];
								se = gridRow2[x];
								e = gridRow1[x];

								// process each cell along the tile row
								while (x < rightX - 1) {
									nw = n;
									n = ne;
									ne = gridRow0[x + 1];
									w = c;
									c = e;
									e = gridRow1[x + 1];
									sw = s;
									s = se;
									se = gridRow2[x + 1];
									state = c;
									lutc = lut0[c];
									lutn = lut1[n];
									lutne = lut2[ne];
									lute = lut3[e];
									lutse = lut4[se];
									luts = lut5[s];
									lutsw = lut6[sw];
									lutw = lut7[w];
									lutnw = lut8[nw];
									for (iRuleC = 0; iRuleC < nCompressed; iRuleC += 1) {
										isMatch = lutc[iRuleC] & lutn[iRuleC];
										if (isMatch) {
											isMatch &= lutne[iRuleC] & lute[iRuleC];
											if (isMatch) {
												isMatch &= lutse[iRuleC] & luts[iRuleC];
												if (isMatch) {
													isMatch &= lutsw[iRuleC] & lutw[iRuleC] & lutnw[iRuleC];
													if (isMatch) {
														iBit = 0;
														mask = 1;
														while (!(isMatch & mask)) {
															iBit += 1;
															mask <<= 1;
														}
														state = output[(iRuleC << 5) + iBit];
														break;
													}
												}
											}
										}
									}
	
									// check if state is alive
									nextRow[x] = state;
									if (state > 0) {
										population += 1;
	
										// update births
										if (c === 0) {
											births += 1;
										}
										rowOccupied |= rowIndex;
										colOccupied |= colIndex;
									} else {
										// check for death
										if (c > 0) {
											// update deaths
											deaths += 1;
										}
									}
	
									// next column
									colIndex >>= 1;
									x += 1;
								}

								// handle right edge
								nw = n;
								n = ne;
								w = c;
								c = e;
								sw = s;
								s = se;
								if (x === width - 1) {
									ne = 0;
									e = 0;
									se = 0;
								} else {
									ne = gridRow0[x + 1];
									e = gridRow1[x + 1];
									se = gridRow2[x + 1];
								}
								lutc = lut0[c];
								lutn = lut1[n];
								lutne = lut2[ne];
								lute = lut3[e];
								lutse = lut4[se];
								luts = lut5[s];
								lutsw = lut6[sw];
								lutw = lut7[w];
								lutnw = lut8[nw];
								state = c;
								for (iRuleC = 0; iRuleC < nCompressed; iRuleC += 1) {
									isMatch = lutc[iRuleC] & lutn[iRuleC];
									if (isMatch) {
										isMatch &= lutne[iRuleC] & lute[iRuleC];
										if (isMatch) {
											isMatch &= lutse[iRuleC] & luts[iRuleC];
											if (isMatch) {
												isMatch &= lutsw[iRuleC] & lutw[iRuleC] & lutnw[iRuleC];
												if (isMatch) {
													iBit = 0;
													mask = 1;
													while (!(isMatch & mask)) {
														iBit += 1;
														mask <<= 1;
													}
													state = output[(iRuleC << 5) + iBit];
													break;
												}
											}
										}
									}
								}
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
						rightX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
					rightX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// update the life grid region using tiles for hexagonal RuleTable patterns
	Life.prototype.nextGenerationRuleTableTileHex = function() {
		var gridRow0 = null,
			gridRow1 = null,
			gridRow2 = null,
			nextRow = null,
			lut = this.ruleTableLUT,
			lut0 = lut[0],
			lut1 = lut[1],
			lut2 = lut[2],
			lut3 = lut[3],
			lut4 = lut[4],
			lut5 = lut[5],
			lut6 = lut[6],
			lutn = null,
			lute = null,
			luts = null,
			lutw = null,
			lutc = null,
			lutnw = null,
			lutse = null,
			output = this.ruleTableOutput,
			nCompressed = this.ruleTableCompressedRules,
			isMatch = 0,
			iRuleC = 0,
			iBit = 0,
			mask = 0,

			// cells
			n = 0,
			e = 0,
			s = 0,
			w = 0,
			c = 0,
			nw = 0,
			se = 0,
			
			// states and counters
			state = 0,
			y = 0,
			x = 0,
			bit = 0,
			th = 0, tw = 0,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			colourTileHistoryRow = null,
			colourTileGrid = this.colourTileGrid,
			colourTileRow = null,
			grid = null, nextGrid = null,
			grid32 = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
			bottomY = 0, topY = 0, leftX = 0, rightX = 0,

			// whether cells were set in the tile
			tileCells = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
			colOccupied = 0,
			colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			rowOccupied = 0,
			rowIndex = 0,

			// population statistics
			population = 0, births = 0, deaths = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
			width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    xSize = this.tileY,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid = this.colourGrid;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid = this.nextColourGrid;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;
			rightX = leftX + xSize;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// get initial values for this row
								if (x === 0) {
									n = 0;
									s = 0;
									c = 0;
								} else {
									n = gridRow0[x - 1];
									s = gridRow2[x - 1];
									c = gridRow1[x - 1];
								}
								se = gridRow2[x];
								e = gridRow1[x];

								// process each cell along the tile row
								while (x < rightX - 1) {
									nw = n;
									n = gridRow0[x];
									w = c;
									c = e;
									e = gridRow1[x + 1];
									s = se;
									se = gridRow2[x + 1];
									lutc = lut0[c];
									lutn = lut1[n];
									lute = lut2[e];
									lutse = lut3[se];
									luts = lut4[s];
									lutw = lut5[w];
									lutnw = lut6[nw];
									state = c;
									for (iRuleC = 0; iRuleC < nCompressed; iRuleC += 1) {
										isMatch = lutc[iRuleC] & lutn[iRuleC];
										if (isMatch) {
											isMatch &= lute[iRuleC] & lutse[iRuleC];
											if (isMatch) {
												isMatch &= luts[iRuleC] & lutw[iRuleC] & lutnw[iRuleC];
												if (isMatch) {
													iBit = 0;
													mask = 1;
													while (!(isMatch & mask)) {
														iBit += 1;
														mask <<= 1;
													}
													state = output[(iRuleC << 5) + iBit];
													break;
												}
											}
										}
									}

									// check if state is alive
									nextRow[x] = state;
									if (state > 0) {
										population += 1;
	
										// update births
										if (c === 0) {
											births += 1;
										}
										rowOccupied |= rowIndex;
										colOccupied |= colIndex;
									} else {
										// check for death
										if (c > 0) {
											// update deaths
											deaths += 1;
										}
									}
	
									// next column
									colIndex >>= 1;
									x += 1;
								}

								// handle right edge
								nw = n;
								n = gridRow0[x];
								w = c;
								c = e;
								s = se;
								if (x === width - 1) {
									e = 0;
									se = 0;
								} else {
									e = gridRow1[x + 1];
									se = gridRow2[x + 1];
								}
								lutc = lut0[c];
								lutn = lut1[n];
								lute = lut2[e];
								lutse = lut3[se];
								luts = lut4[s];
								lutw = lut5[w];
								lutnw = lut6[nw];
								state = c;
								for (iRuleC = 0; iRuleC < nCompressed; iRuleC += 1) {
									isMatch = lutc[iRuleC] & lutn[iRuleC];
									if (isMatch) {
										isMatch &= lute[iRuleC] & lutse[iRuleC];
										if (isMatch) {
											isMatch &= luts[iRuleC] & lutw[iRuleC] & lutnw[iRuleC];
											if (isMatch) {
												iBit = 0;
												mask = 1;
												while (!(isMatch & mask)) {
													iBit += 1;
													mask <<= 1;
												}
												state = output[(iRuleC << 5) + iBit];
												break;
											}
										}

									}
								}
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
						rightX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
					rightX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};
	// update the life grid using tiles for RuleTree patterns
	Life.prototype.nextGenerationRuleTreeTile = function() {
		// check neighbourhood
		if (this.ruleTreeNeighbours === 4) {
			if (this.ruleTreeLookup !== null) {
				// pick appropriate algo for state bits
				switch (this.ruleTreeLookupBits) {
				case 1:
					this.nextGenerationRuleTreeTileVNLookup1();
					break;
				case 2:
					this.nextGenerationRuleTreeTileVNLookup2();
					break;
				case 3:
					this.nextGenerationRuleTreeTileVNLookup3();
					break;
				case 4:
					this.nextGenerationRuleTreeTileVNLookup4();
					break;
				default:
					this.nextGenerationRuleTreeTileVN();
				}
			} else {
				this.nextGenerationRuleTreeTileVN();
			}
		} else {
			this.nextGenerationRuleTreeTileMoore();
		}
	};

	// update the life grid region using tiles for Moore RuleTree patterns
	Life.prototype.nextGenerationRuleTreeTileMoore = function() {
		var gridRow0 = null,
			gridRow1 = null,
			gridRow2 = null,
			nextRow = null,
			a = this.ruleTreeA,
			b = this.ruleTreeB,
			base = this.ruleTreeBase,

			// cells
			n = 0,
			e = 0,
			s = 0,
			w = 0,
			c = 0,
			ne = 0,
			nw = 0,
			se = 0,
			sw = 0,
			
			// states and counters
			state = 0,
			y = 0,
			x = 0,
			bit = 0,
			th = 0, tw = 0,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			colourTileHistoryRow = null,
			colourTileGrid = this.colourTileGrid,
			colourTileRow = null,
			grid = null, nextGrid = null,
			grid32 = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
			belowNextTiles = 0, aboveNextTiles = 0,
			bottomY = 0, topY = 0, leftX = 0,

			// whether cells were set in the tile
			tileCells = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
			colOccupied = 0,
			colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			rowOccupied = 0,
			rowIndex = 0,

			// population statistics
			population = 0, births = 0, deaths = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
			width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    xSize = this.tileY,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
			neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid = this.colourGrid;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid = this.nextColourGrid;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// get initial values for this row
								if (x === 0) {
									n = 0;
									s = 0;
									c = 0;
								} else {
									n = gridRow0[x - 1];
									s = gridRow2[x - 1];
									c = gridRow1[x - 1];
								}
								ne = gridRow0[x];
								se = gridRow2[x];
								e = gridRow1[x];

								// process each cell along the tile row
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];

								// check if state is alive
								nextRow[x] = state;
								if (state > 0) {
									population += 1;

									// update births
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									// check for death
									if (c > 0) {
										// update deaths
										deaths += 1;
									}
								}

								// next column
								colIndex >>= 1;
								x += 1;

								// unroll 1
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 2
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 3
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 4
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 5
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 6
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 7
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 8
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 9
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 10
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 11
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 12
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 13
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 14
								nw = n;
								n = ne;
								ne = gridRow0[x + 1];
								w = c;
								c = e;
								e = gridRow1[x + 1];
								sw = s;
								s = se;
								se = gridRow2[x + 1];
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 15 (and handle right edge)
								nw = n;
								n = ne;
								w = c;
								c = e;
								sw = s;
								s = se;
								if (x === width - 1) {
									ne = 0;
									e = 0;
									se = 0;
								} else {
									ne = gridRow0[x + 1];
									e = gridRow1[x + 1];
									se = gridRow2[x + 1];
								}
								state = b[a[a[a[a[a[a[a[a[base + nw] + ne] + sw] + se] + n] + w] + e] + s] + c];
								nextRow[x] = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// update the life grid region using tiles for von Neumann RuleTree patterns using array for 1bit states
	Life.prototype.nextGenerationRuleTreeTileVNLookup1 = function() {
		var /** @type {Array<number>} */ gridRow0 = null,
			/** @type {Array<number>} */ gridRow1 = null,
			/** @type {Array<number>} */ gridRow2 = null,
			/** @type {Array<number>} */ nextRow = null,
			/** @type {Array<number>} */ lookup = this.ruleTreeLookup,

			// cells
			/** @type {number} */ n = 0,
			/** @type {number} */ e = 0,
			/** @type {number} */ s = 0,

			// states and counters
			/** @type {number} */ state = 0,
			/** @type {number} */ state32 = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ bit = 0,
			/** @type {number} */ th = 0,
			/** @type {number} */ tw = 0,
			/** @type {number} */ index = 0,

			/** @type {Array<Array<number>>} */ colourTileHistoryGrid = this.colourTileHistoryGrid,
			/** @type {Array<number>} */ colourTileHistoryRow = null,
			/** @type {Array<Array<number>>} */ colourTileGrid = this.colourTileGrid,
			/** @type {Array<number>} */ colourTileRow = null,
			/** @type {Array<Array<number>>} */ grid = null,
			/** @type {Array<Array<number>>} */ nextGrid32 = null,
			/** @type {Array<Array<number>>} */ grid32 = null,
			/** @type {Array<Array<number>>} */ tileGrid = null,
			/** @type {Array<Array<number>>} */ nextTileGrid = null,
			/** @type {Array<number>} */ tileRow = null,
			/** @type {Array<number>} */ nextTileRow = null,
			/** @type {Array<number>} */ belowNextTileRow = null,
			/** @type {Array<number>} */ aboveNextTileRow = null,
			
			/** @type {number} */ tiles = 0,
			/** @type {number} */ nextTiles = 0,
			/** @type {number} */ belowNextTiles = 0,
			/** @type {number} */ aboveNextTiles = 0,
			/** @type {number} */ bottomY = 0,
			/** @type {number} */ topY = 0,
			/** @type {number} */ leftX = 0,

			// whether cells were set in the tile
			/** @type {number} */ tileCells = 0,

		    // column occupied
			/** @type {Array<number>} */ columnOccupied16 = this.columnOccupied16,
			/** @type {number} */ colOccupied = 0,
			/** @type {number} */ colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			/** @type {number} */ rowOccupied = 0,
			/** @type {number} */ rowIndex = 0,

			// population statistics
			/** @type {number} */ population = 0,
			/** @type {number} */ births = 0,
			/** @type {number} */ deaths = 0,

		    // height of grid
		    /** @type {number} */ height = this.height,

		    // width of grid
		    /** @type {number} */ width = this.width,

		    // width of grid in 16 bit chunks
			/** @type {number} */ width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    /** @type {number} */ newBottomY = height,
		    /** @type {number} */ newTopY = -1,
		    /** @type {number} */ newLeftX = width,
		    /** @type {number} */ newRightX = -1,

		    // set tile height
		    /** @type {number} */ ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    /** @type {number} */ xSize = this.tileY,

		    // tile rows
		    /** @type {number} */ tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    /** @type {number} */ tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    /** @type {Array<number>} */ blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    /** @type {number} */ neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid32 = this.colourGrid32;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid32 = this.nextColourGrid32;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid32[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// process each cell along the tile row
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								if (x === 0) {
									// handle left edge of grid
									index = (gridRow1[x] << 3) | (e << 2) | (n << 1) | s;
								} else {
									index = (gridRow1[x - 1] << 4) | (gridRow1[x] << 3) | (e << 2) | (n << 1) | s;
								}
								state32 = lookup[index];

								// check if state is alive
								if (state32 > 0) {
									population += 1;

									// update births
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									// check for death
									if ((index & 8) !== 0) {
										// update deaths
										deaths += 1;
									}
								}
	
								// next column
								colIndex >>= 1;
								x += 1;

								// unroll 1
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 2
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 3
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 4
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 5
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 6
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 7
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 8
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 9
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 10
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 11
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 12
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 13
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 14
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 8) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 8) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 15 (and handle right edge)
								n = gridRow0[x];
								if (x === width - 1) {
									e = 0;
								} else {
									e = gridRow1[x + 1];
								}
								s = gridRow2[x];
								index = ((index << 1) & 24) | (e << 2) | (n << 1) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// update the life grid region using tiles for von Neumann RuleTree patterns using array for 2bit states
	Life.prototype.nextGenerationRuleTreeTileVNLookup2 = function() {
		var /** @type {Array<number>} */ gridRow0 = null,
			/** @type {Array<number>} */ gridRow1 = null,
			/** @type {Array<number>} */ gridRow2 = null,
			/** @type {Array<number>} */ nextRow = null,
			/** @type {Array<number>} */ lookup = this.ruleTreeLookup,

			// cells
			/** @type {number} */ n = 0,
			/** @type {number} */ e = 0,
			/** @type {number} */ s = 0,

			// states and counters
			/** @type {number} */ state = 0,
			/** @type {number} */ state32 = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ bit = 0,
			/** @type {number} */ th = 0,
			/** @type {number} */ tw = 0,
			/** @type {number} */ index = 0,

			/** @type {Array<Array<number>>} */ colourTileHistoryGrid = this.colourTileHistoryGrid,
			/** @type {Array<number>} */ colourTileHistoryRow = null,
			/** @type {Array<Array<number>>} */ colourTileGrid = this.colourTileGrid,
			/** @type {Array<number>} */ colourTileRow = null,
			/** @type {Array<Array<number>>} */ grid = null,
			/** @type {Array<Array<number>>} */ nextGrid32 = null,
			/** @type {Array<Array<number>>} */ grid32 = null,
			/** @type {Array<Array<number>>} */ tileGrid = null,
			/** @type {Array<Array<number>>} */ nextTileGrid = null,
			/** @type {Array<number>} */ tileRow = null,
			/** @type {Array<number>} */ nextTileRow = null,
			/** @type {Array<number>} */ belowNextTileRow = null,
			/** @type {Array<number>} */ aboveNextTileRow = null,
			
			/** @type {number} */ tiles = 0,
			/** @type {number} */ nextTiles = 0,
			/** @type {number} */ belowNextTiles = 0,
			/** @type {number} */ aboveNextTiles = 0,
			/** @type {number} */ bottomY = 0,
			/** @type {number} */ topY = 0,
			/** @type {number} */ leftX = 0,

			// whether cells were set in the tile
			/** @type {number} */ tileCells = 0,

		    // column occupied
			/** @type {Array<number>} */ columnOccupied16 = this.columnOccupied16,
			/** @type {number} */ colOccupied = 0,
			/** @type {number} */ colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			/** @type {number} */ rowOccupied = 0,
			/** @type {number} */ rowIndex = 0,

			// population statistics
			/** @type {number} */ population = 0,
			/** @type {number} */ births = 0,
			/** @type {number} */ deaths = 0,

		    // height of grid
		    /** @type {number} */ height = this.height,

		    // width of grid
		    /** @type {number} */ width = this.width,

		    // width of grid in 16 bit chunks
			/** @type {number} */ width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    /** @type {number} */ newBottomY = height,
		    /** @type {number} */ newTopY = -1,
		    /** @type {number} */ newLeftX = width,
		    /** @type {number} */ newRightX = -1,

		    // set tile height
		    /** @type {number} */ ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    /** @type {number} */ xSize = this.tileY,

		    // tile rows
		    /** @type {number} */ tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    /** @type {number} */ tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    /** @type {Array<number>} */ blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    /** @type {number} */ neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid32 = this.colourGrid32;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid32 = this.nextColourGrid32;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid32[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// process each cell along the tile row
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								if (x === 0) {
									// handle left edge of grid
									index = (gridRow1[x] << 6) | (e << 4) | (n << 2) | s;
								} else {
									index = (gridRow1[x - 1] << 8) | (gridRow1[x] << 6) | (e << 4) | (n << 2) | s;
								}
								state32 = lookup[index];

								// check if state is alive
								if (state32 > 0) {
									population += 1;

									// update births
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									// check for death
									if ((index & 192) !== 0) {
										// update deaths
										deaths += 1;
									}
								}
	
								// next column
								colIndex >>= 1;
								x += 1;

								// unroll 1
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 2
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 3
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 4
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 5
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 6
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 7
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 8
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 9
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 10
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 11
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 12
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 13
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 14
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 15 (and handle right edge)
								n = gridRow0[x];
								if (x === width - 1) {
									e = 0;
								} else {
									e = gridRow1[x + 1];
								}
								s = gridRow2[x];
								index = ((index << 2) & 960) | (e << 4) | (n << 2) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 192) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 192) !== 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// update the life grid region using tiles for von Neumann RuleTree patterns using array for 3bit states
	Life.prototype.nextGenerationRuleTreeTileVNLookup3 = function() {
		var /** @type {Array<number>} */ gridRow0 = null,
			/** @type {Array<number>} */ gridRow1 = null,
			/** @type {Array<number>} */ gridRow2 = null,
			/** @type {Array<number>} */ nextRow = null,
			/** @type {Array<number>} */ lookup = this.ruleTreeLookup,

			// cells
			/** @type {number} */ n = 0,
			/** @type {number} */ e = 0,
			/** @type {number} */ s = 0,

			// states and counters
			/** @type {number} */ state = 0,
			/** @type {number} */ state32 = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ bit = 0,
			/** @type {number} */ th = 0,
			/** @type {number} */ tw = 0,
			/** @type {number} */ index = 0,

			/** @type {Array<Array<number>>} */ colourTileHistoryGrid = this.colourTileHistoryGrid,
			/** @type {Array<number>} */ colourTileHistoryRow = null,
			/** @type {Array<Array<number>>} */ colourTileGrid = this.colourTileGrid,
			/** @type {Array<number>} */ colourTileRow = null,
			/** @type {Array<Array<number>>} */ grid = null,
			/** @type {Array<Array<number>>} */ nextGrid32 = null,
			/** @type {Array<Array<number>>} */ grid32 = null,
			/** @type {Array<Array<number>>} */ tileGrid = null,
			/** @type {Array<Array<number>>} */ nextTileGrid = null,
			/** @type {Array<number>} */ tileRow = null,
			/** @type {Array<number>} */ nextTileRow = null,
			/** @type {Array<number>} */ belowNextTileRow = null,
			/** @type {Array<number>} */ aboveNextTileRow = null,
			
			/** @type {number} */ tiles = 0,
			/** @type {number} */ nextTiles = 0,
			/** @type {number} */ belowNextTiles = 0,
			/** @type {number} */ aboveNextTiles = 0,
			/** @type {number} */ bottomY = 0,
			/** @type {number} */ topY = 0,
			/** @type {number} */ leftX = 0,

			// whether cells were set in the tile
			/** @type {number} */ tileCells = 0,

		    // column occupied
			/** @type {Array<number>} */ columnOccupied16 = this.columnOccupied16,
			/** @type {number} */ colOccupied = 0,
			/** @type {number} */ colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			/** @type {number} */ rowOccupied = 0,
			/** @type {number} */ rowIndex = 0,

			// population statistics
			/** @type {number} */ population = 0,
			/** @type {number} */ births = 0,
			/** @type {number} */ deaths = 0,

		    // height of grid
		    /** @type {number} */ height = this.height,

		    // width of grid
		    /** @type {number} */ width = this.width,

		    // width of grid in 16 bit chunks
			/** @type {number} */ width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    /** @type {number} */ newBottomY = height,
		    /** @type {number} */ newTopY = -1,
		    /** @type {number} */ newLeftX = width,
		    /** @type {number} */ newRightX = -1,

		    // set tile height
		    /** @type {number} */ ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    /** @type {number} */ xSize = this.tileY,

		    // tile rows
		    /** @type {number} */ tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    /** @type {number} */ tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    /** @type {Array<number>} */ blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    /** @type {number} */ neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid32 = this.colourGrid32;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid32 = this.nextColourGrid32;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid32[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// process each cell along the tile row
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								if (x === 0) {
									// handle left edge of grid
									index = (gridRow1[x] << 9) | (e << 6) | (n << 3) | s;
								} else {
									index = (gridRow1[x - 1] << 12) | (gridRow1[x] << 9) | (e << 6) | (n << 3) | s;
								}
								state32 = lookup[index];

								// check if state is alive
								if (state32 > 0) {
									population += 1;

									// update births
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									// check for death
									if ((index & 3584) !== 0) {
										// update deaths
										deaths += 1;
									}
								}
	
								// next column
								colIndex >>= 1;
								x += 1;

								// unroll 1
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 2
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 3
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 4
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 5
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 6
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 7
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 8
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 9
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 10
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 11
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 12
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 13
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 14
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 15 (and handle right edge)
								n = gridRow0[x];
								if (x === width - 1) {
									e = 0;
								} else {
									e = gridRow1[x + 1];
								}
								s = gridRow2[x];
								index = ((index << 3) & 32256) | (e << 6) | (n << 3) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 3584) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 3584) !== 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// update the life grid region using tiles for von Neumann RuleTree patterns using array for 4bit states
	Life.prototype.nextGenerationRuleTreeTileVNLookup4 = function() {
		var /** @type {Array<number>} */ gridRow0 = null,
			/** @type {Array<number>} */ gridRow1 = null,
			/** @type {Array<number>} */ gridRow2 = null,
			/** @type {Array<number>} */ nextRow = null,
			/** @type {Array<number>} */ lookup = this.ruleTreeLookup,

			// cells
			/** @type {number} */ n = 0,
			/** @type {number} */ e = 0,
			/** @type {number} */ s = 0,

			// states and counters
			/** @type {number} */ state = 0,
			/** @type {number} */ state32 = 0,
			/** @type {number} */ y = 0,
			/** @type {number} */ x = 0,
			/** @type {number} */ bit = 0,
			/** @type {number} */ th = 0,
			/** @type {number} */ tw = 0,
			/** @type {number} */ index = 0,

			/** @type {Array<Array<number>>} */ colourTileHistoryGrid = this.colourTileHistoryGrid,
			/** @type {Array<number>} */ colourTileHistoryRow = null,
			/** @type {Array<Array<number>>} */ colourTileGrid = this.colourTileGrid,
			/** @type {Array<number>} */ colourTileRow = null,
			/** @type {Array<Array<number>>} */ grid = null,
			/** @type {Array<Array<number>>} */ nextGrid32 = null,
			/** @type {Array<Array<number>>} */ grid32 = null,
			/** @type {Array<Array<number>>} */ tileGrid = null,
			/** @type {Array<Array<number>>} */ nextTileGrid = null,
			/** @type {Array<number>} */ tileRow = null,
			/** @type {Array<number>} */ nextTileRow = null,
			/** @type {Array<number>} */ belowNextTileRow = null,
			/** @type {Array<number>} */ aboveNextTileRow = null,
			
			/** @type {number} */ tiles = 0,
			/** @type {number} */ nextTiles = 0,
			/** @type {number} */ belowNextTiles = 0,
			/** @type {number} */ aboveNextTiles = 0,
			/** @type {number} */ bottomY = 0,
			/** @type {number} */ topY = 0,
			/** @type {number} */ leftX = 0,

			// whether cells were set in the tile
			/** @type {number} */ tileCells = 0,

		    // column occupied
			/** @type {Array<number>} */ columnOccupied16 = this.columnOccupied16,
			/** @type {number} */ colOccupied = 0,
			/** @type {number} */ colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			/** @type {number} */ rowOccupied = 0,
			/** @type {number} */ rowIndex = 0,

			// population statistics
			/** @type {number} */ population = 0,
			/** @type {number} */ births = 0,
			/** @type {number} */ deaths = 0,

		    // height of grid
		    /** @type {number} */ height = this.height,

		    // width of grid
		    /** @type {number} */ width = this.width,

		    // width of grid in 16 bit chunks
			/** @type {number} */ width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    /** @type {number} */ newBottomY = height,
		    /** @type {number} */ newTopY = -1,
		    /** @type {number} */ newLeftX = width,
		    /** @type {number} */ newRightX = -1,

		    // set tile height
		    /** @type {number} */ ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    /** @type {number} */ xSize = this.tileY,

		    // tile rows
		    /** @type {number} */ tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    /** @type {number} */ tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    /** @type {Array<number>} */ blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    /** @type {number} */ neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid32 = this.colourGrid32;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid32 = this.nextColourGrid32;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid32[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// process each cell along the tile row
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								if (x === 0) {
									// handle left edge of grid
									index = (gridRow1[x] << 12) | (e << 8) | (n << 4) | s;
								} else {
									index = (gridRow1[x - 1] << 16) | (gridRow1[x] << 12) | (e << 8) | (n << 4) | s;
								}
								state32 = lookup[index];

								// check if state is alive
								if (state32 > 0) {
									population += 1;

									// update births
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									// check for death
									if ((index & 61440) !== 0) {
										// update deaths
										deaths += 1;
									}
								}
	
								// next column
								colIndex >>= 1;
								x += 1;

								// unroll 1
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 2
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 3
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 4
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 5
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 6
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 7
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 8
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 9
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 10
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 11
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 12
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state32 = lookup[index];
								if (state32 > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 13
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 14
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 15 (and handle right edge)
								n = gridRow0[x];
								if (x === width - 1) {
									e = 0;
								} else {
									e = gridRow1[x + 1];
								}
								s = gridRow2[x];
								index = ((index << 4) & 1044480) | (e << 8) | (n << 4) | s;
								state = lookup[index];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if ((index & 61440) === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if ((index & 61440) !== 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// update the life grid region using tiles for von Neumann RuleTree patterns
	Life.prototype.nextGenerationRuleTreeTileVN = function() {
		var gridRow0 = null,
			gridRow1 = null,
			gridRow2 = null,
			nextRow = null,
			a = this.ruleTreeA,
			b = this.ruleTreeB,
			base = this.ruleTreeBase,

			// cells
			n = 0,
			e = 0,
			s = 0,
			w = 0,
			c = 0,
			
			state = 0,
			state32 = 0,
			y = 0,
			x = 0,
			bit = 0,
			th = 0, tw = 0,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			colourTileHistoryRow = null,
			colourTileGrid = this.colourTileGrid,
			colourTileRow = null,
			grid = null,
			nextGrid32 = null,
			grid32 = null,
		    tileGrid = null, nextTileGrid = null,
		    tileRow = null, nextTileRow = null,
		    belowNextTileRow = null, aboveNextTileRow = null,
		    tiles = 0, nextTiles = 0,
		    belowNextTiles = 0, aboveNextTiles = 0,
			bottomY = 0, topY = 0, leftX = 0,

			// whether cells were set in the tile
			tileCells = 0,

		    // column occupied
		    columnOccupied16 = this.columnOccupied16,
			colOccupied = 0,
			colIndex = 0,
			
			// row occupied
			rowOccupied16 = this.rowOccupied16,
			rowOccupied = 0,
			rowIndex = 0,

			// population statistics
			population = 0, births = 0, deaths = 0,

		    // height of grid
		    height = this.height,

		    // width of grid
		    width = this.width,

		    // width of grid in 16 bit chunks
			width16 = width >> 4,

		    // get the bounding box
		    zoomBox = this.zoomBox,

		    // new box extent
		    newBottomY = height,
		    newTopY = -1,
		    newLeftX = width,
		    newRightX = -1,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (use height since we need bytes)
		    xSize = this.tileY,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // blank tile row for top and bottom
		    blankTileRow = this.blankTileRow,

		    // flags for edges of tile occupied
		    neighbours = 0;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			grid32 = this.nextColourGrid32;
			nextGrid32 = this.colourGrid32;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;
		} else {
			grid = this.colourGrid;
			grid32 = this.colourGrid32;
			nextGrid32 = this.nextColourGrid32;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;
		}

		// clear column occupied flags
		columnOccupied16.fill(0);

		// clear row occupied flags
		rowOccupied16.fill(0);

		// set the initial tile row
		bottomY = 0;
		topY = bottomY + ySize;

		// clear the next tile grid
		nextTileGrid.whole.fill(0);

		// scan each row of tiles
		for (th = 0; th < tileGrid.length; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// get the tile row below
			if (th > 0) {
				belowNextTileRow = nextTileGrid[th - 1];
			} else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			} else {
				aboveNextTileRow = blankTileRow;
			}

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileRow[tw];

				// check if any are occupied
				if (tiles) {
					// get the destination (with any set because of edges)
					nextTiles = nextTileRow[tw];
					belowNextTiles = belowNextTileRow[tw];
					aboveNextTiles = aboveNextTileRow[tw];

					// compute next generation for each set tile
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if this tile needs computing
						if ((tiles & (1 << bit)) !== 0) {
							// mark no cells in this column
							colOccupied = 0;

							// mark no cells in the tile rows
							rowOccupied = 0;

							// clear the edge flags
							neighbours = 0;

							// process the bottom row of the tile
							y = bottomY;
							rowIndex = 32768;

							if (y === 0) {
								gridRow0 = this.blankColourRow;
							} else {
								gridRow0 = grid[y - 1];
							}
							gridRow1 = grid[y];

							// process each row of the tile
							while (y < topY) {
								// deal with bottom row of the grid
								if (y === 0) {
									gridRow0 = this.blankColourRow;
								} else {
									gridRow0 = grid[y - 1];
								}
	
								// current row
								gridRow1 = grid[y];

								// deal with top row of the grid
								if (y === this.height - 1) {
									gridRow2 = this.blankColourRow;
								} else {
									gridRow2 = grid[y + 1];
								}

								// get output row
								nextRow = nextGrid32[y];

								// column index
								colIndex = 32768;

								// process each column in the row
								x = leftX;

								// get initial values for this row
								if (x === 0) {
									c = 0;
								} else {
									c = gridRow1[x - 1];
								}
								e = gridRow1[x];

								// process each cell along the tile row
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 = state;

								// check if state is alive
								if (state > 0) {
									population += 1;

									// update births
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									// check for death
									if (c > 0) {
										// update deaths
										deaths += 1;
									}
								}
	
								// next column
								colIndex >>= 1;
								x += 1;

								// unroll 1
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 2
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 3
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 4
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 5
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 6
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 7
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 8
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 9
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 10
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 11
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 12
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 = state;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 13
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 8);
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 14
								w = c;
								c = e;
								n = gridRow0[x];
								e = gridRow1[x + 1];
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 16);
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}
								colIndex >>= 1;
								x += 1;

								// unroll 15 (and handle right edge)
								w = c;
								c = e;
								n = gridRow0[x];
								if (x === width - 1) {
									e = 0;
								} else {
									e = gridRow1[x + 1];
								}
								s = gridRow2[x];
								state = b[a[a[a[a[base + n] + w] + e] + s] + c];
								state32 |= (state << 24);
								nextRow[x >> 2] = state32;
								if (state > 0) {
									population += 1;
									if (c === 0) {
										births += 1;
									}
									rowOccupied |= rowIndex;
									colOccupied |= colIndex;
								} else {
									if (c > 0) {
										deaths += 1;
									}
								}

								// no need for next column
								//colIndex >>= 1;
								//x += 1;

								// next row
								y += 1;
								rowIndex >>= 1;
							}

							// save the column occupied cells
							columnOccupied16[leftX >> 4] |= colOccupied;

							// update tile grid if any cells are set
							if (colOccupied || tileCells) {
								// set this tile
								nextTiles |= (1 << bit);

								// check for neighbours
								if (rowOccupied & 1) {
									neighbours |= LifeConstants.topSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.topLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.topRightSet;
									}
								}

								if (rowOccupied & 32768) {
									neighbours |= LifeConstants.bottomSet;
									if (colOccupied & 32768) {
										neighbours |= LifeConstants.bottomLeftSet;
									}
									if (colOccupied & 1) {
										neighbours |= LifeConstants.bottomRightSet;
									}
								}

								if (colOccupied & 32768) {
									neighbours |= LifeConstants.leftSet;
								}

								if (colOccupied & 1) {
									neighbours |= LifeConstants.rightSet;
								}

								// update any neighbouring tiles
								if (neighbours) {
									// check whether left edge occupied
									if ((neighbours & LifeConstants.leftSet) !== 0) {
										if (bit < 15) {
											nextTiles |= (1 << (bit + 1));
										} else {
											// set in previous set if not at left edge
											if ((tw > 0) && (leftX > 0)) {
												nextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether right edge occupied
									if ((neighbours & LifeConstants.rightSet) !== 0) {
										if (bit > 0) {
											nextTiles |= (1 << (bit - 1));
										} else {
											// set carry over to go into next set if not at right edge
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												nextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether bottom edge occupied
									if ((neighbours & LifeConstants.bottomSet) !== 0) {
										// set in lower tile set
										belowNextTiles |= (1 << bit);
									}

									// check whether top edge occupied
									if ((neighbours & LifeConstants.topSet) !== 0) {
										// set in upper tile set
										aboveNextTiles |= (1 << bit);
									}

									// check whether bottom left occupied
									if ((neighbours & LifeConstants.bottomLeftSet) !== 0) {
										if (bit < 15) {
											belowNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (bit > 0) {
											belowNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (bit < 15) {
											aboveNextTiles |= (1 << (bit + 1));
										} else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (bit > 0) {
											aboveNextTiles |= (1 << (bit - 1));
										} else {
											if ((tw < tileCols16 - 1) && (leftX < width - 1)) {
												aboveNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}
								}
							}

							// save the row occupied falgs
							rowOccupied16[th] |= rowOccupied;
						}

						// next tile columns
						leftX += xSize;
					}

					// save the tile groups
					nextTileRow[tw] |= nextTiles;
					colourTileRow[tw] = tiles | nextTiles;
					colourTileHistoryRow[tw] |= tiles | nextTiles;
					if (th > 0) {
						belowNextTileRow[tw] |= belowNextTiles;
					}
					if (th < tileRows - 1) {
						aboveNextTileRow[tw] |= aboveNextTiles;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}
			}

			// next tile rows
			bottomY += ySize;
			topY += ySize;
		}

		// update bounding box
		for (tw = 0; tw < width16; tw += 1) {
			if (columnOccupied16[tw]) {
				if (tw < newLeftX) {
					newLeftX = tw;
				}
				if (tw > newRightX) {
					newRightX = tw;
				}
			}
		}

		for (th = 0; th < rowOccupied16.length; th += 1) {
			if (rowOccupied16[th]) {
				if (th < newBottomY) {
					newBottomY = th;
				}
				if (th > newTopY) {
					newTopY = th;
				}
			}
		}

		// convert new width to pixels
		newLeftX = (newLeftX << 4) + this.leftBitOffset16(columnOccupied16[newLeftX]);
		newRightX = (newRightX << 4) + this.rightBitOffset16(columnOccupied16[newRightX]);

		// convert new height to pixels
		newBottomY = (newBottomY << 4) + this.leftBitOffset16(rowOccupied16[newBottomY]);
		newTopY = (newTopY << 4) + this.rightBitOffset16(rowOccupied16[newTopY]);
	
		// ensure the box is not blank
		if (newTopY < 0) {
			newTopY = height - 1;
		}
		if (newBottomY >= height) {
			newBottomY = 0;
		}
		if (newLeftX >= width) {
			newLeftX = 0;
		}
		if (newRightX < 0) {
			newRightX = width - 1;
		}

		// clip to the screen
		if (newTopY > height - 1) {
			newTopY = height - 1;
		}
		if (newBottomY < 0) {
			newBottomY = 0;
		}
		if (newLeftX < 0) {
			newLeftX = 0;
		}
		if (newRightX > width - 1) {
			newRightX = width - 1;
		}

		// save to zoom box
		zoomBox.topY = newTopY;
		zoomBox.bottomY = newBottomY;
		zoomBox.leftX = newLeftX;
		zoomBox.rightX = newRightX;

		// clear the blank tile row since it may have been written to at top and bottom
		blankTileRow.fill(0);

		// clear tiles that died in source
		bottomY = 0;
		topY = bottomY + ySize;
		// process each tile row
		for (th = 0; th < tileGrid.length; th += 1) {
			leftX = 0;
			tileRow = tileGrid[th];
			nextTileRow = nextTileGrid[th];
			// process each tile group in the row
			for (tw = 0; tw < tileCols16; tw += 1) {
				tiles = tileRow[tw];
				nextTiles = nextTileRow[tw];
				// process each tile in the group
				if (tiles !== nextTiles) {
					for (bit = 15; bit >= 0; bit -= 1) {
						// check if tile changed (i.e. was dead and is now alive or vice verse)
						if ((tiles & (1 << bit)) !== (nextTiles & (1 << bit))) {
							// check if tile died
							if ((nextTiles & (1 << bit)) === 0) {
								// clear source cells for double buffering
								for (y = bottomY; y < topY; y += 1) {
									gridRow1 = grid32[y];
									x = leftX >> 2;
									// clear 16 cells
									gridRow1[x] = 0;
									gridRow1[x + 1] = 0;
									gridRow1[x + 2] = 0;
									gridRow1[x + 3] = 0;
								}
							}
						}
						leftX += xSize;
					}
				} else {
					leftX += xSize << 4;
				}
			}
			bottomY += ySize;
			topY += ySize;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;
	};

	// next generation for PCA rules
	Life.prototype.nextGenerationPCATile = function() {
		var indexLookup = this.margolusLookup1,
			y = 0,
			x = 0,
			grid = this.colourGrid,
			nextGrid = this.nextColourGrid,
			zoomBox = this.zoomBox,
			historyBox = this.historyBox,
			leftX = historyBox.leftX,
			bottomY = historyBox.bottomY,
			rightX = historyBox.rightX,
			topY = historyBox.topY,
			state = 0,
			index = 0,
			population = 0,
			births = 0,
			deaths = 0,
			nLeftX = this.width,
			nBottomY = this.height,
			nRightX = 0,
			nTopY = 0,
			zLeftX = this.width,
			zBottomY = this.height,
			zRightX = 0,
			zTopY = 0,
			colourTileGrid = this.colourTileHistoryGrid,
			aboveRow = null,
			gridRow = null,
			belowRow = null,
			tileRow = null,
			nextRow = null,
			rowAlive = false,
			zAlive = false,
			bitCounts = this.bitCounts16,
	
			// maximum dead state number
			deadState = this.historyStates,

			// minimum dead state number
			minDeadState = (this.historyStates > 0 ? 1 : 0),

			// cells
			n = 0,
			e = 0,
			s = 0,
			w = 0,

			// bounded grid width and height
			width = this.boundedGridWidth,
		    height = this.boundedGridHeight,

		    // bottom left
		    bLeftX = Math.round((this.width - width) / 2),
		    bBottomY = Math.round((this.height - height) / 2),

		    // top right
		    bRightX = bLeftX + width - 1,
			bTopY = bBottomY + height - 1;
			
		// check for bounded grid
		if (this.boundedGridType !== -1) {
			leftX = bLeftX + 1;
			bottomY = bBottomY + 1;
			rightX = bRightX - 1;
			topY = bTopY - 1;
		}

		// check for change in playback direction
		if (this.reversePending) {
			this.reverseMargolus = !this.reverseMargolus;
			this.reversePending = false;
		}

		// clear anything alive
		this.anythingAlive = 0;

		// select the correct grid
		if ((this.counter & 1) !== 0) {
			grid = this.nextColourGrid;
			nextGrid = this.colourGrid;

			// check for reverse playback
			if (this.reverseMargolus) {
				if (this.altSpecified) {
					indexLookup = this.margolusReverseLookup1;
				} else {
					indexLookup = this.margolusReverseLookup1;
				}
			}
		} else {
			grid = this.colourGrid;
			nextGrid = this.nextColourGrid;
			if (this.altSpecified) {
				indexLookup = this.margolusLookup2;
			}

			// check for reverse playback
			if (this.reverseMargolus) {
				if (this.altSpecified) {
					indexLookup = this.margolusReverseLookup2;
				} else {
					indexLookup = this.margolusReverseLookup1;
				}
			}
		}

		// ensure on display
		if (bottomY < 1) {
			bottomY = 1;
		}
		if (topY > this.height - 2) {
			topY = this.height - 2;
		}
		if (leftX < 1) {
			leftX = 1;
		}
		if (rightX > this.width - 2) {
			rightX = this.width - 2;
		}

		// process each cell in the bounding box
		for (y = bottomY - 1; y <= topY + 1; y += 1) {
			aboveRow = grid[y - 1];
			gridRow = grid[y];
			belowRow = grid[y + 1];
			tileRow = colourTileGrid[y >> 4];
			nextRow = nextGrid[y];

			// process each row in the bounding box
			rowAlive = false;
			zAlive = false;
			w = gridRow[leftX - 2];
			for (x = leftX - 1; x <= rightX + 1; x += 1) {
				n = belowRow[x];
				e = gridRow[x + 1];
				s = aboveRow[x];

				if (deadState > 0) {
					n = (n <= deadState ? 0 : n - deadState);
					e = (e <= deadState ? 0 : e - deadState);
					s = (s <= deadState ? 0 : s - deadState);
					w = (w <= deadState ? 0 : w - deadState);
				}

				index = w | (n << 4) | (e << 8) | (s << 12);
				state = indexLookup[index];
				w = gridRow[x];

				// check if state is alive
				if (state > 0) {
					population += bitCounts[state];
					nextRow[x] = state + deadState;
					rowAlive = true;
					tileRow[x >> 8] = 65535;

					// update bounding box
					if (x < nLeftX) {
						nLeftX = x;
					}
					if (x > nRightX) {
						nRightX = x;
					}

					// update births
					if (w <= deadState) {
						births += 1;
					}
				} else {
					// check for death
					state = w;
					if (state > deadState) {
						// update deaths
						deaths += 1;
						state = deadState;
					} else {
						// check for dying
						if (state > minDeadState) {
							state -= 1;
						}
					}
					nextRow[x] = state;
					if (state > 0) {
						rowAlive = true;
						if (x < nLeftX) {
							nLeftX = x;
						}
						if (x > nRightX) {
							nRightX = x;
						}
					}
					state = 0;
				}
				
				// check for alive states
				if (state > 0) {
					if (x < zLeftX) {
						zLeftX = x;
					}
					if (x > zRightX) {
						zRightX = x;
					}
					zAlive = true;
				}
			}

			// if any cells alive in the row then update bounding box
			if (rowAlive) {
				if (y < nBottomY) {
					nBottomY = y;
				}
				if (y > nTopY) {
					nTopY = y;
				}
			}
			if (zAlive) {
				if (y < zBottomY) {
					zBottomY = y;
				}
				if (y > zTopY) {
					zTopY = y;
				}
			}
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		this.anythingAlive = population;

		// update bounding boxes
		historyBox.leftX = nLeftX;
		historyBox.bottomY = nBottomY;
		historyBox.rightX = nRightX;
		historyBox.topY = nTopY;
		zoomBox.leftX = zLeftX;
		zoomBox.bottomY = zBottomY;
		zoomBox.rightX = zRightX;
		zoomBox.topY = zTopY;
	};

	// convert life grid region to pens using tiles but without history
	Life.prototype.convertToPensTileNoHistory = function() {
		var h = 0, cr = 0, nextCell = 0,
		    colourGrid16 = this.colourGrid16,
		    colourGridRow = null, colourTileRow = null,
		    colourTileHistoryRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileGrid = this.colourTileGrid,
		    grid = null, gridRow = null, 
		    tileGrid = null, tileGridRow = null,
		    th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    tiles = 0, nextTiles = 0,

			// whether the tile is alive
			tileAlive = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // starting and ending tile row
		    tileStartRow = 0,
		    tileEndRow = tileRows;

		// clear anything alive
		this.anythingAlive = 0;

		// select the correct grid
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			tileGrid = this.nextTileGrid;
		} else {
			grid = this.grid16;
			tileGrid = this.tileGrid;
		}

		// check start and end row are in range
		if (tileStartRow < 0) {
			tileStartRow = 0;
		}
		if (tileEndRow > tileRows) {
			tileEndRow = tileRows;
		}

		// set the initial tile row
		bottomY = tileStartRow << this.tilePower;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			tileGridRow = tileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileGridRow[tw] | colourTileHistoryRow[tw];
				nextTiles = 0;

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// flag nothing alive in the tile
							tileAlive = 0;

							// process each row
							h = bottomY;
							while (h < topY) {
								// get the grid and colour grid row
								gridRow = grid[h];
								colourGridRow = colourGrid16[h];

								// get correct starting colour index
								cr = (leftX << 3);

								// process each 16bit chunk (16 cells) along the row
								nextCell = gridRow[leftX];

								// determine if anything is alive on the grid
								this.anythingAlive |= nextCell;
								tileAlive |= nextCell;

								// lookup next colour
								colourGridRow[cr] = ((nextCell & 32768) >> 9) | (nextCell & 16384);
								cr += 1;
								colourGridRow[cr] = ((nextCell & 8192) >> 7) | ((nextCell & 4096) << 2);
								cr += 1;
								colourGridRow[cr] = ((nextCell & 2048) >> 5) | ((nextCell & 1024) << 4);
								cr += 1;
								colourGridRow[cr] = ((nextCell & 512) >> 3) | ((nextCell & 256) << 6);
								cr += 1;
								colourGridRow[cr] = ((nextCell & 128) >> 1) | ((nextCell & 64) << 8);
								cr += 1;
								colourGridRow[cr] = ((nextCell & 32) << 1) | ((nextCell & 16) << 10);
								cr += 1;
								colourGridRow[cr] = ((nextCell & 8) << 3) | ((nextCell & 4) << 12);
								cr += 1;
								colourGridRow[cr] = ((nextCell & 2) << 5) | ((nextCell & 1) << 14);
								// cr += 1   - no need for final increment it will be reset next row

								// next row
								h += 1;
							}

							// check if the tile was alive
							if (tileAlive) {
								// update tile flag
								nextTiles |= (1 << b);
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}

				// save the tile group
				colourTileRow[tw] = nextTiles;
				colourTileHistoryRow[tw] |= nextTiles;
			}

			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// convert life grid region to pens using tiles
	Life.prototype.convertToPensTileRegular = function() {
		var h = 0, cr = 0, nextCell = 0,
			colourGrid16 = this.colourGrid16,
			value16 = 0,
			colourGridRow16 = null, colourTileRow = null,
		    colourTileHistoryRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileGrid = this.colourTileGrid,
		    colourLookup = this.colourLookup,
		    grid = null, gridRow = null, 
		    tileGrid = null, tileGridRow = null,
		    th = 0, tw = 0, b = 0,
		    bottomY = 0, topY = 0, leftX = 0,
		    tiles = 0, nextTiles = 0,

		    // whether the tile is alive
		    tileAlive = 0,

		    // set tile height
		    ySize = this.tileY,

		    // tile width (in 16bit chunks)
		    xSize = this.tileX >> 1,

		    // tile rows
		    tileRows = this.tileRows,

		    // tile columns in 16 bit values
		    tileCols16 = this.tileCols >> 4,

		    // starting and ending tile row
		    tileStartRow = 0,
		    tileEndRow = tileRows;

		// clear anything alive
		this.anythingAlive = 0;

		// select the correct grid
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			tileGrid = this.nextTileGrid;
		} else {
			grid = this.grid16;
			tileGrid = this.tileGrid;
		}

		// check start and end row are in range
		if (tileStartRow < 0) {
			tileStartRow = 0;
		}
		if (tileEndRow > tileRows) {
			tileEndRow = tileRows;
		}

		// set the initial tile row
		bottomY = tileStartRow << this.tilePower;
		topY = bottomY + ySize;

		// scan each row of tiles
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			// set initial tile column
			leftX = 0;

			// get the tile row and colour tile rows
			tileGridRow = tileGrid[th];
			colourTileRow = colourTileGrid[th];
			colourTileHistoryRow = colourTileHistoryGrid[th];

			// scan each set of tiles
			for (tw = 0; tw < tileCols16; tw += 1) {
				// get the next tile group (16 tiles)
				tiles = tileGridRow[tw] | colourTileRow[tw];
				nextTiles = 0;

				// check if any are occupied
				if (tiles) {
					// compute next colour for each tile in the set
					for (b = 15; b >= 0; b -= 1) {
						// check if this tile is occupied
						if ((tiles & (1 << b)) !== 0) {
							// flag nothing alive in the tile
							tileAlive = 0;

							// process each row
							h = bottomY;
							while (h < topY) {
								// get the grid and colour grid row
								gridRow = grid[h];
								colourGridRow16 = colourGrid16[h];

								// get correct starting colour index
								cr = (leftX << 3);

								// process each 16bit chunk (16 cells) along the row
								nextCell = gridRow[leftX];

								// determine if anything is alive on the grid
								this.anythingAlive |= nextCell;

								// lookup next colour
								value16 = colourLookup[colourGridRow16[cr] | ((nextCell & 32768) >> 8) | ((nextCell & 16384) << 1)];
								tileAlive |= value16;
								colourGridRow16[cr] = value16;
								cr += 1;

								value16 = colourLookup[colourGridRow16[cr] | ((nextCell & 8192) >> 6) | ((nextCell & 4096) << 3)];
								tileAlive |= value16;
								colourGridRow16[cr] = value16;
								cr += 1;

								value16 = colourLookup[colourGridRow16[cr] | ((nextCell & 2048) >> 4) | ((nextCell & 1024) << 5)];
								tileAlive |= value16;
								colourGridRow16[cr] = value16;
								cr += 1;

								value16 = colourLookup[colourGridRow16[cr] | ((nextCell & 512) >> 2) | ((nextCell & 256) << 7)];
								tileAlive |= value16;
								colourGridRow16[cr] = value16;
								cr += 1;

								value16 = colourLookup[colourGridRow16[cr] | (nextCell & 128) | ((nextCell & 64) << 9)];
								tileAlive |= value16;
								colourGridRow16[cr] = value16;
								cr += 1;

								value16 = colourLookup[colourGridRow16[cr] | ((nextCell & 32) << 2) | ((nextCell & 16) << 11)];
								tileAlive |= value16;
								colourGridRow16[cr] = value16;
								cr += 1;

								value16 = colourLookup[colourGridRow16[cr] | ((nextCell & 8) << 4) | ((nextCell & 4) << 13)];
								tileAlive |= value16;
								colourGridRow16[cr] = value16;
								cr += 1;

								value16 = colourLookup[colourGridRow16[cr] | ((nextCell & 2) << 6) | ((nextCell & 1) << 15)];
								tileAlive |= value16;
								colourGridRow16[cr] = value16;
								// cr += 1 - no need for final increments they will be reset next row

								// next row
								h += 1;
							}

							// check if the tile was alive (has any cells not completely faded)
							if (((tileAlive & 255) > 1) || ((tileAlive >> 8) > 1)) {
								// update tile flag
								nextTiles |= (1 << b);
							}
						}

						// next tile columns
						leftX += xSize;
					}
				} else {
					// skip tile set
					leftX += xSize << 4;
				}

				// save the tile group
				colourTileRow[tw] = nextTiles;
				colourTileHistoryRow[tw] |= nextTiles;
			}

			// next tile row
			bottomY += ySize;
			topY += ySize;
		}
	};

	// get zoom at a particular generation
	Life.prototype.zoomAt = function(generation, trackN, trackE, trackS, trackW, displayWidth, displayHeight, minZoom, maxZoom, scaleFactor) {
		var result = 0,
		    initialBox = this.initialBox,
		    leftX = 0,
		    rightX = 0,
		    bottomY = 0,
		    topY = 0,
		    width = 0,
		    height = 0,
		    zoomX = 0,
		    zoomY = 0;

		// compute the track box
		topY = trackS * generation + initialBox.topY;
		rightX = trackE * generation + initialBox.rightX;
		bottomY = trackN * generation + initialBox.bottomY;
		leftX = trackW * generation + initialBox.leftX;

		// compute the width and height
		width = rightX - leftX + 1;
		height = topY - bottomY + 1;

		// check for Hex neighbourhood
		if (this.isHex) {
			leftX -= (topY / 2);
			rightX -= (bottomY / 2);
			width = rightX - leftX + 1;
		}

		// ensure width and height are non zero
		if (width === 0) {
			width = 1;
		}
		if (height === 0) {
			height = 1;
		}

		// compute the zoom in each direction
		zoomX = displayWidth / width;
		zoomY = displayHeight / height;

		// select the zoom from the smallest ratio
		if (zoomX > zoomY) {
			result = zoomY;
		} else {
			result = zoomX;
		}

		// apply scale factor
		result = Math.round(result * 1000 / scaleFactor) / 1000;

		// ensure in range
		if (result < minZoom) {
			result = minZoom;
		} else {
			if (result > maxZoom) {
				result = maxZoom;
			}
		}

		// return the zoom
		return result;
	};

	// make zoom an exact value if close enough to the exact value
	Life.prototype.makeIntegerZoom = function(zoom) {
		var testZoom = zoom,
		    percent = 0,
			intZoom;

		// check for negative zooms and convert to positive
		if (zoom < 1) {
			testZoom = 1 / zoom;
		}

		// get integer zoom
		intZoom = Math.round(testZoom);

		// compute what percentage the integer zoom is of the actual zoom
		if (intZoom < testZoom) {
			percent = intZoom / testZoom;
		} else {
			percent = testZoom / intZoom;
		}
		
		// check if the percentage is within a threshold
		if (percent >= ViewConstants.integerZoomThreshold) {
			if (zoom < 1) {
				zoom = 1 / intZoom;
			} else {
				zoom = intZoom;
			}
		}

		return zoom;
	};

	// fit zoom to display
	Life.prototype.fitZoomDisplay = function(accurateCounter, displayWidth, displayHeight, minZoom, maxZoom, scaleFactor, patternWidth, patternHeight, usePattern, historyFit, useTrackBox, trackN, trackE, trackS, trackW, genSpeed, state1Fit, autoFit) {
		var zoomBox = this.zoomBox,
		    initialBox = this.initialBox,
		    historyBox = this.historyBox,
		    trackBox = this.trackBox,
		    zoom = 1,
		    newX = 0,
		    newY = 0,
		    width = 0,
		    height = 0,
		    zoomX = 0,
		    zoomY = 0,
		    leftX = 0,
		    rightX = 0,
		    topY = 0,
			bottomY = 0;

		// check for track box mode
		if (useTrackBox) {
			// compute the track box
			trackBox.topY = trackS * accurateCounter + initialBox.topY;
			trackBox.rightX = trackE * accurateCounter + initialBox.rightX;
			trackBox.bottomY = trackN * accurateCounter + initialBox.bottomY;
			trackBox.leftX = trackW * accurateCounter + initialBox.leftX;

			// apply history if enabled
			if (historyFit) {
				if (historyBox.leftX < trackBox.leftX) {
					trackBox.leftX = historyBox.leftX;
				}
				if (historyBox.bottomY < trackBox.bottomY) {
					trackBox.bottomY = historyBox.bottomY;
				}
				if (historyBox.rightX > trackBox.rightX) {
					trackBox.rightX = historyBox.rightX;
				}
				if (historyBox.topY > trackBox.topY) {
					trackBox.topY = historyBox.topY;
				}
			}

			// use in calculation
			zoomBox = trackBox;
		} else {
			// check for history mode
			if (historyFit) {
				// use history box
				zoomBox = historyBox;
			} else {
				// check for HROT
				if (this.isHROT) {
					// use HROT alive state box
					zoomBox = this.HROTBox;
				}
			}
		}

		leftX = zoomBox.leftX;
		rightX = zoomBox.rightX;
		topY = zoomBox.topY;
		bottomY = zoomBox.bottomY;

		// ensure box no smaller than initial box due to multi-state cells in LifeHistory
		if (this.isLifeHistory && !state1Fit) {
			if (initialBox.leftX < leftX) {
				leftX = initialBox.leftX;
			}
			if (initialBox.rightX > rightX) {
				rightX = initialBox.rightX;
			}
			if (initialBox.topY > topY) {
				topY = initialBox.topY;
			}
			if (initialBox.bottomY < bottomY) {
				bottomY = initialBox.bottomY;
			}
		}

		// check if bounded box defined
		if (this.boundedGridType !== -1) {
			width = this.boundedGridWidth;
			height = this.boundedGridHeight;
			if (width > 0) {
				if ((this.width / 2 - width / 2) < leftX) {
					leftX = this.width / 2 - width / 2;
				}
				if ((this.width / 2 + width / 2) > rightX) {
					rightX = this.width / 2 + width / 2;
				}
			}
			if (height > 0) {
				if ((this.height / 2 - height / 2) <  bottomY) {
					bottomY = this.height / 2 - height / 2;
				}
				if ((this.height / 2 + height / 2) > topY) {
					topY = this.height / 2 + height / 2;
				}
			}
		}

		// check whether to use pattern dimensions
		if (!usePattern) {
			// compute the width and height
			width = rightX - leftX + 1;
			height = topY - bottomY + 1;
		} else {
			// use pattern width and height
			width = patternWidth;
			height = patternHeight;
			leftX = this.width / 2 - width / 2;
			rightX = this.width / 2 + width / 2;
			topY = this.height / 2 + height / 2;
			bottomY = this.height / 2 - height / 2;
		}

		// check for Hex neighbourhood
		if (this.isHex) {
			leftX -= (topY / 2);
			rightX -= (bottomY / 2);
			width = rightX - leftX + 1;
		}

		// ensure width and height are non zero
		if (width === 0) {
			width = 1;
		}
		if (height === 0) {
			height = 1;
		}

		// compute the zoom in each direction
		zoomX = displayWidth / width;
		zoomY = displayHeight / height;

		// select the zoom from the smallest ratio
		if (zoomX > zoomY) {
			zoom = zoomY;
		} else {
			zoom = zoomX;
		}

		// apply scale factor
		zoom = Math.round(zoom * 1000 / scaleFactor) / 1000;

		// add offset
		zoom /= this.originZ;

		// ensure in range
		if (zoom < minZoom) {
			zoom = minZoom;
		} else {
			if (zoom > maxZoom) {
				zoom = maxZoom;
			}
		}

		// set the x and y offset
		newY = bottomY - this.originY + (height / 2);
		newX = leftX - this.originX + (width / 2);
		
		// make zoom an exact value if close to the exact value
		if (!autoFit) {
			zoom = this.makeIntegerZoom(zoom);
		}

		// return zoom
		return [zoom, newX, newY];
	};

	// draw horizontal line
	Life.prototype.drawHLine = function(startX, endX, y, colour) {
		var data32 = this.data32,
		    w = this.displayWidth,
		    h = this.displayHeight,

		    // pixel offset in bitmap
		    offset = 0,
		    end = 0,
			temp = 0;

		// order the x coordinates
		if (startX > endX) {
			temp = endX;
			endX = startX;
			startX = temp;
		}

		// clip to the display
		if (startX < 0) {
			startX = 0;
		} else {
			if (startX >= w) {
				startX = w - 1;
			}
		}
		if (endX < 0) {
			endX = 0;
		} else {
			if (endX >= w) {
				endX = w - 1;
			}
		}

		// pixel offsets in bitmap
		offset = y * w + startX;
		end = y * w + endX;

		// see if the line is on the display
		if (y >= 0 && y < h) {
			data32.fill(colour, offset, end);
		}
	};

	// draw vertical line
	Life.prototype.drawVLine = function(x, startY, endY, colour) {
		var data32 = this.data32,
			w = this.displayWidth,
			h = this.displayHeight,

		    // pixel offsets in bitmap
		    offset = 0, 
			end = 0,
			endTarget = 0,
			temp = 0;

		// order the y coordinates
		if (startY > endY) {
			temp = endY;
			endY = startY;
			startY = temp;
		}

		// clip to the display
		if (startY < 0) {
			startY = 0;
		} else {
			if (startY >= h) {
				startY = h - 1;
			}
		}
		if (endY < 0) {
			endY = 0;
		} else {
			if (endY >= h) {
				endY = h - 1;
			}
		}

		// pixel offsets in bitmap
		offset = startY * w + x;
		end = endY * w + x;
		endTarget = end - w * 15;

		// see if the line is on the display
		if (x >= 0 && x < w) {
			// draw the horizontal line
			while (offset <= endTarget) {
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
				data32[offset] = colour;
				offset += w;
			}

			// draw the last part
			while (offset <= end) {
				data32[offset] = colour;
				offset += w;
			}
		}
	};

	// bresenham line draw
	Life.prototype.drawBresenhamLine = function(startX, startY, endX, endY, colour) {
		var dx = Math.abs(endX - startX),
		    dy = Math.abs(endY - startY),
		    sx = (startX < endX) ? 1 : -1,
		    sy = (startY < endY) ? 1 : -1,
		    err = dx - dy,
		    e2 = 0,
		    w = this.displayWidth,
		    h = this.displayHeight,
		    data32 = this.data32;

		// see if the line is on the display
		if (!((startX < 0 && endX < 0) || (startX >= w && endX >= w) || (startY < 0 && endY < 0) || (startY >= h && endY >= h))) {
			// see if bounds checking is required
			if (startX >= 0 && startX < w && startY >=0 && startY < h && endX >= 0 && endX < w && endY >= 0 && endY < h) {
				// line all on display so no bounds checking
				// set the first point
				data32[startY * w + startX] = colour;

				// loop for each pixel on the line
				while (!((startX === endX) && (startY === endY))) {
					// move to next pixel
					e2 = err + err;
					if (e2 > -dy) {
						err -= dy;
						startX += sx;
					}
					if (e2 < dx) {
						err += dx;
						startY += sy;
					}

					// draw the point
					data32[startY * w + startX] = colour;
				}
			} else {
				// some or all of the line is off display so use bounds checking
				// set the first point
				if (startX >= 0 && startX < w && startY >=0 && startY < h) {
					data32[startY * w + startX] = colour;
				}

				// loop for each pixel on the line
				while (!((startX === endX) && (startY === endY))) {
					// move to next pixel
					e2 = err + err;
					if (e2 > -dy) {
						err -= dy;
						startX += sx;
					}
					if (e2 < dx) {
						err += dx;
						startY += sy;
					}

					// draw the point
					if (startX >= 0 && startX < w && startY >=0 && startY < h) {
						data32[startY * w + startX] = colour;
					}
				}
			}
		}
	};

	// draw a line
	Life.prototype.drawLine = function(startX, startY, endX, endY, colour) {
		var radius = 0, theta = 0,
			halfDisplayWidth = this.displayWidth / 2,
			halfDisplayHeight = this.displayHeight / 2;

		// check for rotation
		if (this.camAngle !== 0) {
			// rotate start point around center
			startX -= halfDisplayWidth;
			startY -= halfDisplayHeight;
			radius = Math.sqrt((startX * startX) + (startY * startY));
			theta = Math.atan2(startY, startX) * (180 / Math.PI);
			theta += this.camAngle;
			// grow radius
			startX = Math.round(radius * Math.cos(theta * (Math.PI / 180)) + halfDisplayWidth);
			startY = Math.round(radius * Math.sin(theta * (Math.PI / 180)) + halfDisplayHeight);

			// rotate end point
			endX -= halfDisplayWidth;
			endY -= halfDisplayHeight;
			radius = Math.sqrt((endX * endX) + (endY * endY));
			theta = Math.atan2(endY, endX) * (180 / Math.PI);
			theta += this.camAngle;
			endX = Math.round(radius * Math.cos(theta * (Math.PI / 180)) + halfDisplayWidth);
			endY = Math.round(radius * Math.sin(theta * (Math.PI / 180)) + halfDisplayHeight);
		}

		// check for vertical line
		if (startX === endX) {
			this.drawVLine(startX, startY, endY, colour);
		} else {
			if (startY === endY) {
				this.drawHLine(startX, endX, startY, colour);
			} else {
				this.drawBresenhamLine(startX, startY, endX, endY, colour);
			}
		}
	};

	// draw paste box
	Life.prototype.drawPasteWithCells = function(view, mouseCellX, mouseCellY, position, colour) {
		var width = view.pasteWidth,
			height = view.pasteHeight,
			x = 0,
			y = 0,
			i = 0,
			x1 = 0, y1 = 0,
			x1d1 = 0, y1d1 = 0,
			x1d1d2 = 0, y1d1d2 = 0,
			x1d2 = 0, y1d2 = 0,
			x2 = 0, y2 = 0,
			state = 0,
			ctx = this.context,
			xZoom = this.zoom,
			yZoom = this.zoom * ((this.isTriangular && xZoom >= 4) ? ViewConstants.sqrt3 : 1),
			xOff = (this.width >> 1) - (view.patternWidth >> 1),
			yOff = (this.height >> 1) - (view.patternHeight >> 1),
		    engineY = view.panY - this.yOff,
			engineX = view.panX - this.xOff - (this.isHex ? this.yOff / 2 : 0),
			coords = [0, 0],
			dx1 = 0, dx2 = 0,
			dy1 = 0, dy2 = 0;

		// draw paste rectangle
		switch (position) {
		case ViewConstants.pastePositionNW:
			// nothing to do
			break;
		case ViewConstants.pastePositionN:
			mouseCellX -= width >> 1;
			break;
		case ViewConstants.pastePositionNE:
			mouseCellX -= width - 1;
			break;
		case ViewConstants.pastePositionW:
			mouseCellY -= height >> 1;
			break;
		case ViewConstants.pastePositionMiddle:
			mouseCellX -= width >> 1;
			mouseCellY -= height >> 1;
			break;
		case ViewConstants.pastePositionE:
			mouseCellX -= width - 1;
			mouseCellY -= height >> 1;
			break;
		case ViewConstants.pastePositionSW:
			mouseCellY -= height - 1;
			break;
		case ViewConstants.pastePositionS:
			mouseCellX -= width >> 1;
			mouseCellY -= height - 1;
			break;
		case ViewConstants.pastePositionSE:
			mouseCellX -= width - 1;
			mouseCellY -= height - 1;
			break;
		}
		x1 = mouseCellX;
		y1 = mouseCellY;
		x2 = mouseCellX + width;
		y2 = mouseCellY + height;

		// convert cell coordinates to screen coordinates
		y1 = yZoom * (y1 - yOff + engineY - this.originY + view.panY) + view.displayHeight / 2;
		x1 = xZoom * (x1 - xOff + engineX - this.originX + view.panX) + view.displayWidth / 2 + (this.isHex ? (view.displayHeight / 2 - y1) / 2 : 0);
		y2 = yZoom * (y2 - yOff + engineY - this.originY + view.panY) + view.displayHeight / 2;
		x2 = xZoom * (x2 - xOff + engineX - this.originX + view.panX) + view.displayWidth / 2 + (this.isHex ? (view.displayHeight / 2 - y2) / 2 : 0);

		// draw a translucent box
		ctx.fillStyle = colour;
		ctx.globalAlpha = 0.5;
		if (!this.isHex) {
			if (this.isTriangular && this.zoom >= 4) {
				this.drawTriangleSelection(mouseCellX, mouseCellY, mouseCellX + width - 1, mouseCellY + height - 1, xOff, yOff);
			} else {
				ctx.beginPath();
				this.rotateCoords(x1, y1, coords);
				ctx.moveTo(coords[0], coords[1]);
				this.rotateCoords(x2 + 1, y1, coords);
				ctx.lineTo(coords[0], coords[1]);
				this.rotateCoords(x2 + 1, y2 + 1, coords);
				ctx.lineTo(coords[0], coords[1]);
				this.rotateCoords(x1, y2 + 1, coords);
				ctx.lineTo(coords[0], coords[1]);
				ctx.fill();
			}
		} else {
			if (this.useHexagons && this.zoom >= 4) {
				this.drawHexSelection(mouseCellX, mouseCellY, mouseCellX + width - 1, mouseCellY + height - 1, xOff, yOff);
			} else {
				ctx.beginPath();
				for (i = 0; i < height; i += 1) {
					ctx.moveTo(x1, y1);
					ctx.lineTo(x1 + width * xZoom + 1, y1);
					ctx.lineTo(x1 + width * xZoom + 1, y1 + yZoom + 1);
					ctx.lineTo(x1, y1 + yZoom + 1);
					x1 -= yZoom / 2;
					y1 += yZoom;
				}
				ctx.fill();
			}
		}

		// now draw each set cell if zoom is high enough
		if (this.zoom >= 1) {
			// compute deltas in horizontal and vertical direction based on rotation
			if (this.camAngle > 0) {
				dx1 = Math.cos(this.camAngle / 180 * Math.PI) * this.camZoom;
				dy1 = Math.sin(this.camAngle / 180 * Math.PI) * this.camZoom;
				dx2 = Math.cos((this.camAngle + 90) / 180 * Math.PI) * this.camZoom;
				dy2 = Math.sin((this.camAngle + 90) / 180 * Math.PI) * this.camZoom;
			} else {
				dx1 = this.camZoom;
				dy1 = 0;
				dx2 = dy1;
				dy2 = dx1;
			}

			// compute starting coordinates
			y1 = yZoom * (mouseCellY + y - yOff + engineY - this.originY + view.panY) + view.displayHeight / 2;
			x1 = xZoom * (mouseCellX + x - xOff + engineX - this.originX + view.panX) + view.displayWidth / 2 + (this.isHex ? (view.displayHeight / 2 - y1) / 2 : 0);
			if (this.camAngle !== 0) {
				this.rotateCoords(x1, y1, coords);
				x1 = coords[0];
				y1 = coords[1];
			}
			x2 = x1;
			y2 = y1;

			// draw cells
			ctx.fillStyle = "rgb(255, 128, 0)";
			if (this.isHex && this.useHexagons && this.zoom >= 4) {
				this.drawHexCellsInSelection(mouseCellX, mouseCellY, mouseCellX + width - 1, mouseCellY + height - 1, xOff, yOff, view.pasteBuffer);
			} else {
				if (this.isTriangular && this.zoom >= 4) {
					this.drawTriangleCellsInSelection(mouseCellX, mouseCellY, mouseCellX + width - 1, mouseCellY + height - 1, xOff, yOff, view.pasteBuffer);
				} else {
					ctx.beginPath();
					i = 0;
					for (y = 0; y < height; y += 1) {
						x1 = x2;
						for (x = 0; x < width; x += 1) {
							state = view.pasteBuffer[i];
							i += 1;
							if (state) {
								// compute cell coordinates
								x1d1 = x1 + dx1;
								y1d1 = y1 + dy1;
								x1d1d2 = x1d1 + dx2;
								y1d1d2 = y1d1 + dy2;
								x1d2 = x1d1d2 - dx1;
								y1d2 = y1d1d2 - dy1;
		
								// don't draw cell if off window
								if (!((x1 < 0 && x1d1 < 0 && x1d1d2 < 0 && x1d2 < 0) ||
									(x1 >= view.displayWidth && x1d1 >= view.displayWidth && x1d1d2 >= view.displayWidth && x1d2 >= view.displayWidth) ||
									(y1 < 0 && y1d1 < 0 && y1d1d2 < 0 && y1d2 < 0) ||
									(y1 >= view.displayHeight && y1d1 >= view.displayHeight && y1d1d2 >= view.displayHeight && y1d2 >= view.displayHeight))) {
									// draw cell
									ctx.moveTo(x1, y1);
									ctx.lineTo(x1d1, y1d1);
									ctx.lineTo(x1d1d2, y1d1d2);
									ctx.lineTo(x1d2, y1d2);
								}
							}
							// next column
							x1 += dx1;
							y1 += dy1;
						}
						// next row
						x2 += dx2;
						y2 += dy2;
						y1 = y2;
						if (this.isHex) {
							x2 -= dy2 / 2;
						}
					}
					ctx.fill();
				}
			}
		}
	};
	
	// get rotated coordinates
	Life.prototype.rotateCoords = function(x, y, result) {
		var radius = 0,
			theta = 0,
			halfDisplayWidth = this.displayWidth / 2,
			halfDisplayHeight = this.displayHeight / 2;

		// check for rotation
		if (this.camAngle !== 0) {
			x -= halfDisplayWidth;
			y -= halfDisplayHeight;
			radius = Math.sqrt((x * x) + (y * y));
			theta = Math.atan2(y, x) * (180 / Math.PI);
			theta += this.camAngle;
			// grow radius
			x = Math.round(radius * Math.cos(theta * (Math.PI / 180)) + halfDisplayWidth);
			y = Math.round(radius * Math.sin(theta * (Math.PI / 180)) + halfDisplayHeight);
		}

		// save result
		result[0] = x;
		result[1] = y;
	};

	// draw selection
	Life.prototype.drawSelections = function(view) {
		var position = (view.pastePosition + 0.5) | 0,
			mouseX = view.menuManager.mouseLastX,
			mouseY = view.menuManager.mouseLastY,
			xOff = (this.width >> 1) - (view.patternWidth >> 1) + (view.xOffset << 1),
			yOff = (this.height >> 1) - (view.patternHeight >> 1) + (view.yOffset << 1);

		if (view.isSelection || view.drawingSelection) {
			this.drawBox(view, view.selectionBox, "rgb(0,255,0)");
		}
		if (view.evolvingPaste) {
			this.drawPasteWithCells(view, view.evolveBox.leftX, view.evolveBox.bottomY, ViewConstants.pastePositionNW, "rgb(255,255,0)");
		}
		if (view.isPasting) {
			mouseX = view.menuManager.mouseLastX;
			mouseY = view.menuManager.mouseLastY;
			if (mouseX !== -1) {
				view.updateCellLocation(mouseX, mouseY);
				this.drawPasteWithCells(view, view.cellX - xOff, view.cellY - yOff, position, "rgb(255,0,0)");
			}
		}
	};

	// draw box
	Life.prototype.drawBox = function(view, box, colour) {
		var ctx = this.context,
			xZoom = this.zoom,
			yZoom = this.zoom * ((this.isTriangular && xZoom >= 4) ? ViewConstants.sqrt3 : 1),
			x1 = box.leftX,
			y1 = box.bottomY,
			x2 = box.rightX,
			y2 = box.topY,
			width = 0,
			height = 0,
			xOff = (this.width >> 1) - (view.patternWidth >> 1),
			yOff = (this.height >> 1) - (view.patternHeight >> 1),
			swap = 0,
		    engineY = view.panY - this.yOff,
			engineX = view.panX - this.xOff - (this.isHex ? this.yOff / 2 : 0),
			coords = [0, 0],
			i = 0,
			selBox = view.selectionBox;

		// order selection box coordinates
		if (x1 > x2) {
			swap = x1;
			x1 = x2;
			x2 = swap;
		}
		if (y1 > y2) {
			swap = y1;
			y1 = y2;
			y2 = swap;
		}
		width = x2 - x1 + 1;
		height = y2 - y1 + 1;

		// convert cell coordinates to screen coordinates
		y1 = yZoom * (y1 - yOff + engineY - this.originY + view.panY) + view.displayHeight / 2;
		x1 = xZoom * (x1 - xOff + engineX - this.originX + view.panX) + view.displayWidth / 2 + (this.isHex ? (view.displayHeight / 2 - y1) / 2 : 0);
		y2 = yZoom * (y2 + 1 - yOff + engineY - this.originY + view.panY) + view.displayHeight / 2;
		x2 = xZoom * (x2 + 1 - xOff + engineX - this.originX + view.panX) + view.displayWidth / 2 + (this.isHex ? (view.displayHeight / 2 - y2) / 2 : 0);

		// draw a translucent box
		ctx.fillStyle = colour;
		ctx.globalAlpha = 0.5;
		if (!this.isHex) {
			if (this.isTriangular && this.zoom >= 4) {
				this.drawTriangleSelection(selBox.leftX, selBox.bottomY, selBox.rightX, selBox.topY, xOff, yOff);
			} else {
				ctx.beginPath();
				this.rotateCoords(x1, y1, coords);
				ctx.moveTo(coords[0], coords[1]);
				this.rotateCoords(x2 + 1, y1, coords);
				ctx.lineTo(coords[0], coords[1]);
				this.rotateCoords(x2 + 1, y2 + 1, coords);
				ctx.lineTo(coords[0], coords[1]);
				this.rotateCoords(x1, y2 + 1, coords);
				ctx.lineTo(coords[0], coords[1]);
				ctx.fill();
			}
		} else {
			// check for hexagons (rather than offset squares)
			if (this.useHexagons && this.zoom >= 4) {
				this.drawHexSelection(selBox.leftX, selBox.bottomY, selBox.rightX, selBox.topY, xOff, yOff);
			} else {
				ctx.beginPath();
				width *= xZoom;
				for (i = 0; i < height; i += 1) {
					ctx.moveTo(x1, y1);
					ctx.lineTo(x1 + width + 1, y1);
					ctx.lineTo(x1 + width + 1, y1 + yZoom + 1);
					ctx.lineTo(x1, y1 + yZoom + 1);
					x1 -= yZoom / 2;
					y1 += yZoom;
				}
				ctx.fill();
			}
		}
		ctx.globalAlpha = 1;
	};

	// draw grid lines
	Life.prototype.drawGridLines = function() {
		var x = 0,
		    y = 0,
		    loop = 1,
		    w = this.displayWidth,
		    h = this.displayHeight,
		    gridCol = this.gridLineColour,
		    gridBoldCol = this.gridLineBoldColour,
		    zoomStep = this.camZoom,
		    gridLineNum = 0,
		    vLineNum = 0,
		    drawCol = gridCol,
			targetCol = gridCol,
			startX = 0, startY = 0, endX = 0, endY = 0,
			leftX = 0, rightX = w, bottomY = 0, topY = h,
			drawMajor = (this.gridLineMajor > 0 && this.gridLineMajorEnabled),
			odd = (this.counter & 1),

		    // compute single cell offset
		    yOff = (((this.height / 2 - (this.yOff + this.originY)) * zoomStep) + (h / 2)) % zoomStep,
		    xOff = (((this.width / 2 - (this.xOff + this.originX)) * zoomStep) + (w / 2)) % zoomStep;

		// draw twice if major grid lines enabled
		if (this.displayGrid) {
			if (drawMajor) {
				loop = 2;
			} else {
				loop = 1;
			}
		} else {
			// draw cell borders
			loop = 1;
			drawMajor = false;
			gridCol = this.pixelColours[0];
			drawCol = gridCol;
		}

		// start drawing the grid line colour
		targetCol = gridCol;

		// for Margolus alternate major/minor grid lines for odd/even generations
		if (!this.isMargolus || this.gridLineMajor !== 2 || !this.altGrid) {
			odd = 0;
		}

		while (loop) {
			// compute major grid line vertical offset
			gridLineNum = -(w / 2 / zoomStep) - (this.width / 2 - this.xOff - this.originX) | 0;

			// extend the number of lines to cope with 45 degrees rotation
			startX = -zoomStep * 22;
			endX = w + zoomStep + zoomStep * 22;
			startY = yOff - zoomStep * 22;
			endY = h + zoomStep * 22;
			leftX = -w / 1.5;
			rightX = w + w / 1.5;
			bottomY = -h / 1.5;
			topY = h + h / 1.5;

			// draw vertical lines
			for (x = startX; x <= endX; x += zoomStep) {
				// check if major gridlines are enabled
				if (drawMajor) {
					// choose whether to use major or minor colour
					if ((gridLineNum + odd) % this.gridLineMajor === 0) {
						drawCol = gridBoldCol;
					} else {
						drawCol = gridCol;
					}
				}
				gridLineNum += 1;

				// check whether to draw the line
				if (drawCol === targetCol) {
					// check for hex mode
					if (this.isHex) {
						// compute major grid line horizontal offset
						vLineNum = -(h / 2 / zoomStep) - (this.height / 2 - this.yOff - this.originY) | 0;

						// draw staggered vertical line
						for (y = startY; y < endY; y += zoomStep) {
							if ((vLineNum & 1) === 0) {
								this.drawLine(Math.round(x + xOff), Math.round(y), Math.round(x + xOff), Math.round(y + zoomStep - 1), drawCol);
							} else {
								this.drawLine(Math.round(x + xOff + zoomStep / 2), Math.round(y), Math.round(x + xOff + zoomStep / 2), Math.round(y + zoomStep - 1), drawCol);
							}
							vLineNum += 1;
						}
					} else {
						// draw vertical line
						this.drawLine(Math.round(x + xOff), bottomY, Math.round(x + xOff), topY - 1, drawCol);
					}
				}
			}

			// compute major grid line horizontal offset
			gridLineNum = -(h / 2 / zoomStep) - (this.height / 2 - this.yOff - this.originY) | 0;

			// draw horizontal lines
			for (y = startY; y < endY; y += zoomStep) {
				// check if major gridlines are enabled
				if (drawMajor) {
					// choose whether to use major or minor colour
					if ((gridLineNum + odd) % this.gridLineMajor === 0) {
						drawCol = gridBoldCol;
					} else {
						drawCol = gridCol;
					}
				}
				gridLineNum += 1;

				// draw the line
				if (drawCol === targetCol) { 
					this.drawLine(leftX, Math.round(y), rightX - 1, Math.round(y), drawCol);
				}
			}

			// next iteration
			loop -= 1;

			// switch to major grid line colour
			targetCol = gridBoldCol;
		}
	};

	// check whether the grid can be displayed
	Life.prototype.canDisplayGrid = function() {
		// grid can be displayed if zoom >= 4
		return (this.camZoom >= 4);
	};

	// draw the bounded grid border
	Life.prototype.drawBoundedGridBorder = function(colourGrid, border) {
		// get width and height
		var width = this.boundedGridWidth,
		    height = this.boundedGridHeight,

		    // coordinates of box
		    leftX = Math.round((this.width - width) / 2 - 1),
		    rightX = leftX + width + 1,
		    bottomY = Math.round((this.height - height) / 2 - 1),
		    topY = bottomY + height + 1,

		    // top and bottom row
		    bottomRow = colourGrid[bottomY],
		    topRow = colourGrid[topY],

		    // counter
		    i = 0;

		// check for infinite width
		if (width === 0) {
			// draw top and bottom only
			bottomRow.fill(border, 0, this.width);
			topRow.fill(border, 0, this.width);
		} else {
			// check for infinite height
			if (height === 0) {
				// draw left and right only
				for (i = 0; i < this.height; i += 1) {
					colourGrid[i][leftX] = border;
					colourGrid[i][rightX] = border;
				}
			} else {
				// draw top and bottom
				bottomRow.fill(border, leftX, rightX + 1);
				topRow.fill(border, leftX, rightX + 1);

				// draw left and right
				for (i = bottomY + 1; i <= topY - 1; i += 1) {
					colourGrid[i][leftX] = border;
					colourGrid[i][rightX] = border;
				}
			}
		}
	};

	// project the life grid onto the canvas
	Life.prototype.renderGrid = function(drawingSnow) {
		var colour0 = this.pixelColours[0],
			data32 = this.data32,
			colourGrid = this.colourGrid,
			colourGrid16 = this.colourGrid16,
			colourGrid32 = this.colourGrid32;

		// check for PCA rules
		if (this.isPCA || this.isRuleTree) {
			// swap grids every generation
			if ((this.counter & 1) !== 0) {
				colourGrid = this.nextColourGrid;
				colourGrid16 = this.nextColourGrid16;
				colourGrid32 = this.nextColourGrid32;
			}
		}

		// check if colour is changing
		if (this.colourChange) {
			this.createColours();
			this.colourChange -= 1;
			if (!this.colourChange) {
				// make target current
				this.aliveColCurrent.set(this.aliveColTarget);
				this.deadColCurrent.set(this.deadColTarget);
				this.unoccupiedCurrent.set(this.unoccupiedTarget);
				this.aliveGenColCurrent.set(this.aliveGenColTarget);
				this.dyingGenColCurrent.set(this.dyingGenColTarget);
				this.unoccupiedGenCurrent.set(this.unoccupiedGenTarget);
			}
		}

		// read the camera position
		this.camZoom = this.zoom * this.originZ;

		if (this.camZoom < ViewConstants.minZoom) {
			this.camZoom = ViewConstants.minZoom;
		} else {
			if (this.camZoom > ViewConstants.maxZoom) {
				this.camZoom = ViewConstants.maxZoom;
			}
		}
		this.camXOff = this.xOff + this.originX;
		this.camYOff = this.yOff + this.originY;
		this.camLayerDepth = (this.layerDepth / 2) + 1;

		// check for hex
		if (this.isHex || this.isTriangular) {
			// zero angle
			this.camAngle = 0;
		} else {
			this.camAngle = this.angle;
		}

		// create bounded grid border if specified
		if (this.boundedGridType !== -1) {
			this.drawBoundedGridBorder(colourGrid, this.boundedBorderColour);
		}

		// check if drawing grid with polygons
		if (this.camZoom >= 4 && ((this.useHexagons && this.isHex) || this.isTriangular)) {
			// clear grid
			data32.fill(colour0);

			// create pixel colours
			this.createPixelColours(1);
		} else {
			// create small colour grids if zoomed out
			if (this.camZoom < 1) {
				this.createSmallColourGrids(colourGrid16, colourGrid32);
			}

			// check if zoom < 0.125x
			if (this.camZoom < 0.125) {
				// check for LifeHistory overlay
				if (this.drawOverlay) {
					// render the grid with the overlay on top
					this.renderGridOverlayProjection(this.smallOverlayGrid, this.smallColourGrid, 15, drawingSnow);
				} else {
					// render using small colour grid 16x16
					this.renderGridProjection(this.smallColourGrid, this.smallColourGrid, 15, drawingSnow);
				}
			} else {
				// check if zoom < 0.25x
				if (this.camZoom < 0.25) {
					// check for LifeHistory overlay
					if (this.drawOverlay) {
						// render the grid with the overlay on top
						this.renderGridOverlayProjection(this.smallOverlayGrid, this.smallColourGrid, 7, drawingSnow);
					} else {
						// render using small colour grid 8x8
						this.renderGridProjection(this.smallColourGrid, this.smallColourGrid, 7, drawingSnow);
					}
				} else {
					// check if zoom < 0.5x
					if (this.camZoom < 0.5) {
						// check for LifeHistory overlay
						if (this.drawOverlay) {
							// render the grid with the overlay on top
							this.renderGridOverlayProjection(this.smallOverlayGrid, this.smallColourGrid, 3, drawingSnow);
						} else {
							// render using small colour grid 4x4
							this.renderGridProjection(this.smallColourGrid, this.smallColourGrid, 3, drawingSnow);
						}
					} else {
						// check for zoom < 1x
						if (this.camZoom < 1) {
							// check for LifeHistory overlay
							if (this.drawOverlay) {
								// render the grid with the overlay on top
								this.renderGridOverlayProjection(this.smallOverlayGrid, this.smallColourGrid, 1, drawingSnow);
							} else {
								// render using small colour grid 2x2
								this.renderGridProjection(this.smallColourGrid, this.smallColourGrid, 1, drawingSnow);
							}
						} else {
							// check for LifeHistory overlay
							if (this.drawOverlay) {
								// render the grid with the overlay on top
								this.renderGridOverlayProjection(this.overlayGrid, colourGrid, 0, drawingSnow);
							} else {
								// render the grid
								this.renderGridProjection(colourGrid, colourGrid, 0, drawingSnow);
							}
						}
					}
				}
			}
		}
	};

	// project the life grid onto the canvas with transformation and clipping
	Life.prototype.renderGridProjectionClip = function(bottomGrid, layersGrid, mask, drawingSnow) {
		var w8 = this.displayWidth >> 3,
		    pixelColours = this.pixelColours,
		    data32 = this.data32,
		    i = 0, h = 0, w = 0, x = 0, y = 0, dxy = 0, dyy = 0, sy = 0, sx = 0,
		    transparentTarget = 0,

		    // index in pixel buffer
		    idx = 0 | 0,

		    layerTarget = 1,
		    brightness = 1,
		    brightInc = 0,
		   
		    // index of pixel colour
		    col = 0 | 0,

		    // create the width and height masks
		    wm = this.widthMask & ~mask,
		    hm = this.heightMask & ~mask,

		    // create the comparison masks for clipping
		    wt = ~mask,
		    ht = ~mask,

			// last mask
			lastMask = mask,

		    // pixel when off-grid
		    offGrid = 0 | 0,

		    // start with bottom grid
		    colourGrid = bottomGrid,

		    // current layer zoom
		    layerZoom = this.camZoom;

		// check whether to draw layers
		if (this.layersOn && this.camLayerDepth > 1) {
			layerTarget = this.layers;
		}

		// compute deltas in horizontal and vertical direction based on rotation
		dxy = Math.sin(this.camAngle / 180 * Math.PI) / this.camZoom;
		dyy = Math.cos(this.camAngle / 180 * Math.PI) / this.camZoom;

		// compute starting position
		sy = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff;
		sx = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff;

		// check if depth shading is on
		if (this.depthOn && this.layers > 1 && this.camLayerDepth > 1) {
			brightInc = 0.4 / (this.layers - 1);
			brightness = 0.6;
		}

		// create pixel colours
		this.createPixelColours(brightness);

		// set the off grid colour
		if (this.width < this.maxGridSize) {
			// use the state 0 colour
			offGrid = pixelColours[0] | 0;
		} else {
			// use grey
			offGrid = this.boundaryColour | 0;
		}

		// draw each pixel
		idx = 0 | 0;
		y = sy;
		
		for (h = 0; h < this.displayHeight; h += 1) {
			x = sx;
			for (w = 0; w < w8; w += 1) {
				// clip to the grid
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					// lookup the colour
					col = colourGrid[y & hm][x & wm] | 0;

					// set the pixel in the buffer
					data32[idx] = pixelColours[col];
				} else {
					// use the off grid colour
					data32[idx] = offGrid;
				}
				idx += 1;

				// update row position
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;
			}

			// update column position
			sx += dxy;
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				if (this.historyStates === 0) {
					transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
				} else {
					if (i < layerTarget / 2) {
						transparentTarget = (i * 2 * (this.historyStates / this.layers)) | 0;
					} else {
						transparentTarget = this.historyStates + (i * (this.multiNumStates / this.layers)) | 0;
					}
				}
			} else {
				transparentTarget = (i * ((this.aliveMax + 1) / this.layers)) | 0;
			}

			// update brightness
			brightness += brightInc;
			
			// create pixel colours
			this.createPixelColours(brightness);

			// zoom for the next layer
			dxy = dxy / this.camLayerDepth;
			dyy = dyy / this.camLayerDepth;

			// update layer zoom
			layerZoom *= this.camLayerDepth;

			// check whether to switch to colour grid based on ZOOM >= 1
			lastMask = mask;
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							mask = 1;
						} else {
							// switch to full resolution grid
							mask = 0;
						}
					}
				}
			}

			// check if mask changed
			if (mask !== lastMask) {
				// switch to full resolution colour grid
				colourGrid = this.colourGrid;
			}

			// create the width and height masks
			wm = this.widthMask & ~mask;
			hm = this.heightMask & ~mask;

			// create the comparison masks for clipping
			wt = ~mask;
			ht = ~mask;

			// compute starting position
			sy = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff;
			sx = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff;

			// draw each pixel
			idx = 0 | 0;
			y = sy;
			for (h = 0; h < this.displayHeight; h += 1) {
				x = sx;
				for (w = 0; w < w8; w += 1) {
					// clip to the grid
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						// lookup the colour
						col = colourGrid[y & hm][x & wm] | 0;

						// draw pixel if above the transparent target
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					// next pixel
					idx += 1;

					// update row position
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

				}
				// update column position
				sx += dxy;
				sy += dyy;
				y = sy;
			}
		}
	};

	// project the life grid onto the canvas with transformation and clipping
	Life.prototype.renderGridProjectionClipNoRotate = function(bottomGrid, layersGrid, mask, drawingSnow) {
		var w8 = this.displayWidth >> 3,
		    pixelColours = this.pixelColours,
		    data32 = this.data32,
		    i = 0, h = 0, w = 0, x = 0, y = 0, dyy = 0, sy = 0, sx = 0,
		    transparentTarget = 0,

		    // index in pixel buffer
		    idx = 0 | 0,

		    layerTarget = 1,
		    brightness = 1,
		    brightInc = 0,
		   
		    // index of pixel colour
		    col = 0 | 0,

		    // create the width and height masks
		    wm = this.widthMask & ~mask,
		    hm = this.heightMask & ~mask,

		    // create the comparison masks for clipping
		    wt = ~mask,
		    ht = ~mask,

			// last mask
			lastMask = mask,

		    // pixel when off-grid
		    offGrid = 0 | 0,

		    // start with bottom grid
		    colourGrid = bottomGrid,

		    // colour grid row
		    colourGridRow = null,

		    // current layer zoom
		    layerZoom = this.camZoom;

		// check whether to draw layers
		if (this.layersOn && this.camLayerDepth > 1) {
			layerTarget = this.layers;
		}

		// compute deltas in horizontal and vertical direction based on rotation
		dyy = 1 / this.camZoom;

		// compute starting position
		sy = -((this.displayHeight / 2) * dyy) + this.camYOff;
		sx = -((this.displayWidth / 2) * dyy) + this.camXOff;

		// check if depth shading is on
		if (this.depthOn && this.layers > 1 && this.camLayerDepth > 1) {
			brightInc = 0.4 / (this.layers - 1);
			brightness = 0.6;
		}

		// create pixel colours
		this.createPixelColours(brightness);

		// set the off grid colour
		if (this.width < this.maxGridSize) {
			// use the state 0 colour
			offGrid = pixelColours[0] | 0;
		} else {
			// use grey
			offGrid = this.boundaryColour | 0;
		}

		// draw each pixel
		idx = 0 | 0;
		y = sy;
		
		for (h = 0; h < this.displayHeight; h += 1) {
			// clip rows to the grid
			if ((y & ht) === (y & hm)) {
				// get the colour grid row
				colourGridRow = colourGrid[y & hm];
				x = sx;

				// offset if hex rule
				if (this.isHex) {
					x += 0.5 * (y | 0);
				}

				// process the row
				for (w = 0; w < w8; w += 1) {
					// clip to the grid
					if ((x & wt) === (x & wm)) {
						// lookup the colour
						col = colourGridRow[x & wm] | 0;

						// set the pixel in the buffer
						data32[idx] = pixelColours[col];
					} else {
						// use the off grid colour
						data32[idx] = offGrid;
					}
					idx += 1;

					// update row position
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					} else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					} else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					} else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					} else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					} else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					} else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					} else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;
				}
			} else {
				// draw off grid row
				data32.fill(offGrid, idx, idx + this.displayWidth + 1);
				idx += this.displayWidth;
			}

			// update column position
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				if (this.historyStates === 0) {
					transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
				} else {
					if (i < layerTarget / 2) {
						transparentTarget = (i * 2 * (this.historyStates / this.layers)) | 0;
					} else {
						transparentTarget = this.historyStates + (i * (this.multiNumStates / this.layers)) | 0;
					}
				}
			} else {
				transparentTarget = (i * ((this.aliveMax + 1) / this.layers)) | 0;
			}

			// update brightness
			brightness += brightInc;
			
			// create pixel colours
			this.createPixelColours(brightness);

			// zoom for the next layer
			dyy = dyy / this.camLayerDepth;

			// update layer zoom
			layerZoom *= this.camLayerDepth;

			// check whether to switch to colour grid based on ZOOM >= 1
			lastMask = mask;
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							mask = 1;
						} else {
							// switch to full resolution grid
							mask = 0;
						}
					}
				}
			}

			// check if mask changed
			if (mask !== lastMask) {
				// switch to full resolution colour grid
				colourGrid = this.colourGrid;
			}

			// create the width and height masks
			wm = this.widthMask & ~mask;
			hm = this.heightMask & ~mask;

			// create the comparison masks for clipping
			wt = ~mask;
			ht = ~mask;

			// compute starting position
			sy = -((this.displayHeight / 2) * dyy) + this.camYOff;
			sx = -((this.displayWidth / 2) * dyy) + this.camXOff;

			// draw each pixel
			idx = 0 | 0;
			y = sy;
			for (h = 0; h < this.displayHeight; h += 1) {
				// clip rows to the grid
				if ((y & ht) === (y & hm)) {
					// get the colour grid row
					colourGridRow = colourGrid[y & hm];
					x = sx;

					// offset if hex rule
					if (this.isHex) {
						x += 0.5 * (y | 0);
					}

					// process the row
					for (w = 0; w < w8; w += 1) {
						// clip to the grid
						if ((x & wt) === (x & wm)) {
							// lookup the colour
							col = colourGridRow[x & wm] | 0;

							// draw pixel if above the transparent target
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						// next pixel
						idx += 1;

						// update row position
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGrid[y & hm][x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGrid[y & hm][x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGrid[y & hm][x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGrid[y & hm][x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGrid[y & hm][x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGrid[y & hm][x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGrid[y & hm][x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;
					}
				} else {
					// skip blank row
					idx += (w8 << 3);
				}

				// update column position
				sy += dyy;
				y = sy;
			}
		}
	};

	// project the life grid onto the canvas with transformation with no clipping
	Life.prototype.renderGridProjectionNoClip = function(bottomGrid, layersGrid, mask, drawingSnow) {
		var w8 = this.displayWidth >> 3,
		    pixelColours = this.pixelColours,
		    data32 = this.data32,
		    i = 0, h = 0, w = 0, x = 0, y = 0, dxy = 0, dyy = 0, sy = 0, sx = 0,
		    transparentTarget = 0,

		    // index in pixel buffer
		    idx = 0 | 0,

		    layerTarget = 1,
		    brightness = 1,
		    brightInc = 0,
		   
		    // index of pixel colour
		    col = 0 | 0,

		    // create the width and height masks
		    wm = this.widthMask & ~mask,
		    hm = this.heightMask & ~mask,

			// last mask
			lastMask = mask,

		    // start with bottom grid
		    colourGrid = bottomGrid,

		    // current layer zoom
		    layerZoom = this.camZoom;

		// check whether to draw layers
		if (this.layersOn && this.camLayerDepth > 1) {
			layerTarget = this.layers;
		}

		// compute deltas in horizontal and vertical direction based on rotation
		dxy = Math.sin(this.camAngle / 180 * Math.PI) / this.camZoom;
		dyy = Math.cos(this.camAngle / 180 * Math.PI) / this.camZoom;

		// compute starting position
		sy = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff;
		sx = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff;

		// check if depth shading is on
		if (this.depthOn && this.layers > 1 && this.camLayerDepth > 1) {
			brightInc = 0.4 / (this.layers - 1);
			brightness = 0.6;
		}

		// create pixel colours
		this.createPixelColours(brightness);

		// draw each pixel
		idx = 0 | 0;
		y = sy;
		
		for (h = 0; h < this.displayHeight; h += 1) {
			x = sx;

			for (w = 0; w < w8; w += 1) {
				// lookup the colour
				col = colourGrid[y & hm][x & wm] | 0;

				// set the pixel in the buffer
				data32[idx] = pixelColours[col];
				idx += 1;

				// update row position
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
				y -= dxy;
			}

			// update column position
			sx += dxy;
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				if (this.historyStates === 0) {
					transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
				} else {
					if (i < layerTarget / 2) {
						transparentTarget = (i * 2 * (this.historyStates / this.layers)) | 0;
					} else {
						transparentTarget = this.historyStates + (i * (this.multiNumStates / this.layers)) | 0;
					}
				}
			} else {
				transparentTarget = (i * ((this.aliveMax + 1) / this.layers)) | 0;
			}

			// update brightness
			brightness += brightInc;
			
			// create pixel colours
			this.createPixelColours(brightness);

			// zoom for the next layer
			dxy = dxy / this.camLayerDepth;
			dyy = dyy / this.camLayerDepth;

			// update layer zoom
			layerZoom *= this.camLayerDepth;

			// check whether to switch to colour grid based on ZOOM >= 1
			lastMask = mask;
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
			}

			// check if mask changed
			if (mask !== lastMask) {
				// switch to full resolution colour grid
				colourGrid = this.colourGrid;
			}

			// create the width and height masks
			wm = this.widthMask & ~mask;
			hm = this.heightMask & ~mask;

			// compute starting position
			sy = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff;
			sx = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff;

			// draw each pixel
			idx = 0 | 0;
			y = sy;
			for (h = 0; h < this.displayHeight; h += 1) {
				x = sx;
				for (w = 0; w < w8; w += 1) {
					// lookup the colour
					col = colourGrid[y & hm][x & wm] | 0;

					// draw pixel if above the transparent target
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}

					// next pixel
					idx += 1;

					// update row position
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

				}

				// update column position
				sx += dxy;
				sy += dyy;
				y = sy;
			}
		}
	};

	// project the life grid onto the canvas with transformation with no clipping and no rotation
	Life.prototype.renderGridProjectionNoClipNoRotate = function(bottomGrid, layersGrid, mask, drawingSnow) {
		var w8 = this.displayWidth >> 3,
		    pixelColours = this.pixelColours,
		    data32 = this.data32,
		    i = 0, h = 0, w = 0, x = 0, y = 0, dyy = 0, sy = 0, sx = 0,
		    transparentTarget = 0,

		    // index in pixel buffer
		    idx = 0 | 0,

		    layerTarget = 1,
		    brightness = 1,
		    brightInc = 0,
		   
		    // index of pixel colour
		    col = 0,

		    // create the width and height masks
		    wm = this.widthMask & ~mask,
		    hm = this.heightMask & ~mask,

			// last mask
			lastMask = mask,

		    // start with bottom grid
		    colourGrid = bottomGrid,

		    // colour grid row
		    colourGridRow = null,

		    // current layer zoom
		    layerZoom = this.camZoom;

		// check whether to draw layers
		if (this.layersOn && this.camLayerDepth > 1) {
			layerTarget = this.layers;
		}

		// compute deltas in horizontal and vertical direction based on rotation
		dyy = 1 / this.camZoom;

		// compute starting position
		sy = -((this.displayHeight / 2) * dyy) + this.camYOff;
		sx = -((this.displayWidth / 2) * dyy) + this.camXOff;

		// check if depth shading is on
		if (this.depthOn && this.layers > 1 && this.camLayerDepth > 1) {
			brightInc = 0.4 / (this.layers - 1);
			brightness = 0.6;
		}

		// create pixel colours
		this.createPixelColours(brightness);

		// draw each pixel
		idx = 0 | 0;
		y = sy;
		
		for (h = 0; h < this.displayHeight; h += 1) {
			// get the colour grid row
			colourGridRow = colourGrid[y & hm];
			x = sx;

			// offset if hex rule
			if (this.isHex) {
				x += 0.5 * (y | 0);
			}

			// process the row
			for (w = 0; w < w8; w += 1) {
				// lookup the colour
				col = colourGridRow[x & wm];

				// set the pixel in the buffer
				data32[idx] = pixelColours[col];
				idx += 1;

				// update row position
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
			}

			// update column position
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				if (this.historyStates === 0) {
					transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
				} else {
					if (i < layerTarget / 2) {
						transparentTarget = (i * 2 * (this.historyStates / this.layers)) | 0;
					} else {
						transparentTarget = this.historyStates + (i * (this.multiNumStates / this.layers)) | 0;
					}
				}
			} else {
				transparentTarget = (i * ((this.aliveMax + 1) / this.layers)) | 0;
			}

			// update brightness
			brightness += brightInc;
			
			// create pixel colours
			this.createPixelColours(brightness);

			// zoom for the next layer
			dyy = dyy / this.camLayerDepth;

			// update layer zoom
			layerZoom *= this.camLayerDepth;

			// check whether to switch to colour grid based on ZOOM >= 1
			lastMask = mask;
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							mask = 1;
						} else {
							// switch to full resolution grid
							mask = 0;
						}
					}
				}
			}

			// check if mask changed
			if (mask !== lastMask) {
				// switch to full resolution colour grid
				colourGrid = this.colourGrid;
			}

			// create the width and height masks
			wm = this.widthMask & ~mask;
			hm = this.heightMask & ~mask;

			// compute starting position
			sy = -((this.displayHeight / 2) * dyy) + this.camYOff;
			sx = -((this.displayWidth / 2) * dyy) + this.camXOff;

			// draw each pixel
			idx = 0 | 0;
			y = sy;
			for (h = 0; h < this.displayHeight; h += 1) {
				// get the colour grid row
				colourGridRow = colourGrid[y & hm];
				x = sx;

				// offset if hex rule
				if (this.isHex) {
					x += 0.5 * (y | 0);
				}

				// process the row
				for (w = 0; w < w8; w += 1) {
					// lookup the colour
					col = colourGridRow[x & wm] | 0;

					// draw pixel if above the transparent target
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}

					// next pixel
					idx += 1;

					// update row position
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
				}

				// update column position
				sy += dyy;
				y = sy;
			}
		}
	};

	// project the life grid onto the canvas with transformation
	Life.prototype.renderGridProjection = function(bottomGrid, layersGrid, mask, drawingSnow) {
		// compute deltas in horizontal and vertical direction based on rotation
		var dxy = Math.sin(this.camAngle / 180 * Math.PI) / this.camZoom,
		    dyy = Math.cos(this.camAngle / 180 * Math.PI) / this.camZoom,

		    // display width and height
		    width = this.displayWidth,
		    height = this.displayHeight,

		    // compute bottom left
		    bottomLeftY = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff,
		    bottomLeftX = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff,

		    // compute bottom right
		    bottomRightY = bottomLeftY + width * (-dxy),
		    bottomRightX = bottomLeftX + width * dyy,

		    // compute top left
		    topLeftY = bottomLeftY + height * dyy,
		    topLeftX = bottomLeftX + height * dxy,

		    // compute top right
		    topRightY = topLeftY + width * (-dxy),
		    topRightX = topLeftX + width * dyy,

		    // initialise the bounding box
		    boundTop = topLeftY,
		    boundLeft = topLeftX,
		    boundBottom = topLeftY,
		    boundRight = topLeftX;

		// set the left X extent
		if (topRightX < boundLeft) {
			boundLeft = topRightX;
		}
		if (bottomLeftX < boundLeft) {
			boundLeft = bottomLeftX;
		}
		if (bottomRightX < boundLeft) {
			boundLeft = bottomLeftX;
		}

		// set the right X extent
		if (topRightX > boundRight) {
			boundRight = topRightX;
		}
		if (bottomLeftX > boundRight) {
			boundRight = bottomLeftX;
		}
		if (bottomRightX > boundRight) {
			boundRight = bottomRightX;
		}

		// set the top Y extent
		if (topRightY > boundTop) {
			boundTop = topRightY;
		}
		if (bottomLeftY > boundTop) {
			boundTop = bottomLeftY;
		}
		if (bottomRightY > boundTop) {
			boundTop = bottomRightY;
		}

		// set the bottom Y extent
		if (topRightY < boundBottom) {
			 boundBottom = topRightY;
		}
		if (bottomLeftY < boundBottom) {
			boundBottom = bottomLeftY;
		}
		if (bottomRightY < boundBottom) {
			boundBottom = bottomRightY;
		}

		// check whether clipping is required
		if ((boundLeft | 0) < 0 || (boundRight | 0) >= this.width || (boundBottom | 0) < 0 || (boundTop | 0) >= this.height) {
			// check angle
			if (this.camAngle === 0) {
				// render with clipping and no rotation
				if (this.pretty && this.camZoom >= 1 && this.layers === 1) {
					this.createPixelColours(1);
					if (this.width !== this.maxGridSize) {
						this.renderGridProjectionPretty(bottomGrid, boundLeft, boundBottom, boundRight, boundTop, this.pixelColours[0], drawingSnow);
					} else {
						this.renderGridProjectionPretty(bottomGrid, boundLeft, boundBottom, boundRight, boundTop, this.boundaryColour, drawingSnow);
					}
				} else {
					this.renderGridProjectionClipNoRotate(bottomGrid, layersGrid, mask, drawingSnow);
				}
			} else {
				// render with clipping and rotation
				this.renderGridProjectionClip(bottomGrid, layersGrid, mask, drawingSnow);
			}
		} else {
			// check angle
			if (this.camAngle === 0) {
				// render with no clipping and rotation
				if (this.pretty && this.camZoom >= 1 && this.layers === 1) {
					this.createPixelColours(1);
					this.renderGridProjectionPretty(bottomGrid, boundLeft, boundBottom, boundRight, boundTop, this.pixelColours[0], drawingSnow);
				} else {
					this.renderGridProjectionNoClipNoRotate(bottomGrid, layersGrid, mask, drawingSnow);
				}
			} else {
				this.renderGridProjectionNoClip(bottomGrid, layersGrid, mask, drawingSnow);
			}
		}
	};

	// render the grid using image scaling
	Life.prototype.renderGridProjectionPretty = function(grid, leftX, bottomY, rightX, topY, offGridCol, drawingSnow) {
		var pixelColours = this.pixelColours,
			sData32 = this.sData32,
			sCanvas = this.sCanvas,
			sContext = this.sContext,
			sImageData = this.sImageData,
			intZoom2 = (this.camZoom | 0) << 1,
			sWidth = sCanvas.width,
			sZWidth = sWidth * intZoom2,
			gridRow = null,
			width = rightX - leftX,
			height = topY - bottomY,
			dx = -(leftX - (leftX | 0)) * this.camZoom,
			dy = -(bottomY - (bottomY | 0)) * this.camZoom,
			x = 0,
			y = 0,
			i = 0,
			j = 0,
			l = 0,
			xz = 0,
			yz = 0,
			col = 0,
			intZoom = intZoom2 >> 1;

		// align coordinates size to integers
		bottomY |= 0;
		leftX |= 0;
		width = (width | 0) + 2;
		height = (height | 0) + 2;
		rightX = leftX + width;
		topY = bottomY + height;

		// draw cells at integer zoom
		j = sZWidth;
		for (y = bottomY; y < topY; y += 1) {
			if (y < 0 || y >= grid.length) {
				col = offGridCol;
				l = i;
				for (x = leftX; x < rightX; x += 1) {
					for (yz = 0; yz < intZoom2; yz += 1) {
						for (xz = 0; xz < intZoom; xz += 1) {
							sData32[i] = col;
							i += 1;
							sData32[i] = col;
							i += 1;
						}
						i += sWidth - intZoom2;
					}
					i = l + intZoom2;
					l = i;
				}
			} else {
				gridRow = grid[y];
				l = i;
				for (x = leftX; x < rightX; x += 1) {
					if (x < 0 || x >= gridRow.length) {
						col = offGridCol;
					} else {
						col = pixelColours[gridRow[x]];
					}
					for (yz = 0; yz < intZoom2; yz += 1) {
						for (xz = 0; xz < intZoom; xz += 1) {
							sData32[i] = col;
							i += 1;
							sData32[i] = col;
							i += 1;
						}
						i += sWidth - intZoom2;
					}
					i = l + intZoom2;
					l = i;
				}
			}
			i = j;
			j += sZWidth;
		}

		// put the integer zoom cells from the image data onto the canvas
		sContext.putImageData(sImageData, 0, 0, 0, 0, width * intZoom2, height * intZoom2);

		// pretty scale to the display
		sContext.imageSmoothingEnabled = true;
		sContext.drawImage(this.sCanvas, 0, 0, width * intZoom2, height * intZoom2, 0, 0, (width * this.camZoom), (height * this.camZoom));

		// draw the scaled canvas onto the drawing canvas
		dx |= 0;
		dy |= 0;
		this.context.drawImage(this.sCanvas, dx, dy);

		// update the image data array from the rendered image
		this.imageData = this.context.getImageData(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.data32 = new Uint32Array(this.imageData.data.buffer);

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}
	};

	// project the life grid onto the canvas with transformation
	Life.prototype.renderGridOverlayProjectionClip = function(bottomGrid, layersGrid, mask, drawingSnow) {
		var w8 = this.displayWidth >> 3,
		    pixelColours = this.pixelColours,
		    data32 = this.data32,
		    i = 0, h = 0, w = 0, x = 0, y = 0, dxy = 0, dyy = 0, sy = 0, sx = 0,
		    transparentTarget = 0,

		    // get states 3, 4, 5 and 6
		    state3 = ViewConstants.stateMap[3] + 128,
		    state4 = ViewConstants.stateMap[4] + 128,
		    state5 = ViewConstants.stateMap[5] + 128,
		    state6 = ViewConstants.stateMap[6] + 128,

		    // index in pixel buffer
		    idx = 0 | 0,

		    layerTarget = 1,
		    brightness = 1,
		    brightInc = 0,
		   
		    // index of pixel colour
		    col = 0 | 0,

		    // index of overlay colour
		    over = 0 | 0,
		    
		    // computed pixel colour
		    pixel = 0 | 0,

		    // first alive colour
		    aliveStart = this.aliveStart,

		    // create the width and height masks
		    wm = this.widthMask & ~mask,
		    hm = this.heightMask & ~mask,

			// last mask
			lastMask = mask,

		    // create the comparison masks for clipping
		    wt = ~mask,
		    ht = ~mask,

		    // pixel when off-grid
		    offGrid = 0 | 0,

		    // start with bottom grid
		    colourGrid = layersGrid,
		    overlayGrid = bottomGrid,

		    // current layer zoom
		    layerZoom = this.camZoom;

		// check whether to draw layers
		if (this.layersOn && this.camLayerDepth > 1) {
			layerTarget = this.layers;
		}

		// compute deltas in horizontal and vertical direction based on rotation
		dxy = Math.sin(this.camAngle / 180 * Math.PI) / this.camZoom;
		dyy = Math.cos(this.camAngle / 180 * Math.PI) / this.camZoom;

		// compute starting position
		sy = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff;
		sx = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff;

		// check if depth shading is on
		if (this.depthOn && this.layers > 1 && this.camLayerDepth > 1) {
			brightInc = 0.4 / (this.layers - 1);
			brightness = 0.6;
		}

		// create pixel colours
		this.createPixelColours(brightness);

		// set the off grid colour
		if (this.width < this.maxGridSize) {
			// use the state 0 colour
			offGrid = pixelColours[0] | 0;
		} else {
			// use grey
			offGrid = this.boundaryColour | 0;
		}

		// draw each pixel
		idx = 0 | 0;
		y = sy;
		
		for (h = 0; h < this.displayHeight; h += 1) {
			x = sx;
			for (w = 0; w < w8; w += 1) {
				// clip to the grid
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					// lookup the colour and overlay
					col = colourGrid[y & hm][x & wm];
					over = overlayGrid[y & hm][x & wm];

					// states 4 and 6
					if (over === state4 || over === state6) {
						// if alive cell then use state 3
						if (col >= aliveStart) {
							over = state3;
						}
						pixel = pixelColours[over] | 0;
					} else {
						// states 3 and 5
						if (over === state3 || over === state5) {
							// if dead cell then use state 4
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						} else {
							pixel = pixelColours[col] | 0;
						}
					}

					// set the pixel colour
					data32[idx] = pixel;
				} else {
					// use the off grid colour
					data32[idx] = offGrid;
				}
				idx += 1;

				// update row position
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm];
					over = overlayGrid[y & hm][x & wm];
					if (over === state4 || over === state6) {
						if (col >= aliveStart) {
							over = state3;
						}
						pixel = pixelColours[over] | 0;
					} else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						} else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm];
					over = overlayGrid[y & hm][x & wm];
					if (over === state4 || over === state6) {
						if (col >= aliveStart) {
							over = state3;
						}
						pixel = pixelColours[over] | 0;
					} else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						} else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm];
					over = overlayGrid[y & hm][x & wm];
					if (over === state4 || over === state6) {
						if (col >= aliveStart) {
							over = state3;
						}
						pixel = pixelColours[over] | 0;
					} else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						} else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm];
					over = overlayGrid[y & hm][x & wm];
					if (over === state4 || over === state6) {
						if (col >= aliveStart) {
							over = state3;
						}
						pixel = pixelColours[over] | 0;
					} else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						} else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm];
					over = overlayGrid[y & hm][x & wm];
					if (over === state4 || over === state6) {
						if (col >= aliveStart) {
							over = state3;
						}
						pixel = pixelColours[over] | 0;
					} else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						} else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm];
					over = overlayGrid[y & hm][x & wm];
					if (over === state4 || over === state6) {
						if (col >= aliveStart) {
							over = state3;
						}
						pixel = pixelColours[over] | 0;
					} else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						} else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm];
					over = overlayGrid[y & hm][x & wm];
					if (over === state4 || over === state6) {
						if (col >= aliveStart) {
							over = state3;
						}
						pixel = pixelColours[over] | 0;
					} else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						} else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				} else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;
			}

			// update column position
			sx += dxy;
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				if (this.historyStates === 0) {
					transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
				} else {
					if (i < layerTarget / 2) {
						transparentTarget = (i * 2 * (this.historyStates / this.layers)) | 0;
					} else {
						transparentTarget = this.historyStates + (i * (this.multiNumStates / this.layers)) | 0;
					}
				}
			} else {
				transparentTarget = (i * ((this.aliveMax + 1) / this.layers)) | 0;
			}

			// update brightness
			brightness += brightInc;
			
			// create pixel colours
			this.createPixelColours(brightness);

			// zoom for the next layer
			dxy = dxy / this.camLayerDepth;
			dyy = dyy / this.camLayerDepth;

			// update layer zoom
			layerZoom *= this.camLayerDepth;

			// check whether to switch to colour grid based on ZOOM >= 1
			lastMask = mask;
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
			}

			// check if mask changed
			if (mask !== lastMask) {
				// switch to full resolution colour grid
				colourGrid = this.colourGrid;
			}

			// create the width and height masks
			wm = this.widthMask & ~mask;
			hm = this.heightMask & ~mask;

			// create the comparison masks for clipping
			wt = ~mask;
			ht = ~mask;

			// compute starting position
			sy = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff;
			sx = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff;

			// draw each pixel
			idx = 0 | 0;
			y = sy;
			for (h = 0; h < this.displayHeight; h += 1) {
				x = sx;
				for (w = 0; w < w8; w += 1) {
					// clip to the grid
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						// lookup the colour
						col = colourGrid[y & hm][x & wm] | 0;

						// draw pixel if above the transparent target
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					// next pixel
					idx += 1;

					// update row position
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
						col = colourGrid[y & hm][x & wm] | 0;
						if (col >= transparentTarget) {
							data32[idx] = pixelColours[col];
						}
					}
					idx += 1;
					x += dyy;
					y -= dxy;

				}

				// update column position
				sx += dxy;
				sy += dyy;
				y = sy;
			}
		}
	};

	// project the life grid onto the canvas with transformation but no clipping
	Life.prototype.renderGridOverlayProjectionNoClip = function(bottomGrid, layersGrid, mask, drawingSnow) {
		var w8 = this.displayWidth >> 3,
		    pixelColours = this.pixelColours,
		    data32 = this.data32,
		    i = 0, h = 0, w = 0, x = 0, y = 0, dxy = 0, dyy = 0, sy = 0, sx = 0,
		    transparentTarget = 0,

		    // get states 3, 4, 5 and 6
		    state3 = ViewConstants.stateMap[3] + 128,
		    state4 = ViewConstants.stateMap[4] + 128,
		    state5 = ViewConstants.stateMap[5] + 128,
		    state6 = ViewConstants.stateMap[6] + 128,

		    // index in pixel buffer
		    idx = 0 | 0,

		    layerTarget = 1,
		    brightness = 1,
		    brightInc = 0,
		   
		    // index of pixel colour
		    col = 0 | 0,

		    // index of overlay colour
		    over = 0 | 0,
		    
		    // computed pixel colour
		    pixel = 0 | 0,

		    // first alive colour
		    aliveStart = this.aliveStart,

		    // create the width and height masks
		    wm = this.widthMask & ~mask,
			hm = this.heightMask & ~mask,
			
			// last mask
			lastMask = mask,

		    // start with bottom grid
		    colourGrid = layersGrid,
		    overlayGrid = bottomGrid,

		    // current layer zoom
		    layerZoom = this.camZoom;

		// check whether to draw layers
		if (this.layersOn && this.camLayerDepth > 1) {
			layerTarget = this.layers;
		}

		// compute deltas in horizontal and vertical direction based on rotation
		dxy = Math.sin(this.camAngle / 180 * Math.PI) / this.camZoom;
		dyy = Math.cos(this.camAngle / 180 * Math.PI) / this.camZoom;

		// compute starting position
		sy = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff;
		sx = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff;

		// check if depth shading is on
		if (this.depthOn && this.layers > 1 && this.camLayerDepth > 1) {
			brightInc = 0.4 / (this.layers - 1);
			brightness = 0.6;
		}

		// create pixel colours
		this.createPixelColours(brightness);

		// draw each pixel
		idx = 0 | 0;
		y = sy;
		
		for (h = 0; h < this.displayHeight; h += 1) {
			x = sx;
			for (w = 0; w < w8; w += 1) {
				// lookup the colour and overlay
				col = colourGrid[y & hm][x & wm];
				over = overlayGrid[y & hm][x & wm];

				// states 4 and 6
				if (over === state4 || over === state6) {
					// if alive cell then use state 3
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					// states 3 and 5
					if (over === state3 || over === state5) {
						// if dead cell then use state 4
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}

				// set the pixel colour
				data32[idx] = pixel;
				idx += 1;

				// update row position
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm];
				over = overlayGrid[y & hm][x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm];
				over = overlayGrid[y & hm][x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm];
				over = overlayGrid[y & hm][x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm];
				over = overlayGrid[y & hm][x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm];
				over = overlayGrid[y & hm][x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm];
				over = overlayGrid[y & hm][x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				col = colourGrid[y & hm][x & wm];
				over = overlayGrid[y & hm][x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;
				y -= dxy;
			}

			// update column position
			sx += dxy;
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				if (this.historyStates === 0) {
					transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
				} else {
					if (i < layerTarget / 2) {
						transparentTarget = (i * 2 * (this.historyStates / this.layers)) | 0;
					} else {
						transparentTarget = this.historyStates + (i * (this.multiNumStates / this.layers)) | 0;
					}
				}
			} else {
				transparentTarget = (i * ((this.aliveMax + 1) / this.layers)) | 0;
			}

			// update brightness
			brightness += brightInc;
			
			// create pixel colours
			this.createPixelColours(brightness);

			// zoom for the next layer
			dxy = dxy / this.camLayerDepth;
			dyy = dyy / this.camLayerDepth;

			// update layer zoom
			layerZoom *= this.camLayerDepth;

			// check whether to switch to colour grid based on ZOOM >= 1
			lastMask = mask;
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
			}

			// check if mask changed
			if (mask !== lastMask) {
				// switch to full resolution colour grid
				colourGrid = this.colourGrid;
			}

			// create the width and height masks
			wm = this.widthMask & ~mask;
			hm = this.heightMask & ~mask;

			// compute starting position
			sy = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff;
			sx = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff;

			// draw each pixel
			idx = 0 | 0;
			y = sy;
			for (h = 0; h < this.displayHeight; h += 1) {
				x = sx;
				for (w = 0; w < w8; w += 1) {
					// lookup the colour
					col = colourGrid[y & hm][x & wm] | 0;

					// draw pixel if above the transparent target
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					// next pixel
					idx += 1;

					// update row position
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

					// loop unroll
					col = colourGrid[y & hm][x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
					y -= dxy;

				}

				// update column position
				sx += dxy;
				sy += dyy;
				y = sy;
			}
		}
	};

	// project the life grid onto the canvas with transformation but no clipping or rotation
	Life.prototype.renderGridOverlayProjectionNoClipNoRotate = function(bottomGrid, layersGrid, mask, drawingSnow) {
		var w8 = this.displayWidth >> 3,
		    pixelColours = this.pixelColours,
		    data32 = this.data32,
		    i = 0, h = 0, w = 0, x = 0, y = 0, dyy = 0, sy = 0, sx = 0,
		    transparentTarget = 0,

		    // get states 3, 4, 5 and 6
		    state3 = ViewConstants.stateMap[3] + 128,
		    state4 = ViewConstants.stateMap[4] + 128,
		    state5 = ViewConstants.stateMap[5] + 128,
		    state6 = ViewConstants.stateMap[6] + 128,

		    // index in pixel buffer
		    idx = 0 | 0,

		    layerTarget = 1,
		    brightness = 1,
		    brightInc = 0,
		   
		    // index of pixel colour
		    col = 0 | 0,

		    // index of overlay colour
		    over = 0 | 0,
		    
		    // computed pixel colour
		    pixel = 0 | 0,

		    // first alive colour
		    aliveStart = this.aliveStart,

		    // create the width and height masks
		    wm = this.widthMask & ~mask,
		    hm = this.heightMask & ~mask,

			// last mask
			lastMask = mask,

		    // start with bottom grid
		    colourGrid = layersGrid,
		    overlayGrid = bottomGrid,

		    // colour and overlay grid rows
		    colourGridRow = null,
		    overlayGridRow = null,

		    // current layer zoom
		    layerZoom = this.camZoom;

		// check whether to draw layers
		if (this.layersOn && this.camLayerDepth > 1) {
			layerTarget = this.layers;
		}

		// compute deltas in horizontal and vertical direction based on rotation
		dyy = 1 / this.camZoom;

		// compute starting position
		sy = -((this.displayHeight / 2) * dyy) + this.camYOff;
		sx = -((this.displayWidth / 2) * dyy) + this.camXOff;

		// check if depth shading is on
		if (this.depthOn && this.layers > 1 && this.camLayerDepth > 1) {
			brightInc = 0.4 / (this.layers - 1);
			brightness = 0.6;
		}

		// create pixel colours
		this.createPixelColours(brightness);

		// draw each pixel
		idx = 0 | 0;
		y = sy;
		
		for (h = 0; h < this.displayHeight; h += 1) {
			// get the colour grid row
			colourGridRow = colourGrid[y & hm];
			overlayGridRow = overlayGrid[y & hm];
			x = sx;

			// offset if hex rule
			if (this.isHex) {
				x += 0.5 * (y | 0);
			}

			// process the row
			for (w = 0; w < w8; w += 1) {
				// lookup the colour and overlay
				col = colourGridRow[x & wm];
				over = overlayGridRow[x & wm];

				// states 4 and 6
				if (over === state4 || over === state6) {
					// if alive cell then use state 3
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					// states 3 and 5
					if (over === state3 || over === state5) {
						// if dead cell then use state 4
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}

				// set the pixel colour
				data32[idx] = pixel;
				idx += 1;

				// update row position
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				over = overlayGridRow[x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				over = overlayGridRow[x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				over = overlayGridRow[x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				over = overlayGridRow[x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				over = overlayGridRow[x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				over = overlayGridRow[x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm];
				over = overlayGridRow[x & wm];
				if (over === state4 || over === state6) {
					if (col >= aliveStart) {
						over = state3;
					}
					pixel = pixelColours[over] | 0;
				} else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					} else {
						pixel = pixelColours[col] | 0;
					}
				}
				data32[idx] = pixel;
				idx += 1;
				x += dyy;
			}

			// update column position
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				if (this.historyStates === 0) {
					transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
				} else {
					if (i < layerTarget / 2) {
						transparentTarget = (i * 2 * (this.historyStates / this.layers)) | 0;
					} else {
						transparentTarget = this.historyStates + (i * (this.multiNumStates / this.layers)) | 0;
					}
				}
			} else {
				transparentTarget = (i * ((this.aliveMax + 1) / this.layers)) | 0;
			}

			// update brightness
			brightness += brightInc;
			
			// create pixel colours
			this.createPixelColours(brightness);

			// zoom for the next layer
			dyy = dyy / this.camLayerDepth;

			// update layer zoom
			layerZoom *= this.camLayerDepth;

			// check whether to switch to colour grid based on ZOOM >= 1
			lastMask = mask;
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
			}

			// check if mask changed
			if (mask !== lastMask) {
				// switch to full resolution colour grid
				colourGrid = this.colourGrid;
			}

			// create the width and height masks
			wm = this.widthMask & ~mask;
			hm = this.heightMask & ~mask;

			// compute starting position
			sy = -((this.displayHeight / 2) * dyy) + this.camYOff;
			sx = -((this.displayWidth / 2) * dyy) + this.camXOff;

			// draw each pixel
			idx = 0 | 0;
			y = sy;
			for (h = 0; h < this.displayHeight; h += 1) {
				// get the colour grid row
				colourGridRow = colourGrid[y & hm];
				x = sx;

				// offset if hex rule
				if (this.isHex) {
					x += 0.5 * (y | 0);
				}

				// process the row
				for (w = 0; w < w8; w += 1) {
					// lookup the colour
					col = colourGridRow[x & wm] | 0;

					// draw pixel if above the transparent target
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}

					// next pixel
					idx += 1;

					// update row position
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;

					// loop unroll
					col = colourGridRow[x & wm] | 0;
					if (col >= transparentTarget) {
						data32[idx] = pixelColours[col];
					}
					idx += 1;
					x += dyy;
				}

				// update column position
				sy += dyy;
				y = sy;
			}
		}
	};

	// project the life grid onto the canvas with transformation with clipping but no rotation
	Life.prototype.renderGridOverlayProjectionClipNoRotate = function(bottomGrid, layersGrid, mask, drawingSnow) {
		var w8 = this.displayWidth >> 3,
		    pixelColours = this.pixelColours,
		    data32 = this.data32,
		    i = 0, h = 0, w = 0, x = 0, y = 0, dyy = 0, sy = 0, sx = 0,
		    transparentTarget = 0,

		    // get states 3, 4, 5 and 6
		    state3 = ViewConstants.stateMap[3] + 128,
		    state4 = ViewConstants.stateMap[4] + 128,
		    state5 = ViewConstants.stateMap[5] + 128,
		    state6 = ViewConstants.stateMap[6] + 128,

		    // index in pixel buffer
		    idx = 0 | 0,

		    layerTarget = 1,
		    brightness = 1,
		    brightInc = 0,
		   
		    // index of pixel colour
		    col = 0 | 0,

		    // index of overlay colour
		    over = 0 | 0,
		    
		    // computed pixel colour
		    pixel = 0 | 0,

		    // pixel when off-grid
		    offGrid = 0 | 0,

		    // first alive colour
		    aliveStart = this.aliveStart,

		    // create the width and height masks
		    wm = this.widthMask & ~mask,
		    hm = this.heightMask & ~mask,

			// last mask
			lastMask = mask,

		    // create the comparison masks for clipping
		    wt = ~mask,
		    ht = ~mask,

		    // start with bottom grid
		    colourGrid = layersGrid,
		    overlayGrid = bottomGrid,

		    // colour and overlay grid rows
		    colourGridRow = null,
		    overlayGridRow = null,

		    // current layer zoom
		    layerZoom = this.camZoom;

		// check whether to draw layers
		if (this.layersOn && this.camLayerDepth > 1) {
			layerTarget = this.layers;
		}

		// compute deltas in horizontal and vertical direction based on rotation
		dyy = 1 / this.camZoom;

		// compute starting position
		sy = -((this.displayHeight / 2) * dyy) + this.camYOff;
		sx = -((this.displayWidth / 2) * dyy) + this.camXOff;

		// check if depth shading is on
		if (this.depthOn && this.layers > 1 && this.camLayerDepth > 1) {
			brightInc = 0.4 / (this.layers - 1);
			brightness = 0.6;
		}

		// create pixel colours
		this.createPixelColours(brightness);

		// set the off grid colour
		if (this.width < this.maxGridSize) {
			// use the state 0 colour
			offGrid = pixelColours[0] | 0;
		} else {
			// use grey
			offGrid = this.boundaryColour | 0;
		}

		// draw each pixel
		idx = 0 | 0;
		y = sy;
		
		for (h = 0; h < this.displayHeight; h += 1) {
			// clip rows to the grid
			if ((y & ht) === (y & hm)) {
				// get the colour grid row
				colourGridRow = colourGrid[y & hm];
				overlayGridRow = overlayGrid[y & hm];
				x = sx;

				// offset if hex rule
				if (this.isHex) {
					x += 0.5 * (y | 0);
				}

				// process the row
				for (w = 0; w < w8; w += 1) {
					// clip to the grid
					if ((x & wt) === (x & wm)) {
						// lookup the colour and overlay
						col = colourGridRow[x & wm];
						over = overlayGridRow[x & wm];

						// states 4 and 6
						if (over === state4 || over === state6) {
							// if alive cell then use state 3
							if (col >= aliveStart) {
								over = state3;
							}
							pixel = pixelColours[over] | 0;
						} else {
							// states 3 and 5
							if (over === state3 || over === state5) {
								// if dead cell then use state 4
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							} else {
								pixel = pixelColours[col] | 0;
							}
						}
					} else {
						pixel = offGrid;
					}

					// set the pixel colour
					data32[idx] = pixel;
					idx += 1;

					// update row position
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm];
						over = overlayGridRow[x & wm];
						if (over === state4 || over === state6) {
							if (col >= aliveStart) {
								over = state3;
							}
							pixel = pixelColours[over] | 0;
						} else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							} else {
								pixel = pixelColours[col] | 0;
							}
						}
					} else {
						pixel = offGrid;
					}
					data32[idx] = pixel;
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm];
						over = overlayGridRow[x & wm];
						if (over === state4 || over === state6) {
							if (col >= aliveStart) {
								over = state3;
							}
							pixel = pixelColours[over] | 0;
						} else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							} else {
								pixel = pixelColours[col] | 0;
							}
						}
					} else {
						pixel = offGrid;
					}
					data32[idx] = pixel;
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm];
						over = overlayGridRow[x & wm];
						if (over === state4 || over === state6) {
							if (col >= aliveStart) {
								over = state3;
							}
							pixel = pixelColours[over] | 0;
						} else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							} else {
								pixel = pixelColours[col] | 0;
							}
						}
					} else {
						pixel = offGrid;
					}
					data32[idx] = pixel;
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm];
						over = overlayGridRow[x & wm];
						if (over === state4 || over === state6) {
							if (col >= aliveStart) {
								over = state3;
							}
							pixel = pixelColours[over] | 0;
						} else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							} else {
								pixel = pixelColours[col] | 0;
							}
						}
					} else {
						pixel = offGrid;
					}
					data32[idx] = pixel;
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm];
						over = overlayGridRow[x & wm];
						if (over === state4 || over === state6) {
							if (col >= aliveStart) {
								over = state3;
							}
							pixel = pixelColours[over] | 0;
						} else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							} else {
								pixel = pixelColours[col] | 0;
							}
						}
					} else {
						pixel = offGrid;
					}
					data32[idx] = pixel;
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm];
						over = overlayGridRow[x & wm];
						if (over === state4 || over === state6) {
							if (col >= aliveStart) {
								over = state3;
							}
							pixel = pixelColours[over] | 0;
						} else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							} else {
								pixel = pixelColours[col] | 0;
							}
						}
					} else {
						pixel = offGrid;
					}
					data32[idx] = pixel;
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm];
						over = overlayGridRow[x & wm];
						if (over === state4 || over === state6) {
							if (col >= aliveStart) {
								over = state3;
							}
							pixel = pixelColours[over] | 0;
						} else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							} else {
								pixel = pixelColours[col] | 0;
							}
						}
					} else {
						pixel = offGrid;
					}
					data32[idx] = pixel;
					idx += 1;
					x += dyy;
				}
			} else {
				// draw off grid row
				data32.fill(offGrid, idx, idx + this.displayWidth + 1);
				idx += this.displayWidth;
			}

			// update column position
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (drawingSnow) {
			this.drawSnow();
		}
		if ((this.displayGrid || this.cellBorders) && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				if (this.historyStates === 0) {
					transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
				} else {
					if (i < layerTarget / 2) {
						transparentTarget = (i * 2 * (this.historyStates / this.layers)) | 0;
					} else {
						transparentTarget = this.historyStates + (i * (this.multiNumStates / this.layers)) | 0;
					}
				}
			} else {
				transparentTarget = (i * ((this.aliveMax + 1) / this.layers)) | 0;
			}

			// update brightness
			brightness += brightInc;
			
			// create pixel colours
			this.createPixelColours(brightness);

			// zoom for the next layer
			dyy = dyy / this.camLayerDepth;

			// update layer zoom
			layerZoom *= this.camLayerDepth;

			// check whether to switch to colour grid based on ZOOM >= 1
			lastMask = mask;
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
			}

			// check if mask changed
			if (mask !== lastMask) {
				// switch to full resolution colour grid
				colourGrid = this.colourGrid;
			}

			// create the width and height masks
			wm = this.widthMask & ~mask;
			hm = this.heightMask & ~mask;

			// create the comparison masks for clipping
			wt = ~mask;
			ht = ~mask;

			// compute starting position
			sy = -((this.displayHeight / 2) * dyy) + this.camYOff;
			sx = -((this.displayWidth / 2) * dyy) + this.camXOff;

			// draw each pixel
			idx = 0 | 0;
			y = sy;
			for (h = 0; h < this.displayHeight; h += 1) {
				// clip rows to the grid
				if ((y & ht) === (y & hm)) {
					// get the colour grid row
					colourGridRow = colourGrid[y & hm];
					x = sx;

					// offset if hex rule
					if (this.isHex) {
						x += 0.5 * (y | 0);
					}

					// process the row
					for (w = 0; w < w8; w += 1) {
						// clip to the grid
						if ((x & wt) === (x & wm)) {
							// lookup the colour
							col = colourGridRow[x & wm] | 0;

							// draw pixel if above the transparent target
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}

						// next pixel
						idx += 1;

						// update row position
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGridRow[x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGridRow[x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGridRow[x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGridRow[x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGridRow[x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGridRow[x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;

						// loop unroll
						if ((x & wt) === (x & wm)) {
							col = colourGridRow[x & wm] | 0;
							if (col >= transparentTarget) {
								data32[idx] = pixelColours[col];
							}
						}
						idx += 1;
						x += dyy;
					}
				} else {
					// skip blank row
					idx += (w8 << 3);
				}

				// update column position
				sy += dyy;
				y = sy;
			}
		}
	};

	// project the overlay onto the canvas with transformation
	Life.prototype.renderGridOverlayProjection = function(bottomGrid, layersGrid, mask, drawingSnow) {
		// compute deltas in horizontal and vertical direction based on rotation
		var dxy = Math.sin(this.camAngle / 180 * Math.PI) / this.camZoom,
		    dyy = Math.cos(this.camAngle / 180 * Math.PI) / this.camZoom,

		    // display width and height
		    width = this.displayWidth,
		    height = this.displayHeight,

		    // compute top left
		    topLeftY = -((this.displayWidth / 2) * (-dxy) + (this.displayHeight / 2) * dyy) + this.camYOff,
		    topLeftX = -((this.displayWidth / 2) * dyy + (this.displayHeight / 2) * dxy) + this.camXOff,

		    // compute top right
		    topRightY = topLeftY + width * (-dxy),
		    topRightX = topLeftX + width * dyy,

		    // compute bottom left
		    bottomLeftY = topLeftY + height * dyy,
		    bottomLeftX = topLeftX + height * dxy,

		    // compute bottom right
		    bottomRightY = bottomLeftY + width * (-dxy),
		    bottomRightX = bottomLeftX + width * dyy,

		    // initialise the bounding box
		    boundTop = topLeftY,
		    boundLeft = topLeftX,
		    boundBottom = topLeftY,
		    boundRight = topLeftX;

		// set the left X extent
		if (topRightX < boundLeft) {
			boundLeft = topRightX;
		}
		if (bottomLeftX < boundLeft) {
			boundLeft = bottomLeftX;
		}
		if (bottomRightX < boundLeft) {
			boundLeft = bottomLeftX;
		}

		// set the right X extent
		if (topRightX > boundRight) {
			boundRight = topRightX;
		}
		if (bottomLeftX > boundRight) {
			boundRight = bottomLeftX;
		}
		if (bottomRightX > boundRight) {
			boundRight = bottomRightX;
		}

		// set the top Y extent
		if (topRightY < boundTop) {
			boundTop = topRightY;
		}
		if (bottomLeftY < boundTop) {
			boundTop = bottomLeftY;
		}
		if (bottomRightY < boundTop) {
			boundTop = bottomRightY;
		}

		// set the bottom Y extent
		if (topRightY > boundBottom) {
			 boundBottom = topRightY;
		}
		if (bottomLeftY > boundBottom) {
			boundBottom = bottomLeftY;
		}
		if (bottomRightY > boundBottom) {
			boundBottom = bottomRightY;
		}

		// check whether clipping is required
		if ((boundLeft | 0) < 0 || (boundRight | 0) >= this.width || (boundTop | 0) < 0 || (boundBottom | 0) >= this.height) {
			// check angle
			if (this.camAngle === 0) {
				// render with clipping and no rotation
				this.renderGridOverlayProjectionClipNoRotate(bottomGrid, layersGrid, mask, drawingSnow);
			} else {
				// render with clipping
				this.renderGridOverlayProjectionClip(bottomGrid, layersGrid, mask, drawingSnow);
			}
		} else {
			// check angle
			if (this.camAngle === 0) {
				// render with no clipping and no rotation
				this.renderGridOverlayProjectionNoClipNoRotate(bottomGrid, layersGrid, mask, drawingSnow);
			} else {
				// render with no clipping
				this.renderGridOverlayProjectionNoClip(bottomGrid, layersGrid, mask, drawingSnow);
			}
		}
	};

	// draw canvas
	Life.prototype.drawGrid = function() {
		var i = 0, l, s, t;

		// check if copy required
		if (!this.imageData.data.buffer) {
			s = this.imageData.data;
			t = this.data8;

			// get buffer length
			l = t.length;

			// copy buffer
			i = 0;
			while (i < l) {
				s[i] = t[i];
				i += 1;
				s[i] = t[i];
				i += 1;
				s[i] = t[i];
				i += 1;
				s[i] = t[i];
				i += 1;
			}
		}

		// draw the image on the canvas
		this.context.putImageData(this.imageData, 0, 0);
	};

	// clear pixels
	Life.prototype.clearPixels = function(pixelColour) {
		var data32 = this.data32;

		data32.fill(pixelColour);
	};

	// create the global interface
	window["LifeConstants"] = LifeConstants;
	window["Life"] = Life;
}
());

