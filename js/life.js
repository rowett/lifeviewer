// Life
// written by Chris Rowett

// @ts-check

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Keywords littleEndian BoundingBox AliasManager PatternManager Allocator Float32 Uint8 Uint16 Uint32 Int32 Uint8Array Uint32Array SnapshotManager HROT ViewConstants */

	// Life constants
	/** @const */
	var LifeConstants = {
		// NW glider
		/** @const {Array<Array<number>>} */ gliderNW :	[[[1, 1, 0],
														  [1, 0, 1],
														  [1, 0, 0]],
														 [[0, 1, 1],
														  [1, 1, 0],
														  [0, 0, 1]],
														 [[1, 1, 1],
														  [1, 0, 0],
														  [0, 1, 0]],
														 [[0, 1, 0],
														  [1, 1, 0],
														  [1, 0, 1]]],
		
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

		// size of triangular hash lookup array
		/** @const {number} */ hashTriangular : 8192,

		// snapshot interval
		/** @const {number} */ snapshotInterval : 50,

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
	Theme.prototype.hasHistory = function(/** boolean */ isLifeHistory) {
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
	function Life(context, /** number */ displayWidth, /** number */ displayHeight, /** number */ gridWidth, /** number */ gridHeight) {
		// allocator
		this.allocator = new Allocator();

		// flag whether to clear escaping gliders
		/** boolean */ this.clearGliders = false;

		// gliders as 5x3 integers (blank cell left and right)
		/** @const {Array<number>} */ this.gliderInteger = [];

		// cell colour strings
		/** Array<string> */ this.cellColourStrings = [];

		// before and after RLE comments
		/** string */ this.beforeTitle = "";
		/** string */ this.afterTitle = "";

		// bounded grid border colour
		/** number */ this.boundedBorderColour = 255;

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
		/** number */ this.popGraphEntries = 0;

		// maximum population value
		/** number */ this.maxPopValue = 0;

		// x, y and z origin
		/** number */ this.originX = 0;
		/** number */ this.originY = 0;
		/** number */ this.originZ = 1;

		// whether anything is alive
		/** number */ this.anythingAlive = 0;

		// bounded grid type
		/** number */ this.boundedGridType = -1;

		// bounded grid size
		/** number */ this.boundedGridWidth = -1;
		/** number */ this.boundedGridHeight = -1;

		// bounded grid shifts
		/** number */ this.boundedGridHorizontalShift = 0;
		/** number */ this.boundedGridVerticalShift = 0;

		// bounded grid twists
		/** number */ this.boundedGridHorizontalTwist = false;
		/** number */ this.boundedGridVerticalTwist = false;

		// remove pattern radius
		/** number*/ this.removePatternRadius = ViewConstants.defaultDeleteRadius;

		// stack for boundary pattern clear
		this.boundaryX = [];
		this.boundaryY = [];
		this.boundaryX[0] = this.allocator.allocate(Int32, LifeConstants.removePatternBufferSize, "Life.boundaryX0");
		this.boundaryY[0] = this.allocator.allocate(Int32, LifeConstants.removePatternBufferSize, "Life.boundaryY0");

		// number of boundary pages
		/** number */ this.boundaryPages = 0;

		// boundary colour
		/** number */ this.boundaryColour = 0xffffffff;

		// whether rule is Wolfram
		/** number */ this.wolframRule = -1;

		// whether neighbourhood is triangular
		/** boolean */ this.isTriangular = false;

		// whether neighbourhood is hex
		/** boolean */ this.isHex = false;

		// whether to draw cells as hexagons in hex display mode
		/** boolean */ this.useHexagons = true;

		// whether to display square or hex grid
		/** boolean */ this.patternDisplayMode = false;

		// whether neighbourhood is Von Neumann
		/** boolean */ this.isVonNeumann = false;

		// number of states for multi-state rules (Generations or HROT)
		/** number */ this.multiNumStates = -1;

		// whether pattern is LifeHistory
		/** boolean */ this.isLifeHistory = false;

		// how many history states to draw
		/** number */ this.historyStates = 0;

		// whether pattern is HROT
		/** boolean */ this.isHROT = false;

		// whether to draw overlay
		/** boolean */ this.drawOverlay = false;

		// create the snapshot manager
		this.snapshotManager = new SnapshotManager(this.allocator, this.bitCounts16);

		// next snapshot generation target
		this.nextSnapshotTarget = LifeConstants.snapshotInterval;

		// whether current theme has history
		/** boolean */ this.themeHistory = false;

		// whether to display grid lines
		/** boolean */ this.displayGrid = false;

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
		/** number */ this.width = gridWidth;

		// height of life grid in pixels
		/** number */ this.height = gridHeight;

		// number of pixels per tile (2^n)
		/** @const {number} */ this.tilePower = 4;

		// tile width in bytes
		/** @const {number} */ this.tileX = (1 << this.tilePower) >> 3;

		// tile height in pixels
		/** @const {number} */ this.tileY = 1 << this.tilePower;

		// number of tile columns
		/** number */ this.tileCols = this.width >> this.tilePower;

		// number of tile rows
		/** number */ this.tileRows = this.height >> this.tilePower;

		// snapshot for reset
		this.resetSnapshot = this.snapshotManager.createSnapshot(((this.tileCols - 1) >> 4) + 1, this.tileRows, true, 0);

		// display width
		/** number */ this.displayWidth = displayWidth;
		
		// display height
		/** number */ this.displayHeight = displayHeight;

		// population of grid
		/** number */ this.population = 0;

		// births in last generation
		/** number */ this.births = 0;

		// deaths in last generation
		/** number */ this.deaths = 0;

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
		/** number */ this.lastUpdate = 0;

		// first update time
		/** number */ this.firstUpdate = 0;

		// number of layers to draw
		/** number */ this.layers = 1;

		// flag if depth shading on
		/** boolean */ this.depthOn = true;

		// flag if layers on
		/** boolean */ this.layersOn = true;

		// colour theme number
		/** number */ this.colourTheme = 1;

		// colour change
		/** number */ this.colourChange = 1;
		/** number */ this.colourChangeSteps = 30;

		// survival rule
		/** number */ this.survival = (1 << 2) | (1 << 3);

		// birth rule
		/** number */ this.birth = (1 << 3);

		// number of generations
		/** number */ this.counter = 0;

		// angle of rotation
		/** number */ this.angle = 0;

		// zoom factor
		/** number */ this.zoom = 6;
		
		// x and y pan
		/** number */ this.xOff = 0;
		/** number */ this.yOff = 0;

		// layer depth
		/** number */ this.layerDepth = 0.1;

		// current camera settings
		/** number */ this.camAngle = 0;
		/** number */ this.camZoom = 1;
		/** number */ this.camXOff = 0;
		/** number */ this.camYOff = 0;
		/** number */ this.camLayerDepth = 0.1;

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
		/** number */ this.numThemes = -1;

		// 8 bit view of image data required if CanvasPixelArray used
		this.data8 = null;

		// 32 bit view of image data
		this.data32 = null;

		// image data
		this.imageData = null;

		// drawing context
		this.context = context;

		// bit masks for width and height
		/** number */ this.widthMask = 0;
		/** number */ this.heightMask = 0;

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

		// small colour grid used for zooms < 1
		this.smallColourGrid2 = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallColourGrid");

		// views of small colour grid for zooms < 1
		this.smallColourGrid4 = Array.matrixViewWithOffset(this.smallColourGrid2, 1, "Life.smallColourGrid4");
		this.smallColourGrid8 = Array.matrixViewWithOffset(this.smallColourGrid2, 3, "Life.smallColourGrid8");
		this.smallColourGrid16 = Array.matrixViewWithOffset(this.smallColourGrid2, 7, "Life.smallColourGrid16");

		// 16bit view of colour grid
		this.colourGrid16 = Array.matrixView(Uint16, this.colourGrid, "Life.colourGrid16");

		// overlay grid for LifeHistory
		this.overlayGrid = null;

		// overlay colour grid used for zooms < 1
		this.smallOverlayGrid = null;
		
		// views of small overlay colour grid used for zooms < 1
		this.smallOverlayGrid4 = null;
		this.smallOverlayGrid8 = null;
		this.smallOverlayGrid16 = null;

		// 16bit view of overlay grid
		this.overlayGrid16 = null;

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


		// 512 bit density all/odd generations
		/** number */ this.density = 0;
		/** number */ this.densityOdd = 0;

		// hash lookup for life generation (algorithm 6x3)
		this.indexLookup63 = this.allocator.allocate(Uint8, LifeConstants.hash63, "Life.indexLookup63");
		this.indexLookup632 = this.allocator.allocate(Uint8, LifeConstants.hash63, "Life.indexLookup632");

		// triangular lookup
		this.indexLookupTri1 = this.allocator.allocate(Uint8, LifeConstants.hashTriangular, "Life.indexLookupTri1");
		this.indexLookupTri2 = this.allocator.allocate(Uint8, LifeConstants.hashTriangular, "Life.indexLookupTri2");

		// colour lookup for next generation
		this.colourLookup = this.allocator.allocate(Uint8, (this.aliveMax + 1) * 2, "Life.colourLookup");

		// fast lookup for colour reset
		this.colourReset = this.allocator.allocate(Uint8, 256 * 8, "Life.colourReset");

		// grid line colour in raw format R G B
		this.gridLineRaw = ViewConstants.gridLineRawDefault;

		// grid line colour
		/** number */ this.gridLineColour = -1;

		// grid line bold colour in raw format R G B
		/** number */ this.gridLineBoldRaw = ViewConstants.gridLineBoldRawDefault;

		// grid line bold colour
		/** number */ this.gridLineBoldColour = -1;

		// grid line major interval and enablement
		/** number */ this.gridLineMajor = 10;
		/** boolean */ this.gridLineMajorEnabled = true;
		/** boolean */ this.customGridLineMajor = false;

		// user defined grid line major (to restore if theme doesn't define one)
		/** number */ this.definedGridLineMajor = 10;

		// column occupancy array for grid bounding box calculation
		this.columnOccupied16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.columnOccupied16");

		// current maximum grid size
		/** number */ this.maxGridSize = 8192;

		// graph default colours
		/** Array<number> */ this.graphBgDefColor = [0, 0, 48];
		/** Array<number> */ this.graphAxisDefColor = [255, 255, 255];
		/** Array<number> */ this.graphAliveDefColor = [255, 255, 255];
		/** Array<number> */ this.graphBirthDefColor = [0, 255, 0];
		/** Array<number> */ this.graphDeathDefColor = [255, 0, 0];

		// graph current colours
		/** Array<number> */ this.graphBgColor = [0, 0, 48];
		/** Array<number> */ this.graphAxisColor = [255, 255, 255];
		/** Array<number> */ this.graphAliveColor = [255, 255, 255];
		/** Array<number> */ this.graphBirthColor = [0, 255, 0];
		/** Array<number> */ this.graphDeathColor = [255, 0, 0];

		// HROT engine
		this.HROT = new HROT(this.allocator, this);

		// hex or triangle cell coordinates
		this.coords = this.allocator.allocate(Float32, 1, "Life.coords");

		// hex or triangle cell colours
		this.cellColours = this.allocator.allocate(Uint32, 1, "Life.cellColours");

		// number of hex or triangle cells
		/** number */ this.numCells = 0;

		// whether pattern dirty (just edited)
		/** boolean */ this.dirty = false;
	}

	// draw triangles 
	Life.prototype.drawTriangles = function() {
		var colourGrid = this.colourGrid,
			colourRow = null,
			zoomBox = this.historyBox,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** number */ x = 0,
			/** number */ y = 0,
			/** number */ j = 0,
			/** number */ k = 0,
			/** number */ cx = 0,
			/** number */ cy = 0,
			/** @const {number} */ w2 = this.width / 2 - 0.25,
			/** @const {number} */ h2 = this.height / 2,
			/** number */ state = 0,
			/** Array<number> */ coords = this.coords,
			/** Array<number> */ colours = this.cellColours,
			/** number */ leftX = zoomBox.leftX,
			/** number */ rightX = zoomBox.rightX,
			/** number */ bottomY = zoomBox.bottomY,
			/** number */ topY = zoomBox.topY,
			/** number */ yOff = this.height / 2 - this.yOff - this.originY + 0.5,
			/** number */ xOff = this.width / 2 - this.xOff - this.originX + 0.5,
			/** number */ zoom = this.zoom * this.originZ,
			/** number */ displayY = 0,
			/** number */ displayX = 0,
			/** number */ xOffset = 0,
			/** number */ linearZoom = 1,
			/** number */ oddEven = 0;

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
		this.context.lineWidth = 1;
		this.context.lineCap = "round";
		this.context.lineJoin = "round";
		j = 0;
		k = 0;
		for (y = bottomY; y <= topY; y += 1) {
			// clip y to window
			displayY = (((y - h2) + yOff) * zoom) + halfDisplayHeight;
			if (displayY >= -zoom && displayY < this.displayHeight + zoom) {
				colourRow = colourGrid[y];
				cy = (y - h2);
				xOffset = xOff - w2;
				for (x = leftX; x <= rightX; x += 1) {
					displayX = ((x + xOffset) * zoom) + halfDisplayWidth;
					if (displayX >= -zoom && displayX < this.displayWidth + zoom) {
						state = colourRow[x];
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
							// draw and clear buffer
							this.numCells = j;
							this.drawTriangleCells(true);
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
			this.drawTriangleCells(true);
			j = 0;
			k = 0;
		}

		// draw grid if enabled
		if (this.displayGrid) {
			// set grid line colour
			this.context.strokeStyle = "rgb(" + (this.gridLineRaw >> 16) + "," + ((this.gridLineRaw >> 8) & 255) + "," + (this.gridLineRaw & 255) + ")";
			linearZoom = Math.log(zoom / 4) / Math.log(ViewConstants.maxZoom / 4);
			this.context.lineWidth = (linearZoom + 1.5) | 0;

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
							this.drawTriangleCells(false);
							j = 0;
							k = 0;
						}
					}
				}
			}

			// draw any remaining cells
			this.numCells = j;
			if (j > 0) {
				this.drawTriangleCells(false);
			}
		}
	};

	// draw triangle cells
	Life.prototype.drawTriangleCells = function(/** boolean */ filled) {
		var /** number */ i = 0,
			context = this.context,
			/** number */ xOff = this.width / 2 - this.xOff - this.originX,
			/** number */ yOff = this.height / 2 - this.yOff - this.originY,
			/** @const {number} */ xzoom = this.zoom * this.originZ,
			/** @const {number} */ yzoom = this.zoom * this.originZ * Math.sqrt(3),
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** number */ x = 0,
			/** number */ y = 0,
			/** number */ cx2 = 0,
			/** number */ cy2 = 0,
			/** number */ coord = 0,
			/** number */ cx0 = 0,
			/** number */ cy0 = 0,
			/** number */ state = 0,
			/** number */ lastState = -1,
			/** Array<number> */ coords = this.coords,
			/** @const {number} */ numCoords = this.numCells,
			/** Array<number> */ colours = this.cellColours,
			/** @const {number} */ mask = (1 << LifeConstants.coordBufferBits) - 1;

		// if triangles are filled then sort by colour
		// check for sort function since IE doesn't have it
		if (filled && colours.sort) {
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
					if (filled) {
						context.fill();
					} else {
						context.stroke();
					}
					context.beginPath();
				}
				if (filled) {
					context.fillStyle = this.cellColourStrings[state];
				}
			}

			// draw triangle
			context.moveTo(x, y);
			context.lineTo(cx2 + x, cy2 + y);
			cy2 = (coords[coord + 1] - cy0) * yzoom;
			cx2 = (coords[coord] - cx0) * xzoom;
			coord += 2;
			context.lineTo(cx2 + x, cy2 + y);
		}
		if (filled) {
			context.fill();
		} else {
			context.stroke();
		}
	};

	// draw hexagons 
	Life.prototype.drawHexagons = function() {
		var colourGrid = this.colourGrid,
			colourRow = null,
			zoomBox = this.historyBox,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** number */ x = 0,
			/** number */ y = 0,
			/** number */ j = 0,
			/** number */ k = 0,
			/** number */ cx = 0,
			/** number */ cy = 0,
			/** @const {number} */ w2 = this.width / 2 - 0.25,
			/** @const {number} */ h2 = this.height / 2,
			/** @const {number} */ pi3 = Math.PI / 3,
			/** @const {number} */ yEdge = 0.5 / Math.cos(pi3 / 2), 
			/** @const {number} */ xEdge = (Math.sqrt(3) / 4) / Math.cos(pi3 / 2),
			/** @const {Array<number>} */ xa = [],
			/** @const {Array<number>} */ ya = [],
			/** number */ state = 0,
			/** number */ xa0 = 0,
			/** number */ ya0 = 0,
			/** number */ xa1 = 0,
			/** number */ ya1 = 0,
			/** number */ xa2 = 0,
			/** number */ ya2 = 0,
			/** number */ xa3 = 0,
			/** number */ ya3 = 0,
			/** number */ xa4 = 0,
			/** number */ ya4 = 0,
			/** number */ xa5 = 0,
			/** number */ ya5 = 0,
			/** Array<number> */ coords = this.coords,
			/** Array<number> */ colours = this.cellColours,
			/** number */ leftX = zoomBox.leftX,
			/** number */ rightX = zoomBox.rightX,
			/** number */ bottomY = zoomBox.bottomY,
			/** number */ topY = zoomBox.topY,
			/** number */ yOff = this.height / 2 - this.yOff - this.originY + 0.5,
			/** number */ xOff = this.width / 2 - this.xOff - this.originX + 0.5 -(this.height >> 2) + yOff / 2,
			/** number */ zoom = this.zoom * this.originZ,
			/** number */ displayY = 0,
			/** number */ displayX = 0,
			/** number */ xOffset = 0,
			/** number */ linearZoom = 1;

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
				cy = y - h2;
				xOffset = xOff - w2 - ((cy + yOff) / 2);
				for (x = leftX; x <= rightX; x += 1) {
					displayX = ((x + xOffset) * zoom) + halfDisplayWidth;
					if (displayX >= -zoom && displayX < this.displayWidth + zoom) {
						state = colourRow[x];
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
							// draw and clear buffer
							this.numCells = j;
							this.drawHexCells(true);
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
			this.drawHexCells(true);
			j = 0;
			k = 0;
		}

		// draw grid if enabled
		if (this.displayGrid) {
			// set grid line colour
			this.context.strokeStyle = "rgb(" + (this.gridLineRaw >> 16) + "," + ((this.gridLineRaw >> 8) & 255) + "," + (this.gridLineRaw & 255) + ")";
			linearZoom = Math.log(zoom / 4) / Math.log(ViewConstants.maxZoom / 4);
			this.context.lineWidth = (linearZoom + 1.5) | 0;

			j = 1.15;
			xa0 *= j;
			ya0 *= j;
			xa1 *= j;
			ya1 *= j;
			xa2 *= j;
			ya2 *= j;
			xa3 *= j;
			ya3 *= j;
			xa4 *= j;
			ya4 *= j;
			xa5 *= j;
			ya5 *= j;
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
							this.drawHexCells(false);
							j = 0;
							k = 0;
						}
					}
				}
			}

			// draw any remaining cells
			this.numCells = j;
			if (j > 0) {
				this.drawHexCells(false);
			}
		}
	};

	// draw hex cells
	Life.prototype.drawHexCells = function(/** boolean */ filled) {
		var /** number */ i = 0,
			context = this.context,
			/** number */ xOff = this.width / 2 - this.xOff - this.originX,
			/** number */ yOff = this.height / 2 - this.yOff - this.originY,
			/** @const {number} */ zoom = this.zoom * this.originZ,
			/** @const {number} */ halfDisplayWidth = this.displayWidth / 2,
			/** @const {number} */ halfDisplayHeight = this.displayHeight / 2,
			/** number */ x = 0,
			/** number */ y = 0,
			/** number */ cx = 0,
			/** number */ cy = 0,
			/** number */ cx2 = 0,
			/** number */ cy2 = 0,
			/** @const {number} */ hexAdjust = -(this.height >> 2),
			/** number */ coord = 0,
			/** number */ cx0 = 0,
			/** number */ cy0 = 0,
			/** number */ target = 0,
			/** number */ batch = 12,
			/** number */ state = 0,
			/** number */ lastState = -1,
			/** Array<number> */ coords = this.coords,
			/** @const {number} */ numCoords = this.numCells,
			/** Array<number> */ colours = this.cellColours,
			/** @const {number} */ mask = (1 << LifeConstants.coordBufferBits) - 1;

		// adjust for hex
		xOff += yOff / 2;
		xOff = xOff + hexAdjust + 0.5;
		yOff = yOff + 0.5;

		// if hexagons are filled then sort by colour
		// check for sort function since IE doesn't have it
		if (filled && colours.sort) {
			// ensure unused buffer is at end
			state = (LifeConstants.coordBufferSize << LifeConstants.coordBufferBits) + 256;
			for (i = numCoords; i < LifeConstants.coordBufferSize; i += 1) {
				colours[i] = state;
			}
			colours.sort();
		}

		// draw each hexagon
		context.beginPath();
		if (!filled) {
			// if drawing the grid then only three line segments are needed
			coord = 0;
			batch = 8;
			target = batch;
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
						context.fill();
					} else {
						context.stroke();
					}
					context.beginPath();
				}
				if (filled) {
					context.fillStyle = this.cellColourStrings[state];
				}
			}

			// draw hexagon
			context.moveTo(x, y);
			context.lineTo(cx2 + x, cy2 + y);
			while (coord < target) {
				cy2 = (coords[coord + 1] - cy0) * zoom;
				cx2 = (coords[coord] - cx0) * zoom - cy2 / 2;
				coord += 2;
				context.lineTo(cx2 + x, cy2 + y);
			}
			target += batch;
		}
		if (filled) {
			context.fill();
		} else {
			context.stroke();
		}
	};

	// convert grid to RLE
	/** @return {string} */
	Life.prototype.asRLE = function(view, me, /** boolean */ addComments) {
		var /** string */ rle = "",
			zoomBox = (me.isLifeHistory ? me.historyBox : me.zoomBox),
			/** number */ leftX = zoomBox.leftX,
			/** number */ rightX = zoomBox.rightX,
			/** number */ topY = zoomBox.topY,
			/** number */ bottomY = zoomBox.bottomY,
			/** number */ width = rightX - leftX + 1,
			/** number */ height = topY - bottomY + 1,
			/** number */ x = 0,
			/** number */ y = 0,
			/** number */ state = 0,
			/** number */ last = 0,
			/** number */ count = 0,
			/** number */ rowCount = 0,
			/** number */ lastLength = 0,
			/** @const {number} */ charsPerRow = 69,
			/** @const {Array<string>} */ outputState = [],
			/** number */ maxState = 0,
			/** @const {number} */ asciiA = String("A").charCodeAt(0),
			/** @const {number} */ asciiP = String("p").charCodeAt(0),
			/** boolean */ twoState = false,
			colourGrid = this.colourGrid,
			colourRow = null,
			/** number */ col = 0;

		// populate output states
		if (me.multiNumStates <= 2 && !me.isLifeHistory) {
			twoState = true;
			outputState[0] = "b";
			outputState[1] = "o";
		} else {
			if (me.isLifeHistory) {
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
			rle += view.patternAliasName;
		} else {
			rle += view.patternRuleName;
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

	// set state
	/** @result {number} */
	Life.prototype.setState = function(/** number */ x, /** number */ y, /** number */ state) {
		var grid = this.grid16,
			tileGrid = this.tileGrid,
			nextGrid = this.nextGrid16,
			nextTileGrid = this.nextTileGrid,
			colourGrid = this.colourGrid,
			colourTileGrid = this.colourTileGrid,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			overlayGrid = this.overlayGrid,
			zoomBox = this.zoomBox,
			HROTBox = this.HROTBox,
			historyBox = this.historyBox,

		    // bounded grid top left
		    /** number */ leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    /** number */ bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // bounded grid bottom right
		    /** number */ rightX = leftX + this.boundedGridWidth - 1,
			/** number */ topY = bottomY + this.boundedGridHeight - 1,

			// multi-state alive cell
			/** number */ aliveState = 0,

			// current cell state
			/** number */ current = 0,

			// whether cell should be alive in bit grid
			/** boolean */ bitAlive = false,

			// whether the cell is on the grid
			/** boolean */ onGrid = true,

			// whether a cell was or became LifeHistory state6
			/** number */ result = 0;

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
				nextGrid = this.nextGrid16;
				nextTileGrid = this.nextTileGrid;
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
				// mark pattern as dirty
				this.dirty = true;

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
						// adjust population if cell was dead
						if ((grid[y][x >> 4] & (1 << (~x & 15))) === 0) {
							this.population += 1;
						}
						colourGrid[y][x] = this.aliveStart;
						colourTileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						colourTileHistoryGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						grid[y][x >> 4] |= (1 << (~x & 15));
						tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						nextGrid[y][x >> 4] |= (1 << (~x & 15));
						nextTileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
					} else {
						// adjust population if cell was alive
						if ((grid[y][x >> 4] & (1 << (~x & 15))) !== 0) {
							this.population -= 1;
						}
						colourGrid[y][x] = this.unoccupied;
						colourTileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						colourTileHistoryGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						grid[y][x >> 4] &= ~(1 << (~x & 15));
						tileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
						nextGrid[y][x >> 4] &= ~(1 << (~x & 15));
						nextTileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
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
						}
						colourGrid[y][x] = state;
					} else {
						aliveState = this.multiNumStates - 1 + this.historyStates;
						if (state > 0) {
							state = this.historyStates + state;
						}
						colourGrid[y][x] = state;
					}
					colourTileGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
					colourTileHistoryGrid[y >> 4][x >> 8] |= (1 << (~(x >> 4) & 15));
					if (current !== aliveState && state === aliveState) {
						this.population += 1;
					} else {
						if (current === aliveState && state !== aliveState) {
							this.population -= 1;
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
					// potentially shrink bounding box
					if (this.population > 0) {
						// only shrink if the cell was on the boundary of the bounding box
						if (x === zoomBox.leftX || x === zoomBox.rightX || y === zoomBox.topY || y === zoomBox.bottomY) {
							// check the cell is inside the bounding box
							if (x >= zoomBox.leftX && x <= zoomBox.rightX && y >= zoomBox.bottomY && y <= zoomBox.topY) {
								this.shrinkAfterEdit(x, y);
							}
						}
					}
				}
			}
		}

		// return whether LifeHistory state 6 changed
		return result;
	};

	// allocate or clear graph data
	Life.prototype.allocateGraphData = function(/** boolean */ allocate) {
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

	// get state
	/** @result {number} */
	Life.prototype.getState = function(/** number */ x, /** number */ y, /** boolean */ rawRequested) {
		// result
		var /** number */ result = 0,
		    /** number */ col = 0,
		    /** number */ over = 0,

		    // get states 3, 4, 5 and 6
		    /** @const {number} */ state3 = ViewConstants.stateMap[3] + 128,
		    /** @const {number} */ state4 = ViewConstants.stateMap[4] + 128,
		    /** @const {number} */ state5 = ViewConstants.stateMap[5] + 128,
			/** @const {number} */ state6 = ViewConstants.stateMap[6] + 128,
			
		    // bounded grid top left
		    /** number */ leftX = Math.round((this.width - this.boundedGridWidth) / 2),
		    /** number */ bottomY = Math.round((this.height - this.boundedGridHeight) / 2),

		    // bounded grid bottom right
		    /** number */ rightX = leftX + this.boundedGridWidth - 1,
			/** number */ topY = bottomY + this.boundedGridHeight - 1;

		// check if coordinates are on the grid
		if ((x === (x & this.widthMask)) && (y === (y & this.heightMask))) {
			// get the colour grid result
			col = this.colourGrid[y][x];

			// check if raw data requested or Generations or HROT rule used
			if (rawRequested || this.multiNumStates > 2) {
				// check if state is not dead
				if (this.multiNumStates > 2 && col > 0) {
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
							result = this.multiNumStates + this.historyStates - col;
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
		    /** number */ y = 0,
		    /** number */ x = 0,
		    /** number */ tileGroup = 0,
		    /** @const {number} */ l = tile.length,
		    /** @const {number} */ w = tile[0].length,
		    bitCounts16 = this.bitCounts16,

		    // zero count
		    /** number */ result = 0;

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

	// run to given generation (used to step back)
	Life.prototype.runTo = function(targetGen, statsOn, graphDisabled) {
		// get the latest snapshot
		var numSnapshots = this.snapshotManager.snapshots.length,
		    snapshot = this.snapshotManager.snapshotBefore(targetGen);

		// check if a snapshot was deleted
		if (numSnapshots !== this.snapshotManager.snapshots.length) {
			// reduce snapshot target
			this.nextSnapshotTarget -= LifeConstants.snapshotInterval;
		}

		// check if the snapshot exists
		if (snapshot) {
			// restore the snapshot
			this.restoreSnapshot(snapshot);

			// play from the snapshot counter to just before the target with stats off (for speed)
			while (this.counter < targetGen - 1) {
				this.anythingAlive = 1;
				this.nextGeneration(false, true, graphDisabled);
				this.convertToPensTile();
			}

			// compute the final generation with stats on if required
			if (this.counter < targetGen) {
				this.anythingAlive = 1;
				this.nextGeneration(statsOn, true, graphDisabled);
			}
			this.convertToPensTile();
		}
	};

	// restore snapshot
	Life.prototype.restoreSnapshot = function(snapshot) {
		var grid = null,
		    nextGrid = null,
		    tileGrid = null,
		    nextTileGrid = null,
		    i = 0,
		    length = 0,
		    blankRow = this.blankRow,
		    blankColourRow = this.blankColourRow;

		// restore the counter
		this.counter = snapshot.counter;

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
		length = grid.length;
		for (i = 0; i < length; i += 1) {
			grid[i].set(blankRow);
			this.colourGrid[i].set(blankColourRow);
			this.smallColourGrid2[i].set(blankColourRow);
		}

		// clear the next grid
		Array.copy(grid, nextGrid);

		// copy the colour tile history grid into the colour grid
		Array.copy(this.colourTileHistoryGrid, this.colourTileGrid);

		// restore grid from snapshot
		snapshot.restoreGridUsingTile(grid, tileGrid, this);

		// restore colour grid from snapshot
		snapshot.restoreColourGridUsingTile(this.colourGrid, this.colourTileHistoryGrid, this);

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
		// create the snapshot
		this.snapshotManager.saveSnapshot(grid, tileGrid, this.colourGrid, this.colourTileHistoryGrid, this.overlayGrid, this.zoomBox, this.HROTBox, this.population, this.births, this.deaths, this.counter, ((this.tileCols - 1) >> 4) + 1, this.tileRows, this, isReset, this.anythingAlive);
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

		// colour grid
		this.colourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.colourGrid");
		this.smallColourGrid2 = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallColourGrid");
		this.smallColourGrid4 = Array.matrixViewWithOffset(this.smallColourGrid2, 1, "Life.smallColourGrid4");
		this.smallColourGrid8 = Array.matrixViewWithOffset(this.smallColourGrid2, 3, "Life.smallColourGrid8");
		this.smallColourGrid16 = Array.matrixViewWithOffset(this.smallColourGrid2, 7, "Life.smallColourGrid16");
		this.colourGrid16 = Array.matrixView(Uint16, this.colourGrid, "Life.colourGrid16");

		// check if overlay grid was allocated
		if (currentOverlayGrid) {
			this.overlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.overlayGrid");
			this.smallOverlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallOverlayGrid");
			this.smallOverlayGrid4 = Array.matrixViewWithOffset(this.smallOverlayGrid, 1, "Life.smallColourGrid4");
			this.smallOverlayGrid8 = Array.matrixViewWithOffset(this.smallOverlayGrid, 3, "Life.smallColourGrid8");
			this.smallOverlayGrid16 = Array.matrixViewWithOffset(this.smallOverlayGrid, 7, "Life.smallColourGrid16");
			this.overlayGrid16 = Array.matrixView(Uint16, this.overlayGrid, "Life.overlayGrid16");
		}

		// create the grid width and height masks
		this.widthMask = this.width - 1;
		this.heightMask = this.height - 1;

		// update the snapshots
		this.snapshotManager.resizeSnapshots(((this.tileCols - 1) >> 4) + 1, this.tileRows, 0);
	};

	// grow grid
	Life.prototype.growGrid = function() {
		// get the current grid size
		var currentSize = this.width,

		    // get current grid buffers
		    currentGrid = this.grid,
		    currentNextGrid = this.nextGrid,
		    currentColourGrid = this.colourGrid,
		    currentSmallColourGrid = this.smallColourGrid2,
		    currentOverlayGrid = this.overlayGrid,
		    currentSmallOverlayGrid = this.smallOverlayGrid,
		    currentMaskGrid = this.state6Mask,
		    currentMaskAliveGrid = this.state6Alive,
		    currentMaskCellsGrid = this.state6Cells,

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

			// colour grid
			this.colourGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.colourGrid");
			this.smallColourGrid2 = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallColourGrid");
			this.smallColourGrid4 = Array.matrixViewWithOffset(this.smallColourGrid2, 1, "Life.smallColourGrid4");
			this.smallColourGrid8 = Array.matrixViewWithOffset(this.smallColourGrid2, 3, "Life.smallColourGrid8");
			this.smallColourGrid16 = Array.matrixViewWithOffset(this.smallColourGrid2, 7, "Life.smallColourGrid16");
			this.colourGrid16 = Array.matrixView(Uint16, this.colourGrid, "Life.colourGrid16");

			// check if overlay grid was allocated
			if (currentOverlayGrid) {
				this.overlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.overlayGrid");
				this.smallOverlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallOverlayGrid");
				this.smallOverlayGrid4 = Array.matrixViewWithOffset(this.smallOverlayGrid, 1, "Life.smallColourGrid4");
				this.smallOverlayGrid8 = Array.matrixViewWithOffset(this.smallOverlayGrid, 3, "Life.smallColourGrid8");
				this.smallOverlayGrid16 = Array.matrixViewWithOffset(this.smallOverlayGrid, 7, "Life.smallColourGrid16");
				this.overlayGrid16 = Array.matrixView(Uint16, this.overlayGrid, "Life.overlayGrid16");
			}

			// create the grid width and height masks
			this.widthMask = this.width - 1;
			this.heightMask = this.height - 1;

			// copy the old grids to the center of the new ones
			for (y = 0; y < currentHeight; y += 1) {
				this.grid[y + yOffset].set(currentGrid[y], xOffset >> 3);
				this.nextGrid[y + yOffset].set(currentNextGrid[y], xOffset >> 3);
				this.colourGrid[y + yOffset].set(currentColourGrid[y], xOffset);
				this.smallColourGrid2[y + yOffset].set(currentSmallColourGrid[y], xOffset);

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
		}
	};

	// check if the grid buffer needs to grow
	Life.prototype.checkForGrowth = function(maxStep) {
		// get the grid box
		var zoomBox = this.zoomBox,

		    // get the current grid width and height
		    width = this.width,
		    height = this.height,

		    // whether the buffer grew
		    result = false;

		// check if already at maximum size
		if (width < this.maxGridSize && this.anythingAlive) {
			// check bounding box
			if (zoomBox.leftX <= maxStep || zoomBox.bottomY <= maxStep || zoomBox.rightX >= (width - maxStep) || zoomBox.topY >= (height - maxStep)) {
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
			
		// check for HROT
		if (this.isHROT) {
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
		this.clearPixels();
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
	};

	// create the overlay
	Life.prototype.createOverlay = function() {
		this.overlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.overlayGrid");
		this.smallOverlayGrid = Array.matrix(Uint8, this.height, this.width, this.unoccupied, this.allocator, "Life.smallOverlayGrid");
		this.smallOverlayGrid4 = Array.matrixViewWithOffset(this.smallOverlayGrid, 1, "Life.smallOverlayGrid4");
		this.smallOverlayGrid8 = Array.matrixViewWithOffset(this.smallOverlayGrid, 3, "Life.smallOverlayGrid8");
		this.smallOverlayGrid16 = Array.matrixViewWithOffset(this.smallOverlayGrid, 7, "Life.smallOverlayGrid16");
		this.overlayGrid16 = Array.matrixView(Uint16, this.overlayGrid, "Life.overlayGrid16");
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
		for (y = 0; y < this.state6Mask.length; y += 1) {
			this.state6Mask[y].set(this.blankRow16);
			this.state6Cells[y].set(this.blankRow16);
			this.state6Alive[y].set(this.blankRow16);
		}

		// clear state6 tile grid
		for (y = 0; y < this.state6TileGrid.length; y += 1) {
			this.state6TileGrid[y].set(this.blankTileRow);
		}

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
	};

	// initialise life engine
	Life.prototype.initEngine = function(context, displayWidth, displayHeight) {
		var i = 0,
		    w = 0,
		    unoccupied = this.unoccupied,
		    blankRow = this.blankRow,
		    blankColourRow = this.blankColourRow,
		    blankPixelRow = this.blankPixelRow,
		    blankTileRow = this.blankTileRow,
		    pixelColour;

		// set the black pixel colour
		if (this.littleEndian) {
			pixelColour = 0xff000000;
		} else {
			pixelColour = 0x000000ff;
		}

		// make glider integers
		this.makeGliderIntegers();

		// disable overlay
		this.drawOverlay = false;

		// create the grid width and height masks
		this.widthMask = this.width - 1;
		this.heightMask = this.height - 1;

		// initialise the bounding boxes
		this.zoomBox = new BoundingBox(0, 0, this.width - 1, this.height - 1);

		// initial bounding box for HROT alive cells
		this.HROTBox = new BoundingBox(0, 0, this.width -1, this.height - 1);
	
		// initial bounding box for LifeHistory
		this.initialBox = new BoundingBox(0, 0, this.width -1, this.height - 1);

		// bounding box for history autofit
		this.historyBox = new BoundingBox(0, 0, this.width - 1, this.height - 1);

		// bounding box for track box
		this.trackBox = new BoundingBox(0, 0, this.width -1, this.height - 1);

		// save drawing context
		this.context = context;

		// initialise colour reset
		this.initColourReset();

		// initialise the aliases
		AliasManager.init();

		// resize display
		this.resizeDisplay(displayWidth, displayHeight);

		// create the blank grid row
		w = ((this.width - 1) >> 3) + 1;
		for (i = 0; i < w; i += 1) {
			blankRow[i] = 0;
		}

		// create the blank colour row
		w = this.width;
		for (i = 0; i < w; i += 1) {
			blankColourRow[i] = unoccupied;
		}

		// create the blank tile row
		w = this.tileCols >> 4;
		for (i = 0; i < w; i += 1) {
			blankTileRow[i] = 0;
		}	

		// create the blank pixel row
		for (i = 0; i < displayWidth; i += 1) {
			blankPixelRow[i] = pixelColour;
		}
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
									new Colour(255, 255, 0), new ColourRange(new Colour(128, 128, 0), new Colour(128, 128, 128)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(0, 0, 0));
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
		var newTheme = this.themes[theme];

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

		// copy grid line colours from theme
		this.gridLineRaw  = newTheme.gridColour;
		this.gridLineBoldRaw = newTheme.gridMajorColour;

		// copy grid line major interval from theme unless specified with a script command
		if (!this.customGridLineMajor) {
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
		var colourLookup, aliveMax, aliveStart, deadMin, deadStart, i;
		colourLookup = this.colourLookup;
		aliveMax = this.aliveMax;
		aliveStart = this.aliveStart;
		deadMin = this.deadMin;
		deadStart = this.deadStart;

		// first pixel 
		colourLookup[0] = 0;
		colourLookup[aliveMax + 1] = aliveStart;

		for (i = 1; i < aliveMax + 1; i += 1) {
			colourLookup[i] = Math.min(Math.max(i - 1, deadMin), deadStart);
			colourLookup[i + aliveMax + 1] = Math.max(Math.min(i + 1, aliveMax), aliveStart);
		}

		// adjust for history states setting
		if (this.historyStates === 0) {
			for (i = this.aliveStart; i <= this.aliveMax; i += 1) {
				colourLookup[i] = 0;
			}
		} else {
			if (this.historyStates < this.deadStart) {
				colourLookup[this.deadStart - this.historyStates] = 0;
			}
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
	
		// check for Generations or HROT rules
		if (this.multiNumStates > 2) {
			// set unoccupied colour
			i = 0;
			this.redChannel[i] = this.unoccupiedGenCurrent.red * mixWeight + this.unoccupiedGenTarget.red * (1 - mixWeight);
			this.greenChannel[i] = this.unoccupiedGenCurrent.green * mixWeight + this.unoccupiedGenTarget.green * (1 - mixWeight);
			this.blueChannel[i] = this.unoccupiedGenCurrent.blue * mixWeight + this.unoccupiedGenTarget.blue * (1 - mixWeight);

			// set generations ramp
			for (i = 1; i < this.multiNumStates - 1; i += 1) {
				// compute the weighting between the start and end colours in the range
				if (this.multiNumStates <= 3) {
					weight = 0;
				} else {
					weight = (i - 1) / (this.multiNumStates - 3);
				}

				// compute the red component of the current and target colour
				currentComponent = this.dyingGenColCurrent.endColour.red * weight + this.dyingGenColCurrent.startColour.red * (1 - weight);
				targetComponent = this.dyingGenColTarget.endColour.red * weight + this.dyingGenColTarget.startColour.red * (1 - weight);
				this.redChannel[i + this.historyStates] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

				// compoute the green component of the current and target colour
				currentComponent = this.dyingGenColCurrent.endColour.green * weight + this.dyingGenColCurrent.startColour.green * (1 - weight);
				targetComponent = this.dyingGenColTarget.endColour.green * weight + this.dyingGenColTarget.startColour.green * (1 - weight);
				this.greenChannel[i + this.historyStates] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

				// compoute the blue component of the current and target colour
				currentComponent = this.dyingGenColCurrent.endColour.blue * weight + this.dyingGenColCurrent.startColour.blue * (1 - weight);
				targetComponent = this.dyingGenColTarget.endColour.blue * weight + this.dyingGenColTarget.startColour.blue * (1 - weight);
				this.blueChannel[i + this.historyStates] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

				// override with custom colour if specified
				if (this.customColours.length >= i) {
					current = this.customColours[i];
					if (current !== -1) {
						this.redChannel[i + this.historyStates] = current >> 16;
						this.greenChannel[i + this.historyStates] = (current >> 8) & 255; 
						this.blueChannel[i + this.historyStates] = (current & 255);
					}
				}
			}

			// set alive colour
			i = this.multiNumStates -1 + this.historyStates;
			this.redChannel[i] = this.aliveGenColCurrent.red * mixWeight + this.aliveGenColTarget.red * (1 - mixWeight);
			this.greenChannel[i] = this.aliveGenColCurrent.green * mixWeight + this.aliveGenColTarget.green * (1 - mixWeight);
			this.blueChannel[i] = this.aliveGenColCurrent.blue * mixWeight + this.aliveGenColTarget.blue * (1 - mixWeight);

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

				// compoute the green component of the current and target colour
				currentComponent = this.deadGenColCurrent.startColour.green * weight + this.deadGenColCurrent.endColour.green * (1 - weight);
				targetComponent = this.deadGenColTarget.startColour.green * weight + this.deadGenColTarget.endColour.green * (1 - weight);
				this.greenChannel[i + 1] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

				// compoute the blue component of the current and target colour
				currentComponent = this.deadGenColCurrent.startColour.blue * weight + this.deadGenColCurrent.endColour.blue * (1 - weight);
				targetComponent = this.deadGenColTarget.startColour.blue * weight + this.deadGenColTarget.endColour.blue * (1 - weight);
				this.blueChannel[i + 1] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
			}

			// override colour 0 if specified
			if (this.customColours.length > 0) {
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
	
					// compoute the green component of the current and target colour
					currentComponent = this.deadColCurrent.startColour.green * weight + this.deadColCurrent.endColour.green * (1 - weight);
					targetComponent = this.deadColTarget.startColour.green * weight + this.deadColTarget.endColour.green * (1 - weight);
					this.greenChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
	
					// compoute the blue component of the current and target colour
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

				// compoute the green component of the current and target colour
				currentComponent = this.aliveColCurrent.startColour.green * weight + this.aliveColCurrent.endColour.green * (1 - weight);
				targetComponent = this.aliveColTarget.startColour.green * weight + this.aliveColTarget.endColour.green * (1 - weight);
				this.greenChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

				// compoute the blue component of the current and target colour
				currentComponent = this.aliveColCurrent.startColour.blue * weight + this.aliveColCurrent.endColour.blue * (1 - weight);
				targetComponent = this.aliveColTarget.startColour.blue * weight + this.aliveColTarget.endColour.blue * (1 - weight);
				this.blueChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);
			}
		}
	};

	// create multi-state pixel colours
	Life.prototype.createMultiStateColours = function(colourList) {
		var redChannel = this.redChannel,
		greenChannel = this.greenChannel,
		blueChannel = this.blueChannel,
		i = 0,
		stateColour = 0;

		// create multi-state pixel colours
		for (i = 0; i < colourList.length; i += 1) {
			stateColour = colourList[i];
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

		    // get number of custom colours
		    numCustom = customColours.length,
		    i = 0;

		// create default colours
		for (i = 0; i < colourList.length; i += 1) {
			// check if a custom colour is defined
			if ((i >= numCustom) || (customColours[i] === -1)) {
				// use the library colour
				redChannel[128 + stateMap[i]] = colourList[i] >> 16;
				greenChannel[128 + stateMap[i]] = (colourList[i] >> 8) & 255;
				blueChannel[128 + stateMap[i]] = colourList[i] & 255;
			} else {
				// use the custom colour
				redChannel[128 + stateMap[i]] = customColours[i] >> 16;
				greenChannel[128 + stateMap[i]] = (customColours[i] >> 8) & 255;
				blueChannel[128 + stateMap[i]] = customColours[i] & 255;
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

				colourStrings[i] = "#" + (0x1000000 + ((redChannel[i] << 16) + (greenChannel[i] << 8) + blueChannel[i])).toString(16).substr(1);

		// check for Generations or HROT
		if (this.multiNumStates > 2) {
			// create state colours
			if (this.littleEndian) {
				for (i = 0; i <= this.multiNumStates + this.historyStates; i += 1) {
					pixelColours[i] = (255 << 24) | (blueChannel[i] << 16) | (greenChannel[i] << 8) | redChannel[i];
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
		var height = this.height,
		grid = this.grid,
		nextGrid = this.nextGrid,
		colourGrid = this.colourGrid,
		smallColourGrid2 = this.smallColourGrid2,
		overlayGrid = this.overlayGrid,
		smallOverlayGrid = this.smallOverlayGrid,
		tileGrid = this.tileGrid,
		colourTileGrid = this.colourTileGrid,
		colourTileHistoryGrid = this.colourTileHistoryGrid,
		nextTileGrid = this.nextTileGrid,

		// blank rows
		blankRow = this.blankRow,
		blankTileRow = this.blankTileRow,
		blankColourRow = this.blankColourRow,

		// loop counter
		h = 0;

		// clear each cell
		for (h = 0; h < height; h += 1) {
			grid[h].set(blankRow);
			nextGrid[h].set(blankRow);
			if (!bitOnly) {
				colourGrid[h].set(blankColourRow);
				smallColourGrid2[h].set(blankColourRow);
				if (overlayGrid) {
					overlayGrid[h].set(blankColourRow);
					smallOverlayGrid[h].set(blankColourRow);
				}
			}
		}

		// clear tile map
		height = this.tileRows;

		// clear the tiles
		for (h = 0; h < height; h += 1) {
			tileGrid[h].set(blankTileRow);
			nextTileGrid[h].set(blankTileRow);
			if (!bitOnly) {
				colourTileGrid[h].set(blankTileRow);
				colourTileHistoryGrid[h].set(blankTileRow);
			}
		}

	};

	// create the triangular life index
	Life.prototype.createTriangularIndex = function(indexLookupTriangular, ruleArray) {
		var n = LifeConstants.hashTriangular,
			i = 0;

		// create each hash entry
		for (i = 0; i < n; i += 1) {
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
			
	// update the Life rule
	Life.prototype.updateLifeRule = function() {
		var i = 0,
		    tmp = 0,
			ruleArray = (this.isTriangular ? PatternManager.ruleTriangularArray : PatternManager.ruleArray),
			ruleAltArray = (this.isTriangular ? PatternManager.ruleAltTriangularArray : PatternManager.ruleAltArray),
			altSpecified = PatternManager.altSpecified,
		    hashSize = (this.isTriangular ? LifeConstants.hashTriangular : LifeConstants.hash33),
		    odd = false;

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
					if (this.isTriangular) {
						this.createTriangularIndex(this.indexLookupTri2, ruleArray);
					} else {
						this.createLifeIndex63(this.indexLookup632, ruleArray);
					}

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
		if (altSpecified) {
			if (this.isTriangular) {
				this.createTriangularIndex(this.indexLookupTri2, ruleArray);
				this.createTriangularIndex(this.indexLookupTri1, ruleAltArray);
			} else {
				this.createLifeIndex63(this.indexLookup632, ruleArray);
				this.createLifeIndex63(this.indexLookup63, ruleAltArray);
			}
		} else {
			if (this.isTriangular) {
				this.createTriangularIndex(this.indexLookupTri1, ruleArray);
				if (!odd) {
					// duplicate even rule
					this.indexLookupTri2.set(this.indexLookupTri1);
				}
			} else {
				this.createLifeIndex63(this.indexLookup63, ruleArray);
				if (!odd) {
					// duplicate even rule
					this.indexLookup632.set(this.indexLookup63);
				}
			}
		}
	};

	// get the offset from the left most bit
	Life.prototype.leftBitOffset = function(value) {
		var result = 0;

		// find the left most bit number
		if ((value & 128) !== 0) {
			result = 0;
		} else {
			if ((value & 64) !== 0) {
				result = 1;
			} else {
				if ((value & 32) !== 0) {
					result = 2;
				} else {
					if ((value & 16) !== 0) {
						result = 3;
					} else {
						if ((value & 8) !== 0) {
							result = 4;
						} else {
							if ((value & 4) !== 0) {
								result = 5;
							} else {
								if ((value & 2) !== 0) { 
									result = 6;
								} else {
									if ((value & 1) !== 0) {
										result = 7;
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
	Life.prototype.rightBitOffset = function(value) {
		var result = 0;

		// find the right most bit number
		if ((value & 1) !== 0) {
			result = 7;
		} else {
			if ((value & 2) !== 0) {
				result = 6;
			} else {
				if ((value & 4) !== 0) {
					result = 5;
				} else {
					if ((value & 8) !== 0) {
						result = 4;
					} else {
						if ((value & 16) !== 0) {
							result = 3;
						} else {
							if ((value & 32) !== 0) {
								result = 2;
							} else {
								if ((value & 64) !== 0) {
									result = 1;
								} else {
									if ((value & 128) !== 0) {
										result = 0;
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
		for (th = 0; th < tileRows; th += 1) {
			nextTileGrid[th].set(blankTileRow);
		}

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
		for (th = 0; th < blankTileRow.length; th += 1) {
			blankTileRow[th] = 0;
		}
	};

	// shrink the tile grid to the pattern
	Life.prototype.shrinkTileGridGenerations = function() {
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
		for (th = 0; th < tileRows; th += 1) {
			nextTileGrid[th].set(blankTileRow);
		}

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
		for (th = 0; th < blankTileRow.length; th += 1) {
			blankTileRow[th] = 0;
		}
	};

	// shrink bounding boxes after edit
	Life.prototype.shrinkAfterEdit = function(x, y) {
		var startX = 0,
			startY = 0,
			leftX = this.zoomBox.leftX,
			rightX = this.zoomBox.rightX,
			topY = this.zoomBox.topY,
			bottomY = this.zoomBox.bottomY,
			colourGrid = this.colourGrid,
			colourRow = null,
			aliveState = (this.multiNumStates <= 2 ? this.aliveStart : this.historyStates + 1),
			found = false;

		// check for left edge
		if (x === leftX) {
			startX = x;
			found = false;
			while (startX <= rightX && !found) {
				startY = bottomY;
				while (startY <= topY && !found) {
					if (colourGrid[startY][startX] >= aliveState) {
						found = true;
					} else {
						startY += 1;
					}
				}
				if (found) {
					this.zoomBox.leftX = startX;
					if (this.isHROT && startX > this.HROTBox.leftX) {
						this.HROTBox.leftX = startX;
					}
				} else {
					startX += 1;
				}
			}
		} else if (x === rightX) {
			// right edge
			startX = x;
			found = false;
			while (startX >= leftX && !found) {
				startY = bottomY;
				colourRow = colourGrid[startY];
				while (startY <= topY && !found) {
					if (colourRow[startX] >= aliveState) {
						found = true;
					} else {
						startY += 1;
					}
				}
				if (found) {
					this.zoomBox.rightX = startX;
					if (this.isHROT && startX < this.HROTBox.rightX) {
						this.HROTBox.rightX = startX;
					}
				} else {
					startX -= 1;
				}
			}
		}

		// check for bottom edge
		if (y === bottomY) {
			startY = y;
			found = false;
			while (startY <= topY && !found) {
				startX = leftX;
				colourRow = colourGrid[startY];
				while (startX <= rightX && !found) {
					if (colourRow[startX] >= aliveState) {
						found = true;
					} else {
						startX += 1;
					}
				}
				if (found) {
					this.zoomBox.bottomY = startY;
					if (this.isHROT && startY > this.HROTBox.bottomY) {
						this.HROTBox.bottomY = startY;
					}
				} else {
					startY += 1;
				}
			}
		} else if (y === topY) {
			// top edge
			startY = y;
			found = false;
			while (startY >= bottomY && !found) {
				startX = leftX;
				while (startX <= rightX && !found) {
					if (colourGrid[startY][startX] >= aliveState) {
						found = true;
					} else {
						startX += 1;
					}
				}
				if (found) {
					this.zoomBox.topY = startY;
					if (this.isHROT && startY < this.HROTBox.topY) {
						this.HROTBox.topY = startY;
					}
				} else {
					startY -= 1;
				}
			}
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

		    // tile rows
		    tileRows = this.tileRows,

		    // tile grids
		    tileGrid = this.tileGrid,
		    tileRow = null,
		    nextTileGrid = this.nextTileGrid,

		    // colour tile grids
		    colourTileGrid = this.colourTileGrid,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,

		    // blank tile row
		    blankTileRow = this.blankTileRow,

		    // bottom tile row
		    bottomY = 0,

		    // top tile row
		    topY = 0,

		    // left tile group column
		    leftX = 0,

		    // right tile group column
		    rightX = 0;

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
		for (h = 0; h < columnOccupied16.length; h += 1) {
			columnOccupied16[h] = 0;
		}

		// clear the next tile grid
		for (h = 0; h < tileRows; h += 1) {
			nextTileGrid[h].set(blankTileRow);
		}

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

		// copy to tile grid to the next tile grid and to the colour tile grids
		Array.copy(tileGrid, nextTileGrid);
		Array.copy(tileGrid, colourTileGrid);
		Array.copy(tileGrid, colourTileHistoryGrid);
	};

	// clear boundary
	Life.prototype.clearBoundary = function(extra) {
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
		this.population -= remove;

		// check for Generations or HROT
		if (this.multiNumStates !== -1) {
			// clear the colour grid boundary
			grid = this.colourGrid;

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
				for (x = 0; x < this.width; x += 1) {
					bottomRow[x] = 0;
					topRow[x] = 0;
				}
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
					for (x = leftX; x <= rightX; x += 1) {
						bottomRow[x] = 0;
						topRow[x] = 0;
					}

					// clear left and right boundary
					for (y = bottomY + 1; y <= topY - 1; y += 1) {
						grid[y][leftX] = 0;
						grid[y][rightX] = 0;
					}
				}
			}
		}
	};

	// make glider integers out of the four phases of NW glider
	Life.prototype.makeGliderIntegers = function() {
		var /** number */ p = 0,
			/** @const {Array<Array<number>>} */ gliderNW = LifeConstants.gliderNW,
			/** @const {Array<number>} */ gliderInteger = this.gliderInteger,
			/** Array<Array<number>> */ phase = null,
			/** Array<number> */ row0 = null,
			/** Array<number> */ row1 = null,
			/** Array<number> */ row2 = null;

		// make integers
		for (p = 0; p <= 3; p += 1) {
			phase = gliderNW[p];
			row0 = phase[0];
			row1 = phase[1];
			row2 = phase[2];
			// NW glider
			gliderInteger[p] = (row0[0] << 3) | (row0[1] << 2) | (row0[2] << 1) |
								(row1[0] << 8) | (row1[1] << 7) | (row1[2] << 6) |
								(row2[0] << 13) | (row2[1] << 12) | (row2[2] << 11);
			// NE glider
			gliderInteger[p + 4] = (row0[2] << 3) | (row0[1] << 2) | (row0[0] << 1) |
								(row1[2] << 8) | (row1[1] << 7) | (row1[0] << 6) |
								(row2[2] << 13) | (row2[1] << 12) | (row2[0] << 11);
			// SW glider
			gliderInteger[11 - p] = gliderInteger[p]; 
			// SE glider
			gliderInteger[15 - p] = gliderInteger[p + 4];
		}
	};

	// find NE glider
	/** @return {boolean} */
	Life.prototype.findAndDeleteNE = function(/** number */ x, /** number */ y) {
		var /** boolean */ found = false;

		return found;
	};

	// find NW glider
	/** @return {boolean} */
	Life.prototype.findAndDeleteNW = function(/** number */ x, /** number */ y) {
		var /** boolean */ found = false;

		return found;
	};

	// find SE glider
	/** @return {boolean} */
	Life.prototype.findAndDeleteSE = function(/** number */ x, /** number */ y) {
		var /** boolean */ found = false;

		return found;
	};

	// find SW glider
	/** @return {boolean} */
	Life.prototype.findAndDeleteSW = function(/** number */ x, /** number */ y) {
		var /** boolean */ found = false;

		return found;
	};

	// clear escaping gliders
	Life.prototype.clearEscapingGliders = function() {
		var /** number */ x = 0,
			/** number */ y = 0,
			/** @const {number} */ leftX = this.zoomBox.leftX,
			/** @const {number} */ rightX = this.zoomBox.leftX,
			/** @const {number} */ bottomY = this.zoomBox.leftX,
			/** @const {number} */ topY = this.zoomBox.leftX,
			colourGrid = this.colourGrid,
			topRow = colourGrid[topY],
			bottomRow = colourGrid[bottomY],
			aliveStart = this.aliveStart,
			currentRow = null;

		// ignore bounded grids
		if (this.boundedGridType === -1) {
			// check top and bottom rows
			for (x = leftX; x <= rightX; x += 1) {
				if (topRow(x) >= aliveStart) {
					// NW and NE glider
					if (!this.findAndDeleteNW(x, y)) {
						this.findAndDeleteNE(x, y);
					}
				}
				if (bottomRow(x) >= aliveStart) {
					// SW and SE glider
					if (!this.findAndDeleteSW(x, y)) {
						this.findAndDeleteSE(x, y);
					}
				}
			}
			// check left and right columns
			for (y = bottomY; y <= topY; y += 1) {
				currentRow = colourGrid[y];
				if (currentRow(leftX) >= aliveStart) {
					// NW and SW glider
					if (!this.findAndDeleteNW(x, y)) {
						this.findAndDeleteSW(x, y);
					}
				}
				if (currentRow(rightX) >= aliveStart) {
					// NE and SE glider
					if (!this.findAndDeleteNE(x, y)) {
						this.findAndDeleteSW(x, y);
					}
				}
			}
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
			topY = (this.height >> this.tilePower) -1;
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
	Life.prototype.postProcessBoundedGrid = function() {
		// determine grid type
		switch (this.boundedGridType) {
		case 0:
			// plane so clear around boundary
			this.clearBoundary(1);
			break;
		case 1:
			// torus so clear cells around torus boundary
			this.clearBoundary(1);
			this.clearBoundary(2);
			break;
		case 2:
			// klein bottle so clear cells around boundary
			this.clearBoundary(1);
			this.clearBoundary(2);
			break;
		case 3:
			// cross-surface so clear cells around boundary
			this.clearBoundary(1);
			this.clearBoundary(2);
			break;
		case 4:
			// sphere so clear cells around sphere boundary
			this.clearBoundary(1);
			this.clearBoundary(2);
			break;
		}
	};

	// pre-process bounded grid
	Life.prototype.preProcessBoundedGrid = function() {
		this.setBoundedTiles();

		// determine grid type
		switch (this.boundedGridType) {
		case 0:
			// plane so nothing to do
			break;
		case 1:
			// torus
			this.processTorus();
			break;
		case 2:
			// klein bottle
			this.processKlein();
			break;
		case 3:
			// cross-surface
			this.processCrossSurface();
			break;
		case 4:
			// sphere
			this.processSphere();
			break;
		}

		// set tiles on boundary
		this.setBoundedTiles();
	};

	// compute the next generation with or without statistics
	Life.prototype.nextGeneration = function(statsOn, noHistory, graphDisabled) {
		var performSave = false,
		    zoomBox = this.zoomBox,
			historyBox = this.historyBox,
			boundarySize = 16;

		// turn stats on unless graph disabled
		if (!graphDisabled) {
			statsOn = true;
		}

		// save immediately if pattern is dirty so step back will work
		if (!noHistory) {
			if (this.dirty) {
				//this.saveSnapshot(); // TBD !!!
				this.dirty = false;
			}
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
			if (this.isHROT) {
				// compute HROT next generation
				this.HROT.nextGenerationHROT(this.counter);
			} else {
				// stats are required if they are on but not for multi-state rules which compute their own stats
				if (statsOn && this.multiNumStates < 2) {
					if (this.isTriangular) {
						this.nextGenerationTriTile();
					} else {
						this.nextGenerationTile();
					}
				} else {
					if (this.isTriangular) {
						this.nextGenerationOnlyTriTile();
					} else {
						this.nextGenerationOnlyTile();
					}
				}
			}
		}

		// increment generation count
		this.counter += 1;

		// check for Generations
		if (this.multiNumStates !== -1 && !this.isHROT) {
			this.nextGenerationGenerations();
		}

		// clear ecaping gliders if enabled
		if (this.clearGliders) {
			this.clearEscapingGliders();
		}

		// check if state 6 is on
		if (this.state6Mask) {
			// post-process for state 6
			this.state6Post();
		}

		// perform bounded grid post-processing
		if (this.boundedGridType !== -1 && !this.isHROT) {
			this.postProcessBoundedGrid();
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
	Life.prototype.drawPopGraph = function(lines, opacity, fullScreen, thumbnail) {
		var ctx = this.context,
		    borderX = 0, borderY = 40,
		    borderAxis = 40,
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
				graphHeight += 80;
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
				graphHeight -= 40;
			}

			// draw labels
			if (!thumbnail) {
				ctx.font = "16px Arial";
				ctx.textAlign = "center";
				ctx.fillStyle = "black";
				for (i = 2; i >= 0; i -= 2) {
					ctx.save();
					ctx.translate(this.displayWidth / 2, graphHeight + borderAxis / 2 - 6);
					ctx.fillText("Generation", i, i);
					ctx.restore();
					ctx.save();
					ctx.translate(borderX + borderAxis / 2 + 6, this.displayHeight / 2);
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
					ctx.translate(borderX + borderAxis - borderAxis / 2 + 6, borderY + borderAxis);
					ctx.rotate(-90 * Math.PI / 180);
					ctx.fillText(String(this.maxPopValue), i, i);
					ctx.restore();
					ctx.save();
					ctx.translate(borderX + borderAxis - borderAxis / 2 + 6, graphHeight);
					ctx.rotate(-90 * Math.PI / 180);
					ctx.fillText("0", i, i);
					ctx.restore();
					ctx.save();
					ctx.translate(borderX + borderAxis, graphHeight + borderAxis / 2 - 6);
					ctx.fillText("0", i, i);
					ctx.restore();
					ctx.save();
					ctx.translate(graphWidth, graphHeight + borderAxis / 2 - 6);
					ctx.fillText(String(this.counter > displayX ? this.counter : displayX), i, i);
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
		var indexLookup = null,
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

			indexLookup = this.indexLookupTri2;
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;

			indexLookup = this.indexLookupTri1;
		}

		// clear column occupied flags
		for (th = 0; th < columnOccupied16.length; th += 1) {
			columnOccupied16[th] = 0;
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

		// clear the next tile grid
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			tileRow = nextTileGrid[th];
			for (tw = 0; tw < tileRow.length; tw += 1) {
				tileRow[tw] = 0;
			}
		}

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

							// get add to cells set in tile
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
		for (th = 0; th < blankTileRow.length; th += 1) {
			blankTileRow[th] = 0;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
	};

	// update the life grid region using tiles for triangular grid (no stats)
	Life.prototype.nextGenerationOnlyTriTile = function() {
		var indexLookup = null,
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

			indexLookup = this.indexLookupTri2;
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;

			indexLookup = this.indexLookupTri1;
		}

		// clear column occupied flags
		for (th = 0; th < columnOccupied16.length; th += 1) {
			columnOccupied16[th] = 0;
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

		// clear the next tile grid
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			tileRow = nextTileGrid[th];
			for (tw = 0; tw < tileRow.length; tw += 1) {
				tileRow[tw] = 0;
			}
		}

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
		for (th = 0; th < blankTileRow.length; th += 1) {
			blankTileRow[th] = 0;
		}
	};

	// update the life grid region using tiles (no stats)
	Life.prototype.nextGenerationOnlyTile = function() {
		var indexLookup63 = null,
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
		    tileEndRow = tileRows;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			nextGrid = this.grid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;

			indexLookup63 = this.indexLookup632;
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;

			indexLookup63 = this.indexLookup63;
		}

		// clear column occupied flags
		for (th = 0; th < columnOccupied16.length; th += 1) {
			columnOccupied16[th] = 0;
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

		// clear the next tile grid
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			tileRow = nextTileGrid[th];
			for (tw = 0; tw < tileRow.length; tw += 1) {
				tileRow[tw] = 0;
			}
		}

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

							// check if at left edge of grid
							if (!leftX) {
								// process left edge tile first row
								val0 = (gridRow0[leftX] << 1) | (gridRow0[leftX + 1] >> 15);
								val1 = (origValue << 1) | (gridRow1[leftX + 1] >> 15);
								val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

								// get first 4 bits
								output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

								// add three sets of 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

									// check for right column now set
									if ((output & 1) !== 0) {
										neighbours |= LifeConstants.bottomRightSet;
									}

									// bottom row set
									neighbours |= LifeConstants.bottomSet;
								}
								
								// process left edge tile middle rows
								h += 1;
								while (h < topY - 1) {
									// get original value for next row
									origValue |= gridRow2[leftX];

									// next row
									gridRow2 = grid[h + 1];

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

								// get first 4 bits
								output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

								// get next 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

									// check for right column now set
									if ((output & 1) !== 0) {
										neighbours |= LifeConstants.topRightSet;
									}

									// top row set
									neighbours |= LifeConstants.topSet;
								}
							} else {
								// check if at right edge
								if (leftX >= width16 - 1) {
									// process right edge tile first row
									val0 = (gridRow0[leftX - 1] << 17) | (gridRow0[leftX] << 1);
									val1 = (gridRow1[leftX - 1] << 17) | (origValue << 1);
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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
										if ((output & 32768) !== 0) {
											neighbours |= LifeConstants.bottomLeftSet;
										}

										// bottom row set
										neighbours |= LifeConstants.bottomSet;
									}

									// process left edge tile middle rows
									h += 1;
									while (h < topY - 1) {
										// get original value for next row
										origValue |= gridRow2[leftX];

										// next row
										gridRow2 = grid[h + 1];

										// read three rows
										val0 = val1;
										val1 = val2;
										val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1);

										// get first 4 bits
										output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

										// add three sets of 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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
										if ((output & 32768) !== 0) {
											neighbours |= LifeConstants.topLeftSet;
										}

										// top row set
										neighbours |= LifeConstants.topSet;
									}
								} else {
									// process normal tile
									val0 = (gridRow0[leftX - 1] << 17) | (gridRow0[leftX] << 1) | (gridRow0[leftX + 1] >> 15);
									val1 = (gridRow1[leftX - 1] << 17) | (origValue << 1) | (gridRow1[leftX + 1] >> 15);
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

									// process middle rows of the tile
									h += 1;

									// get original value for next row
									origValue |= gridRow2[leftX];

									// next row
									gridRow2 = grid[h + 1];

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue |= gridRow2[leftX];
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

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
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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
		for (th = 0; th < blankTileRow.length; th += 1) {
			blankTileRow[th] = 0;
		}
	};

	// update the life grid region using tiles
	Life.prototype.nextGenerationTile = function() {
		var indexLookup63 = null,
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

		    // whether cells were set in the tile
		    tileCells = 0,

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

		    // bit counts for population
		    bitCounts16 = this.bitCounts16,

		    // population statistics
		    population = 0, births = 0, deaths = 0,

		    // starting and ending tile row
		    tileStartRow = 0,
		    tileEndRow = tileRows;

		// switch buffers each generation
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			nextGrid = this.grid16;
			tileGrid = this.nextTileGrid;
			nextTileGrid = this.tileGrid;

			indexLookup63 = this.indexLookup632;
		} else {
			grid = this.grid16;
			nextGrid = this.nextGrid16;
			tileGrid = this.tileGrid;
			nextTileGrid = this.nextTileGrid;

			indexLookup63 = this.indexLookup63;
		}

		// clear column occupied flags
		for (th = 0; th < columnOccupied16.length; th += 1) {
			columnOccupied16[th] = 0;
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

		// clear the next tile grid
		for (th = tileStartRow; th < tileEndRow; th += 1) {
			tileRow = nextTileGrid[th];
			for (tw = 0; tw < tileRow.length; tw += 1) {
				tileRow[tw] = 0;
			}
		}

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

							// get original value
							origValue = gridRow1[leftX];

							// add to cells set in tile
							tileCells = origValue;

							// check if at left edge of grid
							if (!leftX) {
								// process left edge tile first row
								val0 = (gridRow0[leftX] << 1) | (gridRow0[leftX + 1] >> 15);
								val1 = (origValue << 1) | (gridRow1[leftX + 1] >> 15);
								val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

								// get first 4 bits
								output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

								// add three sets of 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

									// check for right column now set
									if ((output & 1) !== 0) {
										neighbours |= LifeConstants.bottomRightSet;
									}

									// bottom row set
									neighbours |= LifeConstants.bottomSet;
								}
								
								// process left edge tile middle rows
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
									val2 = (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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
									}

									// next row
									h += 1;
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

								// get first 4 bits
								output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

								// get next 4 bits
								output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
								output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
								output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

									// check for right column now set
									if ((output & 1) !== 0) {
										neighbours |= LifeConstants.topRightSet;
									}

									// top row set
									neighbours |= LifeConstants.topSet;
								}
							} else {
								// check if at right edge
								if (leftX >= width16 - 1) {
									// process right edge tile first row
									val0 = (gridRow0[leftX - 1] << 17) | (gridRow0[leftX] << 1);
									val1 = (gridRow1[leftX - 1] << 17) | (origValue << 1);
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

										// check for left column now set
										if ((output & 32768) !== 0) {
											neighbours |= LifeConstants.bottomLeftSet;
										}

										// bottom row set
										neighbours |= LifeConstants.bottomSet;
									}

									// process left edge tile middle rows
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
										val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1);

										// get first 4 bits
										output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

										// add three sets of 4 bits
										output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
										output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
										output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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
										}

										// next row
										h += 1;
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
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

										// check for left column now set
										if ((output & 32768) !== 0) {
											neighbours |= LifeConstants.topLeftSet;
										}

										// top row set
										neighbours |= LifeConstants.topSet;
									}
								} else {
									// process normal tile
									val0 = (gridRow0[leftX - 1] << 17) | (gridRow0[leftX] << 1) | (gridRow0[leftX + 1] >> 15);
									val1 = (gridRow1[leftX - 1] << 17) | (origValue << 1) | (gridRow1[leftX + 1] >> 15);
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// add three sets of 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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

									// process middle rows of the tile
									h += 1;

									// get original value for next row
									origValue = gridRow2[leftX];
									tileCells |= origValue;

									// next row
									gridRow2 = grid[h + 1];

									// read three rows
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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
									}

									// next row
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

									// loop unroll
									origValue = gridRow2[leftX];
									tileCells |= origValue;
									gridRow2 = grid[h + 1];
									val0 = val1;
									val1 = val2;
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];
									nextGrid[h][leftX] = output;
									population += bitCounts16[output];
									births += bitCounts16[output & ~origValue];
									deaths += bitCounts16[origValue & ~output];
									if (output) {
										colOccupied |= output;
										if (h < newBottomY) {
											newBottomY = h;
										}
										if (h > newTopY) {
											newTopY = h;
										}
									}
									h += 1;

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
									val2 = (gridRow2[leftX - 1] << 17) | (gridRow2[leftX] << 1) | (gridRow2[leftX + 1] >> 15);

									// get first 4 bits
									output = indexLookup63[((val0 >> 12) & 63) | ((val1 >> 12) & 63) << 6 | ((val2 >> 12) & 63) << 12] << 12;

									// get next 4 bits
									output |= indexLookup63[((val0 >> 8) & 63) | ((val1 >> 8) & 63) << 6 | ((val2 >> 8) & 63) << 12] << 8;
									output |= indexLookup63[((val0 >> 4) & 63) | ((val1 >> 4) & 63) << 6 | ((val2 >> 4) & 63) << 12] << 4;
									output |= indexLookup63[(val0 & 63) | (val1 & 63) << 6 | (val2 & 63) << 12];

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
		for (th = 0; th < blankTileRow.length; th += 1) {
			blankTileRow[th] = 0;
		}

		// save statistics
		this.population = population;
		this.births = births;
		this.deaths = deaths;
	};

	// create 2x2 colour grid for 0.5 <= zoom < 1
	Life.prototype.create2x2ColourGrid16 = function(colourGrid, smallColourGrid2) {
		var cr = 0, h = 0,
		    colourGridRow = null,
		    colourGridRow1 = null,
		    smallColourGridRow = null,
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
								// get the next two rows
								colourGridRow = colourGrid[h];
								colourGridRow1 = colourGrid[h + 1];

								smallColourGridRow = smallColourGrid2[h];
								cr = (leftX << 3);
									
								// get the maximum of 4 pixels
								smallValue = 0;

								// first two pixels in first row
								value = colourGridRow[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}

								// next two pixels in next row
								value = colourGridRow1[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								smallColourGridRow[cr + cr] = smallValue;
								cr += 1;

								// loop unroll
								smallValue = 0;
								value = colourGridRow[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								value = colourGridRow1[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								smallColourGridRow[cr + cr] = smallValue;
								cr += 1;

								// loop unroll
								smallValue = 0;
								value = colourGridRow[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								value = colourGridRow1[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								smallColourGridRow[cr + cr] = smallValue;
								cr += 1;

								// loop unroll
								smallValue = 0;
								value = colourGridRow[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								value = colourGridRow1[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								smallColourGridRow[cr + cr] = smallValue;
								cr += 1;

								// loop unroll
								smallValue = 0;
								value = colourGridRow[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								value = colourGridRow1[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								smallColourGridRow[cr + cr] = smallValue;
								cr += 1;

								// loop unroll
								smallValue = 0;
								value = colourGridRow[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								value = colourGridRow1[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								smallColourGridRow[cr + cr] = smallValue;
								cr += 1;

								// loop unroll
								smallValue = 0;
								value = colourGridRow[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								value = colourGridRow1[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								smallColourGridRow[cr + cr] = smallValue;
								cr += 1;

								// loop unroll
								smallValue = 0;
								value = colourGridRow[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								value = colourGridRow1[cr];
								if ((value & 255) > smallValue) {
									smallValue = value & 255;
								}
								value >>= 8;
								if (value > smallValue) {
									smallValue = value;
								}
								smallColourGridRow[cr + cr] = smallValue;
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
	Life.prototype.create4x4ColourGrid = function(smallColourGrid2, smallColourGrid4) {
		var h = 0,
		    cr = 0,
		    smallColourGridRow = null,
		    smallColourGridRow1 = null,
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
								destRow = smallColourGrid4[h];

								// get the next two rows
								smallColourGridRow = smallColourGrid2[h];
								smallColourGridRow1 = smallColourGrid2[h + 2];
								cr = (leftX << 4);
									
								// get the maximum of 4 pixels
								smallValue = smallColourGridRow[cr];
								value = smallColourGridRow[cr + 2];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr + 2];
								if (value > smallValue) {
									smallValue = value;
								}
								destRow[cr] = smallValue;
								cr += 4;

								// loop unroll
								smallValue = smallColourGridRow[cr];
								value = smallColourGridRow[cr + 2];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr + 2];
								if (value > smallValue) {
									smallValue = value;
								}
								destRow[cr] = smallValue;
								cr += 4;

								// loop unroll
								smallValue = smallColourGridRow[cr];
								value = smallColourGridRow[cr + 2];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr + 2];
								if (value > smallValue) {
									smallValue = value;
								}
								destRow[cr] = smallValue;
								cr += 4;

								// loop unroll
								smallValue = smallColourGridRow[cr];
								value = smallColourGridRow[cr + 2];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr + 2];
								if (value > smallValue) {
									smallValue = value;
								}
								destRow[cr] = smallValue;
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
	Life.prototype.create8x8ColourGrid = function(smallColourGrid4, smallColourGrid8) {
		var h = 0,
		    cr = 0,
		    smallColourGridRow = null,
		    smallColourGridRow1 = null,
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
								destRow = smallColourGrid8[h];

								// get the next two rows
								smallColourGridRow = smallColourGrid4[h];
								smallColourGridRow1 = smallColourGrid4[h + 4];
								cr = (leftX << 4);
									
								// get the maximum of 4 pixels
								smallValue = smallColourGridRow[cr];
								value = smallColourGridRow[cr + 4];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr + 4];
								if (value > smallValue) {
									smallValue = value;
								}
								destRow[cr] = smallValue;
								cr += 8;

								// loop unroll
								smallValue= smallColourGridRow[cr];
								value = smallColourGridRow[cr + 4];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr];
								if (value > smallValue) {
									smallValue = value;
								}
								value = smallColourGridRow1[cr + 4];
								if (value > smallValue) {
									smallValue = value;
								}
								destRow[cr] = smallValue;
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

	// create 16x16 colour grid for 0.0625 <= zoom < 0.125
	Life.prototype.create16x16ColourGrid = function(smallColourGrid8, smallColourGrid16) {
		var cr = 0,
		    smallColourGridRow = null,
		    smallColourGridRow1 = null,
		    destRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileHistoryRow = null,
		    value = 0, th = 0, tw = 0, b = 0,
		    bottomY = 0, leftX = 0,
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
							destRow = smallColourGrid16[bottomY];

							// get the next two rows
							smallColourGridRow = smallColourGrid8[bottomY];
							smallColourGridRow1 = smallColourGrid8[bottomY + 8];
							cr = (leftX << 4);
									
							// get the maximum of 4 pixels
							smallValue = smallColourGridRow[cr];
							value = smallColourGridRow[cr + 8];
							if (value > smallValue) {
								smallValue = value;
							}
							value = smallColourGridRow1[cr];
							if (value > smallValue) {
								smallValue = value;
							}
							value = smallColourGridRow1[cr + 8];
							if (value > smallValue) {
								smallValue = value;
							}
							destRow[cr] = smallValue;
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

	// create the small colour grids based on zoom level
	Life.prototype.createSmallColourGrids = function() {
		// check if zoomed out
		if (this.camZoom < 1) {
			// create 2x2 colour grid
			this.create2x2ColourGrid16(this.colourGrid16, this.smallColourGrid2);

			// check if zoomed out further
			if (this.camZoom < 0.5) {
				// create 4x4 colour grid
				this.create4x4ColourGrid(this.smallColourGrid2, this.smallColourGrid4);

				// check if zoomed out further
				if (this.camZoom < 0.25) {
					// create 8x8 colour grid
					this.create8x8ColourGrid(this.smallColourGrid4, this.smallColourGrid8);

					// check if zoomed out further
					if (this.camZoom < 0.125) {
						// create 16x16 colour grid
						this.create16x16ColourGrid(this.smallColourGrid8, this.smallColourGrid16);
					}
				}
			}
		}

		// check for overlay
		if (this.drawOverlay) {
			// check if zoomed out
			if (this.camZoom < 1) {
				// create 2x2 colour grid
				this.create2x2ColourGrid16(this.overlayGrid16, this.smallOverlayGrid);

				// check if zoomed out further
				if (this.camZoom < 0.5) {
					// create 4x4 colour grid
					this.create4x4ColourGrid(this.smallOverlayGrid, this.smallOverlayGrid4);

					// check if zoomed out further
					if (this.camZoom < 0.25) {
						// create 8x8 colour grid
						this.create8x8ColourGrid(this.smallOverlayGrid4, this.smallOverlayGrid8);

						// check if zoomed out further
						if (this.camZoom < 0.125) {
							// create 16x16 colour grid
							this.create16x16ColourGrid(this.smallOverlayGrid8, this.smallOverlayGrid16);
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
		// check for generations or HROT rule
		if (this.multiNumStates === -1) {
			// use regular converter
			this.convertToPensTileRegular();
		} else {
			if (!this.anythingAlive) {
				this.generationsDecayOnly();
			}
		}
	};
	
	// convert life grid region to pens using tiles
	Life.prototype.convertToPensTileRegular = function() {
		var h = 0, cr = 0, nextCell = 0,
		    colourGrid = this.colourGrid,
		    colourGridRow = null, colourTileRow = null,
		    colourTileHistoryRow = null,
		    colourTileHistoryGrid = this.colourTileHistoryGrid,
		    colourTileGrid = this.colourTileGrid,
		    colourLookup = this.colourLookup,
		    aliveIndex = this.aliveMax + 1,
		    grid = null, gridRow = null, 
		    tileGrid = null, tileGridRow = null,
		    value = 0, th = 0, tw = 0, b = 0,
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
								colourGridRow = colourGrid[h];

								// get correct starting colour index
								cr = (leftX << 4);

								// process each 16bit chunk (16 cells) along the row
								nextCell = gridRow[leftX];

								// determine if anything is alive on the grid
								this.anythingAlive |= nextCell;
								tileAlive |= nextCell;

								// lookup next colour
								if ((nextCell & 32768) !== 0) {
									// if alive just copy
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									// if dead then get value and copy
									value = colourLookup[colourGridRow[cr]];

									// tile is alive if dead cell has ever been occupied
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								// loop unroll
								if ((nextCell & 16384) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8192) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4096) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2048) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1024) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 512) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 256) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 128) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 64) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 32) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 16) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;

								// next row
								h += 1;

								// loop unroll
								gridRow = grid[h];
								colourGridRow = colourGrid[h];
								cr = (leftX << 4);
								nextCell = gridRow[leftX];
								this.anythingAlive |= nextCell;
								tileAlive |= nextCell;
								if ((nextCell & 32768) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;
								if ((nextCell & 16384) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8192) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4096) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2048) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1024) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 512) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 256) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 128) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 64) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 32) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 16) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								h += 1;

								// loop unroll
								gridRow = grid[h];
								colourGridRow = colourGrid[h];
								cr = (leftX << 4);
								nextCell = gridRow[leftX];
								this.anythingAlive |= nextCell;
								tileAlive |= nextCell;
								if ((nextCell & 32768) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;
								if ((nextCell & 16384) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8192) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4096) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2048) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1024) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 512) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 256) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 128) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 64) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 32) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 16) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								h += 1;

								// loop unroll
								gridRow = grid[h];
								colourGridRow = colourGrid[h];
								cr = (leftX << 4);
								nextCell = gridRow[leftX];
								this.anythingAlive |= nextCell;
								tileAlive |= nextCell;
								if ((nextCell & 32768) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;
								if ((nextCell & 16384) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8192) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4096) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2048) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1024) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 512) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 256) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 128) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 64) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 32) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 16) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								} else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
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
			if ((this.width / 2 - width / 2) < leftX) {
				leftX = this.width / 2 - width / 2;
			}
			if ((this.width / 2 + width / 2) > rightX) {
				rightX = this.width / 2 + width / 2;
			}
			if ((this.height / 2 - height / 2) <  bottomY) {
				bottomY = this.height / 2 - height / 2;
			}
			if ((this.height / 2 + height / 2) > topY) {
				topY = this.height / 2 + height / 2;
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
			endTarget = 0,
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
		endTarget = end - 15;

		// see if the line is on the display
		if (y >= 0 && y < h) {
			// draw the horizontal line
			while (offset <= endTarget) {
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
				data32[offset] = colour;
				offset += 1;
			}

			// draw the last part
			while (offset <= end) {
				data32[offset] = colour;
				offset += 1;
			}
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

		    // compute single cell offset
		    yOff = (((this.height / 2 - (this.yOff + this.originY)) * zoomStep) + (h / 2)) % zoomStep,
		    xOff = (((this.width / 2 - (this.xOff + this.originX)) * zoomStep) + (w / 2)) % zoomStep;

		// draw twice if major grid lines enabled
		if (this.gridLineMajor > 0 && this.gridLineMajorEnabled) {
			loop = 2;
		} else {
			loop = 1;
		}

		// start drawing the grid line colour
		targetCol = gridCol;

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
				if (this.gridLineMajor > 0 && this.gridLineMajorEnabled) {
					// choose whether to use major or minor colour
					if (gridLineNum % this.gridLineMajor === 0) {
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
				if (this.gridLineMajor > 0 && this.gridLineMajorEnabled) {
					// choose whether to use major or minor colour
					if (gridLineNum % this.gridLineMajor === 0) {
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
	Life.prototype.drawBoundedGridBorder = function(border) {
		// get width and height
		var width = this.boundedGridWidth,
		    height = this.boundedGridHeight,

		    // colour grid
		    colourGrid = this.colourGrid,

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
			for (i = 0; i < this.width; i += 1) {
				bottomRow[i] = border;
				topRow[i] = border;
			}
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
				for (i = leftX; i <= rightX; i += 1) {
					bottomRow[i] = border;
					topRow[i] = border;
				}

				// draw left and right
				for (i = bottomY + 1; i <= topY - 1; i += 1) {
					colourGrid[i][leftX] = border;
					colourGrid[i][rightX] = border;
				}
			}
		}
	};

	// project the life grid onto the canvas
	Life.prototype.renderGrid = function() {
		var colour0 = this.pixelColours[0],
			data32 = this.data32,
			i = 0, l = 0;

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
			this.drawBoundedGridBorder(this.boundedBorderColour);
		}

		// check if drawing grid with polygons
		if (this.camZoom >= 4 && ((this.useHexagons && this.isHex) || this.isTriangular)) {
			// clear grid
			i = 0;
			l = data32.length;
			while (i < l) {
				data32[i] = colour0;
				i += 1;
			}
			// create pixel colours
			this.createPixelColours(1);
		} else {
			// create small colour grids if zoomed out
			this.createSmallColourGrids();

			// check if zoom < 0.125x
			if (this.camZoom < 0.125) {
				// check for LifeHistory overlay
				if (this.drawOverlay) {
					// render the grid with the overlay on top
					this.renderGridOverlayProjection(this.smallOverlayGrid16, this.smallColourGrid16, 15);
				} else {
					// render using small colour grid 16x16
					this.renderGridProjection(this.smallColourGrid16, this.smallColourGrid16, 15);
				}
			} else {
				// check if zoom < 0.25x
				if (this.camZoom < 0.25) {
					// check for LifeHistory overlay
					if (this.drawOverlay) {
						// render the grid with the overlay on top
						this.renderGridOverlayProjection(this.smallOverlayGrid8, this.smallColourGrid8, 7);
					} else {
						// render using small colour grid 8x8
						this.renderGridProjection(this.smallColourGrid8, this.smallColourGrid8, 7);
					}
				} else {
					// check if zoom < 0.5x
					if (this.camZoom < 0.5) {
						// check for LifeHistory overlay
						if (this.drawOverlay) {
							// render the grid with the overlay on top
							this.renderGridOverlayProjection(this.smallOverlayGrid4, this.smallColourGrid4, 3);
						} else {
							// render using small colour grid 4x4
							this.renderGridProjection(this.smallColourGrid4, this.smallColourGrid4, 3);
						}
					} else {
						// check for zoom < 1x
						if (this.camZoom < 1) {
							// check for LifeHistory overlay
							if (this.drawOverlay) {
								// render the grid with the overlay on top
								this.renderGridOverlayProjection(this.smallOverlayGrid, this.smallColourGrid2, 1);
							} else {
								// render using small colour grid 2x2
								this.renderGridProjection(this.smallColourGrid2, this.smallColourGrid2, 1);
							}
						} else {
							// check for LifeHistory overlay
							if (this.drawOverlay) {
								// render the grid with the overlay on top
								this.renderGridOverlayProjection(this.overlayGrid, this.colourGrid, 0);
							} else {
								// render the grid
								this.renderGridProjection(this.colourGrid, this.colourGrid, 0);
							}
						}
					}
				}
			}
		}
	};

	// project the life grid onto the canvas with transformation and clipping
	Life.prototype.renderGridProjectionClip = function(bottomGrid, layersGrid, mask) {
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
		if (this.displayGrid && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
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
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				colourGrid = this.smallColourGrid16;
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
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
	Life.prototype.renderGridProjectionClipNoRotate = function(bottomGrid, layersGrid, mask) {
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
				for (w = 0; w < w8; w += 1) {
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
				}
			}

			// update column position
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (this.displayGrid && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
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
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				colourGrid = this.smallColourGrid16;
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
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
	Life.prototype.renderGridProjectionNoClip = function(bottomGrid, layersGrid, mask) {
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
		if (this.displayGrid && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
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
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				colourGrid = this.smallColourGrid16;
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
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
	Life.prototype.renderGridProjectionNoClipNoRotate = function(bottomGrid, layersGrid, mask) {
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
				col = colourGridRow[x & wm] | 0;

				// set the pixel in the buffer
				data32[idx] = pixelColours[col];
				idx += 1;

				// update row position
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;

				// loop unroll
				col = colourGridRow[x & wm] | 0;
				data32[idx] = pixelColours[col];
				idx += 1;
				x += dyy;
			}

			// update column position
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (this.displayGrid && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
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
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				colourGrid = this.smallColourGrid16;
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
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
	Life.prototype.renderGridProjection = function(bottomGrid, layersGrid, mask) {
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
				this.renderGridProjectionClipNoRotate(bottomGrid, layersGrid, mask);
			} else {
				// render with clipping and rotation
				this.renderGridProjectionClip(bottomGrid, layersGrid, mask);
			}
		} else {
			// check angle
			if (this.camAngle === 0) {
				// render with no clipping and no rotation
				this.renderGridProjectionNoClipNoRotate(bottomGrid, layersGrid, mask);
			} else {
				// render with no clipping and rotation
				this.renderGridProjectionNoClip(bottomGrid, layersGrid, mask);
			}
		}
	};

	// project the life grid onto the canvas with transformation
	Life.prototype.renderGridOverlayProjectionClip = function(bottomGrid, layersGrid, mask) {
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
		if (this.displayGrid && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
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
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				colourGrid = this.smallColourGrid16;
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
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
	Life.prototype.renderGridOverlayProjectionNoClip = function(bottomGrid, layersGrid, mask) {
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
		if (this.displayGrid && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
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
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				colourGrid = this.smallColourGrid16;
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
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
	Life.prototype.renderGridOverlayProjectionNoClipNoRotate = function(bottomGrid, layersGrid, mask) {
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
		if (this.displayGrid && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
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
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				colourGrid = this.smallColourGrid16;
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
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
	Life.prototype.renderGridOverlayProjectionClipNoRotate = function(bottomGrid, layersGrid, mask) {
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
				for (w = 0; w < w8; w += 1) {
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
					data32[idx] = offGrid;
					idx += 1;
				}
			}

			// update column position
			sy += dyy;
			y = sy;
		}

		// draw grid lines if enabled
		if (this.displayGrid && this.canDisplayGrid()) {
			this.drawGridLines();
		}

		// switch to layers grid
		colourGrid = layersGrid;

		// render each layer
		for (i = 1; i < layerTarget; i += 1) {
			// compute the transparent target
			if (this.multiNumStates > 2) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
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
			if (layerZoom < 0.125) {
				// switch to small grid 16x16
				colourGrid = this.smallColourGrid16;
				mask = 15;
			} else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				} else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					} else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						} else {
							// switch to full resolution grid
							colourGrid = this.colourGrid;
							mask = 0;
						}
					}
				}
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
	Life.prototype.renderGridOverlayProjection = function(bottomGrid, layersGrid, mask) {
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
				this.renderGridOverlayProjectionClipNoRotate(bottomGrid, layersGrid, mask);
			} else {
				// render with clipping
				this.renderGridOverlayProjectionClip(bottomGrid, layersGrid, mask);
			}
		} else {
			// check angle
			if (this.camAngle === 0) {
				// render with no clipping and no rotation
				this.renderGridOverlayProjectionNoClipNoRotate(bottomGrid, layersGrid, mask);
			} else {
				// render with no clipping
				this.renderGridOverlayProjectionNoClip(bottomGrid, layersGrid, mask);
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
	Life.prototype.clearPixels = function() {
		var i = 0,
		    offset = 0,
		    rows = this.displayHeight,
		    columns = this.displayWidth,
		    data32 = this.data32,
		    blankPixelRow = this.blankPixelRow;

		for (i = 0; i < rows; i += 1) {
			data32.set(blankPixelRow, offset);
			offset += columns;
		}
	};

	// create the global interface
	window["LifeConstants"] = LifeConstants;
	window["Life"] = Life;
}
());

