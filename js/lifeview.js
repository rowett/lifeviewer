// LifeViewer plugin
// written by Chris Rowett

(function() {
	// use strict mode
	"use strict";

	// define globals
	/* global Uint8Array Random BoundingBox Allocator AliasManager Uint8 Int16 KeyProcessor Pattern PatternManager WaypointConstants WaypointManager Help LifeConstants IconManager Menu Life Stars MenuManager RuleTreeCache registerEvent Keywords ColourManager ScriptParser Uint32Array PopupWindow typedArrays Float32 */

	// LifeViewer document configuration
	var DocConfig = {
		// meta tag name
		/** @const {string} */ tagName : "LifeViewer",

		// fullscreen name
		/** @const {string} */ fullScreenToken : "fullscreen",

		// hide
		/** @const {string} */ hideToken : "hide",

		// multi
		/** @const {string} */ multiToken : "multi",

		// limit
		/** @const {string} */ limitToken : "limit",

		// div class name
		/** @type {string} */ divClassName : "rle",

		// pattern source element name
		/** @type {string} */ patternSourceName : "code",

		// maximum height of pattern source element
		/** @type {number} */ patternSourceMaxHeight : 37,

		// whether to hide canvas if no support
		/** @type {boolean} */ hide : true,

		// whether viewer is in fullscreen mode
		/** @type {boolean} */ fullScreen : false,

		// whether to limit width to the pattern source element width
		/** @type {boolean} */ limitWidth : false,

		// whether in multiverse mode
		/** @type {boolean} */ multi : false,

		// div class name containing code block
		/** @const {string} */ divCodeClassName : "codebox",

		// repository location
		/** @type {string} */ repositoryLocation : "",

		// repository rule postfix
		/** @type {string} */ rulePostfix : "",

		// patterns (in source RLE)
		patterns : []
	},

	// ViewConstants singleton
	ViewConstants = {
		// alt keys that LifeViewer uses (any accesskey attributes that match these will be disabled)
		/** @const {string} */ altKeys : "0123456789rtyopasghjklxcbn",

		// maximum start from generation
		/** @const {number} */ maxStartFromGeneration : 1048576,

		// fit zoom types
		/** @const {number} */ fitZoomPattern : 0,
		/** @const {number} */ fitZoomSelection : 1,
		/** @const {number} */ fitZoomMiddle : 2,

		// default random pattern dimension
		/** @const {number} */ randomDimension : 64,

		// min and max random width, height and fill percentage
		/** @const {number} */ minRandomWidth : 1,
		/** @const {number} */ maxRandomWidth : 2048,
		/** @const {number} */ minRandomHeight : 1,
		/** @const {number} */ maxRandomHeight : 2048,
		/** @const {number} */ minRandomFill : 1,
		/** @const {number} */ maxRandomFill : 100,

		// theme selection button positions and order
		/** @const {Array<number>} */ themeX : [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3],
		/** @const {Array<number>} */ themeOrder : [1, 10, 11, 17, 18, 2, 3, 4, 5, 7, 12, 13, 14, 15, 16, 0, 6, 8, 9, 19, 20],

		// paste positions
		/** @const {number} */ pastePositionNW : 0,
		/** @const {number} */ pastePositionN : 1,
		/** @const {number} */ pastePositionNE : 2,
		/** @const {number} */ pastePositionE : 3,
		/** @const {number} */ pastePositionSE : 4,
		/** @const {number} */ pastePositionS : 5,
		/** @const {number} */ pastePositionSW : 6,
		/** @const {number} */ pastePositionW : 7,
		/** @const {number} */ pastePositionMiddle : 8,

		// number of paste positions
		/** @const {number} */ numPastePositions : 9,

		// paste position text
		/** @const {Array<string>} */ pastePositionNames : ["Top Left", "Top", "Top Right", "Right", "Bottom Right", "Bottom", "Bottom Left", "Left", "Middle"],

		// chunk to add to undo/redo buffer 2^n
		/** @const {number} */ editChunkPower : 15,

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
		/** @const {number} */ pasteModeZero : 0,
		/** @const {number} */ pasteModeAnd : 1,
		/** @const {number} */ pasteMode0010 : 2,
		/** @const {number} */ pasteModeX : 3,
		/** @const {number} */ pasteMode0100 : 4,
		/** @const {number} */ pasteModeY : 5,
		/** @const {number} */ pasteModeXor : 6,
		/** @const {number} */ pasteModeOr : 7,
		/** @const {number} */ pasteModeNOr : 8,
		/** @const {number} */ pasteModeXNOr : 9,
		/** @const {number} */ pasteModeNotY : 10,
		/** @const {number} */ pasteMode1011 : 11,
		/** @const {number} */ pasteModeNotX : 12,
		/** @const {number} */ pasteMode1101 : 13,
		/** @const {number} */ pasteModeNAnd : 14,
		/** @const {number} */ pasteModeOne : 15,
		/** @const {number} */ pasteModeCopy : 3,

		// UI paste modes (AND, COPY, OR, XOR)
		/** @const {Array<number>} */ uiPasteModes : [1, 3, 7, 6],

		// state mappings
		/** @const {Array<number>} */ standardToHistoryStates : [0, 1],
		/** @const {Array<number>} */ standardToSuperStates : [0, 1],
		/** @const {Array<number>} */ historyToStandardStates : [0, 1, 0, 1, 0, 1, 0],
		/** @const {Array<number>} */ historyToSuperStates : [0, 1, 2, 3, 4, 5, 6],
		/** @const {Array<number>} */ superToStandardStates : [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
		/** @const {Array<number>} */ superToHistoryStates : [0, 1, 2, 3, 4, 5, 6, 3, 4, 1, 0, 1, 0, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1],

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
		/** @const {number} */ minTrackSpeed : -8,
		/** @const {number} */ maxTrackSpeed : 8,

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
		/** @const {number} */ customThemeBounded : 27,
		/** @const {number} */ customThemeSelect : 28,
		/** @const {number} */ customThemePaste : 29,
		/** @const {number} */ customThemeAdvance : 30,

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
		/** @const {Array<string>} */ stateNames : ["dead", "alive", "history", "mark1", "markOff", "mark2", "kill"],

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
		/** @const {number} */ versionBuild : 654,

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
		/** @const {number} */ minZoom : 1 / 16,
		/** @const {number} */ maxZoom : 64,
		
		// minimum and maximum negative zoom
		/** @const {number} */ minNegZoom : -16,
		/** @const {number} */ maxNegZoom : -1,

		// minimum and maximum zoom for annotations (so they won't fade at min or max camera zoom)
		/** @const {number} */ minAnnotationNegZoom : -2048,
		/** @const {number} */ maxAnnotationNegZoom : -1,
		/** @const {number} */ minAnnotationZoom : 1 / 2048,
		/** @const {number} */ maxAnnotationZoom : 2048,

		// minimum and maximum generation speed
		/** @const {number} */ minGenSpeed : 1,
		/** @const {number} */ maxGenSpeed : 60,

		// minimum and maximum steps
		/** @const {number} */ minStepSpeed : 1,
		/** @const {number} */ maxStepSpeed : 64,

		// fixed font
		/** @const {string} */ fixedFontFamily : "Courier",

		// variable font
		/** @const {string} */ variableFontFamily : "Arial",

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
		/** @const {number} */ maxViewerWidth : 4096,

		// extra gui height for top and bottom row of controls (used during AutoFit)
		/** @const {number} */ guiExtraHeight : 80,

		// minimum and maximum height of the Viewer
		/** @const {number} */ minViewerHeight : 240,
		/** @const {number} */ maxViewerHeight : 4096,

		// minimum height to display navigation menu in the Viewer
		/** @const {number} */ minMenuHeight : 480,
		/** @const {number} */ preferredMenuHeight : 560,

		// default width for the zoom slider (gets wider if the window is wider than the default)
		/** @const {number} */ zoomSliderDefaultWidth : 132,

		// maximum width for the zoom slider (gets wider if the window is wider than the default)
		/** @const {number} */ zoomSliderMaxWidth : 292,

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

			// check if it is playing and pause requests are not ignored
			if (currentViewer.generationOn && !currentViewer.ignorePauseRequests) {
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
				if (currentViewer.generationOn && !currentViewer.ignorePauseRequests) {
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
		var i = 0;

		// last failure reason from PatternManager
		this.lastFailReason = "";

		// target generation for go to
		this.startFrom = -1;

		// pattern state names
		this.stateNames = [];

		// whether starting playback pauses others
		this.exclusivePlayback = false;

		// whether to ignore pause requests from others
		this.ignorePauseRequests = false;

		// whether to start playback when thumbnail expands
		this.thumbStart = false;

		// whether to start playback in reverse for reversible rules
		this.reverseStart = false;

		// whether drawing snow
		this.drawingSnow = false;

		// whether update function needs to call post function to complete after async load
		this.needsComplete = false;

		// pattern manager
		this.manager = new PatternManager();

		// whether to identify quickly (no Mod calculation)
		/** @type {boolean} */ this.identifyFast = false;

		// whether identify results displayed
		/** @type {boolean} */ this.resultsDisplayed = false;

		// last oscillator message
		/** @type {string} */ this.lastOscillator = "";

		// last results were fast
		/** @type {boolean} */ this.lastWasFast = false;

		// last oscillator heat
		/** @type {string} */ this.lastIdentifyHeat = "";

		// last oscillator type
		/** @type {string} */ this.lastIdentifyType = "";

		// last oscillator direction
		/** @type {string} */ this.lastIdentifyDirection = "";

		// last oscillator period
		/** @type {string} */ this.lastIdentifyPeriod = "";

		// last oscillator simple speed
		/** @type {string} */ this.lastIdentifySpeed = "";

		// last oscillator bounding box
		/** @type {string} */ this.lastIdentifyBox = "";

		// last oscillator generation 
		/** @type {string} */ this.lastIdentifyGen = "";

		// last oscillator population (min, avg, max)
		/** @type {string} */ this.lastIdentifyCells = "";

		// last oscillator slope 
		/** @type {string} */ this.lastIdentifySlope = "";

		// last oscillator volatility
		/** @type {string} */ this.lastIdentifyVolatility = "";

		// last oscillator mod
		/** @type {string} */ this.lastIdentifyMod = "";

		// last oscillator active cells
		/** @type {string} */ this.lastIdentifyActive = "";

		// last oscillator temperature
		/** @type {string} */ this.lastIdentifyTemperature = "";

		// whether computing oscillators
		/** @type {boolean} */ this.identify = false;

		// labels for identify results
		this.identifyBannerLabel = null;
		this.identifyTypeLabel = null;
		this.identifyCellsLabel = null;
		this.identifyBoxLabel = null;
		this.identifyDirectionLabel = null;
		this.identifyPeriodLabel = null;
		this.identifySlopeLabel = null;
		this.identifySpeedLabel = null;
		this.identifyHeatLabel = null;
		this.identifyVolatilityLabel = null;
		this.identifyModLabel = null;
		this.identifyActiveLabel = null;
		this.identifyTemperatureLabel = null;

		// labels for identify result values
		this.identifyActiveLabel = null;
		this.identifyTypeValueLabel = null;
		this.identifyCellsValueLabel = null;
		this.identifyBoxValueLabel = null;
		this.identifyDirectionValueLabel = null;
		this.identifyPeriodValueLabel = null;
		this.identifySlopeValueLabel = null;
		this.identifySpeedValueLabel = null;
		this.identifyHeatValueLabel = null;
		this.identifyModValueLabel = null;
		this.identifyActiveValueLabel = null;
		this.identifyTemperatureValueLabel = null;

		// window zoom for high DPI devices
		/** @type {number} */ this.windowZoom = 1;

		// random pattern width, height and fill percentage
		/** @type {number} */ this.randomWidth = ViewConstants.randomDimension;
		/** @type {number} */ this.randomHeight = ViewConstants.randomDimension;
		/** @type {number} */ this.randomFillPercentage = 50;

		// whether random rule is fixed
		/** @type {boolean} */ this.randomRuleFixed = false;

		// random rule whether to only generate reversible Margolus rules
		/** @type {boolean} */ this.randomReversible = false;

		// random rule whether to only generate fixed population Margolus rules
		/** @type {boolean} */ this.randomSwap = false;

		// random chance for Life-Like rules
		/** @type {number} */ this.randomChanceAll = -1;
		/** @type {number} */ this.randomChanceB = -1;
		/** @type {number} */ this.randomChanceS = -1;
		/** @type {Array<number>} */ this.randomChanceBN = [];
		/** @type {Array<number>} */ this.randomChanceSN = [];

		// whether rule was LtL (before it got converted to HROT)
		/** @type {boolean} */ this.wasLtL = false;

		// PopUp Viewer title bar elements (for resize)
		this.anchorItem = null;
		this.innerDivItem = null;
		this.centerDivItem = null;
		this.hiddenItem = null;
		this.divItem = null;

		// help font size
		/** @type {number} */ this.helpFontSize = 18;

		// help fixed font
		/** @type {string} */ this.helpFixedFont = "18px " + ViewConstants.fixedFontFamily;

		// help variable font
		/** @type {string} */ this.helpVariableFont = "18px " + ViewConstants.variableFontFamily;

		// device pixel ratio
		/** @type {number} */ this.devicePixelRatio = (window.devicePixelRatio ? window.devicePixelRatio : 1);

		// whether multiple steps can bail out early due to performance
		/** @type {boolean} */ this.canBailOut = true;

		// whether displaying theme selection buttons
		/** @type {boolean} */ this.showThemeSelection = false;

		// whether displaying info settings
		/** @type {boolean} */ this.showInfoSettings = false;

		// whether displaying playback settings
		/** @type {boolean} */ this.showPlaybackSettings = false;

		// whether displaying display settings
		/** @type {boolean} */ this.showDisplaySettings = false;

		// whether displaying pattern settings
		/** @type {boolean} */ this.showPatternSettings = false;

		// whether to sync copy with external clipboard
		/** @type {boolean} */ this.copySyncExternal = false;

		// whether notified about sync
		/** @type {boolean} */ this.syncNotified = false;

		// paste buffers
		this.pasteBuffers = [];
		for (i = 0; i < 10; i += 1) {
			this.pasteBuffers[i] = null;
		}

		// whether evolving paste
		/** @type {boolean} */ this.evolvingPaste = false;

		// current paste buffer
		/** @type {number} */ this.currentPasteBuffer = 0;

		// current paste width and height
		/** @type {number} */ this.pasteWidth = 0;
		/** @type {number} */ this.pasteHeight = 0;

		// paste position
		this.pastePosition = ViewConstants.pastePositionNW;

		// whether there is something in the buffer to paste
		/** @type {boolean} */ this.canPaste = false;

		// whether there has been an action since selection made
		/** @type {boolean} */ this.afterSelectAction = false;

		// current paste buffer cells
		this.pasteBuffer = null;

		// whether paste is happening
		/** @type {boolean} */ this.isPasting = false;

		// evolve paste selection box
		this.evolveBox = new BoundingBox(0, 0, 0, 0);

		// selection box
		this.selectionBox = new BoundingBox(0, 0, 0, 0);
	
		// middle coordinate selection box
		this.middleBox = new BoundingBox(0, 0, 0, 0);

		// random number generator
		this.randGen = new Random();

		// initialise random seed
		this.randGen.init(Date.now().toString());

		// random density percentage for fill
		/** @type {number} */ this.randomDensity = 50;

		// selection start X and Y screen location (used to detect click to clear selection)
		/** @type {number} */ this.selectStartX = 0;
		/** @type {number} */ this.selectStartY = 0;

		// whether there is a selection
		/** @type {boolean} */ this.isSelection = false;

		// where a selection is happening
		/** @type {boolean} */ this.drawingSelection = false;

		// paste mode for paste tool (index into paste modes for UI list: OR)
		/** @type {number} */ this.pasteModeForUI = 2;

		// edit list for undo/redo
		this.editList = [];

		// edit number for undo/redo
		/** @type {number} */ this.editNum = 0;

		// number of edits for undo/redo
		/** @type {number} */ this.numEdits = 0;

		// current edit
		this.currentEdit = [];

		// current edit index
		/** @type {number} */ this.currentEditIndex = 0;

		// step samples
		/** @type {Array<number>} */ this.stepSamples = [];
		/** @type {number} */ this.stepIndex = 0;

		// list of transformations
		this.transforms = [];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transIdentity] = [1, 0, 0, 1];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transFlip] = [-1, 0, 0, -1];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transFlipX] = [-1, 0, 0, 1];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transFlipY] = [1, 0, 0, -1];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transSwapXY] = [0, 1, 1, 0];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transSwapXYFlip] = [0, -1, -1, 0];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transRotateCW] = [0, -1, 1, 0];
		/** @const {Array<number>} */ this.transforms[ViewConstants.transRotateCCW] = [0, 1, -1, 0];

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
		/** @type {number} */ this.pasteGen = 0;

		// rle paste end generation for every mode
		/** @type {number} */ this.pasteEnd = -1;

		// rle delta list
		this.pasteDelta = [];

		// rle paste modulus
		/** @type {number} */ this.pasteEvery = 0;

		// rle PASTET EVERY position delta
		/** @type {number} */ this.pasteDeltaX = 0;
		/** @type {number} */ this.pasteDeltaY = 0;

		// whether there is a paste every snippet
		/** @type {boolean} */ this.isPasteEvery = false;

		// maximum paste generation (exlcuding paste every snippets)
		/** @type {number} */ this.maxPasteGen = 0;

		// whether there is evolution to do
		/** @type {boolean} */ this.isEvolution = false;

		// paste snippets bounding box
		/** @type {number} */ this.pasteLeftX = 0;
		/** @type {number} */ this.pasteRightX = 0;
		/** @type {number} */ this.pasteBottomY = 0;
		/** @type {number} */ this.pasteTopY = 0;

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

		// whether picking replace
		/** @type {boolean} */ this.pickReplace = false;

		// whether picking state
		/** @type {boolean} */ this.pickMode = false;

		// whether just picked (for notification)
		/** @type {boolean} */ this.justPicked = false;

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

		// maximum number of age states (can be less for multi-state patterns)
		/** @type {number} */ this.maxAliveStates = 63;

		// number of age states (default and maximum is 63)
		/** @type {number} */ this.aliveStates = 63;

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

		// whether to randomize pattern
		/** @type {boolean} */ this.randomizePattern = false;

		// whether randomize pattern in progress
		/** @type {boolean} */ this.randomizeGuard = false;

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

		// window scroll position
		/** @type {number} */ this.scrollPosition = 0;

		// string containing RLE
		/** @type{string} */ this.tempRLE = "";

		// amount copied and target
		/** @type {number} */ this.tempRLEAmount = 0;
		/** @type {number} */ this.tempRLELength = 0;

		// chunk size in bytes to copy
		/** @type {number} */ this.tempRLEChunkSize = 32768;

		// whether copy complete message displayed
		/** @type {boolean} */ this.copyCompleteDisplayed = false;

		// frames to display before processing copy to allow notification
		/** @type {number} */ this.copyFrameWait = 0;

		// history target generation
		/** @type {number} */ this.computeHistoryTarget = 0;

		// when compute history finishes clear notification
		/** @type {boolean} */ this.computeHistoryClear = true;

		// whether auto-shrink is on
		/** @type {boolean} */ this.autoShrink = false;

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

		// bounded colour
		this.customBoundedColour = [128, 128, 128];

		// select colour
		this.customSelectColour = [0, 255, 0];

		// paste colour
		this.customPasteColour = [255, 0, 0];

		// advance colour
		this.customAdvanceColour = [255, 255, 0];

		// window title element
		this.titleElement = null;

		// window title string
		/** @type{string} */ this.windowTitle = "";

		// flag if performance warning is enabled
		/** @type {boolean} */ this.perfWarning = true;

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

		// whether using custom gridmajor
		/** @type {boolean} */ this.customGridMajor = false;

		// custom theme value
		this.customThemeValue = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];

		// custom grid colour
		/** @type {number} */ this.customGridColour = -1;

		// custom grid major colour
		/** @type {number} */ this.customGridMajorColour = -1;

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
		this.customColours = null;

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

		// flag if stop temporarily disabled
		/** @type {boolean} */ this.stopDisabled = false;

		// generation number to loop from
		/** @type {number} */ this.loopGeneration = -1;

		// flag if loop temporarily disabled
		/** @type {boolean} */ this.loopDisabled = false;

		// flag if waypoints disabled
		/** @type {boolean} */ this.waypointsDisabled = false;

		// whether to disable playback
		/** @type {boolean} */ this.viewOnly = false;

		// whether to hide GUI while pattern playing
		/** @type {boolean} */ this.hideGUI = false;

		// whether to hide grid while pattern playing
		/** @type {boolean} */ this.autoGrid = false;

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

		// original width and height before scaling
		/** @type {number} */ this.origDisplayWidth = 640;
		/** @type {number} */ this.origDisplayHeight = 512;

		// whether popup width has changed
		/** @type {boolean} */ this.popupWidthChanged = false;
		/** @type {number} */ this.lastPopupWidth = 640;

		// whether pause while drawing is on
		/** @type {boolean} */ this.pauseWhileDrawing = true;

		// whether drawing has paused playback
		/** @type {boolean} */ this.playbackDrawPause = false;

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

		// copy sync toggle
		this.copySyncToggle = null;

		// navigation menu toggle
		this.navToggle = null;

		// theme button
		this.themeButton = null;

		// throttle toggle
		this.throttleToggle = null;

		// show lag toggle
		this.showLagToggle = null;

		// theme selections
		this.themeSelections = [];

		// theme labels
		this.themeDefaultLabel = null;
		this.themeClassicLabel = null;
		this.themeProgramLabel = null;
		this.themeDebugLabel = null;

		// theme section label
		this.themeSectionLabel = null;

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

		// relative generation toggle
		this.relativeToggle = null;

		// quality rendering toggle
		this.qualityToggle = null;

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

		// spacer to left of states slider
		this.statesSpacer = null;

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
		this.helpAnnotationsButton = null;

		// help section list
		this.helpSectionList = null;

		// autofit button
		this.autoFitToggle = null;

		// grid toggle
		this.gridToggle = null;

		// library toggle
		this.libraryToggle = null;

		// clipboard list
		this.clipboardList = null;

		// select all button
		this.selectAllButton = null;

		// clear selection button
		this.clearSelectionButton = null;

		// clear outside button
		this.clearOutsideButton = null;

		// clear [R]History or [R]Super button
		this.clearRHistoryButton = null;

		// auto-shrink toggle
		this.autoShrinkToggle = null;

		// reverse direction button
		this.directionButton = null;

		// fit button
		this.fitButton = null;

		// shrink button
		this.shrinkButton = null;

		// esc button
		this.escButton = null;

		// label toggle button
		this.labelButton = null;

		// kill gliders toggle button
		this.killButton = null;

		// previous POI button
		this.prevPOIButton = null;

		// next POI button
		this.nextPOIButton = null;

		// autohide toggle button
		this.autoHideButton = null;

		// autogrid toggle button
		this.autoGridButton = null;

		// alternating gridlines toggle button
		this.altGridButton = null;

		// rainbow mode toggle button
		this.rainbowButton = null;

		// hex cell toggle button
		this.hexCellButton = null;

		// cell borders toggle button
		this.bordersButton = null;

		// graph toggle button
		this.graphButton = null;

		// close button for graph
		this.graphCloseButton = null;

		// close button for identify
		this.identifyCloseButton = null;

		// infobar button
		this.infoBarButton = null;

		// info button
		this.infoButton = null;

		// rule button
		this.ruleButton = null;

		// new button
		this.newButton = null;

		// save button
		this.saveButton = null;

		// load button
		this.loadButton = null;

		// randomize button
		this.randomizeButton = null;

		// identify button
		this.identifyButton = null;

		// fast identify button
		this.fastIdentifyButton = null;

		// save image button
		this.saveImageButton = null;

		// save graph image button
		this.saveGraphButton = null;

		// go to generation button
		this.goToGenButton = null;
		
		// copy rule button
		this.copyRuleButton = null;

		// back button
		this.backButton = null;

		// cancel button
		this.cancelButton = null;

		// pattern button
		this.patternButton = null;

		// display button
		this.displayButton = null;

		// playback button
		this.playBackButton = null;

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

		// timing details button
		this.timingDetailButton = null;

		// generation label
		this.genLabel = null;

		// generation value label
		this.genValueLabel = null;

		// time label
		this.timeLabel = null;

		// elapsed time label
		this.elapsedTimeLabel = null;

		// xy label
		this.xyLabel = null;

		// selection size label
		this.selSizeLabel = null;

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

		// mode list (draw/select/pan buttons)
		this.modeList = null;

		// paste mode list (or/copy/xor/and)
		this.pasteModeList = null;

		// random button
		this.randomButton = null;

		// random 2-state button
		this.random2Button = null;

		// random density slider
		this.randomItem = null;

		// paste position slider
		this.pastePositionItem = null;

		// cut button
		this.cutButton = null;

		// copy button
		this.copyButton = null;

		// paste button
		this.pasteButton = null;

		// flip X button
		this.flipXButton = null;

		// flip Y button
		this.flipYButton = null;

		// rotate CW button
		this.rotateCWButton = null;

		// rotate CCW button
		this.rotateCCWButton = null;

		// nudge left button
		this.nudgeLeftButton = null;

		// nudge right button
		this.nudgeRightButton = null;

		// nudge up button
		this.nudgeUpButton = null;

		// nudge down button
		this.nudgeDownButton = null;

		// invert selection button
		this.invertSelectionButton = null;

		// pick button
		this.pickToggle = null;

		// pause while drawing button
		this.pausePlaybackToggle = null;

		// smart drawing button
		this.smartToggle = null;

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

		// whether selecting
		/** @type {boolean} */ this.selecting = false;

		// whether drawing
		/** @type {boolean} */ this.drawing = false;

		// pen colour for drawing
		/** @type {number} */ this.penColour = -1;
	}

	// create clipboard tooltips
	View.prototype.createClipboardTooltips = function() {
		var i = 0,
			buffer = this.pasteBuffers,
			current = this.currentPasteBuffer,
			tip = "",
			tips = [];

		for (i = 0; i < 10; i += 1) {
			if (i === current) {
				tip = "current ";
			} else {
				tip = "activate ";
			}
			tip += "clipboard";
			if (buffer[i] !== null) {
				tip += " (" + buffer[i].width + " x " + buffer[i].height + ", " + buffer[i].count + " cell";
				if (buffer[i].count !== 1) {
					tip += "s";
				}
				tip += ")";
			} else {
				tip += " (empty)";
			}
			tips[i] = tip + " [Alt " + i + "]";
		}
		this.clipboardList.toolTip = tips;
	};

	// open last saved or original pattern
	View.prototype.loadPattern = function(me) {
		var result = window.confirm("Open last saved pattern?");
		if (result) {
			updateMe(me.element);
		}
	};

	// allocate new chunk for undo/redo buffer
	View.prototype.allocateChunk = function() {
		var chunkSize = 1 << ViewConstants.editChunkPower,
			chunk = this.currentEditIndex >> ViewConstants.editChunkPower;
			
		// check if a new buffer is needed
		if (chunk === this.currentEdit.length) {
			this.currentEdit[chunk] = this.engine.allocator.allocate(Int16, chunkSize, "View.currentEdit" + chunk);
		}

		// return the chunk
		return this.currentEdit[chunk];
	};

	// draw cell and create undo/redo
	View.prototype.setStateWithUndo = function(x, y, colour, deadZero) {
		// get current state
		var state = this.engine.getState(x, y, false),
			i = this.currentEditIndex,
			j = 0,
			chunkPower = ViewConstants.editChunkPower,
			chunk = i >> chunkPower,
			chunkSize = 1 << chunkPower,
			chunkMask = chunkSize - 1,
			currentEdit = this.currentEdit,
			currentChunk = null,
			xOff = (this.engine.width >> 1) - (this.patternWidth >> 1),
			yOff = (this.engine.height >> 1) - (this.patternHeight >> 1),
			states = this.engine.multiNumStates,
			invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)),
			newRecord = 0,
			addedToRun = false,
			runCount = 0;

		// handle generations
		if (state > 0 && invertForGenerations) {
			state = states - state;
		}

		// ensure state is in range
		if (states === -1) {
			if (this.engine.isLifeHistory) {
				states = 7;
			} else {
				states = 2;
			}
		}
		if (colour < 0) {
			colour = 0;
		} else {
			if (colour >= states) {
				colour = states - 1;
			}
		}

		// only add undo/redo records and draw if the new state is different than the current state
		if (colour !== state) {
			// check for undo/redo
			if (!this.noHistory) {
				// check if the edit buffer needs to grow
				if (chunk >= currentEdit.length) {
					currentChunk = this.allocateChunk();
				}

				// get the current chunk and offset within the chunk
				currentChunk = currentEdit[chunk];
				i &= chunkMask;

				// write both the new state and original state into one 16 bit integer
				newRecord = (colour << 8) | state;

				// check if the new cell is adjacent to the previous one and the same states
				if (i > 0) {
					// check if previous record is part of a run
					if (i >= 4) {
						runCount = currentChunk[i - 1];
						if (runCount >= 16384) {
							runCount -= 16384;
							// check if this is just to the right of previous
							if ((currentChunk[i - 3] === newRecord) && (currentChunk[i - 2] === y - yOff) && (currentChunk[i - 4] === (x - xOff) - runCount - 2)) {
								// increment run count
								currentChunk[i - 1] += 1;
								addedToRun = true;
							}
						} else {
							if ((currentChunk[i - 2] === newRecord) && (currentChunk[i - 1] === y - yOff) && (currentChunk[i - 3] === (x - xOff) - 1)) {
								// start a new run
								currentChunk[i] = 16384;
								i += 1;
								this.currentEditIndex += 1;
								if (i === chunkSize) {
									this.allocateChunk();
								}
								addedToRun = true;
							}
						}
					} else {
						// need to check for previous chunk
						j = this.currentEditIndex;
						runCount = currentEdit[(j - 1) >> chunkPower][(j - 1) & chunkMask];
						if (runCount >= 16384) {
							runCount -= 16384;
							// check if this is just to the right of previous
							if ((currentChunk[(j - 3) >> chunkPower][(j - 3) & chunkMask] === newRecord) && (currentChunk[(j - 2) >> chunkPower][(j - 2) & chunkMask] === y - yOff) && (currentChunk[(j - 4) >> chunkPower][(j - 4) & chunkMask] === (x - xOff) - runCount - 2)) {
								// increment run count
								currentChunk[(j - 1) >> chunkPower][(j - 1) & chunkMask] += 1;
								addedToRun = true;
							}
						} else {
							if ((currentEdit[(j - 2) >> chunkPower][(j - 2) & chunkMask] === newRecord) && (currentEdit[(j - 1) >> chunkPower][(j - 1) & chunkMask] === y - yOff) && (currentEdit[(j - 3) >> chunkPower][(j - 3) & chunkMask] === (x - xOff) - 1)) {
								// start a new run
								currentChunk[i] = 16384;
								i += 1;
								this.currentEditIndex += 1;
								if (i === chunkSize) {
									currentChunk = this.allocateChunk();
								}
								addedToRun = true;
							}
						}

					}
				}
				if (!addedToRun) {
					currentChunk[i] = x - xOff;
					i += 1;
					this.currentEditIndex += 1;
					if (i === chunkSize) {
						currentChunk = this.allocateChunk();
						i = 0;
					}
					currentChunk[i] = (colour << 8) | state;
					i += 1;
					this.currentEditIndex += 1;
					if (i === chunkSize) {
						currentChunk = this.allocateChunk();
						i = 0;
					}
					currentChunk[i] = y - yOff;
					i += 1;
					this.currentEditIndex += 1;
					if (i === chunkSize) {
						currentChunk = this.allocateChunk();
						i = 0;
					}
				}
			}
	
			// set the state
			this.diedGeneration = -1;
			return this.engine.setState(x, y, colour, deadZero);
		}
	};

	// paste raw cells for undo/redo
	View.prototype.pasteRaw = function(cells, reverse) {
		var i = 0,
			x = 0,
			y = 0,
			xOff = (this.engine.width >> 1) - (this.patternWidth >> 1),
			yOff = (this.engine.height >> 1) - (this.patternHeight >> 1),
			runCount = 0,
			state = 0,
			wasState6 = 0;

		// check for cells
		if (cells) {
			// determine whether undo or redo
			if (reverse) {
				i = cells.length;
				while (i > 0) {
					// check for run
					runCount = cells[i - 1];
					if (runCount >= 16384) {
						i -= 1;
					}
					i -= 3;
					x = cells[i] + xOff;
					state = cells[i + 1] & 255;
					y = cells[i + 2] + yOff;

					// draw the first cell
					wasState6 |= this.engine.setState(x, y, state, true);
					if (runCount >= 16384) {
						runCount -= 16384;

						// draw the run
						while (runCount >= 0) {
							x += 1;
							wasState6 |= this.engine.setState(x, y, state, true);
							runCount -= 1;
						}
					}
				}
			} else {
				while (i < cells.length) {
					// draw first cell
					x = cells[i] + xOff;
					state = cells[i + 1] >> 8;
					y = cells[i + 2] + yOff;
					wasState6 |= this.engine.setState(x, y, state, true);
					i += 3;

					// check for run
					runCount = cells[i];
					if (runCount >= 16384) {
						i += 1;
						runCount -= 16384;

						// draw the run
						while (runCount >= 0) {
							x += 1;
							wasState6 |= this.engine.setState(x, y, state, true);
							runCount -= 1;
						}
					}
				}
			}
		}

		// check for state 6 changes to [R]History
		if (this.engine.isLifeHistory && wasState6 !== 0) {
			this.engine.populateState6MaskFromColGrid();
		}
	};

	// set undo stack pointer to given generation (used with step back)
	View.prototype.setUndoGen = function(gen) {
		var i = this.editNum - 1,
			record = null,
			selBox = this.selectionBox,
			found = false;

		// search for undo records at or before specified generation
		while (i >= 0 && !found) {
			if (this.editList[i].gen <= gen) {
				// check for multi-step
				if (this.editList[i].action === "advance outside") {
					i -= 1;
				}
				found = true;
			} else {
				i -= 1;
			}
		}

		if (found) {
			this.editNum = i + 1;
			if (this.editNum >= this.numEdits) {
				record = this.editList[this.editNum - 1];
			} else {
				record = this.editList[this.editNum];
			}
			// restore selection if present
			if (record.selection) {
				selBox.leftX = record.selection.leftX;
				selBox.bottomY = record.selection.bottomY;
				selBox.rightX = record.selection.rightX;
				selBox.topY = record.selection.topY;
				this.isSelection = true;
				this.afterSelectAction = false;
			} else {
				this.isSelection = false;
				this.afterSelectAction = false;
			}

			this.updateUndoToolTips();
		}
	};

	// update undo/redo tooltips
	View.prototype.updateUndoToolTips = function() {
		var edit = this.editNum,
			num = this.numEdits,
			list = this.editList,
			gen = 0,
			record = null,
			tooltip = "";

		// update undo tooltip
		if (edit > 1) {
			tooltip = "undo ";
			record = list[edit - 1];
			if (record.editCells === null) {
				gen = record.gen;
				if (edit > 1) {
					gen = list[edit - 2].gen;
				}
				if (this.engine.counter === gen) {
					tooltip += record.action;
				} else {
					if (this.engine.counter - gen > 1) {
						tooltip += "play";
					} else {
						tooltip += "step";
					}
					tooltip += " from " + gen;
				}
			} else {
				if (record.action === "") {
					tooltip += "edit";
				} else {
					tooltip += record.action;
				}
			}
			if (tooltip === "undo ") {
				tooltip = "undo";
			}
			this.undoButton.toolTip = tooltip + " [Ctrl Z]";
		}

		// update redo tooltip
		if (edit < num) {
			tooltip = "redo ";
			record = list[edit];
			if (record.editCells === null) {
				gen = record.gen;
				if (gen === this.engine.counter) {
					tooltip += record.action;
				} else {
					if (gen - this.engine.counter > 1) {
						tooltip += "play";
					} else {
						tooltip += "step";
					}
					tooltip += " to " + gen;
				}
			} else {
				if (record.action === "") {
					tooltip += "edit";
				} else {
					tooltip += record.action;
				}
			}
			if (tooltip === "redo ") {
				tooltip = "redo";
			}
			this.redoButton.toolTip = tooltip + " [Ctrl Y]";
		}
	};

	// compare two selections and return true if they are the same
	View.prototype.compareSelections = function(first) {
		var result = false,
			second = this.isSelection ? this.selectionBox : null;

		// check if they are both blank
		if (first === null && second === null) {
			result = true;
		} else {
			// check if only one is blank
			if ((first === null && second !== null) || (first !== null && second === null)) {
				result = false;
			} else {
				// check if the selections are the same bounding box
				if (first.leftX === second.leftX && first.bottomY === second.bottomY && first.rightX === second.rightX && first.topY === second.topY) {
					result = true;
				} else {
					result = false;
				}
			}
		}
		return result;
	};

	// add edit record discarding duplicates
	View.prototype.addEdit = function(counter, editCells, comment, box) {
		var isDuplicate = false,
			record = null;

		// check for duplicate
		if (this.editNum > 0) {
			record = this.editList[this.editNum - 1];
			if (record.gen === counter && editCells === null && comment === "") {
				if (this.compareSelections(record.selection)) {
					isDuplicate = true;
				}
			}
		}

		// add record if not a duplicate
		if (!isDuplicate) {
			this.editList[this.editNum] = {gen: counter, editCells: editCells, action: comment, selection: box};
			this.editNum += 1;
		}
	};

	// after edit
	View.prototype.afterEdit = function(comment) {
		var counter = this.engine.counter,
			editCells = null,
			box = null,
			selBox = this.selectionBox,
			record = null,
			i = 0,
			j = 0,
			chunkPower = ViewConstants.editChunkPower,
			chunkSize = 1 << chunkPower,
			chunkMask = chunkSize - 1,
			finalChunk = this.currentEditIndex >> chunkPower;

		// do nothing if step back disabled
		if (!this.noHistory) {
			// check if running
			if (this.generationOn) {
				if (this.editNum > 0) {
					record = this.editList[this.editNum - 1];
				}
				if (record) {
					// copy selection box from previous record
					if (record.selection) {
						box = new BoundingBox(record.selection.leftX, record.selection.bottomY, record.selection.rightX, record.selection.topY);
					}
				}
				// add record at generation
				this.addEdit(counter, editCells, "", box);
				box = null;
			}

			// check if there is a selection
			if (this.isSelection) {
				box = new BoundingBox(selBox.leftX, selBox.bottomY, selBox.rightX, selBox.topY);
			}

			// allocate memory for redo and undo cells and populate
			if (this.currentEditIndex > 0) {
				editCells = this.engine.allocator.allocate(Int16, this.currentEditIndex, "View.editCells" + this.editNum);
				i = 0;
				j = 0;
				while (i < finalChunk) {
					editCells.set(this.currentEdit[i].slice(), j);
					i += 1;
					j += chunkSize;
				}
				if (this.currentEditIndex & chunkMask) {
					editCells.set(this.currentEdit[i].slice(0, this.currentEditIndex & chunkMask), j);
				}

				// clear current edit
				this.currentEditIndex = 0;
			}

			// create new edit and undo record
			this.addEdit(counter, editCells, comment, box);

			// this is now the latest edit
			this.numEdits = this.editNum;

			// update tooltips
			this.updateUndoToolTips();
		}
	};

	// undo edit
	View.prototype.undo = function(me) {
		var gen = 0,
			counter = me.engine.counter,
			current = me.editNum,
			record = null,
			selBox = me.selectionBox,
			selection = null,
			steps = 1,
			multiStep = false;

		// do nothing if step back disabled
		if (!me.noHistory) {
			// stop playback
			if (this.generationOn) {
				me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);

				// stopping playback will have added an undo record
				current = me.editNum;
			}

			// check for undo records
			if (current > 0) {
				while (steps > 0) {
					// pop the top record
					record = me.editList[current - 1];
					gen = record.gen;
					selection = record.selection;
	
					// check for multi-step
					if (!multiStep && record.action === "advance outside") {
						multiStep = true;
						steps = 3;
					}
	
					if (record.editCells === null) {
						if (current > 1) {
							gen = me.editList[current - 2].gen;
						}
					}
					if (current > 1) {
						selection = me.editList[current - 2].selection;
					}
		
					// if it is for an earlier generation then go there
					if (gen < counter) {
						if (gen === 0) {
							me.reset(me);
						} else {
							me.runTo(gen);
						}
						counter = me.engine.counter;
					} else {
						// paste cells in reverse order
						me.pasteRaw(record.editCells, true);
					}
		
					// restore selection if present
					if (selection) {
						selBox.leftX = selection.leftX;
						selBox.bottomY = selection.bottomY;
						selBox.rightX = selection.rightX;
						selBox.topY = selection.topY;
						me.isSelection = true;
						me.afterSelectAction = false;
					} else {
						me.isSelection = false;
						me.afterSelectAction = false;
					}
	
					// check for reverse playback
					if (record.action === "reverse playback") {
						me.engine.reversePending = true;
					}

					// decrement stack using saved value since a record may have been added above
					current -= 1;
					me.editNum = current;

					// next step
					steps -= 1;
				}
			} else {
				if (counter > 0) {
					me.reset(me);
				}
			}

			// update tooltips
			this.updateUndoToolTips();

			// check if shrink needed
			this.engine.doShrink();

			// update state 6 grid
			if (this.engine.isLifeHistory) {
				this.engine.populateState6MaskFromColGrid();
			}
		}
	};

	// redo edit
	View.prototype.redo = function(me) {
		var counter = me.engine.counter,
			record = null,
			selBox = me.selectionBox,
			steps = 1,
			multiStep = false;

		// do nothing if step back disabled
		if (!me.noHistory) {
			// check for redo records
			while (steps > 0 && me.editNum < me.numEdits) {
				record = me.editList[me.editNum];

				// check for multi-step
				if (!multiStep && record.action === "advance outside") {
					multiStep = true;
					steps = 3;
				}

				if (record.gen === counter && record.editCells === null && record.action === "") {
					me.editNum += 1;
				}
				// if it is for a later generation then go there
				if (record.gen > counter) {
					me.runForwardTo(record.gen);
					counter = me.engine.counter;
				} else {
					// paste cells in forward order
					me.pasteRaw(record.editCells, false);
				}

				// restore selection if present
				if (record.selection) {
					selBox.leftX = record.selection.leftX;
					selBox.bottomY = record.selection.bottomY;
					selBox.rightX = record.selection.rightX;
					selBox.topY = record.selection.topY;
					me.isSelection = true;
					me.afterSelectAction = false;
				} else {
					me.isSelection = false;
					me.afterSelectAction = false;
				}

				// check for reverse playback
				if (record.action === "reverse playback") {
					me.engine.reversePending = true;
				}

				// next record
				me.editNum += 1;
				steps -= 1;
			}

			// update tooltips
			this.updateUndoToolTips();

			// check if shrink needed
			this.engine.doShrink();

			// update state 6 grid
			if (this.engine.isLifeHistory) {
				this.engine.populateState6MaskFromColGrid();
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
			pattern = new Pattern("rleToCellList", this.manager),
			patternRow = null,
			invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper));

		// check the RLE is valid
		rle += " ";
		if (this.manager.decodeRLEString(pattern, rle, false, this.engine.allocator) !== -1) {
			if (this.manager.decodeRLEString(pattern, rle, true, this.engine.allocator) !== -1) {
				// convert to cell list
				for (j = 0; j < pattern.height; j += 1) {
					patternRow = pattern.multiStateMap[j];
					for (i = 0; i < pattern.width; i += 1) {
						state = patternRow[i];
						// invert state if Generations
						if (invertForGenerations && state > 0) {
							state = states - state;
						}
						// create (x, y, state) entry in cells array
						cells[cells.length] = x + i * axx + j * axy;
						cells[cells.length] = y + i * ayx + j * ayy;
						cells[cells.length] = state;
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
		// @ts-ignore
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
		// @ts-ignore
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
						this.rleList[this.rleList.length] = {name: name, cells: cells};
					} else {
						scriptErrors[scriptErrors.length] = [Keywords.rleWord + " " + name, "invalid RLE"];
					}
				}
			}
		}
	};

	// add rle to paste list
	View.prototype.addRLE = function(gen, end, deltaList, every, mode, deltaX, deltaY, rle, x, y, transform) {
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
		if (found && cells.length > 0) {
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
			this.pasteList[this.pasteList.length] = {genList: genList, end: end, every: every, mode: mode, cells: cells, map: stateMap, leftX: leftX, bottomY: bottomY, width: rightX - leftX + 1, height: topY - bottomY + 1, evolution: evolution, deltaX: deltaX, deltaY: deltaY};
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
			cells = [];

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
				while (i < cells.length) {
					// cells list only contains non-zero cells
					this.engine.setState(xOff + cells[i] - item.leftX, yOff + cells[i + 1] - item.bottomY, cells[i + 2], true);
					i += 3;
				}

				// now run the required number of generations
				while (gens > 0) {
					// compute next generation with no stats, history and graph disabled
					this.engine.nextGeneration(false, true, true, this.identify);
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

	// check if the given patten will paste this generation
	View.prototype.pasteThisGen = function(paste) {
		var needsPaste = false,
			i = 0,
			counter = this.engine.counter,
			finished = false;

		// for Margolus rules use Margolus generation
		if (this.engine.isMargolus || this.engine.isPCA) {
			counter = this.engine.counterMargolus;
		}

		// do not paste repeating patterns for reversible Margolus rules until maximum Margolus generation reached
		if (paste.every !== 0 && (this.engine.isMargolus || this.engine.isPCA) && this.engine.margolusReverseLookup1 !== null && counter < this.engine.maxMargolusGen) {
			needsPaste = false;
			finished = true;
		}

		if (!finished) {
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
		}
	
		return needsPaste;
	};

	// check if any pattern will paste this generation
	View.prototype.anyPasteThisGen = function() {
		var needsPaste = false,
			i = 0,
			length = this.pasteList.length;

		while (i < length && !needsPaste) {
			needsPaste = this.pasteThisGen(this.pasteList[i]);
			i += 1;
		}

		return needsPaste;
	};

	// paste rle list to grid
	View.prototype.pasteRLEList = function() {
		var j = 0,
			y = 0,
			x = 0,
			xOff = 0,
			yOff = 0,
			paste = null,
			counter = this.engine.counter,
			mode = ViewConstants.pasteModeOr,
			source = 0,
			dest = 0,
			sourceFlag = 0,
			destFlag = 0,
			result = 0,
			mult = 0,
			gridWidth = this.engine.width,
			stateMap = null,
			stateRow = null,
			numStates = this.engine.multiNumStates - 1;

		// get number of states
		if (numStates == -2) {
			if (this.engine.isLifeHistory) {
				numStates = 6;
			} else {
				numStates = 1;
			}
		}

		// check each pattern to see which need to be drawn this generation
		for (j = 0; j < this.pasteList.length; j += 1) {
			paste = this.pasteList[j];
			if (this.pasteThisGen(paste)) {
				mode = paste.mode;
				xOff = (gridWidth >> 1) - (this.patternWidth >> 1);
				yOff = (gridWidth >> 1) - (this.patternHeight >> 1);
				stateMap = paste.map;

				// check for deltas with PASTET EVERY
				if (paste.every !== 0 && (paste.deltaX !== 0 || paste.deltaY !== 0)) {
					mult = (counter - paste.genList[0]) / paste.every;
					xOff += paste.deltaX * mult;
					yOff += paste.deltaY * mult;
				}

				// paste with the given mode
				xOff += paste.leftX;
				yOff += paste.bottomY;
				for (y = 0; y < stateMap.length; y += 1) {
					stateRow = stateMap[y];
					if (this.engine.isPCA || this.engine.isRuleTree) {
						for (x = 0; x < stateRow.length; x += 1) {
							source = stateRow[x];
							dest = this.engine.getState(xOff + x, yOff + y, false);
							switch (mode) {
								case ViewConstants.pasteModeZero:
									result = 0;
									break;
								case ViewConstants.pasteModeAnd:
									result = source & dest;
									break;
								case ViewConstants.pasteMode0010:
									result = source & (numStates - dest);
									break;
								case ViewConstants.pasteModeX:
									result = source;
									break;
								case ViewConstants.pasteMode0100:
									result = (numStates - source) & dest;
									break;
								case ViewConstants.pasteModeY:
									result = dest;
									break;
								case ViewConstants.pasteModeXor:
									result = source ^ dest;
									break;
								case ViewConstants.pasteModeOr:
									result = source | dest;
									break;
								case ViewConstants.pasteModeNOr:
									result = numStates - (source | dest);
									break;
								case ViewConstants.pasteModeXNOr:
									result = numStates - (source ^ dest);
									break;
								case ViewConstants.pasteModeNotY:
									result = numStates - dest;
									break;
								case ViewConstants.pasteMode1011:
									result = source | (numStates - dest);
									break;
								case ViewConstants.pasteModeNotX:
									result = numStates - source;
									break;
								case ViewConstants.pasteMode1101:
									result = (numStates - source) | dest;
									break;
								case ViewConstants.pasteModeNAnd:
									result = numStates - (source & dest);
									break;
								case ViewConstants.pasteModeOne:
									result = 1;
									break;
							}
							if (result < 0) {
								result = 0;
							} else {
								if (result >= numStates) {
									result = numStates - 1;
								}
							}
							this.engine.setState(xOff + x, yOff + y, result, true);
						}
					} else {
						if (this.engine.isLifeHistory || this.engine.isSuper) {
							for (x = 0; x < stateRow.length; x += 1) {
								source = stateRow[x];
								if (mode === ViewConstants.pasteModeCopy) {
									result = source;
								} else {
									sourceFlag = source & 1;
									dest = this.engine.getState(xOff + x, yOff + y, false);
									destFlag = dest & 1;
									result = ((mode & (8 >> ((sourceFlag + sourceFlag) | destFlag))) === 0 ? 0 : 1);
								}
								this.engine.setState(xOff + x, yOff + y, result, true);
							}
						} else {
							for (x = 0; x < stateRow.length; x += 1) {
								source = stateRow[x];
								sourceFlag = (source === 0 ? 0 : 1);
								dest = this.engine.getState(xOff + x, yOff + y, false);
								destFlag = (dest === 0 ? 0 : 1);
								result = ((mode & (8 >> ((sourceFlag + sourceFlag) | destFlag))) === 0 ? 0 : 1);
								this.engine.setState(xOff + x, yOff + y, result, true);
							}
						}
					}
				}
			}
		}

		// if paste every is defined then always flag there are alive cells
		// since cells will appear in the future
		if (this.isPasteEvery || counter <= this.maxPasteGen) {
			this.engine.anythingAlive = 1;
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
				this.pasteRaw(this.editList[i].editCells, false);
			}
		}

		// check if shrink needed
		this.engine.doShrink();
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
		var dataURL = me.mainCanvas.toDataURL("image/png"),
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
			nextColourGrid = this.engine.nextColourGrid,
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

		// Margolus patterns must be on odd cell bounderies
		if (pattern.isMargolus) {
			if ((panX & 1) === 0) {
				panX -= 1;
			}
			if ((panY & 1) === 0) {
				panY -= 1;
			}
		}

		// update the life grid
		for (y = 0; y < copyHeight; y += 1) {
			patternRow = pattern.lifeMap[y];
			gridRow = grid[(y + panY) & hm];

			// check for multi-state view
			if (this.multiStateView || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper) {
				multiStateRow = pattern.multiStateMap[y];
				colourGridRow = colourGrid[(y + panY) & hm];

				// copy colour cells
				for (x = 0; x < copyWidth; x += 1) {
					state = multiStateRow[x];
					if (state > 0) {
						state += this.historyStates;
					}
					colourGridRow[(x + panX) & wm] = state;
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

		// copy colour grid to next colour grid for PCA, RuleTree and Super rules
		if (this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper) {
			nextColourGrid.whole.set(colourGrid.whole);
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

	// paste position range
	View.prototype.viewPastePositionRange = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.pastePosition = newValue[0];
		}

		return [me.pastePosition, ViewConstants.pastePositionNames[(me.pastePosition + 0.5) | 0]];
	};

	// cycle paste location
	View.prototype.cyclePasteLocation = function(me) {
		if (!me.viewOnly) {
			me.pastePosition = ((me.pastePosition + 0.5) | 0) + 1;
			if (me.pastePosition >= ViewConstants.numPastePositions) {
				me.pastePosition = 0;
			}
			me.pastePositionItem.current = me.viewPastePositionRange([me.pastePosition, me.pastePosition], true, me);
		}
	};

	// random density range
	View.prototype.viewRandomRange = function(newValue, change, me) {
		// check if changing
		if (change) {
			me.randomDensity = newValue[0];
			if (me.randomDensity < ViewConstants.minRandomFill) {
				me.randomDensity = ViewConstants.minRandomFill;
			}
			if (me.randomDensity > ViewConstants.maxRandomFill) {
				me.randomDensity = ViewConstants.maxRandomFill;
			}
		}

		return [me.randomDensity, me.randomDensity];
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
	View.prototype.fitZoomDisplay = function(immediate, smooth, fitType) {
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
			weight = this.autoFitWeight,
			
			// offset for selection
			swap = 0,
			middleBox = this.middleBox,
			selBox = this.selectionBox,
			xOff = (this.engine.width >> 1) - (this.patternWidth >> 1) + (this.xOffset << 1),
			yOff = (this.engine.height >> 1) - (this.patternHeight >> 1) + (this.yOffset << 1);

		// check for selection
		if (fitType === ViewConstants.fitZoomSelection) {
			middleBox.leftX = selBox.leftX + xOff;
			middleBox.rightX = selBox.rightX + xOff;
			if (middleBox.leftX > middleBox.rightX) {
				swap = middleBox.rightX;
				middleBox.rightX = middleBox.leftX;
				middleBox.leftX = swap;
			}
			middleBox.bottomY = selBox.bottomY + yOff;
			middleBox.topY = selBox.topY + yOff;
			if (middleBox.bottomY > middleBox.topY) {
				swap = middleBox.topY;
				middleBox.topY = middleBox.bottomY;
				middleBox.bottomY = swap;
			}
		}

		// check for thumbnail
		if (this.thumbnail) {
			fitZoom = this.engine.fitZoomDisplay(fitType, middleBox, this.floatCounter, this.displayWidth * this.thumbnailDivisor, this.displayHeight * this.thumbnailDivisor, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor, this.patternWidth, this.patternHeight, this.viewOnly && this.multiStateView, this.historyFit, this.trackDefined, this.trackBoxN, this.trackBoxE, this.trackBoxS, this.trackBoxW, this.genSpeed, this.state1Fit, this.autoFit);
			fitZoom[0] /= this.thumbnailDivisor;
		} else {
			var heightAdjust = ViewConstants.guiExtraHeight;
			if (this.noGUI) {
				heightAdjust = 0;
			}
			fitZoom = this.engine.fitZoomDisplay(fitType, middleBox, this.floatCounter, this.displayWidth, this.displayHeight - heightAdjust, ViewConstants.minZoom, ViewConstants.maxZoom, ViewConstants.zoomScaleFactor, this.patternWidth, this.patternHeight, this.viewOnly && this.multiStateView, this.historyFit, this.trackDefined, this.trackBoxN, this.trackBoxE, this.trackBoxS, this.trackBoxW, this.genSpeed, this.state1Fit, this.autoFit);
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
		if ((this.viewOnly || !this.engine.isLifeHistory) && this.manager.extendedFormat && this.engine.multiNumStates !== -1) {
			// center multi-state pattern on display
			this.multiStateView = true;
			this.viewOnly = true;
		}
	};

	// shorten a number to M or K
	View.prototype.shortenNumber = function(value) {
		var pos = value,
			result = "";

		// get absolute valuE
		if (value < 0) { 
			value = -value;
		}

		// get default result
		result = value + String();

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
					result = (Math.floor(Number(value / 100000)) / 10).toFixed(1) + "M";
				} else {
					// check for millions
					if (value >= 1000000) {
						result = (Math.floor(Number(value / 10000)) / 100).toFixed(2) + "M";
					} else {
						// check for one hundred thousand
						if (value >= 100000) {
							result = ((value / 1000) | 0) + "K";
						}
					}
				}
			}
		}

		// adjust if negative
		if (pos < 0) {
			result = "-" + result;
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

	// check if grid needs to grow
	View.prototype.checkGridSize = function(me, box) {
		var borderSize = ViewConstants.maxStepSpeed; 

		// compute border based on algorithm
		if (me.engine.isHROT) {
			borderSize = me.engine.HROT.xrange * 4 + 1;
			if (me.engine.boundedGridType !== -1) {
				borderSize += me.engine.HROT.xrange * 2;
			}
			if (me.engine.HROT.type === this.manager.vonNeumannHROT) {
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

		// check if the bounding box is now bigger than the required grid size
		while (me.engine.checkForGrowth(box, borderSize)) {
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

			// update the box position
			box.leftX += me.engine.width >> 2;
			box.rightX += me.engine.width >> 2;
			box.bottomY += me.engine.height >> 2;
			box.topY += me.engine.height >> 2;
		}
	};

	// check if the selection needs the grid to grow
	View.prototype.checkSelectionSize = function(me) {
		var clipped = false;

		// convert selection box to middle coordinates
		var selBox = me.selectionBox,
			midBox = me.middleBox,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		midBox.leftX = selBox.leftX + xOff;
		midBox.bottomY = selBox.bottomY + yOff;
		midBox.rightX = selBox.rightX + xOff;
		midBox.topY = selBox.topY + yOff;

		me.checkGridSize(me, midBox);

		// clip the selection to the grid
		xOff = (me.engine.width >> 1) - (me.patternWidth >> 1);
		yOff = (me.engine.height >> 1) - (me.patternHeight >> 1);
		if (selBox.leftX + xOff < 0) {
			selBox.leftX = -xOff;
			clipped = true;
		}
		if (selBox.leftX + xOff >= me.engine.width) {
			selBox.leftX = me.engine.width - 1 - xOff;
			clipped = true;
		}
		if (selBox.rightX + xOff < 0) {
			selBox.rightX = -xOff;
			clipped = true;
		}
		if (selBox.rightX + xOff >= me.engine.width) {
			selBox.rightX = me.engine.width - 1 - xOff;
			clipped = true;
		}
		if (selBox.bottomY + yOff < 0) {
			selBox.bottomY = -yOff;
			clipped = true;
		}
		if (selBox.bottomY + yOff >= me.engine.height) {
			selBox.bottomY = me.engine.height - 1 - yOff;
			clipped = true;
		}
		if (selBox.topY + yOff < 0) {
			selBox.topY = -yOff;
			clipped = true;
		}
		if (selBox.topY + yOff >= me.engine.height) {
			selBox.topY = me.engine.height - 1 - yOff;
			clipped = true;
		}

		// return whether the selection was clipped
		return clipped;
	};

	// update progress bar for start from
	View.prototype.updateProgressBarStartFrom = function(me) {
		// update the progress bar
		me.progressBar.current = 100 * (me.engine.counter / me.startFrom);

		// show the progress bar
		me.progressBar.deleted = false;

		// clear the bg alpha to show the progress bar
		me.genToggle.bgAlpha = 0;
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
			yZoom = this.engine.zoom * (this.engine.isTriangular ? ViewConstants.sqrt3 : 1),

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
			yZoom = this.engine.zoom * (this.engine.isTriangular ? ViewConstants.sqrt3 : 1),

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
			height = this.engine.height,
			// whether [R]History state6 changed
			result = 0;

		// set the first point
		result |= this.setStateWithUndo(startX, startY, colour, true);

		// check for grid growth
		while (width !== this.engine.width) {
			// double width and height
			width <<= 1;
			height <<= 1;

			// adjust drawing cell position
			startX += width >> 2;
			startY += width >> 2;
			endX += width >> 2;
			endY += width >> 2;

			// update the default x and y
			this.defaultX += width >> 2;
			this.defaultY += height >> 2;
			this.savedX += width >> 2;
			this.savedY += height >> 2;

			// check for hex mode
			if (this.engine.isHex) {
				this.defaultX -= height >> 3;
				this.savedX -= height >> 3;
			}

			// update pan position
			this.panX += width >> 2;
			this.panY += height >> 2;
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
				// double width and height
				width <<= 1;
				height <<= 1;

				// adjust drawing cell position
				startX += width >> 2;
				startY += width >> 2;
				endX += width >> 2;
				endY += width >> 2;

				// update the default x and y
				this.defaultX += width >> 2;
				this.defaultY += height >> 2;
				this.savedX += width >> 2;
				this.savedY += height >> 2;

				// check for hex mode
				if (this.engine.isHex) {
					this.defaultX -= height >> 3;
					this.savedX -= height >> 3;
				}

				// update pan position
				this.panX += width >> 2;
				this.panY += height >> 2;
			}
		}

		// return whether [R]History state6 changed
		return result;
	};

	// set the identify results label positions
	View.prototype.setResultsPosition = function() {
		var y = 170,
			h = this.identifyTypeLabel.relHeight,
			x = this.identifyTypeLabel.relX,
			xv = this.identifyTypeValueLabel.relX;

		// banner
		this.identifyBannerLabel.setPosition(Menu.north, 0, y - 48);

		// close button at same height as banner
		this.identifyCloseButton.setY(y - 48);

		// type
		this.identifyTypeLabel.setPosition(Menu.north, x, y);
		this.identifyTypeValueLabel.setPosition(Menu.north, xv, y);
		y += h;

		// cells
		this.identifyCellsLabel.setPosition(Menu.north, x, y);
		this.identifyCellsValueLabel.setPosition(Menu.north, xv, y);
		y += h;

		// active cells
		if (this.lastIdentifyType === "Oscillator" && !this.lastWasFast) {
			this.identifyActiveLabel.setPosition(Menu.north, x, y);
			this.identifyActiveValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}

		// bounding box
		this.identifyBoxLabel.setPosition(Menu.north, x, y);
		this.identifyBoxValueLabel.setPosition(Menu.north, xv, y);
		y += h;

		if (this.lastIdentifyType === "Spaceship" && !(this.engine.isHex || this.engine.isTriangular)) {
			// direction
			this.identifyDirectionLabel.setPosition(Menu.north, x, y);
			this.identifyDirectionValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}

		if (this.lastIdentifyType !== "Still Life") {
			// period
			this.identifyPeriodLabel.setPosition(Menu.north, x, y);
			this.identifyPeriodValueLabel.setPosition(Menu.north, xv, y);
			y += h;

			// mod
			if (!this.lastWasFast && !(this.engine.isHex || this.engine.isTriangular)) {
				this.identifyModLabel.setPosition(Menu.north, x, y);
				this.identifyModValueLabel.setPosition(Menu.north, xv, y);
				y += h;
			}
		}

		if (this.lastIdentifyType === "Spaceship") {
			// slope
			if (!(this.engine.isHex || this.engine.isTriangular)) {
				this.identifySlopeLabel.setPosition(Menu.north, x, y);
				this.identifySlopeValueLabel.setPosition(Menu.north, xv, y);
				y += h;
			}

			// speed
			this.identifySpeedLabel.setPosition(Menu.north, x, y);
			this.identifySpeedValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}

		if (this.lastIdentifyType !== "Still Life") {
			// heat
			this.identifyHeatLabel.setPosition(Menu.north, x, y);
			this.identifyHeatValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}

		if (this.lastIdentifyType === "Oscillator" && !this.lastWasFast) {
			// temperature
			this.identifyTemperatureLabel.setPosition(Menu.north, x, y);
			this.identifyTemperatureValueLabel.setPosition(Menu.north, xv, y);
			y += h;

			// volatility
			this.identifyVolatilityLabel.setPosition(Menu.north, x, y);
			this.identifyVolatilityValueLabel.setPosition(Menu.north, xv, y);
			y += h;
		}
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

	// get cell distance from the center of the viewpoint
	View.prototype.getDistFromCenter = function(x, y) {
		// position relative to display width and height
		var displayX = 0,
		    displayY = 0,

		    // engine camera x and y
		    engineY = this.panY - this.engine.yOff,
		    engineX = this.panX - this.engine.xOff - (this.engine.isHex ? this.engine.yOff / 2 : 0),

		    // x and y zoom
		    xZoom = this.engine.zoom,
		    yZoom = this.engine.zoom * (this.engine.isTriangular ? ViewConstants.sqrt3 : 1),

		    // cell position
		    yPos = 0, xPos = 0,
		    yFrac = 0, xFrac = 0,

		    // rotation
		    theta = 0, radius = 0;

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

		return Math.sqrt((xPos - x) * (xPos - x) + (yPos - y) * (yPos - y));
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
		    yZoom = this.engine.zoom * (this.engine.isTriangular ? ViewConstants.sqrt3 : 1),

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
		    theta = 0, radius = 0,

		    // screen offset
		    screenX = -((this.engine.width / 2 - this.engine.xOff - this.engine.originX) | 0),
		    screenY = -((this.engine.height / 2 - this.engine.yOff - this.engine.originY) | 0);

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
			this.xyLabel.preText = xDisplay + "," + yDisplay + "=" + stateDisplay + " (" + this.getStateName(stateDisplay) + ")";
			this.xyLabel.deleted = false;

			// add screen offset at cursor if InfoBar enabled
			if (this.infoBarEnabled) {
				screenX += xPos - this.patternWidth / 2;
				screenY += yPos - this.patternHeight / 2;
				//this.xyLabel.preText += " (" + String(screenX) + "," + String(screenY) + ")";
			}
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

		// draw selection size
		if ((this.isSelection || this.drawingSelection) && (!this.displayHelp || this.displayErrors)) {
			this.selSizeLabel.enabled = true;
			if (this.selectionBox.rightX > this.selectionBox.leftX) {
				xPos = this.selectionBox.rightX - this.selectionBox.leftX + 1;
			} else {
				xPos = this.selectionBox.leftX - this.selectionBox.rightX + 1;
			}
			if (this.selectionBox.topY > this.selectionBox.bottomY) {
				yPos = this.selectionBox.topY - this.selectionBox.bottomY + 1;
			} else {
				yPos = this.selectionBox.bottomY - this.selectionBox.topY + 1;
			}
			this.selSizeLabel.preText = xPos + " x " + yPos; 
		} else {
			this.selSizeLabel.enabled = false;
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
					this.scrollHelpUp(this, (mouseZoom / 125) * 3);
				} else {
					this.scrollHelpDown(this, (-mouseZoom / 125) * 3);
				}
			} else {
				if (this.displayErrors > 0) {
					// scroll the error list
					if (mouseZoom > 0) {
						this.scrollErrorsUp(this, (mouseZoom / 125) * 3);
					} else {
						this.scrollErrorsDown(this, (-mouseZoom / 125) * 3);
					}
				} else {
					// update the zoom if controls not locked
					if (!this.controlsLocked) {
						zoomValue = this.zoomItem.current[0];
						mouseZoom = (mouseZoom / 125) * 0.05;
						this.adjustZoomPosition(zoomValue, mouseZoom);
					}
				}
			}
		}
	};

	// update generation counter label
	View.prototype.updateGenerationLabel = function(me) {
		var counter = me.engine.counter,
			separator = " ";

		// use Margolus counter for Margolus rules
		if (me.engine.isMargolus || me.engine.isPCA) {
			counter = me.engine.counterMargolus;
		}

		// check for relative display
		if (me.genRelative) {
			if (counter < 0) {
				separator = "";
			}
			me.genToggle.lower[0] = "+" + separator + me.shortenNumber(counter);
			me.genToggle.toolTip = ["toggle generation statistics [G]\ngeneration +" + counter];
		} else {
			if (counter + me.genOffset < 0) {
				separator = "";
			}
			me.genToggle.lower[0] = "T" + separator + me.shortenNumber(counter + me.genOffset);
			me.genToggle.toolTip = ["toggle generation statistics [G]\ngeneration " + (counter + me.genOffset)];
		}

		// check for Margolus
		if (me.engine.isMargolus || me.engine.isPCA) {
			me.genValueLabel.preText = me.engine.counter;
			me.genValueLabel.toolTip = "absolute generation " + me.engine.counter;
		} else {
			if (!me.genRelative) {
				counter += me.genOffset;
				if (counter >= 1000000000) {
					me.genValueLabel.preText = "1B+";
				} else {
					me.genValueLabel.preText = counter;
				}
				me.genValueLabel.toolTip = "absolute generation " + counter;
			} else {
				if (counter >= 1000000000) {
					me.genValueLabel.preText = "1B+";
				} else {
					me.genValueLabel.preText = counter;
				}
				me.genValueLabel.preText = counter;
				me.genValueLabel.toolTip = "generation " + counter;
			}
		}
		me.genLabel.toolTip = me.genValueLabel.toolTip;
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

			// save died generation
			saveGeneration = 0,

			// saved bounding box
			zoomBox = me.engine.zoomBox,
			saveBox = new BoundingBox(zoomBox.leftX, zoomBox.bottomY, zoomBox.rightX, zoomBox.topY);

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
					me.floatCounter += (me.gensPerStep - 1);
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
			// check if the waypoints are controlling the camera
			if (me.waypointManager.hasCamera) {
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
					me.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
	
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
			}

			// update based on elapsed time
			waypointsEnded = me.waypointManager.update(me, me.elapsedTime + timeSinceLastUpdate, me.engine.counter);

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
				if (me.waypointManager.hasCamera) {
					// check whether paused
					if (me.generationOn) {
						// lock controls if playing
						me.controlsLocked = true;
					}

					// set the camera position
					me.engine.yOff = me.engine.height / 2 - currentWaypoint.y;
					me.engine.xOff = me.engine.width / 2 - currentWaypoint.x;
					if (me.engine.isHex) {
						me.engine.xOff -= me.engine.yOff / 2;
					}

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
						// @ts-ignore
						me.menuManager.notification.notify(ScriptParser.substituteVariables(this, currentWaypoint.textMessage), 15, 21600, 15, false);
					}
	
					// save message
					me.lastWaypointMessage = currentWaypoint.textMessage;
				}
	
				// check if a new theme is available
				if (currentWaypoint.theme !== me.lastWaypointTheme) {
					// fade to new theme
					me.setNewTheme(currentWaypoint.theme, me.engine.colourChangeSteps, me);

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
					if ((me.engine.counter === me.stopGeneration - 1 && !me.stopDisabled) || ((deltaTime > ViewConstants.updateThreshold) && !manualStepping)) {
						// if at stop generation then actually bailout
						if (me.engine.counter === me.stopGeneration - 1 && !me.stopDisabled) {
							bailout = true;
						} else {
							// if lagging then bailout if enabled
							bailout = me.canBailOut;
						}
					}

					// check for reverse playback switch
					if (me.engine.reversePending) {
						me.afterEdit("reverse playback");
					}

					// check if stats are on and this is the last generation in the step
					saveBox.set(zoomBox);
					if (me.statsOn && ((me.engine.counter === (me.floatCounter | 0) - 1) || bailout)) {
						// compute next generation with stats
						me.engine.nextGeneration(true, me.noHistory, me.graphDisabled, me.identify);
					} else {
						// just compute next generation
						me.engine.nextGeneration(false, me.noHistory, me.graphDisabled, me.identify);
					}

					// next step
					stepsTaken += 1;

					// check theme has history or this is the last generation in the step
					if (me.engine.themeHistory || me.anyPasteThisGen() || ((me.engine.counter === (me.floatCounter | 0)) || bailout)) {
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

					// if nothing alive now then restore last bounding box
					if (me.engine.anythingAlive === 0) {
						zoomBox.set(saveBox);
					}

					// save elasped time for this generation
					me.saveElapsedTime(timeSinceLastUpdate, stepsToTake);

					// check for loop
					if ((me.loopGeneration !== -1) && (me.engine.counter >= me.loopGeneration) && !me.loopDisabled) {
						// reset
						me.elapsedTime = 0;
						me.reset(me);

						// check if autostart defined but disabled
						if (me.autoStart && me.autoStartDisabled) {
							me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
							me.menuManager.notification.notify("LOOP reached - Play to continue ", 15, 180, 15, true);
						}

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
						if (me.engine.isSuper) {
							me.engine.anythingAlive = 1;
						} else {
							if (me.engine.isPCA || me.engine.isRuleTree) {
								me.engine.clearGrids(false);
							} else {
								me.engine.clearGrids(true);
							}
						}

						// notify simulation stopped unless loop defined and enabled
						if (me.genNotifications && !(me.loopGeneration !== -1 && !me.loopDisabled) && !me.emptyStart) {
							me.menuManager.notification.notify("Life ended at generation " + me.diedGeneration, 15, 600, 15, true);
						}

						// if the pattern dies again then notify (this would be caused by drawing during playback)
						me.emptyStart = false;
					}
				}

				// remove steps not taken from target counter
				me.floatCounter -= (stepsToTake - stepsTaken);
				me.originCounter -= (stepsToTake - stepsTaken);
				if (me.floatCounter < 0) {
					me.floatCounter = 0;
				}
				if (me.originCounter < 0) {
					me.originCounter = 0;
				}

				// if not enough steps taken then display actual number
				if ((stepsTaken < stepsToTake) && ((me.engine.counter !== me.stopGeneration) || me.stopDisabled) && me.perfWarning) {
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
			if (me.engine.counter === me.stopGeneration && !me.stopDisabled) {
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

		// check for single step
		if (me.nextStep && !me.generationOn) {
			me.afterEdit("");
		}

		// lock or unlock the controls
		me.angleItem.locked = (me.controlsLocked && me.waypointsDefined) || me.engine.isHex || me.engine.isTriangular;
		me.autoFitToggle.locked = me.controlsLocked && me.waypointsDefined;
		me.fitButton.locked = me.controlsLocked || (me.autoFit && me.generationOn);
		me.generationRange.locked = me.controlsLocked && me.waypointsDefined;
		me.stepRange.locked = me.controlsLocked && me.waypointsDefined;
		me.themeButton.locked = me.controlsLocked && me.waypointsDefined;
		me.zoomItem.locked = me.controlsLocked;
		me.layersItem.locked = (me.controlsLocked && me.waypointsDefined) || me.engine.isHex || me.engine.isTriangular;
		me.depthItem.locked = (me.controlsLocked && me.waypointsDefined) || me.engine.isHex || me.engine.isTriangular;

		// check if the mouse wheel scrolled
		if (me.wheelDelta) {
			// process mouse wheel
			me.processMouseWheel(me.wheelDelta);

			// zero wheel delta
			me.wheelDelta = 0;
		}

		// render the world
		me.renderWorld(me, tooSlow, deltaTime, manualStepping);

		// clear next step flags
		me.nextStep = false;
		me.singleStep = false;

		// detemine whether to update based on generations on or autofit or POI change not finished
		if (me.generationOn || (me.autoFit && (me.autoFitDelta > me.autoFitThreshold)) || me.stepsPOI !== -1) {
			updateNeeded = true;
		}

		// set the auto update mode
		me.menuManager.setAutoUpdate(updateNeeded);
	};

	// render the world
	View.prototype.renderWorld = function(me, tooSlow, deltaTime, manualStepping) {
		// check for autofit
		if (me.autoFit && (me.generationOn || me.waypointsDefined)) {
			me.fitZoomDisplay(false, false, ViewConstants.fitZoomPattern);
		}

		// render grid
		me.engine.renderGrid(me.drawingSnow, me.starsOn);

		// draw stars if switched on
		if (me.starsOn) {
			me.drawStars();
		}

		// if snow is being drawn then set auto update to keep snow drawing
		if (me.drawingSnow) {
			me.menuManager.setAutoUpdate(true);
		}

		// draw grid
		me.engine.drawGrid();

		// check if hexagons or triangles should be drawn
		if (!me.engine.forceRectangles && me.engine.isHex && me.engine.zoom >= 4) {
			me.engine.drawHexagons();
		} else {
			if (!me.engine.forceRectangles && me.engine.isTriangular && me.engine.zoom >= 4) {
				me.engine.drawTriangles();
			}
		}

		// capture screenshot if scheduled
		if (me.screenShotScheduled) {
			// check for grid capture
			if (me.screenShotScheduled === 2) {
				// draw graph at full opacity
				me.engine.drawPopGraph(me.popGraphLines, 1, true, me.thumbnail, me);
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

		// draw any selections
		me.engine.drawSelections(me);

		// check if grid buffer needs to grow
		if (me.engine.counter && me.engine.anythingAlive) {
			me.middleBox.leftX = me.engine.zoomBox.leftX;
			me.middleBox.bottomY = me.engine.zoomBox.bottomY;
			me.middleBox.rightX = me.engine.zoomBox.rightX;
			me.middleBox.topY = me.engine.zoomBox.topY;
			me.checkGridSize(me, me.middleBox);
		}

		// draw any arrows and labels
		if (me.showLabels) {
			me.waypointManager.drawAnnotations(me);
		}

		// draw population graph if required
		if (me.popGraph && !(me.drawing || me.selecting)) {
			me.engine.drawPopGraph(me.popGraphLines, me.popGraphOpacity, false, me.thumbnail, me);
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
		me.updateGenerationLabel(me);

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

		// update gps and step control background based on performance if enabled
		if (me.perfWarning) {
			me.updateControlBackgrounds(deltaTime, tooSlow, manualStepping, me);
		} else {
			me.generationRange.bgCol = me.fitButton.bgCol;
			me.stepRange.bgCol = me.fitButton.bgCol;
		}

		// set the x/y position on the UI
		me.setXYPosition();

		// check for POI transition
		if (me.stepsPOI !== -1) {
			me.updateCameraPOI();
		}

		// update indicators
		me.updateIndicators();

		// update ESWN speed
		me.updateTrackSpeed();

		// update the infobar
		me.updateInfoBar();

		// hide the UI controls if help or errors are displayed
		me.updateUIForHelp(me.displayHelp || me.scriptErrors.length);

		// dim display if settings displayed
		if (me.navToggle.current[0] && !(me.hideGUI && me.generationOn)) {
			me.mainContext.globalAlpha = 0.5;
			me.mainContext.fillStyle = "black";
			me.mainContext.fillRect(0, 0, me.mainCanvas.width, me.mainCanvas.height);
			me.mainContext.globalAlpha = 1;
		}
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
			toolTips = [],
			settingsMenuOpen = this.navToggle.current[0],
			shown = false;

		// step back button
		if (this.noHistory || (this.engine.counter === 0 && !((this.engine.isMargolus || this.engine.isPCA) && this.engine.margolusReverseLookup1 !== null))) {
			this.playList.itemLocked[1] = true;
		} else {
			this.playList.itemLocked[1] = false;
		}

		// theme selection buttons
		shown = hide || !this.showThemeSelection;
		for (i = 0; i <= this.engine.numThemes; i += 1) {
			this.themeSelections[i].deleted = shown;
		}
		this.themeDefaultLabel.deleted = shown;
		this.themeClassicLabel.deleted = shown;
		this.themeProgramLabel.deleted = shown;
		this.themeDebugLabel.deleted = shown;

		// disable custom theme if not specified
		for (i = 0; i < ViewConstants.themeOrder.length; i += 1) {
			if (ViewConstants.themeOrder[i] === this.engine.numThemes) {
				this.themeSelections[i].locked = !this.customTheme;
			}
		}

		// identify close button
		shown = hide || !this.resultsDisplayed || (this.lastIdentifyType === "Empty") || (this.lastIdentifyType === "none");
		this.identifyCloseButton.deleted = hide || !this.resultsDisplayed;

		// identify results labels
		this.identifyBannerLabel.deleted = shown;
		this.identifyTypeLabel.deleted = shown;
		this.identifyCellsLabel.deleted = shown;
		this.identifyBoxLabel.deleted = shown;
		this.identifyDirectionLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship") || (this.engine.isHex || this.engine.isTriangular);
		this.identifyPeriodLabel.deleted = shown || (this.lastIdentifyType === "Still Life");
		this.identifyModLabel.deleted = shown || (this.lastIdentifyType === "Still Life") || this.lastWasFast || (this.engine.isHex || this.engine.isTriangular);
		this.identifyActiveLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator") || this.lastWasFast;
		this.identifySlopeLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship") || (this.engine.isHex || this.engine.isTriangular);
		this.identifySpeedLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship");
		this.identifyHeatLabel.deleted = shown || (this.lastIdentifyType === "Still Life");
		this.identifyTemperatureLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator") || this.lastWasFast;
		this.identifyVolatilityLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator") || this.lastWasFast;
		this.identifyTypeValueLabel.deleted = shown;
		this.identifyCellsValueLabel.deleted = shown;
		this.identifyBoxValueLabel.deleted = shown;
		this.identifyDirectionValueLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship") || (this.engine.isHex || this.engine.isTriangular);
		this.identifyPeriodValueLabel.deleted = shown || (this.lastIdentifyType === "Still Life");
		this.identifyModValueLabel.deleted = shown || (this.lastIdentifyType === "Still Life") || this.lastWasFast || (this.engine.isHex || this.engine.isTriangular);
		this.identifyActiveValueLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator") || this.lastWasFast;
		this.identifySlopeValueLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship") || (this.engine.isHex || this.engine.isTriangular);
		this.identifySpeedValueLabel.deleted = shown || (this.lastIdentifyType !== "Spaceship");
		this.identifyHeatValueLabel.deleted = shown || (this.lastIdentifyType === "Still Life");
		this.identifyTemperatureValueLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator") || this.lastWasFast;
		this.identifyVolatilityValueLabel.deleted = shown || (this.lastIdentifyType !== "Oscillator") || this.lastWasFast;

		// undo and redo buttons
		this.redoButton.locked = (this.editNum === this.numEdits);
		this.undoButton.locked = (this.editNum <= 1 || this.undoButton.toolTip === "undo [Ctrl Z]");

		// top menu buttons
		this.autoFitToggle.deleted = hide;
		this.zoomItem.deleted = hide;
		this.fitButton.deleted = hide;
		this.gridToggle.deleted = hide;
		this.autostartIndicator.deleted = hide;
		this.stopIndicator.deleted = hide;
		this.waypointsIndicator.deleted = hide;
		this.loopIndicator.deleted = hide;
		this.modeList.deleted = hide;
		this.copySyncToggle.deleted = hide;

		// graph controls
		shown = hide || !this.popGraph || this.drawing || this.selecting || settingsMenuOpen;
		this.opacityItem.deleted = shown;
		this.graphCloseButton.deleted = shown;
		this.linesToggle.deleted = shown;

		// reverse direction button
		shown = hide || this.popGraph || this.selecting || settingsMenuOpen;
		if ((this.engine.isMargolus || this.engine.isPCA) && this.engine.margolusReverseLookup1 !== null) {
			this.directionButton.deleted = shown;
		}

		// cancel button
		this.cancelButton.deleted = !(this.identify || this.startFrom !== -1);
		this.cancelButton.locked = false;

		// generation statistics
		this.genLabel.deleted = hide;
		this.genValueLabel.deleted = hide;
		this.timeLabel.deleted = hide;
		this.elapsedTimeLabel.deleted = hide;
		this.popLabel.deleted = hide;
		this.popValue.deleted = hide;
		shown = hide || this.infinitelyBounded();
		this.birthsLabel.deleted = shown;
		this.birthsValue.deleted = shown;
		shown = shown || this.finitelyBounded();
		this.deathsLabel.deleted = shown;
		this.deathsValue.deleted = shown;
		this.ruleLabel.deleted = hide;

		this.fitButton.deleted = hide;
		this.shrinkButton.deleted = hide || !this.thumbnailEverOn;
		this.escButton.deleted = !(this.isInPopup || this.scriptErrors.length);

		if (this.showDisplaySettings || this.showInfoSettings || this.showPatternSettings || this.showPlaybackSettings || this.showThemeSelection) {
			this.backButton.preText = "Back";
			this.backButton.toolTip = "back to previous menu [Backspace]";
		} else {
			this.backButton.preText = "Close";
			this.backButton.toolTip = "close menu [Backspace]";
		}

		// settings menu
		this.backButton.deleted = hide;
		shown = hide || this.showThemeSelection;
		this.depthItem.deleted = shown;
		this.angleItem.deleted = shown;
		this.layersItem.deleted = shown;
		// setting category buttons
		shown = hide || this.showThemeSelection || this.showDisplaySettings || this.showInfoSettings || this.showPlaybackSettings || this.showPatternSettings;
		this.patternButton.deleted = shown;
		this.themeButton.deleted = shown;
		this.infoButton.deleted = shown;
		this.displayButton.deleted = shown;
		this.playbackButton.deleted = shown;
		this.graphButton.deleted = shown;
		// pattern category
		shown = hide || !this.showPatternSettings;
		this.ruleButton.deleted = shown;
		this.saveButton.deleted = shown;
		this.newButton.deleted = shown;
		this.loadButton.deleted = shown;
		this.randomizeButton.deleted = shown;
		this.identifyButton.deleted = shown;
		this.fastIdentifyButton.deleted = shown;
		this.copyRuleButton.deleted = shown;
		this.saveImageButton.deleted = shown;
		this.saveGraphButton.deleted = shown;
		this.goToGenButton.deleted = shown;
		// info category
		shown = hide || !this.showInfoSettings;
		this.fpsButton.deleted = shown;
		this.timingDetailButton.deleted = shown;
		this.infoBarButton.deleted = shown;
		this.relativeToggle.deleted = shown;
		this.relativeToggle.locked = !this.genDefined;
		this.qualityToggle.deleted = shown;
		// display categoy
		shown = hide || !this.showDisplaySettings;
		this.hexCellButton.deleted = shown;
		this.bordersButton.deleted = shown;
		this.majorButton.deleted = shown;
		this.starsButton.deleted = shown;
		this.labelButton.deleted = shown;
		this.autoGridButton.deleted = shown;
		this.altGridButton.deleted = shown;
		this.rainbowButton.deleted = shown;
		// playback category
		shown = hide || !this.showPlaybackSettings;
		this.historyFitButton.deleted = shown;
		this.throttleToggle.deleted = shown;
		this.showLagToggle.deleted = shown;
		this.killButton.deleted = shown;
		this.autoHideButton.deleted = shown;

		// lock buttons depending on rule
		shown = this.engine.isNone || !this.executable;
		this.randomizeButton.locked = shown;
		this.identifyButton.locked = shown;
		this.fastIdentifyButton.locked = shown;
		this.copyRuleButton.locked = shown;
		this.rainbowButton.locked = (this.engine.multiNumStates > 2 || this.engine.isHROT || this.engine.isPCA || this.engine.isLifeHistory || this.engine.isSuper || this.engine.isRuleTree || this.engine.isMargolus);

		// set theme section label text
		this.themeSectionLabel.deleted = hide || !(this.showDisplaySettings || this.showInfoSettings || this.showPlaybackSettings || this.showPatternSettings);
		if (this.showDisplaySettings) {
			this.themeSectionLabel.preText = "Display";
		} else {
			if (this.showInfoSettings) {
				this.themeSectionLabel.preText = "Advanced";
			} else {
				if (this.showPlaybackSettings) {
					this.themeSectionLabel.preText = "Playback";
				} else {
					if (this.showPatternSettings) {
						this.themeSectionLabel.preText = "Pattern";
					} else {
						this.themeSectionLabel.preText = "";
					}
				}
			}
		}

		// lock kill button if not 2-state moore
		this.killButton.locked = (this.engine.wolframRule !== -1) || this.engine.patternDisplayMode || (this.engine.isHROT && !(this.engine.HROT.xrange === 1 && this.engine.HROT.type === this.manager.mooreHROT && this.engine.HROT.scount === 2)) || this.engine.isTriangular || this.engine.isVonNeumann;

		// lock theme button if mode doesn't support themes
		this.themeButton.locked =  this.multiStateView || this.engine.isNone || this.engine.isRuleTree || this.engine.isSuper;

		// lock major button if hex or triangular grid
		this.majorButton.locked = (this.engine.isHex && !this.engine.forceRectangles) || (this.engine.isTriangular && !this.engine.forceRectangles);

		// lock hex cell button if not in hex mode
		this.hexCellButton.locked = !(this.engine.isHex || this.engine.isTriangular);

		// POI controls
		shown = hide || (this.waypointManager.numPOIs() === 0) || settingsMenuOpen;
		this.nextPOIButton.deleted = shown;
		this.prevPOIButton.deleted = shown;

		// infobar
		shown = hide || !this.infoBarEnabled || this.drawing || this.selecting || this.popGraph;
		this.infoBarLabelXLeft.deleted = shown;
		this.infoBarLabelXValue.deleted = shown;
		this.infoBarLabelYLeft.deleted = shown;
		this.infoBarLabelYValue.deleted = shown;
		this.infoBarLabelAngleLeft.deleted = shown;
		this.infoBarLabelAngleValue.deleted = shown;
		this.infoBarLabelCenter.deleted = shown;
		this.infoBarLabelERight.deleted = shown;
		this.infoBarLabelSRight.deleted = shown;
		this.infoBarLabelWRight.deleted = shown;
		this.infoBarLabelNRight.deleted = shown;
		this.infoBarLabelEValueRight.deleted = shown;
		this.infoBarLabelSValueRight.deleted = shown;
		this.infoBarLabelWValueRight.deleted = shown;
		this.infoBarLabelNValueRight.deleted = shown;

		// adjust esc button if popup
		if (this.scriptErrors.length) {
			this.escButton.toolTip = "close errors [Esc]";
			this.escButton.preText = "Esc";
			this.escButton.setFont("16px Arial");
			this.escButton.bgCol = this.autoFitToggle.bgCol;
		} else {
			this.escButton.toolTip = "close window [Esc]";
			this.escButton.preText = "X";
			this.escButton.setFont("24px Arial");
			this.escButton.bgCol = "red";
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
			value = this.helpSectionList.y;
			i = 0;
			while (i < this.helpSections.length && value < this.displayHeight - (40 + 26) * this.viewMenu.yScale) {
				captions[i] = this.helpSections[i][1];
				if (captions[i] == "Top") {
					toolTips[i] = "go to top of topic [Home]";
				} else {
					toolTips[i] = "";
				}
				value += 26 * this.viewMenu.yScale;
				i += 1;
			}

			// update the control
			this.helpSectionList.lower = captions;
			this.helpSectionList.toolTip = toolTips;
			this.helpSectionList.setHeight(captions.length * 26);
			this.helpSectionList.current = 0;
		}

		// select tools
		shown = hide || !this.selecting || settingsMenuOpen;
		this.selectAllButton.deleted = shown;
		this.autoShrinkToggle.deleted = shown;
		this.libraryToggle.deleted = shown;
		this.clipboardList.deleted = shown;
		this.pastePositionItem.deleted = shown;
		this.pasteModeList.deleted = shown;
		this.copyButton.deleted = shown;
		this.cutButton.deleted = shown;
		this.pasteButton.deleted = shown;

		// selection action tools
		shown = hide || !this.selecting || settingsMenuOpen;
		this.nudgeLeftButton.deleted = shown;
		this.nudgeRightButton.deleted = shown;
		this.nudgeUpButton.deleted = shown;
		this.nudgeDownButton.deleted = shown;
		this.flipXButton.deleted = shown;
		this.flipYButton.deleted = shown;
		this.rotateCWButton.deleted = shown;
		this.rotateCCWButton.deleted = shown;
		this.invertSelectionButton.deleted = shown;
		this.clearSelectionButton.deleted = shown;
		this.clearOutsideButton.deleted = shown;
		this.clearRHistoryButton.deleted = shown || !(this.engine.isLifeHistory || this.engine.isSuper);
		this.randomButton.deleted = shown;
		this.randomItem.deleted = shown;
		shown = hide || !this.selecting || settingsMenuOpen || this.engine.multiNumStates <= 2 || this.engine.isNone;
		this.random2Button.deleted = shown || this.engine.isPCA;

		// lock select tools in VIEWONLY
		shown = this.viewOnly;
		this.pastePositionItem.locked = shown;
		this.pasteModeList.locked = shown;

		// lock select tools
		shown = !this.isSelection;
		this.copyButton.locked = shown;

		// lock select tools for VIEWONLY
		shown = !(this.isSelection || this.isPasting) || this.viewOnly;
		this.randomButton.deleteIfShown(shown);
		this.random2Button.deleteIfShown(shown);
		this.randomItem.deleteIfShown(shown);
		this.nudgeLeftButton.deleteIfShown(shown);
		this.nudgeRightButton.deleteIfShown(shown);
		this.nudgeUpButton.deleteIfShown(shown);
		this.nudgeDownButton.deleteIfShown(shown);
		this.flipXButton.deleteIfShown(shown);
		this.flipYButton.deleteIfShown(shown);
		this.rotateCWButton.deleteIfShown(shown);
		this.rotateCCWButton.deleteIfShown(shown);
		this.invertSelectionButton.deleteIfShown(shown);
		this.clearSelectionButton.deleteIfShown(shown);
		this.clearOutsideButton.deleteIfShown(shown);
		this.clearRHistoryButton.deleteIfShown(shown);
		shown = !this.isSelection || this.viewOnly;
		this.cutButton.locked = shown;

		// lock paste tools
		shown = !this.canPaste || this.isPasting || this.pasteBuffers[this.currentPasteBuffer] === null || this.viewOnly;
		this.pasteButton.locked = shown;

		// drawing tools
		shown = hide || !this.drawing || !this.showStates || settingsMenuOpen;
		this.stateList.deleted = shown;
		this.stateColsList.deleted = shown;
		if (this.engine.multiNumStates <= 2 && !this.engine.isRuleTree) {
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
					if (this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper) {
						value = i + this.startState + this.historyStates;
					} else {
						value = this.historyStates + this.engine.multiNumStates - (i + this.startState);
					}
				}
				this.stateColsList.bgColList[i] = "rgb(" + this.engine.redChannel[value] + "," + this.engine.greenChannel[value] + "," + this.engine.blueChannel[value] + ")";
			}
		}

		shown = hide || !this.drawing || settingsMenuOpen;
		this.pickToggle.deleted = shown;
		this.pausePlaybackToggle.deleted = shown;
		this.smartToggle.deleted = shown;
		this.statesToggle.deleted = shown;
		this.statesSlider.deleted = hide || !this.drawing || !this.showStates || (this.engine.multiNumStates <= this.maxDisplayStates) || settingsMenuOpen;
		this.statesSpacer.deleted = hide || !this.drawing || !this.showStates || (this.engine.multiNumStates <= this.maxDisplayStates) || settingsMenuOpen;

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
			if (this.generationOn) {
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
			this.waypointsIndicator.toolTip = ["toggle track mode [W]"];
		} else {
			this.waypointsIndicator.lower[0] = "WAYPT";
			this.waypointsIndicator.current = [(!this.waypointsDisabled && this.waypointsDefined)];
			this.waypointsIndicator.locked = !(this.waypointsDefined);
			this.waypointsIndicator.toolTip = ["toggle waypoint mode [W]"];
		}

		// loop
		this.loopIndicator.current = [!this.loopDisabled && this.loopGeneration !== -1];
		this.loopIndicator.locked = (this.loopGeneration === -1);
		this.loopIndicator.toolTip = ["loop at " + this.loopGeneration + " [Shift P]"];

		// stop
		this.stopIndicator.current = [!this.stopDisabled && this.stopGeneration !== -1];
		this.stopIndicator.locked = (this.stopGeneration === -1);
		this.stopIndicator.toolTip = ["stop at " + this.stopGeneration + " [Alt P]"];
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
			if (!me.copyCompleteDisplayed) {
				me.menuManager.notification.notify("Press Enter to complete copy", 15, 10000, 15, true);
				me.copyCompleteDisplayed = true;
			}
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
			me.engine.drawPopGraph(me.popGraphLines, me.popGraphOpacity, false, me.thumbnail, me);
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

	// stop start from (go to generation)
	View.prototype.stopStartFrom = function(me, cancelled) {
		me.startFrom = -1;
		me.viewMenu.locked = false;
		if (cancelled) {
			me.menuManager.notification.notify("Cancelled", 15, 80, 15, true);
		} else {
			if (me.genNotifications) {
				me.menuManager.notification.notify("Arrived at generation " + me.engine.counter, 15, 150, 15, true);
			}
		}
		me.menuManager.notification.clear(false, false);
		me.afterEdit("");
	};

	// view update for start from
	View.prototype.viewAnimateStartFrom = function(me) {
		// start time of updates
		var startTime = performance.now(),

		    // time budget in ms for this frame
			timeLimit = 13;

		// lock the menu
		me.viewMenu.locked = true;

		// compute the next set of generations without stats for speed
		while (me.engine.counter < me.startFrom && (performance.now() - startTime < timeLimit)) {
			// compute the next generation
			me.engine.nextGeneration(false, me.noHistory, me.graphDisabled, me.identify);
			me.engine.convertToPensTile();

			// paste any RLE snippets
			me.pasteRLEList();

			// if paste every is defined then always flag there are alive cells
			// since cells will appear in the future
			if (me.isPasteEvery || me.engine.counter <= me.maxPasteGen) {
				me.engine.anythingAlive = 1;
			}
		}

		// render world
		me.renderWorld(me, false, 0, false);

		// update progress bar
		me.updateProgressBarStartFrom(me);

		// set counters to the current
		me.floatCounter = me.engine.counter;
		me.originCounter = me.engine.counter;

		// set the auto update mode
		me.menuManager.setAutoUpdate(true);

		if (me.engine.counter >= me.startFrom) {
			me.stopStartFrom(me, false);
		}
	};

	// view update for identify
	View.prototype.viewAnimateIdentify = function(me) {
		// start time of updates
		var startTime = performance.now(),

		    // time budget in ms for this frame
			timeLimit = 13,

			// identify result
			identifyResult = [];

		// lock the menu
		me.viewMenu.locked = true;

		// compute the next set of generations without stats for speed
		while (me.identify && (performance.now() - startTime < timeLimit) && me.engine.anythingAlive) {
			// compute the next generation
			me.engine.nextGeneration(false, me.noHistory, me.graphDisabled, me.identify);
			me.engine.convertToPensTile();

			// check if grid buffer needs to grow
			// (normally this check happens at render time but we may have processed more generations than expected by that function)
			if (me.engine.counter && me.engine.anythingAlive) {
				me.middleBox.leftX = me.engine.zoomBox.leftX;
				me.middleBox.bottomY = me.engine.zoomBox.bottomY;
				me.middleBox.rightX = me.engine.zoomBox.rightX;
				me.middleBox.topY = me.engine.zoomBox.topY;
				me.checkGridSize(me, me.middleBox);
			}

			// paste any RLE snippets
			me.pasteRLEList();

			// if paste every is defined then always flag there are alive cells
			// since cells will appear in the future
			if (me.isPasteEvery || me.engine.counter <= me.maxPasteGen) {
				me.engine.anythingAlive = 1;
			}

			// check if any cells are alive
			if (me.engine.anythingAlive) {
				// compute oscillators
				identifyResult = me.engine.oscillating(me.identifyFast, me);
				if (identifyResult.length > 0) {
					// check for buffer full
					if (identifyResult[0] === LifeConstants.bufferFullMessage) {
						identifyResult[0] = "Nothing Identified";
						me.lastOscillator = "none";
						me.lastIdentifyType = "none";
						me.lastIdentifyDirection = "";
						me.lastIdentifySpeed = "";
						me.lastIdentifyBox = "";
						me.lastIdentifyGen = "";
						me.lastIdentifyCells = "";
						me.lastIdentifySlope = "";
						me.lastIdentifyPeriod = "";
						me.lastIdentifyHeat = "";
						me.lastIdentifyVolatility = "";
						me.lastIdentifyMod = "";
						me.lastIdentifyActive = "";
						me.lastIdentifyTemperature = "";
					} else {
						me.lastOscillator = identifyResult[0];
						me.lastIdentifyType = identifyResult[1];
						if (me.lastIdentifyType !== "Empty") {
							me.lastIdentifyDirection = identifyResult[2];
							me.lastIdentifySpeed = identifyResult[3];
							me.lastIdentifyBox = identifyResult[4];
							me.lastIdentifyGen = identifyResult[5];
							me.lastIdentifyCells = identifyResult[6];
							me.lastIdentifySlope = identifyResult[7];
							me.lastIdentifyPeriod = identifyResult[8];
							me.lastIdentifyHeat = identifyResult[9];
							me.lastIdentifyVolatility = identifyResult[10];
							me.lastIdentifyMod = identifyResult[11];
							me.lastIdentifyActive = identifyResult[12];
							me.lastIdentifyTemperature = identifyResult[13];
	
							// update result labels
							me.identifyTypeValueLabel.preText = me.lastIdentifyType;
							me.identifyCellsValueLabel.preText = me.lastIdentifyCells;
							if (me.lastIdentifyCells.indexOf("|") === -1) {
								me.identifyCellsValueLabel.toolTip = "";
							} else {
								me.identifyCellsValueLabel.toolTip = "min | max | average";
							}
							me.identifyBoxValueLabel.preText = me.lastIdentifyBox;
							me.identifyDirectionValueLabel.preText = me.lastIdentifyDirection;
							me.identifyPeriodValueLabel.preText = me.lastIdentifyPeriod;
							me.identifySlopeValueLabel.preText = me.lastIdentifySlope;
							me.identifySpeedValueLabel.preText = me.lastIdentifySpeed;
							if (me.lastIdentifySpeed.indexOf("|") === -1) {
								me.identifySpeedValueLabel.toolTip = "";
							} else {
								me.identifySpeedValueLabel.toolTip = "simplified | unsimplified";
							}
							me.identifyHeatValueLabel.preText = me.lastIdentifyHeat;
							if (me.lastIdentifyHeat.indexOf("|") === -1) {
								me.identifyHeatValueLabel.toolTip = "";
							} else {
								me.identifyHeatValueLabel.toolTip = "min | max | average";
							}
							me.identifyVolatilityValueLabel.preText = me.lastIdentifyVolatility;
							me.identifyModValueLabel.preText = me.lastIdentifyMod;
							me.identifyActiveValueLabel.preText = me.lastIdentifyActive;
							me.identifyActiveValueLabel.toolTip = "rotor | stator | total";
							me.identifyTemperatureValueLabel.preText = me.lastIdentifyTemperature;
							me.identifyTemperatureValueLabel.toolTip = "active | rotor";
						}
						me.resultsDisplayed = true;

						// save fast setting
						me.lastWasFast = me.identifyFast;
	
						// set label position for results
						me.setResultsPosition();
					}

					// switch off search and pause playback
					me.identify = false;
					if (me.generationOn) {
						me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
					}
					me.afterEdit("");
	
					me.identifyBannerLabel.preText = identifyResult[0];
					if (me.lastIdentifyType === "Empty" || me.lastIdentifyType === "none") {
						me.menuManager.notification.notify(identifyResult[0], 15, 240, 15, false);
						me.resultsDisplayed = false;
					} else {
						me.menuManager.notification.clear(true, false);
						me.menuManager.notification.clear(false, false);
						me.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
					}
					me.engine.initSearch(me.identify);

					// switch off fast mode
					me.identifyFast = false;

					// unlock the menu
					me.viewMenu.locked = false;
				}
			} else {
				// switch off search and pause playback
				me.identify = false;
				if (me.generationOn) {
					me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
				}
				me.afterEdit("");

				me.resultsDisplayed = false;
				me.menuManager.notification.notify("All Cells Died", 15, 240, 15, false);
				me.menuManager.notification.clear(true, false);
				me.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
				me.engine.initSearch(me.identify);

				// switch off fast mode
				me.identifyFast = false;

				// unlock the menu
				me.viewMenu.locked = false;

				// mark the died generation
				me.diedGeneration = me.engine.counter;

				// set fade interval
				me.fading = me.historyStates + (me.engine.multiNumStates > 0 ? me.engine.multiNumStates : 0);
			}
		}

		// render world
		me.renderWorld(me, false, 0, false);

		// set counters to the current
		me.floatCounter = me.engine.counter;
		me.originCounter = me.engine.counter;

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
			me.engine.nextGeneration(false, noSnapshots, me.graphDisabled, me.identify);
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
			me.engine.nextGeneration(me.statsOn, false, me.graphDisabled, me.identify);
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
			me.engine.drawPopGraph(me.popGraphLines, me.popGraphOpacity, false, me.thumbnail, me);
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
			if (me.identify) {
				me.viewAnimateIdentify(me);
			} else {
				if (me.clipboardCopy) {
					me.viewAnimateClipboard(me);
				} else {
					if (me.startFrom !== -1) {
						me.viewAnimateStartFrom(me);
					} else {
						me.viewAnimateNormal(timeSinceLastUpdate, me);
					}
				}
			}
		}
	};

	// start view mode
	View.prototype.viewStart = function(me) {
		// zero life counter
		me.engine.counter = 0;
		me.engine.counterMargolus = 0;
		me.engine.maxMargolusGen = 0;
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
		me.engine.anythingAlive = 1;

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
			// if just switched on then switch to pan mode
			if (me.popGraph) {
				if (me.modeList.current !== ViewConstants.modePan) {
					me.modeList.current = me.viewModeList(ViewConstants.modePan, true, me);
				}
			}
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

	// toggle auto hide grid
	View.prototype.viewAutoGridToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			// toggle auto hide
			me.autoGrid = newValue[0];
			
			// check if just switched on and grid is off
			if (me.autoGrid && !me.engine.displayGrid) {
				// if in Draw or Select mode then turn on grid
				if (me.drawing || me.selecting) {
					me.gridToggle.current = me.toggleGrid([true], true, me);
				}
			}
		}
		return [me.autoGrid];
	};

	// toggle rainbow mode
	View.prototype.viewRainbowToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			// toggle rainbow
			me.engine.rainbow = newValue[0];
			me.engine.createColourIndex();
			if ((me.engine.counter & 1) === 0) {
				me.engine.resetColourGridBox(me.engine.grid16);
			} else {
				me.engine.resetColourGridBox(me.engine.nextGrid16);
			}
		}
		return [me.engine.rainbow];
	};

	// toggle Margolus alternating grid lines
	View.prototype.viewAltGridToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			// toggle auto hide
			me.engine.altGrid = newValue[0];
		}
		return [me.engine.altGrid];
	};

	// toggle auto hide gui
	View.prototype.viewAutoHideToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			// toggle auto hide
			me.hideGUI = newValue[0];
		}
		return [me.hideGUI];
	};

	// toggle hexagonal cells
	View.prototype.viewHexCellToggle = function(newValue, change, me) {
		// check if changing
		if (change) {
			// toggle cell shape
			me.engine.forceRectangles = newValue[0];
			me.updateGridIcon();
		}

		return [me.engine.forceRectangles];
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
	View.prototype.setNewTheme = function(newTheme, steps, me) {
		var i = 0;

		// check if it has changed
		if (me.engine.colourTheme !== newTheme) {
			me.engine.setTheme(newTheme, steps, me);
			if (me.engine.colourChangeSteps > 1) {
				me.menuManager.updateCount = me.engine.colourChangeSteps;
			}

			// clear theme selection buttons apart from this one
			for (i = 0; i <= this.engine.numThemes; i += 1) {
				if (newTheme !== ViewConstants.themeOrder[i]) {
					this.themeSelections[i].current = [false];
				} else {
					this.themeSelections[i].current = [true];
				}
			}
		}
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
		var numberValue = 0;

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
			me.setNewTheme(me.defaultTheme, 1, me);
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
			me.engine.anythingAlive = 1;

			// reset history box
			me.engine.resetHistoryBox();
		}
	};

	// reset to first generation
	View.prototype.reset = function(me) {
		var hardReset = false,
		    looping = false;

		// reset snow if enabled
		if (this.drawingSnow) {
			this.engine.initSnow();
		}

		// reset time intervals
		if (me.engine.counter === 0) {
			me.menuManager.resetTimeIntervals();
		}

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

		// clear reversible rule counters
		me.engine.counterMargolus = 0;
		me.engine.maxMargolusGen = 0;

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
			if (me.stopGeneration !== -1) {
				me.stopDisabled = true;
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
			// check for reverse start
			if ((this.engine.isMargolus || this.engine.isPCA) && this.engine.margolusReverseLookup1 !== null && me.reverseStart) {
				me.engine.reversePending = true;
			}

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
			if (!looping || (me.waypointsDefined && me.waypointManager.hasCamera) || me.autoFit) {
				me.resetCamera(me, hardReset);
				if (me.autoFit) {
					me.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
				}
			}

			// enable looping
			me.loopDisabled = false;

			// enable stop
			if (!looping) {
				me.stopDisabled = false;
			}
		}

		// check for simple view
		if (!me.multiStateView) {
			// reset grid and generation counter
			me.engine.restoreSavedGrid(me.noHistory);
			me.floatCounter = me.engine.counter;
			me.originCounter = me.floatCounter;

			// mark cells alive
			me.engine.anythingAlive = 1;
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

		// reset identify
		if (me.identify) {
			me.identify = false;
			me.menuManager.notification.clear(true, false);
		}
		me.engine.initSearch(me.identify);

		// clear any waypoint messages
		me.menuManager.notification.clear(false, false);

		// reset died generation
		me.diedGeneration = -1;

		// reset cleared glider count
		me.engine.numClearedGliders = 0;

		// reset undo/redo to generation 0
		me.setUndoGen(me.engine.counter);

		// clear identify results
		me.resultsDisplayed = false;

		// draw any undo/redo edit records
		me.pasteEdits();
	};

	// set the pause icon to pause or step forward based on play mode
	View.prototype.setPauseIcon = function(isPlaying) {
		var reverse = this.engine.reverseMargolus,
			toolTip = "",
			iconName = "",
			backIconName = "",
			backToolTip = "",
			forwardIconName = "",
			forwardToolTip = "";

		// check if playing
		if (isPlaying) {
			// set to pause icon
			iconName = "pause";
			toolTip = "pause [Enter]";
		} else {
			// set to play icon
			toolTip = "play [Enter]";
			if (this.engine.isMargolus || this.engine.isPCA) {
				// invert direction if pending change
				if (this.engine.reversePending) {
					reverse = !reverse;
				}
				if (reverse) {
					iconName = "reverse";
				} else {
					iconName = "play";
				}
			} else {
				iconName = "play";
			}
		}

		// check for Margolus reverse direction
		if (this.engine.isMargolus || this.engine.isPCA) {
			reverse = this.engine.reverseMargolus;
			if (this.engine.reversePending) {
				reverse = !reverse;
			}
			if (reverse) {
				forwardIconName = "stepback";
				backIconName = "stepforward";
				forwardToolTip = "step back [Shift Tab]";
				backToolTip = "step forward [Tab]";
			} else {
				forwardIconName = "stepforward";
				backIconName = "stepback";
				forwardToolTip = "step forward [Tab]";
				backToolTip = "step back [Shift Tab]";
			}
		} else {
			forwardIconName = "stepforward";
			backIconName = "stepback";
			forwardToolTip = "step forward [Tab]";
			backToolTip = "step back [Shift Tab]";
		}

		// set the step back and forward icons and tooltips
		this.playList.icon[ViewConstants.modePause] = this.iconManager.icon(forwardIconName);
		this.playList.toolTip[ViewConstants.modePause] = forwardToolTip;
		this.playList.icon[ViewConstants.modeStepBack] = this.iconManager.icon(backIconName);
		this.playList.toolTip[ViewConstants.modeStepBack] = backToolTip;

		// set the play icon and tooltip
		this.playList.icon[ViewConstants.modePlay] = this.iconManager.icon(iconName);
		this.playList.toolTip[ViewConstants.modePlay] = toolTip;
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

	// auto-shrink selection
	View.prototype.viewAutoShrinkList = function(newValue, change, me) {
		if (change) {
			me.autoShrink = newValue[0];
			if (me.autoShrink) {
				me.autoShrinkSelection(me);
			}
		}

		return [me.autoShrink];
	};

	// copy sync with external clipboard
	View.prototype.viewCopySyncList = function(newValue, change, me) {
		if (change) {
			me.copySyncExternal = newValue[0];
			if (me.copySyncExternal) {
				me.syncNotified = true;
			}
		}

		return [me.copySyncExternal];
	};

	// view mode list
	View.prototype.viewModeList = function(newValue, change, me) {
		var result = newValue;

		if (change) {
			switch (newValue) {
				case ViewConstants.modeDraw:
					// drawing
					me.playbackDrawPause = false;
					if (me.viewOnly || me.engine.isNone) {
						result = me.modeList.current;
					} else {
						me.drawing = true;
						// turn off pick mode
						me.pickToggle.current = me.togglePick([false], true, me);
						me.selecting = false;
					}
					// turn off pasting
					me.cancelPaste(me);
				
					// check for autogrid
					if (me.autoGrid) {
						me.gridToggle.current = me.toggleGrid([true], true, me);
					}
					break;
				case ViewConstants.modeSelect:
					// selecting
					me.drawing = false;
					me.pickToggle.current = me.togglePick([false], true, me);
					me.selecting = true;

					// check for autogrid
					if (me.autoGrid) {
						me.gridToggle.current = me.toggleGrid([true], true, me);
					}
					break;
				case ViewConstants.modePan:
					// panning
					me.drawing = false;
					me.selecting = false;
					me.pickToggle.current = me.togglePick([false], true, me);

					// turn off pasting
					me.cancelPaste(me);

					// check for autogrid
					if (me.autoGrid) {
						me.gridToggle.current = me.toggleGrid([false], true, me);
					}
					break;
			}

			// clear help widths cache
			me.helpFixedCache = [];
			me.helpVariableCache = [];

			// close settings if open
			if (me.navToggle.current[0]) {
				me.navToggle.current = me.toggleSettings([false], true, me);
				me.menuManager.toggleRequired = true;
			}
		}

		// set the background cursor
		me.setMousePointer(result);

		return result;
	};

	// set mouse cursor
	View.prototype.setMousePointer = function(mode) {
		// if help or errors displayed then use grab cursor
		if (this.displayHelp || this.displayErrors) {
			this.viewMenu.setBackgroundCursor("grab");
		} else {
			// set based on mode
			switch (mode) {
				case ViewConstants.modeDraw:
					this.viewMenu.setBackgroundCursor("auto");
					break;
				case ViewConstants.modePan:
					this.viewMenu.setBackgroundCursor("grab");
					break;
				case ViewConstants.modeSelect:
					this.viewMenu.setBackgroundCursor("crosshair");
					break;
			}
		}
	};

	// active clipboard
	View.prototype.viewClipboardList = function(newValue, change, me) {
		if (change) {
			// set active clipboard
			me.currentPasteBuffer = newValue;

			// update tooltips
			me.createClipboardTooltips();

			// close library
			me.libraryToggle.current = [false];
			me.menuManager.toggleRequired = true;

			// if already pasting then update paste
			if (me.isPasting) {
				me.pasteSelection(me, newValue);
			} else {
				me.menuManager.notification.notify("Clipboard " + newValue + " active", 15, 80, 15, true);
			}
		}

		return me.currentPasteBuffer;
	};

	// paste mode
	View.prototype.viewPasteModeList = function(newValue, change, me) {
		if (change) {
			me.pasteModeForUI = newValue;
			me.pasteMode = ViewConstants.uiPasteModes[newValue];
		}

		return me.pasteModeForUI;
	};

	// cycle paste mode
	View.prototype.cyclePasteMode = function(me) {
		if (!me.viewOnly) {
			me.pasteModeForUI += 1;
			if (me.pasteModeForUI > 3) {
				me.pasteModeForUI = 0;
			}
			me.pasteModeList.current = me.viewPasteModeList(me.pasteModeForUI, true, me);
		}
	};

	// get state number from name
	View.prototype.getStateFromName = function(name) {
		var number = -1,
			i = 0,
			n = 0,
			s = 0,
			e = 0,
			w = 0;

		// remove quotes from the name
		if (name.charAt(0) === "\"") {
			name = name.substr(1, name.length - 2);
		}

		// rule tree states
		if (this.engine.isRuleTree) {
			// check for any @NAMES definitions
			i = 0;
			while (i < this.stateNames.length && number === -1) {
				if (this.stateNames[i] !== undefined) {
					if (this.stateNames[i] === name) {
						number = i;
					}
				}
				i += 1;
			}
		} else {
			// check for 2-state rules
			if (this.engine.multiNumStates <= 2) {
				if (this.engine.isLifeHistory) {
					i = 0;
					while (i < ViewConstants.stateNames.length && number === -1) {
						if (ViewConstants.stateNames[i] === name) {
							number = i;
						}
					}
				} else {
					if (name === "alive") {
						number = 1;
					} else {
						if (name === "dead") {
							number = 0;
						}
					}
				}
			} else {
				// multi-state (Generations or PCA)
				if (name === "dead") {
					number = 0;
				} else {
					if (this.engine.isPCA) {
						i = 0;
						while (i < name.length && number === -1) {
							switch (name.charAt(i)) {
								case "N":
									n += 1;
									break;
								case "S":
									s += 1;
									break;
								case "E":
									e += 1;
									break;
								case "W":
									w += 1;
									break;
								default:
									number = -2;
							}
							i += 1;
						}
						if (n > 1 || s > 1 || e > 1 || w > 1) {
							number = -2;
						}
						if (number !== -2) {
							number = n | (e << 1) | (s << 2) | (w << 3);
						}
					} else {
						if (this.engine.isSuper) {
							i = 0;
							while (i < LifeConstants.namesSuper.length && number === -1) {
								if (LifeConstants.namesSuper[i] === name) {
									number = i;
								}
							}
						} else {
							if (name === "alive") {
								number = 1;
							} else {
								if (name.substr(0, 6) === "dying ") {
									number = Number(name.substr(6)) + 1;
									if (number >= this.engine.multiNumStates) {
										number = -1;
									}
								}
							}
						}
					}
				}
			}
		}

		return number;
	};

	// get state name
	View.prototype.getStateName = function(state) {
		var name = "";

		// rule tree states
		if (this.engine.isRuleTree) {
			// check for any @NAMES definitions
			if (this.stateNames[state] === undefined) {
				name = "state " + String(state);
			} else {
				name = this.stateNames[state];
			}
		} else {
			// check for 2-state rules
			if (this.engine.multiNumStates <= 2) {
				if (this.engine.isLifeHistory) {
					name = ViewConstants.stateNames[state];
				} else {
					name = (state ? "alive" : "dead");
				}
			} else {
				// multi-state (Generations or PCA)
				if (state === 0) {
					name = "dead";
				} else {
					if (this.engine.isPCA) {
						if ((state & 1) !== 0) {
							name += "N";
						}
						if ((state & 2) !== 0) {
							name += "E";
						}
						if ((state & 4) !== 0) {
							name += "S";
						}
						if ((state & 8) !== 0) {
							name += "W";
						}
					} else {
						if (this.engine.isSuper) {
							name = LifeConstants.namesSuper[state];
						} else {
							if (state === 1) {
								name = "alive";
							} else {
								name = "dying " + String(state - 1);
							}
						}
					}
				}
			}
		}

		return name;
	};

	// drawing states list
	View.prototype.viewStateList = function(newValue, change, me) {
		var result = newValue;

		if (change) {
			if (me.engine.multiNumStates <= 2) {
				me.drawState = newValue;
			} else {
				newValue += me.startState;
				if (newValue === 0) {
					me.drawState = 0;
				} else {
					if (me.engine.isNone || me.engine.isPCA || me.engine.isRuleTree || me.engine.isSuper) {
						me.drawState = newValue;
					} else {
						me.drawState = me.engine.multiNumStates - newValue;
					}
				}
			}

			// turn off pick mode
			me.pickToggle.current = me.togglePick([false], true, me);

			// notify after switching mode since switching clears notifications
			me.menuManager.notification.notify("Drawing with state " + newValue + " (" + me.getStateName(newValue) + ")", 15, 120, 15, true);
		}

		return result;
	};

	// switch to state from keyboard shortcut
	View.prototype.switchToState = function(state) {
		var numStates = this.engine.multiNumStates,
			maxDisplayStates = this.maxDisplayStates,
			origState = state,
			lowState = 0,
			highState = 0;

		if (numStates === -1) {
			numStates = 2;
			maxDisplayStates = 2;
		}
		if (this.engine.isLifeHistory) {
			numStates = 7;
			maxDisplayStates = 7;
		}

		highState = lowState + maxDisplayStates - 1;

		// check the requested state is valid
		if (state < numStates) {
			// scroll the state list to make the selected state visible
			if (state >= maxDisplayStates) {
				this.startState = state - maxDisplayStates + 1;
				state = maxDisplayStates - 1;
			} else {
				if (state >= this.startState) {
					state -= this.startState;
				} else {
					this.startState = state;
					state = 0;
				}
			}

			// switch the pen to the current state
			this.stateList.current = this.viewStateList(state, true, this);

			// check if the new state is in the range shown by the state slider
			this.statesSlider.current = this.viewStatesRange([this.startState / (this.engine.multiNumStates - this.maxDisplayStates), 0], true, this);
		}
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

	// replace cells with the current pen colours
	View.prototype.replaceCells = function(replace) {
		var x = 0,
			y = 0,
			state = 0,
			numReplaced = 0,
			current = this.drawState,
			historyBox = this.engine.historyBox,
			selBox = this.selectionBox,
			leftX = historyBox.leftX,
			rightX = historyBox.rightX,
			bottomY = historyBox.bottomY,
			topY = historyBox.topY,
			swap = 0,
			xOff = (this.engine.width >> 1) - (this.patternWidth >> 1) + (this.xOffset << 1),
			yOff = (this.engine.height >> 1) - (this.patternHeight >> 1) + (this.yOffset << 1);
			
		// adjust current state if generations style
		if (this.engine.multiNumStates > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)) {
			if (replace > 0) {
				replace = this.engine.multiNumStates - replace;
			}
		}

		// check for selection
		if (this.isSelection) {
			leftX = selBox.leftX + xOff;
			rightX = selBox.rightX + xOff;
			if (leftX > rightX) {
				swap = rightX;
				rightX = leftX;
				leftX = swap;
			}
			bottomY = selBox.bottomY + yOff;
			topY = selBox.topY + yOff;
			if (bottomY > topY) {
				swap = topY;
				topY = bottomY;
				bottomY = swap;
			}
		}

		// check if the pen and replace colour are the same
		if (current !== replace) {
			// clear all cells that match the current drawing state
			for (y = bottomY; y <= topY; y += 1) {
				for (x = leftX; x <= rightX; x += 1) {
					state = this.engine.getState(x, y, false);
					if (this.engine.multiNumStates > 2 && !(this.engine.isPCA || this.engine.isRuleTree) && state > 0) { // TBD 
						state = this.engine.multiNumStates - state;
					}
					if (state === replace) {
						this.setStateWithUndo(x, y, current, true);
						numReplaced += 1;
					}
				}
			}
			if (numReplaced > 0) {
				// check for state 6
				if ((this.engine.isLifeHistory) && (replace === 6 || current === 6)) {
					this.engine.populateState6MaskFromColGrid();
				}
				this.afterEdit("replace states");
			}
		} else {
			this.menuManager.notification.notify("Cell and drawing state are the same", 15, 120, 15, true);
		}

		return numReplaced;
	};

	// clear cells of the current pen colours
	View.prototype.clearCells = function(me, ctrl, markedOnly) {
		var x = 0,
			y = 0,
			state = 0,
			current = me.drawState,
			historyBox = me.engine.historyBox,
			numCleared = 0,
			clearValue = 0;
			
		// delete any cell of the current pen colour
		if (current > 0) {
			// adjust current state if generations style
			if (me.engine.multiNumStates > 2 && !(me.engine.isNone || me.engine.isPCA || me.engine.isRuleTree || me.engine.isSuper)) {
				current = me.engine.multiNumStates - current;
			}
			// adjust for LifeHistory
			if (me.engine.isLifeHistory && current > 1) {
				clearValue = current & 1;
			}

			// check for [R]History or [R]Super clear
			if (me.engine.isLifeHistory && ctrl) {
				// check for marked only
				if (markedOnly) {
					// clear marked states only
					for (y = historyBox.bottomY; y <= historyBox.topY; y += 1) {
						for (x = historyBox.leftX; x <= historyBox.rightX; x += 1) {
							state = me.engine.getState(x, y, false);
							if (state >= 3 && state <= 5) {
								me.setStateWithUndo(x, y, state & 1, true);
								numCleared += 1;
							}
						}
					}
					if (numCleared > 0) {
						if (me.isSuper) {
							me.afterEdit("clear [R]Super marked cells");
						} else {
							me.afterEdit("clear [R]History marked cells");
						}
					}
				} else {
					// clear all LifeHistory states
					for (y = historyBox.bottomY; y <= historyBox.topY; y += 1) {
						for (x = historyBox.leftX; x <= historyBox.rightX; x += 1) {
							state = me.engine.getState(x, y, false);
							if (state > 1) {
								me.setStateWithUndo(x, y, state & 1, true);
								numCleared += 1;
							}
						}
					}
					if (numCleared > 0) {
						if (me.isSuper) {
							me.afterEdit("clear [R]Super cells");
						} else {
							// update state 6 grid
							this.engine.populateState6MaskFromColGrid();
							me.afterEdit("clear [R]History cells");
						}
					}
				}
			} else {
				// clear all cells that match the current drawing state
				for (y = historyBox.bottomY; y <= historyBox.topY; y += 1) {
					for (x = historyBox.leftX; x <= historyBox.rightX; x += 1) {
						state = me.engine.getState(x, y, false);
						if (state === current) {
							me.setStateWithUndo(x, y, clearValue, true);
							numCleared += 1;
						}
					}
				}
				if (numCleared > 0) {
					if (me.engine.isLifeHistory && current === 6) {
						// update state 6 grid
						this.engine.populateState6MaskFromColGrid();
					}
					me.afterEdit("clear state " + current + " cells");
				}
			}
		}

		return numCleared;
	};

	// view play list
	View.prototype.viewPlayList = function(newValue, change, me) {
		var result = newValue,
			stopMode = me.stopDisabled,
		    loopMode = me.loopDisabled,
		    waypointMode = me.waypointsDisabled,
		    autoStartMode = me.autoStartDisabled,
		    autoFitMode = me.autoFit,
		    trackMode = me.trackDisabled,
			i = 0,
			message = null,
			duration = 40,
			numChanged = 0,

		    // whether loop switched on or off
		    loopChange = 0,

		    // whether stop switched on or off
		    stopChange = 0,

		    // whether waypoints switched on or off
		    waypointsChange = 0,

		    // whether track switched on or off
		    trackChange = 0,

		    // whether autostart switched on or off
		    autoStartChange = 0,

		    // whether autofit switched on or off
		    autoFitChange = 0;

		if (change) {
			// disable playback draw pause
			me.playbackDrawPause = false;

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
				me.afterEdit("");
				me.reset(me);

				// reset undo/redo list
				me.currentEditIndex = 0;

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

				// check for stop on
				if (!me.stopDisabled && stopMode && me.stopGeneration !== -1) {
					stopChange = 1;
				}

				// check for stop off
				if (me.stopDisabled && !stopMode && me.stopGeneration !== -1) {
					stopChange = -1;
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
				if (loopChange !== 0 || stopChange !== 0 || waypointsChange !== 0 || trackChange !== 0 || autoStartChange !== 0 || autoFitChange !== 0) {
					// build the notification
					message = "";

					// check for loop change
					if (loopChange !== 0) {
						numChanged += 1;
						message += "Loop";
					}

					// check for stop change
					if (stopChange !== 0) {
						if (numChanged > 0) {
							if (Math.abs(waypointsChange) + Math.abs(trackChange) + Math.abs(autoStartChange) + Math.abs(autoFitChange) > 0) {
								message += ", ";
							} else {
								message += " and ";
							}
						}
						numChanged += 1;
						message += "Stop";
					}

					// check for waypoints change
					if (waypointsChange !== 0) {
						if (numChanged > 0) {
							if (Math.abs(trackChange) + Math.abs(autoStartChange) + Math.abs(autoFitChange) > 0) {
								message += ", ";
							} else {
								message += " and ";
							}
						}
						numChanged += 1;
						message += "Waypoints";
					}

					// check for track change
					if (trackChange !== 0) {
						if (numChanged > 0) {
							if (Math.abs(autoStartChange) + Math.abs(autoFitChange) > 0) {
								message += ", ";
							} else {
								message += " and ";
							}
						}
						numChanged += 1;
						message += "Track";
					}

					// check for autostart change
					if (autoStartChange !== 0) {
						if (numChanged > 0) {
							if (autoFitChange !== 0) {
								message += ", ";
							} else {
								message += " and ";
							}
						}
						numChanged += 1;
						message += "AutoStart";
					}

					// check for autofit change
					if (autoFitChange !== 0) {
						if (numChanged > 0) {
							message += " and ";
						}
						message += "AutoFit";
					}

					// check for on or off
					if (stopChange > 0 || loopChange > 0 || waypointsChange > 0 || trackChange > 0 || autoStartChange > 0 || autoFitChange > 0) {
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
					// set playback to forward if waypoints on and not disabled
					if (me.waypointsDefined && !me.waypointsDisabled) {
						if ((me.engine.isMargolus || me.engine.isPCA) && (me.engine.reverseMargolus || (!me.engine.reverseMargolus && me.engine.reversePending))) {
							me.directionPressed(me);
						}
					}

					// play
					me.generationOn = true;
					me.afterEdit("");

					// set flag whether pattern was empty and playback is on
					if (me.engine.population === 0) {
						me.emptyStart = true;
					} else {
						me.emptyStart = false;
					}

					// check for exclusive playback mode
					if (me.exclusivePlayback) {
						Controller.stopOtherViewers(me);
					}

					// zoom text
					me.menuManager.notification.notify("Play", 15, 40, 15, true);
				} else {
					// pause
					me.generationOn = false;
					me.afterEdit("");

					// zoom text unless STOP and generation notifications disabled
					if (!(me.engine.counter === me.stopGeneration && !me.stopDisabled && !me.genNotifications)) {
						me.menuManager.notification.notify("Pause", 15, 40, 15, true);
					}
				}
				break;

			case ViewConstants.modeStepBack:
				// step back
				if (!me.generationOn) {
					// check for reversible Margolus rules
					if ((me.engine.isMargolus || me.engine.isPCA) && me.engine.margolusReverseLookup1 !== null) {
						// change direction
						me.engine.reversePending = !me.engine.reversePending;
						if (me.engine.reversePending) {
							me.afterEdit("reverse playback");
						}
						me.afterEdit("");
						for (i = 0; i < me.gensPerStep; i += 1) {
							me.engine.nextGeneration(true, me.noHistory, me.graphDisabled, me.identify);
							me.engine.convertToPensTile();
							me.floatCounter = me.engine.counter;
						}
						me.engine.reversePending = true;
					} else {
						// check if at start
						if (me.engine.counter > 0) {
							// adjust undo stack pointer
							me.setUndoGen(me.engine.counter - me.gensPerStep);
	
							// run from start to previous generation
							me.runTo(me.engine.counter - me.gensPerStep);
						}
					}
				} else {
					// pause
					me.generationOn = false;
					me.afterEdit("");

					// zoom text
					me.menuManager.notification.notify("Pause", 15, 40, 15, true);
				}

				break;

			case ViewConstants.modePause:
				// pause
				if (me.generationOn) {
					// pause
					me.generationOn = false;
					me.afterEdit("");

					// zoom text unless STOP and generation notifications disabled
					if (!(me.engine.counter === me.stopGeneration && !me.stopDisabled && !me.genNotifications)) {
						me.menuManager.notification.notify("Pause", 15, 40, 15, true);
					}
				} else {
					// step
					me.nextStep = true;
					me.afterEdit("");

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
			if (this.engine.multiNumStates > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)) {
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
			this.engine.anythingAlive = 1;
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

	// drag help
	View.prototype.dragHelp = function(me, y) {
		// compute the movement
		var dy = (me.lastDragY - y) / me.helpFontSize;

		// scroll help text
		if (me.lastDragY !== -1) {
			if (dy > 0) {
				me.scrollHelpDown(me, dy);
			} else {
				if (dy < 0) {
					me.scrollHelpUp(me, -dy);
				}
			}
		}
	};

	// drag errors
	View.prototype.dragErrors = function(me, y) {
		// compute the movement
		var dy = (me.lastDragY - y) / me.helpFontSize;

		// scroll errors
		if (me.lastDragY !== -1) {
			if (dy > 0) {
				me.scrollErrorsDown(me, dy);
			} else {
				if (dy < 0) {
					me.scrollErrorsUp(me, -dy);
				}
			}
		}
	};

	// drag grid (pan)
	View.prototype.dragPan = function(me, x, y) {
		// compute the movement
		var dx = (me.lastDragX - x) / me.engine.camZoom,
			dy = ((me.lastDragY - y) / me.engine.camZoom) / (me.engine.isTriangular ? ViewConstants.sqrt3 : 1),
			angle = 0,
			sinAngle = 0,
			cosAngle = 0;

		// pan grid
		if (me.lastDragY !== -1) {
			// check for hex or triangular grid
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
			} else {
				// pause playback if controls locked because of Waypoint animation
				if (me.waypointsDefined && !me.waypointsDisabled) {
					me.playList.current = me.viewPlayList(ViewConstants.modePause, true, me);
				}
			}
		}
	};

	// drag draw
	View.prototype.dragDraw = function(me, x, y) {
		var wasPlaying = me.generationOn,
			savedIndex = me.currentEditIndex;

		if (!me.pickMode) {
			// suspend playback
			if (me.generationOn && me.pauseWhileDrawing) {
				me.generationOn = false;
				me.playbackDrawPause = true;
			}
			// if playback was on then save undo record
			if (wasPlaying) {
				// just save generation
				me.currentEditIndex = 0;
				me.afterEdit("");
				me.currentEditIndex = savedIndex;
			}
			// draw cells
			me.drawCells(x, y, me.lastDragX, me.lastDragY);
			// if playback was on then save undo record
			if (wasPlaying) {
				me.afterEdit("");
			}
		}
	};

	// drag select
	View.prototype.dragSelect = function(me, x, y) {
		if (!me.isPasting) {
			me.doDragSelect(me, x, y);
		}
	};

	// process drag for selection
	View.prototype.doDragSelect = function(me, x, y) {
			// selection box
		var box = me.selectionBox,

			// flag if off the grid
			offGrid = false,

			// offset to middle of grid
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),

		    // bounded grid top left
			/** @type {number} */ boxOffset = (me.engine.isMargolus ? -1 : 0),
		    /** @type {number} */ leftX = Math.round((me.engine.width - me.engine.boundedGridWidth) / 2) + boxOffset,
		    /** @type {number} */ bottomY = Math.round((me.engine.height - me.engine.boundedGridHeight) / 2) + boxOffset,

		    // bounded grid bottom right
		    /** @type {number} */ rightX = leftX + me.engine.boundedGridWidth - 1,
			/** @type {number} */ topY = bottomY + me.engine.boundedGridHeight - 1;

		// check for infinite dimension bounded grid
		if (me.boundedGridType !== -1) {
			if (me.engine.boundedGridWidth === 0) {
				leftX = 0;
				rightX = me.engine.width - 1;
			}
			if (me.engine.boundedGridHeight === 0) {
				bottomY = 0;
				topY = me.engine.height - 1;
			}
		}

		// check for drag start
		if (x !== -1 && y !== -1) {
			// convert display coordinates to cell location
			this.updateCellLocation(x, y);

			// check if this is the start of a drag
			if (me.lastDragY === -1) {
				// save screen location so a click can be detected
				// if button released without mouse moving
				me.selectStartX = x;
				me.selectStartY = y;
				me.isSelection = false;
				me.afterSelectAction = false;
			} else {
				// check if there is a selection being drawn
				if (!me.drawingSelection) {
					if (x !== me.selectStartX || y !== me.selectStartY) {
						offGrid = false;
						// check if the cell is inside any bounded grid
						if (me.engine.boundedGridType !== -1) {
							if (me.cellX < leftX || me.cellX > rightX || me.cellY < bottomY || me.cellY > topY) {
								offGrid = true;
							}
						}
						if (!offGrid) {
							// create a selection
							me.drawingSelection = true;
							box.leftX = me.cellX - xOff;
							box.rightX = box.leftX;
							box.bottomY = me.cellY - yOff;
							box.topY = box.bottomY;
						}
					}
				} else {
					// extend selection
					box.rightX = me.cellX - xOff;
					box.topY = me.cellY - yOff;
				}

				// check grid for growth
				if (me.drawingSelection) {
					me.checkSelectionSize(me);
					xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
					yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);
				}

				// clip to bounded grid if specified
				if (me.drawingSelection && me.engine.boundedGridType !== -1) {
					// adjust for mid-grid
					leftX -= xOff;
					rightX -= xOff;
					bottomY -= yOff;
					topY -= yOff;

					// test against grid boundaries
					if (box.leftX < box.rightX) {
						if (box.leftX < leftX) {
							box.leftX = leftX;
						}
						if (box.rightX > rightX) {
							box.rightX = rightX;
						}
					} else {
						if (box.rightX < leftX) {
							box.rightX = leftX;
						}
						if (box.leftX > rightX) {
							box.leftX = rightX;
						}
					}
					if (box.bottomY < box.topY) {
						if (box.bottomY < bottomY) {
							box.bottomY = bottomY;
						}
						if (box.topY > topY) {
							box.topY = topY;
						}
					} else {
						if (box.topY < bottomY) {
							box.topY = bottomY;
						}
						if (box.bottomY > topY) {
							box.bottomY = topY;
						}
					}
				}
			}
		}
	};

	// remove selection
	View.prototype.removeSelection = function(me) {
		me.isSelection = false;
		me.afterSelectAction = false;
		me.afterEdit("cancel selection");
		me.drawingSelection = false;
	};

	// drag ended for select
	View.prototype.dragEndSelect = function(me) {
		if (me.isPasting) {
			// perform paste at the mouse position
			me.performPaste(me, me.cellX, me.cellY, true);
		} else {
			me.doDragEndSelect(me);
		}
	};

	// auto shrink a selection
	View.prototype.autoShrinkSelection = function(me) {
		var selBox = me.selectionBox,
			zoomBox = me.engine.zoomBox,
			leftX = selBox.leftX,
			bottomY = selBox.bottomY,
			rightX = selBox.rightX,
			topY = selBox.topY,
			swap = 0,
			minX = 0,
			maxX = 0,
			minY = 0,
			maxY = 0,
			x = 0,
			y = 0,
			state = 0,
			population = 0,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		// order bottom left to top right
		if (leftX > rightX) {
			swap = leftX;
			leftX = rightX;
			rightX = swap;
		}
		if (bottomY > topY) {
			swap = bottomY;
			bottomY = topY;
			topY = swap;
		}

		// clip to pattern
		if (leftX < zoomBox.leftX - xOff) {
			leftX = zoomBox.leftX - xOff;
		}
		if (bottomY < zoomBox.bottomY - yOff) {
			bottomY = zoomBox.bottomY - yOff;
		}
		if (rightX > zoomBox.rightX - xOff) {
			rightX = zoomBox.rightX - xOff;
		}
		if (topY > zoomBox.topY - yOff) {
			topY= zoomBox.topY - yOff;
		}

		// find min max for X and Y
		minX = rightX + 1;
		maxX = leftX - 1;
		minY = topY + 1;
		maxY = bottomY - 1;

		// look for alive cells
		for (y = bottomY; y <= topY; y += 1) {
			for (x = leftX; x <= rightX; x += 1) {
				state = me.engine.getState(x + xOff, y + yOff, false);
				if (state > 0) {
					// update min and max if alive cell found
					if (y < minY) {
						minY = y;
					}
					if (y > maxY) {
						maxY = y;
					}
					if (x < minX) {
						minX = x;
					}
					if (x > maxX) {
						maxX = x;
					}
					// update population
					population += 1;
				}
			}
		}
		
		// save section box if there were live cells
		if (population > 0) {
			selBox.leftX = minX;
			selBox.bottomY = minY;
			selBox.rightX = maxX;
			selBox.topY = maxY;
		}
	};

	// process drag end for selection
	View.prototype.doDragEndSelect = function(me) {
		var selBox = me.selectionBox,
			width = 0,
			height = 0;

		// check if a selection was made
		if (me.drawingSelection) {
			me.isSelection = true;
			me.drawingSelection = false;
			me.afterSelectAction = false;
			// check if auto-shrink is on
			if (me.autoShrink) {
				me.autoShrinkSelection(me);
			}
			// check if there is still a selection
			if (me.isSelection) {
				// get the width and height of the selection
				if (selBox.rightX < selBox.leftX) {
					width = selBox.leftX - selBox.rightX + 1;
				} else {
					width = selBox.rightX - selBox.leftX + 1;
				}
				if (selBox.topY < selBox.bottomY) {
					height = selBox.bottomY - selBox.topY + 1;
				} else {
					height = selBox.topY - selBox.bottomY + 1;
				}
				me.afterEdit("selection (" + width + " x " + height + ")");
			} else {
				me.removeSelection(me);
			}
		} else {
			me.removeSelection(me);
		}
	};

	// drag ended for pick
	View.prototype.dragEndPick = function(me, x, y) {
		var state = 0;

		// check if on window
		if (x!== -1 && y !== -1) {
			me.justPicked = true;
			state = me.readCell();
			if (me.pickReplace) {
				me.replaceCells(state);
				// turn off pick
				me.pickReplace = false;
				me.pickToggle.current = me.togglePick([false], true, me);
			} else {
				// set pen colour
				me.penColour = state;
				// highlight state in state list UI
				me.switchToState(state);
			}
		}
	};

	// drag ended for draw
	View.prototype.dragEndDraw = function(me) {
		// resume playback if required
		if (me.playbackDrawPause) {
			me.generationOn = true;
			me.playbackDrawPause = false;

			// set the auto update mode
			me.menuManager.setAutoUpdate(true);
		}
		// end of edit
		if (me.currentEditIndex > 0) {
			// check if shrink needed
			me.engine.doShrink();

			me.afterEdit("");
		}
	};

	// view menu background drag
	View.prototype.viewDoDrag = function(x, y, dragOn, me, fromKey) {
		// check if on window (and window has focus - to prevent drawing when clicking to gain focus)
		if (x !== -1 && y !== -1 && me.menuManager.hasFocus) {
			// check if this is a drag or cancel drag
			if (dragOn) {
				// ignore if settings displayed
				if (!me.navToggle.current[0]) {
					// check if help or settings displayed
					if (me.displayHelp) {
						me.dragHelp(me, y);
					} else {
						// check if errors are displayed
						if (me.displayErrors) {
							me.dragErrors(me, y);
						} else {
								// check if panning
							if (!(me.drawing || me.selecting) || fromKey) {
								me.dragPan(me, x, y);
							} else {
								// check if drawing
								if (me.drawing) {
									// drawing
									me.dragDraw(me, x, y);
								} else {
									if (me.selecting) {
										// selecting
										me.dragSelect(me, x, y);
									}
								}
							}
						}
					}
				}

				// save last drag position
				me.lastDragX = x;
				me.lastDragY = y;
			} else {
				// check if just got focus
				if (me.lastDragX !== -1) {
					// ignore if help or settings displayed
					if (!(me.displayHelp || me.navToggle.current[0])) {
						// drag finished so check for drawing
						if (me.drawing) {
							// see if pick mode was active
							if (me.pickMode) {
								me.dragEndPick(me, x, y);
							} else {
								// end of drawing
								me.dragEndDraw(me);
							}
						} else {
							if (me.selecting) {
								// end of selecting
								me.dragEndSelect(me);
							}
						}
					}

					// clear last drag position
					me.lastDragX = -1;
					me.lastDragY = -1;
				} else {
					// just got focus
					if (!(me.displayHelp || me.navToggle.current[0])) {
						if (me.pickMode) {
							me.menuManager.notification.notify("Now click on a cell", 15, 180, 15, true);
						} else {
							if (me.isPasting) {
								me.menuManager.notification.notify("Now click to paste", 15, 180, 15, true);
							}
						}
					}
				}
			}
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
			icons.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABpAAAAAoCAIAAAB2CC60AAAABnRSTlMAAAAAAABupgeRAAASX0lEQVR4nO2dWZLkKgxFnR294FpK7Zj34dcEiRiEkATY93xUZNlYEoMYZGxfFwAAAAAAAAAAAAAAAAAA7Pj5+TE9/masyxZl/kLuSqdVb308S9NIYHcWAAAAAAAAUOTvagMA0CeEkB35fD4OklfpXUUIwccMN0UALOH39/fn5+f399ftuCxePHM25fZon79Mk8DpYDwCAFggc3l0FAAALRCwA4/FYqRsh+fW6vWHLolVJigWMh8AygEoQoN6d7iNHtc6G0G0DliA8QgAIGbI0zn9ADoKAIAWf1YbAIAJ99zdTn5ttF6ldxVvyy8Aj6S4L8/orFu0bp97G8AHjEfguq7wzWpzwBlkrp12JtTr0Q8AADxBwA48Fru5e3vWvkrvKt6WXwCeyv3krNHZ+DvbAWf0F73HO8F4NBqlOi6kFXpc1/X5BzM9ABlD/l5sSGhaAAAt8EgseDIWyzbmTvglelfxtvwC8CQ8t9ddLtG0LCYIVlHcopKuY4eOM2sT49HFNvguW3HuxCGJycKsXU4zEmN2jUtmLAFPhdNy0jQ+Dem4jggAAAAokw2ciuNoW/IqvZQlXyzVulm9+U3vVV+J3blMUjasvg1NytjhK7FZ4vmz7ZYca6S4z6W2/6V7PNMiYMl+nCVKHTCqXL5qseViOcsri99s5huY7MLJImpcXjsluGRzju4W9qfdYLrNLE2jW1Pqlb6qi144NABwIlMv1LSg5nijN8eGjE+FzORavdC0DBOrjkpVypkjJ9OrhUrVCIQ46B2KqamQPd2WnVXJr7rMhi6m8LXlfJn1ybpiF3ZZRbK2tINJlHQbmttv+qNokvrZm7TVxTpS3IQVeDvsaALm1N9uoOcrHfXcYtFZOyxzQNcq9uXjkdEEZhRmtRZdb1SR4NrJQadxeaMh8TflmaI1J4y/u10cM+WoXj6b6+XXSHG8mOyWR+2ZOVu75P7huQl6oV4V1L24zfIBBWzNqrh1qKCVvitk0mzZ5V2rnOuCalQpZ44c/8w+kiU77I5j3rk8y9nCKdT7PVqkC91ZpcuyZtWuulVnr8oOu1piPrQpctJzhjnThiRTKjCjLUcxRwLcStuBTaztlp5K2baFj141qXQHaRx189nne4euE3X91Mh5V+ktWkJ/Fw9mR4bskRkvvkqxjvbXq6JuXuMOjfmdLClPlarsv8Mu7HHDcFsUK55f1KaVsknXEPCmBmBM+tqRd3Z0My97yiapRSFp8S7ZI1w8vlUt0z1o99cb7I6nZxtWGZ29SKvTqo7sxvtQ26atpd2eL40eY4lS8BKy0U22kxQYoTLszksDN8V+tTiIfEqfIC8myM4OVZBgYiZuAxbj7856xagv9kcvgY/Ps3BJMg/3oxOYJlJ0ZzxZ4ICj0aLBbTWNO9GjwBHEDs3tVcF78lQXe3OdMokxNa031nXPxtDhaDRNwEy0rnFVfN42vVZl4T2qVKARvI12zC6mMVJtIXYTVBxQ0HW0VwfPLnNT6Dww/NsWR+8DxQBcuxlM1gi9tj1kaNV+Ojrz/6qo3hYMuM/AIYRiythXYhG2u1H3XrFA3Qa3Ya90nEdNwl/F7c9oc/LPbDr92rDxb042YR2Kj9jVdbcej/YpReI+uNoWPLuzDrN88VqCk17c8hWVehL1wneegdEMlr5bCg2mzWjXERPXtnd50tZr11lZ6KXjRTFeFjvh4qa5eLlgS13XvKI6XS0XonUEhzF3lR+9jQfsTR4L2N28eSR+sPNsm7WzPAqk8CvOs/nFHiyEkG61czNgE1QCDaMVV7xxrcW2ndiGqHxWoi25xm477NKrhuSP2/U/svX2qphd1CuY+2lNF0+ZdtY25szInNyn09hkZ12e/OdFUrRaiyD9/g0MWNAIz2UhPBozbcT4VGjvjdUdRgXRuqcu0DCZfBLP2Jv8R3xlXOu+BNP8ipuL4i5oFTlGbG4eOA4690Ibc8C0kDnCTxmYHRBH3LJvzg6dvclm+Vrel8pJd0MMSeAnFkdkxLtj/Pso046xKPl0D/38o3hQxrxJ8Xdaobrr/GIo0D+zmUlLVA8Z6a8U1KDVUayg9C7vpzQKKPaZ3WjCZ/ouTnHcHPpL5Yzq1bJfBSwHwJ7IA3Y3b2jZC/PoM5k4ogaPMBLsT9aQXjtjtritlJWts892s8PJb2iim+amFvOyO57h//WJIIqmDfGR3vkfsqq4WuPLHzJv4QgYklcHKMqsnXptn2yHW5HG/u3ZEzZBNJDO5NHOd+bzb/9abM/xd23wipfEH64WayCI1p2YzRp0evZa1ItibdkWAykO0RVdqoYKSlYl2zW9NeGj6btCBFNwsd6aDQ05zGRivRnpzZN2gkl1XUUydcchqN/uglyd9vNukaEFs2x1PUqcb9GD9HjG8nLWLSJFacx+MpvbWYcLqXamkEbfm07EG1PYUWOyXWluv7sG6J5NCd935mmZCEjlBHL/v5Y+Y2ZE41w74wKTBhdVN+zJVqeyCmJ2uY0jKY+fAJiiUqFUJp0zt1W0tXMGpm6aWoJ51fOoFD6/G9Edc1+olw7uNEGmPe3EZmzgXz6jqDZu8v9SOaN6Z1B3KCaTNcuUYzpn5ujVDewsH8GXl6eJ3iDFSK9W+q6QtliL7M/nV6CUmc1uSi2NApNAg1p0Ses4h6HKcqjZWhMabVfWZVs7zjSSk2yytGmJdd3W2pFTmTO6GolT+bW/DRva9tyVXtwlZ3o8S1BLo3I2khbapXfrNZOj3sbaepnqjNq/BaE0LquIZXqoXXdhx84GR8MULeR0mDUzRgXy09ipnkfdibRSvlbvkIXM9pMlkxWCURbotdTy0b9UzqheLftllwuYt9nfj/go6l2Vha2MUdE7+0gsZZNaEeNsf1FXI/7auG2oonp/DjX7IgODOM0zWJW72l6PZxC+p1B2Kqy1DBG+b7H67JJo3GoWcD89SjejWR/PmPmaRPds/J0Vl9ZTCamcWCnzYt/JZHtuiOUnXn43fpTw79nhndvecsMWPoW0UHVqw1oDTCnOXcUTWl1pNeiu3sY8Kro2PdvYXM/fKDeZNYGE4rgp2GE36lwW4/4Qj19kRcI42eUzqhUteTn6AbsbFPTmHF07RxsPbraatm5ljAoNHwl6S3GxJyoWePiO1pnqSmUWJ6/qitzwfJOdQ3HNh1DfTK1qUJ5tdi4fWqch2W1nN2MvLv98usqFql+L7kDsP6xfyQQpC+TFlpOepc0pHXpGG1sM989kYUaCIFp3okOhHxhFVlwoZF2sAnYAAJCRdt/OXXkxrNON9ZxFSPZ33BMph0IWqLCO1qUHjSq3Nnm10PU8HIrr3LXEsxmq9EOr7+54t+oN0pJMDaNDxgrrwKMotvyZEJKiNEoatr6SaF3NZS4Svyual05CDnIrQbRuq44OgAdjFbDT2uwKjDi6do42/s2kFedZiQ8LzBWhM6fiGmx+gkUvXzUfXRWtu564w870Ydji51Oww+4sZIVJbxtko0B6d6FxR+eUPRExBLbakDJpx0jttPDKohaf8lmo+uXQYt9HWlF4bBgN4TTSTQ9mZydj90x/VBzpBNG6I7rljFX9AB3magd3Q1Zc6Gx10Q/YnT4iOttf1NVw3eKpV/nSoWaDSPf+pIU6/vETaczY4mL40svyDj64dsvkU281mz4YG39nxaU1W03lnLuWWEtcYRZXp1p0pR1acbt1AlstBdNhyNkkO9WblO2GREdQ8QhdaRRaj+nwlKXMTsVGlRoZj2zVIRQpjptDf6mcUb1a9g/hXzvMcLCF3lG0bKOiZix5OZoBuycVrmdeZnRN2nlcfR1ncAqnG3pDV/Ux3v3UUBqJA/wDCrm7Srzbku7SYm25rY3WXQY77O5taMWvu5oeT8+2bVM86xBN+3iFUMW5OGWpb2Rno2pOKZkiIaF4UIDYjGwu8UmW1o0ZyNHl7wkKqo3uJNZ0SpxKptUaA3PXtxMxDZtpJ11/1B3mahOb9l8t7UtwXmoVde28DJm3befcnYXOnEmxPmp6aypG03eF0At9iqKopT2KzKjrqs7kq5QzRw7HmMeQZZYOfpwsN3a1GNH91uTN0EzCaHVdC8wJgjvLy5kW0WgudAtZNlGbN8A0WtfO1IfxShp+mkga1fL8XTTA9N9IIPsUdBtGIPf/jWhPHubTO5OVWK3/HBLIuZzZmWxYYhtSa/bxeNsvtAZumfdxruqmsVOdJr5/LGmT/G5Et8PZvPu6RBbGPioblTJnoWOK5yjT9uhJ4Vdp3OT/pXJG9WrZryKKyYzGVf7LR7FUjQTOmHHjX55Weqs3+75R1lrXq5W+K2RUkVaBMOVrqWNq5yfYTdER0Dxq5bqxlUblOIch+42quFiSio3Ks5ztciGm5q0NVDRyDp5CcTec6XGmARZnb2JfF/9Vqb5MjkOTkDVsRXfQpdZVuqm26zdeRa24Uo8TXD6aWFZrnKu6aexUx5QqCIykBmil1NW7CpmF4Xv6XTzLOUgF8m3gWMg3YEhyIOPm6F8qZ1Svlv1aAu2cN9UyZMykRnCtK09bvdaNdVSvVvquEJl5k8XSFauukWlD10KtnDLNeBg0m1oZR8AuiqXlqdioFgbsikf8qXl019PFujgHT8ehXcVTxTTMs6NKI9ZVFr7XEkYqxK16z9Ets8fTQtN+41W0y4rjF0OlrV5rnKu6aexUX3rRuplWzReios5ImgViC0MyP6QHsyOh50e1C8WoC2xoGf37SOycV2yGj8Zn41yeuk3or8CC5XsaF8J53OlQtn0ZwZvb2+ns1qKiPc9oVDvkYqjfUH8dxq16h3I4jvhKu+Ijq3Znr+sK9k8SWctX7NlM7RSQZm0rw47gYUNMl/ajtZ6WADBDbMnth0/j31B6fpZKaxwZNS9zKIseRvYOu0f2dQ9e7INDGQvYPdItBah7sjhYplsjG8bs0OTOBXX3Epj9xmR7qN1hRjOT0d5DR5PNn43xO4dZvulaYn7hlLnMU9c8b6O9ht+HhmvsbPYmbDhPphQt1I0mUxX+LceuIrqzi/SU+qshuxqNQLQuA2E7MENjsBA4Djdg92yflKHrybFes1d4Uo2X5Up1q7nI41ud+l04wAGFrI5/v4Fo3STdfXB2Z8/dYae4RqUxuxlpFiiu6rd6s7gdm5sHtEidd89K110ovoFsvOiGs2ncqniqLXDUwvRfowWg4O/jQdgOiCl2xTLH+cNR9hKflKFYPnxRppWySXVvYgZ4GGhXJ5Iu1++3P2BgmqT2/Vbrs1fpeSKVqXAqJy6Z5sVGyeo7SmgbFr/cZHOyHIWE+wgtik+Cn6EaxA5qtSEtbu/IQsb7m70P+xdU0cL9zV5CbPnRKTLvoB11PE69Jg1mKfbnn29UZF424+/OesWcOBiBHSj2DwJaATu0Tj4WZaVVx/Oq/XHYGeEjZJVeNwLBXyZNH8jd70PXfiAlLimfVI/FD63G7W8Wx1PaCYzOhlI0rRvT6R5P/y2uoxTRvVGnImeIRm95dFe5w3h0l96qUbuhOpAtPzFs97x+1YH9i2vhIuIsPt9PONXcIZtPZgdTQv1WhBj1ni0TXtPFPH6WXjHoJ4GAdnfBFaJkDAAbkU1MFVdubclL9M58yFVG40m3a9HTT3TYVh9Tl5ezaQACLCTdkub5m2PPzNlGyvC9w+7+kXVx8ffQ8XTFpeUygUQD52X6q3gb/uNRIE/MTaqWUVPtbJJMHeeqbho71Sei5QivIovfXYwCzJKlY9DOTcti/N1ZLwAAgF1IO3fTO1GNuz2eeim16JLWcUrQ+8q7oigLrMu2sS+JYR04krvSi7vkTI+nZ+lv3bMRHweHv7yZVeNRd3uIAJnN2YTB3x3s8ttN41nU4LWkbabWeHQbFRoqAACA59AdRI3kr9JLcQ7Y6WbcuhgnQcAOWLCqXWVni8lUzqZYN+awd9AfmPKq8ajBU5f34ngc4nRgntq0n5MYAABk9D86AcChBLNd6O031KzSu4q35Xch6gsVrFtAiumXKOLvkLzDzujv5k8hATswHkWOfh1hg482qzMEtoDp3elzst1r0boAACr8XW0AACZYr9Zqc/dVelfhk19Mei7M/IAlnl+fyN7sY/1XViDgRDAeAQBkUL9uO3vAp1oAAF4gYAceSxrY0hpTOcGyVXr9obMZlfxSmVgjAaDL5JOzgrMRROuABRiPAACKxM101N/jkYBvegAA7EHADjwQu7GzLXmV3lW4WbVn9gE4F/r46h1uqz3WOn82cruzz1/wHjAeAQDUWTXtBwAAAAAAAAAAAAAAAADAjvwHXOCRqfndkrIAAAAASUVORK5CYII=";
				
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
		this.iconManager.add("inside", w, h);
		this.iconManager.add("undo", w, h);
		this.iconManager.add("redo", w, h);
		this.iconManager.add("drawpause", w, h);
		this.iconManager.add("invertselection", w, h);
		this.iconManager.add("autoshrink", w, h);
		this.iconManager.add("selectlibrary", w, h);
		this.iconManager.add("cut", w, h);
		this.iconManager.add("copy", w, h);
		this.iconManager.add("paste", w, h);
		this.iconManager.add("flipx", w, h);
		this.iconManager.add("flipy", w, h);
		this.iconManager.add("rotatecw", w, h);
		this.iconManager.add("rotateccw", w, h);
		this.iconManager.add("random", w, h);
		this.iconManager.add("smart", w, h);
		this.iconManager.add("outside", w, h);
		this.iconManager.add("select", w, h);
		this.iconManager.add("reverse", w, h);
		this.iconManager.add("uturn", w, h);
		this.iconManager.add("nudgeright", w, h);
		this.iconManager.add("nudgeleft", w, h);
		this.iconManager.add("nudgeup", w, h);
		this.iconManager.add("nudgedown", w, h);
	};

	// check if a rule is valid
	View.prototype.ruleIsValid = function(ruleName) {
		var result = false,
			patternText = "x = 1, y = 1, rule = ",
			pattern = null;

		// check if the rule name is blank
		if (ruleName === "") {
			// default to Conway's Life
			ruleName = "Life";
		}
		patternText += ruleName + "\nb!";

		// attempt to build a pattern from the string
		try {
			// create a pattern
			pattern = this.manager.create("", patternText, this.engine.allocator, null, null, [], this);
		}
		catch(err) {
			pattern = null;
		}

		// check if pattern was valid
		if (pattern && pattern.lifeMap) {
			result = true;
			pattern = null;
		}

		return result;
	};

	// change rule
	View.prototype.changeRule = function(me) {
		var patternText = "",
			index = -1,
			result = window.prompt("Change rule", (me.patternAliasName === "" ? me.patternRuleName : me.patternAliasName) + me.patternBoundedGridDef);

		// check if the prompt was confirmed
		if (result !== null) {
			if (me.ruleIsValid(result)) {
				if (result === "") {
					result = "Life";
				}
				// check for bounded grid
				index = result.indexOf(":");
				if (index !== -1) {
					me.patternRuleName = result.substr(0, index);
					me.patternBoundedGridDef = result.substr(index);
				} else {
					me.patternRuleName = result;
					me.patternBoundedGridDef = "";
				}
				me.patternAliasName = "";
				patternText = me.engine.asRLE(me, me.engine, true, me.engine.multiNumStates, me.engine.multiNumStates, [], true);

				// restore previous size
				if (me.isInPopup) {
					me.displayWidth = me.origDisplayWidth;
					me.displayHeight = me.origDisplayHeight;
				}

				// start viewer
				me.startViewer(patternText, false);
			} else {
				me.menuManager.notification.notify("Invalid rule", 15, 180, 15, true);
			}
		}
	};

	// convert a pattern from one rule to another
	View.prototype.convertPattern = function(fromPostfix, toPostfix, fromStates, toStates, mapping) {
		var currentRule = this.patternRuleName,
			patternText = "";

		// remove the from postfix if present
		if (fromPostfix !== "") {
			currentRule = currentRule.substr(0, currentRule.length - fromPostfix.length);
		}

		// add the to postfix
		currentRule += toPostfix;

		// set new rule name
		this.patternRuleName = currentRule;
		this.patternAliasName = currentRule;
		patternText = this.engine.asRLE(this, this.engine, true, fromStates, toStates, mapping, true);

		// restore previous size
		if (this.isInPopup) {
			this.displayWidth = this.origDisplayWidth;
			this.displayHeight = this.origDisplayHeight;
		}

		// start viewer
		this.startViewer(patternText, false);
	};

	// convert [R]History or [R]Standard to [R]Super
	View.prototype.convertToSuper = function(me) {
		var fromPostfix = (me.engine.isLifeHistory ? "History" : ""),
			fromStates = (me.engine.isLifeHistory ? 7 : 2),
			toPostfix = "Super",
			toStates = 26,
			mapping = (me.engine.isLifeHistory ? ViewConstants.historyToSuperStates : ViewConstants.standardToSuperStates);

		me.convertPattern(fromPostfix, toPostfix, fromStates, toStates, mapping);
	};

	// convert [R]Standard or [R]Super to [R]History
	View.prototype.convertToHistory = function(me) {
		var fromPostfix = (me.engine.isSuper ? "Super" : ""),
			fromStates = (me.engine.isSuper ? 26 : 2),
			toPostfix = "History",
			toStates = 7,
			mapping = (me.engine.isSuper ? ViewConstants.superToHistoryStates : ViewConstants.standardToHistoryStates);

		me.convertPattern(fromPostfix, toPostfix, fromStates, toStates, mapping);
	};

	// convert [R]History or [R]Super to [R]Standard
	View.prototype.convertToStandard = function(me) {
		var fromPostfix = (me.engine.isLifeHistory ? "History" : "Super"),
			fromStates = (me.engine.isLifeHistory ? 7 : 26),
			toPostfix = "",
			toStates = 2,
			mapping = (me.engine.isLifeHistory ? ViewConstants.historyToStandardStates : ViewConstants.superToStandardStates);

		me.convertPattern(fromPostfix, toPostfix, fromStates, toStates, mapping);
	};

	// create random HROT rule name
	View.prototype.createRandomHROT = function() {
		var result = "",
			neighbours = 0,
			range = this.engine.HROT.yrange,
			neighbourhood = "",
			lastValue = -1,
			value = 0,
			number = 0,
			added = 0,
			r2 = 0,
			width = 0,
			i = 0;

		// set the range
		result = "R" + range  + ",";

		// set the number of states
		result += "C" + this.engine.HROT.scount + ",";

		// get the max neighbour count
		neighbours = this.manager.maxNeighbours(range, this.engine.HROT.type, this.engine.HROT.customNeighbourCount);

		// set the neighbourhood
		switch (this.engine.HROT.type) {
		case this.manager.mooreHROT:
			neighbourhood = "";
			break;

		case this.manager.vonNeumannHROT:
			neighbourhood = "N";
			break;

		case this.manager.circularHROT:
			neighbourhood = "C";
			break;

		case this.manager.l2HROT:
			neighbourhood = "2";
			break;

		case this.manager.crossHROT:
			neighbourhood = "+";
			break;

		case this.manager.saltireHROT:
			neighbourhood = "X";
			break;

		case this.manager.starHROT:
			neighbourhood = "*";
			break;

		case this.manager.hexHROT:
			neighbourhood = "H";
			break;

		case this.manager.checkerHROT:
			neighbourhood = "B";
			break;

		case this.manager.hashHROT:
			neighbourhood = "#";
			break;

		case this.manager.customHROT:
			neighbourhood = "@" + this.engine.HROT.customNeighbourhood;
			if (this.engine.isHex) {
				neighbourhood += "H";
			} else {
				if (this.engine.isTriangular) {
					neighbourhood += "L";
				}
			}
			break;

		case this.manager.tripodHROT:
			neighbourhood = "3";
			break;

		case this.manager.asteriskHROT:
			neighbourhood = "A";
			break;

		case this.manager.triangularHROT:
			neighbourhood = "L";
			break;

		case this.manager.gaussianHROT:
			neighbourhood = "G";
			break;

		case this.manager.weightedHROT:
			neighbourhood = "W" + this.engine.HROT.customNeighbourhood;
			if (this.engine.isHex) {
				neighbourhood += "H";
			} else {
				if (this.engine.isTriangular) {
					neighbourhood += "L";
				}
			}
			break;
		}

		// pick number of survival neighbour counts
		number = (this.randGen.random() * neighbours) / neighbours;
		result += "S";
		lastValue = -1;
		i = 0;
		added = 0;
		while (i < neighbours) {
			// check whether to add this neighbour count
			if (this.randGen.random() < number) {
				// check if this is part of a run
				if (lastValue === -1) {
					// start of new run
					if (added > 0) {
						result += ",";
					}
					result += String(i);
					lastValue = i;
					added += 1;
				}
			} else {
				// check if there is a run in progress
				if (lastValue !== -1) {
					// add range
					if (lastValue !== i - 1) {
						result += "-" + String(i - 1);
					}
					lastValue = -1;
				}
			}
			i += 1;
		}

		// finish any final run
		if (lastValue !== -1 && lastValue !== i - 1) {
			result += "-" + String(i - 1);
		}

		// add a single value if nothing was added
		if (added === 0) {
			value = (this.randGen.random() * neighbours) | 0;
			result += String(value);
		}

		// add random birth range excluding B0
		result += ",B";

		// pick number of birth neighbour counts
		number = (this.randGen.random() * (neighbours - 1)) / (neighbours - 1);
		lastValue = -1;
		i = 1;
		added = 0;
		while (i < neighbours) {
			// check whether to add this neighbour count
			if (this.randGen.random() < number) {
				// check if this is part of a run
				if (lastValue === -1) {
					// start of new run
					if (added > 0) {
						result += ",";
					}
					result += String(i);
					lastValue = i;
					added += 1;
				}
			} else {
				// check if there is a run in progress
				if (lastValue !== -1) {
					// add range
					if (lastValue !== i - 1) {
						result += "-" + String(i - 1);
					}
					lastValue = -1;
				}
			}
			i += 1;
		}

		// finish any final run
		if (lastValue !== -1 && lastValue !== i - 1) {
			result += "-" + String(i - 1);
		}

		// add a single value if nothing was added
		if (added === 0) {
			value = (this.randGen.random() * (neighbours - 1)) | 0 + 1;
			result += String(value);
		}

		// add the neighbourhood
		if (neighbourhood !== "") {
			result += ",N" + neighbourhood;
		}

		return result;
	};
	// create random LtL rule name
	View.prototype.createRandomLTL = function() {
		var result = "",
			neighbours = 0,
			range = this.engine.HROT.yrange,
			neighbourhood = "",
			value = 0,
			r2 = 0,
			width = 0,
			i = 0;

		// set the range
		result = "R" + range  + ",";

		// set the number of states
		result += "C" + this.engine.HROT.scount + ",";

		// set the middle
		result += "M1,";

		// get the max neighbour count
		neighbours = this.manager.maxNeighbours(range, this.engine.HROT.type, this.engine.HROT.customNeighbourCount);
		neighbours += 1;

		// set the neighbourhood
		switch (this.engine.HROT.type) {
		case this.manager.mooreHROT:
			neighbourhood = "M";
			break;

		case this.manager.vonNeumannHROT:
			neighbourhood = "N";
			break;

		case this.manager.circularHROT:
			neighbourhood = "C";
			break;

		case this.manager.l2HROT:
			neighbourhood = "2";
			break;

		case this.manager.crossHROT:
			neighbourhood = "+";
			break;

		case this.manager.saltireHROT:
			neighbourhood = "X";
			break;

		case this.manager.starHROT:
			neighbourhood = "*";
			break;

		case this.manager.hexHROT:
			neighbourhood = "H";
			break;

		case this.manager.checkerHROT:
			neighbourhood = "B";
			break;

		case this.manager.hashHROT:
			neighbourhood = "#";
			break;

		case this.manager.customHROT:
			neighbourhood = "@" + this.engine.HROT.customNeighbourhood;
			if (this.engine.isHex) {
				neighbourhood += "H";
			} else {
				if (this.engine.isTriangular) {
					neighbourhood += "L";
				}
			}
			break;

		case this.manager.tripodHROT:
			neighbourhood = "3";
			break;

		case this.manager.asteriskHROT:
			neighbourhood = "A";
			break;

		case this.manager.triangularHROT:
			neighbourhood = "L";
			break;

		case this.manager.gaussianHROT:
			neighbourhood = "G";
			break;

		case this.manager.weightedHROT:
			neighbourhood = "W" + this.engine.HROT.customNeighbourhood;
			if (this.engine.isHex) {
				neighbourhood += "H";
			} else {
				if (this.engine.isTriangular) {
					neighbourhood += "L";
				}
			}
			break;
		}

		// add random survival range
		value = (this.randGen.random() * neighbours) | 0;
		result += "S" + String(value);
		value = ((this.randGen.random() * (neighbours - value)) | 0) + value;
		result += ".." + String(value);

		// add random birth range excluding B0
		value = ((this.randGen.random() * (neighbours - 1)) | 0) + 1;
		result += ",B" + String(value);
		value = ((this.randGen.random() * (neighbours - value)) | 0) + value;
		result += ".." + String(value);

		// add the neighbourhood
		result += ",N" + neighbourhood;

		return result;
	};

	// create random Wolframe rule name
	View.prototype.createRandomWolfram = function() {
		var result = "W",
			value = 0;

		// pick an even number from 0 to 254
		value = ((this.randGen.random() * 127) | 0) * 2;
		result += String(value);

		return result;
	};

	// create random LifeLife rule name
	View.prototype.createRandomLifeLike = function(noB0) {
		var result = "B",
			i = 0,
			valueB = 0,
			valueS = 0,
			neighbours = 8,
			postfix = "",
			birthChance = null,
			survivalChance = null;

		// get neighbourhood
		if (this.engine.isHex) {
			switch (this.engine.hexNeighbourhood) {
				case this.manager.hexAll:
					neighbours = 6;
					postfix = this.manager.hexPostfix;
					break;
				case this.manager.hexTripod:
					neighbours = 3;
					postfix = this.manager.hexTripodPostfix;
					break;
			}
		} else{
			if (this.engine.isTriangular) {
				switch (this.engine.triangularNeighbourhood) {
				case this.manager.triangularEdges:
					neighbours = 3;
					postfix = this.manager.triangularEdgesPostfix;
					break;
				case this.manager.triangularInner:
					neighbours = 6;
					postfix = this.manager.triangularInnerPostfix;
					break;
				case this.manager.triangularOuter:
					neighbours = 6;
					postfix = this.manager.triangularOuterPostfix;
					break;
				case this.manager.triangularVertices:
					neighbours = 9;
					postfix = this.manager.triangularVerticesPostfix;
					break;
				case this.manager.triangularAll:
					neighbours = 12;
					postfix = this.manager.triangularPostfix;
					break;
				}
			} else {
				if (this.engine.isVonNeumann) {
					neighbours = 4;
					postfix = this.manager.vonNeumannPostfix;
				}
			}
		}
		
		// compute the chance of creating each condition
		birthChance = new Uint8Array(neighbours + 1);
		survivalChance = new Uint8Array(neighbours + 1);

		// check if ALL is defined
		valueB = 50;
		valueS = 50;
		if (this.randomChanceAll !== -1) {
			valueB = this.randomChanceAll;
			valueS = this.randomChanceAll;
		}

		// check if B or S are set
		if (this.randomChanceB !== -1) {
			valueB = this.randomChanceB;
		}
		if (this.randomChanceS !== -1) {
			valueS = this.randomChanceS;
		}

		// populate chance arrays
		for (i = 0; i <= neighbours; i += 1) {
			birthChance[i] = valueB;
			survivalChance[i] = valueS;
		}

		// default B0 to 25% if ALL or B not specified
		if (this.randomChanceAll === -1 && this.randomChanceB === -1) {
			birthChance[0] = 25;
		}

		// now add any specific B or S values
		for (i = 0; i < this.randomChanceBN.length; i += 2) {
			if (this.randomChanceBN[i] <= neighbours) {
				birthChance[this.randomChanceBN[i]] = this.randomChanceBN[i + 1];
			}
		}
		for (i = 0; i < this.randomChanceSN.length; i += 2) {
			if (this.randomChanceSN[i] <= neighbours) {
				survivalChance[this.randomChanceSN[i]] = this.randomChanceSN[i + 1];
			}
		}

		// skip B0 for generations
		if (this.engine.multiNumStates > 2 || noB0) {
			i = 1;
		} else {
			i = 0;
		}

		// add remaining random birth conditions
		while (i <= neighbours) {
			if ((this.randGen.random() * 100) <= birthChance[i]) {
				result += String(i);
			}
			i += 1;
		}

		// add random survival conditions
		result += "/S";
		for (i = 0; i <= neighbours; i += 1) {
			if ((this.randGen.random() * 100) <= survivalChance[i]) {
				result += String(i);
			}
		}

		// if current pattern is multistate then keep the number of states
		if (this.engine.multiNumStates > 2 && !this.engine.isSuper) {
			result += "/" + this.engine.multiNumStates;
		}

		// add neighbourhood postfix
		result += postfix.toUpperCase();

		// return the rule name
		return result;

	};

	// create random Margolus rule name
	View.prototype.createRandomMargolus = function(isPCA) {
		var result = (isPCA ? this.manager.pcaRulePrefix.toUpperCase() + "," : "M"),
			i = 0,
			j = 0,
			value = 0,
			bit = 0,
			first15 = false,
			used = 0,
			swap = 0,
			entries = null,
			candidates = null,
			aliveCounts = null,
			swapCandidates = [],
			bitCounts = this.engine.bitCounts16;

		// check for swap rules
		if (this.randomSwap) {
			// populate the rule array 
			entries = new Uint8Array(16);
			aliveCounts = new Uint8Array(16);
			for (i = 0; i < 16; i += 1) {
				entries[i] = i;
				aliveCounts[i] = bitCounts[i];
			}

			// allocate the swap candidates array
			for (i = 0; i < 16; i += 1) {
				// get how many bits are alive at this value
				bit = bitCounts[i];
				value = 0;
				// count how many candidates there are at each value
				for (j = 0; j < 16; j += 1) {
					if (bit === bitCounts[j]) {
						value += 1;
					}
				}

				// allocate array for swap candidates
				candidates = new Uint8Array(value);

				// populate the swap candidates array
				value = 0;
				for (j = 0; j < 16; j += 1) {
					if (bit === bitCounts[j]) {
						candidates[value] = j;
						value += 1;
					}
				}
				swapCandidates[i] = candidates;
			}

			// now perform swaps ignoring the first entry
			for (i = 1; i < 16; i += 1) {
				// 50% chance of a swap
				if (this.randGen.random() <= 0.5) {
					// pick a swap target
					candidates = swapCandidates[i];
					value = (this.randGen.random() * candidates.length) | 0;
					value = candidates[value];
					swap = entries[i];
					entries[i] = entries[value];
					entries[value] = swap;
				}
			}

			// create the rule string
			for (i = 0; i < 15; i += 1) {
				result += entries[i] + ",";
			}
			result += entries[i];
		} else {
			// check for reversible rules
			if (this.randomReversible) {
				i = 16;
				// PCA rules must have 0 as the first number
				if (isPCA) {
					value = 0;
					used |= 1;
				} else {
					// Margolus rules first must be 0 or 15
					value = (this.randGen.random() * 16) | 0;
					if (value == 15) {
						first15 = true;
		
						// mark 15 and 0 used
						used |= (1 << 15);
						used |= 1;
						i -= 1;
					} else {
						// first must be 0
						value = 0;
						used |= 1;
					}
				}
				result += String(value);
				i -= 1;
	
				// create remaining entries
				while (used !== 65535) {
					// pick next entry
					value = (this.randGen.random() * i) | 0;
	
					// find which entry it was
					bit = 0;
					while (value >= 0) {
						if ((used & (1 << bit)) === 0) {
							value -= 1;
						}
						bit += 1;
					}
					result += "," + String(bit - 1);
					used |= (1 << (bit - 1));
					i -= 1;
				}
	
				// add final 0 if first was 15
				if (first15) {
					result += ",0";
				}
			} else {
				// PCA first must be 0
				if (isPCA) {
					value = 0;
				} else {
					// Margolus first must be 0 or 15
					value = (this.randGen.random() * 16) | 0;
					if (value === 15) {
						first15 = true;
					} else {
						// first must be zero
						value = 0;
					}
				}
				result += String(value) + ",";
	
				// create 14 random entries
				for (i = 1; i < 15; i += 1) {
					value = (this.randGen.random() * 16) | 0;
					result += String(value) + ",";
				}
	
				// create last entry which must be 0 if first was 15
				if (first15) {
					value = 0;
				} else {
					value = (this.randGen.random() * 16) | 0;
				}
				result += String(value);
			}
		}
	
		// return the rule name
		return result;
	};

	// randomize rule and pattern
	View.prototype.randomPattern = function(me, fixedRule) {
		var patternText = "",
			rleText = "",
			result = null,
			y = 0,
			x = 0,
			state = 0,
			lastState = 0,
			count = 0,
			asciiA = String("A").charCodeAt(0),
			asciiP = String("p").charCodeAt(0),
			outputState = [],
			aliasName = null,
			maxState = 0,
			rows = me.randomHeight,
			columns = me.randomWidth,
			fill = me.randomFillPercentage / 100,
			isAlternating = false;

		// check if rule is alternating
		if (me.patternRuleName.indexOf("|") !== -1) {
			isAlternating = true;
		}

		// populate output states
		if (me.engine.multiNumStates <= 2) {
			outputState[0] = "b";
			outputState[1] = "o";
			maxState = 2;
		} else {
			maxState = me.engine.multiNumStates;
			outputState[0] = ".";
			for (x = 0; x < maxState - 1; x += 1) {
				if (x >= 24) {
					outputState[x + 1] = String.fromCharCode(asciiP + ((x / 24) | 0) - 1) + String.fromCharCode(asciiA + (x % 24));
				} else {
					outputState[x + 1] = String.fromCharCode(asciiA + x);
				}
			}
		}

		// only create 1 row for Wolfram patterns
		if (me.engine.wolframRule !== -1) {
			rows = 1;
		}

		// create random pattern
		for (y = 0; y < rows; y += 1) {
			// check for live cell
			if (this.randGen.random() <= fill) {
				lastState = ((this.randGen.random() * (maxState - 1)) | 0) + 1;
			} else {
				lastState = 0;
			}
			count = 1;
			for (x = 1; x < columns; x += 1) {
				if (this.randGen.random() <= fill) {
					state = ((this.randGen.random() * (maxState - 1)) | 0) + 1;
				} else {
					state = 0;
				}
				if (state !== lastState) {
					if (count > 1) {
						rleText += count;
					}
					rleText += outputState[lastState];
					count = 0;
					lastState = state;
				}
				count += 1;
			}
			if (state !== 0) {
				if (count > 1) {
					rleText += count;
				}
				rleText += outputState[state];
			}
			if (y < rows - 1) {
				rleText += "$\n";
			}
		}
		rleText += "!\n";

		// create random rule
		if (!(me.randomRuleFixed || fixedRule)) {
			if (!me.engine.isRuleTree) {
				if (me.engine.isMargolus || me.engine.isPCA) {
					me.patternRuleName = me.createRandomMargolus(me.engine.isPCA);
					if (isAlternating) {
						me.patternRuleName += "|" + me.createRandomMargolus(me.engine.isPCA);
					}
				} else {
					if (me.engine.isHROT) {
						if (me.wasLtL) {
							me.patternRuleName = me.createRandomLTL();
							if (isAlternating) {
								me.patternRuleName += "|" + me.createRandomLTL();
							}
						} else {
							me.patternRuleName = me.createRandomHROT();
							if (isAlternating) {
								me.patternRuleName += "|" + me.createRandomHROT();
							}
						}
					} else {
						if (me.engine.wolframRule !== -1) {
							me.patternRuleName = me.createRandomWolfram();
							if (isAlternating) {
								me.patternRuleName += "|" + me.createRandomWolfram();
							}
						} else {
							me.patternRuleName = me.createRandomLifeLike(isAlternating);
							if (isAlternating) {
								me.patternRuleName += "|" + me.createRandomLifeLike(isAlternating);
							}
						}
					}
				}
			}
		
			// check for [R]History
			if (me.engine.isLifeHistory) {
				me.patternRuleName += "History";
			}

			// check for [R]Super
			if (me.engine.isSuper) {
				me.patternRuleName += "Super";
			}
	
			// check if there is an alias for the generated pattern name
			aliasName = AliasManager.getAliasFromRule(me.patternRuleName);
			if (aliasName !== null) {
				me.patternAliasName = aliasName;
			} else {
				me.patternAliasName = "";
			}
		}

		// create the pattern
		patternText = me.engine.beforeTitle;
		patternText += "x = " + ViewConstants.randomDimension + ", y = " + ViewConstants.randomDimension + ", rule = ";
		patternText += (me.patternAliasName === "" ? me.patternRuleName : me.patternAliasName) + me.patternBoundedGridDef + "\n";
		patternText += rleText;
		patternText += me.engine.afterTitle;

		// check whether prompt required
		if (me.undoButton.locked || me.randomGuard) {
			result = true;
		} else {
			result = window.confirm("Create new random pattern?");
		}
		if (result) {
			// restore previous size
			if (me.isInPopup) {
				me.displayWidth = me.origDisplayWidth;
				me.displayHeight = me.origDisplayHeight;
			}

			// start viewer
			me.startViewer(patternText, false);

			// save the new pattern
			me.saveCurrentRLE(me);
		}
	};

	// new pattern
	View.prototype.newPattern = function(me) {
		var patternText = "x = 1, y = 1, rule = ",
			result = window.prompt("Create new pattern with rule", (me.patternAliasName === "" ? me.patternRuleName : me.patternAliasName) + me.patternBoundedGridDef);

		// check if the prompt was confirmed
		if (result !== null) {
			if (me.ruleIsValid(result)) {
				if (result === "") {
					result = "Life";
				}
				patternText += result + "\nb!";

				// restore previous size
				if (me.isInPopup) {
					me.displayWidth = me.origDisplayWidth;
					me.displayHeight = me.origDisplayHeight;
				}

				// start viewer
				me.startViewer(patternText, false);
			} else {
				me.menuManager.notification.notify("Invalid rule", 15, 180, 15, true);
			}
		}
	};

	// update grid icon based on hex or square mode
	View.prototype.updateGridIcon = function() {
		// check for hex mode
		if (this.engine.isHex) {
			if (!this.engine.forceRectangles) {
				this.gridToggle.icon = [this.iconManager.icon("hexagongrid")];
			} else {
				this.gridToggle.icon = [this.iconManager.icon("hexgrid")];
			}
		} else {
			// check for triangular mode
			if (this.engine.isTriangular && !this.engine.forceRectangles) {
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
				me.wheelDelta = -event.deltaY;
				if (event.deltaMode === 1) {
					me.wheelDelta *= 45;
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

	// create POIs from Labels
	View.prototype.createPOIsFromLabels = function() {
		var wm = this.waypointManager,
			nLabels = wm.numLabels(),
			i = 0,
			width = this.patternWidth,
			height = this.patternHeight,
			currentWaypoint = wm.createWaypoint(),
			currentLabel = null;

		for (i = 0; i < nLabels; i += 1) {
			currentLabel = wm.labelList[i];
			currentWaypoint.isPOI = true;
			currentWaypoint.x = -currentLabel.x + width / 2;
			currentWaypoint.xDefined = true;
			currentWaypoint.y = -currentLabel.y + height / 2;
			currentWaypoint.yDefined = true;
			currentWaypoint.zoom = currentLabel.zoom;
			currentWaypoint.zoomDefined = true;
			wm.add(currentWaypoint);
			if (i < nLabels - 1) {
				currentWaypoint = wm.createWaypoint();
			}
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
			me.setNewTheme(poi.theme, me.engine.colourChangeSteps, me);
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

	// redo button
	View.prototype.redoPressed = function(me) {
		me.redo(me);
	};

	// cancel button
	View.prototype.cancelPressed = function(me) {
		if (me.identify) {
			me.identifyPressed(me);
		}

		if (me.startFrom !== -1) {
			me.stopStartFrom(me, true);
		}
	};

	// back button
	View.prototype.backPressed = function(me) {
		// check if any settings are displayed
		if (me.showDisplaySettings || me.showInfoSettings || me.showPatternSettings || me.showPlaybackSettings || me.showThemeSelection) {
			// clear settings section
			me.showDisplaySettings = false;
			me.showInfoSettings = false;
			me.showPatternSettings = false;
			me.showPlaybackSettings = false;
			me.showThemeSelection = false;
		} else {
			// close settings
			me.navToggle.current = [false];
		}
	};

	// pattern settings button
	View.prototype.patternPressed = function(me) {
		me.showPatternSettings = true;
	};

	// display settings button
	View.prototype.displayPressed = function(me) {
		me.showDisplaySettings = true;
	};

	// playback settings button
	View.prototype.playbackPressed = function(me) {
		me.showPlaybackSettings = true;
	};

	// info settings button
	View.prototype.infoPressed = function(me) {
		me.showInfoSettings = true;
	};

	// new button
	View.prototype.newPressed = function(me) {
		me.newPattern(me);
	};

	// randomize button
	View.prototype.randomizePressed = function(me) {
		me.randomPattern(me, false);
	};

	// save button
	View.prototype.savePressed = function(me) {
		me.saveCurrentRLE(me);
		me.menuManager.notification.notify("Saved", 15, 120, 15, true);
	};

	// load button
	View.prototype.loadPressed = function(me) {
		me.loadPattern(me);
	};

	// rule button
	View.prototype.rulePressed = function(me) {
		me.changeRule(me);
	};

	// theme button
	View.prototype.themePressed = function(me) {
		me.showThemeSelection = true;
	};

	// theme selection toggle
	View.prototype.setThemeFromCallback = function(theme, newValue, change) {
		if (change) {
			if (newValue[0]) {
				// change quickly
				this.setNewTheme(ViewConstants.themeOrder[theme], 1, this);

				// close settings menu
				if (this.navToggle.current[0]) {
					this.navToggle.current = this.toggleSettings([false], true, this);
				}
			} else {
				// close settings menu
				if (this.navToggle.current[0]) {
					this.navToggle.current = this.toggleSettings([false], true, this);
				}
				newValue[0] = true;
			}
		}

		return newValue;
	};

	// theme selection toggles
	View.prototype.toggleTheme0 = function(newValue, change, me) {
		return me.setThemeFromCallback(0, newValue, change);
	};

	View.prototype.toggleTheme1 = function(newValue, change, me) {
		return me.setThemeFromCallback(1, newValue, change);
	};

	View.prototype.toggleTheme2 = function(newValue, change, me) {
		return me.setThemeFromCallback(2, newValue, change);
	};

	View.prototype.toggleTheme3 = function(newValue, change, me) {
		return me.setThemeFromCallback(3, newValue, change);
	};

	View.prototype.toggleTheme4 = function(newValue, change, me) {
		return me.setThemeFromCallback(4, newValue, change);
	};

	View.prototype.toggleTheme5 = function(newValue, change, me) {
		return me.setThemeFromCallback(5, newValue, change);
	};

	View.prototype.toggleTheme6 = function(newValue, change, me) {
		return me.setThemeFromCallback(6, newValue, change);
	};

	View.prototype.toggleTheme7 = function(newValue, change, me) {
		return me.setThemeFromCallback(7, newValue, change);
	};

	View.prototype.toggleTheme8 = function(newValue, change, me) {
		return me.setThemeFromCallback(8, newValue, change);
	};

	View.prototype.toggleTheme9 = function(newValue, change, me) {
		return me.setThemeFromCallback(9, newValue, change);
	};

	View.prototype.toggleTheme10 = function(newValue, change, me) {
		return me.setThemeFromCallback(10, newValue, change);
	};

	View.prototype.toggleTheme11 = function(newValue, change, me) {
		return me.setThemeFromCallback(11, newValue, change);
	};

	View.prototype.toggleTheme12 = function(newValue, change, me) {
		return me.setThemeFromCallback(12, newValue, change);
	};

	View.prototype.toggleTheme13 = function(newValue, change, me) {
		return me.setThemeFromCallback(13, newValue, change);
	};

	View.prototype.toggleTheme14 = function(newValue, change, me) {
		return me.setThemeFromCallback(14, newValue, change);
	};

	View.prototype.toggleTheme15 = function(newValue, change, me) {
		return me.setThemeFromCallback(15, newValue, change);
	};

	View.prototype.toggleTheme16 = function(newValue, change, me) {
		return me.setThemeFromCallback(16, newValue, change);
	};

	View.prototype.toggleTheme17 = function(newValue, change, me) {
		return me.setThemeFromCallback(17, newValue, change);
	};

	View.prototype.toggleTheme18 = function(newValue, change, me) {
		return me.setThemeFromCallback(18, newValue, change);
	};

	View.prototype.toggleTheme19 = function(newValue, change, me) {
		return me.setThemeFromCallback(19, newValue, change);
	};

	View.prototype.toggleTheme20 = function(newValue, change, me) {
		return me.setThemeFromCallback(20, newValue, change);
	};

	// identify close button
	View.prototype.identifyClosePressed = function(me) {
		me.resultsDisplayed = false;
	};

	// graph close button
	View.prototype.graphClosePressed = function(me) {
		me.popGraph = false;
		me.graphButton.current = me.viewGraphToggle([me.popGraph], true, me);
	};

	// esc button
	View.prototype.escPressed = function(me) {
		// check if errors displayed
		if (me.scriptErrors.length) {
			// clear errors
			me.scriptErrors = [];
			me.displayErrors = 0;
			me.setMousePointer(me.modeList.current);
		} else {
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
	};

	// topics button
	View.prototype.topicsPressed = function(me) {
		// switch to welcome topic
		me.setHelpTopic(ViewConstants.welcomeTopic, me);
	};

	// clear paste
	View.prototype.clearPaste = function(me, ctrl) {
		var i = 0;

		if ((me.engine.isLifeHistory || me.engine.isSuper) && ctrl) {
			while (i < me.pasteBuffer.length) {
				if (me.pasteBuffer[i] > 1) {
					me.pasteBuffer[i] &= 1;
				}
				i += 1;
			}
		} else {
			while (i < me.pasteBuffer.length) {
				me.pasteBuffer[i] = 0;
				i += 1;
			}
		}
	};

	// clear outside
	View.prototype.clearOutside = function(me) {
		var box = me.selectionBox,
			x1 = box.leftX,
			x2 = box.rightX,
			y1 = box.bottomY,
			y2 = box.topY,
			zoomBox = me.engine.zoomBox,
			leftX = zoomBox.leftX,
			rightX = zoomBox.rightX,
			bottomY = zoomBox.bottomY,
			topY = zoomBox.topY,
			x = 0,
			y = 0,
			state = 0,
			swap = 0,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		if (!me.viewOnly) {
			// check for selection
			if (me.isSelection) {
				if (x1 > x2) {
					swap = x2;
					x2 = x1;
					x1 = swap;
				}
				if (y1 > y2) {
					swap = y2;
					y2 = y1;
					y1 = swap;
				}
				x1 += xOff;
				x2 += xOff;
				y1 += yOff;
				y2 += yOff;
	
				// clear cells outside selection
				for (y = bottomY; y <= topY; y += 1) {
					for (x = leftX; x <= rightX; x += 1) {
						// check if cell is outside selection box
						if (!(y >= y1 && y <= y2 && x >= x1 && x <= x2)) {
							state = me.engine.getState(x, y, false);
							if (state !== 0) {
								me.setStateWithUndo(x, y, 0, true);
							}
						}
					}
				}

				// check if shrink needed
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();

				// save edit
				me.afterEdit("clear cells outside selection");
			}
		}
	};

	// clear selection
	View.prototype.clearSelection = function(me, ctrl) {
		var box = me.selectionBox,
			x1 = box.leftX,
			x2 = box.rightX,
			y1 = box.bottomY,
			y2 = box.topY,
			x = 0,
			y = 0,
			state = 0,
			swap = 0,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		if (!me.viewOnly) {
			// check for selection
			if (me.isSelection) {
				if (x1 > x2) {
					swap = x2;
					x2 = x1;
					x1 = swap;
				}
				if (y1 > y2) {
					swap = y2;
					y2 = y1;
					y1 = swap;
				}
	
				if ((me.engine.isLifeHistory || me.engine.isSuper) && ctrl) {
					// clear [R]History or [R]Super states in selection
					for (y = y1; y <= y2; y += 1) {
						for (x = x1; x <= x2; x += 1) {
							state = me.engine.getState(x + xOff, y + yOff, false);
							if (state > 1) {
								me.setStateWithUndo(x + xOff, y + yOff, state & 1, true);
							}
						}
					}
					// update state 6 grid
					if (me.engine.isLifeHistory) {
						this.engine.populateState6MaskFromColGrid();
					}
				} else {
					// clear cells in selection
					for (y = y1; y <= y2; y += 1) {
						for (x = x1; x <= x2; x += 1) {
							state = me.engine.getState(x + xOff, y + yOff, false);
							if (state !== 0) {
								me.setStateWithUndo(x + xOff, y + yOff, 0, true);
							}
						}
					}
				}
	
				// check if shrink needed
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();
	
				// mark nothing happened since selection
				me.afterSelectAction = false;
	
				// save edit
				if ((me.engine.isLifeHistory || me.engine.isSuper) && ctrl) {
					if (me.engine.isLifeHistory) {
						me.afterEdit("clear [R]History cells in selection");
					} else {
						me.afterEdit("clear [R]Super cells in selection");
					}
				} else {
					me.afterEdit("clear cells in selection");
				}
			}
		}
	};

	// clear selection
	View.prototype.doClearSelection = function(me, ctrl) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.clearPaste(me, ctrl);
			} else {
				me.clearSelection(me, ctrl);
			}
		}
	};

	// clear selection pressed
	View.prototype.clearSelectionPressed = function(me) {
		me.doClearSelection(me, false);
	};

	// clear outside pressed
	View.prototype.clearOutsidePressed = function(me) {
		me.clearOutside(me);
	};

	// clear [R]History or [R]Super pressed
	View.prototype.clearRHistoryPressed = function(me) {
		me.doClearSelection(me, true);
	};

	// select all pressed
	View.prototype.selectAllPressed = function(me) {
		var selBox = me.selectionBox,
			zoomBox = me.engine.zoomBox,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			width = 0,
			height = 0;

		// update the pattern extent
		me.engine.shrinkNeeded = true;
		me.engine.doShrink();

		// for HROT patterns use alive states only
		if (me.engine.isHROT && me.engine.multiNumStates === 2) {
			me.engine.getAliveStatesBox(selBox);
			selBox.leftX -= xOff;
			selBox.rightX -= xOff;
			selBox.bottomY -= yOff;
			selBox.topY -= yOff;
		} else {
			// use the pattern extent for the selection
			selBox.leftX = zoomBox.leftX - xOff;
			selBox.bottomY = zoomBox.bottomY - yOff;
			selBox.rightX = zoomBox.rightX - xOff;
			selBox.topY = zoomBox.topY - yOff;
		}

		me.isSelection = true;
		me.afterSelectAction = false;
		if (selBox.rightX < selBox.leftX) {
			width = selBox.leftX - selBox.rightX + 1;
		} else {
			width = selBox.rightX - selBox.leftX + 1;
		}
		if (selBox.topY < selBox.bottomY) {
			height = selBox.bottomY - selBox.topY + 1;
		} else {
			height = selBox.topY - selBox.bottomY + 1;
		}
		me.afterEdit("select all (" + width + " x " + height + ")");
	};

	// process cut
	View.prototype.processCut = function(me, shift, alt) {
		if (!me.viewOnly) {
			// check for sync
			if (!me.noCopy && me.copySyncExternal) {
				if (shift) {
					// copy reset position to external clipboard
					me.copyRLE(me, true);
				} else {
					// check for view only mode
					if (me.viewOnly) {
						// copy reset position to clipboard
						me.copyRLE(me, true);
					} else {
						// check for alt/meta key
						if (alt) {
							// copy with pattern comments
							me.copyCurrentRLE(me, true);
						} else {
							// copy without pattern comments
							me.copyCurrentRLE(me, false);
						}
					}
				}
			}
	
			// cut to the current clipboard
			me.cutSelection(me, me.currentPasteBuffer, false, false);
		}
	};

	// cut pressed
	View.prototype.cutPressed = function(me) {
		me.processCut(me, false, false);
	};

	// cut selection
	View.prototype.cutSelection = function(me, number, evolveStep, noSave) {
		var box = me.selectionBox,
			x1 = box.leftX,
			x2 = box.rightX,
			y1 = box.bottomY,
			y2 = box.topY,
			x = 0,
			y = 0,
			i = 0,
			swap = 0,
			state = 0,
			count = 0,
			states = me.engine.multiNumStates,
			invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)),
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			buffer = null,
			width = 0,
			height = 0;

		// check for selection
		if (me.isSelection) {
			if (x1 > x2) {
				swap = x2;
				x2 = x1;
				x1 = swap;
			}
			if (y1 > y2) {
				swap = y2;
				y2 = y1;
				y1 = swap;
			}

			// compute width and height of selection
			width = (x2 - x1 + 1);
			height = (y2 - y1 + 1);

			// allocate the buffer
			buffer = me.engine.allocator.allocate(Uint8, width * height, "View.pasteBuffer" + number);

			// copy selection to buffer and clear set cells
			i = 0;
			for (y = y1; y <= y2; y += 1) {
				for (x = x1; x <= x2; x += 1) {
					state = me.engine.getState(x + xOff, y + yOff, false);
					if (state > 0 && invertForGenerations) {
						state = states - state;
					}
					buffer[i] = state;
					if (state > 0) {
						count += 1;
					}
					me.setStateWithUndo(x + xOff, y + yOff, 0, true);
					i += 1;
				}
			}

			// copy to required buffer
			me.pasteBuffers[number] = {buffer: buffer, width: width, height: height, count: count};
			me.pasteBuffer = buffer;
			me.pasteWidth = width;
			me.pasteHeight = height;
			me.createClipboardTooltips();

			// check if shrink needed
			me.engine.shrinkNeeded = true;
			me.engine.doShrink();

			// mark that a paste can happen
			me.canPaste = true;
			me.evolvingPaste = false;
			me.afterSelectAction = true;

			// save edit
			if (!noSave) {
				if (evolveStep) {
					me.afterEdit("advance outside");
				} else {
					me.afterEdit("cut");
				}
			}
		}
	};

	// process copy
	View.prototype.processCopy = function(me, shift, alt) {
		// check for Help copy
		if (me.displayHelp !== 0) {
			Help.copying = true;
			Help.copyText = "";
			Help.drawHelpText(me);
			me.copyToClipboard(me, Help.copyText, false);
			Help.copying = false;
			Help.copyText = "";
		} else {
			// check for sync
			if (!me.noCopy && (me.copySyncExternal || !me.isSelection)) {
				if (shift) {
					// copy reset position to external clipboard
					me.copyRLE(me, true);
				} else {
					// check for view only mode
					if (me.viewOnly) {
						// copy reset position to clipboard
						me.copyRLE(me, true);
					} else {
						// check for alt/meta key
						if (alt) {
							// copy with pattern comments
							me.copyCurrentRLE(me, true);
						} else {
							// copy without pattern comments
							me.copyCurrentRLE(me, false);
						}
					}
				}
			}
	
			// copy to the standard clipboard
			if (me.isSelection) {
				me.copySelection(me, me.currentPasteBuffer);
				if (!me.syncNotified) {
					me.syncNotified = true;
					me.menuManager.notification.notify("Disable Sync for faster internal clipboard", 15, 360, 15, false);
				}
			}
		}
	};

	// copy pressed
	View.prototype.copyPressed = function(me) {
		me.processCopy(me, false, false);
	};

	// create weighted neighbourhood from selection and copy to clipboard
	View.prototype.copyWeighted = function(me) {
		var selBox = me.selectionBox,
			x1 = selBox.leftX,
			y1 = selBox.bottomY,
			x2 = selBox.rightX,
			y2 = selBox.topY,
			x = 0,
			y = 0,
			i = 0,
			width = 0,
			height = 0,
			state = 0,
			maxState = 0,
			swap = 0,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			valid = true,
			output = "",
			cells = [];

		if (me.isSelection) {
			// order selection 
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

			// compute width and height of selection
			width = (x2 - x1 + 1);
			height = (y2 - y1 + 1);

			// check selection is square and an odd number wide from 3 to 99
			if (width !== height) {
				me.menuManager.notification.notify("Weighted needs a square selection", 15, 180, 15, true);
				valid = false;
			} else {
				if ((width & 1) === 0) {
					me.menuManager.notification.notify("Weighted size must be odd", 15, 180, 15, true);
					valid = false;
				} else {
					if (width < 3 || width > 99) {
						me.menuManager.notification.notify("Weighted size must be >= 3 and <= 99", 15, 180, 15, true);
						valid = false;
					}
				}
			}

			// check if selection is valid
			if (valid) {
				// create Weighted neighbourhood
				output = "";
				maxState = 0;
				for (y = y1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						state = me.engine.getState(x + xOff, y + yOff, false);
						cells[cells.length] = state;
						if (state > maxState) {
							maxState = state;
						}
					}
				}

				// determine whether to use single or double digit hex values
				if (maxState <= 7) {
					// use single digit
					for (i = 0; i < cells.length; i += 1) {
						state = cells[i];
						output += me.manager.hexCharacters[state];
					}
				} else {
					// use double digit
					for (i = 0; i < cells.length; i += 1) {
						state = cells[i];
						output += me.manager.hexCharacters[state >> 4];
						output += me.manager.hexCharacters[state & 15];
					}
				}

				// add grid
				if (me.engine.isHex) {
					output += "H";
				} else {
					if (me.engine.isTriangular) {
						output += "L";
					}
				}

				// copy to external clipboard
				me.copyToClipboard(me, output, false);
				me.menuManager.notification.notify("Weighted R" + ((width - 1) >> 1) + " copied to clipboard", 15, 180, 15, true);
			}
		} else {
			me.menuManager.notification.notify("Weighted needs a selection", 15, 180, 15, true);
		}
	};
	// create CoordCA neighbourhood from selection and copy to clipboard
	View.prototype.copyCoordCA = function(me) {
		var selBox = me.selectionBox,
			x1 = selBox.leftX,
			y1 = selBox.bottomY,
			x2 = selBox.rightX,
			y2 = selBox.topY,
			value = 0,
			x = 0,
			y = 0,
			midX = 0,
			midY = 0,
			i = 0,
			width = 0,
			height = 0,
			state = 0,
			swap = 0,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			valid = true,
			output = "";

		if (me.isSelection) {
			// order selection 
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

			// compute width and height of selection
			width = (x2 - x1 + 1);
			height = (y2 - y1 + 1);

			// check selection is square and an odd number wide from 3 to 99
			if (width !== height) {
				me.menuManager.notification.notify("CoordCA needs a square selection", 15, 180, 15, true);
				valid = false;
			} else {
				if ((width & 1) === 0) {
					me.menuManager.notification.notify("CoordCA size must be odd", 15, 180, 15, true);
					valid = false;
				} else {
					if (width < 3 || width > 99) {
						me.menuManager.notification.notify("CoordCA size must be >= 3 and <= 99", 15, 180, 15, true);
						valid = false;
					}
				}
			}

			// check if selection is valid
			if (valid) {
				// create CoordCA neighbourhood
				output = "";
				midY = y1 + ((y2 - y1 + 1) >> 1);
				midX = x1 + ((x2 - x1 + 1) >> 1);
				i = 3;
				for (y = y1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						if (!(y === midY && x === midX)) {
							state = me.engine.getState(x + xOff, y + yOff, false);
							if (state > 0) {
								value |= 1 << i;
							}
							i -= 1;
							if (i < 0) {
								output += me.manager.hexCharacters[value];
								i = 3;
								value = 0;
							}
						}
					}
				}

				// add grid
				if (me.engine.isHex) {
					output += "H";
				} else {
					if (me.engine.isTriangular) {
						output += "L";
					}
				}

				// copy to external clipboard
				me.copyToClipboard(me, output, false);
				me.menuManager.notification.notify("CoordCA R" + ((width - 1) >> 1) + " copied to clipboard", 15, 180, 15, true);
			}
		} else {
			me.menuManager.notification.notify("CoordCA needs a selection", 15, 180, 15, true);
		}
	};

	// copy neighbourhood
	View.prototype.copyNeighbourhood = function(me) {
		// for multi-state patterns create a weighted neighbourhood
		if (me.engine.multiNumStates > 2) {
			me.copyWeighted(me);
		} else {
			// for 2 state create a custom neighbourhood
			me.copyCoordCA(me);
		}
	};

	// copy selection
	View.prototype.copySelection = function(me, number) {
		var selBox = me.selectionBox,
			x1 = selBox.leftX,
			y1 = selBox.bottomY,
			x2 = selBox.rightX,
			y2 = selBox.topY,
			swap = 0,
			x = 0,
			y = 0,
			i = 0,
			width = 0,
			height = 0,
			state = 0,
			count = 0,
			states = me.engine.multiNumStates,
			invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)),
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			buffer = null;

		if (me.isSelection) {
			// order selection 
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

			// compute width and height of selection
			width = (x2 - x1 + 1);
			height = (y2 - y1 + 1);

			// allocate the buffer
			buffer = me.engine.allocator.allocate(Uint8, width * height, "View.pasteBuffer" + number);

			// copy selection to buffer
			i = 0;
			for (y = y1; y <= y2; y += 1) {
				for (x = x1; x <= x2; x += 1) {
					state = me.engine.getState(x + xOff, y + yOff, false);
					if (state > 0 && invertForGenerations) {
						state = states - state;
					}
					buffer[i] = state;
					if (state > 0) {
						count += 1;
					}
					i += 1;
				}
			}

			// copy to required buffer
			me.pasteBuffers[number] = {buffer: buffer, width: width, height: height, count: count};
			me.pasteBuffer = buffer;
			me.pasteWidth = width;
			me.pasteHeight = height;
			me.createClipboardTooltips();

			// mark that a paste can happen
			me.canPaste = true;
			me.evolvingPaste = false;
			me.afterSelectAction = true;
		}
	};

	// cancel paste
	View.prototype.cancelPaste = function(me) {
		me.isPasting = false;
		me.menuManager.notification.clear(true, false);
		if (me.evolvingPaste) {
			me.undo(me);
		}
		me.evolvingPaste = false;
	};

	// evolve pressed
	View.prototype.evolvePressed = function(me, ctrl, shift) {
		// save paste mode
		var savedMode = this.pasteMode,
			savedSync = this.copySyncExternal;

		// check for evolve outside
		if (shift) {
			if (me.isSelection) {
				// process cut but mark advance outside
				me.cutSelection(me, me.currentPasteBuffer, true, false);

				// step
				me.engine.nextGeneration(true, me.noHistory, me.graphDisabled, me.identify);
				me.engine.convertToPensTile();
				me.afterEdit("");

				// process paste but mark advance outside
				this.pasteMode = ViewConstants.pasteModeCopy;
				me.processPaste(me, true, true);
				this.pasteMode = savedMode;
			} else {
				me.menuManager.notification.notify("Advance Outside needs a selection", 15, 180, 15, true);
			}
		} else {
			// check if already evolving
			if (me.evolvingPaste) {
				me.evolvePaste(me);
				if (!me.evolvingPaste) {
					me.menuManager.notification.notify("Advance Selection all cells died", 15, 180, 15, true);
				}
			} else {
				// check if there is a selection
				if (me.isSelection) {
					// check if there has been an action since selection
					if (!me.afterSelectAction) {
						// only use internal clipboard
						this.copySyncExternal = false;
						me.cutPressed(me);
						this.copySyncExternal = savedSync;
					}
		
					// check whether there is something to paste
					if (me.canPaste) {
						me.evolvePaste(me);
						if (!me.evolvingPaste) {
							me.menuManager.notification.notify("Advance Selection no live cells", 15, 180, 15, true);
						}
					}
				} else {
					me.menuManager.notification.notify("Advance Selection needs a selection", 15, 180, 15, true);
				}
			}
		}
	};

	// evolve paste
	View.prototype.evolvePaste = function(me) {
		var i = 0,
			x = 0,
			y = 0,
			width = me.pasteWidth,
			height = me.pasteHeight,
			state = 0,
			buffer = me.pasteBuffer,
			xOff = 0,
			yOff = 0,
			selBox = me.selectionBox,
			zoomBox = me.engine.zoomBox,
			historyBox = me.engine.historyBox,
			evolveBox = me.evolveBox,
			// save current grid
		    currentGrid = me.engine.grid,
		    currentNextGrid = me.engine.nextGrid,
			currentColourGrid = me.engine.colourGrid,
			currentColourGrid16 = me.engine.colourGrid16,
			currentColourGrid32 = me.engine.colourGrid32,
			currentSmallColourGrid = me.engine.smallColourGrid,
			currentNextColourGrid = me.engine.nextColourGrid,
		    currentTileGrid = me.engine.tileGrid,
		    currentNextTileGrid = me.engine.nextTileGrid,
		    currentColourTileGrid = me.engine.colourTileGrid,
			currentColourTileHistoryGrid = me.engine.colourTileHistoryGrid,
			currentWidth = me.engine.width,
			currentHeight = me.engine.height,
			currentGrid16 = me.engine.grid16,
			currentNextGrid16 = me.engine.nextGrid16,
			currentBlankRow = me.engine.blankRow,
			currentBlankRow16 = me.engine.blankRow16,
			currentBlankTileRow = me.engine.blankTileRow,
			currentBlankColourRow = me.engine.blankColourRow,
			currentTileRows = me.engine.tileRows,
			currentTileCols = me.engine.tileCols,
			currentWidthMask = me.engine.widthMask,
			currentHeightMask = me.engine.heightMask,
			currentCounter = me.engine.counter,
			currentZoomBox = new BoundingBox(zoomBox.leftX, zoomBox.bottomY, zoomBox.rightX, zoomBox.topY),
			currentHistoryBox = new BoundingBox(historyBox.leftX, historyBox.bottomY, historyBox.rightX, historyBox.topY),
			currentState6Mask = me.engine.state6Mask,
			currentState6Cells = me.engine.state6Cells,
			currentState6Alive = me.engine.state6Alive,
			currentState6TileGrid = me.engine.state6TileGrid,
			currentOverlayGrid = me.engine.overlayGrid,
			currentSmallOverlayGrid = me.engine.smallOverlayGrid,
			currentOverlayGrid16 = me.engine.overlayGrid16,
			currentOverlayGrid32 = me.engine.overlayGrid32,
			currentCounts = null,
			currentColUsed = null;

		// check for HROT rules
		if (me.engine.isHROT) {
			currentCounts = me.engine.HROT.counts;
			currentColUsed = me.engine.HROT.colUsed;
			me.engine.HROT.resize(1024, 1024);
		}

		// allocate new grid
		me.engine.allocateGrid(1024, 1024);

		// copy paste to center of grid
		xOff = Math.round((me.engine.width - me.patternWidth) / 2);
		yOff = Math.round((me.engine.height - me.patternHeight) / 2);

		i = 0;
		for (y = 0; y < height; y += 1) {
			for (x = 0; x < width; x += 1) {
				state = buffer[i];
				if (state > 0) {
					//if (me.engine.multiNumStates > 2 && !(me.engine.isPCA || me.engine.isRuleTree)) {
						//state = me.engine.multiNumStates - state;
					//}
					me.engine.setState(x + xOff, y + yOff, state, true);
				}
				i += 1;
			}
		}

		// compute next generation
		me.engine.nextGeneration(false, true, true, me.identify);
		me.engine.convertToPensTile();
		if (me.engine.anythingAlive) {
			// set new paste buffer
			me.pasteWidth = zoomBox.rightX - zoomBox.leftX + 1;
			me.pasteHeight = zoomBox.topY - zoomBox.bottomY + 1;
			me.pasteBuffer = me.engine.allocator.allocate(Uint8, me.pasteWidth * me.pasteHeight, "View.pasteBuffer");

			// copy cells in
			i = 0;
			for (y = zoomBox.bottomY; y <= zoomBox.topY; y += 1) {
				for (x = zoomBox.leftX; x <= zoomBox.rightX; x += 1) {
					state = me.engine.getState(x, y, false);
					if (state > 0 && me.engine.multiNumStates > 2 && !(me.engine.isPCA || me.engine.isRuleTree)) {
						state = me.engine.multiNumStates - state;
					}
					me.pasteBuffer[i] = state;
					i += 1;
				}
			}
	
			// update selection
			if (!me.evolvingPaste) {
				if (selBox.leftX < selBox.rightX) {
					evolveBox.leftX = selBox.leftX + zoomBox.leftX - xOff;
				} else {
					evolveBox.leftX = selBox.rightX + zoomBox.leftX - xOff;
				}
				if (selBox.bottomY < selBox.topY) {
					evolveBox.bottomY = selBox.bottomY + zoomBox.bottomY - yOff;
				} else {
					evolveBox.bottomY = selBox.topY + zoomBox.bottomY - yOff;
				}
				evolveBox.rightX = evolveBox.leftX + me.pasteWidth - 1;
				evolveBox.topY = evolveBox.bottomY + me.pasteHeight - 1;
			} else {
				evolveBox.leftX += zoomBox.leftX - xOff;
				evolveBox.bottomY += zoomBox.bottomY - yOff;
				evolveBox.rightX = evolveBox.leftX + me.pasteWidth - 1;
				evolveBox.topY = evolveBox.bottomY + me.pasteHeight - 1;
			}
	
			// mark paste is evolving
			me.evolvingPaste = true;
		} else {
			// mark paste finished since all cells died
			me.evolvingPaste = false;
		}

		// restore grid
		me.engine.grid = currentGrid;
		me.engine.nextGrid = currentNextGrid;
		me.engine.colourGrid = currentColourGrid;
		me.engine.colourGrid16 = currentColourGrid16;
		me.engine.colourGrid32 = currentColourGrid32;
		me.engine.smallColourGrid = currentSmallColourGrid;
		me.engine.nextColourGrid = currentNextColourGrid;
		me.engine.tileGrid = currentTileGrid;
		me.engine.nextTileGrid = currentNextTileGrid;
		me.engine.colourTileGrid = currentColourTileGrid;
		me.engine.colourTileHistoryGrid = currentColourTileHistoryGrid;
		me.engine.width = currentWidth;
		me.engine.height = currentHeight;
		me.engine.grid16 = currentGrid16;
		me.engine.nextGrid16 = currentNextGrid16;
		me.engine.zoomBox.leftX = currentZoomBox.leftX;
		me.engine.blankRow = currentBlankRow;
		me.engine.blankRow16 = currentBlankRow16;
		me.engine.blankTileRow = currentBlankTileRow;
		me.engine.blankColourRow = currentBlankColourRow;
		me.engine.tileRows = currentTileRows;
		me.engine.tileCols = currentTileCols;
		me.engine.widthMask = currentWidthMask;
		me.engine.heightMask = currentHeightMask;
		me.engine.counter = currentCounter;
		me.engine.state6Mask = currentState6Mask;
		me.engine.state6Cells = currentState6Cells;
		me.engine.state6Alive = currentState6Alive;
		me.engine.state6TileGrid = currentState6TileGrid;
		me.engine.overlayGrid = currentOverlayGrid;
		me.engine.smallOverlayGrid = currentSmallOverlayGrid;
		me.engine.overlayGrid16 = currentOverlayGrid16;
		me.engine.overlayGrid32 = currentOverlayGrid32;
		zoomBox.leftX = currentZoomBox.leftX;
		zoomBox.bottomY = currentZoomBox.bottomY;
		zoomBox.rightX = currentZoomBox.rightX;
		zoomBox.topY = currentZoomBox.topY;
		historyBox.leftX = currentHistoryBox.leftX;
		historyBox.bottomY = currentHistoryBox.bottomY;
		historyBox.rightX = currentHistoryBox.rightX;
		historyBox.topY = currentHistoryBox.topY;

		// restore HROT
		if (me.engine.isHROT) {
			me.engine.HROT.counts = currentCounts;
			me.engine.HROT.colUsed = currentColUsed;
		}
	};

	// perform paste
	View.prototype.performPaste = function(me, cellX, cellY, saveEdit) {
		var i = 0,
			x = 0,
			y = 0,
			width = me.pasteWidth,
			height = me.pasteHeight,
			state = 0,
			current = 0,
			buffer = me.pasteBuffer,
			midBox = me.middleBox,
			origWidth = me.engine.width;

		// adjust paste position based on position mode
		switch ((me.pastePosition + 0.5) | 0) {
		case ViewConstants.pastePositionNW:
			// nothing to do
			break;
		case ViewConstants.pastePositionN:
			cellX -= width >> 1;
			break;
		case ViewConstants.pastePositionNE:
			cellX -= width - 1;
			break;
		case ViewConstants.pastePositionW:
			cellY -= height >> 1;
			break;
		case ViewConstants.pastePositionMiddle:
			cellX -= width >> 1;
			cellY -= height >> 1;
			break;
		case ViewConstants.pastePositionE:
			cellX -= width - 1;
			cellY -= height >> 1;
			break;
		case ViewConstants.pastePositionSW:
			cellY -= height - 1;
			break;
		case ViewConstants.pastePositionS:
			cellX -= width >> 1;
			cellY -= height - 1;
			break;
		case ViewConstants.pastePositionSE:
			cellX -= width - 1;
			cellY -= height - 1;
			break;
		}

		// check if the grid needs growing
		midBox.leftX = cellX;
		midBox.bottomY = cellY;
		midBox.rightX = cellX + width;
		midBox.topY = cellY + height;
		me.checkGridSize(me, midBox);

		// adjust paste position if grid grew
		while (origWidth !== me.engine.width) {
			cellX += origWidth >> 1;
			cellY += origWidth >> 1;
			origWidth <<= 1;
		}

		// check the paste mode
		switch (me.pasteMode) {
		case ViewConstants.pasteModeOr:
			i = 0;
			for (y = 0; y < height; y += 1) {
				for (x = 0; x < width; x += 1) {
					state = buffer[i];
					if (state > 0) {
						me.setStateWithUndo(cellX + x, cellY + y, state, true);
					}
					i += 1;
				}
			}
			break;
		case ViewConstants.pasteModeCopy:
			i = 0;
			for (y = 0; y < height; y += 1) {
				for (x = 0; x < width; x += 1) {
					state = buffer[i];
					me.setStateWithUndo(cellX + x, cellY + y, state, true);
					i += 1;
				}
			}
			break;
		case ViewConstants.pasteModeXor:
			i = 0;
			for (y = 0; y < height; y += 1) {
				for (x = 0; x < width; x += 1) {
					state = buffer[i];
					current = this.engine.getState(cellX + x, cellY + y, false);
					me.setStateWithUndo(cellX + x, cellY + y, current ^ state, true);
					i += 1;
				}
			}
			break;
		case ViewConstants.pasteModeAnd:
			i = 0;
			for (y = 0; y < height; y += 1) {
				for (x = 0; x < width; x += 1) {
					state = buffer[i];
					current = this.engine.getState(cellX + x, cellY + y, false);
					me.setStateWithUndo(cellX + x, cellY + y, current & state, true);
					i += 1;
				}
			}
		}

		// paste finished
		me.isPasting = false;
		me.evolvingPaste = false;

		// clear notification
		me.menuManager.notification.clear(true, false);

		// save edit
		if (saveEdit) {
			me.afterEdit("paste");
		}
	};

	// paste at offset from selection
	View.prototype.pasteOffset = function(me, dx, dy) {
		var xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			selBox = me.selectionBox,
			leftX = selBox.leftX,
			bottomY = selBox.bottomY,
			rightX = selBox.rightX,
			topY = selBox.topY,
			width = rightX - leftX + 1,
			height = topY - bottomY + 1,
			buffer = null,
			state = 0,
			i = 0,
			x = 0,
			y = 0,
			swap = 0,
			direction = "",
			bLeftX = 0,
			bRightX = me.engine.width - 1,
			bBottomY = 0,
			bTopY = me.engine.height - 1;

		if (!me.viewOnly) {
			// check if there is a selection
			if (me.isSelection) {
				// order selection
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
				width = rightX - leftX + 1;
				height = topY - bottomY + 1;

				// use bounded grid if defined
				if (me.engine.boundedGridType !== -1) {
					if (me.engine.boundedGridWidth !== 0) {
						// set width to included bounded grid cells
						bLeftX = Math.round((me.engine.width - me.engine.boundedGridWidth) / 2) - 1;
						bRightX = bLeftX + me.engine.boundedGridWidth - 1 + 2;
					} else {
						// infinite width so set to grid width
						bLeftX = 0;
						bRightX = me.engine.width - 1;
					}

					if (me.engine.boundedGridHeight !== 0) {
						// set height to included bounded grid cells
						bBottomY = Math.round((me.engine.height - me.engine.boundedGridHeight) / 2) - 1;
						bTopY = bBottomY + me.engine.boundedGridHeight - 1 + 2;
					} else {
						// infinite height to set to grid height
						bBottomY = 0;
						bTopY = me.engine.height - 1;
					}
				}

				// check if the pattern can move
				if (leftX + xOff + dx > bLeftX && rightX + xOff + dx < bRightX && bottomY + yOff + dy > bBottomY && topY + yOff + dy < bTopY) {
					// cut pattern in selection
					me.cutSelection(me, me.currentPasteBuffer, false, true);

					// add the offset
					xOff += dx;
					yOff += dy;

					// paste to the new location
					i = 0;
					buffer = me.pasteBuffers[me.currentPasteBuffer].buffer;
					for (y = 0; y < height; y += 1) {
						for (x = 0; x < width; x += 1) {
							state = buffer[i];
							me.setStateWithUndo(leftX + x + xOff, bottomY + y + yOff, state, true);
							i += 1;
						}
					}
					// adjust selection box
					selBox.leftX += dx;
					selBox.rightX += dx;
					selBox.bottomY += dy;
					selBox.topY += dy;
	
					// save edit
					if (dx === 0) {
						if (dy === -1) {
							direction = "up";
						} else {
							direction = "down";
						}
					} else {
						if (dx === -1) {
							direction = "left";
						} else {
							direction = "right";
						}
					}
					me.afterEdit("nudge " + direction);
				} else {
					me.menuManager.notification.notify("No room to nudge selection", 15, 180, 15, true);
				}
			}
		}
	};

	// process paste
	View.prototype.processPaste = function(me, shift, evolveStep) {
		var xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			selBox = me.selectionBox,
			evolveBox = me.evolveBox,
			save = 0,
			leftX = selBox.leftX,
			bottomY = selBox.bottomY,
			rightX = selBox.rightX,
			topY = selBox.topY,
			width = 0,
			height = 0,
			savedLocation = 0,
			x = 0,
			y = 0;

		if (!me.viewOnly) {
			// check for copy buffer
			if (me.pasteBuffers[me.currentPasteBuffer] !== null) {
				// check for paste to selection
				if (shift) {
					// check for a selection
					if (me.isSelection || me.evolvingPaste) {
						// check if paste has evolved
						if (me.evolvingPaste) {
							leftX = evolveBox.leftX;
							bottomY = evolveBox.bottomY;
							rightX = evolveBox.rightX;
							topY = evolveBox.topY;
						}
						// order selection
						if (leftX > rightX) {
							save = leftX;
							leftX = rightX;
							rightX = save;
						}
						if (bottomY > topY) {
							save = bottomY;
							bottomY = topY;
							topY = save;
						}
						width = rightX - leftX + 1;
						height = topY - bottomY + 1;
	
						// check the paste fits in the selection box
						if (me.pasteWidth > width || me.pasteHeight > height) {
							me.menuManager.notification.notify("Paste does not fit in selection", 15, 180, 15, true);
						} else {
							// paste top left to always fit in selection box
							savedLocation = me.pastePosition;
							me.pastePosition = ViewConstants.pastePositionNW;
							for (y = bottomY; y <= bottomY + height - me.pasteHeight; y += me.pasteHeight) {
								for (x = leftX ; x <= leftX + width - me.pasteWidth; x += me.pasteWidth) {
									me.performPaste(me, x + xOff, y + yOff, false);
								}
							}
							me.pastePosition = savedLocation;
							if (me.autoShrink) {
								me.autoShrinkSelection(me);
							}
							if (evolveStep) {
								me.afterEdit("advance outside");
							} else {
								me.afterEdit("paste to selection");
							}
							me.evolvingPaste = false;
						}
					} else {
						me.menuManager.notification.notify("Paste to Selection needs a selection", 15, 180, 15, true);
					}
				} else {
					me.pasteSelection(me, me.currentPasteBuffer);
					me.evolvingPaste = false;
					me.menuManager.notification.notify("Now click to paste", 15, 180, 15, true);
				}
			}
		}
	};

	// paste from enter key
	View.prototype.pasteFromEnter = function(me) {
		if (me.evolvingPaste) {
			me.processPaste(me, true, false);
			me.afterSelectAction = false;
		} else {
			me.performPaste(me, me.cellX, me.cellY, true);
		}
	};

	// paste pressed
	View.prototype.pastePressed = function(me) {
		me.processPaste(me, false, false);
	};

	// paste selection
	View.prototype.pasteSelection = function(me, number) {
		// get the required paste
		if (number >= 0 && number < me.pasteBuffers.length) {
			if (me.pasteBuffers[number] !== null) {
				me.isPasting = true;
				me.evolvingPaste = false;
				me.pasteBuffer = me.pasteBuffers[number].buffer;
				me.pasteWidth = me.pasteBuffers[number].width;
				me.pasteHeight = me.pasteBuffers[number].height;
		
				// switch to select mode
				if (me.modeList.current !== ViewConstants.modeSelect) {
					me.modeList.current = me.viewModeList(ViewConstants.modeSelect, true, me);
				}
			} else {
				me.isPasting = false;
				me.evolvingPaste = false;
				me.menuManager.notification.notify("Clipboard empty", 15, 180, 15, true);
			}
		}
	};

	// random paste
	View.prototype.randomPaste = function(me, twoStateOnly) {
		var i = 0,
			state = 0,
			numStates = me.engine.multiNumStates;

		// check for 2 state patterns
		if (numStates === -1) {
			numStates = 2;
		}

		// randomize cells
		for (i = 0; i < me.pasteBuffer.length; i += 1) {
			if (me.randGen.random() * 100 <= me.randomDensity) {
				if (numStates === 2 || twoStateOnly) {
					state = numStates - 1;
				} else {
					state = ((me.randGen.random() * (numStates - 1)) | 0) + 1;
				}
			} else {
				state = 0;
			}
			me.pasteBuffer[i] = state;
		}
	};

	// random selection
	View.prototype.randomSelection = function(me, twoStateOnly) {
		var box = me.selectionBox,
			x1 = box.leftX,
			x2 = box.rightX,
			y1 = box.bottomY,
			y2 = box.topY,
			x = 0,
			y = 0,
			state = 0,
			swap = 0,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			numStates = me.engine.multiNumStates;

		// check for selection
		if (me.isSelection) {
			if (x1 > x2) {
				swap = x2;
				x2 = x1;
				x1 = swap;
			}
			if (y1 > y2) {
				swap = y2;
				y2 = y1;
				y1 = swap;
			}

			// check for 2 state patterns
			if (numStates === -1) {
				numStates = 2;
			}

			// draw random cells
			for (y = y1; y <= y2; y += 1) {
				for (x = x1; x <= x2; x += 1) {
					if (me.randGen.random() * 100 <= me.randomDensity) {
						if (numStates === 2 || twoStateOnly) {
							state = numStates - 1;
						} else {
							state = ((me.randGen.random() * (numStates - 1)) | 0) + 1;
						}
					} else {
						state = 0;
					}
					me.setStateWithUndo(x + xOff, y + yOff, state, true);
				}
			}

			// check if shrink needed
			me.engine.shrinkNeeded = true;
			me.engine.doShrink();

			// save edit
			me.afterEdit("random " + me.randomDensity + "%");
		}
	};

	// random fill
	View.prototype.randomFill = function(me, twoStateOnly) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.randomPaste(me, twoStateOnly);
			} else {
				me.randomSelection(me, twoStateOnly);
			}
		}
	};

	// random pressed
	View.prototype.randomPressed = function(me) {
		if (!me.viewOnly) {
			me.randomFill(me, false);
		}
	};

	// random 2-state pressed
	View.prototype.random2Pressed = function(me) {
		me.randomFill(me, true);
	};

	// flip X paste
	View.prototype.flipXPaste = function(me) {
		var w = me.pasteWidth,
			h = me.pasteHeight,
			w2 = w >> 1,
			x = 0,
			y = 0,
			i = 0,
			swap = 0,
			state = 0;

		// flip each row
		i = 0;
		for (y = 0; y < h; y += 1) {
			// flip the bits for PCA rules
			if (me.engine.isPCA) {
				for (x = 0; x < w2; x += 1) {
					swap = me.pasteBuffer[i + x];
					state = me.pasteBuffer[i + w - x - 1];
					me.pasteBuffer[i + x] = (state & 5) | ((state & 2) << 2) | ((state & 8) >> 2);
					me.pasteBuffer[i + w - x - 1] = (swap & 5) | ((swap & 2) << 2) | ((swap & 8) >> 2);
				}
			} else {
				// flip the row
				for (x = 0; x < w2; x += 1) {
					swap = me.pasteBuffer[i + x];
					me.pasteBuffer[i + x] = me.pasteBuffer[i + w - x - 1];
					me.pasteBuffer[i + w - x - 1] = swap;
				}
			}
			// skip next half
			i += w;
		}
	};

	// flip X selection
	View.prototype.flipXSelection = function(me) {
		var box = me.selectionBox,
			x1 = box.leftX,
			x2 = box.rightX,
			y1 = box.bottomY,
			y2 = box.topY,
			x = 0,
			y = 0,
			swap = 0,
			row = null,
			state = 0,
			states = me.engine.multiNumStates,
			invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)),
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		// check for selection
		if (me.isSelection) {
			if (x1 > x2) {
				swap = x2;
				x2 = x1;
				x1 = swap;
			}
			if (y1 > y2) {
				swap = y2;
				y2 = y1;
				y1 = swap;
			}

			// allocate the row
			row = me.engine.allocator.allocate(Uint8, (x2 - x1 + 1), "View.flipRow");

			// flip each row
			for (y = y1; y <= y2; y += 1) {
				// read the row
				for (x = x1; x <= x2; x += 1) {
					state = me.engine.getState(x + xOff, y + yOff, false);
					if (invertForGenerations) {
						if (state > 0) {
							state = states - state;
						}
					}
					row[x - x1] = state;
				}

				// write the row back in reverse order
				if (me.engine.isPCA) {
					for (x = x1; x <= x2; x += 1) {
						state = row[x2 - x];
						me.setStateWithUndo(x + xOff, y + yOff, (state & 5) | ((state & 2) << 2) | ((state & 8) >> 2), true);
					}
				} else {
					for (x = x1; x <= x2; x += 1) {
						me.setStateWithUndo(x + xOff, y + yOff, row[x2 - x], true);
					}
				}
			}

			// check if shrink needed
			me.engine.shrinkNeeded = true;
			me.engine.doShrink();

			// save edit
			me.afterEdit("flip horizontally");
		}
	};

	// flip Y paste
	View.prototype.flipYPaste = function(me) {
		var w = me.pasteWidth,
			h = me.pasteHeight,
			h2 = h >> 1,
			x = 0,
			y = 0,
			i = 0,
			swap = 0,
			state = 0;

		// flip each column
		i = 0;
		for (x = 0; x < w; x += 1) {
			// flip the bits for PCA rules
			if (me.engine.isPCA) {
				for (y = 0; y < h2; y += 1) {
					swap = me.pasteBuffer[i + y * w];
					state = me.pasteBuffer[i + (h - y - 1) * w];
					me.pasteBuffer[i + y * w] = (state & 10) | ((state & 1) << 2) | ((state & 4) >> 2);
					me.pasteBuffer[i + (h - y - 1) * w] = (swap & 10) | ((swap & 1) << 2) | ((swap & 4) >> 2);
				}
			} else {
				// flip the row
				for (y = 0; y < h2; y += 1) {
					swap = me.pasteBuffer[i + y * w];
					me.pasteBuffer[i + y * w] = me.pasteBuffer[i + (h - y - 1) * w];
					me.pasteBuffer[i + (h - y - 1) * w] = swap;
				}
			}
			// skip next half
			i += 1;
		}
	};

	// flip Y selection
	View.prototype.flipYSelection = function(me) {
		var box = me.selectionBox,
			x1 = box.leftX,
			x2 = box.rightX,
			y1 = box.bottomY,
			y2 = box.topY,
			x = 0,
			y = 0,
			swap = 0,
			column = null,
			state = 0,
			states = me.engine.multiNumStates,
			invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)),
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		// check for selection
		if (me.isSelection) {
			if (x1 > x2) {
				swap = x2;
				x2 = x1;
				x1 = swap;
			}
			if (y1 > y2) {
				swap = y2;
				y2 = y1;
				y1 = swap;
			}

			// allocate the row
			column = me.engine.allocator.allocate(Uint8, (y2 - y1 + 1), "View.flipColumn");

			// flip each column
			for (x = x1; x <= x2; x += 1) {
				// read the column
				for (y = y1; y <= y2; y += 1) {
					state = me.engine.getState(x + xOff, y + yOff, false);
					if (invertForGenerations) {
						if (state > 0) {
							state = states - state;
						}
					}
					column[y - y1] = state;
				}
				// write the column back in reverse order
				if (me.engine.isPCA) {
					for (y = y1; y <= y2; y += 1) {
						state = column[y2 - y];
						me.setStateWithUndo(x + xOff, y + yOff, (state & 10) | ((state & 1) << 2) | ((state & 4) >> 2), true);
					}
				} else {
					for (y = y1; y <= y2; y += 1) {
						me.setStateWithUndo(x + xOff, y + yOff, column[y2 - y], true);
					}
				}
			}

			// check if shrink needed
			me.engine.shrinkNeeded = true;
			me.engine.doShrink();

			// save edit
			me.afterEdit("flip vertically");
		}
	};

	// rotate paste
	View.prototype.rotatePaste = function(me, clockwise) {
		var w = me.pasteWidth,
			h = me.pasteHeight,
			x = 0,
			y = 0,
			value = 0,
			newBuffer = me.engine.allocator.allocate(Uint8, w * h, "View.pasteBuffer");

		// rotate cells into new buffer
		for (y = 0; y < h; y += 1) {
			for (x = 0; x < w; x += 1) {
				if (me.engine.isPCA) {
					if (clockwise) {
						value = me.pasteBuffer[y * w + x];
						newBuffer[x * h + (h - y - 1)] = ((value << 1) & 15) | ((value & 8) >> 3);
					} else {
						value = me.pasteBuffer[y * w + x];
						newBuffer[(w - x - 1) * h + y] = ((value >> 1) & 15) | ((value & 1) << 3);
					}
				} else {
					if (clockwise) {
						newBuffer[x * h + (h - y - 1)] = me.pasteBuffer[y * w + x];
					} else {
						newBuffer[(w - x - 1) * h + y] = me.pasteBuffer[y * w + x];
					}
				}
			}
		}

		// save the new paste buffer
		me.pasteBuffer = newBuffer;
		me.pasteWidth = h;
		me.pasteHeight = w;
	};

	// rotate selection
	View.prototype.rotateSelection = function(me, clockwise, comment) {
		var box = me.selectionBox,
			x1 = box.leftX,
			x2 = box.rightX,
			y1 = box.bottomY,
			y2 = box.topY,
			x = 0,
			y = 0,
			swap = 0,
			cells = null,
			state = 0,
			i = 0,
			cx = 0,
			cy = 0,
			w = 0,
			h = 0,
			newLeftX = 0,
			newBottomY = 0,
			newRightX = 0,
			newTopY = 0,
			newXInc = 0,
			newYInc = 0,
			firstNewY = 0,
			newX = 0,
			newY = 0,
			saveLeftX = 0,
			saveBottomY = 0,
			saveRightX = 0,
			saveTopY = 0,
			states = me.engine.multiNumStates,
			/** @type {boolean} */ rotateFits = true,
			/** @type {boolean} */ invertForGenerations = (states > 2 && !(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)),
		    /** @type {number} */ boxOffset = (me.engine.isMargolus ? -1 : 0),
		    /** @type {number} */ leftX = Math.round((me.engine.width - me.engine.boundedGridWidth) / 2) + boxOffset,
		    /** @type {number} */ bottomY = Math.round((me.engine.height - me.engine.boundedGridHeight) / 2) + boxOffset,
		    /** @type {number} */ rightX = leftX + me.engine.boundedGridWidth - 1,
			/** @type {number} */ topY = bottomY + me.engine.boundedGridHeight - 1,
			/** @type {number} */ xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			/** @type {number} */ yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);

		// check for selection
		if (me.isSelection) {
			if (x1 > x2) {
				swap = x2;
				x2 = x1;
				x1 = swap;
			}
			if (y1 > y2) {
				swap = y2;
				y2 = y1;
				y1 = swap;
			}

			// compute width and height of selection
			w = (x2 - x1 + 1);
			h = (y2 - y1 + 1);

			// compute center of rotation
			cx = x1 + ((w - 1) >> 1);
			cy = y1 + ((h - 1) >> 1);

			// compute new x and y
			newLeftX = cx + y1 - cy;
			newBottomY = cy + x1 - cx;
			newRightX = cx + y2 - cy;
			newTopY = cy + x2 - cx;

			// transform selection
			saveLeftX = box.leftX;
			saveBottomY = box.bottomY;
			saveRightX = box.rightX;
			saveTopY = box.topY;
			box.leftX = newLeftX;
			box.bottomY = newBottomY;
			box.rightX = newRightX;
			box.topY = newTopY;
			if (box.leftX > box.rightX) {
				swap = box.leftX;
				box.leftX = box.rightX;
				box.rightX = swap;
			}
			if (box.bottomY > box.topY) {
				swap = box.bottomY;
				box.bottomY = box.topY;
				box.topY = swap;
			}

			// check if rotation fits in bounded grid if specified
			if (me.engine.boundedGridType !== -1) {
				if (box.leftX + xOff < leftX || box.rightX + xOff > rightX || box.bottomY + yOff < bottomY || box.topY + yOff > topY) {
					me.menuManager.notification.notify("Rotation does not fit in bounded grid", 15, 180, 15, true);
					rotateFits = false;
				}
			} else {
				// check if rotation has grown the grid and was clipped
				if (me.checkSelectionSize(me)) {
					me.menuManager.notification.notify("Rotation does not fit on grid", 15, 180, 15, true);
					rotateFits = false;
				} else {
					// recompute offset in case grid grew
					xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
					yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);
				}
			}

			// if rotation does not fit then restore original selection box
			if (!rotateFits) {
				box.leftX = saveLeftX;
				box.bottomY = saveBottomY;
				box.rightX = saveRightX;
				box.topY = saveTopY;
			} else {
				// adjust for direction of rotation
				if (clockwise) {
					firstNewY = newBottomY;
					newX = newRightX;
					newYInc = 1;
					newXInc = -1;
				} else {
					firstNewY = newTopY;
					newX = newLeftX;
					newYInc = -1;
					newXInc = 1;
				}

				// allocate the cells
				cells = me.engine.allocator.allocate(Int16, 3 * (x2 - x1 + 1) * (y2 - y1 + 1), "View.rotateCells");

				// read each cell in the selection and rotate coordinates
				if (me.engine.isHex) {
					for (y = y1; y <= y2; y += 1) {
						for (x = x1; x <= x2; x += 1) {
							state = me.engine.getState(x + xOff, y + yOff, false);
							if (invertForGenerations) {
								if (state > 0) {
									state = states - state;
								}
							} else {
								if (me.engine.isPCA) {
									if (clockwise) {
										state = ((state << 1) & 15) | ((state & 8) >> 3);
									} else {
										state = ((state >> 1) & 15) | ((state & 1) << 3);
									}
								}
							}
							cells[i] = y - x;
							cells[i + 1] = -x;
							cells[i + 2] = state;
							i += 3;
						}
					}
				} else {
					for (y = y1; y <= y2; y += 1) {
						newY = firstNewY;
						for (x = x1; x <= x2; x += 1) {
							state = me.engine.getState(x + xOff, y + yOff, false);
							if (invertForGenerations) {
								if (state > 0) {
									state = states - state;
								}
							} else {
								if (me.engine.isPCA) {
									if (clockwise) {
										state = ((state << 1) & 15) | ((state & 8) >> 3);
									} else {
										state = ((state >> 1) & 15) | ((state & 1) << 3);
									}
								}
							}
							cells[i] = newX;
							cells[i + 1] = newY;
							cells[i + 2] = state;
							i += 3;
							newY += newYInc;
						}
						newX += newXInc;
					}
				}

				// recompute offsets in case grid changed
				xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1);
				yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1);
	
				// write the cells to their new positions
				i = 0;
				while (i < cells.length) {
					x = cells[i];
					y = cells[i + 1];
					state = cells[i + 2];
					me.setStateWithUndo(x + xOff, y + yOff, state, true);
					i += 3;
				}
	
				// clear outside intersection between new selection and old
				for (x = x1; x < box.leftX; x += 1) {
					for (y = y1; y <= y2; y += 1) {
						me.setStateWithUndo(x + xOff, y + yOff, 0, true);
					}
				}
				for (x = box.rightX + 1; x <= x2; x += 1) {
					for (y = y1; y <= y2; y += 1) {
						me.setStateWithUndo(x + xOff, y + yOff, 0, true);
					}
				}
				for (y = y1; y < box.bottomY; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						me.setStateWithUndo(x + xOff, y + yOff, 0, true);
					}
				}
				for (y = box.topY + 1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						me.setStateWithUndo(x + xOff, y + yOff, 0, true);
					}
				}
	
				// check if shrink needed
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();
	
				// save edit
				me.afterEdit(comment);
			}
		}
	};

	// nudge left pressed
	View.prototype.nudgeLeftPressed = function(me) {
		if (!me.viewOnly) {
			me.pasteOffset(me, -1, 0);
		}
	};

	// nudge right pressed
	View.prototype.nudgeRightPressed = function(me) {
		if (!me.viewOnly) {
			me.pasteOffset(me, 1, 0);
		}
	};

	// nudge up pressed
	View.prototype.nudgeUpPressed = function(me) {
		if (!me.viewOnly) {
			me.pasteOffset(me, 0, -1);
		}
	};

	// nudge down pressed
	View.prototype.nudgeDownPressed = function(me) {
		if (!me.viewOnly) {
			me.pasteOffset(me, 0, 1);
		}
	};

	// flip X pressed
	View.prototype.flipXPressed = function(me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.flipXPaste(me);
			} else {
				me.flipXSelection(me);
			}
		}
	};

	// flip Y pressed
	View.prototype.flipYPressed = function(me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.flipYPaste(me);
			} else {
				me.flipYSelection(me);
			}
		}
	};

	// rotate CW pressed
	View.prototype.rotateCWPressed = function(me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.rotatePaste(me, true);
			} else {
				me.rotateSelection(me, true, "rotate clockwise");
			}
		}
	};

	// rotate CCW pressed
	View.prototype.rotateCCWPressed = function(me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.rotatePaste(me, false);
			} else {
				me.rotateSelection(me, false, "rotate counter-clockwise");
			}
		}
	};

	// invert paste
	View.prototype.invertPaste = function(me) {
		var i = 0,
			state = 0,
			numStates = me.engine.multiNumStates;

		if (!me.viewOnly) {
			// check for 2 state patterns
			if (numStates === -1) {
				numStates = 2;
			}
	
			// invert cells in paste:
			while (i < me.pasteBuffer.length) {
				state = me.pasteBuffer[i];
				me.pasteBuffer[i] = numStates - state - 1;
				i += 1;
			}
		}
	};

	// invert selection
	View.prototype.invertSelection = function(me) {
		var box = me.selectionBox,
			x1 = box.leftX,
			x2 = box.rightX,
			y1 = box.bottomY,
			y2 = box.topY,
			x = 0,
			y = 0,
			state = 0,
			swap = 0,
			xOff = (me.engine.width >> 1) - (me.patternWidth >> 1) + (me.xOffset << 1),
			yOff = (me.engine.height >> 1) - (me.patternHeight >> 1) + (me.yOffset << 1),
			numStates = me.engine.multiNumStates;

		if (!me.viewOnly) {
			// check for selection
			if (me.isSelection) {
				if (x1 > x2) {
					swap = x2;
					x2 = x1;
					x1 = swap;
				}
				if (y1 > y2) {
					swap = y2;
					y2 = y1;
					y1 = swap;
				}
	
				// check for 2 state patterns
				if (numStates === -1) {
					numStates = 2;
				}
	
				// invert cells in selection
				for (y = y1; y <= y2; y += 1) {
					for (x = x1; x <= x2; x += 1) {
						state = me.engine.getState(x + xOff, y + yOff, false);
						if (!(me.engine.isPCA || me.engine.isRuleTree) && numStates > 2 && state > 0) {
							state = numStates - state;
						}
						me.setStateWithUndo(x + xOff, y + yOff, numStates - state - 1, true);
					}
				}

				// check if shrink needed
				me.engine.shrinkNeeded = true;
				me.engine.doShrink();
	
				// save edit
				me.afterEdit("invert cells in selection");
			}
		}
	};

	// invert selection pressed
	View.prototype.invertSelectionPressed = function(me) {
		if (!me.viewOnly) {
			if (me.isPasting) {
				me.invertPaste(me);
			} else {
				me.invertSelection(me);
			}
		}
	};

	// reverse direction button
	View.prototype.directionPressed = function(me) {
		var flag = false;

		// check if reverse is pending
		if (me.engine.reversePending) {
			// cancel change
			me.engine.reversePending = false;
		} else {
			// mark reverse pending
			me.engine.reversePending = true;
		}

		// update play icon
		me.setPauseIcon(me.generationOn);

		// notify direction
		flag = me.engine.reverseMargolus;
		if (me.engine.reversePending) {
			flag = !flag;
		}
		me.menuManager.notification.notify("Playback " + (flag ? "Reverse" : "Forward"), 15, 40, 15, true);
	};

	// fit button
	View.prototype.fitPressed = function(me) {
		// fit zoom
		me.fitZoomDisplay(true, true, ViewConstants.fitZoomPattern);

		// flag manual change made if paused
		if (!me.generationOn) {
			me.manualChange = true;
		}
	};

	// copy rule button clicked
	View.prototype.copyRulePressed = function(me) {
		var ruleText = me.patternRuleName;

		if (me.engine.isRuleTree) {
			// check the rule cache
			ruleText = RuleTreeCache.getDefinition(ruleText);
			if (ruleText === "") {
				// if cache was empty the rule might have been inline
				ruleText = me.manager.ruleLoaderDefinition;
			}
		}
		me.copyToClipboard(me, ruleText, false);
	};

	// identify button action
	View.prototype.identifyAction = function(me) {
		// reset check
		me.engine.checkedMod = false;
		me.engine.checkModGen = 0;

		// check if anything is alive
		if (!me.engine.anythingAlive) {
			me.menuManager.notification.notify("Empty Pattern", 15, 120, 15, false);
			me.identify = false;
			me.resultsDisplayed = false;
		} else {
			if (me.identify) {
				me.identify = false;
				me.menuManager.notification.notify("Identify Cancelled", 15, 120, 15, false);

				// create undo point
				me.afterEdit("");
			} else {
				me.identify = true;

				// hide previous results
				me.resultsDisplayed = false;

				// start identification
				if (me.identifyFast) {
					me.menuManager.notification.notify("Identifying (fast)...", 15, 216000, 15, false);
				} else {
					me.menuManager.notification.notify("Identifying...", 15, 216000, 15, false);
				}

				// create undo point
				me.afterEdit("");
			}
		}

		// initialize search
		me.engine.initSearch(me.identify);

		// close help
		me.displayHelp = 0;

		// close settings menu
		me.backPressed(me);
		me.backPressed(me);
		me.menuManager.toggleRequired = true;
		me.viewMenu.locked = false;
	};

	// save image button pressed
	View.prototype.saveImagePressed = function(me) {
		me.screenShotScheduled = 1;
	};

	// save graph image button pressed
	View.prototype.saveGraphPressed = function(me) {
		me.screenShotScheduled = 2;
	};

	// go to generation button pressed
	View.prototype.goToGenPressed = function(me) {
		// prompt for generation
		var result = window.prompt("Enter generation", me.engine.counter),
			number = 0;

		// check one was entered
		if (result !== null) {
			// check for relative generation
			if (result.substr(0, 1) == "+") {
				number = me.engine.counter + Number(result.substr(1));
			} else {
				if (result.substr(0, 1) == "-") {
					number = me.engine.counter - Number(result.substr(1));
				} else {
					number = Number(result);
				}
			}

			if (number >= 0 && number <= ViewConstants.maxStartFromGeneration) {
				if (number !== me.engine.counter) {
					me.startFrom = number;
					me.navToggle.current = me.toggleSettings([false], true, me);
					me.menuManager.toggleRequired = true;
					if (me.genNotifications) {
						me.menuManager.notification.notify("Going to generation " + number, 15, 10000, 15, false);
					}
					me.menuManager.notification.clear(true, false);

					// if the required generation is earlier then reset
					if (number < me.engine.counter) {
						me.engine.restoreSavedGrid(false);
						me.setUndoGen(me.engine.counter);
					}
				}
			} else {
				me.menuManager.notification.notify("Invalid generation specified", 15, 240, 15, true);
			}
		}
	};

	// identify button pressed
	View.prototype.identifyPressed = function(me) {
		me.identifyFast = false;
		me.identifyAction(me);
	};

	// fast identify button pressed
	View.prototype.fastIdentifyPressed = function(me) {
		me.identifyFast = true;
		me.identifyAction(me);
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

	// pause while drawing toggle
	View.prototype.togglePausePlayback = function(newValue, change, me) {
		if (change) {
			me.pauseWhileDrawing = newValue[0];
		}
		return [me.pauseWhileDrawing];
	};

	// show lag toggle
	View.prototype.toggleShowLag = function(newValue, change, me) {
		if (change) {
			me.perfWarning = newValue[0];
		}

		return [me.perfWarning];
	};

	// throttle toggle
	View.prototype.toggleThrottle = function(newValue, change, me) {
		if (change) {
			me.canBailOut = newValue[0];
		}

		return [me.canBailOut];
	};

	// settings menu toggle
	View.prototype.toggleSettings = function(newValue, change, me) {
		if (change) {
			// close help if settings opened
			if (me.displayHelp !== 0 && newValue[0]) {
				me.displayHelp = 0;
				me.helpToggle.current = me.toggleHelp([me.displayHelp], true, me);
			}
			// close theme selection buttons if settings closed
			if (!newValue[0]) {
				me.backPressed(me);
			}
		}
		return newValue;
	};

	// smart drawing toggle
	View.prototype.toggleSmart = function(newValue, change, me) {
		if (change) {
			me.smartDrawing = newValue[0];
		}

		return [me.smartDrawing];
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
				if (me.pickReplace) {
					me.menuManager.notification.notify("Replace: Now click on a cell", 15, 180, 15, true);
				} else {
					me.menuManager.notification.notify("Pick: Now click on a cell", 15, 180, 15, true);
				}
			} else {
				if (!me.justPicked) {
					me.menuManager.notification.clear(true, false);
				}
				me.justPicked = false;
				me.pickReplace = false;
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
				me.fitZoomDisplay(true, true, ViewConstants.fitZoomPattern);
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

	// autostart indicator toggle
	View.prototype.toggleAutostart = function(newValue, change, me) {
		if (change) {
			if (me.autoStart) {
				me.autoStartDisabled = !newValue[0];
			}
		}

		return [me.autoStartDisabled];
	};

	// stop indicator toggle
	View.prototype.toggleStop = function(newValue, change, me) {
		if (change) {
			if (me.stopGeneneration !== -1) {
				me.stopDisabled = !newValue[0];
			}
		}

		return [me.stopDisabled];
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

					// clear any waypoint message if waypoints just disabled
					if (me.waypointsDisabled) {
						me.menuManager.notification.clear(false, false);
						me.lastWaypointMessage = "";
					} else {
						// mark manual change if waypoints just enabled
						me.manualChange = true;
						me.elapsedTime = me.waypointManager.findClosestWaypoint(me.engine.counter);
					}

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
				// close settings menu if open
				if (me.navToggle.current[0]) {
					me.navToggle.current = me.toggleSettings([false], true, me);
				}
			} else {
				// reset to welcome topic on close
				me.setHelpTopic(ViewConstants.welcomeTopic, me);
				me.displayHelp = 0;
			}
		}

		me.setMousePointer(me.modeList.current);

		return [me.displayHelp];
	};
	
	// relative/absolute generation display toggle
	View.prototype.viewRelativeToggle = function(newValue, change, me) {
		if (change) {
			me.genRelative = newValue[0];
		}

		return [me.genRelative];
	};

	// quality rendering display toggle
	View.prototype.viewQualityToggle = function(newValue, change, me) {
		if (change) {
			me.engine.pretty = newValue[0];
			me.engine.initPretty();
		}

		return [me.engine.pretty];
	};

	// stats toggle
	View.prototype.viewStats = function(newValue, change, me) {
		if (change) {
			me.statsOn = newValue[0];

			// check if stats just turned on
			if (me.statsOn) {
				// see if any cells are alive
				if (me.engine.anythingAlive) {
					// if at zero then population will be current
					if (me.engine.counter > 0) {
						// for Life-like rules compute again from the previous generation to update births, deaths and population
						if (me.engine.multiNumStates === -1 && !me.engine.isMargolus && !me.engine.isPCA) {
							// go to previous generation
							me.engine.counter -= 1;

							// compute next generation
							me.engine.nextGeneration(true, me.noHistory, me.graphDisabled, me.identify);

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

	// run forward to a given generation (used by redo)
	View.prototype.runForwardTo = function(targetGen) {
		// compute each generation up to just before the target with stats off (for speed)
		while (this.engine.counter < targetGen - 1) {
			if (this.engine.anythingAlive) {
				this.engine.nextGeneration(false, false, this.graphDisabled, this.identify);
				if (!(this.engine.anythingAlive === 0 && this.engine.multiNumStates > 2)) {
					this.engine.convertToPensTile();
				}
				// check for just died for 2 state patterns
				if (this.engine.anythingAlive === 0 && this.engine.multiNumStates <= 2) {
					// clear the other buffer
					this.engine.anythingAlive = 1;
					this.engine.nextGeneration(false, false, this.graphDisabled, this.identify);
					this.engine.counter -= 1;
				}
			} else {
				this.engine.counter += 1;
				this.engine.convertToPensTile();
			}
			this.pasteRLEList();
		}

		// compute the final generation with stats on if required
		if (this.engine.counter < targetGen) {
			if (this.engine.anythingAlive) {
				this.engine.nextGeneration(this.statsOn, false, this.graphDisabled, this.identify);
				if (!(this.engine.anythingAlive === 0 && this.engine.multiNumStates > 2)) {
					this.engine.convertToPensTile();
				}
				// check for just died for 2 state patterns
				if (this.engine.anythingAlive === 0 && this.engine.multiNumStates <= 2) {
					// clear the other buffer
					this.engine.anythingAlive = 1;
					this.engine.nextGeneration(false, false, this.graphDisabled, this.identify);
					this.engine.counter -= 1;
				}
			} else {
				this.engine.counter += 1;
				this.engine.convertToPensTile();
			}
			this.pasteRLEList();
		}

		// restore the elapsed time
		this.elapsedTime = this.elapsedTimes[targetGen];
		this.floatCounter = targetGen;
		this.originCounter = targetGen;
	};

	// run to given generation (used to step back)
	View.prototype.runTo = function(targetGen) {
		var fading = this.historyStates + (this.engine.multiNumStates > 0 ? this.engine.multiNumStates : 0);

		// check whether history enabled
		if (!this.noHistory) {
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

		// remember current window scroll position since Safari moves it
		me.scrollPosition = document.documentElement.scrollTop || document.body.scrollTop;

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
			me.copyCompleteDisplayed = false;

			// disable menu
			me.viewMenu.locked = true;
		}
	};

	// complete copy to clipboard
	View.prototype.completeCopyToClipboard = function(me, twoPhase) {
		var selection = null,
			range = null,
			element = null;

		// select and copy the temporary elements contents to the clipboard
		if (!me.isEdge) {
			if (twoPhase) {
				element = me.tempDiv;
			} else {
				element = me.tempInput;
				element.contentEditable = "true";
				element.readOnly = "false";
			}
		} else {
			element = me.tempInput;
		}

		// focus on the element and select it
		element.focus();
		range = document.createRange();
		range.selectNodeContents(element);

		try {
			if (twoPhase) {
				document.execCommand("selectAll");
			} else {
				selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(range);
				element.setSelectionRange(0, 999999);
			}

			document.execCommand("copy");
		}
		catch(err) {
		}

		// remove the temporary element
		document.body.removeChild(me.tempDiv);
		me.tempRLE = "";

		// set focus to the canvas
		if (!me.menuManager.eventWasTouch) {
			me.mainContext.canvas.focus();
		}

		// clear notification
		me.menuManager.notification.notify("Copied to external clipboard", 15, 180, 15, true);

		if (twoPhase) {
			// clear copy mode
			me.clipboardCopy = false;

			// unlock menu
			me.viewMenu.locked = false;
		}

		// restore scroll position
		document.documentElement.scrollTop = document.body.scrollTop = me.scrollPosition;

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
			string += Keywords.tWord + " " + me.engine.counter + " ";
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

			// add ALIVESTATES if not default
			if (me.aliveStates !== me.maxAliveStates) {
				string += Keywords.aliveStatesWord + " " + me.aliveStates + " ";
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
		me.element.innerHTML = me.engine.asRLE(me, me.engine, true, me.engine.multiNumStates, me.engine.multiNumStates, [], true);
		me.element.value = me.element.innerHTML;
	};

	// replace the current rle with the given text
	View.prototype.loadText = function(me, text) {
		var result = false;

		// check whether prompt required
		if (me.undoButton.locked || me.randomGuard) {
			result = true;
		} else {
			result = window.confirm("Open clipboard?");
		}
		if (result) {
			me.element.innerHTML = text;
			me.element.value = me.element.innerHTML;
			updateMe(me.element);
		}
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
		me.copyToClipboard(me, me.engine.asRLE(me, me.engine, addComments, me.engine.multiNumStates, me.engine.multiNumStates, []), false);
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
			// @ts-ignore
			processed = KeyProcessor.processKeyHistory(me, keyCode, event);
		} else {
			if (me.identify) {
				// process the key in identify mode
				// @ts-ignore
				processed = KeyProcessor.processKeyIdentify(me, keyCode, event);
			} else {
				// check for clipboard copy
				if (me.clipboardCopy) {
					// @ts-ignore
					processed = KeyProcessor.processKeyCopy(me, keyCode, event);
				} else {
					// check for go to generation
					if (me.startFrom !== -1) {
						// @ts-ignore
						processed = KeyProcessor.processKeyGoTo(me, keyCode, event);
					} else {
						// process the key
						// @ts-ignore
						processed = KeyProcessor.processKey(me, keyCode, event);
					}
				}
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

	// update selection controls position based on window height
	View.prototype.updateSelectionControlsPosition = function() {
		if (this.engine.isLifeHistory || this.engine.isSuper) {
			this.invertSelectionButton.setPosition(Menu.southEast, -85, -130);
			this.randomButton.setPosition(Menu.southEast, -130, -130);
			this.randomButton.toolTip = "random fill [Shift 5]";
			if (this.engine.isLifeHistory) {
				this.randomItem.setPosition(Menu.southEast, -235, -130);
			} else {
				this.randomItem.setPosition(Menu.southEast, -280, -130);
			}
		} else {
			if (this.engine.multiNumStates <= 2) {
				this.invertSelectionButton.setPosition(Menu.southEast, -40, -130);
				this.randomButton.setPosition(Menu.southEast, -85, -130);
				this.randomButton.toolTip = "random fill [Shift 5]";
				this.randomItem.setPosition(Menu.southEast, -190, -130);
			} else {
				this.invertSelectionButton.setPosition(Menu.southEast, -40, -130);
				if (this.engine.isPCA) {
					this.randomButton.setPosition(Menu.southEast, -85, -130);
					this.randomButton.toolTip = "random multi-state fill [Shift 5]";
					this.randomItem.setPosition(Menu.southEast, -190, -130);
				} else {
					this.randomButton.setPosition(Menu.southEast, -130, -130);
					this.randomButton.toolTip = "random multi-state fill [Shift 5]";
					this.random2Button.setPosition(Menu.southEast, -85, -130);
					this.randomItem.setPosition(Menu.southEast, -235, -130);
				}
			}
		}
	};

	// update help topic buttons position based on window height
	View.prototype.updateTopicButtonsPosition = function() {
		var y = 0;

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
			if (this.waypointManager.numAnnotations() > 0) {
				y = -175;
			} else {
				y = -150;
			}
			this.helpKeysButton.setPosition(Menu.middle, 0, y);
			this.helpScriptsButton.setPosition(Menu.middle, 0, y + 50);
			this.helpInfoButton.setPosition(Menu.middle, 0, y + 100);
			this.helpThemesButton.setPosition(Menu.middle, 0, y + 150);
			this.helpColoursButton.setPosition(Menu.middle, 0, y + 200);
			this.helpAliasesButton.setPosition(Menu.middle, 0, y + 250);
			this.helpMemoryButton.setPosition(Menu.middle, 0, y + 300);
			this.helpAnnotationsButton.setPosition(Menu.middle, 0, y + 350);
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
		} else {
			element = (128 << 16) | (128 << 8) | 128;
		}
		if (this.engine.littleEndian) {
			this.iconManager.greyedOutCol = (255 << 24) | (element & 255) << 16 | (((element >> 8) & 255) << 8) | (element >> 16);
		} else {
			this.iconManager.greyedOutCol = ((element >> 16) << 24) | (((element >> 8) & 255) << 16) | ((element & 255) << 8) | 255;
		}

		// check for custom border
		element = this.customThemeValue[ViewConstants.customThemeUIBorder];
		if (element !== -1) {
			borderCol = "rgb(" + (element >> 16) + "," + ((element >> 8) & 255) + "," + (element & 255) + ")";
		}

		// set the menu colours
		this.menuManager.setColours(fgCol, bgCol, highlightCol, selectedCol, lockedCol, borderCol);
	};

	// create menus
	View.prototype.createMenus = function() {
		var i = 0, j = 0, x = 0, y = 0, lastX = 0;

		// View menu

		// create the view menu
		this.viewMenu = this.menuManager.createMenu(this.viewAnimate, this.viewStart, this);

		// add callback for background drag
		this.viewMenu.dragCallback = this.viewDrag;

		// add callback for wakeup when GUI locked
		this.viewMenu.wakeCallback = this.viewWakeUp;

		// identify banner label
		this.identifyBannerLabel = this.viewMenu.addLabelItem(Menu.north, 0, 52, 480, 48, "Banner");
		this.identifyBannerLabel.setFont("32px Arial");

		// create identify results labels
		this.identifyTypeLabel = this.viewMenu.addLabelItem(Menu.north, -160, 100, 160, 32, "Type");
		this.identifyCellsLabel = this.viewMenu.addLabelItem(Menu.north, -160, 140, 160, 32, "Cells");
		this.identifyBoxLabel = this.viewMenu.addLabelItem(Menu.north, -160, 180, 160, 32, "Bounding Box");
		this.identifyDirectionLabel = this.viewMenu.addLabelItem(Menu.north, -160, 240, 160, 32, "Direction");
		this.identifyPeriodLabel = this.viewMenu.addLabelItem(Menu.north, -160, 280, 160, 32, "Period");
		this.identifySlopeLabel = this.viewMenu.addLabelItem(Menu.north, -160, 320, 160, 32, "Slope");
		this.identifySpeedLabel = this.viewMenu.addLabelItem(Menu.north, -160, 360, 160, 32, "Speed");
		this.identifyHeatLabel = this.viewMenu.addLabelItem(Menu.north, -160, 400, 160, 32, "Heat");
		this.identifyVolatilityLabel = this.viewMenu.addLabelItem(Menu.north, -160, 440, 160, 32, "Volatility");
		this.identifyModLabel = this.viewMenu.addLabelItem(Menu.north, -160, 460, 160, 32, "Mod");
		this.identifyActiveLabel = this.viewMenu.addLabelItem(Menu.north, -160, 500, 160, 32, "Active Cells");
		this.identifyTemperatureLabel = this.viewMenu.addLabelItem(Menu.north, -160, 540, 160, 32, "Temperature");

		// create identify results values
		this.identifyTypeValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 100, 320, 32, "");
		this.identifyCellsValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 140, 320, 32, "");
		this.identifyBoxValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 180, 320, 32, "");
		this.identifyDirectionValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 220, 320, 32, "");
		this.identifyPeriodValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 260, 320, 32, "");
		this.identifySlopeValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 300, 320, 32, "");
		this.identifySpeedValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 340, 320, 32, "");
		this.identifyHeatValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 380, 320, 32, "");
		this.identifyVolatilityValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 420, 320, 32, "");
		this.identifyModValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 460, 320, 32, "");
		this.identifyActiveValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 500, 320, 32, "");
		this.identifyTemperatureValueLabel = this.viewMenu.addLabelItem(Menu.north, 80, 540, 320, 32, "");

		// infobar labels for camera X, Y and ANGLE
		this.infoBarLabelXLeft = this.viewMenu.addLabelItem(Menu.northWest, 0, 40, 16, 20, "X");
		this.infoBarLabelXLeft.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelXLeft.textOrientation = Menu.horizontal;
		this.infoBarLabelYLeft = this.viewMenu.addLabelItem(Menu.northWest, 70, 40, 16, 20, "Y");
		this.infoBarLabelYLeft.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelYLeft.textOrientation = Menu.horizontal;
		this.infoBarLabelAngleLeft = this.viewMenu.addLabelItem(Menu.northWest, 140, 40, 16, 20, "A");
		this.infoBarLabelAngleLeft.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelAngleLeft.textOrientation = Menu.horizontal;

		// infobar values for camera X, Y and ANGLE
		this.infoBarLabelXValue = this.viewMenu.addLabelItem(Menu.northWest, 16, 40, 54, 20, "");
		this.infoBarLabelXValue.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelXValue.textAlign = Menu.right;
		this.infoBarLabelXValue.toolTip = "camera X position";
		this.infoBarLabelYValue = this.viewMenu.addLabelItem(Menu.northWest, 86, 40, 54, 20, "");
		this.infoBarLabelYValue.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelYValue.textAlign = Menu.right;
		this.infoBarLabelYValue.toolTip = "camera Y position";
		this.infoBarLabelAngleValue = this.viewMenu.addLabelItem(Menu.northWest, 156, 40, 40, 20, "");
		this.infoBarLabelAngleValue.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelAngleValue.textAlign = Menu.right;
		this.infoBarLabelAngleValue.toolTip = "camera angle";

		// center divider for infobar
		this.infoBarLabelCenter = this.viewMenu.addLabelItem(Menu.northWest, 196, 40, 4, 20, "");

		// infobar labels for trackbox E, S, W and N speeds
		this.infoBarLabelERight = this.viewMenu.addLabelItem(Menu.northEast, -280, 40, 20, 20, "E");
		this.infoBarLabelERight.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelSRight = this.viewMenu.addLabelItem(Menu.northEast, -210, 40, 20, 20, "S");
		this.infoBarLabelSRight.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelWRight = this.viewMenu.addLabelItem(Menu.northEast, -140, 40, 20, 20, "W");
		this.infoBarLabelWRight.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelNRight = this.viewMenu.addLabelItem(Menu.northEast, -70, 40, 20, 20, "N");
		this.infoBarLabelNRight.setFont(ViewConstants.smallStatsFont);

		// infobar values for trackbox E, S, W and N speeds
		this.infoBarLabelEValueRight = this.viewMenu.addLabelItem(Menu.northEast, -260, 40, 50, 20, "");
		this.infoBarLabelEValueRight.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelEValueRight.textAlign = Menu.right;
		this.infoBarLabelEValueRight.toolTip = "bounding box east edge velocity";
		this.infoBarLabelSValueRight = this.viewMenu.addLabelItem(Menu.northEast, -190, 40, 50, 20, "");
		this.infoBarLabelSValueRight.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelSValueRight.textAlign = Menu.right;
		this.infoBarLabelSValueRight.toolTip = "bounding box south edge velocity";
		this.infoBarLabelWValueRight = this.viewMenu.addLabelItem(Menu.northEast, -120, 40, 50, 20, "");
		this.infoBarLabelWValueRight.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelWValueRight.textAlign = Menu.right;
		this.infoBarLabelWValueRight.toolTip = "bounding box west edge velocity";
		this.infoBarLabelNValueRight = this.viewMenu.addLabelItem(Menu.northEast, -50, 40, 50, 20, "");
		this.infoBarLabelNValueRight.setFont(ViewConstants.smallStatsFont);
		this.infoBarLabelNValueRight.textAlign = Menu.right;
		this.infoBarLabelNValueRight.toolTip = "bounding box north edge velocity";

		// autostart indicator
		this.autostartIndicator = this.viewMenu.addListItem(this.toggleAutostart, Menu.northEast, -210, 0, 38, 20, ["START"], [false], Menu.multi);
		this.autostartIndicator.setFont(ViewConstants.smallMenuFont);
		this.autostartIndicator.toolTip = ["autostart [Alt O]"];

		// stop indicator
		this.stopIndicator = this.viewMenu.addListItem(this.toggleStop, Menu.northEast, -210, 20, 38, 20, ["STOP"], [false], Menu.multi);
		this.stopIndicator.setFont(ViewConstants.smallMenuFont);
		this.stopIndicator.toolTip = ["stop [Alt P]"];

		// waypoints indicator
		this.waypointsIndicator = this.viewMenu.addListItem(this.toggleWP, Menu.northEast, -172, 0, 38, 20, ["WAYPT"], [false], Menu.multi);
		this.waypointsIndicator.setFont(ViewConstants.smallMenuFont);
		this.waypointsIndicator.toolTip = ["toggle waypoint mode [W]"];

		// loop indicator
		this.loopIndicator = this.viewMenu.addListItem(this.toggleLoop, Menu.northEast, -172, 20, 38, 20, ["LOOP"], [false], Menu.multi);
		this.loopIndicator.setFont(ViewConstants.smallMenuFont);
		this.loopIndicator.toolTip = ["toggle loop mode [Shift P]"];

		// mode list
		this.modeList = this.viewMenu.addListItem(this.viewModeList, Menu.northWest, 90, 0, 120, 40, ["", "", ""], ViewConstants.modePan, Menu.single);
		this.modeList.icon = [this.iconManager.icon("draw"), this.iconManager.icon("select"), this.iconManager.icon("pan")];
		this.modeList.toolTip = ["draw [F2]", "select [F4]", "pan [F5]"];

		// help section list
		this.helpSectionList = this.viewMenu.addListItem(this.viewHelpSectionList, Menu.northEast, -80, 100, 80, 60, ["1", "2"], 0, Menu.single);
		this.helpSectionList.orientation = Menu.vertical;
		this.helpSectionList.toolTip = ["", ""];
		this.helpSectionList.setFont("14px Arial");

		// help button
		this.helpToggle = this.viewMenu.addListItem(this.toggleHelp, Menu.northEast, -40, 0, 40, 40, ["Help"], [false], Menu.multi);
		this.helpToggle.toolTip = ["toggle help display [H]"];
		this.helpToggle.setFont("16px Arial");

		// help show topics button
		this.topicsButton = this.viewMenu.addButtonItem(this.topicsPressed, Menu.northEast, -40, 50, 40, 40, ["^"]);
		this.topicsButton.toolTip = "show help topics [Backspace]";

		// help sections button
		this.sectionsButton = this.viewMenu.addButtonItem(this.sectionsPressed, Menu.northEast, -40, 100, 40, 40, ["<"]);
		this.sectionsButton.toolTip = "show help sections";

		// help individual topic buttons
		this.helpKeysButton = this.viewMenu.addButtonItem(this.keysTopicPressed, Menu.north, 0, 50, 150, 40, ["Keys"]);
		this.helpKeysButton.toolTip = "show keyboard shortcuts [K]";

		this.helpScriptsButton = this.viewMenu.addButtonItem(this.scriptsTopicPressed, Menu.north, 0, 100, 150, 40, ["Scripts"]);
		this.helpScriptsButton.toolTip = "show script commands [S]";

		this.helpInfoButton = this.viewMenu.addButtonItem(this.infoTopicPressed, Menu.north, 0, 150, 150, 40, ["Info"]);
		this.helpInfoButton.toolTip = "show pattern and engine information [I]";

		this.helpThemesButton = this.viewMenu.addButtonItem(this.themesTopicPressed, Menu.north, 0, 200, 150, 40, ["Themes"]);
		this.helpThemesButton.toolTip = "show colour Themes [T]";

		this.helpColoursButton = this.viewMenu.addButtonItem(this.coloursTopicPressed, Menu.north, 0, 250, 150, 40, ["Colours"]);
		this.helpColoursButton.toolTip = "show colour names [C]";

		this.helpAliasesButton = this.viewMenu.addButtonItem(this.aliasesTopicPressed, Menu.north, 0, 300, 150, 40, ["Aliases"]);
		this.helpAliasesButton.toolTip = "show rule aliases [A]";

		this.helpMemoryButton = this.viewMenu.addButtonItem(this.memoryTopicPressed, Menu.north, 0, 350, 150, 40, ["Memory"]);
		this.helpMemoryButton.toolTip = "show memory usage [Y]";

		this.helpAnnotationsButton = this.viewMenu.addButtonItem(this.annotationsTopicPressed, Menu.north, 0, 350, 150, 40, ["Annotations"]);
		this.helpAnnotationsButton.toolTip = "show annotations [N]";

		// autofit button
		this.autoFitToggle = this.viewMenu.addListItem(this.toggleAutoFit, Menu.northWest, 0, 0, 40, 40, ["Auto"], [false], Menu.multi);
		this.autoFitToggle.icon = [this.iconManager.icon("autofit")];
		this.autoFitToggle.toolTip = ["toggle autofit [Shift F]"];
		this.autoFitToggle.setFont("16px Arial");

		// fit button
		this.fitButton = this.viewMenu.addButtonItem(this.fitPressed, Menu.northWest, 45, 0, 40, 40, "");
		this.fitButton.icon = this.iconManager.icon("fit");
		this.fitButton.toolTip = "fit pattern to display [F]";

		// grid toggle
		this.gridToggle = this.viewMenu.addListItem(this.toggleGrid, Menu.northEast, -85, 0, 40, 40, ["Grid"], [false], Menu.multi);
		this.gridToggle.icon = [this.iconManager.icon("grid")];
		this.gridToggle.toolTip = ["toggle gridlines [X]"];
		this.gridToggle.setFont("16px Arial");

		// add the progress bar
		this.progressBar = this.viewMenu.addProgressBarItem(Menu.southWest, 0, -40, 100, 40, 0, 100, 0, false, "", "", 0);
		this.progressBar.locked = true;

		// add the generation label (only used for Margolus rules)
		this.genLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -130, 42, 30, "Gen");
		this.genLabel.textAlign = Menu.left;
		this.genLabel.setFont(ViewConstants.statsFont);
		this.genLabel.toolTip = "generation";

		// add the generation value label (only used for Margolus rules)
		this.genValueLabel = this.viewMenu.addLabelItem(Menu.southWest, 42, -130, 98, 30, "");
		this.genValueLabel.textAlign = Menu.right;
		this.genValueLabel.setFont(ViewConstants.statsFont);
		this.genValueLabel.toolTip = "generation";

		// add the elapsed time label
		this.timeLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -100, 70, 30, "Time");
		this.timeLabel.textAlign = Menu.left;
		this.timeLabel.setFont(ViewConstants.statsFont);
		this.timeLabel.toolTip = "elapsed time";

		this.elapsedTimeLabel = this.viewMenu.addLabelItem(Menu.southWest, 70, -100, 70, 30, "");
		this.elapsedTimeLabel.textAlign = Menu.right;
		this.elapsedTimeLabel.setFont(ViewConstants.statsFont);
		this.elapsedTimeLabel.toolTip = "elapsed time";

		// add the selection size label
		this.selSizeLabel = this.viewMenu.addLabelItem(Menu.southWest, 166, -70, 130, 30, "");
		this.selSizeLabel.textAlign = Menu.left;
		this.selSizeLabel.setFont(ViewConstants.statsFont);
		this.selSizeLabel.toolTip = "selection size";

		// add the cursor position labels
		this.xyLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -70, 166, 30, "");
		this.xyLabel.textAlign = Menu.left;
		this.xyLabel.setFont(ViewConstants.statsFont);
		this.xyLabel.toolTip = "cell state at cursor position";

		// add the generation label
		this.genToggle = this.viewMenu.addListItem(this.viewStats, Menu.southWest, 0, -40, 100, 40, [""], [this.statsOn], Menu.multi);
		this.genToggle.toolTip = ["toggle generation statistics [G]\ngeneration " + (this.engine.counter + this.genOffset)];

		// add the failure reason label but delete it so it's initially hidden
		this.reasonLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -40, this.displayWidth - 40, 40, "");
		this.reasonLabel.textAlign = Menu.left;
		this.reasonLabel.deleted = true;

		// add the population label and value
		this.popLabel = this.viewMenu.addLabelItem(Menu.southEast, -70, -130, 70, 30, "Alive");
		this.popLabel.textAlign = Menu.left;
		this.popLabel.setFont(ViewConstants.statsFont);
		this.popLabel.toolTip = "current population";

		this.popValue = this.viewMenu.addLabelItem(Menu.southEast, -140, -130, 70, 30, "");
		this.popValue.textAlign = Menu.right;
		this.popValue.setFont(ViewConstants.statsFont);
		this.popValue.toolTip = "alive";

		// add the births label and value
		this.birthsLabel = this.viewMenu.addLabelItem(Menu.southEast, -70, -100, 70, 30, "Births");
		this.birthsLabel.textAlign = Menu.left;
		this.birthsLabel.setFont(ViewConstants.statsFont);
		this.birthsLabel.toolTip = "cells born this generation";

		this.birthsValue = this.viewMenu.addLabelItem(Menu.southEast, -140, -100, 70, 30, "");
		this.birthsValue.textAlign = Menu.right;
		this.birthsValue.setFont(ViewConstants.statsFont);
		this.birthsValue.toolTip = "births";

		// add the deaths label and value
		this.deathsLabel = this.viewMenu.addLabelItem(Menu.southEast, -70, -70, 70, 30, "Deaths");
		this.deathsLabel.textAlign = Menu.left;
		this.deathsLabel.setFont(ViewConstants.statsFont);
		this.deathsLabel.toolTip = "cells died this generation";

		this.deathsValue = this.viewMenu.addLabelItem(Menu.southEast, -140, -70, 70, 30, "");
		this.deathsValue.textAlign = Menu.right;
		this.deathsValue.setFont(ViewConstants.statsFont);
		this.deathsValue.toolTip = "deaths";

		// add the rule label
		this.ruleLabel = this.viewMenu.addLabelItem(Menu.southWest, 0, -160, 140, 30, this.patternRuleName);
		this.ruleLabel.setFont(ViewConstants.statsFont);

		// add the zoom range
		this.zoomItem = this.viewMenu.addRangeItem(this.viewZoomRange, Menu.north, 0, 0, ViewConstants.zoomSliderDefaultWidth, 40, 0, 1, 0.1, true, "Zoom ", "", 1);
		this.zoomItem.toolTip = "camera zoom [[ / ]]";

		// add the layers range
		this.layersItem = this.viewMenu.addRangeItem(this.viewLayersRange, Menu.west, 30, 0, 40, 292, ViewConstants.maxLayers, ViewConstants.minLayers, 1, true, "Layers ", "", 0);
		this.layersItem.toolTip = "number of layers [Q / A]";

		// add the depth range
		this.depthItem = this.viewMenu.addRangeItem(this.viewDepthRange, Menu.east, -70, 0, 40, 292, 1, 0, 0.1, true, "Depth ", "", 2);
		this.depthItem.toolTip = "depth between layers [P / L]";

		// add the angle range
		this.angleItem = this.viewMenu.addRangeItem(this.viewAngleRange, Menu.north, 0, 50, 390, 40, 0, 359, 0, true, "Angle ", "\u00B0", 0);
		this.angleItem.toolTip = "camera angle [< / >]";

		// shrink button
		this.shrinkButton = this.viewMenu.addButtonItem(this.shrinkPressed, Menu.southEast, -40, -90, 40, 40, "");
		this.shrinkButton.icon = this.iconManager.icon("shrink");
		this.shrinkButton.toolTip = "shrink to thumbnail [N]";

		// theme section label
		this.themeSectionLabel = this.viewMenu.addLabelItem(Menu.north, 0, 100, 120, 40, "");

		// hex/square cell toggle button
		this.hexCellButton = this.viewMenu.addListItem(this.viewHexCellToggle, Menu.middle, -100, -75, 180, 40, ["Use Rectangles"], [this.engine.forceRectangles], Menu.multi);
		this.hexCellButton.toolTip = ["toggle hexagonal cells [/]"];

		// cell borders toggle button
		this.bordersButton = this.viewMenu.addListItem(this.viewBordersToggle, Menu.middle, 100, -75, 180, 40, ["Cell Borders"], [this.engine.cellBorders], Menu.multi);
		this.bordersButton.toolTip = ["toggle cell borders [Alt B]"];

		// major gridlines toggle button
		this.majorButton = this.viewMenu.addListItem(this.viewMajorToggle, Menu.middle, -100, -25, 180, 40, ["Major GridLines"], [this.engine.gridLineMajorEnabled], Menu.multi);
		this.majorButton.toolTip = ["toggle major gridlines [Shift X]"];

		// stars toggle button
		this.starsButton = this.viewMenu.addListItem(this.viewStarsToggle, Menu.middle, 100, -25, 180, 40, ["Starfield"], [this.starsOn], Menu.multi);
		this.starsButton.toolTip = ["toggle starfield display [S]"];

		// label toggle button
		this.labelButton = this.viewMenu.addListItem(this.viewLabelToggle, Menu.middle, -100, 25, 180, 40, ["Annotations"], [this.showLabels], Menu.multi);
		this.labelButton.toolTip = ["toggle annotations [Alt L]"];

		// rainbow button
		this.rainbowButton = this.viewMenu.addListItem(this.viewRainbowToggle, Menu.middle, 100, 25, 180, 40, ["Rainbow"], [this.engine.rainbow], Menu.multi);
		this.rainbowButton.toolTip = ["toggle rainbow mode [Alt W]"]; 

		// autogrid toggle button
		this.autoGridButton = this.viewMenu.addListItem(this.viewAutoGridToggle, Menu.middle, -100, 75, 180, 40, ["Auto GridLines"], [this.autoGrid], Menu.multi);
		this.autoGridButton.toolTip = ["automatically turn on gridlines for Draw and Select and off for Pan [Ctrl G]"]; 

		// alt grid toggle button
		this.altGridButton = this.viewMenu.addListItem(this.viewAltGridToggle, Menu.middle, 100, 75, 180, 40, ["Alt GridLines"], [this.engine.altGrid], Menu.multi);
		this.altGridButton.toolTip = ["toggle alternating gridlines [Alt D]"]; 

		// historyfit toggle button
		this.historyFitButton = this.viewMenu.addListItem(this.viewHistoryFitToggle, Menu.middle, -100, -50, 180, 40, ["AutoFit History"], [this.historyFit], Menu.multi);
		this.historyFitButton.toolTip = ["toggle AutoFit History [Shift H]"];

		// add the throttle toggle button
		this.throttleToggle = this.viewMenu.addListItem(this.toggleThrottle, Menu.middle, 100, -50, 180, 40, ["Throttle"], [this.canBailOut], Menu.multi);
		this.throttleToggle.toolTip = ["toggle playback throttling [Alt T]"];

		// add the show lag toggle button
		this.showLagToggle = this.viewMenu.addListItem(this.toggleShowLag, Menu.middle, -100, 0, 180, 40, ["Perf. Warning"], [this.perfWarning], Menu.multi);
		this.showLagToggle.toolTip = ["toggle performance warning display [Shift W]"];

		// kill gliders toggle button
		this.killButton = this.viewMenu.addListItem(this.viewKillToggle, Menu.middle, 100, 0, 180, 40, ["Kill Gliders"], [this.engine.clearGliders], Menu.multi);
		this.killButton.toolTip = ["toggle kill escaping gliders [Ctrl L]"];

		// autohide toggle button
		this.autoHideButton = this.viewMenu.addListItem(this.viewAutoHideToggle, Menu.middle, 0, 50, 180, 40, ["AutoHide UI"], [this.hideGUI], Menu.multi);
		this.autoHideButton.toolTip = ["toggle hide UI on playback [Alt U]"]; 

		// rule button
		this.ruleButton = this.viewMenu.addButtonItem(this.rulePressed, Menu.middle, -100, -125, 180, 40, "Change Rule");
		this.ruleButton.toolTip = "change rule [Alt R]";

		// new button
		this.newButton = this.viewMenu.addButtonItem(this.newPressed, Menu.middle, 100, -125, 180, 40, "New Pattern");
		this.newButton.toolTip = "new pattern [Alt N]";

		// load button
		this.loadButton = this.viewMenu.addButtonItem(this.loadPressed, Menu.middle, -100, -75, 180, 40, "Load Pattern");
		this.loadButton.toolTip = "load last saved pattern [Ctrl O]";

		// save button
		this.saveButton = this.viewMenu.addButtonItem(this.savePressed, Menu.middle, 100, -75, 180, 40, "Save Pattern");
		this.saveButton.toolTip = "save pattern [Ctrl S]";

		// randomize button
		this.randomizeButton = this.viewMenu.addButtonItem(this.randomizePressed, Menu.middle, -100, -25, 180, 40, "Randomize");
		this.randomizeButton.toolTip = "randomize pattern and rule [Alt Z]";

		// copy rule button
		this.copyRuleButton = this.viewMenu.addButtonItem(this.copyRulePressed, Menu.middle, 100, -25, 180, 40, "Copy Rule");
		this.copyRuleButton.toolTip = "copy rule definition [Ctrl J]";

		// identify button
		this.identifyButton = this.viewMenu.addButtonItem(this.identifyPressed, Menu.middle, -100, 25, 180, 40, "Identify");
		this.identifyButton.toolTip = "identify oscillator or spaceship period [F6]";

		// fast identify button
		this.fastIdentifyButton = this.viewMenu.addButtonItem(this.fastIdentifyPressed, Menu.middle, 100, 25, 180, 40, "Fast Identify");
		this.fastIdentifyButton.toolTip = "quickly identify oscillator or spaceship period [Ctrl F6]";

		// image button
		this.saveImageButton = this.viewMenu.addButtonItem(this.saveImagePressed, Menu.middle, -100, 75, 180, 40, "Save Image");
		this.saveImageButton.toolTip = "save image in new window [O]";

		// save graph button
		this.saveGraphButton = this.viewMenu.addButtonItem(this.saveGraphPressed, Menu.middle, 100, 75, 180, 40, "Save Graph");
		this.saveGraphButton.toolTip = "save population graph image in new window [Shift O]";

		// go to generation button
		this.goToGenButton = this.viewMenu.addButtonItem(this.goToGenPressed, Menu.middle, 100, 125, 180, 40, "Go To Gen");
		this.goToGenButton.toolTip = "go to specified generation [Shift N]";

		// fps button
		this.fpsButton = this.viewMenu.addListItem(this.viewFpsToggle, Menu.middle, 0, -100, 180, 40, ["Frame Times"], [this.menuManager.showTiming], Menu.multi);
		this.fpsButton.toolTip = ["toggle timing display [T]"];

		// timing detail button
		this.timingDetailButton = this.viewMenu.addListItem(this.viewTimingDetailToggle, Menu.middle, 0, -50, 180, 40, ["Timing Details"], [this.menuManager.showExtendedTiming], Menu.multi);
		this.timingDetailButton.toolTip = ["toggle timing details [Shift T]"];

		// infobar toggle button
		this.infoBarButton = this.viewMenu.addListItem(this.viewInfoBarToggle, Menu.middle, 0, 0, 180, 40, ["Display Info Bar"], [this.infoBarEnabled], Menu.multi);
		this.infoBarButton.toolTip = ["toggle Information Bar [Shift I]"];

		// relative toggle button
		this.relativeToggle = this.viewMenu.addListItem(this.viewRelativeToggle, Menu.middle, 0, 50, 180, 40, ["Relative Gen"], [this.genRelative], Menu.multi);
		this.relativeToggle.toolTip = ["toggle absolute/relative generation display [Shift G]"];

		// quality rendering toggle button
		this.qualityToggle = this.viewMenu.addListItem(this.viewQualityToggle, Menu.middle, 0, 100, 180, 40, ["Render Quality"], [this.engine.pretty], Menu.multi);
		this.qualityToggle.toolTip = ["toggle anti-aliased cell display [Ctrl Q]"];

		// previous universe button
		this.prevUniverseButton = this.viewMenu.addButtonItem(this.prevUniversePressed, Menu.south, -135, -100, 120, 40, "Prev");
		this.prevUniverseButton.toolTip = "go to previous universe [Page Up]";

		// next universe button
		this.nextUniverseButton = this.viewMenu.addButtonItem(this.nextUniversePressed, Menu.south, 135, -100, 120, 40, "Next");
		this.nextUniverseButton.toolTip = "go to next universe [Page Down]";

		// esc button
		this.escButton = this.viewMenu.addButtonItem(this.escPressed, Menu.southEast, -40, -85, 40, 40, "Esc");
		this.escButton.toolTip = "close errors";
		this.escButton.setFont("16px Arial");
		
		// previous POI button
		this.prevPOIButton = this.viewMenu.addButtonItem(this.prevPOIPressed, Menu.west, 10, 0, 40, 40, "<");
		this.prevPOIButton.toolTip = "go to previous POI [Shift J]";

		// next POI button
		this.nextPOIButton = this.viewMenu.addButtonItem(this.nextPOIPressed, Menu.east, -50, 0, 40, 40, ">");
		this.nextPOIButton.toolTip = "go to next POI [J]";

		// opacity range
		this.opacityItem = this.viewMenu.addRangeItem(this.viewOpacityRange, Menu.north, 0, 45, 172, 40, 0, 1, this.popGraphOpacity, true, "Opacity ", "%", 0);
		this.opacityItem.toolTip = "graph opacity [7 / 9]";

		// points/lines toggle
		this.linesToggle = this.viewMenu.addListItem(this.toggleLines, Menu.northEast, -85, 45, 40, 40, [""], [false], Menu.multi);
		this.linesToggle.icon = [this.iconManager.icon("lines")];
		this.linesToggle.toolTip = ["toggle graph lines/points [Shift Y]"];

		// identify  close button
		this.identifyCloseButton = this.viewMenu.addButtonItem(this.identifyClosePressed, Menu.northEast, -40, 45, 40, 40, "X");
		this.identifyCloseButton.toolTip = "close results [Esc]";

		// graph close button
		this.graphCloseButton = this.viewMenu.addButtonItem(this.graphClosePressed, Menu.northEast, -40, 45, 40, 40, "X");
		this.graphCloseButton.toolTip = "close graph [Y]";

		// pick toggle
		this.pickToggle = this.viewMenu.addListItem(this.togglePick, Menu.northWest, 0, 45, 40, 40, [""], [this.pickMode], Menu.multi);
		this.pickToggle.icon = [this.iconManager.icon("pick")];
		this.pickToggle.toolTip = ["pick state [F3]"];

		// states toggle
		this.statesToggle = this.viewMenu.addListItem(this.toggleStates, Menu.northWest, 45, 45, 40, 40, [""], [this.showStates], Menu.multi);
		this.statesToggle.icon = [this.iconManager.icon("states")];
		this.statesToggle.toolTip = ["toggle states display [Ctrl D]"];

		// pause playback while drawing toggle
		this.pausePlaybackToggle = this.viewMenu.addListItem(this.togglePausePlayback, Menu.northWest, 90, 45, 40, 40, [""], [this.pauseWhileDrawing], Menu.multi);
		this.pausePlaybackToggle.icon = [this.iconManager.icon("drawpause")];
		this.pausePlaybackToggle.toolTip = ["toggle pause playback while drawing [Ctrl P]"];

		// smart drawing toggle
		this.smartToggle = this.viewMenu.addListItem(this.toggleSmart, Menu.northWest, 135, 45, 40, 40, [""], [this.smartDrawing], Menu.multi);
		this.smartToggle.icon = [this.iconManager.icon("smart")];
		this.smartToggle.toolTip = ["toggle smart drawing [Shift F2]"];

		// add menu toggle button
		this.navToggle = this.viewMenu.addListItem(this.toggleSettings, Menu.southEast, -40, -40, 40, 40, [""], [false], Menu.multi);
		this.navToggle.icon = [this.iconManager.icon("menu")];
		this.navToggle.toolTip = ["toggle settings menu [M]"];

		// add the pattern button
		this.patternButton = this.viewMenu.addButtonItem(this.patternPressed, Menu.middle, 0, -125, 150, 40, "Pattern");
		this.patternButton.toolTip = "pattern settings";

		// add the back button
		this.backButton = this.viewMenu.addButtonItem(this.backPressed, Menu.south, 0, -100, 120, 40, "Back");
		this.backButton.toolTip = "back to previous menu [Backspace]";

		// add the cancel button
		this.cancelButton = this.viewMenu.addButtonItem(this.cancelPressed, Menu.south, 0, -100, 120, 40, "Cancel");
		this.cancelButton.toolTip = "cancel operation [Esc]";
		this.cancelButton.overrideLocked = true;


		// add the colour theme button
		this.themeButton = this.viewMenu.addButtonItem(this.themePressed, Menu.middle, 0, -75, 150, 40, "Theme");
		this.themeButton.toolTip = "choose colour theme";

		// graph toggle button
		this.graphButton = this.viewMenu.addListItem(this.viewGraphToggle, Menu.middle, 0, -25, 150, 40, ["Graph"], [this.popGraph], Menu.multi);
		this.graphButton.toolTip = ["toggle population graph display [Y]"];

		// add the info button
		this.infoButton = this.viewMenu.addButtonItem(this.infoPressed, Menu.middle, 0, 25, 150, 40, "Advanced");
		this.infoButton.toolTip = "advanced settings";

		// add the display button
		this.displayButton = this.viewMenu.addButtonItem(this.displayPressed, Menu.middle, 0, 75,  150, 40, "Display");
		this.displayButton.toolTip = "display settings";

		// add the playback button
		this.playbackButton = this.viewMenu.addButtonItem(this.playbackPressed, Menu.middle, 0, 125, 150, 40, "Playback");
		this.playbackButton.toolTip = "playback settings";

		// add the theme selections
		lastX = -1;
		for (i = 0; i <= this.engine.numThemes; i += 1) {
			j = ViewConstants.themeOrder[i];
			x = ViewConstants.themeX[i];
			if (x !== lastX) {
				y = 120;
				lastX = x;
			} else {
				y += 60;
			}
			this.themeSelections[i] = this.viewMenu.addListItem(null, Menu.north, x * 140 - 210, y, 120, 40, [this.themeName(j)], [false], Menu.multi);
			this.themeSelections[i].toolTip = ["select " + this.themeName(j) + " theme"];
			this.themeSelections[i].setFont("20px Arial");
		}

		// set callbacks
		this.themeSelections[0].callback = this.toggleTheme0;
		this.themeSelections[1].callback = this.toggleTheme1;
		this.themeSelections[2].callback = this.toggleTheme2;
		this.themeSelections[3].callback = this.toggleTheme3;
		this.themeSelections[4].callback = this.toggleTheme4;
		this.themeSelections[5].callback = this.toggleTheme5;
		this.themeSelections[6].callback = this.toggleTheme6;
		this.themeSelections[7].callback = this.toggleTheme7;
		this.themeSelections[8].callback = this.toggleTheme8;
		this.themeSelections[9].callback = this.toggleTheme9;
		this.themeSelections[10].callback = this.toggleTheme10;
		this.themeSelections[11].callback = this.toggleTheme11;
		this.themeSelections[12].callback = this.toggleTheme12;
		this.themeSelections[13].callback = this.toggleTheme13;
		this.themeSelections[14].callback = this.toggleTheme14;
		this.themeSelections[15].callback = this.toggleTheme15;
		this.themeSelections[16].callback = this.toggleTheme16;
		this.themeSelections[17].callback = this.toggleTheme17;
		this.themeSelections[18].callback = this.toggleTheme18;
		this.themeSelections[19].callback = this.toggleTheme19;
		this.themeSelections[20].callback = this.toggleTheme20;

		// add the theme category labels
		this.themeDefaultLabel = this.viewMenu.addLabelItem(Menu.north, -210, 60, 120, 40, "Default");
		this.themeClassicLabel = this.viewMenu.addLabelItem(Menu.north, -70, 60, 120, 40, "Classic");
		this.themeProgramLabel = this.viewMenu.addLabelItem(Menu.north, 70, 60, 120, 40, "Program");
		this.themeDebugLabel = this.viewMenu.addLabelItem(Menu.north, 210, 60, 120, 40, "Basic");

		// add the generation speed range
		this.generationRange = this.viewMenu.addRangeItem(this.viewGenerationRange, Menu.southEast, -365, -40, 75, 40, 0, 1, 0, true, "", "", -1);
		this.generationRange.toolTip = "steps per second [+ / -]";

		// add the speed step range
		this.stepRange = this.viewMenu.addRangeItem(this.viewStepRange, Menu.southEast, -285, -40, 75, 40, ViewConstants.minStepSpeed, ViewConstants.maxStepSpeed, 1, true, "x", "", 0);
		this.stepRange.toolTip = "generations per step [E / D]";

		// add the actual step label
		this.stepLabel = this.viewMenu.addLabelItem(Menu.southEast, -285, -60, 75, 20, 0);
		this.stepLabel.setFont(ViewConstants.statsFont);
		this.stepLabel.deleted = true;

		// add the undo button
		this.undoButton = this.viewMenu.addButtonItem(this.undoPressed, Menu.southEast, -455, -40, 40, 40, "");
		this.undoButton.icon = this.iconManager.icon("undo");
		this.undoButton.toolTip = "undo [Ctrl Z]";

		// add the redo button
		this.redoButton = this.viewMenu.addButtonItem(this.redoPressed, Menu.southEast, -410, -40, 40, 40, "");
		this.redoButton.icon = this.iconManager.icon("redo");
		this.redoButton.toolTip = "redo [Ctrl Y]";

		// add the copy sync toggle
		this.copySyncToggle = this.viewMenu.addListItem(this.viewCopySyncList, Menu.northEast, -130, 0, 40, 40, ["Sync"], [this.copySyncExternal], Menu.multi);
		this.copySyncToggle.toolTip = ["sync cut and copy with external clipboard [Alt S]"];
		this.copySyncToggle.setFont("15px Arial");

		// add play and pause list
		this.playList = this.viewMenu.addListItem(this.viewPlayList, Menu.southEast, -205, -40, 160, 40, ["", "", "", ""], ViewConstants.modePause, Menu.single);
		this.playList.icon = [this.iconManager.icon("tostart"), this.iconManager.icon("stepback"), this.iconManager.icon("stepforward"), this.iconManager.icon("play")];
		this.playList.toolTip = ["reset [R]", "previous generation [Shift Tab]", "next generation [Tab]", "play [Enter]"];

		// add states for editor
		this.stateList = this.viewMenu.addListItem(this.viewStateList, Menu.northEast, -280, 45, 280, 20, ["0", "1", "2", "3", "4", "5", "6"], this.drawState, Menu.single);
		this.stateList.toolTip = ["dead", "alive", "history", "mark 1", "mark off", "mark 2", "kill"];
		this.stateList.setFont("14px Arial");

		// add state colours for editor
		this.stateColsList = this.viewMenu.addListItem(this.viewStateColsList, Menu.northEast, -280, 65, 280, 20, ["", "", "", "", "", "", ""], [false, false, false, false, false, false, false], Menu.multi);
		this.stateColsList.toolTip = ["dead", "alive", "history", "mark 1", "mark off", "mark 2", "kill"];
		this.stateColsList.bgAlpha = 1;

		// add spacer to left of states slider
		this.statesSpacer = this.viewMenu.addButtonItem(null, Menu.northWest, 175, 45, 5, 40, "");
		this.statesSpacer.bgAlpha = 0;
		this.statesSpacer.locked = true;
		this.statesSpacer.border = 0;

		// add slider for states
		this.statesSlider = this.viewMenu.addRangeItem(this.viewStatesRange, Menu.northWest, 180, 45, 100, 40, 0, 1, 0, true, "", "", -1);
		this.statesSlider.toolTip = "select drawing states range";

		// select all button
		this.selectAllButton = this.viewMenu.addButtonItem(this.selectAllPressed, Menu.northWest, 0, 45, 40, 40, "All");
		this.selectAllButton.icon = this.iconManager.icon("select");
		this.selectAllButton.toolTip = "select all cells [Ctrl A]";
		this.selectAllButton.setFont("16px Arial");

		// auto-shrink toggle
		this.autoShrinkToggle = this.viewMenu.addListItem(this.viewAutoShrinkList, Menu.northWest, 45, 45, 40, 40, ["Auto"], [this.autoShrink], Menu.multi);
		this.autoShrinkToggle.icon = [this.iconManager.icon("autoshrink")];
		this.autoShrinkToggle.toolTip = ["toggle auto shrink selection [Alt A]"];
		this.autoShrinkToggle.setFont("16px Arial");

		// library button
		this.libraryToggle = this.viewMenu.addListItem(null, Menu.northWest, 90, 45, 40, 40, [""], [false], Menu.multi);
		this.libraryToggle.icon = [this.iconManager.icon("selectlibrary")];
		this.libraryToggle.toolTip = ["toggle clipboard library [Shift B]"];

		// clipboard list
		this.clipboardList = this.viewMenu.addListItem(this.viewClipboardList, Menu.north, 0, 90, 400, 40, ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], this.currentPasteBuffer, Menu.single);
		this.createClipboardTooltips();

		// paste mode list
		this.pasteModeList = this.viewMenu.addListItem(this.viewPasteModeList, Menu.northEast, -160, 45, 160, 40, ["AND", "CPY", "OR", "XOR"], ViewConstants.uiPasteModes[this.pasteModeForUI], Menu.single);
		this.pasteModeList.toolTip = ["paste mode [Shift M]", "paste mode [Shift M]", "paste mode [Shift M]", "paste mode [Shift M]"];
		this.pasteModeList.setFont("16px Arial");

		// add the cut button
		this.cutButton = this.viewMenu.addButtonItem(this.cutPressed, Menu.northWest, 135, 45, 40, 40, "");
		this.cutButton.icon = this.iconManager.icon("cut");
		this.cutButton.toolTip = "cut [Ctrl X]";

		// add the copy button
		this.copyButton = this.viewMenu.addButtonItem(this.copyPressed, Menu.northWest, 180, 45, 40, 40, "");
		this.copyButton.icon = this.iconManager.icon("copy");
		this.copyButton.toolTip = "copy [Ctrl C]";

		// add the paste button
		this.pasteButton = this.viewMenu.addButtonItem(this.pastePressed, Menu.northWest, 225, 45, 40, 40, "");
		this.pasteButton.icon = this.iconManager.icon("paste");
		this.pasteButton.toolTip = "paste [Ctrl V]";

		// add the nudge left button
		this.nudgeLeftButton = this.viewMenu.addButtonItem(this.nudgeLeftPressed, Menu.southEast, -175, -175, 40, 40, "");
		this.nudgeLeftButton.icon = this.iconManager.icon("nudgeleft");
		this.nudgeLeftButton.toolTip = "nudge left [Alt Left]";

		// add the nudge right button
		this.nudgeRightButton = this.viewMenu.addButtonItem(this.nudgeRightPressed, Menu.southEast, -130, -175, 40, 40, "");
		this.nudgeRightButton.icon = this.iconManager.icon("nudgeright");
		this.nudgeRightButton.toolTip = "nudge right [Alt Right]";

		// add the nudge up button
		this.nudgeUpButton = this.viewMenu.addButtonItem(this.nudgeUpPressed, Menu.southEast, -85, -175, 40, 40, "");
		this.nudgeUpButton.icon = this.iconManager.icon("nudgeup");
		this.nudgeUpButton.toolTip = "nudge up [Alt Up]";

		// add the nudge down button
		this.nudgeDownButton = this.viewMenu.addButtonItem(this.nudgeDownPressed, Menu.southEast, -40, -175, 40, 40, "");
		this.nudgeDownButton.icon = this.iconManager.icon("nudgedown");
		this.nudgeDownButton.toolTip = "nudge down [Alt Down]";

		// add the flip X button
		this.flipXButton = this.viewMenu.addButtonItem(this.flipXPressed, Menu.southEast, -265, -85, 40, 40, "");
		this.flipXButton.icon = this.iconManager.icon("flipx");
		this.flipXButton.toolTip = "flip horizontally [Alt X]";

		// add the flip Y button
		this.flipYButton = this.viewMenu.addButtonItem(this.flipYPressed, Menu.southEast, -220, -85, 40, 40, "");
		this.flipYButton.icon = this.iconManager.icon("flipy");
		this.flipYButton.toolTip = "flip vertically [Alt Y]";

		// add the rotate clockwise button
		this.rotateCWButton = this.viewMenu.addButtonItem(this.rotateCWPressed, Menu.southEast, -175, -85, 40, 40, "");
		this.rotateCWButton.icon = this.iconManager.icon("rotatecw");
		this.rotateCWButton.toolTip = "rotate clockwise [>]";

		// add the rotate counter-clockwise button
		this.rotateCCWButton = this.viewMenu.addButtonItem(this.rotateCCWPressed, Menu.southEast, -130, -85, 40, 40, "");
		this.rotateCCWButton.icon = this.iconManager.icon("rotateccw");
		this.rotateCCWButton.toolTip = "rotate counter-clockwise [<]";

		// add the clear selection button
		this.clearSelectionButton = this.viewMenu.addButtonItem(this.clearSelectionPressed, Menu.southEast, -85, -85, 40, 40, "");
		this.clearSelectionButton.icon = this.iconManager.icon("inside");
		this.clearSelectionButton.toolTip = "clear cells in selection [Del]";

		// add the clear outside button
		this.clearOutsideButton = this.viewMenu.addButtonItem(this.clearOutsidePressed, Menu.southEast, -40, -85, 40, 40, "");
		this.clearOutsideButton.icon = this.iconManager.icon("outside");
		this.clearOutsideButton.toolTip = "clear cells outside selection [Shift Del]";

		// add the clear [R]History or [R]Super button
		this.clearRHistoryButton = this.viewMenu.addButtonItem(this.clearRHistoryPressed, Menu.southEast, -40, -130, 40, 40, "R");
		this.clearRHistoryButton.icon = this.iconManager.icon("select");
		this.clearRHistoryButton.toolTip = "clear [R]History cells [Ctrl Del]";
		this.clearRHistoryButton.setFont("16px Arial");

		// add the invert selection button
		this.invertSelectionButton = this.viewMenu.addButtonItem(this.invertSelectionPressed, Menu.southEast, -85, -130, 40, 40, "");
		this.invertSelectionButton.icon = this.iconManager.icon("invertselection");
		this.invertSelectionButton.toolTip = "invert cells in selection [Ctrl I]";

		// add the random button
		this.randomButton = this.viewMenu.addButtonItem(this.randomPressed, Menu.southEast, -130, -130, 40, 40, "");
		this.randomButton.icon = this.iconManager.icon("random");
		this.randomButton.toolTip = "random fill [Shift 5]";

		// add the random 2-state button
		this.random2Button = this.viewMenu.addButtonItem(this.random2Pressed, Menu.southEast, -175, -130, 40, 40, "2");
		this.random2Button.icon = this.iconManager.icon("random");
		this.random2Button.toolTip = "random 2-state fill [Ctrl Shift 5]";

		// add the random density slider
		this.randomItem = this.viewMenu.addRangeItem(this.viewRandomRange, Menu.southEast, -275, -130, 100, 40, 1, 100, this.randomDensity, true, "", "%", 0);
		this.randomItem.toolTip = "random fill density";

		// add the paste position slider
		this.pastePositionItem = this.viewMenu.addRangeItem(this.viewPastePositionRange, Menu.northEast, -265, 45, 100, 40, 0, ViewConstants.numPastePositions - 1, this.pastePosition, true, "", "", -1);
		this.pastePositionItem.toolTip = "paste location [Shift L]";
		this.pastePositionItem.setFont("16px Arial");

		// reverse direction button
		this.directionButton = this.viewMenu.addButtonItem(this.directionPressed, Menu.southEast, -40, -85, 40, 40, "");
		this.directionButton.icon = this.iconManager.icon("uturn");
		this.directionButton.toolTip = "reverse playback direction [U]";

		// add items to the library toggle
		this.libraryToggle.addItemsToToggleMenu([this.clipboardList], []);

		// add items to the main toggle menu
		this.navToggle.addItemsToToggleMenu([this.themeSectionLabel, this.layersItem, this.depthItem, this.angleItem, this.backButton, this.themeButton, this.patternButton, this.infoButton, this.displayButton, this.playbackButton, this.throttleToggle, this.showLagToggle, this.shrinkButton, this.escButton, this.autoHideButton, this.autoGridButton, this.altGridButton, this.hexCellButton, this.bordersButton, this.labelButton, this.killButton, this.graphButton, this.fpsButton, this.timingDetailButton, this.infoBarButton, this.starsButton, this.historyFitButton, this.majorButton, this.prevUniverseButton, this.nextUniverseButton], []);

		// add statistics items to the toggle
		this.genToggle.addItemsToToggleMenu([this.popLabel, this.popValue, this.birthsLabel, this.birthsValue, this.deathsLabel, this.deathsValue, this.genLabel, this.genValueLabel, this.timeLabel, this.elapsedTimeLabel, this.ruleLabel], []);

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

			// setup the 2d drawing context
			this.mainContext = this.mainCanvas.getContext("2d", {alpha: false});
			this.mainContext.globalAlpha = 1;
			this.mainContext.fillStyle = "black";
			this.mainContext.imageSmoothingEnabled = false;
			this.mainContext.imageSmoothingQuality = "low";
			this.mainContext.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

			// set the font alignment
			this.mainContext.textAlign = "left";
			this.mainContext.textBaseline = "middle";

			// set the width and height from the canvas
			this.displayWidth = this.mainCanvas.width;
			this.displayHeight = this.mainCanvas.height;

			// initialise life engine
			this.engine = new Life(this.mainContext, this.displayWidth, this.displayHeight, this.defaultGridWidth, this.defaultGridHeight, this.manager);
			this.engine.initEngine(this.mainContext, this.displayWidth, this.displayHeight);

			// create the elapsed times buffer
			this.elapsedTimes = this.engine.allocator.allocate(Float32, ViewConstants.numElapsedTimes, "View.elapsedTimes");

			// create the starfield
			this.starField = new Stars(ViewConstants.numStars, this.engine.allocator);

			// create the icon manager and icons
			this.createIcons(this.mainContext);

			// create the menu manager
			this.menuManager = new MenuManager(this.mainCanvas, this.mainContext, "24px Arial", this.iconManager, this, this.gotFocus);
			
			// disable fps display
			this.menuManager.showTiming = false;

			// create colour themes before the menus so the control has the right number of themes
			this.engine.createColourThemes();

			// create menu
			this.createMenus();

			// save position of moveable menu items
			this.playListX = this.playList.relX;
			this.generationRangeX = this.generationRange.relX;
			this.stepRangeX = this.stepRange.relX;

			// register mouse wheel event
			registerEvent(this.mainCanvas, "wheel", function(event) {me.wheel(me,event);}, false);

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
		    ctx = this.mainContext,

		    // width of title bar
		    titleWidth = 500,

		    // length of message in characters
		    length = message.length,

		    // width in pixels
		    pxWidth = 0,

		    // index
			i = length,
			
			// font size
			itemFontSize = 18;

		// scale font
		itemFontSize = (itemFontSize * this.viewMenu.yScale) | 0;

		// set the variable font
		ctx.font = itemFontSize + "px " + ViewConstants.variableFontFamily;

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
		// @ts-ignore
		ScriptParser.parseScript(this, scriptString, numStates);
	};

	// reset any view controls that scripts can overwrite
	View.prototype.resetScriptControls = function() {
		// reset exclusive playback
		this.exclusivePlayback = false;

		// reset ignore pause requests
		this.ignorePauseRequests = false;

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

		// clear randomize pattern
		this.randomizePattern = false;

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
		this.customColours = null;
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
		this.stopDisabled = false;

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

		// reset alive states
		this.aliveStates = this.maxAliveStates;

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

			// mark this canvas as not having focus so future taps launch thumbnails
			this.menuManager.hasFocus = false;
		} else {
			// switch to full size
			this.displayWidth = this.thumbOrigWidth;
			this.displayHeight = this.thumbOrigHeight;

			// set original zoom
			if (!this.autoFit) {
				this.engine.zoom = this.thumbOrigZoom;
			} else {
				this.thumbnail = false;
				this.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
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
			if (!this.menuManager.eventWasTouch) {
				this.menuManager.notification.notify("Shrink with hotkey N", 15, 100, 15, true);
			}

			// resize
			this.resize();
		}
	};

	// callback when viewer gets focus
	View.prototype.gotFocus = function(me) {
		// check if thumbnail mode on
		if (me.thumbnail) {
			me.switchOffThumbnail();
			if (me.thumbStart) {
				if (!me.generationOn) {
					me.playList.current = me.viewPlayList(ViewConstants.modePlay, true, me);
				}
			}
		} else {
			// check for NOGUI
			if (me.noGUI) {
				if (!me.noCopy) {
					me.copyRLE(me, false);
				}
			}
		}

		// mark copy complete message not displayed
		me.copyCompleteDisplayed = false;
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

		// set text alignment
		this.mainContext.textBaseline = "middle";

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
		this.menuManager.hasFocus = false;
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
		this.stateList.setWidth(40 * states);
		this.stateColsList.lower = [];
		this.stateColsList.toolTip = [];
		this.stateColsList.current = [];
		this.stateColsList.setWidth(40 * states);
		this.stateColsList.bgAlpha = 1;
		for (i = 0; i < states; i += 1) {
			state = i + this.startState;
			this.stateList.lower[i] = String(state);
			message = this.getStateName(state);
			if (state < 10) {
				message += " [Ctrl " + state + "]";
			}
			this.stateList.toolTip[i] = message;
			this.stateColsList.lower[i] = "";
			this.stateColsList.toolTip[i] = message;
			this.stateColsList.current[i] = false;
		}

		// update the selected state
		state = this.drawState;
		if (state > 0) {
			if (!(this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper)) {
				state = this.engine.multiNumStates - state;
			}
		}
		this.stateList.current = state - this.startState;
	};

	// setup state list for drawing
	View.prototype.setupStateList = function() {
		var states = this.engine.multiNumStates,
			xScale = this.viewMenu.xScale;

		// reset drawing state
		this.drawState = 1;
		this.startState = 0;
		this.statesToggle.current = [this.toggleStates([true], true, this)];

		// compute the maximum number of display states based on width
		this.maxDisplayStates = 7 + (((this.displayWidth / xScale - ViewConstants.minViewerWidth) / (40 * xScale)) | 0);
		if (this.maxDisplayStates > states) {
			this.maxDisplayStates = states;
		}

		if (this.engine.isLifeHistory) {
			// add LifeHistory states for editor
			this.stateList.lower = ["0", "1", "2", "3", "4", "5", "6"];
			this.stateList.setWidth(280);
			this.stateList.toolTip = ["dead [Ctrl 0]", "alive [Ctrl 1]", "history [Ctrl 2]", "mark 1 [Ctrl 3]", "mark off [Ctrl 4]", "mark 2 [Ctrl 5]", "kill [Ctrl 6]"];
			this.stateList.current = this.drawState;

			// add LifeHistory state colours for editor
			this.stateColsList.lower = ["", "", "", "", "", "", ""];
			this.stateColsList.setWidth(280);
			this.stateColsList.toolTip = ["dead [Ctrl 0]", "alive [Ctrl 1]", "history [Ctrl 2]", "mark 1 [Ctrl 3]", "mark off [Ctrl 4]", "mark 2 [Ctrl 5]", "kill [Ctrl 6]"];
			this.stateColsList.bgAlpha = 1;
			this.stateColsList.current = [false, false, false, false, false, false, false];
		} else {
			// check for 2 state
			if (states <= 2) {
				// add states for editor
				this.stateList.lower = ["0", "1"];
				this.stateList.setWidth(80);
				this.stateList.toolTip = ["dead [Ctrl 0]", "alive [Ctrl 1]"];
				this.stateList.current = this.drawState;
	
				// add state colours for editor
				this.stateColsList.lower = ["", ""];
				this.stateColsList.setWidth(80);
				this.stateColsList.toolTip = ["dead [Ctrl 0]", "alive [Ctrl 1]"];
				this.stateColsList.bgAlpha = 1;
				this.stateColsList.current = [false, false];
			} else {
				if (this.engine.isNone || this.engine.isPCA || this.engine.isRuleTree || this.engine.isSuper) {
					this.drawState = 1;
				} else {
					this.drawState = states - 1;
				}
				this.updateStatesList();
				this.stateList.setWidth(this.maxDisplayStates * 40);
				this.stateColsList.setWidth(this.maxDisplayStates * 40);
				this.statesSlider.current = this.viewStatesRange([0, 0], true, this);
			}
		}
		this.stateList.setPosition(Menu.northEast, -this.stateList.relWidth, 45);
		this.stateColsList.setPosition(Menu.northEast, -this.stateColsList.relWidth, 65);
	};

	// setup colour theme
	View.prototype.setColourTheme = function(themeRequested) {
		var customIndex = this.engine.numThemes;

		// check if a theme was requested
		if (themeRequested === -1) {
			// if not then check if a custom theme was specified
			if (this.customTheme) {
				themeRequested = customIndex;
			} else {
				// set the theme based on rule type
				if (this.engine.isLifeHistory) {
					// default to theme 10
					themeRequested = 10;
				} else {
					// check for Generations or HROT
					if (this.engine.multiNumStates > 2 && !(this.engine.isPCA || this.engine.isRuleTree)) {
						// multi state uses theme 11
						themeRequested = 11;
					} else {
						// check for Margolus
						if (this.engine.isMargolus) {
							themeRequested = 17;
						} else {
							// check for PCA
							if (this.engine.isPCA || this.engine.isRuleTree) {
								themeRequested = 18;
							} else {
								// default to theme 1
								themeRequested = 1;
							}
						}
					}
				}
			}
		}

		// check for custom gridmajor interval
		if (this.customGridMajor && themeRequested !== customIndex && this.engine.themes[themeRequested].gridMajor !== this.engine.gridLineMajor) {
			// copy the requested theme to the custom theme
			this.engine.themes[customIndex].set(this.engine.themes[themeRequested]);
			themeRequested = customIndex;
			this.engine.themes[customIndex].gridMajor = this.engine.gridLineMajor;
			this.customTheme = true;
		}

		// set the theme
		this.setNewTheme(themeRequested, 1, this);
	};

	// scale popup window
	View.prototype.scalePopup = function() {
		var scale = 1,
			windowWidth = window.innerWidth,
			windowHeight = window.innerHeight,
			displayWidth = this.displayWidth,
			displayHeight = this.displayHeight + 80;
			
		// scale width and height
		displayWidth *= this.devicePixelRatio;
		displayHeight *= this.devicePixelRatio;

		// assume window will fit and scale controls
		scale = this.devicePixelRatio;
		this.windowZoom = 1;

		// check window fits on display
		if (displayWidth > windowWidth || displayHeight > windowHeight) {
			// find the maximum x or y scaling factor for the window to fit
			scale = displayWidth / windowWidth;
			if (displayHeight / windowHeight > scale) {
				scale = displayHeight / windowHeight;
			}

			// apply the scaling factor
			displayWidth /= scale;
			displayHeight = this.displayHeight * this.devicePixelRatio / scale;

			// see how much window is larger than original size and scale controls and fonts
			scale = displayWidth / this.displayWidth;
			if (displayHeight / this.displayHeight < scale) {
				scale = displayHeight / this.displayHeight;
			}

			// check if the window size is above minimum
			if (displayWidth < ViewConstants.minViewerWidth || displayHeight < ViewConstants.minViewerHeight) {
				scale = displayWidth / ViewConstants.minViewerWidth;
				if  (displayHeight / ViewConstants.minViewerHeight < scale) {
					scale = displayHeight / ViewConstants.minViewerHeight;
				}
				displayWidth /= scale;
				displayHeight /= scale;
				this.windowZoom = scale;
				scale = 1;
			}
		}

		// ensure width is a multiple of 8 and height is an integer
		this.displayWidth = displayWidth & ~7;
		this.displayHeight = displayHeight | 0;

		// update menu manager zoom
		this.menuManager.windowZoom = this.windowZoom;
		Controller.popupWindow.windowZoom = this.windowZoom;

		// resize the menu controls
		this.viewMenu.resizeControls(scale);

		// resize the icons
		this.iconManager.setScale(scale);

		// resize the help fonts
		this.helpFontSize = (18 * scale) | 0;
		this.helpFixedFont = this.helpFontSize + "px " + ViewConstants.fixedFontFamily;
		this.helpVariableFont = this.helpFontSize + "px " + ViewConstants.variableFontFamily;

		// check if popup width has changed
		if (this.displayWidth !== this.lastPopupWidth) {
			this.popupWidthChanged = true;
		}
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
		this.engine.isMargolus = false;
		this.engine.isPCA = false;
		this.engine.isLifeHistory = false;
		this.engine.isSuper = false;
		this.engine.isHex = false;
		this.engine.hexNeighbourhood = this.manager.hexAll;
		this.engine.isTriangular = false;
		this.engine.triangularNeighbourhood = this.manager.triangularAll;
		this.engine.isVonNeumann = false;
		this.engine.wolframRule = -1;
		this.engine.patternDisplayMode = false;
		this.engine.multiNumStates = -1;
		this.engine.boundedGridType = -1;
		this.engine.isHROT = false;
		this.multiStateView = false;
		this.executable = false;
		this.engine.isRuleTree = false;
		this.engine.ruleTreeA = null;
		this.engine.ruleTreeB = null;
		this.engine.ruleTreeColours = null;
		this.engine.ruleTableIcons = null;
		this.engine.ruleTableLUT = [];
		this.engine.ruleTableOutput = null;
		this.engine.ruleTableCompressedRules = 0;
		this.engine.ruleTableNeighbourhood = 0;
		this.engine.ruleTableDups = 0;
	};

	// start the viewer from a supplied pattern string
	View.prototype.startViewer = function(patternString, ignoreThumbnail) {
		// attempt to load the pattern
		this.origDisplayWidth = this.displayWidth;
		this.origDisplayHeight = this.displayHeight;
		var pattern = this.manager.create("", patternString, this.engine.allocator, this.completeStart, this.completeStartFailed, [ignoreThumbnail], this);
		this.lastFailReason = this.manager.failureReason;

		// if the pattern loaded synchronously (i.e. did not need a rule definition from the repository) then complete the setup
		// (otherwise it will happen once the async load is complete)
		if (!this.manager.loadingFromRepository) {
			this.completeStart(pattern, [ignoreThumbnail], this);
		} else {
			// create a dummy pattern so view processing completes otherwise window isn't correctly setup
			var temp = this.manager.create("", "x=1,y=1,rule=Life\n!", this.engine.allocator, this.completeStart, this.completeStart, [ignoreThumbnail], this);
			this.completeStart(temp, [ignoreThumbnail], this);

			// restore original width and height so when pattern loads with new rule we don't scale the window again
			this.displayWidth = this.origDisplayWidth;
			this.displayHeight = this.origDisplayHeight;

			// notify rule is loading
			this.menuManager.notification.clear(false, true);
			this.menuManager.notification.notify("Loading rule...", 15, 10000, 15, true);
		}
	};

	// complete pattern start process after lookup failure
	View.prototype.completeStartFailed = function(pattern, args, me) {
		me.manager.failureReason = me.lastFailReason;
		me.manager.executable = true;
		me.completeStart(null, args, me);
	};

	// complete pattern start process
	View.prototype.completeStart = function(pattern, args, me) {
		var numberValue = 0,
		    savedX = 0,
		    savedY = 0,
		    savedThumbnail = false,
		    resizeRequired = false,
		    neededWidth = 0,
			neededHeight = 0,
			borderSize = 0,
			i = 0,
			ignoreThumbnail = args[0],
			stateCount = 0,
			name = "";

		// check for Edge browser
		if (window.navigator.userAgent.indexOf("Edge") !== -1) {
			me.isEdge = true;
		} else {
			me.isEdge = false;
		}

		// turn off pretty rendering
		me.engine.pretty = false;

		// clear identify buffer (needs to be done before growGrid)
		me.engine.countList = null;

		// flag not empty start
		me.emptyStart = false;
		me.diedGeneration = -1;

		// mark bailout possible
		me.throttleToggle.current = me.toggleThrottle([true], true, me);

		// hide theme selection buttons
		me.showThemeSelection = false;

		// hide info settings
		me.showInfoSettings = false;

		// hide display settings
		me.showDisplaySettings = false;

		// hide playback settings
		me.showPlaybackSettings = false;

		// hide rule settings
		me.showPatternSettings = false;

		// ensure theme is set
		me.engine.colourTheme = -1;

		// clear time intervals
		me.menuManager.resetTimeIntervals();

		// enable copy sync
		me.copySyncExternal = true;

		// disable auto-shrink
		me.autoShrink = false;

		// clear any selection
		me.isSelection = false;
		me.drawingSelection = false;

		// clear any paste
		me.pasteBuffers = [];
		for (i = 0; i < 10; i += 1) {
			me.pasteBuffers[i] = null;
		}
		me.currentPasteBuffer = 0;
		me.canPaste = false;
		me.pasteBuffer = null;
		me.isPasting = false;
		me.pasteWidth = 0;
		me.pasteHeight = 0;
		me.evolvingPaste = false;
		me.afterSelectAction = false;

		// set default paste mode for UI
		me.pasteModeList.current = me.viewPasteModeList(2, true, me);

		// clear playback draw pause
		me.playbackDrawPause = false;

		// clear recipe list
		me.recipeList = [];
		me.recipeDelta = [];

		// clear script error list
		me.scriptErrors = [];

		// clear rle snippets
		me.rleList = [];

		// clear undo/reset
		me.editList = [];
		me.currentEdit = [];
		me.currentEditIndex = 0;
		me.editNum = 0;
		me.numEdits = 0;
		me.engine.shrinkNeeded = false;

		// clear paste list
		me.pasteList = [];
		me.pasteMode = ViewConstants.pasteModeOr;
		me.pasteGen = 0;
		me.pasteEnd = -1;
		me.pasteDelta = [];
		me.pasteEvery = 0;
		me.isPasteEvery = false;
		me.pasteDeltaX = 0;
		me.pasteDeltaY = 0;
		me.maxPasteGen = 0;
		me.isEvolution = false;
		me.pasteLeftX = ViewConstants.bigInteger;
		me.pasteRightX = -ViewConstants.bigInteger;
		me.pasteBottomY = ViewConstants.bigInteger;
		me.pasteTopY = -ViewConstants.bigInteger;

		// clear any notifications
		me.menuManager.notification.clear(true, true);
		me.menuManager.notification.clear(false, true);

		// clear reverse Margolus playback
		me.engine.reverseMargolus = false;
		me.engine.reversePending = false;

		// clear was LtL
		me.wasLtL = false;

		// check if the pattern was created successfully
		if (pattern) {
			// copy the generation offset
			me.genDefined = me.manager.genDefined;
			me.genOffset = me.manager.generation;

			// copy the pos offsets
			me.posDefined = me.manager.posDefined;
			me.posXOffset = me.manager.posX;
			me.posYOffset = me.manager.posY;

			// copy the specified size
			me.specifiedWidth = me.manager.specifiedWidth;
			me.specifiedHeight = me.manager.specifiedHeight;

			// read the pattern size
			me.patternWidth = pattern.width;
			me.patternHeight = pattern.height;

			// read pattern name and originator
			me.patternName = pattern.name;
			me.patternOriginator = pattern.originator;

			// read the pattern format
			me.patternFormat = pattern.patternFormat;
			if (me.patternFormat === "") {
				me.patternFormat = "(none)";
			}

			// read the number of states and number used
			me.patternStates = pattern.numStates;
			me.patternUsedStates = pattern.numUsedStates;

			// read the rule name
			me.patternRuleName = pattern.ruleName;
			me.patternAliasName = pattern.aliasName;
			me.patternBoundedGridDef = pattern.boundedGridDef;

			// read the before and after RLE comments
			me.engine.beforeTitle = pattern.beforeTitle;
			me.engine.afterTitle = pattern.afterTitle;

			// read if the pattern is executable
			me.executable = me.manager.executable;

			// check if the rule is a History rule
			me.engine.isLifeHistory = pattern.isHistory;

			// check if the rule is a Super rule
			me.engine.isSuper = pattern.isSuper;

			// set toggle button caption
			me.clearRHistoryButton.toolTip = "clear [R]History cells [Ctrl Del]";
			if (me.engine.isSuper) {
				me.clearRHistoryButton.toolTip = "clear [R]Super cells [Ctrl Del]";
			}

			// read the number of states (Generations or HROT)
			me.engine.multiNumStates = pattern.multiNumStates;
			if (!me.executable) {
				// if not exectuable then copy from pattern states
				if (pattern.numStates > 2) {
					me.engine.multiNumStates = pattern.numStates;
				}
			}

			// check if the rule is a RuleTree rule
			me.engine.ruleTableOutput = null;
			me.engine.ruleTableLUT = null;
			me.stateNames = [];
			if (pattern.ruleTreeStates !== -1) {
				me.engine.ruleTreeNeighbours = pattern.ruleTreeNeighbours;
				me.engine.ruleTreeStates = pattern.ruleTreeStates;
				me.engine.multiNumStates = pattern.ruleTreeStates;
				me.engine.ruleTreeNodes = pattern.ruleTreeNodes;
				me.engine.ruleTreeBase = pattern.ruleTreeBase;
				me.engine.ruleTreeA = pattern.ruleTreeA;
				me.engine.ruleTreeB = pattern.ruleTreeB;
				me.engine.ruleTreeColours = pattern.ruleTreeColours;
				me.engine.ruleTableIcons = pattern.ruleTableIcons;
				me.stateNames = pattern.ruleTableNames;
				me.engine.isRuleTree = true;
			} else {
				me.engine.isRuleTree = false;
			}

			// check if the rule is a RuleTable rule
			if (pattern.ruleTableOutput !== null) {
				me.engine.ruleTableLUT = pattern.ruleTableLUT;
				me.engine.ruleTableOutput = pattern.ruleTableOutput;
				me.engine.ruleTableCompressedRules = pattern.ruleTableCompressedRules;
				me.engine.ruleTableNeighbourhood = pattern.ruleTableNeighbourhood;
				me.engine.ruleTableDups = pattern.ruleTableDups;
				me.engine.multiNumStates = pattern.ruleTableStates;
				me.engine.ruleTreeColours = pattern.ruleTreeColours;
				me.engine.ruleTableIcons = pattern.ruleTableIcons;
				me.stateNames = pattern.ruleTableNames;
				me.engine.isRuleTree = true;
			}

			// process icons if loaded
			me.engine.processIcons(pattern.ruleTableIcons);

			// check if the rule is HROT
			me.engine.isHROT = pattern.isHROT;
			if (pattern.isHROT) {
				me.engine.HROT.births = pattern.birthHROT;
				me.engine.HROT.survivals = pattern.survivalHROT;
				me.engine.HROT.scount = pattern.multiNumStates;
				me.engine.HROT.setTypeAndRange(pattern.neighborhoodHROT, pattern.rangeHROT, pattern.customNeighbourhood, pattern.customNeighbourCount, pattern.isTriangular, pattern.weightedNeighbourhood, pattern.weightedStates);
				if (me.manager.altSpecified) {
					me.engine.HROT.altBirths = pattern.altBirthHROT;
					me.engine.HROT.altSurvivals = pattern.altSurvivalHROT;
					me.engine.HROT.altSpecified = true;
				} else {
					me.engine.HROT.altSpecified = false;
				}

				// check if pattern was LtL
				me.wasLtL = pattern.isLTL;
			}

			// check if the rule is _none_
			me.engine.isNone = pattern.isNone;

			// check if the rule is Margolus
			me.engine.isMargolus = pattern.isMargolus;

			// default alternating Margolus grid to on if the rule is Margolus
			me.engine.altGrid = me.engine.isMargolus;

			// check if the rule is PCA
			me.engine.isPCA = pattern.isPCA;

			// use hexagons/triangulars for hexagonal/triangular dispaly
			me.engine.forceRectangles = false;

			// check if the neighbourhood is hex
			me.engine.isHex = pattern.isHex;
			me.engine.patternDisplayMode = pattern.isHex;
			me.engine.hexNeighbourhood = pattern.hexNeighbourhood;

			// check if the neighbourhood is triangular
			me.engine.isTriangular = pattern.isTriangular;
			me.engine.triangularNeighbourhood = pattern.triangularNeighbourhood;

			// check if the neighbourhood is Von Neumann
			me.engine.isVonNeumann = pattern.isVonNeumann;

			// check if the rule is Wolfram
			me.engine.wolframRule = pattern.wolframRule;

			// read the bounded grid details
			me.engine.boundedGridType = pattern.gridType;
			me.engine.boundedGridWidth = pattern.gridWidth;
			me.engine.boundedGridHeight = pattern.gridHeight;
			me.engine.boundedGridHorizontalShift = pattern.gridHorizontalShift;
			me.engine.boundedGridVerticalShift = pattern.gridVerticalShift;
			me.engine.boundedGridHorizontalTwist = pattern.gridHorizontalTwist;
			me.engine.boundedGridVerticalTwist = pattern.gridVerticalTwist;

			// copy states used and state count
			me.patternStateCount = new Uint32Array(me.patternStates);

			for (i = 0; i < me.patternStates; i += 1) {
				me.patternStateCount[i] = me.manager.stateCount[i];
			}
		} else {
			me.clearPatternData();
		}

		// setup dynamic calls in the engine for performance
		me.engine.setupDynamicCalls();

		// show labels
		me.showLabels = true;

		// do not display population graph
		me.popGraph = false;
		me.popGraphLines = true;
		me.popGraphOpacity = ViewConstants.defaultOpacity;
		if (!pattern) {
			me.graphDisabled = true;
		} else {
			me.graphDisabled = false;
		}

		// display life ended and stop notifications
		me.genNotifications = true;

		// display generation as absolute
		me.genRelative = false;

		// read any failure reason
		me.failureReason = me.manager.failureReason;

		// set anything alive flags
		me.engine.anythingAlive = 1;

		// reset delete pattern radius
		me.engine.removePatternRadius = ViewConstants.defaultDeleteRadius;

		// reset x and y offset
		me.xOffset = 0;
		me.yOffset = 0;

		// reset current point of interest
		me.currentPOI = -1;
		me.stepsPOI = -1;

		// clear compute history mode
		me.computeHistory = false;

		// clear copy to clipboard mode
		me.clipboardCopy = false;

		// unlock menu
		me.viewMenu.locked = false;

		// clear history fit mode
		me.historyFit = false;

		// clear state 1 fit
		me.state1Fit = false;

		// free overlay
		me.engine.freeOverlay();

		// free state6 mask
		me.engine.freeState6Mask();

		// create the overlay
		if (me.engine.isLifeHistory) {
			// always create the overlay since the editor may introduce any LifeHistory state
			me.engine.createOverlay();
		}

		// create the state 6 mask
		if (me.engine.isLifeHistory) {
			me.engine.createState6Mask();
		}

		// clear any window title
		me.windowTitle = "";

		// disable stars
		me.starsOn = false;

		// initalised ColourManager
		ColourManager.init();

		// clear the grid
		me.engine.clearGrids(false);

		// reset grid lines
		me.engine.gridLineRaw = ViewConstants.gridLineRawDefault;
		me.engine.gridLineBoldRaw = ViewConstants.gridLineBoldRawDefault;
		me.engine.gridLineMajor = 10;
		me.engine.definedGridLineMajor = 10;
		me.engine.gridLineMajorEnabled = true;
		me.customGridMajorColour = -1;
		me.customGridColour = -1;

		// set the default generation speed
		me.genSpeed = 60;

		// set the default generations per step
		me.gensPerStep = 1;

		// set the default layers
		me.engine.layers = 1;

		// set the default layer depth
		me.engine.layerDepth = 0.1;

		// set the default angle
		me.engine.angle = 0;

		// set the default zoom
		me.engine.zoom = 6;

		// reset the grid size
		me.engine.resetGridSize(me.defaultGridWidth, me.defaultGridHeight);

		// set the default position
		me.engine.xOff = me.engine.width / 2;
		me.engine.yOff = me.engine.height / 2;

		// set the default zoom and position are not used
		me.defaultZoomUsed = false;
		me.defaultXUsed = false;
		me.defaultYUsed = false;
		me.defaultX = 0;
		me.defaultY = 0;

		// clear requested width and height
		me.requestedWidth = -1;
		me.requestedHeight = -1;

		// clear requested popup width and height
		me.requestedPopupWidth = -1;
		me.requestedPopupHeight = -1;

		// reset custom theme
		me.customThemeValue[ViewConstants.customThemeBackground] = -1;
		me.customThemeValue[ViewConstants.customThemeAlive] = -1;
		me.customThemeValue[ViewConstants.customThemeAliveRamp] = -1;
		me.customThemeValue[ViewConstants.customThemeDead] = -1;
		me.customThemeValue[ViewConstants.customThemeDeadRamp] = -1;
		me.customThemeValue[ViewConstants.customThemeGrid] = -1;
		me.customThemeValue[ViewConstants.customThemeGridMajor] = -1;
		me.customThemeValue[ViewConstants.customThemeStars] = -1;
		me.customThemeValue[ViewConstants.customThemeText] = -1;
		me.customThemeValue[ViewConstants.customThemeBoundary] = -1;
		me.customThemeValue[ViewConstants.customThemeGraphBg] = -1;
		me.customThemeValue[ViewConstants.customThemeGraphAxis] = -1;
		me.customThemeValue[ViewConstants.customThemeGraphAlive] = -1;
		me.customThemeValue[ViewConstants.customThemeGraphBirth] = -1;
		me.customThemeValue[ViewConstants.customThemeGraphDeath] = -1;
		me.customThemeValue[ViewConstants.customThemeError] = -1;
		me.customThemeValue[ViewConstants.customThemeLabel] = -1;
		me.customThemeValue[ViewConstants.customThemeDying] = -1;
		me.customThemeValue[ViewConstants.customThemeDyingRamp] = -1;
		me.customThemeValue[ViewConstants.customThemeUIFG] = -1;
		me.customThemeValue[ViewConstants.customThemeUIBG] = -1;
		me.customThemeValue[ViewConstants.customThemeUIHighlight] = -1;
		me.customThemeValue[ViewConstants.customThemeUISelect] = -1;
		me.customThemeValue[ViewConstants.customThemeUILocked] = -1;
		me.customThemeValue[ViewConstants.customThemeUIBorder] = -1;
		me.customThemeValue[ViewConstants.customThemeArrow] = -1;
		me.customThemeValue[ViewConstants.customThemePoly] = -1;
		me.customThemeValue[ViewConstants.customThemeBounded] = -1;
		me.customThemeValue[ViewConstants.customThemeSelect] = -1;
		me.customThemeValue[ViewConstants.customThemePaste] = -1;
		me.customThemeValue[ViewConstants.customThemeAdvance] = -1;
		me.customLabelColour = ViewConstants.labelFontColour;
		me.customArrowColour = ViewConstants.arrowColour;
		me.customPolygonColour = ViewConstants.polyColour;

		// switch off thumbnail mode if on
		if (me.thumbnail) {
			me.switchOffThumbnail();
		}
		me.thumbnailEverOn = false;
		me.menuManager.thumbnail = false;
		me.thumbnailDivisor = ViewConstants.defaultThumbSize;
		me.thumbLaunch = false;
		me.menuManager.thumbLaunch = false;
		me.thumbZoomDefined = false;

		// reset parameters to defaults
		if (!pattern) {
			me.multiStateView = true;
		} else {
			me.multiStateView = false;
		}
		me.viewOnly = false;
		me.engine.displayGrid = false;
		me.engine.cellBorders = false;

		// reset menu visibility to defaults
		me.playList.deleted = false;
		me.modeList.deleted = false;
		me.genToggle.deleted = false;
		me.generationRange.deleted = false;
		me.stepRange.deleted = false;
		me.navToggle.deleted = false;
		me.layersItem.deleted = false;
		me.depthItem.deleted = false;
		me.themeButton.deleted = false;
		me.throttleToggle.deleted = false;
		me.showLagToggle.deleted = false;
		me.viewMenu.deleted = false;
		me.progressBar.deleted = false;
		me.undoButton.deleted = false;
		me.redoButton.deleted = false;
		me.patternButton.deleted = false;
		me.infoButton.deleted = false;
		me.playbackButton.deleted = false;
		me.displayButton.deleted = false;
		me.backButton.deleted = false;

		// reset menu toggles to off
		me.navToggle.current = [false];
		me.genToggle.current = [false];

		// turn off help and errors
		me.displayHelp = 0;
		me.displayErrors = 0;

		// hide library
		me.libraryToggle.current = [false];

		// default auto-shrink
		me.autoShrinkToggle.current = me.viewAutoShrinkList([me.autoShrink], true, me);

		// default copy sync
		me.copySyncToggle.current = me.viewCopySyncList([me.copySyncExternal], true, me);
		me.syncNotified = false;

		// start in pan mode
		me.modeList.current = me.viewModeList(ViewConstants.modePan, true, me);

		// set random density to 50%
		me.randomItem.current = me.viewRandomRange([50, 50], true, me);

		// set paste position to top left
		me.pastePositionItem.current = me.viewPastePositionRange([ViewConstants.pastePositionNW, ViewConstants.pastePositionNW], true, me);

		// update help UI
		me.helpToggle.current = me.toggleHelp([me.displayHelp], true, me);

		// reset boundary colour
		me.customBoundaryColour = [96, 96, 96];
		if (me.engine.littleEndian) {
			me.engine.boundaryColour = 0xff606060;
		} else {
			me.engine.boundaryColour = 0x606060ff;
		}

		// reset bounded colour
		me.customBoundedColour = [128, 128, 128];
		if (me.engine.littleEndian) {
			me.engine.boundedColour = 0xff808080;
		} else {
			me.engine.boundedColour = 0x808080ff;
		}

		// reset select colour
		me.customSelectColour = [0, 255, 0];
		me.engine.selectColour = "rgb(0,255,0)";
		
		// reset paste colour
		me.customPasteColour = [255, 0, 0];
		me.engine.pasteColour = "rgb(255,0,0)";

		// reset advance colour
		me.customAdvanceColour = [255, 255, 0];
		me.engine.advanceColour = "rgb(255,255,0)";

		// reset waypoints
		me.waypointManager.reset();
		me.waypointsDefined = false;

		// reset annotations
		me.waypointManager.clearAnnotations();

		// disable hide GUI on playback
		me.hideGUI = false;

		// enable history
		me.noHistory = false;

		// enable performance warnings
		me.perfWarning = true;

		// disable custom theme
		me.customTheme = false;
		me.customGridMajor = false;

		// flag not drawing overlay
		me.engine.drawOverlay = false;

		// default random parameters
		me.randomWidth = ViewConstants.randomDimension;
		me.randomHeight = ViewConstants.randomDimension;
		me.randomFillPercentage = 50;
		me.randomRuleFixed = false;
		me.randomReversible = false;
		me.randomSwap = false;
		me.randomChanceAll = -1;
		me.randomChanceB = -1;
		me.randomChanceS = -1;
		me.randomChanceBN = [];
		me.randomChanceSN = [];

		// clear reverse start flag
		me.reverseStart = false;

		// clear play on thumb expand
		me.thumbStart = false;

		// copy pattern to center
		if (pattern) {
			if (me.engine.isLifeHistory) {
				me.colourList = [0, 255 << 8, 128, (216 << 16) | (255 << 8) | 216, 255 << 16, (255 << 16) | (255 << 8), (96 << 16) | ( 96 << 8) | 96];
				me.colourSetName = "[R]History";
			} else {
				me.colourList = ColourManager.defaultSet();
				me.colourSetName = "(default)";
			}

			// reset controls a script can overwrite
			me.resetScriptControls();

			// set random seed
			me.randomSeed = Date.now().toString();

			// check for fullscreen not in popup
			if (!me.isInPopup && DocConfig.fullScreen) {
				me.displayWidth = document.body.clientWidth & ~7;
				me.displayHeight = window.innerHeight - 128;
				if (me.displayWidth < ViewConstants.minViewerWidth) {
					me.displayWidth = ViewConstants.minViewerWidth;
				}
				if (me.displayHeight < ViewConstants.minViewerHeight) {
					me.displayHeight = ViewConstants.minViewerHeight;
				}
				resizeRequired = true;
			}

			// reset rainbow mode
			me.engine.rainbow = false;

			// reset start from
			me.startFrom = -1;

			// read any script in the title
			if (pattern.title) {
				// decode any script commands
				numberValue = pattern.numStates;
				if (me.engine.isLifeHistory) {
					numberValue = 7;
				}
				if (me.engine.isPCA) {
					numberValue = 16;
				}
				if (me.engine.isSuper) {
					numberValue = 26;
				}
				me.readScript(pattern.title, numberValue);

				// set errors to display if any found
				if (me.scriptErrors.length) {
					me.displayErrors = 1;
				}

				// override thumbnail if specified
				if (me.thumbnail && ignoreThumbnail) {
					me.thumbnail = false;
				}

				// check whether to resize canvas width based on script commands
				if (me.requestedWidth > -1) {
					// ensure width is a multiple of 8
					me.requestedWidth &= ~7;

					// check if the width is different than the current width
					if (me.requestedWidth !== me.displayWidth) {
						me.displayWidth = me.requestedWidth;
						resizeRequired = true;
					}
				}

				// check whether to resize canvas height based on script commands
				if (me.requestedHeight > -1) {
					// check if the height is different than the current height
					if (me.requestedHeight !== me.displayHeight) {
						me.displayHeight = me.requestedHeight;
						resizeRequired = true;
					}
				}

				// check whether to resize popup window
				if (me.isInPopup) {
					if (me.requestedPopupWidth > -1) {
						me.requestedPopupWidth &= ~7;
						if (me.requestedPopupWidth !== me.displayWidth) {
							me.displayWidth = me.requestedPopupWidth;
							resizeRequired = true;
						}
					} else {
						if (me.displayWidth < ViewConstants.minViewerWidth) {
							me.displayWidth = ViewConstants.minViewerWidth;
						}
					}

					if (me.requestedPopupHeight > -1) {
						if (me.requestedPopupHeight !== me.displayHeight) {
							me.displayHeight = me.requestedPopupHeight;
							resizeRequired = true;
						}
					}
				}
			}

			// check rainbow and remove if not supported
			if (me.engine.rainbow) {
				if (me.engine.multiNumStates > 2 || me.engine.isHROT || me.engine.isPCA || me.engine.isLifeHistory || me.engine.isRuleTree || me.engine.isMargolus) {
					me.engine.rainbow = false;
				}
			}

			// remove history states if pattern is not executable or rule does not support them
			if (!me.executable || me.engine.isRuleTree || me.engine.isSuper) {
				me.historyStates = 0;
			}

			// initialise random number generator from seed
			me.randGen.init(me.randomSeed);

			// check if popup width has changed
			if (me.isInPopup) {
				me.origDisplayWidth = me.displayWidth;
				me.origDisplayHeight = me.displayHeight;
				me.scalePopup();
			}

			// if pattern is too big and has no paste commands then generate error
			if (pattern.tooBig && me.pasteList.length === 0) {
				me.executable = false;
			}

			// setup the state list for drawing
			me.setupStateList();

			// set the menu colours
			me.setMenuColours();

			// update help topic button positions based on window height
			me.updateTopicButtonsPosition();

			// update selection controls position based on window height
			me.updateSelectionControlsPosition();

			// process dynamic themes
			me.engine.processMultiStateThemes();

			// set history states in engine
			me.engine.historyStates = me.historyStates;

			// set alive states in engine
			me.engine.aliveStates = me.aliveStates;

			// disable graph if using THUMBLAUNCH and graph not displayed (since there's no way to turn it on)
			if (me.thumbLaunch && !me.popGraph) {
				me.graphDisabled = true;
				me.popGraph = false;
			}

			// allocate graph data unless graph disabled
			me.engine.allocateGraphData(!me.graphDisabled);

			// check pattern size (script command may have increased maximum allowed size)
			if (pattern.width > me.engine.maxGridSize || pattern.height > me.engine.maxGridSize) {
				me.failureReason = "Pattern too big (maximum " + me.engine.maxGridSize + "x" + me.engine.maxGridSize + ")";
				me.tooBig = true;
				me.executable = false;
				me.clearPatternData();
			}

			// check bounded grid size (script command may have increased maximum allowed size)
			if (pattern.gridType !== -1) {
				borderSize = 6;

				// check for LtL or HROT rules
				if (pattern.isHROT) {
					borderSize = pattern.rangeHROT * 6;
				}
				if (pattern.isLTL) {
					borderSize = pattern.rangeLTL * 6;
				}
				if (pattern.gridWidth >= me.engine.maxGridSize - borderSize || pattern.gridHeight >= me.engine.maxGridSize - borderSize) {
					// make invalid
					me.failureReason = "Bounded grid is too big";
					me.executable = false;
					me.engine.boundedGridType = -1;
				}
			}

			// update the life rule
			me.engine.updateLifeRule(me);

			// process any rle snippet evolution
			if (me.isEvolution) {
				// create the colour index
				me.engine.createColourIndex();

				// process evolution
				me.processEvolution();
			}

			// mark pattern not clipped to bounded grid
			me.wasClipped = false;

			// get the needed width and height for the grid size
			if (me.engine.boundedGridType !== -1) {
				// use bounded grid
				neededWidth = me.engine.boundedGridWidth;
				neededHeight = me.engine.boundedGridHeight;

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
				if (me.pasteList.length > 0) {
					neededWidth = me.computeNeededWidth(neededWidth);
					neededHeight = me.computeNeededHeight(neededHeight);
				}
			}

			// check if the grid is smaller than the pattern and/or bounded grid plus the maximum step speed
			borderSize = ViewConstants.maxStepSpeed;
			if (me.engine.isHROT) {
				borderSize = me.engine.HROT.xrange * 4 + 1;
				if (me.engine.boundedGridType !== -1) {
					borderSize += me.engine.HROT.xrange * 2;
				}
				if (me.engine.HROT.type === me.manager.vonNeumannHROT) {
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

			// add CXRLE Pos if defined
			i = me.engine.maxGridSize / 2 - borderSize;
			if (me.posDefined) {
				if (me.posXOffset < -i) {
					me.posXOffset = -i;
				} else if (me.posXOffset >= i) {
					me.posXOffset = i - 1;
				}
				if (me.posYOffset < -i) {
					me.posYOffset = -i;
				} else if (me.posYOffset >= i) {
					me.posYOffset = i - 1;
				}
				me.xOffset += me.posXOffset;
				me.yOffset += me.posYOffset;
			}

			// ensure offset in range
			if (me.xOffset < -i) {
				me.xOffset = -i;
			} else if (me.xOffset >= i) {
				me.xOffset = i - 1;
			}
			if (me.yOffset < -i) {
				me.yOffset = -i;
			} else if (me.yOffset >= i) {
				me.yOffset = i - 1;
			}

			// grow the grid if the pattern is too big to fit
			while (me.engine.width < me.engine.maxGridSize && ((neededWidth + borderSize + Math.abs(me.xOffset) * 2) >= me.engine.width || (neededHeight + borderSize + Math.abs(me.yOffset) * 2) >= me.engine.height)) {
				// grow the grid
				me.engine.growGrid();

				// update the default x and y
				me.defaultX += me.engine.width >> 2;
				me.defaultY += me.engine.height >> 2;

				// update the saved x and y
				me.savedX += me.engine.width >> 2;
				me.savedY += me.engine.height >> 2;

				// check for hex mode
				if (me.engine.isHex) {
					me.defaultX -= me.engine.height >> 3;
					me.savedX -= me.engine.height >> 3;
				}
			}

			// resize the HROT buffer to the current width and height
			if (pattern.isHROT) {
				me.engine.HROT.resize(me.engine.width, me.engine.height);
			}

			// compute pan X and Y for the pattern on the grid
			me.computePanXY(pattern.width, pattern.height);
			
			// populate the state 6 mask
			if (me.engine.isLifeHistory) {
				// check if state 6 is used
				if (me.manager.stateCount[6]) {
					me.engine.populateState6Mask(pattern, me.panX, me.panY);
				}
			}

			// set custom text colour
			if (me.customTextColour) {
				// copy to text colour
				me.menuManager.notification.colour = "rgb(" + me.customTextColour[0] + "," + me.customTextColour[1] + "," + me.customTextColour[2] + ")";
			} else {
				// set default
				me.menuManager.notification.colour = me.menuManager.notification.priorityColour;
			}

			// set states used if no custom colours used
			if (me.customColours === null) {
				for (i = 0; i < me.colourList.length; i += 1) {
					if (me.manager.stateCount[i]) {
						me.customColourUsed[i] = ViewConstants.stateUsedDefault;
					} else {
						me.customColourUsed[i] = ViewConstants.stateNotUsed;
					}
				}
			}

			// create LifeHistory overlay colours if required
			if (me.engine.overlayGrid) {
				// create overlay colours
				me.engine.createLHOverlayColours(me.colourList, me.customColours);

				// flag overlay drawing required
				me.engine.drawOverlay = true;
			} else {
				me.engine.drawOverlay = false;
			}

			// copy pattern to center of grid
			if (!pattern.tooBig) {
				me.copyPatternTo(pattern);
			}

			// update rule label
			if (me.patternAliasName !== "") {
				me.ruleLabel.preText = me.patternAliasName;
			} else {
				me.ruleLabel.preText = me.patternRuleName;
			}

			// set the tool tip in case the rule name is wider than the label
			me.ruleLabel.toolTip = me.patternRuleName;
			
			// check for alias name
			if (me.patternAliasName !== "") {
				me.ruleLabel.toolTip += " alias " + me.patternAliasName;
			}
		}

		// setup oscillator search
		me.resultsDisplayed = false;
		me.lastOscillator = "none";
		me.lastIdentifyType = "none";
		me.lastIdentifyPeriod = "none";
		me.lastIdentifyDirection = "none";
		me.lastIdentifySpeed = "none";
		me.lastIdentifyBox = "none";
		me.lastIdentifyGen = "none";
		me.lastIdentifyCells = "none";
		me.lastIdentifySlope = "none";
		me.lastIdentifyHeat = "none";
		me.lastIdentifyVolatility = "none";
		me.lastIdentifyMod = "none";
		me.identify = false;
		me.identifyButton.current = [me.identify];
		me.engine.initSearch(me.identify);

		// update performance warning
		me.showLagToggle.current = me.toggleShowLag([me.perfWarning], true, me);

		// create the colour index
		me.engine.createColourIndex();

		// setup the colour theme
		me.setColourTheme(me.themeRequested);

		// copy custom colours to engine
		me.engine.customColours = me.customColours;

		// create the colour palette
		if (me.engine.isNone || (!me.executable && me.engine.multiNumStates > 2)) {
			me.engine.createMultiStateColours(me.colourList, me.customColours);
		} else {
			me.engine.createColours();
		}

		// create the pixel colours from the palette at full brightness
		me.engine.createPixelColours(1);	

		// set bounded grid border cell
		me.engine.setBoundedGridBorderCell();

		// set smart drawing control
		me.smartToggle.current = me.toggleSmart([me.smartDrawing], true, me);

		// set the graph controls
		me.opacityItem.current = me.viewOpacityRange([me.popGraphOpacity, me.popGraphOpacity], false, me);
		me.linesToggle.current = [me.popGraphLines];

		// update autofit UI
		me.autoFitToggle.current = [me.autoFit];

		// update grid UI
		me.gridToggle.current = [me.engine.displayGrid];

		// set rainbow toggle
		me.rainbowButton.current = [me.engine.rainbow];

		// reset generation
		me.engine.counter = 0;
		me.engine.counterMargolus = 0;
		me.engine.maxMargolusGen = 0;
		me.floatCounter = 0;
		me.originCounter = 0;

		// reset elapsed time
		me.elapsedTime = 0;

		// setup mode UI
		me.modeList.itemLocked = [false, false, false];

		// if standard view mode then reset colour grid and population
		if (me.multiStateView) {
			// check if the pattern loaded
			if (pattern) {
				// compute bounding box
				me.engine.resetBoxes(me.state1Fit);

				// check if a custom colour set was defined
				if (me.customColours) {
					me.colourList = me.customColours;
				}
			}
			me.colourSetSize = me.colourList.length;

			// create multi state colours
			me.engine.createMultiStateColours(me.colourList, me.customColours);

			// reset snapshot manager
			me.engine.snapshotManager.reset();

			// disable graph
			me.graphDisabled = true;
			me.popGraph = false;
		} else {
			// compute bounding box
			me.engine.resetBoxes(me.state1Fit);

			// reset history box
			me.engine.resetHistoryBox();

			// reset the colour grid if not multi-state Generations or HROT rule
			if (me.engine.multiNumStates <= 2) {
				me.engine.resetColourGridBox(me.engine.grid16);
			}

			// check if me is a LifeHistory pattern
			if (me.engine.isLifeHistory) {
				// check if there are state 2 cells
				if (me.manager.stateCount[2]) {
					// copy state 2 to the colour grid
					me.engine.copyState2(pattern, me.panX, me.panY);
				}
			}

			// draw any rle snippets after colour grid conversion (for paste blending modes)
			me.pasteRLEList();

			// reset boxes again if RLE was pasted
			if (me.pasteList.length > 0) {
				me.engine.resetBoxes(me.state1Fit);
				me.engine.resetHistoryBox();
				if (me.engine.multiNumStates <= 2) {
					me.engine.resetColourGridBox(me.engine.grid16);
				}
			}

			// reset population
			me.engine.resetPopulationBox(me.engine.grid16, me.engine.colourGrid);

			// count non-zero states
			stateCount = 0;
			for (i = 1; i < me.patternStateCount.length; i += 1) {
				stateCount += me.patternStateCount[i];
			}
			if (pattern && stateCount === 0 && me.engine.population === 0 && !me.isPasteEvery) {
				me.emptyStart = true;
				if (!me.engine.isNone) {
					if (pattern.tooBig) {
						me.menuManager.notification.notify("Pattern too big!", 15, ViewConstants.errorDuration, 15, false);
					} else {
						me.menuManager.notification.notify("New pattern", 15, 300, 15, false);
					}
				}
			} else {
				me.emptyStart = false;
			}

			// set the bounded grid tiles if specified
			if (me.engine.boundedGridType !== -1) {
				me.engine.setBoundedTiles();
			}

			// save state for reset
			me.engine.saveGrid(me.noHistory);
			me.engine.restoreSavedGrid(me.noHistory);
		}

		// set the xy label UI width based on max grid size
		if (me.engine.maxGridSize > 9999) {
			me.xyLabel.width = 166;
		} else {
			me.xyLabel.width = 140;
		}
		// set the selection size label just to the right of the xy label
		me.selSizeLabel.setX(me.xyLabel.relWidth);

		// set the graph UI control
		me.graphButton.locked = me.graphDisabled;
		me.graphButton.current = [me.popGraph];

		// set the performance warning UI control
		me.showLagToggle.current = [me.perfWarning];

		// set the throttle UI control
		me.throttleToggle.current = [me.canBailOut];

		// set the kill gliders UI control
		me.killButton.current = [me.engine.clearGliders];

		// set the autohide UI control
		me.autoHideButton.current = [me.hideGUI];

		// set the autogrid UI control
		me.autoGridButton.current = [me.autoGrid];

		// set the alternating grid UI control
		me.altGridButton.current = [me.engine.altGrid];
		me.altGridButton.locked = !me.engine.isMargolus;

		// set the hex cell UI control and lock if triangular grid
		if (me.engine.isTriangular) {
			me.hexCellButton.current = [me.engine.forceRectangles];
			me.hexCellButton.toolTip = ["toggle triangular cells [/]"];
		} else {
			me.hexCellButton.toolTip = ["toggle hexagonal cells [/]"];
			if (me.engine.isHex) {
				me.hexCellButton.current = [me.engine.forceRectangles];
			} else {
				me.hexCellButton.current = [true];
			}
		}

		// set reverse direction button if reversible Margolus or PCA rule loaded
		if ((me.engine.isMargolus || me.engine.isPCA) && me.engine.margolusReverseLookup1 !== null) {
			me.directionButton.deleted = false;
		} else {
			me.directionButton.deleted = true;
		}

		// set the label UI control
		if (me.waypointManager.numAnnotations() === 0) {
			me.labelButton.locked = true;
			me.showLabels = false;
		} else {
			me.labelButton.locked = false;
			me.showLabels = true;
		}
		me.labelButton.current = [me.showLabels];

		// set the Information Bar UI control
		me.infoBarButton.current = [me.infoBarEnabled];
		
		// set the relative generation display UI control
		me.relativeToggle.current = [me.genRelative];

		// set the quality rendering display UI control
		me.qualityToggle.current = [me.engine.pretty];

		// set the Stars UI control
		me.starsButton.current = [me.starsOn];

		// set the history fit UI control
		me.historyFitButton.current = [me.historyFit];

		// set the POI control
		if (me.waypointManager.numPOIs()) {
			me.prevPOIButton.deleted = false;
			me.nextPOIButton.deleted = false;
		} else{
			me.prevPOIButton.deleted = true;
			me.nextPOIButton.deleted = true;
		}

		// set the major gridlines UI control
		if (me.engine.gridLineMajor === 0) {
			me.majorButton.current = [false];
			me.majorButton.locked = true;
		} else {
			me.majorButton.current = [me.engine.gridLineMajorEnabled];
			me.majorButton.locked = false;
		}

		// reset population data
		if (!me.graphDisabled) {
			me.engine.resetPopulationData();
		}

		// fit zoom
		numberValue = me.engine.zoom;
		savedX = me.engine.xOff;
		savedY = me.engine.yOff;
		savedThumbnail = me.thumbnail;
		me.thumbnail = false;
		me.fitZoomDisplay(true, false, ViewConstants.fitZoomPattern);
		me.thumbnail = savedThumbnail;

		// override the default zoom if specified
		if (me.defaultZoomUsed) {
			me.engine.zoom = numberValue;
		} else {
			// enforce default maximum if zoom or autofit not specified
			if (!me.autoFit) {
				if (me.engine.zoom > ViewConstants.maxDefaultZoom) {
					me.engine.zoom = ViewConstants.maxDefaultZoom;
				}
			}
		}

		// override the default position if specified
		if (me.defaultXUsed) {
			me.engine.xOff = savedX;
		}
		if (me.defaultYUsed) {
			me.engine.yOff = savedY;
		}

		// update the waypoints if the defaults were not used
		if (me.waypointsDefined) {
			me.validateWaypoints(me.scriptErrors);
		}

		// set thumbnail zoom if specified
		if (me.thumbnail && me.thumbZoomDefined) {
			me.engine.zoom = me.thumbZoomValue;
		}

		// make me current position the default
		me.defaultZoom = me.engine.zoom;
		me.zoomItem.current = me.viewZoomRange([me.engine.zoom, me.engine.zoom], false, me);
		me.defaultX = me.engine.xOff;
		me.defaultY = me.engine.yOff;

		// set the default angle
		me.defaultAngle = me.engine.angle;
		me.angleItem.current = [me.defaultAngle, me.defaultAngle];

		// set the default theme
		me.defaultTheme = me.engine.colourTheme;
		me.setNewTheme(me.defaultTheme, me.engine.colourChangeSteps, me);

		// set the generation speed
		me.defaultGPS = me.genSpeed;
		numberValue = Math.sqrt((me.defaultGPS - ViewConstants.minGenSpeed) / (ViewConstants.maxGenSpeed - ViewConstants.minGenSpeed));
		me.generationRange.current = me.viewGenerationRange([numberValue, numberValue], true, me);

		// set the step
		me.defaultStep = me.gensPerStep;
		me.stepRange.current = me.viewStepRange([me.defaultStep, me.defaultStep], true, me);

		// set the layers
		me.defaultLayers = me.engine.layers;
		me.layersItem.current = [me.defaultLayers, me.defaultLayers];

		// set the layer depth
		me.defaultDepth = me.engine.layerDepth;
		numberValue = Math.sqrt(me.defaultDepth);
		me.depthItem.current = me.viewDepthRange([numberValue, numberValue], true, me);

		// mark something alive
		me.engine.anythingAlive = 1;

		// check whether autostart required
		if (me.autoStart && !me.autoStartDisabled) {
			me.generationOn = true;
			me.playList.current = ViewConstants.modePlay;
		} else {
			me.generationOn = false;
			me.playList.current = ViewConstants.modePause;
		}

		// set the pause button
		me.setPauseIcon(me.generationOn);

		// disable menu controls if height is too small
		if (me.displayHeight < ViewConstants.minMenuHeight) {
			// delete the navigation menu toggle
			me.navToggle.deleted = true;

			// move gps, step and play controls right
			me.playList.setX(me.playListX + 45);
			me.generationRange.setX(me.generationRangeX + 45);
			me.stepRange.setX(me.stepRangeX + 45);
		} else {
			// reset gps and play control position
			me.playList.setX(me.playListX);
			me.generationRange.setX(me.generationRangeX);
			me.stepRange.setX(me.stepRangeX);
		}

		// resize the zoom slider
		if (me.displayWidth > ViewConstants.minViewerWidth && !me.isInPopup) {
			i = (me.displayWidth - ViewConstants.minViewerWidth) + ViewConstants.zoomSliderDefaultWidth;
			if (i > ViewConstants.zoomSliderMaxWidth) {
				i = ViewConstants.zoomSliderMaxWidth;
			}
			me.zoomItem.setWidth(i);
		} else {
			me.zoomItem.setWidth(ViewConstants.zoomSliderDefaultWidth);
		}

		// check whether to resize the canvas
		if (resizeRequired || me.thumbnail) {
			// check for thumbnail view
			if (me.thumbnail) {
				me.switchOnThumbnail();
			} else {
				// resize the viewer
				me.resize();
			}
		}

		// display error notification if failed
		if (!pattern) {
			// check if the pattern was too big
			if (me.manager.tooBig) {
				me.menuManager.notification.notify("Pattern too big!", 15, ViewConstants.errorDuration, 15, false);
			} else {
				me.menuManager.notification.notify("Invalid pattern!", 15, ViewConstants.errorDuration, 15, false);
			}
		}

		// close help if errors found
		if (me.scriptErrors.length) {
			me.displayHelp = 0;
		} else {
			// close errors
			me.displayErrors = 0;
		}

		// make view only if not executable
		if (!me.executable) {
			me.viewOnly = true;
			me.engine.drawOverlay = false;
			me.engine.isNone = true;
			me.engine.isLifeHistory = false;
			me.engine.isSuper = false;
		}

		// check whether to disable drawing
		if (me.viewOnly || me.engine.isNone) {
			me.modeList.itemLocked[ViewConstants.modeDraw] = true;
		}

		// disable playback if view only
		if (me.viewOnly) {
			// delete the playback controls
			me.playList.deleted = true;

			// delete the generation toggle
			me.genToggle.deleted = true;
			
			// delete the progress bar
			me.progressBar.deleted = true;

			// delete gps range
			me.generationRange.deleted = true;

			// delete the step range
			me.stepRange.deleted = true;

			// delete the undo and redo buttons
			me.undoButton.deleted = true;
			me.redoButton.deleted = true;

			// delete layers and depth if multi-state view on
			if (me.multiStateView) {
				me.layersItem.deleted = true;
				me.depthItem.deleted = true;
				me.themeButton.deleted = true;

				// reset layers to 1
				me.engine.layers = 1;
			}

			// show the reason label
			me.reasonLabel.deleted = false;

			// check if there was an error
			if (me.failureReason === "") {
				// label reason is VIEWONLY
				me.reasonLabel.preText = Keywords.viewOnlyWord;
				me.reasonLabel.fgCol = ViewConstants.helpFontColour;
			} else {
				me.reasonLabel.preText = me.failureReason;
				me.reasonLabel.fgCol = me.errorsFontColour;
			}
		} else {
			me.reasonLabel.deleted = true;
		}

		// adjust close/back button to fit
		if (me.displayHeight < 540) {
			me.backButton.setPosition(Menu.south, 0, -85);
		} else {
			me.backButton.setPosition(Menu.south, 0, -100);
		}

		// update the grid icon for hex/square mode
		me.updateGridIcon();

		// clear manual change flag
		me.manualChange = false;

		// clear last waypoint message
		me.lastWaypointMessage = "";

		// set saved view to current view
		me.saveCamera(me);

		// if grid is finitely bounded then show density rather than births and deaths
		if (me.finitelyBounded()) {
			me.birthsLabel.preText = "Density";
			me.birthsLabel.toolTip = "cell density";
		} else {
			me.birthsLabel.preText = "Births";
			me.birthsLabel.toolTip = "cells born this generation";
		}

		// ensure update
		me.menuManager.toggleRequired = true;
		me.menuManager.setAutoUpdate(true);

		// set the window title if in a popup
		if (me.isInPopup) {
			// set the title
			if (me.titleElement) {
				if (me.windowTitle === "") {
					me.titleElement.nodeValue = "LifeViewer";
				} else {
					me.titleElement.nodeValue = me.fitTitle(me.windowTitle);
				}
			}
		}

		// display universe if in multiverse mode
		if (DocConfig.multi) {
			name = me.patternName;
			if (name === "") {
				name = "Universe " + (me.universe + 1);
			}
			me.menuManager.notification.notify(name, 15, 120, 15, true);
			me.prevUniverseButton.deleted = false;
			me.nextUniverseButton.deleted = false;
		} else {
			me.prevUniverseButton.deleted = true;
			me.nextUniverseButton.deleted = true;

		}

		// save initial undo state
		me.afterEdit("");

		// check if complete update needed
		if (me.needsComplete) {
			completeUpdate(me);
		}

		// check if snow needed
		if ((me.engine.zoom === 8 || me.engine.zoom === 0.125) && me.numScriptCommands > 0 && (me.numScriptCommands & 3) === 0 && (me.rleList.length & 5) === 1) {
			me.drawingSnow = true;
			me.engine.initSnow();
		} else {
			me.drawingSnow = false;
		}

		// initialise pretty renderer
		me.engine.initPretty();

		// check for reverse start
		if ((me.engine.isMargolus || me.engine.isPCA) && me.engine.margolusReverseLookup1 !== null && me.reverseStart) {
			me.engine.reversePending = true;

			// update play icon
			me.setPauseIcon(me.generationOn);
		}

		// check for random pattern
		if (me.randomizePattern && me.failureReason === "") {
			if (me.randomGuard) {
				me.randomGuard = false;
			} else {
				me.randomGuard = true;
				me.randomPattern(me, true);
				me.randomGuard = false;
			}
		}

		// notify if start from is defined
		if (me.startFrom !== -1) {
			if (me.genNotifications) {
				me.menuManager.notification.notify("Going to generation " + me.startFrom, 15, 10000, 15, false);
			}
			me.menuManager.notification.clear(true, false);
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
				Controller.popupWindow = new PopupWindow(parentItem, newView);
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
				if (tokens && tokens.length >= 2 && tokens.length <= 6) {
					// set the div class name
					DocConfig.divClassName = tokens[0];

					// set the pattern source element name
					DocConfig.patternSourceName = tokens[1];

					// check for the optional tokens
					for (i = 2; i < tokens.length; i += 1) {
						switch(tokens[i]) {
						// hide viewer if no support
						case DocConfig.hideToken:
							DocConfig.hide = true;
							break;

						// viewer width is limited to pattern element width
						case DocConfig.limitToken:
							DocConfig.limitWidth = true;
							break;
						
						// viewer is in multiverse mode
						case DocConfig.multiToken:
							DocConfig.multi = true;
							break;

						// view is in fullscreen mode
						case DocConfig.fullScreenToken:
							DocConfig.fullScreen = true;
							break;

						// otherwise check if it begins with slash, dot, or is numeric
						default:
							if (tokens[i][0] === "/") {
								DocConfig.repositoryLocation = tokens[i];
							} else {
								if (tokens[i][0] === ".") {
									DocConfig.rulePostfix = tokens[i];
								} else {
									value = tokens[i];
									if (!isNaN(parseFloat(value)) && isFinite(Number(value))) {
										// set the source element maximum height
										DocConfig.patternSourceMaxHeight = parseFloat(value) | 0;
									}
								}
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
		if (textItem.value) {
			textItem.innerHTML = textItem.value;
		}

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

	// complete update process after potential async load
	function completeUpdate(view) {
		var itemHeight = 28,
			itemFontSize = 18,
			viewer = Controller.standaloneViewer(),

			// get the popup window
			popup = viewer[2];

		// scale the viewer
		view.divItem.style.transform = "scale(" + view.windowZoom + "," + view.windowZoom + ")";
		view.divItem.style.transformOrigin = "top left";
		view.resize();
		
		// mark popup as displayed
		popup.displayed = true;

		// ensure popup is within the browser window
		popup.resizeWindow(popup, null);

		// scale the elements
		if (view.viewMenu.yScale !== 1) {
			itemHeight = (itemHeight * view.viewMenu.yScale) | 0;
			itemFontSize = (itemFontSize * view.viewMenu.yScale) | 0;
			view.anchorItem.style.height = itemHeight + "px";
			view.anchorItem.style.fontSize = itemFontSize + "px";
			view.hiddenItem.style.height = itemHeight + "px";
			view.hiddenItem.style.fontSize = itemFontSize + "px";
			view.centerDivItem.style.height = itemHeight + "px";
			view.centerDivItem.style.fontSize = itemFontSize + "px";
			view.innerDivItem.style.height = itemHeight + "px";
			view.innerDivItem.style.lineHeight = itemHeight + "px";
		}

		// give focus to the popup window and then remove it (so any thumblaunch doesn't retain focus)
		view.mainContext.canvas.focus();
		view.mainContext.canvas.blur();
		//view.menuManager.hasFocus = true;

		// clear update flag
		view.needsComplete = false;

		return false;
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
			view = null,

		    // elements
		    canvasItem = null,
		    divItem = null,
		    windowTitleItem = null,
		    anchorItem = null,
		    innerDivItem = null,
		    centerDivItem = null,
			hiddenItem = null,

			// element sizes for scaling
			itemHeight = 28,
			itemFontSize = 18,

			// popup window
			popup = null;

		// check if the standalone viewer exists
		if (viewer) {
			// reset the popup
			popup = viewer[2];
			if (popup) {
				popup.reset();
			}

			// reset the view
			view = viewer[1];
			view.element = textItem;
			view.viewStart(view);
		} else {
			// create canvas and set width and height
			canvasItem = document.createElement("canvas");
			canvasItem.width = ViewConstants.minViewerWidth;
			canvasItem.height = ViewConstants.minMenuHeight + 80;
			canvasItem.style.display = "block";
			//canvasItem.style.outline = "none";
			canvasItem.contentEditable = "false";

			// add a new anchor
			anchorItem = document.createElement('a');
			anchorItem.setAttribute('href', "#");
			anchorItem.innerHTML = "&nbsp;X&nbsp;";
			anchorItem.style.textDecoration = "none";
			anchorItem.style.fontFamily = "Lucida Grande,Verdana,Helvetica,Arial,sans-serif";
			anchorItem.style.color = "#FFFFFF";
			anchorItem.style.backgroundColor = "#C75050";
			anchorItem.style.cssFloat = "right";
			anchorItem.style.height = itemHeight + "px";
			anchorItem.style.fontSize = itemFontSize + "px";

			// add a hidden anchor to center the text
			hiddenItem = document.createElement('a');
			hiddenItem.innerHTML = "&nbsp;X&nbsp;";
			hiddenItem.style.textDecoration = "none";
			hiddenItem.style.fontFamily = "Lucida Grande,Verdana,Helvetica,Arial,sans-serif";
			hiddenItem.style.visibility = "hidden";
			hiddenItem.style.cssFloat = "left";
			hiddenItem.style.height = itemHeight + "px";
			hiddenItem.style.fontSize = itemFontSize + "px";

			// create the center div with the window title text
			centerDivItem = document.createElement("div");
			centerDivItem.style.textAlign = "center";
			centerDivItem.style.color = "rgb(83,100,130)";
			centerDivItem.style.fontFamily = "Arial, Verdana, Helvetica, sans-serif";
			centerDivItem.style.fontSize = itemFontSize + "px";
			centerDivItem.style.height = itemHeight + "px";
			windowTitleItem = document.createTextNode("LifeViewer");
			centerDivItem.style.cursor = "default";
			centerDivItem.appendChild(windowTitleItem);

			// set the onclick
			registerEvent(anchorItem, "click", hideCallback, false);
			registerEvent(anchorItem, "touchend", hideCallback, false);

			// create enclosing div and set style
			divItem = document.createElement("div");
			divItem.style.display = "none";
			divItem.style.position = "fixed";
			divItem.style.border = "1px solid rgb(128,128,128)";
			divItem.style.zIndex = "101";

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
			innerDivItem.style.height = itemHeight + "px";
			innerDivItem.style.lineHeight = itemHeight + "px";
			innerDivItem.style.margin = "0px";
			innerDivItem.style.border = "0px";

			// add the title, anchor and canvas to the div
			innerDivItem.appendChild(hiddenItem);
			innerDivItem.appendChild(anchorItem);
			innerDivItem.appendChild(centerDivItem);
			divItem.appendChild(innerDivItem);
			divItem.appendChild(canvasItem);

			// add to the document
			document.body.appendChild(divItem);

			// start the viewer in a popup
			startView(cleanItem, canvasItem, ViewConstants.minViewerWidth, true, textItem);
			Controller.standaloneIndex = Controller.viewers.length - 1;
			viewer = Controller.standaloneViewer();
			view = viewer[1];

			// save the window title element
			view.titleElement = windowTitleItem;
			view.anchorItem = anchorItem;
			view.hiddenItem = hiddenItem;
			view.centerDivItem = centerDivItem;
			view.innerDivItem = innerDivItem;
			view.divItem = divItem;
		}

		// find the parent of the Viewer
		parentItem = viewer[0].parentNode;

		// check if the item is displayed
		if (parentItem.style.display !== "") {
			// display the item
			parentItem.style.display = "";
		}

		// set the standalone viewer size
		view.displayWidth = ViewConstants.minViewerWidth;
		view.displayHeight = ViewConstants.minMenuHeight + 80;
		view.resize();

		// hide any notifications immediately
		view.menuManager.notification.clear(true, true);
		view.menuManager.notification.clear(false, true);

		// update the standalone viewer with ignore thumbnail set
		view.needsComplete = true;
		view.startViewer(cleanItem, true);
		if (!view.needsComplete) {
			completeUpdate(view);
		}
	}

	// create anchor
	function createAnchor(rleItem, textItem) {
		// add the show in viewer anchor
		var anchorItem = rleItem.getElementsByTagName("a")[0],
			newAnchor = document.createElement("a"),
			nodeItem = null;

		// create new anchor
		newAnchor.setAttribute("href", "#");
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

	// complete isPattern check
	function completeIsPattern(pattern, args) {
		// unpack arguments
		var patternString = args[0],
			rleItem = args[1],
			textItem = args[2];

		if (pattern && pattern.lifeMap && !pattern.tooBig) {
			// create the anchor if specified
			if (rleItem !== null) {
				createAnchor(rleItem, textItem);
			}

			if (DocConfig.multi) {
				// add details to Controller
				Controller.patterns[Controller.patterns.length] = new PatternInfo(pattern.name, patternString, pattern.ruleName + pattern.boundedGridDef, pattern.width, pattern.height);
			}
		}
	}

	// check if a string is a valid pattern
	function isPattern(patternString, allocator, manager, rleItem, textItem) {
		var pattern = null;

		// attempt to create a pattern
		pattern = manager.create("", patternString, allocator, completeIsPattern, null, [patternString, rleItem, textItem], false, null);
		if (!manager.loadingFromRepository) {
			completeIsPattern(pattern, [patternString, rleItem, textItem]);
		}
	}

	// callback for show in viewer anchor
	function anchorCallback(event) {
		/*jshint -W040 */
		updateViewer(this);

		// stop event propagating
		if (event.stopPropagation) {
			event.stopPropagation();
		}
		event.preventDefault();

		return false;
	}

	// resize event
	function resizeWindow() {
		var view = null,
			i = 0;

		// check for fullscreen viewer
		if (DocConfig.fullScreen) {
			// find default viewer
			view = Controller.viewers[0][1];
			view.displayWidth = document.body.clientWidth & ~7;
			view.displayHeight = window.innerHeight - 128;
			if (view.displayWidth < ViewConstants.minViewerWidth) {
				view.displayWidth = ViewConstants.minViewerWidth;
			}
			if (view.displayHeight < ViewConstants.preferredMenuHeight) {
				view.displayHeight = ViewConstants.preferredMenuHeight;
			}

			// resize the zoom slider
			if (view.displayWidth > ViewConstants.minViewerWidth && !view.isInPopup) {
				i = (view.displayWidth - ViewConstants.minViewerWidth) + ViewConstants.zoomSliderDefaultWidth;
				if (i > ViewConstants.zoomSliderMaxWidth) {
					i = ViewConstants.zoomSliderMaxWidth;
				}
				view.zoomItem.setWidth(i);
			} else {
				view.zoomItem.setWidth(ViewConstants.zoomSliderDefaultWidth);
			}

			// setup drawing states list
			i = view.drawState;
			view.setupStateList();
			view.drawState = i;
			view.updateStatesList();

			// resize
			view.resize();
			view.menuManager.setAutoUpdate(true);
		}
	}

	// start all viewers in the document
	function startAllViewers() {
		// find all viewers in the document (should be enclosed in <div class="rle">)
		var a = document.getElementsByTagName("div"),
			b = 0,
			c = null,
		    textItem = null,
		    anchorItem = null,
		    canvasItem = null,
		    cleanItem = null,
		    rleItem = null,
			childItem = null,
			
		    // temporary allocator and pattern manager
			allocator = new Allocator(),
			manager = new PatternManager();

		// read settings
		readSettingsFromMeta();

		// initialise the aliases
		AliasManager.init();

		// search for rle divs
		for (b = 0; b < a.length; b += 1) {
			// get the next div
			rleItem = a[b];

			// check if it is rle class
			if (rleItem.className === DocConfig.divClassName) {
				// find the child textarea and canvas
				textItem = rleItem.getElementsByTagName(DocConfig.patternSourceName)[0];
				canvasItem = rleItem.getElementsByTagName("canvas")[0];

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
						isPattern(cleanItem, allocator, manager, null, null);
					}

					// if the canvas does not exist then create it
					//if (canvasItem === undefined) {
						//canvasItem = document.createElement("canvas");
						//canvasItem.width = ViewConstants.minViewerWidth;
						//canvasItem.height = ViewConstants.minMenuHeight + 80;
						//rleItem.appendChild(canvasItem);
					//}

					// check if the canvas exists
					if (canvasItem && canvasItem.getContext) {
						// check whether to limit the height of the text item
						if (DocConfig.patternSourceMaxHeight > -1) {
							if (textItem.clientHeight > DocConfig.patternSourceMaxHeight) {
								textItem.style.height = DocConfig.patternSourceMaxHeight + "px";
							}
						}
						
						// initalise viewer not in popup
						//canvasItem.style.outline = "none";
						canvasItem.contentEditable = "false";
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
								isPattern(cleanItem, allocator, manager, rleItem, textItem);
							}
						}
					}
				}
			}
		}

		// remove accesskey elements that conflict with LifeViewer
		c = document.getElementsByTagName("a");

		for (b = 0; b < c.length; b += 1) {
			// get the next anchor
			anchorItem = c[b];
			if (anchorItem.accessKey !== "") {
				// check if it conflicts
				if (ViewConstants.altKeys.indexOf(anchorItem.accessKey) !== -1) {
					anchorItem.accessKey = "";
				}
			}
		}
	}

	// register event to start viewers when document is loaded
	registerEvent(window, "load", startAllViewers, false);
	window.onresize = resizeWindow;

	/*jshint -W069 */
	// external interface
	window['DocConfig'] = DocConfig;
	window['Controller'] = Controller;
	window['ViewConstants'] = ViewConstants;
	window['startAllViewers'] = startAllViewers;
	window['updateViewer'] = updateViewer;
	window['updateMe'] = updateMe;
	window['hideViewer'] = hideViewer;
	window['lifeViewerBuild'] = ViewConstants.versionBuild;
}
());
