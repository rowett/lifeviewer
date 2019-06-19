// LifeViewer plugin
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Allocator Uint8 Pattern PatternManager WaypointConstants WaypointManager Help LifeConstants IconManager Menu Life Stars MenuManager registerEvent Keywords ColourManager ScriptParser Uint32Array myRand PopupWindow typedArrays Float32 */

	// LifeViewer document configuration
	var DocConfig = {
		// meta tag name
		/** @const {string} */ tagName : "LifeViewer",

		// div class name
		/** @const {string} */ divClassName : "rle",

		// pattern source element name
		/** @const {string} */ patternSourceName : "code",

		// maximum height of pattern source element
		/** @const {number} */ patternSourceMaxHeight : 37,

		// whether to hide canvas if no support
		/** @type {boolean} */ hide : true,

		// whether to limit width to the pattern source element width
		/** @type {boolean} */ limitWidth : false,

		// whether in multiverse mode
		/** @type {boolean} */ multi : false,

		// div class name containing code block
		/** @const {string} */ divCodeClassName : "codebox",

		// patterns (in source RLE)
		patterns : []
	},

	// ViewConstants singleton
	ViewConstants = {
		// number of step samples for average
		/** @const {number} */ numStepSamples : 5,

		// a large integer used for min/max calculations on the grid
		/** @const {number} */ bigInteger : 100000000,

		// rle affine transformations
		/** @const {number} */ transIdentity : 0,
		/** @const {number} */ transFlip : 1,
		/** @const {number} */ transFlipX : 2,
		/** @const {number} */ transFlipY : 3,
		/** @const {number} */ transSwapXY : 4,
		/** @const {number} */ transSwapXYFlip : 5,
		/** @const {number} */ transRotateCW : 6,
		/** @const {number} */ transRotateCCW : 7,

		// rle paste modes
		/** @const {number} */ pasteModeOr : 0,
		/** @const {number} */ pasteModeCopy : 1,
		/** @const {number} */ pasteModeXor : 2,
		/** @const {number} */ pasteModeAnd : 3,
		/** @const {number} */ pasteModeNot : 4,

		// square root of 3 used for triangular grid
		/** @const {number} */ sqrt3 : Math.sqrt(3),

		// copy RLE size threshold (bytes) for single pass
		/** @const (number) */ copySizeThreshold : 65536,

		// copy RLE time threshold (ms) for single pass
		/** @const (number) */ copyTimeThreshold : 500,

		// copy RLE frames to display before two pass copy to allow notification
		/** @const (number) */ copyWait: 17,

		// grid line major light background default
		/** @const (number) */ gridLineLightBoldRawDefault : (209 << 16) | (209 << 8) | 209,

		// grid line light background default
		/** @const (number) */ gridLineLightRawDefault : (229 << 16) | (229 << 8) | 229,

		// grid line major dark background default
		/** @const (number) */ gridLineBoldRawDefault : (112 << 16) | (112 << 8) | 112,

		// grid line dark background default
		/** @const (number) */ gridLineRawDefault : (80 << 16) | (80 << 8) | 80,

		// one frame in seconds
		/** @const (number) */ singleFrameSeconds : 16 / 1000,

		// one frame in milliseconds
		/** @const (number) */ singleFrameMS : 16,

		// number of generations for elapsed times buffer
		/** @const (number) */ numElapsedTimes : 16384,

		// default graph opacity
		/** @const {number} */ defaultOpacity : 0.7,

		// number of stars in starfield
		/** @const {number} */ numStars : 10000,

		// script error title
		/** @const {string} */ scriptErrorTitle : "Script errors",

		// minimum and maximum track speed
		/** @const {number} */ minTrackSpeed : -2,
		/** @const {number} */ maxTrackSpeed : 2,

		// minimum and maximum thumbnail divisors
		/** @const {number} */ minThumbSize : 2,
		/** @const {number} */ maxThumbSize : 4,
		/** @const {number} */ defaultThumbSize : 4,

		// maximum time in ms between UI updates when STEP > 1
		/** @const {number} */ updateThreshold : 16.7,

		// minimum and maximum grid size 2^n
		/** @const {number} */ minGridPower : 9,  // 2^9 = 512
		/** @const {number} */ maxGridPower : 14,  // 2^14 = 16384
		/** @const {number} */ defaultGridPower : 13,  // 2^13 = 8192

		// icons
		icons : null,

		// delete radius range
		/** @const {number} */ minDeleteRadius : 1,
		/** @const {number} */ maxDeleteRadius : 16,
		/** @const {number} */ defaultDeleteRadius : 3,

		// custom theme elements
		/** @const {number} */ customThemeBackground : 0,
		/** @const {number} */ customThemeAlive : 1,
		/** @const {number} */ customThemeAliveRamp : 2,
		/** @const {number} */ customThemeDead : 3,
		/** @const {number} */ customThemeDeadRamp : 4,
		/** @const {number} */ customThemeGrid : 5,
		/** @const {number} */ customThemeGridMajor : 6,
		/** @const {number} */ customThemeStars : 7,
		/** @const {number} */ customThemeText : 8,
		/** @const {number} */ customThemeBoundary : 9,
		/** @const {number} */ customThemeGraphBg : 10,
		/** @const {number} */ customThemeGraphAxis : 11,
		/** @const {number} */ customThemeGraphAlive : 12,
		/** @const {number} */ customThemeGraphBirth : 13,
		/** @const {number} */ customThemeGraphDeath : 14,
		/** @const {number} */ customThemeError : 15,
		/** @const {number} */ customThemeLabel : 16,
		/** @const {number} */ customThemeDying : 17,
		/** @const {number} */ customThemeDyingRamp : 18,
		/** @const {number} */ customThemeUIFG : 19,
		/** @const {number} */ customThemeUIBG : 20,
		/** @const {number} */ customThemeUIHighlight : 21,
		/** @const {number} */ customThemeUISelect : 22,
		/** @const {number} */ customThemeUILocked : 23,
		/** @const {number} */ customThemeUIBorder : 24,
		/** @const {number} */ customThemeArrow : 25,
		/** @const {number} */ customThemePoly : 26,

		// state numbers
		/** @const {number} */ offState : 0,
		/** @const {number} */ onState : 1,
		/** @const {number} */ historyState : 2,
		/** @const {number} */ mark1State : 3,
		/** @const {number} */ markOffState : 4,
		/** @const {number} */ mark2State : 5,
		/** @const {number} */ killState : 6,

		// state translation for [R]History order
		/** @const {Array<number>} */ stateMap : [0, 6, 2, 5, 3, 4, 1],

		// state names for [R]History
		/** @const {Array<string>} */ stateNames : ["Dead", "Alive", "History", "Mark1", "MarkOff", "Mark2", "Kill"],

		// display names for [R]History states
		/** @const {Array<string>} */ stateDisplayNames : ["OFF", "ON", "HISTORY", "MARK1", "MARKOFF", "MARK2", "KILL"],

		// min and max red shading for performance display
		/** @const {number} */ perfMinRed : 0,
		/** @const {number} */ perfMaxRed : 160,

		// step for red shading
		/** @const {number} */ perfRedStep : 10,

		// max green shading for performance display
		/** @const {number} */ perfMaxGreen : 100,

		// step for green shading
		/** @const {number} */ perfGreenStep : 20,

		// frame time budget in ms before too slow is triggered
		/** @const {number} */ frameBudget : 18.5,
		
		// frame cap for 60Hz in ms
		/** @const {number} */ sixtyHz : 1000 / 60,

		// whether colour theme has colour history
		/** @const {boolean} */ colourHistory : false,

		// error notification duration in ms
		/** @const {number} */ errorDuration : 1800,

		// external viewer window
		/** @const {string} */ externalViewerTitle : "LifeViewer",

		// screenshot window
		/** @const {string} */ screenShotTitle : "LifeViewer Image",

		// name
		/** @const {string} */ versionName : "LifeViewer",

		// build version
		/** @const {number} */ versionBuild : 347,

		// author
		/** @const {string} */ versionAuthor : "Chris Rowett",

		// minimum layers
		/** @const {number} */ minLayers : 1,

		// maximum layers
		/** @const {number} */ maxLayers : 10,

		// play modes
		/** @const {number} */ modeReset : 0,
		/** @const {number} */ modeStepBack : 1,
		/** @const {number} */ modePause : 2,
		/** @const {number} */ modePlay : 3,

		// draw modes
		/** @const {number} */ modeDraw : 0,
		/** @const {number} */ modeSelect : 1,
		/** @const {number} */ modePan : 2,

		// zoom scale factor for pattern fit zoom
		/** @const {number} */ zoomScaleFactor : 1.25,

		// threshold for fit zoom to round to nearest integer (percentage)
		/** @const {number} */ integerZoomThreshold : 0.99,

		// minimum and maximum depth
		/** @const {number} */ minDepth : 0,
		/** @const {number} */ maxDepth : 10,
		
		// display scale for depth
		/** @const {number} */ depthScale : 10,

		// maximum default zoom if autofit or zoom not specified
		/** @const {number} */ maxDefaultZoom : 32,

		// minimum and maximum zoom
		/** @const {number} */ minZoom : 0.0625,
		/** @const {number} */ maxZoom : 64,
		
		// minimum and maximum negative zoom
		/** @const {number} */ minNegZoom : -16,
		/** @const {number} */ maxNegZoom : -1,

		// minimum and maximum generation speed
		/** @const {number} */ minGenSpeed : 1,
		/** @const {number} */ maxGenSpeed : 60,

		// minimum and maximum steps
		/** @const {number} */ minStepSpeed : 1,
		/** @const {number} */ maxStepSpeed : 64,

		// font size
		/** @const {number} */ fontSize : 18,

		// fixed font
		/** @const {string} */ fixedFont : "18px Courier",

		// variable font
		/** @const {string} */ variableFont : "18px Arial",

		// stats font
		/** @const {string} */ statsFont : "18px Arial",

		// small stats font
		/** @const {string} */ smallStatsFont : "14px Arial",

		// small menu font
		/** @const {string} */ smallMenuFont : "9px Arial",

		// arrow colour
		/** @const {string} */ arrowColour : "rgb(240,255,255)",

		// arrow shadow colour
		/** @const {string} */ arrowShadowColour : "rgb(0,0,0)",

		// polygon colour
		/** @const {string} */ polyColour : "rgb(240,255,255)",

		// polygon shadow colour
		/** @const {string} */ polyShadowColour : "rgb(0,0,0)",

		// annotation line thickness
		/** @const {number} */ annotationLineThickness : 2,

		// min and max line width
		/** @const {number} */ minLineSize : 1,
		/** @const {number} */ maxLineSize : 64,

		// arrow head size multiple
		/** @const {number} */ arrowHeadMultiple : 0.2,

		// label font colour
		/** @const {string} */ labelFontColour : "rgb(240,255,255)",

		// label shadow colour
		/** @const {string} */ labelShadowColour : "rgb(0,0,0)",

		// label standard font size
		/** @const {number} */ labelFontSize : 18,

		// min and max label size
		/** @const {number} */ minLabelSize : 4,
		/** @const {number} */ maxLabelSize : 128,

		// label font family
		/** @const {string} */ labelFontFamily : "Arial",

		// help font colour
		/** @const {string} */ helpFontColour : "rgb(32,255,255)",

		// help shadow colour (must be in #RRGGBB format)
		/** @const {string} */ helpShadowColour : "#000000",

		// error list font colour
		/** @const {string} */ errorsFontColour : "rgb(255,96,96)",

		// grey font colour (used to grey out text)
		/** @const {string} */ greyFontColour : "rgb(128,128,128)",

		// minimum and maximum width of the Viewer
		/** @const {number} */ minNoGUIWidth: 64,
		/** @const {number} */ minNoGUIHeight: 64,
		/** @const {number} */ minLegacyWidth : 480,
		/** @const {number} */ minViewerWidth : 560,
		/** @const {number} */ maxViewerWidth : 2048,

		// extra gui height for top and bottom row of controls (used during AutoFit)
		/** @const {number} */ guiExtraHeight : 80,

		// minimum and maximum height of the Viewer
		/** @const {number} */ minViewerHeight : 240,
		/** @const {number} */ maxViewerHeight : 2048,

		// minimum height to display navigation menu in the Viewer
		/** @const {number} */ minMenuHeight : 480,

		// default width for the zoom slider (gets wider if the window is wider than the default)
		/** @const {number} */ zoomSliderDefaultWidth : 132,

		// maximum width for the zoom slider (gets wider if the window is wider than the default)
		/** @const {number} */ zoomSliderMaxWidth : 292,

		// width for opacity slider to use full caption
		/** @const {number} */ opacityNameWidth : 154,

		// custom colour usage states
		/** @const {number} */ stateNotUsed : 0,
		/** @const {number} */ stateUsedCustom : 1,
		/** @const {number} */ stateUsedDefault : 2,

		// minimum and maximum bold grid line interval (0 means no bold grid lines)
		/** @const {number} */ minBoldGridInterval : 0,
		/** @const {number} */ maxBoldGridInterval : 16,

		// help topics
		/** @const {number} */ welcomeTopic : 0,
		/** @const {number} */ keysTopic : 1,
		/** @const {number} */ scriptsTopic : 2,
		/** @const {number} */ informationTopic : 3,
		/** @const {number} */ themesTopic : 4,
		/** @const {number} */ coloursTopic : 5,
		/** @const {number} */ aliasesTopic : 6,
		/** @const {number} */ memoryTopic : 7,
		/** @const {number} */ annotationsTopic : 8
	},

	// Controller singleton
	Controller = {
		// allocator
		allocator : new Allocator(),

		// list of Canvas items and View pairs
		viewers : [],

		// standalone viewer
		/** @type {number} */ standaloneIndex : -1,

		// popup window
		popupWindow : null,

		// list of patterns in multiverse mode
		patterns : []
	};

	// return standalone viewer
	Controller.standaloneViewer = function() {
		var result = null;

		// check if there is a standalone viewer
		if (this.standaloneIndex !== -1) {
			result = this.viewers[this.standaloneIndex];
		}

		// return the viewer
		return result;
	};

	// return the View for the requested viewer
	Controller.getView = function(which) {
		var result = null;

		if (which >=0 && which < this.viewers.length) {
			result = this.viewers[which][1];
		}

		return result;
	};

	// return the number of viewers
	Controller.numViewers = function() {
		return this.viewers.length;
	};

	// return number of viewers playing
	Controller.viewersPlaying = function() {
		var currentViewer = null,
		    count = 0,
		    i = 0;

		// check each viewer
		for (i = 0; i < this.viewers.length; i += 1) {
			// get the next viewer
			currentViewer = this.viewers[i][1];

			// check if it is playing
			if (currentViewer.generationOn) {
				count += 1;
			}
		}

		// return number of playing viewers
		return count;
	};

	// reset all viewers
	Controller.resetAllViewers = function() {
		var currentViewer = null,
		    i = 0,
		    result = 0;

		// reset each viewer
		for (i = 0; i < this.viewers.length; i += 1) {
			// get the next viewer
			currentViewer = this.viewers[i][1];

			// reset the viewer
			currentViewer.playList.current = currentViewer.viewPlayList(ViewConstants.modeReset, true, currentViewer);

			// ensure updates happen
			currentViewer.menuManager.setAutoUpdate(true);

			// increment number of viewers reset
			result += 1;
		}

		// return number of viewers reset
		return result;
	};

	// stop all viewers
	Controller.stopAllViewers = function() {
		var currentViewer = null,
		    i = 0,
		    result = 0;

		// stop each viewer
		for (i = 0; i < this.viewers.length; i += 1) {
			// get the next viewer
			currentViewer = this.viewers[i][1];

			// check if it is playing
			if (currentViewer.generationOn) {
				// pause the viewer
				currentViewer.playList.current = currentViewer.viewPlayList(ViewConstants.modePause, true, currentViewer);

				// increment number stopped
				result += 1;
			}
		}

		// return number of viewers stopped
		return result;
	};

	// stop all viewers except for the specified one
	Controller.stopOtherViewers = function(thisOne) {
		var currentViewer = null,
		    i = 0,
		    result = 0;

		// stop each viewer
		for (i = 0; i < this.viewers.length; i += 1) {
			// get the next viewer
			currentViewer = this.viewers[i][1];

			// check if it is the specified one
			if (currentViewer !== thisOne) {
				// check if it is playing
				if (currentViewer.generationOn) {
					// pause the viewer
					currentViewer.playList.current = currentViewer.viewPlayList(ViewConstants.modePause, true, currentViewer);

					// increment number stopped
					result += 1;
				}
			}
		}

		// return number of viewers stopped
		return result;
	};

	// PatternInfo object
	/**
	 * @constructor
	 */
	function PatternInfo(name, pattern, rule, width, height) {
		this.name = name;
		this.pattern = pattern;
		this.rule = rule;
		this.width = width;
		this.height = height;
	}

	// View object
	/**
	 * @constructor
	 */
	function View(element) {
		// edit list for undo/redo
		this.editList = [];

		// undo records for undo/redo
		this.undoList = [];

		// edit number for undo/redo
		this.editNum = 0;

		// number of edits for undo/redo
		this.numEdits = 0;

		// current edit
		this.currentEdit = [];

		// current undo record
		this.currentUndo = [];

		// step samples
		this.stepSamples = [];
		this.stepIndex = 0;

		// list of transformations
		this.transforms = [];
		this.transforms[ViewConstants.transIdentity] = [1, 0, 0, 1];
		this.transforms[ViewConstants.transFlip] = [-1, 0, 0, -1];
		this.transforms[ViewConstants.transFlipX] = [-1, 0, 0, 1];
		this.transforms[ViewConstants.transFlipY] = [1, 0, 0, -1];
		this.transforms[ViewConstants.transSwapXY] = [0, 1, 1, 0];
		this.transforms[ViewConstants.transSwapXYFlip] = [0, -1, -1, 0];
		this.transforms[ViewConstants.transRotateCW] = [0, -1, 1, 0];
		this.transforms[ViewConstants.transRotateCCW] = [0, 1, -1, 0];

		// list of named recipes
		this.recipeList = [];

		// recipe delta list
		this.recipeDelta = [];

		// list of named rle snippets
		this.rleList = [];

		// list of pastes to perform
		this.pasteList = [];

		// rle paste mode
		this.pasteMode = ViewConstants.pasteModeOr;

		// rle paste generation
		this.pasteGen = 0;

		// rle paste end generation for every mode
		this.pasteEnd = -1;

		// rle delta list
		this.pasteDelta = [];

		// rle paste modulus
		this.pasteEvery = 0;

		// whether there is a paste every snippet
		this.isPasteEvery = false;

		// maximum paste generation (exlcuding paste every snippets)
		this.maxPasteGen = 0;

		// whether there is evolution to do
		this.isEvolution = false;

		// paste snippets bounding box
		this.pasteLeftX = 0;
		this.pasteRightX = 0;
		this.pasteBottomY = 0;
		this.pasteTopY = 0;

		// universe number
		/** @type {number} */ this.universe = 0;

		// running in Edge browser
		/** @type {boolean} */ this.isEdge = false;

		// icon manager
		this.iconManager = null;

		// current UI background RGB
		/** @type {number} */ this.uiBackgroundRGB = 0;

		// whether the section control needs to be updated
		/** @type {boolean} */ this.updateSectionControl = true;

		// start state for states list
		/** @type {number} */ this.startState = 0;

		// current drawing state
		/** @type {number} */ this.drawState = 1;

		// whether picking state
		/** @type {boolean} */ this.pickMode = false;

		// whether to show states
		/** @type {boolean} */ this.showStates = false;

		// maximum number of states to show (based on window width)
		/** @type {number} */ this.maxDisplayStates = 7;

		// whether smart drawing is on
		/** @type {boolean} */ this.smartDrawing = true;

		// cell X and Y coordinate
		/** @type {number} */ this.cellX = 0;
		/** @type {number} */ this.cellY = 0;

		// whether pattern was empty on load
		/** @type {boolean} */ this.emptyStart = false;

		// maximum number of history states (can be less for multi-state patterns)
		/** @type {number} */ this.maxHistoryStates = 63;

		// number of history states (default and maximum is 63)
		/** @type {number} */ this.historyStates = 63;

		// whether to hide source element
		/** @type {boolean} */ this.noSource = false;

		// initial value flags
		/** @type {boolean} */ this.initialX = false;
		/** @type {boolean} */ this.initialY = false;
		/** @type {boolean} */ this.initialZ = false;
		/** @type {boolean} */ this.initialAngle = false;
		/** @type {boolean} */ this.initialDepth = false;
		/** @type {boolean} */ this.initialLayers = false;
		/** @type {boolean} */ this.initialTheme = false;
		/** @type {boolean} */ this.initialStep = false;
		/** @type {boolean} */ this.initialGps = false;
		/** @type {boolean} */ this.initialStop = false;
		/** @type {boolean} */ this.initialLoop = false;

		// floating point counter
		/** @type {number} */ this.floatCounter = 0;

		// floating point counter for origin
		/** @type {number} */ this.originCounter = 0;

		// elapsed time at each generation
		this.elapsedTimes = null;

		// x and y offset of pattern
		/** @type {number} */ this.panX = 0;
		/** @type {number} */ this.panY = 0;

		// whether pattern was clipped to bounded grid
		/** @type {boolean} */ this.wasClipped = false;

		// specified pattern width and height from RLE header
		/** @type {number} */ this.specifiedWidth = -1;
		/** @type {number} */ this.specifiedHeight = -1;

		// default POI
		/** @type {number} */ this.defaultPOI = -1;

		// random seed
		this.randomSeed = Date.now().toString();
		/** @type {boolean} */ this.randomSeedCustom = false;

		// current help topic
		/** @type {number} */ this.helpTopic = ViewConstants.welcomeTopic;

		// whether labels displayed
		/** @type {boolean} */ this.showLabels = true;

		// whether population graph displayed
		/** @type {boolean} */ this.popGraph = false;

		// whether population graph uses lines or points
		/** @type {boolean} */ this.popGraphLines = true;

		// graph opacity
		/** @type {number} */ this.popGraphOpacity = ViewConstants.defaultOpacity;

		// whether graph disable
		/** @type {boolean} */ this.graphDisabled = false;

		// whether integer zoom enforced
		/** @type {boolean} */ this.integerZoom = false;

		// save the document element containing the rle
		this.element = element;

		// whether infobar displayed
		/** @type {boolean} */ this.infoBarEnabled = false;

		// current box speed
		/** @type {number} */ this.currentTrackSpeedN = 0;
		/** @type {number} */ this.currentTrackSpeedS = 0;
		/** @type {number} */ this.currentTrackSpeedE = 0;
		/** @type {number} */ this.currentTrackSpeedW = 0;

		// track box speeds
		/** @type {number} */ this.trackBoxN = 0;
		/** @type {number} */ this.trackBoxS = 0;
		/** @type {number} */ this.trackBoxE = 0;
		/** @type {number} */ this.trackBoxW = 0;

		// whether track box defined
		/** @type {boolean} */ this.trackBoxDefined = false;

		// whether track defined
		/** @type {boolean} */ this.trackDefined = false;

		// whether trackloop defined
		/** @type {boolean} */ this.trackLoopDefined = false;

		// whether track disabled
		/** @type {boolean} */ this.trackDisabled = false;

		// whether to display generation notifications
		/** @type {boolean} */ this.genNotifications = true;

		// whether to display generation as relative or absolute
		/** @type {boolean} */ this.genRelative = false;

		// generation offset from CXRLE Gen command
		/** @type {number} */ this.genOffset = 0;
		/** @type {boolean} */ this.genDefined = false;

		// x and y offset from CXRLE Pos command
		/** @type {number} */ this.posXOffset = 0;
		/** @type {number} */ this.posYOffset = 0;
		/** @type {boolean} */ this.posDefined = false;

		// failure reason
		/** @type{string} */ this.failureReason = "";

		// x offset
		/** @type {number} */ this.xOffset = 0;
		/** @type {number} */ this.yOffset = 0;

		// current POI number
		/** @type {number} */ this.currentPOI = -1;

		// start point for POI
		/** @type {number} */ this.startXPOI = -1;
		/** @type {number} */ this.startYPOI = -1;
		/** @type {number} */ this.startZoomPOI = -1;
		/** @type {number} */ this.startAnglePOI = -1;
		/** @type {number} */ this.startDepthPOI = -1;
		/** @type {number} */ this.startLayersPOI = -1;

		// destination point for POI
		/** @type {number} */ this.endXPOI = -1;
		/** @type {number} */ this.endYPOI = -1;
		/** @type {number} */ this.endZoomPOI = -1;
		/** @type {number} */ this.endAnglePOI = -1;
		/** @type {number} */ this.endDepthPOI = -1;
		/** @type {number} */ this.endLayersPOI = -1;

		// whether depth and layers are used at the POI
		/** @type {boolean} */ this.depthPOIused = false;
		/** @type {boolean} */ this.layersPOIused = false;

		// steps for POI transition
		/** @type {number} */ this.stepsPOI = -1;

		// target steps for POI transition
		/** @type {number} */ this.targetPOI = -1;

		// whether computing history
		/** @type {boolean} */ this.computeHistory = false;

		// whether copying RLE
		/** @type {boolean} */ this.clipboardCopy = false;

		// copy start time
		/** @type {number} */ this.copyStartTime = -1;

		// textarea used for RLE copy
		this.tempInput = null;

		// div used for RLE copy
		this.tempDiv = null;

		// string containing RLE
		/** @type{string} */ this.tempRLE = "";

		// amount copied and target
		/** @type {number} */ this.tempRLEAmount = 0;
		/** @type {number} */ this.tempRLELength = 0;

		// chunk size in bytes to copy
		/** @type {number} */ this.tempRLEChunkSize = 32768;

		// frames to display before processing copy to allow notification
		/** @type {number} */ this.copyFrameWait = 0;

		// history target generation
		/** @type {number} */ this.computeHistoryTarget = 0;

		// when compute history finishes clear notification
		/** @type {boolean} */ this.computeHistoryClear = true;

		// whether autofit is on
		/** @type {boolean} */ this.autoFit = false;

		// whether autofit is defined
		/** @type {boolean} */ this.autoFitDefined = false;

		// delta between target auto fit zoom and current zoom
		/** @type {number} */ this.autoFitDelta = 0;

		// threshold for auto fit delta to be small enough not to matter
		/** @type {number} */ this.autoFitThreshold = 0.01;

		// weight for auto fit average (target is one part in n)
		/** @type {number} */ this.autoFitWeight = 6;

		// whether autofit is in history fit mode
		/** @type {boolean} */ this.historyFit = false;

		// whether autofit only uses state 1
		/** @type {boolean} */ this.state1Fit = false;

		// custom text message colour
		this.customTextColour = null;

		// custom error message colour
		this.customErrorColour = null;

		// error font colour
		this.errorsFontColour = ViewConstants.errorsFontColour;

		// boundary colour (for help display)
		this.customBoundaryColour = [96, 96, 96];

		// window title element
		this.titleElement = null;

		// window title string
		/** @type{string} */ this.windowTitle = "";

		// flag if performance warning is disabled
		/** @type {boolean} */ this.noPerfWarning = false;

		// flag if history is disabled
		/** @type {boolean} */ this.noHistory = false;

		// flag if pattern is executable
		/** @type {boolean} */ this.executable = false;

		// flag if stars are used
		/** @type {boolean} */ this.starsOn = false;

		// create and initialise stars
		this.starField = null;

		// whether viewer is in popup window
		/** @type {boolean} */ this.isInPopup = false;

		// line number for error and script drawing
		/** @type {number} */ this.lineNo = 1;

		// performance colour red component
		/** @type {number} */ this.perfColRed = 0;

		// performance colour green component
		/** @type {number} */ this.perfColGreen = 0;

		// whether just started
		/** @type {boolean} */ this.justStarted = false;

		// whether controls are locked (during waypoint playback)
		/** @type {boolean} */ this.controlsLocked = false;

		// waypoint manager
		this.waypointManager = new WaypointManager();

		// last waypoint message
		/** @type{string} */ this.lastWaypointMessage = "";

		// last waypoint theme
		/** @type {number} */ this.lastWaypointTheme = -1;

		// whether waypoint defined
		/** @type {boolean} */ this.waypointsDefined = false;

		// whether a manual change happened
		/** @type {boolean} */ this.manualChange = false;

		// generations per step
		/** @type {number} */ this.gensPerStep = 1;

		// number of script commands and errors
		/** @type {number} */ this.numScriptCommands = 0;
		/** @type {number} */ this.numScriptErrors = 0;

		// number of frames when fading after stop
		/** @type {number} */ this.fading = 0;

		// maximum width due to code element
		/** @type {number} */ this.maxCodeWidth = ViewConstants.maxViewerWidth;

		// generation that life died
		/** @type {number} */ this.diedGeneration = -1;

		// requested viewer width and height
		/** @type {number} */ this.requestedWidth = -1;
		/** @type {number} */ this.requestedHeight = -1;

		// requested popup viewer width and height
		/** @type {number} */ this.requestedPopupWidth = -1;
		/** @type {number} */ this.requestedPopupHeight = -1;

		// pattern name and originator
		/** @type{string} */ this.patternName = "";
		/** @type{string} */ this.patternOriginator = "";

		// pattern width and height
		/** @type {number} */ this.patternWidth = 0;
		/** @type {number} */ this.patternHeight = 0;

		// number of pattern states
		/** @type {number} */ this.patternStates = 0;

		// number of used pattern states
		/** @type {number} */ this.patternUsedStates = 0;

		// number of cells in each state
		this.patternStateCount = null;

		// pattern format
		/** @type{string} */ this.patternFormat = "";

		// pattern rule name
		/** @type{string} */ this.patternRuleName = "";

		// pattern alias name
		/** @type{string} */ this.patternAliasName = "";

		// pattern bounded grid definition
		/** @type{string} */ this.patternBoundedGridDef = "";

		// whether using custom theme
		/** @type {boolean} */ this.customTheme = false;

		// custom theme value
		this.customThemeValue = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

		// custom grid colour
		/** @type {number} */ this.customGridColour = -1;

		// custom grid major colour
		/** @type {number} */ this.customGridMajorColour = -1;

		// whether custom grid line major defined
		/** @type {boolean} */ this.customGridLineMajor = false;

		// custom label colour
		this.customLabelColour = ViewConstants.labelFontColour;

		// custom arrow colour
		this.customArrowColour = ViewConstants.arrowColour;

		// custom polygon colour
		this.customPolygonColour = ViewConstants.polyColour;

		// colour set used
		/** @type {string} */ this.colourSetName = "";
		/** @type {number} */ this.colourSetSize = 0;
		this.colourList = [];

		// whether all colours are custom
		/** @type {boolean} */ this.allCustom = false;

		// custom colour set
		this.customColours = [];

		// whether custom colour used
		this.customColourUsed = [];

		// script error list
		this.scriptErrors = [];

		// error display line
		/** @type {number} */ this.displayErrors = 1;

		// help display line
		/** @type {number} */ this.displayHelp = 0;

		// whether to show help sections
		/** @type {boolean} */ this.showSections = false;

		// number of help lines
		/** @type {number} */ this.numHelpLines = 100;

		// number of help lines per page
		/** @type {number} */ this.numHelpPerPage = 10;

		// further tab positions
		/** @type {Array<number>} */ this.tabs = [64, 200, 290, 530, 700];

		// whether to wrap help text
		/** @type {boolean} */ this.wrapHelpText = false;

		// help information sections
		this.helpSections = [];

		// help text width cache
		this.helpFixedCache = [];
		this.helpVariableCache = [];

		// generation number to stop at
		/** @type {number} */ this.stopGeneration = -1;

		// generation number to loop from
		/** @type {number} */ this.loopGeneration = -1;

		// flag if loop temporary disabled
		/** @type {boolean} */ this.loopDisabled = false;

		// flag if waypoints disabled
		/** @type {boolean} */ this.waypointsDisabled = false;

		// whether to disable playback
		/** @type {boolean} */ this.viewOnly = false;

		// whether to hide GUI while pattern playing
		/** @type {boolean} */ this.hideGUI = false;

		// whether to disable GUI
		/** @type {boolean} */ this.noGUI = false;

		// whether NOGUI defined
		/** @type {boolean} */ this.noGUIDefined = false;

		// whether to hide pattern source
		/** @type {boolean} */ this.hideSource = false;

		// whether to disable pattern copy
		/** @type {boolean} */ this.noCopy = false;

		// whether multi-state view used
		/** @type {boolean} */ this.multiStateView = false;

		// whether to autostart
		/** @type {boolean} */ this.autoStart = false;
		/** @type {boolean} */ this.autoStartDisabled = false;

		// whether reset is always hard
		/** @type {boolean} */ this.hardReset = false;

		// moveable menu items original position
		/** @type {number} */ this.playListX = -1;
		/** @type {number} */ this.generationRangeX = -1;
		/** @type {number} */ this.stepRangeX = -1;

		// life engine
		this.engine = null;

		// elapsed time
		/** @type {number} */ this.elapsedTime = 0;

		// default grid width
		/** @type {number} */ this.defaultGridWidth = 512;

		// default grid height
		/** @type {number} */ this.defaultGridHeight = 512;

		// display width
		/** @type {number} */ this.displayWidth = 640;

		// display height
		/** @type {number} */ this.displayHeight = 512;

		// whether popup width has changed
		/** @type {boolean} */ this.popupWidthChanged = false;
		/** @type {number} */ this.lastPopupWidth = 640;

		// whether life generation is on
		/** @type {boolean} */ this.generationOn = false;

		// whether to generate next step
		/** @type {boolean} */ this.nextStep = false;

		// whether step is single generation
		/** @type {boolean} */ this.singleStep = false;

		// whether stats displayed
		/** @type {boolean} */ this.statsOn = false;

		// generation range item
		this.generationRange = null;

		// speed step range item
		this.stepRange = null;

		// actual step
		this.stepLabel = null;

		// undo button
		this.undoButton = null;

		// redo button
		this.redoButton = null;

		// copy rle button
		this.copyRLEButton = null;

		// navigation menu toggle
		this.navToggle = null;

		// theme item
		this.themeItem = null;

		// angle item
		this.angleItem = null;

		// zoom item
		this.zoomItem = null;

		// depth item
		this.depthItem = null;

		// layers item
		this.layersItem = null;

		// generation button
		this.genToggle = null;

		// reason label
		this.reasonLabel = null;

		// opacity item
		this.opacityItem = null;

		// lines toggle
		this.linesToggle = null;

		// infobar label
		this.infoBarLabelXLeft = null;
		this.infoBarLabelXValue = null;
		this.infoBarLabelYLeft = null;
		this.infoBarLabelYValue = null;
		this.infoBarLabelAngleLeft = null;
		this.infoBarLabelAngleValue = null;
		this.infoBarLabelCenter = null;
		this.infoBarLabelERight = null;
		this.infoBarLabelSRight = null;
		this.infoBarLabelWRight = null;
		this.infoBarLabelNRight = null;
		this.infoBarLabelEValueRight = null;
		this.infoBarLabelSValueRight = null;
		this.infoBarLabelWValueRight = null;
		this.infoBarLabelNValueRight = null;

		// autostart indicator
		this.autostartIndicator = null;

		// waypoints indicator
		this.waypointsIndicator = null;

		// loop indicator
		this.loopIndicator = null;

		// stop indicator
		this.stopIndicator = null;

		// help button
		this.helpToggle = null;

		// topics button
		this.topicsButton = null;

		// states slider
		this.statesSlider = null;

		// sections button
		this.sectionsButton = null;

		// help topic buttons
		this.helpKeysButton = null;
		this.helpScriptsButton = null;
		this.helpInfoButton = null;
		this.helpThemesButton = null;
		this.helpColoursButton = null;
		this.helpAliasesButton = null;
		this.helpMemoryButton = null;
		this.helpAnnoationsButton = null;

		// help section list
		this.helpSectionList = null;

		// autofit button
		this.autoFitToggle = null;

		// grid toggle
		this.gridToggle = null;

		// fit button
		this.fitButton = null;

		// shrink button
		this.shrinkButton = null;

		// close or esc button
		this.closeButton = null;

		// label toggle button
		this.labelButton = null;

		// kill gliders toggle button
		this.killButton = null;

		// previous POI button
		this.prevPOIButton = null;

		// next POI button
		this.nextPOIButton = null;

		// hex toggle button
		this.hexButton = null;

		// hex cell toggle button
		this.hexCellButton = null;

		// cell borders toggle button
		this.bordersButton = null;

		// graph toggle button
		this.graphButton = null;

		// close button for graph
		this.graphCloseButton = null;

		// infobar button
		this.infoBarButton = null;

		// major button
		this.majorButton = null;

		// history fit button
		this.historyFitButton = null;

		// stars button
		this.starsButton = null;

		// previous universe button
		this.prevUniverseButton = null;

		// next universe button
		this.nextUniverseButton = null;

		// timing button
		this.fpsButton = null;

		// [R]History display button
		this.rHistoryButton = null;

		// timing details button
		this.timingDetailButton = null;

		// time label
		this.timeLabel = null;

		// elapsed time label
		this.elapsedTimeLabel = null;

		// xy label
		this.xyLabel = null;

		// population label and value
		this.popLabel = null;
		this.popValue = null;

		// births label and value
		this.birthsLabel = null;
		this.birthsValue = null;

		// deaths label and value
		this.deathsLabel = null;
		this.deathsValue = null;

		// progress bar
		this.progressBar = null;

		// play list (play/pause/reset/step back buttons)
		this.playList = null;

		// mode list (draw/pan buttons)
		this.modeList = null;

		// pick button
		this.pickToggle = null;

		// states button
		this.statesToggle = null;

		// states list for drawing
		this.stateList = null;

		// states colours list for drawing
		this.stateColsList = null;

		// current steps before next view theme change
		/** @type {number} */ this.viewSteps = 30;

		// last drag position
		/** @type {number} */ this.lastDragX = -1;
		/** @type {number} */ this.lastDragY = -1;

		// mouse wheel delta
		/** @type {number} */ this.wheelDelta = 0;

		// rule label
		this.ruleLabel = null;

		// main canvas
		this.mainCanvas = null;

		// main context
		this.mainContext = null;

		// offboard canvas
		this.offCanvas = null;

		// offboard context
		this.offContext = null;

		// generation speed
		/** @type {number} */ this.genSpeed = 60;

		// menu manager
		this.menuManager = null;

		// view menu
		this.viewMenu = null;

		// target position
		/** @type {number} */ this.targetX = 0;
		/** @type {number} */ this.targetY = 0;

		// target zoom
		/** @type {number} */ this.targetZoom = 0;

		// default camera
		/** @type {number} */ this.defaultAngle = 0;
		/** @type {number} */ this.defaultX = 0;
		/** @type {number} */ this.defaultY = 0;
		/** @type {number} */ this.defaultZoom = 1;
		/** @type {number} */ this.defaultTheme = 1;
		/** @type {number} */ this.defaultGPS = 60;
		/** @type {number} */ this.defaultStep = 1;
		/** @type {number} */ this.defaultLayers = 1;
		/** @type {number} */ this.defaultDepth = 0.1;

		// whether a theme was requested
		/** @type {number} */ this.themeRequested = -1;

		// saved camera
		/** @type {number} */ this.savedAngle = 0;
		/** @type {number} */ this.savedX = 0;
		/** @type {number} */ this.savedY = 0;
		/** @type {number} */ this.savedZoom = 1;

		// flags if default used
		/** @type {boolean} */ this.defaultZoomUsed = false;
		/** @type {boolean} */ this.defaultXUsed = false;
		/** @type {boolean} */ this.defaultYUsed = false;

		// flag if thumbnail mode on
		/** @type {boolean} */ this.thumbnail = false;

		// flag if thumbnail was ever on
		/** @type {boolean} */ this.thumbnailEverOn = false;

		// thumbnail divisor
		/** @type {number} */ this.thumbnailDivisor = ViewConstants.defaultThumbSize;

		// original width, height and zoom to set when thumbnail clicked
		/** @type {number} */ this.thumbOrigWidth = 0;
		/** @type {number} */ this.thumbOrigHeight = 0;
		/** @type {number} */ this.thumbOrigZoom = 0;

		// help text position
		/** @type {number} */ this.thumbOrigHelpPosition = 0;

		// whether clicking on thumbnail launches popup viewer
		/** @type {boolean} */ this.thumbLaunch = false;

		// whether thumbnail zoom defined
		/** @type {boolean} */ this.thumbZoomDefined = false;
		/** @type {number} */ this.thumbZoomValue = 0;

		// screenshot scheduled
		/** @type {number} */ this.screenShotScheduled = 0;

		// whether drawing
		/** @type {boolean} */ this.drawing = false;

		// pen colour for drawing
		/** @type {number} */ this.penColour = -1;
	}

	// draw cell and create undo/redo
	View.prototype.setStateWithUndo = function(x, y, colour, deadZero) {
		// get current state
		var state = this.engine.getState(x, y, false),
			i = this.currentEdit.length,
			xOff = (this.engine.width >> 1) - (this.patternWidth >> 1),
			yOff = (this.engine.height >> 1) - (this.patternHeight >> 1);

		// only add undo/redo records if the new state is different than the current state
		if (colour !== state) {
			this.currentEdit[i] = x - xOff;
			this.currentEdit[i + 1] = y - yOff;
			this.currentEdit[i + 2] = colour;
	
			// update undo record
			this.currentUndo[i] = x - xOff;
			this.currentUndo[i + 1] = y - yOff;
			this.currentUndo[i + 2] = state;
		}

		// set the state
		return this.engine.setState(x, y, colour, deadZero);
	};

	// paste raw cells for undo/redo
	View.prototype.pasteRaw = function(record, reverse) {
		var cells = record.cells,
			i = 0,
			target = cells.length,
			di = 3,
			xOff = (this.engine.width >> 1) - (this.patternWidth >> 1),
			yOff = (this.engine.height >> 1) - (this.patternHeight >> 1);

		// check for reverse order
		if (reverse) {
			di = -di;
			i = target + di;
			target = di;
		}

		while (i !== target) {
			this.engine.setState(cells[i] + xOff, cells[i + 1] + yOff, cells[i + 2], true);
			i += di;
		}
	};

	// set undo stack pointer to given generation (used with step back)
	View.prototype.setUndoGen = function(gen) {
		var i = this.editNum - 1,
			found = false;

		// search for undo records at or before specified generation
		while (i >= 0 && !found) {
			if (this.editList[i].gen <= gen) {
				found = true;
			} else {
				i -= 1;
			}
		}

		if (found) {
			this.editNum = i + 1;
		}
	};

	// after edit
	View.prototype.afterEdit = function() {
		var wasChange = true,
			counter = this.engine.counter;

		// do nothing if step back disabled
		if (!this.noHistory) {
			// check for duplicate
			if (this.editNum > 0) {
				if (counter === this.editList[this.editNum - 1].gen && this.currentEdit.length === 0) {
					wasChange = false;
				} else {
					wasChange = true;
				}
			}
	
			// check if there was a change
			if (wasChange) {
				// if this is the first record at this generation then insert a generation record
				if (this.editNum > 0 && this.editList[this.editNum - 1].gen !== counter && this.currentEdit.length !== 0) {
					this.editList[this.editNum] = {gen: counter, cells: []};
					this.undoList[this.editNum] = {gen: counter, cells: []}; 
					this.editNum += 1;
				}
				// create new edit and undo record
				this.editList[this.editNum] = {gen: counter, cells: this.currentEdit.slice()};
				this.undoList[this.editNum] = {gen: counter, cells: this.currentUndo.slice()};
				this.editNum += 1;
				this.numEdits = this.editNum;
		
				// clear current edit and undo records
				this.currentEdit = [];
				this.currentUndo = [];
			}
		}
	};

	// undo edit
	View.prototype.undo = function(me) {
		var gen = 0,
			counter = me.engine.counter,
			current = me.editNum,
			record = null;

		// do nothing if step back disabled
		if (!me.noHistory) {
			// check for top of the stack
			if (current === me.numEdits && current > 0) {
				me.afterEdit();
				current = me.editNum;
			}
	
			// check for undo records
			if (current > 0) {
				// pop the top record
				record = me.undoList[current - 1];
				gen = record.gen;
				if (record.cells.length === 0) {
					if (current > 1) {
						gen = me.undoList[current - 2].gen;
					}
				}
	
				// if it is for an earlier generation then go there
				if (gen < counter) {
					if (gen === 0) {
						me.reset(me);
					} else {
						me.runTo(gen);
					}
				}
	
				// paste cells in reverse order
				me.pasteRaw(record, true);
	
				// decrement stack using saved value since a record may have been added above
				me.editNum = current - 1;
			} else {
				if (counter > 0) {
					me.reset(me);
				}
			}
		}
	};

	// redo edit
	View.prototype.redo = function(me) {
		var counter = me.engine.counter;

		// do nothing if step back disabled
		if (!me.noHistory) {
			if (me.editNum < me.numEdits) {
				if (me.editList[me.editNum].gen === counter && me.editList[me.editNum].cells.length === 0) {
					me.editNum += 1;
				}
				if (me.editList[me.editNum].gen > counter) {
					me.runTo(me.editList[me.editNum].gen);
				} else {
					// paste cells in forward order
					me.pasteRaw(me.editList[me.editNum], true);
				}
				me.editNum += 1;
			}
		}
	};

	// convert rle to cell list
	View.prototype.rleToCellList = function(rle, x, y, transform) {
		var cells = [],
			i = 0,
			j = 0,
			state = 0,
			states = this.engine.multiNumStates,
			trans = this.transforms[transform],
			axx = trans[0],
			axy = trans[1],
			ayx = trans[2],
			ayy = trans[3],
			pattern = new Pattern("rleToCellList"),
			patternRow = null,
			invertForGenerations = (states > 2 && !this.engine.isNone);

		// check the RLE is valid
		rle += " ";
		if (PatternManager.decodeRLEString(pattern, rle, false, this.engine.allocator) !== -1) {
			if (PatternManager.decodeRLEString(pattern, rle, true, this.engine.allocator) !== -1) {
				// convert to cell list
				for (j = 0; j < pattern.height; j += 1) {
					patternRow = pattern.multiStateMap[j];
					for (i = 0; i < pattern.width; i += 1) {
						state = patternRow[i];
						if (state > 0) {
							// invert state if Generations
							if (invertForGenerations) {
								state = states - state;
							}
							// create (x, y, state) entry in cells array
							cells[cells.length] = x + i * axx + j * axy;
							cells[cells.length] = y + i * ayx + j * ayy;
							cells[cells.length] = state;
						}
					}
				}
			}
		} else {
			cells[0] = "error";
		}

		// return the cell list
		return cells;
	};

	// get evolution count from name
	View.prototype.getEvolution = function(name) {
		var result = 0,
			i = name.indexOf("["),
			j = name.indexOf("]"),
		    asciiZero = String("0").charCodeAt(0),
			next = 0;

		// check if there is a trailing number in []
		if (i !== -1) {
			if (j !== -1 && i < j && j === name.length - 1) {
				i += 1;
				while (i < j && result >= 0) {
					next = name.charCodeAt(i) - asciiZero;
					if (next < 0 || next > 9) {
						result = -1;
					} else {
						result = result * 10 + next; 
						i += 1;
					}
				}
				// mark for evolution processing if evolution found
				if (result > 0) {
					this.isEvolution = true;
				}
			}
		}

		return result;
	};

	// compute needed width to include paste snippets for grid sizing
	View.prototype.computeNeededWidth = function(neededWidth) {
		var pasteLeft = (this.pasteLeftX < 0 ? -this.pasteLeftX : this.pasteLeftX),
			pasteRight = (this.pasteRightX < 0 ? -this.pasteRightX : this.pasteRightX),
			pasteMax = (pasteLeft < pasteRight ? pasteRight : pasteLeft) * 2;
			
		if (neededWidth < pasteMax) {
			neededWidth = pasteMax;
		}
		
		return neededWidth;
	};

	// compute needed height to include paste snippets for grid sizing
	View.prototype.computeNeededHeight = function(neededHeight) {
		var pasteBottom = (this.pasteBottomY < 0 ? -this.pasteBottomY : this.pasteBottomY),
			pasteTop = (this.pasteTopY < 0 ? -this.pasteTopY : this.pasteTopY),
			pasteMax = (pasteBottom < pasteTop ? pasteTop : pasteBottom) * 2;
			
		if (neededHeight < pasteMax) {
			neededHeight = pasteMax;
		}
		
		return neededHeight;
	};

	// add existing recipe to delta array
	View.prototype.addRecipe = function(name, deltaList) {
		var i = 0,
			found = false,
			deltas = null;

		// lookup the recipe
		i =  0;
		while (!found && i < this.recipeList.length) {
			if (name === this.recipeList[i].name) {
				found = true;
			} else {
				i += 1;
			}
		}

		// check if found
		if (found) {
			// copy deltas from recipe to end of list
			deltas = this.recipeList[i].deltas;
			for (i = 0; i < deltas.length; i += 1) {
				deltaList[deltaList.length] = deltas[i];
			}
		}

		// return whether found
		return found;
	};

	// add recipe to named list
	View.prototype.addNamedRecipe = function(scriptErrors, name, deltaList) {
		var i = 0,
			found = false,
			deltas = [];

		// check the name is not a reserved word
		if (ScriptParser.isScriptCommand(name)) {
			scriptErrors[scriptErrors.length] = [Keywords.recipeWord + " " + name, "name is reserved word"];
		} else {
			// check the name does not already exist
			i =  0;
			while (!found && i < this.recipeList.length) {
				if (name === this.recipeList[i].name) {
					found = true;
				} else {
					i += 1;
				}
			}
			if (found) {
				scriptErrors[scriptErrors.length] = [Keywords.recipeWord + " " + name, "name already defined"];
			} else {
				// check each delta is > 0
				found = false;
				i = 0;
				while (!found && i < deltaList.length) {
					if (deltaList[i] < 1) {
						found = true;
					} else {
						i += 1;
					}
				}
				if (found) {
					scriptErrors[scriptErrors.length] = [Keywords.recipeWord + " " + name + " " + deltaList[i], "invalid delta"];
				} else {
					// add to name list
					deltas = deltaList.slice();
					this.recipeList[this.recipeList.length] = {name: name, deltas: deltas};
				}
			}
		}
	};

	// add rle to named list
	View.prototype.addNamedRLE = function(scriptErrors, name, rle, x, y, transform) {
		// attempt to decode the rle
		var i= 0,
			found = false,
			cells = [];
		
		// check the name is not a reserved word
		if (ScriptParser.isScriptCommand(name)) {
			scriptErrors[scriptErrors.length] = [Keywords.rleWord + " " + name, "name is reserved word"];
		} else {
			// check the name does not include an evolution
			if (name.indexOf("[") !== -1) {
				scriptErrors[scriptErrors.length] = [Keywords.rleWord + " " + name, "name can not contain ["];
			} else {
				// check the name does not already exist
				i = 0;
				while (!found && i < this.rleList.length) {
					if (name === this.rleList[i].name) {
						found = true;
					} else {
						i += 1;
					}
				}
				if (found) {
					scriptErrors[scriptErrors.length] = [Keywords.rleWord + " " + name, "name already defined"];
				} else {
					// check the RLE is valid
					cells = this.rleToCellList(rle, x, y, transform);
					if (cells[0] !== "error") {
						// add to the named list
						this.rleList[this.rleList.length] = {name: name, cells: cells}
					} else {
						scriptErrors[scriptErrors.length] = [Keywords.rleWord + " " + name, "invalid RLE"];
					}
				}
			}
		}
	};

	// add rle to paste list
	View.prototype.addRLE = function(gen, end, deltaList, every, mode, rle, x, y, transform) {
		var i = 0,
			found = false,
			cells = [],
			cellx = 0,
			celly = 0,
			trans = this.transforms[transform],
			axx = trans[0],
			axy = trans[1],
			ayx = trans[2],
			ayy = trans[3],
			leftX = ViewConstants.bigInteger,
			rightX = -ViewConstants.bigInteger,
			bottomY = ViewConstants.bigInteger,
			topY = -ViewConstants.bigInteger,
			evolveIndex = rle.indexOf("["),
			namePrefix = rle,
			evolution = 0,
			genList = [],
			stateMap = null;

		// check for evolution
		if (evolveIndex !== -1) {
			// remove the evolution postfix
			namePrefix = rle.substr(0, evolveIndex);

			// get the number of evolution generations
			evolution = this.getEvolution(rle);
		}

		// check if the rle is a name
		while (i < this.rleList.length && !found) {
			if (this.rleList[i].name === namePrefix) {
				found = true;
				// make a copy of the cell list
				cells = this.rleList[i].cells.slice();
			} else {
				i += 1;
			}
		}

		// if found then apply the x, y offset and transformation to the cell list
		if (found) {
			i = 0;
			while (i < cells.length) {
				cellx = cells[i];
				celly = cells[i + 1];
				cells[i] = x + cellx * axx + celly * axy;
				cells[i + 1] = y + cellx * ayx + celly * ayy;
				i += 3;
			}
		} else {
			// if not found then attempt to decode the rle
			cells = this.rleToCellList(rle, x, y, transform);
			if (cells[0] !== "error") {
				found = true;
			}
		}

		// check if evolution was valid
		if (evolution === -1) {
			found = false;
		}

		// save entry if valid
		if (found) {
			// compute the bounding box for the cell list
			i = 0;
			while (i < cells.length) {
				x = cells[i];
				y = cells[i + 1];
				if (x < leftX) {
					leftX = x;
				}
				if (x > rightX) {
					rightX = x;
				}
				if (y < bottomY) {
					bottomY = y;
				}
				if (y > topY) {
					topY = y;
				}
				i += 3;
			}

			// update bounding box for all paste clips
			if (x < this.pasteLeftX) {
				this.pasteLeftX = x;
			}
			if (x > this.pasteRightX) {
				this.pasteRightX = x;
			}
			if (y < this.pasteBottomY) {
				this.pasteBottomY = y;
			}
			if (y > this.pasteTopY) {
				this.pasteTopY = y;
			}

			// allocate an array for the rle
			stateMap = Array.matrix(Uint8, topY - bottomY + 1, rightX - leftX + 1, 0, this.engine.allocator, "View.rle" + this.pasteList.length);

			// populate the array from the cell list
			i = 0;
			while (i < cells.length) {
				x = cells[i];
				y = cells[i + 1];
				stateMap[y - bottomY][x - leftX] = cells[i + 2];
				i += 3;
			}

			// copy start generation into the list
			genList[0] = gen;

			// if delta list supplied then convert to absolute values
			for (i = 0; i < deltaList.length; i += 1) {
				genList[genList.length] = genList[genList.length - 1] + deltaList[i];
			}

			// create the paste entry
			this.pasteList[this.pasteList.length] = {genList: genList, end: end, every: every, mode: mode, cells: cells, map: stateMap, leftX: leftX, bottomY: bottomY, width: rightX - leftX + 1, height: topY - bottomY + 1, evolution: evolution};
			if (every > 0) {
				this.isPasteEvery = true;
			}
			if (genList[genList.length - 1] > this.maxPasteGen) {
				this.maxPasteGen = genList[genList.length - 1];
			}
		}

		return found;
	};

	// process rle snippet evolution
	View.prototype.processEvolution = function() {
		var i = 0,
			j = 0,
			x = 0,
			y = 0,
			item = null,
			state = 0,
			gens = 0,
			gridWidth = this.engine.width,
			xOff = 0,
			yOff = 0,
			minX = 0,
			minY = 0,
			zoomBox = this.engine.zoomBox,
			cells = [],
			isSimple2State = this.engine.multiNumStates <= 2 && !this.engine.isHROT && !this.engine.isLifeHistory && this.engine.boundedGridType === -1;

		// evolve rle snippets
		for (j = 0; j < this.pasteList.length; j += 1) {
			item = this.pasteList[j];
			gens = item.evolution;
			if (gens > 0) {
				// get the cell list
				cells = item.cells;
				xOff = (gridWidth >> 1) - (item.width >> 1);
				yOff = (gridWidth >> 1) - (item.height >> 1);
				i = 0;

				// setup the bounding box to the snippet extent
				zoomBox.leftX = xOff;
				zoomBox.rightX = xOff + item.width - 1;
				zoomBox.bottomY = yOff;
				zoomBox.topY = yOff + item.height - 1;

				// put the cells from the cell list onto the grid
				this.engine.counter = 0;
				if (!isSimple2State) {
					// can use batch set
					this.engine.setStateList(cells, xOff - item.leftX, yOff - item.bottomY);
				} else {
					while (i < cells.length) {
						// cells list only contains non-zero cells
						this.engine.setState(xOff + cells[i] - item.leftX, yOff + cells[i + 1] - item.bottomY, cells[i + 2], true);
						i += 3;
					}
				}

				// now run the required number of generations
				while (gens > 0) {
					// compute next generation with no stats, history and graph disabled
					this.engine.nextGeneration(false, true, true);
					this.engine.convertToPensTile();
					gens -= 1;
				}

				// replace the pattern with the evolved pattern
				cells = [];
				i = 0;
				minX = ViewConstants.bigInteger;
				minY = ViewConstants.bigInteger;
				for (y = zoomBox.bottomY; y <= zoomBox.topY; y += 1) {
					for (x = zoomBox.leftX; x <= zoomBox.rightX; x += 1) {
						state = this.engine.getState(x, y, false);
						if (state !== 0) {
							cells[i] = x - xOff + item.leftX;
							cells[i + 1] = y - yOff + item.bottomY;
							cells[i + 2] = state;
							if (cells[i] < minX) {
								minX = cells[i];
							}
							if (cells[i + 1] < minY) {
								minY = cells[i + 1];
							}
							i += 3;
						}
					}
				}
				item.cells = cells.slice();			

				// allocate an array for the rle
				item.width = zoomBox.rightX - zoomBox.leftX + 1;
				item.height = zoomBox.topY - zoomBox.bottomY + 1;
				item.bottomY = minY;
				item.leftX = minX;
				item.map = Array.matrix(Uint8, item.height, item.width, 0, this.engine.allocator, "View.rle" + j);

				// populate the array from the cell list
				i = 0;
				while (i < cells.length) {
					x = cells[i];
					y = cells[i + 1];
					item.map[y - item.bottomY][x - item.leftX] = cells[i + 2];
					i += 3;
				}

				// clear grids
				this.engine.clearGrids(false);
			}
		}

		// clear grid if anything evolved
		if (this.isEvolution) {
			this.engine.clearGrids(false);
		}
	};

	// paste rle list to grid
	View.prototype.pasteRLEList = function() {
		var i = 0,
			j = 0,
			y = 0,
			x = 0,
			xOff = 0,
			yOff = 0,
			paste = null,
			counter = this.engine.counter,
			mode = ViewConstants.pasteModeOr,
			cells = null,
			state = 0,
			gridWidth = this.engine.width,
			needsPaste = false,
			stateMap = null,
			stateRow = null,
			isSimple2State = this.engine.multiNumStates <= 2 && !this.engine.isHROT && !this.engine.isLifeHistory && this.engine.boundedGridType === -1;

		// check each pattern to see which need to be drawn this generation
		for (j = 0; j < this.pasteList.length; j += 1) {
			paste = this.pasteList[j];
			needsPaste = false;
			// check if this pattern needs pasting
			if (paste.every !==0 && counter >= paste.genList[0] && (((counter - paste.genList[0]) % paste.every) === 0)) {
				// check for end generation
				if (!(paste.end !== -1 && counter > paste.end)) {
					needsPaste = true;
				}
			} else {
				i = 0;
				while (i < paste.genList.length && !needsPaste) {
					if (counter === paste.genList[i]) {
						needsPaste = true;
					} else {
						i += 1;
					}
				}
			}
			if (needsPaste) {
				mode = paste.mode;
				xOff = (gridWidth >> 1) - (this.patternWidth >> 1);
				yOff = (gridWidth >> 1) - (this.patternHeight >> 1);
				cells = paste.cells;
				stateMap = paste.map;
				i = 0;
				// determine paste mode
				switch (mode) {
				case ViewConstants.pasteModeOr:
					if (!isSimple2State) {
						this.engine.setStateList(cells, xOff, yOff);
					} else {
						while (i < cells.length) {
							// cells list only contains non-zero cells
							this.engine.setState(xOff + cells[i], yOff + cells[i + 1], cells[i + 2], true);
							i += 3;
						}
					}
					break;
				case ViewConstants.pasteModeCopy:
					xOff += paste.leftX;
					yOff += paste.bottomY;
					for (y = 0; y < stateMap.length; y += 1) {
						stateRow = stateMap[y];
						for (x = 0; x < stateRow.length; x += 1) {
							// set the cell
							this.engine.setState(xOff + x, yOff + y, stateRow[x], true);
						}
					}
					break;
				case ViewConstants.pasteModeXor:
					while (i < cells.length) {
						x = cells[i];
						y = cells[i + 1];
						state = this.engine.getState(xOff + x, yOff + y, false);
						// set the cell
						this.engine.setState(xOff + x, yOff + y, cells[i + 2] ^ state, false);
						i += 3;
					}
					break;
				case ViewConstants.pasteModeAnd:
					xOff += paste.leftX;
					yOff += paste.bottomY;
					for (y = 0; y < stateMap.length; y += 1) {
						stateRow = stateMap[y];
						for (x = 0; x < stateRow.length; x += 1) {
							state = this.engine.getState(xOff + x, yOff + y, false);
							// set the cell
							this.engine.setState(xOff + x, yOff + y, stateRow[x] & state, false);
						}
					}
					break;
				case ViewConstants.pasteModeNot:
					xOff += paste.leftX;
					yOff += paste.bottomY;
					for (y = 0; y < stateMap.length; y += 1) {
						stateRow = stateMap[y];
						for (x = 0; x < stateRow.length; x += 1) {
							if (stateRow[x] === 0) {
								// set the cell
								this.engine.setState(xOff + x, yOff + y, 1, true);
							}
						}
						i += 3;
					}
					break;
				}
			}
		}

		// if paste every is defined then always flag there are alive cells
		// since cells will appear in the future
		if (this.isPasteEvery || counter <= this.maxPasteGen) {
			this.engine.anythingAlive = true;
		}

		// paste any edits
		this.pasteEdits();
	};

	// paste edits
	View.prototype.pasteEdits = function() {
		var i = 0,
			counter = this.engine.counter;

		// paste any undo/redo edit records
		for (i = 0; i < this.editNum; i += 1) {
			if (this.editList[i].gen === counter) {
				this.pasteRaw(this.editList[i], false);
			}
		}
	};

	// set initial value flags to a value
	View.prototype.setInitialFlagsTo = function(value) {
		// initial value flags
		this.initialX = value;
		this.initialY = value;
		this.initialZ = value;
		this.initialAngle = value;
		this.initialDepth = value;
		this.initialLayers = value;
		this.initialTheme = value;
		this.initialStep = value;
		this.initialGps = value;
		this.initialStop = value;
		this.initialLoop = value;
	};

	// clear initial value flags
	View.prototype.clearInitialFlags = function() {
		this.setInitialFlagsTo(false);
	};

	// set initial value flags
	View.prototype.setInitialFlags = function() {
		this.setInitialFlagsTo(true);
	};

	// clear help width cache
	View.prototype.clearHelpCache = function() {
		this.helpFixedCache = [];
		this.helpVariableCache = [];
	};

	// capture screenshot and display in screenshot window
	View.prototype.captureScreenShot = function(me) {
		// capture screenshot
		var dataURL = me.offCanvas.toDataURL("image/png"),
		    shotWindow = null,
		    imageElement = null;

		// check for image tag
		imageElement = document.getElementById("screenshot");
		if (imageElement) {
			imageElement.src = dataURL;
		} else {
			// open or lookup the screenshot window
			shotWindow = window.open("", ViewConstants.screenShotTitle);

			// check if the window opened
			if (shotWindow) {
				// set the size of the window
				shotWindow.width = me.displayWidth + 20;
				shotWindow.height = me.displayHeight + 20;

				// write the image to the new window
				shotWindow.document.open();
				shotWindow.document.write('<!DOCTYPE html>\n<html>\n\t<head>\n\t\t<meta charset="UTF-8">\n\t\t<title>' + ViewConstants.screenShotTitle + '</title>\n\t</head>\n\t<body>\n\t\t<img width="' + me.displayWidth + '" height="' + me.displayHeight + '" src="' + dataURL + '" alt="' + ViewConstants.screenShotTitle + '"/>\n\t</body>\n</html>\n');
				shotWindow.document.close();

				// notify that image captured
				me.menuManager.notification.notify("Image Captured", 15, 300, 15, true);
			} else {
				// notify that image capture failed
				me.menuManager.notification.notify("Could not open Image window!", 15, ViewConstants.errorDuration, 15, true);
			}
		}
	};

	// copy pattern to grid position
	View.prototype.copyPatternTo = function(pattern) {
		var x = 0, y = 0,
		    // life grid and colour grid
		    grid = this.engine.grid16,
		    colourGrid = this.engine.colourGrid,
		    overlayGrid = this.engine.overlayGrid,

		    // lookup pattern width and height
		    width = pattern.width,
		    height = pattern.height,

		    // get x and y grid position
		    panX = this.panX,
		    panY = this.panY,

		    // width and height masks for grid
		    wm = this.engine.widthMask,
		    wm16 = this.engine.widthMask >> 4,
		    hm = this.engine.heightMask,

		    // pattern row and grid row
		    patternRow = null,
		    gridRow = null,
		    multiStateRow = null,
		    colourGridRow = null,
		    overlayGridRow = null,

		    // state number
		    state = 0,

		    // pattern copy range
		    copyWidth = width,
		    copyHeight = height,

		    // bounded grid range
		    bLeftX = Math.round(-this.engine.boundedGridWidth / 2),
		    bRightX = Math.floor((this.engine.boundedGridWidth - 1) / 2),
		    bBottomY = Math.round(-this.engine.boundedGridHeight / 2),
		    bTopY = Math.floor((this.engine.boundedGridHeight - 1) / 2),

		    // pattern destination
		    dLeftX = panX - (this.engine.width >> 1),
		    dRightX = dLeftX + width - 1,
		    dBottomY = panY - (this.engine.height >> 1),
			dTopY = dBottomY + height - 1,
			
			// number of pattern states
			numStates = this.engine.multiNumStates,

		    // whether pattern is inside bounded grid
			inside = true,
			
			// whether pattern is 2-state HROT
			isTwoStateHROT = (numStates === 2 && this.engine.isHROT);

		// check for bounded grid
		if (this.engine.boundedGridType !== -1) {
			// check if pattern is inside bounded grid
			if (this.engine.boundedGridWidth !== 0) {
				if (dLeftX < bLeftX || dRightX > bRightX) {
					inside = false;
				}
			}
			if (this.engine.boundedGridHeight !== 0) {
				if (dBottomY < bBottomY || dTopY > bTopY) {
					inside = false;
				}
			}
			if (!inside) {
				// mark pattern as clipped
				this.wasClipped = true;

				// check for infinite width
				if (this.engine.boundedGridWidth !== 0) {
					panX = Math.round(this.engine.width / 2) + bLeftX;
					if (copyWidth > bRightX - bLeftX + 1) {
						copyWidth = bRightX - bLeftX + 1;
					}
				} else {
					panX = Math.round(this.engine.width / 2);
				}
				// check for infinite height
				if (this.engine.boundedGridHeight !== 0) {
					panY = Math.round(this.engine.height / 2) + bBottomY;
					if (copyHeight > bTopY - bBottomY + 1) {
						copyHeight = bTopY - bBottomY + 1;
					}
				} else {
					panY = Math.round(this.engine.height / 2);
				}
			}
		}

		// triangular patterns must be on even cell boundaries
		if (pattern.isTriangular) {
			if ((panX & 1) !== 0) {
				panX += 1;
			}
			if ((panY & 1) !== 0) {
				panY += 1;
			}
		}

		// update the life grid
		for (y = 0; y < copyHeight; y += 1) {
			patternRow = pattern.lifeMap[y];
			gridRow = grid[(y + panY) & hm];

			// check for multi-state view
			if (this.multiStateView) {
				multiStateRow = pattern.multiStateMap[y];
				colourGridRow = colourGrid[(y + panY) & hm];

				// copy colour cells
				for (x = 0; x < copyWidth; x += 1) {
					colourGridRow[(x + panX) & wm] = multiStateRow[x];
				}
			} else {
				// check for multi-state pattern
				if (numStates > 2) {
					multiStateRow = pattern.multiStateMap[y];
					colourGridRow = colourGrid[(y + panY) & hm];

					// copy colour cells
					for (x = 0; x < copyWidth; x += 1) {
						// reverse order for rendering unless "none" rule is used
						state = multiStateRow[x];
						if (state > 0 && !this.engine.isNone) {
							state = numStates + this.historyStates - state;
						}
						colourGridRow[(x + panX) & wm] = state;
					}
				}
			}

			// copy 2-state cells
			if (isTwoStateHROT) {
				colourGridRow = colourGrid[(y + panY) & hm];
			}
			for (x = 0; x < copyWidth; x += 1) {
				if ((patternRow[x >> 4] & (1 << (~x & 15))) !== 0) {
					gridRow[((x + panX) >> 4) & wm16] |= 1 << (~(x + panX) & 15);
					if (isTwoStateHROT) {
						colourGridRow[(x + panX) & wm] = LifeConstants.aliveStart;
					}
				}
			}
		}

		// copy [R]History states to the overlay grid if required
		if (overlayGrid) {
			for (y = 0; y < copyHeight; y += 1) {
				multiStateRow = pattern.multiStateMap[y];
				overlayGridRow = overlayGrid[(y + panY) & hm];

				// copy states
				for (x = 0; x < copyWidth; x += 1) {
					// get the next state
					state = multiStateRow[x];
					if (state) {
						// copy to the overlay grid and convert into ascending importance order
						overlayGridRow[(x + panX) & wm] = ViewConstants.stateMap[state] + 128;
					}
				}
			}
		}
	};

	// whether grid is finitely bounded
	View.prototype.finitelyBounded = function() {
		var result = false;

		// check for a bounded grid with non-zero (not infinite) width or height
		if (this.engine.boundedGridType !== -1 && this.engine.boundedGridWidth !== 0 && this.engine.boundedGridHeight !== 0) {
			result = true;
		}

		return result;
	};

	// whether grid is infinitely bounded
	View.prototype.infinitelyBounded = function() {
		var result = false;

		// check for a bounded grid with a zero (infinite) width or height
		if (this.engine.boundedGridType !== -1 && (this.engine.boundedGridWidth === 0 || this.engine.boundedGridHeight === 0)) {
			result = true;
		}

		return result;
	};

	// opacity range
	View.prototype.viewOpacityRange = function(newValue, change, me) {
		var result = newValue[0];

		// check if changing
		if (change) {
			me.popGraphOpacity = result;
		}

		return [result, result * 100];
	};

	// states range
	View.prototype.viewStatesRange = function(newValue, change, me) {
		var result = newValue;

		// check if changing
		if (change) {
			me.startState = ((me.engine.multiNumStates - me.maxDisplayStates) * newValue[0]) | 0;
		}
		result[1] = me.startState + "-" + (me.startState + me.maxDisplayStates - 1);

		return result;
	};

	// zoom range
	View.prototype.viewZoomRange = function(newValue, change, me) {
		var result = newValue[0],
		    displayValue = 0;

		// check if changing
		if (change) {
			// mark manual change happened
			me.manualChange = true;

			// convert the range into a zoom value
			me.engine.zoom = ViewConstants.minZoom * Math.pow(ViewConstants.maxZoom / ViewConstants.minZoom, newValue[0]) / me.engine.originZ;
		} else {
			// convert the zoom value into a range
			result = Math.log(me.engine.zoom * me.engine.originZ / ViewConstants.minZoom) / Math.log(ViewConstants.maxZoom / ViewConstants.minZoom);

			// ensure the result is in range
			if (result < 0) {
				result = 0;
			} else {
				if (result > 1) {
					result = 1;
				}
			}
		}

		// work out the display value using the origin
		if (this.trackDefined && !this.trackDisabled) {
			displayValue = me.engine.zoom * me.engine.originZ;
		} else {
			displayValue = me.engine.zoom;
		}

		// ensure in range
		if (displayValue < ViewConstants.minZoom) {
			displayValue = ViewConstants.minZoom;
		} else {
			if (displayValue > ViewConstants.maxZoom) {
				displayValue = ViewConstants.maxZoom;
			}
		}

		// show zooms < 1 as negative zooms
		if (displayValue < 1) {
			displayValue = -1 / displayValue;
		}

		// return the zoom
		return [result, displayValue];
	};

	// convert to minutes and seconds
	View.prototype.asTime = function(milliseconds) {
		var minutes = (milliseconds / 60000) | 0,
		    seconds = (milliseconds % 60000) / 1000,
		    result = "";

		// check if there are any minutes
		if (minutes > 0) {
			// add the minutes
			result = minutes + ":";

			// check whether seconds needs padding with leading zero
			if (seconds < 10) {
				result += "0";
			}
		}

		// add the seconds
		result += seconds.toFixed(2);

		return result;
	};

	// fit zoom to display width and height
	View.prototype.fitZoomDisplay = function(immediate, smooth) {
		// get the x, y and zoom that fits the pattern on the display
		var fitZoom = 0,

		    // remember the original x, y and zoom
		    origZoom = this.engine.zoom,
		    origX = this.engine.xOff,
		    origY = this.engine.yOff,

		    // deltas
		    zoomDelta = 0,
		    xDelta = 0,
		    yDelta = 0,

		    // sum weight
		    weight = this.autoFitWeight;

		// check for thumbnail
		if (this.thumbnail) {
			fitZoom = this.engine.fitZoomDisplay(this.floatCounter, this.displayWidth * this.thumbnailDivisor, this.displayHeight * this.thumbnailDivisor, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor, this.patternWidth, this.patternHeight, this.viewOnly && this.multiStateView, this.historyFit, this.trackDefined, this.trackBoxN, this.trackBoxE, this.trackBoxS, this.trackBoxW, this.genSpeed, this.state1Fit, this.autoFit);
			fitZoom[0] /= this.thumbnailDivisor;
		} else {
			var heightAdjust = ViewConstants.guiExtraHeight;
			if (this.noGUI) {
				heightAdjust = 0;
			}
			fitZoom = this.engine.fitZoomDisplay(this.floatCounter, this.displayWidth, this.displayHeight - heightAdjust, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor, this.patternWidth, this.patternHeight, this.viewOnly && this.multiStateView, this.historyFit, this.trackDefined, this.trackBoxN, this.trackBoxE, this.trackBoxS, this.trackBoxW, this.genSpeed, this.state1Fit, this.autoFit);
		}

		// check for auto fit
		if (this.autoFit && !immediate) {
			// reduce the weight at high zooms
			if (this.engine.zoom > 24) {
				weight = 3;
			}
			if (this.gensPerStep > 1) {
				weight = 1;
			}
			// glide to target zoom
			this.engine.zoom = (this.engine.zoom * (weight - 1) + fitZoom[0]) / weight;
			this.engine.xOff = (this.engine.xOff * (weight - 1) + fitZoom[1]) / weight;
			this.engine.yOff = (this.engine.yOff * (weight - 1) + fitZoom[2]) / weight;

			// compute the zoom delta
			if (this.engine.zoom > origZoom) {
				zoomDelta = (this.engine.zoom / origZoom) - 1;
			} else {
				zoomDelta = (origZoom / this.engine.zoom) - 1;
			}

			// compute the x delta
			if (this.engine.xOff > origX) {
				xDelta = this.engine.xOff - origX;
			} else {
				xDelta = origX - this.engine.xOff;
			}

			// compute the y delta
			if (this.engine.yOff > origY) {
				yDelta = this.engine.yOff - origY;
			} else {
				yDelta = origY - this.engine.yOff;
			}

			// find the maximum delta
			this.autoFitDelta = zoomDelta;
			if (xDelta > this.autoFitDelta) {
				this.autoFitDelta = xDelta;
			}
			if (yDelta > this.autoFitDelta) {
				this.autoFitDelta = yDelta;
			}

			// if delta is less than the threshold then switch to the target zoom
			if (this.autoFitDelta <= this.autoFitThreshold) {
				this.engine.zoom = fitZoom[0];
				this.engine.xOff = fitZoom[1];
				this.engine.yOff = fitZoom[2];
			}
		} else {
			// save start point
			this.startXPOI = this.engine.width / 2 - this.engine.xOff;
			this.startYPOI = this.engine.height / 2 - this.engine.yOff;
			this.startZoomPOI = this.engine.zoom;
			this.startAnglePOI = this.engine.angle;

			// save end point
			this.endXPOI = this.engine.width / 2 - fitZoom[1];
			this.endYPOI = this.engine.height / 2 - fitZoom[2];
			this.endZoomPOI = fitZoom[0];
			this.endAnglePOI = this.startAnglePOI;

			// reset step number for transition
			this.targetPOI = WaypointConstants.poiDefaultSpeed;
			if (smooth) {
				this.stepsPOI = 0;
			} else {
				this.stepsPOI = WaypointConstants.poiDefaultSpeed;
				this.updateCameraPOI();
			}
		}

		// update zoom control if available
		if (this.zoomItem) {
			this.zoomItem.current = this.viewZoomRange([this.engine.zoom, this.engine.zoom], false, this);
		}

		// update angle control if available
		if (this.angleItem) {
			this.angleItem.current = this.viewAngleRange([this.engine.angle, this.engine.angle], false, this);
		}
	};
	
	// copy pattern pan X and Y
	View.prototype.computePanXY = function(width, height) {
		// check for bounded grid with CXRLE Pos
		if (this.engine.boundedGridType !== -1 && this.posDefined) {
			this.panX = (this.engine.width >> 1) + this.xOffset;
			this.panY = (this.engine.height >> 1) + this.yOffset;
		} else {
			// compute position to center pattern on display and add the x and y offsets
			this.panX = Math.round((this.engine.width - width) / 2) + this.xOffset;
			this.panY = Math.round((this.engine.height - height) / 2) + this.yOffset;
		}

		// check for view only and multi-state pattern
		if ((this.viewOnly || !this.engine.isLifeHistory) && PatternManager.extendedFormat) {
			// center multi-state pattern on display
			this.multiStateView = true;
			this.viewOnly = true;
		}
	};

	// shorten a number to M or K
	View.prototype.shortenNumber = function(value) {
		var result = value + String();

		// check for huge number
		if (value >= 1000000000) {
			result = "1B+";
		} else {
			// check for hundreds of millions
			if (value >= 100000000) {
				result = ((value / 1000000) | 0) + "M";
			} else {
				// check for tens of millions
				if (value >= 10000000) {
					result = Number(value / 1000000).toFixed(1) + "M";
				} else {
					// check for millions
					if (value >= 1000000) {
						result = Number(value / 1000000).toFixed(2) + "M";
					} else {
						// check for one hundred thousand
						if (value >= 100000) {
							result = ((value / 1000) | 0) + "K";
						}
					}
				}
			}
		}

		// return the result as a string
		return result;
	};

	// adjust zoom position
	View.prototype.adjustZoomPosition = function(currentZoom, zoomDelta) {
		// get the cursor position on the screen
		var x = this.menuManager.mouseLastX,
		    y = this.menuManager.mouseLastY,
		    newX = 0,
		    newY = 0,

		    // compute new zoom
		    newZoom = currentZoom + zoomDelta,

		    // get current angle and compute sin and cos
		    angle = -this.engine.angle,
		    sinAngle = Math.sin(angle / 180 * Math.PI),
		    cosAngle = Math.cos(angle / 180 * Math.PI),
		    dx = 0,
		    dy = 0;

		// check new zoom is in range
		if (newZoom < 0) {
			newZoom = 0;
		} else {
			if (newZoom > 1) {
				newZoom = 1;
			}
		}

		// convert zooms to actual zoom
		currentZoom = ViewConstants.minZoom * Math.pow(ViewConstants.maxZoom / ViewConstants.minZoom, currentZoom);
		newZoom = ViewConstants.minZoom * Math.pow(ViewConstants.maxZoom / ViewConstants.minZoom, newZoom);

		// ensure the new zoom is in range
		if (newZoom < ViewConstants.minZoom) {
			newZoom = ViewConstants.minZoom;
		} else {
			if (newZoom > ViewConstants.maxZoom) {
				newZoom = ViewConstants.maxZoom;
			}
		}

		// compute as an offset from the centre
		x -= this.displayWidth / 2;
		y -= this.displayHeight / 2;

		// compute position based on new zoom
		newX = x * (newZoom / currentZoom);
		newY = y * (newZoom / currentZoom);

		// compute dx and dy
		dx = (x - newX) / newZoom;
		dy = (y - newY) / newZoom;

		// apply pan
		this.engine.xOff -= dx * cosAngle + dy * (-sinAngle);
		this.engine.yOff -= dx * sinAngle + dy * cosAngle;

		// apply zoom
		newZoom = Math.log(newZoom / ViewConstants.minZoom) / Math.log(ViewConstants.maxZoom / ViewConstants.minZoom);
		this.zoomItem.current = this.viewZoomRange([newZoom, newZoom], true, this);
	};

	// update progress bar for copy RLE
	View.prototype.updateProgressBarCopy = function(me) {
		// update the progress bar
		me.progressBar.current = 100 * (me.tempRLEAmount / me.tempRLELength);

		// show the progress bar
		me.progressBar.deleted = false;

		// clear the bg alpha to show the progress bar
		me.genToggle.bgAlpha = 0;
	};

	// update progress bar for history computation
	View.prototype.updateProgressBarHistory = function(me, targetGen) {
		// update the progress bar
		me.progressBar.current = 100 * (me.engine.counter / targetGen);

		// show the progress bar
		me.progressBar.deleted = false;

		// clear the bg alpha to show the progress bar
		me.genToggle.bgAlpha = 0;
	};

	// update progress bar
	View.prototype.updateProgressBar = function(me) {
		var isLooping = false,
		    waypointsRunning = false,
		    journey = 0,
		    progress = 0,
		    isDeleted = false;

		// check if looping
		if (!me.loopDisabled && me.loopGeneration !== -1) {
			isLooping = true;
		}

		// check if waypoint playback on
		if (!me.waypointsDisabled && me.waypointsDefined) {
			waypointsRunning = true;
		}

		// show progress bar if looping and/or waypoints on
		if (isLooping || waypointsRunning) {
			isDeleted = false;

			// determine the caption based on mode
			if (waypointsRunning && isLooping) {
				// set progress based on time to generation
				progress = me.elapsedTime / me.waypointManager.elapsedTimeTo(me.loopGeneration);
			} else {
				if (waypointsRunning) {
					// set progress based on elapsed time to final waypoint
					journey = me.waypointManager.lastWaypoint().targetTime;
					if (journey) {
						progress = me.elapsedTime / journey;
						if (progress > 1) {
							// hide progress bar
							isDeleted = true;
						}
					}
				} else {
					// set progress based on generation
					if (me.loopGeneration > 0) {
						progress = me.engine.counter / me.loopGeneration;
					}
				}
			}

			// ensure progress is not greater than 100%
			if (progress > 1) {
				progress = 1;
			}

			// update the progress bar
			me.progressBar.current = 100 * progress;
		} else {
			// hide progress bar
			isDeleted = true;
		}

		// show or hide the progress bar
		me.progressBar.deleted = isDeleted;
		if (isDeleted) {
			// set the bg alpha from the parent menu
			me.genToggle.bgAlpha = me.viewMenu.bgAlpha;
		} else {
			// clear the bg alpha to show the progress bar
			me.genToggle.bgAlpha = 0;
		}
	};

	// draw stars
	View.prototype.drawStars = function() {
		var displayWidth = this.engine.displayWidth,
		    displayHeight = this.engine.displayHeight,
		    data32 = this.engine.data32;

		// draw the starfield
		this.starField.create2D(this.engine.width / 2 - this.engine.camXOff, this.engine.height / 2 - this.engine.camYOff, this.engine.camZoom, this.engine.camAngle, displayWidth, displayHeight, data32, this.engine.pixelColours[0]);
	};

	// read a single cell
	View.prototype.readCell = function() {
		// position relative to display width and height
		var displayX = this.viewMenu.mouseX - this.displayWidth / 2,
		    displayY = this.viewMenu.mouseY - this.displayHeight / 2,

		    // engine camera x and y
		    engineY = this.panY - this.engine.yOff,
		    engineX = this.panX - this.engine.xOff - (this.engine.isHex ? this.engine.yOff / 2 : 0),

		    // cell position
		    yPos = 0, xPos = 0,
			yFrac = 0, xFrac = 0,
		    
			// rotation
			theta = 0, radius = 0,

			// x and y zoom
			xZoom = this.engine.zoom,
			yZoom = this.engine.zoom * ((this.engine.isTriangular && xZoom >= 4) ? ViewConstants.sqrt3 : 1),

			// cell state
			state = -1;

		// check if there are mouse coordinates
		if (this.viewMenu.mouseX !== -1) {
			// apply rotation to the display position
			if (this.engine.camAngle !== 0) {
				radius = Math.sqrt((displayX * displayX) + (displayY * displayY));
				theta = Math.atan2(displayY, displayX) * (180 / Math.PI);
				theta -= this.engine.camAngle;
				displayX = radius * Math.cos(theta * (Math.PI / 180));
				displayY = radius * Math.sin(theta * (Math.PI / 180));
			}

			// compute the x and y cell coordinate
			yPos = displayY / yZoom - engineY + this.engine.originY;
			xPos = (displayX / xZoom) + (this.engine.isHex ? (engineY / 2) + (yPos / 2) : 0) - engineX + this.engine.originX;
			if (this.engine.isTriangular) {
				xPos -= (0.2 * (this.engine.zoom / 32));
			}
			xFrac = xPos - Math.floor(xPos);
			yFrac = yPos - Math.floor(yPos);
			xPos -= xFrac;
			yPos -= yFrac;

			// adjust for triangular grid
			if (this.engine.isTriangular) {
				if (((xPos + this.panX + yPos + this.panY) & 1) === 0) {
					// triangle pointing down
					if (xFrac + yFrac > 1) {
						xPos += 1;
					}
				} else {
					// triangle pointing up
					if ((1 - xFrac) + yFrac < 1) {
						xPos += 1;
					}
				}
			}

			// draw the cell
			state = this.engine.getState(xPos + this.panX, yPos + this.panY, this.multiStateView && this.viewOnly);
		}

		// return the cell state
		return state;
	};

	// cell cell location
	View.prototype.updateCellLocation = function(mouseX, mouseY) {
		// position relative to display width and height
		var displayX = mouseX - this.displayWidth / 2,
		    displayY = mouseY - this.displayHeight / 2,

		    // engine camera x and y
		    engineY = this.panY - this.engine.yOff,
		    engineX = this.panX - this.engine.xOff - (this.engine.isHex ? this.engine.yOff / 2 : 0),

		    // cell position
			yPos = 0, xPos = 0,
			yFrac = 0, xFrac = 0,
		    
			// x and y zoom
			xZoom = this.engine.zoom,
			yZoom = this.engine.zoom * ((this.engine.isTriangular && xZoom >= 4) ? ViewConstants.sqrt3 : 1),

			// rotation
			theta = 0, radius = 0;

		// check if there are mouse coordinates
		if (mouseX !== -1) {
			// apply rotation to the display position
			if (this.engine.camAngle !== 0) {
				radius = Math.sqrt((displayX * displayX) + (displayY * displayY));
				theta = Math.atan2(displayY, displayX) * (180 / Math.PI);
				theta -= this.engine.camAngle;
				displayX = radius * Math.cos(theta * (Math.PI / 180));
				displayY = radius * Math.sin(theta * (Math.PI / 180));
			}

			// compute the x and y cell coordinate
			yPos = displayY / yZoom - engineY + this.engine.originY;
			xPos = (displayX / xZoom) + (this.engine.isHex ? (engineY / 2) + (yPos / 2) : 0) - engineX + this.engine.originX;
			if (this.engine.isTriangular) {
				xPos -= (0.2 * (this.engine.zoom / 32));
			}
			xFrac = xPos - Math.floor(xPos);
			yFrac = yPos - Math.floor(yPos);
			xPos -= xFrac;
			yPos -= yFrac;
		}

		// adjust for triangular grid
		if (this.engine.isTriangular) {
			if (((xPos + this.panX + yPos + this.panY) & 1) === 0) {
				// triangle pointing down
				if (xFrac + yFrac > 1) {
					xPos += 1;
				}
			} else {
				// triangle pointing up
				if ((1 - xFrac) + yFrac < 1) {
					xPos += 1;
				}
			}
		}
		
		// set cell position
		this.cellX = xPos + this.panX;
		this.cellY = yPos + this.panY;
	};

	// draw a line of cells using Bresenham
	View.prototype.drawCellLine = function(startX, startY, endX, endY, colour) {
		var dx = Math.abs(endX - startX),
		    dy = Math.abs(endY - startY),
		    sx = (startX < endX) ? 1 : -1,
		    sy = (startY < endY) ? 1 : -1,
		    err = dx - dy,
			e2 = 0,
			width = this.engine.width,
			// whether LifeHistory state6 changed
			result = 0;

		// set the first point
		result |= this.setStateWithUndo(startX, startY, colour, true);

		// check for grid growth
		while (width !== this.engine.width) {
			startX += width >> 1;
			startY += width >> 1;
			endX += width >> 1;
			endY += width >> 1;
			width <<= 1;
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
			result |= this.setStateWithUndo(startX, startY, colour, true);

			// check for grid growth
			while (width !== this.engine.width) {
				startX += width >> 1;
				startY += width >> 1;
				endX += width >> 1;
				endY += width >> 1;
				width <<= 1;
			}
		}

		// return whether LifeHistory state6 changed
		return result;
	};

	// update step label
	View.prototype.updateStepLabel = function(stepsTaken) {
		var i = 0,
			total = 0;

		// add the sample to the array
		this.stepSamples[this.stepIndex] = stepsTaken;
		this.stepIndex += 1;
		if (this.stepIndex >= ViewConstants.numStepSamples) {
			this.stepIndex = 0;
		}

		// compute the average
		for (i = 0; i < this.stepSamples.length; i += 1) {
			total += this.stepSamples[i];
		}
		total /= this.stepSamples.length;

		// update the label
		this.stepLabel.preText = String(Math.round(total));
		this.stepLabel.deleted = false;
	};

	// clear step samples
	View.prototype.clearStepSamples = function() {
		var i = 0;

		for (i = 0; i < this.stepSamples.length; i += 1) {
			this.stepSamples[i] = 0;
		}
		this.stepIndex = 0;
		this.stepLabel.deleted = true;
	};

	// set the x/y position on the UI
	View.prototype.setXYPosition = function() {
		// position relative to display width and height
		var displayX = this.viewMenu.mouseX - this.displayWidth / 2,
		    displayY = this.viewMenu.mouseY - this.displayHeight / 2,

		    // engine camera x and y
		    engineY = this.panY - this.engine.yOff,
		    engineX = this.panX - this.engine.xOff - (this.engine.isHex ? this.engine.yOff / 2 : 0),

			// x and y zoom
			xZoom = this.engine.zoom,
			yZoom = this.engine.zoom * ((this.engine.isTriangular && xZoom >= 4) ? ViewConstants.sqrt3 : 1),

		    // cell position
		    yPos = 0, xPos = 0,
			yFrac = 0, xFrac = 0,
		    
		    // display strings
		    xDisplay = "",
		    yDisplay = "",
			stateDisplay = "",
			
			// display limit
			displayLimit = this.engine.maxGridSize > 9999 ? 99999 : 9999,

			// rotation
			theta = 0, radius = 0;

		// check if there are mouse coordinates
		if (this.viewMenu.mouseX === -1) {
			// no coordinates to display
			this.xyLabel.preText = "";

			// delete label if generation statistics are hidden
			this.xyLabel.deleted = !this.statsOn;
		} else {
			// apply rotation to the display position
			if (this.engine.camAngle !== 0) {
				radius = Math.sqrt((displayX * displayX) + (displayY * displayY));
				theta = Math.atan2(displayY, displayX) * (180 / Math.PI);
				theta -= this.engine.camAngle;
				displayX = radius * Math.cos(theta * (Math.PI / 180));
				displayY = radius * Math.sin(theta * (Math.PI / 180));
			}

			// compute the x and y cell coordinate
			yPos = displayY / yZoom - engineY + this.engine.originY;
			xPos = (displayX / xZoom) + (this.engine.isHex ? (engineY / 2) + (yPos / 2) : 0) - engineX + this.engine.originX;
			if (this.engine.isTriangular) {
				xPos -= (0.2 * (this.engine.zoom / 32));
			}
			xFrac = xPos - Math.floor(xPos);
			yFrac = yPos - Math.floor(yPos);
			xPos -= xFrac;
			yPos -= yFrac;

			// adjust for triangular grid
			if (this.engine.isTriangular) {
				if (((xPos + this.panX + yPos + this.panY) & 1) === 0) {
					// triangle pointing down
					if (xFrac + yFrac > 1) {
						xPos += 1;
					}
				} else {
					// triangle pointing up
					if ((1 - xFrac) + yFrac < 1) {
						xPos += 1;
					}
				}
			}

			// read the state
			stateDisplay = this.engine.getState(xPos + this.panX, yPos + this.panY, this.multiStateView && this.viewOnly);

			// add the offset to display coordinates
			xPos += this.xOffset;
			yPos += this.yOffset;
			if (this.engine.boundedGridType !== -1 && !this.posDefined) {
				xPos -= Math.floor((this.specifiedWidth === -1 ? this.patternWidth : this.specifiedWidth) / 2);
				yPos -= Math.floor((this.specifiedHeight === -1 ? this.patternHeight : this.specifiedHeight) / 2);
			}

			// check the size of the coordinates
			if (xPos < -displayLimit || xPos > displayLimit) {
				xDisplay = (Number(xPos / 1000).toFixed(1)) + "K";
			} else {
				xDisplay = String(xPos);
			}
			if (yPos < -displayLimit || yPos > displayLimit) {
				yDisplay = (Number(yPos / 1000).toFixed(1)) + "K";
			} else {
				yDisplay = String(yPos);
			}

			// set the caption
			this.xyLabel.preText = xDisplay + "," + yDisplay + "=" + stateDisplay;
			this.xyLabel.deleted = false;
		}

		// set visibility based on stats toggle and whether paused
		if (this.statsOn || (!this.generationOn && this.viewMenu.mouseX !== -1)) {
			// check if help or errors displayed or no pattern loaded
			if (this.displayHelp || this.displayErrors || this.patternWidth === 0) {
				// hide the coordinates
				this.xyLabel.enabled = false;
			} else {
				// show the coordinates
				this.xyLabel.enabled = true;
			}
		} else {
			// hide the coordinates
			this.xyLabel.enabled = false;
		}
	};

	// process mouse wheel
	View.prototype.processMouseWheel = function(mouseZoom) {
		var zoomValue = 0;

		// check if GUI enabled
		if (!this.noGUI && !this.thumbnail) {
			// check if help displayed
			if (this.displayHelp > 0) {
				// scroll the help text
				if (mouseZoom > 0) {
					this.scrollHelpUp(this, 3);
				} else {
					this.scrollHelpDown(this, 3);
				}
			} else {
				if (this.displayErrors > 0) {
					// scroll the error list
					if (mouseZoom > 0) {
						this.scrollErrorsUp(this, 3);
					} else {
						this.scrollErrorsDown(this, 3);
					}
				} else {
					// update the zoom if controls not locked
					if (!this.controlsLocked) {
						zoomValue = this.zoomItem.current[0];
						if (mouseZoom < 0) {
							this.adjustZoomPosition(zoomValue, -0.05);
						} else {
							this.adjustZoomPosition(zoomValue, 0.05);
						}
					}
				}
			}
		}
	};

	// update view mode for normal processing
	View.prototype.viewAnimateNormal = function(timeSinceLastUpdate, me) {
		// get the current time and mouse wheel
		var deltaTime = 0,
		    currentTime = 0,
		    currentWaypoint = me.waypointManager.current,

		    // whether update needed
		    updateNeeded = false,

		    // whether frame budget exceeded (machine too slow)
		    tooSlow = false,

		    // whether at end of waypoints
		    waypointsEnded = false,

		    // whether bailing out of stepping
			bailout = false,
			
			// whether manual stepping (so ignore bailout)
			manualStepping = false,
			
			// how many steps to take
			stepsToTake = 1,

			// many many steps taken
			stepsTaken = 0,

			// border for growth
			borderSize = 0,

			// save died generation
			saveGeneration = 0;

		// unlock controls
		me.controlsLocked = false;

		// check if this is the first frame
		if (me.justStarted) {
			// reset flag
			me.justStarted = false;

			// zero the elapsed time to remove startup cost
			deltaTime = 0;
			timeSinceLastUpdate = 0;
		}

		// check whether to display progress bar
		if (!me.viewOnly) {
			me.updateProgressBar(me);
		}

		// copy gens per step from control since it gets overwritten by waypoint playback
		me.gensPerStep = me.stepRange.current[0];

		// update elapsed time if not paused
		if (me.generationOn) {
			// check if actual interval is greater than frame budget
			if (timeSinceLastUpdate > ViewConstants.frameBudget) {
				// flag machine too slow
				tooSlow = true;
			}
			if (timeSinceLastUpdate > ViewConstants.sixtyHz) {
				timeSinceLastUpdate = ViewConstants.sixtyHz;
			}

			// update floating counter
			if (me.generationOn && !(me.waypointsDefined && !me.waypointsDisabled)) {
				me.originCounter += (me.gensPerStep * me.genSpeed * timeSinceLastUpdate / 1000);
				me.floatCounter += (me.genSpeed * timeSinceLastUpdate / 1000);
				if ((me.floatCounter | 0) > me.engine.counter) {
					me.floatCounter += (me.gensPerStep -1);
					me.nextStep = true;
				} else {
					// update elapsed time here (otherwise happens during next step processing below)
					me.elapsedTime += timeSinceLastUpdate;
				}
			}
		} else {
			// if paused but stepping then compute step target
			if (me.nextStep) {
				// flag that manual step is happening
				manualStepping = true;

				// advance the time to the next whole generation
				if (me.singleStep) {
					me.floatCounter = me.engine.counter + 1;
					me.originCounter = me.floatCounter;
				} else {
					me.floatCounter = me.engine.counter + me.gensPerStep;
					me.originCounter = me.floatCounter;
				}
			}
		}

		// update origin
		me.updateOrigin();

		// check if waypoints are defined and enabled
		if (me.waypointsDefined && !me.waypointsDisabled && me.generationOn) {
			// check if a manual change happened
			if (me.manualChange && !me.waypointManager.atLast(me.elapsedTime + timeSinceLastUpdate)) {
				// clear flag
				me.manualChange = false;

				// create temporary position
				me.elapsedTime = me.waypointManager.createTemporaryPosition(me.engine.width / 2 - me.engine.xOff, me.engine.height / 2 - me.engine.yOff, me.engine.zoom, me.engine.angle, me.engine.layers, me.engine.layerDepth * ViewConstants.depthScale, me.engine.colourTheme, me.genSpeed, me.gensPerStep, me.engine.counter, me.elapsedTime);
			}
			
			// check for fit zoom
			if (currentWaypoint.fitZoom) {
				// fit zoom
				me.fitZoomDisplay(true, false);

				// clear manual change flag that fit zoom will set
				me.manualChange = false;

				// copy fit zoom to current waypoint
				currentWaypoint.x = me.engine.width / 2 - me.engine.xOff;
				currentWaypoint.y = me.engine.height / 2 - me.engine.yOff;
				if (me.thumbnail) {
					me.engine.zoom *= me.thumbnailDivisor;
				}
				currentWaypoint.zoom = me.engine.zoom;
			}

			// update based on elapsed time
			waypointsEnded = me.waypointManager.update(me.elapsedTime + timeSinceLastUpdate, me.engine.counter);

			// check if waypoints ended
			if (waypointsEnded) {
				// clear fit zoom flag if set
				if (currentWaypoint.fitZoom) {
					// disable fit zoom
					currentWaypoint.fitZoom = false;

					// update zoom
					if (me.thumbnail) {
						me.engine.zoom = currentWaypoint.zoom / me.thumbnailDivisor;
					}
					if (me.zoomItem) {
						me.zoomItem.current = me.viewZoomRange([me.engine.zoom, me.engine.zoom], false, me);
					}
				}
				me.floatCounter += (me.genSpeed * timeSinceLastUpdate / 1000);
				if ((me.floatCounter | 0) > me.engine.counter) {
					me.floatCounter += (me.gensPerStep - 1);
					me.nextStep = true;
				}
			} else {
				// check whether paused
				if (me.generationOn) {
					// lock controls if playing
					me.controlsLocked = true;
				}

				// set the camera position
				me.engine.xOff = me.engine.width / 2 - currentWaypoint.x;
				me.engine.yOff = me.engine.height / 2 - currentWaypoint.y;

				// set zoom
				me.engine.zoom = currentWaypoint.zoom;

				// check for thumbnail mode
				if (me.thumbnail) {
					me.engine.zoom = me.engine.zoom / me.thumbnailDivisor;
				}

				// update the zoom control
				if (me.zoomItem) {
					me.zoomItem.current = me.viewZoomRange([me.engine.zoom, me.engine.zoom], false, me);
				}

				// set angle and update angle control
				me.engine.angle = currentWaypoint.angle;
				if (me.angleItem) {
					me.angleItem.current = [me.engine.angle, me.engine.angle];
				}

				// set layers
				me.engine.layers = currentWaypoint.layers;
				if (me.layersItem) {
					me.layersItem.current = [me.engine.layers, me.engine.layers];
				}

				// set layer depth
				me.engine.layerDepth = (currentWaypoint.depth / ViewConstants.depthScale) + ViewConstants.minDepth;
				if (me.depthItem) {
					me.depthItem.current = [Math.sqrt(me.engine.layerDepth), me.engine.layerDepth * ViewConstants.depthScale];
				}

				// set gps
				me.genSpeed = currentWaypoint.gps;
				if (me.generationRange) {
					me.generationRange.current = [Math.sqrt((currentWaypoint.gps - ViewConstants.minGenSpeed) / (ViewConstants.maxGenSpeed - ViewConstants.minGenSpeed)), me.genDisplay(currentWaypoint.gps)];
				}

				// set step
				me.gensPerStep = currentWaypoint.step;
				me.stepRange.current = [me.gensPerStep, me.gensPerStep];

				// set stars TBD
				//me.starsOn = currentWaypoint.stars;

				// set grid TBD
				//me.engine.displayGrid = currentWaypoint.grid; 

				// if waypoints not ended then work out whether to step to next generation
				if (currentWaypoint.targetGen > me.engine.counter) {
					me.nextStep = true;
					me.floatCounter = currentWaypoint.targetGen;
				} else {
					me.nextStep = false;
				}

				// check if a new waypoint message is available
				if (currentWaypoint.textMessage !== me.lastWaypointMessage) {
					// check if cancelling
					if (currentWaypoint.textMessage === "") {
						// clear message
						me.menuManager.notification.clear(false, false);
					} else {
						// draw new message
						me.menuManager.notification.notify(currentWaypoint.textMessage, 15, 1000, 15, false);
					}

					// save message
					me.lastWaypointMessage = currentWaypoint.textMessage;
				}

				// check if a new theme is available
				if (currentWaypoint.theme !== me.lastWaypointTheme) {
					// fade to new theme
					me.themeItem.current = me.viewThemeRange([currentWaypoint.theme, ""], true, me);

					// save theme
					me.lastWaypointTheme = currentWaypoint.theme;
				}
			}

			// check if stepping
			if (!me.nextStep) {
				me.elapsedTime += timeSinceLastUpdate;
			}
		} else {
			// if autofit and waypoints not defined then lock the UI controls
			if (me.autoFit && me.generationOn) {
				me.controlsLocked = true;
			}
		}

		// if controls are locked then waypoints are playing so disable any camera move
		if (me.controlsLocked) {
			// disable camera transition
			me.stepsPOI = -1;
		}

		// compute next generation if required
		deltaTime = 0;
		if (me.nextStep) {
			// check if anything is alive
			if (me.engine.anythingAlive) {
				// get current time
				currentTime = performance.now();

				// compute how many steps there are to take
				stepsToTake = (me.floatCounter | 0) - me.engine.counter;
				stepsTaken = 0;

				// check if statistics are displayed and if so compute them
				while (!bailout && (me.engine.counter < (me.floatCounter | 0))) {
					// compute time since generations started
					deltaTime = performance.now() - currentTime;

					// check for stop or delta time being too large or single step (ignore time for manual stepping)
					if (me.engine.counter === me.stopGeneration - 1 || ((deltaTime > ViewConstants.updateThreshold) && !manualStepping)) {
						// bail out of loop
						bailout = true;
					}

					// check if stats are on and this is the last generation in the step
					if (me.statsOn && ((me.engine.counter === (me.floatCounter | 0) - 1) || bailout)) {
						// compute next generation with stats
						me.engine.nextGeneration(true, me.noHistory, me.graphDisabled);
					} else {
						// just compute next generation
						me.engine.nextGeneration(false, me.noHistory, me.graphDisabled);
					}

					stepsTaken += 1;

					// check theme has history or this is the last generation in the step
					if (me.engine.themeHistory || me.pasteList.length > 0 || ((me.engine.counter === (me.floatCounter | 0)) || bailout)) {
						// convert life grid to pen colours unless Generations just died (since this will start fading dead cells)
						if (!(me.engine.anythingAlive === 0 && me.engine.multiNumStates > 2)) {
							me.engine.convertToPensTile();
							me.pasteRLEList();

							// if paste every is defined then always flag there are alive cells
							// since cells will appear in the future
							if (me.isPasteEvery || me.engine.counter <= me.maxPasteGen) {
								me.engine.anythingAlive = 1;
							}
						}
					}

					// save elasped time for this generation
					me.saveElapsedTime(timeSinceLastUpdate, stepsToTake);

					// check for loop
					if ((me.loopGeneration !== -1) && (me.engine.counter >= me.loopGeneration) && !me.loopDisabled) {
						// reset
						me.elapsedTime = 0;
						me.reset(me);

						// lock controls if waypoints ended
						if (waypointsEnded) {
							me.controlsLocked = true;
						}
					}

					// check for all cells died
					if (!me.engine.anythingAlive) {
						bailout = true;
					}
				}

				// check if life just stopped
				if (!me.engine.anythingAlive) {
					// set fade interval
					me.fading = me.historyStates + (me.engine.multiNumStates > 0 ? me.engine.multiNumStates : 0);

					// remember the generation that life stopped
					if (me.diedGeneration === -1) {
						me.diedGeneration = me.engine.counter;

						// clear the bit grids
						me.engine.clearGrids(true);

						// notify simulation stopped unless loop defined and enabled
						if (me.genNotifications && !(me.loopGeneration !== -1 && !me.loopDisabled) && !me.emptyStart) {
							me.menuManager.notification.notify("Life ended at generation " + me.diedGeneration, 15, 600, 15, true);
						}
					}
				}

				// remove steps not taken from target counter
				me.floatCounter -= (stepsToTake - stepsTaken);

				// if not enough steps taken then display actual number
				if ((stepsTaken < stepsToTake) && (me.engine.counter !== me.stopGeneration)) {
					me.updateStepLabel(stepsTaken);
				} else {
					me.clearStepSamples();
				}
			} else {
				// clear step samples
				me.clearStepSamples();

				// check if still fading
				if (me.fading) {
					// decrease fade time
					me.fading -= 1;

					// remember the current generation and set to died generation
					saveGeneration = me.engine.counter;
					me.engine.counter = me.diedGeneration;

					// update colour grid
					me.engine.convertToPensTile();

					// restore current generation
					me.engine.counter = saveGeneration;
				}

				// increment generation
				me.engine.counter += me.gensPerStep;

				// check for loop
				if ((me.loopGeneration !== -1) && (me.engine.counter >= me.loopGeneration) && !me.loopDisabled) {
					// reset
					me.elapsedTime = 0;
					me.reset(me);

					// lock controls if waypoints ended
					if (waypointsEnded) {
						me.controlsLocked = true;
					}
				}
			}

			// check for stop
			if (me.engine.counter === me.stopGeneration) {
				// stop
				me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
				if (me.genNotifications) {
					me.menuManager.notification.notify("STOP reached - Play to continue ", 15, 180, 15, true);
				}
			}
		} else {
			// clear step samples
			me.clearStepSamples();
		}

		// lock or unlock the controls
		me.autoFitToggle.locked = me.controlsLocked && me.waypointsDefined;
		me.fitButton.locked = me.controlsLocked || (me.autoFit && me.generationOn);
		me.generationRange.locked = me.controlsLocked && me.waypointsDefined;
		me.stepRange.locked = me.controlsLocked && me.waypointsDefined;
		me.themeItem.locked = me.controlsLocked && me.waypointsDefined;
		me.zoomItem.locked = me.controlsLocked;
		me.angleItem.locked = me.controlsLocked && me.waypointsDefined;
		me.layersItem.locked = me.controlsLocked && me.waypointsDefined;
		me.depthItem.locked = me.controlsLocked && me.waypointsDefined;

		// check if the mouse wheel scrolled
		if (me.wheelDelta) {
			// process mouse wheel
			me.processMouseWheel(me.wheelDelta);

			// zero wheel delta
			me.wheelDelta = 0;
		}

		// check for autofit
		if (me.autoFit && (me.generationOn || me.waypointsDefined)) {
			me.fitZoomDisplay(false, false);
		}

		// render grid
		me.engine.renderGrid();

		// draw stars if switched on
		if (me.starsOn) {
			me.drawStars();
		}

		// draw grid
		me.engine.drawGrid();

		// check if hexagons or triangles should be drawn
		if (me.engine.useHexagons && me.engine.isHex && me.engine.zoom >= 4) {
			me.engine.drawHexagons();
		} else {
			if (me.engine.isTriangular && me.engine.zoom >= 4) {
				me.engine.drawTriangles();
			}
		}

		// capture screenshot if scheduled
		if (me.screenShotScheduled) {
			// check for grid capture
			if (me.screenShotScheduled === 2) {
				// draw graph at full opacity
				me.engine.drawPopGraph(me.popGraphLines, 1, true, me.thumbnail);
			}

			// capture screen shot
			me.captureScreenShot(me);

			// check for grid capture
			if (me.screenShotScheduled === 2) {
				// restore grid
				me.engine.drawGrid();
			}

			// mark screenshot complete
			me.screenShotScheduled = 0;
		}

		// check if grid buffer needs to grow
		if (me.engine.counter && me.engine.anythingAlive) {
			borderSize = ViewConstants.maxStepSpeed;
			if (me.engine.isHROT) {
				borderSize = me.engine.HROT.range * 4 + 1;
				if (me.engine.boundedGridType !== -1) {
					borderSize += me.engine.HROT.range * 2;
				}
				if (me.engine.HROT.type === PatternManager.vonNeumannHROT) {
					if (me.engine.boundedGridType !== -1) {
						borderSize += me.engine.boundedGridHeight / 2;
					} else {
						borderSize += (me.engine.zoomBox.topY - me.engine.zoomBox.bottomY + 1) / 2;
					}
				}
				if (borderSize < ViewConstants.maxStepSpeed) {
					borderSize = ViewConstants.maxStepSpeed;
				}
			}
			if (me.engine.checkForGrowth(borderSize)) {
				// update the default x and y
				me.defaultX += me.engine.width >> 2;
				me.defaultY += me.engine.height >> 2;
				me.savedX += me.engine.width >> 2;
				me.savedY += me.engine.height >> 2;

				// check for hex mode
				if (me.engine.isHex) {
					me.defaultX -= me.engine.height >> 3;
					me.savedX -= me.engine.height >> 3;
				}

				// update pan position
				me.panX += me.engine.width >> 2;
				me.panY += me.engine.height >> 2;
			}
		}

		// draw any arrows and labels
		if (me.showLabels) {
			me.waypointManager.drawAnnotations(me);
		}

		// draw population graph if required
		if (me.popGraph) {
			me.engine.drawPopGraph(me.popGraphLines, me.popGraphOpacity, false, me.thumbnail);
		}

		// display help if requested
		if (me.displayHelp) {
			Help.drawHelpText(me);
		} else {
			// display script errors if present
			if (me.scriptErrors.length) {
				Help.drawErrors(me);
			}
		}

		// update generation counter label
		if (me.genRelative) {
			me.genToggle.lower[0] = "+ " + me.shortenNumber(me.engine.counter);
		} else {
			me.genToggle.lower[0] = "T " + me.shortenNumber(me.engine.counter + me.genOffset);
		}

		// convert the displayed time into minutes and seconds
		me.elapsedTimeLabel.preText = me.asTime(me.elapsedTime);

		// update population counter label
		me.popValue.preText = me.shortenNumber(me.engine.population);

		if (me.finitelyBounded()) {
			// update births label with density
			me.birthsValue.preText = (((me.engine.population * 100) / (me.engine.boundedGridHeight * me.engine.boundedGridWidth)) | 0) + "%";
		} else {
			// update births label
			me.birthsValue.preText = me.shortenNumber(me.engine.births);
			// update deaths label
			me.deathsValue.preText = me.shortenNumber(me.engine.deaths);
		}

		// update tool tips for alive, births and deaths
		me.popValue.toolTip = "alive " + me.engine.population;
		if (me.finitelyBounded()) {
			// show density
            me.birthsValue.toolTip = "density " + (((me.engine.population * 100) / (me.engine.boundedGridHeight * me.engine.boundedGridWidth)) | 0) + "%";
		} else {
			// show births and deaths
			me.birthsValue.toolTip = "births " + me.engine.births;
			me.deathsValue.toolTip = "deaths " + me.engine.deaths;
		}

		// update gps and step control background based on performance unless disabled
		if (!me.noPerfWarning) {
			me.updateControlBackgrounds(deltaTime, tooSlow, manualStepping, me);
		}

		// clear next step flags
		me.nextStep = false;
		me.singleStep = false;

		// set the x/y position on the UI
		me.setXYPosition();

		// check for POI transition
		if (me.stepsPOI !== -1) {
			me.updateCameraPOI();
		}

		// detemine whether to update based on generations on or autofit or POI change not finished
		if (me.generationOn || (me.autoFit && (me.autoFitDelta > me.autoFitThreshold)) || me.stepsPOI !== -1) {
			updateNeeded = true;
		}

		// update indicators
		me.updateIndicators();

		// update ESWN speed
		me.updateTrackSpeed();

		// update the infobar
		me.updateInfoBar();

		// hide the UI controls if help or errors are displayed
		me.updateUIForHelp(me.displayHelp || me.scriptErrors.length);

		// set the auto update mode
		me.menuManager.setAutoUpdate(updateNeeded);
	};

	// update GPS and Step control background based on performance
	View.prototype.updateControlBackgrounds = function(deltaTime, tooSlow, manualStepping, me) {
		var red = 0,
			green = 0,
			blue = 0,
			controlColour;

		// check for STEP skip
		if ((deltaTime > ViewConstants.updateThreshold) && !manualStepping) {
			// ramp the green colour up
			me.perfColGreen += ViewConstants.perfGreenStep;
			if (me.perfColGreen >= (2 * ViewConstants.perfMaxGreen)) {
				me.perfColGreen = 0;
			}
		} else {
			// ramp the green colour down
			if (me.perfColGreen > 0) {
				me.perfColGreen -= ViewConstants.perfGreenStep;
			}
		}

		// check for frame skip
		if (tooSlow && !manualStepping) {
			// ramp the red colour up
			if (me.perfColRed < ViewConstants.perfMaxRed) {
				me.perfColRed += ViewConstants.perfRedStep;
			}
		} else {
			// ramp the red colour down
			if (me.perfColRed > ViewConstants.perfMinRed) {
				me.perfColRed -= ViewConstants.perfRedStep;
			}
		}

		if (me.perfColGreen >= ViewConstants.perfMaxGreen) {
			me.perColGreen = (2 * ViewConstants.perfMaxGreen - me.perfColGreen);
		}

		// blend the red
		red = me.uiBackgroundRGB >> 16;
		green = (me.uiBackgroundRGB >> 8) & 255;
		blue = me.uiBackgroundRGB & 255;
		if (red >= 128) {
			if (green >= 64 || blue >= 64) {
				green -= me.perfColRed;
				blue -= me.perfColRed;
				if (green < 0) {
					green = 0;
				}
				if (blue < 0) {
					blue = 0;
				}
			} else {
				green += me.perfColRed;
				if (green > 255) {
					green = 255;
				}
			}
		} else {
			red += me.perfColRed;
			if (red > 255) {
				red = 255;
			}
		}

		// set the background on the generation UI control using frameskip only
		controlColour = "rgb(" + red + "," + green + "," + blue + ")";
		me.generationRange.bgCol = controlColour;

		// blend the green
		red = me.uiBackgroundRGB >> 16;
		green = (me.uiBackgroundRGB >> 8) & 255;
		blue = me.uiBackgroundRGB & 255;
		if (green >= 128) {
			red -= me.perfColRed;
			if (red < 0) {
				red = 0;
			}
			blue -= me.perfColGreen;
			if (blue < 0) {
				blue = 0;
			}
		} else {
			green += me.perfColGreen;
			if (green > 255) {
				green = 255;
			}
		}

		// set the background on the generation and step UI controls
		controlColour = "rgb(" + red + "," + green + "," + blue + ")";
		me.stepRange.bgCol = controlColour;
	};

	// update origin
	View.prototype.updateOrigin = function() {
		// initial zoom at T=0
		var initialZoom = 0,

		    // current zoom now
		    currentZoom = 0;

		// check if track defined
		if (this.trackDefined && !this.trackDisabled) {
			// compute origin
			this.engine.originX = this.originCounter * (this.trackBoxE + this.trackBoxW) / 2;
			this.engine.originY = this.originCounter * (this.trackBoxN + this.trackBoxS) / 2;

			// compute initial zoom
			initialZoom = this.engine.zoomAt(0, this.trackBoxN, this.trackBoxE, this.trackBoxS, this.trackBoxW, this.displayWidth, this.displayHeight - 80, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor);
			currentZoom = this.engine.zoomAt(this.originCounter, this.trackBoxN, this.trackBoxE, this.trackBoxS, this.trackBoxW, this.displayWidth, this.displayHeight - 80, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor);
			this.engine.originZ = currentZoom / initialZoom;
		} else {
			// reset origin
			this.engine.originX = 0;
			this.engine.originY = 0;
			this.engine.originZ = 1;
		}

		// update zoom control
		this.zoomItem.current = this.viewZoomRange([this.engine.zoom, this.engine.zoom], false, this);
	};

	// udpate UI controls if help or errors are displayed
	View.prototype.updateUIForHelp = function(hide) {
		var showTopicButtons = !(this.displayHelp && (this.helpTopic === ViewConstants.welcomeTopic)),
			i = 0,
			value = 0,
			captions = [],
			toolTips = [];

		// undo and redo buttons
		this.redoButton.locked = (this.editNum === this.numEdits);
		this.undoButton.locked = (this.editNum === 0 || (this.editNum === 1 && this.numEdits > 1 && this.editList[0].gen === 0 && this.editList[0].cells.length === 0 && this.engine.counter === 0));

		// top menu buttons
		this.autoFitToggle.deleted = hide;
		this.zoomItem.deleted = hide || this.popGraph;
		this.fitButton.deleted = hide;
		this.gridToggle.deleted = hide;
		this.autostartIndicator.deleted = hide || this.popGraph;
		this.stopIndicator.deleted = hide || this.popGraph;
		this.waypointsIndicator.deleted = hide || this.popGraph;
		this.loopIndicator.deleted = hide || this.popGraph;
		this.modeList.deleted = hide;

		// graph controls
		this.opacityItem.deleted = hide || !this.popGraph;
		this.graphCloseButton.deleted = hide || !this.popGraph;
		this.linesToggle.deleted = hide || !this.popGraph;

		// generation statistics
		this.timeLabel.deleted = hide;
		this.elapsedTimeLabel.deleted = hide;
		this.popLabel.deleted = hide;
		this.popValue.deleted = hide;
		this.birthsLabel.deleted = hide || this.infinitelyBounded();
		this.birthsValue.deleted = hide || this.infinitelyBounded();
		this.deathsLabel.deleted = hide || this.finitelyBounded() || this.infinitelyBounded();
		this.deathsValue.deleted = hide || this.finitelyBounded() || this.infinitelyBounded();
		this.ruleLabel.deleted = hide;

		// navigation menu
		this.angleItem.deleted = hide || this.engine.isHex || this.engine.isTriangular;
		this.depthItem.deleted = hide;
		this.themeItem.deleted = hide || this.multiStateView || this.engine.isNone;
		this.layersItem.deleted = hide;
		this.fitButton.deleted = hide;
		this.shrinkButton.deleted = hide || !this.thumbnailEverOn;
		this.closeButton.deleted = !(this.isInPopup || this.scriptErrors.length);
		this.hexButton.deleted = hide;
		this.hexCellButton.deleted = hide;
		this.bordersButton.deleted = hide;
		this.labelButton.deleted = hide;
		this.killButton.deleted = hide;
		this.graphButton.deleted = hide;
		this.infoBarButton.deleted = hide;
		this.majorButton.deleted = hide;
		this.historyFitButton.deleted = hide;
		this.starsButton.deleted = hide;
		this.fpsButton.deleted = hide;
		this.timingDetailButton.deleted = hide;
		this.rHistoryButton.deleted = hide;

		// POI controls
		this.nextPOIButton.deleted = hide || (this.waypointManager.numPOIs() === 0);
		this.prevPOIButton.deleted = hide || (this.waypointManager.numPOIs() === 0);

		// infobar
		this.infoBarLabelXLeft.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelXValue.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelYLeft.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelYValue.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelAngleLeft.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelAngleValue.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelCenter.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelERight.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelSRight.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelWRight.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelNRight.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelEValueRight.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelSValueRight.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelWValueRight.deleted = hide || !this.infoBarEnabled;
		this.infoBarLabelNValueRight.deleted = hide || !this.infoBarEnabled;

		if (this.scriptErrors.length) {
			this.closeButton.toolTip = "close errors";
			this.closeButton.preText = "Esc";
			this.closeButton.font = "16px Arial";
		} else {
			this.closeButton.toolTip = "close window";
			this.closeButton.preText = "X";
			this.closeButton.font = "24px Arial";
		}

		// help topics
		this.topicsButton.deleted = !(this.displayHelp && (this.helpTopic !== ViewConstants.welcomeTopic));
		this.helpSectionList.deleted = (!(this.displayHelp && (this.helpTopic !== ViewConstants.welcomeTopic))) || !this.showSections;

		// help individual topics buttons
		this.helpKeysButton.deleted = showTopicButtons;
		this.helpScriptsButton.deleted = showTopicButtons;
		this.helpInfoButton.deleted = showTopicButtons;
		this.helpThemesButton.deleted =  showTopicButtons;
		this.helpColoursButton.deleted =  showTopicButtons;
		this.helpAliasesButton.deleted =  showTopicButtons;
		this.helpMemoryButton.deleted =  showTopicButtons;
		this.helpAnnotationsButton.deleted = showTopicButtons || (this.waypointManager.numAnnotations() === 0);

		// help sections
		this.sectionsButton.deleted = (!(this.displayHelp && (this.helpTopic !== ViewConstants.welcomeTopic))) || this.showSections;

		// check if the help section control needs to be updated
		if (this.updateSectionControl) {
			this.updateSectionControl = false;

			// build the list of sections and tooltips
			for (i = 0; i < this.helpSections.length; i += 1) {
				captions[i] = this.helpSections[i][1];
				toolTips[i] = "";
			}

			// update the control
			this.helpSectionList.lower = captions;
			this.helpSectionList.toolTip = toolTips;
			this.helpSectionList.height = this.helpSections.length * 26;
			this.helpSectionList.current = 0;
		}

		// update menus for drawing
		this.stateList.deleted = hide || !this.drawing || !this.showStates;
		this.stateColsList.deleted = hide || !this.drawing || !this.showStates;
		if (this.engine.multiNumStates <= 2) {
			// 2-state potentially with LifeHistory
			for (i = 0; i < this.stateColsList.lower.length; i += 1) {
				if (i <= 2) {
					// 2 state
					if (i === 0) {
						value = i;
					} else if (i === 1) {
						value = LifeConstants.aliveStart;
					} else {
						value = LifeConstants.deadMin;
					}
				} else {
					// LifeHistory state
					value = 128 + ViewConstants.stateMap[i];
				}
				this.stateColsList.bgColList[i] = "rgb(" + this.engine.redChannel[value] + "," + this.engine.greenChannel[value] + "," + this.engine.blueChannel[value] + ")";
			}
		} else {
			// multi-state generations style
			for (i = 0; i < this.stateColsList.lower.length; i += 1) {
				if (i + this.startState === 0) {
					value = 0;
				} else {
					value = this.historyStates + this.engine.multiNumStates - (i + this.startState);
				}
				this.stateColsList.bgColList[i] = "rgb(" + this.engine.redChannel[value] + "," + this.engine.greenChannel[value] + "," + this.engine.blueChannel[value] + ")";
			}
		}

		// pick
		this.pickToggle.deleted = hide || !this.drawing;

		// states
		this.statesToggle.deleted = hide || !this.drawing;

		// states slider
		this.statesSlider.deleted = hide || !this.drawing || !this.showStates || (this.engine.multiNumStates < 8);

		// update states list from slider
		if (this.engine.multiNumStates > this.maxDisplayStates) {
			this.updateStatesList();
		}

		// update the help sections list
		if (this.displayHelp > 0) {
			i = 0;
			value = -1;
			while (i < this.helpSections.length && value === -1) {
				if (this.helpSections[i][0] > this.displayHelp) {
					value = this.helpSections[i][0];
				} else {
					i += 1;
				}
			}
			if (i === this.helpSections.length) {
				value = i;
			}
			if (value !== -1) {
				this.helpSectionList.current = i - 1;
			}
		}

		// check whether to hide GUI during playback
		if (this.hideGUI) {
			if (this.playList.current === ViewConstants.modePlay) {
				this.viewMenu.deleted = true;
			} else {
				this.viewMenu.deleted = false;
			}
		}
	};

	// update infobar
	View.prototype.updateInfoBar = function() {
		// compute the x and y coordinates
		var xVal = -((this.engine.width / 2 - this.engine.xOff - this.engine.originX) | 0),
			yVal = -((this.engine.height / 2 - this.engine.yOff - this.engine.originY) | 0),
			xValStr = String(xVal),
			yValStr = String(yVal);

		// determine whether to display the infobar
		this.infoBarLabelXLeft.deleted = !this.infoBarEnabled;
		this.infoBarLabelXValue.deleted = !this.infoBarEnabled;
		this.infoBarLabelYLeft.deleted = !this.infoBarEnabled;
		this.infoBarLabelYValue.deleted = !this.infoBarEnabled;
		this.infoBarLabelAngleLeft.deleted = !this.infoBarEnabled;
		this.infoBarLabelAngleValue.deleted = !this.infoBarEnabled;
		this.infoBarLabelCenter.deleted = !this.infoBarEnabled;
		this.infoBarLabelERight.deleted = !this.infoBarEnabled;
		this.infoBarLabelSRight.deleted = !this.infoBarEnabled;
		this.infoBarLabelWRight.deleted = !this.infoBarEnabled;
		this.infoBarLabelNRight.deleted = !this.infoBarEnabled;
		this.infoBarLabelEValueRight.deleted = !this.infoBarEnabled;
		this.infoBarLabelSValueRight.deleted = !this.infoBarEnabled;
		this.infoBarLabelNValueRight.deleted = !this.infoBarEnabled;
		this.infoBarLabelWValueRight.deleted = !this.infoBarEnabled;

		// format infobar camera X
		if (xVal < -99999 || xVal > 99999) {
			xValStr = ((xVal / 1000) | 0) + "K";
		}

		// format infobar camera Y
		if (yVal < -99999 || yVal > 99999) {
			yValStr = ((yVal / 1000) | 0) + "K";
		}

		// update infobar X, Y and ANGLE
		this.infoBarLabelXValue.preText = xValStr;
		this.infoBarLabelYValue.preText = yValStr;
		this.infoBarLabelAngleValue.preText = (this.engine.angle.toFixed(0) + "\u00B0");
		
		// update the infobar trackbox E, S, W and N speeds
		this.infoBarLabelEValueRight.preText = this.currentTrackSpeedE.toFixed(3);
		this.infoBarLabelSValueRight.preText = this.currentTrackSpeedS.toFixed(3);
		this.infoBarLabelWValueRight.preText = this.currentTrackSpeedW.toFixed(3);
		this.infoBarLabelNValueRight.preText = this.currentTrackSpeedN.toFixed(3);
	};

	// update ESWN speed
	View.prototype.updateTrackSpeed = function() {
		// check for reset generation
		if (this.engine.counter === 0) {
			// zero speed
			this.currentTrackSpeedN = 0;
			this.currentTrackSpeedS = 0;
			this.currentTrackSpeedE = 0;
			this.currentTrackSpeedW = 0;
		} else {
			// compute cells per generation
			this.currentTrackSpeedS = (this.engine.zoomBox.topY - this.engine.initialBox.topY) / this.engine.counter;
			this.currentTrackSpeedN = (this.engine.zoomBox.bottomY - this.engine.initialBox.bottomY) / this.engine.counter;
			this.currentTrackSpeedE = (this.engine.zoomBox.rightX - this.engine.initialBox.rightX) / this.engine.counter;
			this.currentTrackSpeedW = (this.engine.zoomBox.leftX - this.engine.initialBox.leftX) / this.engine.counter;
		}
	};
	
	// update indicators
	View.prototype.updateIndicators = function() {
		// autofit
		this.autoFitToggle.current = [this.autoFit];

		// autostart
		this.autostartIndicator.current = [!this.autoStartDisabled && this.autoStart];
		this.autostartIndicator.locked = !this.autoStart;

		// waypoints/track
		if (this.trackDefined) {
			this.waypointsIndicator.lower[0] = "TRACK";
			this.waypointsIndicator.current = [(!this.trackDisabled && this.trackDefined)];
			this.waypointsIndicator.locked = !(this.trackDefined);
			this.waypointsIndicator.toolTip = ["toggle track mode"];
		} else {
			this.waypointsIndicator.lower[0] = "WAYPT";
			this.waypointsIndicator.current = [(!this.waypointsDisabled && this.waypointsDefined)];
			this.waypointsIndicator.locked = !(this.waypointsDefined);
			this.waypointsIndicator.toolTip = ["toggle waypoint mode"];
		}

		// loop
		this.loopIndicator.current = [!this.loopDisabled && this.loopGeneration !== -1];
		this.loopIndicator.locked = (this.loopGeneration === -1);
		this.loopIndicator.toolTip = ["loop at " + this.loopGeneration];

		// stop
		this.stopIndicator.current = [this.stopGeneration !== -1];
		this.stopIndicator.locked = (this.stopGeneration === -1);
		this.stopIndicator.toolTip = ["stop at " + this.stopGeneration];
	};

	// save elapsed time at generation
	View.prototype.saveElapsedTime = function(timeSinceLastUpdate, gensPerStep) {
		var buffer = null;

		// save elapsed time
		if (this.engine.counter >= this.elapsedTimes.length) {
			// grow buffer
			buffer = this.engine.allocator.allocate(Float32, this.elapsedTimes.length + ViewConstants.numElapsedTimes, "View.elapsedTimes");
			// copy buffer
			buffer.set(this.elapsedTimes);
			this.elapsedTimes = buffer;
		}
		this.elapsedTime += (timeSinceLastUpdate / gensPerStep);
		this.elapsedTimes[this.engine.counter] = this.elapsedTime;
	};

	// view update for copy to clipboard
	View.prototype.viewAnimateClipboard = function(me) {
		var amountToAdd = me.tempRLEChunkSize,
			amountLeft = me.tempRLELength - me.tempRLEAmount,
			textArea = null;

		// check if copied
		if (me.tempRLEAmount < me.tempRLELength) {
			// check if wait has expired
			if (me.copyFrameWait > 0) {
				me.copyFrameWait -= 1;
			} else {
				// if running in Edge then copy in one go
				if (me.isEdge) {
					me.tempInput.innerHTML = me.tempRLE;
					me.tempRLEAmount = me.tempRLELength;
				} else {
					// copy the next chunk
					if (amountLeft < amountToAdd) {
						amountToAdd = amountLeft;
					}
					// create a new textarea
					textArea = document.createElement("textarea");
					me.hideElement(textArea);
					// find the nearest newline before the end of the chunk
					if (amountToAdd !== amountLeft) {
						while (me.tempRLE[me.tempRLEAmount + amountToAdd] !== "\n") {
							amountToAdd -= 1;
						}
					}
					textArea.innerHTML = me.tempRLE.substr(me.tempRLEAmount, amountToAdd);
					me.tempRLEAmount += amountToAdd;
					me.tempInput.appendChild(textArea);
				}
			}
		} else {
			// draw notification
			me.menuManager.notification.notify("Press Enter to complete copy", 15, 10000, 15, true);
		}

		// update progress bar
		me.updateProgressBarCopy(me);

		// draw grid
		me.engine.drawGrid();

		// draw any arrows and labels
		if (me.showLabels) {
			me.waypointManager.drawAnnotations(me);
		}

		// draw population graph if required
		if (me.popGraph) {
			me.engine.drawPopGraph(me.popGraphLines, me.popGraphOpacity, false, me.thumbnail);
		}

		// display help if requested
		if (me.displayHelp) {
			Help.drawHelpText(me);
		} else {
			// display script errors if present
			if (me.scriptErrors.length) {
				Help.drawErrors(me);
			}
		}

		// set the auto update mode
		me.menuManager.setAutoUpdate(true);
	};

	// view update for history calculation
	View.prototype.viewAnimateHistory = function(me) {
		// target generation
		var targetGen = me.computeHistoryTarget,

		    // start time of updates
		    startTime = performance.now(),

		    // time budget in ms for this frame
		    timeLimit = 13,

		    // whether to save snapshots during next generation
		    noSnapshots = true,

		    // compute number of generations in snapshot buffer
		    snapshotBufferGens = me.engine.snapshotManager.maxSnapshots * LifeConstants.snapshotInterval;

		// compute the next set of generations without stats for speed
		while (me.engine.counter < targetGen - 1 && (performance.now() - startTime < timeLimit)) {
			// check whether to save snapshots
			if (targetGen - 1 - me.engine.counter <= snapshotBufferGens) {
				noSnapshots = false;
			} else {
				noSnapshots = true;
			}

			// compute the next generation
			me.engine.nextGeneration(false, noSnapshots, me.graphDisabled);
			me.engine.convertToPensTile();

			// paste any RLE snippets
			me.pasteRLEList();

			// if paste every is defined then always flag there are alive cells
			// since cells will appear in the future
			if (me.isPasteEvery || me.engine.counter <= me.maxPasteGen) {
				me.engine.anythingAlive = 1;
			}
		}

		// check if complete
		if (me.engine.counter === targetGen - 1) {
			// compute final generation with stats on if required
			me.engine.nextGeneration(me.statsOn, false, me.graphDisabled);
			me.engine.convertToPensTile();

			// paste any RLE snippets
			me.pasteRLEList();

			// if paste every is defined then always flag there are alive cells
			// since cells will appear in the future
			if (me.isPasteEvery || me.engine.counter <= me.maxPasteGen) {
				me.engine.anythingAlive = 1;
			}

			// switch back to normal mode
			me.computeHistory = false;

			// clear notification
			if (me.computeHistoryClear) {
				me.menuManager.notification.clear(true, false);
			}

			// unlock the menu
			me.viewMenu.locked = false;
		} else {
			// lock the menu
			me.viewMenu.locked = true;
		}
		
		// update progress bar
		me.updateProgressBarHistory(me, targetGen);

		// draw grid
		me.engine.drawGrid();

		// draw any arrows and labels
		if (me.showLabels) {
			me.waypointManager.drawAnnotations(me);
		}

		// draw population graph if required
		if (me.popGraph) {
			me.engine.drawPopGraph(me.popGraphLines, me.popGraphOpacity, false, me.thumbnail);
		}

		// display help if requested
		if (me.displayHelp) {
			Help.drawHelpText(me);
		} else {
			// display script errors if present
			if (me.scriptErrors.length) {
				Help.drawErrors(me);
			}
		}

		// set the auto update mode
		me.menuManager.setAutoUpdate(true);
	};

	// update view mode dispatcher
	View.prototype.viewAnimate = function(timeSinceLastUpdate, me) {
		// check view mode
		if (me.computeHistory) {
			me.viewAnimateHistory(me);
		} else {
			if (me.clipboardCopy) {
				me.viewAnimateClipboard(me);
			} else {
				me.viewAnimateNormal(timeSinceLastUpdate, me);
			}
		}
	};

	// start view mode
	View.prototype.viewStart = function(me) {
		// zero life counter
		me.engine.counter = 0;
		me.floatCounter = 0;
		me.originCounter = 0;

		// reset elapsed time
		me.elapsedTime = 0;

		// center on pan position
		me.engine.xOff = me.engine.width >> 1;
		me.engine.yOff = me.engine.height >> 1;
		me.engine.xOff &= (me.engine.width - 1);
		me.engine.yOff &= (me.engine.height - 1);

		// mark something alive
		me.engine.anythingAlive = true;

		// flag just started for first frame measurement
		me.justStarted = true;

		// reset died generation
		me.diedGeneration = -1;
	};

	// toggle stars display
	View.prototype.viewStarsToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.starsOn = newValue[0];
		}

		return [me.starsOn];
	};

	// toggle history fit mode
	View.prototype.viewHistoryFitToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.historyFit = newValue[0];
		}

		return [me.historyFit];
	};

	// toggle major gridlines display
	View.prototype.viewMajorToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.engine.gridLineMajorEnabled = newValue[0];
		}

		return [me.engine.gridLineMajorEnabled];
	};

	// toggle infobar display
	View.prototype.viewInfoBarToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.infoBarEnabled = newValue[0];
		}

		return [me.infoBarEnabled];
	};

	// toggle graph display
	View.prototype.viewGraphToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.popGraph = newValue[0];
		}

		return [me.popGraph];
	};

	// toggle kill gliders
	View.prototype.viewKillToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.engine.clearGliders = newValue[0];
		}

		return [me.engine.clearGliders];
	};

	// toggle labels display
	View.prototype.viewLabelToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.showLabels = newValue[0];
		}

		return [me.showLabels];
	};

	// toggle cell borders
	View.prototype.viewBordersToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			// toggle cell borders
			me.engine.cellBorders = newValue[0];
		}

		return [me.engine.cellBorders];
	};

	// toggle hexagonal cells
	View.prototype.viewHexCellToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			// toggle cell shape
			me.engine.useHexagons = newValue[0];
			me.updateGridIcon();
		}

		return [me.engine.useHexagons];
	};

	// toggle hex display
	View.prototype.viewHexToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.engine.isHex = newValue[0];
			// toggle hex mode
			if (!me.engine.isHex) {
				// update x offset
				me.engine.xOff += me.engine.yOff / 2;
				me.defaultX += me.engine.yOff / 2;
				me.savedX += me.engine.yOff / 2;
			} else {
				// update x offset
				me.engine.xOff -= me.engine.yOff / 2;
				me.defaultX -= me.engine.yOff / 2;
				me.savedX -= me.engine.yOff / 2;
			}
			// update grid icon
			me.updateGridIcon();

			// update angle control
			me.angleItem.deleted = me.engine.isHex;
		}

		return [me.engine.isHex];
	};

	// toggle [R]History display
	View.prototype.viewRHistoryToggle = function(newValue, change, me) {
		// check if chaning
		if (change) {
			me.engine.displayLifeHistory = newValue[0];
			me.engine.drawOverlay = newValue[0];
		}

		return [me.engine.displayLifeHistory];
	};

	// toggle timing detail display
	View.prototype.viewTimingDetailToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.menuManager.showExtendedTiming = newValue[0];
		}

		// ensure update happens
		me.menuManager.setAutoUpdate(true);

		return [me.menuManager.showExtendedTiming];
	};

	// toggle fps display
	View.prototype.viewFpsToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.menuManager.showTiming = newValue[0];
		}

		// ensure update happens
		me.menuManager.setAutoUpdate(true);

		return [me.menuManager.showTiming];
	};

	// colour theme
	View.prototype.viewThemeRange = function(newValue, change, me) {
		var newTheme = 0;

		// check if changing
		if (change) {
			// set the theme
			newTheme = (newValue[0] + 0.5) | 0;

			// check if it has changed
			if (me.engine.colourTheme !== newTheme) {
				me.engine.setTheme(newTheme, me.engine.colourChangeSteps, me);
				if (me.engine.colourChangeSteps > 1) {
					me.menuManager.updateCount = me.engine.colourChangeSteps;
				}
			}
		}

		// return value
		return [newValue[0], me.themeName(me.engine.colourTheme)];
	};

	// step size
	View.prototype.viewStepRange = function(newValue, change, me) {
		// check if changing
		if (change) {
			// set the step size
			me.gensPerStep = (newValue[0] + 0.5) | 0;
		}

		// return value
		return [me.gensPerStep, me.gensPerStep];
	};

	// format generation display
	View.prototype.genDisplay = function(value) {
		var result = "";
		if (value.toFixed(1) < 10) {
			result = value.toFixed(1);
		} else {
			result = value.toFixed(0);
		}
		result += "/s";
		return result;
	};

	// generation speed
	View.prototype.viewGenerationRange = function(newValue, change, me) {
		var result;

		// check if changing
		if (change) {
			// set generation speed
			me.genSpeed = ViewConstants.minGenSpeed + (newValue[0] * newValue[0] * (ViewConstants.maxGenSpeed - ViewConstants.minGenSpeed));

			result = newValue[0];
		} else {
			result = Math.sqrt((me.genSpeed - ViewConstants.minGenSpeed) / (ViewConstants.maxGenSpeed - ViewConstants.minGenSpeed));
		}
		
		// return value
		return [result, me.genDisplay(me.genSpeed)];
	};

	// save the camera position
	View.prototype.saveCamera = function(me) {
		// save zoom
		me.savedZoom = me.engine.zoom;
		if (me.thumbnail) {
			me.savedZoom = me.savedZoom * me.thumbnailDivisor;
		}

		// save angle
		me.savedAngle = me.engine.angle;

		// save x and y
		me.savedX = me.engine.xOff;
		me.savedY = me.engine.yOff;
	};

	// reset the saved camera
	View.prototype.resetSavedCamera = function(me) {
		// save start point
		me.startXPOI = me.engine.width / 2 - me.engine.xOff;
		me.startYPOI = me.engine.height / 2 - me.engine.yOff;
		me.startZoomPOI = me.engine.zoom;
		me.startAnglePOI = me.engine.angle;

		// set destination
		me.endXPOI = me.engine.width / 2 - me.savedX;
		me.endYPOI = me.engine.height / 2 - me.savedY;
		me.endAnglePOI = me.savedAngle;

		// check for thumbnail
		if (me.thumbnail) {
			me.endZoomPOI = me.savedZoom / me.thumbnailDivisor;
		} else {
			me.endZoomPOI = me.savedZoom;
		}

		// reset step number for transition
		me.stepsPOI = 0;
	};

	// reset the camera
	View.prototype.resetCamera = function(me, fullReset) {
		var numberValue = 0,
		    previousSteps = 0;

		// reset zoom
		me.engine.zoom = me.defaultZoom;

		if (me.thumbnail) {
			me.engine.zoom = me.engine.zoom / me.thumbnailDivisor;
		}

		if (me.zoomItem) {
			me.zoomItem.current = me.viewZoomRange([me.engine.zoom, me.engine.zoom], false, me);
		}

		// reset angle
		me.engine.angle = me.defaultAngle;
		if (me.angleItem) {
			me.angleItem.current = [me.defaultAngle, me.defaultAngle];
		}

		// reset x and y
		me.engine.xOff = me.defaultX;
		me.engine.yOff = me.defaultY;

		// only reset the rest on a hard reset
		if (fullReset) {
			// reset theme
			previousSteps = me.engine.colourChangeSteps;
			me.engine.colourChangeSteps = 1;
			me.themeItem.current = me.viewThemeRange([me.defaultTheme, ""], true, me);
			me.engine.colourChangeSteps = previousSteps;
			if (me.multiStateView) {
				// prevent colour theme change for multi-state view
				me.engine.colourChange = 0;
			}

			// reset gps
			numberValue = Math.sqrt((me.defaultGPS - ViewConstants.minGenSpeed) / (ViewConstants.maxGenSpeed - ViewConstants.minGenSpeed));
			me.generationRange.current = me.viewGenerationRange([numberValue, numberValue], true, me);

			// reset step
			me.gensPerStep = me.defaultStep;
			me.stepRange.current = [me.gensPerStep, me.gensPerStep];

			// reset layers
			me.engine.layers = me.defaultLayers;
			me.layersItem.current = [me.defaultLayers, me.defaultLayers];

			// reset depth
			numberValue = Math.sqrt(me.defaultDepth);
			me.depthItem.current = me.viewDepthRange([numberValue, numberValue], true, me);
		}
	};

	// adjust origin if track just switched on or off
	View.prototype.adjustOrigin = function(trackDisabled) {
		// check if track just switched off
		if (trackDisabled) {
			// adjust origin
			this.engine.xOff += this.engine.originX;
			this.engine.yOff += this.engine.originY;
			this.engine.zoom *= this.engine.originZ;
		} else {
			// track just switched on
			this.updateOrigin();
			this.engine.xOff -= this.engine.originX;
			this.engine.yOff -= this.engine.originY;
			this.engine.zoom /= this.engine.originZ;
			this.updateOrigin();

		}

		// ensure zoom in range
		if (this.engine.zoom < ViewConstants.minZoom) {
			this.engine.zoom = ViewConstants.minZoom;
		} else {
			if (this.engine.zoom > ViewConstants.maxZoom) {
				this.engine.zoom = ViewConstants.maxZoom;
			}
		}
	};

	// just reset the generation
	View.prototype.resetGeneration = function(me) {
		// reset time
		me.elapsedTime = 0;

		// check for simple view
		if (!me.multiStateView) {
			// reset grid and generation counter
			me.engine.restoreSavedGrid(me.noHistory);

			// mark cells alive
			me.engine.anythingAlive = true;

			// reset history box
			me.engine.resetHistoryBox();
		}
	};

	// reset to first generation
	View.prototype.reset = function(me) {
		var hardReset = false,
		    looping = false;

		// check for hard reset
		if (me.elapsedTime === 0 || me.hardReset) {
			hardReset = true;
		}
		
		// check if looping
		if (!me.loopDisabled && me.loopGeneration !== -1) {
			if (me.engine.counter >= me.loopGeneration) {
				looping = true;
			}
		}

		// if not looping and soft reset then disable waypoints, track and looping if defined
		if (!looping && !hardReset) {
			if (me.waypointsDefined) {
				me.waypointsDisabled = true;
			}
			if (me.trackDefined) {
				me.trackDisabled = true;
			}
			if (me.loopGeneration !== -1) {
				me.loopDisabled = true;
			}
			if (me.autoFitDefined) {
				me.autoFit = false;
			}
		}

		// reset time and origin
		me.elapsedTime = 0;
		me.engine.originX = 0;
		me.engine.originY = 0;
		me.engine.originZ = 1;

		// perform hard reset if required
		if (hardReset) {
			// enable waypoints
			if (me.waypointsDefined) {
				me.waypointsDisabled = false;
			}

			// enable track
			if (me.trackDefined) {
				me.trackDisabled = false;
			}

			// enable autofit
			if (me.autoFitDefined) {
				me.autoFit = true;
			}

			// reset the camera
			if (!looping || me.waypointsDefined || me.autoFit) {
				me.resetCamera(me, hardReset);
				if (me.autoFit) {
					me.fitZoomDisplay(true, false);
				}
			}

			// enable looping
			me.loopDisabled = false;
		}

		// check for simple view
		if (!me.multiStateView) {
			// reset grid and generation counter
			me.engine.restoreSavedGrid(me.noHistory);
			me.floatCounter = me.engine.counter;
			me.originCounter = me.floatCounter;

			// mark cells alive
			me.engine.anythingAlive = true;
		}

		// reset population data for graph
		if (!me.graphDisabled) {
			me.engine.resetPopulationData();
		}

		// reset history box
		me.engine.resetHistoryBox();

		// clear last waypoint message
		me.lastWaypointMessage = "";

		// clear last waypoint theme
		me.lastWaypointTheme = -1;

		// clear manual change flag
		me.manualChange = false;

		// reset waypoint manager for playback
		me.waypointManager.resetPlayback();

		// clear any waypoint messages
		me.menuManager.notification.clear(false, false);

		// reset died generation
		me.diedGeneration = -1;

		// reset cleared glider count
		me.engine.numClearedGliders = 0;

		// reset undo/redo to generation 0
		me.setUndoGen(me.engine.counter);

		// draw any undo/redo edit records
		me.pasteEdits();
	};

	// set the pause icon to pause or step forward based on play mode
	View.prototype.setPauseIcon = function(isPlaying) {
		// check if playing
		if (isPlaying) {
			// set to pause icon
			this.playList.icon[ViewConstants.modePlay] = this.iconManager.icon("pause");
			this.playList.toolTip[ViewConstants.modePlay] = "pause";
		} else {
			// set to play icon
			this.playList.icon[ViewConstants.modePlay] = this.iconManager.icon("play");
			this.playList.toolTip[ViewConstants.modePlay] = "play";
		}
	};

	// set help topic
	View.prototype.setHelpTopic = function(newValue, me) {
		// switch to required topic
		me.helpTopic = newValue;
		me.displayHelp = 1;

		// show sections
		me.showSections = true;

		// clear help widths cache
		me.helpFixedCache = [];
		me.helpVariableCache = [];

		// set flag indicating the section control needs to be updated
		this.updateSectionControl = true;
	};

	// keys help topic
	View.prototype.keysTopicPressed = function(me) {
		me.setHelpTopic(ViewConstants.keysTopic, me);
	};

	// scripts help topic
	View.prototype.scriptsTopicPressed = function(me) {
		me.setHelpTopic(ViewConstants.scriptsTopic, me);
	};

	// info help topic
	View.prototype.infoTopicPressed = function(me) {
		me.setHelpTopic(ViewConstants.informationTopic, me);
	};

	// themes help topic
	View.prototype.themesTopicPressed = function(me) {
		me.setHelpTopic(ViewConstants.themesTopic, me);
	};

	// colours help topic
	View.prototype.coloursTopicPressed = function(me) {
		me.setHelpTopic(ViewConstants.coloursTopic, me);
	};

	// aliases help topic
	View.prototype.aliasesTopicPressed = function(me) {
		me.setHelpTopic(ViewConstants.aliasesTopic, me);
	};

	// memory help topic
	View.prototype.memoryTopicPressed = function(me) {
		me.setHelpTopic(ViewConstants.memoryTopic, me);
	};

	// annotations help topic
	View.prototype.annotationsTopicPressed = function(me) {
		me.setHelpTopic(ViewConstants.annotationsTopic, me);
	};

	// view help section list
	View.prototype.viewHelpSectionList = function(newValue, change, me) {
		var result = newValue;

		if (change) {
			me.displayHelp = me.helpSections[newValue][0];
			me.showSections = false;
		}

		return result;
	};

	// view mode list
	View.prototype.viewModeList = function(newValue, change, me) {
		var result = newValue;

		if (change) {
			switch (newValue) {
				case ViewConstants.modeDraw:
					if (me.viewOnly || me.engine.isNone) {
						me.menuManager.notification.notify("Drawing not available", 15, 40, 15, true);
						result = ViewConstants.modePan;
					} else {
						me.drawing = true;
						// turn off pick mode
						me.pickToggle.current = me.togglePick([false], true, me);
					}
					break;
				case ViewConstants.modeSelect:
					// not implemented yet
					if (me.drawing) {
						result = ViewConstants.modeDraw;
					} else {
						result = ViewConstants.modePan;
					}
					break;
				case ViewConstants.modePan:
					me.drawing = false;
					break;
			}
		}

		return result;
	};

	// drawing states list
	View.prototype.viewStateList = function(newValue, change, me) {
		var name = "",
			result = newValue;

		if (change) {
			me.drawState = newValue;
			if (me.engine.multiNumStates <= 2) {
				if (me.engine.isLifeHistory) {
					name = ViewConstants.stateNames[me.drawState];
				} else {
					name = (me.drawState ? "Alive" : "Dead");
				}
			} else {
				newValue += me.startState;
				if (newValue === 0) {
					me.drawState = 0;
					name = "Dead";
				} else {
					me.drawState = me.engine.multiNumStates - newValue;
					if (newValue === 1) {
						name = "Alive";
					} else {
						name = "Dying " + String(newValue - 1);
					}
				}
			}
			me.menuManager.notification.notify("Drawing with state " + newValue + " (" + name + ")", 15, 120, 15, true);

			// turn off pick mode
			me.pickToggle.current = me.togglePick([false], true, me);
		}

		return result;
	};

	// drawing states colours list
	View.prototype.viewStateColsList = function(newValue, change, me) {
		var result = newValue,
			i = 0;

		if (change) {
			while (i < result.length) {
				if (result[i]) {
					result[i] = false;
					me.stateList.current = me.viewStateList(i, true, me);
				}
				i += 1;
			}
		}

		return result;
	};

	// view play list
	View.prototype.viewPlayList = function(newValue, change, me) {
		var result = newValue,
		    loopMode = me.loopDisabled,
		    waypointMode = me.waypointsDisabled,
		    autoStartMode = me.autoStartDisabled,
		    autoFitMode = me.autoFit,
		    trackMode = me.trackDisabled,
		    message = null,
		    duration = 40,

		    // whether loop switched on or off
		    loopChange = 0,

		    // whether waypoints switched on or off
		    waypointsChange = 0,

		    // whether track switched on or off
		    trackChange = 0,

		    // whether autostart switched on or off
		    autoStartChange = 0,

		    // whether autofit switched on or off
		    autoFitChange = 0;

		if (change) {
			// change play setting
			switch (newValue) {
			case ViewConstants.modeReset:
				// switch to play mode depending on autostart
				if (me.hardReset || (me.autoStart && me.engine.counter === 0 && me.elapsedTime === 0)) {
					me.autoStartDisabled = false;
				} else {
					me.autoStartDisabled = true;
				}

				// check for autostart
				if (me.autoStart && !me.autoStartDisabled) {
					newValue = ViewConstants.modePlay;
					me.generationOn = true;

					// set flag whether pattern was empty and playback is on
					if (me.engine.population === 0) {
						me.emptyStart = true;
					} else {
						me.emptyStart = false;
					}
				} else {
					newValue = ViewConstants.modePause;
					me.generationOn = false;
				}

				// reset
				me.afterEdit();
				me.reset(me);

				// reset undo/redo list
				me.currentEdit = [];
				me.currentUndo = [];

				// build reset message
				message = "Reset";

				// check for loop on
				if (!me.loopDisabled && loopMode && me.loopGeneration !== -1) {
					loopChange = 1;
				}

				// check for loop off
				if (me.loopDisabled && !loopMode && me.loopGeneration !== -1) {
					loopChange = -1;
				}

				// check for autofit on
				if (!autoFitMode && me.autoFit) {
					autoFitChange = 1;
				}

				// check for autofit off
				if (autoFitMode && !me.autoFit) {
					autoFitChange = -1;
				}

				// check for waypoints on
				if (!me.waypointsDisabled && waypointMode) {
					waypointsChange = 1;
				}

				// check for waypoints off
				if (me.waypointsDisabled && !waypointMode) {
					waypointsChange = -1;
				}

				// check for track on
				if (!me.trackDisabled && trackMode) {
					trackChange = 1;
				}

				// check for track off
				if (me.trackDisabled && !trackMode) {
					trackChange = -1;
				}

				// check for autostart on
				if (!me.autoStartDisabled && autoStartMode && me.autoStart) {
					autoStartChange = 1;
				}

				// check for autostart off
				if (me.autoStartDisabled && !autoStartMode && me.autoStart) {
					autoStartChange = -1;
				}

				// check if a mode changed
				if (loopChange !== 0 || waypointsChange !== 0 || trackChange !== 0 || autoStartChange !== 0 || autoFitChange !== 0) {
					// build the notification
					message = "";

					// check for loop change
					if (loopChange !== 0) {
						message += "Loop";
					}

					// check for waypoints, track or autofit change
					if (waypointsChange !== 0 || trackChange !== 0 || autoFitChange !== 0) {
						// determine the separator
						if (loopChange !== 0) {
							if (autoStartChange !== 0) {
								message += ", ";
							} else {
								message += " and ";
							}
						}
						if (waypointsChange !== 0) {
							message += "Waypoints";
						} else {
							if (trackChange !== 0) {
								message += "Track";
							} else {
								message += "AutoFit";
							}
						}
					}

					// check for autostart change
					if (autoStartChange !== 0) {
						// determine the separator
						if (loopChange !== 0 || waypointsChange !== 0 || trackChange !== 0 || autoFitChange !== 0) {
							message += " and ";
						}
						message += "AutoStart";
					}

					// check for on or off
					if (loopChange > 0 || waypointsChange > 0 || trackChange > 0 || autoStartChange > 0 || autoFitChange > 0) {
						message += " On";
					} else {
						message += " Off";
					}

					// increase notification duration because of more text
					duration = 120;
				}

				// display notification
				me.menuManager.notification.notify(message, 15, duration, 15, true);
				break;

			case ViewConstants.modePlay:
				// play
				if (!me.generationOn) {
					// play
					me.generationOn = true;
					me.afterEdit();

					// set flag whether pattern was empty and playback is on
					if (me.engine.population === 0) {
						me.emptyStart = true;
					} else {
						me.emptyStart = false;
					}

					// zoom text
					me.menuManager.notification.notify("Play", 15, 40, 15, true);
				} else {
					// pause
					me.generationOn = false;

					// zoom text unless STOP and generation notifications disabled
					if (!(me.engine.counter === me.stopGeneration && !me.genNotifications)) {
						me.menuManager.notification.notify("Pause", 15, 40, 15, true);
					}
				}
				break;

			case ViewConstants.modeStepBack:
				// step back
				if (!me.generationOn) {
					// check if at start
					if (me.engine.counter > 0) {
						// run from start to previous generation
						me.runTo(me.engine.counter - me.gensPerStep);

						// adjust undo stack pointer
						me.setUndoGen(me.engine.counter - me.gensPerStep + 1);
					}
				} else {
					// pause
					me.generationOn = false;

					// zoom text
					me.menuManager.notification.notify("Pause", 15, 40, 15, true);
				}

				break;

			case ViewConstants.modePause:
				// pause
				if (me.generationOn) {
					// pause
					me.generationOn = false;

					// zoom text unless STOP and generation notifications disabled
					if (!(me.engine.counter === me.stopGeneration && !me.genNotifications)) {
						me.menuManager.notification.notify("Pause", 15, 40, 15, true);
					}
				} else {
					// step
					me.nextStep = true;
					me.afterEdit();

					// set flag whether pattern was empty and playback is on
					if (me.engine.population === 0) {
						me.emptyStart = true;
					} else {
						me.emptyStart = false;
					}
				}
				break;

			default:
				// ignore other modes
				break;
			}

			result = newValue;

			// set the pause icon
			me.setPauseIcon(me.generationOn);
		}

		return result;
	};

	// angle range
	View.prototype.viewAngleRange = function(newValue, change, me) {
		// check if changing
		if (change) {
			// set manual change happened
			me.manualChange = true;

			// set angle
			me.engine.angle = newValue[0];
		}
		
		// return value
		return [me.engine.angle, me.engine.angle];
	};

	// layers range
	View.prototype.viewLayersRange = function(newValue, change, me) {
		var result;

		// check if changing
		if (change) {
			// set manual change happened
			me.manualChange = true;

			// set the layers
			me.engine.layers = (newValue[0] + 0.5) | 0;
			result = newValue[0];
		} else {
			result = me.engine.layers;
		}

		// return value
		return [result, me.engine.layers];
	};

	// depth range
	View.prototype.viewDepthRange = function(newValue, change, me) {
		// check if changing
		if (change) {
			// set manual change happened
			me.manualChange = true;

			// set the layer depth
			me.engine.layerDepth = newValue[0] * newValue[0];
			return [newValue[0], me.engine.layerDepth * ViewConstants.depthScale];
		}

		// return value
		return [Math.sqrt(me.engine.layerDepth), me.engine.layerDepth * ViewConstants.depthScale];
	};

	// draw cells
	View.prototype.drawCells = function(toX, toY, fromX, fromY) {
		var startCellX = 0,
			startCellY = 0,
			endCellX = 0,
			endCellY = 0,
			testState = this.drawState;

		// check if this is the start of drawing
		if (fromX === -1 && fromY === -1) {
			this.penColour = this.readCell();
			// adjust test state if generations style
			if (this.engine.multiNumStates > 2) {
				testState = this.engine.multiNumStates - testState;
			}

			// check for smart drawing
			if (this.smartDrawing && (this.penColour === testState)) {
				this.penColour = 0;
			} else {
				this.penColour = this.drawState;
			}
		} else {
			// draw from the last position to the current position
			this.updateCellLocation(fromX, fromY);
			startCellX = this.cellX;
			startCellY = this.cellY;

			// current position
			this.updateCellLocation(toX, toY);
			endCellX = this.cellX;
			endCellY = this.cellY;

			// draw cells
			if (this.drawCellLine(startCellX, startCellY, endCellX, endCellY, this.penColour)) {
				// update state 6 grid if required
				this.engine.populateState6MaskFromColGrid();
			}
		}

		// if the population is now non-zero then reset anything alive and died generation
		if (this.engine.population > 0) {
			this.diedGeneration = -1;
			this.engine.anythingAlive = true;
		}
	};

	// view menu wakeup callback
	View.prototype.viewWakeUp = function(x, y, dragOn, me) {
		// on mouse release pause playback so GUI unhides
		if (me.hideGUI) {
			if (!dragOn) {
				me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
			}
		}
	};

	// view menu background drag callback
	View.prototype.viewDrag = function(x, y, dragOn, me) {
		me.viewDoDrag(x, y, dragOn, me, false);
	};

	// view menu background drag
	View.prototype.viewDoDrag = function(x, y, dragOn, me, fromKey) {
		var dx = 0,
		    dy = 0,
		    angle = 0,
		    sinAngle = 0,
			cosAngle = 0,
			saveStart = 0;

		// check if this is a drag or cancel drag
		if (dragOn) {
			if (me.displayHelp || me.displayErrors || !me.drawing || fromKey) {
				// check if this is the start of a drag
				if (me.lastDragX !== -1) {
					// check if help is displayed
					if (me.displayHelp) {
						// compute the movement
						dy = (me.lastDragY - y);
						dy /= ViewConstants.fontSize;
	
						// scroll help text
						if (dy > 0) {
							me.scrollHelpDown(me, dy);
						} else {
							if (dy < 0) {
								me.scrollHelpUp(me, -dy);
							}
						}
					} else {
						// check if errors are displayed
						if (me.displayErrors) {
							// compute the movement
							dy = (me.lastDragY - y);
							dy /= ViewConstants.fontSize;
	
							// scroll errors
							if (dy > 0) {
								me.scrollErrorsDown(me, dy);
							} else {
								if (dy < 0) {
									me.scrollErrorsUp(me, -dy);
								}
							}
						} else {
							// compute the movement
							dx = (me.lastDragX - x) / me.engine.camZoom;
							dy = ((me.lastDragY - y) / me.engine.camZoom) / ((me.engine.isTriangular && me.engine.camZoom >= 4) ? ViewConstants.sqrt3 : 1);
	
							// check for hex
							if (me.engine.isHex || me.engine.isTriangular) {
								angle = 0;
							} else {
								angle = -me.engine.angle;
							}
	
							// only update position if controls not locked
							if (!me.controlsLocked) {
								// compute x and y
								sinAngle = Math.sin(angle / 180 * Math.PI);
								cosAngle = Math.cos(angle / 180 * Math.PI);
	
								// set manual change happened
								me.manualChange = true;
	
								// update position
								me.engine.xOff += dx * cosAngle + dy * (-sinAngle);
								me.engine.yOff += dx * sinAngle + dy * cosAngle;
							}
						}
					}
				}
			} else {
				if (me.drawing && x !== -1 && y !== -1 && !me.pickMode) {
					me.drawCells(x, y, me.lastDragX, me.lastDragY);
				}
			}

			// save last drag position
			me.lastDragX = x;
			me.lastDragY = y;
		} else {
			// drag finished so check for pick mode
			if (!fromKey) {
				if (me.pickMode === true) {
					if (x!== -1 && y !== -1) {
						me.penColour = me.readCell();
						// clear start state for pick
						saveStart = me.startState;
						me.startState = 0;
						me.stateList.current = me.viewStateList(me.penColour, true, me);
						// restore start state
						me.startState = saveStart;
					}
				} else {
					// end of edit
					if (me.currentEdit.length > 0) {
						me.afterEdit();
					}
				}
			}
			me.lastDragX = -1;
			me.lastDragY = -1;
		}
	};

	// move view in the given direction
	View.prototype.moveView = function(dx, dy) {
		// scale movement based on zoom
		if (this.engine.zoom < 8) {
			if (dx < 0) {
				dx = -8;
			} else {
				if (dx > 0) {
					dx = 8;
				}
			}

			if (dy < 0) {
				dy = -8;
			} else {
				if (dy > 0) {
					dy = 8;
				}
			}
		}
		this.lastDragX = 0;
		this.lastDragY = 0;
		this.viewDoDrag(dx, dy, true, this, true);
		this.lastDragX = -1;
		this.lastDragY = -1;
	};

	// create icons
	View.prototype.createIcons = function(context) {
		// load icon file
		var w = 40,
		    h = 40,
		    icons = ViewConstants.icons;

		// check if the icons exist
		if (icons === null) {
			// create the icon image
			icons = new Image();

			// load the icons from the image file
			icons.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA0gAAAAoCAIAAABLmU1LAAAABnRSTlMAAAAAAABupgeRAAAIrklEQVR4nO2dW5bjKgxFk7t6wBlKZuz+8I2XGwwW6EgCfPZXlSGSeCsYlNeLEEIIIYQQQsiYfD4f0+dPxrpuWecPZG/0vOmtnyd5KhnsUgmcP9EGEIJn27bkyfv9dpAcpTeKbdt8zHBTREgI3+/38/l8v1+3533fKzSpxA06dmRZLFyBuhsXq9ef9/uduFwQD8xC5gKwHgiQ3Pnb3bL8OSqVuPFftAGEmLD7HHbyS6tslN4onlZeQpbkcp/PIZVYQMeOLIudz1H3NqL0RvG08hKyKvsbW6NUrXFEDB07sjIWPofE24jSG8XTykvISnC7jhAyOomTAfQ56pKj9OaE3NDctg1SZJQcI6JuxY5cJ2cGbL4BTUoY4VZsklmfKlS3/bh8mDdcKamUv5XtDqV8B6XFL8RRX5dLBSgZ05r/Voim1PBKQxnWrfpQCqlniZxELwpI03QIcdDrfzD5/BU8b1BIeeEyK7qEwmPr+WU2J2PFBk5ZlyR9aQSTcs7bWm5/539cmgRPzTnaqHRFLGm1UtKlnFvVFeEV7BZ6udKekWvqnEr0Ct1ViHurd8YtqktZKIjqijF9Jt3K8S/skjCmmgT94PKsZ4tBAZ/38ioNHM6QKcuaqF26qNQcYLs0iZIvc6YdqU9ppxlRg6G1EiGVrikpsKJKLVdqVI2uWzNujYFUV10RpjyPhI6dEGV/nt2x04i9rLrkSeBwLk01U0wsPv3q4RGJSx210kmwfUmjtP4RaRy7zeYF2dRgJ4jzzCjUuBm8mhlq1rMoICGv04RmHa5lcFYdYk9uUyGH42UXkThJHfYWRdJb6hEPkvzdI0iptC68LUAx3bsd+KzRLRA7Lw84G6668JSQj/bxae1O/oXde1c+bxIJiU8sH6qmg/q2HaceU0CO6CR2EYmH9eQqSLpHd88HKq3T88sTT3bvFp79hy3a03y7lWg6xWxqSa5rnyjPW3duBgwCZEFqbbjjRZLRRRC4zFWBXI+oS54OeZ9U7vSfP2uhtD+Onf4F81yYlrd7jrP7KdKhGNw8Mh37wDnfxWYfc8C0kiXCH+i+l4CEpru8sVFJvQQ4+pSimj7b/TOPfV5dkxZtgOInTIiBZXyfsNMyRQtOYSQZn5VedmtwOKHrPGYlYcNvheQH1c9g8+yUfCO75wmmvzYx/hWKBGvfzsGre9Xj2Mml/C8LMU2U9IbEsfOsBOF6A1+W6mWMimN3a8+qdLRveHy1Ek2ug4WfcanlVQ6LVTcgvJ6xVQSUJpwnkxdJzhe/9Of/jiRUnoOQOHYSA7CpJS5HZR9Noi47jGZFE35zgOjqFFL/wiH8LtJBq1iIGfkHPYuvL2+HUmExb3OiNHaYRCqMEO6kqbEcWrbUhVr7lXXdlp4LjZRkU9Z2XmO3w9Z6IJ9lanRVMp/lQ/KcsY5ddxtbrn5JFpJaAtgfQtaIpm7ms5Dhfyt29tXX2f5LXbc3nyVC+lSPz6Rmv7L1pjvPGkSVri/Q/Cxsv6sJ1iqstTSx/btPM+O+/v7WMt/csn6eoLkVcZtaSgKeNXrmLagcvGO3s/yyNDtTt87UxpOdoebfoYyBUN8xCr90BQ/S1PplmCTwpN1KWDl2hBCScPYDnL3zy+X/1ieYi+0Xlu8IvOxQyR0qrL2688NlGpcQOVaOHXdEB2fq1pna+CdzbjjPRlzMgbsk34c73Lt6tlbyj0ftoNOrA2L6EnbSsHbzgnfsZnfpnO1vPTPXeiavVfX4TGo2OXA4B5arkz+fkYq7dt66QxV5hDH4hC1Yf0xfyJaSZr88MSBIx252l+6MZ1k0upR2Ttde0xl85v0v3XlmJ2Q3pXRnYoFKvt2Eu9y6UxJbb+t5ddax6+ox7bhd1033sDJ1QDFx7OBnJuQqWvPfClG+aOiuitutOOBenUR1Ih9SzxI5EmOWISlsvvpKihweX61E01s/4In+ROz+h94JCK/nvIpaS4Gt5L6VSW+AqVdXL9T7F6MOkudgqDh2pv9eAvTI/Z37uvOgzw9mk+GmF5X/VkirIlSFCOWj1Am1yzOMpmgK8jKiSs04dofYvCaBncqznu1K0U1ptFaAaJQ8nIXA2HV1AyxSLwE2n3NP6OvYwOHQjPX4bNWLyn8rpM88ZbXcioVrFNpwayGqpEIzFiMvJqrgdOwOsXl9AjtVoGN3+cSf0oi+HenduiQPZ8ehX9nFHH5IcBNNr7Ze3f50fGa9N2JyJNvskwI/hYPiyf1tdkbrUYc9a3SqEUrRNG/oDV7pXF0sx5G7y1eldqlrAJzZNoNTKG2OHcfPDty963aqsC0yoG/HLjcvbLuHIJw3lP2htGHJbtZHfU8uz6ZPXcbPS7piRw9Mhgzct5M6dhw8OVj37mjpyjWCJMmiUYby7ZbvdXkBly/yCLCS4fjPG/TqlNzuq9mlzktlUW4l9+000hLuw50sHHYBArB+5KJMG2WQ5h7EDLIY7Fczcl729pNJXJiUjBPiBHjUzOjUWuk8nLIH5n0YdfCu5thx5MixqKtEoGdbhLc73ADIaO87JBui1w3s6fg+mXn+/Czd+4fePBLFki5dVOy6nXF+IvbyVfvlDFB5LlenBLuhA5Hzj0y4RELCSY4sAE8w1CWH6A2Pr3aAepvQIQf+ZTonvJ6B3YkMRXgcu4o9mlTh1l3+NSx5niTdPrfeF7AYhg4qCJmb/OyCj/AovTn+4U62X7gWYX4fURZY123p+bAVQvRYx66rx7SzC1z3kNAnhBBzjiXQaC0syY/Sm+Ps2GELbl2NSujYEQui+lWSqglr1xH0jliA/K1YQobC7tVV/Q5glN4onlbeQC5PEwKJLh8JxvRGhdY4IqYnQDEh42PnbeyUfI4ovVH4lJcnTl48dkMsGecWBdFDx44sy9kBAl5iGFavP7nLBSlvLpO+HSFYlG9sO1KJG3TsyIJEBflbPrhggptVYxafkHnJX5taxysmhBBCCCGEtPEXY17KDo2nBLoAAAAASUVORK5CYII=";
				
			// save the image
			ViewConstants.icons = icons;
		}

		// create the icon manager
		this.iconManager = new IconManager(icons, context);

		// add the icons
		this.iconManager.add("play", w, h);
		this.iconManager.add("pause", w, h);
		this.iconManager.add("tostart", w, h);
		this.iconManager.add("menu", w, h);
		this.iconManager.add("stepback", w, h);
		this.iconManager.add("stepforward", w, h);
		this.iconManager.add("autofit", w, h);
		this.iconManager.add("fit", w, h);
		this.iconManager.add("grid", w, h);
		this.iconManager.add("shrink", w, h);
		this.iconManager.add("draw", w, h);
		this.iconManager.add("hexgrid", w, h);
		this.iconManager.add("lines", w, h);
		this.iconManager.add("pan", w, h);
		this.iconManager.add("pick", w, h);
		this.iconManager.add("states", w, h);
		this.iconManager.add("hexagongrid", w, h);
		this.iconManager.add("trianglegrid", w, h);
		this.iconManager.add("select", w, h);
		this.iconManager.add("undo", w, h);
		this.iconManager.add("redo", w, h);
	};

	// update grid icon based on hex or square mode
	View.prototype.updateGridIcon = function() {
		// check for hex mode
		if (this.engine.isHex) {
			if (this.engine.useHexagons) {
				this.gridToggle.icon = [this.iconManager.icon("hexagongrid")];
			} else {
				this.gridToggle.icon = [this.iconManager.icon("hexgrid")];
			}
		} else {
			// check for triangular mode
			if (this.engine.isTriangular) {
				this.gridToggle.icon = [this.iconManager.icon("trianglegrid")];
			} else {
				this.gridToggle.icon = [this.iconManager.icon("grid")];
			}
		}
	};

	// mouse wheel
	View.prototype.wheel = function(me, event) {
		// check if the canvas has focus
		if (me.menuManager.hasFocus) {
			// update wheel position if not computing history
			if (!me.computeHistory) {
				if (event.wheelDelta) {
					me.wheelDelta = event.wheelDelta / 120;
				} else {
					if (event.detail) {
						me.wheelDelta = -event.detail / 3;
					}
				}

				// ensure update happens
				me.menuManager.setAutoUpdate(true);
			}

			// prevent default behaviour
			event.preventDefault();
			return false;
		}
	};

	// update camera during POI transition
	View.prototype.updateCameraPOI = function() {
		// compute linear completion
		var linearComplete = (this.targetPOI === 0 ? 0 : this.stepsPOI / this.targetPOI),

		    // compute bezier completion
		    bezierComplete = this.waypointManager.bezierX(linearComplete, 0, 0, 1, 1),

		    // get angle
		    startAngle = this.startAnglePOI,
		    endAngle = this.endAnglePOI;

		// set the camera position
		this.engine.xOff = this.engine.width / 2 - (this.startXPOI + (bezierComplete * (this.endXPOI - this.startXPOI)));
		this.engine.yOff = this.engine.height / 2 - (this.startYPOI + (bezierComplete * (this.endYPOI - this.startYPOI)));

		// set the camera zoom
		this.engine.zoom = this.startZoomPOI * Math.pow(this.endZoomPOI / this.startZoomPOI, bezierComplete);

		// check if angle wrap around needed
		if (endAngle - startAngle > 180) {
			startAngle += 360;
		} else {
			if (endAngle - startAngle < -180) {
				endAngle += 360;
			}
		}

		// set the camera angle
		this.engine.angle = (startAngle + bezierComplete * (endAngle - startAngle)) % 360;

		// check if layers defined
		if (this.depthPOIused) {
			this.engine.layerDepth = this.startDepthPOI + (bezierComplete * (this.endDepthPOI - this.startDepthPOI));
			this.depthItem.current = this.viewDepthRange([this.engine.layerDepth, this.engine.layerDepth], false, this);
		}

		if (this.layersPOIused) {
			this.engine.layers = this.startLayersPOI + (bezierComplete * (this.endLayersPOI - this.startLayersPOI));
			this.layersItem.current = this.viewLayersRange([this.engine.layers, this.engine.layers], false, this);
		}

		// update step
		this.stepsPOI += 1;

		// check if POI reached
		if (this.stepsPOI > this.targetPOI) {
			// disable transition
			this.stepsPOI = -1;

			// ensure target reached exactly
			this.engine.zoom = this.endZoomPOI;
			this.engine.angle = endAngle % 360;
			this.engine.xOff = this.engine.width / 2 - this.endXPOI;
			this.engine.yOff = this.engine.height / 2 - this.endYPOI;

			if (this.depthPOIused) {
				this.engine.layerDepth = this.endDepthPOI;
				this.depthItem.current = this.viewDepthRange([this.engine.layerDepth, this.engine.layerDepth], false, this);
			}
			if (this.layersPOIused) {
				this.engine.layers = this.endLayersPOI;
				this.layersItem.current = this.viewLayersRange([this.engine.layers, this.engine.layers], false, this);
			}
		}

		// update zoom control
		if (this.zoomItem) {
			this.zoomItem.current = this.viewZoomRange([this.engine.zoom, this.engine.zoom], false, this);
		}

		// update angle control if available
		if (this.angleItem) {
			this.angleItem.current = this.viewAngleRange([this.engine.angle, this.engine.angle], false, this);
		}
	};

	// set camera from POI
	View.prototype.setCameraFromPOI = function(me, poiNumber) {
		// get the point of interest
		var poi = me.waypointManager.poiList[poiNumber];

		// save start point
		me.startXPOI = me.engine.width / 2 - me.engine.xOff;
		me.startYPOI = me.engine.height / 2 - me.engine.yOff;
		me.startZoomPOI = me.engine.zoom;
		me.startAnglePOI = me.engine.angle;

		// save end point
		if (poi.xDefined) {
			me.endXPOI = poi.x;
		} else {
			me.endXPOI = me.startXPOI;
		}
		if (poi.yDefined) {
			me.endYPOI = poi.y;
		} else {
			me.endYPOI = me.startYPOI;
		}
		if (poi.zoomDefined) {
			me.endZoomPOI = poi.zoom;
		} else {
			me.endZoomPOI = me.startZoomPOI;
		}
		if (poi.angleDefined) {
			me.endAnglePOI = poi.angle;
		} else {
			me.endAnglePOI = me.startAnglePOI;
		}

		// check for hex mode
		if (me.engine.isHex) {
			me.endXPOI += me.engine.yOff / 2;
		}

		// check for depth
		me.depthPOIused = poi.depthDefined;
		if (me.depthPOIused) {
			me.startDepthPOI = me.engine.layerDepth;
			me.endDepthPOI = poi.depth / ViewConstants.depthScale;
		}

		// check for layers
		me.layersPOIused = poi.layersDefined;
		if (me.layersPOIused) {
			me.startLayersPOI = me.engine.layers;
			me.endLayersPOI = poi.layers;
		}

		// reset step number for transition
		me.stepsPOI = 0;
		me.targetPOI = poi.poiTransitionSpeed;
		me.updateCameraPOI();

		// check for reset
		if (poi.resetAtPOI) {
			me.resetGeneration(me);
		}

		// check for play or stop
		if (poi.modeAtPOI === WaypointConstants.play) {
			me.playList.current = me.viewPlayList(ViewConstants.modePlay, true, me);
		} else {
			if (poi.modeAtPOI === WaypointConstants.stop) {
				// check if already paused
				if (me.generationOn) {
					me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
				}
			}
		}

		// check if theme defined
		if (poi.themeDefined) {
			// set the new theme
			me.themeItem.current = me.viewThemeRange([poi.theme, ""], true, me);
		}

		// notify POI changed
		me.menuManager.notification.notify("POI " + (poiNumber + 1), 15, 60, 15, true);

		// check for message
		if (poi.textMessage !== "") {
			me.menuManager.notification.notify(poi.textMessage, 15, 180, 15, false);
		} else {
			me.menuManager.notification.clear(false, true);
		}

		// set STOP if defined
		if (poi.stopGenDefined) {
			me.stopGeneration = poi.stopGeneration;
		}

		// set LOOP if defined
		if (poi.loopGenDefined) {
			me.loopGeneration = poi.loopGeneration;
		}

		// set GPS
		if (poi.gpsDefined) {
			me.genSpeed = Math.sqrt((poi.gps - ViewConstants.minGenSpeed) / (ViewConstants.maxGenSpeed - ViewConstants.minGenSpeed));
			me.generationRange.current = me.viewGenerationRange([me.genSpeed, me.genSpeed], true, me);
		}

		// set STEP
		if (poi.stepDefined) {
			me.gensPerStep = poi.step;
			me.stepRange.current = me.viewStepRange([me.gensPerStep, me.gensPerStep], true, me);
		}

		// check for POIT
		if (poi.targetGenDefined) {
			// check the target hasn't already passed
			if (me.engine.counter > poi.targetGen) {
				// reset
				me.resetGeneration(me);
			}

			// compute to the poi target generation
			if (me.engine.counter < poi.targetGen) {
				me.computeHistory = true;
				me.computeHistoryTarget = poi.targetGen;
				me.computeHistoryClear = false;
			}
		}

		// check for grid
		if (poi.gridDefined) {
			me.engine.displayGrid = poi.grid;
		}

		// check for stars
		if (poi.starsDefined) {
			this.starsOn = poi.stars;
		}
	};

	// change zoom if no autofit
	View.prototype.changeZoom = function(me, newZoom, integerOnly) {
		// compute tracked zoom
		var adjustedZoom = newZoom / me.engine.originZ;

		// check for integer zoom
		if (integerOnly) {
			if (newZoom >= 1) {
				newZoom = Math.round(newZoom);
			} else {
				newZoom = 1 / Math.round(1 / newZoom);
			}
			adjustedZoom = newZoom / me.engine.originZ;
		}

		// check for controls locked
		if (!me.controlsLocked) {
			// save start point
			me.startXPOI = me.engine.width / 2 - me.engine.xOff;
			me.startYPOI = me.engine.height / 2 - me.engine.yOff;
			me.startZoomPOI = me.engine.zoom;
			me.startAnglePOI = me.engine.angle;

			// save end point
			me.endXPOI = me.startXPOI;
			me.endYPOI = me.startYPOI;
			me.endZoomPOI = adjustedZoom;
			me.endAnglePOI = me.startAnglePOI;

			// reset step number for transition
			me.stepsPOI = 0;
		}
	};

	// undo button
	View.prototype.undoPressed = function(me) {
		me.undo(me);
	};

	// copy RLE button
	View.prototype.copyRLEPressed = function(me) {
		me.copyCurrentRLE(me, true);
	};

	// redo button
	View.prototype.redoPressed = function(me) {
		me.redo(me);
	};

	// graph close button
	View.prototype.graphClosePressed = function(me) {
		me.popGraph = false;
		me.graphButton.current = me.viewGraphToggle([me.popGraph], true, me);
	};

	// close button
	/* eslint-disable no-unused-vars */
	View.prototype.closePressed = function(me) {
		// check if errors displayed
		if (me.scriptErrors.length) {
			// clear errors
			me.scriptErrors = [];
			me.displayErrors = 0;
		} else {
			/* eslint-enable no-unused-vars */
			// hide the viewer
			hideViewer();
		}
	};

	// previous POI button
	View.prototype.prevPOIPressed = function(me) {
		// go to previous POI
		me.currentPOI -= 1;
		if (me.currentPOI < 0) {
			me.currentPOI = me.waypointManager.numPOIs() - 1;
		}

		// set camera
		me.setCameraFromPOI(me, me.currentPOI);
	};

	// next POI button
	View.prototype.nextPOIPressed = function(me) {
		// go to next POI
		me.currentPOI += 1;
		if (me.currentPOI >= me.waypointManager.numPOIs()) {
			me.currentPOI = 0;
		}

		// set camera
		me.setCameraFromPOI(me, me.currentPOI);
	};

	// next universe button
	View.prototype.nextUniversePressed = function(me) {
		me.universe += 1;
		if (me.universe >= Controller.patterns.length) {
			me.universe = 0;
		}
		me.startViewer(Controller.patterns[me.universe].pattern, false);
	};

	// previous universe button
	View.prototype.prevUniversePressed = function(me) {
		me.universe -= 1;
		if (me.universe < 0) {
			me.universe = Controller.patterns.length - 1;
		}
		me.startViewer(Controller.patterns[me.universe].pattern, false);
	};

	// shrink button
	View.prototype.shrinkPressed = function(me) {
		// switch it on
		me.switchOnThumbnail();

		// close help if open
		if (me.displayHelp) {
			me.displayHelp = 0;
		}

		// hide navigation
		me.navToggle.current[0] = false;
		
		// mark toggle required
		me.menuManager.toggleRequired = true;
	};

	// sections button
	View.prototype.sectionsPressed = function(me) {
		me.showSections = true;
	}

	// topics button
	View.prototype.topicsPressed = function(me) {
		// switch to welcome topic
		me.setHelpTopic(ViewConstants.welcomeTopic, me);
	};

	// fit button
	View.prototype.fitPressed = function(me) {
		// fit zoom
		me.fitZoomDisplay(true, true);

		// flag manual change made if paused
		if (!me.generationOn) {
			me.manualChange = true;
		}
	};

	// grid toggle
	View.prototype.toggleGrid = function(newValue, change, me) {
		if (change) {
			me.engine.displayGrid = newValue[0];
		}

		return [me.engine.displayGrid];
	};

	// lines toggle
	View.prototype.toggleLines = function(newValue, change, me) {
		if (change) {
			me.popGraphLines = newValue[0];
		}

		return [me.popGraphLines];
	};

	// states toggle
	View.prototype.toggleStates = function(newValue, change, me) {
		if (change) {
			me.showStates = newValue[0];
		}

		return [me.showStates];
	};

	// pick toggle
	View.prototype.togglePick = function(newValue, change, me) {
		if (change) {
			me.pickMode = newValue[0];
			if (me.pickMode) {
				me.menuManager.notification.notify("Now click on a cell", 15, 180, 15, true);
			}
		}

		return [me.pickMode];
	};

	// autofit toggle
	View.prototype.toggleAutoFit = function(newValue, change, me) {
		if (change) {
			me.autoFit = newValue[0];

			// autofit now if just switched on and playback paused
			if (me.autoFit && !me.generationOn) {
				me.fitZoomDisplay(true, true);
			}
		}

		return [me.autoFit];
	};

	// loop indicator toggle
	View.prototype.toggleLoop = function(newValue, change, me) {
		if (change) {
			// check if loop defined
			if (me.loopGeneration !== -1) {
				me.loopDisabled = !newValue[0];

				// check for waypoints
				if (me.waypointsDefined) {
					// set waypoints to loop mode
					me.waypointsDisabled = me.loopDisabled;
					me.menuManager.notification.notify("Loop and Waypoints " + (me.loopDisabled ? "Off" : "On"), 15, 40, 15, true);
				} else {
					// check for track
					if (me.trackDefined) {
						// set track to loop mode
						me.trackDisabled = me.loopDisabled;
						me.menuManager.notification.notify("Loop and Track " + (me.loopDisabled ? "Off" : "On"), 15, 40, 15, true);

						// adjust origin if track switched on or off
						me.adjustOrigin(me.trackDisabled);
					} else {
						// just loop
						me.menuManager.notification.notify("Loop " + (me.loopDisabled ? "Off" : "On"), 15, 40, 15, true);
					}
				}
			}
		}

		return [me.loopDisabled];
	};

	// waypoint/track indictor toggle
	View.prototype.toggleWP = function(newValue, change, me) {
		var result = [false];

		if (change) {
			// check for track
			if (me.trackDefined) {
				me.trackDisabled = !newValue[0];

				// adjust origin if track switched on or off
				me.adjustOrigin(me.trackDisabled);

				// check for loop
				if (me.loopGeneration !== -1) {
					// set loop to track mode
					me.loopDisabled = me.trackDisabled;
					me.menuManager.notification.notify("Loop and Track " + (me.loopDisabled ? "Off" : "On"), 15, 40, 15, true);
				} else {
					// just track
					me.menuManager.notification.notify("Track " + (me.trackDisabled ? "Off" : "On"), 15, 40, 15, true);
				}
			} else {
				// check for waypoints
				if (me.waypointsDefined) {
					me.waypointsDisabled = !newValue[0];

					// check for loop
					if (me.loopGeneration !== -1) {
						// set loop to waypoints mode
						me.loopDisabled = me.waypointsDisabled;
						me.menuManager.notification.notify("Loop and Waypoints " + (me.loopDisabled ? "Off" : "On"), 15, 40, 15, true);
					} else {
						// just waypoints
						me.menuManager.notification.notify("Waypoints " + (me.waypointsDisabled ? "Off" : "On"), 15, 40, 15, true);
					}
				}
			}
		}

		// check for track
		if (me.trackDefined) {
			result = [me.trackDisabled];
		} else {
			result = [me.waypointsDisabled];
		}

		return result;
	};

	// help toggle
	View.prototype.toggleHelp = function(newValue, change, me) {
		if (change) {
			me.displayHelp = newValue[0];
			if (me.displayHelp) {
				// show Scripts topic if there are script errors
				if (me.scriptErrors.length) {
					me.setHelpTopic(ViewConstants.scriptsTopic, me);
				}
			} else {
				// reset to welcome topic on close
				me.setHelpTopic(ViewConstants.welcomeTopic, me);
				me.displayHelp = 0;
			}
		}

		return [me.displayHelp];
	};
	
	// stats toggle
	View.prototype.viewStats = function(newValue, change, me) {
		if (change) {
			me.statsOn = newValue[0];

			// check if stats just turned on
			if (me.statsOn) {
				// see if any cells are alive
				if (me.engine.anythingAlive) {
					// if at zero then used save position
					if (me.engine.counter === 0) {
						me.engine.population = me.engine.resetSnapshot.population;
						me.engine.births = me.engine.resetSnapshot.births;
						me.engine.deaths = me.engine.resetSnapshot.deaths;
					} else {
						// check for Generations or HROT rule
						if (me.engine.multiNumStates === -1) {
							// go to previous generation
							me.engine.counter -= 1;

							// compute next generation
							me.engine.nextGeneration(true, me.noHistory, me.graphDisabled);

							// paste any RLE snippets
							me.pasteRLEList();
						}
					}
				} else {
					// zero the population
					me.engine.population = 0;
					me.engine.births = 0;
					me.engine.deaths = 0;
				}
			}
		}

		// ensure update happens
		me.menuManager.setAutoUpdate(true);

		return [me.statsOn];
	};

	// scroll errors up
	View.prototype.scrollErrorsUp = function(me, amount) {
		// scroll errors up
		if (me.displayErrors > 1) {
			me.displayErrors -= amount;
			if (me.displayErrors < 1)  {
				me.displayErrors = 1;
			}
		}
	};

	// scroll errors down
	View.prototype.scrollErrorsDown = function(me, amount) {
		if (me.displayErrors < me.scriptErrors.length - me.numHelpPerPage + 1) {
			me.displayErrors += amount;
			if (me.displayErrors > me.scriptErrors.length - me.numHelpPerPage + 1) {
				me.displayErrors = me.scriptErrors.length - me.numHelpPerPage + 1;
			}
		}
	};

	// scroll help up
	View.prototype.scrollHelpUp = function(me, amount) {
		// scroll help up
		if (me.displayHelp > 1) {
			me.displayHelp -= amount;
			if (me.displayHelp < 1)  {
				me.displayHelp = 1;
			}
		}
	};

	// scroll help down
	View.prototype.scrollHelpDown = function(me, amount) {
		if (me.displayHelp < me.numHelpLines - me.numHelpPerPage) {
			me.displayHelp += amount;
			if (me.displayHelp > me.numHelpLines - me.numHelpPerPage) {
				me.displayHelp = me.numHelpLines - me.numHelpPerPage;
			}
		}
	};

	// move to previous help section
	View.prototype.previousHelpSection = function(me) {
		// find help section before current line
		var i = me.helpSections.length - 1,
		    found = false;

		while (i >= 0 && !found) {
			if (me.displayHelp <= me.helpSections[i][0]) {
				i = i - 1;
			} else {
				found = true;
			}
		}
		if (found) {
			me.displayHelp = me.helpSections[i][0];
		}
	};

	// move to next help section
	View.prototype.nextHelpSection = function(me) {
		// find help section after current line
		var i = 0,
		    found = false;

		while (i < me.helpSections.length && !found) {
			if (me.displayHelp >= me.helpSections[i][0]) {
				i = i + 1;
			} else {
				found = true;
			}
		}
		if (found) {
			me.displayHelp = me.helpSections[i][0];
		}
	};

	// run to given generation (used to step back)
	View.prototype.runTo = function(targetGen) {
		var fading = this.historyStates + (this.engine.multiNumStates > 0 ? this.engine.multiNumStates : 0);

		// check whether history enabled
		if (this.noHistory) {
			this.menuManager.notification.notify("Step back disabled", 15, 40, 15, true);
		} else {
			// check if update event process
			if (this.menuManager.processedEvent) {
				this.menuManager.processedEvent = false;

				// ensure target generation is not negative
				if (targetGen < 0) {
					targetGen = 0;
				}

				// restore the elapsed time
				this.elapsedTime = this.elapsedTimes[targetGen];
				this.floatCounter = targetGen;
				this.originCounter = targetGen;
	
				// don't actually step back if pattern is dead at the requested generation
				if (this.diedGeneration !== -1 && targetGen > this.diedGeneration + fading) {
					this.engine.counter = targetGen;
				} else {
					// run to target generation
					this.engine.runTo(targetGen, this.statsOn, this.graphDisabled, this);
				}
	
				// notify waypoint manager of change
				this.waypointManager.steppedBack(this.elapsedTime);
	
				// mark manual change
				this.manualChange = true;
	
				// check if the target generation was reached
				if (targetGen !== this.engine.counter) {
					// need to compute history
					this.computeHistory = true;
	
					// set history target generation
					this.computeHistoryTarget = targetGen;
	
					// reset
					this.engine.restoreSavedGrid(false);
	
					// compute history
					this.menuManager.notification.notify("Computing previous generations", 15, 10000, 15, true);
					this.computeHistoryClear = true;
				}
			}
		}
	};

	// hide a DOM element
	View.prototype.hideElement = function(element) {
		element.style.width = "2em";
		element.style.height = "2em";
		element.style.padding = 0;
		element.style.bord3er = "none";
		element.style.outline = "none";
		element.style.boxShadow = "none";
		element.style.background = "transparent";
		element.style.position = "fixed";
		element.style.left = "-100px";
		element.style.top = "0px";
	};

	// copy string to clipboard
	View.prototype.copyToClipboard = function(me, contents, twoPhase) {
		var elementType = "textarea",
			processingTime = 0;

		// setup the contents to copy
		me.tempRLE = contents;
		me.tempRLEAmount = 0;
		me.tempRLELength = contents.length;

		// try the copy in a single pass if small and fast enough
		if (twoPhase) {
			// check for Edge browser

			processingTime = performance.now() - me.copyStartTime;
			if (processingTime < ViewConstants.copyTimeThreshold && me.tempRLELength < ViewConstants.copySizeThreshold) {
				twoPhase = false;
			} else {
				// don't use a div if running on Edge since it can't multi-select elements so we have to use one textarea
				if (!me.isEdge) {
					elementType = "div";
				}
			}
		}

		// copy the element contents to a temporary off-screen element
		// since selection doesn't work on hidden elements
		me.tempDiv = document.createElement("div");
		me.tempDiv.contentEditable = true;
		me.hideElement(me.tempDiv);
		me.tempInput = document.createElement(elementType);
		me.hideElement(me.tempInput);
		me.tempInput.contentEditable = true;

		// add the the textarea to the div
		me.tempDiv.appendChild(me.tempInput);

		// add the new div to the document
		document.body.appendChild(me.tempDiv);

		// check if processing in a single phase
		if (!twoPhase) {
			me.tempInput.innerHTML = contents;
			me.completeCopyToClipboard(me, twoPhase);
		} else {
			// setup pause to display notification
			me.copyFrameWait = ViewConstants.copyWait;
			me.menuManager.notification.notify("Copying...", 15, 10000, 15, true);

			// set copy mode
			me.clipboardCopy = true;

			// disable menu
			me.viewMenu.locked = true;
		}
	};

	// complete copy to clipboard
	View.prototype.completeCopyToClipboard = function(me, twoPhase) {
		// select and copy the temporary elements contents to the clipboard
		if (!me.isEdge) {
			me.tempDiv.focus();
		} else {
			me.tempInput.focus();
		}

		try {
			document.execCommand("selectAll");
			document.execCommand("copy");
		}
		catch(err) {
		}

		// remove the temporary element
		document.body.removeChild(me.tempDiv);
		me.tempRLE = "";

		// set focus to the canvas
		me.mainContext.canvas.focus();

		// clear notification
		me.menuManager.notification.notify("Copy complete", 15, 120, 15, true);

		if (twoPhase) {
			// clear copy mode
			me.clipboardCopy = false;

			// unlock menu
			me.viewMenu.locked = false;
		}

		me.copyStartTime = -1;
	};

	// convert a theme colour object to an RGB string or colour name
	View.prototype.asColourString = function(colourRGB) {
		var colourList = ColourManager.colourList,
			keys = Object.keys(colourList),
			redValue = colourRGB.red,
			greenValue = colourRGB.green,
			blueValue = colourRGB.blue,
		    result = "",
		    found = false,
		    triple = null,
		    i = 0;

		// search the object for a key matching the r, g, b
		while (i < keys.length && !found) {
			// get the value at the key
			triple = colourList[keys[i]];

			// check if it matches the R G B triple
			if (triple[1] === redValue && triple[2] === greenValue && triple[3] === blueValue) {
				// mark found and exit loop
				found = true;
				i = keys.length;
			} else {
				// try next
				i += 1;
			}
		}

		// check if name found
		if (found) {
			result = triple[0];
		} else {
			result = redValue + " " + greenValue + " " + blueValue;
		}
	
		// return the string
		return result;
	};

	// check if two colours are the same
	View.prototype.areSameColour = function(first, second) {
		return ((first.red === second.red) && (first.green === second.green) && (first.blue === second.blue));
	};

	// add the current position to the clipboard as script commands
	View.prototype.copyPosition = function(me, full) {
		// comment prefix
		var commentPrefix = "#C ",

		    // start with script start command
		    string = commentPrefix + Keywords.scriptStartWord + " ",

		    // compute the x and y coordinates
		    xVal = -((me.engine.width / 2 - me.engine.xOff - me.engine.originX) | 0),
			yVal = -((me.engine.height / 2 - me.engine.yOff - me.engine.originY) | 0),
			xValStr = String(xVal),
			yValStr = String(yVal),

			// get the zoom
			zoom = me.engine.zoom,
			zoomStr,

			// get the angle
			angleStr = me.engine.angle | 0,

			// get the theme
			theme = me.engine.themes[me.engine.colourTheme];

		// check for non-zero generation
		if (me.engine.counter !== 0) {
			// add T and the generation
			string += Keywords.tWord + me.engine.counter + " ";
		} 

		// camera position
		string += Keywords.xWord + " " + xValStr + " " + Keywords.yWord + " " + yValStr + " ";

		// camera zoom
		if (zoom === (zoom | 0)) {
			zoomStr = String(zoom);
		} else {
			zoomStr = String(zoom.toFixed(2));
		}
		string += Keywords.zoomWord + " " + zoomStr + " ";

		// camera angle
		string += Keywords.angleWord + " " + angleStr + " ";

		// add script end
		string += Keywords.scriptEndWord + "\n";

		// check for view
		if (full) {
			// add start word
			string += commentPrefix + Keywords.scriptStartWord + " ";

			// check for custom theme
			if (me.customTheme) {
				if (me.engine.multiNumStates > 2) {
					// output multi-state theme
					string += Keywords.colorWord + " " + Keywords.themeBackgroundWord + " " + me.asColourString(theme.unoccupiedGen);
					string += " " + Keywords.colorWord + " " + Keywords.themeAliveWord + " " + me.asColourString(theme.aliveGen);
					// do not output DEAD if the same as BACKGROUND
					if (!(me.areSameColour(theme.deadRangeGen.endColour, theme.unoccupiedGen))) {
						string += " " + Keywords.colorWord + " " + Keywords.themeDeadWord + " " + me.asColourString(theme.deadRangeGen.endColour);
					}
					// do not output DEADRAMP if the same as DEAD
					if (!(me.areSameColour(theme.deadRangeGen.startColour, theme.deadRangeGen.endColour))) {
						string += " " + Keywords.colorWord + " " + Keywords.themeDeadRampWord + " " + me.asColourString(theme.deadRangeGen.startColour);
					}
					// do not output DYING if dynamic THEME
					if (!(theme.dyingRangeDynamic)) {
						string += " " + Keywords.colorWord + " " + Keywords.themeDyingWord + " " + me.asColourString(theme.dyingRangeGen.endColour);
					}
					// do not output DYINGRAMP if the same as DYING unless dynamic THEME
					if (theme.dyingRangeDynamic || !(me.areSameColour(theme.dyingRangeGen.startColour, theme.dyingRangeGen.endColour))) {
						string += " " + Keywords.colorWord + " " + Keywords.themeDyingRampWord + " " + me.asColourString(theme.dyingRangeGen.startColour);
					}
				} else {
					// output 2-state theme
					string += Keywords.colorWord + " " + Keywords.themeBackgroundWord + " " + me.asColourString(theme.unoccupied);
					string += " " + Keywords.colorWord + " " + Keywords.themeAliveWord + " " + me.asColourString(theme.aliveRange.startColour);
					// do not output ALIVERAMP if the same as ALIVE
					if (!(me.areSameColour(theme.aliveRange.startColour, theme.aliveRange.endColour))) {
						string += " " + Keywords.colorWord + " " + Keywords.themeAliveRampWord + " " + me.asColourString(theme.aliveRange.endColour);
					}
					// do not output DEAD if the same as BACKGROUND
					if (!(me.areSameColour(theme.deadRange.endColour, theme.unoccupied))) {
						string += " " + Keywords.colorWord + " " + Keywords.themeDeadWord + " " + me.asColourString(theme.deadRange.endColour);
					}
					// do not output DEADRAMP if the same as DEAD
					if (!(me.areSameColour(theme.deadRange.startColour, theme.deadRange.endColour))) {
						string += " " + Keywords.colorWord + " " + Keywords.themeDeadRampWord + " " + me.asColourString(theme.deadRange.startColour);
					}
				}
				string += " " + Keywords.scriptEndWord + "\n" + commentPrefix + Keywords.scriptStartWord + " ";
			}
			// add theme
			string += Keywords.themeWord + " " + theme.name + " "; 

			// add HISTORYSTATES if not default
			if (me.historyStates !== me.maxHistoryStates) {
				string += Keywords.historyStatesWord + " " + me.historyStates + " ";
			}

			// add width and height
			string += Keywords.widthWord + " " + me.displayWidth + " ";
			string += Keywords.heightWord + " " + me.displayHeight + " ";

			// add script end
			string += Keywords.scriptEndWord + "\n";
		}

		// copy to clipboard
		me.copyToClipboard(me, string, false);
	};

	// save the current rle to the source document node
	View.prototype.saveCurrentRLE = function(me) {
		me.element.innerHTML = me.engine.asRLE(me, me.engine, true);
	};

	// select and copy reset position rle
	View.prototype.copyRLE = function(me, twoPhase) {
		// copy the source pattern to the clipboard
		me.copyStartTime = performance.now();
		if (DocConfig.multi) {
			me.copyToClipboard(me, Controller.patterns[me.universe].pattern, twoPhase);
		} else {
			me.copyToClipboard(me, cleanPattern(me.element), twoPhase);
		}
	};

	// select and copy current rle
	View.prototype.copyCurrentRLE = function(me, addComments) {
		// copy the current pattern to the clipboard
		me.copyStartTime = performance.now();
		me.copyToClipboard(me, me.engine.asRLE(me, me.engine, addComments), true);
	};

	// process key
	View.prototype.processKey = function(me, keyCode, event) {
		// flag event processed
		var processed = true,

		    // value for changes
		    value = 0;

		// check if gui enabled
		if (me.noGUI) {
			// gui disabled so check if NOGUI was defined
			if (!me.noGUIDefined) {
				// user disabled the GUI so check for toggle key 'u'
				if (keyCode === 85) {
					me.noGUI = !me.noGUI;
					me.viewMenu.deleted = me.noGUI;
					me.menuManager.noGUI = me.noGUI;
				}
			}
		} else {
			// check for control (other than control-C, control-S or control-Z) or meta
			if ((event.ctrlKey && (!(keyCode === 67 || keyCode === 83 || keyCode === 90))) || event.metaKey) {
				// convert control-arrow keys into PageUp/PageDown/Home/End
				if (event.ctrlKey && (keyCode >= 37 && keyCode <= 40)) {
					if (keyCode === 37) {
						keyCode = 33;
					} else if (keyCode === 38)  {
						keyCode = 36;
					} else if (keyCode === 39)  {
						keyCode = 34;
					} else if (keyCode === 40)  {
						keyCode = 35;
					}
				} else {
					// handle control-R since it would refresh the browser and Golly uses it for pattern reset
					if (!(event.ctrlKey && keyCode === 82)) {
						// clear key code so it is not handled here
						keyCode = -1;
					}
				}
			}

			// check for alt-number
			if (event.altKey && !event.ctrlKey) {
				if (keyCode >= 49 && keyCode <= 57) {
					value = keyCode - 49;
					if (value >= 0 && value < me.waypointManager.numPOIs()) {
						me.currentPOI = value;

						// set camera
						me.setCameraFromPOI(me, me.currentPOI);
					}
				} else {
					switch (keyCode) {
						// c for default theme
						case 67:
							// set default theme
							if (!me.multiStateView) {
								me.themeItem.current = me.viewThemeRange([me.defaultTheme, ""], true, me);
								if (!me.engine.isNone) {
									me.menuManager.notification.notify(me.themeName(me.engine.colourTheme) + " Theme", 15, 40, 15, true);
								}
							}
							break;
						// h for [R]History on
						case 72:
							if (me.engine.isLifeHistory) {
								me.engine.displayLifeHistory = true;
								me.engine.drawOverlay = true;
								me.menuManager.notification.notify("[R]History Display " + (me.engine.displayLifeHistory ? "On" : "Off"), 15, 40, 15, true);
							}
							break;
						// j for [R]History off
						case 74:
							if (me.engine.isLifeHistory) {
								me.engine.displayLifeHistory = false;
								me.engine.drawOverlay = false;
								me.menuManager.notification.notify("[R]History Display " + (me.engine.displayLifeHistory ? "On" : "Off"), 15, 40, 15, true);
							}
							break;
						// k for toggle kill gliders
						case 75:
							// toggle kill gliders
							me.engine.clearGliders = !me.engine.clearGliders;
							me.menuManager.notification.notify("Kill Gliders " + (me.engine.clearGliders ? "On" : "Off"), 15, 40, 15, true);
							break;
						// x for cell borders
						case 88:
							// toggle cell borders
							me.bordersButton.current = me.viewBordersToggle([!me.engine.cellBorders], true, me);
							break;
						// slash for toggle hex/offset square grid
						case 191:
							// switch between hexagonal and square cells for hex display
							if (!me.engine.isTriangular) {
								me.hexCellButton.current = me.viewHexCellToggle([!me.engine.useHexagons], true, me);
								me.menuManager.notification.notify("Hex display uses " + (me.engine.useHexagons ? "Hexagons" : "Squares"), 15, 40, 15, true);
							}
							break;
					}
				}

				// clear keyCode so it is not handled here
				keyCode = -2;
			}

			// determine if the key can be processed
			switch (keyCode) {
			// '/' for toggle hex
			case 191:
			case 111: // num /
				// ignore if triangular grid
				if (!me.engine.isTriangular) {
					// check for shift key
					if (event.shiftKey) {
						// check if the pattern mode is currently used
						if (me.engine.patternDisplayMode !== me.engine.isHex) {
							me.hexButton.current = me.viewHexToggle([me.engine.patternDisplayMode], true, me);
						}
					} else {
						// toggle hex mode
						me.hexButton.current = me.viewHexToggle([!me.engine.isHex], true, me);
					}
	
					// display notification
					me.menuManager.notification.notify("Hex Display " + (me.engine.isHex ? "On" : "Off"), 15, 40, 15, true);
				}
				break;

			// b for back one step
			case 66:
				// do not move if in view only mode
				if (!me.viewOnly) {
					// check if paused
					if (!me.generationOn) {
						// check if at start
						if (me.engine.counter > 0) {
							// run from start to previous generation
							me.runTo(me.engine.counter - 1);

							// adjust undo stack pointer
							me.setUndoGen(me.engine.counter);
						}
					} else {
						// pause
						me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
					}
				}
				break;

			// return for play/pause
			case 13:
				// do not play if view only mode
				if (!me.viewOnly) {
					// check if not playing
					if (me.playList.current === ViewConstants.modePlay) {
						// switch to pause
						me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
					} else {
						// switch to play
						me.playList.current = me.viewPlayList(ViewConstants.modePlay, true, me);
					}
				}
				break;

			// tab for pause/next step
			case 9:
				// do not pause if view only mode
				if (!me.viewOnly) {
					// check if playing
					if (me.generationOn) {
						// pause
						me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
					} else {
						// check for shift key
						if (event.shiftKey) {
							// step back if not at start
							if (me.engine.counter > 0) {
								// run from start to previous step
								me.runTo(me.engine.counter - me.gensPerStep);

								// adjust undo stack pointer
								me.setUndoGen(me.engine.counter - me.gensPerStep + 1);
							}
						} else {
							// step forward
							me.nextStep = true;
							me.afterEdit();
						}
					}
				}
				break;

			// space for pause/next generation
			case 32:
				// do not pause if view only mode
				if (!me.viewOnly) {
					// check if playing
					if (me.generationOn) {
						// pause
						me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
					} else {
						// next generation
						me.nextStep = true;
						me.singleStep = true;
						me.afterEdit();
					}
				}
				break;

			// w for toggle waypoint/track/loop mode
			case 87:
				// check if waypoints defined
				if (me.waypointsDefined) {
					// toggle waypoint mode
					me.waypointsDisabled = !me.waypointsDisabled;

					// check if loop defined
					if (me.loopGeneration !== -1) {
						// set loop mode to waypoint mode
						me.loopDisabled = me.waypointsDisabled;

						// display notification
						me.menuManager.notification.notify("Loop and Waypoints " + (me.waypointsDisabled ? "Off" : "On"), 15, 40, 15, true);
					} else {
						// display notification
						me.menuManager.notification.notify("Waypoints " + (me.waypointsDisabled ? "Off" : "On"), 15, 40, 15, true);
					}

					// check if waypoints have just been enabled
					if (!me.waypointsDisabled) {
						// check if at the last waypoint
						if (!me.waypointManager.atLast(me.elapsedTime)) {
							// find the closest waypoint to now
							me.waypointManager.findClosestWaypoint(me.engine.counter);

							// set the elapsed time
							me.elapsedTime = me.waypointManager.elapsedTimeTo(me.engine.counter);

							// create a temporary waypoint
							me.elapsedTime = me.waypointManager.createTemporaryPosition(me.engine.width / 2 - me.engine.xOff, me.engine.height / 2 - me.engine.yOff, me.engine.zoom, me.engine.angle, me.engine.layers, me.engine.layerDepth * ViewConstants.depthScale, me.engine.colourTheme, me.genSpeed, me.gensPerStep, me.engine.counter, me.elapsedTime);

							// clear manual change flag
							me.manualChange = false;
						}
					} else {
						// waypoints just disabled so remove any waypoint message
						me.menuManager.notification.clear(false, false);
					}
				} else {
					// check if track defined
					if (me.trackDefined) {
						// toggle track mode
						me.trackDisabled = !me.trackDisabled;

						// check if loop defined
						if (me.loopGeneration !== -1) {
							// set loop mode to waypoint mode
							me.loopDisabled = me.trackDisabled;

							// display notification
							me.menuManager.notification.notify("Loop and Track " + (me.trackDisabled ? "Off" : "On"), 15, 40, 15, true);
						} else {
							// display notification
							me.menuManager.notification.notify("Track " + (me.trackDisabled ? "Off" : "On"), 15, 40, 15, true);
						}

						// if track just disabled then add origin to position
						me.adjustOrigin(me.trackDisabled);
					} else {
						// check if loop defined
						if (me.loopGeneration !== -1) {
							me.loopDisabled = !me.loopDisabled;
							me.menuManager.notification.notify("Loop " + (me.loopDisabled ? "Off" : "On"), 15, 40, 15, true);
						}
					}
				}
				break;

			// e for increase step size
			case 69:
				// increase step size
				if (!me.stepRange.locked) {
					if (me.gensPerStep < ViewConstants.maxStepSpeed) {
						// check for shift
						if (event.shiftKey) {
							// go to maximum step
							me.gensPerStep = ViewConstants.maxStepSpeed;
						} else {
							// increase step
							me.gensPerStep += 1;
						}
						me.stepRange.current = me.viewStepRange([me.gensPerStep, me.gensPerStep], true, me);
					}
				}
				break;

			// d for decrease step size
			case 68:
				// decrease step size
				if (!me.stepRange.locked) {
					if (me.gensPerStep > ViewConstants.minStepSpeed) {
						// check for shift
						if (event.shiftKey) {
							// go to minimum step
							me.gensPerStep = ViewConstants.minStepSpeed;
						} else {
							// decrease step
							me.gensPerStep -= 1;
						}
						me.stepRange.current = me.viewStepRange([me.gensPerStep, me.gensPerStep], true, me);
					}
				}
				break;

			// z for stop other viewers
			case 90:
				// check for control
				if (event.ctrlKey) {
					// check for shift
					if (event.shiftKey) {
						// redo edit
						me.redo(me);
					} else {
						// undo edit
						me.undo(me);
					}
				} else {
					// check for shift
					if (event.shiftKey) {
						// stop all viewers
						value = Controller.stopAllViewers();
						if (value === 0) {
							me.menuManager.notification.notify("No LifeViewers playing", 15, 100, 15, true);
						} else {
							if (value > 1) {
								me.menuManager.notification.notify("Paused all LifeViewers", 15, 100, 15, true);
							}
						}
					} else {
						// stop other viewers
						value = Controller.stopOtherViewers(me);
						if (value > 0) {
							if (value > 1) {
								me.menuManager.notification.notify("Paused " + value + " other LifeViewers", 15, 100, 15, true);
							} else {
								me.menuManager.notification.notify("Paused " + value + " other LifeViewer", 15, 100, 15, true);
							}
						}
					}
				}
				break;

			// x for toggle grid lines
			case 88:
				// check for shift
				if (event.shiftKey) {
					// toggle major grid lines
					me.majorButton.current = me.viewMajorToggle([!me.engine.gridLineMajorEnabled], true, me);
					if (me.engine.gridLineMajor > 0) {
						me.menuManager.notification.notify("Major Grid Lines " + (me.engine.gridLineMajorEnabled ? "On" : "Off"), 15, 40, 15, true);
						me.clearHelpCache();
					}
				} else {
					// toggle grid
					me.engine.displayGrid = !me.engine.displayGrid;
					me.gridToggle.current = me.toggleGrid([me.engine.displayGrid], true, me);
					me.menuManager.notification.notify("Grid Lines " + (me.engine.displayGrid ? "On" : "Off"), 15, 40, 15, true);
				}
				break;

			// y for toggle graph
			case 89:
				// check if graph disabled
				if (me.graphDisabled) {
					me.menuManager.notification.notify("Graph Disabled", 15, 40, 15, true);
				} else {
					// check for shift
					if (event.shiftKey) {
						// toggle lines
						me.popGraphLines = !me.popGraphLines;
						me.linesToggle.current = me.toggleLines([me.popGraphLines], true, me);
						me.menuManager.notification.notify("Graph " + (me.popGraphLines ? "Lines" : "Points"), 15, 40, 15, true);
					} else {
						// toggle population graph
						me.popGraph = !me.popGraph;
						me.graphButton.current = me.viewGraphToggle([me.popGraph], true, me);
						me.menuManager.notification.notify("Population Graph " + (me.popGraph ? "On" : "Off"), 15, 40, 15, true);
					}
				}
				break;

			// k for copy position to clipboard
			case 75:
				// check for shift
				if (event.shiftKey) {
					// copy view
					me.copyPosition(me, true);
					me.menuManager.notification.notify("Copied view to clipboard", 15, 180, 15, true);
				} else {
					// copy position
					me.copyPosition(me, false);
					me.menuManager.notification.notify("Copied position to clipboard", 15, 180, 15, true);
				}
				break;

			// p for increase depth or toggle loop
			case 80:
				// check for shift
				if (event.shiftKey) {
					if (me.loopDefined !== -1) {
						// toggle loop mode
						me.loopDisabled = !me.loopDisabled;
						me.loopIndicator.current = [me.loopDisabled];
						me.menuManager.notification.notify("Loop " + (me.loopDisabled ? "Off" : "On"), 15, 40, 15, true);
					}
				} else {
					// disable depth in multi-state mode
					if (!me.multiStateView) {
						if (!me.depthItem.locked) {
							if (me.depthItem.current[0] <= 0.99) {
								me.depthItem.current = me.viewDepthRange([me.depthItem.current[0] + 0.01, me.depthItem.current[1]], true, me);
							} else {
								me.depthItem.current = me.viewDepthRange([1, me.depthItem.current[1]], true, me);
							}
						}
					}
				}
				break;

			// l for decrease depth or toggle annotations
			case 76:
				// check for shift
				if (event.shiftKey) {
					if (me.waypointManager.numAnnotations() > 0) {
						me.labelButton.current = me.viewLabelToggle([!me.showLabels], true, me);
						me.menuManager.notification.notify("Annotations " + (me.showLabels ? "On" : "Off"), 15, 40, 15, true);
					}
				} else {
					// disable depth in multi-state mode
					if (!me.multiStateView) {
						if (!me.depthItem.locked) {
							if (me.depthItem.current[0] >= 0.01) {
								me.depthItem.current = me.viewDepthRange([me.depthItem.current[0] - 0.01, me.depthItem.current[1]], true, me);
							} else {
								me.depthItem.current = me.viewDepthRange([0, me.depthItem.current[1]], true, me);
							}
						}
					}
				}
				break;

			// q for increase layers
			case 81:
				// disable layers in multi-state mode
				if (!me.multiStateView) {
					if (!me.layersItem.locked) {
						if (me.layersItem.current[0] < ViewConstants.maxLayers) {
							me.layersItem.current = me.viewLayersRange([me.engine.layers + 1, me.layersItem.current[1]], true, me);
						}
					}
				}
				break;

			// a for decrease layers
			case 65:
				// disable layers in multi-state mode
				if (!me.multiStateView) {
					if (!me.layersItem.locked) {
						if (me.layersItem.current[0] > ViewConstants.minLayers) {
							me.layersItem.current = me.viewLayersRange([me.engine.layers - 1, me.layersItem.current[1]], true, me);
						}
					}
				}
				break;

			// r for reset
			case 82:
				// check for shift key
				if (event.shiftKey) {
					Controller.resetAllViewers();
				} else {
					// reset this viewer
					me.playList.current = me.viewPlayList(ViewConstants.modeReset, true, me);
				}
				break;

			// s for toggle starfield, shift s for toggle state1 autofit, control-s for save
			case 83:
				// check for ctrl key
				if (event.ctrlKey) {
					// save current pattern to source document node
					me.saveCurrentRLE(me);
					me.menuManager.notification.notify("Saved", 15, 40, 15, true);
				} else {
					// check for shift key
					if (event.shiftKey) {
						// only enabled for [R]History
						if (me.engine.isLifeHistory) {
							// toggle state 1 fit mode
							me.state1Fit = !me.state1Fit;
							me.menuManager.notification.notify("AutoFit State 1 Mode " + (me.state1Fit ? "On" : "Off"), 15, 40, 15, true);
						}
					} else {
						// toggle stars
						me.starsButton.current = me.viewStarsToggle([!me.starsOn], true, me);
						me.menuManager.notification.notify("Stars " + (me.starsOn ? "On" : "Off"), 15, 40, 15, true);
					}
				}
				break;

			// n for switch to thumbnail view
			case 78:
				// check if thumbnail mode available
				if (me.thumbnailEverOn) {
					// check if thumbnail mode already on
					if (me.thumbnail) {
						// switch it off
						me.switchOffThumbnail();
					} else {
						// switch it on
						me.switchOnThumbnail();

						// close help if open
						if (me.displayHelp) {
							me.displayHelp = 0;
						}
					}
				}
				break;

			// v for reset view
			case 86:
				// check for shift key
				if (event.shiftKey) {
					// save current camera position
					me.saveCamera(me);
					me.menuManager.notification.notify("Saved camera position", 15, 100, 15, true);
				} else {
					// check if controls are disabled
					if (!me.controlsLocked) {
						// reset camera
						me.resetSavedCamera(me);
						me.menuManager.notification.notify("Restored camera position", 15, 100, 15, true);

						// flag manual change made if paused
						if (!me.generationOn) {
							me.manualChange = true;
						}
					}
				}
				break;

			// ] for zoom in
			case 221: 
				// check for controls locked
				if (!me.controlsLocked) {
					// check for shift key
					if (event.shiftKey) {
						// zoom in by a factor of 2
						me.adjustZoomPosition(me.zoomItem.current[0], Math.log((me.engine.zoom * me.engine.originZ) * 2 / ViewConstants.minZoom) / Math.log(ViewConstants.maxZoom / ViewConstants.minZoom) - me.zoomItem.current[0]);
					} else {
						// zoom in slowly
						me.adjustZoomPosition(me.zoomItem.current[0], 0.01);
					}
				}
				break;

			// [ for zoom out
			case 219: 
				// check for controls locked
				if (!me.controlsLocked) {
					// check for shift key
					if (event.shiftKey) {
						// zoom out by a factor of 2
						me.adjustZoomPosition(me.zoomItem.current[0], Math.log((me.engine.zoom * me.engine.originZ) / 2 / ViewConstants.minZoom) / Math.log(ViewConstants.maxZoom / ViewConstants.minZoom) - me.zoomItem.current[0]);
					} else {
						// zoom out slowly
						me.adjustZoomPosition(me.zoomItem.current[0], -0.01);
					}
				}
				break;

			// 5 for reset angle
			case 53:
			case 101: // num 5
				// zero angle
				if (!me.angleItem.locked) {
					me.engine.angle = 0;
					me.angleItem.current = [me.engine.angle, me.engine.angle];
				}
				break;

			// 1 for 100% zoom
			case 49:
			case 97: // num 1
				// check for shift
				if (event.shiftKey) {
					// set zoom to nearest integer
					me.changeZoom(me, me.engine.zoom * me.engine.originZ, true);

					// display notification
					me.menuManager.notification.notify("Integer Zoom", 15, 40, 15, true);
				} else {
					// change zoom to 100%
					me.changeZoom(me, 1, false);
				}
				break;

			// 2 for 200% zoom
			case 50:
			case 98: // num 2
				// check for shift
				if (event.shiftKey) {
					// zoom to -2x
					me.changeZoom(me, 0.5, false);
				} else {
					// zoom to 200%
					me.changeZoom(me, 2, false);
				}
				break;

			// 3 for 3200% zoom
			case 51:
			case 99: // num 3
				// check for shift
				if (event.shiftKey) {
					// zoom to 6400%
					me.changeZoom(me, 64, false);
				} else {
					// zoom to 3200%
					me.changeZoom(me, 32, false);
				}
				break;

			// 4 for 400% zoom
			case 52:
			case 100: // num 4
				// check for shift
				if (event.shiftKey) {
					// zoom to -4x
					me.changeZoom(me, 0.25, false);
				} else {
					// zoom to 400%
					me.changeZoom(me, 4, false);
				}
				break;

			// 6 for 1600% zoom
			case 54:
			case 102: // num 6
				// check for shift
				if (event.shiftKey) {
					// zoom to -16x
					me.changeZoom(me, 0.0625, false);
				} else {
					// zoom to 1600%
					me.changeZoom(me, 16, false);
				}
				break;

			// 7 for decrease graph opacity
			case 55:
				// check if graph disabled
				if (me.graphDisabled) {
					me.menuManager.notification.notify("Graph Disabled", 15, 40, 15, true);
				} else {
					if (me.popGraphOpacity > 0) {
						me.popGraphOpacity -= 0.05;
						if (me.popGraphOpacity < 0) {
							me.popGraphOpacity = 0;
						}
					}
					this.opacityItem.current = this.viewOpacityRange([me.popGraphOpacity, me.popGraphOpacity], false, me);
				}
				break;

			// 8 for 800% zoom
			case 56:
			case 104: // num 8
				// check for shift
				if (event.shiftKey) {
					// zoom to -8x
					me.changeZoom(me, 0.125, false);
				} else {
					// zoom to 800%
					me.changeZoom(me, 8, false);
				}
				break;

			// 9 for increase graph opacity
			case 57:
				// check if graph disabled
				if (me.graphDisabled) {
					me.menuManager.notification.notify("Graph Disabled", 15, 40, 15, true);
				} else {
					if (me.popGraphOpacity < 1) {
						me.popGraphOpacity += 0.05;
						if (me.popGraphOpacity > 1) {
							me.popGraphOpacity = 1;
						}
					}
					this.opacityItem.current = this.viewOpacityRange([me.popGraphOpacity, me.popGraphOpacity], false, me);
				}
				break;

			// 0 for reset speed
			case 48:
			case 96: // num 0
				// reset gps
				me.gensPerStep = 1;
				me.stepRange.current = me.viewStepRange([me.gensPerStep, me.gensPerStep], true, me);

				// reset 
				me.generationRange.current = me.viewGenerationRange([1, me.generationRange.current[1]], true, me);
				break;

			// - for slower
			case 189:
			case 109: // num -
				// do not change if view only mode
				if (!me.viewOnly) {
					// check for step
					if (me.gensPerStep > ViewConstants.minStepSpeed) {
						// check for shift
						if (event.shiftKey) {
							// go to minimum step
							me.gensPerStep = ViewConstants.minStepSpeed;
						} else {
							// decrease step
							me.gensPerStep -= 1;
						}
						me.stepRange.current = me.viewStepRange([me.gensPerStep, me.gensPerStep], true, me);
					} else {
						// decrease generation speed
						if (me.generationRange) {
							if (me.generationRange.current[0] >= 0.01 && !event.shiftKey) {
								me.generationRange.current = me.viewGenerationRange([me.generationRange.current[0] - 0.01, me.generationRange.current[1]], true, me);
							} else {
								me.generationRange.current = me.viewGenerationRange([0, me.generationRange.current[1]], true, me);
							}
						}
					}
				}
				break;

			// = for faster
			case 187:
			case 107: // num +
				// do not change if view only mode
				if (!me.viewOnly) {
					// increase generation speed
					if (me.generationRange) {
						if (me.generationRange.current[0] <= 0.99 && !event.shiftKey) {
							me.generationRange.current = me.viewGenerationRange([me.generationRange.current[0] + 0.01, me.generationRange.current[1]], true, me);
						} else {
							// check whether speed was maximum
							if (me.generationRange.current[0] <= 0.99) {
								// set maximum
								me.generationRange.current = me.viewGenerationRange([1, me.generationRange.current[1]], true, me);
							} else {
								// set maximum
								me.generationRange.current = me.viewGenerationRange([1, me.generationRange.current[1]], true, me);
								// increase step
								if (me.gensPerStep < ViewConstants.maxStepSpeed) {
									// check for shift
									if (event.shiftKey) {
										// go to maximum step
										me.gensPerStep = ViewConstants.maxStepSpeed;
									} else {
										// increase step
										me.gensPerStep += 1;
									}
									me.stepRange.current = me.viewStepRange([me.gensPerStep, me.gensPerStep], true, me);
								}
							}
						}
					}
				}
				break;

			// , for rotate anticlockwise
			case 188:
				if (!me.angleItem.locked) {
					// get the current value
					value = me.angleItem.current[0];

					// check for shift key
					if (event.shiftKey) {
						// decrease by a quarter
						value -= 90;
					} else {
						// decrease by a degree
						value -= 1;
					}

					// wrap if required
					if (value < 0) {
						value += 360;
					}

					// update UI
					me.angleItem.current = me.viewAngleRange([value, value], true, me);
				}
				break;

			// . for rotate clockwise
			case 190:
				if (!me.angleItem.locked) {
					// get the current value
					value = me.angleItem.current[0];

					// check for shift key
					if (event.shiftKey) {
						// increase by a quarter
						value += 90;
					} else {
						// increase by a degree
						value += 1;
					}

					// wrap if required
					if (value >= 360) {
						value -= 360;
					}

					// update UI
					me.angleItem.current = me.viewAngleRange([value, value], true, me);
				}
				break;

			// j for jump to POI
			case 74:
				// check for defined POIs
				if (me.waypointManager.numPOIs()) {
					// check for controls locked
					if (!me.controlsLocked) {
						// check for shift key
						if (event.shiftKey) {
							// go to previous POI
							me.prevPOIPressed(me);
						} else {
							// go to next POI
							me.nextPOIPressed(me);
						}
					}
				} else {
					me.menuManager.notification.notify("No POIs defined", 15, 80, 15, true);
				}
				break;

			// t for timing display
			case 84:
				// check for shift key
				if (event.shiftKey) {
					// toggle extended timing
					me.menuManager.showExtendedTiming = !me.menuManager.showExtendedTiming;
				} else {
					// toggle fps
					me.fpsButton.current = me.viewFpsToggle([!me.menuManager.showTiming], true, me);
				}
				break;
				
			// u for UI
			case 85:
				// ignore if NOGUI defined
				if (!me.noGUIDefined) {
					me.noGUI = !me.noGUI;
					me.viewMenu.deleted = me.noGUI;
					me.menuManager.noGUI = me.noGUI;
				}
				break;

			// g for generation statistics
			case 71:
				// do not display if view only mode
				if (!me.viewOnly) {
					// check for shift
					if (event.shiftKey) {
						// toggle relative mode if defined
						if (me.genDefined) {
							me.genRelative = !me.genRelative;
						}
					} else {
						// toggle statistics
						me.viewStats([!me.statsOn], true, me);
						if (me.genToggle) {
							me.genToggle.current = [me.statsOn];
							me.menuManager.toggleRequired = true;
						}
					}
				}
				break;

			// f for fit zoom
			case 70:
				// check for shift key
				if (event.shiftKey) {
					// toggle fit zoom
					if (!me.autoFitToggle.locked) {
						me.autoFit = !me.autoFit;
						me.autoFitToggle.current = me.toggleAutoFit([me.autoFit], true, me);
						me.menuManager.notification.notify("AutoFit " + (me.autoFit ? "On" : "Off"), 15, 40, 15, true);
					}
				} else {
					// fit zoom
					if (!me.fitButton.locked) {
						me.fitZoomDisplay(true, true);
						me.menuManager.notification.notify("Fit Zoom", 15, 80, 15, true);

						// flag manual change made if paused
						if (!me.generationOn) {
							me.manualChange = true;
						}
					}
				}
				break;

			// o for new screenshot
			case 79:
				// check for shift key
				if (event.shiftKey) {
					// capture graph
					me.screenShotScheduled = 2;
				} else {
					// capture life
					me.screenShotScheduled = 1;
				}
				break;

			// arrow left for left
			case 37:
				// check for shift key
				if (event.shiftKey) {
					// scroll pattern diagonally
					me.moveView(me.engine.zoom, me.engine.zoom);
				} else {
					// scroll pattern right
					me.moveView(me.engine.zoom, 0);
				}
				break;

			// arrow up for up
			case 38:
				// check if help displayed
				if (me.displayHelp) {
					// scroll help up
					me.scrollHelpUp(me, 1);
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// scroll error list up
						me.scrollErrorsUp(me, 1);
					} else {
						// check for shift key
						if (event.shiftKey) {
							// scroll pattern diagonally
							me.moveView(-me.engine.zoom, me.engine.zoom);
						} else {
							// scroll pattern down
							me.moveView(0, me.engine.zoom);
						}
					}
				}
				break;

			// arrow right for right
			case 39:
				// check for shift key
				if (event.shiftKey) {
					// scroll pattern diagonally
					me.moveView(-me.engine.zoom, -me.engine.zoom);
				} else {
					// scroll pattern left
					me.moveView(-me.engine.zoom, 0);
				}
				break;

			// arrow down for down
			case 40:
				// check if help displayed
				if (me.displayHelp) {
					// scroll help down
					me.scrollHelpDown(me, 1);
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// scroll error list down
						me.scrollErrorsDown(me, 1);
					} else {
						// check for shift key
						if (event.shiftKey) {
							me.moveView(me.engine.zoom, -me.engine.zoom);
						} else {
							// scroll pattern up
							me.moveView(0, -me.engine.zoom);
						}
					}
				}
				break;

			// m for menu
			case 77:
				if (me.navToggle && !me.navToggle.deleted) {
					// toggle navigation menu
					me.navToggle.current[0] = !me.navToggle.current[0];

					// mark toggle required
					me.menuManager.toggleRequired = true;
				}
				break;

			// c for theme cycle or copy
			case 67:
				// check for control-C
				if (event.ctrlKey) {
					if (!me.noCopy) {
						// check for shift-C
						if (event.shiftKey) {
							// copy reset position to clipboard
							me.copyRLE(me, true);
						} else {
							// check for view only mode
							if (me.viewOnly) {
								// copy reset position to clipboard
								me.copyRLE(me, true);
							} else {
								// check for alt/meta key
								if (event.altKey) {
									// copy with pattern comments
									me.copyCurrentRLE(me, true);
								} else {
									// copy without pattern comments
									me.copyCurrentRLE(me, false);
								}
							}
						}
					}
				} else {
					// disable colour themes in multi-state mode
					if (!me.multiStateView) {
						if (me.themeItem && !me.themeItem.locked) {
							// check for shift key
							if (event.shiftKey) {
								// decrement colour theme
								value = (me.themeItem.current[0] + 0.5) | 0;
								value -= 1;
								if (value < 0) {
									// check for custom theme
									if (me.customTheme) {
										value = me.engine.numThemes;
									} else {
										value = me.engine.numThemes - 1;
									}
								}
							} else {
								// increment colour theme
								value = (me.themeItem.current[0] + 0.5) | 0;
								value += 1;

								// check for custom theme
								if (me.customTheme) {
									// allow custom theme
									if (value >= me.engine.numThemes + 1) {
										value = 0;
									}
								} else {
									// no custom theme
									if (value >= me.engine.numThemes) {
										value = 0;
									}
								}
							}

							// set the new theme
							me.themeItem.current = me.viewThemeRange([value, ""], true, me);
							if (!me.engine.isNone) {
								me.menuManager.notification.notify(me.themeName(me.engine.colourTheme) + " Theme", 15, 40, 15, true);
							}
						}
					}
				}
				break;

			// h for display help
			case 72:
				// check for shift key
				if (event.shiftKey) {
					// toggle history fit mode
					me.historyFitButton.current = me.viewHistoryFitToggle([!me.historyFit], true, me);
					me.menuManager.notification.notify("AutoFit History Mode " + (me.historyFit ? "On" : "Off"), 15, 40, 15, true);
				} else {
					// if errors then set script help page
					if (me.scriptErrors.length) {
						// toggle help page
						if (me.displayHelp) {
							me.displayHelp = 0;
						} else {
							// open help
							me.displayHelp = 1;
						}
					} else {
						// toggle help
						if (me.displayHelp) {
							me.displayHelp = 0;
						} else {
							// do not display help if in thumbnail mode
							if (!me.thumbnail) {
								// open help
								me.displayHelp = 1;
							}
						}
					}

					// update the help UI
					me.helpToggle.current = me.toggleHelp([me.displayHelp], true, me);
					me.menuManager.toggleRequired = true;
				}

				break;

			// i for display information
			case 73:
				// check for shift key
				if (event.shiftKey) {
					// toggle infobar
					me.infoBarButton.current = me.viewInfoBarToggle([!me.infoBarEnabled], true, me);
				} else {
					// check if help displayed
					if (me.displayHelp) {
						// check if on the info topic
						if (me.helpTopic === ViewConstants.informationTopic) {
							// close help
							me.displayHelp = 0;
						} else {
							// switch to the information topic
							me.setHelpTopic(ViewConstants.informationTopic, me);
						}
					} else {
						// do not display information if in thumbnail mode
						if (!me.thumbnail) {
							me.setHelpTopic(ViewConstants.informationTopic, me);
						}
					}

					// update the help UI
					me.helpToggle.current = me.toggleHelp([me.displayHelp], true, me);
					me.menuManager.toggleRequired = true;
				}

				break;

			// Esc to close help and clear error messages or pause playback
			case 27:
				// check for popup Viewer
				if (me.isInPopup) {
					// check if errors are displayed
					if (me.scriptErrors.length) {
						// clear errors
						me.scriptErrors = [];
						me.displayErrors = 0;
					} else {
						// close the popup Viewer
						hideViewer();
					}
				} else {
					// check if help displayed
					if (me.displayHelp) {
						// close help
						me.displayHelp = 0;
					} else {
						// check if errors displayed
						if (me.scriptErrors.length) {
							// clear errors
							me.scriptErrors = [];
							me.displayErrors = 0;
						} else {
							// check if playing
							if (me.generationOn) {
								// switch to pause
								me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
							}
						}
					}
				}

				// update the help UI
				me.helpToggle.current = me.toggleHelp([me.displayHelp], true, me);
				me.menuManager.toggleRequired = true;

				break;

			// Page Up
			case 33:
				// check if help displayed
				if (me.displayHelp) {
					// check for shift key
					if (event.shiftKey) {
						// move to previous section
						me.previousHelpSection(me);
					} else {
						// move to previous page
						me.scrollHelpUp(me, me.numHelpPerPage);
					}
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// move to previous page
						me.scrollErrorsUp(me, me.numHelpPerPage);
					} else {
						// check for multiverse mode
						if (DocConfig.multi) {
							me.universe -= 1;
							if (me.universe < 0) {
								me.universe = Controller.patterns.length - 1;
							}
							me.startViewer(Controller.patterns[me.universe].pattern, false);
						}
					}
				}
				break;

			// Page Down
			case 34:
				// check if help displayed
				if (me.displayHelp) {
					// check for shift
					if (event.shiftKey) {
						// move to next help section
						me.nextHelpSection(me);
					} else {
						// move to next page
						me.scrollHelpDown(me, me.numHelpPerPage);
					}
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// move to next page
						me.scrollErrorsDown(me, me.numHelpPerPage);
					} else {
						// check for multiverse mode
						if (DocConfig.multi) {
							me.universe += 1;
							if (me.universe >= Controller.patterns.length) {
								me.universe = 0;
							}
							me.startViewer(Controller.patterns[me.universe].pattern, false);
						}
					}
				}
				break;

			// Home
			case 36:
				// check if help displayed
				if (me.displayHelp) {
					// move to top
					me.displayHelp = 1;
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// move to top
						me.displayErrors = 1;
					} else {
						// check if multiverse mode is on
						if (DocConfig.multi) {
							me.universe = 0;
							me.startViewer(Controller.patterns[me.universe].pattern, false);
						}
					}
				}
				break;

			// End
			case 35:
				// check if help displayed
				if (me.displayHelp) {
					// move to bottom
					me.displayHelp = me.numHelpLines - me.numHelpPerPage;
				} else {
					// check if errors displayed
					if (me.displayErrors) {
						// move to bottom
						me.displayErrors = me.scriptErrors.length - me.numHelpPerPage;
					} else {
						// check if multiverse mode is on
						if (DocConfig.multi) {
							me.universe = Controller.patterns.length - 1;
							me.startViewer(Controller.patterns[me.universe].pattern, false);
						}
					}
				}
				break;

			// f1 for toggle edit mode
			case 112:
				// check for shift key
				if (event.shiftKey) {
					me.smartDrawing = !me.smartDrawing;
					me.menuManager.notification.notify("Smart Drawing " + (me.smartDrawing ? "On" : "Off"), 15, 40, 15, true);
				} else {
					if (me.viewOnly) {
						me.menuManager.notification.notify("Drawing not available", 15, 40, 15, true);
					} else {
						me.drawing = !me.drawing;
						me.modeList.current = me.viewModeList((me.drawing ? ViewConstants.modeDraw : ViewConstants.modePan), true, me);
						me.menuManager.notification.notify((me.drawing ? "Draw" : "Pan") + " Mode", 15, 40, 15, true);
					}
				}
				break;

			// ignore other keys
			default:
				// flag key not handled if specified or f5 for refresh
				if (keyCode === -1 || keyCode === 116) {
					processed = false;
				}
				break;
			}
		}

		// return whether key processed
		return processed;
	};

	// process keys in copy clipboard mode
	View.prototype.processKeyCopy = function(me, keyCode, event) {
		// flag event processed
		var processed = true;

		// check for control-R which would refresh browser
		if (event.ctrlKey && keyCode === 82) {
			return true;
		}

		// determine if the key can be processed
		switch (keyCode) {
		// return for copy
		case 13:
			if (me.tempRLEAmount === me.tempRLELength) {
				me.completeCopyToClipboard(me, true);
			}
			break;

		// t for timing display
		case 84:
			// toggle fps
			me.viewFpsToggle([!me.menuManager.showTiming], true, me);
			break;

		// ignore other keys
		default:
			// flag not handled
			processed = false;
			break;
		}

		// return whether key processed
		return processed;
	};

	// process keys in history mode
	View.prototype.processKeyHistory = function(me, keyCode, event) {
		// flag event processed
		var processed = true;

		// check for control, meta or alt
		if (event.ctrlKey || event.metaKey || event.altKey) {
			// clear key code so it is not handled here
			keyCode = -1;
		}

		// determine if the key can be processed
		switch (keyCode) {
		// t for timing display
		case 84:
			// toggle fps
			me.viewFpsToggle([!me.menuManager.showTiming], true, me);
			break;

		// ignore other keys
		default:
			// flag not handled
			processed = false;
			break;
		}

		// return whether key processed
		return processed;
	};

	// key down
	View.prototype.keyDown = function(me, event) {
		// get the key code
		var keyCode = event.charCode || event.keyCode,

		    // flag if key processed
		    processed = false;

		// ignore keys in compute history mode
		if (me.computeHistory) {
			// process the key in history mode
			processed = me.processKeyHistory(me, keyCode, event);
		} else {
			// check for clipboard copy
			if (me.clipboardCopy) {
				processed = me.processKeyCopy(me, keyCode, event);
			} else {
				// process the key
				processed = me.processKey(me, keyCode, event);
			}
		}

		// check if key was handled
		if (processed) {
			// ensure UI updates
			me.menuManager.setAutoUpdate(true);

			// cancel further processing
			event.preventDefault();
		}
	};

	// update help topic buttons position based on window height
	View.prototype.updateTopicButtonsPosition = function() {
		if (this.displayHeight < ViewConstants.minMenuHeight) {
			this.helpKeysButton.setPosition(Menu.northWest, 10, 50);
			this.helpScriptsButton.setPosition(Menu.north, 0, 50);
			this.helpInfoButton.setPosition(Menu.northEast, -160, 50);
			this.helpThemesButton.setPosition(Menu.northWest, 10, 100);
			this.helpColoursButton.setPosition(Menu.north, 0, 100);
			this.helpAliasesButton.setPosition(Menu.northEast, -160, 100);
			if (this.waypointManager.numAnnotations() > 0) {
				this.helpMemoryButton.setPosition(Menu.northWest, 10, 150);
				this.helpAnnotationsButton.setPosition(Menu.northEast, -160, 150);
			} else {
				this.helpMemoryButton.setPosition(Menu.north, 0, 150);
			}
		} else {
			this.helpKeysButton.setPosition(Menu.north, 0, 40);
			this.helpScriptsButton.setPosition(Menu.north, 0, 90);
			this.helpInfoButton.setPosition(Menu.north, 0, 140);
			this.helpThemesButton.setPosition(Menu.north, 0, 190);
			this.helpColoursButton.setPosition(Menu.north, 0, 240);
			this.helpAliasesButton.setPosition(Menu.north, 0, 290);
			this.helpMemoryButton.setPosition(Menu.north, 0, 340);
			this.helpAnnotationsButton.setPosition(Menu.north, 0, 390);
		}
	};

	// set menu colours
	View.prototype.setMenuColours = function() {
		var fgCol = "white",
			bgCol= "black",
			highlightCol = "rgb(0,240,32)",
			selectedCol = "blue",
			lockedCol = "grey",
			borderCol = "white",
			element;

		// check for custom foreground
		element = this.customThemeValue[ViewConstants.customThemeUIFG];
		if (element !== -1) {
			fgCol = "rgb(" + (element >> 16) + "," + ((element >> 8) & 255) + "," + (element & 255) + ")";
			this.iconManager.recolour = true;
			if (this.engine.littleEndian) {
				this.iconManager.recolourCol = (255 << 24) | (element & 255) << 16 | (((element >> 8) & 255) << 8) | (element >> 16);
			} else {
				this.iconManager.recolourCol = ((element >> 16) << 24) | (((element >> 8) & 255) << 16) | ((element & 255) << 8) | 255;
			}
		} else {
			// set default menu colour (will colour icons correctly)
			this.iconManager.recolour = true;
			element = (255 << 16) | (255 << 8) | 255;
			if (this.engine.littleEndian) {
				this.iconManager.recolourCol = (255 << 24) | (element & 255) << 16 | (((element >> 8) & 255) << 8) | (element >> 16);
			} else {
				this.iconManager.recolourCol = ((element >> 16) << 24) | (((element >> 8) & 255) << 16) | ((element & 255) << 8) | 255;
			}
		}

		// check for custom background
		element = this.customThemeValue[ViewConstants.customThemeUIBG];
		if (element !== -1) {
			bgCol = "rgb(" + (element >> 16) + "," + ((element >> 8) & 255) + "," + (element & 255) + ")";
		} else {
			// set default black
			element = 0;
		}
		// save the UI background R G B since the performance colouring uses it
		this.uiBackgroundRGB = element;

		// check for custom highlight
		element = this.customThemeValue[ViewConstants.customThemeUIHighlight];
		if (element !== -1) {
			highlightCol = "rgb(" + (element >> 16) + "," + ((element >> 8) & 255) + "," + (element & 255) + ")";
		}

		// check for custom select
		element = this.customThemeValue[ViewConstants.customThemeUISelect];
		if (element !== -1) {
			selectedCol = "rgb(" + (element >> 16) + "," + ((element >> 8) & 255) + "," + (element & 255) + ")";
		}

		// check for custom locked
		element = this.customThemeValue[ViewConstants.customThemeUILocked];
		if (element !== -1) {
			lockedCol = "rgb(" + (element >> 16) + "," + ((element >> 8) & 255) + "," + (element & 255) + ")";
		}

		// check for custom locked
		element = this.customThemeValue[ViewConstants.customThemeUIBorder];
		if (element !== -1) {
			borderCol = "rgb(" + (element >> 16) + "," + ((element >> 8) & 255) + "," + (element & 255) + ")";
		}

		// set the menu colours
		this.menuManager.setColours(fgCol, bgCol, highlightCol, selectedCol, lockedCol, borderCol);
	};

	// create menus
	View.prototype.createMenus = function() {
		// View menu

		// create the view menu
		this.viewMenu = this.menuManager.createMenu(this.viewAnimate, this.viewStart, this);

		// add callback for background drag
		this.viewMenu.dragCallback = this.viewDrag;

		// add callback for wakeup when GUI locked
		this.viewMenu.wakeCallback = this.viewWakeUp;

		// infobar labels for camera X, Y and ANGLE
		this.infoBarLabelXLeft = this.viewMenu.addLabelItem(Menu.northWest, 0, 40, 16, 20, "X");
		this.infoBarLabelXLeft.font = ViewConstants.smallStatsFont;
		this.infoBarLabelXLeft.textOrientation = Menu.horizontal;
		this.infoBarLabelYLeft = this.viewMenu.addLabelItem(Menu.northWest, 70, 40, 16, 20, "Y");
		this.infoBarLabelYLeft.font = ViewConstants.smallStatsFont;
		this.infoBarLabelYLeft.textOrientation = Menu.horizontal;
		this.infoBarLabelAngleLeft = this.viewMenu.addLabelItem(Menu.northWest, 140, 40, 16, 20, "A");
		this.infoBarLabelAngleLeft.font = ViewConstants.smallStatsFont;
		this.infoBarLabelAngleLeft.textOrientation = Menu.horizontal;

		// infobar values for camera X, Y and ANGLE
		this.infoBarLabelXValue = this.viewMenu.addLabelItem(Menu.northWest, 16, 40, 54, 20, "");
		this.infoBarLabelXValue.font = ViewConstants.smallStatsFont;
		this.infoBarLabelXValue.textAlign = Menu.right;
		this.infoBarLabelXValue.toolTip = "camera X position";
		this.infoBarLabelYValue = this.viewMenu.addLabelItem(Menu.northWest, 86, 40, 54, 20, "");
		this.infoBarLabelYValue.font = ViewConstants.smallStatsFont;
		this.infoBarLabelYValue.textAlign = Menu.right;
		this.infoBarLabelYValue.toolTip = "camera Y position";
		this.infoBarLabelAngleValue = this.viewMenu.addLabelItem(Menu.northWest, 156, 40, 40, 20, "");
		this.infoBarLabelAngleValue.font = ViewConstants.smallStatsFont;
		this.infoBarLabelAngleValue.textAlign = Menu.right;
		this.infoBarLabelAngleValue.toolTip = "camera angle";

		// center divider for infobar
		this.infoBarLabelCenter = this.viewMenu.addLabelItem(Menu.northWest, 196, 40, 4, 20, "");

		// infobar labels for trackbox E, S, W and N speeds
		this.infoBarLabelERight = this.viewMenu.addLabelItem(Menu.northEast, -280, 40, 20, 20, "E");
		this.infoBarLabelERight.font = ViewConstants.smallStatsFont;
		this.infoBarLabelSRight = this.viewMenu.addLabelItem(Menu.northEast, -210, 40, 20, 20, "S");
		this.infoBarLabelSRight.font = ViewConstants.smallStatsFont;
		this.infoBarLabelWRight = this.viewMenu.addLabelItem(Menu.northEast, -140, 40, 20, 20, "W");
		this.infoBarLabelWRight.font = ViewConstants.smallStatsFont;
		this.infoBarLabelNRight = this.viewMenu.addLabelItem(Menu.northEast, -70, 40, 20, 20, "N");
		this.infoBarLabelNRight.font = ViewConstants.smallStatsFont;

		// infobar values for trackbox E, S, W and N speeds
		this.infoBarLabelEValueRight = this.viewMenu.addLabelItem(Menu.northEast, -260, 40, 50, 20, "");
		this.infoBarLabelEValueRight.font = ViewConstants.smallStatsFont;
		this.infoBarLabelEValueRight.textAlign = Menu.right;
		this.infoBarLabelEValueRight.toolTip = "bounding box east edge velocity";
		this.infoBarLabelSValueRight = this.viewMenu.addLabelItem(Menu.northEast, -190, 40, 50, 20, "");
		this.infoBarLabelSValueRight.font = ViewConstants.smallStatsFont;
		this.infoBarLabelSValueRight.textAlign = Menu.right;
		this.infoBarLabelSValueRight.toolTip = "bounding box south edge velocity";
		this.infoBarLabelWValueRight = this.viewMenu.addLabelItem(Menu.northEast, -120, 40, 50, 20, "");
		this.infoBarLabelWValueRight.font = ViewConstants.smallStatsFont;
		this.infoBarLabelWValueRight.textAlign = Menu.right;
		this.infoBarLabelWValueRight.toolTip = "bounding box west edge velocity";
		this.infoBarLabelNValueRight = this.viewMenu.addLabelItem(Menu.northEast, -50, 40, 50, 20, "");
		this.infoBarLabelNValueRight.font = ViewConstants.smallStatsFont;
		this.infoBarLabelNValueRight.textAlign = Menu.right;
		this.infoBarLabelNValueRight.toolTip = "bounding box north edge velocity";

		// autostart indicator
		this.autostartIndicator = this.viewMenu.addListItem(null, Menu.northEast, -210, 0, 38, 20, ["START"], [false], Menu.multi);
		this.autostartIndicator.font = ViewConstants.smallMenuFont;
		this.autostartIndicator.toolTip = ["autostart indicator"];

		// stop indicator
		this.stopIndicator = this.viewMenu.addListItem(null, Menu.northEast, -210, 20, 38, 20, ["STOP"], [false], Menu.multi);
		this.stopIndicator.font = ViewConstants.smallMenuFont;
		this.stopIndicator.toolTip = ["stop indicator"];

		// waypoints indicator
		this.waypointsIndicator = this.viewMenu.addListItem(this.toggleWP, Menu.northEast, -172, 0, 38, 20, ["WAYPT"], [false], Menu.multi);
		this.waypointsIndicator.font = ViewConstants.smallMenuFont;
		this.waypointsIndicator.toolTip = ["toggle waypoint mode"];

		// loop indicator
		this.loopIndicator = this.viewMenu.addListItem(this.toggleLoop, Menu.northEast, -172, 20, 38, 20, ["LOOP"], [false], Menu.multi);
		this.loopIndicator.font = ViewConstants.smallMenuFont;
		this.loopIndicator.toolTip = ["toggle loop mode"];

		// mode list
		this.modeList = this.viewMenu.addListItem(this.viewModeList, Menu.northWest, 90, 0, 120, 40, ["", "", ""], ViewConstants.modePan, Menu.single);
		this.modeList.icon = [this.iconManager.icon("draw"), this.iconManager.icon("select"), this.iconManager.icon("pan")];
		this.modeList.toolTip = ["draw", "select", "pan"];

		// help section list
		this.helpSectionList = this.viewMenu.addListItem(this.viewHelpSectionList, Menu.northEast, -80, 100, 80, 60, ["1", "2"], 0, Menu.single);
		this.helpSectionList.orientation = Menu.vertical;
		this.helpSectionList.toolTip = ["", ""];
		this.helpSectionList.font = "14px Arial";

		// help button
		this.helpToggle = this.viewMenu.addListItem(this.toggleHelp, Menu.northEast, -40, 0, 40, 40, ["Help"], [false], Menu.multi);
		this.helpToggle.toolTip = ["toggle help display"];
		this.helpToggle.font = "16px Arial";

		// help show topics button
		this.topicsButton = this.viewMenu.addButtonItem(this.topicsPressed, Menu.northEast, -40, 50, 40, 40, ["^"]);
		this.topicsButton.toolTip = ["show help topics"];

		// help sections button
		this.sectionsButton = this.viewMenu.addButtonItem(this.sectionsPressed, Menu.northEast, -40, 100, 40, 40, ["<"]);
		this.sectionsButton.toolTip = ["show help sections"];

		// help individual topic buttons
		this.helpKeysButton = this.viewMenu.addButtonItem(this.keysTopicPressed, Menu.north, 0, 50, 150, 40, ["Keys"]);
		this.helpKeysButton.toolTip = ["show keyboard shortcuts"];

		this.helpScriptsButton = this.viewMenu.addButtonItem(this.scriptsTopicPressed, Menu.north, 0, 100, 150, 40, ["Scripts"]);
		this.helpScriptsButton.toolTip = ["show script commands"];

		this.helpInfoButton = this.viewMenu.addButtonItem(this.infoTopicPressed, Menu.north, 0, 150, 150, 40, ["Info"]);
		this.helpInfoButton.toolTip = ["show pattern and engine information"];

		this.helpThemesButton = this.viewMenu.addButtonItem(this.themesTopicPressed, Menu.north, 0, 200, 150, 40, ["Themes"]);
		this.helpThemesButton.toolTip = ["show colour Themes"];

		this.helpColoursButton = this.viewMenu.addButtonItem(this.coloursTopicPressed, Menu.north, 0, 250, 150, 40, ["Colours"]);
		this.helpColoursButton.toolTip = ["show colour names"];

		this.helpAliasesButton = this.viewMenu.addButtonItem(this.aliasesTopicPressed, Menu.north, 0, 300, 150, 40, ["Aliases"]);
		this.helpAliasesButton.toolTip = ["show rule aliases"];

		this.helpMemoryButton = this.viewMenu.addButtonItem(this.memoryTopicPressed, Menu.north, 0, 350, 150, 40, ["Memory"]);
		this.helpMemoryButton.toolTip = ["show memory usage"];

		this.helpAnnotationsButton = this.viewMenu.addButtonItem(this.annotationsTopicPressed, Menu.north, 0, 350, 150, 40, ["Annotations"]);
		this.helpAnnotationsButton.toolTip = ["show annotations"];

		// autofit button
		this.autoFitToggle = this.viewMenu.addListItem(this.toggleAutoFit, Menu.northWest, 0, 0, 40, 40, ["Auto"], [false], Menu.multi);
		this.autoFitToggle.icon = [this.iconManager.icon("autofit")];
		this.autoFitToggle.toolTip = ["toggle autofit"];
		this.autoFitToggle.font = "16px Arial";

		// fit button
		this.fitButton = this.viewMenu.addButtonItem(this.fitPressed, Menu.northWest, 45, 0, 40, 40, "");
		this.fitButton.icon = this.iconManager.icon("fit");
		this.fitButton.toolTip = "fit pattern to display";

		// grid toggle
		this.gridToggle = this.viewMenu.addListItem(this.toggleGrid, Menu.northEast, -85, 0, 40, 40, ["Grid"], [false], Menu.multi);
		this.gridToggle.icon = [this.iconManager.icon("grid")];
		this.gridToggle.toolTip = ["toggle grid lines"];
		this.gridToggle.font = "16px Arial";

		// add the progress bar
		this.progressBar = this.viewMenu.addProgressBarItem(Menu.southWest, 0, -40, 100, 40, 0, 100, 0, false, "", "", 0);
		this.progressBar.locked = true;

		// add the elapsed time label
		this.timeLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -100, 70, 30, "Time");
		this.timeLabel.textAlign = Menu.left;
		this.timeLabel.font = ViewConstants.statsFont;
		this.timeLabel.toolTip = "elapsed time";

		this.elapsedTimeLabel = this.viewMenu.addLabelItem(Menu.southWest, 70, -100, 70, 30, "");
		this.elapsedTimeLabel.textAlign = Menu.right;
		this.elapsedTimeLabel.font = ViewConstants.statsFont;
		this.elapsedTimeLabel.toolTip = "elapsed time";

		// add the cursor position labels
		this.xyLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -70, 166, 30, "");
		this.xyLabel.textAlign = Menu.left;
		this.xyLabel.font = ViewConstants.statsFont;
		this.xyLabel.toolTip = "cell state at cursor position";

		// add the generation label
		this.genToggle = this.viewMenu.addListItem(this.viewStats, Menu.southWest, 0, -40, 100, 40, [""], [this.statsOn], Menu.multi);
		this.genToggle.toolTip = ["toggle generation statistics"];

		// add the failure reason label but delete it so it's initially hidden
		this.reasonLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -40, this.displayWidth - 40, 40, "");
		this.reasonLabel.textAlign = Menu.left;
		this.reasonLabel.deleted = true;

		// add the population label and value
		this.popLabel = this.viewMenu.addLabelItem(Menu.southEast, -140, -130, 70, 30, "Alive");
		this.popLabel.textAlign = Menu.left;
		this.popLabel.font = ViewConstants.statsFont;
		this.popLabel.toolTip = "current population";

		this.popValue = this.viewMenu.addLabelItem(Menu.southEast, -70, -130, 70, 30, "");
		this.popValue.textAlign = Menu.right;
		this.popValue.font = ViewConstants.statsFont;
		this.popValue.toolTip = "alive";

		// add the births label and value
		this.birthsLabel = this.viewMenu.addLabelItem(Menu.southEast, -140, -100, 70, 30, "Births");
		this.birthsLabel.textAlign = Menu.left;
		this.birthsLabel.font = ViewConstants.statsFont;
		this.birthsLabel.toolTip = "cells born this generation";

		this.birthsValue = this.viewMenu.addLabelItem(Menu.southEast, -70, -100, 70, 30, "");
		this.birthsValue.textAlign = Menu.right;
		this.birthsValue.font = ViewConstants.statsFont;
		this.birthsValue.toolTip = "births";

		// add the deaths label and value
		this.deathsLabel = this.viewMenu.addLabelItem(Menu.southEast, -140, -70, 70, 30, "Deaths");
		this.deathsLabel.textAlign = Menu.left;
		this.deathsLabel.font = ViewConstants.statsFont;
		this.deathsLabel.toolTip = "cells died this generation";

		this.deathsValue = this.viewMenu.addLabelItem(Menu.southEast, -70, -70, 70, 30, "");
		this.deathsValue.textAlign = Menu.right;
		this.deathsValue.font = ViewConstants.statsFont;
		this.deathsValue.toolTip = "deaths";

		// add the rule label
		this.ruleLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -130, 140, 30, this.patternRuleName);
		this.ruleLabel.font = ViewConstants.statsFont;

		// add the zoom range
		this.zoomItem = this.viewMenu.addRangeItem(this.viewZoomRange, Menu.north, 0, 0, ViewConstants.zoomSliderDefaultWidth, 40, 0, 1, 0.1, true, "Zoom ", "", 1);
		this.zoomItem.toolTip = "camera zoom";

		// add the layers range
		this.layersItem = this.viewMenu.addRangeItem(this.viewLayersRange, Menu.west, 30, 0, 40, 292, ViewConstants.maxLayers, ViewConstants.minLayers, 1, true, "Layers ", "", 0);
		this.layersItem.toolTip = "number of layers";

		// add the depth range
		this.depthItem = this.viewMenu.addRangeItem(this.viewDepthRange, Menu.east, -70, 0, 40, 292, 1, 0, 0.1, true, "Depth ", "", 2);
		this.depthItem.toolTip = "depth between layers";

		// add the angle range
		this.angleItem = this.viewMenu.addRangeItem(this.viewAngleRange, Menu.north, 0, 50, 390, 40, 0, 359, 0, true, "Angle ", "\u00B0", 0);
		this.angleItem.toolTip = "camera angle";

		// shrink button
		this.shrinkButton = this.viewMenu.addButtonItem(this.shrinkPressed, Menu.southEast, -40, -90, 40, 40, "");
		this.shrinkButton.icon = this.iconManager.icon("shrink");
		this.shrinkButton.toolTip = "shrink to thumbnail";

		// hex/square toggle button
		this.hexButton = this.viewMenu.addListItem(this.viewHexToggle, Menu.northWest, 80, 100, 80, 40, ["Hex"], [this.engine.isHex], Menu.multi);
		this.hexButton.toolTip = ["toggle hex display"];

		this.hexCellButton = this.viewMenu.addListItem(this.viewHexCellToggle, Menu.north, 0, 100, 80, 40, ["Hexagon"], [this.engine.useHexagons], Menu.multi);
		this.hexCellButton.toolTip = ["toggle hexagonal cells"];
		this.hexCellButton.font = "18px Arial";

		// cell borders toggle button
		this.bordersButton = this.viewMenu.addListItem(this.viewBordersToggle, Menu.northEast, -160, 100, 80, 40, ["Borders"], [this.engine.cellBorders], Menu.multi);
		this.bordersButton.toolTip = ["toggle cell borders"];
		this.bordersButton.font = "18px Arial";

		// label toggle button
		this.labelButton = this.viewMenu.addListItem(this.viewLabelToggle, Menu.northWest, 80, 220, 80, 40, ["Labels"], [this.showLabels], Menu.multi);
		this.labelButton.toolTip = ["toggle labels"];

		// kill gliders toggle button
		this.killButton = this.viewMenu.addListItem(this.viewKillToggle, Menu.north, 0, 220, 80, 40, ["Kill"], [this.engine.clearGliders], Menu.multi);
		this.killButton.toolTip = ["kill escaping gliders"];

		// graph toggle button
		this.graphButton = this.viewMenu.addListItem(this.viewGraphToggle, Menu.northEast, -160, 220, 80, 40, ["Graph"], [this.popGraph], Menu.multi);
		this.graphButton.toolTip = ["toggle graph display"];

		// infobar toggle button
		this.infoBarButton = this.viewMenu.addListItem(this.viewInfoBarToggle, Menu.north, 0, 160, 80, 40, ["Info"], [this.infoBarEnabled], Menu.multi);
		this.infoBarButton.toolTip = ["toggle InfoBar"];

		// historyfit toggle button
		this.historyFitButton = this.viewMenu.addListItem(this.viewHistoryFitToggle, Menu.northWest, 80, 160, 80, 40, ["HistoryFit"], [this.historyFit], Menu.multi);
		this.historyFitButton.toolTip = ["toggle AutoFit History"];
		this.historyFitButton.font = "16px Arial";

		// major gridlines toggle button
		this.majorButton = this.viewMenu.addListItem(this.viewMajorToggle, Menu.northEast, -160, 160, 80, 40, ["Major"], [this.engine.gridLineMajorEnabled], Menu.multi);
		this.majorButton.toolTip = ["toggle major grid lines"];

		// stars toggle button
		this.starsButton = this.viewMenu.addListItem(this.viewStarsToggle, Menu.southEast, -160, -140, 80, 40, ["Stars"], [this.starsOn], Menu.multi);
		this.starsButton.toolTip = ["toggle stars display"];

		// close button
		this.closeButton = this.viewMenu.addButtonItem(this.closePressed, Menu.southEast, -40, -90, 40, 40, "X");
		this.closeButton.toolTip = "close window";
		
		// fps button
		this.fpsButton = this.viewMenu.addListItem(this.viewFpsToggle, Menu.southWest, 80, -140, 80, 40, ["Timing"], [this.menuManager.showTiming], Menu.multi);
		this.fpsButton.toolTip = ["toggle timing display"];

		// timing detail button
		this.timingDetailButton = this.viewMenu.addListItem(this.viewTimingDetailToggle, Menu.south, 0, -140, 80, 40, ["Details"], [this.menuManager.showExtendedTiming], Menu.multi);
		this.timingDetailButton.toolTip = ["toggle timing details"];

		// [R]History display toggle
		this.rHistoryButton = this.viewMenu.addListItem(this.viewRHistoryToggle, Menu.south, 0, -200, 80, 40, ["[R]History"], [this.engine.displayLifeHistory], Menu.multi);
		this.rHistoryButton.toolTip = ["toggle [R]History display"];
		this.rHistoryButton.font = "16px Arial";

		// previous universe button
		this.prevUniverseButton = this.viewMenu.addButtonItem(this.prevUniversePressed, Menu.southWest, 80, -200, 80, 40, "Prev");
		this.prevUniverseButton.toolTip = "go to previous universe";

		// next universe button
		this.nextUniverseButton = this.viewMenu.addButtonItem(this.nextUniversePressed, Menu.southEast, -160, -200, 80, 40, "Next");
		this.nextUniverseButton.toolTip = "go to next universe";

		// previous POI button
		this.prevPOIButton = this.viewMenu.addButtonItem(this.prevPOIPressed, Menu.west, 10, 0, 40, 40, "<");
		this.prevPOIButton.toolTip = "go to previous POI";

		// next POI button
		this.nextPOIButton = this.viewMenu.addButtonItem(this.nextPOIPressed, Menu.east, -50, 0, 40, 40, ">");
		this.nextPOIButton.toolTip = "go to next POI";

		// opacity range
		this.opacityItem = this.viewMenu.addRangeItem(this.viewOpacityRange, Menu.north, 0, 0, 132, 40, 0, 1, this.popGraphOpacity, true, "Opac ", "%", 0);
		this.opacityItem.toolTip = "graph opacity";

		// points/lines toggle
		this.linesToggle = this.viewMenu.addListItem(this.toggleLines, Menu.northEast, -170, 0, 40, 40, [""], [false], Menu.multi);
		this.linesToggle.icon = [this.iconManager.icon("lines")];
		this.linesToggle.toolTip = ["toggle graph lines/points"];

		// graph close button
		this.graphCloseButton = this.viewMenu.addButtonItem(this.graphClosePressed, Menu.northEast, -130, 0, 40, 40, "X");
		this.graphCloseButton.toolTip = "close graph";

		// pick toggle
		this.pickToggle = this.viewMenu.addListItem(this.togglePick, Menu.northWest, 0, 40, 40, 40, [""], [this.pickMode], Menu.multi);
		this.pickToggle.icon = [this.iconManager.icon("pick")];
		this.pickToggle.toolTip = ["pick state"];

		// states toggle
		this.statesToggle = this.viewMenu.addListItem(this.toggleStates, Menu.northWest, 45, 40, 40, 40, [""], [this.showStates], Menu.multi);
		this.statesToggle.icon = [this.iconManager.icon("states")];
		this.statesToggle.toolTip = ["toggle states"];

		// add menu toggle button
		this.navToggle = this.viewMenu.addListItem(null, Menu.southEast, -40, -40, 40, 40, [""], [false], Menu.multi);
		this.navToggle.icon = [this.iconManager.icon("menu")];
		this.navToggle.toolTip = ["toggle settings menu"];

		// add the colour theme range
		this.themeItem = this.viewMenu.addRangeItem(this.viewThemeRange, Menu.south, 0, -90, 390, 40, 0, this.engine.numThemes - 1, 1, true, "", " Theme", -1);
		this.themeItem.toolTip = "colour theme";

		// add the generation speed range
		this.generationRange = this.viewMenu.addRangeItem(this.viewGenerationRange, Menu.southEast, -365, -40, 75, 40, 0, 1, 0, true, "", "", -1);
		this.generationRange.toolTip = "steps per second";

		// add the speed step range
		this.stepRange = this.viewMenu.addRangeItem(this.viewStepRange, Menu.southEast, -285, -40, 75, 40, ViewConstants.minStepSpeed, ViewConstants.maxStepSpeed, 1, true, "x", "", 0);
		this.stepRange.toolTip = "generations per step";

		// add the actual step label
		this.stepLabel = this.viewMenu.addLabelItem(Menu.southEast, -285, -60, 75, 20, 0);
		this.stepLabel.font = ViewConstants.statsFont;
		this.stepLabel.deleted = true;

		// add the undo button
		this.undoButton = this.viewMenu.addButtonItem(this.undoPressed, Menu.southEast, -455, -40, 40, 40, "");
		this.undoButton.icon = this.iconManager.icon("undo");
		this.undoButton.toolTip = "undo";

		// add the redo button
		this.redoButton = this.viewMenu.addButtonItem(this.redoPressed, Menu.southEast, -410, -40, 40, 40, "");
		this.redoButton.icon = this.iconManager.icon("redo");
		this.redoButton.toolTip = "redo";

		// add the copy RLE button
		this.copyRLEButton = this.viewMenu.addButtonItem(this.copyRLEPressed, Menu.northEast, -130, 0, 40, 40, "Copy");
		this.copyRLEButton.toolTip = "copy pattern to clipboard";
		this.copyRLEButton.font = "14px Arial";

		// add play and pause list
		this.playList = this.viewMenu.addListItem(this.viewPlayList, Menu.southEast, -205, -40, 160, 40, ["", "", "", ""], ViewConstants.modePause, Menu.single);
		this.playList.icon = [this.iconManager.icon("tostart"), this.iconManager.icon("stepback"), this.iconManager.icon("stepforward"), this.iconManager.icon("play")];
		this.playList.toolTip = ["reset", "previous generation", "next generation", "play"];

		// add states for editor
		this.stateList = this.viewMenu.addListItem(this.viewStateList, Menu.northEast, -280, 40, 280, 20, ["0", "1", "2", "3", "4", "5", "6"], this.drawState, Menu.single);
		this.stateList.toolTip = ["dead", "alive", "history", "mark 1", "mark off", "mark 2", "kill"];
		this.stateList.font = "14px Arial";

		// add state colours for editor
		this.stateColsList = this.viewMenu.addListItem(this.viewStateColsList, Menu.northEast, -280, 60, 280, 20, ["", "", "", "", "", "", ""], [false, false, false, false, false, false, false], Menu.multi);
		this.stateColsList.toolTip = ["dead", "alive", "history", "mark 1", "mark off", "mark 2", "kill"];
		this.stateColsList.bgAlpha = 1;

		// add slider for states
		this.statesSlider = this.viewMenu.addRangeItem(this.viewStatesRange, Menu.northWest, 90, 40, 105, 40, 0, 1, 0, true, "", "", -1);
		this.statesSlider.toolTip = "select drawing states range";

		// add items to the main toggle menu
		this.navToggle.addItemsToToggleMenu([this.layersItem, this.depthItem, this.angleItem, this.themeItem, this.shrinkButton, this.closeButton, this.hexButton, this.hexCellButton, this.bordersButton, this.labelButton, this.killButton, this.graphButton, this.fpsButton, this.timingDetailButton, this.infoBarButton, this.starsButton, this.historyFitButton, this.majorButton, this.prevUniverseButton, this.nextUniverseButton, this.rHistoryButton], []);

		// add statistics items to the toggle
		this.genToggle.addItemsToToggleMenu([this.popLabel, this.popValue, this.birthsLabel, this.birthsValue, this.deathsLabel, this.deathsValue, this.timeLabel, this.elapsedTimeLabel, this.ruleLabel], []);

		// add help items to the toggle
		this.helpToggle.addItemsToToggleMenu([this.helpSectionList, this.topicsButton, this.sectionsButton], []);
	};

	// attached the viewer to a canvas element
	View.prototype.attachToCanvas = function(canvasItem) {
		var result = false,
		    me = this,
		    viewerWidth = 0,
		    viewerHeight = 0;

		// attach to the supplied canvas
		this.mainCanvas = canvasItem;

		// get the 2d context from the canvas
		if (this.mainCanvas.getContext) {
			// get the width and height of the canvas
			viewerWidth = this.mainCanvas.width;
			viewerHeight = this.mainCanvas.height;

			// set the canvas width to the max code width
			if (viewerWidth !== this.maxCodeWidth && DocConfig.limitWidth) {
				viewerWidth = this.maxCodeWidth;
			}
			
			// check the canvas is not too narrow
			if (viewerWidth < ViewConstants.minViewerWidth) {
				viewerWidth = ViewConstants.minViewerWidth;
			}

			// check the canvas is not to short
			if (viewerHeight < ViewConstants.minViewerHeight) {
				viewerHeight = ViewConstants.minViewerHeight;
			}

			// ensure width is a multiple of 8
			viewerWidth &= ~7;

			// set the width and heigth of the canvas
			if (this.mainCanvas.width !== viewerWidth) {
				this.mainCanvas.width = viewerWidth;
			}
			if (this.mainCanvas.height !== viewerHeight) {
				this.mainCanvas.height = viewerHeight;
			}

			// get the 2d drawing context
			this.mainContext = this.mainCanvas.getContext("2d", {alpha: false});
			this.mainContext.globalAlpha = 1;
			this.mainContext.fillStyle = "black";
			this.mainContext.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

			// create the offboard canvas
			this.offCanvas = document.createElement("canvas");
			this.offCanvas.width = this.mainCanvas.width;
			this.offCanvas.height = this.mainCanvas.height;
			this.offContext = this.offCanvas.getContext("2d", {alpha: false});

			// set the width and height from the canvas
			this.displayWidth = this.mainCanvas.width;
			this.displayHeight = this.mainCanvas.height;

			// initialise life engine
			this.engine = new Life(this.offContext, this.displayWidth, this.displayHeight, this.defaultGridWidth, this.defaultGridHeight);
			this.engine.initEngine(this.offContext, this.displayWidth, this.displayHeight);

			// create the elapsed times buffer
			this.elapsedTimes = this.engine.allocator.allocate(Float32, ViewConstants.numElapsedTimes, "View.elapsedTimes");

			// create the starfield
			this.starField = new Stars(ViewConstants.numStars, this.engine.allocator);

			// set the font alignment
			this.offContext.textAlign = "left";
			this.offContext.textBaseline = "middle";

			// create the icon manager and icons
			this.createIcons(this.offContext);

			// create the menu manager
			this.menuManager = new MenuManager(this.mainContext, this.offContext, "24px Arial", this.iconManager, this, this.gotFocus);
			
			// disable fps display
			this.menuManager.showTiming = false;

			// create colour themes before the menus so the control has the right number of themes
			this.engine.createColourThemes();

			// create menu
			this.createMenus();

			// save position of moveable menu items
			this.playListX = this.playList.x;
			this.generationRangeX = this.generationRange.x;
			this.stepRangeX = this.stepRange.x;

			// register mouse wheel event
			registerEvent(this.mainCanvas, "DOMMouseScroll", function(event) {me.wheel(me, event);}, false);
			registerEvent(this.mainCanvas, "mousewheel", function(event) {me.wheel(me,event);}, false);

			// enable notifications
			this.menuManager.notification.enabled = true;

			// load view menu
			this.menuManager.activeMenu(this.viewMenu);
			
			// register keyboard input
			registerEvent(this.mainCanvas, "keydown", function(event) {me.keyDown(me, event);}, false);

			// success
			result = true;
		} else {
			// no canvas support
			result = false;
		}

		// return whether attached successfully
		return result;
	};

	// get theme name from a number
	View.prototype.themeName = function(themeNumber) {
		var themes = this.engine.themes,
		    result = "";

		// ensure number is integer
		themeNumber = themeNumber | 0;

		// check if it is in range
		if (themeNumber < themes.length) {
			result = themes[themeNumber].name;
		}

		return result;
	};

	// get a theme number from theme name
	View.prototype.themeFromName = function(themeName) {
		var found = false,
			themes = this.engine.themes,
			i = 0;

			// conver to lower case for search
			themeName = themeName.toLowerCase();

			// don't include final custom theme in the search
			while (i < themes.length - 1 && !found) {
				if (themes[i].name.toLowerCase() === themeName) {
					found = true;
				} else {
					i += 1;
				}
			}

			// check if found
			if (!found) {
				i = -1;
			}

			// return theme number or if not found -1
			return i;
	};

	// validate waypoints
	View.prototype.validateWaypoints = function(scriptErrors) {
		// fill in waypoint zero
		var currentWaypoint = this.waypointManager.firstWaypoint();

		// copy position
		if (!currentWaypoint.xDefined) {
			currentWaypoint.x = this.engine.width / 2 - this.engine.xOff;
		}

		if (!currentWaypoint.yDefined) {
			currentWaypoint.y = this.engine.height / 2 - this.engine.yOff;
		}

		// zoom
		if (!currentWaypoint.zoomDefined) {
			currentWaypoint.zoom = this.engine.zoom;
		}

		// angle
		if (!currentWaypoint.angleDefined) {
			currentWaypoint.angle = this.engine.angle;
		}

		// layers
		if (!currentWaypoint.layersDefined) {
			currentWaypoint.layers = this.engine.layers;
		}

		// depth
		if (!currentWaypoint.depthDefined) {
			currentWaypoint.depth = this.engine.layerDepth;
		}

		// gps
		if (!currentWaypoint.gpsDefined) {
			currentWaypoint.gps = this.genSpeed;
		}

		// step
		if (!currentWaypoint.stepDefined) {
			currentWaypoint.step = this.gensPerStep;
		}

		// theme
		if (!currentWaypoint.themeDefined) {
			currentWaypoint.theme = this.engine.colourTheme;
		}

		// prepare the waypoint list
		this.waypointManager.prepare(scriptErrors);
	};

	// fit message to popup title bar
	View.prototype.fitTitle = function(message) {
		var result = message,

		    // rendering context
		    ctx = this.offContext,

		    // width of title bar
		    titleWidth = 420,

		    // length of message in characters
		    length = message.length,

		    // width in pixels
		    pxWidth = 0,

		    // index
		    i = length;

		// set the variable font
		ctx.font = ViewConstants.variableFont;

		// check if the message fits
		pxWidth = ctx.measureText(message).width;
		if (pxWidth > titleWidth) {
			// shorten the text until it fits
			i -= 1;
			pxWidth = ctx.measureText(message.substr(0, i) + "...").width;
			while (pxWidth > titleWidth) {
				i -= 1;
				pxWidth = ctx.measureText(message.substr(0, i) + "...").width;
			}

			// set the message to the shorter version
			result = result.substr(0, i) + "...";
		}

		// return the message
		return result;
	};

	// read script
	View.prototype.readScript = function(scriptString, numStates) {
		ScriptParser.parseScript(this, scriptString, numStates);
	};

	// reset any view controls that scripts can overwrite
	View.prototype.resetScriptControls = function() {
		// reset custom grid line major
		this.engine.customGridLineMajor = false;

		// reset maximum grid size
		this.engine.maxGridSize = 1 << ViewConstants.defaultGridPower;

		// clear theme requested
		this.themeRequested = -1;

		// clear default POI
		this.defaultPOI = -1;

		// clear no GUI mode
		this.noGUI = false;
		this.noGUIDefined = false;

		// clear hide source mode
		this.noSource = false;

		// clear no pattern source copy
		this.noCopy = false;

		// clear custom random seed
		this.randomSeedCustom = false;

		// clear origin
		this.engine.originX = 0;
		this.engine.originY = 0;
		this.engine.originZ = 1;

		// clear integer zoom
		this.integerZoom = false;

		// clear autofit
		this.autoFit = false;
		this.autoFitDefined = false;

		// do not display infobar
		this.infoBarEnabled = false;

		// reset custom colours 
		this.customColours = [];
		this.customTextColour = null;
		this.customErrorColour = null;
		this.errorsFontColour = ViewConstants.errorsFontColour;

		// reset graph colours
		this.engine.graphBgColor = this.engine.graphBgDefColor;
		this.engine.graphAxisColor = this.engine.graphAxisDefColor;
		this.engine.graphAliveColor = this.engine.graphAliveDefColor;
		this.engine.graphBirthColor = this.engine.graphBirthDefColor;
		this.engine.graphDeathColor = this.engine.graphDeathDefColor;

		// clear hard reset mode
		this.hardReset = false;

		// clear autostart mode
		this.autoStart = false;
		this.autoStartDisabled = false;

		// clear stop mode
		this.stopGeneration = -1;

		// clear loop mode
		this.loopGeneration = -1;
		this.loopDisabled = false;

		// clear waypoint mode
		this.waypointsDisabled = false;
		this.waypointsDefined = false;

		// clear track box
		this.trackBoxDefined = false;

		// clear track
		this.trackDefined = false;

		// clear track loop
		this.trackLoopDefined = false;

		// clear track disabled
		this.trackDisabled = false;

		// clear stats on
		this.statsOn = false;

		// reset history states
		if (this.engine.multiNumStates > 2) {
			if (256 - this.engine.multiNumStates >= 63) {
				this.maxHistoryStates = 63;
			} else {
				this.maxHistoryStates = 256 - this.engine.multiNumStates;
			}
		} else {
			this.maxHistoryStates = 63;
		}
		this.historyStates = this.maxHistoryStates;

		// reset drawing mode
		this.drawing = false;
		this.drawingState = 1;

		// reset suppress escaping gliders
		this.engine.clearGliders = false;
		this.engine.numClearedGliders = 0;
	};
	
	// switch off thumbnail view
	View.prototype.switchOffThumbnail = function() {
		// check for launch mode
		if (this.thumbLaunch) {
			// launch the standalone viewer
			updateViewer(this.element);
		} else {
			// switch to full size
			this.displayWidth = this.thumbOrigWidth;
			this.displayHeight = this.thumbOrigHeight;

			// set original zoom
			if (!this.autoFit) {
				this.engine.zoom = this.thumbOrigZoom;
			} else {
				this.thumbnail = false;
				this.fitZoomDisplay(true, false);
			}
			if (this.zoomItem) {
				this.zoomItem.current = this.viewZoomRange([this.engine.zoom, this.engine.zoom], false, this);
			}

			// restore help position
			this.displayHelp = this.thumbOrigHelpPosition;

			// flag not in thumbnail mode any more
			this.thumbnail = false;
			this.menuManager.thumbnail = false;

			// enable the menu
			this.viewMenu.deleted = false;

			// display hotkey to shrink
			this.menuManager.notification.notify("Shrink with hotkey N", 15, 100, 15, true);

			// resize
			this.resize();
		}
	};

	// callback when viewer gets focus
	View.prototype.gotFocus = function(me) {
		// check if thumbnail mode on
		if (me.thumbnail) {
			me.switchOffThumbnail();
		} else {
			// check for NOGUI
			if (me.noGUI) {
				if (!me.noCopy) {
					me.copyRLE(me, false);
				}
			}
		}
	};

	// resize viewer
	View.prototype.resize = function() {
		// resize the canvases
		if (this.popupWidthChanged) {
			// ensure window right edge does not move on width resize
			Controller.popupWindow.resizeDx = this.lastPopupWidth - this.displayWidth;
			this.lastPopupWidth = this.displayWidth;
			this.popupWidthChanged = false;
		}
		this.mainCanvas.width = this.displayWidth;
		this.mainCanvas.height = this.displayHeight;
		this.offCanvas.width = this.displayWidth;
		this.offCanvas.height = this.displayHeight;

		// set text alignment
		this.offContext.textBaseline = "middle";

		// resize arrays
		this.engine.resizeDisplay(this.displayWidth, this.displayHeight);
	};

	// switch to thumbnail view
	View.prototype.switchOnThumbnail = function() {
		// save the original width, height and zoom
		this.thumbOrigWidth = this.displayWidth;
		this.thumbOrigHeight = this.displayHeight;
		this.thumbOrigZoom = this.engine.zoom;
		
		// save the help position
		this.thumbOrigHelpPosition = this.displayHelp;

		// make the thumbnail a quarter of the size
		this.displayWidth = (this.displayWidth / this.thumbnailDivisor) | 0;
		this.displayHeight = (this.displayHeight / this.thumbnailDivisor) | 0;
		this.engine.zoom = this.engine.zoom / this.thumbnailDivisor;

		// ensure width is a multiple of 8
		this.displayWidth &= ~7;

		// disable the menu
		this.viewMenu.deleted = true;

		// tell the menu manager that thumbnail mode is active
		this.menuManager.thumbnail = true;
		this.menuManager.thumbnailDivisor = this.thumbnailDivisor;
		this.thumbnail = true;

		// resize
		this.resize();
	};

	// update states list
	View.prototype.updateStatesList = function() {
		var states = this.engine.multiNumStates,
			i = 0,
			state = 0,
			message = "";

		// update the states list and colours list
		if (states > this.maxDisplayStates) {
			states = this.maxDisplayStates;
		}
		this.stateList.lower = [];
		this.stateList.toolTip = [];
		this.stateList.width = 40 * states;
		this.stateColsList.lower = [];
		this.stateColsList.toolTip = [];
		this.stateColsList.current = [];
		this.stateColsList.width = 40 * states;
		this.stateColsList.bgAlpha = 1;
		for (i = 0; i < this.maxDisplayStates; i += 1) {
			state = i + this.startState;
			this.stateList.lower[i] = String(state);
			if (state === 0) {
				message = "dead";
			} else {
				if (state === 1) {
					message = "alive";
				} else {
					message = "dying " + String(state - 1);
				}
			}
			this.stateList.toolTip[i] = message;
			this.stateColsList.lower[i] = "";
			this.stateColsList.toolTip[i] = message;
			this.stateColsList.current[i] = false;
		}

		// update the selected state
		state = this.drawState;
		if (state > 0) {
			state = this.engine.multiNumStates - state;
		}
		this.stateList.current = state - this.startState;
	};

	// setup state list for drawing
	View.prototype.setupStateList = function() {
		var states = this.engine.multiNumStates;

		// reset drawing state
		this.drawState = 1;
		this.startState = 0;
		this.statesToggle.current = [this.toggleStates([true], true, this)];

		// compute the maximum number of display states based on width
		this.maxDisplayStates = 7 + (((this.displayWidth - ViewConstants.minViewerWidth) / 40) | 0);

		if (this.engine.isLifeHistory) {
			// add LifeHistory states for editor
			this.stateList.lower = ["0", "1", "2", "3", "4", "5", "6"];
			this.stateList.width = 280;
			this.stateList.toolTip = ["dead", "alive", "history", "mark 1", "mark off", "mark 2", "kill"];
			this.stateList.current = this.drawState;

			// add LifeHistory state colours for editor
			this.stateColsList.lower = ["", "", "", "", "", "", ""];
			this.stateColsList.width = 280;
			this.stateColsList.toolTip = ["dead", "alive", "history", "mark 1", "mark off", "mark 2", "kill"];
			this.stateColsList.bgAlpha = 1;
			this.stateColsList.current = [false, false, false, false, false, false, false];
		} else {
			// check for 2 state
			if (states <= 2) {
				// add states for editor
				this.stateList.lower = ["0", "1"];
				this.stateList.width = 80;
				this.stateList.toolTip = ["dead", "alive"];
				this.stateList.current = this.drawState;
	
				// add state colours for editor
				this.stateColsList.lower = ["", ""];
				this.stateColsList.width = 80;
				this.stateColsList.toolTip = ["dead", "alive"];
				this.stateColsList.bgAlpha = 1;
				this.stateColsList.current = [false, false];
			} else {
				this.drawState = states - 1;
				if (states > this.maxDisplayStates) {
					states = this.maxDisplayStates;
				}
				this.updateStatesList();
				this.stateList.width = states * 40;
				this.stateColsList.width = states * 40;
				this.statesSlider.current = this.viewStatesRange([0, 0], true, this);
			}
		}
		this.stateList.setPosition(Menu.northEast, -this.stateList.width, 40);
		this.stateColsList.setPosition(Menu.northEast, -this.stateColsList.width, 60);
	};

	// clear pattern data
	View.prototype.clearPatternData = function() {
		// clear pattern data
		this.genDefined = false;
		this.genOffset = 0;
		this.posDefined = false;
		this.posXOffset = 0;
		this.posYOffset = 0;
		this.patternRuleName = "";
		this.patternAliasName = "";
		this.patternBoundedGridDef = "";
		this.patternName = "";
		this.patternOriginator = "";
		this.patternWidth = 0;
		this.patternHeight = 0;
		this.patternStates = 0;
		this.patternUsedStates = 0;
		this.patternFormat = "(none)";
		this.engine.isNone = false;
		this.engine.isLifeHistory = false;
		this.engine.displayLifeHistory = false;
		this.engine.isHex = false;
		this.engine.isTriangular = false;
		this.engine.triangularNeighbourhood = PatternManager.triangularAll;
		this.engine.isVonNeumann = false;
		this.engine.wolframRule = -1;
		this.engine.patternDisplayMode = false;
		this.engine.multiNumStates = -1;
		this.engine.boundedGridType = -1;
		this.engine.isHROT = false;
		this.engine.multiState = false;
		this.executable = false;
	};

	// start the viewer from a supplied pattern string
	View.prototype.startViewer = function(patternString, ignoreThumbnail) {
		var pattern = null,
		    numberValue = 0,
		    savedX = 0,
		    savedY = 0,
		    savedThumbnail = false,
		    resizeRequired = false,
		    neededWidth = 0,
			neededHeight = 0,
			borderSize = 0,
			i = 0,
			name = "";

		// check for Edge browser
		if (window.navigator.userAgent.indexOf("Edge") !== -1) {
			this.isEdge = true;
		} else {
			this.isEdge = false;
		}

		// clear recipe list
		this.recipeList = [];
		this.recipeDelta = [];

		// clear script error list
		this.scriptErrors = [];

		// clear rle snippets
		this.rleList = [];

		// clear undo/reset
		this.editList = [];
		this.undoList = [];
		this.currentEdit = [];
		this.currentUndo = [];
		this.editNum = 0;
		this.numEdits = 0;

		// clear paste list
		this.pasteList = [];
		this.pasteMode = ViewConstants.pasteModeOr;
		this.pasteGen = 0;
		this.pasteEnd = -1;
		this.pasteDelta = [];
		this.pasteEvery = 0;
		this.isPasteEvery = false;
		this.maxPasteGen = 0;
		this.isEvolution = false;
		this.pasteLeftX = ViewConstants.bigInteger;
		this.pasteRightX = -ViewConstants.bigInteger;
		this.pasteBottomY = ViewConstants.bigInteger;
		this.pasteTopY = -ViewConstants.bigInteger;

		// clear any notifications
		this.menuManager.notification.clear(true, true);
		this.menuManager.notification.clear(false, true);

		// attempt to create the pattern
		pattern = PatternManager.create("", patternString, this.engine.allocator);
		if (pattern) {
			// copy the generation offset
			this.genDefined = PatternManager.genDefined;
			this.genOffset = PatternManager.generation;

			// copy the pos offsets
			this.posDefined = PatternManager.posDefined;
			this.posXOffset = PatternManager.posX;
			this.posYOffset = PatternManager.posY;

			// copy the specified size
			this.specifiedWidth = PatternManager.specifiedWidth;
			this.specifiedHeight = PatternManager.specifiedHeight;

			// read the pattern size
			this.patternWidth = pattern.width;
			this.patternHeight = pattern.height;

			// read pattern name and originator
			this.patternName = pattern.name;
			this.patternOriginator = pattern.originator;

			// read the pattern format
			this.patternFormat = pattern.patternFormat;
			if (this.patternFormat === "") {
				this.patternFormat = "(none)";
			}

			// read the number of states and number used
			this.patternStates = pattern.numStates;
			this.patternUsedStates = pattern.numUsedStates;

			// read the rule name
			this.patternRuleName = pattern.ruleName;
			this.patternAliasName = pattern.aliasName;
			this.patternBoundedGridDef = pattern.boundedGridDef;

			// read the before and after RLE comments
			this.engine.beforeTitle = pattern.beforeTitle;
			this.engine.afterTitle = pattern.afterTitle;

			// read if the pattern is executable
			this.executable = PatternManager.executable;

			// check if the rule is a History rule
			this.engine.isLifeHistory = pattern.isHistory;
			this.engine.displayLifeHistory = pattern.isHistory;

			// read the number of states (Generations or HROT)
			this.engine.multiNumStates = pattern.multiNumStates;

			// check if the rule is HROT
			this.engine.isHROT = pattern.isHROT;
			if (pattern.isHROT) {
				this.engine.HROT.births = pattern.birthHROT;
				this.engine.HROT.survivals = pattern.survivalHROT;
				this.engine.HROT.scount = pattern.multiNumStates;
				this.engine.HROT.setTypeAndRange(pattern.neighborhoodHROT, pattern.rangeHROT);
				if (PatternManager.altSpecified) {
					this.engine.HROT.altBirths = pattern.altBirthHROT;
					this.engine.HROT.altSurvivals = pattern.altSurvivalHROT;
					this.engine.HROT.altSpecified = true;
				} else {
					this.engine.HROT.altSpecified = false;
				}
			}

			// check if the rule is _none_
			this.engine.isNone = pattern.isNone;

			// use hexagons for hex dispaly
			this.engine.useHexagons = true;

			// check if the neighbourhood is hex
			this.engine.isHex = pattern.isHex;
			this.engine.patternDisplayMode = pattern.isHex;

			// check if the neighbourhood is triangular
			this.engine.isTriangular = pattern.isTriangular;
			this.engine.triangularNeighbourhood = pattern.triangularNeighbourhood;

			// check if the neighbourhood is Von Neumann
			this.engine.isVonNeumann = pattern.isVonNeumann;

			// check if the rule is Wolfram
			this.engine.wolframRule = pattern.wolframRule;

			// read the bounded grid details
			this.engine.boundedGridType = pattern.gridType;
			this.engine.boundedGridWidth = pattern.gridWidth;
			this.engine.boundedGridHeight = pattern.gridHeight;
			this.engine.boundedGridHorizontalShift = pattern.gridHorizontalShift;
			this.engine.boundedGridVerticalShift = pattern.gridVerticalShift;
			this.engine.boundedGridHorizontalTwist = pattern.gridHorizontalTwist;
			this.engine.boundedGridVerticalTwist = pattern.gridVerticalTwist;

			// copy states used and state count
			this.patternStateCount = new Uint32Array(this.patternStates);

			for (i = 0; i < this.patternStates; i += 1) {
				this.patternStateCount[i] = PatternManager.stateCount[i];
			}
		} else {
			this.clearPatternData();
		}

		// show labels
		this.showLabels = true;

		// do not display population graph
		this.popGraph = false;
		this.popGraphLines = true;
		this.popGraphOpacity = ViewConstants.defaultOpacity;
		if (!pattern) {
			this.graphDisabled = true;
		} else {
			this.graphDisabled = false;
		}

		// display life ended and stop notifications
		this.genNotifications = true;

		// display generation as absolute
		this.genRelative = false;

		// update angle control
		this.angleItem.deleted = this.engine.isHex;

		// read any failure reason
		this.failureReason = PatternManager.failureReason;

		// set anything alive flags
		this.engine.anythingAlive = true;

		// reset delete pattern radius
		this.engine.removePatternRadius = ViewConstants.defaultDeleteRadius;

		// reset x and y offset
		this.xOffset = 0;
		this.yOffset = 0;

		// reset current point of interest
		this.currentPOI = -1;
		this.stepsPOI = -1;

		// clear compute history mode
		this.computeHistory = false;

		// clear copy to clipboard mode
		this.clipboardCopy = false;

		// unlock menu
		this.viewMenu.locked = false;

		// clear history fit mode
		this.historyFit = false;

		// clear state 1 fit
		this.state1Fit = false;

		// free overlay
		this.engine.freeOverlay();

		// free state6 mask
		this.engine.freeState6Mask();

		// create the overlay
		if (this.engine.isLifeHistory) {
			// always create the overlay since the editor may introduce any LifeHistory state
			this.engine.createOverlay();
			this.engine.createState6Mask();
		}

		// clear any window title
		this.windowTitle = "";

		// disable stars
		this.starsOn = false;

		// initalised ColourManager
		ColourManager.init();

		// clear the grid
		this.engine.clearGrids(false);

		// reset grid lines
		this.engine.gridLineRaw = this.engine.gridLineRawDefault;
		this.engine.gridLineBoldRaw = this.engine.gridLineBoldRawDefault;
		this.engine.gridLineMajor = 10;
		this.engine.definedGridLineMajor = 10;
		this.engine.gridLineMajorEnabled = true;
		this.customGridMajorColour = -1;
		this.customGridColour = -1;

		// set the default generation speed
		this.genSpeed = 60;

		// set the default generations per step
		this.gensPerStep = 1;

		// set the default layers
		this.engine.layers = 1;

		// set the default layer depth
		this.engine.layerDepth = 0.1;

		// set the default angle
		this.engine.angle = 0;

		// set the default zoom
		this.engine.zoom = 6;

		// reset the grid size
		this.engine.resetGridSize(this.defaultGridWidth, this.defaultGridHeight);

		// set the default position
		this.engine.xOff = this.engine.width / 2;
		this.engine.yOff = this.engine.height / 2;

		// set the default zoom and position are not used
		this.defaultZoomUsed = false;
		this.defaultXUsed = false;
		this.defaultYUsed = false;
		this.defaultX = 0;
		this.defaultY = 0;

		// clear requested width and height
		this.requestedWidth = -1;
		this.requestedHeight = -1;

		// clear requested popup width and height
		this.requestedPopupWidth = -1;
		this.requestedPopupHeight = -1;

		// reset custom theme
		this.customThemeValue[ViewConstants.customThemeBackground] = -1;
		this.customThemeValue[ViewConstants.customThemeAlive] = -1;
		this.customThemeValue[ViewConstants.customThemeAliveRamp] = -1;
		this.customThemeValue[ViewConstants.customThemeDead] = -1;
		this.customThemeValue[ViewConstants.customThemeDeadRamp] = -1;
		this.customThemeValue[ViewConstants.customThemeGrid] = -1;
		this.customThemeValue[ViewConstants.customThemeGridMajor] = -1;
		this.customThemeValue[ViewConstants.customThemeStars] = -1;
		this.customThemeValue[ViewConstants.customThemeText] = -1;
		this.customThemeValue[ViewConstants.customThemeBoundary] = -1;
		this.customThemeValue[ViewConstants.customThemeGraphBg] = -1;
		this.customThemeValue[ViewConstants.customThemeGraphAxis] = -1;
		this.customThemeValue[ViewConstants.customThemeGraphAlive] = -1;
		this.customThemeValue[ViewConstants.customThemeGraphBirth] = -1;
		this.customThemeValue[ViewConstants.customThemeGraphDeath] = -1;
		this.customThemeValue[ViewConstants.customThemeError] = -1;
		this.customThemeValue[ViewConstants.customThemeLabel] = -1;
		this.customThemeValue[ViewConstants.customThemeDying] = -1;
		this.customThemeValue[ViewConstants.customThemeDyingRamp] = -1;
		this.customThemeValue[ViewConstants.customThemeUIFG] = -1;
		this.customThemeValue[ViewConstants.customThemeUIBG] = -1;
		this.customThemeValue[ViewConstants.customThemeUIHighlight] = -1;
		this.customThemeValue[ViewConstants.customThemeUISelect] = -1;
		this.customThemeValue[ViewConstants.customThemeUILocked] = -1;
		this.customThemeValue[ViewConstants.customThemeUIBorder] = -1;
		this.customThemeValue[ViewConstants.customThemeArrow] = -1;
		this.customThemeValue[ViewConstants.customThemePoly] = -1;
		this.customLabelColour = ViewConstants.labelFontColour;
		this.customArrowColour = ViewConstants.arrowColour;
		this.customPolygonColour = ViewConstants.polyColour;

		// switch off thumbnail mode if on
		if (this.thumbnail) {
			this.switchOffThumbnail();
		}
		this.thumbnailEverOn = false;
		this.menuManager.thumbnail = false;
		this.thumbnailDivisor = ViewConstants.defaultThumbSize;
		this.thumbLaunch = false;
		this.menuManager.thumblaunch = false;
		this.thumbZoomDefined = false;

		// reset parameters to defaults
		if (!pattern) {
			this.multiStateView = true;
		} else {
			this.multiStateView = false;
		}
		this.viewOnly = false;
		this.engine.displayGrid = false;
		this.engine.cellBorders = false;

		// reset menu visibility to defaults
		this.playList.deleted = false;
		this.modeList.deleted = false;
		this.genToggle.deleted = false;
		this.generationRange.deleted = false;
		this.stepRange.deleted = false;
		this.navToggle.deleted = false;
		this.layersItem.deleted = false;
		this.depthItem.deleted = false;
		this.themeItem.deleted = false;
		this.viewMenu.deleted = false;
		this.progressBar.deleted = false;

		// reset menu toggles to off
		this.navToggle.current = [false];
		this.genToggle.current = [false];

		// turn off help and errors
		this.displayHelp = 0;
		this.displayErrors = 0;

		// turn off draw mode
		this.modeList.current = this.viewModeList(ViewConstants.modePan, true, this);

		// update help UI
		this.helpToggle.current = this.toggleHelp([this.displayHelp], true, this);

		// reset boundary colour
		this.customBoundaryColour = [96, 96, 96];
		if (this.engine.littleEndian) {
			this.engine.boundaryColour = 0xff606060;
		} else {
			this.engine.boundaryColour = 0x606060ff;
		}

		// reset waypoints
		this.waypointManager.reset();
		this.waypointsDefined = false;

		// reset annotations
		this.waypointManager.clearAnnotations();

		// disable hide GUI on playback
		this.hideGUI = false;

		// enable history
		this.noHistory = false;

		// enable performance warnings
		this.noPerfWarning = false;

		// disable custom theme
		this.customTheme = false;

		// flag not drawing overlay
		this.engine.drawOverlay = false;

		// copy pattern to center
		if (pattern) {
			if (pattern.isNone) {
				this.colourList = ColourManager.defaultSet();
				this.colourSetName = "(default)";
			} else {
				if (PatternManager.extendedFormat || pattern.isHistory) {
					// get the colour list for the pattern based on rule name
					if (pattern.isHistory) {
						this.colourList = ColourManager.colourSet("LifeHistory");
	
						// set the history colour to the Theme 10 dead colour
						this.colourList[2] = 0 << 16 | 0 << 8 | 96;
					} else {
						this.colourList = ColourManager.colourSet(pattern.ruleName);
					}
	
					// check if a colour list was found
					if (this.colourList.length) {
						this.colourSetName = pattern.ruleName;
					} else {
						// load the default set
						this.colourList = ColourManager.defaultSet();
						this.colourSetName = "(default)";
					}
				}
			}

			// reset controls a script can overwrite
			this.resetScriptControls();

			// read any script in the title
			if (pattern.title) {
				// decode any script commands
				this.readScript(pattern.title, pattern.numStates);

				// initialise random number generator from seed
				myRand.init(this.randomSeed);

				// set errors to display if any found
				if (this.scriptErrors.length) {
					this.displayErrors = 1;
				}

				// override thumbnail if specified
				if (this.thumbnail && ignoreThumbnail) {
					this.thumbnail = false;
				}

				// check whether to resize canvas width based on script commands
				if (this.requestedWidth > -1) {
					// ensure width is a multiple of 8
					this.requestedWidth &= ~7;

					// check if the width is different than the current width
					if (this.requestedWidth !== this.displayWidth) {
						this.displayWidth = this.requestedWidth;
						resizeRequired = true;
					}
				}

				// check whether to resize canvas height based on script commands
				if (this.requestedHeight > -1) {
					// check if the height is different than the current height
					if (this.requestedHeight !== this.displayHeight) {
						this.displayHeight = this.requestedHeight;
						resizeRequired = true;
					}
				}

				// check whether to resize popup window
				if (this.isInPopup) {
					if (this.requestedPopupWidth > -1) {
						this.requestedPopupWidth &= ~7;
						if (this.requestedPopupWidth !== this.displayWidth) {
							this.displayWidth = this.requestedPopupWidth;
							resizeRequired = true;
						}
					} else {
						this.displayWidth = ViewConstants.minViewerWidth;
					}
					if (this.displayWidth !== this.lastPopupWidth) {
						this.popupWidthChanged = true;
					}

					if (this.requestedPopupHeight > -1) {
						if (this.requestedPopupHeight !== this.displayHeight) {
							this.displayHeight = this.requestedPopupHeight;
							resizeRequired = true;
						}
					} else {
						this.displayHeight = ViewConstants.minMenuHeight + 80;
					}
				}
			}

			// if pattern is too big and has no paste commands then generate error
			if (pattern.tooBig && this.pasteList.length === 0) {
				this.executable = false;
			}

			// setup the state list for drawing
			this.setupStateList();

			// set the menu colours
			this.setMenuColours();

			// update help topic button positions based on window height
			this.updateTopicButtonsPosition();

			// process dynamic themes
			this.engine.processMultiStateThemes();

			// set history states in engine
			this.engine.historyStates = this.historyStates;

			// disable graph if using THUMBLAUNCH and graph not displayed (since there's no way to turn it on)
			if (this.thumbLaunch && !this.popGraph) {
				this.graphDisabled = true;
				this.popGraph = false;
			}

			// allocate graph data unless graph disabled
			this.engine.allocateGraphData(!this.graphDisabled);

			// check pattern size (script command may have increased maximum allowed size)
			if (pattern.width > this.engine.maxGridSize || pattern.height > this.engine.maxGridSize) {
				this.failureReason = "Pattern too big (maximum " + this.engine.maxGridSize + "x" + this.engine.maxGridSize + ")";
				this.tooBig = true;
				this.executable = false;
				this.clearPatternData();
			}

			// check bounded grid size (script command may have increased maximum allowed size)
			if (pattern.gridType !== -1) {
				// check for LtL or HROT rules
				if (pattern.isHROT) {
					borderSize = pattern.rangeHROT * 6;
				}
				if (pattern.isLTL) {
					borderSize = pattern.rangeLTL * 6;
				}
				if (pattern.gridWidth >= this.engine.maxGridSize - borderSize || pattern.gridHeight >= this.engine.maxGridSize - borderSize) {
					// make invalid
					this.failureReason = "Bounded grid is too big";
					this.executable = false;
					this.engine.boundedGridType = -1;
				}
			}

			// update the life rule
			this.engine.updateLifeRule();

			// process any rle snippet evolution
			if (this.isEvolution) {
				// create the colour index
				this.engine.createColourIndex();

				// process evolution
				this.processEvolution();
			}

			// mark pattern not clipped to bounded grid
			this.wasClipped = false;

			// get the needed width and height for the grid size
			if (this.engine.boundedGridType !== -1) {
				// use bounded grid
				neededWidth = this.engine.boundedGridWidth;
				neededHeight = this.engine.boundedGridHeight;

				// check for zero dimensions
				if (neededWidth === 0) {
					neededWidth = pattern.width;
				}
				if (neededHeight === 0) {
					neededHeight = pattern.height;
				}
			} else {
				// use pattern
				neededWidth = pattern.width;
				neededHeight = pattern.height;

				// add any paste clips
				if (this.pasteList.length > 0) {
					neededWidth = this.computeNeededWidth(neededWidth);
					neededHeight = this.computeNeededHeight(neededHeight);
				}
			}

			// check if the grid is smaller than the pattern and/or bounded grid plus the maximum step speed
			borderSize = ViewConstants.maxStepSpeed;
			if (this.engine.isHROT) {
				borderSize = this.engine.HROT.range * 4 + 1;
				if (this.engine.boundedGridType !== -1) {
					borderSize += this.engine.HROT.range * 2;
				}
				if (this.engine.HROT.type === PatternManager.vonNeumannHROT) {
					if (this.engine.boundedGridType !== -1) {
						borderSize += this.engine.boundedGridHeight / 2;
					} else {
						borderSize += (this.engine.zoomBox.topY - this.engine.zoomBox.bottomY + 1) / 2;
					}
				}
				if (borderSize < ViewConstants.maxStepSpeed) {
					borderSize = ViewConstants.maxStepSpeed;
				}
			}

			// add CXRLE Pos if defined
			i = this.engine.maxGridSize / 2 - borderSize;
			if (this.posDefined) {
				if (this.posXOffset < -i) {
					this.posXOffset = -i;
				} else if (this.posXOffset >= i) {
					this.posXOffset = i - 1;
				}
				if (this.posYOffset < -i) {
					this.posYOffset = -i;
				} else if (this.posYOffset >= i) {
					this.posYOffset = i - 1;
				}
				this.xOffset += this.posXOffset;
				this.yOffset += this.posYOffset;
			}

			// ensure offset in range
			if (this.xOffset < -i) {
				this.xOffset = -i;
			} else if (this.xOffset >= i) {
				this.xOffset = i - 1;
			}
			if (this.yOffset < -i) {
				this.yOffset = -i;
			} else if (this.yOffset >= i) {
				this.yOffset = i - 1;
			}

			// grow the grid if the pattern is too big to fit
			while (this.engine.width < this.engine.maxGridSize && ((neededWidth + borderSize + Math.abs(this.xOffset) * 2) >= this.engine.width || (neededHeight + borderSize + Math.abs(this.yOffset) * 2) >= this.engine.height)) {
				// grow the grid
				this.engine.growGrid();

				// update the default x and y
				this.defaultX += this.engine.width >> 2;
				this.defaultY += this.engine.height >> 2;

				// update the saved x and y
				this.savedX += this.engine.width >> 2;
				this.savedY += this.engine.height >> 2;

				// check for hex mode
				if (this.engine.isHex) {
					this.defaultX -= this.engine.height >> 3;
					this.savedX -= this.engine.height >> 3;
				}
			}

			// resize the HROT buffer to the current width and height
			if (pattern.isHROT) {
				this.engine.HROT.resize(this.engine.width, this.engine.height);
			}

			// compute pan X and Y for the pattern on the grid
			this.computePanXY(pattern.width, pattern.height);
			
			// populate the state 6 mask
			if (this.engine.isLifeHistory) {
				// check if state 6 is used
				if (PatternManager.stateCount[6]) {
					this.engine.populateState6Mask(pattern, this.panX, this.panY);
				}
			}

			// set custom text colour
			if (this.customTextColour) {
				// copy to text colour
				this.menuManager.notification.colour = "rgb(" + this.customTextColour[0] + "," + this.customTextColour[1] + "," + this.customTextColour[2] + ")";
			} else {
				// set default
				this.menuManager.notification.colour = this.menuManager.notification.priorityColour;
			}

			// set states used if no custom colours used
			if (this.customColours.length === 0) {
				for (i = 0; i < this.colourList.length; i += 1) {
					if (PatternManager.stateCount[i]) {
						this.customColourUsed[i] = ViewConstants.stateUsedDefault;
					} else {
						this.customColourUsed[i] = ViewConstants.stateNotUsed;
					}
				}
			}

			// create LifeHistory overlay colours if required
			if (this.engine.overlayGrid) {
				// create overlay colours
				this.engine.createLHOverlayColours(this.colourList, this.customColours);

				// flag overlay drawing required
				this.engine.drawOverlay = true;
			} else {
				this.engine.drawOverlay = false;
			}

			// copy pattern to center of grid
			this.copyPatternTo(pattern);

			// update rule label
			if (this.patternAliasName !== "") {
				this.ruleLabel.preText = this.patternAliasName;
			} else {
				this.ruleLabel.preText = this.patternRuleName;
			}

			// set the tool tip in case the rule name is wider than the label
			this.ruleLabel.toolTip = this.patternRuleName;
			
			// check for alias name
			if (this.patternAliasName !== "") {
				this.ruleLabel.toolTip += " alias " + this.patternAliasName;
			}
		}

		// create the colour index
		this.engine.createColourIndex();

		// check if a theme was requested
		if (this.themeRequested !== -1) {
			// set the requested theme
			this.engine.setTheme(this.themeRequested, 1, this);
		} else {
			// if not then check if a custom theme was specified
			if (this.customTheme) {
				this.engine.setTheme(this.engine.numThemes, 1, this);
			} else {
				// set the theme based on rule type
				if (this.engine.isLifeHistory) {
					// default to theme 10
					this.engine.setTheme(10, 1, this);
				} else {
					// check for Generations or HROT
					if (this.engine.multiNumStates > 2) {
						// multi state uses theme 11
						this.engine.setTheme(11, 1, this);
					} else {
						// default to theme 1
						this.engine.setTheme(1, 1, this);
					}
				}
			}
		}

		// copy custom colours to engine
		this.engine.customColours = this.customColours;

		// create the colour palette
		if (this.engine.isNone) {
			this.engine.createMultiStateColours(this.colourList, this.customColours);
		} else {
			this.engine.createColours();
		}

		// create the pixel colours from the palette at full brightness
		this.engine.createPixelColours(1);	

		// set bounded grid border cell
		this.engine.setBoundedGridBorderCell();

		// set the graph controls
		this.opacityItem.current = this.viewOpacityRange([this.popGraphOpacity, this.popGraphOpacity], false, this);
		this.linesToggle.current = [this.popGraphLines];

		// update autofit UI
		this.autoFitToggle.current = [this.autoFit];

		// update grid UI
		this.gridToggle.current = [this.engine.displayGrid];

		// reset generation
		this.engine.counter = 0;
		this.floatCounter = 0;
		this.originCounter = 0;

		// reset elapsed time
		this.elapsedTime = 0;

		// if standard view mode then reset colour grid and population
		if (this.multiStateView) {
			// check if the pattern loaded
			if (pattern) {
				// check if a custom colour set was defined
				if (this.customColours.length > 0) {
					this.colourList = this.customColours;
				}
			}
			this.colourSetSize = this.colourList.length;

			// create multi state colours
			this.engine.createMultiStateColours(this.colourList, this.customColours);

			// reset snapshot manager
			this.engine.snapshotManager.reset();

			// disable graph
			this.graphDisabled = true;
			this.popGraph = false;
		} else {
			// check if this is a LifeHistory pattern
			if (this.engine.isLifeHistory) {
				// check if there are state 2 cells
				if (PatternManager.stateCount[2]) {
					// copy state 2 to the colour grid
					this.engine.copyState2(pattern, this.panX, this.panY);
				}
			}

			// compute bounding box
			this.engine.resetBoxes(this.state1Fit);

			// reset history box
			this.engine.resetHistoryBox();

			// reset the colour grid if not multi-state Generations or HROT rule
			if (this.engine.multiNumStates <= 2) {
				this.engine.resetColourGridBox(this.engine.grid16);
			}

			// draw any rle snippets after colour grid conversion (for paste blending modes)
			this.pasteRLEList();

			// reset boxes again if RLE was pasted
			if (this.pasteList.length > 0) {
				this.engine.resetBoxes(this.state1Fit);
				this.engine.resetHistoryBox();
				if (this.engine.multiNumStates <= 2) {
					this.engine.resetColourGridBox(this.engine.grid16);
				}
			}

			// reset population
			this.engine.resetPopulationBox(this.engine.grid16, this.engine.colourGrid);
			if (pattern && this.engine.population === 0 && !this.isPasteEvery) {
				this.emptyStart = true;
				if (!this.engine.isNone) {
					if (pattern.tooBig) {
						this.menuManager.notification.notify("Pattern too big!", 15, ViewConstants.errorDuration, 15, false);
					} else {
						this.menuManager.notification.notify("Nothing alive!", 15, 300, 15, false);
					}
				}
			} else {
				this.emptyStart = false;
			}

			// set the bounded grid tiles if specified
			if (this.engine.boundedGridType !== -1) {
				this.engine.setBoundedTiles();
			}

			// save state for reset
			this.engine.saveGrid(this.noHistory);
			this.engine.restoreSavedGrid(this.noHistory);
		}

		// set the xy label UI width based on max grid size
		if (this.engine.maxGridSize > 9999) {
			this.xyLabel.width = 166;
		} else {
			this.xyLabel.width = 140;
		}

		// set the [R]History toggle UI control
		this.rHistoryButton.locked = !this.engine.isLifeHistory;
		this.rHistoryButton.current = [this.engine.displayLifeHistory];

		// set the graph UI control
		this.graphButton.locked = this.graphDisabled;
		this.graphButton.current = [this.popGraph];

		// set the kill gliders UI control
		this.killButton.current = [this.engine.clearGliders];

		// set the hex UI control and lock if triangular grid
		this.hexButton.current = [this.engine.isHex];
		this.hexButton.locked = this.engine.isTriangular;

		// set the hex cell UI control and lock if triangular grid
		this.hexCellButton.current = [this.engine.useHexagons];
		this.hexCellButton.locked = this.engine.isTriangular;

		// set the label UI control
		if (this.waypointManager.numAnnotations() === 0) {
			this.labelButton.locked = true;
			this.showLabels = false;
		} else {
			this.labelButton.locked = false;
			this.showLabels = true;
		}
		this.labelButton.current = [this.showLabels];

		// set the InfoBar UI control
		this.infoBarButton.current = [this.infoBarEnabled];

		// set the Stars UI control
		this.starsButton.current = [this.starsOn];

		// set the history fit UI control
		this.historyFitButton.current = [this.historyFit];

		// set the POI control
		if (this.waypointManager.numPOIs()) {
			this.prevPOIButton.deleted = false;
			this.nextPOIButton.deleted = false;
		} else{
			this.prevPOIButton.deleted = true;
			this.nextPOIButton.deleted = true;
		}

		// set the major gridlines UI control
		if (this.engine.gridLineMajor === 0) {
			this.majorButton.current = [false];
			this.majorButton.locked = true;
		} else {
			this.majorButton.current = [this.engine.gridLineMajorEnabled];
			this.majorButton.locked = false;
		}

		// reset population data
		if (!this.graphDisabled) {
			this.engine.resetPopulationData();
		}

		if (pattern) {
			// free the multi-state map
			pattern.multiStateMap = null;
		}

		// fit zoom
		numberValue = this.engine.zoom;
		savedX = this.engine.xOff;
		savedY = this.engine.yOff;
		savedThumbnail = this.thumbnail;
		this.thumbnail = false;
		this.fitZoomDisplay(true, false);
		this.thumbnail = savedThumbnail;

		// override the default zoom if specified
		if (this.defaultZoomUsed) {
			this.engine.zoom = numberValue;
		} else {
			// enforce default maximum if zoom or autofit not specified
			if (!this.autoFit) {
				if (this.engine.zoom > ViewConstants.maxDefaultZoom) {
					this.engine.zoom = ViewConstants.maxDefaultZoom;
				}
			}
		}

		// override the default position if specified
		if (this.defaultXUsed) {
			this.engine.xOff = savedX;
		}
		if (this.defaultYUsed) {
			this.engine.yOff = savedY;
		}

		// update the waypoints if the defaults were not used
		if (this.waypointsDefined) {
			this.validateWaypoints(this.scriptErrors);
		}

		// set thumbnail zoom if specified
		if (this.thumbnail && this.thumbZoomDefined) {
			this.engine.zoom = this.thumbZoomValue;
		}

		// make this current position the default
		this.defaultZoom = this.engine.zoom;
		this.zoomItem.current = this.viewZoomRange([this.engine.zoom, this.engine.zoom], false, this);
		this.defaultX = this.engine.xOff;
		this.defaultY = this.engine.yOff;

		// set the default angle
		this.defaultAngle = this.engine.angle;
		this.angleItem.current = [this.defaultAngle, this.defaultAngle];

		// set the default theme
		this.defaultTheme = this.engine.colourTheme;
		this.themeItem.current = this.viewThemeRange([this.defaultTheme, ""], true, this);

		// set the generation speed
		this.defaultGPS = this.genSpeed;
		numberValue = Math.sqrt((this.defaultGPS - ViewConstants.minGenSpeed) / (ViewConstants.maxGenSpeed - ViewConstants.minGenSpeed));
		this.generationRange.current = this.viewGenerationRange([numberValue, numberValue], true, this);

		// set the step
		this.defaultStep = this.gensPerStep;
		this.stepRange.current = this.viewStepRange([this.defaultStep, this.defaultStep], true, this);

		// set the layers
		this.defaultLayers = this.engine.layers;
		this.layersItem.current = [this.defaultLayers, this.defaultLayers];

		// set the layer depth
		this.defaultDepth = this.engine.layerDepth;
		numberValue = Math.sqrt(this.defaultDepth);
		this.depthItem.current = this.viewDepthRange([numberValue, numberValue], true, this);

		// mark something alive
		this.engine.anythingAlive = true;

		// check whether autostart required
		if (this.autoStart && !this.autoStartDisabled) {
			this.generationOn = true;
			this.playList.current = ViewConstants.modePlay;
		} else {
			this.generationOn = false;
			this.playList.current = ViewConstants.modePause;
		}

		// set the pause button
		this.setPauseIcon(this.generationOn);

		// disable menu controls if height is too small
		if (this.displayHeight < ViewConstants.minMenuHeight) {
			// delete the navigation menu toggle
			this.navToggle.deleted = true;

			// move gps, step and play controls right
			this.playList.x = this.playListX + 45;
			this.playList.relX = this.playList.x;

			this.generationRange.x = this.generationRangeX + 45;
			this.generationRange.relX = this.generationRange.x;

			this.stepRange.x = this.stepRangeX + 45;
			this.stepRange.relX = this.stepRange.x;
		} else {
			// reset gps and play control position
			this.playList.x = this.playListX;
			this.playList.relX = this.playList.x;

			this.generationRange.x = this.generationRangeX;
			this.generationRange.relX = this.generationRange.x;

			this.stepRange.x = this.stepRangeX;
			this.stepRange.relX = this.stepRange.x;
		}

		// resize the zoom and graph opacity sliders
		if (this.displayWidth > ViewConstants.minViewerWidth) {
			i = (this.displayWidth - ViewConstants.minViewerWidth) + ViewConstants.zoomSliderDefaultWidth;
			if (i > ViewConstants.zoomSliderMaxWidth) {
				i = ViewConstants.zoomSliderMaxWidth;
			}
			this.zoomItem.width = i;
			this.opacityItem.width = i;
			if (i > ViewConstants.opacityNameWidth) {
				this.opacityItem.preText = "Opacity ";
			}
		} else {
			this.zoomItem.width = ViewConstants.zoomSliderDefaultWidth;
			this.opacityItem.width = ViewConstants.zoomSliderDefaultWidth;
			this.opacityItem.preText = "Opac ";
		}

		// check whether to resize the canvas
		if (resizeRequired || this.thumbnail) {
			// check for thumbnail view
			if (this.thumbnail) {
				this.switchOnThumbnail();
			} else {
				// resize the viewer
				this.resize();
			}
		}

		// display error notification if failed
		if (!pattern) {
			// check if the pattern was too big
			if (PatternManager.tooBig) {
				this.menuManager.notification.notify("Pattern too big!", 15, ViewConstants.errorDuration, 15, false);
			} else {
				this.menuManager.notification.notify("Invalid pattern!", 15, ViewConstants.errorDuration, 15, false);
			}
		}

		// close help if errors found
		if (this.scriptErrors.length) {
			this.displayHelp = 0;
		} else {
			// close errors
			this.displayErrors = 0;
		}

		// make view only if not executable
		if (!this.executable) {
			this.viewOnly = true;
		}

		// disable playback if view only
		if (this.viewOnly) {
			// delete the playback controls
			this.playList.deleted = true;

			// delete the generation toggle
			this.genToggle.deleted = true;
			
			// delete the progress bar
			this.progressBar.deleted = true;

			// delete gps range
			this.generationRange.deleted = true;

			// delete the step range
			this.stepRange.deleted = true;

			// delete layers and depth if multi-state view on
			if (this.multiStateView) {
				this.layersItem.deleted = true;
				this.depthItem.deleted = true;
				this.themeItem.deleted = true;

				// reset layers to 1
				this.engine.layers = 1;
			}

			// show the reason label
			this.reasonLabel.deleted = false;

			// check if there was an error
			if (this.failureReason === "") {
				// label reason is VIEWONLY
				this.reasonLabel.preText = Keywords.viewOnlyWord;
				this.reasonLabel.fgCol = ViewConstants.helpFontColour;
			} else {
				this.reasonLabel.preText = this.failureReason;
				this.reasonLabel.fgCol = this.errorsFontColour;
			}
		} else {
			this.reasonLabel.deleted = true;
		}

		// update the grid icon for hex/square mode
		this.updateGridIcon();

		// clear manual change flag
		this.manualChange = false;

		// clear last waypoint message
		this.lastWaypointMessage = "";

		// set saved view to current view
		this.saveCamera(this);

		// if grid is finitely bounded then show density rather than births and deaths
		if (this.finitelyBounded()) {
			this.birthsLabel.preText = "Density";
			this.birthsLabel.toolTip = "cell density";
		} else {
			this.birthsLabel.preText = "Births";
			this.birthsLabel.toolTip = "cells born this generation";
		}

		// ensure update
		this.menuManager.toggleRequired = true;
		this.menuManager.setAutoUpdate(true);

		// set the window title if in a popup
		if (this.isInPopup) {
			// set the title
			if (this.titleElement) {
				if (this.windowTitle === "") {
					this.titleElement.nodeValue = "LifeViewer";
				} else {
					this.titleElement.nodeValue = this.fitTitle(this.windowTitle);
				}
			}
		}

		// display universe if in multiverse mode
		if (DocConfig.multi) {
			name = this.patternName;
			if (name === "") {
				name = "Universe " + (this.universe + 1);
			}
			this.menuManager.notification.notify(name, 15, 120, 15, true);
			this.prevUniverseButton.deleted = false;
			this.nextUniverseButton.deleted = false;
		} else {
			this.prevUniverseButton.deleted = true;
			this.nextUniverseButton.deleted = true;

		}
	};

	// start a viewer
	function startView(patternString, canvasItem, maxWidth, isInPopup, element) {
		var i = 0,
		    
		    // get the parent of the canvas
		    parentItem = canvasItem.parentNode,

		    // view
		    newView = null;

		// check if the viewer already exists
		i = 0;
		while (i < Controller.viewers.length && !newView) {
			if (Controller.viewers[i][0].tabIndex === canvasItem.tabIndex) {
				newView = Controller.viewers[i][1];
			} else {
				i += 1;
			}
		}

		// check if the viewer was found
		if (!newView) {
			// create a new view
			newView = new View(element);

			// set the flag whether this view is in a popup window
			newView.isInPopup = isInPopup;

			// limit the width if enabled
			if (DocConfig.limitWidth && !isInPopup) {
				newView.maxCodeWidth = maxWidth & ~7;
				if (newView.maxCodeWidth < ViewConstants.minViewerWidth) {
					newView.maxCodeWidth = ViewConstants.minViewerWidth;
				}
			}

			// add a tab index to the canvas
			canvasItem.tabIndex = Controller.viewers.length + 1;

			// attach it to the canvas
			newView.attachToCanvas(canvasItem);

			// wrap it in a popup window if hidden
			if (parentItem.style.display === "none") {
				Controller.popupWindow = new PopupWindow(parentItem, newView.menuManager);
			}

			// add the view to the list
			Controller.viewers[Controller.viewers.length] = [canvasItem, newView, Controller.popupWindow];
		}

		// load the pattern without ignore thumbnail
		if (!isInPopup) {
			newView.startViewer(patternString, false);
		}
	}

	// read LifeViewer settings from meta tag if present
	function readSettingsFromMeta() {
		// search for the LifeViewer meta tag
		var a = document.getElementsByTagName('meta'),
		    b = 0,
		    i = 0,
		    metaItem = null,
		    content = "",
		    tokens = null,
		    value = "";

		// check if a LifeViewer tag exists
		for (b = 0; b < a.length; b += 1) {
			metaItem = a[b];

			// check if it is a LifeViewer meta tag
			if (metaItem.name === DocConfig.tagName) {
				// set the defaults
				DocConfig.hide = false;
				DocConfig.limitWidth = false;

				// read the content
				content = metaItem.content;

				// split into tokens
				tokens = content.match(/\S+/g);
				if (tokens && tokens.length >= 2 && tokens.length <= 5) {
					// set the div class name
					DocConfig.divClassName = tokens[0];

					// set the pattern source element name
					DocConfig.patternSourceName = tokens[1];

					// check for the optional "hide" and "limit" tokens
					for (i = 2; i < tokens.length; i += 1) {
						switch(tokens[i]) {
						// hide viewer if no support
						case "hide":
							DocConfig.hide = true;
							break;

						// viewer width is limited to pattern element width
						case "limit":
							DocConfig.limitWidth = true;
							break;
						
						// viewer is in multiverse mode
						case "multi":
							DocConfig.multi = true;
							break;

						// otherwise check if it is numeric
						default:
							value = tokens[i];
							if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
								// set the source element maximum height
								DocConfig.patternSourceMaxHeight = parseFloat(value) | 0;
							}
							break;
						}
					}
				}
			}
		}
	}
	
	// find LifeViewer enclosing div
	function findDiv(element) {
		// get the parent of the element
		var parentItem = element.parentNode,
		    found = false;

		// loop until found
		while (!found) {
			// check that the parent is a div
			if (parentItem.localName === "div") {
				// check whether the class is the LifeViewer div class
				if (parentItem.className === DocConfig.divClassName || parentItem.className === DocConfig.divCodeClassName) {
					found = true;
				}
			}
			if (!found) {
				// if no match then go the next parent
				parentItem = parentItem.parentNode;
			}
		}

		return parentItem;
	}
		
	// hide the external viewer
	function hideViewer() {
		// get the standalone viewer
		var externalViewer = Controller.standaloneViewer(),

		    // get the parent node of the Canvas
		    parentItem = externalViewer[0].parentNode,

		    // get the associated View
		    view = externalViewer[1],

		    // get the popup window
		    popup = externalViewer[2];

		// hide the parent element
		parentItem.style.display = "none";

		// mark popup window hidden
		popup.displayed = false;

		// stop the viewer
		if (view.generationOn) {
			// pause the viewer
			view.playList.current = view.viewPlayList(ViewConstants.modePause, true, view);
		}
	}

	// callback for hide viewer anchor
	function hideCallback(event) {
		hideViewer();

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();

		return false;
	}

	// clean the pattern text
	function cleanPattern(element) {
		// remove HTML tags
		var result = element.innerHTML.replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/<br *\/>/gi, "\n").replace(/<br>/gi, "\n").replace(/&nbsp;/gi, " ").replace(/<span class="posthilit">/gi, "").replace(/<\/span>/gi, "").trim();

		// remove space or tab at the beginning of lines
		result = result.replace(/\n[ ]+/g, "\n");
		result = result.replace(/\n\t+/g, "\n");

		// return cleaned string
		return result;
	}

	// update the inline viewer
	function updateMe(element) {
		// get the parent node
		var parentItem = findDiv(element),

		    // find the element containing the pattern
		    textItem = parentItem.getElementsByTagName(DocConfig.patternSourceName)[0],

		    cleanItem = null,
		    viewer = Controller.viewers[0];

		// copy the text item into the inner html
		textItem.innerHTML = textItem.value;

		// clean the pattern text
		cleanItem = cleanPattern(textItem);

		// reset the viewer
		viewer[1].viewStart(viewer[1]);

		// hide any notifications immediately
		viewer[1].menuManager.notification.clear(true, true);
		viewer[1].menuManager.notification.clear(false, true);

		// update the standalone viewer
		viewer[1].startViewer(cleanItem, false);
	}

	// display and update the external viewer
	function updateViewer(element) {
		// get the parent node
		var parentItem = findDiv(element),

		    // find the element containing the pattern
		    textItem = parentItem.getElementsByTagName(DocConfig.patternSourceName)[0],

		    // get the pattern contents
		    cleanItem = cleanPattern(textItem),

		    // get the standalone viewer
		    viewer = Controller.standaloneViewer(),

		    // popup window
		    popup = null,

		    // elements
		    canvasItem = null,
		    divItem = null,
		    anchorItem = null,
		    innerDivItem = null,
		    windowTitleItem = null,
		    centerDivItem = null,
		    hiddenItem = null;

		// check if the standalone viewer exists
		if (viewer) {
			// reset it
			viewer[1].element = textItem;
			viewer[1].viewStart(viewer[1]);
		} else {
			// create canvas and set width and height
			canvasItem = document.createElement("canvas");
			canvasItem.width = ViewConstants.minViewerWidth;
			canvasItem.height = ViewConstants.minMenuHeight + 80;
			canvasItem.style.display = "block";

			// add a new anchor
			anchorItem = document.createElement('a');
			anchorItem.setAttribute('href', "#");
			anchorItem.innerHTML = "&nbsp;X&nbsp;";
			anchorItem.style.textDecoration = "none";
			anchorItem.style.fontFamily = "Lucida Grande,Verdana,Helvetica,Arial,sans-serif";
			anchorItem.style.color = "#FFFFFF";
			anchorItem.style.backgroundColor = "#C75050";
			anchorItem.style.cssFloat = "right";
			anchorItem.style.height = "28px";
			anchorItem.style.fontSize = "18px";

			// add a hidden anchor to center the text
			hiddenItem = document.createElement('a');
			hiddenItem.innerHTML = "&nbsp;X&nbsp;";
			hiddenItem.style.textDecoration = "none";
			hiddenItem.style.fontFamily = "Lucida Grande,Verdana,Helvetica,Arial,sans-serif";
			hiddenItem.style.visibility = "hidden";
			hiddenItem.style.cssFloat = "left";
			hiddenItem.style.height = "28px";
			hiddenItem.style.fontSize = "18px";

			// create the center div with the window title text
			centerDivItem = document.createElement("div");
			centerDivItem.style.textAlign = "center";
			centerDivItem.style.color = "rgb(83,100,130)";
			centerDivItem.style.fontFamily = "Arial, Verdana, Helvetica, sans-serif";
			centerDivItem.style.fontSize = "18px";
			centerDivItem.style.height = "28px";
			windowTitleItem = document.createTextNode("LifeViewer");
			centerDivItem.style.cursor = "default";
			centerDivItem.appendChild(windowTitleItem);

			// set the onclick
			registerEvent(anchorItem, "click", hideCallback, false);

			// create enclosing div and set style
			divItem = document.createElement("div");
			divItem.style.display = "none";
			divItem.style.position = "fixed";
			divItem.style.border = "1px solid rgb(128,128,128)";

			// put it top right
			divItem.style.left = "2048px";
			divItem.style.top = "0px";
			divItem.style.textAlign = "right";

			// create the shadow
			divItem.style.boxShadow = "0px 0px 3px 3px rgba(0,0,0,.3), 12px 12px 8px rgba(0,0,0,.5)";
			divItem.style.margin = "1px";

			// create the selall div
			innerDivItem = document.createElement("div");
			innerDivItem.className = DocConfig.divCodeClassName;
			innerDivItem.style.backgroundColor = "#FFFFFF";
			innerDivItem.style.height = "28px";
			innerDivItem.style.lineHeight = "28px";

			// add the title, anchor and canvas to the div
			innerDivItem.appendChild(hiddenItem);
			innerDivItem.appendChild(anchorItem);
			innerDivItem.appendChild(centerDivItem);
			divItem.appendChild(innerDivItem);
			divItem.appendChild(canvasItem);

			// add to the document
			parentItem.appendChild(divItem);

			// start the viewer in a popup
			startView(cleanItem, canvasItem, ViewConstants.minViewerWidth, true, textItem);
			Controller.standaloneIndex = Controller.viewers.length - 1;
			viewer = Controller.standaloneViewer();

			// save the window title element
			viewer[1].titleElement = windowTitleItem;
		}

		// find the parent of the Viewer
		parentItem = viewer[0].parentNode;

		// check if the item is displayed
		if (parentItem.style.display !== "") {
			// display the item
			parentItem.style.display = "";
		}

		// set the standalone viewer size
		viewer[1].displayWidth = ViewConstants.minViewerWidth;
		viewer[1].displayHeight = ViewConstants.minMenuHeight + 80;
		viewer[1].resize();

		// hide any notifications immediately
		viewer[1].menuManager.notification.clear(true, true);
		viewer[1].menuManager.notification.clear(false, true);

		// update the standalone viewer with ignore thumbnail set
		viewer[1].startViewer(cleanItem, true);
		viewer[1].resize();
		
		// get the popup window
		popup = viewer[2];

		// mark popup as displayed
		popup.displayed = true;

		// ensure popup is within the browser window
		popup.resizeWindow(popup, null);

		// give focus to the popup window
		viewer[1].mainContext.canvas.focus();
		viewer[1].menuManager.hasFocus = true;

		return false;
	}

	// check if a string is a valid pattern
	function isPattern(patternString, allocator) {
		var result = false,
		    pattern = null;

		// attempt to build a pattern from the string
		try {
			// create a pattern
			pattern = PatternManager.create("", patternString, allocator);

			// check if it created
			if (pattern.lifeMap) {
				result = true;
				// check if in multiverse mode
				if (DocConfig.multi) {
					// add details to Controller
					Controller.patterns[Controller.patterns.length] = new PatternInfo(pattern.name, patternString, pattern.ruleName + pattern.boundedGridDef, pattern.width, pattern.height);
				}
			}
		}
		catch(err) {
			pattern = null;
		}

		// free the pattern
		pattern = null;

		// return the flag
		return result;
	}

	// callback for show in viewer anchor
	function anchorCallback(event) {
		updateViewer(this);

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();

		return false;
	}

	// start all viewers in the document
	function startAllViewers() {
		// find all viewers in the document (should be enclosed in <div class="rle">)
		var a = document.getElementsByTagName('div'),
		    b = 0,
		    textItem = null,
		    anchorItem = null,
		    newAnchor = null,
		    canvasItem = null,
		    cleanItem = null,
		    rleItem = null,
		    nodeItem = null,
		    childItem = null,

		    // temporary allocator
		    allocator = new Allocator();

		// read settings
		readSettingsFromMeta();

		// search for rle divs
		for (b = 0; b < a.length; b += 1) {
			// get the next div
			rleItem = a[b];

			// check if it is rle class
			if (rleItem.className === DocConfig.divClassName) {
				// find the child textarea and canvas
				textItem = rleItem.getElementsByTagName(DocConfig.patternSourceName)[0];
				canvasItem = rleItem.getElementsByTagName('canvas')[0];

				// check if the text item contains a child text item
				childItem = textItem.getElementsByTagName(DocConfig.patternSourceName)[0];
				if (childItem) {
					textItem = childItem;
				}

				// check if typedArrays and Canvas are supported
				if (typedArrays && textItem) {
					// remove any html tags from the text item and trim
					cleanItem = cleanPattern(textItem);

					// check for multiverse
					if (DocConfig.multi) {
						// check if the text is a pattern and add to Controller if in multiverse mode
						isPattern(cleanItem, allocator);
					}

					// check if the canvas exists
					if (canvasItem && canvasItem.getContext) {
						// check whether to limit the height of the text item
						if (DocConfig.patternSourceMaxHeight > -1) {
							if (textItem.clientHeight > DocConfig.patternSourceMaxHeight) {
								textItem.style.height = DocConfig.patternSourceMaxHeight + "px";
							}
						}
						
						// initalise viewer not in popup
						startView(cleanItem, canvasItem, textItem.offsetWidth, false, textItem);
					} else {
						// hide the canvas item
						if (DocConfig.hide && canvasItem) { 
							canvasItem.style.display = "none";
						}
					}
				}
			} else {
				// check if typedArrays are supported
				if (typedArrays) {
					// check if it is a div containing a codebox (that isn't in an rle div)
					if (rleItem.className === DocConfig.divCodeClassName) {
						// check if the parent is rle
						if (rleItem.parentNode.className !== DocConfig.divClassName) {
							// find the child code block
							textItem = rleItem.getElementsByTagName(DocConfig.patternSourceName)[0];
							if (textItem) {
								// remove any html tags from the text item and trim
								cleanItem = cleanPattern(textItem);
							
								// null the anchor so we can tell if it gets created
								anchorItem = null;
							
								// check if the contents is a valid pattern (will add to Controller if in multiverse mode)
								if (isPattern(cleanItem, allocator)) {
									// add the show in viewer anchor
									anchorItem = rleItem.getElementsByTagName('a')[0];

									// add a new anchor
									newAnchor = document.createElement('a');
									newAnchor.setAttribute('href', "#");
									newAnchor.innerHTML = "Show in Viewer";

									// set the onclick
									registerEvent(newAnchor, "click", anchorCallback, false);

									// check if there was an anchor
									if (anchorItem) {
										// create a text divider
										nodeItem = document.createTextNode(" / ");

										// add to the parent
										anchorItem.parentNode.appendChild(nodeItem);
										anchorItem.parentNode.appendChild(newAnchor);
									} else {
										// add to the parent
										textItem.parentNode.appendChild(newAnchor);
									}
								}
							}
						}
					}
				}
			}
		}
	}

	// register event to start viewers when document is loaded
	registerEvent(window, "load", startAllViewers, false);

	// external interface
	window['DocConfig'] = DocConfig;
	window['Controller'] = Controller;
	window['ViewConstants'] = ViewConstants;
	window['startAllViewers'] = startAllViewers;
	window['updateViewer'] = updateViewer;
	window['updateMe'] = updateMe;
	window['hideViewer'] = hideViewer;
}
());
