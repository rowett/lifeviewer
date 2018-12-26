// Life
// written by Chris Rowett

// @ts-check

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global littleEndian BoundingBox AliasManager PatternManager Allocator Uint8 Uint16 Uint32 Int32 Uint8Array Uint32Array SnapshotManager LTL ViewConstants */

	// Life constants
	/** @const */
	var LifeConstants = {
		// remove pattern cell buffer (must be power of 2)
		/** @const {number} */ removePatternBufferSize : 4096,

		// size of 3x3 hash lookup array
		/** @const {number} */ hash33 : 512,

		// size of 6x3 hash lookup array
		/** @const {number} */ hash63 : 262144,

		// snapshot interval
		/** @const {number} */ snapshotInterval : 50,

		// bounded grid border colour
		/** @const {number} */ boundedBorderColour : 255,

		// maximum number of population samples for graph
		/** @const {number} */ maxPopSamples : 262144,

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
	function Theme(deadRange, aliveRange, unoccupied) {
		this.aliveRange = aliveRange;
		this.deadRange = deadRange;
		this.unoccupied = unoccupied;
	}
	
	// check if theme has colour history
	Theme.prototype.hasHistory = function() {
		var result = true;

		// check if the alive start and end colour are the same, the dead start and end colour are the same and the dead and unoccupied colour are the same
		if ((this.aliveRange.startColour.isSameColour(this.aliveRange.endColour)) && (this.deadRange.startColour.isSameColour(this.deadRange.endColour)) && (this.deadRange.startColour.isSameColour(this.unoccupied))) {
			result = false;
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
	function Life(context, displayWidth, displayHeight, gridWidth, gridHeight) {
		// allocator
		this.allocator = new Allocator();

		// custom state colours
		this.customColours = null;

		// bit counts for 16bit values
		this.bitCounts16 = this.allocator.allocate(Uint8, 65536, "Life.bitCounts16");
		this.initBitCounts16();

		// population graph array
		this.popGraphData = this.allocator.allocate(Uint32, LifeConstants.maxPopSamples, "Life.popGraphData");
		this.birthGraphData = this.allocator.allocate(Uint32, LifeConstants.maxPopSamples, "Life.birthGraphData");
		this.deathGraphData = this.allocator.allocate(Uint32, LifeConstants.maxPopSamples, "Life.deathGraphData");

		// maximum population value
		this.maxPopValue = 0;

		// x, y and z origin
		this.originX = 0;
		this.originY = 0;
		this.originZ = 1;

		// whether anything is alive
		this.anythingAlive = 0;

		// generation when life stopped
		this.stoppedGeneration = -1;

		// whether generations still decaying
		this.generationsAlive = 0;

		// bounded grid type
		this.boundedGridType = -1;

		// bounded grid size
		this.boundedGridWidth = -1;
		this.boundedGridHeight = -1;

		// bounded grid shifts
		this.boundedGridHorizontalShift = 0;
		this.boundedGridVerticalShift = 0;

		// bounded grid twists
		this.boundedGridHorizontalTwist = false;
		this.boundedGridVerticalTwist = false;

		// remove pattern radius
		this.removePatternRadius = ViewConstants.defaultDeleteRadius;

		// stack for boundary pattern clear
		this.boundaryX = [];
		this.boundaryY = [];
		this.boundaryX[0] = this.allocator.allocate(Int32, LifeConstants.removePatternBufferSize, "Life.boundaryX0");
		this.boundaryY[0] = this.allocator.allocate(Int32, LifeConstants.removePatternBufferSize, "Life.boundaryY0");

		// number of boundary pages
		this.boundaryPages = 0;

		// boundary colour
		this.boundaryColour = 0xffffffff;

		// whether rule is Wolfram
		this.wolframRule = -1;

		// whether neighbourhood is hex
		this.isHex = false;

		// pattern neighbourhood
		this.patternDisplayMode = false;

		// whether nieghbourhood is Von Neumann
		this.isVonNeumann = false;

		// number of states for multi-state rules (Generations and LTL)
		this.multiNumStates = -1;

		// whether pattern is LifeHistory
		this.isLifeHistory = false;

		// whether pattern is LTL
		this.isLTL = false;

		// whether to draw overlay
		this.drawOverlay = false;

		// create the snapshot manager
		this.snapshotManager = new SnapshotManager(this.allocator, this.bitCounts16);

		// next snapshot generation target
		this.nextSnapshotTarget = LifeConstants.snapshotInterval;

		// whether current theme has history
		this.themeHistory = false;

		// whether to display grid lines
		this.displayGrid = false;

		// zoom bounding box
		this.zoomBox = null;

		// initial bounding box for LifeHistory
		this.initialBox = null;

		// history bounding box
		this.historyBox = null;

		// track box bounding box
		this.trackBox = null;

		// program title
		this.title = "LifeViewer";

		// width of life grid in pixels
		this.width = gridWidth;

		// height of life grid in pixels
		this.height = gridHeight;

		// number of pixels per tile (2^n)
		this.tilePower = 4;

		// tile width in bytes
		this.tileX = (1 << this.tilePower) >> 3;

		// tile height in pixels
		this.tileY = 1 << this.tilePower;

		// number of tile columns
		this.tileCols = this.width >> this.tilePower;

		// number of tile rows
		this.tileRows = this.height >> this.tilePower;

		// snapshot for reset
		this.resetSnapshot = this.snapshotManager.createSnapshot(((this.tileCols - 1) >> 4) + 1, this.tileRows, true, 0);

		// display width
		this.displayWidth = displayWidth;
		
		// display height
		this.displayHeight = displayHeight;

		// population of grid
		this.population = 0;

		// births in last generation
		this.births = 0;

		// deaths in last generation
		this.deaths = 0;

		// cell colour index for new cell
		this.aliveStart = 64;

		// cell colour index for cell alive longest
		this.aliveMax = 127;

		// cell colour index for cell just dead
		this.deadStart = 63;

		// cell colour index for cell dead longest
		this.deadMin = 1;

		// cell colour index for cell never occupied
		this.unoccupied = 0;
		
		// last update time
		this.lastUpdate = 0;

		// first update time
		this.firstUpdate = 0;

		// number of layers to draw
		this.layers = 1;

		// flag if depth shading on
		this.depthOn = true;

		// flag if layers on
		this.layersOn = true;

		// colour theme number
		this.colourTheme = 1;

		// colour change
		this.colourChange = 1;
		this.colourChangeSteps = 30;

		// survival rule
		this.survival = (1 << 2) | (1 << 3);

		// birth rule
		this.birth = (1 << 3);

		// number of generations
		this.counter = 0;

		// angle of rotation
		this.angle = 0;

		// zoom factor
		this.zoom = 6;
		
		// x and y pan
		this.xOff = 0;
		this.yOff = 0;

		// layer depth
		this.layerDepth = 0.1;

		// current camera settings
		this.camAngle = 0;
		this.camZoom = 1;
		this.camXOff = 0;
		this.camYOff = 0;
		this.camLayerDepth = 0.1;

		// endian flag
		this.littleEndian = littleEndian;

		// list of themes
		this.themes = [];

		// current colour range
		this.deadColCurrent = null;
		this.aliveColCurrent = null;
		this.unoccupiedCurrent = null;

		// target colour range
		this.deadColTarget = null;
		this.aliveColTarget = null;
		this.unoccupiedTarget = null;

		// number of  colour themes
		this.numThemes = 13;

		// 8 bit view of image data required if CanvasPixelArray used
		this.data8 = null;

		// 32 bit view of image data
		this.data32 = null;

		// image data
		this.imageData = null;

		// drawing context
		this.context = context;

		// bit masks for width and height
		this.widthMask = 0;
		this.heightMask = 0;

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
		this.density = 0;
		this.densityOdd = 0;

		// hash lookup for custom maps
		this.indexLookup33 = this.allocator.allocate(Uint8, LifeConstants.hash33, "Life.indexLookup33");

		// hash lookup for life generation (algorithm 6x3)
		this.indexLookup63 = this.allocator.allocate(Uint8, LifeConstants.hash63, "Life.indexLookup63");
		this.indexLookup632 = this.allocator.allocate(Uint8, LifeConstants.hash63, "Life.indexLookup632");

		// colour lookup for next generation
		this.colourLookup = this.allocator.allocate(Uint8, (this.aliveMax + 1) * 2, "Life.colourLookup");

		// fast lookup for colour reset
		this.colourReset = this.allocator.allocate(Uint8, 65536 * 16, "Life.colourReset");

		// grid line colour in raw format R G B
		this.gridLineRawDefault = (80 << 16) | (80 << 8) | 80;
		this.gridLineRaw = this.gridLineRawDefault;

		// grid line colour
		this.gridLineColour = -1;

		// grid line bold colour in raw format R G B
		this.gridLineBoldRawDefault = (112 << 16) | (112 << 8) | 112;
		this.gridLineBoldRaw = this.gridLineBoldRawDefault;

		// grid line bold colour
		this.gridLineBoldColour = -1;

		// grid line light background default
		this.gridLineLightBoldRawDefault = (209 << 16) | (209 << 8) | 209;
		this.gridLineLightRawDefault = (229 << 16) | (229 << 8) | 229;

		// grid line major interval and enablement
		this.gridLineMajor = 10;
		this.gridLineMajorEnabled = true;

		// column occupancy array for grid bounding box calculation
		this.columnOccupied16 = this.allocator.allocate(Uint16, ((this.width - 1) >> 4) + 1, "Life.columnOccupied16");

		// maximum grid size
		this.maxGridSize = 8192;

		// graph default colours
		this.graphBgDefColor = [0, 0, 48];
		this.graphAxisDefColor = [255, 255, 255];
		this.graphAliveDefColor = [255, 255, 255];
		this.graphBirthDefColor = [0, 255, 0];
		this.graphDeathDefColor = [255, 0, 0];

		// graph current colours
		this.graphBgColor = [0, 0, 48];
		this.graphAxisColor = [255, 255, 255];
		this.graphAliveColor = [255, 255, 255];
		this.graphBirthColor = [0, 255, 0];
		this.graphDeathColor = [255, 0, 0];

		// LTL engine
		this.LTL = new LTL(this.allocator, this.width, this.height);
	}

	// get state
	Life.prototype.getState = function(x, y, rawRequested) {
		// result
		var result = 0,
		    col = 0,
		    over = 0,

		    // get states 3, 4, 5 and 6
		    state3 = ViewConstants.stateMap[3] + 128,
		    state4 = ViewConstants.stateMap[4] + 128,
		    state5 = ViewConstants.stateMap[5] + 128,
		    state6 = ViewConstants.stateMap[6] + 128;

		// check if coordinates are on the grid
		if ((x === (x & this.widthMask)) && (y === (y & this.heightMask))) {
			// get the colour grid result
			col = this.colourGrid[y][x];

			// check if raw data requested or Generations or LTL rule used
			if (rawRequested || this.multiNumStates !== -1) {
				if (this.multiNumStates !== -1 && col > 0) {
					result = this.multiNumStates - col;
				}
				else {
					result = col;
				}
			}
			else {
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
						result = ViewConstants.stateMap[over - 128];
					}
					else {
						// states 3 and 5
						if (over === state3 || over === state5) {
							// if dead cell then use state 4
							if (col < this.aliveStart) {
								over = state4;
							}
							result = ViewConstants.stateMap[over - 128];
						}
						else {
							if (col === this.unoccupied) {
								result = 0;
							}
							else {
								if (col <= this.deadStart) {
									result = 2;
								}
								else {
									result = 1;
								}
							}
						}
					}

				}
				else {
					// no overlay grid
					if (col <= this.deadStart) {
						result = 0;
					}
					else {
						result = 1;
					}
				}
			}
		}

		// return the result
		return result;
	};

	// count tiles in a grid
	Life.prototype.tileCount = function(tile) {
		var tileRow = null,
		    y = 0,
		    x = 0,
		    tileGroup = 0,
		    l = tile.length,
		    w = tile[0].length,
		    bitCounts16 = this.bitCounts16,

		    // zero count
		    result = 0;

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
		    snapshot = this.snapshotManager.snapshotBefore(targetGen),
		    result = true;

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
				this.nextGeneration(false, true, graphDisabled);
				this.convertToPensTile();
			}

			// compute the final generation with stats on if required
			if (this.counter < targetGen) {
				this.nextGeneration(statsOn, true, graphDisabled);
			}

			result = this.convertToPensTile();
		}

		// return whether any cells are alive
		return result;
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
		}
		else {
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

		// restore the population
		this.population = snapshot.population;
		this.births = snapshot.births;
		this.deaths = snapshot.deaths;

		// restore the alive flags
		this.anythingAlive = snapshot.anythingAlive;
		this.generationsAlive = snapshot.generationsAlive;
	};

	// save snapshot
	Life.prototype.saveSnapshot = function() {
		var grid = null,
		    tileGrid = null;

		// check which buffer to copy
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid;
			tileGrid = this.nextTileGrid;
		}
		else {
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
		this.snapshotManager.saveSnapshot(grid, tileGrid, this.colourGrid, this.colourTileHistoryGrid, this.zoomBox, this.population, this.births, this.deaths, this.counter, ((this.tileCols - 1) >> 4) + 1, this.tileRows, this, isReset, this.anythingAlive, this.generationsAlive);
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

			// grow LTL buffers if used
			if (this.isLTL) {
				this.LTL.resize(this.width, this.height);
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

		// create the 16 colours for each of the 16 bit entries
		for (h = 0; h < 65536; h += 1) {
			for (b = 0; b < 16; b += 1) {
				colourReset[(h << 4) + b] = (h & (1 << (15 - b))) ? aliveStart : 0;
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
			
		// check for LTL
		if (this.isLTL) {
			// compute popuation from colour grid
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
		}
		else {
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
		}
		else {
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
				rowOffset = gridRow[x] << 4;
				colourRow[cr] = colourReset[rowOffset + 0];
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
				colourRow[cr] = colourReset[rowOffset + 8];
				cr += 1;
				colourRow[cr] = colourReset[rowOffset + 9];
				cr += 1;
				colourRow[cr] = colourReset[rowOffset + 10];
				cr += 1;
				colourRow[cr] = colourReset[rowOffset + 11];
				cr += 1;
				colourRow[cr] = colourReset[rowOffset + 12];
				cr += 1;
				colourRow[cr] = colourReset[rowOffset + 13];
				cr += 1;
				colourRow[cr] = colourReset[rowOffset + 14];
				cr += 1;
				colourRow[cr] = colourReset[rowOffset + 15];
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
		}
		else {
			pixelColour = 0x000000ff;
		}

		// disable overlay
		this.drawOverlay = false;

		// create the grid width and height masks
		this.widthMask = this.width - 1;
		this.heightMask = this.height - 1;

		// initialise the bounding boxes
		this.zoomBox = new BoundingBox(0, 0, this.width - 1, this.height - 1);

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

		// monochrome
		this.themes[i] = new Theme(new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new Colour(0, 0, 0));
		i += 1;

		// black to dark blue, cyan to white
		this.themes[i] = new Theme(new ColourRange(new Colour(0, 0, 47), new Colour(0, 0, 255)), new ColourRange(new Colour(0, 255, 255), new Colour(255, 255, 255)), new Colour(0, 0, 0));
		i += 1;

		// black to red, orange to yellow
		this.themes[i] = new Theme(new ColourRange(new Colour(32, 0, 0), new Colour(160, 0, 0)), new ColourRange(new Colour(255, 144, 0), new Colour(255, 255, 0)), new Colour(0, 0, 0));
		i += 1;

		// black to green, cyan to white
		this.themes[i] = new Theme(new ColourRange(new Colour(0, 24, 0), new Colour(0, 128, 0)), new ColourRange(new Colour(0, 255, 255), new Colour(255, 255, 255)), new Colour(0, 0, 0));
		i += 1;

		// black to purple, yellow to white
		this.themes[i] = new Theme(new ColourRange(new Colour(0, 47, 0), new Colour(128, 0, 128)), new ColourRange(new Colour(255, 255, 0), new Colour(255, 255, 255)), new Colour(0, 32, 128));
		i += 1;

		// grey scale
		this.themes[i] = new Theme(new ColourRange(new Colour(16, 16, 16), new Colour(104, 104, 104)), new ColourRange(new Colour(176, 176, 176), new Colour(255, 255, 255)), new Colour(0, 0, 0));
		i += 1;

		// inverse monochrome
		this.themes[i] = new Theme(new ColourRange(new Colour(255, 255, 255), new Colour(255, 255, 255)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(255, 255, 255));
		i += 1;

		// white to cyan, blue to black
		this.themes[i] = new Theme(new ColourRange(new Colour(240, 240, 240), new Colour(0, 255, 255)), new ColourRange(new Colour(0, 0, 255), new Colour(0, 0, 0)), new Colour(255, 255, 255));
		i += 1;

		// occupied vs unoccupied
		this.themes[i] = new Theme(new ColourRange(new Colour(240, 240, 240), new Colour(240, 240, 240)), new ColourRange(new Colour(240, 240, 240), new Colour(240, 240, 240)), new Colour(0, 0, 0));
		i += 1;

		// unoccupied, dead and alive only
		this.themes[i] = new Theme(new ColourRange(new Colour(160, 0, 0), new Colour(160, 0, 0)), new ColourRange(new Colour(240, 240, 240), new Colour(240, 240, 240)), new Colour(0, 0, 0));
		i += 1;

		// LifeHistory
		this.themes[i] = new Theme(new ColourRange(new Colour(0, 0, 96), new Colour(0, 0, 160)), new ColourRange(new Colour(0, 240, 0), new Colour(16, 255, 16)), new Colour(0, 0, 0));
		i += 1;

		// Generations - yellow to red
		this.themes[i] = new Theme(new ColourRange(new Colour(255, 255, 0), new Colour(255, 255, 0)), new ColourRange(new Colour(255, 0, 0), new Colour(255, 0, 0)), new Colour(0, 0, 0));
		i += 1;

		// LTL - red to yellow
		this.themes[i] = new Theme(new ColourRange(new Colour(255, 0, 0), new Colour(255, 0, 0)), new ColourRange(new Colour(255, 255, 0), new Colour(255, 255, 0)), new Colour(0, 0, 0));
		i += 1;

		// custom theme
		this.themes[i] = new Theme(new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0)), new Colour(0, 0, 0));
		i += 1;

		// set current colour theme
		this.aliveColCurrent = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.deadColCurrent = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.unoccupiedCurrent = new Colour(0, 0, 0);

		// set target colour theme
		this.aliveColTarget = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.deadColTarget = new ColourRange(new Colour(0, 0, 0), new Colour(0, 0, 0));
		this.unoccupiedTarget = new Colour(0, 0, 0);
	};

	// set the theme
	Life.prototype.setTheme = function(theme, switchTime) {
		var newTheme = this.themes[theme];

		// save the theme
		this.colourTheme = theme;

		// set current point to the target
		this.aliveColCurrent.set(this.aliveColTarget);
		this.deadColCurrent.set(this.deadColTarget);
		this.unoccupiedCurrent.set(this.unoccupiedTarget);

		// set the colour target to the theme
		this.aliveColTarget.set(newTheme.aliveRange);
		this.deadColTarget.set(newTheme.deadRange);
		this.unoccupiedTarget.set(newTheme.unoccupied);

		// set the change time
		this.colourChange = switchTime;
		
		// check whether new theme has history
		this.themeHistory = newTheme.hasHistory();

		// check if custom grid colours are used
		if (this.gridLineRaw === this.gridLineRawDefault || this.gridLineRaw === this.gridLineLightRawDefault) {
			// pick light or dark grid lines based on theme background
			if (((this.unoccupiedTarget.red + this.unoccupiedTarget.green + this.unoccupiedTarget.blue) / 3) >= 128) {
				this.gridLineRaw = this.gridLineLightRawDefault;
				this.gridLineBoldRaw = this.gridLineLightBoldRawDefault;
			}
			else {
				this.gridLineRaw = this.gridLineRawDefault;
				this.gridLineBoldRaw = this.gridLineBoldRawDefault;
			}
		}
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
	};

	// create the colours
	Life.prototype.createColours = function() {
		var i, mixWeight, weight, currentComponent, targetComponent, current;

		// set the weighting between the two colour ranges
		mixWeight = (this.colourChange - 1) / this.colourChangeSteps;
	
		// set unoccupied colour
		i = 0;
		this.redChannel[i] = this.unoccupiedCurrent.red * mixWeight + this.unoccupiedTarget.red * (1 - mixWeight);
		this.greenChannel[i] = this.unoccupiedCurrent.green * mixWeight + this.unoccupiedTarget.green * (1 - mixWeight);
		this.blueChannel[i] = this.unoccupiedCurrent.blue * mixWeight + this.unoccupiedTarget.blue * (1 - mixWeight);

		// check for Generations or LTL rules
		if (this.multiNumStates !== -1) {
			// set generations ramp
			for (i = 1; i < this.multiNumStates; i += 1) {
				// compute the weighting between the start and end colours in the range
				if (this.multiNumStates === 2) {
					weight = 1;
				}
				else {
					weight = 1 - ((i - 1) / (this.multiNumStates - 2));
				}

				// compute the red component of the current and target colour
				currentComponent = this.aliveColCurrent.startColour.red * weight + this.deadColCurrent.startColour.red * (1 - weight);
				targetComponent = this.aliveColTarget.startColour.red * weight + this.deadColTarget.startColour.red * (1 - weight);
				this.redChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

				// compoute the green component of the current and target colour
				currentComponent = this.aliveColCurrent.startColour.green * weight + this.deadColCurrent.startColour.green * (1 - weight);
				targetComponent = this.aliveColTarget.startColour.green * weight + this.deadColTarget.startColour.green * (1 - weight);
				this.greenChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

				// compoute the blue component of the current and target colour
				currentComponent = this.aliveColCurrent.startColour.blue * weight + this.deadColCurrent.startColour.blue * (1 - weight);
				targetComponent = this.aliveColTarget.startColour.blue * weight + this.deadColTarget.startColour.blue * (1 - weight);
				this.blueChannel[i] = currentComponent * mixWeight + targetComponent * (1 - mixWeight);

				// override with custom colour if specified
				if (this.customColours.length >= i) {
					current = this.customColours[i];
					if (current !== -1) {
						this.redChannel[i] = current >> 16;
						this.greenChannel[i] = (current >> 8) & 255; 
						this.blueChannel[i] = (current & 255);
					}
				}
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
		}
		else {
			// set dead colours
			for (i = this.deadMin; i <= this.deadStart; i += 1) {
				// compute the weighting between the start and end colours in the range
				weight = 1 - ((i - this.deadMin) / (this.deadStart - this.deadMin));

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
			}
			else {
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
		i = 0, j = 0;

		// check for Generations or LTL
		if (this.multiNumStates !== -1) {
			if (this.littleEndian) {
				for (i = 0; i < this.multiNumStates; i += 1) {
					if (i > 0) {
						j = this.multiNumStates - i;
					}
					pixelColours[i] = (255 << 24) | (blueChannel[j] << 16) | (greenChannel[j] << 8) | redChannel[j];
				}
			}
			else {
				for (i = 0; i < this.multiNumStates; i += 1) {
					if (i > 0) {
						j = this.multiNumStates - i;
					}
					pixelColours[i] = (redChannel[j] << 24) | (greenChannel[j] << 16) | (blueChannel[j] << 8) | 255;
				}
			}
		}
		else {
			// create pixels from rgb and brightness
			if (this.littleEndian) {
				// create dead colours
				for (i = 0; i < this.aliveStart; i += 1) {
					pixelColours[i] = (255 << 24) | (blueChannel[i] << 16) | (greenChannel[i] << 8) | redChannel[i];
				}

				// create alive colours
				for (i = this.aliveStart; i <= this.aliveMax; i += 1) {
					pixelColours[i] = (255 << 24) | ((blueChannel[i] * brightness) << 16) | ((greenChannel[i] * brightness) << 8) | (redChannel[i] * brightness);
				}

				// create remaining multi-state colours
				for (i = this.aliveMax + 1; i < 256; i += 1) {
					pixelColours[i] = (255 << 24) | ((blueChannel[i] * brightness) << 16) | ((greenChannel[i] * brightness) << 8) | (redChannel[i] * brightness);
				}
			}
			else {
				// create dead colours
				for (i = 0; i < this.aliveStart; i += 1) {
					pixelColours[i] = (redChannel[i] << 24) | (greenChannel[i] << 16) | (blueChannel[i] << 8) | 255;
				}

				// create alive colours
				for (i = this.aliveStart; i <= this.aliveMax; i += 1) {
					pixelColours[i] = ((redChannel[i] * brightness) << 24) | ((greenChannel[i] * brightness) << 16) | ((blueChannel[i] * brightness) << 8) | 255;
				}

				// create remaining multi-state colours
				for (i = this.aliveMax + 1; i < 256; i += 1) {
					pixelColours[i] = ((redChannel[i] * brightness) << 24) | ((greenChannel[i] * brightness) << 16) | ((blueChannel[i] * brightness) << 8) | 255;
				}
			}
		}

		// create grid line colours
		if (this.littleEndian) {
			this.gridLineColour = (255 << 24) | ((gridLineRaw & 255) << 16) | (((gridLineRaw >> 8) & 255) << 8) | (gridLineRaw >> 16);
			this.gridLineBoldColour = (255 << 24) | ((gridLineBoldRaw & 255) << 16) | (((gridLineBoldRaw >> 8) & 255) << 8) | (gridLineBoldRaw >> 16);
		}
		else {
			this.gridLineColour = ((gridLineRaw & 255) << 24) | (((gridLineRaw >> 8) & 255) << 16) | ((gridLineRaw >> 16) << 8) | 255;
			this.gridLineBoldColour = ((gridLineBoldRaw & 255) << 24) | (((gridLineBoldRaw >> 8) & 255) << 16) | ((gridLineBoldRaw >> 16) << 8) | 255;
		}

		// create bounded grid border colour if specified
		if (this.boundedGridType !== -1) {
			if (this.littleEndian) {
				pixelColours[LifeConstants.boundedBorderColour] = 0xff808080;
			}
			else {
				pixelColours[LifeConstants.boundedBorderColour] = 0x808080ff;
			}
		}
	};

	// clear the life grids
	Life.prototype.clearGrids = function() {
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
			colourGrid[h].set(blankColourRow);
			smallColourGrid2[h].set(blankColourRow);
			if (overlayGrid) {
				overlayGrid[h].set(blankColourRow);
				smallOverlayGrid[h].set(blankColourRow);
			}
		}

		// clear tile map
		height = this.tileRows;

		// clear the tiles
		for (h = 0; h < height; h += 1) {
			tileGrid[h].set(blankTileRow);
			nextTileGrid[h].set(blankTileRow);
			colourTileGrid[h].set(blankTileRow);
			colourTileHistoryGrid[h].set(blankTileRow);
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
		    ruleArray = PatternManager.ruleArray,
		    hash33 = LifeConstants.hash33,
		    odd = false;

		// check for Wolfram
		if (this.wolframRule === -1) {
			// check for B0
			if (ruleArray[0]) {
				// check for Smax
				if (ruleArray[hash33 - 1]) {
					// B0 with Smax: rule -> NOT(reverse(bits))
					for (i = 0; i < hash33 / 2; i += 1) {
						tmp = ruleArray[i];
						ruleArray[i] = 1 - ruleArray[hash33 - i - 1];
						ruleArray[hash33 - i - 1] = 1 - tmp;
					}
				}
				else {
					// B0 without Smax needs two rules
					// odd rule -> reverse(bits)
					for (i = 0; i < hash33 / 2; i += 1) {
						tmp = ruleArray[i];
						ruleArray[i] = ruleArray[hash33 - i - 1];
						ruleArray[hash33 - i - 1] = tmp;
					}
					odd = true;
					this.createLifeIndex63(this.indexLookup632, ruleArray);

					// even rule -> NOT(bits)
					for (i = 0; i < hash33 / 2; i += 1) {
						tmp = ruleArray[i];
						// need to reverse then invert due to even rule above
						ruleArray[i] = 1 - ruleArray[hash33 - i - 1];
						ruleArray[hash33 - i - 1] = 1 - tmp;
					}
				}
			}
		}

		// copy rules from pattern
		this.createLifeIndex63(this.indexLookup63, PatternManager.ruleArray);
		if (!odd) {
			// duplicate even rule
			this.indexLookup632.set(this.indexLookup63);
		}
	};

	// get the offset from the left most bit
	Life.prototype.leftBitOffset = function(value) {
		var result = 0;

		// find the left most bit number
		if ((value & 128) !== 0) {
			result = 0;
		}
		else {
			if ((value & 64) !== 0) {
				result = 1;
			}
			else {
				if ((value & 32) !== 0) {
					result = 2;
				}
				else {
					if ((value & 16) !== 0) {
						result = 3;
					}
					else {
						if ((value & 8) !== 0) {
							result = 4;
						}
						else {
							if ((value & 4) !== 0) {
								result = 5;
							}
							else {
								if ((value & 2) !== 0) { 
									result = 6;
								}
								else {
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
		}
		else {
			if ((value & 2) !== 0) {
				result = 6;
			}
			else {
				if ((value & 4) !== 0) {
					result = 5;
				}
				else {
					if ((value & 8) !== 0) {
						result = 4;
					}
					else {
						if ((value & 16) !== 0) {
							result = 3;
						}
						else {
							if ((value & 32) !== 0) {
								result = 2;
							}
							else {
								if ((value & 64) !== 0) {
									result = 1;
								}
								else {
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
		}
		else {
			if ((value & 16384) !== 0) {
				result = 1;
			}
			else {
				if ((value & 8192) !== 0) {
					result = 2;
				}
				else {
					if ((value & 4096) !== 0) {
						result = 3;
					}
					else {
						if ((value & 2048) !== 0) {
							result = 4;
						}
						else {
							if ((value & 1024) !== 0) {
								result = 5;
							}
							else {
								if ((value & 512) !== 0) {
									result = 6;
								}
								else {
									if ((value & 256) !== 0) {
										result = 7;
									}
									else {
										if ((value & 128) !== 0) {
											result = 8;
										}
										else {
											if ((value & 64) !== 0) {
												result = 9;
											}
											else {
												if ((value & 32) !== 0) {
													result = 10;
												}
												else {
													if ((value & 16) !== 0) {
														result = 11;
													}
													else {
														if ((value & 8) !== 0) {
															result = 12;
														}
														else {
															if ((value & 4) !== 0) {
																result = 13;
															}
															else {
																if ((value & 2) !== 0) {
																	result = 14;
																}
																else {
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
		}
		else {
			if ((value & 2) !== 0) {
				result = 14;
			}
			else {
				if ((value & 4) !== 0) {
					result = 13;
				}
				else {
					if ((value & 8) !== 0) {
						result = 12;
					}
					else {
						if ((value & 16) !== 0) {
							result = 11;
						}
						else {
							if ((value & 32) !== 0) {
								result = 10;
							}
							else {
								if ((value & 64) !== 0) {
									result = 9;
								}
								else {
									if ((value & 128) !== 0) {
										result = 8;
									}
									else {
										if ((value & 256) !== 0) {
											result = 7;
										}
										else {
											if ((value & 512) !== 0) {
												result = 6;
											}
											else {
												if ((value & 1024) !== 0) {
													result = 5;
												}
												else {
													if ((value & 2048) !== 0) {
														result = 4;
													}
													else {
														if ((value & 4096) !== 0) {
															result = 3;
														}
														else {
															if ((value & 8192) !== 0) {
																result = 2;
															}
															else {
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
			}
			else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			}
			else {
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
										}
										else {
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
										}
										else {
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
										}
										else {
											if (tw > 0) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										}
										else {
											if (tw < tileCols16 - 1) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										}
										else {
											if (tw > 0) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										}
										else {
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
				}
				else {
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
			}
			else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			}
			else {
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
										}
										else {
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
										}
										else {
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
										}
										else {
											if (tw > 0) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										}
										else {
											if (tw < tileCols16 - 1) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										}
										else {
											if (tw > 0) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										}
										else {
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
				}
				else {
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

		// check for Generations or LTL
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
		}
		else {
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
		}
		else {
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
		}
		else {
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
		}
		else {
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
			}
			else {
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

		// check for Generations or LTL
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
			}
			else {
				// check for infinite height
				if (this.boundedGridHeight === 0) {
					// just clear left and right
					for (y = 0; y < this.height; y += 1) {
						grid[y][leftX] = 0;
						grid[y][rightX] = 0;
					}
				}
				else {
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
		}
		else {
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
			}
			else {
				grid[bottomY - 1][(rightX + 1) >> 4] &= ~(1 << (~(rightX + 1) & 15));
			}

			// bottom left corner
			sourceX = leftX + ((width - 1 - horizShift + width) % width);
			sourceY = bottomY + ((height - 1 - vertShift + height) % height);
			if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				grid[bottomY - 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
			}
			else {
				grid[bottomY - 1][(leftX - 1) >> 4] &= ~(1 << (~(leftX - 1) & 15));
			}

			// top right corner
			sourceX = leftX + ((horizShift + width) % width);
			sourceY = bottomY + ((vertShift + height) % height);
			if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				grid[topY + 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
			}
			else {
				grid[topY + 1][(rightX + 1) >> 4] &= ~(1 << (~(rightX + 1) & 15));
			}

			// top left corner
			sourceX = leftX + ((width - 1 + horizShift + width) % width);
			sourceY = bottomY + ((-vertShift + height) % height);
			if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
				grid[topY + 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
			}
			else {
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
		}
		else {
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
			}
			else {
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
			}
			else {
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
			}
			else {
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
			}
			else {
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
		}
		else {
			sourceX = leftX + ((-horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((height - 1 + vertShift + height) % height);
		}
		else {
			sourceY = bottomY + ((height - 1 + vertShift + height) % height);
		}
		if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
			grid[bottomY - 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
		}

		// bottom left corner
		if (horizTwist) {
			sourceX = rightX - ((width - 1 - horizShift + width) % width);
		}
		else {
			sourceX = leftX + ((width - 1 - horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((height - 1 + vertShift + height) % height);
		}
		else {
			sourceY = bottomY + ((height - 1 + vertShift + height) % height);
		}
		if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
			grid[bottomY - 1][(leftX - 1) >> 4] |= (1 << (~(leftX - 1) & 15));
		}

		// top right corner
		if (horizTwist) {
			sourceX = rightX - ((horizShift + width) % width);
		}
		else {
			sourceX = leftX + ((horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((vertShift + height) % height);
		}
		else {
			sourceY = bottomY + ((vertShift + height) % height);
		}
		if ((grid[sourceY][sourceX >> 4] & (1 << (~sourceX & 15))) !== 0) {
			grid[topY + 1][(rightX + 1) >> 4] |= (1 << (~(rightX + 1) & 15));
		}

		// top left corner
		if (horizTwist) {
			sourceX = rightX - ((width - 1 + horizShift + width) % width);
		}
		else {
			sourceX = leftX + ((width - 1 + horizShift + width) % width);
		}
		if (vertTwist) {
			sourceY = topY - ((vertShift + height) % height);
		}
		else {
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
		}
		else {
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
		}
		else {
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

		// perform bounded grid pre-processing
		if (this.boundedGridType !== -1 && !this.isLTL) {
			this.preProcessBoundedGrid();
		}

		// check if state 6 is on
		if (this.state6Mask) {
			// pre-process for state 6
			this.state6Pre();
		}

		// check if any bitmap cells are alive
		if (this.anythingAlive) {
			if (this.isLTL) {
				// compute LTL next generation
				this.nextGenerationLTL();
			}
			else {
				// check if stats are required
				if (statsOn) {
					this.nextGenerationTile();
				}
				else {
					this.nextGenerationOnlyTile();
				}
			}
		}

		// increment generation count
		this.counter += 1;

		// check for Generations
		if (this.multiNumStates !== -1 && !this.isLTL) {
			// now deal with decay states
			if (this.anythingAlive) {
				this.nextGenerationGenerations();
			}
			else {
				this.nextGenerationGenerationsDecayOnly();
			}
		}

		// check if state 6 is on
		if (this.state6Mask) {
			// post-process for state 6
			this.state6Post();
		}

		// perform bounded grid post-processing
		if (this.boundedGridType !== -1 && !this.isLTL) {
			this.postProcessBoundedGrid();
		}

		// clear boundary if maximum grid size
		if (this.width === this.maxGridSize) {
			// check for LtL
			if (this.isLTL) {
				boundarySize = this.LTL.range * 2;
			} else {
				boundarySize = 16;
			}
			// check if the pattern is near a boundary
			if (zoomBox.leftX <= boundarySize || zoomBox.rightX >= (this.maxGridSize - boundarySize) || zoomBox.bottomY <= boundarySize || zoomBox.topY >= (this.maxGridSize - boundarySize)) {
				// clear grid boundary
				if (this.isLTL) {
					this.clearLTLBoundary();
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
				this.popGraphData[this.counter] = this.population;
				this.birthGraphData[this.counter] = this.births;
				this.deathGraphData[this.counter] = this.deaths;
				if (this.population > this.maxPopValue) {
					this.maxPopValue = this.population;
				}
				if (this.births > this.maxPopValue) {
					this.maxPopValue = this.births;
				}
				if (this.deaths > this.maxPopValue) {
					this.maxPopValue = this.deaths;
				}
			}
			else {
				this.popGraphData[this.counter] = 0;
				this.birthGraphData[this.counter] = 0;
				this.deathGraphData[this.counter] = 0;
			}
		}
	};

	// draw graph
	Life.prototype.renderGraph = function(ctx, graphCol, displayX, graphHeight, borderX, borderY, borderAxis, graphData, lines) {
		var i = 0, x = 0, y = 0,
		    index = 0, next = 0, inc = 1,
		    minVal = 0, maxVal, nextVal = 0;

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
		}
		else {
			ctx.fillStyle = graphCol;
		}

		// draw graph
		next = 0;
		index = 1;
		for (i = 1; i < displayX; i += 1) {
			// get the next graph data point
			if (index < LifeConstants.maxPopSamples) {
				minVal = graphData[index];
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
			}
			else {
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

				}
				else {
					// drawing points
					if (minVal > 0 && maxVal > 0) {
						// single value so draw point
						if (minVal === maxVal) {
							ctx.fillRect(x + 0.5, y + borderY + borderAxis + 0.5, 1, 1);
						}
						else {
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
				}
				else {
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
	};

	// reset population data
	Life.prototype.resetPopulationData = function() {
		var i = 0;

		// clear population graph data
		for (i = 0; i < LifeConstants.maxPopSamples; i += 1) {
			this.popGraphData[i] = 0;
			this.birthGraphData[i] = 0;
			this.deathGraphData[i] = 0;
		}

		// set initial population
		this.popGraphData[0] = this.population;

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
		}
		else {
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
				}
				else {
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
		}
		else {
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
				}
				else {
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
		}
		else {
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

	// remove LTL patterns that touch the boundary
	Life.prototype.clearLTLBoundary = function() {
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
			range = this.LTL.range * 2 + 1,

			// counters
			x = 0,
			y = 0;

		// clear top boundary
		if ((ht - topY) <= range) {
			for (y = ht - range; y <= topY; y += 1) {
				colourRow = colourGrid[y];
				for (x = leftX; x <= rightX; x += 1) {
					if (colourRow[x] > 0) {
						colourRow[x] = 0;
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
					if (colourRow[x] > 0) {
						colourRow[x] = 0;
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
					if (colourRow[x] > 0) {
						colourRow[x] = 0;
					}
				}
			}
			zoomBox.leftX = range;
		}

		// clear right boundary
		if ((wd - rightX) <= range) {
			for (y = bottomY; y <= topY; y += 1) {
				colourRow = colourGrid[y];
				for (x = leftX; x <= range; x += 1) {
					if (colourRow[x] > 0) {
						colourRow[x] = 0;
					}
				}
			}
			zoomBox.rightX = range;
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
		}
		else {
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
			}
			else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			}
			else {
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
							}
							else {
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
								}
								else {
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
							}
							else {
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
									}
									else {
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
								}
								else {
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
									}
									else {
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
										}
										else {
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
										}
										else {
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
										}
										else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										}
										else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										}
										else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										}
										else {
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
				}
				else {
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

	// wrap the grid for LTL torus
	Life.prototype.wrapTorusLTL = function(lx, by, rx, ty) {
		var colourGrid = this.colourGrid,
			sourceRow = null,
			destRow = null,
			ltl = this.LTL,
			range = ltl.range,
			x = 0,
			y = 0;

		// copy the bottom rows to the top border
		for (y = 0; y < range; y += 1) {
			sourceRow = colourGrid[by + y];
			destRow = colourGrid[ty + y + 1];
			for (x = lx; x <= rx; x += 1) {
				destRow[x] = sourceRow[x];
			}
		}

		// copy the top rows to the bottom border
		for (y = 0; y < range; y += 1) {
			sourceRow = colourGrid[ty - y];
			destRow = colourGrid[by - y - 1];
			for (x = lx; x <= rx; x += 1) {
				destRow[x] = sourceRow[x];
			}
		}

		// copy the left columns to the right border
		// and the right columns to the left border
		for (y = by; y <= ty; y += 1) {
			sourceRow = colourGrid[y];
			for (x = 0; x < range; x += 1) {
				sourceRow[rx + x + 1] = sourceRow[lx + x];
				sourceRow[lx - x - 1] = sourceRow[rx - x];
			}
		}

		// copy bottom left cells to top right border
		// and bottom right cells to top left border
		for (y = 0; y < range; y += 1) {
			sourceRow = colourGrid[by + y];
			destRow = colourGrid[ty + y + 1];
			for (x = 0; x < range; x += 1) {
				destRow[x + rx + 1] = sourceRow[x + lx];
				destRow[lx - x - 1] = sourceRow[rx - x];
			}
		}

		// copy top left cells to bottom right border
		// and top right cells to bottom left border
		for (y = 0; y < range; y += 1) {
			sourceRow = colourGrid[ty - y];
			destRow = colourGrid[by - y - 1];
			for (x = 0; x < range; x += 1) {
				destRow[x + rx + 1] = sourceRow[x + lx];
				destRow[lx - x - 1] = sourceRow[rx - x];
			}
		}
	};

	// clear the outside the bounded grid
	Life.prototype.clearLTLOutside = function(lx, by, rx, ty) {
		var colourGrid = this.colourGrid,
			destRow = null,
			ltl = this.LTL,
			range = ltl.range,
			x = 0,
			y = 0;

		// clear the top border
		for (y = 0; y < range; y += 1) {
			destRow = colourGrid[ty + y + 1];
			for (x = lx; x <= rx; x += 1) {
				destRow[x] = 0;
			}
		}

		// copy the bottom border
		for (y = 0; y < range; y += 1) {
			destRow = colourGrid[by - y - 1];
			for (x = lx; x <= rx; x += 1) {
				destRow[x] = 0;
			}
		}

		// clear the left and right columns
		for (y = by; y <= ty; y += 1) {
			destRow = colourGrid[y];
			for (x = 0; x < range; x += 1) {
				destRow[rx + x + 1] = 0;
				destRow[lx - x - 1] = 0;
			}
		}

		// clear top right border
		// and top left border
		for (y = 0; y < range; y += 1) {
			destRow = colourGrid[ty + y + 1];
			for (x = 0; x < range; x += 1) {
				destRow[x + rx + 1] = 0;
				destRow[lx - x - 1] = 0;
			}
		}

		// clear bottom right border
		// and bottom left border
		for (y = 0; y < range; y += 1) {
			destRow = colourGrid[by - y - 1];
			for (x = 0; x < range; x += 1) {
				destRow[x + rx + 1] = 0;
				destRow[lx - x - 1] = 0;
			}
		}
	};

	// update the life grid region using LTL
	Life.prototype.nextGenerationLTL = function() {
		var x = 0,
			y = 0,
			i = 0,
			j = 0,
			zoomBox = this.zoomBox,
			leftX = zoomBox.leftX,
			rightX = zoomBox.rightX,
			bottomY = zoomBox.bottomY,
			topY = zoomBox.topY,
			ltl = this.LTL,
			range = ltl.range,
			minB = ltl.minB,
			maxB = ltl.maxB,
			minS = ltl.minS,
			maxS = ltl.maxS,
			scount = ltl.scount,
			counts = ltl.counts,
			colCounts = ltl.colCounts,
			colCount = 0,
			saveCol = 0,
			maxGeneration = scount - 1,
			count = 0,
			xcol = 0,
			colourGrid = this.colourGrid,
			colourTileHistoryGrid = this.colourTileHistoryGrid,
			population = 0,
			births = 0,
			deaths = 0,
			state = 0,
			colourRow = null,
			countRow = null,
			colourTileRow = null,
			minX = this.width,
			maxX = 0,
			minY = this.height,
			maxY = 0,
			widths = ltl.widths,
			width = 0,
			somethingAlive = false,
			rowAlive = false,
			bgWidth = this.boundedGridWidth,
			bgHeight = this.boundedGridHeight,
			gridLeftX, gridRightX, gridBottomY, gridTopY,
			maxj = range + range,
			ymr = 0,
			chunk = 5;  // don't change this without changing loop unroll below!

		// check for bounded grid
		if (this.boundedGridType !== -1) {
			// get grid extent
			gridLeftX = Math.round((this.width - bgWidth) / 2);
			gridBottomY = Math.round((this.height - bgHeight) / 2);
			gridRightX = gridLeftX + bgWidth - 1;
			gridTopY = gridBottomY + bgHeight - 1;

			// if B0 then process every cell
			if (minB === 0) {
				leftX = gridLeftX + range;
				rightX = gridRightX - range;
				topY = gridTopY - range;
				bottomY = gridBottomY + range;
			}

			// check if the bounded grid is a torus
			if (this.boundedGridType === 1) {
				// extend range if needed for wrap
				if (leftX - gridLeftX < range) {
					rightX = gridRightX;
				}
				if (gridRightX - rightX < range) {
					leftX = gridLeftX;
				}
				if (gridTopY - topY < range) {
					bottomY = gridBottomY;
				}
				if (bottomY - gridBottomY < range) {
					topY = gridTopY;
				}
				this.wrapTorusLTL(gridLeftX, gridBottomY, gridRightX, gridTopY);
			}

			// fit to bounded grid
			if (leftX - gridLeftX < range) {
				leftX = gridLeftX + range;
			}
			if (gridRightX - rightX < range) {
				rightX = gridRightX - range;
			}
			if (gridTopY - topY < range) {
				topY = gridTopY - range;
			}
			if (bottomY - gridBottomY < range) {
				bottomY = gridBottomY + range;
			}
		}

		// compute counts for given neighborhood
		if (ltl.type === PatternManager.mooreLTL) {
			// Moore - process each row
			for (y = bottomY - range; y <= topY + range; y += 1) {
				x = leftX - range;
				countRow = counts[y];
				ymr = y - range;
				
				// for the first cell compute the whole neighbourhood
				count = 0;
				if (maxGeneration === 1) {
					// 2 state version
					for (i = -range; i <= range; i += 1) {
						colCount = 0;
						xcol = x + i;
						j = 0;
						while (j + chunk <= maxj) {
							// loop unroll must match chunk size!
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
						}
						while (j <= maxj) {
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
						}
						colCounts[i + range] = colCount;
						count += colCount;
					}
				} else {
					// >2 state version
					for (i = -range; i <= range; i += 1) {
						colCount = 0;
						xcol = x + i;
						for (j = 0; j <= maxj; j += 1) {
							if (colourGrid[ymr + j][xcol] === maxGeneration) {
								colCount += 1;
							}
						}
						colCounts[i + range] = colCount;
						count += colCount;
					}
				}
				countRow[x] = count;

				// process remaining columns
				x += 1;
				saveCol = 0;

				while (x <= rightX + range) {
					// remove left column count from running total
					count -= colCounts[saveCol];

					// compute and save right hand column count
					colCount = 0;
					xcol = x + range;
					if (maxGeneration === 1) {
						// 2 state version
						j = 0;
						while (j + chunk <= maxj) {
							// loop unroll must match chunk size!
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
						}
						while (j <= maxj) {
							colCount += colourGrid[ymr + j][xcol];
							j += 1;
						}
					} else {
						// >2 state version
						for (j = 0; j <= maxj; j += 1) {
							if (colourGrid[ymr + j][xcol] === maxGeneration) {
								colCount += 1;
							}
						}
					}
					colCounts[saveCol] = colCount;

					// add right hand column count to running total
					count += colCount;
					countRow[x] = count;

					// rotate through column counts
					saveCol += 1;
					if (saveCol > range + range) {
						saveCol = 0;
					}

					// next column
					x += 1;
				}
			}
		} else {
			// von Neumann and Circular
			for (y = bottomY - range; y <= topY + range; y += 1) {
				countRow = counts[y];
				for (x = leftX - range; x <= rightX + range; x += 1) {
					count = 0;
					for (j = -range; j <= range; j += 1) {
						width = widths[j + range];
						colourRow = colourGrid[y + j];
						for (i = -width; i <= width; i += 1) {
							if ((colourRow[x + i]) === maxGeneration) {
								count += 1;
							}
						}
					}
					countRow[x] = count;
				}
			}
		}

		// adjust range if using bounded grid
		if (this.boundedGridType !== -1) {
			if (leftX < gridLeftX + range) {
				leftX = gridLeftX + range;
			}
			if (rightX > gridRightX - range) {
				rightX = gridRightX - range;
			}
			if (bottomY < gridBottomY + range) {
				bottomY = gridBottomY + range;
			}
			if (topY > gridTopY - range) {
				topY = gridTopY - range;
			}
		}

		// compute next generation
		population = 0;
		births = 0;
		deaths = 0;
		somethingAlive = false;
		if (maxGeneration === 1) {
			// 2 state version
			for (y = bottomY - range; y <= topY + range; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				for (x = leftX - range; x <= rightX + range; x += 1) {
					state = colourRow[x];
					count = countRow[x];
					countRow[x] = 0;
					if (state === 0) {
						// this cell is dead
						if (count >= minB && count <= maxB) {
							// new cell is born
							state = maxGeneration;
							births += 1;
						}
					} else if (state === maxGeneration) {
						// this cell is alive
						if (count < minS || count > maxS) {
							// this cell doesn't survive
							state = 0;
							deaths += 1;
						}
					}
					colourRow[x] = state;
					// update bounding box columns
					if (state > 0) {
						rowAlive = true;
						colourTileRow[x >> 8] = 65535;
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						population += 1;
					}
				}
				if (rowAlive) {
					// if something was alive in the row then update bounding box rows
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
				}
			}
			if (population > 0) {
				somethingAlive = true;
			}
		} else {
			// >2 state version
			for (y = bottomY - range; y <= topY + range; y += 1) {
				colourRow = colourGrid[y];
				countRow = counts[y];
				colourTileRow = colourTileHistoryGrid[y >> 4];
				rowAlive = false;
				for (x = leftX - range; x <= rightX + range; x += 1) {
					state = colourRow[x];
					count = countRow[x];
					countRow[x] = 0;
					if (state === 0) {
						// this cell is dead
						if (count >= minB && count <= maxB) {
							// new cell is born
							state = maxGeneration;
							births += 1;
						}
					} else if (state === maxGeneration) {
						// this cell is alive
						if (count < minS || count > maxS) {
							// cell decays by one state
							state -= 1;
							deaths += 1;
						}
					} else {
						// this cell will eventually die
						state -= 1;
					}
					colourRow[x] = state;
					// update bounding box columns
					if (state > 0) {
						rowAlive = true;
						colourTileRow[x >> 8] = 65535;
						if (x < minX) {
							minX = x;
						}
						if (x > maxX) {
							maxX = x;
						}
						if (state === maxGeneration) {
							population += 1;
						}
					}
				}
				if (rowAlive) {
					// if something was alive in the row then update bounding box rows
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
				}
				somethingAlive |= rowAlive;
			}
		}

		// check if there is a Torus bounded grid
		if (this.boundedGridType === 1) {
			// clear outside
			this.clearLTLOutside(gridLeftX, gridBottomY, gridRightX, gridTopY);
		}

		// save population and bounding box
		this.population = population;
		this.births = births;
		this.deaths = deaths;
		zoomBox.leftX = minX;
		zoomBox.rightX = maxX;
		zoomBox.bottomY = minY;
		zoomBox.topY = maxY;

		// stop if population zero
		if (!somethingAlive) {
			this.generationsAlive = 0;
			this.anythingAlive = 0;
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
		}
		else {
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
			}
			else {
				belowNextTileRow = blankTileRow;
			}

			// get the tile row above
			if (th < tileRows - 1) {
				aboveNextTileRow = nextTileGrid[th + 1];
			}
			else {
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
							}
							else {
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
								}
								else {
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
							}
							else {
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
									}
									else {
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
								}
								else {
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
									}
									else {
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
										}
										else {
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
										}
										else {
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
										}
										else {
											if ((tw > 0) && (leftX > 0)) {
												belowNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether bottom right occupied
									if ((neighbours & LifeConstants.bottomRightSet) !== 0) {
										if (b > 0) {
											belowNextTiles |= (1 << (b - 1));
										}
										else {
											if ((tw < tileCols16 - 1) && (leftX < width16 - 1)) {
												belowNextTileRow[tw + 1] |= (1 << 15);
											}
										}
									}

									// check whether top left occupied
									if ((neighbours & LifeConstants.topLeftSet) !== 0) {
										if (b < 15) {
											aboveNextTiles |= (1 << (b + 1));
										}
										else {
											if ((tw > 0) && (leftX > 0)) {
												aboveNextTileRow[tw - 1] |= 1;
											}
										}
									}

									// check whether top right occupied
									if ((neighbours & LifeConstants.topRightSet) !== 0) {
										if (b > 0) {
											aboveNextTiles |= (1 << (b - 1));
										}
										else {
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
				}
				else {
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
				}
				else {
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
				}
				else {
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
				}
				else {
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
				}
				else {
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

		    // maximum generations state
		    maxGenState = this.multiNumStates - 1,

		    // starting and ending tile row
		    tileStartRow = 0,
		    tileEndRow = tileRows;

		// clear anything alive
		this.anythingAlive = 0;
		this.generationsAlive = 0;

		// select the correct grid
		if ((this.counter & 1) !== 0) {
			grid = this.nextGrid16;
			tileGrid = this.nextTileGrid;
		}
		else {
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
								n = 1 << 15;

								// get next colour cell
								value = colourGridRow[cr];

								// process the Generations rule
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}

								// write the colour back
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;
								cr += 1;
								n >>= 1;

								// loop unroll
								value = colourGridRow[cr];
								if ((value === 0 || value === maxGenState) && ((nextCell & n) !== 0)) {
									value = maxGenState;
									tileAlive |= value;
								}
								else {
									nextCell &= ~n;
									if (value > 0) {
										value -= 1;
										tileAlive |= value;
									}
								}
								colourGridRow[cr] = value;

								// save the updated state 1 cells to the bitmap
								gridRow[leftX] = nextCell;
								this.anythingAlive |= nextCell;
							}

							// check if the row was alive
							if (tileAlive) {
								// update tile flag
								nextTiles |= (1 << b);

								// flag generations alive
								this.generationsAlive = tileAlive;
							}
						}

						// next tile columns
						leftX += xSize;
					}
				}
				else {
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

	// compute generations rule next generation (after state 0 and 1) for decay only
	Life.prototype.nextGenerationGenerationsDecayOnly = function() {
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
		    tileEndRow = tileRows;

		// clear anything alive
		this.generationsAlive = 0;

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
									if (value > 0) {
										value -= 1;
									}

									// write the colour back
									colourGridRow[cr] = value;
									cr += 1;

									// check if generations alive
									this.generationsAlive |= value;
								}
							}
						}

						// next tile columns
						leftX += xSize;
					}
				}
				else {
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
		var result = this.anythingAlive,

		    // current generation number
		    savedCounter = this.counter;

		// check for generations or LTL rule
		if (this.multiNumStates === -1) {
			// check if Life already stopped
			if (result === 0) {
				if (this.stoppedGeneration !== -1) {
					// switch to the generation when life stopped
					this.counter = this.stoppedGeneration;
				}
			}

			// use regular converter
			this.convertToPensTileRegular();

			// switch back to saved generation
			this.counter = savedCounter;

			// check if life stopped
			if (result !== 0 && this.anythingAlive === 0) {
				// life just stopped so save generation
				this.stoppedGeneration = this.counter;
			}

			// return whether anything alive
			result = this.anythingAlive;
		}
		else {
			// generations or LTL
			result = this.anythingAlive | this.generationsAlive;
		}

		// return whether cells alive
		return result;
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
		}
		else {
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
								}
								else {
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
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8192) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4096) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2048) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1024) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 512) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 256) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 128) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 64) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 32) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 16) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
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
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;
								if ((nextCell & 16384) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8192) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4096) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2048) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1024) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 512) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 256) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 128) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 64) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 32) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 16) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
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
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;
								if ((nextCell & 16384) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8192) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4096) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2048) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1024) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 512) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 256) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 128) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 64) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 32) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 16) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
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
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;
								if ((nextCell & 16384) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8192) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4096) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2048) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1024) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 512) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 256) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 128) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 64) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 32) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 16) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 8) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 4) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 2) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
									value = colourLookup[colourGridRow[cr]];
									tileAlive |= value > 1;
								}
								colourGridRow[cr] = value;
								cr += 1;

								if ((nextCell & 1) !== 0) {
									value = colourLookup[colourGridRow[cr] + aliveIndex];
								}
								else {
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
				}
				else {
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
		}
		else {
			result = zoomX;
		}

		// apply scale factor
		result = Math.round(result * 1000 / scaleFactor) / 1000;

		// ensure in range
		if (result < minZoom) {
			result = minZoom;
		}
		else {
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
		}
		else {
			percent = testZoom / intZoom;
		}
		
		// check if the percentage is within a threshold
		if (percent >= ViewConstants.integerZoomThreshold) {
			if (zoom < 1) {
				zoom = 1 / intZoom;
			}
			else {
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
		}
		else {
			// check for history mode
			if (historyFit) {
				// use history box
				zoomBox = historyBox;
			}
		}

		// read the bounding box
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
		}
		else {
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
		}
		else {
			zoom = zoomX;
		}

		// apply scale factor
		zoom = Math.round(zoom * 1000 / scaleFactor) / 1000;

		// add offset
		zoom /= this.originZ;

		// ensure in range
		if (zoom < minZoom) {
			zoom = minZoom;
		}
		else {
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
		    offset = y * w + startX,

		    // end pixel offset
		    end = y * w + endX,
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

		    // pixel offset in bitmap
		    offset = startY * w + x,

		    // end pixel offset
		    end = endY * w + x,
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
	Life.prototype.drawLine = function(startX, startY, endX, endY, colour) {
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
			}
			else {
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

		    // compute single cell offset
		    yOff = (((this.height / 2 - (this.yOff + this.originY)) * zoomStep) + (h / 2)) % zoomStep,
		    xOff = (((this.width / 2 - (this.xOff + this.originX)) * zoomStep) + (w / 2)) % zoomStep;

		// draw twice if major grid lines enabled
		if (this.gridLineMajor > 0 && this.gridLineMajorEnabled) {
			loop = 2;
		}
		else {
			loop = 1;
		}

		// start drawing the grid line colour
		targetCol = gridCol;

		while (loop) {
			// compute major grid line vertical offset
			gridLineNum = -(w / 2 / zoomStep) - (this.width / 2 - this.xOff - this.originX) | 0;

			// draw vertical lines
			for (x = 0; x <= w + zoomStep; x += zoomStep) {
				// check if major gridlines are enabled
				if (this.gridLineMajor > 0 && this.gridLineMajorEnabled) {
					// choose whether to use major or minor colour
					if (gridLineNum % this.gridLineMajor === 0) {
						drawCol = gridBoldCol;
					}
					else {
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
						for (y = yOff; y < h; y += zoomStep) {
							if ((vLineNum & 1) === 0) {
								this.drawVLine(Math.round(x + xOff), Math.round(y), Math.round(y + zoomStep - 1), drawCol);
							}
							else {
								this.drawVLine(Math.round(x + xOff + zoomStep / 2), Math.round(y), Math.round(y + zoomStep - 1), drawCol);
							}
							vLineNum += 1;
						}
					}
					else {
						// draw vertical line
						this.drawVLine(Math.round(x + xOff), 0, h - 1, drawCol);
					}
				}
			}

			// compute major grid line horizontal offset
			gridLineNum = -(h / 2 / zoomStep) - (this.height / 2 - this.yOff - this.originY) | 0;

			// draw horizontal lines
			for (y = yOff; y < h; y += zoomStep) {
				// check if major gridlines are enabled
				if (this.gridLineMajor > 0 && this.gridLineMajorEnabled) {
					// choose whether to use major or minor colour
					if (gridLineNum % this.gridLineMajor === 0) {
						drawCol = gridBoldCol;
					}
					else {
						drawCol = gridCol;
					}
				}
				gridLineNum += 1;

				// draw the line
				if (drawCol === targetCol) { 
					this.drawHLine(0, w - 1, Math.round(y), drawCol);
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
		// grid can be displayed if zoom >= 4 and no rotation
		return (this.camZoom >= 4 && this.camAngle === 0);
	};

	// draw the bounded grid border
	Life.prototype.drawBoundedGridBorder = function() {
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

		    // border colour
		    border = LifeConstants.boundedBorderColour,

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
		}
		else {
			// check for infinite height
			if (height === 0) {
				// draw left and right only
				for (i = 0; i < this.height; i += 1) {
					colourGrid[i][leftX] = border;
					colourGrid[i][rightX] = border;
				}
			}
			else {
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
		// check if colour is changing
		if (this.colourChange) {
			this.createColours();
			this.colourChange -= 1;
			if (!this.colourChange) {
				// make target current
				this.aliveColCurrent.set(this.aliveColTarget);
				this.deadColCurrent.set(this.deadColTarget);
				this.unoccupiedCurrent.set(this.unoccupiedTarget);
			}
		}

		// read the camera position
		this.camZoom = this.zoom * this.originZ;

		if (this.camZoom < ViewConstants.minZoom) {
			this.camZoom = ViewConstants.minZoom;
		}
		else {
			if (this.camZoom > ViewConstants.maxZoom) {
				this.camZoom = ViewConstants.maxZoom;
			}
		}
		this.camXOff = this.xOff + this.originX;
		this.camYOff = this.yOff + this.originY;
		this.camLayerDepth = (this.layerDepth / 2) + 1;

		// check for hex
		if (this.isHex) {
			// zero angle
			this.camAngle = 0;
		}
		else {
			this.camAngle = this.angle;
		}

		// create bounded grid border if specified
		if (this.boundedGridType !== -1) {
			this.drawBoundedGridBorder();
		}

		// create small colour grids if zoomed out
		this.createSmallColourGrids();

		// check if zoom < 0.125x
		if (this.camZoom < 0.125) {
			// check for LifeHistory overlay
			if (this.drawOverlay) {
				// render the grid with the overlay on top
				this.renderGridOverlayProjection(this.smallOverlayGrid16, this.smallColourGrid16, 15);
			}
			else {
				// render using small colour grid 16x16
				this.renderGridProjection(this.smallColourGrid16, this.smallColourGrid16, 15);
			}
		}
		else {
			// check if zoom < 0.25x
			if (this.camZoom < 0.25) {
				// check for LifeHistory overlay
				if (this.drawOverlay) {
					// render the grid with the overlay on top
					this.renderGridOverlayProjection(this.smallOverlayGrid8, this.smallColourGrid8, 7);
				}
				else {
					// render using small colour grid 8x8
					this.renderGridProjection(this.smallColourGrid8, this.smallColourGrid8, 7);
				}
			}
			else {
				// check if zoom < 0.5x
				if (this.camZoom < 0.5) {
					// check for LifeHistory overlay
					if (this.drawOverlay) {
						// render the grid with the overlay on top
						this.renderGridOverlayProjection(this.smallOverlayGrid4, this.smallColourGrid4, 3);
					}
					else {
						// render using small colour grid 4x4
						this.renderGridProjection(this.smallColourGrid4, this.smallColourGrid4, 3);
					}
				}
				else {
					// check for zoom < 1x
					if (this.camZoom < 1) {
						// check for LifeHistory overlay
						if (this.drawOverlay) {
							// render the grid with the overlay on top
							this.renderGridOverlayProjection(this.smallOverlayGrid, this.smallColourGrid2, 1);
						}
						else {
							// render using small colour grid 2x2
							this.renderGridProjection(this.smallColourGrid2, this.smallColourGrid2, 1);
						}
					}
					else {
						// check for LifeHistory overlay
						if (this.drawOverlay) {
							// render the grid with the overlay on top
							this.renderGridOverlayProjection(this.overlayGrid, this.colourGrid, 0);
						}
						else {
							// render the grid
							this.renderGridProjection(this.colourGrid, this.colourGrid, 0);
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
		}
		else {
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
				}
				else {
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
				}
				else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				}
				else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				}
				else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				}
				else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				}
				else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				}
				else {
					data32[idx] = offGrid;
				}
				idx += 1;
				x += dyy;
				y -= dxy;

				// loop unroll
				if (((x & wt) === (x & wm)) && ((y & ht) === (y & hm))) {
					col = colourGrid[y & hm][x & wm] | 0;
					data32[idx] = pixelColours[col];
				}
				else {
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
			if (this.multiNumStates !== -1) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
			}
			else {
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
			}
			else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				}
				else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					}
					else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						}
						else {
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
		}
		else {
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
					}
					else {
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
					}
					else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					}
					else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					}
					else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					}
					else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					}
					else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					}
					else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;

					// loop unroll
					if ((x & wt) === (x & wm)) {
						col = colourGridRow[x & wm] | 0;
						data32[idx] = pixelColours[col];
					}
					else {
						data32[idx] = offGrid;
					}
					idx += 1;
					x += dyy;
				}
			}
			else {
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
			if (this.multiNumStates !== -1) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
			}
			else {
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
			}
			else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				}
				else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					}
					else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						}
						else {
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
				}
				else {
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
			if (this.multiNumStates !== -1) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
			}
			else {
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
			}
			else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				}
				else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					}
					else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						}
						else {
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
			if (this.multiNumStates !== -1) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
			}
			else {
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
			}
			else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				}
				else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					}
					else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						}
						else {
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
			}
			else {
				// render with clipping and rotation
				this.renderGridProjectionClip(bottomGrid, layersGrid, mask);
			}
		}
		else {
			// check angle
			if (this.camAngle === 0) {
				// render with no clipping and no rotation
				this.renderGridProjectionNoClipNoRotate(bottomGrid, layersGrid, mask);
			}
			else {
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
		}
		else {
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
					}
					else {
						// states 3 and 5
						if (over === state3 || over === state5) {
							// if dead cell then use state 4
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						}
						else {
							pixel = pixelColours[col] | 0;
						}
					}

					// set the pixel colour
					data32[idx] = pixel;
				}
				else {
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
					}
					else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						}
						else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				}
				else {
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
					}
					else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						}
						else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				}
				else {
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
					}
					else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						}
						else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				}
				else {
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
					}
					else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						}
						else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				}
				else {
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
					}
					else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						}
						else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				}
				else {
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
					}
					else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						}
						else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				}
				else {
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
					}
					else {
						if (over === state3 || over === state5) {
							if (col < aliveStart) {
								over = state4;
							}
							pixel = pixelColours[over] | 0;
						}
						else {
							pixel = pixelColours[col] | 0;
						}
					}
					data32[idx] = pixel;
				}
				else {
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
			if (this.multiNumStates !== -1) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
			}
			else {
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
			}
			else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				}
				else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					}
					else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						}
						else {
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
				}
				else {
					// states 3 and 5
					if (over === state3 || over === state5) {
						// if dead cell then use state 4
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
			if (this.multiNumStates !== -1) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
			}
			else {
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
			}
			else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				}
				else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					}
					else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						}
						else {
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
				}
				else {
					// states 3 and 5
					if (over === state3 || over === state5) {
						// if dead cell then use state 4
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
				}
				else {
					if (over === state3 || over === state5) {
						if (col < aliveStart) {
							over = state4;
						}
						pixel = pixelColours[over] | 0;
					}
					else {
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
			if (this.multiNumStates !== -1) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
			}
			else {
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
			}
			else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				}
				else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					}
					else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						}
						else {
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
		}
		else {
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
						}
						else {
							// states 3 and 5
							if (over === state3 || over === state5) {
								// if dead cell then use state 4
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							}
							else {
								pixel = pixelColours[col] | 0;
							}
						}
					}
					else {
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
						}
						else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							}
							else {
								pixel = pixelColours[col] | 0;
							}
						}
					}
					else {
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
						}
						else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							}
							else {
								pixel = pixelColours[col] | 0;
							}
						}
					}
					else {
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
						}
						else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							}
							else {
								pixel = pixelColours[col] | 0;
							}
						}
					}
					else {
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
						}
						else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							}
							else {
								pixel = pixelColours[col] | 0;
							}
						}
					}
					else {
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
						}
						else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							}
							else {
								pixel = pixelColours[col] | 0;
							}
						}
					}
					else {
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
						}
						else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							}
							else {
								pixel = pixelColours[col] | 0;
							}
						}
					}
					else {
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
						}
						else {
							if (over === state3 || over === state5) {
								if (col < aliveStart) {
									over = state4;
								}
								pixel = pixelColours[over] | 0;
							}
							else {
								pixel = pixelColours[col] | 0;
							}
						}
					}
					else {
						pixel = offGrid;
					}
					data32[idx] = pixel;
					idx += 1;
					x += dyy;
				}
			}
			else {
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
			if (this.multiNumStates !== -1) {
				// use number of generations states as maximum
				transparentTarget = (i * (this.multiNumStates / this.layers)) | 0;
			}
			else {
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
			}
			else {
				if (layerZoom < 0.25) {
					// switch to small grid 8x8
					colourGrid = this.smallColourGrid8;
					mask = 7;
				}
				else {
					if (layerZoom < 0.5) {
						// switch to small grid 4x4
						colourGrid = this.smallColourGrid4;
						mask = 3;
					}
					else {
						if (layerZoom < 1) {
							// switch to small grid 2x2
							colourGrid = this.smallColourGrid2;
							mask = 1;
						}
						else {
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
				}
				else {
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
			}
			else {
				// render with clipping
				this.renderGridOverlayProjectionClip(bottomGrid, layersGrid, mask);
			}
		}
		else {
			// check angle
			if (this.camAngle === 0) {
				// render with no clipping and no rotation
				this.renderGridOverlayProjectionNoClipNoRotate(bottomGrid, layersGrid, mask);
			}
			else {
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

